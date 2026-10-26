import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';
import { logAuditAction, getClientIP } from '../../utils/db';
import { currentUtcDateKey } from '../../utils/weeklyRecurrence';
import { isValidDateKey, updateWeeklySeries, WeeklySeriesError, type WeeklySeriesChanges } from '../../utils/weeklySeriesManagement';
import {
  branchErrorResponse,
  resolveRequestBranchId,
} from '../../utils/branches';

interface ClassRecord {
  id: string;
  name: string;
  discipline: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  instructor_id?: string;
  max_students: number;
  enrolled_count?: number;
  description?: string;
  is_recurring: number;
  recurrence_pattern?: string;
  is_active: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  branch_id: string;
}

async function canAccessClass(
  env: Env,
  classId: string,
  branchId: string,
  user: { id: string; role: string },
): Promise<boolean> {
  const query = user.role === 'admin'
    ? 'SELECT id FROM classes WHERE id = ? AND branch_id = ? AND deleted_at IS NULL'
    : `SELECT id FROM classes
       WHERE id = ? AND branch_id = ? AND deleted_at IS NULL
         AND (created_by = ? OR instructor_id = ?)`;
  const row = await env.DB.prepare(query)
    .bind(...(user.role === 'admin'
      ? [classId, branchId]
      : [classId, branchId, user.id, user.id]))
    .first<{ id: string }>();
  return Boolean(row);
}

export async function onRequestGet({ request, env, params }: { request: Request; env: Env; params: { id: string } }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return new Response(JSON.stringify({ error: auth.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const id = params.id;
    const branchId = await resolveRequestBranchId(request, env, auth.user);
    const { results } = await env.DB.prepare(
      auth.user.role === 'admin'
        ? 'SELECT * FROM classes WHERE id = ? AND branch_id = ? AND deleted_at IS NULL'
        : 'SELECT * FROM classes WHERE id = ? AND branch_id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL'
    ).bind(...(auth.user.role === 'admin' ? [id, branchId] : [id, branchId, auth.user.id, auth.user.id])).all<ClassRecord>();
    if (!results || results.length === 0) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    return new Response(JSON.stringify(results[0]), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestPut({ request, env, params }: { request: Request; env: Env; params: { id: string } }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return new Response(JSON.stringify({ error: auth.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    if (auth.user.role === 'student') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    const id = params.id;
    const branchId = await resolveRequestBranchId(request, env, auth.user);
    if (!await canAccessClass(env, id, branchId, auth.user)) {
      return new Response(JSON.stringify({ error: 'Class not found or access denied' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const body = await request.json();
    const url = new URL(request.url);
    const applyTo = (body.applyTo as string) || url.searchParams.get('applyTo') || 'single';
    if (applyTo === 'all') {
      const target = await env.DB.prepare(
        'SELECT id, parent_course_id, is_recurring FROM classes WHERE id = ? AND branch_id = ? AND deleted_at IS NULL'
      ).bind(id, branchId).first<{ id: string; parent_course_id: string | null; is_recurring: number }>();
      if (target?.is_recurring === 1 && !target.parent_course_id) {
        try {
          await updateWeeklySeries(env.DB, branchId, id, auth.user.id, body as WeeklySeriesChanges);
          const updated = await env.DB.prepare('SELECT * FROM classes WHERE id = ? AND branch_id = ?').bind(id, branchId).first<ClassRecord>();
          return new Response(JSON.stringify(updated), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (error) {
          if (error instanceof WeeklySeriesError) return new Response(JSON.stringify({ error: error.message }), {
            status: error.status, headers: { 'Content-Type': 'application/json' },
          });
          throw error;
        }
      }
      if (body.date !== undefined || body.recurrencePattern !== undefined) {
        return new Response(JSON.stringify({ error: 'Edit the weekly template to change the dates of a recurring series.' }), { status: 409 });
      }
    }


    const sets: string[] = [];
    const values: Array<string | number | null> = [];
    if (body.name) { sets.push('name = ?'); values.push(body.name); }
    if (body.discipline) { sets.push('discipline = ?'); values.push(body.discipline); }
    if (body.date) { sets.push('date = ?'); values.push(body.date); }
    if (body.time) { sets.push('time = ?'); values.push(body.time); }
    if (body.location) { sets.push('location = ?'); values.push(body.location); }
    if (body.instructor) { sets.push('instructor = ?'); values.push(body.instructor); }
    if (body.instructorId) {
      if (typeof body.instructorId !== 'string') return new Response(JSON.stringify({ error: 'Invalid instructorId' }), { status: 400 });
      const membership = await env.DB.prepare(
        "SELECT 1 AS allowed FROM organization_memberships WHERE organization_id = ? AND user_id = ? AND role IN ('admin', 'instructor') AND status = 'active' AND is_active = 1"
      ).bind(auth.user.organization_id, body.instructorId).first<{ allowed: number }>();
      if (!membership) return new Response(JSON.stringify({ error: 'Instructor not found in this organization' }), { status: 400 });
      sets.push('instructor_id = ?'); values.push(body.instructorId);
    }
    if (typeof body.maxStudents === 'number') { sets.push('max_students = ?'); values.push(body.maxStudents); }
    if (typeof body.description === 'string') { sets.push('description = ?'); values.push(body.description); }
    if (typeof body.isRecurring === 'boolean') { sets.push('is_recurring = ?'); values.push(body.isRecurring ? 1 : 0); }
    if (body.recurrencePattern) { sets.push('recurrence_pattern = ?'); values.push(JSON.stringify(body.recurrencePattern)); }
    if (typeof body.isActive === 'boolean') { sets.push('is_active = ?'); values.push(body.isActive ? 1 : 0); }

    if (sets.length === 0) return new Response(JSON.stringify({ error: 'Nothing to update' }), { status: 400 });

    sets.push('updated_at = ?'); values.push(new Date().toISOString());
    sets.push('updated_by = ?'); values.push(auth.user.id);
    const updateValues = [...values];

    const sql = auth.user.role === 'admin'
      ? `UPDATE classes SET ${sets.join(', ')} WHERE id = ? AND branch_id = ? AND deleted_at IS NULL`
      : `UPDATE classes SET ${sets.join(', ')} WHERE id = ? AND branch_id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL`;
    const singleUpdateValues = auth.user.role === 'admin'
      ? [...updateValues, id, branchId]
      : [...updateValues, id, branchId, auth.user.id, auth.user.id];

    if (applyTo === 'all') {
      const { results: parentRes } = await env.DB.prepare(
        auth.user.role === 'admin'
          ? 'SELECT id, parent_course_id, is_recurring FROM classes WHERE id = ? AND branch_id = ? AND deleted_at IS NULL'
          : 'SELECT id, parent_course_id, is_recurring FROM classes WHERE id = ? AND branch_id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL'
      ).bind(...(auth.user.role === 'admin' ? [id, branchId] : [id, branchId, auth.user.id, auth.user.id])).all<{ id: string; parent_course_id?: string | null; is_recurring: number }>();
      const parentRow = parentRes?.[0];
      const parentId = parentRow?.parent_course_id || (parentRow?.is_recurring === 1 ? parentRow.id : undefined);
      if (parentId) {
        const updateSql = auth.user.role === 'admin'
          ? `UPDATE classes SET ${sets.join(', ')} WHERE (parent_course_id = ? OR id = ?) AND branch_id = ? AND deleted_at IS NULL`
          : `UPDATE classes SET ${sets.join(', ')} WHERE (parent_course_id = ? OR id = ?) AND branch_id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL`;
        const recurringUpdateValues = auth.user.role === 'admin'
          ? [...updateValues, parentId, parentId, branchId]
          : [...updateValues, parentId, parentId, branchId, auth.user.id, auth.user.id];
        await env.DB.prepare(updateSql).bind(...recurringUpdateValues).run();
        const { results } = auth.user.role === 'admin'
          ? await env.DB.prepare('SELECT * FROM classes WHERE (parent_course_id = ? OR id = ?) AND branch_id = ? AND deleted_at IS NULL ORDER BY date, time').bind(parentId, parentId, branchId).all<ClassRecord>()
          : await env.DB.prepare('SELECT * FROM classes WHERE (parent_course_id = ? OR id = ?) AND branch_id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL ORDER BY date, time').bind(parentId, parentId, branchId, auth.user.id, auth.user.id).all<ClassRecord>();
        return new Response(JSON.stringify(results || []), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Move one occurrence without recreating its original date on the next calendar read.
    const original = await env.DB.prepare(
      'SELECT date, time, parent_course_id FROM classes WHERE id = ? AND branch_id = ? AND deleted_at IS NULL'
    ).bind(id, branchId).first<{ date: string; time: string; parent_course_id: string | null }>();
    if (original?.parent_course_id && body.date !== undefined && body.date !== original.date) {
      if (typeof body.date !== 'string' || !isValidDateKey(body.date)) {
        return new Response(JSON.stringify({ error: 'Invalid new date' }), { status: 400 });
      }
      if (original.date < currentUtcDateKey()) {
        return new Response(JSON.stringify({ error: 'Historical sessions cannot be rescheduled.' }), { status: 409 });
      }
      const exists = await env.DB.prepare(
        'SELECT id FROM classes WHERE parent_course_id = ? AND branch_id = ? AND date = ? LIMIT 1'
      ).bind(original.parent_course_id, branchId, body.date).first<{ id: string }>();
      if (exists) return new Response(JSON.stringify({ error: 'Another occurrence of this weekly series already uses that date.' }), { status: 409 });
      const now = new Date().toISOString();
      await env.DB.batch([
        env.DB.prepare(sql).bind(...singleUpdateValues),
        env.DB.prepare(`INSERT OR IGNORE INTO classes (
          id, name, discipline, date, time, location, instructor, max_students,
          description, is_recurring, recurrence_pattern, is_active, parent_course_id,
          instructor_id, created_by, created_at, updated_at, deleted_at, branch_id
        ) SELECT ?, name, discipline, ?, ?, location, instructor, max_students,
          description, 0, NULL, 0, parent_course_id,
          instructor_id, created_by, ?, ?, ?, branch_id
          FROM classes WHERE id = ? AND branch_id = ?`).bind(
          crypto.randomUUID(), original.date, original.time, now, now, now, id, branchId,
        ),
      ]);
    } else {
      await env.DB.prepare(sql).bind(...singleUpdateValues).run();
    }

    // Non-blocking audit log
    logAuditAction(env.DB, {
      id: crypto.randomUUID(),
      user_id: auth.user.id,
      action: 'update',
      entity_type: 'class',
      entity_id: id,
      ip_address: getClientIP(request),
    }).catch(() => {});

    const { results } = await env.DB.prepare('SELECT * FROM classes WHERE id = ? AND branch_id = ?').bind(id, branchId).all<ClassRecord>();
    return new Response(JSON.stringify(results?.[0] || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestDelete({ request, env, params }: { request: Request; env: Env; params: { id: string } }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return new Response(JSON.stringify({ error: auth.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    if (auth.user.role === 'student') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    const id = params.id;
    const branchId = await resolveRequestBranchId(request, env, auth.user);
    if (!await canAccessClass(env, id, branchId, auth.user)) {
      return new Response(JSON.stringify({ error: 'Class not found or access denied' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const url = new URL(request.url);
    const applyTo = url.searchParams.get('applyTo') || 'single';
    const now = new Date().toISOString();

    if (applyTo === 'all') {
      // fetch parent_course_id for this class
      const { results: parentRes } = await env.DB.prepare(
        auth.user.role === 'admin'
          ? 'SELECT id, parent_course_id, is_recurring FROM classes WHERE id = ? AND branch_id = ? AND deleted_at IS NULL'
          : 'SELECT id, parent_course_id, is_recurring FROM classes WHERE id = ? AND branch_id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL'
      ).bind(...(auth.user.role === 'admin' ? [id, branchId] : [id, branchId, auth.user.id, auth.user.id])).all<{ id: string; parent_course_id?: string | null; is_recurring: number }>();
      const parentRow = parentRes?.[0];
      const parentId = parentRow?.parent_course_id || (parentRow?.is_recurring === 1 ? parentRow.id : undefined);
      if (parentId) {
        await env.DB.prepare(
          auth.user.role === 'admin'
            ? 'UPDATE classes SET deleted_at = ?, updated_at = ?, updated_by = ? WHERE (id = ? OR (parent_course_id = ? AND date >= ?)) AND branch_id = ? AND deleted_at IS NULL'
            : 'UPDATE classes SET deleted_at = ?, updated_at = ?, updated_by = ? WHERE (id = ? OR (parent_course_id = ? AND date >= ?)) AND branch_id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL'
        ).bind(...(auth.user.role === 'admin' ? [now, now, auth.user.id, parentId, parentId, currentUtcDateKey(), branchId] : [now, now, auth.user.id, parentId, parentId, currentUtcDateKey(), branchId, auth.user.id, auth.user.id])).run();
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Fallback: delete single class
    await env.DB.prepare(
      auth.user.role === 'admin'
        ? 'UPDATE classes SET deleted_at = ?, updated_at = ?, updated_by = ? WHERE id = ? AND branch_id = ? AND deleted_at IS NULL'
        : 'UPDATE classes SET deleted_at = ?, updated_at = ?, updated_by = ? WHERE id = ? AND branch_id = ? AND (created_by = ? OR instructor_id = ?)'
    ).bind(...(auth.user.role === 'admin' ? [now, now, auth.user.id, id, branchId] : [now, now, auth.user.id, id, branchId, auth.user.id, auth.user.id])).run();

    // Non-blocking audit log
    logAuditAction(env.DB, {
      id: crypto.randomUUID(),
      user_id: auth.user.id,
      action: 'delete',
      entity_type: 'class',
      entity_id: id,
      ip_address: getClientIP(request),
    }).catch(() => {});

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
