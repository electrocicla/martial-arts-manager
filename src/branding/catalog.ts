import type { OrganizationId } from '../lib/organization';

/** One typed, compile-time tenant identity. Never derive branding from the current host or user storage. */
export interface AcademyBrand {
  readonly id: OrganizationId;
  readonly name: string;
  readonly shortName: string;
  readonly fullName: string;
  readonly description: string;
  readonly keywords: string;
  readonly pageTitle: string;
  readonly socialTitle: string;
  readonly socialDescription: string;
  readonly siteUrl: string;
  readonly themeColor: string;
  readonly backgroundColor: string;
  readonly iconUrl: string;
  readonly iconType: string;
  readonly iconAlt: string;
  readonly socialImageUrl: string;
  readonly instagramUrl: string;
  readonly androidApkUrl: string | null;
  readonly pwaCacheName: string;
  /** Public widget identifier; never a server-side Turnstile secret. */
  readonly turnstileSiteKey: string;
}

/**
 * Replaced by Vite with the single selected academy's metadata. The test-only lookup
 * lives in a separate module to prevent dual-brand metadata in the JS output.
 */
declare const __ACADEMY_BRAND__: AcademyBrand;
export const ACADEMY_BRAND: AcademyBrand = __ACADEMY_BRAND__;
