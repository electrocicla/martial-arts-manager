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
import { ensureNotificationsSchema } from '../../utils/notifications';

interface ExpiredQRCode {
  id: string;
  location: string;
  code: string;
  instructor_id: string;
  instructor_name: string;
  valid_until: string;
}

interface QRNotification {
  id: string;
  user_id: string;
  message: string;
  type: 'qr_expired';
  read: number;
  created_at: string;
}

/**
 * Scheduled handler - called by Cloudflare Cron Triggers
 */
export async function onRequest({ env }: { env: Env }) {
  try {
    const now = new Date().toISOString();
    
    // Find all expired QR codes
    const expiredQRs = await env.DB.prepare(`
      SELECT qr.*, u.name as instructor_name, u.email as instructor_email
      FROM attendance_qr_codes qr
      LEFT JOIN users u ON qr.instructor_id = u.id
      WHERE qr.is_active = 1
        AND qr.valid_until IS NOT NULL
        AND qr.valid_until < ?
    `).bind(now).all<ExpiredQRCode>();

    if (!expiredQRs.results || expiredQRs.results.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        deleted: 0,
        message: 'No expired QR codes found'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const deletedQRs: ExpiredQRCode[] = [];
    const notificationsToCreate: QRNotification[] = [];

    // Delete each expired QR code and prepare notifications
    for (const qr of expiredQRs.results) {
      try {
        // Delete the QR code
        await env.DB.prepare(`
          DELETE FROM attendance_qr_codes WHERE id = ?
        `).bind(qr.id).run();

        deletedQRs.push(qr);

        // Prepare notification for the instructor
        const notificationId = crypto.randomUUID();
        const message = `QR code "${qr.code}" for location "${qr.location}" has expired and been automatically deleted.`;
        
        notificationsToCreate.push({
          id: notificationId,
          user_id: qr.instructor_id,
          message,
          type: 'qr_expired',
          read: 0,
          created_at: now
        });

      } catch (error) {
        console.error(`Failed to delete QR code ${qr.id}:`, error);
      }
    }

    // Ensure notifications table exists
    await ensureNotificationsSchema(env.DB);

    // Insert all notifications
    for (const notification of notificationsToCreate) {
      try {
        await env.DB.prepare(`
          INSERT INTO notifications (id, user_id, message, type, read, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          notification.id,
          notification.user_id,
          notification.message,
          notification.type,
          notification.read,
          notification.created_at
        ).run();
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
        const adminMessage = `${deletedQRs.length} expired QR code(s) have been automatically deleted.`;
        
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
        } catch (error) {
          console.error('Failed to create admin notification:', error);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      deleted: deletedQRs.length,
      qr_codes: deletedQRs.map(qr => ({
        code: qr.code,
        location: qr.location,
        expired_at: qr.valid_until
      })),
      notifications_created: notificationsToCreate.length + (admins.results?.length || 0)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('QR cleanup error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
