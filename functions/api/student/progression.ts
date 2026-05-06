/**
 * GET /api/student/progression
 *
 * Returns the authenticated student's belt progression evaluation, including
 * attended classes, sparring sessions and tournament participations vs the
 * tier requirements.
 */

import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';
import { errorResponse, jsonResponse } from '../../utils/response';
import { ensureSparringSchema } from '../../utils/sparringSchema';
import { fetchStudentProgression } from '../../utils/beltProgression';

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, 401);
    if (auth.user.role !== 'student') return errorResponse('This endpoint is for students only', 403);
    if (!auth.user.student_id) return errorResponse('No student profile linked to this account', 404);

    await ensureSparringSchema(env.DB);

    const result = await fetchStudentProgression(env.DB, auth.user.student_id);
    if (!result) return errorResponse('Student profile not found', 404);

    return jsonResponse({
      student: {
        id: result.student.id,
        name: result.student.name,
        belt: result.student.belt,
        discipline: result.student.discipline,
      },
      progression: result.evaluation,
    });
  } catch (error) {
    console.error('[Student Progression GET]', error);
    return errorResponse((error as Error).message, 500);
  }
}
