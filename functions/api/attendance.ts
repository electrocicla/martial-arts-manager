import { Env } from '../types/index';
import { authenticateUser } from '../middleware/auth';

interface AttendanceRecord {
  id: string;
  class_id: string;
  student_id: string;
  attended: number;
  check_in_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export async function onRequestGet({ env, request }: { env: Env; request: Request }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');

    // If classId is provided, verify ownership and return attendance for that class
    if (classId) {
      const classCheck = await env.DB.prepare(
        "SELECT id FROM classes WHERE id = ? AND created_by = ? AND deleted_at IS NULL"
      ).bind(classId, auth.user.id).first();

      if (!classCheck) {
        return new Response(JSON.stringify({ error: 'Class not found or access denied' }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const { results } = await env.DB.prepare("SELECT * FROM attendance WHERE class_id = ? ORDER BY created_at DESC").bind(classId).all<AttendanceRecord>();
      return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // No classId: return all attendance records that belong to classes owned by this user
    // Join with classes to ensure we only return records for this user's classes
    const { results } = await env.DB.prepare(`
      SELECT a.*
      FROM attendance a
      INNER JOIN classes c ON a.class_id = c.id
      WHERE c.created_by = ?
      ORDER BY a.created_at DESC
    `).bind(auth.user.id).all<AttendanceRecord>();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as Record<string, unknown>;

    const now = new Date().toISOString();

    // Accept either camelCase or snake_case keys
    const classId = (body['classId'] ?? body['class_id']) as string | undefined;
    const studentId = (body['studentId'] ?? body['student_id']) as string | undefined;
    const attendedRaw = body['attended'] ?? body['attended'];
    const notes = (body['notes'] as string) || null;

    if (!classId || !studentId) {
      return new Response(JSON.stringify({ error: 'classId and studentId are required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Normalize attended value
    const attended = ((): boolean => {
      if (typeof attendedRaw === 'boolean') return attendedRaw;
      if (typeof attendedRaw === 'number') return attendedRaw === 1;
      if (typeof attendedRaw === 'string') return attendedRaw === '1' || attendedRaw.toLowerCase() === 'true';
      return false;
    })();

    // Verify that both class and student belong to this user
    const classCheck = await env.DB.prepare(
      "SELECT id FROM classes WHERE id = ? AND created_by = ? AND deleted_at IS NULL"
    ).bind(classId, auth.user.id).first();

    const studentCheck = await env.DB.prepare(
      "SELECT id FROM students WHERE id = ? AND created_by = ? AND deleted_at IS NULL"
    ).bind(studentId, auth.user.id).first();

    if (!classCheck || !studentCheck) {
      return new Response(JSON.stringify({ error: 'Class or student not found or access denied' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await env.DB.prepare(`
      INSERT OR REPLACE INTO attendance (
        id, class_id, student_id, attended, check_in_time, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      `${classId}-${studentId}`, classId, studentId, attended ? 1 : 0,
      attended ? now : null, notes, now, now
    ).run();

    return new Response(JSON.stringify({ success: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}