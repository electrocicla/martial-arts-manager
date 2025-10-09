/**
 * Password hashing utilities for Cloudflare Workers using Web Crypto API
 * Since bcrypt is not available in Workers, we use PBKDF2 with a high iteration count
 */

const SALT_ROUNDS = 100000; // PBKDF2 iterations (equivalent to bcrypt cost 12-14)
const HASH_LENGTH = 32; // 256 bits

/**
 * Generate a random salt for password hashing
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Convert Uint8Array to hex string
 */
function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to Uint8Array
 */
function hexToUint8Array(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) throw new Error('Invalid hex string');
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

/**
 * Hash a password using PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt();
  const passwordBuffer = new TextEncoder().encode(password);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2
  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: SALT_ROUNDS,
      hash: 'SHA-256',
    } as Pbkdf2Params,
    keyMaterial,
    HASH_LENGTH * 8 // bits
  );

  const hashArray = new Uint8Array(derivedKey);
  
  // Format: salt:hash (both as hex strings)
  return `${uint8ArrayToHex(salt)}:${uint8ArrayToHex(hashArray)}`;
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const [saltHex, hashHex] = hash.split(':');
    if (!saltHex || !hashHex) return false;

    const salt = hexToUint8Array(saltHex);
    const originalHash = hexToUint8Array(hashHex);
    const passwordBuffer = new TextEncoder().encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    // Derive key using the same parameters
    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: SALT_ROUNDS,
        hash: 'SHA-256',
      } as Pbkdf2Params,
      keyMaterial,
      HASH_LENGTH * 8 // bits
    );

    const newHash = new Uint8Array(derivedKey);

    // Constant-time comparison to prevent timing attacks
    if (originalHash.length !== newHash.length) return false;
    
    let result = 0;
    for (let i = 0; i < originalHash.length; i++) {
      result |= originalHash[i] ^ newHash[i];
    }
    
    return result === 0;
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
}

/**
 * Generate a secure random session token
 */
export function generateSessionToken(): string {
  const array = crypto.getRandomValues(new Uint8Array(32));
  return uint8ArrayToHex(array);
}

/**
 * Generate a secure random user ID
 */
export function generateUserId(): string {
  const array = crypto.getRandomValues(new Uint8Array(16));
  return uint8ArrayToHex(array);
}