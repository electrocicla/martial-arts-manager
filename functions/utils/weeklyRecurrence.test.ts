import { describe, expect, it, vi } from 'vitest';
import type { D1BindValue, D1Database, D1PreparedStatement, D1Result } from '../types/index';
import { currentUtcDateKey, materializeWeeklyClasses, parseWeeklyPattern, weeklyOccurrenceDates } from './weeklyRecurrence';

describe('rolling weekly class recurrence', () => {
  it('validates pattern shape, days and finite end date', () => {
    expect(parseWeeklyPattern(JSON.stringify({ frequency: 'weekly', days: [1, 3, 5, 1] })))
      .toEqual({ frequency: 'weekly', days: [1, 3, 5] });
    expect(parseWeeklyPattern(JSON.stringify({ frequency: 'weekly', days: [9] }))).toBeNull();
    expect(parseWeeklyPattern(JSON.stringify({ frequency: 'weekly', days: [1], endDate: '2026-02-30' }))).toBeNull();
    expect(parseWeeklyPattern('{incorrect')).toBeNull();
  });

  it('enumerates correct weekdays from the series start and respects endDate', () => {
    const pattern = { frequency: 'weekly', days: [1, 3, 5], endDate: '2026-10-23' } as const;
    expect(weeklyOccurrenceDates('2026-10-14', { ...pattern, days: [...pattern.days] }, '2026-10-14', 14))
      .toEqual(['2026-10-14', '2026-10-16', '2026-10-19', '2026-10-21', '2026-10-23']);
    expect(weeklyOccurrenceDates('2026-10-20', { ...pattern, days: [...pattern.days] }, '2026-10-14', 14))
      .toEqual(['2026-10-21', '2026-10-23']);
    expect(weeklyOccurrenceDates('2026-10-14', { ...pattern, days: [...pattern.days] }, '2026-10-24', 14))
      .toEqual([]);
  });

  it('generates a Santiago calendar date independently of UTC rollover', () => {
    expect(currentUtcDateKey(new Date('2026-10-15T01:30:00.000Z'))).toBe('2026-10-14');
  });

  it('keeps tenant isolation, never regenerates deleted exceptions and only inserts missing sessions', async () => {
    interface Query { sql: string; values: D1BindValue[] }
    const writes: Query[] = [];
    const db: D1Database = {
      prepare(sql) {
        const q: Query = { sql, values: [] };
        const statement: D1PreparedStatement = {
          bind(...args) { q.values = args; return statement; },
          async all<T>(): Promise<D1Result<T>> {
            if (sql.includes('SELECT id, date, time')) {
              expect(q.values).toEqual(['manzur-branch']);
              return { success: true, results: [{ id: 'parent-1', date: '2026-10-14', time: '17:00',
                recurrence_pattern: JSON.stringify({ frequency: 'weekly', days: [3, 5], endDate: '2026-10-16' }) }] as T[] };
            }
            if (sql.includes('SELECT date FROM classes')) {
              expect(q.values.slice(0, 2)).toEqual(['parent-1', 'manzur-branch']);
              return { success: true, results: [{ date: '2026-10-14' }] as T[] };
            }
            return { success: true, results: [] };
          },
          async run(): Promise<D1Result> {
            writes.push(q);
            return { success: true, results: [] };
          },
          async first<T>(): Promise<T | null> { return null; },
        };
        return statement;
      },
      batch: vi.fn(async () => []),
    };
    await materializeWeeklyClasses(db, 'manzur-branch', '2026-10-14');
    expect(writes).toHaveLength(1);
    expect(writes[0].values[1]).toBe('2026-10-16');
    expect(writes[0].values).toContain('manzur-branch');
    expect(writes[0].sql).toContain('NOT EXISTS');
    expect(writes[0].sql).toContain('INSERT OR IGNORE');
  });
});
