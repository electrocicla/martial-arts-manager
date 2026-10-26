import { describe, expect, it } from 'vitest';
import { isValidDateKey, occursOn, planFutureSeriesChanges, selectManagedFutureSessions } from './weeklySeriesManagement';

const weekly = { frequency: 'weekly' as const, days: [1, 3, 5], endDate: '2026-12-31' };

describe('weekly series update safeguards', () => {
  it('validates real dates and weekday boundaries', () => {
    expect(isValidDateKey('2026-02-29')).toBe(false);
    expect(isValidDateKey('2028-02-29')).toBe(true);
    expect(occursOn('2026-10-26', '2026-10-26', weekly)).toBe(true);
    expect(occursOn('2026-10-27', '2026-10-26', weekly)).toBe(false);
    expect(occursOn('2026-10-23', '2026-10-26', weekly)).toBe(false);
  });

  it('blocks dropping an enrolled or attended instance while preserving empty occurrences', () => {
    const future = [
      { id: 'enrolled', date: '2026-10-27', time: '18:00', deleted_at: null, is_active: 1, active_enrollments: 1, attendance_records: 0 },
      { id: 'attended', date: '2026-10-29', time: '18:00', deleted_at: null, is_active: 1, active_enrollments: 0, attendance_records: 1 },
      { id: 'empty', date: '2026-10-31', time: '18:00', deleted_at: null, is_active: 1, active_enrollments: 0, attendance_records: 0 },
    ];
    expect(planFutureSeriesChanges(future, '2026-10-26', '18:00', weekly))
      .toEqual({ blocked: ['enrolled', 'attended'], conflicts: [] });
  });

  it('preserves manually moved sessions outside the original weekly pattern', () => {
    const future = [
      { id: 'regular', date: '2026-10-26', time: '18:00', deleted_at: null, is_active: 1, active_enrollments: 0, attendance_records: 0 },
      { id: 'moved', date: '2026-10-27', time: '18:00', deleted_at: null, is_active: 1, active_enrollments: 0, attendance_records: 0 },
      { id: 'exception', date: '2026-10-28', time: '18:00', deleted_at: '2026-10-25', is_active: 0, active_enrollments: 0, attendance_records: 0 },
    ];
    expect(selectManagedFutureSessions(future, '2026-10-26', weekly).map((row) => row.id))
      .toEqual(['regular', 'exception']);
  });

  it('detects collisions with deleted date exceptions before rescheduling', () => {
    const future = [
      { id: 'active', date: '2026-10-26', time: '18:00', deleted_at: null, is_active: 1, active_enrollments: 0, attendance_records: 0 },
      { id: 'deleted', date: '2026-10-26', time: '19:00', deleted_at: '2026-10-25', is_active: 0, active_enrollments: 0, attendance_records: 0 },
    ];
    expect(planFutureSeriesChanges(future, '2026-10-26', '19:00', weekly).conflicts).toEqual(['active']);
  });
});
