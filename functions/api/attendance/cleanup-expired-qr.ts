/**
 * Scheduled Worker - Cleanup Expired QR Codes
 * 
 * This endpoint is meant to be called by Cloudflare Cron Triggers
 * to automatically delete expired QR codes and notify admins.
 * 
 * Configure in wrangler.toml:
 * [triggers]
 * crons = ["0 * * * *"]  # Run every hour
 */

import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';
import { ensureNotificationsSchema } from '../../utils/notifications';
import { cleanupExpiredQRCodes } from '../../utils/db';
import { errorResponse } from '../../utils/response';

/**
 * Scheduled handler - called by Cloudflare Cron Triggers
 * Now requires admin authentication when called directly via HTTP
 */
export async function onRequest({ env, request }: { env: Env; request: Request }) {
  try {
    // Require admin auth for HTTP requests
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (auth.user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date().toISOString();
    
    // Cleanup expired QR codes using shared utility
    const { deletedCount, deletedQRs } = await cleanupExpiredQRCodes(env.DB);

    if (deletedCount === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        deleted: 0,
        message: 'No expired QR codes found'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Ensure notifications table exists
    await ensureNotificationsSchema(env.DB);

    // Create notifications for each instructor
    let notificationsCount = 0;
    for (const qr of deletedQRs) {
      try {
        const notificationId = crypto.randomUUID();
        const message = `QR code "${qr.code}" for location "${qr.location}" has expired and been automatically deleted.`;
        
        await env.DB.prepare(`
          INSERT INTO notifications (id, user_id, message, type, read, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          notificationId,
          qr.instructor_id,
          message,
          'qr_expired',
          0,
          now
        ).run();
        notificationsCount++;
      } catch (error) {
        console.error('Failed to create notification:', error);
      }
    }

    // Also notify all admins about the cleanup
    const admins = await env.DB.prepare(`
      SELECT id FROM users WHERE role = 'admin'
    `).all<{ id: string }>();

    if (admins.results && admins.results.length > 0) {
      for (const admin of admins.results) {
        const adminNotificationId = crypto.randomUUID();
        const adminMessage = `${deletedCount} expired QR code(s) have been automatically soft-deleted.`;
        
        try {
          await env.DB.prepare(`
            INSERT INTO notifications (id, user_id, message, type, read, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            adminNotificationId,
            admin.id,
            adminMessage,
            'qr_expired',
            0,
            now
          ).run();
          notificationsCount++;
        } catch (error) {
          console.error('Failed to create admin notification:', error);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      deleted: deletedCount,
      qr_codes: deletedQRs.map(qr => ({
        code: qr.code,
        location: qr.location,
        expired_at: qr.valid_until
      })),
      notifications_created: notificationsCount
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('QR cleanup error:', error);
    return errorResponse((error as Error).message, 500);
  }
}
