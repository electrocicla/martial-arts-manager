import type { OrganizationId } from '../lib/organization';
import type { AcademyBrand } from './catalog';
import siteCatalog from './site.json';

const catalog: Readonly<Record<OrganizationId, AcademyBrand>> = {
  hamarr: { ...siteCatalog.hamarr, id: 'hamarr' },
  manzur: { ...siteCatalog.manzur, id: 'manzur' },
};

/** Test-only catalog lookup; intentionally separate from the production brand. */
export function getAcademyBrand(organizationId: OrganizationId): AcademyBrand {
  return catalog[organizationId];
}
