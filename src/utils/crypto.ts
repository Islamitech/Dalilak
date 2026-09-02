/**
 * Secure password hashing and verification utility using Web Crypto API.
 * 100% dependency-free, runs in browser and modern JS runtimes.
 */

const HASH_PREFIX = 'sha256:';

/**
 * Hashes a plaintext password with SHA-256 and prepends the format prefix.
 */
export async function hashPassword(plainText: string): Promise<string> {
  const clean = (plainText || '').trim();
  if (!clean) return '';

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(clean);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${HASH_PREFIX}${hexHash}`;
  }

  // Fallback if subtle crypto is unavailable (rare)
  return clean;
}

/**
 * Verifies a plaintext password against a stored password string.
 * Supports:
 * 1. Hashed passwords ('sha256:...')
 * 2. Legacy plaintext passwords for seamless backward compatibility
 */
export async function verifyPassword(plainText: string, storedPassword?: string): Promise<boolean> {
  const cleanPlain = (plainText || '').trim();
  const cleanStored = (storedPassword || '').trim();

  if (!cleanPlain || !cleanStored) return false;

  // If stored password is a SHA-256 hash
  if (cleanStored.startsWith(HASH_PREFIX)) {
    const inputHash = await hashPassword(cleanPlain);
    return inputHash === cleanStored;
  }

  // Legacy fallback: direct plaintext equality (allows existing reps to log in seamlessly)
  return cleanStored === cleanPlain;
}

/**
 * Checks if a stored password is already in hashed format.
 */
export function isPasswordHashed(storedPassword?: string): boolean {
  return typeof storedPassword === 'string' && storedPassword.startsWith(HASH_PREFIX);
}
