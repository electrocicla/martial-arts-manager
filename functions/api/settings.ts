import { Env } from '../types/index';
import { authenticateUser } from '../middleware/auth';

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) return new Response(JSON.stringify({ error: auth.error }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const ownerId = auth.user.id;
    const { results } = (await env.DB.prepare(
      'SELECT section, value FROM settings WHERE owner_id = ?'
    ).bind(ownerId).all()) as { results: Array<{ section: string; value: string }> };

    const out: Record<string, unknown> = {};
    for (const r of results) {
      try { out[r.section] = JSON.parse(r.value); } catch { out[r.section] = r.value; }
    }

    return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
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
    const now = new Date().toISOString();
    const str = typeof value === 'string' ? value : JSON.stringify(value);

    // Upsert
    await env.DB.prepare(
      `INSERT INTO settings (id, owner_id, section, value, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET value = ?, updated_at = ?`
    ).bind(`${ownerId}-${section}`, ownerId, section, str, now, now, str, now).run();

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[Put Settings Error]', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
