import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../types/index';

const auth = vi.hoisted(() => ({
  authenticateUser: vi.fn(),
  getRefreshTokenFromCookies: vi.fn(() => null as string | null),
}));

vi.mock('../middleware/auth', () => ({
  authenticateUser: auth.authenticateUser,
  getRefreshTokenFromCookies: auth.getRefreshTokenFromCookies,
  isNativeAuthRequest: (request: Request) =>
    request.headers.get('X-Client-Platform') === 'native' &&
    !request.headers.has('Origin') && !request.headers.has('Sec-Fetch-Site'),
}));

import { onRequestGet } from './avatars';

const KEY = 'avatars/manzur/branch-1/student-1-image.webp';
const URL = '/api/avatars?key=' + encodeURIComponent(KEY);

interface StudentAvatar {
  avatar_url: string;
  branch_id: string;
  instructor_id: string | null;
  created_by: string | null;
}

function fixtures(row: StudentAvatar | null = {
  avatar_url: URL,
  branch_id: 'branch-1',
  instructor_id: 'instructor-1',
  created_by: 'instructor-1',
}, branchAllowed = true) {
  const first = vi.fn().mockResolvedValue(row);
  const bind = vi.fn(() => ({ first }));
  const branchFirst = vi.fn().mockResolvedValue(branchAllowed ? { allowed: 1 } : null);
  const branchBind = vi.fn(() => ({ first: branchFirst }));
  const prepare = vi.fn((sql: string) =>
    sql.includes('FROM branch_staff') ? { bind: branchBind } : { bind });
  const get = vi.fn().mockResolvedValue({
    customMetadata: { studentId: 'student-1' },
    httpMetadata: { contentType: 'image/webp' },
    httpEtag: '"hash"',
    arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
  });
  const env = {
    SITE_ORGANIZATION_ID: 'manzur',
    DB: { prepare },
    AVATARS: { get },
  } as unknown as Env;
  return { env, first, bind, branchBind, branchFirst, prepare, get };
}

function request(origin = 'https://manzurbros.pages.dev', headers: HeadersInit = {}): Request {
  return new Request(origin + URL, {
    headers: { Authorization: 'Bearer valid', 'X-Organization-ID': 'manzur', ...headers },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.authenticateUser.mockResolvedValue({
    authenticated: true,
    user: {
      id: 'instructor-1', email: 'coach@example.test', name: 'Coach',
      role: 'instructor', organization_id: 'manzur', platform_admin: false,
    },
  });
});

describe('authenticated shared-R2 avatar reads', () => {
  it('serves a current Manzur avatar only when authorized and tenant-linked in D1', async () => {
    const { env, bind } = fixtures();
    const result = await onRequestGet({ request: request(), env });
    expect(result.status).toBe(200);
    expect(result.headers.get('Cache-Control')).toBe('private, max-age=120');
    expect(bind).toHaveBeenCalledWith('student-1', 'manzur');
  });

  it('enforces active instructor membership in the avatar student branch', async () => {
    const denied = fixtures(undefined, false);
    expect((await onRequestGet({ request: request(), env: denied.env })).status).toBe(404);
    expect(denied.branchBind).toHaveBeenCalledWith('branch-1', 'instructor-1', 'manzur');

    const allowed = fixtures();
    expect((await onRequestGet({ request: request(), env: allowed.env })).status).toBe(200);
    expect(allowed.branchBind).toHaveBeenCalledWith('branch-1', 'instructor-1', 'manzur');
  });

  it('blocks unauthenticated reads without exposing an R2 object', async () => {
    auth.authenticateUser.mockResolvedValue({ authenticated: false, error: 'Unauthorized' });
    const { env, get } = fixtures();
    const result = await onRequestGet({ request: request(), env });
    expect(result.status).toBe(401);
    expect(get).not.toHaveBeenCalled();
  });

  it('denies a student from a different organization and old/stale avatar references', async () => {
    const { env } = fixtures(null);
    expect((await onRequestGet({ request: request(), env })).status).toBe(404);

    const mismatched = fixtures({ avatar_url: '/api/avatars?key=avatars%2Fmanzur%2Fother.webp',
      branch_id: 'branch-1', instructor_id: 'instructor-1', created_by: null });
    expect((await onRequestGet({ request: request(), env: mismatched.env })).status).toBe(404);
  });

  it('prevents students from reading another student avatar even within the tenant', async () => {
    auth.authenticateUser.mockResolvedValue({
      authenticated: true,
      user: {
        id: 'student-user', email: 'student@example.test', name: 'Student',
        role: 'student', student_id: 'student-other', organization_id: 'manzur', platform_admin: false,
      },
    });
    const { env } = fixtures();
    expect((await onRequestGet({ request: request(), env })).status).toBe(404);
  });

  it('rejects unsafe keys and noncanonical host binding', async () => {
    const { env, get } = fixtures();
    const malformed = new Request('https://manzurbros.pages.dev/api/avatars?key=other%2Ffoo', {
      headers: { Authorization: 'Bearer valid' },
    });
    expect((await onRequestGet({ request: malformed, env })).status).toBe(404);
    expect(get).not.toHaveBeenCalled();
    const missingPin = { ...env, SITE_ORGANIZATION_ID: undefined } as Env;
    expect((await onRequestGet({ request: request(), env: missingPin })).status).toBe(403);
  });

  it('preserves authenticated Manzur Native access through the existing Hamarr API origin', async () => {
    const { env } = fixtures();
    const nativeEnv = { ...env, SITE_ORGANIZATION_ID: 'hamarr' } as Env;
    const result = await onRequestGet({ request: request('https://hamarr.cl', {
      'X-Client-Platform': 'native',
    }), env: nativeEnv });
    expect(result.status).toBe(200);
  });
});
