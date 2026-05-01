import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';
import { logAuditAction, getClientIP } from '../../utils/db';

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
}

export async function onRequestGet({ request, env, params }: { request: Request; env: Env; params: { id: string } }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return new Response(JSON.stringify({ error: auth.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const id = params.id;
    const { results } = await env.DB.prepare(
      auth.user.role === 'admin'
        ? 'SELECT * FROM classes WHERE id = ? AND deleted_at IS NULL'
        : 'SELECT * FROM classes WHERE id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL'
    ).bind(...(auth.user.role === 'admin' ? [id] : [id, auth.user.id, auth.user.id])).all<ClassRecord>();
    if (!results || results.length === 0) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    return new Response(JSON.stringify(results[0]), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestPut({ request, env, params }: { request: Request; env: Env; params: { id: string } }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return new Response(JSON.stringify({ error: auth.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const id = params.id;
    const body = await request.json();
    const url = new URL(request.url);
    const applyTo = (body.applyTo as string) || url.searchParams.get('applyTo') || 'single';

    const sets: string[] = [];
    const values: Array<string | number | null> = [];
    if (body.name) { sets.push('name = ?'); values.push(body.name); }
    if (body.discipline) { sets.push('discipline = ?'); values.push(body.discipline); }
    if (body.date) { sets.push('date = ?'); values.push(body.date); }
    if (body.time) { sets.push('time = ?'); values.push(body.time); }
    if (body.location) { sets.push('location = ?'); values.push(body.location); }
    if (body.instructor) { sets.push('instructor = ?'); values.push(body.instructor); }
    if (body.instructorId) { sets.push('instructor_id = ?'); values.push(body.instructorId); }
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
      ? `UPDATE classes SET ${sets.join(', ')} WHERE id = ? AND deleted_at IS NULL`
      : `UPDATE classes SET ${sets.join(', ')} WHERE id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL`;
    const singleUpdateValues = auth.user.role === 'admin'
      ? [...updateValues, id]
      : [...updateValues, id, auth.user.id, auth.user.id];

    if (applyTo === 'all') {
      const { results: parentRes } = await env.DB.prepare(
        auth.user.role === 'admin'
          ? 'SELECT id, parent_course_id, is_recurring FROM classes WHERE id = ? AND deleted_at IS NULL'
          : 'SELECT id, parent_course_id, is_recurring FROM classes WHERE id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL'
      ).bind(...(auth.user.role === 'admin' ? [id] : [id, auth.user.id, auth.user.id])).all<{ id: string; parent_course_id?: string | null; is_recurring: number }>();
      const parentRow = parentRes?.[0];
      const parentId = parentRow?.parent_course_id || (parentRow?.is_recurring === 1 ? parentRow.id : undefined);
      if (parentId) {
        const updateSql = auth.user.role === 'admin'
          ? `UPDATE classes SET ${sets.join(', ')} WHERE (parent_course_id = ? OR id = ?) AND deleted_at IS NULL`
          : `UPDATE classes SET ${sets.join(', ')} WHERE (parent_course_id = ? OR id = ?) AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL`;
        const recurringUpdateValues = auth.user.role === 'admin'
          ? [...updateValues, parentId, parentId]
          : [...updateValues, parentId, parentId, auth.user.id, auth.user.id];
        await env.DB.prepare(updateSql).bind(...recurringUpdateValues).run();
        const { results } = auth.user.role === 'admin'
          ? await env.DB.prepare('SELECT * FROM classes WHERE (parent_course_id = ? OR id = ?) AND deleted_at IS NULL ORDER BY date, time').bind(parentId, parentId).all<ClassRecord>()
          : await env.DB.prepare('SELECT * FROM classes WHERE (parent_course_id = ? OR id = ?) AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL ORDER BY date, time').bind(parentId, parentId, auth.user.id, auth.user.id).all<ClassRecord>();
        return new Response(JSON.stringify(results || []), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    await env.DB.prepare(sql).bind(...singleUpdateValues).run();

    // Non-blocking audit log
    logAuditAction(env.DB, {
      id: crypto.randomUUID(),
      user_id: auth.user.id,
      action: 'update',
      entity_type: 'class',
      entity_id: id,
      ip_address: getClientIP(request),
    }).catch(() => {});

    const { results } = await env.DB.prepare('SELECT * FROM classes WHERE id = ?').bind(id).all<ClassRecord>();
    return new Response(JSON.stringify(results?.[0] || {}), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestDelete({ request, env, params }: { request: Request; env: Env; params: { id: string } }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return new Response(JSON.stringify({ error: auth.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const id = params.id;
    const url = new URL(request.url);
    const applyTo = url.searchParams.get('applyTo') || 'single';
    const now = new Date().toISOString();

    if (applyTo === 'all') {
      // fetch parent_course_id for this class
      const { results: parentRes } = await env.DB.prepare(
        auth.user.role === 'admin'
          ? 'SELECT id, parent_course_id, is_recurring FROM classes WHERE id = ? AND deleted_at IS NULL'
          : 'SELECT id, parent_course_id, is_recurring FROM classes WHERE id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL'
      ).bind(...(auth.user.role === 'admin' ? [id] : [id, auth.user.id, auth.user.id])).all<{ id: string; parent_course_id?: string | null; is_recurring: number }>();
      const parentRow = parentRes?.[0];
      const parentId = parentRow?.parent_course_id || (parentRow?.is_recurring === 1 ? parentRow.id : undefined);
      if (parentId) {
        await env.DB.prepare(
          auth.user.role === 'admin'
            ? 'UPDATE classes SET deleted_at = ?, updated_at = ?, updated_by = ? WHERE (parent_course_id = ? OR id = ?) AND deleted_at IS NULL'
            : 'UPDATE classes SET deleted_at = ?, updated_at = ?, updated_by = ? WHERE (parent_course_id = ? OR id = ?) AND (created_by = ? OR instructor_id = ?)'
        ).bind(...(auth.user.role === 'admin' ? [now, now, auth.user.id, parentId, parentId] : [now, now, auth.user.id, parentId, parentId, auth.user.id, auth.user.id])).run();
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Fallback: delete single class
    await env.DB.prepare(
      auth.user.role === 'admin'
        ? 'UPDATE classes SET deleted_at = ?, updated_at = ?, updated_by = ? WHERE id = ? AND deleted_at IS NULL'
        : 'UPDATE classes SET deleted_at = ?, updated_at = ?, updated_by = ? WHERE id = ? AND (created_by = ? OR instructor_id = ?)'
    ).bind(...(auth.user.role === 'admin' ? [now, now, auth.user.id, id] : [now, now, auth.user.id, id, auth.user.id, auth.user.id])).run();

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
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
