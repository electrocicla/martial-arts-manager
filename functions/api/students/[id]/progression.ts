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
import {
  branchErrorResponse,
  resolveRequestBranchId,
} from '../../../utils/branches';

export async function onRequestGet({ request, env, params }: {
  request: Request;
  env: Env;
  params: { id: string };
}) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, auth.status ?? 401);

    const studentId = params.id;
    if (!studentId) return errorResponse('Student id required', 400);

    if (auth.user.role === 'student' && auth.user.student_id !== studentId) {
      return errorResponse('Access denied', 403);
    }

    const branchId = await resolveRequestBranchId(request, env, auth.user);
    let accessQuery =
      'SELECT id FROM students WHERE id = ? AND branch_id = ? AND organization_id = ? AND deleted_at IS NULL';
    const accessValues: string[] = [studentId, branchId, auth.user.organization_id];

    if (auth.user.role !== 'admin' && auth.user.role !== 'student') {
      accessQuery += ' AND (created_by = ? OR instructor_id = ? OR instructor_id IS NULL)';
      accessValues.push(auth.user.id, auth.user.id);
    }

    const accessibleStudent = await env.DB.prepare(accessQuery)
      .bind(...accessValues)
      .first<{ id: string }>();

    if (!accessibleStudent) return errorResponse('Student not found', 404);

    await ensureSparringSchema(env.DB);
    const result = await fetchStudentProgression(
      env.DB,
      studentId,
      auth.user.organization_id,
    );
    if (!result) return errorResponse('Student not found', 404);

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
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;

    console.error('[Student Progression by id]', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to load progression', 500);
  }
}
