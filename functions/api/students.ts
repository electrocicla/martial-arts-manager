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

    // Get only students created by this user
    const { results } = await env.DB.prepare(
      "SELECT * FROM students WHERE deleted_at IS NULL AND created_by = ? ORDER BY created_at DESC"
    ).bind(auth.user.id).all<StudentRecord>();
    
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
      joinDate: string;
      dateOfBirth?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      notes?: string;
    };

    const { id, name, email, phone, belt, discipline, joinDate, dateOfBirth, emergencyContactName, emergencyContactPhone, notes } = body;

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

    // Update with updated_by set to current user
    await env.DB.prepare(`
      UPDATE students 
      SET name = ?, email = ?, phone = ?, belt = ?, discipline = ?, 
          join_date = ?, date_of_birth = ?, emergency_contact_name = ?, 
          emergency_contact_phone = ?, notes = ?, updated_by = ?, updated_at = ?
      WHERE id = ? AND created_by = ?
    `).bind(
      name, email, phone || null, belt, discipline, joinDate,
      dateOfBirth || null, emergencyContactName || null, emergencyContactPhone || null,
      notes || null, auth.user.id, now, id, auth.user.id
    ).run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
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