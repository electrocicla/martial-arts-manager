import { Env } from '../types/index';

interface ClassRecord {
  id: string;
  name: string;
  discipline: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  max_students: number;
  enrolled_count?: number;
  description?: string;
  is_recurring: number;
  recurrence_pattern?: string;
  is_active: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

interface CreateClassRequest {
  id: string;
  name: string;
  discipline: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  maxStudents: number;
  description?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
}

export async function onRequestGet({ env }: { env: Env }) {
  try {
    // Get classes with enrolled student count
    const { results } = await env.DB.prepare(`
      SELECT 
        c.*,
        COUNT(CASE WHEN a.attended = 1 THEN 1 END) as enrolled_count
      FROM classes c
      LEFT JOIN attendance a ON c.id = a.class_id
      WHERE c.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY c.date ASC, c.time ASC
    `).all<ClassRecord>();
    
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const body = await request.json() as CreateClassRequest;
    const { id, name, discipline, date, time, location, instructor, maxStudents, description, isRecurring, recurrencePattern } = body;

    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO classes (
        id, name, discipline, date, time, location, instructor, max_students,
        description, is_recurring, recurrence_pattern, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      id, name, discipline, date, time, location, instructor, maxStudents,
      description || null, isRecurring ? 1 : 0, recurrencePattern || null, now, now
    ).run();

    // Fetch and return the created class
    const { results } = await env.DB.prepare("SELECT * FROM classes WHERE id = ?").bind(id).all<ClassRecord>();
    const createdClass = results?.[0];

    if (!createdClass) {
      return new Response(JSON.stringify({ error: 'Failed to retrieve created class' }), { status: 500 });
    }

    return new Response(JSON.stringify(createdClass), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}