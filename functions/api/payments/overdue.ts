/**
 * GET /api/payments/overdue
 *
 * Returns the list of students whose monthly payment cycle is due. The cycle is
 * based on each student's latest completed payment date plus one month, falling
 * back to join_date/created_at for students without completed payments.
 *
 * Access: admin or instructor (instructors only see their own students).
 */

import type { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';
import { getPaymentCycleStatus } from '../../utils/payment-cycle';

interface OverdueAggregateRow {
  student_id: string;
  name: string;
  email: string;
  phone: string | null;
  belt: string;
  discipline: string;
  join_date: string | null;
  created_at: string | null;
  user_id: string | null;
  last_completed_date: string | null;
  last_completed_amount: number | null;
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
    dueDay: number | null;
    dueDate: string;
    referenceDate: string;
    totalOverdue: number;
    cycle: 'last_payment_plus_one_month';
  };
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const DEFAULT_EXPECTED_AMOUNT = 35000;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
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

    const now = new Date();

    let aggregateQuery = `
      SELECT
        s.id   AS student_id,
        s.name AS name,
        s.email AS email,
        s.phone AS phone,
        s.belt AS belt,
        s.discipline AS discipline,
        s.join_date AS join_date,
        s.created_at AS created_at,
        u.id   AS user_id,
        MAX(CASE WHEN p.status = 'completed' THEN p.date END) AS last_completed_date,
        (
          SELECT amount FROM payments
           WHERE student_id = s.id
             AND status = 'completed'
             AND deleted_at IS NULL
           ORDER BY date DESC, created_at DESC
           LIMIT 1
        ) AS last_completed_amount,
        AVG(CASE WHEN p.status = 'completed' THEN p.amount END) AS avg_amount
      FROM students s
      LEFT JOIN users u ON u.student_id = s.id AND u.role = 'student'
      LEFT JOIN payments p ON p.student_id = s.id AND p.deleted_at IS NULL
      WHERE s.deleted_at IS NULL
        AND s.is_active = 1
    `;
    const aggregateParams: (string | number)[] = [];

    if (auth.user.role !== 'admin') {
      aggregateQuery += ' AND (s.created_by = ? OR s.instructor_id = ?)';
      aggregateParams.push(auth.user.id, auth.user.id);
    }

    aggregateQuery += ' GROUP BY s.id';

    const { results: aggregateRows } = await env.DB
      .prepare(aggregateQuery)
      .bind(...aggregateParams)
      .all<OverdueAggregateRow>();

    const rows = aggregateRows ?? [];
    if (rows.length === 0) {
      const empty: OverdueResponse = {
        students: [],
        meta: {
          dueDay: null,
          dueDate: isoDate(now),
          referenceDate: isoDate(now),
          totalOverdue: 0,
          cycle: 'last_payment_plus_one_month',
        },
      };
      return jsonResponse(empty);
    }

    const overdue: OverdueStudent[] = [];

    for (const row of rows) {
      const paymentCycle = getPaymentCycleStatus({
        lastCompletedDate: row.last_completed_date,
        joinDate: row.join_date,
        createdAt: row.created_at,
        referenceDate: now,
      });
      if (!paymentCycle.isOverdue || !paymentCycle.dueDate) continue;

      const lastDate = row.last_completed_date ?? null;
      const lastAmount = row.last_completed_amount ?? null;
      const expectedAmount =
        lastAmount && lastAmount > 0
          ? lastAmount
          : row.avg_amount && row.avg_amount > 0
            ? Math.round(row.avg_amount)
            : DEFAULT_EXPECTED_AMOUNT;

      overdue.push({
        studentId: row.student_id,
        studentName: row.name,
        studentEmail: row.email,
        studentPhone: row.phone,
        belt: row.belt,
        discipline: row.discipline,
        userId: row.user_id,
        expectedAmount,
        lastPaymentDate: lastDate,
        lastPaymentAmount: lastAmount,
        daysOverdue: paymentCycle.daysOverdue,
        dueDate: paymentCycle.dueDate,
      });
    }

    overdue.sort((a, b) => b.daysOverdue - a.daysOverdue || a.studentName.localeCompare(b.studentName));
    const earliestDueDate = overdue.reduce<string | null>((earliest, student) => {
      if (!earliest || student.dueDate < earliest) return student.dueDate;
      return earliest;
    }, null);

    const response: OverdueResponse = {
      students: overdue,
      meta: {
        dueDay: null,
        dueDate: earliestDueDate ?? isoDate(now),
        referenceDate: isoDate(now),
        totalOverdue: overdue.length,
        cycle: 'last_payment_plus_one_month',
      },
    };

    return jsonResponse(response);
  } catch (error) {
    console.error('Payment overdue error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}
