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

    // Get unique locations from classes
    const locationsResult = await env.DB.prepare(
      "SELECT DISTINCT location FROM classes WHERE deleted_at IS NULL ORDER BY location"
    ).all<{ location: string }>();

    // Get unique instructors from classes
    const instructorsResult = await env.DB.prepare(
      "SELECT DISTINCT instructor FROM classes WHERE deleted_at IS NULL ORDER BY instructor"
    ).all<{ instructor: string }>();

    const metadata: MetadataResponse = {
      disciplines: disciplinesResult.results?.map(r => r.discipline) || [],
      locations: locationsResult.results?.map(r => r.location) || [],
      instructors: instructorsResult.results?.map(r => r.instructor) || [],
    };

    // If no data exists, provide defaults with all available disciplines
    if (metadata.disciplines.length === 0) {
      metadata.disciplines = [
        'Brazilian Jiu-Jitsu',
        'Karate',
        'Kenpo Karate',
        'Kickboxing',
        'MMA',
        'Muay Thai',
        'Taekwondo',
        'Weightlifting',
      ];
    }
    if (metadata.locations.length === 0) {
      metadata.locations = ['Main Dojo'];
    }
    if (metadata.instructors.length === 0) {
      metadata.instructors = ['Instructor'];
    }

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
