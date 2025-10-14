import { Env } from '../../types';
import { authenticateUser } from '../../middleware/auth';

// GET /api/students/:id - Get a specific student
export async function onRequestGet({ request, env, params }: { request: Request; env: Env; params: any }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const studentId = params.id as string;

    const student = await env.DB.prepare(
      'SELECT * FROM students WHERE id = ? AND created_by = ? AND deleted_at IS NULL'
    )
      .bind(studentId, auth.user.id)
      .first();

    if (!student) {
      return new Response(JSON.stringify({ error: 'Student not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ student }), {
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
export async function onRequestPut({ request, env, params }: { request: Request; env: Env; params: any }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const studentId = params.id as string;
    const body = await request.json() as any;

    // Verify student exists and belongs to user
    const existingStudent = await env.DB.prepare(
      'SELECT id FROM students WHERE id = ? AND created_by = ? AND deleted_at IS NULL'
    )
      .bind(studentId, auth.user.id)
      .first();

    if (!existingStudent) {
      return new Response(JSON.stringify({ error: 'Student not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      'name',
      'email',
      'phone',
      'date_of_birth',
      'belt',
      'discipline',
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
        values.push(body[field]);
      }
    });

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add updated_at timestamp
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(studentId, auth.user.id);

    const query = `
      UPDATE students 
      SET ${updates.join(', ')}
      WHERE id = ? AND created_by = ? AND deleted_at IS NULL
    `;

    await env.DB.prepare(query).bind(...values).run();

    // Fetch and return updated student
    const updatedStudent = await env.DB.prepare(
      'SELECT * FROM students WHERE id = ? AND created_by = ? AND deleted_at IS NULL'
    )
      .bind(studentId, auth.user.id)
      .first();

    return new Response(
      JSON.stringify({ 
        message: 'Student updated successfully',
        student: updatedStudent
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
export async function onRequestDelete({ request, env, params }: { request: Request; env: Env; params: any }) {
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
