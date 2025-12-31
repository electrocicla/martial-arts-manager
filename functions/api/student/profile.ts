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

    const normalized = {
      ...(student as Record<string, unknown>),
      avatar_url: normalizeAvatarUrl((student as Record<string, unknown>).avatar_url),
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
      phone?: string;
      belt?: string;
      disciplines?: { discipline: string; belt: string }[]; // Allow students to update their disciplines
      date_of_birth?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
      notes?: string;
    };

    const { name, phone, belt, disciplines, date_of_birth, emergency_contact_name, emergency_contact_phone, notes } = body;
    const now = new Date().toISOString();

    // Update student record
    // Note: We don't allow updating email, belt, discipline, or instructor here as those are managed by admin/instructor
    let query = "UPDATE students SET updated_at = ?";
    const params: (string | number | null)[] = [now];

    if (name !== undefined) { query += ", name = ?"; params.push(name); }
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

    await env.DB.prepare(query).bind(...params).run();

    // If name was updated, we should also update the users table
    if (name !== undefined) {
      await env.DB.prepare("UPDATE users SET name = ?, updated_at = ? WHERE id = ?")
        .bind(name, now, auth.user.id)
        .run();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
