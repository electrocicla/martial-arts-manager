import type { Env } from '../types/index';

interface RecurringParent {
  id: string;
  date: string;
  time: string;
  recurrence_pattern: string | null;
}

export interface WeeklyPattern {
  frequency: 'weekly';
  days: number[];
  endDate?: string;
}

const DAY_MS = 86_400_000;
const HORIZON_DAYS = 84;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseDateKey(key: string): number | null {
  if (!ISO_DATE_PATTERN.test(key)) return null;
  const value = Date.parse(`${key}T00:00:00.000Z`);
  return Number.isFinite(value) && new Date(value).toISOString().slice(0, 10) === key ? value : null;
}

export function parseWeeklyPattern(value: string | null): WeeklyPattern | null {
  if (!value) return null;
  try {
    const data: unknown = JSON.parse(value);
    if (typeof data !== 'object' || data === null || !('frequency' in data) || data.frequency !== 'weekly' || !('days' in data) || !Array.isArray(data.days)) return null;
    const days = data.days;
    if (!days.length || !days.every((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6)) return null;
    const endDate = 'endDate' in data ? data.endDate : undefined;
    if (endDate !== undefined && (typeof endDate !== 'string' || parseDateKey(endDate) === null)) return null;
    return { frequency: 'weekly', days: Array.from(new Set<number>(days)), ...(typeof endDate === 'string' ? { endDate } : {}) };
  } catch {
    return null;
  }
}

export function weeklyOccurrenceDates(startDate: string, pattern: WeeklyPattern, fromDate: string, horizonDays = HORIZON_DAYS): string[] {
  const start = parseDateKey(startDate);
  const from = parseDateKey(fromDate);
  const end = pattern.endDate ? parseDateKey(pattern.endDate) : null;
  if (start === null || from === null || (pattern.endDate && end === null) || !Number.isInteger(horizonDays) || horizonDays < 1 || horizonDays > 366) return [];
  const since = Math.max(start, from);
  const until = Math.min(from + (horizonDays - 1) * DAY_MS, end ?? Number.POSITIVE_INFINITY);
  const allowed = new Set(pattern.days);
  const dates: string[] = [];
  for (let timestamp = since; timestamp <= until; timestamp += DAY_MS) {
    const date = new Date(timestamp);
    if (allowed.has(date.getUTCDay())) dates.push(date.toISOString().slice(0, 10));
  }
  return dates;
}

/**
 * Rolling materialization: no schema change, never edits existing classes,
 * enrollments, attendance, or soft-deleted exceptions. D1's existing unique
 * parent/date/time index also protects concurrent requests.
 */
export async function materializeWeeklyClasses(db: Env['DB'], branchId: string, todayKey: string): Promise<void> {
  if (parseDateKey(todayKey) === null) throw new Error('Invalid materialization date');
  const { results } = await db.prepare(`
    SELECT id, date, time, recurrence_pattern FROM classes
    WHERE branch_id = ? AND parent_course_id IS NULL
      AND is_recurring = 1 AND is_active = 1 AND deleted_at IS NULL
  `).bind(branchId).all<RecurringParent>();

  for (const parent of results ?? []) {
    const pattern = parseWeeklyPattern(parent.recurrence_pattern);
    if (!pattern) continue;
    const dates = weeklyOccurrenceDates(parent.date, pattern, todayKey);
    if (!dates.length) continue;
    // Include soft-deleted occurrences: deletion is an explicit exception, not a gap.
    const { results: existing } = await db.prepare(
      'SELECT date FROM classes WHERE parent_course_id = ? AND branch_id = ? AND date >= ? AND date <= ?'
    ).bind(parent.id, branchId, dates[0], dates[dates.length - 1]).all<{ date: string }>();
    const knownDates = new Set((existing ?? []).map((row) => row.date));
    for (const date of dates) {
      if (knownDates.has(date)) continue;
      await db.prepare(`
        INSERT OR IGNORE INTO classes (
          id, name, discipline, date, time, location, instructor,
          max_students, description, is_recurring, recurrence_pattern,
          is_active, parent_course_id, instructor_id, created_by,
          created_at, updated_at, branch_id
        )
        SELECT ?, p.name, p.discipline, ?, p.time, p.location, p.instructor,
               p.max_students, p.description, 0, NULL, 1, p.id,
               p.instructor_id, p.created_by, ?, ?, p.branch_id
        FROM classes p
        WHERE p.id = ? AND p.branch_id = ? AND p.is_active = 1 AND p.deleted_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM classes existing
            WHERE existing.parent_course_id = p.id AND existing.date = ? AND existing.time = p.time
          )
      `).bind(crypto.randomUUID(), date, new Date().toISOString(), new Date().toISOString(), parent.id, branchId, date).run();
    }
  }
}

export function currentUtcDateKey(now = new Date()): string {
  // Class times are Chile-local wall-clock values, not UTC timestamps.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const read = (kind: 'year' | 'month' | 'day'): string =>
    parts.find((part) => part.type === kind)?.value ?? '';
  return `${read('year')}-${read('month')}-${read('day')}`;
}
