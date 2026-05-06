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
  type NotifyOverdueBulkPayload,
  type NotifyOverdueBulkResponse,
} from '../services';
import { onDataEvent } from '../lib/dataEvents';

interface UseOverdueStudentsReturn {
  data: OverdueStudentsResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  notifyStudent: (payload: NotifyOverduePayload) => Promise<{ success: boolean; error?: string }>;
  notifyBulk: (
    payload: NotifyOverdueBulkPayload,
  ) => Promise<{ success: boolean; data?: NotifyOverdueBulkResponse; error?: string }>;
  pendingNotifications: Set<string>;
  isBulkSending: boolean;
}

export function useOverdueStudents(): UseOverdueStudentsReturn {
  const [data, setData] = useState<OverdueStudentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingNotifications, setPendingNotifications] = useState<Set<string>>(() => new Set());
  const [isBulkSending, setIsBulkSending] = useState<boolean>(false);

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

  const notifyBulk = useCallback(
    async (
      payload: NotifyOverdueBulkPayload,
    ): Promise<{ success: boolean; data?: NotifyOverdueBulkResponse; error?: string }> => {
      setIsBulkSending(true);
      try {
        const response = await paymentService.notifyOverdueBulk(payload);
        if (response.success && response.data) {
          // Refresh after a successful bulk send so visible state reflects the
          // fact that those students now have a pending unconfirmed reminder.
          void fetchOverdue();
          return { success: true, data: response.data };
        }
        return { success: false, error: response.error };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to send bulk notifications',
        };
      } finally {
        setIsBulkSending(false);
      }
    },
    [fetchOverdue],
  );

  return {
    data,
    isLoading,
    error,
    refresh: fetchOverdue,
    notifyStudent,
    notifyBulk,
    pendingNotifications,
    isBulkSending,
  };
}
