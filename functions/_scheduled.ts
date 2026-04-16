/**
 * Scheduled Handler for Cloudflare Pages
 * 
 * This handles scheduled cron triggers configured in wrangler.toml
 * Runs every hour to cleanup expired QR codes
 */

import { Env } from './types/index';
import { ensureNotificationsSchema } from './utils/notifications';
import { deleteExpiredSessions, cleanupExpiredQRCodes } from './utils/db';

interface AdminRecord {
  id: string;
}

export async function onScheduled({ env }: { env: Env }) {
  try {
    console.log('Running scheduled QR code cleanup...');
    
    const now = new Date().toISOString();

    // Clean up expired sessions
    try {
      await deleteExpiredSessions(env.DB);
      console.log('Expired sessions cleaned up');
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
    
    // Cleanup expired QR codes using shared utility
    const { deletedCount, deletedQRs } = await cleanupExpiredQRCodes(env.DB);

    if (deletedCount === 0) {
      console.log('No expired QR codes found');
      return;
    }

    console.log(`Found ${deletedCount} expired QR codes to soft-delete`);

    // Ensure notifications table exists
    await ensureNotificationsSchema(env.DB);

    // Create notifications for each instructor
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

        console.log(`Notified instructor ${qr.instructor_name} about expired QR code ${qr.code}`);
      } catch (error) {
        console.error(`Failed to notify about QR code ${qr.code}:`, error);
      }
    }

    // Also notify all admins about the cleanup
    const admins = await env.DB.prepare(`
      SELECT id FROM users WHERE role = 'admin'
    `).all<AdminRecord>();

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
        } catch (error) {
          console.error('Failed to create admin notification:', error);
        }
      }
    }

    console.log(`QR cleanup completed: ${deletedCount} codes soft-deleted`);
  } catch (error) {
    console.error('Scheduled QR cleanup error:', error);
  }
}
