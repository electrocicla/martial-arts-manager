/**
 * Scheduled Handler for Cloudflare Pages
 * 
 * This handles scheduled cron triggers configured in wrangler.toml
 * Runs every hour to cleanup expired QR codes
 */

import { Env } from './types/index';
import { ensureNotificationsSchema } from './utils/notifications';

interface ExpiredQRCode {
  id: string;
  code: string;
  location: string;
  instructor_id: string;
  instructor_name: string;
  instructor_email: string;
  is_active: number;
  valid_until: string;
}

interface AdminRecord {
  id: string;
}

export async function onScheduled({ env }: { env: Env }) {
  try {
    console.log('Running scheduled QR code cleanup...');
    
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
      console.log('No expired QR codes found');
      return;
    }

    const deletedCount = expiredQRs.results.length;
    console.log(`Found ${deletedCount} expired QR codes to delete`);

    // Ensure notifications table exists
    await ensureNotificationsSchema(env.DB);

    // Delete each expired QR code and create notifications
    for (const qr of expiredQRs.results) {
      try {
        // Delete the QR code
        await env.DB.prepare(`
          DELETE FROM attendance_qr_codes WHERE id = ?
        `).bind(qr.id).run();

        // Create notification for the instructor
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

        console.log(`Deleted QR code ${qr.code} and notified instructor ${qr.instructor_name}`);
      } catch (error) {
        console.error(`Failed to delete QR code ${qr.id}:`, error);
      }
    }

    // Also notify all admins about the cleanup
    const admins = await env.DB.prepare(`
      SELECT id FROM users WHERE role = 'admin'
    `).all<AdminRecord>();

    if (admins.results && admins.results.length > 0) {
      for (const admin of admins.results) {
        const adminNotificationId = crypto.randomUUID();
        const adminMessage = `${deletedCount} expired QR code(s) have been automatically deleted.`;
        
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

    console.log(`QR cleanup completed: ${deletedCount} codes deleted`);
  } catch (error) {
    console.error('Scheduled QR cleanup error:', error);
  }
}
