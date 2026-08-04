const MONTH_KEY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

interface DateOnlyParts {
  year: number;
  monthIndex: number;
  day: number;
}

function parseDateOnly(value: string): DateOnlyParts | null {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, monthIndex, day));

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== monthIndex
    || date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, monthIndex, day };
}

export function isValidPaymentDate(value: string): boolean {
  return parseDateOnly(value) !== null;
}

export function formatPaymentMonthLabel(monthKey: string, locale: string): string {
  const match = MONTH_KEY_PATTERN.exec(monthKey);
  if (!match) return monthKey;

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const monthStartUtc = new Date(Date.UTC(year, monthIndex, 1));

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(monthStartUtc);
}

export function formatPaymentDate(value: string, locale: string): string {
  const parts = parseDateOnly(value);
  if (!parts) return value || '—';

  const dateUtc = new Date(Date.UTC(parts.year, parts.monthIndex, parts.day));
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(dateUtc);
}
