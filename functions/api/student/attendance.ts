/**
 * Student Attendance API Endpoint
 * 
 * GET /api/student/attendance - Get student's attendance history and stats
 * 
 * This endpoint is specifically for students to view their own attendance records.
 */

import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';

interface AttendanceRecord {
  id: string;
  class_id: string;
  class_name: string;
  class_date: string;
  class_time: string;
  discipline: string;
  location: string;
  attended: number;
  check_in_time: string | null;
  check_in_method: string;
  created_at: string;
}

interface AttendanceStats {
  total_classes: number;
  attended: number;
  missed: number;
  attendance_rate: number;
  current_streak: number;
  best_streak: number;
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Only students can access this endpoint
    if (auth.user.role !== 'student') {
      return new Response(JSON.stringify({ error: 'This endpoint is for students only' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get student_id from user
    const studentId = auth.user.student_id;
    if (!studentId) {
      return new Response(JSON.stringify({ error: 'No student profile linked to this account' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch attendance records with class details
    const { results: records } = await env.DB.prepare(`
      SELECT 
        a.id,
        a.class_id,
        c.name as class_name,
        c.date as class_date,
        c.time as class_time,
        c.discipline,
        c.location,
        a.attended,
        a.check_in_time,
        COALESCE(a.check_in_method, 'manual') as check_in_method,
        a.created_at
      FROM attendance a
      INNER JOIN classes c ON a.class_id = c.id
      WHERE a.student_id = ?
      ORDER BY c.date DESC, c.time DESC
      LIMIT 100
    `).bind(studentId).all<AttendanceRecord>();

    // Calculate stats
    const totalClasses = records.length;
    const attendedCount = records.filter(r => r.attended === 1).length;
    const missedCount = totalClasses - attendedCount;
    const attendanceRate = totalClasses > 0 
      ? Math.round((attendedCount / totalClasses) * 100) 
      : 0;

    // Calculate streaks (current and best)
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Sort by date ascending for streak calculation
    const sortedRecords = [...records].sort((a, b) => 
      a.class_date.localeCompare(b.class_date) || a.class_time.localeCompare(b.class_time)
    );

    for (const record of sortedRecords) {
      if (record.attended === 1) {
        tempStreak++;
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    // Current streak is the streak from the most recent records
    currentStreak = 0;
    for (let i = records.length - 1; i >= 0; i--) {
      if (sortedRecords[i].attended === 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    const stats: AttendanceStats = {
      total_classes: totalClasses,
      attended: attendedCount,
      missed: missedCount,
      attendance_rate: attendanceRate,
      current_streak: currentStreak,
      best_streak: bestStreak
    };

    return new Response(JSON.stringify({ 
      records: records || [],
      stats 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Student attendance error:', error);
    return new Response(JSON.stringify({ 
      error: (error as Error).message || 'Failed to fetch attendance' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
