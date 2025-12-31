import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';

interface StudentUpdateRequest {
  name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  belt?: string;
  discipline?: string;
  disciplines?: { discipline: string; belt: string }[]; // New array format
  join_date?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  is_active?: number;
  avatar_url?: string;
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

function getString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function coerceIsActive(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return undefined;
}

// GET /api/students/:id - Get a specific student
export async function onRequestGet({ request, env, params }: { request: Request; env: Env; params: { id: string } }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const studentId = params.id as string;

    let query = 'SELECT * FROM students WHERE id = ? AND deleted_at IS NULL';
    const bindValues: string[] = [studentId];

    if (auth.user.role !== 'admin') {
      query += ' AND (created_by = ? OR instructor_id = ?)';
      bindValues.push(auth.user.id, auth.user.id);
    }

    const student = await env.DB.prepare(query).bind(...bindValues).first<Record<string, unknown>>();

    if (!student) {
      return new Response(JSON.stringify({ error: 'Student not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const normalized = {
      ...student,
      avatar_url: normalizeAvatarUrl(student.avatar_url),
    };

    return new Response(JSON.stringify({ student: normalized }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch student' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// PUT /api/students/:id - Update a student
export async function onRequestPut({ request, env, params }: { request: Request; env: Env; params: { id: string } }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const studentId = params.id;

    const raw = (await request.json()) as Record<string, unknown>;

    // Map camelCase inputs to snake_case fields
    const body: StudentUpdateRequest = {
      name: getString(raw, 'name'),
      email: getString(raw, 'email'),
      phone: getString(raw, 'phone'),
      belt: getString(raw, 'belt'),
      discipline: getString(raw, 'discipline'),
      disciplines: raw.disciplines as { discipline: string; belt: string }[] | undefined,
      date_of_birth: getString(raw, 'date_of_birth') ?? getString(raw, 'dateOfBirth'),
      join_date: getString(raw, 'join_date') ?? getString(raw, 'joinDate'),
      emergency_contact_name: getString(raw, 'emergency_contact_name') ?? getString(raw, 'emergencyContactName'),
      emergency_contact_phone: getString(raw, 'emergency_contact_phone') ?? getString(raw, 'emergencyContactPhone'),
      notes: getString(raw, 'notes'),
      avatar_url: getString(raw, 'avatar_url') ?? getString(raw, 'avatarUrl'),
      is_active: coerceIsActive(raw.is_active) ?? coerceIsActive(raw.isActive),
    };

    // Verify student exists and is accessible
    let checkQuery = 'SELECT id FROM students WHERE id = ? AND deleted_at IS NULL';
    const checkValues: string[] = [studentId];
    if (auth.user.role !== 'admin') {
      checkQuery += ' AND (created_by = ? OR instructor_id = ?)';
      checkValues.push(auth.user.id, auth.user.id);
    }

    const existingStudent = await env.DB.prepare(checkQuery).bind(...checkValues).first<{ id: string }>();

    if (!existingStudent) {
      return new Response(JSON.stringify({ error: 'Student not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    const allowedFields: (keyof StudentUpdateRequest)[] = [
      'name',
      'email',
      'phone',
      'date_of_birth',
      'belt',
      'discipline',
      'disciplines',
      'join_date',
      'emergency_contact_name',
      'emergency_contact_phone',
      'notes',
      'is_active',
      'avatar_url'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        if (field === 'disciplines') {
          const disciplinesJson = body.disciplines && body.disciplines.length > 0 ? JSON.stringify(body.disciplines) : null;
          values.push(disciplinesJson);
        } else {
          values.push(body[field] as string | number | null);
        }
      }
    });

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add updated_by and updated_at
    updates.push('updated_by = ?');
    values.push(auth.user.id);
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());

    // Bind WHERE
    values.push(studentId);

    const query = `
      UPDATE students 
      SET ${updates.join(', ')}
      WHERE id = ? AND deleted_at IS NULL
    `;

    await env.DB.prepare(query).bind(...values).run();

    // Fetch and return updated student
    let readQuery = 'SELECT * FROM students WHERE id = ? AND deleted_at IS NULL';
    const readValues: string[] = [studentId];
    if (auth.user.role !== 'admin') {
      readQuery += ' AND (created_by = ? OR instructor_id = ?)';
      readValues.push(auth.user.id, auth.user.id);
    }

    const updatedStudent = await env.DB.prepare(readQuery).bind(...readValues).first<Record<string, unknown>>();
    const normalized = updatedStudent
      ? { ...updatedStudent, avatar_url: normalizeAvatarUrl(updatedStudent.avatar_url) }
      : null;

    return new Response(
      JSON.stringify({ 
        message: 'Student updated successfully',
        student: normalized
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating student:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update student' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// DELETE /api/students/:id - Soft delete a student
export async function onRequestDelete({ request, env, params }: { request: Request; env: Env; params: { id: string } }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const studentId = params.id as string;

    // Verify student exists and belongs to user
    const student = await env.DB.prepare(
      'SELECT id FROM students WHERE id = ? AND created_by = ? AND deleted_at IS NULL'
    )
      .bind(studentId, auth.user.id)
      .first();

    if (!student) {
      return new Response(JSON.stringify({ error: 'Student not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Soft delete the student
    await env.DB.prepare(
      'UPDATE students SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND created_by = ?'
    )
      .bind(studentId, auth.user.id)
      .run();

    return new Response(
      JSON.stringify({ message: 'Student deleted successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting student:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete student' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
