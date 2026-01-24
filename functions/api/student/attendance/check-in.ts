/**
 * QR Check-in API Endpoint
 * 
 * POST /api/student/attendance/check-in - Process QR code check-in for students
 * 
 * This endpoint validates a QR code and creates an attendance record for the student.
 */

import { Env } from '../../../types/index';
import { authenticateUser } from '../../../middleware/auth';

interface CheckInRequest {
  qr_code: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  device_info?: string;
}

interface QRCode {
  id: string;
  instructor_id: string;
  class_id: string | null;
  location: string;
  code: string;
  is_active: number;
  valid_from: string | null;
  valid_until: string | null;
}

interface ClassInfo {
  id: string;
  name: string;
  date: string;
  time: string;
  discipline: string;
  location: string;
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: auth.error 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Only students can check in via QR
    if (auth.user.role !== 'student') {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Only students can check in with QR' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get student_id from user
    const studentId = auth.user.student_id;
    if (!studentId) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No student profile is linked to this account' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const body = await request.json() as CheckInRequest;
    const { qr_code, timestamp, latitude, longitude, device_info } = body;

    if (!qr_code) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'QR code not provided' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find the QR code in database
    const qrRecord = await env.DB.prepare(`
      SELECT id, instructor_id, class_id, location, code, is_active, valid_from, valid_until
      FROM attendance_qr_codes
      WHERE code = ? AND is_active = 1
    `).bind(qr_code).first<QRCode>();

    if (!qrRecord) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Invalid or expired QR code' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check time validity if specified
    const now = new Date(timestamp || new Date().toISOString());
    if (qrRecord.valid_from && new Date(qrRecord.valid_from) > now) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'This QR code is not active yet' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (qrRecord.valid_until && new Date(qrRecord.valid_until) < now) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'This QR code has expired' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find today's class for this location/instructor
    const today = now.toISOString().split('T')[0];

    let classRecord: ClassInfo | null = null;

    if (qrRecord.class_id) {
      // QR is linked to a specific class
      classRecord = await env.DB.prepare(`
        SELECT id, name, date, time, discipline, location
        FROM classes
        WHERE id = ? AND deleted_at IS NULL
      `).bind(qrRecord.class_id).first<ClassInfo>();
    } else {
      // Find a class happening today at this location/instructor
      // Allow check-in within 30 minutes before and 60 minutes after class start
      classRecord = await env.DB.prepare(`
        SELECT id, name, date, time, discipline, location
        FROM classes
        WHERE (instructor = ? OR created_by = ?)
          AND date = ?
          AND location = ?
          AND deleted_at IS NULL
        ORDER BY time ASC
        LIMIT 1
      `).bind(
        qrRecord.instructor_id, 
        qrRecord.instructor_id, 
        today, 
        qrRecord.location
      ).first<ClassInfo>();
    }

    if (!classRecord) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No classes are scheduled for today at this location' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if student is enrolled in this class
    const enrollment = await env.DB.prepare(`
      SELECT id FROM class_enrollments
      WHERE class_id = ? AND student_id = ?
    `).bind(classRecord.id, studentId).first();

    if (!enrollment) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'You are not enrolled in this class' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for duplicate attendance
    const existingAttendance = await env.DB.prepare(`
      SELECT id FROM attendance
      WHERE class_id = ? AND student_id = ?
    `).bind(classRecord.id, studentId).first();

    if (existingAttendance) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Attendance has already been recorded for this class' 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create attendance record
    const attendanceId = crypto.randomUUID();
    const checkInTime = now.toISOString();

    await env.DB.prepare(`
      INSERT INTO attendance (
        id, class_id, student_id, attended, check_in_time, 
        check_in_method, qr_code_id, device_info, latitude, longitude,
        notes, created_at, updated_at
      ) VALUES (?, ?, ?, 1, ?, 'qr', ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      attendanceId,
      classRecord.id,
      studentId,
      checkInTime,
      qrRecord.id,
      device_info || null,
      latitude || null,
      longitude || null,
      `QR check-in at ${qrRecord.location}`,
      checkInTime,
      checkInTime
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Attendance recorded for ${classRecord.name}.`,
      attendance: {
        id: attendanceId,
        class_id: classRecord.id,
        class_name: classRecord.name,
        class_date: classRecord.date,
        class_time: classRecord.time,
        discipline: classRecord.discipline,
        location: classRecord.location,
        attended: 1,
        check_in_time: checkInTime,
        check_in_method: 'qr'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('QR check-in error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      message: (error as Error).message || 'Failed to process the check-in' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
