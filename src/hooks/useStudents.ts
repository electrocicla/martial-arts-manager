/**
 * useStudents Hook
 * Manages student data with proper separation of concerns
 * Follows SRP by focusing only on student data management
 */

import { useState, useEffect, useCallback } from 'react';
import { studentService, type StudentFilters, type StudentStats } from '../services';
import type { Student, StudentFormData } from '../types/index';
import { dispatchDataEvent, onDataEvent } from '../lib/dataEvents';

interface UseStudentsReturn {
  // Data
  students: Student[];
  stats: StudentStats | null;

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Error states
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  createStudent: (data: StudentFormData) => Promise<{ success: boolean; data?: Student; error?: string }>;
  updateStudent: (id: string, data: Partial<StudentFormData>) => Promise<Student | null>;
  deleteStudent: (id: string) => Promise<boolean>;
  filterStudents: (filters: StudentFilters) => Promise<void>;
  getStudentStats: () => Promise<StudentStats | null>;
}

export function useStudents(initialFilters?: StudentFilters): UseStudentsReturn {
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<StudentFilters | undefined>(initialFilters);

  const fetchStudents = useCallback(async (filters?: StudentFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await studentService.getAll(filters);
      if (response.success && response.data) {
        setStudents(response.data);
      } else {
        setError(response.error || 'Failed to fetch students');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchStudents(currentFilters);
  }, [fetchStudents, currentFilters]);

  const createStudent = useCallback(async (data: StudentFormData): Promise<{ success: boolean; data?: Student; error?: string }> => {
    try {
      setIsCreating(true);
      setError(null);

      const response = await studentService.create(data);
      if (response.success && response.data) {
        setStudents(prev => [...prev, response.data!]);
        dispatchDataEvent('students');
        return { success: true, data: response.data };
      } else {
        const errorMsg = response.error || 'Failed to create student';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateStudent = useCallback(async (id: string, data: Partial<StudentFormData>): Promise<Student | null> => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await studentService.update(id, data);
      if (response.success && response.data) {
        setStudents(prev => prev.map(student =>
          student.id === id ? response.data! : student
        ));
        dispatchDataEvent('students');
        return response.data;
      } else {
        setError(response.error || 'Failed to update student');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteStudent = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsDeleting(true);
      setError(null);

      const response = await studentService.delete(id);
      if (response.success) {
        setStudents(prev => prev.filter(student => student.id !== id));
        dispatchDataEvent('students');
        return true;
      } else {
        setError(response.error || 'Failed to delete student');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const filterStudents = useCallback(async (filters: StudentFilters) => {
    setCurrentFilters(filters);
    await fetchStudents(filters);
  }, [fetchStudents]);

  const getStudentStats = useCallback(async (): Promise<StudentStats | null> => {
    try {
      const response = await studentService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch student stats');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStudents(currentFilters);
  }, [fetchStudents, currentFilters]);

  // Refetch whenever another hook instance mutates students data
  useEffect(() => {
    return onDataEvent('students', () => fetchStudents(currentFilters));
  }, [fetchStudents, currentFilters]);

  return {
    students,
    stats,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    refresh,
    createStudent,
    updateStudent,
    deleteStudent,
    filterStudents,
    getStudentStats,
  };
}