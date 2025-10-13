/**
 * JWT utilities for Cloudflare Workers using Web Crypto API
 */

interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Base64URL encoding/decoding utilities
function base64urlEscape(str: string): string {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlUnescape(str: string): string {
  str += new Array(5 - (str.length % 4)).join('=');
  return str.replace(/-/g, '+').replace(/_/g, '/');
}

function base64urlDecode(str: string): string {
  return atob(base64urlUnescape(str));
}

function base64urlEncode(str: string): string {
  return base64urlEscape(btoa(str));
}

/**
 * Create JWT tokens using Web Crypto API
 */
export async function createTokens(
  userId: string,
  email: string,
  role: string,
  jwtSecret: string
): Promise<TokenPair> {
  const now = Math.floor(Date.now() / 1000);
  
  // Access token (2 hours for better UX)
  const accessPayload: JWTPayload = {
    sub: userId,
    email,
    role,
    iat: now,
    exp: now + 2 * 60 * 60, // 2 hours
  };

  // Refresh token (30 days for longer sessions)
  const refreshPayload: JWTPayload = {
    sub: userId,
    email,
    role,
    iat: now,
    exp: now + 30 * 24 * 60 * 60, // 30 days
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

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
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

  const encodedSignature = base64urlEscape(
    btoa(String.fromCharCode(...new Uint8Array(signature)))
  );

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
    
    if (header.alg !== 'HS256') return null;

    // Verify signature
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Properly decode the base64url signature
    const signatureString = base64urlDecode(encodedSignature);
    const signature = Uint8Array.from(signatureString, c => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(unsignedToken)
    );

    if (!isValid) {
      console.error('[JWT] Signature verification failed');
      return null;
    }

    // Decode payload
    const payload: JWTPayload = JSON.parse(base64urlDecode(encodedPayload));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
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