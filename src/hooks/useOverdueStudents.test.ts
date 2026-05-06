import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOverdueStudents } from './useOverdueStudents';
import { paymentService } from '../services';
import type { OverdueStudentsResponse } from '../services';

vi.mock('../services', async () => {
  const actual = await vi.importActual<typeof import('../services')>('../services');
  return {
    ...actual,
    paymentService: {
      getOverdueStudents: vi.fn(),
      notifyOverdueStudent: vi.fn(),
    },
  };
});

const mockGetOverdue = vi.mocked(paymentService.getOverdueStudents);
const mockNotify = vi.mocked(paymentService.notifyOverdueStudent);

const responseFixture: OverdueStudentsResponse = {
  students: [
    {
      studentId: 's-1',
      studentName: 'Alice',
      studentEmail: 'alice@example.com',
      studentPhone: null,
      belt: 'white',
      discipline: 'karate',
      userId: 'u-1',
      expectedAmount: 35000,
      lastPaymentDate: '2025-12-05',
      lastPaymentAmount: 35000,
      daysOverdue: 7,
      dueDate: '2026-01-05',
    },
  ],
  meta: { dueDay: 5, dueDate: '2026-01-05', referenceDate: '2026-01-12', totalOverdue: 1 },
};

describe('useOverdueStudents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOverdue.mockResolvedValue({ success: true, data: responseFixture });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads overdue students on mount', async () => {
    const { result } = renderHook(() => useOverdueStudents());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual(responseFixture);
  });

  it('marks the student as pending while a notification is in flight', async () => {
    let resolveNotify: ((value: { success: true; data: { success: true; notificationId: string } }) => void) | undefined;
    mockNotify.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveNotify = resolve as typeof resolveNotify;
        }),
    );

    const { result } = renderHook(() => useOverdueStudents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let notifyPromise: Promise<{ success: boolean; error?: string }> | undefined;
    act(() => {
      notifyPromise = result.current.notifyStudent({ studentId: 's-1' });
    });

    await waitFor(() => {
      expect(result.current.pendingNotifications.has('s-1')).toBe(true);
    });

    act(() => {
      resolveNotify?.({ success: true, data: { success: true, notificationId: 'n-1' } });
    });

    const outcome = await notifyPromise!;
    expect(outcome.success).toBe(true);

    await waitFor(() => {
      expect(result.current.pendingNotifications.has('s-1')).toBe(false);
    });
  });

  it('returns the API error when notify fails', async () => {
    mockNotify.mockResolvedValue({
      success: false,
      error: 'Student does not have a linked user account to receive notifications',
    });

    const { result } = renderHook(() => useOverdueStudents());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let outcome: { success: boolean; error?: string } | undefined;
    await act(async () => {
      outcome = await result.current.notifyStudent({ studentId: 's-1' });
    });

    expect(outcome?.success).toBe(false);
    expect(outcome?.error).toMatch(/linked user account/);
  });
});
