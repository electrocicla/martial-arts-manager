/** Fixed, build-time academy identity. Never source tenant selection from user storage or URL. */
export type OrganizationId = 'hamarr' | 'manzur';

export function resolveOrganizationId(configuredId: string | undefined): OrganizationId {
  const id = configuredId?.trim().toLowerCase() || 'hamarr';
  if (id === 'hamarr' || id === 'manzur') return id;
  throw new Error(`Unsupported academy organization: ${id}`);
}

export const ORGANIZATION_ID: OrganizationId = resolveOrganizationId(import.meta.env.VITE_ORGANIZATION_ID);

/** No build may assume a globally named main branch; resolve its ID from /api/branches. */
export const INITIAL_BRANCH_ID = '';

/** Select only a branch returned by the organization's authorized branch endpoint. */
export function resolveAuthorizedBranchId(
  branches: readonly { id: string; is_main: number }[],
  requestedId: string | null | undefined,
): string | null {
  if (requestedId && branches.some((branch) => branch.id === requestedId)) return requestedId;
  return branches.find((branch) => branch.is_main === 1)?.id ?? branches[0]?.id ?? null;
}

export const BRANCH_STORAGE_KEY = `${ORGANIZATION_ID}:selected-branch`;
export const AUTH_SESSION_HINT_KEY = `${ORGANIZATION_ID}:auth-session`;

/** Header precedence is fixed by this build, not callers or a tenant selector. */
export function organizationHeaders(init?: HeadersInit): Headers {
  const headers = new Headers(init);
  headers.set('X-Organization-ID', ORGANIZATION_ID);
  return headers;
}
