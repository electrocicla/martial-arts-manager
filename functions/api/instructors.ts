import type { Env } from '../types/index';
import { getRequestedOrganizationId, requireActiveOrganization, organizationErrorResponse } from '../utils/organizations';

export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    const organizationId = getRequestedOrganizationId(request);
    await requireActiveOrganization(env, organizationId);
    const { results } = await env.DB.prepare(`
      SELECT u.id, u.name, u.avatar_url
      FROM organization_memberships om
      INNER JOIN users u ON u.id = om.user_id
      WHERE om.organization_id = ?
        AND om.role IN ('admin', 'instructor')
        AND om.status = 'active' AND om.is_active = 1
        AND u.is_active = 1
      ORDER BY u.name ASC
    `).bind(organizationId).all<{ id: string; name: string; avatar_url: string | null }>();
    return new Response(JSON.stringify(results ?? []), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: unknown) {
    const response = organizationErrorResponse(error);
    if (response) return response;
    console.error('List instructors failed:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
