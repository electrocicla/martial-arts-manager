/**
 * POST /api/payments/notify-overdue/bulk
 *
 * Sends a forced-confirmation payment-pending notification to many overdue
 * students in a single call.
 *
 * Body:
 *   { studentIds: string[]; monthLabel?: string }
 *     -> notify the listed students
 *   { all: true; monthLabel?: string }
 *     -> notify every overdue student the caller can see (capped)
 *
 * Each per-student notify reuses the same dedupe rule as the single endpoint:
 * if there is already an unconfirmed payment_pending notification for that
 * student/month, the call for that student is skipped (counted as `skipped`).
 */

import type { Env } from '../../../types/index';
import { authenticateUser } from '../../../middleware/auth';
import {
  ensureNotificationsSchema,
  withNotificationsTable,
} from '../../../utils/notifications';
import { getPaymentCycleStatus } from '../../../utils/payment-cycle';

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const MAX_BULK_RECIPIENTS = 500;
const DEFAULT_EXPECTED_AMOUNT = 35000;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

interface BulkBody {
  studentIds?: string[];
  all?: boolean;
  monthLabel?: string;
}

interface OverdueRow {
  id: string;
  name: string;
  user_id: string | null;
  join_date: string | null;
  created_at: string | null;
  last_completed_date: string | null;
  last_completed_amount: number | null;
  avg_amount: number | null;
}

interface BulkResultEntry {
  studentId: string;
  status: 'sent' | 'skipped' | 'error';
  reason?: string;
  notificationId?: string;
}

function getDefaultMonthLabel(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function computeExpectedAmount(row: OverdueRow): number {
  if (row.last_completed_amount && row.last_completed_amount > 0) {
    return Math.round(row.last_completed_amount);
  }
  if (row.avg_amount && row.avg_amount > 0) {
    return Math.round(row.avg_amount);
  }
  return DEFAULT_EXPECTED_AMOUNT;
}

export async function onRequestPost({
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

    await ensureNotificationsSchema(env.DB);

    const body = (await request.json().catch(() => ({}))) as BulkBody;
    const monthLabel = typeof body.monthLabel === 'string' && body.monthLabel.length > 0
      ? body.monthLabel
      : getDefaultMonthLabel();

    // Resolve target student rows.
    let targets: OverdueRow[] = [];

    if (body.all === true) {
      // Pull every overdue student visible to the caller (admin sees all,
      // instructor sees only their own). We re-run the same aggregate query
      // pattern used by /api/payments/overdue but only return the rows we
      // actually need to notify.
      const isAdmin = auth.user.role === 'admin';
      const ownershipClause = isAdmin
        ? ''
        : ' AND (s.created_by = ? OR s.instructor_id = ?)';

      const stmt = env.DB.prepare(
        `SELECT s.id, s.name, s.join_date, s.created_at,
                u.id AS user_id,
                MAX(CASE WHEN p.status = 'completed' THEN p.date END) AS last_completed_date,
                (SELECT amount FROM payments
                   WHERE student_id = s.id AND status = 'completed' AND deleted_at IS NULL
                   ORDER BY date DESC LIMIT 1) AS last_completed_amount,
                AVG(CASE WHEN p.status = 'completed' THEN p.amount ELSE NULL END) AS avg_amount
           FROM students s
           LEFT JOIN users u ON u.student_id = s.id AND u.role = 'student'
           LEFT JOIN payments p ON p.student_id = s.id AND p.deleted_at IS NULL
          WHERE s.deleted_at IS NULL AND s.is_active = 1${ownershipClause}
          GROUP BY s.id
          LIMIT ?`,
      );
      const bound = isAdmin
        ? stmt.bind(MAX_BULK_RECIPIENTS)
        : stmt.bind(auth.user.id, auth.user.id, MAX_BULK_RECIPIENTS);

      const { results } = await bound.all<OverdueRow>();
      const today = new Date();
      // Filter: only rows actually overdue in their own payment cycle with a linked user.
      targets = (results ?? []).filter((row) => {
        if (!row.user_id) return false;
        return getPaymentCycleStatus({
          lastCompletedDate: row.last_completed_date,
          joinDate: row.join_date,
          createdAt: row.created_at,
          referenceDate: today,
        }).isOverdue;
      });
    } else {
      const ids = Array.isArray(body.studentIds) ? body.studentIds.filter((v): v is string => typeof v === 'string' && v.length > 0) : [];
      if (ids.length === 0) {
        return jsonResponse({ error: 'studentIds is required when all is not true' }, 400);
      }
      if (ids.length > MAX_BULK_RECIPIENTS) {
        return jsonResponse({ error: `Cannot notify more than ${MAX_BULK_RECIPIENTS} students at once` }, 400);
      }

      // D1 has a 100-bound-parameter limit, so process in chunks of 50 ids.
      const chunkSize = 50;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        const placeholders = chunk.map(() => '?').join(',');
        const isAdmin = auth.user.role === 'admin';
        const ownershipClause = isAdmin
          ? ''
          : ' AND (s.created_by = ? OR s.instructor_id = ?)';

        const stmt = env.DB.prepare(
          `SELECT s.id, s.name, s.join_date, s.created_at,
                  u.id AS user_id,
            MAX(CASE WHEN p.status = 'completed' THEN p.date END) AS last_completed_date,
                  (SELECT amount FROM payments
                     WHERE student_id = s.id AND status = 'completed' AND deleted_at IS NULL
                     ORDER BY date DESC LIMIT 1) AS last_completed_amount,
            AVG(CASE WHEN p.status = 'completed' THEN p.amount ELSE NULL END) AS avg_amount
             FROM students s
             LEFT JOIN users u ON u.student_id = s.id AND u.role = 'student'
             LEFT JOIN payments p ON p.student_id = s.id AND p.deleted_at IS NULL
            WHERE s.deleted_at IS NULL AND s.id IN (${placeholders})${ownershipClause}
            GROUP BY s.id`,
        );
        const params: string[] = [...chunk];
        if (!isAdmin) {
          params.push(auth.user.id, auth.user.id);
        }
        const { results } = await stmt.bind(...params).all<OverdueRow>();
        targets.push(...(results ?? []));
      }
    }

    const isoNow = new Date().toISOString();
    const results: BulkResultEntry[] = [];
    let sentCount = 0;
    let skippedCount = 0;

    for (const row of targets) {
      if (!row.user_id) {
        results.push({
          studentId: row.id,
          status: 'skipped',
          reason: 'no_linked_user',
        });
        skippedCount++;
        continue;
      }

      const paymentCycle = getPaymentCycleStatus({
        lastCompletedDate: row.last_completed_date,
        joinDate: row.join_date,
        createdAt: row.created_at,
        referenceDate: new Date(isoNow),
      });
      if (!paymentCycle.isOverdue || !paymentCycle.dueDate) {
        results.push({
          studentId: row.id,
          status: 'skipped',
          reason: 'not_overdue',
        });
        skippedCount++;
        continue;
      }

      const paymentCycleMonthLabel = paymentCycle.dueDate.slice(0, 7);

      // Dedupe — already-pending unconfirmed reminder for same month?
      const existing = await withNotificationsTable(env.DB, () =>
        env.DB.prepare(
          `SELECT id FROM notifications
            WHERE user_id = ?
              AND action_type = 'payment_pending'
              AND requires_confirmation = 1
              AND confirmed_at IS NULL
              AND metadata LIKE ?
            LIMIT 1`,
        )
          .bind(row.user_id, `%"monthLabel":"${paymentCycleMonthLabel}"%`)
          .first<{ id: string }>(),
      );

      if (existing) {
        results.push({
          studentId: row.id,
          status: 'skipped',
          reason: 'already_pending',
          notificationId: existing.id,
        });
        skippedCount++;
        continue;
      }

      const expectedAmount = computeExpectedAmount(row);
      const daysOverdue = paymentCycle.daysOverdue;
      const message = `You have a pending monthly payment (${paymentCycleMonthLabel}). Amount: $${expectedAmount.toFixed(2)}. Days overdue: ${daysOverdue}.`;
      const metadata = JSON.stringify({
        kind: 'payment_pending',
        studentId: row.id,
        monthLabel: paymentCycleMonthLabel,
        dueDate: paymentCycle.dueDate,
        daysOverdue,
        expectedAmount,
        issuedBy: auth.user.id,
        issuedAt: isoNow,
        bulk: true,
      });
      const notificationId = crypto.randomUUID();

      try {
        await withNotificationsTable(env.DB, () =>
          env.DB.prepare(
            `INSERT INTO notifications (
                id, user_id, message, type, read, created_at,
                requires_confirmation, action_type, metadata,
                confirmation_notify_user_id
             ) VALUES (?, ?, ?, ?, 0, ?, 1, ?, ?, ?)`,
          )
            .bind(
              notificationId,
              row.user_id,
              message,
              'payment_pending',
              isoNow,
              'payment_pending',
              metadata,
              auth.user.id,
            )
            .run(),
        );
        results.push({
          studentId: row.id,
          status: 'sent',
          notificationId,
        });
        sentCount++;
      } catch (error) {
        results.push({
          studentId: row.id,
          status: 'error',
          reason: (error as Error).message,
        });
      }
    }

    return jsonResponse({
      success: true,
      monthLabel,
      total: targets.length,
      sent: sentCount,
      skipped: skippedCount,
      errors: results.filter((r) => r.status === 'error').length,
      results,
    });
  } catch (error) {
    console.error('Bulk notify-overdue error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}
