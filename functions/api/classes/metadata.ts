import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';

interface MetadataResponse {
  disciplines: string[];
  locations: string[];
  instructors: string[];
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get unique disciplines from classes
    const disciplinesResult = await env.DB.prepare(
      "SELECT DISTINCT discipline FROM classes WHERE deleted_at IS NULL ORDER BY discipline"
    ).all<{ discipline: string }>();

    // Get unique locations from classes scoped to this user
    const locationsResult = await env.DB.prepare(
      "SELECT DISTINCT location FROM classes WHERE deleted_at IS NULL AND created_by = ? ORDER BY location"
    ).bind(auth.user.id).all<{ location: string }>();

    // Get unique instructors from classes scoped to this user
    const instructorsResult = await env.DB.prepare(
      "SELECT DISTINCT instructor FROM classes WHERE deleted_at IS NULL AND created_by = ? ORDER BY instructor"
    ).bind(auth.user.id).all<{ instructor: string }>();

    const dbDisciplines = disciplinesResult.results?.map(r => r.discipline) || [];
    const dbLocations = locationsResult.results?.map(r => r.location) || [];
    const dbInstructors = instructorsResult.results?.map(r => r.instructor) || [];

    const allDisciplines = Array.from(new Set([
      'Brazilian Jiu-Jitsu',
      'Karate',
      'Kenpo Karate',
      'Kickboxing',
      'MMA',
      'Muay Thai',
      'Taekwondo',
      'Weightlifting',
      ...dbDisciplines,
    ]));

    const metadata: MetadataResponse = {
      disciplines: allDisciplines,
      locations: dbLocations.length > 0 ? dbLocations : ['Main Dojo'],
      instructors: dbInstructors.length > 0 ? dbInstructors : ['Instructor'],
    };

    return new Response(JSON.stringify(metadata), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
