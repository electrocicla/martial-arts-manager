// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTokens, verifyJWT } from './jwt';
import { attachNativeAvatarGrants, canonicalAvatarReference, readNativeAvatarGrant } from './native-avatar-grants';
import type { Env } from '../types/index';
import { onRequestGet } from '../api/avatars';

const SECRET = 'test-only-image-grant-signing-material';
const KEY = 'avatars/manzur/branch-m/student-m-photo.webp';
const PROXY = '/api/avatars?key=' + encodeURIComponent(KEY);
const ORIGIN = 'https://hamarr.cl';
const fakeUser = vi.hoisted(() => ({ active: true, membership: true, role: 'student', student: 'student-m', org: 'manzur' }));
vi.mock('./db', () => ({
  findUserById: vi.fn(async () => ({ id: 'user-m', name: 'Fixture', email: 'fixture@example.test', is_active: fakeUser.active ? 1 : 0 })),
  findSessionByRefreshToken: vi.fn(async () => null),
}));
vi.mock('./organizations', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./organizations')>();
  return { ...actual, resolveAuthenticatedOrganization: vi.fn(async () => {
    if (!fakeUser.membership) throw new Error('revoked membership');
    return { organizationId: fakeUser.org, role: fakeUser.role, studentId: fakeUser.student, platformAdmin: false };
  }) };
});

function envFixture(): { env: Env; get: ReturnType<typeof vi.fn>; bind: ReturnType<typeof vi.fn> } {
  const get = vi.fn(async () => ({
    customMetadata: { studentId: 'student-m', organizationId: 'manzur', branchId: 'branch-m' },
    httpMetadata: { contentType: 'image/webp' },
    httpEtag: '"fixture"',
    arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
  }));
  const first = vi.fn(async () => ({
    avatar_url: PROXY, branch_id: 'branch-m', instructor_id: 'instructor-m', created_by: 'instructor-m',
  }));
  const bind = vi.fn(() => ({ first }));
  const env = { JWT_SECRET: SECRET, SITE_ORGANIZATION_ID: 'hamarr', DB: { prepare: vi.fn(() => ({ bind })) },
    AVATARS: { get } } as unknown as Env;
  return { env, get, bind };
}

async function issue(env: Env, now = Math.floor(Date.now() / 1000)) {
  const token = (await createTokens('user-m', 'fixture@example.test', 'student', SECRET, 'manzur')).accessToken;
  const request = new Request(ORIGIN + '/api/students', {
    headers: { 'Authorization': 'Bearer ' + token, 'X-Client-Platform': 'native', 'X-Organization-ID': 'manzur' },
  });
  const result = await attachNativeAvatarGrants(request, env, Response.json({ items: [{ avatar_url: PROXY }] }), now);
  const data = await result.json() as { items: { avatar_url: string }[] };
  return { src: data.items[0].avatar_url, token, result, request };
}
afterEach(() => { fakeUser.active = true; fakeUser.membership = true; fakeUser.role = 'student'; fakeUser.student = 'student-m'; fakeUser.org = 'manzur'; vi.clearAllMocks(); });

describe('temporary Native image capability, server and legacy Image URI contract', () => {
  it('authorizes the existing no-header Native Image request with an exact, expiring, tenant-bound grant', async () => {
    const { env, bind, get } = envFixture();
    const { src, token, result } = await issue(env);
    expect(src).toContain('&imageGrant=');
    expect(src).not.toContain(token);
    expect(result.headers.get('Cache-Control')).toBe('private, no-store');
    const response = await onRequestGet({ request: new Request(ORIGIN + src), env });
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(bind).toHaveBeenCalledWith('student-m', 'manzur');
    expect(get).toHaveBeenCalledWith(KEY);
    const capability = new URL(ORIGIN + src).searchParams.get('imageGrant') ?? '';
    expect(await verifyJWT(capability, SECRET)).toBeNull();
    expect(canonicalAvatarReference(src)).toBe(PROXY);
  });

  it('rejects raw anonymous, tampered, expired, cross-object and cross-host requests before R2', async () => {
    const { env, get } = envFixture();
    const now = Math.floor(Date.now() / 1000);
    const { src } = await issue(env, now);
    const url = new URL(ORIGIN + src);
    const tampered = new URL(url); tampered.searchParams.set('imageGrant', (url.searchParams.get('imageGrant') ?? '') + 'x');
    const changed = new URL(url); changed.searchParams.set('key', 'avatars/hamarr/other/image.webp');
    for (const request of [
      new Request(ORIGIN + PROXY), new Request(tampered), new Request(changed),
      new Request(url, { headers: { 'X-Organization-ID': 'hamarr' } }),
    ]) expect((await onRequestGet({ request, env })).status).toBe(401);
    expect(await readNativeAvatarGrant(new Request(url), env, KEY, now + 601)).toBeNull();
    expect(await readNativeAvatarGrant(new Request('https://manzurbros.pages.dev' + src), env, KEY)).toBeNull();
    expect(get).not.toHaveBeenCalled();
  });

  it('rechecks live membership, account and subject authorization after a grant was issued', async () => {
    const { env, get } = envFixture();
    const { src } = await issue(env);
    fakeUser.membership = false;
    expect((await onRequestGet({ request: new Request(ORIGIN + src), env })).status).toBe(401);
    fakeUser.membership = true; fakeUser.active = false;
    expect((await onRequestGet({ request: new Request(ORIGIN + src), env })).status).toBe(401);
    expect(get).not.toHaveBeenCalled();
    fakeUser.active = true; fakeUser.student = 'another-student';
    expect((await onRequestGet({ request: new Request(ORIGIN + src), env })).status).toBe(404);
  });

  it('does not issue a grant from a spoofed Native marker without valid auth or from the browser', async () => {
    const { env } = envFixture();
    const { request } = await issue(env);
    for (const req of [
      new Request(request.url, { headers: { 'X-Client-Platform': 'native', 'X-Organization-ID': 'manzur' } }),
      new Request(request, { headers: { 'X-Client-Platform': 'native', 'X-Organization-ID': 'manzur', 'Sec-Fetch-Site': 'same-origin' } }),
    ]) {
      const response = await attachNativeAvatarGrants(req, env, Response.json({ avatar_url: PROXY }));
      expect((await response.json() as { avatar_url: string }).avatar_url).toBe(PROXY);
    }
  });

  it('issues a link after actual login token issuance, not from an arbitrary response field', async () => {
    const { env } = envFixture();
    const { token } = await issue(env);
    const headers = { 'X-Client-Platform': 'native', 'X-Organization-ID': 'manzur' };
    const response = await attachNativeAvatarGrants(new Request(ORIGIN + '/api/auth/login', { method: 'POST', headers }), env,
      Response.json({ accessToken: token, user: { avatar_url: PROXY } }));
    const body = await response.json() as { user: { avatar_url: string } };
    expect(body.user.avatar_url).toContain('&imageGrant=');
    const unrelated = await attachNativeAvatarGrants(new Request(ORIGIN + '/api/auth/register', { method: 'POST', headers }), env,
      Response.json({ accessToken: token, avatar_url: PROXY }));
    expect((await unrelated.json() as { avatar_url: string }).avatar_url).toBe(PROXY);
  });
});
