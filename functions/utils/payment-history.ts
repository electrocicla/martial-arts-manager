export interface PaymentHistoryRow {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  amount: number;
  date: string;
  type: string;
  notes: string | null;
  status: string;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistoryMonth {
  monthKey: string;
  totalAmount: number;
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
  payments: PaymentHistoryRow[];
}

export interface PaymentHistoryResponse {
  months: PaymentHistoryMonth[];
  totals: {
    totalAmount: number;
    totalCount: number;
    completedAmount: number;
    pendingAmount: number;
    monthsTracked: number;
  };
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_PREFIX_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const UNKNOWN_MONTH_KEY = 'unknown';

function hasValidCalendarDate(value: string, pattern: RegExp): boolean {
  const match = pattern.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, monthIndex, day));

  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === monthIndex
    && parsed.getUTCDate() === day;
}

export function isValidPaymentDate(value: string): boolean {
  return hasValidCalendarDate(value, DATE_ONLY_PATTERN);
}

export function getPaymentMonthKey(value: string): string | null {
  if (!hasValidCalendarDate(value, DATE_PREFIX_PATTERN)) return null;
  return value.slice(0, 7);
}

function createMonthBucket(monthKey: string): PaymentHistoryMonth {
  return {
    monthKey,
    totalAmount: 0,
    totalCount: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    refundedCount: 0,
    payments: [],
  };
}

function compareMonthKeysDescending(
  left: PaymentHistoryMonth,
  right: PaymentHistoryMonth,
): number {
  if (left.monthKey === UNKNOWN_MONTH_KEY) return 1;
  if (right.monthKey === UNKNOWN_MONTH_KEY) return -1;
  return right.monthKey.localeCompare(left.monthKey);
}

/**
 * Accounting is assigned to the month selected as the payment date. The
 * database creation timestamp is intentionally ignored so retroactive entries
 * remain in the accounting period they belong to.
 */
export function aggregatePaymentHistory(
  rows: readonly PaymentHistoryRow[],
): PaymentHistoryResponse {
  const buckets = new Map<string, PaymentHistoryMonth>();
  const totals: PaymentHistoryResponse['totals'] = {
    totalAmount: 0,
    totalCount: rows.length,
    completedAmount: 0,
    pendingAmount: 0,
    monthsTracked: 0,
  };

  for (const row of rows) {
    const monthKey = getPaymentMonthKey(row.date) ?? UNKNOWN_MONTH_KEY;
    const bucket = buckets.get(monthKey) ?? createMonthBucket(monthKey);
    if (!buckets.has(monthKey)) buckets.set(monthKey, bucket);

    const numericAmount = Number(row.amount);
    const amount = Number.isFinite(numericAmount) ? numericAmount : 0;
    bucket.payments.push(row);
    bucket.totalCount += 1;

    switch (row.status) {
      case 'completed':
        bucket.completedCount += 1;
        bucket.totalAmount += amount;
        totals.totalAmount += amount;
        totals.completedAmount += amount;
        break;
      case 'refunded':
        bucket.refundedCount += 1;
        bucket.totalAmount -= amount;
        totals.totalAmount -= amount;
        break;
      case 'pending':
        bucket.pendingCount += 1;
        totals.pendingAmount += amount;
        break;
      case 'failed':
        bucket.failedCount += 1;
        break;
      default:
        break;
    }
  }

  const months = Array.from(buckets.values()).sort(compareMonthKeysDescending);
  totals.monthsTracked = months.length;

  return { months, totals };
}
