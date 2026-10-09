import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/setup';
import { ApiClient } from './api-client';
import {
  AUTH_SESSION_HINT_KEY,
  BRANCH_STORAGE_KEY,
  INITIAL_BRANCH_ID,
  ORGANIZATION_ID,
  organizationHeaders,
  resolveAuthorizedBranchId,
  resolveOrganizationId,
} from './organization';

describe('fixed academy organization', () => {
  it('accepts only configured academies', () => {
    expect(resolveOrganizationId(undefined)).toBe('hamarr');
    expect(resolveOrganizationId(' MANZUR ')).toBe('manzur');
    expect(() => resolveOrganizationId('foreign')).toThrow();
  });
  it('sets the fixed organization header even when a caller tries to override it', () => {
    for (const supplied of [
      { 'X-Organization-ID': 'foreign' },
      new Headers({ 'X-Organization-ID': 'foreign' }),
      [['X-Organization-ID', 'foreign']] as [string, string][],
    ]) {
      expect(organizationHeaders(supplied).get('X-Organization-ID')).toBe(ORGANIZATION_ID);
    }
  });
  it('discovers the real main branch instead of assuming an organization-wide ID', () => {
    expect(INITIAL_BRANCH_ID).toBe('');
    expect(BRANCH_STORAGE_KEY).toBe(`${ORGANIZATION_ID}:selected-branch`);
    expect(AUTH_SESSION_HINT_KEY).toBe(`${ORGANIZATION_ID}:auth-session`);
  });
  it('selects only an authorized branch from the current organization', () => {
    const branches = [{ id: 'tenant-main', is_main: 1 }, { id: 'tenant-extra', is_main: 0 }];
    expect(resolveAuthorizedBranchId(branches, '')).toBe('tenant-main');
    expect(resolveAuthorizedBranchId(branches, 'foreign')).toBe('tenant-main');
    expect(resolveAuthorizedBranchId(branches, 'tenant-extra')).toBe('tenant-extra');
    expect(resolveAuthorizedBranchId([], 'foreign')).toBeNull();
  });
  it('sends the fixed academy and selected branch in authorized API requests', async () => {
    const client = new ApiClient();
    client.setAccessToken('test-token');
    client.setBranchId('selected-branch');
    const seen: string[] = [];
    server.use(http.get('/api/test/tenant-contract', ({ request }) => {
      seen.push(request.headers.get('X-Organization-ID') || '');
      seen.push(request.headers.get('X-Branch-ID') || '');
      seen.push(request.headers.get('Authorization') || '');
      return HttpResponse.json({ ok: true });
    }));
    const result = await client.get('/api/test/tenant-contract');
    expect(result.success).toBe(true);
    expect(seen).toEqual([ORGANIZATION_ID, 'selected-branch', 'Bearer test-token']);
  });

  it('omits an unknown branch rather than forcing HAMARR main', async () => {
    const client = new ApiClient();
    const seen: (string | null)[] = [];
    server.use(http.get('/api/test/main-branch', ({ request }) => {
      seen.push(request.headers.get('X-Organization-ID'));
      seen.push(request.headers.get('X-Branch-ID'));
      return HttpResponse.json({ ok: true });
    }));
    await client.get('/api/test/main-branch');
    expect(seen).toEqual([ORGANIZATION_ID, null]);
  });

});
