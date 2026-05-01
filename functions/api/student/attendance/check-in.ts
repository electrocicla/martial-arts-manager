/**
 * QR Check-in API Endpoint
 * 
 * POST /api/student/attendance/check-in - Process QR code check-in for students
 * 
 * This endpoint validates a QR code and creates an attendance record for the student.
 */

import { Env } from '../../../types/index';
import { authenticateUser } from '../../../middleware/auth';
import { errorResponse } from '../../../utils/response';

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
  deleted_at: string | null;
}

interface ClassInfo {
  id: string;
  name: string;
  date: string;
  time: string;
  discipline: string;
  location: string;
  parent_course_id?: string | null;
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return errorResponse(auth.error || 'Authentication required', 401);
    }

    // Only students can check in via QR
    if (auth.user.role !== 'student') {
      return errorResponse('Only students can check in with QR', 403);
    }

    // Get student_id from user
    const studentId = auth.user.student_id;
    if (!studentId) {
      return errorResponse('No student profile is linked to this account', 404);
    }

    // Parse request body
    const body = await request.json() as CheckInRequest;
    const { qr_code, timestamp, latitude, longitude, device_info } = body;

    if (!qr_code) {
      return errorResponse('QR code not provided', 400);
    }

    // Find the QR code in database
    const qrRecord = await env.DB.prepare(`
      SELECT id, instructor_id, class_id, location, code, is_active, valid_from, valid_until
      FROM attendance_qr_codes
      WHERE code = ?
        AND is_active = 1
        AND deleted_at IS NULL
    `).bind(qr_code).first<QRCode>();

    if (!qrRecord) {
      return errorResponse('Invalid or expired QR code', 404);
    }

    // Check time validity if specified
    const now = new Date(timestamp || new Date().toISOString());
    if (qrRecord.valid_from && new Date(qrRecord.valid_from) > now) {
      return errorResponse('This QR code is not active yet', 400);
    }
    if (qrRecord.valid_until && new Date(qrRecord.valid_until) < now) {
      return errorResponse('This QR code has expired', 400);
    }

    // Find today's class for this location/instructor
    const today = now.toISOString().split('T')[0];

    let classRecord: ClassInfo | null = null;

    if (qrRecord.class_id) {
      // QR is linked to a specific class
      classRecord = await env.DB.prepare(`
        SELECT id, name, date, time, discipline, location, parent_course_id
        FROM classes
        WHERE id = ? AND deleted_at IS NULL
      `).bind(qrRecord.class_id).first<ClassInfo>();
    } else {
      // Find a class happening today at this location/instructor
      // Allow check-in within 30 minutes before and 60 minutes after class start
      classRecord = await env.DB.prepare(`
        SELECT id, name, date, time, discipline, location, parent_course_id
        FROM classes
        WHERE (instructor_id = ? OR created_by = ?)
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
      return errorResponse('No classes are scheduled for today at this location', 404);
    }

    // Check if student is enrolled in this class
    const enrollment = await env.DB.prepare(`
      SELECT id FROM class_enrollments
      WHERE student_id = ?
        AND enrollment_status = 'active'
        AND (class_id = ? OR (? IS NOT NULL AND class_id = ?))
    `).bind(studentId, classRecord.id, classRecord.parent_course_id ?? null, classRecord.parent_course_id ?? null).first();

    if (!enrollment) {
      return errorResponse('You are not enrolled in this class', 403);
    }

    // Check for duplicate attendance
    const existingAttendance = await env.DB.prepare(`
      SELECT id FROM attendance
      WHERE class_id = ? AND student_id = ?
    `).bind(classRecord.id, studentId).first();

    if (existingAttendance) {
      return errorResponse('Attendance has already been recorded for this class', 409);
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
    return errorResponse((error as Error).message || 'Failed to process the check-in', 500);
  }
}
