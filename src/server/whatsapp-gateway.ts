import makeWASocketImport, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { Business } from '../types';

const makeWASocket = (makeWASocketImport as any).default || makeWASocketImport;

export type WhatsAppConnectionState = 'disconnected' | 'connecting' | 'qr_ready' | 'connected';

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

  // Handle Egyptian prefixes
  if (digits.startsWith('0020')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('01') && digits.length === 11) {
    digits = '2' + digits;
  } else if (digits.startsWith('1') && digits.length === 10) {
    digits = '20' + digits;
  } else if (!digits.startsWith('20') && digits.length === 10) {
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
      browser: ['Dalelak System', 'Chrome', '1.0.0'],
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
          try {
            if (fs.existsSync(AUTH_DIR)) {
              fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            }
          } catch {}
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
  const directoryUrl = 'https://www.dalilaak.com/';

  if (templateType === 'honorary_invitation') {
    return (
      `السلام عليكم ورحمة الله وبركاته\n` +
      `تحياتنا لإدارة «${venueName}» الكرام (${location})،\n\n` +
      `تشرّف فريق منصة «دليلك» بالتواصل معكم بعد اعتماد منشأتكم ضمن قائمة المعالم التجارية الرائدة بالمنطقة.\n\n` +
      `🌟 نودّ إبلاغكم باعتماد *إدراج شرفي موثق ومجاني بالكامل* لمنشأتكم في دليلنا المعتمد الرسمي — *بدون أي رسوم أو اشتراكات نهائياً*، تقديراً لتميزكم وسمعتكم الطيبة.\n\n` +
      `🔗 *رابط المنصة والدليل المعتمد:*\n` +
      `${directoryUrl}\n\n` +
      `يسعدنا تواجدكم معنا كشريك نجاح متميز.\n` +
      `إدارة منصة دليلك المعتمدة`
    );
  }

  if (templateType === 'directory_live') {
    return (
      `مرحباً بحضراتكم إدارة «${venueName}»،\n\n` +
      `يسعدنا إحاطتكم علماً بأن صفحة منشأتكم المعتمدة منشورة ومتاحة الآن على منصة دليلك بكافة التفاصيل والموقع الدقيق للجمهور.\n\n` +
      `🔗 *رابط المعاينة المباشر لصفحتكم:*\n` +
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
      `🔗 *رابط المنصة الرسمي:*\n` +
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
export async function startWhatsAppBroadcast(
  businesses: Business[],
  options: {
    templateType: string;
    customText?: string;
    minDelaySeconds?: number;
    maxDelaySeconds?: number;
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
  abortRequested = false;

  const minDelay = Math.max(5, options.minDelaySeconds || 12);
  const maxDelay = Math.max(minDelay + 3, options.maxDelaySeconds || 20);

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
  };

  // Launch background worker without blocking HTTP response
  (async () => {
    console.log(`📢 Starting WhatsApp Broadcast Campaign [${campaignId}] for ${businesses.length} businesses...`);

    for (let i = 0; i < businesses.length; i++) {
      if (abortRequested) {
        console.log(`🛑 Broadcast Campaign [${campaignId}] was aborted by administrator.`);
        if (activeCampaign) {
          activeCampaign.status = 'aborted';
          activeCampaign.finishedAt = new Date().toISOString();
        }
        break;
      }

      const biz = businesses[i];
      if (activeCampaign) {
        activeCampaign.current = i + 1;
        activeCampaign.currentBusinessName = biz.nameAr || biz.name;
      }

      const rawPhone = biz.phone || biz.ownerPhone;
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
        }
        continue;
      }

      const messageBody = compileBroadcastMessage(options.templateType, biz, options.customText);

      try {
        await sock!.sendMessage(jid, { text: messageBody });

        if (activeCampaign) {
          activeCampaign.successful++;
          activeCampaign.logs.unshift({
            businessId: biz.id,
            businessName: biz.nameAr || biz.name || 'منشأة',
            phone: rawPhone!,
            status: 'sent',
            timestamp: new Date().toISOString(),
          });
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

      // 🛡️ ANTI-BAN RANDOM JITTER THROTTLING (If not last item and not aborted)
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
      console.log(`🎉 Broadcast Campaign [${campaignId}] completed successfully!`);
    }
  })().catch((err) => {
    console.error('Fatal error in broadcast campaign worker:', err);
    if (activeCampaign) {
      activeCampaign.status = 'aborted';
      activeCampaign.finishedAt = new Date().toISOString();
    }
  });

  return {
    success: true,
    message: `تم بدء حملة الإرسال التلقائي بنجاح (${businesses.length} منشأة) مع تفعيل صمام الأمان ضد الحظر.`,
    campaignId,
  };
}

/**
 * 🛑 Requests Emergency Abort for Running Broadcast
 */
export function abortWhatsAppBroadcast(): { success: boolean; message: string } {
  if (!activeCampaign || activeCampaign.status !== 'running') {
    return { success: false, message: 'لا توجد حملة قيد التشغيل حالياً لإيقافها.' };
  }

  abortRequested = true;
  activeCampaign.status = 'aborted';
  activeCampaign.finishedAt = new Date().toISOString();
  return { success: true, message: 'تم تفعيل زر الطوارئ وإيقاف الحملة فوراً بنجاح.' };
}

