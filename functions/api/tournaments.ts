/**
 * Tournament Participations API
 *
 * GET    /api/tournaments               → list (filter: student_id)
 * POST   /api/tournaments               → create
 * PUT    /api/tournaments               → update
 * DELETE /api/tournaments?id=...        → soft-delete
 */

import { Env } from '../types/index';
import { authenticateUser } from '../middleware/auth';
import { errorResponse, jsonResponse } from '../utils/response';
import { ensureSparringSchema } from '../utils/sparringSchema';
import { fetchStudentProgression, notifyInstructorOfReadiness } from '../utils/beltProgression';

interface TournamentRow {
  id: string;
  student_id: string;
  tournament_name: string;
  tournament_date: string;
  belt_at_time: string | null;
  placement: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  student_name?: string;
}

interface CreateBody {
  student_id: string;
  tournament_name: string;
  tournament_date: string;
  belt_at_time?: string | null;
  placement?: string | null;
  notes?: string | null;
}

interface UpdateBody {
  id: string;
  tournament_name?: string;
  tournament_date?: string;
  belt_at_time?: string | null;
  placement?: string | null;
  notes?: string | null;
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, 401);
    await ensureSparringSchema(env.DB);

    const url = new URL(request.url);
    const studentId = url.searchParams.get('student_id');

    const where: string[] = ['tp.deleted_at IS NULL'];
    const binds: string[] = [];

    if (auth.user.role === 'student') {
      if (!auth.user.student_id) return jsonResponse({ tournaments: [] });
      where.push('tp.student_id = ?');
      binds.push(auth.user.student_id);
    } else if (auth.user.role === 'instructor') {
      where.push('(s.instructor_id = ? OR tp.created_by = ?)');
      binds.push(auth.user.id, auth.user.id);
    }

    if (studentId) { where.push('tp.student_id = ?'); binds.push(studentId); }

    const sql = `
      SELECT tp.*, s.name AS student_name
        FROM tournament_participations tp
        LEFT JOIN students s ON s.id = tp.student_id
       WHERE ${where.join(' AND ')}
       ORDER BY tp.tournament_date DESC
       LIMIT 200
    `;
    const result = await env.DB.prepare(sql).bind(...binds).all<TournamentRow>();
    return jsonResponse({ tournaments: result.results ?? [] });
  } catch (error) {
    console.error('[Tournaments GET]', error);
    return errorResponse((error as Error).message, 500);
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, 401);
    if (auth.user.role === 'student') return errorResponse('Only instructors can record tournaments', 403);
    await ensureSparringSchema(env.DB);

    const body = await request.json() as CreateBody;
    if (!body.student_id || !body.tournament_name || !body.tournament_date) {
      return errorResponse('student_id, tournament_name and tournament_date are required', 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO tournament_participations (
        id, student_id, tournament_name, tournament_date, belt_at_time,
        placement, notes, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      body.student_id,
      body.tournament_name,
      body.tournament_date,
      body.belt_at_time ?? null,
      body.placement ?? null,
      body.notes ?? null,
      auth.user.id,
      now,
      now,
    ).run();

    const result = await fetchStudentProgression(env.DB, body.student_id);
    if (result?.evaluation.readyForExam && result.evaluation.nextBelt) {
      await notifyInstructorOfReadiness({
        db: env.DB,
        studentId: result.student.id,
        studentName: result.student.name,
        currentBelt: result.student.belt,
        nextBelt: result.evaluation.nextBelt,
        instructorId: result.student.instructor_id,
      });
    }

    return jsonResponse({ id, success: true }, 201);
  } catch (error) {
    console.error('[Tournaments POST]', error);
    return errorResponse((error as Error).message, 500);
  }
}

export async function onRequestPut({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, 401);
    if (auth.user.role === 'student') return errorResponse('Only instructors can edit tournaments', 403);
    await ensureSparringSchema(env.DB);

    const body = await request.json() as UpdateBody;
    if (!body.id) return errorResponse('id is required', 400);

    const updates: string[] = [];
    const binds: Array<string | null> = [];

    if (body.tournament_name !== undefined) { updates.push('tournament_name = ?'); binds.push(body.tournament_name); }
    if (body.tournament_date !== undefined) { updates.push('tournament_date = ?'); binds.push(body.tournament_date); }
    if (body.belt_at_time !== undefined)    { updates.push('belt_at_time = ?');    binds.push(body.belt_at_time); }
    if (body.placement !== undefined)       { updates.push('placement = ?');       binds.push(body.placement); }
    if (body.notes !== undefined)           { updates.push('notes = ?');           binds.push(body.notes); }

    if (updates.length === 0) return errorResponse('No fields to update', 400);
    updates.push('updated_at = ?');
    binds.push(new Date().toISOString());
    binds.push(body.id);

    await env.DB.prepare(
      `UPDATE tournament_participations SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`
    ).bind(...binds).run();

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('[Tournaments PUT]', error);
    return errorResponse((error as Error).message, 500);
  }
}

export async function onRequestDelete({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, 401);
    if (auth.user.role === 'student') return errorResponse('Only instructors can delete tournaments', 403);
    await ensureSparringSchema(env.DB);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return errorResponse('id query param is required', 400);

    const now = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE tournament_participations SET deleted_at = ?, updated_at = ? WHERE id = ?`
    ).bind(now, now, id).run();

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('[Tournaments DELETE]', error);
    return errorResponse((error as Error).message, 500);
  }
}
