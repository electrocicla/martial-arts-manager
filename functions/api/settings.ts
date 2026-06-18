import { Env } from '../types/index';
import { authenticateUser } from '../middleware/auth';
import {
  branchErrorResponse,
  MAIN_BRANCH_ID,
  resolveRequestBranchId,
} from '../utils/branches';

const BRANCH_SCOPED_SECTIONS = new Set(['dojo', 'payment', 'mercadopago']);

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return new Response(JSON.stringify({ error: auth.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const ownerId = auth.user.id;
    const branchId = await resolveRequestBranchId(request, env, auth.user);
    const { results } = (await env.DB.prepare(
      `SELECT section, value
       FROM settings
       WHERE owner_id = ?
         AND (branch_id IS NULL OR branch_id = ?)
       ORDER BY CASE WHEN branch_id IS NULL THEN 0 ELSE 1 END`
    ).bind(ownerId, branchId).all()) as { results: Array<{ section: string; value: string }> };

    const out: Record<string, unknown> = {};
    for (const r of results) {
      try { out[r.section] = JSON.parse(r.value); } catch { out[r.section] = r.value; }
    }

    return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;
    console.error('[Get Settings Error]', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestPut({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return new Response(JSON.stringify({ error: auth.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const body = await request.json() as { section: string; value: unknown };
    const { section, value } = body;
    if (!section) return new Response(JSON.stringify({ error: 'section is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const ownerId = auth.user.id;
    const branchId = BRANCH_SCOPED_SECTIONS.has(section)
      ? await resolveRequestBranchId(request, env, auth.user)
      : null;
    const now = new Date().toISOString();
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    const id = branchId && branchId !== MAIN_BRANCH_ID
      ? `${ownerId}-${branchId}-${section}`
      : `${ownerId}-${section}`;

    // Upsert
    await env.DB.prepare(
      `INSERT INTO settings (id, owner_id, section, value, branch_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET value = ?, updated_at = ?`
    ).bind(id, ownerId, section, str, branchId, now, now, str, now).run();

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    const branchResponse = branchErrorResponse(error);
    if (branchResponse) return branchResponse;
    console.error('[Put Settings Error]', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
