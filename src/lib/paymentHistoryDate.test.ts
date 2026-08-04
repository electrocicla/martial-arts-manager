import { describe, expect, it } from 'vitest';
import {
  formatPaymentDate,
  formatPaymentMonthLabel,
  isValidPaymentDate,
} from './paymentHistoryDate';

describe('paymentHistoryDate', () => {
  it('formats a month key without shifting it in negative UTC offsets', () => {
    expect(formatPaymentMonthLabel('2026-07', 'en-US')).toBe('July 2026');
    expect(formatPaymentMonthLabel('2026-07', 'es-CL')).toBe('julio de 2026');
  });

  it('formats date-only payment dates without changing the calendar day', () => {
    expect(formatPaymentDate('2026-06-01', 'en-US')).toBe('Jun 1, 2026');
  });

  it('rejects malformed or impossible payment dates', () => {
    expect(isValidPaymentDate('2026-06-30')).toBe(true);
    expect(isValidPaymentDate('2026-02-30')).toBe(false);
    expect(isValidPaymentDate('2026-6-1')).toBe(false);
  });

  it('preserves unsupported values for diagnosis instead of inventing a date', () => {
    expect(formatPaymentMonthLabel('unknown', 'en-US')).toBe('unknown');
    expect(formatPaymentDate('legacy-value', 'en-US')).toBe('legacy-value');
  });
});
