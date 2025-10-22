import { Env } from '../types/index';
import { authenticateUser } from '../middleware/auth';

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

interface CreateClassRequest {
  id: string;
  name: string;
  discipline: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  maxStudents: number;
  description?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
  parentCourseId?: string;
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get classes with enrolled student count (only for this user)
    // Use class_enrollments to calculate enrolled_count so it reflects enroll/unenroll actions
    const { results } = await env.DB.prepare(`
      SELECT 
        c.*,
        COUNT(ce.student_id) as enrolled_count
      FROM classes c
      LEFT JOIN class_enrollments ce ON c.id = ce.class_id AND ce.enrollment_status = 'active'
      WHERE c.deleted_at IS NULL AND c.created_by = ?
      GROUP BY c.id
      ORDER BY c.date ASC, c.time ASC
    `).bind(auth.user.id).all<ClassRecord>();
    
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
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

    const body = await request.json() as CreateClassRequest;
  const { id, name, discipline, date, time, location, instructor, maxStudents, description, isRecurring, recurrencePattern, parentCourseId } = body;

    const now = new Date().toISOString();

    // If recurrence is provided, expand weekly occurrences and insert one row per occurrence
    // Use or generate a parent_course_id to group recurring occurrences and enable idempotency
    let parentId = parentCourseId || null;
    // If not provided, create a deterministic parent id from payload so retries don't create duplicates
    async function computeDeterministicId(input: string) {
      const enc = new TextEncoder();
      const data = enc.encode(input);
      const hash = await crypto.subtle.digest('SHA-256', data);
      const arr = Array.from(new Uint8Array(hash));
      return arr.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    if (!parentId && isRecurring) {
      const seed = `${auth.user.id}|${name}|${discipline}|${time}|${date}|${recurrencePattern}`;
      // prefix to avoid purely numeric ids
      parentId = 'pc_' + await computeDeterministicId(seed);
    }

    if (isRecurring && recurrencePattern) {
      let pattern: { frequency?: string; days?: number[]; endDate?: string } = {};
      try {
        pattern = JSON.parse(recurrencePattern);
      } catch {
        // ignore parse error and treat as single instance
      }

      if (pattern.frequency === 'weekly' && Array.isArray(pattern.days) && pattern.days.length > 0) {
        // Ensure there is a parent course row representing this recurring course
        if (parentId) {
          const { results: parentExisting } = await env.DB.prepare('SELECT * FROM classes WHERE id = ? AND created_by = ?').bind(parentId, auth.user.id).all<ClassRecord>();
          if (!parentExisting || parentExisting.length === 0) {
            // Insert parent course row (represents the course grouping). parent_course_id is NULL for the parent itself.
            await env.DB.prepare(`
              INSERT INTO classes (
                id, name, discipline, date, time, location, instructor, max_students,
                description, is_recurring, recurrence_pattern, is_active, parent_course_id, created_by, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL, ?, ?, ?)
            `).bind(parentId, name, discipline, date, time, location, instructor, maxStudents, description || null, 1, recurrencePattern, auth.user.id, now, now).run();
          }

          // If children already exist for this parent, return first child to indicate idempotent success
          const existing = await env.DB.prepare('SELECT * FROM classes WHERE parent_course_id = ? AND created_by = ? AND deleted_at IS NULL LIMIT 1').bind(parentId, auth.user.id).all<ClassRecord>();
          if (existing && existing.results && existing.results.length > 0) {
            return new Response(JSON.stringify(existing.results[0]), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }
        }

        // Determine range: from provided date up to endDate or default 12 weeks
        const startDate = new Date(date);
        const endDate = pattern.endDate ? new Date(pattern.endDate) : new Date(startDate.getTime() + 1000 * 60 * 60 * 24 * 7 * 12);

        const toInsert: Array<{ id: string; dateStr: string }> = [];

        // iterate from startDate to endDate by days
        const cur = new Date(startDate);
        while (cur <= endDate) {
          const dow = cur.getDay();
          if (pattern.days.includes(dow)) {
            toInsert.push({ id: crypto.randomUUID(), dateStr: cur.toISOString().split('T')[0] });
          }
          cur.setDate(cur.getDate() + 1);
        }

        // Bulk insert all child session occurrences referencing parent_course_id
        const insertStmt = env.DB.prepare(`
          INSERT INTO classes (
            id, name, discipline, date, time, location, instructor, max_students,
            description, is_recurring, recurrence_pattern, is_active, parent_course_id, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
        `);

        for (const occ of toInsert) {
          await insertStmt.bind(
            occ.id, name, discipline, occ.dateStr, time, location, instructor, maxStudents,
            description || null, 0, null, 1, parentId, auth.user.id, now, now
          ).run();
        }

        // Return the parent course as representative
        const { results } = await env.DB.prepare('SELECT * FROM classes WHERE id = ?').bind(parentId).all<ClassRecord>();
        return new Response(JSON.stringify(results?.[0] || {}), { status: 201, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Fallback: single insert (attach parent_course_id if present)
    await env.DB.prepare(`
      INSERT INTO classes (
        id, name, discipline, date, time, location, instructor, max_students,
        description, is_recurring, recurrence_pattern, is_active, parent_course_id, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `).bind(
      id, name, discipline, date, time, location, instructor, maxStudents,
      description || null, isRecurring ? 1 : 0, recurrencePattern || null, parentId, auth.user.id, now, now
    ).run();

    // Fetch and return the created class
    const { results } = await env.DB.prepare("SELECT * FROM classes WHERE id = ?").bind(id).all<ClassRecord>();
    const createdClass = results?.[0];

    if (!createdClass) {
      return new Response(JSON.stringify({ error: 'Failed to retrieve created class' }), { status: 500 });
    }

    return new Response(JSON.stringify(createdClass), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPut(context: { request: Request; env: Env, params?: Record<string,string> }) {
  const { request, env, params } = context;
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const id = params?.id;
    if (!id) return new Response(JSON.stringify({ error: 'Missing class id' }), { status: 400 });

    const body = await request.json();
    const url = new URL(request.url);
    const applyTo = (body.applyTo as string) || url.searchParams.get('applyTo') || 'single';

  // Build update set dynamically (only allow a restricted set)
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

    // Append updated metadata
    sets.push('updated_at = ?'); values.push(new Date().toISOString());
    sets.push('updated_by = ?'); values.push(auth.user.id);

    const sql = `UPDATE classes SET ${sets.join(', ')} WHERE id = ? AND created_by = ?`;
    values.push(id, auth.user.id);

    // If updating all occurrences for a recurring parent, apply update to all children
    if (applyTo === 'all') {
      // Find the parent_course_id for this class
      const { results: parentRes } = await env.DB.prepare('SELECT parent_course_id FROM classes WHERE id = ? AND created_by = ?').bind(id, auth.user.id).all<{ parent_course_id?: string }>();
      const parentId = parentRes?.[0]?.parent_course_id;
      if (parentId) {
        // Update all classes with same parent_course_id and created_by
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

export async function onRequestDelete(context: { request: Request; env: Env, params?: Record<string,string> }) {
  const { request, env, params } = context;
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const id = params?.id;
    if (!id) return new Response(JSON.stringify({ error: 'Missing class id' }), { status: 400 });

    // Soft delete: set deleted_at and updated_by
    const now = new Date().toISOString();
    await env.DB.prepare('UPDATE classes SET deleted_at = ?, updated_at = ?, updated_by = ? WHERE id = ? AND created_by = ?')
      .bind(now, now, auth.user.id, id, auth.user.id).run();

    // Check affected rows if available (D1 may provide 'success' without rowcount)
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}