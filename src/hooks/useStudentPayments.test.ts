/**
 * Tests for `useStudentPayments`.
 *
 * Focus on derivation: paid / pending / overdue / due_soon / upcoming and the
 * `daysDelta` math relative to a configurable `dueDay`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStudentPayments } from './useStudentPayments';
import { apiClient } from '../lib/api-client';
import type { Payment } from '../types';

vi.mock('../lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

vi.mock('../context/AuthContext', () => {
  const auth = {
    user: { id: 'u-1', email: 's@x.com', name: 'S', role: 'student' as const, student_id: 's-1' },
    accessToken: 'token',
  };
  return { useAuth: () => auth };
});

vi.mock('../lib/dataEvents', () => ({
  onDataEvent: () => () => undefined,
  dispatchDataEvent: vi.fn(),
}));

const mockGet = vi.mocked(apiClient.get);

function setApiPayments(payments: Payment[]): void {
  mockGet.mockImplementation(((url: string) => {
    if (url === '/api/student/payments') {
      return Promise.resolve({ success: true, data: payments });
    }
    return Promise.resolve({ success: false, error: 'unknown' });
  }) as unknown as typeof apiClient.get);
}

function makePayment(partial: Partial<Payment>): Payment {
  return {
    id: 'p-' + Math.random().toString(36).slice(2, 8),
    student_id: 's-1',
    branch_id: 'main',
    amount: 35000,
    date: '2025-01-05',
    type: 'monthly',
    status: 'completed',
    payment_method: 'cash',
    created_at: '2025-01-05T00:00:00Z',
    updated_at: '2025-01-05T00:00:00Z',
    ...partial,
  };
}

describe('useStudentPayments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns "paid" when there is a completed payment in the current month', async () => {
    vi.setSystemTime(new Date(2026, 0, 10)); // Jan 10 2026
    setApiPayments([
      makePayment({ id: 'p1', date: '2026-01-04', status: 'completed', amount: 35000 }),
    ]);

    const { result } = renderHook(() => useStudentPayments({ dueDay: 5 }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.currentMonthStatus).toBe('paid');
    expect(result.current.daysDelta).toBe(0);
    expect(result.current.currentMonthPayment?.id).toBe('p1');
    expect(result.current.lastCompletedPayment?.id).toBe('p1');
  });

  it('returns "pending" when only a pending payment exists for the month', async () => {
    vi.setSystemTime(new Date(2026, 0, 10));
    setApiPayments([makePayment({ id: 'p1', date: '2026-01-03', status: 'pending' })]);

    const { result } = renderHook(() => useStudentPayments({ dueDay: 5 }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.currentMonthStatus).toBe('pending');
  });

  it('returns "overdue" with positive daysDelta when no payment exists past due day', async () => {
    vi.setSystemTime(new Date(2026, 0, 12)); // 7 days past dueDay=5
    setApiPayments([]);

    const { result } = renderHook(() => useStudentPayments({ dueDay: 5 }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.currentMonthStatus).toBe('overdue');
    expect(result.current.daysDelta).toBe(7);
  });

  it('returns "due_soon" when the due day is within the warning window', async () => {
    vi.setSystemTime(new Date(2026, 0, 3)); // 2 days before dueDay=5
    setApiPayments([]);

    const { result } = renderHook(() => useStudentPayments({ dueDay: 5 }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.currentMonthStatus).toBe('due_soon');
    expect(result.current.daysDelta).toBe(2);
  });

  it('returns "upcoming" when due day is far in the future', async () => {
    vi.setSystemTime(new Date(2026, 0, 1)); // 14 days before dueDay=15
    setApiPayments([]);

    const { result } = renderHook(() => useStudentPayments({ dueDay: 15 }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.currentMonthStatus).toBe('upcoming');
    expect(result.current.daysDelta).toBe(14);
  });

  it('exposes lastCompletedPayment from previous months even if current month is overdue', async () => {
    vi.setSystemTime(new Date(2026, 1, 10)); // Feb 10
    setApiPayments([
      makePayment({ id: 'past1', date: '2025-12-04', status: 'completed' }),
      makePayment({ id: 'past2', date: '2026-01-04', status: 'completed' }),
    ]);

    const { result } = renderHook(() => useStudentPayments({ dueDay: 5 }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.currentMonthStatus).toBe('overdue');
    expect(result.current.lastCompletedPayment?.id).toBe('past1');
  });
});
