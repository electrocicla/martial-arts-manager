import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';

interface ClassRecord {
  id: string;
  name: string;
  discipline: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
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
    const { results } = await env.DB.prepare('SELECT * FROM classes WHERE id = ? AND created_by = ? AND deleted_at IS NULL').bind(id, auth.user.id).all<ClassRecord>();
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
    if (typeof body.maxStudents === 'number') { sets.push('max_students = ?'); values.push(body.maxStudents); }
    if (typeof body.description === 'string') { sets.push('description = ?'); values.push(body.description); }
    if (typeof body.isRecurring === 'boolean') { sets.push('is_recurring = ?'); values.push(body.isRecurring ? 1 : 0); }
    if (body.recurrencePattern) { sets.push('recurrence_pattern = ?'); values.push(JSON.stringify(body.recurrencePattern)); }
    if (typeof body.isActive === 'boolean') { sets.push('is_active = ?'); values.push(body.isActive ? 1 : 0); }

    if (sets.length === 0) return new Response(JSON.stringify({ error: 'Nothing to update' }), { status: 400 });

    sets.push('updated_at = ?'); values.push(new Date().toISOString());
    sets.push('updated_by = ?'); values.push(auth.user.id);

    const sql = `UPDATE classes SET ${sets.join(', ')} WHERE id = ? AND created_by = ?`;
    values.push(id, auth.user.id);

    if (applyTo === 'all') {
      const { results: parentRes } = await env.DB.prepare('SELECT parent_course_id FROM classes WHERE id = ? AND created_by = ?').bind(id, auth.user.id).all<{ parent_course_id?: string }>();
      const parentId = parentRes?.[0]?.parent_course_id;
      if (parentId) {
        const updateSql = `UPDATE classes SET ${sets.join(', ')} WHERE parent_course_id = ? AND created_by = ?`;
        const updateValues = [...values, parentId, auth.user.id];
        await env.DB.prepare(updateSql).bind(...updateValues).run();
        const { results } = await env.DB.prepare('SELECT * FROM classes WHERE parent_course_id = ? AND created_by = ? ORDER BY date, time').bind(parentId, auth.user.id).all<ClassRecord>();
        return new Response(JSON.stringify(results || []), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    await env.DB.prepare(sql).bind(...values).run();
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
      const { results: parentRes } = await env.DB.prepare('SELECT parent_course_id FROM classes WHERE id = ? AND created_by = ?').bind(id, auth.user.id).all<{ parent_course_id?: string }>();
      const parentId = parentRes?.[0]?.parent_course_id;
      if (parentId) {
        await env.DB.prepare('UPDATE classes SET deleted_at = ?, updated_at = ?, updated_by = ? WHERE parent_course_id = ? AND created_by = ?')
          .bind(now, now, auth.user.id, parentId, auth.user.id).run();
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Fallback: delete single class
    await env.DB.prepare('UPDATE classes SET deleted_at = ?, updated_at = ?, updated_by = ? WHERE id = ? AND created_by = ?')
      .bind(now, now, auth.user.id, id, auth.user.id).run();
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
