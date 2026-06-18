import type { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';
import { resolveRequestBranchId, branchErrorResponse } from '../../utils/branches';

interface TransferBody {
  targetBranchId?: string;
  studentIds?: string[];
  classIds?: string[];
  disciplines?: string[];
  reason?: string;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const MAX_TRANSFER_STUDENTS = 500;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function placeholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(',');
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return jsonResponse({ error: auth.error }, 401);
    if (auth.user.role !== 'admin') return jsonResponse({ error: 'Admins only' }, 403);

    const sourceBranchId = await resolveRequestBranchId(request, env, auth.user);
    const body = await request.json() as TransferBody;
    const targetBranchId = body.targetBranchId?.trim();
    if (!targetBranchId) return jsonResponse({ error: 'targetBranchId is required' }, 400);
    if (targetBranchId === sourceBranchId) {
      return jsonResponse({ error: 'Source and target branches must be different' }, 400);
    }

    const target = await env.DB.prepare(
      'SELECT id FROM branches WHERE id = ? AND is_active = 1',
    ).bind(targetBranchId).first<{ id: string }>();
    if (!target) return jsonResponse({ error: 'Target branch not found or inactive' }, 404);

    const selected = new Set((body.studentIds ?? []).filter(Boolean));
    const classIds = Array.from(new Set((body.classIds ?? []).filter(Boolean)));
    const disciplines = Array.from(new Set((body.disciplines ?? []).filter(Boolean)));

    if (classIds.length > 0) {
      const classPlaceholders = placeholders(classIds.length);
      const { results } = await env.DB.prepare(`
        SELECT DISTINCT ce.student_id
        FROM classes c
        INNER JOIN class_enrollments ce
          ON ce.class_id = c.id
          OR (c.parent_course_id IS NOT NULL AND ce.class_id = c.parent_course_id)
        INNER JOIN students s ON s.id = ce.student_id
        WHERE c.id IN (${classPlaceholders})
          AND c.branch_id = ?
          AND s.branch_id = ?
          AND s.deleted_at IS NULL
      `).bind(...classIds, sourceBranchId, sourceBranchId).all<{ student_id: string }>();
      for (const row of results ?? []) selected.add(row.student_id);
    }

    if (disciplines.length > 0) {
      const disciplinePlaceholders = placeholders(disciplines.length);
      const { results } = await env.DB.prepare(`
        SELECT id
        FROM students
        WHERE branch_id = ?
          AND deleted_at IS NULL
          AND discipline IN (${disciplinePlaceholders})
      `).bind(sourceBranchId, ...disciplines).all<{ id: string }>();
      for (const row of results ?? []) selected.add(row.id);
    }

    const candidateIds = Array.from(selected).slice(0, MAX_TRANSFER_STUDENTS);
    if (candidateIds.length === 0) {
      return jsonResponse({ error: 'Select at least one student, class, or discipline' }, 400);
    }

    const validIds: string[] = [];
    for (let index = 0; index < candidateIds.length; index += 50) {
      const chunk = candidateIds.slice(index, index + 50);
      const { results } = await env.DB.prepare(`
        SELECT id
        FROM students
        WHERE id IN (${placeholders(chunk.length)})
          AND branch_id = ?
          AND deleted_at IS NULL
      `).bind(...chunk, sourceBranchId).all<{ id: string }>();
      validIds.push(...(results ?? []).map((row) => row.id));
    }

    if (validIds.length === 0) {
      return jsonResponse({ error: 'No selected students belong to the current branch' }, 409);
    }

    const now = new Date().toISOString();
    const reason = body.reason?.trim().slice(0, 500) || null;

    for (let index = 0; index < validIds.length; index += 50) {
      const chunk = validIds.slice(index, index + 50);
      const ids = placeholders(chunk.length);
      const assignmentStatements = chunk.map((studentId) => env.DB.prepare(`
        INSERT INTO student_branch_assignments (
          id, student_id, branch_id, source_branch_id, started_at,
          reason, assigned_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        studentId,
        targetBranchId,
        sourceBranchId,
        now,
        reason,
        auth.user.id,
        now,
      ));

      await env.DB.batch([
        env.DB.prepare(`
          UPDATE student_branch_assignments
          SET ended_at = ?
          WHERE student_id IN (${ids}) AND ended_at IS NULL
        `).bind(now, ...chunk),
        env.DB.prepare(`
          UPDATE class_enrollments
          SET enrollment_status = 'dropped', updated_at = ?
          WHERE student_id IN (${ids})
            AND enrollment_status = 'active'
            AND class_id IN (
              SELECT id FROM classes WHERE branch_id = ?
            )
        `).bind(now, ...chunk, sourceBranchId),
        env.DB.prepare(`
          UPDATE students
          SET branch_id = ?, updated_by = ?, updated_at = ?
          WHERE id IN (${ids}) AND branch_id = ?
        `).bind(targetBranchId, auth.user.id, now, ...chunk, sourceBranchId),
        ...assignmentStatements,
      ]);
    }

    return jsonResponse({
      success: true,
      transferred: validIds.length,
      sourceBranchId,
      targetBranchId,
      startedAt: now,
    });
  } catch (error) {
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;
    console.error('[Branch Transfer]', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Transfer failed' }, 500);
  }
}
