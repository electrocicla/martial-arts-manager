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