/**
 * Tests for `useStudentClassHistory`.
 *
 * Focus: status derivation (`attended` / `missed` / `no_record` / `today` /
 * `upcoming`) and aggregate counters (totalPast, attended, missed, upcoming,
 * attendanceRate).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStudentClassHistory } from './useStudentClassHistory';
import { apiClient } from '../lib/api-client';

vi.mock('../lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => {
  const auth = {
    user: { id: 'u-1', email: 'student@example.com', name: 'Student', role: 'student' as const, student_id: 's-1' },
    accessToken: 'token',
  };
  return { useAuth: () => auth };
});

vi.mock('../lib/dataEvents', () => ({
  onDataEvent: () => () => undefined,
  dispatchDataEvent: vi.fn(),
}));

const mockGet = vi.mocked(apiClient.get);

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function pastIso(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function futureIso(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('useStudentClassHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('derives status correctly across attended / missed / no_record / today / upcoming and computes counters', async () => {
    const enrolled = [
      { id: 'c-attended', name: 'Attended class', date: pastIso(7), time: '18:00', instructor: 'Sensei A' },
      { id: 'c-missed', name: 'Missed class', date: pastIso(5), time: '18:00', instructor: 'Sensei B' },
      { id: 'c-no-record', name: 'No-record class', date: pastIso(3), time: '18:00', instructor: 'Sensei C' },
      { id: 'c-today', name: 'Today class', date: todayIso(), time: '20:00', instructor: 'Sensei D' },
      { id: 'c-upcoming', name: 'Upcoming class', date: futureIso(4), time: '18:00', instructor: 'Sensei E' },
    ];
    const records = [
      { id: 'a-1', class_id: 'c-attended', attended: 1, check_in_time: null, check_in_method: 'qr' },
      { id: 'a-2', class_id: 'c-missed', attended: 0, check_in_time: null, check_in_method: null },
    ];

    mockGet.mockImplementation(((url: string) => {
      if (url === '/api/student/classes') {
        return Promise.resolve({ success: true, data: enrolled });
      }
      if (url === '/api/student/attendance') {
        return Promise.resolve({
          success: true,
          data: { records, stats: { current_streak: 1, best_streak: 4 } },
        });
      }
      return Promise.resolve({ success: false, error: 'unknown' });
    }) as unknown as typeof apiClient.get);

    const { result } = renderHook(() => useStudentClassHistory());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const byId = new Map(result.current.classes.map((c) => [c.classId, c]));
    expect(byId.get('c-attended')?.status).toBe('attended');
    expect(byId.get('c-missed')?.status).toBe('missed');
    expect(byId.get('c-no-record')?.status).toBe('no_record');
    expect(byId.get('c-today')?.status).toBe('today');
    expect(byId.get('c-upcoming')?.status).toBe('upcoming');

    expect(result.current.stats).toEqual({
      totalPast: 3,
      attended: 1,
      missed: 2,
      upcoming: 2,
      attendanceRate: 33,
      currentStreak: 1,
      bestStreak: 4,
    });
  });

  it('exposes the error message when the classes endpoint fails', async () => {
    mockGet.mockImplementation(((url: string) => {
      if (url === '/api/student/classes') {
        return Promise.resolve({ success: false, error: 'boom' });
      }
      return Promise.resolve({ success: true, data: { records: [] } });
    }) as unknown as typeof apiClient.get);

    const { result } = renderHook(() => useStudentClassHistory());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('boom');
    expect(result.current.classes).toEqual([]);
  });
});
