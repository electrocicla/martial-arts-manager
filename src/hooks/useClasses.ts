/**
 * useClasses Hook
 * Manages class data with proper separation of concerns
 * Follows SRP by focusing only on class data management
 */

import { useState, useEffect, useCallback } from 'react';
import { classService, type ClassFilters, type ClassStats } from '../services';
import type { Class, ClassFormData } from '../types/index';

interface UseClassesReturn {
  // Data
  classes: Class[];
  stats: ClassStats | null;
  upcomingClasses: Class[];

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Error states
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  createClass: (data: ClassFormData) => Promise<Class | null>;
  updateClass: (id: string, data: Partial<ClassFormData>) => Promise<Class | null>;
  deleteClass: (id: string) => Promise<boolean>;
  filterClasses: (filters: ClassFilters) => Promise<void>;
  getClassStats: () => Promise<ClassStats | null>;
  getUpcomingClasses: (limit?: number) => Promise<Class[]>;
}

export function useClasses(initialFilters?: ClassFilters): UseClassesReturn {
  const [classes, setClasses] = useState<Class[]>([]);
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<ClassFilters | undefined>(initialFilters);

  const fetchClasses = useCallback(async (filters?: ClassFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await classService.getAll(filters);
      if (response.success && response.data) {
        setClasses(response.data);
      } else {
        setError(response.error || 'Failed to fetch classes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchClasses(currentFilters);
  }, [fetchClasses, currentFilters]);

  const createClass = useCallback(async (data: ClassFormData): Promise<Class | null> => {
    try {
      setIsCreating(true);
      setError(null);

      // If this is a recurring creation, attach a parentCourseId so server can be idempotent
      type PayloadWithParent = ClassFormData & { parentCourseId?: string };
      const payload: PayloadWithParent = { ...data } as PayloadWithParent;
      if (data.isRecurring) {
        payload.parentCourseId = payload.parentCourseId || crypto.randomUUID();
      }

      const response = await classService.create(payload);
      if (response.success && response.data) {
        setClasses(prev => [...prev, response.data!]);
        return response.data;
      } else {
        setError(response.error || 'Failed to create class');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateClass = useCallback(async (id: string, data: Partial<ClassFormData>): Promise<Class | null> => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await classService.update(id, data);
      if (response.success && response.data) {
        setClasses(prev => prev.map(cls =>
          cls.id === id ? response.data! : cls
        ));
        return response.data;
      } else {
        setError(response.error || 'Failed to update class');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteClass = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsDeleting(true);
      setError(null);

      const response = await classService.delete(id);
      if (response.success) {
        setClasses(prev => prev.filter(cls => cls.id !== id));
        return true;
      } else {
        setError(response.error || 'Failed to delete class');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const filterClasses = useCallback(async (filters: ClassFilters) => {
    setCurrentFilters(filters);
    await fetchClasses(filters);
  }, [fetchClasses]);

  const getClassStats = useCallback(async (): Promise<ClassStats | null> => {
    try {
      const response = await classService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch class stats');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    }
  }, []);

  const getUpcomingClasses = useCallback(async (limit = 10): Promise<Class[]> => {
    try {
      const response = await classService.getUpcoming(limit);
      if (response.success && response.data) {
        setUpcomingClasses(response.data);
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch upcoming classes');
        return [];
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return [];
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchClasses(currentFilters);
  }, [fetchClasses, currentFilters]);

  return {
    classes,
    stats,
    upcomingClasses,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    refresh,
    createClass,
    updateClass,
    deleteClass,
    filterClasses,
    getClassStats,
    getUpcomingClasses,
  };
}