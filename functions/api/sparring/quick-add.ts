/**
 * Quick-add endpoint optimised for the Sparring Tracker mobile UX.
 *
 * POST /api/sparring/quick-add
 *   body: { student_id, increment?: number, class_id?: string|null }
 *
 * Creates a new `sparring_sessions` row with the given increment (default 1)
 * and returns the updated total for the student in a single round-trip.
 */

import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';
import { errorResponse, jsonResponse } from '../../utils/response';
import { ensureSparringSchema } from '../../utils/sparringSchema';
import { fetchStudentProgression, notifyInstructorOfReadiness } from '../../utils/beltProgression';

interface QuickAddBody {
  student_id: string;
  increment?: number;
  class_id?: string | null;
  intensity?: string | null;
  notes?: string | null;
}

interface TotalRow { value: number }

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, 401);
    if (auth.user.role === 'student') return errorResponse('Only instructors can record sparring', 403);
    await ensureSparringSchema(env.DB);

    const body = await request.json() as QuickAddBody;
    if (!body.student_id) return errorResponse('student_id is required', 400);

    const increment = Math.max(1, Math.floor(body.increment ?? 1));
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const id = crypto.randomUUID();

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
      increment,
      today,
      body.intensity ?? null,
      null,
      body.notes ?? null,
      auth.user.id,
      now,
      now,
    ).run();

    const total = await env.DB.prepare(
      'SELECT COALESCE(SUM(sessions_count), 0) AS value FROM sparring_sessions WHERE student_id = ? AND deleted_at IS NULL'
    ).bind(body.student_id).first<TotalRow>();

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

    return jsonResponse({
      success: true,
      sparring_total: total?.value ?? 0,
      progression: result?.evaluation ?? null,
    });
  } catch (error) {
    console.error('[Sparring QuickAdd]', error);
    return errorResponse((error as Error).message, 500);
  }
}
