/**
 * Notifications API for Users
 * 
 * GET /api/notifications - List user's notifications
 * PUT /api/notifications?id=xxx - Mark notification as read
 * DELETE /api/notifications?id=xxx - Delete notification
 */

import { Env } from '../types/index';
import { authenticateUser } from '../middleware/auth';

interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: string;
  read: number;
  created_at: string;
}

// GET - List user's notifications
export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    const { results } = await env.DB.prepare(query)
      .bind(auth.user.id)
      .all<Notification>();

    return new Response(JSON.stringify({ 
      notifications: results || [] 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Notifications list error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// PUT - Mark notification as read
export async function onRequestPut({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');

    if (!notificationId) {
      return new Response(JSON.stringify({ error: 'Notification ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify ownership
    const notification = await env.DB.prepare(`
      SELECT id, user_id FROM notifications WHERE id = ?
    `).bind(notificationId).first<{ id: string; user_id: string }>();

    if (!notification) {
      return new Response(JSON.stringify({ error: 'Notification not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (notification.user_id !== auth.user.id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mark as read
    await env.DB.prepare(`
      UPDATE notifications SET read = 1 WHERE id = ?
    `).bind(notificationId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE - Delete notification
export async function onRequestDelete({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');

    if (!notificationId) {
      return new Response(JSON.stringify({ error: 'Notification ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify ownership
    const notification = await env.DB.prepare(`
      SELECT id, user_id FROM notifications WHERE id = ?
    `).bind(notificationId).first<{ id: string; user_id: string }>();

    if (!notification) {
      return new Response(JSON.stringify({ error: 'Notification not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (notification.user_id !== auth.user.id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete notification
    await env.DB.prepare(`
      DELETE FROM notifications WHERE id = ?
    `).bind(notificationId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
