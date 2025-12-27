import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';

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

    return new Response(JSON.stringify(student), {
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
      date_of_birth?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
      notes?: string;
    };

    const { name, phone, date_of_birth, emergency_contact_name, emergency_contact_phone, notes } = body;
    const now = new Date().toISOString();

    // Update student record
    // Note: We don't allow updating email, belt, discipline, or instructor here as those are managed by admin/instructor
    let query = "UPDATE students SET updated_at = ?";
    const params: (string | number | null)[] = [now];

    if (name !== undefined) { query += ", name = ?"; params.push(name); }
    if (phone !== undefined) { query += ", phone = ?"; params.push(phone); }
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
