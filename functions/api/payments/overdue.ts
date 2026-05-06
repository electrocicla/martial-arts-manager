/**
 * GET /api/payments/overdue
 *
 * Returns the list of students with no completed payment registered for the
 * current calendar month past the configurable due day (default: 5th of the
 * month). Each entry exposes the days overdue, the most recent completed
 * payment and the expected amount, allowing the admin dashboard to surface
 * actionable reminders.
 *
 * Access: admin or instructor (instructors only see their own students).
 */

import type { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';

interface StudentRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  belt: string;
  discipline: string;
  user_id: string | null;
}

interface PaymentSummaryRow {
  student_id: string;
  last_completed_date: string | null;
  last_completed_amount: number | null;
  current_month_completed: number;
  avg_amount: number | null;
}

export interface OverdueStudent {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string | null;
  belt: string;
  discipline: string;
  userId: string | null;
  expectedAmount: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
  daysOverdue: number;
  dueDate: string;
}

interface OverdueResponse {
  students: OverdueStudent[];
  meta: {
    dueDay: number;
    dueDate: string;
    referenceDate: string;
    totalOverdue: number;
  };
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const DEFAULT_DUE_DAY = 5;
const DEFAULT_EXPECTED_AMOUNT = 35000;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function clampDueDay(day: number): number {
  if (!Number.isFinite(day)) return DEFAULT_DUE_DAY;
  if (day < 1) return 1;
  if (day > 28) return 28;
  return Math.floor(day);
}

function buildDueDateForMonth(year: number, monthIndexZeroBased: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndexZeroBased, day));
}

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function diffDays(later: Date, earlier: Date): number {
  const ms = later.getTime() - earlier.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export async function onRequestGet({
  request,
  env,
}: {
  request: Request;
  env: Env;
}): Promise<Response> {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return jsonResponse({ error: auth.error }, 401);
    }

    if (auth.user.role !== 'admin' && auth.user.role !== 'instructor') {
      return jsonResponse({ error: 'Access denied' }, 403);
    }

    const url = new URL(request.url);
    const requestedDueDay = Number(url.searchParams.get('due_day') ?? DEFAULT_DUE_DAY);
    const dueDay = clampDueDay(requestedDueDay);

    const now = new Date();
    const year = now.getUTCFullYear();
    const monthIndex = now.getUTCMonth();
    const dueDate = buildDueDateForMonth(year, monthIndex, dueDay);

    // Only flag overdue once we are past the due day.
    if (now < dueDate) {
      const empty: OverdueResponse = {
        students: [],
        meta: {
          dueDay,
          dueDate: isoDate(dueDate),
          referenceDate: isoDate(now),
          totalOverdue: 0,
        },
      };
      return jsonResponse(empty);
    }

    let studentsQuery = `
      SELECT s.id, s.name, s.email, s.phone, s.belt, s.discipline,
             u.id AS user_id
        FROM students s
        LEFT JOIN users u ON u.student_id = s.id AND u.role = 'student'
       WHERE s.deleted_at IS NULL
         AND s.is_active = 1
    `;
    const studentParams: string[] = [];

    if (auth.user.role !== 'admin') {
      studentsQuery += ' AND (s.created_by = ? OR s.instructor_id = ?)';
      studentParams.push(auth.user.id, auth.user.id);
    }

    const { results: studentRows } = await env.DB
      .prepare(studentsQuery)
      .bind(...studentParams)
      .all<StudentRow>();

    const students = studentRows ?? [];
    if (students.length === 0) {
      const empty: OverdueResponse = {
        students: [],
        meta: {
          dueDay,
          dueDate: isoDate(dueDate),
          referenceDate: isoDate(now),
          totalOverdue: 0,
        },
      };
      return jsonResponse(empty);
    }

    const placeholders = students.map(() => '?').join(', ');
    const monthPrefix = `${year.toString().padStart(4, '0')}-${String(monthIndex + 1).padStart(2, '0')}`;

    const summaryQuery = `
      SELECT
        p.student_id AS student_id,
        MAX(CASE WHEN p.status = 'completed' THEN p.date END) AS last_completed_date,
        (
          SELECT amount FROM payments
           WHERE student_id = p.student_id
             AND status = 'completed'
             AND deleted_at IS NULL
           ORDER BY date DESC, created_at DESC
           LIMIT 1
        ) AS last_completed_amount,
        SUM(CASE
              WHEN p.status = 'completed'
                AND substr(p.date, 1, 7) = ?
                THEN 1 ELSE 0 END) AS current_month_completed,
        AVG(CASE WHEN p.status = 'completed' THEN p.amount END) AS avg_amount
      FROM payments p
      WHERE p.deleted_at IS NULL
        AND p.student_id IN (${placeholders})
      GROUP BY p.student_id
    `;

    const { results: summaryRows } = await env.DB
      .prepare(summaryQuery)
      .bind(monthPrefix, ...students.map((s) => s.id))
      .all<PaymentSummaryRow>();

    const summaryById = new Map<string, PaymentSummaryRow>();
    for (const row of summaryRows ?? []) {
      summaryById.set(row.student_id, row);
    }

    const overdue: OverdueStudent[] = [];

    for (const student of students) {
      const summary = summaryById.get(student.id);
      const completedThisMonth = summary?.current_month_completed ?? 0;
      if (completedThisMonth > 0) continue;

      const lastDate = summary?.last_completed_date ?? null;
      const lastAmount = summary?.last_completed_amount ?? null;
      const expectedAmount =
        lastAmount && lastAmount > 0
          ? lastAmount
          : summary?.avg_amount && summary.avg_amount > 0
            ? Math.round(summary.avg_amount)
            : DEFAULT_EXPECTED_AMOUNT;

      const daysOverdue = Math.max(0, diffDays(now, dueDate));

      overdue.push({
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        studentPhone: student.phone,
        belt: student.belt,
        discipline: student.discipline,
        userId: student.user_id,
        expectedAmount,
        lastPaymentDate: lastDate,
        lastPaymentAmount: lastAmount,
        daysOverdue,
        dueDate: isoDate(dueDate),
      });
    }

    overdue.sort((a, b) => b.daysOverdue - a.daysOverdue || a.studentName.localeCompare(b.studentName));

    const response: OverdueResponse = {
      students: overdue,
      meta: {
        dueDay,
        dueDate: isoDate(dueDate),
        referenceDate: isoDate(now),
        totalOverdue: overdue.length,
      },
    };

    return jsonResponse(response);
  } catch (error) {
    console.error('Payment overdue error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}
