import { describe, expect, it, vi } from 'vitest';
import type { D1Database } from '../types/index';
import { rotateSessionForRefresh } from './db';

function fakeDatabase(results: Array<{ results: Array<{ id: string }> }>) {
  const statements: Array<{ sql: string; args: unknown[] }> = [];
  const batch = vi.fn().mockResolvedValue(results);
  const db = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          statements.push({ sql, args });
          return { sql, args };
        },
      };
    },
    batch,
  } as unknown as D1Database;
  return { db, batch, statements };
}

describe('D1 atomic refresh rotation', () => {
  const next = { id: 'session-new', refresh_token: 'new.jwt', expires_at: '2027-01-01T00:00:00Z' };
  it('inserts from a live predecessor and deletes only that predecessor in a single transactional batch', async () => {
    const { db, batch, statements } = fakeDatabase([
      { results: [{ id: 'session-new' }] }, { results: [{ id: 'session-old' }] },
    ]);
    await expect(rotateSessionForRefresh(db, 'old.jwt', 'user-1', next)).resolves.toBe(true);
    expect(batch).toHaveBeenCalledTimes(1);
    expect(statements).toHaveLength(2);
    expect(statements[0].sql).toContain('INSERT INTO sessions');
    expect(statements[0].sql).toContain('SELECT ?, user_id, ?, ?, ?');
    expect(statements[0].sql).toContain('WHERE refresh_token = ? AND user_id = ?');
    expect(statements[1].sql).toContain('DELETE FROM sessions');
    expect(statements[0].args).toContain('old.jwt');
    expect(statements[1].args).toEqual(['old.jwt', 'user-1']);
  });
  it('fails closed when a stale request cannot rotate a consumed session', async () => {
    const { db } = fakeDatabase([{ results: [] }, { results: [] }]);
    await expect(rotateSessionForRefresh(db, 'old.jwt', 'user-1', next)).resolves.toBe(false);
  });
  it('propagates insert errors; D1 must roll back the combined transaction', async () => {
    const { db, batch } = fakeDatabase([]);
    batch.mockRejectedValueOnce(new Error('D1 uniqueness violation'));
    await expect(rotateSessionForRefresh(db, 'old.jwt', 'user-1', next))
      .rejects.toThrow('D1 uniqueness violation');
  });
});
