import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';

function normalizeAvatarUrl(avatarUrl: unknown): string | undefined {
  if (typeof avatarUrl !== 'string' || avatarUrl.trim().length === 0) {
    return undefined;
  }

  // If it already points to our proxy endpoint, keep as-is
  if (avatarUrl.startsWith('/api/avatars')) {
    return avatarUrl;
  }

  // If stored as a bare key
  if (avatarUrl.startsWith('avatars/')) {
    return `/api/avatars?key=${encodeURIComponent(avatarUrl)}`;
  }

  // If stored as an absolute URL to a deprecated avatars subdomain, rewrite to proxy
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
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated || !auth.user.student_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const student = await env.DB.prepare(
      "SELECT * FROM students WHERE id = ?"
    ).bind(auth.user.student_id).first();

    if (!student) {
      return new Response(JSON.stringify({ error: 'Student profile not found' }), { status: 404 });
    }

    let disciplines = (student as any).disciplines;
    try {
      if (typeof disciplines === 'string') {
        disciplines = JSON.parse(disciplines);
      }
    } catch {
      disciplines = [];
    }

    const normalized = {
      ...(student as Record<string, unknown>),
      avatar_url: normalizeAvatarUrl((student as Record<string, unknown>).avatar_url),
      disciplines
    };

    return new Response(JSON.stringify(normalized), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}

export async function onRequestPut({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated || !auth.user.student_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json() as {
      name?: string;
      email?: string;
      phone?: string;
      belt?: string;
      disciplines?: { discipline: string; belt: string }[]; // Allow students to update their disciplines
      date_of_birth?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
      notes?: string;
    };

    const { name, email, phone, belt, disciplines, date_of_birth, emergency_contact_name, emergency_contact_phone, notes } = body;
    const now = new Date().toISOString();

    let normalizedEmail: string | undefined;
    if (email !== undefined) {
      const trimmed = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return new Response(JSON.stringify({ error: 'Invalid email format' }), { status: 400 });
      }

      // Ensure uniqueness across both tables
      const existingUser = await env.DB.prepare('SELECT id FROM users WHERE email = ? AND id != ?')
        .bind(trimmed, auth.user.id)
        .first<{ id: string }>();
      if (existingUser?.id) {
        return new Response(JSON.stringify({ error: 'Email is already in use' }), { status: 409 });
      }

      const existingStudent = await env.DB.prepare('SELECT id FROM students WHERE email = ? AND id != ? AND deleted_at IS NULL')
        .bind(trimmed, auth.user.student_id)
        .first<{ id: string }>();
      if (existingStudent?.id) {
        return new Response(JSON.stringify({ error: 'Email is already in use' }), { status: 409 });
      }

      normalizedEmail = trimmed;
    }

    // Update student record
    // Note: Belt/discipline/instructor are managed by admin/instructor
    let query = "UPDATE students SET updated_at = ?";
    const params: (string | number | null)[] = [now];

    if (name !== undefined) { query += ", name = ?"; params.push(name); }
    if (normalizedEmail !== undefined) { query += ", email = ?"; params.push(normalizedEmail); }
    if (phone !== undefined) { query += ", phone = ?"; params.push(phone); }
    if (belt !== undefined) { query += ", belt = ?"; params.push(belt); }
    if (disciplines !== undefined) {
      const disciplinesJson = disciplines && disciplines.length > 0 ? JSON.stringify(disciplines) : null;
      query += ", disciplines = ?";
      params.push(disciplinesJson);
    }
    if (date_of_birth !== undefined) { query += ", date_of_birth = ?"; params.push(date_of_birth); }
    if (emergency_contact_name !== undefined) { query += ", emergency_contact_name = ?"; params.push(emergency_contact_name); }
    if (emergency_contact_phone !== undefined) { query += ", emergency_contact_phone = ?"; params.push(emergency_contact_phone); }
    if (notes !== undefined) { query += ", notes = ?"; params.push(notes); }

    query += " WHERE id = ?";
    params.push(auth.user.student_id);

    const statements: D1PreparedStatement[] = [env.DB.prepare(query).bind(...params)];

    // Keep users.email in sync so login + profile reflect the same email
    if (normalizedEmail !== undefined) {
      statements.push(env.DB.prepare('UPDATE users SET email = ?, updated_at = ? WHERE id = ?')
        .bind(normalizedEmail, now, auth.user.id));
    }

    // If name was updated, also update the users table
    if (name !== undefined) {
      statements.push(env.DB.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?')
        .bind(name, now, auth.user.id));
    }

    await env.DB.batch(statements);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
