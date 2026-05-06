/**
 * useOverdueStudents Hook
 *
 * Loads the list of students with pending monthly payments and exposes a
 * helper to send the forced-confirmation reminder notification. Follows SRP
 * by isolating data-fetching/mutation from presentation.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  paymentService,
  type OverdueStudentsResponse,
  type NotifyOverduePayload,
} from '../services';
import { onDataEvent } from '../lib/dataEvents';

interface UseOverdueStudentsReturn {
  data: OverdueStudentsResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  notifyStudent: (payload: NotifyOverduePayload) => Promise<{ success: boolean; error?: string }>;
  pendingNotifications: Set<string>;
}

export function useOverdueStudents(): UseOverdueStudentsReturn {
  const [data, setData] = useState<OverdueStudentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingNotifications, setPendingNotifications] = useState<Set<string>>(() => new Set());

  const fetchOverdue = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await paymentService.getOverdueStudents();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Failed to load overdue students');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error loading overdue students');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOverdue();
  }, [fetchOverdue]);

  useEffect(() => {
    return onDataEvent('payments', () => {
      void fetchOverdue();
    });
  }, [fetchOverdue]);

  const notifyStudent = useCallback(
    async (payload: NotifyOverduePayload): Promise<{ success: boolean; error?: string }> => {
      setPendingNotifications((prev) => {
        const next = new Set(prev);
        next.add(payload.studentId);
        return next;
      });
      try {
        const response = await paymentService.notifyOverdueStudent(payload);
        if (response.success) {
          return { success: true };
        }
        return { success: false, error: response.error };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to send notification',
        };
      } finally {
        setPendingNotifications((prev) => {
          const next = new Set(prev);
          next.delete(payload.studentId);
          return next;
        });
      }
    },
    [],
  );

  return {
    data,
    isLoading,
    error,
    refresh: fetchOverdue,
    notifyStudent,
    pendingNotifications,
  };
}
