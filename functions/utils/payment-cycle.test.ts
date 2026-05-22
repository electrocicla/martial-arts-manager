import { describe, expect, it } from 'vitest';
import { addOneMonthClampedUtc, getPaymentCycleStatus } from './payment-cycle';

describe('payment-cycle', () => {
  it('sets the due date one month after the latest completed payment', () => {
    const status = getPaymentCycleStatus({
      lastCompletedDate: '2026-04-10',
      joinDate: '2025-01-01',
      referenceDate: new Date('2026-05-22T12:00:00Z'),
    });

    expect(status.anchorDate).toBe('2026-04-10');
    expect(status.dueDate).toBe('2026-05-10');
    expect(status.daysOverdue).toBe(12);
    expect(status.isOverdue).toBe(true);
  });

  it('does not mark a student overdue before their next monthly cycle date', () => {
    const status = getPaymentCycleStatus({
      lastCompletedDate: '2026-04-30',
      referenceDate: new Date('2026-05-22T12:00:00Z'),
    });

    expect(status.dueDate).toBe('2026-05-30');
    expect(status.daysOverdue).toBe(0);
    expect(status.isOverdue).toBe(false);
  });

  it('uses join date when the student has no completed payments', () => {
    const status = getPaymentCycleStatus({
      lastCompletedDate: null,
      joinDate: '2026-03-15',
      referenceDate: new Date('2026-04-20T12:00:00Z'),
    });

    expect(status.anchorDate).toBe('2026-03-15');
    expect(status.dueDate).toBe('2026-04-15');
    expect(status.daysOverdue).toBe(5);
    expect(status.isOverdue).toBe(true);
  });

  it('clamps month ends to the target month length', () => {
    expect(addOneMonthClampedUtc(new Date('2026-01-31T00:00:00Z')).toISOString().slice(0, 10)).toBe('2026-02-28');
  });
});