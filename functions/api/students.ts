interface Env {
  DB: any;
}

export async function onRequestGet({ env }: { env: Env }) {
  try {
    const { results } = await env.DB.prepare("SELECT * FROM students").all();
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const body = await request.json() as { id: string; name: string; email: string; phone?: string; belt: string; discipline: string; joinDate: string };
    const { id, name, email, phone, belt, discipline, joinDate } = body;
    await env.DB.prepare("INSERT INTO students (id, name, email, phone, belt, discipline, join_date) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(id, name, email, phone || null, belt, discipline, joinDate).run();
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}