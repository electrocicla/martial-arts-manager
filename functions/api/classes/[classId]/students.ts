import { Env } from '../../../types/index';
import { authenticateUser } from '../../../middleware/auth';

interface EnrollmentRecord {
  id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
  enrollment_status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// POST /api/classes/:classId/students - Enroll a student in a class
export async function onRequestPost({ request, env, params }: { request: Request; env: Env; params: { classId: string } }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { classId } = params;
    const body = await request.json() as { studentId: string };
    const { studentId } = body;

    if (!studentId) {
      return new Response(JSON.stringify({ error: 'studentId is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify class exists and belongs to user (admins can manage any class)
    const classCheck = await env.DB.prepare(
      auth.user.role === 'admin'
        ? "SELECT id, max_students, parent_course_id FROM classes WHERE id = ? AND deleted_at IS NULL"
        : "SELECT id, max_students, parent_course_id FROM classes WHERE id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL"
    ).bind(...(auth.user.role === 'admin' ? [classId] : [classId, auth.user.id, auth.user.id])).first<{ id: string; max_students: number; parent_course_id?: string | null }>();

    if (!classCheck) {
      return new Response(JSON.stringify({ error: 'Class not found or access denied' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify student exists and belongs to user (admins can enroll any student)
    const studentCheck = await env.DB.prepare(
      auth.user.role === 'admin'
        ? "SELECT id FROM students WHERE id = ? AND deleted_at IS NULL"
        : "SELECT id FROM students WHERE id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL"
    ).bind(...(auth.user.role === 'admin' ? [studentId] : [studentId, auth.user.id, auth.user.id])).first();

    if (!studentCheck) {
      return new Response(JSON.stringify({ error: 'Student not found or access denied' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if already enrolled
    const existing = await env.DB.prepare(
      "SELECT id FROM class_enrollments WHERE student_id = ? AND (class_id = ? OR (? IS NOT NULL AND class_id = ?))"
    ).bind(studentId, classId, classCheck.parent_course_id ?? null, classCheck.parent_course_id ?? null).first();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Student already enrolled in this class' }), { 
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check class capacity
    const enrolledCount = await env.DB.prepare(
      "SELECT COUNT(DISTINCT student_id) as count FROM class_enrollments WHERE enrollment_status = 'active' AND (class_id = ? OR (? IS NOT NULL AND class_id = ?))"
    ).bind(classId, classCheck.parent_course_id ?? null, classCheck.parent_course_id ?? null).first<{ count: number }>();

    if (enrolledCount && enrolledCount.count >= classCheck.max_students) {
      return new Response(JSON.stringify({ error: 'Class is full' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create enrollment
    const now = new Date().toISOString();
    const enrollmentId = `${classId}-${studentId}`;

    await env.DB.prepare(`
      INSERT INTO class_enrollments (
        id, class_id, student_id, enrolled_at, enrollment_status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?)
    `).bind(enrollmentId, classId, studentId, now, auth.user.id, now, now).run();

    const enrollment = await env.DB.prepare(
      "SELECT * FROM class_enrollments WHERE id = ?"
    ).bind(enrollmentId).first<EnrollmentRecord>();

    return new Response(JSON.stringify({ 
      success: true, 
      enrollment 
    }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Enroll Student Error]', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET /api/classes/:classId/students - Get all students enrolled in a class
export async function onRequestGet({ request, env, params }: { request: Request; env: Env; params: { classId: string } }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { classId } = params;

    // Verify class belongs to user (admins can view any class)
    const classCheck = await env.DB.prepare(
      auth.user.role === 'admin'
        ? "SELECT id FROM classes WHERE id = ? AND deleted_at IS NULL"
        : "SELECT id FROM classes WHERE id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL"
    ).bind(...(auth.user.role === 'admin' ? [classId] : [classId, auth.user.id, auth.user.id])).first();

    if (!classCheck) {
      return new Response(JSON.stringify({ error: 'Class not found or access denied' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get enrolled students with their details
    const { results } = await env.DB.prepare(`
      SELECT 
        s.*,
        ce.enrolled_at,
        ce.enrollment_status,
        a.attended,
        a.check_in_time
      FROM students s
      INNER JOIN class_enrollments ce ON s.id = ce.student_id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.class_id = ?
      WHERE (ce.class_id = ? OR ce.class_id = (SELECT parent_course_id FROM classes WHERE id = ?))
        AND ce.enrollment_status = 'active'
        AND s.deleted_at IS NULL
      ORDER BY s.name ASC
    `).bind(classId, classId, classId).all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[Get Class Students Error]', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
