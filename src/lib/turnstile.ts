import { ACADEMY_BRAND } from '../branding/catalog';

// Manzur is pinned to its own hostname-approved public widget. Retain the
// existing environment override for Hamarr deployments and local QA only.
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_ORGANIZATION_ID === 'manzur'
  ? ACADEMY_BRAND.turnstileSiteKey
  : import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || ACADEMY_BRAND.turnstileSiteKey;

export function isTurnstileConfigured(): boolean {
  return TURNSTILE_SITE_KEY.length > 0;
}
