import { describe, expect, it } from 'vitest';
import {
  aggregatePaymentHistory,
  getPaymentMonthKey,
  isValidPaymentDate,
  type PaymentHistoryRow,
} from './payment-history';

function payment(
  overrides: Partial<PaymentHistoryRow> & Pick<PaymentHistoryRow, 'id' | 'date' | 'amount' | 'status'>,
): PaymentHistoryRow {
  return {
    student_id: 'student-1',
    student_name: 'Test Student',
    student_email: 'student@example.com',
    type: 'monthly',
    notes: null,
    payment_method: 'cash',
    created_at: '2026-07-10T12:00:00.000Z',
    updated_at: '2026-07-10T12:00:00.000Z',
    ...overrides,
  };
}

describe('payment-history accounting', () => {
  it('assigns a retroactive payment to its payment month, not its creation month', () => {
    const response = aggregatePaymentHistory([
      payment({
        id: 'late-june-payment',
        date: '2026-06-25',
        amount: 40000,
        status: 'completed',
        created_at: '2026-07-10T12:00:00.000Z',
      }),
      payment({
        id: 'july-payment',
        date: '2026-07-02',
        amount: 30000,
        status: 'completed',
        created_at: '2026-07-02T12:00:00.000Z',
      }),
    ]);

    expect(response.months.map((month) => month.monthKey)).toEqual(['2026-07', '2026-06']);
    expect(response.months[1]).toMatchObject({
      monthKey: '2026-06',
      totalAmount: 40000,
      totalCount: 1,
      completedCount: 1,
    });
    expect(response.months[1]?.payments[0]?.id).toBe('late-june-payment');
  });

  it('keeps pending payments out of net revenue and subtracts refunds', () => {
    const response = aggregatePaymentHistory([
      payment({ id: 'completed', date: '2026-06-01', amount: 50000, status: 'completed' }),
      payment({ id: 'pending', date: '2026-06-02', amount: 20000, status: 'pending' }),
      payment({ id: 'refunded', date: '2026-06-03', amount: 10000, status: 'refunded' }),
    ]);

    expect(response.months[0]).toMatchObject({
      totalAmount: 40000,
      totalCount: 3,
      completedCount: 1,
      pendingCount: 1,
      refundedCount: 1,
    });
    expect(response.totals).toMatchObject({
      totalAmount: 40000,
      completedAmount: 50000,
      pendingAmount: 20000,
    });
  });

  it('validates date-only inputs and accepts ISO timestamps for legacy grouping', () => {
    expect(isValidPaymentDate('2026-06-30')).toBe(true);
    expect(isValidPaymentDate('2026-02-30')).toBe(false);
    expect(getPaymentMonthKey('2026-06-30T23:59:59.000Z')).toBe('2026-06');
  });
});
