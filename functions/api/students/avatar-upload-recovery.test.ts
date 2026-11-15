import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../types/index';

const auth = vi.hoisted(() => ({ authenticateUser: vi.fn() }));
vi.mock('../../middleware/auth', () => ({
  authenticateUser: auth.authenticateUser,
}));
vi.mock('../../utils/branches', () => ({
  resolveRequestBranchId: async () => 'branch-m',
  branchErrorResponse: () => null,
}));
import { onRequestPost } from './avatar';

function avatarRequest(): Request {
  const form = new FormData();
  form.append('studentId', 'student-m');
  form.append('avatar', new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'avatar.png', { type: 'image/png' }));
  return new Request('https://manzurbros.pages.dev/api/students/avatar', { method: 'POST', body: form });
}
function fixture(result: 'success' | 'db-failure' | 'stale') {
  const oldUrl = '/api/avatars?key=avatars%2Fmanzur%2Fbranch-m%2Fold.png';
  const put = vi.fn().mockResolvedValue({});
  const del = vi.fn().mockResolvedValue(undefined);
  const statements: string[] = [];
  const prepare = vi.fn((sql: string) => {
    statements.push(sql);
    return {
      bind: (...args: unknown[]) => ({
        all: async () => ({ results: [{ id: 'student-m', avatar_url: oldUrl }] }),
        sql, args,
      }),
    };
  });
  const batch = vi.fn().mockImplementation(async () => {
    if (result === 'db-failure') throw new Error('D1 failed to update linked user');
    return [
      { results: result === 'success' ? [{ id: 'student-m' }] : [] },
      { results: [] },
    ];
  });
  const env = { DB: { prepare, batch }, AVATARS: { put, delete: del } } as unknown as Env;
  return { env, put, del, batch, statements, oldUrl };
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.authenticateUser.mockResolvedValue({
    authenticated: true,
    user: { id: 'admin-m', role: 'admin', organization_id: 'manzur' },
  });
});

describe('avatar R2 write / D1 reference consistency', () => {
  it('compensates newly uploaded R2 object after D1 transaction failure, never removes old avatar', async () => {
    const fx = fixture('db-failure');
    const response = await onRequestPost({ request: avatarRequest(), env: fx.env });
    expect(response.status).toBe(500);
    const key = fx.put.mock.calls[0][0] as string;
    expect(key).toMatch(/^avatars\/manzur\/branch-m\/student-m-/);
    expect(fx.del).toHaveBeenCalledExactlyOnceWith(key);
    expect(key).not.toContain('old.png');
    expect(fx.batch).toHaveBeenCalledOnce();
  });

  it('treats a stale student pointer update as a conflict and cleans only the new R2 key', async () => {
    const fx = fixture('stale');
    expect((await onRequestPost({ request: avatarRequest(), env: fx.env })).status).toBe(500);
    expect(fx.del).toHaveBeenCalledExactlyOnceWith(fx.put.mock.calls[0][0]);
  });

  it('uses a transaction and previous-pointer compare-and-swap for successful upload', async () => {
    const fx = fixture('success');
    expect((await onRequestPost({ request: avatarRequest(), env: fx.env })).status).toBe(200);
    expect(fx.del).not.toHaveBeenCalled();
    expect(fx.statements.some(sql => sql.includes('AND avatar_url IS ?'))).toBe(true);
    expect(fx.statements.some(sql => sql.includes('AND EXISTS (') && sql.includes('s.avatar_url = ?'))).toBe(true);
    expect(fx.batch).toHaveBeenCalledOnce();
  });
});
