import { Env } from '../../../../types/index';
import { authenticateUser } from '../../../../middleware/auth';

// POST /api/classes/:classId/students/batch - Batch enroll students
export async function onRequestPost({ request, env, params }: { request: Request; env: Env; params: { classId: string } }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { classId } = params;
    const body = await request.json() as { student_ids: string[] };
    const { student_ids } = body;

    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return new Response(JSON.stringify({ error: 'student_ids must be a non-empty array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (student_ids.length > 100) {
      return new Response(JSON.stringify({ error: 'Cannot enroll more than 100 students at once' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify class exists and user has access
    const classCheck = await env.DB.prepare(
      auth.user.role === 'admin'
        ? "SELECT id, max_students, parent_course_id FROM classes WHERE id = ? AND deleted_at IS NULL"
        : "SELECT id, max_students, parent_course_id FROM classes WHERE id = ? AND (created_by = ? OR instructor_id = ?) AND deleted_at IS NULL"
    ).bind(...(auth.user.role === 'admin' ? [classId] : [classId, auth.user.id, auth.user.id])).first<{ id: string; max_students: number; parent_course_id?: string | null }>();

    if (!classCheck) {
      return new Response(JSON.stringify({ error: 'Class not found or access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get current enrollment count
    const parentClassId = classCheck.parent_course_id ?? null;
    const enrolledCount = await env.DB.prepare(
      "SELECT COUNT(DISTINCT student_id) as count FROM class_enrollments WHERE enrollment_status = 'active' AND (class_id = ? OR (? IS NOT NULL AND class_id = ?))"
    ).bind(classId, parentClassId, parentClassId).first<{ count: number }>();

    const currentCount = enrolledCount?.count ?? 0;

    // Get already-enrolled student IDs to skip them
    const { results: existingRows } = await env.DB.prepare(
      `SELECT student_id FROM class_enrollments WHERE (class_id = ? OR (? IS NOT NULL AND class_id = ?)) AND student_id IN (${student_ids.map(() => '?').join(',')})`
    ).bind(classId, parentClassId, parentClassId, ...student_ids).all<{ student_id: string }>();

    const alreadyEnrolled = new Set((existingRows ?? []).map(r => r.student_id));
    const toEnroll = student_ids.filter(id => !alreadyEnrolled.has(id));

    // Check capacity
    const availableSlots = classCheck.max_students - currentCount;
    const enrollable = toEnroll.slice(0, availableSlots);

    if (enrollable.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        enrolled: 0,
        skipped: student_ids.length,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build batch insert statements
    const now = new Date().toISOString();
    const stmts = enrollable.map(studentId =>
      env.DB.prepare(`
        INSERT INTO class_enrollments (id, class_id, student_id, enrolled_at, enrollment_status, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'active', ?, ?, ?)
      `).bind(`${classId}-${studentId}`, classId, studentId, now, auth.user.id, now, now)
    );

    await env.DB.batch(stmts);

    return new Response(JSON.stringify({
      success: true,
      enrolled: enrollable.length,
      skipped: student_ids.length - enrollable.length,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Batch Enroll Error]', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
