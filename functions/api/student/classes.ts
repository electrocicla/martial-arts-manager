import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';

interface StudentClassRecord {
  id: string;
  name: string;
  discipline: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  instructor_id?: string;
  max_students: number;
  enrolled_count?: number;
  enrolled_student_ids?: string[];
  parent_course_id?: string | null;
  description?: string;
  is_recurring: number;
  recurrence_pattern?: string;
  is_active: number;
  enrollment_status: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated || !auth.user.student_id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // Get enrolled classes
    const { results } = await env.DB.prepare(`
      SELECT
        c.*,
        ce.enrollment_status,
        COUNT(DISTINCT active_enrollments.student_id) as enrolled_count
      FROM classes c
      JOIN class_enrollments ce
        ON ce.student_id = ?
        AND ce.enrollment_status = 'active'
        AND (
          ce.class_id = c.id
          OR ce.class_id = c.parent_course_id
        )
      LEFT JOIN class_enrollments active_enrollments
        ON active_enrollments.enrollment_status = 'active'
        AND (
          active_enrollments.class_id = c.id
          OR active_enrollments.class_id = c.parent_course_id
        )
      WHERE c.deleted_at IS NULL
        AND NOT (
          c.parent_course_id IS NULL
          AND c.is_recurring = 1
          AND EXISTS (
            SELECT 1
            FROM classes child
            WHERE child.parent_course_id = c.id
              AND child.deleted_at IS NULL
          )
        )
      GROUP BY c.id, ce.enrollment_status
      ORDER BY c.date ASC, c.time ASC
    `).bind(auth.user.student_id).all<Omit<StudentClassRecord, 'enrolled_student_ids'>>();

    const classes: StudentClassRecord[] = (results ?? []).map((record) => ({
      ...record,
      enrolled_count: Number(record.enrolled_count ?? 0),
      enrolled_student_ids: auth.user.student_id ? [auth.user.student_id] : [],
    }));

    return new Response(JSON.stringify(classes), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
