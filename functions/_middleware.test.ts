import { afterEach, describe, expect, it, vi } from 'vitest';

import { onRequest } from './_middleware';
import type { Env } from './types/index';

const env = {} as Env;

function request(path = '/api/test'): Request {
  return new Request(`https://hamarr.cl${path}`, { method: 'GET' });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('global security middleware', () => {
  it('preserves successful JSON responses and attaches security headers', async () => {
    const response = await onRequest({
      request: request(),
      env,
      next: async () => Response.json({ ok: true }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    expect(response.headers.get('X-Request-ID')).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('replaces handler 5xx payloads so internal details cannot reach clients', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await onRequest({
      request: request('/api/private-data'),
      env,
      next: async () => Response.json(
        {
          error: 'D1_ERROR: no such column: password_hash',
          details: 'internal database schema detail',
        },
        { status: 500 }
      ),
    });

    const body = await response.json() as { error: string; requestId: string };

    expect(response.status).toBe(500);
    expect(body.error).toBe('Internal server error');
    expect(body.requestId).toBe(response.headers.get('X-Request-ID'));
    expect(JSON.stringify(body)).not.toContain('D1_ERROR');
    expect(JSON.stringify(body)).not.toContain('password_hash');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('converts uncaught handler failures into the same safe error envelope', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await onRequest({
      request: request('/api/crash'),
      env,
      next: async () => {
        throw new Error('secret implementation detail');
      },
    });

    const body = await response.json() as { error: string; requestId: string };

    expect(response.status).toBe(500);
    expect(body.error).toBe('Internal server error');
    expect(body.requestId).toBe(response.headers.get('X-Request-ID'));
    expect(JSON.stringify(body)).not.toContain('secret implementation detail');
  });
});
