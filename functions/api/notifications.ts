/**
 * Notifications API for Users
 * 
 * GET /api/notifications - List user's notifications
 * PUT /api/notifications?id=xxx - Mark notification as read
 * DELETE /api/notifications?id=xxx - Delete notification
 */

import { Env } from '../types/index';
import { authenticateUser } from '../middleware/auth';
import { NotificationRecord, ensureNotificationsSchema, withNotificationsTable } from '../utils/notifications';

interface NotificationOwnershipRecord {
  id: string;
  user_id: string;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS
  });
}

// GET - List user's notifications
export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return createJsonResponse({ error: auth.error }, 401);
    }

    await ensureNotificationsSchema(env.DB);

    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unread') === 'true';

    let query = `
      SELECT * FROM notifications
      WHERE user_id = ?
    `;
    
    if (unreadOnly) {
      query += ' AND read = 0';
    }
    
    query += ' ORDER BY created_at DESC LIMIT 50';

    const notifications = await withNotificationsTable(env.DB, async () => {
      const { results } = await env.DB.prepare(query)
        .bind(auth.user.id)
        .all<NotificationRecord>();

      return results ?? [];
    });

    return createJsonResponse({ notifications });

  } catch (error) {
    console.error('Notifications list error:', error);
    return createJsonResponse({ error: (error as Error).message }, 500);
  }
}

// PUT - Mark notification as read
export async function onRequestPut({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return createJsonResponse({ error: auth.error }, 401);
    }

    await ensureNotificationsSchema(env.DB);

    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');

    if (!notificationId) {
      return createJsonResponse({ error: 'Notification ID is required' }, 400);
    }

    // Verify ownership
    const notification = await withNotificationsTable(env.DB, () => env.DB.prepare(`
      SELECT id, user_id FROM notifications WHERE id = ?
    `).bind(notificationId).first<NotificationOwnershipRecord>());

    if (!notification) {
      return createJsonResponse({ error: 'Notification not found' }, 404);
    }

    if (notification.user_id !== auth.user.id) {
      return createJsonResponse({ error: 'Access denied' }, 403);
    }

    // Mark as read
    await withNotificationsTable(env.DB, () => env.DB.prepare(`
      UPDATE notifications SET read = 1 WHERE id = ?
    `).bind(notificationId).run());

    return createJsonResponse({ success: true });

  } catch (error) {
    console.error('Mark notification read error:', error);
    return createJsonResponse({ error: (error as Error).message }, 500);
  }
}

// DELETE - Delete notification
export async function onRequestDelete({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return createJsonResponse({ error: auth.error }, 401);
    }

    await ensureNotificationsSchema(env.DB);

    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');

    if (!notificationId) {
      return createJsonResponse({ error: 'Notification ID is required' }, 400);
    }

    // Verify ownership
    const notification = await withNotificationsTable(env.DB, () => env.DB.prepare(`
      SELECT id, user_id FROM notifications WHERE id = ?
    `).bind(notificationId).first<NotificationOwnershipRecord>());

    if (!notification) {
      return createJsonResponse({ error: 'Notification not found' }, 404);
    }

    if (notification.user_id !== auth.user.id) {
      return createJsonResponse({ error: 'Access denied' }, 403);
    }

    // Delete notification
    await withNotificationsTable(env.DB, () => env.DB.prepare(`
      DELETE FROM notifications WHERE id = ?
    `).bind(notificationId).run());

    return createJsonResponse({ success: true });

  } catch (error) {
    console.error('Delete notification error:', error);
    return createJsonResponse({ error: (error as Error).message }, 500);
  }
}
