/**
 * usePaymentHistory Hook
 *
 * Loads aggregated monthly payment history for the admin/instructor payments
 * dashboard. Follows SRP — only responsible for data fetching and refresh
 * orchestration; no presentation logic.
 */

import { useCallback, useEffect, useState } from 'react';
import { paymentService, type PaymentHistoryResponse } from '../services';
import { onDataEvent } from '../lib/dataEvents';

interface UsePaymentHistoryReturn {
  data: PaymentHistoryResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePaymentHistory(): UsePaymentHistoryReturn {
  const [data, setData] = useState<PaymentHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await paymentService.getMonthlyHistory();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'Failed to load payment history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error loading payment history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    return onDataEvent('payments', () => {
      void fetchHistory();
    });
  }, [fetchHistory]);

  return { data, isLoading, error, refresh: fetchHistory };
}
