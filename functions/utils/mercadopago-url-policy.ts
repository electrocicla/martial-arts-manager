/** Trusted, fixed tenant callback origins; client and stored settings cannot add hosts. */
const ACADEMY_HOSTS = {
  hamarr: new Set(['hamarr.cl', 'www.hamarr.cl']),
  manzur: new Set(['manzurbros.pages.dev', 'manzurbros.cl', 'www.manzurbros.cl']),
} as const;

interface PreferenceReturnUrls {
  successUrl?: string;
  failureUrl?: string;
  pendingUrl?: string;
}

interface ConfiguredCallbackUrls extends PreferenceReturnUrls {
  notificationUrl?: string;
}

export interface ResolvedMercadoPagoUrls {
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
  notificationUrl: string;
}

function allowedUrl(organizationId: string, urlText: string, webhook: boolean): string {
  const allowed = ACADEMY_HOSTS[organizationId as keyof typeof ACADEMY_HOSTS];
  if (!allowed) throw new Error('Unknown payment organization');

  let url: URL;
  try {
    url = new URL(urlText);
  } catch {
    throw new Error('Payment callback URL is invalid');
  }
  if (url.protocol !== 'https:' || !allowed.has(url.hostname.toLowerCase()) ||
    url.port || url.username || url.password || url.hash) {
    throw new Error('Payment callback URL must use an approved academy HTTPS origin');
  }
  if (webhook && (url.pathname !== '/api/payments/mercadopago/webhook' || url.search)) {
    throw new Error('Payment webhook URL must use the canonical endpoint');
  }
  if (!webhook && url.pathname.startsWith('/api/')) {
    throw new Error('Payment return URL must be a frontend route');
  }
  return url.href;
}

/** Select callbacks without accepting foreign-site redirects or callbacks. */
export function resolveMercadoPagoUrls(
  organizationId: string,
  requested: PreferenceReturnUrls,
  configured: ConfiguredCallbackUrls,
): ResolvedMercadoPagoUrls {
  const defaultHost = organizationId === 'manzur' ? 'manzurbros.pages.dev' : 'hamarr.cl';
  const origin = 'https://' + defaultHost;
  return {
    successUrl: allowedUrl(organizationId,
      requested.successUrl || configured.successUrl || origin + '/payments?mp=success', false),
    failureUrl: allowedUrl(organizationId,
      requested.failureUrl || configured.failureUrl || origin + '/payments?mp=failure', false),
    pendingUrl: allowedUrl(organizationId,
      requested.pendingUrl || configured.pendingUrl || origin + '/payments?mp=pending', false),
    notificationUrl: allowedUrl(organizationId,
      configured.notificationUrl || origin + '/api/payments/mercadopago/webhook', true),
  };
}
