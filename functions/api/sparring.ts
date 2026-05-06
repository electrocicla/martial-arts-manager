/**
 * Sparring Sessions API
 *
 * GET    /api/sparring                  → list sessions (filters: student_id, class_id, date, dateFrom, dateTo)
 * POST   /api/sparring                  → create a new sparring session
 * PUT    /api/sparring                  → update an existing session
 * DELETE /api/sparring?id=...           → soft-delete a session
 */

import { Env } from '../types/index';
import { authenticateUser } from '../middleware/auth';
import { errorResponse, jsonResponse } from '../utils/response';
import { ensureSparringSchema } from '../utils/sparringSchema';
import { fetchStudentProgression, notifyInstructorOfReadiness } from '../utils/beltProgression';

interface SparringRow {
  id: string;
  student_id: string;
  class_id: string | null;
  instructor_id: string | null;
  sessions_count: number;
  session_date: string;
  intensity: string | null;
  partner_name: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  student_name?: string;
  class_name?: string;
}

interface CreateSparringBody {
  student_id: string;
  class_id?: string | null;
  sessions_count?: number;
  session_date?: string;
  intensity?: string | null;
  partner_name?: string | null;
  notes?: string | null;
}

interface UpdateSparringBody {
  id: string;
  sessions_count?: number;
  session_date?: string;
  intensity?: string | null;
  partner_name?: string | null;
  notes?: string | null;
}

const TODAY = (): string => new Date().toISOString().slice(0, 10);

async function maybeNotify(
  env: Env,
  studentId: string
): Promise<void> {
  const result = await fetchStudentProgression(env.DB, studentId);
  if (!result || !result.evaluation.readyForExam || !result.evaluation.nextBelt) return;
  await notifyInstructorOfReadiness({
    db: env.DB,
    studentId: result.student.id,
    studentName: result.student.name,
    currentBelt: result.student.belt,
    nextBelt: result.evaluation.nextBelt,
    instructorId: result.student.instructor_id,
  });
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, 401);
    await ensureSparringSchema(env.DB);

    const url = new URL(request.url);
    const studentId = url.searchParams.get('student_id');
    const classId = url.searchParams.get('class_id');
    const date = url.searchParams.get('date');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    const where: string[] = ['ss.deleted_at IS NULL'];
    const binds: Array<string> = [];

    // Students can only see their own sessions
    if (auth.user.role === 'student') {
      if (!auth.user.student_id) return jsonResponse({ sessions: [] });
      where.push('ss.student_id = ?');
      binds.push(auth.user.student_id);
    } else if (auth.user.role === 'instructor') {
      // Instructors see sparring tied to their students or their classes
      where.push(`(s.instructor_id = ? OR ss.instructor_id = ? OR ss.created_by = ?)`);
      binds.push(auth.user.id, auth.user.id, auth.user.id);
    }

    if (studentId) { where.push('ss.student_id = ?'); binds.push(studentId); }
    if (classId)   { where.push('ss.class_id = ?');   binds.push(classId); }
    if (date)      { where.push('ss.session_date = ?'); binds.push(date); }
    if (dateFrom)  { where.push('ss.session_date >= ?'); binds.push(dateFrom); }
    if (dateTo)    { where.push('ss.session_date <= ?'); binds.push(dateTo); }

    const sql = `
      SELECT ss.*, s.name AS student_name, c.name AS class_name
        FROM sparring_sessions ss
        LEFT JOIN students s ON s.id = ss.student_id
        LEFT JOIN classes  c ON c.id = ss.class_id
       WHERE ${where.join(' AND ')}
       ORDER BY ss.session_date DESC, ss.created_at DESC
       LIMIT 500
    `;
    const result = await env.DB.prepare(sql).bind(...binds).all<SparringRow>();
    return jsonResponse({ sessions: result.results ?? [] });
  } catch (error) {
    console.error('[Sparring GET]', error);
    return errorResponse((error as Error).message, 500);
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, 401);
    if (auth.user.role === 'student') return errorResponse('Only instructors can record sparring', 403);
    await ensureSparringSchema(env.DB);

    const body = await request.json() as CreateSparringBody;
    if (!body.student_id) return errorResponse('student_id is required', 400);

    const sessionsCount = Math.max(1, Math.floor(body.sessions_count ?? 1));
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const sessionDate = body.session_date || TODAY();

    await env.DB.prepare(`
      INSERT INTO sparring_sessions (
        id, student_id, class_id, instructor_id, sessions_count, session_date,
        intensity, partner_name, notes, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.student_id,
      body.class_id ?? null,
      auth.user.id,
      sessionsCount,
      sessionDate,
      body.intensity ?? null,
      body.partner_name ?? null,
      body.notes ?? null,
      auth.user.id,
      now,
      now,
    ).run();

    await maybeNotify(env, body.student_id);

    return jsonResponse({ id, success: true }, 201);
  } catch (error) {
    console.error('[Sparring POST]', error);
    return errorResponse((error as Error).message, 500);
  }
}

export async function onRequestPut({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, 401);
    if (auth.user.role === 'student') return errorResponse('Only instructors can edit sparring', 403);
    await ensureSparringSchema(env.DB);

    const body = await request.json() as UpdateSparringBody;
    if (!body.id) return errorResponse('id is required', 400);

    const updates: string[] = [];
    const binds: Array<string | number | null> = [];

    if (body.sessions_count !== undefined) {
      updates.push('sessions_count = ?');
      binds.push(Math.max(1, Math.floor(body.sessions_count)));
    }
    if (body.session_date !== undefined) { updates.push('session_date = ?'); binds.push(body.session_date); }
    if (body.intensity !== undefined)    { updates.push('intensity = ?');    binds.push(body.intensity); }
    if (body.partner_name !== undefined) { updates.push('partner_name = ?'); binds.push(body.partner_name); }
    if (body.notes !== undefined)        { updates.push('notes = ?');        binds.push(body.notes); }

    if (updates.length === 0) return errorResponse('No fields to update', 400);
    updates.push('updated_at = ?');
    binds.push(new Date().toISOString());
    binds.push(body.id);

    await env.DB.prepare(
      `UPDATE sparring_sessions SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`
    ).bind(...binds).run();

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('[Sparring PUT]', error);
    return errorResponse((error as Error).message, 500);
  }
}

export async function onRequestDelete({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, 401);
    if (auth.user.role === 'student') return errorResponse('Only instructors can delete sparring', 403);
    await ensureSparringSchema(env.DB);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return errorResponse('id query param is required', 400);

    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE sparring_sessions SET deleted_at = ?, updated_at = ? WHERE id = ?`
    ).bind(now, now, id).run();

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('[Sparring DELETE]', error);
    return errorResponse((error as Error).message, 500);
  }
}
