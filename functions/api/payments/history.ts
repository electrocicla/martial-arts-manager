/**
 * GET /api/payments/history
 *
 * Returns payments grouped by their accounting month. The accounting period
 * is derived from `payments.date`, not from the database creation timestamp,
 * so retroactive payments remain in the month selected by the administrator.
 *
 * Access:
 *   - admin: all payments
 *   - instructor: payments from students they created or are assigned to
 */

import type { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';
import {
  branchErrorResponse,
  resolveRequestBranchId,
} from '../../utils/branches';
import {
  aggregatePaymentHistory,
  type PaymentHistoryRow,
} from '../../utils/payment-history';

const AUTO_PENDING_PLACEHOLDER_NOTE = 'Auto-generated pending monthly payment%';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown payment history error';
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

    const branchId = await resolveRequestBranchId(request, env, auth.user);

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
        AND p.branch_id = ?
        AND s.deleted_at IS NULL
        AND NOT (
          p.status = 'pending'
          AND p.notes LIKE ?
          AND EXISTS (
            SELECT 1 FROM payments p2
            WHERE p2.student_id = p.student_id
              AND p2.branch_id = p.branch_id
              AND p2.deleted_at IS NULL
              AND p2.id != p.id
              AND p2.status IN ('completed', 'refunded')
              AND strftime('%Y-%m', p2.date) = strftime('%Y-%m', p.date)
          )
        )
    `;
    const params: string[] = [branchId, AUTO_PENDING_PLACEHOLDER_NOTE];

    if (auth.user.role !== 'admin') {
      query += ' AND (s.created_by = ? OR s.instructor_id = ?)';
      params.push(auth.user.id, auth.user.id);
    }

    query += ' ORDER BY p.date DESC, p.created_at DESC';

    const { results } = await env.DB
      .prepare(query)
      .bind(...params)
      .all<PaymentHistoryRow>();

    return jsonResponse(aggregatePaymentHistory(results ?? []));
  } catch (error) {
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;

    console.error('Payment history error:', error);
    return jsonResponse({ error: getErrorMessage(error) }, 500);
  }
}
