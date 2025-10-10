/**
 * useAttendance Hook
 * Manages attendance data with proper separation of concerns
 * Follows SRP by focusing only on attendance data management
 */

import { useState, useEffect, useCallback } from 'react';
import { attendanceService, type AttendanceFilters, type AttendanceStats, type AttendanceRecord } from '../services';
import type { Attendance, AttendanceFormData } from '../types/index';

interface UseAttendanceReturn {
  // Data
  attendance: Attendance[];
  stats: AttendanceStats | null;
  todayAttendance: Attendance[];

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Error states
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  createAttendance: (data: AttendanceFormData) => Promise<Attendance | null>;
  updateAttendance: (id: string, data: Partial<AttendanceFormData>) => Promise<Attendance | null>;
  deleteAttendance: (id: string) => Promise<boolean>;
  filterAttendance: (filters: AttendanceFilters) => Promise<void>;
  getAttendanceStats: () => Promise<AttendanceStats | null>;
  getTodayAttendance: () => Promise<Attendance[]>;
  markPresent: (studentId: string, classId: string) => Promise<Attendance | null>;
  markAbsent: (studentId: string, classId: string) => Promise<Attendance | null>;
}

export function useAttendance(initialFilters?: AttendanceFilters): UseAttendanceReturn {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<AttendanceFilters | undefined>(initialFilters);

  const fetchAttendance = useCallback(async (filters?: AttendanceFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await attendanceService.getAll(filters);
      if (response.success && response.data) {
        setAttendance(response.data);
      } else {
        setError(response.error || 'Failed to fetch attendance');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchAttendance(currentFilters);
  }, [fetchAttendance, currentFilters]);

  const createAttendance = useCallback(async (data: AttendanceFormData): Promise<Attendance | null> => {
    try {
      setIsCreating(true);
      setError(null);

      // Convert AttendanceFormData to AttendanceRecord
      const record: AttendanceRecord = {
        classId: data.classId,
        studentId: data.studentId,
        attended: data.status === 'present' || data.status === 'late', // Consider 'late' as attended
        notes: data.notes,
      };

      const response = await attendanceService.create(record);
      if (response.success && response.data) {
        setAttendance(prev => [...prev, response.data!]);
        return response.data;
      } else {
        setError(response.error || 'Failed to create attendance record');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateAttendance = useCallback(async (id: string, data: Partial<AttendanceFormData>): Promise<Attendance | null> => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await attendanceService.update(id, data);
      if (response.success && response.data) {
        setAttendance(prev => prev.map(att =>
          att.id === id ? response.data! : att
        ));
        return response.data;
      } else {
        setError(response.error || 'Failed to update attendance record');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteAttendance = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsDeleting(true);
      setError(null);

      const response = await attendanceService.delete(id);
      if (response.success) {
        setAttendance(prev => prev.filter(att => att.id !== id));
        return true;
      } else {
        setError(response.error || 'Failed to delete attendance record');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const filterAttendance = useCallback(async (filters: AttendanceFilters) => {
    setCurrentFilters(filters);
    await fetchAttendance(filters);
  }, [fetchAttendance]);

  const getAttendanceStats = useCallback(async (): Promise<AttendanceStats | null> => {
    try {
      const response = await attendanceService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch attendance stats');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    }
  }, []);

  const getTodayAttendance = useCallback(async (): Promise<Attendance[]> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await attendanceService.getAll({ date: today });
      if (response.success && response.data) {
        setTodayAttendance(response.data);
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch today\'s attendance');
        return [];
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return [];
    }
  }, []);

  const markPresent = useCallback(async (studentId: string, classId: string): Promise<Attendance | null> => {
    try {
      setIsCreating(true);
      setError(null);

      const response = await attendanceService.markPresent(studentId, classId);
      if (response.success && response.data) {
        setAttendance(prev => [...prev, response.data!]);
        return response.data;
      } else {
        setError(response.error || 'Failed to mark student as present');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const markAbsent = useCallback(async (studentId: string, classId: string): Promise<Attendance | null> => {
    try {
      setIsCreating(true);
      setError(null);

      const response = await attendanceService.markAbsent(studentId, classId);
      if (response.success && response.data) {
        setAttendance(prev => [...prev, response.data!]);
        return response.data;
      } else {
        setError(response.error || 'Failed to mark student as absent');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAttendance(currentFilters);
  }, [fetchAttendance, currentFilters]);

  return {
    attendance,
    stats,
    todayAttendance,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    refresh,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    filterAttendance,
    getAttendanceStats,
    getTodayAttendance,
    markPresent,
    markAbsent,
  };
}