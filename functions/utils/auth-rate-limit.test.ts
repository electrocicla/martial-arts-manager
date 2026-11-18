// @vitest-environment node
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { D1BindValue, D1Database, D1PreparedStatement, D1Result, Env } from '../types/index';
import { reserveAuthRateLimit } from './auth-rate-limit';

const MIGRATION = readFileSync('migrations/add_auth_rate_limits.sql', 'utf8');
let database: DatabaseSync;

function fixture(): Env {
  const db: D1Database = {
    prepare(sql) {
      let params: D1BindValue[] = [];
      const execute = (): D1Result => {
        const statement = database.prepare(sql);
        const bindings = params.map((value) => {
          if (typeof value === 'boolean') return Number(value);
          if (value instanceof Date) return value.toISOString();
          if (value instanceof ArrayBuffer) return new Uint8Array(value);
          return value;
        });
        const rows = sql.includes('RETURNING') ? statement.all(...bindings) : (statement.run(...bindings), []);
        return { success: true, results: rows, meta: {
          changed_db: true, changes: 1, duration: 0, rows_read: 0, rows_written: 1, size_after: 0,
        } };
      };
      const stmt: D1PreparedStatement = {
        bind(...values) { params = values; return stmt; },
        async first<T>() { return (execute().results?.[0] ?? null) as T | null; },
        async all<T>() { return execute() as D1Result<T>; },
        async run() { return execute(); },
      };
      return stmt;
    },
    async batch<T>(statements: D1PreparedStatement[]) {
      database.exec('BEGIN');
      try {
        const rows: D1Result<T>[] = [];
        for (const statement of statements) rows.push(await statement.all<T>());
        database.exec('COMMIT');
        return rows;
      } catch (error: unknown) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return { DB: db, JWT_SECRET: 'test-only-quota-material', TURNSTILE_SECRET: '', AVATARS: {} as Env['AVATARS'] };
}

function req(ip = '192.0.2.1', org = 'hamarr', forwarded = '203.0.113.10') {
  return new Request('https://hamarr.cl/api/auth/login', {
    method: 'POST', headers: {
      'CF-Connecting-IP': ip, 'X-Forwarded-For': forwarded,
      'X-Client-Platform': 'native', 'X-Organization-ID': org,
    },
  });
}

beforeEach(() => {
  database = new DatabaseSync(':memory:');
  database.exec(MIGRATION);
  database.exec(MIGRATION);
});
afterEach(() => database.close());

describe('durable authentication quotas using actual SQLite UPSERT semantics', () => {
  it('shares the IP cap across Worker instances, tenants and spoofed forwarded addresses', async () => {
    const now = 1_000_000;
    for (let i = 0; i < 10; i++) {
      expect(await reserveAuthRateLimit(fixture(), req('192.0.2.1', i % 2 ? 'hamarr' : 'manzur', '203.0.113.' + i), 'login', 'a@example.test', now)).toBeNull();
    }
    expect((await reserveAuthRateLimit(fixture(), req(), 'login', 'a@example.test', now))?.status).toBe(429);
    expect(await reserveAuthRateLimit(fixture(), req(), 'login', 'a@example.test', now + 60_000)).toBeNull();
  });

  it('limits distributed attempts on an account and partitions registration from login', async () => {
    const now = 1_000_000;
    for (let i = 0; i < 25; i++) {
      expect(await reserveAuthRateLimit(fixture(), req('192.0.2.' + i), 'login', ' Member@example.test ', now)).toBeNull();
    }
    expect((await reserveAuthRateLimit(fixture(), req('192.0.2.255'), 'login', 'member@example.test', now))?.status).toBe(429);
    expect(await reserveAuthRateLimit(fixture(), req('192.0.2.255', 'manzur'), 'login', 'member@example.test', now)).toBeNull();
    expect(await reserveAuthRateLimit(fixture(), req('192.0.2.255'), 'register', 'member@example.test', now)).toBeNull();
    const keys = database.prepare('SELECT bucket FROM auth_rate_limits').all();
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.every(({ bucket }) => typeof bucket === 'string' && /^[a-f0-9]{64}$/.test(bucket))).toBe(true);
  });

  it('fails closed on an unavailable shared schema or signing material', async () => {
    expect((await reserveAuthRateLimit({ ...fixture(), JWT_SECRET: '' }, req(), 'login', 'a@example.test'))?.status).toBe(503);
    database.exec('DROP TABLE auth_rate_limits');
    expect((await reserveAuthRateLimit(fixture(), req(), 'login', 'a@example.test'))?.status).toBe(503);
  });
});
