import { Env } from '../../../types/index';
import { authenticateUser } from '../../../middleware/auth';

// GET /api/students/:studentId/classes - Get all classes a student is enrolled in
export async function onRequestGet({ request, env, params }: { request: Request; env: Env; params: { id: string } }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const studentId = params.id;

    // Verify student belongs to user
    const studentCheck = await env.DB.prepare(
      "SELECT id FROM students WHERE id = ? AND created_by = ? AND deleted_at IS NULL"
    ).bind(studentId, auth.user.id).first();

    if (!studentCheck) {
      return new Response(JSON.stringify({ error: 'Student not found or access denied' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get enrolled classes with details
    const { results } = await env.DB.prepare(`
      SELECT 
        c.*,
        ce.enrolled_at,
        ce.enrollment_status,
        COUNT(CASE WHEN a.attended = 1 THEN 1 END) as attendance_count,
        COUNT(a.id) as total_sessions
      FROM classes c
      INNER JOIN class_enrollments ce ON c.id = ce.class_id
      LEFT JOIN attendance a ON a.class_id = c.id AND a.student_id = ce.student_id
      WHERE ce.student_id = ? AND ce.enrollment_status = 'active' AND c.deleted_at IS NULL
      GROUP BY c.id, ce.enrolled_at, ce.enrollment_status
      ORDER BY c.date DESC, c.time ASC
    `).bind(studentId).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Get Student Classes Error]', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
