import { Env } from '../types/index';
import { authenticateUser } from '../middleware/auth';

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  belt: string;
  discipline: string;
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

    // If not admin, filter by creator or instructor
    if (auth.user.role !== 'admin') {
      query += " AND (created_by = ? OR instructor_id = ?)";
      params.push(auth.user.id, auth.user.id);
    }

    query += " ORDER BY created_at DESC";

    const { results } = await env.DB.prepare(query).bind(...params).all<StudentRecord>();
    
    return new Response(JSON.stringify(results), {
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
      joinDate: string;
      dateOfBirth?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      notes?: string;
    };

    const now = new Date().toISOString();
    const { id, name, email, phone, belt, discipline, joinDate, dateOfBirth, emergencyContactName, emergencyContactPhone, notes } = body;

    // Insert with created_by set to current user
    await env.DB.prepare(`
      INSERT INTO students (
        id, name, email, phone, belt, discipline, join_date, date_of_birth,
        emergency_contact_name, emergency_contact_phone, notes, is_active,
        created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `).bind(
      id, name, email, phone || null, belt, discipline, joinDate,
      dateOfBirth || null, emergencyContactName || null, emergencyContactPhone || null,
      notes || null, auth.user.id, now, now
    ).run();

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
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
      name: string;
      email: string;
      phone?: string;
      belt: string;
      discipline: string;
      joinDate?: string;
      dateOfBirth?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      notes?: string;
    };

    const { id, name, email, phone, belt, discipline, joinDate, dateOfBirth, emergencyContactName, emergencyContactPhone, notes } = body;

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

    // Update with updated_by set to current user
    await env.DB.prepare(`
      UPDATE students 
      SET name = ?, email = ?, phone = ?, belt = ?, discipline = ?, 
          join_date = ?, date_of_birth = ?, emergency_contact_name = ?, 
          emergency_contact_phone = ?, notes = ?, updated_by = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      name, email, phone || null, belt, discipline, finalJoinDate,
      dateOfBirth || null, emergencyContactName || null, emergencyContactPhone || null,
      notes || null, auth.user.id, now, id
    ).run();

    // Fetch the updated student to return it
    const updatedStudent = await env.DB.prepare("SELECT * FROM students WHERE id = ?").bind(id).first();

    return new Response(JSON.stringify({ success: true, student: updatedStudent }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}

export async function onRequestDelete({ request, env }: { request: Request; env: Env }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get student ID from URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Student ID required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the student belongs to the current user
    const { results } = await env.DB.prepare(
      "SELECT id FROM students WHERE id = ? AND created_by = ? AND deleted_at IS NULL"
    ).bind(id, auth.user.id).all();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: 'Student not found or access denied' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();

    // Soft delete - set deleted_at timestamp
    await env.DB.prepare(
      "UPDATE students SET deleted_at = ?, updated_at = ? WHERE id = ? AND created_by = ?"
    ).bind(now, now, id, auth.user.id).run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}