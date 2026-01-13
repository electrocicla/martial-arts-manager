import { Env } from '../types/index';
import { authenticateUser } from '../middleware/auth';

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  belt: string;
  discipline: string;
  disciplines?: string; // JSON array of {discipline: string, belt: string}
  join_date: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  avatar_url?: string;
  notes?: string;
  is_active: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

function normalizeAvatarUrl(avatarUrl: unknown): string | undefined {
  if (typeof avatarUrl !== 'string' || avatarUrl.trim().length === 0) {
    return undefined;
  }
  if (avatarUrl.startsWith('/api/avatars')) {
    return avatarUrl;
  }
  if (avatarUrl.startsWith('avatars/')) {
    return `/api/avatars?key=${encodeURIComponent(avatarUrl)}`;
  }
  try {
    const parsed = new URL(avatarUrl);
    const key = parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname;
    if (key.startsWith('avatars/')) {
      return `/api/avatars?key=${encodeURIComponent(key)}`;
    }
  } catch {
    // ignore
  }
  return avatarUrl;
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

    // Get students based on role
    let query = "SELECT * FROM students WHERE deleted_at IS NULL";
    const params: string[] = [];

    // If not admin, filter by creator, instructor, or students without assigned instructor
    if (auth.user.role !== 'admin') {
      query += " AND (created_by = ? OR instructor_id = ? OR instructor_id IS NULL)";
      params.push(auth.user.id, auth.user.id);
    }

    query += " ORDER BY created_at DESC";

    const { results } = await env.DB.prepare(query).bind(...params).all<StudentRecord>();

    const normalized = (results || []).map((student) => {
      let disciplines = student.disciplines;
      try {
        if (typeof disciplines === 'string') {
          disciplines = JSON.parse(disciplines);
        }
      } catch {
        disciplines = [];
      }
      
      return {
        ...student,
        avatar_url: normalizeAvatarUrl(student.avatar_url),
        disciplines,
      };
    });

    return new Response(JSON.stringify(normalized), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
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

    const body = await request.json() as {
      id: string;
      name: string;
      email: string;
      phone?: string;
      belt: string;
      discipline: string;
      disciplines?: { discipline: string; belt: string }[]; // New array format
      joinDate: string;
      dateOfBirth?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      notes?: string;
    };

    const now = new Date().toISOString();
    const { id, name, email, phone, belt, discipline, disciplines, joinDate, dateOfBirth, emergencyContactName, emergencyContactPhone, notes } = body;

    if (!id || typeof id !== 'string') {
      return new Response(JSON.stringify({ error: 'Student id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Student name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Student email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!belt || typeof belt !== 'string' || belt.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Student belt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!discipline || typeof discipline !== 'string' || discipline.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Student discipline is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!joinDate || typeof joinDate !== 'string' || joinDate.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Join date is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle disciplines: if new array format provided, use it; otherwise convert legacy belt/discipline to array
    let disciplinesJson: string | null = null;
    if (disciplines && disciplines.length > 0) {
      disciplinesJson = JSON.stringify(disciplines);
    } else if (belt && discipline) {
      disciplinesJson = JSON.stringify([{ discipline, belt }]);
    }

    // Insert with created_by set to current user
    await env.DB.prepare(`
      INSERT INTO students (
        id, name, email, phone, belt, discipline, disciplines, join_date, date_of_birth,
        emergency_contact_name, emergency_contact_phone, notes, is_active,
        created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `).bind(
      id, name, email, phone || null, belt, discipline, disciplinesJson, joinDate,
      dateOfBirth || null, emergencyContactName || null, emergencyContactPhone || null,
      notes || null, auth.user.id, now, now
    ).run();

    const createdStudent = await env.DB.prepare('SELECT * FROM students WHERE id = ? AND deleted_at IS NULL').bind(id).first<StudentRecord>();

    if (!createdStudent) {
      return new Response(JSON.stringify({ error: 'Failed to retrieve created student' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      ...createdStudent,
      avatar_url: normalizeAvatarUrl(createdStudent.avatar_url),
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const lowered = message.toLowerCase();

    if (lowered.includes('unique constraint failed') && lowered.includes('students.email')) {
      return new Response(JSON.stringify({ error: 'A student with this email already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPut({ request, env }: { request: Request; env: Env }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as {
      id: string;
      name?: string;
      email?: string;
      phone?: string;
      belt?: string;
      discipline?: string;
      disciplines?: { discipline: string; belt: string }[]; // New array format
      joinDate?: string;
      dateOfBirth?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      notes?: string;
      is_active?: number;
      avatar_url?: string;
    };

    const { id, joinDate } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Student id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify the student belongs to the current user or is bonded to them
    let checkQuery = "SELECT id, join_date FROM students WHERE id = ? AND deleted_at IS NULL";
    const checkParams: string[] = [id];

    if (auth.user.role !== 'admin') {
      checkQuery += " AND (created_by = ? OR instructor_id = ?)";
      checkParams.push(auth.user.id, auth.user.id);
    }

    const student = await env.DB.prepare(checkQuery).bind(...checkParams).first<{ id: string; join_date: string }>();

    if (!student) {
      return new Response(JSON.stringify({ error: 'Student not found or access denied' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    const finalJoinDate = joinDate || student.join_date;

    // Build dynamic update (prevents binding undefined)
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name); }
    if (body.email !== undefined) { updates.push('email = ?'); values.push(body.email); }
    if (body.phone !== undefined) { updates.push('phone = ?'); values.push(body.phone || null); }
    if (body.belt !== undefined) { updates.push('belt = ?'); values.push(body.belt); }
    if (body.discipline !== undefined) { updates.push('discipline = ?'); values.push(body.discipline); }
    if (body.disciplines !== undefined) {
      const disciplinesJson = body.disciplines && body.disciplines.length > 0 ? JSON.stringify(body.disciplines) : null;
      updates.push('disciplines = ?');
      values.push(disciplinesJson);
    }
    if (finalJoinDate !== undefined) { updates.push('join_date = ?'); values.push(finalJoinDate); }
    if (body.dateOfBirth !== undefined) { updates.push('date_of_birth = ?'); values.push(body.dateOfBirth || null); }
    if (body.emergencyContactName !== undefined) { updates.push('emergency_contact_name = ?'); values.push(body.emergencyContactName || null); }
    if (body.emergencyContactPhone !== undefined) { updates.push('emergency_contact_phone = ?'); values.push(body.emergencyContactPhone || null); }
    if (body.notes !== undefined) { updates.push('notes = ?'); values.push(body.notes || null); }
    if (body.is_active !== undefined) { updates.push('is_active = ?'); values.push(body.is_active); }
    if (body.avatar_url !== undefined) { updates.push('avatar_url = ?'); values.push(body.avatar_url || null); }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    updates.push('updated_by = ?');
    values.push(auth.user.id);
    updates.push('updated_at = ?');
    values.push(now);

    await env.DB.prepare(
      `UPDATE students SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values, id)
      .run();

    // Fetch the updated student to return it
    const updatedStudent = await env.DB.prepare('SELECT * FROM students WHERE id = ?').bind(id).first<StudentRecord>();
    const normalizedStudent = updatedStudent
      ? { ...updatedStudent, avatar_url: normalizeAvatarUrl(updatedStudent.avatar_url) }
      : null;

    return new Response(
      JSON.stringify({ success: true, student: normalizedStudent }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}

export async function onRequestDelete({ request, env }: { request: Request; env: Env }) {
  // This function is deprecated - DELETE is handled in [id].ts
  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}