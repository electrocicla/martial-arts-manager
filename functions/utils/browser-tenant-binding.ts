/**
 * Host-bound tenant policy for Cloudflare Pages Functions.
 *
 * The Pages deployment pins its own organization. Browser-supplied tenant
 * headers and Host/Origin alone do not authorize a different organization.
 * A transport candidate without browser fetch metadata is NOT an identity or
 * a privileged exemption from JWT, membership, role and branch authorization.
 */
export type SiteOrganization = 'hamarr' | 'manzur';

export type TenantBinding =
  | { allowed: true; siteOrganizationId: SiteOrganization; transport: 'browser' | 'native-candidate' }
  | { allowed: false; status: 403 | 400; code: string; error: string };

const CANONICAL_HOSTS: Readonly<Record<string, SiteOrganization>> = {
  'hamarr.cl': 'hamarr',
  'www.hamarr.cl': 'hamarr',
  'manzurbros.cl': 'manzur',
  'www.manzurbros.cl': 'manzur',
};

function deny(code: string, error: string, status: 403 | 400 = 403): TenantBinding {
  return { allowed: false, status, code, error };
}

function configuredSiteOrganization(value: string | undefined): SiteOrganization | null {
  if (value === undefined) return null;
  if (value === 'hamarr' || value === 'manzur') return value;
  return null;
}

/** Browser fetch metadata always wins over any caller-supplied platform label. */
export function hasBrowserRequestMetadata(request: Request): boolean {
  return request.headers.has('Origin') || request.headers.has('Sec-Fetch-Site');
}

/**
 * This detects only a transport shape, not a trusted app identity.
 * It never grants membership, permissions, or an authenticated session.
 */
export function isNativeTransportCandidate(request: Request): boolean {
  return request.headers.get('X-Client-Platform') === 'native' &&
    !hasBrowserRequestMetadata(request);
}

/**
 * Bind browser API tenant selection to the independently configured Pages
 * environment, with a legacy HAMARR-only compatibility rule for hamarr.cl.
 * Other/custom/preview hosts require an explicit per-project environment pin.
 */
export function evaluateTenantBinding(
  request: Request,
  siteOrganizationSetting: string | undefined,
): TenantBinding {
  const url = new URL(request.url);
  const expectedForHost = CANONICAL_HOSTS[url.hostname.toLowerCase()];
  const siteOrganizationId = configuredSiteOrganization(siteOrganizationSetting);

  if (siteOrganizationSetting !== undefined && siteOrganizationId === null) {
    return deny('SITE_ORGANIZATION_MISCONFIGURED', 'Site organization is not configured safely');
  }
  if (expectedForHost === 'manzur' && !siteOrganizationId) {
    return deny('SITE_ORGANIZATION_REQUIRED', 'Site organization binding is required');
  }
  if (!expectedForHost && !siteOrganizationId) {
    return deny('SITE_ORGANIZATION_REQUIRED', 'Site organization binding is required');
  }
  if (expectedForHost && siteOrganizationId && expectedForHost !== siteOrganizationId) {
    return deny('SITE_HOST_ORGANIZATION_MISMATCH', 'Site organization does not match the hostname');
  }
  const configured = siteOrganizationId ?? expectedForHost;
  if (!configured) {
    return deny('SITE_ORGANIZATION_REQUIRED', 'Site organization binding is required');
  }

  // Native requests can legitimately target hamarr.cl for either academy, but
  // the caller-set platform hint is never proof of application identity.
  if (isNativeTransportCandidate(request)) {
    return { allowed: true, siteOrganizationId: configured, transport: 'native-candidate' };
  }

  const isApi = url.pathname === '/api' || url.pathname.startsWith('/api/');
  if (isApi) {
    // Navigation to the public website from an external link is legitimate;
    // cross-origin API actions are not, regardless of the platform header.
    const origin = request.headers.get('Origin');
    if (request.headers.has('Origin') && origin !== url.origin) {
      return deny('BROWSER_ORIGIN_MISMATCH', 'Cross-origin API requests are not allowed');
    }
    const fetchSite = request.headers.get('Sec-Fetch-Site');
    if (request.headers.has('Sec-Fetch-Site') && fetchSite !== 'same-origin' && fetchSite !== 'none') {
      return deny('BROWSER_FETCH_SITE_DENIED', 'Cross-site API requests are not allowed');
    }
    const organization = request.headers.get('X-Organization-ID')?.trim();
    // Old HAMARR clients without a header retain their original default.
    // Manzur must never silently fall back to HAMARR on header omission.
    if ((!organization && configured !== 'hamarr') ||
      (organization && organization !== configured)) {
      return deny('BROWSER_TENANT_MISMATCH', 'Browser organization does not match this site', 403);
    }
  }
  return { allowed: true, siteOrganizationId: configured, transport: 'browser' };
}

export function tenantBindingErrorResponse(binding: Extract<TenantBinding, { allowed: false }>): Response {
  return new Response(JSON.stringify({ error: binding.error, code: binding.code }), {
    status: binding.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
