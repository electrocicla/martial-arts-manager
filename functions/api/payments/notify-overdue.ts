/**
 * POST /api/payments/notify-overdue
 *
 * Admin/instructor action that creates a forced-confirmation notification for
 * a student informing them about their pending monthly payment. The student
 * must press "Confirm" inside the app for the notification to be cleared.
 * When that happens, an acknowledgement notification is sent back to the
 * sender (see `functions/api/notifications/confirm.ts`).
 *
 * Body: { studentId: string; daysOverdue?: number; expectedAmount?: number }
 */

import type { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';
import {
  ensureNotificationsSchema,
  withNotificationsTable,
} from '../../utils/notifications';
import {
  branchErrorResponse,
  resolveRequestBranchId,
} from '../../utils/branches';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

interface NotifyOverdueBody {
  studentId?: string;
  daysOverdue?: number;
  expectedAmount?: number;
  monthLabel?: string;
}

interface StudentRecord {
  id: string;
  name: string;
  user_id: string | null;
  created_by: string | null;
  instructor_id: string | null;
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
    const branchId = await resolveRequestBranchId(request, env, auth.user);

    await ensureNotificationsSchema(env.DB);

    const body = (await request.json().catch(() => ({}))) as NotifyOverdueBody;
    const studentId = body.studentId;
    if (!studentId) {
      return jsonResponse({ error: 'studentId is required' }, 400);
    }

    const student = await env.DB
      .prepare(
        `SELECT s.id, s.name, s.created_by, s.instructor_id, u.id AS user_id
           FROM students s
           LEFT JOIN users u ON u.student_id = s.id AND u.role = 'student'
          WHERE s.id = ? AND s.branch_id = ? AND s.deleted_at IS NULL`,
      )
      .bind(studentId, branchId)
      .first<StudentRecord>();

    if (!student) {
      return jsonResponse({ error: 'Student not found' }, 404);
    }

    if (
      auth.user.role !== 'admin' &&
      student.created_by !== auth.user.id &&
      student.instructor_id !== auth.user.id
    ) {
      return jsonResponse({ error: 'Access denied for this student' }, 403);
    }

    if (!student.user_id) {
      return jsonResponse(
        { error: 'Student does not have a linked user account to receive notifications' },
        409,
      );
    }

    const now = new Date();
    const isoNow = now.toISOString();
    const daysOverdue = Number.isFinite(body.daysOverdue) ? Math.max(0, Number(body.daysOverdue)) : 0;
    const expectedAmount = Number.isFinite(body.expectedAmount) && Number(body.expectedAmount) > 0
      ? Number(body.expectedAmount)
      : null;
    const monthLabel = typeof body.monthLabel === 'string' && body.monthLabel.length > 0
      ? body.monthLabel
      : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

    // Prevent duplicate reminders: if an unconfirmed payment_pending
    // notification already exists for this student/month combination, refuse
    // to create another so admins can't spam students.
    const existing = await withNotificationsTable(env.DB, () =>
      env.DB
        .prepare(
          `SELECT id FROM notifications
            WHERE user_id = ?
              AND action_type = 'payment_pending'
              AND requires_confirmation = 1
              AND confirmed_at IS NULL
              AND metadata LIKE ?
            LIMIT 1`,
        )
        .bind(student.user_id, `%"monthLabel":"${monthLabel}"%`)
        .first<{ id: string }>(),
    );

    if (existing) {
      return jsonResponse(
        {
          error: 'A pending payment reminder for this month is already awaiting the student\'s confirmation.',
          existingNotificationId: existing.id,
          alreadyPending: true,
        },
        409,
      );
    }

    const message = expectedAmount
      ? `You have a pending monthly payment (${monthLabel}). Amount: $${expectedAmount.toFixed(2)}. Days overdue: ${daysOverdue}.`
      : `You have a pending monthly payment (${monthLabel}). Days overdue: ${daysOverdue}.`;

    const metadata = JSON.stringify({
      kind: 'payment_pending',
      studentId: student.id,
      monthLabel,
      daysOverdue,
      expectedAmount,
      issuedBy: auth.user.id,
      issuedAt: isoNow,
      branchId,
    });

    const notificationId = crypto.randomUUID();

    await withNotificationsTable(env.DB, () =>
      env.DB
        .prepare(
          `INSERT INTO notifications (
              id, user_id, message, type, read, created_at,
              requires_confirmation, action_type, metadata,
              confirmation_notify_user_id
           ) VALUES (?, ?, ?, ?, 0, ?, 1, ?, ?, ?)`,
        )
        .bind(
          notificationId,
          student.user_id,
          message,
          'payment_pending',
          isoNow,
          'payment_pending',
          metadata,
          auth.user.id,
        )
        .run(),
    );

    return jsonResponse({ success: true, notificationId });
  } catch (error) {
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;
    console.error('Notify overdue error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}
