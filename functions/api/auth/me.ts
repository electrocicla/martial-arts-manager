/**
 * Current user endpoint - get authenticated user's profile
 */

import { authenticateUser } from '../../middleware/auth';

// Cloudflare Workers D1 types
interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<void>;
}

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface UserResponse {
  success: true;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * GET /api/auth/me
 */
export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    // Authenticate user
    const authResult = await authenticateUser(request, env);
    
    if (!authResult.authenticated) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return user info
    const responseData: UserResponse = {
      success: true,
      user: authResult.user,
    };

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Get user profile error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}