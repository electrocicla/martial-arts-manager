/**
 * useStudentPayments
 *
 * Fetches the logged-in student's payment history from `/api/student/payments`
 * and derives the current-month status (paid / pending / overdue / due-soon)
 * client-side. Single source of truth for the `/my-payments` page.
 *
 * SRP: only owns data fetching + status derivation. Presentation lives in the
 * page/components.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api-client';
import { onDataEvent } from '../lib/dataEvents';
import type { Payment } from '../types';

export type StudentPaymentStatus =
  | 'paid'
  | 'pending'
  | 'overdue'
  | 'due_soon'
  | 'upcoming'
  | 'unknown';

export interface StudentPaymentsState {
  payments: Payment[];
  isLoading: boolean;
  error: string | null;
  /** Current month (YYYY-MM). */
  currentMonth: string;
  /** Day of the month considered the due date (defaults to 5). */
  dueDay: number;
  /** Status of the current-month payment for the logged-in student. */
  currentMonthStatus: StudentPaymentStatus;
  /** Latest matching payment for the current month, if any. */
  currentMonthPayment: Payment | null;
  /** Days late if status is overdue, or days until due if upcoming/due_soon. */
  daysDelta: number;
  /** Latest completed payment overall (used to surface "last paid"). */
  lastCompletedPayment: Payment | null;
}

interface Options {
  dueDay?: number;
}

const DEFAULT_DUE_DAY = 5;
const DUE_SOON_WINDOW_DAYS = 3;

function monthKey(iso: string): string {
  return iso.length >= 7 ? iso.slice(0, 7) : '';
}

function todayLocal(): { iso: string; year: number; month: number; day: number } {
  const d = new Date();
  return {
    iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  };
}

function deriveStatus(
  currentMonthPayment: Payment | null,
  dueDay: number,
): { status: StudentPaymentStatus; daysDelta: number } {
  const today = todayLocal();

  if (currentMonthPayment) {
    const status = currentMonthPayment.status?.toLowerCase();
    if (status === 'completed' || status === 'approved') {
      return { status: 'paid', daysDelta: 0 };
    }
    if (status === 'pending') {
      return { status: 'pending', daysDelta: 0 };
    }
  }

  // No matching payment for the current month \u2014 compute due delta.
  const dueDate = new Date(today.year, today.month - 1, dueDay);
  const todayDate = new Date(today.year, today.month - 1, today.day);
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((todayDate.getTime() - dueDate.getTime()) / msPerDay);

  if (diffDays > 0) {
    return { status: 'overdue', daysDelta: diffDays };
  }
  if (diffDays >= -DUE_SOON_WINDOW_DAYS) {
    return { status: 'due_soon', daysDelta: Math.abs(diffDays) };
  }
  return { status: 'upcoming', daysDelta: Math.abs(diffDays) };
}

export function useStudentPayments(options: Options = {}): StudentPaymentsState & {
  refresh: () => Promise<void>;
} {
  const { user, accessToken } = useAuth();
  const dueDay = options.dueDay ?? DEFAULT_DUE_DAY;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (signal?: AbortSignal) => {
    if (!user || !user.student_id || !accessToken) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get<Payment[]>('/api/student/payments', { signal });
      if (signal?.aborted) return;
      if (!res.success) {
        throw new Error(res.error ?? 'Failed to fetch payments');
      }
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (signal?.aborted) return;
      setError((err as Error).message);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [user, accessToken]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchPayments(controller.signal);
    return () => controller.abort();
  }, [fetchPayments]);

  // Refetch when other tabs/components emit a payments-changed signal.
  useEffect(() => {
    return onDataEvent('payments', () => {
      void fetchPayments();
    });
  }, [fetchPayments]);

  const derived = useMemo(() => {
    const today = todayLocal();
    const currentMonth = `${today.year}-${String(today.month).padStart(2, '0')}`;

    // Pick the most relevant payment for the current month: prefer completed,
    // then pending, then most recent.
    const inMonth = payments.filter((p) => monthKey(p.date) === currentMonth);
    const completed = inMonth.find((p) => {
      const s = p.status?.toLowerCase();
      return s === 'completed' || s === 'approved';
    }) ?? null;
    const pending = inMonth.find((p) => p.status?.toLowerCase() === 'pending') ?? null;
    const latestInMonth = inMonth[0] ?? null;
    const currentMonthPayment = completed ?? pending ?? latestInMonth;

    const { status, daysDelta } = deriveStatus(currentMonthPayment, dueDay);

    const lastCompletedPayment = payments.find((p) => {
      const s = p.status?.toLowerCase();
      return s === 'completed' || s === 'approved';
    }) ?? null;

    return {
      currentMonth,
      currentMonthStatus: status,
      currentMonthPayment,
      daysDelta,
      lastCompletedPayment,
    };
  }, [payments, dueDay]);

  return {
    payments,
    isLoading,
    error,
    dueDay,
    ...derived,
    refresh: () => fetchPayments(),
  };
}

export default useStudentPayments;
