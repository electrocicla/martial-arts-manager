/**
 * Database utilities for Cloudflare D1
 */

import { User, Session, D1Database } from '../types/index';

/**
 * Create a new user in the database
 */
export async function createUser(
  db: D1Database,
  userData: {
    id: string;
    email: string;
    password_hash: string;
    name: string;
    role: 'admin' | 'instructor' | 'student';
    student_id?: string;
    is_approved?: boolean;
  }
): Promise<User> {
  const now = new Date().toISOString();
  
  // New manual registrations require approval, unless explicitly approved
  const isApproved = userData.is_approved !== undefined ? userData.is_approved : 0;
  
  const result = await db
    .prepare(`
      INSERT INTO users (id, email, password_hash, name, role, student_id, is_active, is_approved, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
      RETURNING *
    `)
    .bind(
      userData.id,
      userData.email,
      userData.password_hash,
      userData.name,
      userData.role,
      userData.student_id || null,
      isApproved,
      now,
      now
    )
    .first<User>();

  if (!result) {
    throw new Error('Failed to create user');
  }

  return result;
}

/**
 * Find user by email
 */
export async function findUserByEmail(db: D1Database, email: string): Promise<User | null> {
  return await db
    .prepare('SELECT * FROM users WHERE email = ? AND is_active = 1')
    .bind(email)
    .first<User>();
}

/**
 * Find user by ID
 */
export async function findUserById(db: D1Database, id: string): Promise<User | null> {
  return await db
    .prepare('SELECT * FROM users WHERE id = ? AND is_active = 1')
    .bind(id)
    .first<User>();
}

/**
 * Create a new session
 */
export async function createSession(
  db: D1Database,
  sessionData: {
    id: string;
    user_id: string;
    refresh_token: string;
    expires_at: string;
    ip_address?: string;
    user_agent?: string;
  }
): Promise<Session> {
  const now = new Date().toISOString();
  
  const result = await db
    .prepare(`
      INSERT INTO sessions (id, user_id, refresh_token, expires_at, created_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `)
    .bind(
      sessionData.id,
      sessionData.user_id,
      sessionData.refresh_token,
      sessionData.expires_at,
      now,
      sessionData.ip_address || null,
      sessionData.user_agent || null
    )
    .first<Session>();

  if (!result) {
    throw new Error('Failed to create session');
  }

  return result;
}

/**
 * Find session by refresh token
 */
export async function findSessionByRefreshToken(db: D1Database, refreshToken: string): Promise<Session | null> {
  return await db
    .prepare('SELECT * FROM sessions WHERE refresh_token = ? AND expires_at > datetime("now")')
    .bind(refreshToken)
    .first<Session>();
}

/**
 * Delete session by refresh token
 */
export async function deleteSession(db: D1Database, refreshToken: string): Promise<void> {
  await db
    .prepare('DELETE FROM sessions WHERE refresh_token = ?')
    .bind(refreshToken)
    .run();
}

/**
 * Delete expired sessions (cleanup utility)
 */
export async function deleteExpiredSessions(db: D1Database): Promise<void> {
  await db
    .prepare('DELETE FROM sessions WHERE expires_at <= datetime("now")')
    .run();
}

/**
 * Update user's last login time
 */
export async function updateUserLastLogin(db: D1Database, userId: string): Promise<void> {
  const now = new Date().toISOString();
  await db
    .prepare('UPDATE users SET updated_at = ? WHERE id = ?')
    .bind(now, userId)
    .run();
}

/**
 * Check if email already exists
 */
export async function emailExists(db: D1Database, email: string): Promise<boolean> {
  const result = await db
    .prepare('SELECT COUNT(*) as count FROM users WHERE email = ?')
    .bind(email)
    .first<{ count: number }>();
  
  return (result?.count || 0) > 0;
}

/**
 * Log audit action
 */
export async function logAuditAction(
  db: D1Database,
  auditData: {
    id: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    changes?: string;
    ip_address?: string;
  }
): Promise<void> {
  const now = new Date().toISOString();
  
  await db
    .prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, changes, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      auditData.id,
      auditData.user_id,
      auditData.action,
      auditData.entity_type,
      auditData.entity_id,
      auditData.changes || null,
      auditData.ip_address || null,
      now
    )
    .run();
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || 
         request.headers.get('X-Forwarded-For') || 
         'unknown';
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('User-Agent') || 'unknown';
}