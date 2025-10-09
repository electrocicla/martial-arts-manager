interface Env {
  DB: any;
}

export async function onRequestGet({ env }: { env: Env }) {
  try {
    const { results } = await env.DB.prepare("SELECT * FROM classes").all();
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const body = await request.json() as { id: string; name: string; discipline: string; date: string; time: string; location: string; instructor: string; maxStudents: number };
    const { id, name, discipline, date, time, location, instructor, maxStudents } = body;
    await env.DB.prepare("INSERT INTO classes (id, name, discipline, date, time, location, instructor, max_students) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, name, discipline, date, time, location, instructor, maxStudents).run();
    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 });
  }
}