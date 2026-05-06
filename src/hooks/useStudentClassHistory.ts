/**
 * useStudentClassHistory
 *
 * Combines the student's enrolled classes and attendance records to produce a
 * unified class history with computed status (attended / missed / upcoming /
 * today / no_record) plus aggregate counters. Single source of truth for the
 * `/my-classes` page.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import { onDataEvent } from '../lib/dataEvents';

export type ClassHistoryStatus =
  | 'attended'
  | 'missed'
  | 'today'
  | 'upcoming'
  | 'no_record';

export interface StudentClassEntry {
  classId: string;
  name: string;
  discipline: string | null;
  date: string;
  time: string;
  location: string | null;
  description: string | null;
  instructor: string | null;
  instructorId: string | null;
  isRecurring: boolean;
  status: ClassHistoryStatus;
  /** Attendance record id when one exists. */
  attendanceId: string | null;
  /** Check-in time when the student attended. */
  checkInTime: string | null;
  /** How the check-in was registered (qr, manual, ...). */
  checkInMethod: string | null;
}

export interface StudentClassHistoryStats {
  totalPast: number;
  attended: number;
  missed: number;
  upcoming: number;
  attendanceRate: number;
  currentStreak: number;
  bestStreak: number;
}

interface RawEnrolledClass {
  id: string;
  name: string;
  discipline?: string | null;
  date: string;
  time: string;
  location?: string | null;
  description?: string | null;
  instructor?: string | null;
  instructor_id?: string | null;
  is_recurring?: number | boolean;
}

interface RawAttendanceRecord {
  id: string;
  class_id: string;
  attended: 0 | 1 | boolean;
  check_in_time: string | null;
  check_in_method: string | null;
}

interface RawAttendancePayload {
  records: RawAttendanceRecord[];
  stats?: {
    current_streak?: number;
    best_streak?: number;
  };
}

function todayIsoLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function compareDateTime(a: StudentClassEntry, b: StudentClassEntry): number {
  const cmp = b.date.localeCompare(a.date);
  if (cmp !== 0) return cmp;
  return (b.time ?? '').localeCompare(a.time ?? '');
}

function deriveStatus(
  classDate: string,
  attendance: RawAttendanceRecord | undefined,
  today: string,
): ClassHistoryStatus {
  if (classDate === today) return 'today';
  if (classDate > today) return 'upcoming';
  if (!attendance) return 'no_record';
  const attended = attendance.attended === 1 || attendance.attended === true;
  return attended ? 'attended' : 'missed';
}

export function useStudentClassHistory(): {
  classes: StudentClassEntry[];
  stats: StudentClassHistoryStats;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const { user, accessToken } = useAuth();
  const [enrolled, setEnrolled] = useState<RawEnrolledClass[]>([]);
  const [attendancePayload, setAttendancePayload] = useState<RawAttendancePayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async (signal?: AbortSignal) => {
    if (!user || !user.student_id || !accessToken) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const [classesRes, attendanceRes] = await Promise.all([
        apiClient.get<RawEnrolledClass[]>('/api/student/classes', { signal }),
        apiClient.get<RawAttendancePayload>('/api/student/attendance', { signal }),
      ]);
      if (signal?.aborted) return;
      if (!classesRes.success) throw new Error(classesRes.error ?? 'Failed to fetch classes');
      if (!attendanceRes.success) throw new Error(attendanceRes.error ?? 'Failed to fetch attendance');
      setEnrolled(Array.isArray(classesRes.data) ? classesRes.data : []);
      setAttendancePayload(attendanceRes.data ?? { records: [] });
    } catch (err) {
      if (signal?.aborted) return;
      setError((err as Error).message);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [user, accessToken]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchAll(controller.signal);
    return () => controller.abort();
  }, [fetchAll]);

  useEffect(() => {
    return onDataEvent(['attendance', 'classes'], () => {
      void fetchAll();
    });
  }, [fetchAll]);

  const { classes, stats } = useMemo(() => {
    const today = todayIsoLocal();
    const recordsByClassId = new Map<string, RawAttendanceRecord>();
    for (const record of attendancePayload?.records ?? []) {
      // Keep latest per class (records already ordered by date desc upstream).
      if (!recordsByClassId.has(record.class_id)) {
        recordsByClassId.set(record.class_id, record);
      }
    }

    const merged: StudentClassEntry[] = enrolled.map((c) => {
      const att = recordsByClassId.get(c.id);
      return {
        classId: c.id,
        name: c.name,
        discipline: c.discipline ?? null,
        date: c.date,
        time: c.time,
        location: c.location ?? null,
        description: c.description ?? null,
        instructor: c.instructor ?? null,
        instructorId: c.instructor_id ?? null,
        isRecurring: Boolean(c.is_recurring),
        status: deriveStatus(c.date, att, today),
        attendanceId: att?.id ?? null,
        checkInTime: att?.check_in_time ?? null,
        checkInMethod: att?.check_in_method ?? null,
      } satisfies StudentClassEntry;
    });

    merged.sort(compareDateTime);

    const past = merged.filter((c) => c.date < today);
    const attended = merged.filter((c) => c.status === 'attended').length;
    const missed = merged.filter((c) => c.status === 'missed' || c.status === 'no_record').length;
    const upcoming = merged.filter((c) => c.status === 'upcoming' || c.status === 'today').length;
    const totalPast = past.length;
    const attendanceRate = totalPast > 0 ? Math.round((attended / totalPast) * 100) : 0;

    return {
      classes: merged,
      stats: {
        totalPast,
        attended,
        missed,
        upcoming,
        attendanceRate,
        currentStreak: attendancePayload?.stats?.current_streak ?? 0,
        bestStreak: attendancePayload?.stats?.best_streak ?? 0,
      } satisfies StudentClassHistoryStats,
    };
  }, [enrolled, attendancePayload]);

  return {
    classes,
    stats,
    isLoading,
    error,
    refresh: () => fetchAll(),
  };
}

export default useStudentClassHistory;
