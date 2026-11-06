import { describe, expect, it } from 'vitest';
import { evaluateTenantBinding, isNativeTransportCandidate } from './browser-tenant-binding';

function request(
  hostname: string,
  headers: HeadersInit = {},
  path = '/api/auth/refresh',
): Request {
  return new Request('https://' + hostname + path, { method: 'POST', headers });
}

describe('Cloudflare Pages host-bound browser tenants', () => {
  it('preserves only canonical HAMARR browser fallback without a deployment setting', () => {
    expect(evaluateTenantBinding(request('hamarr.cl'), undefined)).toMatchObject({
      allowed: true, siteOrganizationId: 'hamarr', transport: 'browser',
    });
    expect(evaluateTenantBinding(request('manzurbros.cl'), undefined)).toMatchObject({
      allowed: false, code: 'SITE_ORGANIZATION_REQUIRED',
    });
    expect(evaluateTenantBinding(request('preview.pages.dev'), undefined)).toMatchObject({
      allowed: false, code: 'SITE_ORGANIZATION_REQUIRED',
    });
  });

  it('rejects wrong/unknown environment pin even on a recognized production hostname', () => {
    expect(evaluateTenantBinding(request('hamarr.cl'), 'manzur')).toMatchObject({
      allowed: false, code: 'SITE_HOST_ORGANIZATION_MISMATCH',
    });
    expect(evaluateTenantBinding(request('manzurbros.cl'), 'hamarr')).toMatchObject({
      allowed: false, code: 'SITE_HOST_ORGANIZATION_MISMATCH',
    });
    expect(evaluateTenantBinding(request('hamarr.cl'), '')).toMatchObject({
      allowed: false, code: 'SITE_ORGANIZATION_MISCONFIGURED',
    });
    expect(evaluateTenantBinding(request('hamarr.cl'), 'MANZUR')).toMatchObject({
      allowed: false, code: 'SITE_ORGANIZATION_MISCONFIGURED',
    });
  });

  it('accepts explicitly pinned preview hosts for the matching browser tenant', () => {
    expect(evaluateTenantBinding(request('preview.pages.dev', {
      'X-Organization-ID': 'manzur', 'Sec-Fetch-Site': 'same-origin',
    }), 'manzur')).toMatchObject({
      allowed: true, siteOrganizationId: 'manzur', transport: 'browser',
    });
    expect(evaluateTenantBinding(request('preview.pages.dev', {
      'X-Organization-ID': 'hamarr', 'Sec-Fetch-Site': 'same-origin',
    }), 'manzur')).toMatchObject({
      allowed: false, code: 'BROWSER_TENANT_MISMATCH',
    });
  });

  it('refuses header-based tenant switching, including missing/empty Manzur header', () => {
    const browserHeaderCases: HeadersInit[] = [
      { 'X-Organization-ID': 'hamarr' },
      { 'X-Organization-ID': '' },
      {},
    ];
    for (const headers of browserHeaderCases) {
      expect(evaluateTenantBinding(request('manzurbros.cl', headers), 'manzur'))
        .toMatchObject({ allowed: false, code: 'BROWSER_TENANT_MISMATCH' });
    }
    expect(evaluateTenantBinding(request('hamarr.cl', {
      'X-Organization-ID': 'manzur', 'Sec-Fetch-Site': 'same-origin',
    }), 'hamarr')).toMatchObject({ allowed: false, code: 'BROWSER_TENANT_MISMATCH' });
  });

  it('does not trust the native header when browser Origin or Fetch Metadata is present', () => {
    const browserHeaderCases: HeadersInit[] = [
      { 'Origin': 'https://manzurbros.cl' },
      { 'Sec-Fetch-Site': 'same-origin' },
      { 'Sec-Fetch-Site': 'cross-site' },
    ];
    for (const headers of browserHeaderCases) {
      const input = request('hamarr.cl', {
        'X-Client-Platform': 'native',
        'X-Organization-ID': 'manzur',
        ...headers,
      });
      expect(isNativeTransportCandidate(input)).toBe(false);
      expect(evaluateTenantBinding(input, 'hamarr').allowed).toBe(false);
    }
  });

  it('rejects cross-origin and same-site cross-origin browser requests before reaching handlers', () => {
    expect(evaluateTenantBinding(request('hamarr.cl', {
      'X-Organization-ID': 'hamarr',
      'Origin': 'https://evil.example',
    }), 'hamarr')).toMatchObject({ allowed: false, code: 'BROWSER_ORIGIN_MISMATCH' });
    expect(evaluateTenantBinding(request('hamarr.cl', {
      'X-Organization-ID': 'hamarr',
      'Sec-Fetch-Site': 'same-site',
    }), 'hamarr')).toMatchObject({ allowed: false, code: 'BROWSER_FETCH_SITE_DENIED' });
  });

  it('allows external navigation to public branded pages without exposing their API', () => {
    expect(evaluateTenantBinding(request('manzurbros.cl', {
      'Sec-Fetch-Site': 'cross-site',
    }, '/'), 'manzur')).toMatchObject({ allowed: true, transport: 'browser' });
  });

  it('rejects empty spoofed browser metadata instead of treating it as native', () => {
    const browserHeaderCases: HeadersInit[] = [
      { Origin: '' },
      { 'Sec-Fetch-Site': '' },
    ];
    for (const headers of browserHeaderCases) {
      const inputHeaders = new Headers(headers);
      inputHeaders.set('X-Client-Platform', 'native');
      inputHeaders.set('X-Organization-ID', 'manzur');
      const input = request('hamarr.cl', inputHeaders);
      expect(isNativeTransportCandidate(input)).toBe(false);
      expect(evaluateTenantBinding(input, 'hamarr').allowed).toBe(false);
    }
  });

  it('preserves genuine native transport shape to hamarr.cl without granting an identity', () => {
    const input = request('hamarr.cl', {
      'X-Client-Platform': 'native',
      'X-Organization-ID': 'manzur',
    });
    expect(isNativeTransportCandidate(input)).toBe(true);
    expect(evaluateTenantBinding(input, 'hamarr')).toMatchObject({
      allowed: true, siteOrganizationId: 'hamarr', transport: 'native-candidate',
    });
    // Missing browser headers + a caller-set marker is not cryptographic proof.
    expect(isNativeTransportCandidate(request('hamarr.cl', {
      'X-Client-Platform': 'android',
      'X-Organization-ID': 'manzur',
    }))).toBe(false);
  });
});
