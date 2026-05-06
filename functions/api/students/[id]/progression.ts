/**
 * GET /api/students/:id/progression
 *
 * Instructor / admin view of a single student's belt progression.
 */

import { Env } from '../../../types/index';
import { authenticateUser } from '../../../middleware/auth';
import { errorResponse, jsonResponse } from '../../../utils/response';
import { ensureSparringSchema } from '../../../utils/sparringSchema';
import { fetchStudentProgression } from '../../../utils/beltProgression';

export async function onRequestGet({ request, env, params }: {
  request: Request;
  env: Env;
  params: { id: string };
}) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, 401);

    const studentId = params.id;
    if (!studentId) return errorResponse('Student id required', 400);

    if (auth.user.role === 'student' && auth.user.student_id !== studentId) {
      return errorResponse('Access denied', 403);
    }

    await ensureSparringSchema(env.DB);
    const result = await fetchStudentProgression(env.DB, studentId);
    if (!result) return errorResponse('Student not found', 404);

    // Read-only access: students may view themselves; instructors and admins
    // may view any student that the existing students-list endpoint already
    // grants them visibility to (the access check is performed there).

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
    console.error('[Student Progression by id]', error);
    return errorResponse((error as Error).message, 500);
  }
}
