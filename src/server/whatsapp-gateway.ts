import makeWASocketImport, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  Browsers,
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

export interface BroadcastLogItem {
  businessId: string;
  businessName: string;
  phone: string;
  status: 'sent' | 'failed' | 'skipped';
  reason?: string;
  timestamp: string;
}

export interface BroadcastProgress {
  id: string;
  templateType: string;
  total: number;
  current: number;
  successful: number;
  failed: number;
  skipped: number;
  status: 'idle' | 'running' | 'paused' | 'aborted' | 'completed';
  currentBusinessName?: string;
  startedAt: string;
  finishedAt?: string;
  logs: BroadcastLogItem[];
  lastIndex?: number;
}

export interface WhatsAppSessionStatus {
  state: WhatsAppConnectionState;
  qrCodeUrl: string | null;
  connectedUser: { id: string; name?: string; phone: string } | null;
  lastActive: string | null;
  activeCampaign: BroadcastProgress | null;
}

// Persistent Session Directory
const AUTH_DIR = path.resolve(process.cwd(), 'data/baileys_auth_info');
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

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

function recordSentTarget(phone: string, bizId?: string) {
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

// In-Memory Global State
let sock: WASocket | null = null;
let connectionState: WhatsAppConnectionState = 'disconnected';
let qrCodeUrl: string | null = null;
let connectedUser: { id: string; name?: string; phone: string } | null = null;
let lastActive: string | null = null;
let isInitializing = false;
let isExplicitDisconnect = false;

// Active Broadcast State
let activeCampaign: BroadcastProgress | null = null;
let abortRequested = false;

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
export function getWhatsAppSessionStatus(): WhatsAppSessionStatus {
  return {
    state: connectionState,
    qrCodeUrl,
    connectedUser,
    lastActive,
    activeCampaign,
  };
}

/**
 * 🚀 Initializes or Restores WhatsApp Web Connection
 */
export async function initWhatsAppGateway(): Promise<WhatsAppSessionStatus> {
  if (isInitializing || connectionState === 'connected') {
    return getWhatsAppSessionStatus();
  }

  isInitializing = true;
  isExplicitDisconnect = false;
  connectionState = 'connecting';
  qrCodeUrl = null;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

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
    });
    sock = socketInstance;

    socketInstance.ev.on('creds.update', saveCreds);

    socketInstance.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          qrCodeUrl = await qrcode.toDataURL(qr, {
            margin: 2,
            scale: 7,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          connectionState = 'qr_ready';
        } catch (e) {
          console.error('Failed to convert QR to DataURL:', e);
        }
      }

      if (connection === 'open') {
        connectionState = 'connected';
        qrCodeUrl = null;
        lastActive = new Date().toISOString();

        const rawId = sock?.user?.id || '';
        const rawDigits = rawId.split(':')[0].replace(/\D/g, '');
        connectedUser = {
          id: rawId,
          name: sock?.user?.name || 'إدارة منصة دليلك',
          phone: rawDigits.startsWith('20') ? '0' + rawDigits.slice(2) : rawDigits,
        };
        console.log('✅ WhatsApp Gateway Connected Successfully:', connectedUser.phone);
      }

      if (connection === 'close') {
        const error = lastDisconnect?.error as any;
        const statusCode = error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        console.log('ℹ️ WhatsApp connection closed. Status code:', statusCode, 'Logged out:', isLoggedOut);

        if (isLoggedOut || isExplicitDisconnect) {
          connectionState = 'disconnected';
          connectedUser = null;
          qrCodeUrl = null;
          sock = null;
          try {
            if (fs.existsSync(AUTH_DIR)) {
              fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            }
          } catch {}

          // If a campaign was running, pause it instead of losing progress!
          if (activeCampaign && activeCampaign.status === 'running') {
            activeCampaign.status = 'paused';
            console.log('⏸️ Active campaign automatically paused due to session logout. Progress saved for resumption.');
          }

          // Automatically prepare a fresh QR code so the admin can re-pair smoothly
          if (!isExplicitDisconnect) {
            setTimeout(() => {
              initWhatsAppGateway().catch((err) => console.warn('Auto re-init QR notice:', err));
            }, 1500);
          }
        } else {
          connectionState = 'disconnected';
          qrCodeUrl = null;
          // Auto-reconnect after 4 seconds
          setTimeout(() => {
            if (!isExplicitDisconnect) {
              initWhatsAppGateway().catch((err) => console.warn('Auto reconnect notice:', err));
            }
          }, 4000);
        }
      }
    });

    return getWhatsAppSessionStatus();
  } catch (err: any) {
    console.error('Error initializing WhatsApp Gateway:', err);
    connectionState = 'disconnected';
    return getWhatsAppSessionStatus();
  } finally {
    isInitializing = false;
  }
}

/**
 * 🛑 Disconnects and Clears Current WhatsApp Session
 */
export async function disconnectWhatsAppGateway(): Promise<void> {
  isExplicitDisconnect = true;
  connectionState = 'disconnected';
  qrCodeUrl = null;
  connectedUser = null;

  try {
    if (sock) {
      await sock.logout();
    }
  } catch {}

  try {
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
  } catch {}
}

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
// Campaign In-Memory Persistence for Pause & Resume
let cachedCampaignBusinesses: Business[] = [];
let cachedCampaignOptions: {
  templateType: string;
  customText?: string;
  minDelaySeconds?: number;
  maxDelaySeconds?: number;
  skipRecentlyContacted?: boolean;
} | null = null;

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
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    const rawBuf = Buffer.from(await res.arrayBuffer());
    const sharp = await getSharp();
    if (sharp) {
      return await sharp(rawBuf)
        .resize(300, 200, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 80 })
        .toBuffer();
    }
    if (rawBuf.length <= 100 * 1024) return rawBuf;
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
  options: {
    templateType: string;
    customText?: string;
    minDelaySeconds?: number;
    maxDelaySeconds?: number;
    skipRecentlyContacted?: boolean;
  },
  startIndex = 0
) {
  abortRequested = false;
  const minDelay = Math.max(5, options.minDelaySeconds || 12);
  const maxDelay = Math.max(minDelay + 3, options.maxDelaySeconds || 20);

  console.log(`📢 Executing WhatsApp Campaign from index ${startIndex + 1}/${businesses.length}...`);

  for (let i = startIndex; i < businesses.length; i++) {
    if (abortRequested) {
      console.log(`🛑 Broadcast Campaign was aborted by administrator.`);
      if (activeCampaign) {
        activeCampaign.status = 'aborted';
        activeCampaign.finishedAt = new Date().toISOString();
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
      }
      console.log(`[Campaign ${i + 1}/${businesses.length}] Skipped duplicate: ${biz.nameAr} (${rawPhone})`);
      await new Promise((r) => setTimeout(r, 120));
      continue;
    }

    // 🔌 Check socket connectivity and auto-wait if temporarily disconnected
    if (!sock || connectionState !== 'connected') {
      console.warn(`[Campaign] Socket not connected at index ${i + 1}/${businesses.length}, waiting up to 25s for reconnect...`);
      let reconnected = false;
      for (let w = 0; w < 50; w++) {
        if (abortRequested) break;
        await new Promise((r) => setTimeout(r, 500));
        if (sock && connectionState === 'connected') {
          reconnected = true;
          break;
        }
      }
      if (!reconnected) {
        console.warn(`[Campaign] Socket disconnected. Automatically pausing campaign at index ${i + 1}/${businesses.length}. Progress is saved!`);
        if (activeCampaign) {
          activeCampaign.status = 'paused';
          activeCampaign.lastIndex = i;
          activeCampaign.logs.unshift({
            businessId: biz.id,
            businessName: biz.nameAr || biz.name || 'منشأة',
            phone: rawPhone || 'غير متوفر',
            status: 'skipped',
            reason: 'تم تجميد الحملة مؤقتاً بسبب انقطاع الاتصال (يمكن استئنافها بعد إعادة الاتصال) ⏸️',
            timestamp: new Date().toISOString(),
          });
        }
        break;
      }
    }

    // 🔍 3. VERIFY WHATSAPP ACCOUNT REGISTRATION (sock.onWhatsApp)
    try {
      // Micro-pause before query so it doesn't trigger USync anti-scraping
      await new Promise((r) => setTimeout(r, 350));
      const waCheck = await sock!.onWhatsApp(jid);
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
        await sock!.presenceSubscribe?.(jid).catch(() => {});
        await sock!.sendPresenceUpdate?.('composing', jid).catch(() => {});
        // Human typing simulation (between 1800ms and 3000ms)
        const typingDelay = Math.floor(1800 + Math.random() * 1200);
        await new Promise((r) => setTimeout(r, typingDelay));
        await sock!.sendPresenceUpdate?.('paused', jid).catch(() => {});
      } catch (presErr) {
        // Non-blocking
      }

      // Generate embedded JPEG thumbnail for instant preview on all devices
      let thumbBuffer: Buffer | undefined;
      if (photoUrl) {
        thumbBuffer = await getCompressedJpegThumbnail(photoUrl);
      }

      // 🌟 Rich Interactive WhatsApp Business Card Payload
      const messagePayload: any = {
        text: messageBody,
        matchedText: directoryUrl,
        canonicalUrl: directoryUrl,
        title: `${venueName} | منصة دليلك المعتمدة`,
        description: `منصة دليلك المعتمدة • ${location}`,
        contextInfo: {
          externalAdReply: {
            title: `${venueName} | منصة دليلك المعتمدة`,
            body: `منصة دليلك المعتمدة • ${location}`,
            mediaType: 1, // IMAGE
            thumbnail: thumbBuffer,
            thumbnailUrl: photoUrl,
            sourceUrl: directoryUrl,
            renderLargerThumbnail: true,
            showAdAttribution: false,
          },
        },
      };

      if (thumbBuffer) {
        messagePayload.jpegThumbnail = thumbBuffer;
      }

      await sock!.sendMessage(jid, messagePayload);
      recordSentTarget(rawPhone!, biz.id);

      if (activeCampaign) {
        activeCampaign.successful++;
        activeCampaign.logs.unshift({
          businessId: biz.id,
          businessName: biz.nameAr || biz.name || 'منشأة',
          phone: rawPhone!,
          status: 'sent',
          timestamp: new Date().toISOString(),
        });
        // Keep live logs array efficient for polling
        if (activeCampaign.logs.length > 200) {
          activeCampaign.logs = activeCampaign.logs.slice(0, 200);
        }
      }
      console.log(`[Campaign ${i + 1}/${businesses.length}] Sent to ${biz.nameAr} (${rawPhone})`);
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
        });
      }
    }

    // 🛡️ 5. ANTI-BAN RANDOM JITTER THROTTLING (If not last item and not aborted)
    if (i < businesses.length - 1 && !abortRequested) {
      const jitterSeconds = Math.floor(minDelay + Math.random() * (maxDelay - minDelay));
      console.log(`⏳ Anti-Ban pacing: Waiting ${jitterSeconds} seconds before next dispatch...`);

      const sleepChunks = jitterSeconds * 4;
      for (let s = 0; s < sleepChunks; s++) {
        if (abortRequested) break;
        await new Promise((r) => setTimeout(r, 250));
      }
    }
  }

  if (activeCampaign && activeCampaign.status === 'running') {
    activeCampaign.status = 'completed';
    activeCampaign.finishedAt = new Date().toISOString();
    console.log(`🎉 Broadcast Campaign completed successfully!`);
  }
}

/**
 * ⚡ Starts Automated Throttled WhatsApp Broadcast with Anti-Ban Protection
 */
export async function startWhatsAppBroadcast(
  businesses: Business[],
  options: {
    templateType: string;
    customText?: string;
    minDelaySeconds?: number;
    maxDelaySeconds?: number;
    skipRecentlyContacted?: boolean;
  }
): Promise<{ success: boolean; message: string; campaignId?: string }> {
  if (connectionState !== 'connected' || !sock) {
    return {
      success: false,
      message: 'محرك WhatsApp غير متصل حالياً. يرجى مسح رمز الـ QR أولاً وتأكيد الاتصال.',
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
  };

  // Launch background worker
  executeCampaignLoop(businesses, options, 0).catch((err) => {
    console.error('Fatal error in broadcast campaign worker:', err);
    if (activeCampaign) {
      activeCampaign.status = 'aborted';
      activeCampaign.finishedAt = new Date().toISOString();
    }
  });

  return {
    success: true,
    message: `تم بدء حملة الإرسال التلقائي بنجاح (${businesses.length} منشأة) مع تفعيل أعلى معايير الأمان ومحاكاة السلوك البشري.`,
    campaignId,
  };
}

/**
 * ⏯️ Resumes a Paused WhatsApp Broadcast Campaign
 */
export async function resumeWhatsAppBroadcast(): Promise<{ success: boolean; message: string }> {
  if (connectionState !== 'connected' || !sock) {
    return {
      success: false,
      message: 'محرك WhatsApp غير متصل حالياً. يرجى التأكد من مسح الرمز واتصال المحرك أولاً قبل الاستئناف.',
    };
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
      message: 'بيانات الحملة السابقة غير متوفرة في الذاكرة.',
    };
  }

  const resumeIndex = Math.min((activeCampaign.lastIndex ?? -1) + 1, cachedCampaignBusinesses.length);
  if (resumeIndex >= cachedCampaignBusinesses.length) {
    activeCampaign.status = 'completed';
    activeCampaign.finishedAt = new Date().toISOString();
    return {
      success: true,
      message: 'الحملة مكتملة بالفعل.',
    };
  }

  activeCampaign.status = 'running';

  executeCampaignLoop(cachedCampaignBusinesses, cachedCampaignOptions, resumeIndex).catch((err) => {
    console.error('Fatal error in resumed campaign worker:', err);
    if (activeCampaign) {
      activeCampaign.status = 'aborted';
      activeCampaign.finishedAt = new Date().toISOString();
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
  return { success: true, message: 'تم تفعيل زر الطوارئ وإلغاء الحملة فوراً بنجاح.' };
}

