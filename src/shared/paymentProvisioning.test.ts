import { describe, expect, it } from 'vitest';
import {
  buildAutoPaymentNote,
  DEFAULT_MONTHLY_PAYMENT_AMOUNT,
  extractDefaultMonthlyAmount,
  normalizePaymentDate,
  pickMostCommonAmount,
} from './paymentProvisioning';

describe('paymentProvisioning helpers', () => {
  it('extracts default monthly amount from nested payment settings', () => {
    expect(
      extractDefaultMonthlyAmount({
        provider: 'Manual Only',
        defaults: { monthlyAmount: '42000' },
      }),
    ).toBe(42000);
  });

  it('returns null when settings do not include a valid amount', () => {
    expect(extractDefaultMonthlyAmount({ defaults: { monthlyAmount: 'free' } })).toBeNull();
  });

  it('picks the most common amount and prefers the highest amount on ties', () => {
    expect(
      pickMostCommonAmount([
        { amount: 30000, usage_count: 2 },
        { amount: 35000, usage_count: 2 },
        { amount: 50000, usage_count: 1 },
      ]),
    ).toBe(35000);
  });

  it('falls back to the configured default amount when rows are empty', () => {
    expect(pickMostCommonAmount([])).toBe(DEFAULT_MONTHLY_PAYMENT_AMOUNT);
  });

  it('normalizes ISO timestamps to yyyy-mm-dd', () => {
    expect(normalizePaymentDate('2026-01-31T19:36:35.160Z')).toBe('2026-01-31');
  });

  it('builds readable provisioning notes for backfill', () => {
    expect(buildAutoPaymentNote('backfill')).toContain('backfill');
  });
});