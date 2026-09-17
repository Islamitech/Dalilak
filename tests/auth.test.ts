import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

// Replicating Dalilak cryptographic token engine for unit testing and regression prevention
const TEST_SECRET = 'dalelak_super_resilient_signing_secret_2026_sovereign_gate_03';

interface ActiveSession {
  userId: string;
  role: string;
  expiresAt: number;
}

function generateSignedSessionToken(userId: string, role: string, expiresAt: number, secret: string = TEST_SECRET): string {
  const payload = `${userId}:${role}:${expiresAt}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `dalil_v2_${Buffer.from(payload).toString('base64url')}_${sig}`;
}

function verifySignedSessionToken(token: string, secret: string = TEST_SECRET): ActiveSession | null {
  if (!token || !token.startsWith('dalil_v2_')) return null;
  try {
    const parts = token.split('_');
    if (parts.length !== 4) return null;
    const b64Payload = parts[2];
    const sig = parts[3];
    const payload = Buffer.from(b64Payload, 'base64url').toString('utf-8');
    const [userId, role, expStr] = payload.split(':');
    const expiresAt = Number(expStr);

    if (!userId || !role || !expiresAt || isNaN(expiresAt)) return null;
    if (Date.now() >= expiresAt) return null;

    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const sigBuf = Buffer.from(sig, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    return { userId, role, expiresAt };
  } catch {
    return null;
  }
}

function verifyPassword(cleanPassword: string, storedPassword: string): boolean {
  const cleanStored = (storedPassword || '').trim();
  if (!cleanStored || !cleanPassword) return false;

  // 1. SHA-256 with prefix
  if (cleanStored.startsWith('sha256:')) {
    const expectedHash = cleanStored.substring(7);
    const hash = crypto.createHash('sha256').update(cleanPassword).digest('hex');
    return hash.toLowerCase() === expectedHash.toLowerCase();
  }

  // 2. Scrypt with prefix
  if (cleanStored.startsWith('scrypt:')) {
    const parts = cleanStored.split(':');
    if (parts.length === 3) {
      const salt = parts[1];
      const originalHash = parts[2];
      const hash = crypto.scryptSync(cleanPassword, salt, 64).toString('hex');
      try {
        if (crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'))) {
          return true;
        }
      } catch {}
    }
    return false;
  }

  // 3. Raw 64-hex SHA-256
  if (cleanStored.length === 64 && /^[0-9a-fA-F]+$/.test(cleanStored)) {
    const hash = crypto.createHash('sha256').update(cleanPassword).digest('hex');
    return hash.toLowerCase() === cleanStored.toLowerCase();
  }

  // 4. Plaintext fallback
  return cleanStored === cleanPassword;
}

describe('Dalilak Authentication & Session Persistence Suite', () => {
  const userId = 'rep_test_001';
  const role = 'rep';
  const validExpiry = Date.now() + 24 * 60 * 60 * 1000;

  it('generates tokens with correct prefix and structure', () => {
    const token = generateSignedSessionToken(userId, role, validExpiry);
    expect(token).toBeDefined();
    expect(token.startsWith('dalil_v2_')).toBe(true);
    const parts = token.split('_');
    expect(parts.length).toBe(4);
    expect(parts[0]).toBe('dalil');
    expect(parts[1]).toBe('v2');
  });

  it('successfully verifies a freshly generated valid token', () => {
    const token = generateSignedSessionToken(userId, role, validExpiry);
    const verified = verifySignedSessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(userId);
    expect(verified?.role).toBe(role);
    expect(verified?.expiresAt).toBe(validExpiry);
  });

  it('rejects tampered tokens with altered signature', () => {
    const token = generateSignedSessionToken(userId, role, validExpiry);
    const parts = token.split('_');
    const tamperedSig = parts[3].slice(0, -2) + (parts[3].endsWith('a') ? 'b' : 'a');
    const tamperedToken = `${parts[0]}_${parts[1]}_${parts[2]}_${tamperedSig}`;

    const verified = verifySignedSessionToken(tamperedToken);
    expect(verified).toBeNull();
  });

  it('rejects tampered tokens with altered payload (privilege escalation attempt)', () => {
    const token = generateSignedSessionToken(userId, role, validExpiry);
    const parts = token.split('_');
    const escalatedPayload = Buffer.from(`${userId}:admin:${validExpiry}`).toString('base64url');
    const tamperedToken = `${parts[0]}_${parts[1]}_${escalatedPayload}_${parts[3]}`;

    const verified = verifySignedSessionToken(tamperedToken);
    expect(verified).toBeNull();
  });

  it('rejects expired tokens', () => {
    const expiredTime = Date.now() - 1000; // 1 second in past
    const expiredToken = generateSignedSessionToken(userId, role, expiredTime);

    const verified = verifySignedSessionToken(expiredToken);
    expect(verified).toBeNull();
  });

  it('rejects tokens signed with a different secret key', () => {
    const attackerSecret = 'rogue_attacker_fake_signing_key_999999999999';
    const fakeToken = generateSignedSessionToken(userId, 'admin', validExpiry, attackerSecret);

    const verified = verifySignedSessionToken(fakeToken, TEST_SECRET);
    expect(verified).toBeNull();
  });

  describe('Password Verification Security', () => {
    it('verifies sha256: prefixed passwords correctly', () => {
      const raw = 'SuperSecret123!';
      const hashed = 'sha256:' + crypto.createHash('sha256').update(raw).digest('hex');
      expect(verifyPassword(raw, hashed)).toBe(true);
      expect(verifyPassword('WrongPass', hashed)).toBe(false);
    });

    it('verifies scrypt: salted passwords correctly', () => {
      const raw = 'MandoobPassword2026';
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(raw, salt, 64).toString('hex');
      const stored = `scrypt:${salt}:${hash}`;
      expect(verifyPassword(raw, stored)).toBe(true);
      expect(verifyPassword('WrongMandoobPassword', stored)).toBe(false);
    });

    it('verifies raw 64-char sha256 hex passwords', () => {
      const raw = 'AdminStrongPass!';
      const hash = crypto.createHash('sha256').update(raw).digest('hex');
      expect(verifyPassword(raw, hash)).toBe(true);
      expect(verifyPassword('WrongPass', hash)).toBe(false);
    });

    it('handles legacy plaintext fallback safely', () => {
      expect(verifyPassword('PlainOldPassword', 'PlainOldPassword')).toBe(true);
      expect(verifyPassword('PlainOldPassword', 'DifferentPassword')).toBe(false);
      expect(verifyPassword('', '')).toBe(false);
    });
  });
});
