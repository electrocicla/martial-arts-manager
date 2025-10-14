import { Env } from '../../../../types/index';
import { authenticateUser } from '../../../../middleware/auth';

// DELETE /api/classes/:classId/students/:studentId - Unenroll a student from a class
export async function onRequestDelete({ request, env, params }: { request: Request; env: Env; params: { classId: string; studentId: string } }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { classId, studentId } = params;

    // Verify class belongs to user
    const classCheck = await env.DB.prepare(
      "SELECT id FROM classes WHERE id = ? AND created_by = ? AND deleted_at IS NULL"
    ).bind(classId, auth.user.id).first();

    if (!classCheck) {
      return new Response(JSON.stringify({ error: 'Class not found or access denied' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete enrollment
    const result = await env.DB.prepare(
      "DELETE FROM class_enrollments WHERE class_id = ? AND student_id = ?"
    ).bind(classId, studentId).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: 'Enrollment not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Student unenrolled successfully'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Unenroll Student Error]', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
