/**
 * JWT utilities for Cloudflare Workers using Web Crypto API
 * Using Node.js Buffer API (requires nodejs_compat flag)
 */

import { Buffer } from 'node:buffer';

interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: string;
  iat: number;
  exp: number;
  organization_id: string;
  token_use: 'access' | 'refresh';
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Base64URL encoding/decoding utilities using Node.js Buffer
function base64urlEscape(str: string): string {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlEncode(buffer: ArrayBuffer): string {
  return base64urlEscape(Buffer.from(buffer).toString('base64'));
}

function base64urlDecode(str: string): string {
  // Add padding if needed
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Create JWT tokens using Web Crypto API
 */
export async function createTokens(
  userId: string,
  email: string,
  role: string,
  jwtSecret: string,
  organizationId: string
): Promise<TokenPair> {
  if (!organizationId.trim()) throw new Error('Organization ID is required for JWT creation');
  const now = Math.floor(Date.now() / 1000);
  
  // Access token (2 hours for better UX)
  const accessPayload: JWTPayload = {
    sub: userId,
    email,
    role,
    iat: now,
    exp: now + 2 * 60 * 60, // 2 hours
    organization_id: organizationId,
    token_use: 'access',
  };

  // Refresh token (30 days for longer sessions)
  const refreshPayload: JWTPayload = {
    sub: userId,
    email,
    role,
    iat: now,
    exp: now + 30 * 24 * 60 * 60, // 30 days
    organization_id: organizationId,
    token_use: 'refresh',
  };

  const [accessToken, refreshToken] = await Promise.all([
    signJWT(accessPayload, jwtSecret),
    signJWT(refreshPayload, jwtSecret),
  ]);

  return { accessToken, refreshToken };
}

/**
 * Sign a JWT token using HMAC-SHA256
 */
async function signJWT(payload: JWTPayload, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  // Encode header and payload using Buffer
  const encodedHeader = base64urlEscape(Buffer.from(JSON.stringify(header)).toString('base64'));
  const encodedPayload = base64urlEscape(Buffer.from(JSON.stringify(payload)).toString('base64'));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Create HMAC key from secret
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = base64urlEncode(signature);

  return `${unsignedToken}.${encodedSignature}`;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    
    // Decode header
    const header = JSON.parse(base64urlDecode(encodedHeader));
    
    if (!header || typeof header !== 'object' || header.alg !== 'HS256' || header.typ !== 'JWT') return null;

    // Verify signature
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Decode the base64url signature using Buffer
    let base64Sig = encodedSignature.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Sig.length % 4) {
      base64Sig += '=';
    }
    const signature = Buffer.from(base64Sig, 'base64');

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(unsignedToken)
    );

    if (!isValid) {
      return null;
    }

    // Verify signed tenant claims and token purpose with runtime type guards.
    const decoded: unknown = JSON.parse(base64urlDecode(encodedPayload));
    if (!decoded || typeof decoded !== 'object') return null;
    const claims = decoded as Record<string, unknown>;
    const { sub, email, role, iat, exp, organization_id, token_use } = claims;
    const now = Math.floor(Date.now() / 1000);
    if (
      typeof sub !== 'string' || !sub ||
      typeof email !== 'string' || !email ||
      (role !== 'admin' && role !== 'instructor' && role !== 'student') ||
      typeof iat !== 'number' || !Number.isFinite(iat) || iat > now + 60 ||
      typeof exp !== 'number' || !Number.isFinite(exp) || exp <= now || exp <= iat ||
      typeof organization_id !== 'string' || !organization_id.trim() ||
      (token_use !== 'access' && token_use !== 'refresh')
    ) return null;
    return { sub, email, role, iat, exp, organization_id, token_use };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Extract user ID from JWT token without verification (for middleware)
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(base64urlDecode(parts[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired without verification
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const payload = JSON.parse(base64urlDecode(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true;
  }
}