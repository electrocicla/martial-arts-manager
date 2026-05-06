/**
 * GET /api/payments/history
 *
 * Returns payments grouped by month for the admin/instructor payments
 * dashboard. Each bucket contains a quick summary plus the full list of
 * payments in that month so the UI can render both the collapsed and the
 * expanded view without additional round-trips.
 *
 * Access:
 *   - admin: all payments
 *   - instructor: payments from students they created or are assigned to
 */

import type { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';

interface PaymentHistoryRow {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  amount: number;
  date: string;
  type: string;
  notes: string | null;
  status: string;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

interface MonthBucket {
  monthKey: string;
  totalAmount: number;
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
  payments: PaymentHistoryRow[];
}

interface HistoryResponse {
  months: MonthBucket[];
  totals: {
    totalAmount: number;
    totalCount: number;
    completedAmount: number;
    pendingAmount: number;
    monthsTracked: number;
  };
}

const AUTO_PENDING_PLACEHOLDER_NOTE = 'Auto-generated pending monthly payment%';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
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

    let query = `
      SELECT
        p.id,
        p.student_id,
        s.name AS student_name,
        s.email AS student_email,
        p.amount,
        p.date,
        p.type,
        p.notes,
        p.status,
        p.payment_method,
        p.created_at,
        p.updated_at
      FROM payments p
      INNER JOIN students s ON p.student_id = s.id
      WHERE p.deleted_at IS NULL
        AND s.deleted_at IS NULL
        AND NOT (
          p.status = 'pending'
          AND p.notes LIKE ?
          AND EXISTS (
            SELECT 1 FROM payments p2
            WHERE p2.student_id = p.student_id
              AND p2.deleted_at IS NULL
              AND p2.id != p.id
              AND p2.status IN ('completed', 'refunded')
              AND strftime('%Y-%m', p2.date) = strftime('%Y-%m', p.date)
          )
        )
    `;
    const params: string[] = [AUTO_PENDING_PLACEHOLDER_NOTE];

    if (auth.user.role !== 'admin') {
      query += ' AND (s.created_by = ? OR s.instructor_id = ?)';
      params.push(auth.user.id, auth.user.id);
    }

    query += ' ORDER BY p.date DESC, p.created_at DESC';

    const { results } = await env.DB
      .prepare(query)
      .bind(...params)
      .all<PaymentHistoryRow>();

    const rows = results ?? [];
    const buckets = new Map<string, MonthBucket>();
    const totals = {
      totalAmount: 0,
      totalCount: rows.length,
      completedAmount: 0,
      pendingAmount: 0,
      monthsTracked: 0,
    };

    for (const row of rows) {
      const monthKey = (row.date ?? '').slice(0, 7) || 'unknown';
      let bucket = buckets.get(monthKey);
      if (!bucket) {
        bucket = {
          monthKey,
          totalAmount: 0,
          totalCount: 0,
          completedCount: 0,
          pendingCount: 0,
          failedCount: 0,
          refundedCount: 0,
          payments: [],
        };
        buckets.set(monthKey, bucket);
      }

      const amount = Number(row.amount) || 0;
      bucket.payments.push(row);
      bucket.totalCount += 1;

      switch (row.status) {
        case 'completed':
          bucket.completedCount += 1;
          bucket.totalAmount += amount;
          totals.totalAmount += amount;
          totals.completedAmount += amount;
          break;
        case 'refunded':
          bucket.refundedCount += 1;
          bucket.totalAmount -= amount;
          totals.totalAmount -= amount;
          break;
        case 'pending':
          bucket.pendingCount += 1;
          totals.pendingAmount += amount;
          break;
        case 'failed':
          bucket.failedCount += 1;
          break;
        default:
          break;
      }
    }

    const months = Array.from(buckets.values()).sort((a, b) =>
      a.monthKey < b.monthKey ? 1 : a.monthKey > b.monthKey ? -1 : 0,
    );
    totals.monthsTracked = months.length;

    const response: HistoryResponse = { months, totals };
    return jsonResponse(response);
  } catch (error) {
    console.error('Payment history error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}
