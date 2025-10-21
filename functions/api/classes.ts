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
    const { id, name, discipline, date, time, location, instructor, maxStudents, description, isRecurring, recurrencePattern } = body;

    const now = new Date().toISOString();

    // If recurrence is provided, expand weekly occurrences and insert one row per occurrence
    if (isRecurring && recurrencePattern) {
      let pattern: { frequency?: string; days?: number[]; endDate?: string } = {};
      try {
        pattern = JSON.parse(recurrencePattern);
      } catch (e) {
        // ignore parse error and treat as single instance
      }

      if (pattern.frequency === 'weekly' && Array.isArray(pattern.days) && pattern.days.length > 0) {
        // Determine range: from provided date up to endDate or default 12 weeks
        const startDate = new Date(date);
        const endDate = pattern.endDate ? new Date(pattern.endDate) : new Date(new Date(date).getTime() + 1000 * 60 * 60 * 24 * 7 * 12);

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

        // Bulk insert all occurrences
        const insertStmt = env.DB.prepare(`
          INSERT INTO classes (
            id, name, discipline, date, time, location, instructor, max_students,
            description, is_recurring, recurrence_pattern, is_active, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
        `);

        for (const occ of toInsert) {
          await insertStmt.bind(
            occ.id, name, discipline, occ.dateStr, time, location, instructor, maxStudents,
            description || null, 1, recurrencePattern, auth.user.id, now, now
          ).run();
        }

        // Return the first inserted occurrence as a representative
        const created = toInsert[0];
        const { results } = await env.DB.prepare("SELECT * FROM classes WHERE id = ?").bind(created.id).all<ClassRecord>();
        return new Response(JSON.stringify(results?.[0] || {}), { status: 201, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Fallback: single insert
    await env.DB.prepare(`
      INSERT INTO classes (
        id, name, discipline, date, time, location, instructor, max_students,
        description, is_recurring, recurrence_pattern, is_active, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `).bind(
      id, name, discipline, date, time, location, instructor, maxStudents,
      description || null, isRecurring ? 1 : 0, recurrencePattern || null, auth.user.id, now, now
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