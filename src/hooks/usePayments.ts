/**
 * usePayments Hook
 * Manages payment data with proper separation of concerns
 * Follows SRP by focusing only on payment data management
 */

import { useState, useEffect, useCallback } from 'react';
import { paymentService, type PaymentFilters, type PaymentStats } from '../services';
import type { Payment, PaymentFormData } from '../types/index';
import { dispatchDataEvent, onDataEvent } from '../lib/dataEvents';

interface UsePaymentsReturn {
  // Data
  payments: Payment[];
  stats: PaymentStats | null;
  overduePayments: Payment[];

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Error states
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
  createPayment: (data: PaymentFormData) => Promise<Payment | null>;
  updatePayment: (id: string, data: Partial<PaymentFormData>) => Promise<Payment | null>;
  deletePayment: (id: string) => Promise<boolean>;
  filterPayments: (filters: PaymentFilters) => Promise<void>;
  getPaymentStats: () => Promise<PaymentStats | null>;
  getOverduePayments: () => Promise<Payment[]>;
  markAsPaid: (id: string) => Promise<Payment | null>;
}

export function usePayments(initialFilters?: PaymentFilters): UsePaymentsReturn {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [overduePayments, setOverduePayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<PaymentFilters | undefined>(initialFilters);

  const fetchPayments = useCallback(async (filters?: PaymentFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await paymentService.getAll(filters);
      if (response.success && response.data) {
        setPayments(response.data);
      } else {
        setError(response.error || 'Failed to fetch payments');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchPayments(currentFilters);
  }, [fetchPayments, currentFilters]);

  const createPayment = useCallback(async (data: PaymentFormData): Promise<Payment | null> => {
    try {
      setIsCreating(true);
      setError(null);

      const response = await paymentService.create(data);
      if (response.success && response.data) {
        setPayments(prev => [...prev, response.data!]);
        dispatchDataEvent('payments');
        return response.data;
      } else {
        setError(response.error || 'Failed to create payment');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updatePayment = useCallback(async (id: string, data: Partial<PaymentFormData>): Promise<Payment | null> => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await paymentService.update(id, data);
      if (response.success && response.data) {
        setPayments(prev => prev.map(payment =>
          payment.id === id ? response.data! : payment
        ));
        dispatchDataEvent('payments');
        return response.data;
      } else {
        setError(response.error || 'Failed to update payment');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deletePayment = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsDeleting(true);
      setError(null);

      const response = await paymentService.delete(id);
      if (response.success) {
        setPayments(prev => prev.filter(payment => payment.id !== id));
        dispatchDataEvent('payments');
        return true;
      } else {
        setError(response.error || 'Failed to delete payment');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const filterPayments = useCallback(async (filters: PaymentFilters) => {
    setCurrentFilters(filters);
    await fetchPayments(filters);
  }, [fetchPayments]);

  const getPaymentStats = useCallback(async (): Promise<PaymentStats | null> => {
    try {
      const response = await paymentService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch payment stats');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    }
  }, []);

  const getOverduePayments = useCallback(async (): Promise<Payment[]> => {
    try {
      const response = await paymentService.getOverdue();
      if (response.success && response.data) {
        setOverduePayments(response.data);
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch overdue payments');
        return [];
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return [];
    }
  }, []);

  const markAsPaid = useCallback(async (id: string): Promise<Payment | null> => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await paymentService.markAsPaid(id);
      if (response.success && response.data) {
        setPayments(prev => prev.map(payment =>
          payment.id === id ? response.data! : payment
        ));
        dispatchDataEvent('payments');
        return response.data;
      } else {
        setError(response.error || 'Failed to mark payment as paid');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPayments(currentFilters);
  }, [fetchPayments, currentFilters]);

  // Refetch whenever another hook instance mutates payments data
  useEffect(() => {
    return onDataEvent('payments', () => fetchPayments(currentFilters));
  }, [fetchPayments, currentFilters]);

  return {
    payments,
    stats,
    overduePayments,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    refresh,
    createPayment,
    updatePayment,
    deletePayment,
    filterPayments,
    getPaymentStats,
    getOverduePayments,
    markAsPaid,
  };
}