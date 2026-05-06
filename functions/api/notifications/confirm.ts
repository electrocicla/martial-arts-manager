/**
 * POST /api/notifications/confirm
 *
 * Used by a recipient (typically a student) to confirm a notification that
 * requires explicit confirmation (e.g. an admin pending-payment reminder).
 *
 * On success:
 *   - Marks the notification confirmed_at and read=1.
 *   - Creates a follow-up notification for the original sender
 *     (confirmation_notify_user_id) so the admin/instructor knows the student
 *     saw and acknowledged the message.
 */

import type { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';
import {
  ensureNotificationsSchema,
  withNotificationsTable,
  type NotificationRecord,
} from '../../utils/notifications';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

interface ConfirmRequestBody {
  id?: string;
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

    await ensureNotificationsSchema(env.DB);

    const body = (await request.json().catch(() => ({}))) as ConfirmRequestBody;
    const notificationId = body.id;
    if (!notificationId) {
      return jsonResponse({ error: 'Notification id is required' }, 400);
    }

    const notification = await withNotificationsTable(env.DB, () =>
      env.DB.prepare(
        `SELECT id, user_id, message, type, read, created_at,
                requires_confirmation, confirmed_at, action_type, metadata,
                confirmation_notify_user_id
           FROM notifications WHERE id = ?`,
      )
        .bind(notificationId)
        .first<NotificationRecord>(),
    );

    if (!notification) {
      return jsonResponse({ error: 'Notification not found' }, 404);
    }

    if (notification.user_id !== auth.user.id) {
      return jsonResponse({ error: 'Access denied' }, 403);
    }

    if (notification.requires_confirmation !== 1) {
      return jsonResponse({ error: 'Notification does not require confirmation' }, 400);
    }

    if (notification.confirmed_at) {
      return jsonResponse({ success: true, alreadyConfirmed: true });
    }

    const confirmedAt = new Date().toISOString();

    await withNotificationsTable(env.DB, () =>
      env.DB.prepare(
        'UPDATE notifications SET confirmed_at = ?, read = 1 WHERE id = ?',
      )
        .bind(confirmedAt, notificationId)
        .run(),
    );

    // Notify the original sender (admin/instructor) that the student confirmed.
    const adminId = notification.confirmation_notify_user_id;
    if (adminId) {
      const followUpId = crypto.randomUUID();
      const followUpMessage = `${auth.user.name ?? 'Student'} confirmed the pending payment reminder`;
      const followUpMetadata = JSON.stringify({
        kind: 'payment_pending_confirmed',
        sourceNotificationId: notificationId,
        studentUserId: auth.user.id,
        studentName: auth.user.name ?? null,
        confirmedAt,
      });

      await withNotificationsTable(env.DB, () =>
        env.DB.prepare(
          `INSERT INTO notifications (
              id, user_id, message, type, read, created_at,
              requires_confirmation, action_type, metadata
           ) VALUES (?, ?, ?, ?, 0, ?, 0, ?, ?)`,
        )
          .bind(
            followUpId,
            adminId,
            followUpMessage,
            'payment_pending_confirmed',
            confirmedAt,
            'payment_pending_confirmed',
            followUpMetadata,
          )
          .run(),
      );
    }

    return jsonResponse({ success: true, confirmedAt });
  } catch (error) {
    console.error('Notification confirm error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
}
