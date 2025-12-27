import { Env } from '../types/index';

export async function onRequestGet({ env }: { env: Env }) {
  try {
    const { results } = await env.DB.prepare(
      "SELECT id, name, avatar_url FROM users WHERE role IN ('instructor', 'admin') AND is_active = 1 ORDER BY name ASC"
    ).all();
    
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
