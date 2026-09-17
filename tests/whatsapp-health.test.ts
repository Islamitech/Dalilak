import { describe, it, expect } from 'vitest';
import { WhatsAppSlotStatus, WhatsAppConnectionState } from '../src/server/whatsapp-gateway';

// Diagnostic telemetry helper function used across Dalilak WhatsApp subsystem
function evaluateSlotHealth(slot: Partial<WhatsAppSlotStatus>): 'healthy' | 'degraded' | 'offline' {
  if (slot.state !== 'connected') {
    return 'offline';
  }
  // If connected, check last heartbeat timestamp
  if (slot.lastHeartbeat) {
    const elapsed = Date.now() - new Date(slot.lastHeartbeat).getTime();
    if (elapsed > 3 * 60 * 1000) {
      // More than 3 minutes without heartbeat
      return 'degraded';
    }
  }
  return 'healthy';
}

function calculateUptimeSeconds(connectedAt?: string | null): number {
  if (!connectedAt) return 0;
  const start = new Date(connectedAt).getTime();
  if (isNaN(start)) return 0;
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / 1000));
}

function classifyDisconnectReason(statusCode?: number): string {
  switch (statusCode) {
    case 401:
      return 'انتهت صلاحية الجلسة أو تم تسجيل الخروج من الهاتف (Logged out)';
    case 408:
      return 'انتهاء مهلة الاتصال بالخادم (Connection Timeout)';
    case 515:
      return 'إعادة تشغيل ضرورية للمزامنة (Restart Required)';
    case 503:
      return 'خدمة واتساب غير متاحة مؤقتاً (Service Unavailable)';
    default:
      return 'انقطاع شبكة أو إعادة تشغيل روتينية (Connection Lost)';
  }
}

describe('Dalilak WhatsApp Health Telemetry & Resilience Suite', () => {
  describe('evaluateSlotHealth', () => {
    it('returns offline when slot is not in connected state', () => {
      const slot: Partial<WhatsAppSlotStatus> = {
        slotId: '1',
        state: 'disconnected',
        lastHeartbeat: new Date().toISOString(),
      };
      expect(evaluateSlotHealth(slot)).toBe('offline');

      const connectingSlot: Partial<WhatsAppSlotStatus> = {
        slotId: '2',
        state: 'connecting',
      };
      expect(evaluateSlotHealth(connectingSlot)).toBe('offline');
    });

    it('returns healthy when connected with fresh heartbeat', () => {
      const slot: Partial<WhatsAppSlotStatus> = {
        slotId: '1',
        state: 'connected',
        lastHeartbeat: new Date(Date.now() - 30 * 1000).toISOString(), // 30s ago
      };
      expect(evaluateSlotHealth(slot)).toBe('healthy');
    });

    it('returns degraded when connected but heartbeat is older than 3 minutes', () => {
      const slot: Partial<WhatsAppSlotStatus> = {
        slotId: '1',
        state: 'connected',
        lastHeartbeat: new Date(Date.now() - 4 * 60 * 1000).toISOString(), // 4 minutes ago
      };
      expect(evaluateSlotHealth(slot)).toBe('degraded');
    });
  });

  describe('calculateUptimeSeconds', () => {
    it('returns 0 for missing or invalid connectedAt', () => {
      expect(calculateUptimeSeconds(null)).toBe(0);
      expect(calculateUptimeSeconds(undefined)).toBe(0);
      expect(calculateUptimeSeconds('invalid-date')).toBe(0);
    });

    it('accurately calculates elapsed uptime in seconds', () => {
      const fiveMinutesAgo = new Date(Date.now() - 300 * 1000).toISOString();
      const uptime = calculateUptimeSeconds(fiveMinutesAgo);
      expect(uptime).toBeGreaterThanOrEqual(299);
      expect(uptime).toBeLessThanOrEqual(305);
    });
  });

  describe('classifyDisconnectReason', () => {
    it('identifies session invalidation (401)', () => {
      expect(classifyDisconnectReason(401)).toContain('Logged out');
    });

    it('identifies timeout issues (408)', () => {
      expect(classifyDisconnectReason(408)).toContain('Timeout');
    });

    it('identifies restart required (515)', () => {
      expect(classifyDisconnectReason(515)).toContain('Restart Required');
    });

    it('provides clear fallback for unknown codes', () => {
      expect(classifyDisconnectReason(999)).toContain('Connection Lost');
    });
  });
});
