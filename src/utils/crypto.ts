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

  // Prevent double-hashing if password is already hashed
  if (clean.startsWith(HASH_PREFIX) || clean.startsWith('scrypt:') || (clean.length === 64 && /^[0-9a-fA-F]+$/.test(clean))) {
    return clean;
  }

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
 * 2. Raw 64-character SHA-256 hashes
 * 3. Legacy plaintext passwords for seamless backward compatibility
 */
export async function verifyPassword(plainText: string, storedPassword?: string): Promise<boolean> {
  const cleanPlain = (plainText || '').trim();
  const cleanStored = (storedPassword || '').trim();

  if (!cleanPlain || !cleanStored) return false;

  // 1. If stored password is a SHA-256 hash with prefix
  if (cleanStored.toLowerCase().startsWith(HASH_PREFIX)) {
    const inputHash = await hashPassword(cleanPlain);
    return inputHash.toLowerCase() === cleanStored.toLowerCase();
  }

  // 2. If stored password is a raw 64-character hex hash without prefix
  if (cleanStored.length === 64 && /^[0-9a-fA-F]+$/.test(cleanStored)) {
    const inputHash = await hashPassword(cleanPlain);
    const rawInputHex = inputHash.replace(HASH_PREFIX, '');
    return rawInputHex.toLowerCase() === cleanStored.toLowerCase();
  }

  // 3. Legacy fallback: direct plaintext equality (allows existing reps to log in seamlessly)
  return cleanStored === cleanPlain;
}

/**
 * Checks if a stored password is already in hashed format.
 */
export function isPasswordHashed(storedPassword?: string): boolean {
  if (!storedPassword || typeof storedPassword !== 'string') return false;
  const clean = storedPassword.trim().toLowerCase();
  return (
    clean.startsWith('scrypt:') ||
    clean.startsWith(HASH_PREFIX) ||
    (clean.length === 64 && /^[0-9a-fA-F]+$/.test(clean))
  );
}
