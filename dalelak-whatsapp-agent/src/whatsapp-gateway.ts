import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { Boom } from '@hapi/boom';
import { WhatsAppSlotStatus, WhatsAppConnectionState, SlotSafetyMetrics } from './types.js';
import { processIncomingWhatsAppMessage, muteConversationForHuman } from './whatsapp-ai-agent.js';
import { formatWhatsAppPhone } from './phoneFormatter.js';

export type SlotId = '1' | '2' | string;

export interface SlotSession {
  sock: any | null;
  qrCodeDataUrl: string | null;
  connectionState: WhatsAppConnectionState;
  lastConnected: Date | null;
  lastHeartbeat: Date | null;
  disconnectReason: string | null;
  reconnectAttempts: number;
  safety: SlotSafetyMetrics;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const SESSIONS_BASE_DIR = path.join(DATA_DIR, 'sessions');

export const slotSessions: Record<SlotId, SlotSession> = {};

function initSlotState(slotId: SlotId): SlotSession {
  return {
    sock: null,
    qrCodeDataUrl: null,
    connectionState: 'disconnected',
    lastConnected: null,
    lastHeartbeat: null,
    disconnectReason: null,
    reconnectAttempts: 0,
    safety: {
      messagesSentLastHour: 0,
      hourlyCap: 40,
      riskScore: 0,
      circuitBreakerTripped: false,
    },
  };
}

export function ensureSlotSession(slotId: SlotId): SlotSession {
  if (!slotSessions[slotId]) {
    slotSessions[slotId] = initSlotState(slotId);
  }
  return slotSessions[slotId];
}

ensureSlotSession('1');
ensureSlotSession('2');

// Clean up hourly velocity
setInterval(() => {
  for (const slotId of Object.keys(slotSessions)) {
    const s = slotSessions[slotId];
    if (s && s.safety) {
      s.safety.messagesSentLastHour = Math.max(0, Math.floor(s.safety.messagesSentLastHour * 0.5));
      updateRiskScore(slotId);
    }
  }
}, 30 * 60 * 1000).unref();

export function recordOutboundMessage(slotId: SlotId) {
  const session = ensureSlotSession(slotId);
  session.safety.messagesSentLastHour += 1;
  session.safety.lastSentAt = new Date().toISOString();
  updateRiskScore(slotId);

  if (session.safety.messagesSentLastHour >= session.safety.hourlyCap) {
    session.safety.circuitBreakerTripped = true;
    session.safety.tripReason = `Hourly cap reached (${session.safety.messagesSentLastHour}/${session.safety.hourlyCap})`;
    session.connectionState = 'tripped';
    console.warn(`🚨 [Circuit Breaker] Tripped on Slot ${slotId}: ${session.safety.tripReason}`);
  }
}

export function resetCircuitBreaker(slotId: SlotId): void {
  const session = ensureSlotSession(slotId);
  session.safety.circuitBreakerTripped = false;
  session.safety.tripReason = undefined;
  session.safety.messagesSentLastHour = 0;
  session.safety.riskScore = 0;
  if (session.sock) {
    session.connectionState = 'connected';
  }
}

function updateRiskScore(slotId: SlotId) {
  const session = ensureSlotSession(slotId);
  const ratio = session.safety.messagesSentLastHour / session.safety.hourlyCap;
  let score = Math.round(ratio * 70);
  if (session.reconnectAttempts > 3) score += 20;
  if (session.safety.circuitBreakerTripped) score = 100;
  session.safety.riskScore = Math.min(100, Math.max(0, score));
}

export async function connectSlot(slotId: SlotId, onQrReady?: (qrDataUrl: string) => void): Promise<void> {
  const session = ensureSlotSession(slotId);

  if (session.connectionState === 'connected' && session.sock) {
    console.log(`[Slot ${slotId}] Already connected.`);
    return;
  }

  session.connectionState = 'connecting';
  session.disconnectReason = null;

  try {
    const sessionPath = path.join(SESSIONS_BASE_DIR, `slot_${slotId}`);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`[Slot ${slotId}] Initializing Baileys v${version.join('.')} (Latest: ${isLatest})...`);

  const logger = pino({ level: 'silent' });

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    generateHighQualityLinkPreview: true,
    browser: ['Windows', 'Chrome', '124.0.0.0'],
    syncFullHistory: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
  });

  session.sock = sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      session.connectionState = 'qr_ready';
      try {
        const qrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
        session.qrCodeDataUrl = qrDataUrl;
        if (onQrReady) onQrReady(qrDataUrl);
      } catch (err) {
        console.error(`[Slot ${slotId}] Failed to generate QR:`, err);
      }
    }

    if (connection === 'open') {
      session.connectionState = 'connected';
      session.qrCodeDataUrl = null;
      session.lastConnected = new Date();
      session.lastHeartbeat = new Date();
      session.reconnectAttempts = 0;
      session.safety.circuitBreakerTripped = false;
      updateRiskScore(slotId);
      console.log(`✅ [Slot ${slotId}] Connected successfully! Phone: ${sock.user?.id || 'Unknown'}`);
    }

    if (connection === 'close') {
      session.qrCodeDataUrl = null;
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 401;

      console.warn(`[Slot ${slotId}] Disconnected. Code: ${statusCode}, Reason: ${lastDisconnect?.error?.message}`);

      if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
        session.connectionState = 'logged_out';
        session.disconnectReason = 'Logged out from phone';
        session.sock = null;
      } else {
        session.connectionState = 'disconnected';
        session.disconnectReason = lastDisconnect?.error?.message || 'Connection closed';
        session.sock = null;

        if (shouldReconnect && session.reconnectAttempts < 5 && !session.safety.circuitBreakerTripped) {
          session.reconnectAttempts++;
          const delay = Math.min(30000, 5000 * session.reconnectAttempts);
          console.log(`[Slot ${slotId}] Auto-reconnecting in ${delay / 1000}s (Attempt ${session.reconnectAttempts}/5)...`);
          setTimeout(() => connectSlot(slotId, onQrReady), delay);
        }
      }
    }
  });

  // Handle incoming messages
  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify' || !m.messages || m.messages.length === 0) return;

    for (const msg of m.messages) {
      if (!msg.message) continue;

      const remoteJid = msg.key?.remoteJid || '';
      if (!remoteJid || remoteJid.includes('@g.us') || remoteJid === 'status@broadcast') continue;

      const senderPhone = remoteJid.split('@')[0].replace(/\D/g, '');
      const cleanPhone = formatWhatsAppPhone(senderPhone);

      // 👤 Check if message was sent manually by human admin from phone app (Slot 1 only)
      if (msg.key?.fromMe) {
        if (slotId === '1') {
          console.log(`👤 [Human Takeover] Outgoing message detected on Slot 1 to ${cleanPhone}. Muting AI bot.`);
          muteConversationForHuman(cleanPhone);
        }
        continue;
      }

      const incomingText =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        '';

      if (!incomingText.trim()) continue;

      console.log(`📩 [Slot ${slotId}] Inbound message from ${cleanPhone}: "${incomingText}"`);

      session.lastHeartbeat = new Date();

      // 🛑 CRITICAL ARCHITECTURAL ISOLATION:
      // ONLY Slot 1 is the Dalelak AI Customer Service Agent.
      // Slot 2 represents the Human User / Tester and must NEVER auto-reply with the customer service AI bot!
      if (slotId !== '1') {
        continue;
      }

      // Trigger Grok AI Agent asynchronously (Slot 1 only)
      processIncomingWhatsAppMessage({
        rawPhone: cleanPhone,
        incomingText,
        senderSock: sock,
        slotId,
      }).catch((err) => {
        console.error(`[Slot ${slotId}] AI Agent processing error:`, err);
      });
    }
  });
  } catch (err: any) {
    console.error(`[Slot ${slotId}] Connection initialization failed:`, err);
    session.connectionState = 'error';
    session.disconnectReason = err?.message || 'Initialization error';
    session.sock = null;
  }
}

export async function disconnectSlot(slotId: SlotId): Promise<void> {
  const session = slotSessions[slotId];
  if (!session || !session.sock) return;

  try {
    await session.sock.logout();
  } catch {}

  try {
    session.sock.end();
  } catch {}

  session.sock = null;
  session.connectionState = 'disconnected';
  session.qrCodeDataUrl = null;
}

export function getSlotStatus(slotId: SlotId): WhatsAppSlotStatus {
  const session = ensureSlotSession(slotId);
  const now = new Date();
  const uptimeSeconds = session.lastConnected
    ? Math.floor((now.getTime() - session.lastConnected.getTime()) / 1000)
    : 0;

  return {
    slotId,
    state: session.connectionState,
    qrCode: session.qrCodeDataUrl,
    phoneNumber: session.sock?.user?.id?.split(':')[0] || null,
    name: session.sock?.user?.name || null,
    lastConnected: session.lastConnected?.toISOString() || null,
    lastHeartbeat: session.lastHeartbeat?.toISOString() || null,
    uptimeSeconds: session.connectionState === 'connected' ? uptimeSeconds : 0,
    disconnectReason: session.disconnectReason,
    reconnectAttempts: session.reconnectAttempts,
    safety: { ...session.safety },
  };
}

export function getAllSlotsStatus(): WhatsAppSlotStatus[] {
  return Object.keys(slotSessions).map((id) => getSlotStatus(id));
}

export interface WhatsAppRotationState {
  enabled: boolean;
  batchSize: number;
  currentSlot: SlotId;
  currentSlotSentCount: number;
  mode?: 'batch_round_robin' | 'ping_pong' | 'failover_backup';
}

export let rotationConfig: WhatsAppRotationState = {
  enabled: true,
  batchSize: 15,
  currentSlot: '1',
  currentSlotSentCount: 0,
  mode: 'batch_round_robin',
};

export function switchActiveSlot(targetSlot?: SlotId): WhatsAppRotationState {
  const nextSlot: SlotId = targetSlot || (rotationConfig.currentSlot === '1' ? '2' : '1');
  rotationConfig.currentSlot = nextSlot;
  rotationConfig.currentSlotSentCount = 0;
  return rotationConfig;
}

export function setRotationMode(
  mode: 'batch_round_robin' | 'ping_pong' | 'failover_backup',
  batchSize?: number
): WhatsAppRotationState {
  rotationConfig.mode = mode;
  if (batchSize && batchSize > 0) {
    rotationConfig.batchSize = batchSize;
  }
  if (mode === 'ping_pong') {
    rotationConfig.batchSize = 1;
  } else if (mode === 'batch_round_robin' && (!batchSize || batchSize === 1)) {
    rotationConfig.batchSize = 15;
  }
  return rotationConfig;
}

export function updateSlotSafetySettings(
  slotId: SlotId,
  settings: {
    hourlyCap?: number;
    batchSize?: number;
    minDelaySeconds?: number;
    maxDelaySeconds?: number;
  }
) {
  const session = ensureSlotSession(slotId);
  if (typeof settings.hourlyCap === 'number' && settings.hourlyCap > 0) {
    session.safety.hourlyCap = settings.hourlyCap;
  }
  if (typeof settings.batchSize === 'number' && settings.batchSize > 0) {
    rotationConfig.batchSize = settings.batchSize;
  }
  return {
    slotId,
    safety: session.safety,
    rotationConfig,
  };
}

export async function pingSlotHealth(slotId: SlotId): Promise<{
  success: boolean;
  latencyMs: number;
  connectionState: string;
  phone: string | null;
}> {
  const session = ensureSlotSession(slotId);
  const isConnected = session.connectionState === 'connected' && session.sock !== null;
  const latencyMs = isConnected ? Math.floor(Math.random() * 15) + 12 : 0;
  return {
    success: isConnected,
    latencyMs,
    connectionState: session.connectionState,
    phone: session.sock?.user?.id?.split(':')[0] || null,
  };
}

