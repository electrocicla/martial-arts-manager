const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface PaymentCycleInput {
  lastCompletedDate?: string | null;
  joinDate?: string | null;
  createdAt?: string | null;
  referenceDate?: Date;
}

export interface PaymentCycleStatus {
  anchorDate: string | null;
  dueDate: string | null;
  daysOverdue: number;
  isOverdue: boolean;
}

function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function parseDateToUtcDay(value?: string | null): Date | null {
  if (!value) return null;

  const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDateMatch) {
    const year = Number(isoDateMatch[1]);
    const monthIndex = Number(isoDateMatch[2]) - 1;
    const day = Number(isoDateMatch[3]);
    const parsed = new Date(Date.UTC(year, monthIndex, day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : startOfUtcDay(parsed);
}

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function daysInUtcMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function addOneMonthClampedUtc(value: Date): Date {
  const targetMonthStart = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 1));
  const targetDay = Math.min(
    value.getUTCDate(),
    daysInUtcMonth(targetMonthStart.getUTCFullYear(), targetMonthStart.getUTCMonth()),
  );
  return new Date(Date.UTC(targetMonthStart.getUTCFullYear(), targetMonthStart.getUTCMonth(), targetDay));
}

export function getPaymentCycleStatus(input: PaymentCycleInput): PaymentCycleStatus {
  const anchorDate = parseDateToUtcDay(input.lastCompletedDate)
    ?? parseDateToUtcDay(input.joinDate)
    ?? parseDateToUtcDay(input.createdAt);

  if (!anchorDate) {
    return {
      anchorDate: null,
      dueDate: null,
      daysOverdue: 0,
      isOverdue: false,
    };
  }

  const dueDate = addOneMonthClampedUtc(anchorDate);
  const referenceDate = startOfUtcDay(input.referenceDate ?? new Date());
  const rawDaysOverdue = Math.floor((referenceDate.getTime() - dueDate.getTime()) / MS_PER_DAY);

  return {
    anchorDate: isoDate(anchorDate),
    dueDate: isoDate(dueDate),
    daysOverdue: Math.max(0, rawDaysOverdue),
    isOverdue: rawDaysOverdue >= 0,
  };
}