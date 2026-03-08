export const DEFAULT_MONTHLY_PAYMENT_AMOUNT = 35000;

function toPositiveNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function extractDefaultMonthlyAmount(config: unknown): number | null {
  const directAmount = toPositiveNumber(config);
  if (directAmount !== null) {
    return directAmount;
  }

  if (!isRecord(config)) {
    return null;
  }

  const candidateRecords = [
    config,
    config.defaults,
    config.billing,
    config.pricing,
  ].filter(isRecord);

  for (const candidate of candidateRecords) {
    const amount = toPositiveNumber(candidate.defaultMonthlyAmount ?? candidate.monthlyAmount);
    if (amount !== null) {
      return amount;
    }
  }

  return null;
}

export interface AmountUsageRow {
  amount: unknown;
  usage_count: unknown;
}

export function pickMostCommonAmount(
  rows: AmountUsageRow[] | null | undefined,
  fallback = DEFAULT_MONTHLY_PAYMENT_AMOUNT,
): number {
  if (!rows || rows.length === 0) {
    return fallback;
  }

  let bestAmount = fallback;
  let bestUsage = -1;

  for (const row of rows) {
    const amount = toPositiveNumber(row.amount);
    const usage = typeof row.usage_count === 'number' ? row.usage_count : Number(row.usage_count);

    if (amount === null || !Number.isFinite(usage)) {
      continue;
    }

    if (usage > bestUsage || (usage === bestUsage && amount > bestAmount)) {
      bestAmount = amount;
      bestUsage = usage;
    }
  }

  return bestUsage === -1 ? fallback : bestAmount;
}

export function normalizePaymentDate(input: string | null | undefined, fallback = new Date()): string {
  if (typeof input === 'string' && input.length >= 10) {
    const candidate = input.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
      return candidate;
    }
  }

  return fallback.toISOString().slice(0, 10);
}

export type AutoPaymentReason = 'student-created' | 'approval' | 'backfill';

export function buildAutoPaymentNote(reason: AutoPaymentReason): string {
  switch (reason) {
    case 'approval':
      return 'Auto-generated pending monthly payment after student approval.';
    case 'backfill':
      return 'Auto-generated pending monthly payment during missing-payment backfill.';
    case 'student-created':
    default:
      return 'Auto-generated pending monthly payment after student creation.';
  }
}