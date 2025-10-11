import { Env } from '../../types/index';

interface MetadataResponse {
  disciplines: string[];
  locations: string[];
  instructors: string[];
}

export async function onRequestGet({ env }: { env: Env }) {
  try {
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

    // If no data exists, provide defaults
    if (metadata.disciplines.length === 0) {
      metadata.disciplines = ['Brazilian Jiu-Jitsu', 'Kickboxing', 'Muay Thai', 'MMA', 'Karate'];
    }
    if (metadata.locations.length === 0) {
      metadata.locations = ['Main Dojo', 'Training Hall', 'Outdoor Area', 'Gym Floor'];
    }
    if (metadata.instructors.length === 0) {
      metadata.instructors = ['Sensei Yamamoto', 'Coach Johnson', 'Master Chen', 'Instructor Davis'];
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
