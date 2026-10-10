/**
 * GET /api/students/progression/ready
 *
 * Returns the list of students visible to the requesting admin/instructor
 * whose belt-progression evaluator marks them as `ready-for-exam` or
 * `almost-there`. Performs a single batched DB read instead of N round trips.
 *
 * Query params:
 *   includeAlmost=false   -> only return ready-for-exam students
 *
 * Response:
 *   { students: Array<{ id, name, belt, discipline, avatar_url, progression }> }
 */

import { Env } from '../../../types/index';
import { authenticateUser } from '../../../middleware/auth';
import { errorResponse, jsonResponse } from '../../../utils/response';
import { ensureSparringSchema } from '../../../utils/sparringSchema';
import { evaluateProgression, type ProgressionEvaluation } from '../../../utils/beltProgression';
import {
  branchErrorResponse,
  resolveRequestBranchId,
} from '../../../utils/branches';

interface StudentRow {
  id: string;
  name: string;
  belt: string | null;
  discipline: string | null;
  avatar_url: string | null;
  instructor_id: string | null;
}

interface CountRow {
  student_id: string;
  value: number;
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return errorResponse(auth.error, auth.status ?? 401);
    if (auth.user.role === 'student') return errorResponse('Admin/instructor only', 403);

    const branchId = await resolveRequestBranchId(request, env, auth.user);
    await ensureSparringSchema(env.DB);

    const url = new URL(request.url);
    const includeAlmost = url.searchParams.get('includeAlmost') !== 'false';

    let studentsQuery = `
      SELECT id, name, belt, discipline, avatar_url, instructor_id
      FROM students
      WHERE deleted_at IS NULL AND branch_id = ? AND organization_id = ?
    `;
    const studentParams: string[] = [branchId, auth.user.organization_id];

    if (auth.user.role !== 'admin') {
      studentsQuery += ' AND (created_by = ? OR instructor_id = ? OR instructor_id IS NULL)';
      studentParams.push(auth.user.id, auth.user.id);
    }

    const studentsResult = await env.DB.prepare(studentsQuery)
      .bind(...studentParams)
      .all<StudentRow>();
    const students = studentsResult.results ?? [];

    if (students.length === 0) {
      return jsonResponse({ students: [] });
    }

    const ids = students.map((student) => student.id);
    const placeholders = ids.map(() => '?').join(',');

    const classesRows = (await env.DB.prepare(
      `SELECT a.student_id, COUNT(*) AS value
         FROM attendance a
         INNER JOIN classes c ON c.id = a.class_id
         INNER JOIN branches b ON b.id = c.branch_id
        WHERE a.attended = 1
          AND a.student_id IN (${placeholders})
          AND b.organization_id = ?
        GROUP BY a.student_id`,
    ).bind(...ids, auth.user.organization_id).all<CountRow>()).results ?? [];

    const sparringRows = (await env.DB.prepare(
      `SELECT student_id, COALESCE(SUM(sessions_count), 0) AS value
         FROM sparring_sessions
        WHERE deleted_at IS NULL
          AND student_id IN (${placeholders})
          AND organization_id = ?
        GROUP BY student_id`,
    ).bind(...ids, auth.user.organization_id).all<CountRow>()).results ?? [];

    const tournamentRows = (await env.DB.prepare(
      `SELECT student_id, COUNT(*) AS value
         FROM tournament_participations
        WHERE deleted_at IS NULL
          AND student_id IN (${placeholders})
          AND organization_id = ?
        GROUP BY student_id`,
    ).bind(...ids, auth.user.organization_id).all<CountRow>()).results ?? [];

    const classesMap = new Map(classesRows.map((row) => [row.student_id, Number(row.value) || 0]));
    const sparringMap = new Map(sparringRows.map((row) => [row.student_id, Number(row.value) || 0]));
    const tournamentMap = new Map(tournamentRows.map((row) => [row.student_id, Number(row.value) || 0]));

    const enriched = students.map((student) => {
      const evaluation: ProgressionEvaluation = evaluateProgression({
        currentBelt: student.belt ?? 'White',
        discipline: student.discipline ?? '',
        classesAttended: classesMap.get(student.id) ?? 0,
        sparringSessions: sparringMap.get(student.id) ?? 0,
        tournamentsAttended: tournamentMap.get(student.id) ?? 0,
      });

      return {
        id: student.id,
        name: student.name,
        belt: student.belt,
        discipline: student.discipline,
        avatar_url: student.avatar_url,
        progression: evaluation,
      };
    });

    const filtered = enriched.filter((row) => {
      if (row.progression.readyForExam) return true;
      if (includeAlmost && row.progression.status === 'almost-there') return true;
      return false;
    });

    filtered.sort((a, b) => {
      if (a.progression.readyForExam !== b.progression.readyForExam) {
        return a.progression.readyForExam ? -1 : 1;
      }
      return b.progression.percent.overall - a.progression.percent.overall;
    });

    return jsonResponse({ students: filtered });
  } catch (error) {
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;

    console.error('[Progression Ready GET]', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to load progression readiness', 500);
  }
}
