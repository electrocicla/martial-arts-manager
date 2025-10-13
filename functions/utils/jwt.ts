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
  // Convert base64url to base64
  const base64 = base64urlUnescape(str);
  
  // Decode base64 to binary string without using atob()
  const binaryString = Uint8Array.from(
    Array.from(base64).map(char => {
      const code = char.charCodeAt(0);
      if (code >= 65 && code <= 90) return code - 65; // A-Z
      if (code >= 97 && code <= 122) return code - 71; // a-z
      if (code >= 48 && code <= 57) return code + 4; // 0-9
      if (code === 43) return 62; // +
      if (code === 47) return 63; // /
      return 0;
    })
  );
  
  // Convert to string
  const bytes: number[] = [];
  for (let i = 0; i < base64.length; i += 4) {
    const encoded1 = base64.charCodeAt(i);
    const encoded2 = base64.charCodeAt(i + 1);
    const encoded3 = base64.charCodeAt(i + 2);
    const encoded4 = base64.charCodeAt(i + 3);
    
    const decoded1 = (encoded1 << 2) | (encoded2 >> 4);
    const decoded2 = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    const decoded3 = ((encoded3 & 3) << 6) | encoded4;
    
    bytes.push(decoded1);
    if (encoded3 !== 61) bytes.push(decoded2); // not '='
    if (encoded4 !== 61) bytes.push(decoded3); // not '='
  }
  
  return String.fromCharCode(...bytes);
}

function base64urlEncode(str: string): string {
  // Encode to base64 without using btoa()
  const bytes = new TextEncoder().encode(str);
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  
  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const byte3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    
    const encoded1 = byte1 >> 2;
    const encoded2 = ((byte1 & 3) << 4) | (byte2 >> 4);
    const encoded3 = ((byte2 & 15) << 2) | (byte3 >> 6);
    const encoded4 = byte3 & 63;
    
    result += base64Chars[encoded1] + base64Chars[encoded2];
    result += i + 1 < bytes.length ? base64Chars[encoded3] : '=';
    result += i + 2 < bytes.length ? base64Chars[encoded4] : '=';
  }
  
  return base64urlEscape(result);
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
    console.log('[JWT] Encoded signature:', encodedSignature);
    const signatureString = base64urlDecode(encodedSignature);
    console.log('[JWT] Decoded signature string length:', signatureString.length);
    const signature = Uint8Array.from(signatureString, c => c.charCodeAt(0));
    console.log('[JWT] Signature Uint8Array length:', signature.length);

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