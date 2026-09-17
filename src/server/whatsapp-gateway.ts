import makeWASocketImport, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  Browsers,
  getUrlInfo,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { Business } from '../types';
import { getDisplayDirectoryUrl } from '../utils/directoryUrl';

const makeWASocket = (makeWASocketImport as any).default || makeWASocketImport;

export type WhatsAppConnectionState = 'disconnected' | 'connecting' | 'qr_ready' | 'connected';

export const PRIMARY_WHATSAPP_SENDER_PHONE = '01556221141';

export type SlotId = '1' | '2';

export interface BroadcastLogItem {
  businessId: string;
  businessName: string;
  phone: string;
  status: 'sent' | 'failed' | 'skipped';
  reason?: string;
  timestamp: string;
  senderSlot?: SlotId;
  senderPhone?: string;
}

export interface BroadcastProgress {
  id: string;
  templateType: string;
  total: number;
  current: number;
  successful: number;
  failed: number;
  skipped: number;
  status: 'idle' | 'running' | 'paused' | 'aborted' | 'completed' | 'cooldown';
  currentBusinessName?: string;
  startedAt: string;
  finishedAt?: string;
  logs: BroadcastLogItem[];
  lastIndex?: number;
  cooldownRemainingSeconds?: number;
  cooldownBatchCount?: number;
  currentSlot?: SlotId;
  currentSlotSentCount?: number;
  rotationBatchSize?: number;
  currentSenderSlot?: SlotId;
  rotationBatchCount?: number;
  // 🌿 Organic Stealth Mode properties
  stealthModeActive?: boolean;
  nextDispatchInSeconds?: number;
  nextSlotTarget?: SlotId;
  slot1SentCount?: number;
  slot2SentCount?: number;
  enableStealthRandomMode?: boolean;
  stealthMinMinutes?: number;
  stealthMaxMinutes?: number;
  stealthInitialBurstPerSlot?: number;
}

export interface WhatsAppSlotStatus {
  slotId: SlotId;
  name: string;
  state: WhatsAppConnectionState;
  qrCodeUrl: string | null;
  connectedUser: { id: string; name?: string; phone: string } | null;
  lastActive: string | null;
  isInitializing?: boolean;
  connectedAt?: string | null;
  lastHeartbeat?: string | null;
  uptimeSeconds?: number;
  disconnectReason?: string | null;
  autoReconnectAttempts?: number;
  healthStatus?: 'healthy' | 'degraded' | 'offline';
}

export interface WhatsAppRotationState {
  enabled: boolean;
  batchSize: number;
  currentSlot: SlotId;
  currentSlotSentCount: number;
}

export interface WhatsAppSessionStatus {
  state: WhatsAppConnectionState;
  qrCodeUrl: string | null;
  connectedUser: { id: string; name?: string; phone: string } | null;
  lastActive: string | null;
  activeCampaign: BroadcastProgress | null;
  slots: {
    '1': WhatsAppSlotStatus;
    '2': WhatsAppSlotStatus;
  };
  rotationConfig: WhatsAppRotationState;
}

// 📁 Persistent Session Directories for Dual Slots
export function getAuthDirForSlot(slotId: SlotId): string {
  const targetDir = path.resolve(process.cwd(), `data/baileys_auth_info_${slotId}`);
  if (slotId === '1') {
    const legacyDir = path.resolve(process.cwd(), 'data/baileys_auth_info');
    if (fs.existsSync(legacyDir) && !fs.existsSync(targetDir)) {
      try {
        fs.renameSync(legacyDir, targetDir);
        console.log('🔄 [WhatsApp Gateway] Migrated legacy session into Slot 1 storage.');
      } catch {
        // Ignore rename error
      }
    }
  }
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

export interface InternalSlotSession {
  slotId: SlotId;
  name: string;
  sock: WASocket | null;
  connectionState: WhatsAppConnectionState;
  qrCodeUrl: string | null;
  connectedUser: { id: string; name?: string; phone: string } | null;
  lastActive: string | null;
  isInitializing: boolean;
  isExplicitDisconnect: boolean;
  connectedAt: string | null;
  lastHeartbeat: string | null;
  uptimeSeconds: number;
  disconnectReason: string | null;
  autoReconnectAttempts: number;
  healthStatus: 'healthy' | 'degraded' | 'offline';
}

export const slotSessions: Record<SlotId, InternalSlotSession> = {
  '1': {
    slotId: '1',
    name: 'هاتف الإدارة الأساسي (1)',
    sock: null,
    connectionState: 'disconnected',
    qrCodeUrl: null,
    connectedUser: null,
    lastActive: null,
    isInitializing: false,
    isExplicitDisconnect: false,
    connectedAt: null,
    lastHeartbeat: null,
    uptimeSeconds: 0,
    disconnectReason: null,
    autoReconnectAttempts: 0,
    healthStatus: 'offline',
  },
  '2': {
    slotId: '2',
    name: 'هاتف الإدارة المساند (2)',
    sock: null,
    connectionState: 'disconnected',
    qrCodeUrl: null,
    connectedUser: null,
    lastActive: null,
    isInitializing: false,
    isExplicitDisconnect: false,
    connectedAt: null,
    lastHeartbeat: null,
    uptimeSeconds: 0,
    disconnectReason: null,
    autoReconnectAttempts: 0,
    healthStatus: 'offline',
  },
};

export let rotationConfig: WhatsAppRotationState = {
  enabled: true,
  batchSize: 15,
  currentSlot: '1',
  currentSlotSentCount: 0,
};

// Legacy fallback aliases
export const AUTH_DIR = getAuthDirForSlot('1');

// Active Broadcast State & Local Persistence
let activeCampaign: BroadcastProgress | null = null;
let abortRequested = false;
let skipWaitRequested = false;

export interface CampaignBroadcastOptions {
  templateType: string;
  customText?: string;
  minDelaySeconds?: number;
  maxDelaySeconds?: number;
  skipRecentlyContacted?: boolean;
  rotationBatchSize?: number;
  enableRotation?: boolean;
  enableStealthRandomMode?: boolean;
  stealthMinMinutes?: number;
  stealthMaxMinutes?: number;
  stealthInitialBurstPerSlot?: number;
}

/**
 * ⚡ Allows instant skip of the current wait delay (countdown or cooldown)
 */
export function skipCurrentWaitDelay(): { success: boolean; message: string } {
  if (!activeCampaign || (activeCampaign.status !== 'running' && activeCampaign.status !== 'cooldown')) {
    return { success: false, message: 'لا توجد حملة نشطة أو في فترة انتظار حالياً لتخطيها.' };
  }
  skipWaitRequested = true;
  console.log('⚡ [WhatsApp Gateway] Skip delay requested by administrator.');
  return { success: true, message: 'تم إرسال أمر تخطي فترة الانتظار بنجاح! سيتم إرسال الرسالة القادمة فوراً ⚡' };
}

// Campaign In-Memory & File Persistence for Pause, Resume & Crash Recovery
let cachedCampaignBusinesses: Business[] = [];
let cachedCampaignOptions: CampaignBroadcastOptions | null = null;

// Persistent Sent Log File (Protects against duplicate messaging across campaigns)
const SENT_LOG_PATH = path.resolve(process.cwd(), 'data/whatsapp_sent_log.json');

function loadSentRegistry(): Record<string, { timestamp: string; bizId?: string; phone: string }> {
  try {
    if (fs.existsSync(SENT_LOG_PATH)) {
      const raw = fs.readFileSync(SENT_LOG_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading sent log:', err);
  }
  return {};
}

export function recordSentTarget(phone: string, bizId?: string) {
  try {
    const reg = loadSentRegistry();
    const now = new Date().toISOString();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone) {
      reg[cleanPhone] = { timestamp: now, bizId, phone: cleanPhone };
    }
    if (bizId) {
      reg[`biz_${bizId}`] = { timestamp: now, bizId, phone: cleanPhone };
    }
    fs.writeFileSync(SENT_LOG_PATH, JSON.stringify(reg, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error persisting sent target:', err);
  }
}

export function isRecentlyContacted(rawPhone?: string | null, bizId?: string | null, hours = 48): boolean {
  try {
    const reg = loadSentRegistry();
    const cutoff = Date.now() - hours * 60 * 60 * 1000;

    if (bizId && reg[`biz_${bizId}`]) {
      const entryTime = new Date(reg[`biz_${bizId}`].timestamp).getTime();
      if (entryTime > cutoff) return true;
    }

    if (rawPhone) {
      const cleanPhone = rawPhone.replace(/\D/g, '');
      if (cleanPhone && reg[cleanPhone]) {
        const entryTime = new Date(reg[cleanPhone].timestamp).getTime();
        if (entryTime > cutoff) return true;
      }
    }
  } catch {}
  return false;
}

// Persistent Campaign Progress and History Files
const CAMPAIGN_PROGRESS_FILE = path.resolve(process.cwd(), 'data/whatsapp_campaign_progress.json');
const CAMPAIGN_HISTORY_FILE = path.resolve(process.cwd(), 'data/whatsapp_campaigns_history.json');

export interface StoredCampaignData {
  campaign: BroadcastProgress;
  businesses: Business[];
  options: CampaignBroadcastOptions;
  updatedAt: string;
}

export function saveCampaignProgress(
  campaign: BroadcastProgress,
  businesses?: Business[],
  options?: any
) {
  try {
    let existingBusinesses = cachedCampaignBusinesses;
    let existingOptions = cachedCampaignOptions;

    if ((!existingBusinesses || existingBusinesses.length === 0) && fs.existsSync(CAMPAIGN_PROGRESS_FILE)) {
      try {
        const prev = JSON.parse(fs.readFileSync(CAMPAIGN_PROGRESS_FILE, 'utf-8'));
        if (Array.isArray(prev.businesses) && prev.businesses.length > 0) {
          existingBusinesses = prev.businesses;
        }
        if (prev.options) {
          existingOptions = prev.options;
        }
      } catch {}
    }

    const dataToSave: StoredCampaignData = {
      campaign,
      businesses: businesses || existingBusinesses || [],
      options: options || existingOptions || { templateType: campaign.templateType },
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(CAMPAIGN_PROGRESS_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[WhatsApp Gateway] Failed to persist campaign progress:', err);
  }
}

export function archiveCampaignHistory(campaign: BroadcastProgress): void {
  try {
    let history: BroadcastProgress[] = [];
    if (fs.existsSync(CAMPAIGN_HISTORY_FILE)) {
      try {
        history = JSON.parse(fs.readFileSync(CAMPAIGN_HISTORY_FILE, 'utf-8'));
      } catch {}
    }
    const existingIndex = history.findIndex((h) => h.id === campaign.id);
    if (existingIndex >= 0) {
      history[existingIndex] = campaign;
    } else {
      history.unshift(campaign);
    }
    if (history.length > 100) {
      history = history.slice(0, 100);
    }
    fs.writeFileSync(CAMPAIGN_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[WhatsApp Gateway] Failed to archive campaign history:', err);
  }
}

export function loadSavedCampaignProgress(): BroadcastProgress | null {
  try {
    if (fs.existsSync(CAMPAIGN_PROGRESS_FILE)) {
      const raw = fs.readFileSync(CAMPAIGN_PROGRESS_FILE, 'utf-8');
      const data: StoredCampaignData = JSON.parse(raw);
      if (data && data.campaign) {
        // If it was left running or in cooldown when the server stopped/crashed, mark as paused
        if (data.campaign.status === 'running' || data.campaign.status === 'cooldown') {
          data.campaign.status = 'paused';
          data.campaign.cooldownRemainingSeconds = undefined;
        }
        cachedCampaignBusinesses = Array.isArray(data.businesses) ? data.businesses : [];
        cachedCampaignOptions = data.options || null;
        activeCampaign = data.campaign;
        return activeCampaign;
      }
    }
  } catch (err) {
    console.warn('[WhatsApp Gateway] Failed to load saved campaign progress:', err);
  }
  return null;
}

export function clearSavedCampaignProgress(): void {
  try {
    if (fs.existsSync(CAMPAIGN_PROGRESS_FILE)) {
      if (activeCampaign) {
        archiveCampaignHistory(activeCampaign);
      }
      fs.unlinkSync(CAMPAIGN_PROGRESS_FILE);
    }
    activeCampaign = null;
    cachedCampaignBusinesses = [];
    cachedCampaignOptions = null;
  } catch (err) {
    console.warn('[WhatsApp Gateway] Failed to clear campaign progress:', err);
  }
}

export function getCampaignHistory(): BroadcastProgress[] {
  try {
    if (fs.existsSync(CAMPAIGN_HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(CAMPAIGN_HISTORY_FILE, 'utf-8'));
    }
  } catch {}
  return [];
}

// Automatically load any saved progress on module start
try {
  loadSavedCampaignProgress();
} catch {}

/**
 * ☎️ Identifies Egyptian Landline Area Codes and Short Hotlines
 * Cairo/Giza: 02, Alexandria: 03, Benha/Qalyubia: 013, Provincial codes: 040-097, Hotlines: 16xxx/19xxx
 */
export function isLandlineOrHotline(phone?: string | null): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return false;

  // Short hotlines or short landlines (length <= 8 and not starting with mobile prefix 01)
  if (digits.length <= 8 && !digits.startsWith('01')) return true;

  // Egyptian landline prefixes
  if (
    /^(?:0020|20)?(?:02|03|013|040|045|047|048|050|055|062|064|065|066|068|069|082|084|086|088|092|093|095|096|097)\d{5,8}$/.test(
      digits
    )
  ) {
    return true;
  }

  // Explicit Cairo/Giza and Alexandria landline patterns
  if (/^(?:02|03)\d{7,8}$/.test(digits)) return true;

  return false;
}

/**
 * 📱 Validates if a number is a genuine Egyptian mobile (010, 011, 012, 015)
 */
export function isEgyptianMobile(phone?: string | null): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return /^(?:0020|20)?(?:0)?1[0125]\d{8}$/.test(digits);
}

/**
 * 📱 Formats Egyptian / International phone to WhatsApp JID
 */
export function formatPhoneToWhatsAppJid(rawPhone?: string | null): string | null {
  if (!rawPhone || typeof rawPhone !== 'string') return null;
  let digits = rawPhone.replace(/\D/g, '');
  if (!digits || digits.length < 8) return null;

  // Reject dummy placeholder numbers
  if (
    /^0+$/.test(digits) ||
    digits === '01000000000' ||
    digits === '01100000000' ||
    digits === '01200000000' ||
    digits === '01500000000' ||
    digits === '0000000000'
  ) {
    return null;
  }

  // Reject Egyptian landlines and hotlines
  if (isLandlineOrHotline(digits)) {
    return null;
  }

  // Handle Egyptian prefixes
  if (digits.startsWith('0020')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('01') && digits.length === 11) {
    digits = '2' + digits;
  } else if (digits.startsWith('1') && digits.length === 10 && ['0', '1', '2', '5'].includes(digits[1])) {
    digits = '20' + digits;
  } else if (!digits.startsWith('20') && digits.length === 10 && ['0', '1', '2', '5'].includes(digits[0])) {
    digits = '20' + digits;
  }

  return `${digits}@s.whatsapp.net`;
}

/**
 * 🔄 Returns Current WhatsApp Session Status
 */
/**
 * 🔄 Returns Current WhatsApp Session Status for Both Slots
 */
export function getWhatsAppSessionStatus(): WhatsAppSessionStatus {
  const isAnyConnected =
    slotSessions['1'].connectionState === 'connected' ||
    slotSessions['2'].connectionState === 'connected';
  const isAnyConnecting =
    slotSessions['1'].connectionState === 'connecting' ||
    slotSessions['2'].connectionState === 'connecting';
  const isAnyQr =
    slotSessions['1'].connectionState === 'qr_ready' ||
    slotSessions['2'].connectionState === 'qr_ready';

  const aggregateState: WhatsAppConnectionState = isAnyConnected
    ? 'connected'
    : isAnyConnecting
    ? 'connecting'
    : isAnyQr
    ? 'qr_ready'
    : 'disconnected';

  const activeUser = slotSessions['1'].connectedUser || slotSessions['2'].connectedUser;
  const activeQr = slotSessions['1'].qrCodeUrl || slotSessions['2'].qrCodeUrl;
  const activeLastActive = slotSessions['1'].lastActive || slotSessions['2'].lastActive;

  return {
    state: aggregateState,
    qrCodeUrl: activeQr,
    connectedUser: activeUser,
    lastActive: activeLastActive,
    activeCampaign,
    slots: {
      '1': {
        slotId: '1',
        name: slotSessions['1'].name,
        state: slotSessions['1'].connectionState,
        qrCodeUrl: slotSessions['1'].qrCodeUrl,
        connectedUser: slotSessions['1'].connectedUser,
        lastActive: slotSessions['1'].lastActive,
        connectedAt: slotSessions['1'].connectedAt,
        lastHeartbeat: slotSessions['1'].lastHeartbeat,
        uptimeSeconds: slotSessions['1'].connectedAt
          ? Math.floor((Date.now() - new Date(slotSessions['1'].connectedAt).getTime()) / 1000)
          : 0,
        disconnectReason: slotSessions['1'].disconnectReason,
        autoReconnectAttempts: slotSessions['1'].autoReconnectAttempts,
        healthStatus:
          slotSessions['1'].connectionState === 'connected'
            ? 'healthy'
            : slotSessions['1'].connectionState === 'connecting' || slotSessions['1'].connectionState === 'qr_ready'
            ? 'degraded'
            : 'offline',
      },
      '2': {
        slotId: '2',
        name: slotSessions['2'].name,
        state: slotSessions['2'].connectionState,
        qrCodeUrl: slotSessions['2'].qrCodeUrl,
        connectedUser: slotSessions['2'].connectedUser,
        lastActive: slotSessions['2'].lastActive,
        connectedAt: slotSessions['2'].connectedAt,
        lastHeartbeat: slotSessions['2'].lastHeartbeat,
        uptimeSeconds: slotSessions['2'].connectedAt
          ? Math.floor((Date.now() - new Date(slotSessions['2'].connectedAt).getTime()) / 1000)
          : 0,
        disconnectReason: slotSessions['2'].disconnectReason,
        autoReconnectAttempts: slotSessions['2'].autoReconnectAttempts,
        healthStatus:
          slotSessions['2'].connectionState === 'connected'
            ? 'healthy'
            : slotSessions['2'].connectionState === 'connecting' || slotSessions['2'].connectionState === 'qr_ready'
            ? 'degraded'
            : 'offline',
      },
    },
    rotationConfig,
  };
}

/**
 * 🚀 Initializes or Restores WhatsApp Web Connection for a specific Slot ('1' or '2')
 */
export async function initWhatsAppGateway(slotId: SlotId = '1'): Promise<WhatsAppSessionStatus> {
  const session = slotSessions[slotId];
  if (session.isInitializing || session.connectionState === 'connected') {
    return getWhatsAppSessionStatus();
  }

  session.isInitializing = true;
  session.isExplicitDisconnect = false;
  session.connectionState = 'connecting';
  session.qrCodeUrl = null;

  try {
    const authDir = getAuthDirForSlot(slotId);
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const logger = pino({ level: 'silent' });

    const socketInstance = makeWASocket({
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: Browsers.windows(`Dalelak-${slotId}`),
      syncFullHistory: false,
      markOnlineOnConnect: true,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      generateHighQualityLinkPreview: true,
    });
    session.sock = socketInstance;

    socketInstance.ev.on('creds.update', saveCreds);

    socketInstance.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          session.qrCodeUrl = await qrcode.toDataURL(qr, {
            margin: 2,
            scale: 7,
            color: {
              dark: slotId === '1' ? '#0f172a' : '#042f2e',
              light: '#ffffff',
            },
          });
          session.connectionState = 'qr_ready';
        } catch (e) {
          console.error(`Failed to convert QR for slot ${slotId}:`, e);
        }
      }

      if (connection === 'open') {
        session.connectionState = 'connected';
        session.qrCodeUrl = null;
        session.lastActive = new Date().toISOString();
        session.connectedAt = session.connectedAt || new Date().toISOString();
        session.lastHeartbeat = new Date().toISOString();
        session.autoReconnectAttempts = 0;
        session.disconnectReason = null;
        session.healthStatus = 'healthy';

        const rawId = socketInstance.user?.id || '';
        const rawDigits = rawId.split(':')[0].replace(/\D/g, '');
        session.connectedUser = {
          id: rawId,
          name: socketInstance.user?.name || (slotId === '1' ? 'إدارة منصة دليلك (1)' : 'إدارة منصة دليلك (2)'),
          phone: rawDigits.startsWith('20') ? '0' + rawDigits.slice(2) : rawDigits,
        };
        console.log(`✅ WhatsApp Gateway [Slot ${slotId}] Connected Successfully: ${session.connectedUser.phone}`);
      }

      if (connection === 'close') {
        const error = lastDisconnect?.error as any;
        const statusCode = error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        session.disconnectReason = isLoggedOut
          ? 'logged_out'
          : error?.output?.payload?.message || error?.message || (statusCode ? `code_${statusCode}` : 'connection_lost');
        session.healthStatus = 'offline';
        if (!session.isExplicitDisconnect) {
          session.autoReconnectAttempts++;
        }

        console.log(`ℹ️ WhatsApp [Slot ${slotId}] connection closed. Status code: ${statusCode}, Logged out: ${isLoggedOut}, Reason: ${session.disconnectReason}`);

        const credsFile = path.join(authDir, 'creds.json');
        const hasSavedCreds = fs.existsSync(credsFile);

        if (isLoggedOut || session.isExplicitDisconnect) {
          session.connectionState = 'disconnected';
          session.connectedUser = null;
          session.qrCodeUrl = null;
          session.sock = null;
          session.connectedAt = null;
          session.autoReconnectAttempts = 0;
          try {
            if (fs.existsSync(authDir)) {
              fs.rmSync(authDir, { recursive: true, force: true });
            }
          } catch {}

          // If a campaign was running and NO other slot is connected, pause it
          const otherSlot: SlotId = slotId === '1' ? '2' : '1';
          if (
            activeCampaign &&
            activeCampaign.status === 'running' &&
            slotSessions[otherSlot].connectionState !== 'connected'
          ) {
            activeCampaign.status = 'paused';
            console.log('⏸️ Active campaign automatically paused because all sender accounts disconnected.');
          }

          // Do NOT auto-reconnect if explicitly disconnected or logged out.
          // The admin can click Connect / Scan QR in the dashboard when ready.
        } else {
          session.connectionState = 'disconnected';
          session.qrCodeUrl = null;
          session.sock = null;

          // If there are NO saved credentials and we received 408 (QR timed out without scanning):
          if (!hasSavedCreds && (statusCode === 408 || statusCode === DisconnectReason.timedOut)) {
            console.log(`ℹ️ WhatsApp [Slot ${slotId}] QR timed out without scan. Standing by for user action in dashboard.`);
            session.autoReconnectAttempts = 0;
            return;
          }

          // If we have saved credentials, auto-reconnect with smart backoff
          if (hasSavedCreds && !session.isExplicitDisconnect) {
            const attempts = session.autoReconnectAttempts || 1;
            // Cap attempts to avoid infinite spamming if device is offline (max 15 attempts)
            if (attempts > 15) {
              console.warn(`⚠️ WhatsApp [Slot ${slotId}] Reached reconnect attempt limit (15). Pausing until user action.`);
              return;
            }
            const delayMs = Math.min(30000, attempts * 3000); // 3s, 6s, 9s ... up to 30s
            setTimeout(() => {
              if (!session.isExplicitDisconnect && session.connectionState !== 'connected') {
                initWhatsAppGateway(slotId).catch((err) => console.warn(`Auto reconnect notice for slot ${slotId}:`, err?.message));
              }
            }, delayMs);
          }
        }
      }
    });

    return getWhatsAppSessionStatus();
  } catch (err: any) {
    console.error(`Error initializing WhatsApp Gateway [Slot ${slotId}]:`, err);
    session.connectionState = 'disconnected';
    session.healthStatus = 'offline';
    return getWhatsAppSessionStatus();
  } finally {
    session.isInitializing = false;
  }
}

/**
 * 🛑 Disconnects and Clears WhatsApp Session for a specific Slot or Both
 */
export async function disconnectWhatsAppGateway(slotId?: SlotId): Promise<boolean> {
  const slotsToDisconnect: SlotId[] = slotId ? [slotId] : ['1', '2'];

  for (const sId of slotsToDisconnect) {
    const session = slotSessions[sId];
    session.isExplicitDisconnect = true;
    session.connectionState = 'disconnected';
    session.qrCodeUrl = null;
    session.connectedUser = null;
    session.connectedAt = null;
    session.healthStatus = 'offline';
    session.disconnectReason = 'explicit_disconnect';

    try {
      if (session.sock) {
        await session.sock.logout().catch(() => {});
      }
    } catch {}
    session.sock = null;

    const authDir = getAuthDirForSlot(sId);
    try {
      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
      }
    } catch {}
  }
  return true;
}

// 💓 Periodic Heartbeat & Socket Liveness Engine
setInterval(() => {
  const now = new Date().toISOString();
  (['1', '2'] as SlotId[]).forEach((sId) => {
    const session = slotSessions[sId];
    if (session.connectionState === 'connected' && session.sock) {
      session.lastHeartbeat = now;
      session.healthStatus = 'healthy';
      if (session.connectedAt) {
        session.uptimeSeconds = Math.floor((Date.now() - new Date(session.connectedAt).getTime()) / 1000);
      }
    } else if (session.connectionState === 'connecting' || session.connectionState === 'qr_ready') {
      session.healthStatus = 'degraded';
    } else {
      session.healthStatus = 'offline';
    }
  });
}, 25000);

/**
 * 📝 Compiles Dynamic Personalized Message
 */
export function compileBroadcastMessage(
  templateType: string,
  biz: Business,
  customText?: string
): string {
  const venueName = biz.nameAr || biz.name || 'منشأتكم الكريمة';
  const ownerName = biz.ownerName || 'المسؤول';
  const location = [biz.governorate, biz.city].filter(Boolean).join(' - ') || 'المنطقة';
  // 🛡️ STRICT PRIVACY: Official public directory venue URL (e.g. https://www.dalilaak.com/biz/...)
  const directoryUrl = getDisplayDirectoryUrl(biz);

  if (templateType === 'hadayek_invitation') {
    return (
      `أهلاً بحضرتك في *دليلك* 💐\n\n` +
      `لأنك من سكان أو العاملين الكرام بـ *حدائق الأهرام*، تم إدراج نشاطك:\n` +
      `🌟 *(${venueName})*\n` +
      `كـ *إدراج شرفي مجاني مدى الحياة (0.00 ج.م)* على منصة «دليلك» — التطبيق الجغرافي الذكي اللي بيوصل عيادتك، محلك، أو حرفتك لكل اللي بيدوروا على خدماتك في نطاقك الجغرافي.\n\n` +
      `🔗 *رابط كارت نشاطك ومعاينته واستلام هديتك الترويجية:*\n` +
      `${directoryUrl}\n\n` +
      `📸 *علشان نفعل بطاقتك وتظهر للجمهور بأعلى جودة:*\n` +
      `لو مهتم، ابعتلنا هنا مباشرة:\n` +
      `1. نوع وتفاصيل النشاط بدقة.\n` +
      `2. رقم التليفون اللي عليه واتساب للتواصل المباشر مع الزوار والعملاء.\n` +
      `3. كام صورة مميزة للمكان علشان تنزل في الكارت التعريفي بتاعك.\n\n` +
      `❓ *حابب تعرف أكتر أو تسأل إحنا مين ونطاق تغطيتنا؟*\n` +
      `تفضل اسأل وإحنا هنجاوبك على أي استفسار بكل ترحيب 🤝\n\n` +
      `🚫 *غير مهتم؟*\n` +
      `شرفتنا ونعتذر جداً للإزعاج، لا داعي للتفاعل مع الرسالة *(ملاحظة: قد يتم إزالة النشاط إذا لم يثبت وسيلة تواصل فعلية)*.\n\n` +
      `مع خالص التقدير والتمنيات بالتوفيق 💐\n` +
      `*فريق إدارة منصة دليلك*`
    );
  }

  if (templateType === 'honorary_invitation') {
    return (
      `السلام عليكم ورحمة الله وبركاته\n` +
      `تحياتنا لإدارة «${venueName}» الكرام (${location})،\n\n` +
      `تشرّف فريق منصة «دليلك» بالتواصل معكم بعد اختيار واعتماد منشأتكم ضمن قائمة المعالم والأنشطة الرائدة بالمنطقة.\n\n` +
      `🌟 نودّ إبلاغكم باعتماد *إدراج شرفي موثق ومجاني تماماً (0.00 ج.م)* لمنشأتكم في دليلنا المعتمد الرسمي — *بدون أي رسوم أو اشتراكات نهائياً ودائماً*، تقديراً لتميزكم وسمعتكم الطيبة.\n\n` +
      `🔗 *رابط بطاقة منشأتكم بالدليل العام المعتمد:*\n` +
      `${directoryUrl}\n\n` +
      `💡 *لمحة عن خدماتنا لشركاء النجاح:*\n` +
      `بجانب تواجدكم المجاني التام في الدليل، يقدم فريق «دليلك» خدمات احترافية لدعم نمو أعمالكم (التسويق الإعلاني الموجه، تصوير ومونتاج الفيديوهات Reels، وتعزيز الظهور الرقمي على Google والمنصات) — ننفذها *بأعلى معايير الجودة وبأسعار رمزية ومنخفضة جداً*.\n\n` +
      `📞 *للتواصل مع خدمة العملاء:*\n` +
      `لتحسين وتحديث بطاقة النشاط في الدليل، إرسال صور أو معلومات دقيقة، أو إبداء أي تعليق؛ يرجى التواصل مباشرة عبر واتساب مع الرقم الرسمي لخدمة العملاء:\n` +
      `📲 01556221141 (https://wa.me/201556221141)\n\n` +
      `يسعدنا دائماً تواجدكم معنا كشريك نجاح متميز.\n` +
      `إدارة منصة دليلك المعتمدة`
    );
  }

  if (templateType === 'directory_live') {
    return (
      `مرحباً بحضراتكم إدارة «${venueName}»،\n\n` +
      `يسعدنا إحاطتكم علماً بأن صفحة منشأتكم المعتمدة منشورة ومتاحة الآن على منصة دليلك بكافة التفاصيل والموقع الدقيق للجمهور.\n\n` +
      `🔗 *رابط المعاينة المباشر لصفحتكم بالدليل العام:*\n` +
      `${directoryUrl}\n\n` +
      `📞 *للتواصل مع خدمة العملاء:*\n` +
      `لتحسين بطاقة النشاط في الدليل، إرسال صور أو معلومات دقيقة أو إبداء أي تعليق؛ يسعدنا تواصلكم عبر واتساب خدمة العملاء:\n` +
      `📲 01556221141 (https://wa.me/201556221141)\n\n` +
      `مع تمنياتنا لكم بدوام التوفيق والازدهار،\n` +
      `فريق توثيق المنظومة — منصة دليلك`
    );
  }

  if (templateType === 'welcome_invoice') {
    const invNum = biz.invoiceNumber || 'EXP-OFFICIAL';
    return (
      `*إشعار توثيق وفاتورة ترحيبية رسمية — منصة دليلك*\n` +
      `-----------------------------------------\n` +
      `• *اسم المنشأة:* «${venueName}»\n` +
      `• *المسؤول / العميل:* ${ownerName}\n` +
      `• *النطاق الجغرافي:* ${location}\n` +
      `• *رقم الإشعار:* ${invNum}\n` +
      `• *نوع الإدراج:* إدراج شرفي معتمد (مجاني بالكامل 0 ج.م)\n` +
      `• *حالة التوثيق:* معتمد ومفعل بالدليل ✓\n\n` +
      `🔗 *رابط المعاينة والتوثيق بالدليل العام:*\n` +
      `${directoryUrl}\n\n` +
      `📞 *للتواصل مع خدمة العملاء:*\n` +
      `لتحسين بطاقة النشاط في الدليل، أو إرسال صور أو معلومات دقيقة أو إبداء أي تعليق؛ يرجى التواصل عبر واتساب خدمة العملاء:\n` +
      `📲 01556221141 (https://wa.me/201556221141)\n\n` +
      `شاكرين حسن تعاونكم،\n` +
      `الإدارة العامة — منصة دليلك`
    );
  }

  // Custom with placeholders
  let compiled = customText || 'مرحباً بحضراتكم في منصة دليلك';
  compiled = compiled.replace(/\{name\}/g, venueName);
  compiled = compiled.replace(/\{owner\}/g, ownerName);
  compiled = compiled.replace(/\{location\}/g, location);
  compiled = compiled.replace(/\{url\}/g, directoryUrl);
  return compiled;
}

/**
 * ⚡ Starts Automated Throttled WhatsApp Broadcast with Anti-Ban Protection
 */


let cachedImageRegistry: Record<string, any> | null = null;
function getEnhancedPhotoUrl(bizId: string): string | null {
  try {
    if (!cachedImageRegistry) {
      const regPath = path.join(process.cwd(), 'data', 'image_enhancement_registry.json');
      if (fs.existsSync(regPath)) {
        cachedImageRegistry = JSON.parse(fs.readFileSync(regPath, 'utf8'));
      } else {
        cachedImageRegistry = {};
      }
    }
    const item = cachedImageRegistry?.[`biz_${bizId}`] || cachedImageRegistry?.[bizId];
    if (item && item.new_url) {
      return item.new_url;
    }
  } catch {}
  return null;
}

let sharpInstance: any = null;
async function getSharp() {
  if (sharpInstance !== null) return sharpInstance;
  try {
    const s = await import('sharp');
    sharpInstance = s.default || s;
  } catch {
    sharpInstance = false;
  }
  return sharpInstance;
}

async function getCompressedJpegThumbnail(url: string): Promise<Buffer | undefined> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    const rawBuf = Buffer.from(await res.arrayBuffer());
    const sharp = await getSharp();
    if (sharp) {
      return await sharp(rawBuf)
        .resize(500, 333, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 75, mozjpeg: true })
        .toBuffer();
    }
    if (rawBuf.length <= 64 * 1024) return rawBuf;
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * 🔄 Executes Campaign Dispatch Loop with Human Presence & Anti-Ban Protection
 */
async function executeCampaignLoop(
  businesses: Business[],
  options: CampaignBroadcastOptions,
  startIndex = 0
) {
  abortRequested = false;
  skipWaitRequested = false;
  const minDelay = Math.max(5, options.minDelaySeconds || 12);
  const maxDelay = Math.max(minDelay + 3, options.maxDelaySeconds || 20);

  const rotationBatchSize = Math.max(3, options.rotationBatchSize || 15);
  const enableRotation = options.enableRotation !== false;
  const enableStealthRandomMode = options.enableStealthRandomMode !== false;
  const burstPerSlot = options.stealthInitialBurstPerSlot || 0;
  const stealthMinMinutes = Math.max(1, options.stealthMinMinutes !== undefined ? options.stealthMinMinutes : 1);
  const stealthMaxMinutes = Math.max(stealthMinMinutes, options.stealthMaxMinutes !== undefined ? options.stealthMaxMinutes : 5);

  if (!activeCampaign) {
    loadSavedCampaignProgress();
  }

  let slot1SentCount = activeCampaign?.slot1SentCount || 0;
  let slot2SentCount = activeCampaign?.slot2SentCount || 0;
  let stealthModeActive = enableStealthRandomMode || Boolean(activeCampaign?.stealthModeActive);
  let currentSlotSentCount = activeCampaign?.currentSlotSentCount || 0;

  // Starting slot: Always start with Phone 1 on fresh campaign, or restore nextSlotTarget / currentSlot if resuming
  let currentSlot: SlotId =
    startIndex === 0 || !activeCampaign?.currentSlot
      ? '1'
      : (activeCampaign.nextSlotTarget as SlotId) || activeCampaign.currentSlot || '1';

  if (slotSessions[currentSlot].sock === null || slotSessions[currentSlot].connectionState !== 'connected') {
    const otherSlot: SlotId = currentSlot === '1' ? '2' : '1';
    if (slotSessions[otherSlot].sock !== null && slotSessions[otherSlot].connectionState === 'connected') {
      currentSlot = otherSlot;
    }
  }

  console.log(
    `📢 Executing WhatsApp Campaign from index ${startIndex + 1}/${businesses.length} (Mode: ${
      enableStealthRandomMode ? `Organic Alternating (${stealthMinMinutes}-${stealthMaxMinutes}m random delay)` : 'Standard Pacing'
    }, Start Slot: ${currentSlot}, Slot 1 Sent: ${slot1SentCount}, Slot 2 Sent: ${slot2SentCount})...`
  );

  for (let i = startIndex; i < businesses.length; i++) {
    if (abortRequested) {
      console.log(`🛑 Broadcast Campaign was aborted by administrator.`);
      if (activeCampaign) {
        activeCampaign.status = 'aborted';
        activeCampaign.finishedAt = new Date().toISOString();
        saveCampaignProgress(activeCampaign);
        archiveCampaignHistory(activeCampaign);
      }
      break;
    }

    const biz = businesses[i];
    if (activeCampaign) {
      activeCampaign.current = i + 1;
      activeCampaign.lastIndex = i;
      activeCampaign.currentBusinessName = biz.nameAr || biz.name;
    }

    const rawPhone = biz.phone || biz.ownerPhone;

    // ☎️ 1. EXCLUDE LANDLINES AND SHORT HOTLINES
    if (isLandlineOrHotline(rawPhone)) {
      if (activeCampaign) {
        activeCampaign.skipped++;
        activeCampaign.logs.unshift({
          businessId: biz.id,
          businessName: biz.nameAr || biz.name || 'منشأة',
          phone: rawPhone || 'غير متوفر',
          status: 'skipped',
          reason: 'رقم هاتف أرضي / خط ساخن (لا يدعم واتساب) ☎️',
          timestamp: new Date().toISOString(),
        });
        if (activeCampaign.logs.length > 200) {
          activeCampaign.logs = activeCampaign.logs.slice(0, 200);
        }
        saveCampaignProgress(activeCampaign);
      }
      console.log(`[Campaign ${i + 1}/${businesses.length}] Skipped landline: ${biz.nameAr} (${rawPhone})`);
      // Gentle micro-delay (120ms) to prevent network traffic spikes
      await new Promise((r) => setTimeout(r, 120));
      continue;
    }

    const jid = formatPhoneToWhatsAppJid(rawPhone);

    if (!jid) {
      if (activeCampaign) {
        activeCampaign.skipped++;
        activeCampaign.logs.unshift({
          businessId: biz.id,
          businessName: biz.nameAr || biz.name || 'منشأة',
          phone: rawPhone || 'غير متوفر',
          status: 'skipped',
          reason: 'رقم هاتف غير صالح أو وهمي (01000000000)',
          timestamp: new Date().toISOString(),
        });
        if (activeCampaign.logs.length > 200) {
          activeCampaign.logs = activeCampaign.logs.slice(0, 200);
        }
        saveCampaignProgress(activeCampaign);
      }
      await new Promise((r) => setTimeout(r, 120));
      continue;
    }

    // 🛡️ 2. PREVENT DUPLICATE SPAM: Skip if contacted recently
    if (options.skipRecentlyContacted !== false && isRecentlyContacted(rawPhone, biz.id)) {
      if (activeCampaign) {
        activeCampaign.skipped++;
        activeCampaign.logs.unshift({
          businessId: biz.id,
          businessName: biz.nameAr || biz.name || 'منشأة',
          phone: rawPhone || 'غير متوفر',
          status: 'skipped',
          reason: 'تم إرسال رسالة له مسبقاً (تخطي ذكي لمنع التكرار)',
          timestamp: new Date().toISOString(),
        });
        if (activeCampaign.logs.length > 200) {
          activeCampaign.logs = activeCampaign.logs.slice(0, 200);
        }
        saveCampaignProgress(activeCampaign);
      }
      console.log(`[Campaign ${i + 1}/${businesses.length}] Skipped duplicate: ${biz.nameAr} (${rawPhone})`);
      await new Promise((r) => setTimeout(r, 120));
      continue;
    }

    // 🎯 Select target slot for this message (Strict alternating sequence: 1 -> wait -> 2 -> wait -> 1 -> wait -> 2)
    if (enableStealthRandomMode) {
      stealthModeActive = true;
      if (activeCampaign && !activeCampaign.stealthModeActive) {
        activeCampaign.stealthModeActive = true;
      }
      // Ensure currentSlot is valid; if disconnected, auto-failover to the connected slot
      const isCurrentConnected =
        slotSessions[currentSlot].sock !== null && slotSessions[currentSlot].connectionState === 'connected';
      if (!isCurrentConnected) {
        const otherSlot: SlotId = currentSlot === '1' ? '2' : '1';
        if (slotSessions[otherSlot].sock !== null && slotSessions[otherSlot].connectionState === 'connected') {
          console.log(`🔄 [Auto-Failover] Slot ${currentSlot} unavailable. Switching to connected Slot ${otherSlot}.`);
          currentSlot = otherSlot;
          if (activeCampaign) {
            activeCampaign.currentSlot = otherSlot;
            activeCampaign.currentSenderSlot = otherSlot;
          }
        }
      }
    }

    // 🔌 1. Resolve Active Connected Socket with Auto-Failover
    let activeSession = slotSessions[currentSlot];
    if (!activeSession.sock || activeSession.connectionState !== 'connected') {
      const otherSlot: SlotId = currentSlot === '1' ? '2' : '1';
      const otherSession = slotSessions[otherSlot];
      if (otherSession.sock && otherSession.connectionState === 'connected') {
        console.log(`🔄 [Auto-Failover] Slot ${currentSlot} disconnected. Switching seamlessly to active Slot ${otherSlot}.`);
        currentSlot = otherSlot;
        activeSession = otherSession;
        currentSlotSentCount = 0;
      } else {
        console.warn(`[Campaign] Neither WhatsApp slot is connected at index ${i + 1}/${businesses.length}, waiting up to 25s for reconnect...`);
        let reconnected = false;
        for (let w = 0; w < 50; w++) {
          if (abortRequested) break;
          await new Promise((r) => setTimeout(r, 500));
          if (slotSessions['1'].sock && slotSessions['1'].connectionState === 'connected') {
            currentSlot = '1';
            activeSession = slotSessions['1'];
            reconnected = true;
            break;
          }
          if (slotSessions['2'].sock && slotSessions['2'].connectionState === 'connected') {
            currentSlot = '2';
            activeSession = slotSessions['2'];
            reconnected = true;
            break;
          }
        }
        if (!reconnected) {
          console.warn(`[Campaign] Both sockets disconnected. Automatically pausing campaign at index ${i + 1}/${businesses.length}. Progress is saved!`);
          if (activeCampaign) {
            activeCampaign.status = 'paused';
            activeCampaign.lastIndex = i;
            activeCampaign.logs.unshift({
              businessId: biz.id,
              businessName: biz.nameAr || biz.name || 'منشأة',
              phone: rawPhone || 'غير متوفر',
              status: 'skipped',
              reason: 'تم تجميد الحملة مؤقتاً بسبب انقطاع اتصال أرقام الواتساب (يمكن استئنافها بعد إعادة الاتصال) ⏸️',
              timestamp: new Date().toISOString(),
            });
            saveCampaignProgress(activeCampaign);
          }
          break;
        }
      }
    }

    const currentSock = activeSession.sock!;
    rotationConfig.currentSlot = currentSlot;
    rotationConfig.currentSlotSentCount = currentSlotSentCount;
    if (activeCampaign) {
      activeCampaign.currentSlot = currentSlot;
      activeCampaign.currentSlotSentCount = currentSlotSentCount;
      activeCampaign.rotationBatchSize = rotationBatchSize;
    }

    // 🔍 3. VERIFY WHATSAPP ACCOUNT REGISTRATION (sock.onWhatsApp)
    try {
      // Micro-pause before query so it doesn't trigger USync anti-scraping
      await new Promise((r) => setTimeout(r, 350));
      const waCheck = await currentSock.onWhatsApp(jid);
      const targetAccount = Array.isArray(waCheck) ? waCheck.find((c) => c && c.exists) : null;
      if (!targetAccount || !targetAccount.exists) {
        if (activeCampaign) {
          activeCampaign.skipped++;
          activeCampaign.logs.unshift({
            businessId: biz.id,
            businessName: biz.nameAr || biz.name || 'منشأة',
            phone: rawPhone || 'غير متوفر',
            status: 'skipped',
            reason: 'الرقم غير مسجل في تطبيق WhatsApp ❌',
            timestamp: new Date().toISOString(),
          });
          if (activeCampaign.logs.length > 200) {
            activeCampaign.logs = activeCampaign.logs.slice(0, 200);
          }
          saveCampaignProgress(activeCampaign);
        }
        console.log(`[Campaign ${i + 1}/${businesses.length}] Skipped non-WhatsApp account: ${biz.nameAr} (${rawPhone})`);
        await new Promise((r) => setTimeout(r, 200));
        continue;
      }
    } catch (waErr: any) {
      console.warn(`[Campaign] Notice during onWhatsApp verification for ${rawPhone}:`, waErr?.message);
    }

    const rawName = biz.nameAr || biz.name || 'المنشأة الكريمة';
    const venueName = rawName.replace(/[\r\n\t]+/g, ' ').trim();
    const location = [biz.governorate, biz.city].filter(Boolean).join(' - ') || 'مصر';
    const directoryUrl = getDisplayDirectoryUrl(biz);
    const messageBody = compileBroadcastMessage(options.templateType, biz, options.customText);

    // Resolve optimal photo URL for the interactive business preview card
    let photoUrl = (biz as any).coverPhoto || (Array.isArray((biz as any).photos) && (biz as any).photos[0]) || '';
    if (!photoUrl || typeof photoUrl !== 'string' || !photoUrl.startsWith('http')) {
      const regPhoto = getEnhancedPhotoUrl(biz.id);
      if (regPhoto) {
        photoUrl = regPhoto;
      } else {
        photoUrl = `https://www.dalilaak.com/api/biz-og?biz=${encodeURIComponent(biz.id)}`;
      }
    }

    try {
      // 🛡️ 4. HUMAN PRESENCE & TYPING SIMULATION (Emulates human writing behavior)
      try {
        await currentSock.presenceSubscribe?.(jid).catch(() => {});
        await currentSock.sendPresenceUpdate?.('composing', jid).catch(() => {});
        // Human typing simulation (between 1800ms and 3000ms)
        const typingDelay = Math.floor(1800 + Math.random() * 1200);
        await new Promise((r) => setTimeout(r, typingDelay));
        await currentSock.sendPresenceUpdate?.('paused', jid).catch(() => {});
      } catch (presErr) {
        // Non-blocking
      }

      // 🌟 Native WhatsApp Authentic Directory Link Preview (Zero-Ad, 100% Native)
      let nativeLinkPreview: any = undefined;
      try {
        nativeLinkPreview = await getUrlInfo(directoryUrl, {
          thumbnailWidth: 500,
          fetchOpts: { timeout: 8000 },
          uploadImage: (currentSock as any)?.waUploadToServer,
        });
      } catch (previewErr) {
        console.warn(`[Campaign] Native link preview generation notice for ${directoryUrl}:`, previewErr);
      }

      // Robust fallback if network crawler took too long: construct crisp native link preview directly
      if (!nativeLinkPreview) {
        let fallbackThumb: Buffer | undefined;
        if (photoUrl) {
          fallbackThumb = await getCompressedJpegThumbnail(photoUrl);
        }
        if (fallbackThumb) {
          let ratingSnippet = '';
          try {
            let parsedNotes: any = null;
            if (typeof (biz as any).notes === 'string' && (biz as any).notes.trim().startsWith('{')) {
              parsedNotes = JSON.parse((biz as any).notes.trim());
            } else if (typeof (biz as any).notes === 'object') {
              parsedNotes = (biz as any).notes;
            }
            const gRating = (biz as any).googleRating || parsedNotes?.googleRating;
            const gReviews = (biz as any).googleReviewsCount || parsedNotes?.googleReviewsCount;
            if (gRating) {
              ratingSnippet = `⭐ تقييم Google: ${Number(gRating).toFixed(1)}${gReviews ? ` (${gReviews} تقييم)` : ''} • `;
            }
          } catch {}

          nativeLinkPreview = {
            'matched-text': directoryUrl,
            'canonical-url': directoryUrl,
            title: `${venueName} | منصة دليلك المعتمدة`,
            description: `${ratingSnippet}منصة دليلك المعتمدة • ${location}`,
            jpegThumbnail: fallbackThumb,
          };
        }
      }

      const messagePayload: any = {
        text: messageBody,
      };

      if (nativeLinkPreview) {
        messagePayload.linkPreview = nativeLinkPreview;
      }

      await currentSock.sendMessage(jid, messagePayload);
      recordSentTarget(rawPhone!, biz.id);

      // Increment slot-specific counters
      if (currentSlot === '1') {
        slot1SentCount++;
        if (activeCampaign) activeCampaign.slot1SentCount = slot1SentCount;
      } else {
        slot2SentCount++;
        if (activeCampaign) activeCampaign.slot2SentCount = slot2SentCount;
      }

      if (activeCampaign) {
        activeCampaign.successful++;
        activeCampaign.currentSenderSlot = currentSlot;
        activeCampaign.currentSlot = currentSlot;
        activeCampaign.logs.unshift({
          businessId: biz.id,
          businessName: biz.nameAr || biz.name || 'منشأة',
          phone: rawPhone!,
          status: 'sent',
          timestamp: new Date().toISOString(),
          senderSlot: currentSlot,
          senderPhone: activeSession.connectedUser?.phone || (currentSlot === '1' ? 'هاتف 1' : 'هاتف 2'),
        });
        // Keep live logs array efficient for polling
        if (activeCampaign.logs.length > 200) {
          activeCampaign.logs = activeCampaign.logs.slice(0, 200);
        }
        saveCampaignProgress(activeCampaign);
      }
      console.log(
        `[Campaign ${i + 1}/${businesses.length}] Sent to ${biz.nameAr} (${rawPhone}) [Slot ${currentSlot}] (Slot 1: ${slot1SentCount}, Slot 2: ${slot2SentCount})`
      );

      // 🔄 Increment current slot counter & check rotation
      currentSlotSentCount++;
      rotationConfig.currentSlotSentCount = currentSlotSentCount;
      if (activeCampaign) {
        activeCampaign.currentSlotSentCount = currentSlotSentCount;
      }

      // Standard legacy rotation if stealth mode is not enabled
      if (!enableStealthRandomMode && enableRotation) {
        const otherSlot: SlotId = currentSlot === '1' ? '2' : '1';
        const isOtherConnected =
          slotSessions[otherSlot].sock !== null && slotSessions[otherSlot].connectionState === 'connected';

        if (isOtherConnected && currentSlotSentCount >= rotationBatchSize) {
          console.log(
            `🔄 [Rotation Engine] Reached ${rotationBatchSize} messages on Slot ${currentSlot}. Switching to Slot ${otherSlot} for anti-ban cooling rest.`
          );
          currentSlot = otherSlot;
          currentSlotSentCount = 0;
          rotationConfig.currentSlot = otherSlot;
          rotationConfig.currentSlotSentCount = 0;
          if (activeCampaign) {
            activeCampaign.currentSlot = otherSlot;
            activeCampaign.currentSlotSentCount = 0;
            activeCampaign.logs.unshift({
              businessId: 'sys_rotation',
              businessName: 'نظام التناوب الذكي',
              phone: 'SYSTEM',
              status: 'skipped',
              reason: `🔄 تم التناوب التلقائي: اكتمال ${rotationBatchSize} رسالة على هاتف (${
                otherSlot === '2' ? '1' : '2'
              }). التحويل الآن إلى هاتف (${otherSlot}) لإراحة الرقم السابق.`,
              timestamp: new Date().toISOString(),
            });
            saveCampaignProgress(activeCampaign);
          }
          // Gentle rotation handover pause (4 seconds)
          await new Promise((r) => setTimeout(r, 4000));
        }
      }
    } catch (sendErr: any) {
      console.error(`[Campaign ${i + 1}/${businesses.length}] Failed to send to ${biz.nameAr}:`, sendErr?.message);
      if (activeCampaign) {
        activeCampaign.failed++;
        activeCampaign.logs.unshift({
          businessId: biz.id,
          businessName: biz.nameAr || biz.name || 'منشأة',
          phone: rawPhone!,
          status: 'failed',
          reason: sendErr?.message || 'فشل إرسال الرسالة عبر المقبس',
          timestamp: new Date().toISOString(),
          senderSlot: currentSlot,
          senderPhone: activeSession.connectedUser?.phone || (currentSlot === '1' ? 'هاتف 1' : 'هاتف 2'),
        });
        saveCampaignProgress(activeCampaign);
      }
    }

    // 🛡️ 5. PRECAUTIONARY 10-MINUTE BATCH COOLDOWN (In Phase 1, every 20 successful messages)
    // Note: In Stealth Mode, each message already has a 20-60 minute delay, so batch cooldown is skipped!
    if (
      !stealthModeActive &&
      activeCampaign &&
      activeCampaign.successful > 0 &&
      activeCampaign.successful % 20 === 0 &&
      i < businesses.length - 1 &&
      !abortRequested
    ) {
      const cooldownSeconds = 10 * 60; // 10 minutes = 600 seconds
      const batchNum = Math.floor(activeCampaign.successful / 20);
      console.log(
        `🧊 [Anti-Ban Cooldown] Successfully dispatched 20 messages (Total: ${activeCampaign.successful}, Batch #${batchNum}). Resting for 10 minutes to protect number against algorithmic bans...`
      );

      activeCampaign.status = 'cooldown';
      activeCampaign.cooldownBatchCount = batchNum;
      activeCampaign.cooldownRemainingSeconds = cooldownSeconds;
      activeCampaign.logs.unshift({
        businessId: 'cooldown',
        businessName: 'صمام الأمان والتهدئة التلقائية',
        phone: PRIMARY_WHATSAPP_SENDER_PHONE,
        status: 'skipped',
        reason: `🧊 استراحة أمان احترازية لمدة 10 دقائق (بعد إرسال ${activeCampaign.successful} رسالة بنجاح - الدفعة #${batchNum}) لحماية الرقم من فلاتر الروبوتات`,
        timestamp: new Date().toISOString(),
      });
      saveCampaignProgress(activeCampaign);

      const cooldownStart = Date.now();
      while (Date.now() - cooldownStart < cooldownSeconds * 1000) {
        if (abortRequested) {
          console.log(`🛑 Cooldown interrupted by administrator.`);
          break;
        }
        if (skipWaitRequested) {
          skipWaitRequested = false;
          console.log(`⚡ Cooldown skipped by administrator.`);
          if (activeCampaign) {
            activeCampaign.logs.unshift({
              businessId: 'sys_skip_cooldown',
              businessName: 'تخطي التهدئة',
              phone: 'ADMIN',
              status: 'skipped',
              reason: '⚡ تم تخطي فترة التهدئة يدوياً بأمر لوحة التحكم واستئناف الإرسال فوراً',
              timestamp: new Date().toISOString(),
            });
          }
          break;
        }
        const remaining = Math.max(0, Math.ceil((cooldownSeconds * 1000 - (Date.now() - cooldownStart)) / 1000));
        activeCampaign.cooldownRemainingSeconds = remaining;
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (!abortRequested) {
        console.log(`🔥 [Anti-Ban Cooldown] Finished 10-minute rest. Resuming campaign seamlessly...`);
        activeCampaign.status = 'running';
        activeCampaign.cooldownRemainingSeconds = undefined;
        saveCampaignProgress(activeCampaign);
      }
    }

    // ⏳ 6. DELAY PACING: ORGANIC ALTERNATING (1-5m) OR STANDARD JITTER (10-20s)
    if (i < businesses.length - 1 && !abortRequested) {
      if (enableStealthRandomMode) {
        // 🌿 Organic Alternating Mode: Random delay between stealthMinMinutes and stealthMaxMinutes (granular seconds)
        const minSec = stealthMinMinutes * 60;
        const maxSec = stealthMaxMinutes * 60;
        const delayTotalSeconds = Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec;

        const is1Ok = slotSessions['1'].sock !== null && slotSessions['1'].connectionState === 'connected';
        const is2Ok = slotSessions['2'].sock !== null && slotSessions['2'].connectionState === 'connected';
        const otherSlot: SlotId = currentSlot === '1' ? '2' : '1';
        const nextSlot: SlotId =
          (otherSlot === '1' && is1Ok) || (otherSlot === '2' && is2Ok)
            ? otherSlot
            : (currentSlot === '1' && is1Ok) || (currentSlot === '2' && is2Ok)
            ? currentSlot
            : otherSlot;

        // Explicitly switch currentSlot to the other phone for the upcoming message
        currentSlot = nextSlot;

        if (activeCampaign) {
          activeCampaign.nextSlotTarget = nextSlot;
          activeCampaign.currentSlot = nextSlot;
          activeCampaign.currentSenderSlot = nextSlot;
          activeCampaign.nextDispatchInSeconds = delayTotalSeconds;
          saveCampaignProgress(activeCampaign);
        }

        console.log(
          `🌿 [Organic Alternating Mode] Transitioned to Slot ${nextSlot}. Waiting ${delayTotalSeconds}s (~${(delayTotalSeconds / 60).toFixed(1)}m) before sending next message...`
        );
        const delayStart = Date.now();
        const targetMs = delayTotalSeconds * 1000;
        let lastSave = Date.now();

        while (Date.now() - delayStart < targetMs) {
          if (abortRequested) break;
          if (skipWaitRequested) {
            skipWaitRequested = false;
            console.log('⚡ [Stealth Mode] Delay skipped by administrator! Sending next message immediately.');
            if (activeCampaign) {
              activeCampaign.logs.unshift({
                businessId: 'sys_skip',
                businessName: 'تخطي يدوي للانتظار',
                phone: 'ADMIN',
                status: 'skipped',
                reason: '⚡ تم تخطي فترة الانتظار يدوياً، وبدء إرسال الرسالة القادمة فوراً.',
                timestamp: new Date().toISOString(),
              });
            }
            break;
          }

          const remaining = Math.max(0, Math.ceil((targetMs - (Date.now() - delayStart)) / 1000));
          if (activeCampaign) {
            activeCampaign.nextDispatchInSeconds = remaining;
            if (Date.now() - lastSave > 15000) {
              saveCampaignProgress(activeCampaign);
              lastSave = Date.now();
            }
          }
          await new Promise((r) => setTimeout(r, 1000));
        }

        if (activeCampaign) {
          activeCampaign.nextDispatchInSeconds = 0;
          saveCampaignProgress(activeCampaign);
        }
      } else {
        // Standard / Phase 1 delay (10-20 seconds)
        const randomSeconds = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        if (activeCampaign) {
          activeCampaign.nextDispatchInSeconds = randomSeconds;
        }
        console.log(`⏱️ Anti-Ban Delay: waiting ${randomSeconds}s before next business...`);
        const delayStart = Date.now();
        while (Date.now() - delayStart < randomSeconds * 1000) {
          if (abortRequested) break;
          if (skipWaitRequested) {
            skipWaitRequested = false;
            break;
          }
          const remaining = Math.max(0, Math.ceil((randomSeconds * 1000 - (Date.now() - delayStart)) / 1000));
          if (activeCampaign) {
            activeCampaign.nextDispatchInSeconds = remaining;
          }
          await new Promise((r) => setTimeout(r, 500));
        }
        if (activeCampaign) {
          activeCampaign.nextDispatchInSeconds = 0;
        }
      }
    }
  }

  if (activeCampaign && activeCampaign.status === 'running') {
    activeCampaign.status = 'completed';
    activeCampaign.finishedAt = new Date().toISOString();
    saveCampaignProgress(activeCampaign);
    archiveCampaignHistory(activeCampaign);
    console.log(`🎉 Broadcast Campaign completed successfully!`);
  }
}

/**
 * ⚡ Starts Automated Throttled WhatsApp Broadcast with Anti-Ban Protection
 */
export async function startWhatsAppBroadcast(
  businesses: Business[],
  options: CampaignBroadcastOptions
): Promise<{ success: boolean; message: string; campaignId?: string }> {
  const isAnyConnected =
    (slotSessions['1'].sock !== null && slotSessions['1'].connectionState === 'connected') ||
    (slotSessions['2'].sock !== null && slotSessions['2'].connectionState === 'connected');

  if (!isAnyConnected) {
    return {
      success: false,
      message: 'لا يوجد أي هاتف WhatsApp متصل حالياً. يرجى مسح رمز الـ QR لأحد الهاتفين وتأكيد الاتصال.',
    };
  }

  if (activeCampaign && activeCampaign.status === 'running') {
    return {
      success: false,
      message: 'توجد حملة مراسلة جارية بالفعل في الوقت الحالي.',
    };
  }

  const campaignId = `camp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  cachedCampaignBusinesses = [...businesses];
  cachedCampaignOptions = { ...options };

  activeCampaign = {
    id: campaignId,
    templateType: options.templateType,
    total: businesses.length,
    current: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    status: 'running',
    startedAt: new Date().toISOString(),
    logs: [],
    lastIndex: 0,
    currentSlot: '1',
    currentSlotSentCount: 0,
    slot1SentCount: 0,
    slot2SentCount: 0,
    stealthModeActive: options.enableStealthRandomMode !== false,
    enableStealthRandomMode: options.enableStealthRandomMode !== false,
    stealthMinMinutes: options.stealthMinMinutes !== undefined ? options.stealthMinMinutes : 1,
    stealthMaxMinutes: options.stealthMaxMinutes !== undefined ? options.stealthMaxMinutes : 5,
    stealthInitialBurstPerSlot: 0,
  };

  saveCampaignProgress(activeCampaign, businesses, options);

  // Launch background worker
  executeCampaignLoop(businesses, options, 0).catch((err) => {
    console.error('Fatal error in broadcast campaign worker:', err);
    if (activeCampaign) {
      activeCampaign.status = 'aborted';
      activeCampaign.finishedAt = new Date().toISOString();
      saveCampaignProgress(activeCampaign);
      archiveCampaignHistory(activeCampaign);
    }
  });

  return {
    success: true,
    message: `تم بدء حملة الإرسال التلقائي بنجاح (${businesses.length} منشأة) مع تفعيل نظام التبادل البشري العشوائي (من ${options.stealthMinMinutes !== undefined ? options.stealthMinMinutes : 1} إلى ${options.stealthMaxMinutes !== undefined ? options.stealthMaxMinutes : 5} دقيقة بالتناوب بين الهاتفين).`,
    campaignId,
  };
}

/**
 * ⏯️ Resumes a Paused WhatsApp Broadcast Campaign
 */
export async function resumeWhatsAppBroadcast(): Promise<{ success: boolean; message: string }> {
  const isAnyConnected =
    (slotSessions['1'].sock !== null && slotSessions['1'].connectionState === 'connected') ||
    (slotSessions['2'].sock !== null && slotSessions['2'].connectionState === 'connected');

  if (!isAnyConnected) {
    return {
      success: false,
      message: 'لا يوجد أي هاتف WhatsApp متصل حالياً. يرجى التأكد من مسح الرمز واتصال أحد الهاتفين أولاً قبل الاستئناف.',
    };
  }

  if (!activeCampaign) {
    loadSavedCampaignProgress();
  }

  if (!activeCampaign || activeCampaign.status !== 'paused') {
    return {
      success: false,
      message: 'لا توجد حملة متوقفة مؤقتاً للاستئناف.',
    };
  }

  if (!cachedCampaignBusinesses || cachedCampaignBusinesses.length === 0 || !cachedCampaignOptions) {
    return {
      success: false,
      message: 'بيانات الحملة السابقة غير متوفرة في الذاكرة أو الملف المحلي.',
    };
  }

  const resumeIndex = Math.min((activeCampaign.lastIndex ?? -1) + 1, cachedCampaignBusinesses.length);
  if (resumeIndex >= cachedCampaignBusinesses.length) {
    activeCampaign.status = 'completed';
    activeCampaign.finishedAt = new Date().toISOString();
    saveCampaignProgress(activeCampaign);
    archiveCampaignHistory(activeCampaign);
    return {
      success: true,
      message: 'الحملة مكتملة بالفعل.',
    };
  }

  activeCampaign.status = 'running';
  saveCampaignProgress(activeCampaign);

  executeCampaignLoop(cachedCampaignBusinesses, cachedCampaignOptions, resumeIndex).catch((err) => {
    console.error('Fatal error in resumed campaign worker:', err);
    if (activeCampaign) {
      activeCampaign.status = 'aborted';
      activeCampaign.finishedAt = new Date().toISOString();
      saveCampaignProgress(activeCampaign);
      archiveCampaignHistory(activeCampaign);
    }
  });

  return {
    success: true,
    message: `تم استئناف الحملة بنجاح من المنشأة رقم ${resumeIndex + 1} من أصل ${cachedCampaignBusinesses.length}.`,
  };
}

/**
 * 🛑 Requests Emergency Abort for Running or Paused Broadcast
 */
export function abortWhatsAppBroadcast(): { success: boolean; message: string } {
  if (!activeCampaign || (activeCampaign.status !== 'running' && activeCampaign.status !== 'paused')) {
    return { success: false, message: 'لا توجد حملة قيد التشغيل أو متوقفة مؤقتاً لإنهائها.' };
  }

  abortRequested = true;
  activeCampaign.status = 'aborted';
  activeCampaign.finishedAt = new Date().toISOString();
  saveCampaignProgress(activeCampaign);
  archiveCampaignHistory(activeCampaign);
  return { success: true, message: 'تم تفعيل زر الطوارئ وإلغاء الحملة فوراً بنجاح.' };
}

/**
 * 📊 Retrieves Current or Saved Campaign Progress
 */
export function getCampaignProgress(): BroadcastProgress | null {
  return activeCampaign || loadSavedCampaignProgress();
}

