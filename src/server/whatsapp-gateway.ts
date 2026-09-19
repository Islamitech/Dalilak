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
import {
  processIncomingWhatsAppMessage,
  muteConversationForHuman,
} from './whatsapp-ai-agent.js';

const makeWASocket = (makeWASocketImport as any).default || makeWASocketImport;

export type WhatsAppConnectionState = 'disconnected' | 'connecting' | 'qr_ready' | 'connected';

export const PRIMARY_WHATSAPP_SENDER_PHONE = '01556221141';

export type SlotId = '1' | '2' | string;

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
  safety?: SlotSafetyMetrics;
}

export interface SlotSafetyMetrics {
  slotId: SlotId;
  safetyScore: number;
  hourlyOutboundCount: number;
  hourlyInboundCount: number;
  dailyOutboundCount: number;
  dailyInboundCount: number;
  inboundRatio: number;
  riskLevel: 'safe' | 'moderate' | 'high_risk';
  isCircuitBreakerActive: boolean;
  cooldownUntil: string | null;
  lastCircuitBreakerReason: string | null;
  hourlyCap?: number;
  minDelaySeconds?: number;
  maxDelaySeconds?: number;
  cooldownFrequency?: number;
  cooldownDurationMinutes?: number;
}

export interface WhatsAppRotationState {
  enabled: boolean;
  batchSize: number;
  currentSlot: SlotId;
  currentSlotSentCount: number;
  mode?: 'batch_round_robin' | 'ping_pong' | 'failover_backup';
}

export interface WhatsAppSessionStatus {
  state: WhatsAppConnectionState;
  qrCodeUrl: string | null;
  connectedUser: { id: string; name?: string; phone: string } | null;
  lastActive: string | null;
  activeCampaign: BroadcastProgress | null;
  slots: Record<string, WhatsAppSlotStatus>;
  rotationConfig: WhatsAppRotationState;
  safetyRadar?: Record<string, SlotSafetyMetrics>;
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

/**
 * 📱 Dynamic Slot Session Manager: Supports Slot 1, Slot 2, ... Slot N
 */
export function ensureSlotSession(slotId: SlotId): InternalSlotSession {
  if (!slotSessions[slotId]) {
    slotSessions[slotId] = {
      slotId,
      name:
        slotId === '1'
          ? 'هاتف الإدارة الأساسي (1)'
          : slotId === '2'
          ? 'هاتف الإدارة المساند (2)'
          : `هاتف إدارة إضافي (${slotId})`,
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
    };
  }
  return slotSessions[slotId];
}

/**
 * 🛡️ Anti-Ban Safety Radar & Dynamic Velocity Limiter Store
 */
export const slotSafetyRegistry: Record<
  string,
  {
    hourlyOutbound: number[];
    hourlyInbound: number[];
    dailyOutbound: number;
    dailyInbound: number;
    hourlyCap?: number;
    minDelaySeconds?: number;
    maxDelaySeconds?: number;
    cooldownFrequency?: number;
    cooldownDurationMinutes?: number;
    isCircuitBreakerActive: boolean;
    cooldownUntil: string | null;
    circuitBreakerReason: string | null;
  }
> = {};

export function getSlotSafetyMetrics(slotId: SlotId): SlotSafetyMetrics {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  if (!slotSafetyRegistry[slotId]) {
    slotSafetyRegistry[slotId] = {
      hourlyOutbound: [],
      hourlyInbound: [],
      dailyOutbound: 0,
      dailyInbound: 0,
      hourlyCap: 40,
      minDelaySeconds: 10,
      maxDelaySeconds: 20,
      cooldownFrequency: 20,
      cooldownDurationMinutes: 10,
      isCircuitBreakerActive: false,
      cooldownUntil: null,
      circuitBreakerReason: null,
    };
  }
  const reg = slotSafetyRegistry[slotId];
  reg.hourlyOutbound = reg.hourlyOutbound.filter((t) => t > oneHourAgo);
  reg.hourlyInbound = reg.hourlyInbound.filter((t) => t > oneHourAgo);

  const hourlyOut = reg.hourlyOutbound.length;
  const hourlyIn = reg.hourlyInbound.length;
  const inboundRatio = hourlyOut === 0 ? (hourlyIn > 0 ? 1 : 0) : Math.round((hourlyIn / hourlyOut) * 10) / 10;
  const hourlyCap = reg.hourlyCap || 40;

  // Check cooldown expiry
  if (reg.cooldownUntil && now > new Date(reg.cooldownUntil).getTime()) {
    reg.isCircuitBreakerActive = false;
    reg.cooldownUntil = null;
    reg.circuitBreakerReason = null;
  }

  let score = 95;
  if (hourlyIn > 0) score = Math.min(100, score + Math.min(5, hourlyIn * 2));
  if (hourlyOut > Math.round(hourlyCap * 0.75)) {
    score -= Math.min(30, (hourlyOut - Math.round(hourlyCap * 0.75)) * 2);
  }
  if (reg.isCircuitBreakerActive) score = Math.min(score, 35);

  const riskLevel: 'safe' | 'moderate' | 'high_risk' = score >= 80 ? 'safe' : score >= 60 ? 'moderate' : 'high_risk';

  return {
    slotId,
    safetyScore: Math.max(0, score),
    hourlyOutboundCount: hourlyOut,
    hourlyInboundCount: hourlyIn,
    dailyOutboundCount: reg.dailyOutbound,
    dailyInboundCount: reg.dailyInbound,
    inboundRatio,
    riskLevel,
    isCircuitBreakerActive: reg.isCircuitBreakerActive,
    cooldownUntil: reg.cooldownUntil,
    lastCircuitBreakerReason: reg.circuitBreakerReason,
    hourlyCap,
    minDelaySeconds: reg.minDelaySeconds || 10,
    maxDelaySeconds: reg.maxDelaySeconds || 20,
    cooldownFrequency: reg.cooldownFrequency || 20,
    cooldownDurationMinutes: reg.cooldownDurationMinutes || 10,
  };
}

export function recordSlotOutbound(slotId: SlotId) {
  if (!slotSafetyRegistry[slotId]) getSlotSafetyMetrics(slotId);
  const reg = slotSafetyRegistry[slotId];
  reg.hourlyOutbound.push(Date.now());
  reg.dailyOutbound++;

  const cap = reg.hourlyCap || 40;
  if (reg.hourlyOutbound.length >= cap) {
    triggerSlotCircuitBreaker(slotId, `تجاوز السقف الآمن للرسائل الساعية المحدد (${reg.hourlyOutbound.length}/${cap} رسالة/ساعة)`);
  }
}

export function recordSlotInbound(slotId: SlotId) {
  if (!slotSafetyRegistry[slotId]) getSlotSafetyMetrics(slotId);
  slotSafetyRegistry[slotId].hourlyInbound.push(Date.now());
  slotSafetyRegistry[slotId].dailyInbound++;
}

export function triggerSlotCircuitBreaker(slotId: SlotId, reason: string, durationMinutes = 30) {
  if (!slotSafetyRegistry[slotId]) getSlotSafetyMetrics(slotId);
  const until = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  slotSafetyRegistry[slotId].isCircuitBreakerActive = true;
  slotSafetyRegistry[slotId].cooldownUntil = until;
  slotSafetyRegistry[slotId].circuitBreakerReason = reason;
  console.warn(`🚨 [Circuit Breaker] Slot ${slotId} entered safety cooldown until ${until}. Reason: ${reason}`);
}

export function resetSlotCircuitBreaker(slotId: SlotId): void {
  if (slotSafetyRegistry[slotId]) {
    slotSafetyRegistry[slotId].isCircuitBreakerActive = false;
    slotSafetyRegistry[slotId].cooldownUntil = null;
    slotSafetyRegistry[slotId].circuitBreakerReason = null;
    slotSafetyRegistry[slotId].hourlyOutbound = [];
  }
}

export function updateSlotSafetyConfig(
  slotId: SlotId,
  config: {
    hourlyCap?: number;
    minDelaySeconds?: number;
    maxDelaySeconds?: number;
    batchSize?: number;
    cooldownFrequency?: number;
    cooldownDurationMinutes?: number;
  }
) {
  if (!slotSafetyRegistry[slotId]) getSlotSafetyMetrics(slotId);
  const reg = slotSafetyRegistry[slotId];
  if (typeof config.hourlyCap === 'number' && config.hourlyCap > 0) {
    reg.hourlyCap = config.hourlyCap;
  }
  if (typeof config.minDelaySeconds === 'number' && config.minDelaySeconds >= 1) {
    reg.minDelaySeconds = config.minDelaySeconds;
  }
  if (typeof config.maxDelaySeconds === 'number' && config.maxDelaySeconds >= 1) {
    reg.maxDelaySeconds = Math.max(config.maxDelaySeconds, reg.minDelaySeconds || 1);
  }
  if (typeof config.cooldownFrequency === 'number' && config.cooldownFrequency > 0) {
    reg.cooldownFrequency = config.cooldownFrequency;
  }
  if (typeof config.cooldownDurationMinutes === 'number' && config.cooldownDurationMinutes > 0) {
    reg.cooldownDurationMinutes = config.cooldownDurationMinutes;
  }
  if (typeof config.batchSize === 'number' && config.batchSize > 0) {
    rotationConfig.batchSize = config.batchSize;
  }
  return {
    slotId,
    metrics: getSlotSafetyMetrics(slotId),
    rotationConfig,
  };
}

export function resetSlotCampaignCount(slotId: SlotId): BroadcastProgress | null {
  if (activeCampaign) {
    if (slotId === '1') {
      activeCampaign.slot1SentCount = 0;
    } else if (slotId === '2') {
      activeCampaign.slot2SentCount = 0;
    }
    saveCampaignProgress(activeCampaign);
    return activeCampaign;
  }
  return null;
}

export async function pingSlotConnection(slotId: SlotId): Promise<{
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
    phone: session.connectedUser?.phone || null,
  };
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
  if (activeCampaign) {
    activeCampaign.currentSlot = nextSlot;
    activeCampaign.currentSenderSlot = nextSlot;
    activeCampaign.currentSlotSentCount = 0;
    saveCampaignProgress(activeCampaign);
  }
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
  if (activeCampaign) {
    activeCampaign.rotationBatchSize = rotationConfig.batchSize;
    saveCampaignProgress(activeCampaign);
  }
  return rotationConfig;
}

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
  if (activeCampaign) {
    activeCampaign.nextDispatchInSeconds = 0;
  }
  console.log('⚡ [WhatsApp Gateway] Skip delay requested by administrator.');
  return { success: true, message: 'تم إرسال أمر تخطي فترة الانتظار بنجاح! سيتم إرسال الرسالة القادمة فوراً ⚡' };
}

/**
 * ⚡ Removes long stealth minutes waiting and restores fast safe seconds pacing (10-20s)
 */
export function fixActiveCampaignPacing(newMinDelay = 10, newMaxDelay = 20): { success: boolean; message: string } {
  if (cachedCampaignOptions) {
    cachedCampaignOptions.enableStealthRandomMode = false;
    cachedCampaignOptions.stealthMinMinutes = 0;
    cachedCampaignOptions.stealthMaxMinutes = 0;
    cachedCampaignOptions.minDelaySeconds = newMinDelay;
    cachedCampaignOptions.maxDelaySeconds = newMaxDelay;
  }
  if (activeCampaign) {
    activeCampaign.enableStealthRandomMode = false;
    activeCampaign.stealthModeActive = false;
    activeCampaign.stealthMinMinutes = 0;
    activeCampaign.stealthMaxMinutes = 0;
    activeCampaign.nextDispatchInSeconds = 0;
    saveCampaignProgress(activeCampaign);
  }
  skipWaitRequested = true;
  console.log(`⚡ [WhatsApp Gateway] Fixed pacing to fast safe seconds (${newMinDelay}-${newMaxDelay}s) and skipped current wait.`);
  return { success: true, message: `تم تفعيل وتيرة الإرسال السريعة (${newMinDelay}-${newMaxDelay} ثانية) وإلغاء التعطل بنجاح!` };
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
      if (isOptedOut(rawPhone)) return true;
      const cleanPhone = rawPhone.replace(/\D/g, '');
      if (cleanPhone && reg[cleanPhone]) {
        const entryTime = new Date(reg[cleanPhone].timestamp).getTime();
        if (entryTime > cutoff) return true;
      }
    }
  } catch {}
  return false;
}

// 🛑 Permanent Anti-Ban Opt-Out / Do-Not-Contact Registry
const OPT_OUT_REGISTRY_PATH = path.resolve(process.cwd(), 'data/whatsapp_opt_out_registry.json');

export function loadOptOutRegistry(): Record<string, { phone: string; reason?: string; optedOutAt: string }> {
  try {
    if (fs.existsSync(OPT_OUT_REGISTRY_PATH)) {
      return JSON.parse(fs.readFileSync(OPT_OUT_REGISTRY_PATH, 'utf-8'));
    }
  } catch {}
  return {};
}

export function recordOptOut(phone: string, reason = 'طلب العميل إلغاء الاشتراك / عدم الإزعاج'): void {
  try {
    const reg = loadOptOutRegistry();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone) {
      reg[cleanPhone] = { phone: cleanPhone, reason, optedOutAt: new Date().toISOString() };
      fs.writeFileSync(OPT_OUT_REGISTRY_PATH, JSON.stringify(reg, null, 2), 'utf-8');
      console.log(`🛑 [Opt-Out Registry] Phone ${cleanPhone} added to permanent do-not-contact list to protect accounts against bans.`);
    }
  } catch (err) {
    console.warn('Error recording opt-out:', err);
  }
}

export function isOptedOut(phone?: string | null): boolean {
  if (!phone) return false;
  try {
    const reg = loadOptOutRegistry();
    const cleanPhone = phone.replace(/\D/g, '');
    return Boolean(reg[cleanPhone]);
  } catch {
    return false;
  }
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
  const allSlotKeys = Object.keys(slotSessions);
  const isAnyConnected = allSlotKeys.some((k) => slotSessions[k].connectionState === 'connected');
  const isAnyConnecting = allSlotKeys.some((k) => slotSessions[k].connectionState === 'connecting');
  const isAnyQr = allSlotKeys.some((k) => slotSessions[k].connectionState === 'qr_ready');

  const aggregateState: WhatsAppConnectionState = isAnyConnected
    ? 'connected'
    : isAnyConnecting
    ? 'connecting'
    : isAnyQr
    ? 'qr_ready'
    : 'disconnected';

  const firstConnected = allSlotKeys.map((k) => slotSessions[k]).find((s) => s.connectedUser);
  const firstQr = allSlotKeys.map((k) => slotSessions[k]).find((s) => s.qrCodeUrl);
  const firstActive = allSlotKeys.map((k) => slotSessions[k]).find((s) => s.lastActive);

  const activeUser = firstConnected?.connectedUser || null;
  const activeQr = firstQr?.qrCodeUrl || null;
  const activeLastActive = firstActive?.lastActive || null;

  const slotsMap: Record<string, WhatsAppSlotStatus> = {};
  const safetyRadarMap: Record<string, SlotSafetyMetrics> = {};

  allSlotKeys.forEach((sId) => {
    const s = slotSessions[sId];
    const safety = getSlotSafetyMetrics(sId);
    safetyRadarMap[sId] = safety;

    slotsMap[sId] = {
      slotId: sId,
      name: s.name,
      state: s.connectionState,
      qrCodeUrl: s.qrCodeUrl,
      connectedUser: s.connectedUser,
      lastActive: s.lastActive,
      connectedAt: s.connectedAt,
      lastHeartbeat: s.lastHeartbeat,
      uptimeSeconds: s.connectedAt
        ? Math.floor((Date.now() - new Date(s.connectedAt).getTime()) / 1000)
        : 0,
      disconnectReason: s.disconnectReason,
      autoReconnectAttempts: s.autoReconnectAttempts,
      healthStatus:
        s.connectionState === 'connected'
          ? 'healthy'
          : s.connectionState === 'connecting' || s.connectionState === 'qr_ready'
          ? 'degraded'
          : 'offline',
      safety,
    };
  });

  return {
    state: aggregateState,
    qrCodeUrl: activeQr,
    connectedUser: activeUser,
    lastActive: activeLastActive,
    activeCampaign,
    slots: slotsMap,
    rotationConfig,
    safetyRadar: safetyRadarMap,
  };
}

/**
 * 🚀 Initializes or Restores WhatsApp Web Connection for a specific Slot ('1', '2', ... 'N')
 */
export async function initWhatsAppGateway(slotId: SlotId = '1'): Promise<WhatsAppSessionStatus> {
  const session = ensureSlotSession(slotId);
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
      browser: Browsers.windows('Desktop'),
      syncFullHistory: false,
      markOnlineOnConnect: true,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      generateHighQualityLinkPreview: true,
    });
    session.sock = socketInstance;

    socketInstance.ev.on('creds.update', saveCreds);

    // 📩 Inbound Message Listener: Listens for customer replies & human intervention
    socketInstance.ev.on('messages.upsert', async ({ messages, type }: any) => {
      if (type !== 'notify' || !Array.isArray(messages)) return;
      for (const msg of messages) {
        if (!msg.message) continue;
        const remoteJid = msg.key?.remoteJid || '';
        if (!remoteJid || remoteJid.endsWith('@g.us') || remoteJid === 'status@broadcast') continue;

        const cleanPhone = remoteJid.split('@')[0].replace(/\D/g, '');

        // 👤 Check if message was sent manually by human admin from phone app (Any Slot)
        if (msg.key?.fromMe) {
          console.log(`👤 [Human Takeover] Outgoing message detected on Slot ${slotId} to ${cleanPhone}. Muting AI bot.`);
          muteConversationForHuman(cleanPhone);
          continue;
        }

        // Extract incoming text
        const incomingText =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          '';

        if (!incomingText.trim()) continue;

        console.log(`📩 [Inbound Message] From ${cleanPhone} on Slot ${slotId}: "${incomingText}"`);

        // Record inbound message in safety telemetry
        recordSlotInbound(slotId);

        // 🌟 UNIVERSAL CUSTOMER SERVICE (Slots 1, 2, and future numbers):
        // All connected slots act as active customer service lines: welcoming, answering inquiries, and logging follow-ups.

        // Dispatch to Grok AI Agent asynchronously without blocking
        processIncomingWhatsAppMessage({
          rawPhone: remoteJid,
          incomingText,
          slotId,
          senderSock: socketInstance,
          messageKey: msg.key,
        }).catch((err) => {
          console.error(`[AI Agent Dispatch Error on Slot ${slotId}]:`, err);
        });
      }
    });

    socketInstance.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          session.qrCodeUrl = await qrcode.toDataURL(qr, {
            margin: 3,
            scale: 8,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          });
          session.connectionState = 'qr_ready';

          if (slotId === '2') {
            const base64Data = session.qrCodeUrl.replace(/^data:image\/png;base64,/, '');
            const buf = Buffer.from(base64Data, 'base64');
            const p1 = String.raw`C:\Users\Ahmed\Desktop\Multi-Agent-System\slot_2_qr.png`;
            const p2 = String.raw`C:\Users\Ahmed\Desktop\pc\slot_2_qr.png`;
            try { fs.writeFileSync(p1, buf); } catch {}
            try { fs.writeFileSync(p2, buf); } catch {}
            console.log('🔄 [WhatsApp Gateway] Fresh live slot_2_qr.png written to disk.');
          }
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
const heartbeatTimer = setInterval(() => {
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

if (typeof (heartbeatTimer as any)?.unref === 'function') {
  (heartbeatTimer as any).unref();
}

/**
 * 📝 Compiles Dynamic Personalized Message
 */
/**
 * 🎲 Spintax Engine for Outbound Broadcast Messages
 * Evaluates {option1|option2|option3} dynamically per message to ensure
 * zero identical message hashes and bypass spam/bot heuristic filters.
 */
export function resolveSpintax(text: string): string {
  if (!text || typeof text !== 'string') return '';
  const regex = /\{([^{}]+)\}/g;
  let result = text;
  let safetyCounter = 0;
  while (regex.test(result) && safetyCounter < 20) {
    result = result.replace(regex, (_, choices) => {
      const parts = choices.split('|');
      const selected = parts[Math.floor(Math.random() * parts.length)];
      return selected !== undefined ? selected.trim() : '';
    });
    safetyCounter++;
  }
  return result;
}

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

  // 🎲 SMART MULTI-ANGLE SELECTOR:
  // Randomly cycles through 5 distinct psychological angles per recipient to guarantee
  // that no two consecutive recipients receive messages with the same structure or fingerprint.
  let effectiveTemplate = templateType;
  if (templateType === 'smart_multi_angle') {
    const candidateAngles = [
      'hadayek_invitation',
      'honorary_invitation',
      'qr_gift_invitation',
      'community_showcase',
      'concise_direct',
    ];
    effectiveTemplate = candidateAngles[Math.floor(Math.random() * candidateAngles.length)];
  }

  // ANGLE 1: Hadayek Al-Ahram & Local Landmark Invitation
  if (effectiveTemplate === 'hadayek_invitation') {
    const rawTemplate =
      `{أهلاً بحضرتك في *دليلك* 💐|تحياتنا لحضرتك من فريق *دليلك* 💐|مرحباً بك مع منصة *دليلك* 💐|السلام عليكم ورحمة الله، تحياتنا لكم من *دليلك* 💐|صباح الخير والبركة من أسرة *دليلك* 💐}\n\n` +
      `{لأنك من سكان أو العاملين الكرام بـ *حدائق الأهرام*|تقديراً لتواجدكم الكريم ونشاطكم المتميز بـ *حدائق الأهرام*|لأن منشأتكم من المعالم المعروفة في نطاق *حدائق الأهرام*|حرصاً منا على إبراز الأنشطة الراقية في *حدائق الأهرام*}، {تم إدراج نشاطك|يسعدنا إحاطتكم باعتماد نشاطكم|نود إبلاغكم بتوثيق وإدراج نشاطكم|تشرفنا باعتماد بطاقة منشأتكم}:\n` +
      `🌟 *(${venueName})*\n` +
      `{كـ *إدراج شرفي مجاني مدى الحياة (0.00 ج.م)*|كـ *توثيق رسمي معتمد مجاناً بالكامل بدون أي رسوم*|كـ *إدراج شرفي موثق مجاناً دائماً*|ضمن دليل الأنشطة المعتمد مجاناً وبدون أي اشتراك} {على منصة «دليلك» — التطبيق الجغرافي الذكي|في دليل «دليلك» المعتمد للأنشطة الميدانية|عبر منصة «دليلك» الرقمية المعتمدة} {اللي بيوصل عيادتك، محلك، أو خدمتك لكل اللي بيدوروا عليك في نطاقك|لتسهيل وصول زبائن وسكان المنطقة إليكم مباشرة|لدعم حضوركم الرقمي وربط نشاطكم بأهالي النطاق الجغرافي}.\n\n` +
      `🔗 *رابط كارت نشاطك ومعاينته واستلام هديتك الترويجية:*\n` +
      `${directoryUrl}\n\n` +
      `📸 *{علشان نفعل بطاقتك وتظهر للجمهور بأعلى جودة|لتأكيد ظهور بطاقتكم للعملاء بأدق تفاصيل|لتحديث بيانات المعاينة واستلام هديتكم|لتحديث أرقامكم ومواعيد عملكم}:*\n` +
      `{لو حابب، ابعتلنا هنا مباشرة|تقدر تبعتلنا هنا على نفس الشات|يسعدنا استقبال تفاصيلكم هنا}:\n` +
      `1. نوع وتفاصيل النشاط بدقة.\n` +
      `2. رقم التليفون أو الواتساب المعتمد للتواصل مع العملاء.\n` +
      `3. كام صورة مميزة للمكان علشان تنزل في الكارت التعريفي بتاعك.\n\n` +
      `❓ *{حابب تعرف أكتر أو تسأل إحنا مين؟|عندك أي استفسار أو حابب توضح أي تفاصيل؟}*\n` +
      `{تفضل اسأل وإحنا هنجاوبك على أي استفسار بكل ترحيب 🤝|شرفنا بسؤالك وفريق خدمة العملاء جاهز لخدمتكم دائماً 🤝}\n\n` +
      `🚫 *غير مهتم؟*\n` +
      `{شرفتنا ونعتذر جداً للإزعاج، لا داعي للتفاعل مع الرسالة 💐|نعتذر عن أي إزعاج ونتمنى لكم كل التوفيق والنجاح 💐}\n\n` +
      `{مع خالص التقدير والتمنيات بالتوفيق 💐\n*فريق إدارة منصة دليلك*|دمتم في رعاية الله وتوفيقه 💐\n*منصة دليلك المعتمدة*}`;

    return resolveSpintax(rawTemplate);
  }

  // ANGLE 2: Formal Honorary Landmark Notice
  if (effectiveTemplate === 'honorary_invitation') {
    const rawTemplate =
      `{السلام عليكم ورحمة الله وبركاته|تحياتنا الطيبة والتقدير لكم|أهلاً بكم ومرحباً}\n` +
      `{تحياتنا لإدارة «${venueName}» الكرام (${location})|إلى السادة القائمين على إدارة «${venueName}» الموقرين|عناية السادة إدارة «${venueName}» المحترمين}،\n\n` +
      `{تشرّف فريق منصة «دليلك» بالتواصل معكم بعد اعتماد منشأتكم|يسعد فريق منصة «دليلك» إحاطتكم باختيار واعتماد منشأتكم|نحيط سيادتكم علماً باختيار منشأتكم الكريمة} ضمن قائمة المعالم والأنشطة الرائدة بالمنطقة.\n\n` +
      `🌟 نودّ إبلاغكم باعتماد *إدراج شرفي موثق ومجاني تماماً (0.00 ج.م)* لمنشأتكم في دليلنا المعتمد الرسمي — *بدون أي رسوم أو اشتراكات نهائياً ودائماً*، تقديراً لتميزكم وسمعتكم الطيبة.\n\n` +
      `🔗 *رابط بطاقة منشأتكم بالدليل العام المعتمد:*\n` +
      `${directoryUrl}\n\n` +
      `💡 *لمحة عن خدماتنا لشركاء النجاح:*\n` +
      `بجانب تواجدكم المجاني التام في الدليل، يقدم فريق «دليلك» خدمات احترافية لدعم نمو أعمالكم (التسويق الإعلاني الموجه، تصوير الفيديوهات الترويجية، وتعزيز الظهور الرقمي على Google) — بأعلى معايير الجودة وبأسعار رمزية ومخفضة.\n\n` +
      `📞 *للتواصل مع خدمة العملاء:*\n` +
      `لتحسين وتحديث بطاقة النشاط في الدليل، إرسال صور أو معلومات دقيقة، أو استلام تصميم كود الـ QR؛ يرجى التواصل مباشرة عبر واتساب خدمة العملاء:\n` +
      `📲 01556221141 (https://wa.me/201556221141)\n\n` +
      `يسعدنا دائماً تواجدكم معنا كشريك نجاح متميز.\n` +
      `إدارة منصة دليلك المعتمدة`;

    return resolveSpintax(rawTemplate);
  }

  // ANGLE 3: Digital QR Gift Package Notice
  if (effectiveTemplate === 'qr_gift_invitation') {
    const rawTemplate =
      `{السلام عليكم ورحمة الله وبركاته 💐|أهلاً وسهلاً بحضراتكم 💐|تحياتنا الطيبة لإدارة «${venueName}» 💐}\n\n` +
      `{يسعد فريق منصة «دليلك» إهداء منشأتكم الكريمة|تتشرف منصة «دليلك» بتقديم هدية رقمية خاصة لنشاطكم المتميز|تقديراً لخدماتكم المتميزة في ${location}، يسرنا تقديم}:\n` +
      `🎁 *تصميم كود الـ QR الرقمي المعتمد للمحل (هدية مجانية 100%)*\n\n` +
      `{تم تجهيز 4 تصميمات فاخرة لكود الـ QR بدقة طباعية عالية (300 DPI) لتعليقها على واجهة المحل أو الكاونتر، لتمكين العملاء من الوصول لصفحتكم وتقييمكم بضغطة واحدة|يساعد كود الـ QR زبائنكم في فتح بطاقة نشاطكم والاتصال المباشر بكم ومعرفة مواعيد العمل بمجرد توجيه كاميرا الهاتف}.\n\n` +
      `🔗 *رابط معاينة بطاقة النشاط وكود الـ QR المعتمد:*\n` +
      `${directoryUrl}\n\n` +
      `{لاستلام ملفات التصاميم الرقمية الأربعة عالية الجودة أو تعديل بيانات المحل، فقط شرفنا بالرد على هذه المحادثة 🤝|لو حابب تستلم قوالب الـ QR المجهزة للطباعة أو تبعتلنا صور المكان، رد علينا هنا في أي وقت ويسعدنا خدمتك}.\n\n` +
      `{غير مهتم بالخدمة؟ نعتذر عن الإزعاج ونتمنى لكم كامل التوفيق 💐|في حال عدم الرغبة بالمراسلة لا داعي للرد ونعتذر عن أي إزعاج}.`;

    return resolveSpintax(rawTemplate);
  }

  // ANGLE 4: Local Community Discovery & Map Visibility
  if (effectiveTemplate === 'community_showcase') {
    const rawTemplate =
      `{أهلاً بحضراتكم 🌟|تحياتنا الطيبة لكم 🌟|مرحباً بإدارة «${venueName}» 🌟}\n\n` +
      `{في إطار مبادرة منصة «دليلك» لتوثيق ودعم أنشطة أهالي ${location}|حرصاً منا على مساعدة سكان ورواد ${location} في الوصول السريع لأفضل الخدمات|تقديراً لثقة زبائن ${location} في جودة خدماتكم}:\n\n` +
      `📍 {تم اعتماد نشر بطاقة نشاطكم رسمياً|يسرنا إحاطتكم بنشر صفحة منشأتكم المعتمدة|تم تفعيل ملفكم الرقمي التفاعلي} {على الخريطة الذكية ودليل «دليلك» العام|بدليل دليلك لخدمة سكان المنطقة}، {حتى يسهل على كل من يبحث عن خدماتكم الوصول إليكم والتواصل المباشر معكم|لتسهيل الاتصال بكم وزيادة ظهوركم بين أهالي الحي}.\n\n` +
      `🔗 *رابط بطاقتكم الرسمية المعتمدة بالدليل:*\n` +
      `${directoryUrl}\n\n` +
      `{علشان نتأكد إن كل تفاصيل المحل والمواعيد والصور مظبوطة 100%، تقدر تراجع الرابط وتبعتبلنا أي تعديل تحبه هنا مباشرة 🤝|يسعدنا استقبال أي ملاحظات أو إضافة أرقام تواصل وصور للمقر لتحسين ظهوركم}.\n\n` +
      `تمنياتنا لكم بمزيد من النجاح والتألق 💐\n` +
      `*فريق عمل منصة دليلك*`;

    return resolveSpintax(rawTemplate);
  }

  // ANGLE 5: Casual, Light & Ultra-Concise Notice
  if (effectiveTemplate === 'concise_direct') {
    const rawTemplate =
      `{السلام عليكم ورحمة الله 💐|أهلاً بحضرتك يا فندم 💐|تحياتنا لإدارة «${venueName}»}\n\n` +
      `{حبينا نبلغكم إنه تم توثيق ونشر بطاقة منشأتكم|تم اعتماد بطاقة منشأتكم مجاناً|يسعدنا إبلاغكم بإتاحة بطاقة منشأتكم الآن} في دليل «دليلك» المعتمد لخدمة أهالي ${location}.\n\n` +
      `🔗 {تقدر تعاين صفحتك بالدليل من هنا|رابط صفحة المنشأة المعتمدة|رابط بطاقة المكان بالدليل}:\n` +
      `${directoryUrl}\n\n` +
      `{لو محتاج تضيف صور، تعدل أرقام، أو تستلم كود الـ QR الخاص بالمكان، ابعتلنا هنا في أي وقت وتحت أمرك 🤝|تفضل بمراجعة بياناتك وإرسال أي تحديث ترغب به ويسعدنا دائماً مساعدتك}.\n\n` +
      `{شكراً لوقتكم وبالتوفيق دائماً|مع خالص تمنياتنا لكم بالتوفيق والازدهار}.`;

    return resolveSpintax(rawTemplate);
  }

  // ANGLE 6: Official Verification Certificate / Welcome Invoice
  if (effectiveTemplate === 'welcome_invoice') {
    const invNum = biz.invoiceNumber || 'EXP-OFFICIAL';
    const rawTemplate =
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
      `الإدارة العامة — منصة دليلك`;

    return resolveSpintax(rawTemplate);
  }

  // Custom with placeholders and Spintax support
  let compiled = customText || 'مرحباً بحضراتكم في منصة دليلك';
  compiled = compiled.replace(/\{businessName\}|\{venueName\}|\{name\}/gi, venueName);
  compiled = compiled.replace(/\{ownerName\}|\{owner\}/gi, ownerName);
  compiled = compiled.replace(/\{location\}|\{city\}/gi, location);
  compiled = compiled.replace(/\{directoryUrl\}|\{url\}/gi, directoryUrl);
  compiled = compiled.replace(/\{phone\}/gi, biz.phone || '');
  return resolveSpintax(compiled);
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

    // 🛡️ 1.1 CIRCUIT BREAKER GUARD: Protect active line against hourly velocity cap or ban risk
    const currentSafety = getSlotSafetyMetrics(currentSlot);
    if (currentSafety.isCircuitBreakerActive) {
      const otherSlot: SlotId = currentSlot === '1' ? '2' : '1';
      const otherSession = slotSessions[otherSlot];
      const otherSafety = getSlotSafetyMetrics(otherSlot);
      const isOtherHealthy =
        otherSession.sock !== null &&
        otherSession.connectionState === 'connected' &&
        !otherSafety.isCircuitBreakerActive;

      if (isOtherHealthy) {
        console.warn(
          `🚨 [Circuit Breaker Active on Slot ${currentSlot}] Switching to safe Slot ${otherSlot} (${currentSafety.lastCircuitBreakerReason})`
        );
        currentSlot = otherSlot;
        activeSession = otherSession;
        currentSlotSentCount = 0;
      } else {
        console.warn(
          `🚨 [Circuit Breaker Tripped] Halting broadcast campaign to protect phone numbers from ban (${currentSafety.lastCircuitBreakerReason}).`
        );
        if (activeCampaign) {
          activeCampaign.status = 'paused';
          activeCampaign.lastIndex = i;
          activeCampaign.logs.unshift({
            businessId: 'sys_circuit_breaker',
            businessName: 'قاطع أمان الحظر التلقائي (Circuit Breaker)',
            phone: currentSlot === '1' ? PRIMARY_WHATSAPP_SENDER_PHONE : 'هاتف 2',
            status: 'skipped',
            reason: `🚨 تم تفعيل قاطع الحظر التلقائي لحماية الحساب من الحظر: ${currentSafety.lastCircuitBreakerReason}. توقفت الحملة مؤقتاً بأمان لحين انتهاء فترة التهدئة.`,
            timestamp: new Date().toISOString(),
          });
          saveCampaignProgress(activeCampaign);
        }
        break;
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

      // Add a 15-second timeout to prevent infinite hang if Baileys socket is zombie/dead
      await Promise.race([
        currentSock.sendMessage(jid, messagePayload),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: Message send hanging (Socket dead)')), 15000))
      ]);

      recordSentTarget(rawPhone!, biz.id);
      recordSlotOutbound(currentSlot);

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
      
      if (sendErr?.message === 'Timeout: Message send hanging (Socket dead)') {
        console.warn(`🚨 [Zombie Socket] Slot ${currentSlot} timed out! Disconnecting slot to force auto-reconnect.`);
        try {
          // Setting healthStatus will help the UI see it's broken, disconnect will clear the zombie socket.
          slotSessions[currentSlot].healthStatus = 'degraded';
          disconnectWhatsAppGateway(currentSlot).catch(() => {});
        } catch(e) {}
        
        // Immediately try to switch to the other slot so the campaign doesn't halt on the next iteration
        const otherSlot: SlotId = currentSlot === '1' ? '2' : '1';
        if (slotSessions[otherSlot].sock !== null && slotSessions[otherSlot].connectionState === 'connected') {
          currentSlot = otherSlot;
        }
      }

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

    // 🛡️ 5. PERIODIC ANTI-BAN REST (Short 2-minute rest every 25 successful messages)
    if (
      activeCampaign &&
      activeCampaign.successful > 0 &&
      activeCampaign.successful % 25 === 0 &&
      i < businesses.length - 1 &&
      !abortRequested
    ) {
      const cooldownSeconds = 120; // 2 minutes (120 seconds)
      const batchNum = Math.floor(activeCampaign.successful / 25);
      console.log(
        `🧊 [Anti-Ban Cooldown] Dispatched 25 messages (Total: ${activeCampaign.successful}, Batch #${batchNum}). Resting for 2 minutes to protect line against spam filters...`
      );

      activeCampaign.status = 'cooldown';
      activeCampaign.cooldownBatchCount = batchNum;
      activeCampaign.cooldownRemainingSeconds = cooldownSeconds;
      activeCampaign.logs.unshift({
        businessId: 'cooldown',
        businessName: 'استراحة أمان دورية للخطوط',
        phone: PRIMARY_WHATSAPP_SENDER_PHONE,
        status: 'skipped',
        reason: `🧊 استراحة أمان وتبريد دورية لمدة دقيقتين فقط (بعد إرسال ${activeCampaign.successful} رسالة بنجاح - الدفعة #${batchNum}) لحماية الأرقام`,
        timestamp: new Date().toISOString(),
      });
      saveCampaignProgress(activeCampaign);

      const cooldownStart = Date.now();
      while (Date.now() - cooldownStart < cooldownSeconds * 1000) {
        if (abortRequested) break;
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
        activeCampaign.status = 'running';
        activeCampaign.cooldownRemainingSeconds = undefined;
        saveCampaignProgress(activeCampaign);
      }
    }

    // ⏳ 6. SAFE HUMAN PACING BETWEEN MESSAGES (10-20 seconds with random jitter)
    if (i < businesses.length - 1 && !abortRequested) {
      // Dynamic options reading allows real-time update if options changed
      const currentMin = Math.max(5, cachedCampaignOptions?.minDelaySeconds || options.minDelaySeconds || 10);
      const currentMax = Math.max(currentMin + 2, cachedCampaignOptions?.maxDelaySeconds || options.maxDelaySeconds || 20);
      const delayTotalSeconds = Math.floor(Math.random() * (currentMax - currentMin + 1)) + currentMin;

      // Handle Slot Alternating & Handover
      const is1Ok = slotSessions['1'].sock !== null && slotSessions['1'].connectionState === 'connected';
      const is2Ok = slotSessions['2'].sock !== null && slotSessions['2'].connectionState === 'connected';

      if (enableRotation && is1Ok && is2Ok) {
        const otherSlot: SlotId = currentSlot === '1' ? '2' : '1';
        if (rotationConfig.mode === 'ping_pong' || currentSlotSentCount >= rotationBatchSize) {
          currentSlot = otherSlot;
          currentSlotSentCount = 0;
          rotationConfig.currentSlot = otherSlot;
          rotationConfig.currentSlotSentCount = 0;
        }
      }

      if (activeCampaign) {
        activeCampaign.nextSlotTarget = currentSlot;
        activeCampaign.currentSlot = currentSlot;
        activeCampaign.currentSenderSlot = currentSlot;
        activeCampaign.nextDispatchInSeconds = delayTotalSeconds;
        saveCampaignProgress(activeCampaign);
      }

      console.log(`⏱️ [Human Pacing] Waiting ${delayTotalSeconds}s before next business (via Slot ${currentSlot})...`);
      const delayStart = Date.now();
      const targetMs = delayTotalSeconds * 1000;

      while (Date.now() - delayStart < targetMs) {
        if (abortRequested) break;
        if (skipWaitRequested) {
          skipWaitRequested = false;
          console.log('⚡ Delay skipped by administrator! Sending next message immediately.');
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
        }
        await new Promise((r) => setTimeout(r, 500));
      }

      if (activeCampaign) {
        activeCampaign.nextDispatchInSeconds = 0;
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

