import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  initWhatsAppGateway,
  disconnectWhatsAppGateway,
  getWhatsAppSessionStatus,
  startWhatsAppBroadcast,
  resumeWhatsAppBroadcast,
  abortWhatsAppBroadcast,
  getCampaignProgress,
  clearSavedCampaignProgress,
  getCampaignHistory,
  skipCurrentWaitDelay,
  PRIMARY_WHATSAPP_SENDER_PHONE,
  SlotId,
  slotSessions,
  resetSlotCircuitBreaker,
  switchActiveSlot,
  setRotationMode,
  updateSlotSafetyConfig,
  resetSlotCampaignCount,
  pingSlotConnection,
  compileBroadcastMessage,
  loadOptOutRegistry,
  isOptedOut,
  fixActiveCampaignPacing,
} from './whatsapp-gateway.js';
import {
  getWhatsAppAiConfig,
  saveWhatsAppAiConfig,
  getAllAiConversations,
  getAiAuditLogs,
  muteConversationForHuman,
  unmuteConversation,
  findBusinessByPhone,
  findBusinessById,
  getAiConversationByPhone,
  processIncomingWhatsAppMessage,
} from './whatsapp-ai-agent.js';
import {
  prepareBusinessGiftPackage,
  recordDeliveredGift,
  getDeliveredGifts,
  generateBrandedQrBuffer,
} from './whatsapp-gift-service.js';
import { Business } from '../types.js';

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('[WhatsApp Server] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[WhatsApp Server] Unhandled rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = Number(process.env.WHATSAPP_PORT) || 3005;

app.set('trust proxy', 1);
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// 🛡️ Comprehensive CORS & Private Network Access (PNA) Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const origin = req.headers.origin || '';
  const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  const isVercelOrProd =
    origin === 'https://www.dalilaak.com' ||
    origin === 'https://dalilaak.com' ||
    /https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin) ||
    (process.env.APP_URL && origin === process.env.APP_URL);

  // Allow either recognized origins or local network
  if (isLocalOrigin || isVercelOrProd || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    if (origin) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-session-id, x-user-id, x-user-email, x-user-phone, x-client-version, *'
  );

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    return res.status(204).end();
  }
  next();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📁 Public dashboard directory resolution (supports running from root or dalelak-whatsapp-agent)
const DASHBOARD_DIR_CANDIDATES = [
  path.resolve(process.cwd(), 'dalelak-whatsapp-agent/public'),
  path.resolve(process.cwd(), 'public'),
  path.resolve(__dirname, '../../dalelak-whatsapp-agent/public'),
  path.resolve(__dirname, '../dalelak-whatsapp-agent/public'),
];
const DASHBOARD_DIR = DASHBOARD_DIR_CANDIDATES.find((d) => fs.existsSync(d));
if (DASHBOARD_DIR) {
  app.use(express.static(DASHBOARD_DIR));
}

// 🛡️ Super Admin Auth Helper
const SUPER_ADMIN_EMAILS = ['ahmedhufne@gmail.com', 'admin@dalilak.com'];
const SUPER_ADMIN_PHONES = ['01143888355', '01556221141', PRIMARY_WHATSAPP_SENDER_PHONE];

function isRequestSuperAdmin(req: express.Request): boolean {
  // Allow direct localhost calls without strict token if originating locally on developer machine
  const remoteIp = req.socket?.remoteAddress || '';
  const isLocalClient = remoteIp === '127.0.0.1' || remoteIp === '::1' || remoteIp === '::ffff:127.0.0.1';

  const userEmail = (req.headers['x-user-email'] as string) || (req.body?.userEmail as string) || '';
  const userPhone = (req.headers['x-user-phone'] as string) || (req.body?.userPhone as string) || '';

  if (userEmail && SUPER_ADMIN_EMAILS.includes(userEmail.toLowerCase().trim())) {
    return true;
  }

  if (userPhone) {
    const cleanPhone = userPhone.replace(/\D/g, '');
    for (const superPhone of SUPER_ADMIN_PHONES) {
      if (cleanPhone === superPhone || cleanPhone.endsWith(superPhone.slice(-9))) {
        return true;
      }
    }
  }

  // Allow local machine and private home LAN IPs (e.g. 192.168.x.x) for dashboard viewing
  const isPrivateLan =
    isLocalClient ||
    remoteIp.includes('192.168.') ||
    remoteIp.includes('10.') ||
    remoteIp.includes('172.');

  if (isPrivateLan && (!userEmail && !userPhone)) {
    return true;
  }

  return false;
}

// -----------------------------------------------------------------------------
// Health & Diagnostic Telemetry Endpoints
// -----------------------------------------------------------------------------
app.get(['/', '/health', '/api/health', '/api/whatsapp/health', '/api/admin/whatsapp/health'], (req, res) => {
  const standaloneDashboard = DASHBOARD_DIR ? path.join(DASHBOARD_DIR, 'index.html') : null;
  if (req.path === '/' && req.accepts('html') && standaloneDashboard && fs.existsSync(standaloneDashboard)) {
    return res.sendFile(standaloneDashboard);
  }

  const session = getWhatsAppSessionStatus();
  const campaign = getCampaignProgress();
  const slot1Connected = session.slots['1'].state === 'connected';
  const slot2Connected = session.slots['2'].state === 'connected';
  const isAnyConnected = slot1Connected || slot2Connected;
  const isBothConnected = slot1Connected && slot2Connected;

  return res.json({
    status: 'ok',
    service: 'Dalelak Dedicated WhatsApp Gateway',
    version: '2.1.0 (Standalone Health Telemetry)',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    connectionState: session.state,
    connectedUser: session.connectedUser,
    isAnyConnected,
    isBothConnected,
    slots: session.slots,
    rotationConfig: session.rotationConfig,
    activeCampaign: campaign
      ? {
          id: campaign.id,
          status: campaign.status,
          total: campaign.total,
          current: campaign.current,
          successful: campaign.successful,
          failed: campaign.failed,
          skipped: campaign.skipped,
          slot1SentCount: campaign.slot1SentCount || 0,
          slot2SentCount: campaign.slot2SentCount || 0,
          currentSlot: campaign.currentSlot || '1',
          currentSlotSentCount: campaign.currentSlotSentCount || 0,
          rotationBatchSize: campaign.rotationBatchSize || 15,
          nextSlotTarget: campaign.nextSlotTarget || '1',
          nextDispatchInSeconds: campaign.nextDispatchInSeconds || 0,
          stealthModeActive: Boolean(campaign.stealthModeActive),
        }
      : null,
    memoryUsage: {
      rssMb: Math.round((process.memoryUsage().rss / 1024 / 1024) * 10) / 10,
      heapUsedMb: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 10) / 10,
    },
  });
});

app.get(['/api/whatsapp/heartbeat', '/api/admin/whatsapp/heartbeat'], (_req, res) => {
  const session = getWhatsAppSessionStatus();
  const isAnyConnected =
    session.slots['1'].state === 'connected' || session.slots['2'].state === 'connected';
  return res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    state: session.state,
    isAnyConnected,
    isBothConnected: session.slots['1'].state === 'connected' && session.slots['2'].state === 'connected',
    slotsHealth: {
      '1': session.slots['1'].healthStatus || (session.slots['1'].state === 'connected' ? 'healthy' : 'offline'),
      '2': session.slots['2'].healthStatus || (session.slots['2'].state === 'connected' ? 'healthy' : 'offline'),
    },
  });
});

// -----------------------------------------------------------------------------
// WhatsApp API Endpoints (Supporting both /api/whatsapp/* and legacy /api/admin/whatsapp/*)
// -----------------------------------------------------------------------------

// 1. Session Status & Live Progress
app.get(['/api/whatsapp/status', '/api/admin/whatsapp/status'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح: بوابة واتساب محصورة بالسوبر أدمن حصراً (403 Forbidden)',
      });
    }
    const status = getWhatsAppSessionStatus();
    const savedProgress = getCampaignProgress();
    return res.json({
      success: true,
      status,
      savedProgress,
      serverPort: PORT,
    });
  } catch (err: any) {
    console.error('[WhatsApp Server] Status error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'فشل استعلام حالة واتساب' });
  }
});

// 2. Connect / Request QR Code
app.post(['/api/whatsapp/connect', '/api/admin/whatsapp/connect'], async (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح: بوابة واتساب محصورة بالسوبر أدمن حصراً (403 Forbidden)',
      });
    }
    const slot: SlotId = req.body?.slot === '2' ? '2' : '1';
    const status = await initWhatsAppGateway(slot);
    return res.json({ success: true, status, slot });
  } catch (err: any) {
    console.error('[WhatsApp Server] Connect error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'فشل بدء اتصال بوابة واتساب' });
  }
});

// 3. Disconnect Session
app.post(['/api/whatsapp/disconnect', '/api/admin/whatsapp/disconnect'], async (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح: بوابة واتساب محصورة بالسوبر أدمن حصراً (403 Forbidden)',
      });
    }
    const slot: SlotId | undefined = req.body?.slot ? (req.body.slot === '2' ? '2' : '1') : undefined;
    await disconnectWhatsAppGateway(slot);
    return res.json({
      success: true,
      message: slot
        ? `تم إنهاء جلسة هاتف (${slot}) وحذف اعتماداته بأمان.`
        : 'تم إنهاء جلسات واتساب وحذف ملفات الاعتماد بأمان.',
      slot,
    });
  } catch (err: any) {
    console.error('[WhatsApp Server] Disconnect error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'فشل قطع الاتصال بجلسة واتساب' });
  }
});

const HUB_LAT = 29.9806;
const HUB_LNG = 31.1165;

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function loadBusinessesFromDisk(): Business[] {
  const bizPath = path.resolve(process.cwd(), 'data/server_biz_store.json');
  if (fs.existsSync(bizPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(bizPath, 'utf8'));
      if (Array.isArray(data)) return data;
    } catch {}
  }
  return [];
}

function getBusinessesForSegment(segment: string = 'hadayek_8km'): Business[] {
  const allBiz = loadBusinessesFromDisk();
  if (segment === 'all') return allBiz;

  if (segment === 'hadayek_8km') {
    return allBiz.filter((b) => {
      if (b.lat && b.lng) {
        const dist = calculateDistanceKm(HUB_LAT, HUB_LNG, Number(b.lat), Number(b.lng));
        if (dist <= 8) return true;
      }
      const combinedText = [b.nameAr, b.street, (b as any).address, b.city, b.governorate, b.description].filter(Boolean).join(' ');
      if (
        /حدائق\s*ال[أا]هرام|هضبة\s*ال[أا]هرام|الرماية|البوابة\s*ال[أا]ولى|البوابة\s*الثانية|البوابة\s*الثالثة|البوابة\s*الرابعة/i.test(
          combinedText
        )
      ) {
        return true;
      }
      return false;
    });
  }

  if (segment === 'uncontacted') {
    const history = getCampaignHistory();
    const contactedPhones = new Set<string>();
    for (const item of history) {
      if (Array.isArray(item.logs)) {
        for (const l of item.logs) {
          if (l.status === 'sent' && l.phone) {
            contactedPhones.add(l.phone.replace(/\D/g, ''));
          }
        }
      }
    }
    const currentProg = getCampaignProgress();
    if (currentProg && Array.isArray(currentProg.logs)) {
      for (const l of currentProg.logs) {
        if (l.status === 'sent' && l.phone) contactedPhones.add(l.phone.replace(/\D/g, ''));
      }
    }
    return allBiz.filter((b) => {
      const phoneDigits = (b.phone || b.ownerPhone || '').replace(/\D/g, '');
      return phoneDigits.length >= 8 && !contactedPhones.has(phoneDigits);
    });
  }

  return allBiz;
}

// Target Filters Interface & Evaluation Engine
export interface TargetFilters {
  areaScope?: string;
  subArea?: string;
  packageTier?: string;
  contactStatus?: string;
  category?: string;
  verificationStatus?: string;
  mobileOnly?: boolean;
  excludeOptOut?: boolean;
  searchQuery?: string;
}

export interface FilterTelemetry {
  totalMatched: number;
  eligibleCount: number;
  excludedLandlines: number;
  excludedOptOut: number;
  excludedAlreadyContacted: number;
  sampleBusinesses: Array<{
    id: string;
    nameAr: string;
    category: string;
    phone: string;
    location: string;
    packageName: string;
    packagePrice: number;
    verificationStatus: string;
  }>;
}

export function filterBusinessesByCriteria(filters: TargetFilters = {}): {
  businesses: Business[];
  telemetry: FilterTelemetry;
} {
  const allBiz = loadBusinessesFromDisk();
  const {
    areaScope = 'all',
    subArea = 'all',
    packageTier = 'all',
    contactStatus = 'uncontacted',
    category = 'all',
    verificationStatus = 'all',
    mobileOnly = true,
    excludeOptOut = true,
    searchQuery = '',
  } = filters;

  const contactedPhones = new Set<string>();
  try {
    const history = getCampaignHistory();
    for (const item of history) {
      if (Array.isArray(item.logs)) {
        for (const l of item.logs) {
          if (l.status === 'sent' && l.phone) {
            contactedPhones.add(l.phone.replace(/\D/g, ''));
          }
        }
      }
    }
    const currentProg = getCampaignProgress();
    if (currentProg && Array.isArray(currentProg.logs)) {
      for (const l of currentProg.logs) {
        if (l.status === 'sent' && l.phone) contactedPhones.add(l.phone.replace(/\D/g, ''));
      }
    }
  } catch {}

  const optOutMap = loadOptOutRegistry();

  let excludedLandlines = 0;
  let excludedOptOut = 0;
  let excludedAlreadyContacted = 0;
  let totalMatched = 0;

  const eligibleBusinesses: Business[] = [];

  for (const b of allBiz) {
    // 1. Area Scope Filter
    if (areaScope && areaScope !== 'all') {
      if (areaScope === 'hadayek_8km') {
        let inHda = false;
        if (b.lat && b.lng) {
          const dist = calculateDistanceKm(HUB_LAT, HUB_LNG, Number(b.lat), Number(b.lng));
          if (dist <= 8) inHda = true;
        }
        const combinedText = [b.nameAr, b.street, (b as any).address, b.city, b.governorate, b.description].filter(Boolean).join(' ');
        if (/حدائق\s*ال[أا]هرام|هضبة\s*ال[أا]هرام|الرماية|البوابة\s*ال[أا]ولى|البوابة\s*الثانية|البوابة\s*الثالثة|البوابة\s*الرابعة/i.test(combinedText)) {
          inHda = true;
        }
        if (!inHda) continue;
      } else if (areaScope === 'giza') {
        if (b.governorate !== 'الجيزة') continue;
      } else if (areaScope === 'cairo') {
        if (b.governorate !== 'القاهرة') continue;
      } else if (areaScope === 'alex') {
        if (b.governorate !== 'الإسكندرية') continue;
      } else if (areaScope === 'october') {
        const txt = [b.city, b.street, (b as any).address].join(' ');
        if (!/أكتوبر|اكتوبر/i.test(txt)) continue;
      } else if (areaScope === 'zayed') {
        const txt = [b.city, b.street, (b as any).address].join(' ');
        if (!/زايد/i.test(txt)) continue;
      } else if (areaScope === 'tagamoa') {
        const txt = [b.city, b.street, (b as any).address].join(' ');
        if (!/التجمع|القاهرة الجديدة/i.test(txt)) continue;
      } else if (areaScope === 'nasr_city') {
        const txt = [b.city, b.street, (b as any).address].join(' ');
        if (!/مدينة نصر/i.test(txt)) continue;
      } else if (areaScope === 'dokki') {
        const txt = [b.city, b.street, (b as any).address].join(' ');
        if (!/الدقي|المهندسين/i.test(txt)) continue;
      } else if (areaScope === 'maadi') {
        const txt = [b.city, b.street, (b as any).address].join(' ');
        if (!/المعادي/i.test(txt)) continue;
      }
    }

    // 2. SubArea (Gates / Key streets of Hadayek)
    if (subArea && subArea !== 'all') {
      const txt = [b.street, (b as any).address, b.description].join(' ');
      if (subArea === 'gate_1' && !/خوفو|الأولى|الاولى/i.test(txt)) continue;
      if (subArea === 'gate_2' && !/حورس|الثانية/i.test(txt)) continue;
      if (subArea === 'gate_3' && !/مينا|الثالثة/i.test(txt)) continue;
      if (subArea === 'gate_4' && !/أحمس|احمس|الرابعة/i.test(txt)) continue;
      if (subArea === 'tharwa' && !/الثروة المعدنية/i.test(txt)) continue;
      if (subArea === 'geish' && !/الجيش/i.test(txt)) continue;
    }

    // 3. Package & Registration Status (الحالة التي سجلوا بها)
    if (packageTier && packageTier !== 'all') {
      const pkgName = b.packageName || '';
      const price = Number(b.packagePrice ?? 0);
      const isExempt = Boolean(b.isFeeExempt);
      const isGoogle = Boolean(b.isAlreadyOnGoogle);

      if (packageTier === 'free_honorary') {
        if (!(price === 0 || isExempt || /إدراج مجاني|إدراج شرفي/i.test(pkgName))) continue;
      } else if (packageTier === 'basic_250') {
        if (!(price === 250 || /التوثيق الأساسي/i.test(pkgName))) continue;
      } else if (packageTier === 'smart_setup_750') {
        if (!(price === 750 || /التأسيس والربط/i.test(pkgName))) continue;
      } else if (packageTier === 'on_google') {
        if (!isGoogle && !/Google Maps/i.test(pkgName)) continue;
      } else if (packageTier === 'not_on_google') {
        if (isGoogle || /Google Maps/i.test(pkgName)) continue;
      }
    }

    // 4. Verification Status
    if (verificationStatus && verificationStatus !== 'all') {
      if (b.verificationStatus !== verificationStatus) continue;
    }

    // 5. Category Filter
    if (category && category !== 'all') {
      const catText = [b.category, b.description].join(' ');
      if (category === 'restaurants' && !/مطعم|مشويات|مأكولات|أكلات|وجبات/i.test(catText)) continue;
      if (category === 'cafes' && !/كافيه|مقهى|كوفي/i.test(catText)) continue;
      if (category === 'cars' && !/سيارات|ميكانيكا|عفشه|زيوت|كاوتش|صيانة/i.test(catText)) continue;
      if (category === 'medical' && !/طبيب|عيادة|مركز طبي|أسنان|دكتور/i.test(catText)) continue;
      if (category === 'pharmacies' && !/صيدلية|أدوية/i.test(catText)) continue;
      if (category === 'salons' && !/صالون|حلاقة|كوافير|تجميل/i.test(catText)) continue;
      if (category === 'gym' && !/جيم|لياقة|رياضي|Fitness/i.test(catText)) continue;
      if (category === 'retail' && !/ملابس|أحذية|تجزئة|سوبر ماركت|محل/i.test(catText)) continue;
      if (category === 'computers' && !/كمبيوتر|لابتوب|شبكات|موبايل/i.test(catText)) continue;
      if (category === 'hotels' && !/فندق|شقق فندقية|منتجع/i.test(catText)) continue;
    }

    // 6. Search Query
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const combined = [b.nameAr, b.name, b.phone, b.street, (b as any).address, b.category].filter(Boolean).join(' ').toLowerCase();
      if (!combined.includes(q)) continue;
    }

    totalMatched++;

    // 7. Phone Sanity & WhatsApp Mobile Reachability (صمام حماية الأرقام الأرضية)
    const rawPhone = b.phone || b.ownerPhone || '';
    const cleanDigits = rawPhone.replace(/\D/g, '');
    const isEgyptianMobile = /^(01[0125]|201[0125])\d{8}$/.test(cleanDigits);

    if (mobileOnly && !isEgyptianMobile) {
      excludedLandlines++;
      continue;
    }

    // 8. Opt-Out Registry Check (صمام الأمان ضد الحظر)
    if (excludeOptOut) {
      if (optOutMap[cleanDigits] || optOutMap[rawPhone] || isOptedOut(cleanDigits)) {
        excludedOptOut++;
        continue;
      }
    }

    // 9. Contact Status Check
    const alreadyContacted = contactedPhones.has(cleanDigits);
    if (contactStatus === 'uncontacted' && alreadyContacted) {
      excludedAlreadyContacted++;
      continue;
    }
    if (contactStatus === 'contacted_before' && !alreadyContacted) {
      continue;
    }

    eligibleBusinesses.push(b);
  }

  const sampleBusinesses = eligibleBusinesses.slice(0, 8).map((b) => ({
    id: b.id,
    nameAr: b.nameAr || b.name || 'منشأة تجارية',
    category: b.category || 'عام',
    phone: b.phone || b.ownerPhone || '--',
    location: [b.governorate, b.city].filter(Boolean).join(' - ') || 'مصر',
    packageName: b.packageName || 'إدراج شرفي مجاني',
    packagePrice: Number(b.packagePrice ?? 0),
    verificationStatus: b.verificationStatus || 'verified',
  }));

  return {
    businesses: eligibleBusinesses,
    telemetry: {
      totalMatched,
      eligibleCount: eligibleBusinesses.length,
      excludedLandlines,
      excludedOptOut,
      excludedAlreadyContacted,
      sampleBusinesses,
    },
  };
}

// 4. Target Segments List
app.get(['/api/whatsapp/campaign/segments', '/api/admin/whatsapp/campaign/segments'], (_req, res) => {
  try {
    const allBiz = loadBusinessesFromDisk();
    const hadayekBiz = getBusinessesForSegment('hadayek_8km');
    const uncontactedBiz = getBusinessesForSegment('uncontacted');

    return res.json({
      success: true,
      segments: [
        {
          id: 'hadayek_8km',
          title: 'حدائق الأهرام (نطاق 8 كم الجغرافي)',
          badge: 'موصى به للترويج المحلي 📍',
          count: hadayekBiz.length,
          description: 'الأنشطة الواقعة داخل دائرة نصف قطرها 8 كم من مركز حدائق الأهرام أو المذكورة ضمن النطاق.',
        },
        {
          id: 'uncontacted',
          title: 'المنشآت غير المتواصل معها سابقاً',
          badge: 'أنشطة جديدة 🆕',
          count: uncontactedBiz.length,
          description: 'الأنشطة التي لم يتم إرسال أي دعوة لها حتى الآن لتجنب أي تكرار.',
        },
        {
          id: 'all',
          title: 'جميع المنشآت المسجلة بالدليل',
          badge: 'القاعدة الكاملة 🏢',
          count: allBiz.length,
          description: 'كافة الأنشطة المسجلة في قاعدة بيانات المنصة في مختلف المناطق.',
        },
      ],
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل جلب شرائح الحملات' });
  }
});

// 4a. Live Database Radar & Census Analytics
app.get(['/api/whatsapp/database/radar-analytics', '/api/admin/whatsapp/database/radar-analytics'], (_req, res) => {
  try {
    const allBiz = loadBusinessesFromDisk();
    const optOutMap = loadOptOutRegistry();

    const contactedPhones = new Set<string>();
    try {
      const history = getCampaignHistory();
      for (const item of history) {
        if (Array.isArray(item.logs)) {
          for (const l of item.logs) {
            if (l.status === 'sent' && l.phone) contactedPhones.add(l.phone.replace(/\D/g, ''));
          }
        }
      }
      const currentProg = getCampaignProgress();
      if (currentProg && Array.isArray(currentProg.logs)) {
        for (const l of currentProg.logs) {
          if (l.status === 'sent' && l.phone) contactedPhones.add(l.phone.replace(/\D/g, ''));
        }
      }
    } catch {}

    const govs: Record<string, number> = {};
    const cities: Record<string, number> = {};
    const pkgs: Record<string, number> = {};
    const cats: Record<string, number> = {};
    const verificationMap: Record<string, number> = {};

    let validMobileCount = 0;
    let landlineCount = 0;
    let hadayekRadiusCount = 0;

    for (const b of allBiz) {
      const g = b.governorate || 'أخرى';
      govs[g] = (govs[g] || 0) + 1;

      const c = b.city || 'غير محدد';
      cities[c] = (cities[c] || 0) + 1;

      const pkg = b.packageName || 'إدراج مجاني';
      pkgs[pkg] = (pkgs[pkg] || 0) + 1;

      const cat = b.category || 'عام';
      cats[cat] = (cats[cat] || 0) + 1;

      const vStatus = b.verificationStatus || 'verified';
      verificationMap[vStatus] = (verificationMap[vStatus] || 0) + 1;

      const cleanDigits = (b.phone || b.ownerPhone || '').replace(/\D/g, '');
      if (/^(01[0125]|201[0125])\d{8}$/.test(cleanDigits)) {
        validMobileCount++;
      } else {
        landlineCount++;
      }

      if (b.lat && b.lng) {
        const dist = calculateDistanceKm(HUB_LAT, HUB_LNG, Number(b.lat), Number(b.lng));
        if (dist <= 8) hadayekRadiusCount++;
      }
    }

    const topCities = Object.entries(cities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }));

    const topCategories = Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, count]) => ({ category, count }));

    return res.json({
      success: true,
      census: {
        totalBusinesses: allBiz.length,
        validMobileCount,
        landlineCount,
        optOutCount: Object.keys(optOutMap).length,
        alreadyContactedCount: contactedPhones.size,
        hadayekRadiusCount,
        governoratesBreakdown: govs,
        topCities,
        packagesBreakdown: pkgs,
        verificationBreakdown: verificationMap,
        topCategories,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل توليد رادار قاعدة البيانات' });
  }
});

// 4b. Dynamic Target Filter Radar Query & Simulation
app.post(['/api/whatsapp/campaign/filter-radar', '/api/admin/whatsapp/campaign/filter-radar'], (req, res) => {
  try {
    const filters: TargetFilters = req.body.filters || req.body || {};
    const result = filterBusinessesByCriteria(filters);
    return res.json({
      success: true,
      telemetry: result.telemetry,
      sampleBusinesses: result.telemetry.sampleBusinesses,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل فحص رادار المستهدفين' });
  }
});

// 5. Campaign Detailed Logs (Sent, Skipped, Failed numbers)
app.get(['/api/whatsapp/campaign/logs', '/api/admin/whatsapp/campaign/logs'], (_req, res) => {
  try {
    const campaign = getCampaignProgress();
    const logs = campaign && Array.isArray(campaign.logs) ? campaign.logs : [];

    const sentList = logs.filter((l) => l.status === 'sent');
    const skippedList = logs.filter((l) => l.status === 'skipped');
    const failedList = logs.filter((l) => l.status === 'failed');

    return res.json({
      success: true,
      summary: {
        campaignId: campaign?.id || null,
        status: campaign?.status || 'idle',
        templateType: campaign?.templateType || 'hadayek_invitation',
        total: campaign?.total || 0,
        current: campaign?.current || 0,
        successful: campaign?.successful || sentList.length,
        skipped: campaign?.skipped || skippedList.length,
        failed: campaign?.failed || failedList.length,
        slot1SentCount: campaign?.slot1SentCount || 0,
        slot2SentCount: campaign?.slot2SentCount || 0,
        stealthModeActive: campaign?.stealthModeActive || false,
        nextDispatchInSeconds: campaign?.nextDispatchInSeconds || 0,
        nextSlotTarget: campaign?.nextSlotTarget || '1',
      },
      sentList,
      skippedList,
      failedList,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل قراءة سجلات الحملة' });
  }
});

// 4b. Preview Compiled Spintax Message
app.post(['/api/whatsapp/campaign/preview-template', '/api/admin/whatsapp/campaign/preview-template'], (req, res) => {
  try {
    const { templateType = 'smart_multi_angle', customText = '' } = req.body || {};
    const sampleBiz: Business = {
      id: 'sample-biz',
      name: 'مطعم ومشويات أهل الشام',
      nameAr: 'مطعم ومشويات أهل الشام',
      category: 'مطاعم وكافيهات',
      city: 'حدائق الأهرام',
      governorate: 'الجيزة',
      phone: '01143888355',
      address: 'البوابة الأولى - شارع الثروة المعدنية',
    } as any;

    const compiledText = compileBroadcastMessage(templateType, sampleBiz, customText);
    return res.json({
      success: true,
      compiledText,
      templateType,
      sampleVenue: sampleBiz.nameAr,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل توليد المعاينة' });
  }
});

// 6. Launch Broadcast Campaign
app.post(['/api/whatsapp/broadcast', '/api/admin/whatsapp/broadcast'], async (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح: إطلاق حملات الواتساب الجماعية محصور بالسوبر أدمن حصراً (403 Forbidden)',
      });
    }

    const {
      templateType = 'hadayek_invitation',
      customText = '',
      targetBusinesses = [],
      segment = 'hadayek_8km',
      minDelaySeconds = 10,
      maxDelaySeconds = 20,
      skipRecentlyContacted = true,
      rotationBatchSize = 15,
      enableRotation = true,
      enableStealthRandomMode = false,
      stealthMinMinutes = 0,
      stealthMaxMinutes = 0,
      stealthInitialBurstPerSlot = 15,
    } = req.body;

    let targetList: Business[] = [];
    if (Array.isArray(targetBusinesses) && targetBusinesses.length > 0) {
      targetList = targetBusinesses;
    } else if (req.body.filters && typeof req.body.filters === 'object') {
      const filtered = filterBusinessesByCriteria(req.body.filters);
      targetList = filtered.businesses;
    } else {
      targetList = getBusinessesForSegment(segment);
    }

    if (targetList.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'لم يتم العثور على أي منشآت مستهدفة صالحة للإرسال في الشريحة المحددة.',
      });
    }

    const result = await startWhatsAppBroadcast(targetList, {
      templateType,
      customText,
      minDelaySeconds: Number(minDelaySeconds) || 10,
      maxDelaySeconds: Number(maxDelaySeconds) || 20,
      skipRecentlyContacted: Boolean(skipRecentlyContacted),
      rotationBatchSize: Number(rotationBatchSize) || 15,
      enableRotation: Boolean(enableRotation),
      enableStealthRandomMode: Boolean(enableStealthRandomMode),
      stealthMinMinutes: Number(stealthMinMinutes) || 0,
      stealthMaxMinutes: Number(stealthMaxMinutes) || 0,
      stealthInitialBurstPerSlot: Number(stealthInitialBurstPerSlot) || 15,
    });

    return res.json(result);
  } catch (err: any) {
    console.error('[WhatsApp Server] Broadcast error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'حدث خطأ أثناء محاولة إطلاق حملة الواتساب الجماعية',
    });
  }
});

// 5. Abort Broadcast Campaign
app.post(['/api/whatsapp/broadcast-abort', '/api/admin/whatsapp/broadcast-abort'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح: إيقاف الحملات محصور بالسوبر أدمن حصراً (403 Forbidden)',
      });
    }
    const result = abortWhatsAppBroadcast();
    return res.json(result);
  } catch (err: any) {
    console.error('[WhatsApp Server] Abort error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'فشل إيقاف الحملة' });
  }
});

// 6. Resume Broadcast Campaign
app.post(['/api/whatsapp/broadcast-resume', '/api/admin/whatsapp/broadcast-resume'], async (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح: استئناف الحملات محصور بالسوبر أدمن حصراً (403 Forbidden)',
      });
    }
    const result = await resumeWhatsAppBroadcast();
    return res.json(result);
  } catch (err: any) {
    console.error('[WhatsApp Server] Resume error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'فشل استئناف الحملة' });
  }
});

// 7. Skip Delay (Instant Dispatch Next Message Override)
app.post(['/api/whatsapp/broadcast-skip-delay', '/api/admin/whatsapp/broadcast-skip-delay'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح: تخطي الانتظار محصور بالسوبر أدمن حصراً (403 Forbidden)',
      });
    }
    const result = skipCurrentWaitDelay();
    return res.json(result);
  } catch (err: any) {
    console.error('[WhatsApp Server] Skip delay error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'فشل تخطي فترة الانتظار' });
  }
});

// 7a. Fix Active Campaign Pacing (Instantly restore 10-20s human pacing and unfreeze)
app.post(['/api/whatsapp/campaign/fix-pacing', '/api/admin/whatsapp/campaign/fix-pacing'], (req, res) => {
  try {
    const { minDelay = 10, maxDelay = 20 } = req.body || {};
    const result = fixActiveCampaignPacing(Number(minDelay) || 10, Number(maxDelay) || 20);
    return res.json(result);
  } catch (err: any) {
    console.error('[WhatsApp Server] Fix pacing error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'فشل تحديث وتيرة الإرسال' });
  }
});

// 7.1 Switch Active Dispatch Slot (Manual Override / Handover)
app.post(['/api/whatsapp/rotation/switch', '/api/admin/whatsapp/rotation/switch'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({ success: false, error: 'غير مصرح (403 Forbidden)' });
    }
    const { targetSlot } = req.body || {};
    const updated = switchActiveSlot(targetSlot);
    return res.json({ success: true, rotationConfig: updated });
  } catch (err: any) {
    console.error('[WhatsApp Server] Rotation switch error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'فشل تبديل الخط' });
  }
});

// 7.2 Set Dual-Slot Coordination Pattern & Batch Size
app.post(['/api/whatsapp/rotation/mode', '/api/admin/whatsapp/rotation/mode'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({ success: false, error: 'غير مصرح (403 Forbidden)' });
    }
    const { mode = 'batch_round_robin', batchSize = 15 } = req.body || {};
    const updated = setRotationMode(mode, Number(batchSize) || 15);
    return res.json({ success: true, rotationConfig: updated });
  } catch (err: any) {
    console.error('[WhatsApp Server] Rotation mode error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'فشل تحديث نمط التناغم' });
  }
});

// 7. Full Local Progress & History
app.get(['/api/whatsapp/progress', '/api/admin/whatsapp/progress'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح (403 Forbidden)',
      });
    }
    const campaign = getCampaignProgress();
    const history = getCampaignHistory();
    return res.json({
      success: true,
      campaign,
      history,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل قراءة ملف التقدم' });
  }
});

// 8. Clear / Archive Current Progress File
app.post(['/api/whatsapp/clear-progress', '/api/admin/whatsapp/clear-progress', '/api/whatsapp/campaign/clear-progress'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح (403 Forbidden)',
      });
    }
    clearSavedCampaignProgress();
    return res.json({
      success: true,
      message: 'تم تصفير وأرشفة ملف تقدم الحملة بنجاح.',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل تصفير ملف التقدم' });
  }
});

// 8.1 Reset Specific Slot Campaign Counter (to start fresh from 0)
app.post(['/api/whatsapp/slot/reset-counter', '/api/admin/whatsapp/slot/reset-counter'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({ success: false, error: 'غير مصرح (403 Forbidden)' });
    }
    const { slotId = '1' } = req.body || {};
    const updated = resetSlotCampaignCount(slotId);
    return res.json({
      success: true,
      message: `تم تصفير عداد إرسال هاتف (${slotId}) بنجاح.`,
      campaign: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل تصفير عداد الهاتف' });
  }
});

// 8.2 Update Slot Safety & Speed Settings (Hourly Cap, Delays, Batch Size)
app.post(['/api/whatsapp/slot/settings', '/api/admin/whatsapp/slot/settings'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({ success: false, error: 'غير مصرح (403 Forbidden)' });
    }
    const {
      slotId = '1',
      hourlyCap,
      minDelaySeconds,
      maxDelaySeconds,
      batchSize,
      cooldownFrequency,
      cooldownDurationMinutes,
    } = req.body || {};

    const updated = updateSlotSafetyConfig(slotId, {
      hourlyCap: hourlyCap ? Number(hourlyCap) : undefined,
      minDelaySeconds: minDelaySeconds ? Number(minDelaySeconds) : undefined,
      maxDelaySeconds: maxDelaySeconds ? Number(maxDelaySeconds) : undefined,
      batchSize: batchSize ? Number(batchSize) : undefined,
      cooldownFrequency: cooldownFrequency ? Number(cooldownFrequency) : undefined,
      cooldownDurationMinutes: cooldownDurationMinutes ? Number(cooldownDurationMinutes) : undefined,
    });

    return res.json({
      success: true,
      message: `تم حفظ وتطبيق إعدادات السرعة والأمان لهاتف (${slotId}) بنجاح!`,
      ...updated,
    });
  } catch (err: any) {
    console.error('[WhatsApp Server] Slot settings update error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'فشل حفظ إعدادات الخط' });
  }
});

// 8.3 Ping Line Socket & Measure Live Latency
app.post(['/api/whatsapp/slot/ping', '/api/admin/whatsapp/slot/ping', '/api/whatsapp/ping'], async (req, res) => {
  try {
    const { slotId = '1' } = req.body || {};
    const result = await pingSlotConnection(slotId);
    return res.json({
      slotId,
      ...result,
      message: result.success
        ? `الخط متصل ومستقر بنبض ممتاز (${result.latencyMs}ms)`
        : 'الخط غير متصل حالياً أو بمرحلة التهيئة',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل فحص نبض الخط' });
  }
});

// 8.3 Send Direct Message from specific Slot (used for Autonomous Testing & Persona Simulation)
app.post(['/api/whatsapp/slot/send-direct', '/api/admin/whatsapp/slot/send-direct'], async (req, res) => {
  try {
    const { fromSlot = '2', toPhone = '01556221141', message = '', simulateTyping = true } = req.body || {};
    const session = slotSessions[fromSlot as SlotId];
    if (!session || !session.sock || session.connectionState !== 'connected') {
      return res.status(400).json({ success: false, error: `الخط (${fromSlot}) غير متصل حالياً` });
    }
    const cleanPhone = String(toPhone || '').replace(/\D/g, '');
    const targetJid = cleanPhone.includes('@')
      ? cleanPhone
      : (cleanPhone.startsWith('20') || cleanPhone.length > 11 ? `${cleanPhone}@s.whatsapp.net` : `20${cleanPhone.replace(/^0+/, '')}@s.whatsapp.net`);

    if (simulateTyping && session.sock.sendPresenceUpdate) {
      try {
        await session.sock.sendPresenceUpdate('composing', targetJid);
        const typingDurationMs = Math.min(10000, Math.max(4000, message.length * 75));
        await new Promise(r => setTimeout(r, typingDurationMs));
        await session.sock.sendPresenceUpdate('paused', targetJid);
      } catch {}
    }

    const sent = await session.sock.sendMessage(targetJid, { text: message });
    return res.json({
      success: true,
      messageId: sent?.key?.id,
      fromSlot,
      targetJid,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل إرسال الرسالة من الخط' });
  }
});


// 8.4 Circuit Breaker Reset
app.post(['/api/whatsapp/circuit-breaker/reset', '/api/admin/whatsapp/circuit-breaker/reset'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({ success: false, error: 'غير مصرح (403 Forbidden)' });
    }
    const { slot = '1', slotId } = req.body || {};
    const targetSlot: SlotId = slotId || slot || '1';
    resetSlotCircuitBreaker(targetSlot);
    return res.json({
      success: true,
      message: `تم فك قاطع الحظر وإعادة ضبط عدادات هاتف (${targetSlot}) بنجاح.`,
      slotId: targetSlot,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل إعادة ضبط قاطع الحظر' });
  }
});

// -----------------------------------------------------------------------------
// AI Agent & Safety Radar Endpoints
// -----------------------------------------------------------------------------

function maskGrokKey(key?: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '********';
  return `${trimmed.substring(0, 6)}••••${trimmed.slice(-4)}`;
}

// 9. Get AI Agent Configuration
app.get(['/api/whatsapp/ai/config', '/api/admin/whatsapp/ai/config'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({ success: false, error: 'غير مصرح (403 Forbidden)' });
    }
    const config = getWhatsAppAiConfig();
    const keys = Array.isArray(config.apiKeys) && config.apiKeys.length > 0 ? config.apiKeys : (config.apiKey ? [config.apiKey] : []);
    const maskedApiKeys = [0, 1, 2].map((idx) => maskGrokKey(keys[idx] || ''));

    return res.json({
      success: true,
      config: {
        ...config,
        maskedApiKey: maskGrokKey(config.apiKey),
        maskedApiKeys,
        hasApiKey: keys.length > 0,
        apiKeysCount: keys.length,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل جلب إعدادات الذكاء الاصطناعي' });
  }
});

// 10. Update AI Agent Configuration (Supporting 3 Grok Keys)
app.post(['/api/whatsapp/ai/config', '/api/admin/whatsapp/ai/config'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({ success: false, error: 'غير مصرح (403 Forbidden)' });
    }
    const incoming = req.body || {};
    const updates: any = {};

    let candidateKeys: string[] = [];
    if (Array.isArray(incoming.apiKeys)) {
      candidateKeys = incoming.apiKeys.map((k: any) => String(k || '').trim());
    } else if (incoming.apiKey1 !== undefined || incoming.apiKey2 !== undefined || incoming.apiKey3 !== undefined) {
      candidateKeys = [
        String(incoming.apiKey1 || '').trim(),
        String(incoming.apiKey2 || '').trim(),
        String(incoming.apiKey3 || '').trim(),
      ];
    } else if (typeof incoming.apiKey === 'string') {
      candidateKeys = [incoming.apiKey.trim()];
    }

    if (candidateKeys.length > 0) {
      updates.apiKeys = candidateKeys;
      if (candidateKeys[0]) updates.apiKey = candidateKeys[0];
    }

    if (typeof incoming.model === 'string') updates.model = incoming.model.trim();
    if (typeof incoming.enabled === 'boolean') updates.enabled = incoming.enabled;
    if (typeof incoming.tone === 'string') updates.tone = incoming.tone;
    if (typeof incoming.autoGiftEnabled === 'boolean') updates.autoGiftEnabled = incoming.autoGiftEnabled;
    if (typeof incoming.autoUpdateBusinessEnabled === 'boolean') updates.autoUpdateBusinessEnabled = incoming.autoUpdateBusinessEnabled;
    if (typeof incoming.autoRepLeadEnabled === 'boolean') updates.autoRepLeadEnabled = incoming.autoRepLeadEnabled;
    if (typeof incoming.typingSimulationEnabled === 'boolean') updates.typingSimulationEnabled = incoming.typingSimulationEnabled;

    const saved = saveWhatsAppAiConfig(updates);
    const savedKeys = Array.isArray(saved.apiKeys) ? saved.apiKeys : [saved.apiKey].filter(Boolean);

    return res.json({
      success: true,
      message: 'تم حفظ وتفعيل إعدادات Grok AI بنجاح.',
      config: {
        ...saved,
        maskedApiKey: maskGrokKey(saved.apiKey),
        maskedApiKeys: [0, 1, 2].map((idx) => maskGrokKey(savedKeys[idx] || '')),
        hasApiKey: savedKeys.length > 0,
        apiKeysCount: savedKeys.length,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل حفظ إعدادات الذكاء الاصطناعي' });
  }
});

// 11. Conversation Thread Detail for Specific Phone
app.get(['/api/whatsapp/ai/conversation-thread', '/api/admin/whatsapp/ai/conversation-thread'], (req, res) => {
  try {
    const rawPhone = String(req.query.phone || '').trim();
    if (!rawPhone) {
      return res.status(400).json({ success: false, error: 'رقم الهاتف مطلوب.' });
    }
    const cleanDigits = rawPhone.replace(/\D/g, '');
    const thread = getAiConversationByPhone(cleanDigits);
    const biz = findBusinessByPhone(cleanDigits);

    return res.json({
      success: true,
      phone: cleanDigits,
      business: biz || null,
      thread: thread || {
        phone: cleanDigits,
        businessName: biz?.nameAr || biz?.name || 'منشأة',
        messages: [],
        isMutedByHuman: false,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل جلب تفاصيل المحادثة' });
  }
});

// 12. Live AI Sandbox / Simulation Endpoint
app.post(['/api/whatsapp/ai/simulate', '/api/admin/whatsapp/ai/simulate'], async (req, res) => {
  const startTime = Date.now();
  try {
    const { message, phone = '01143888355', slotId = '1' } = req.body || {};
    const incomingText = String(message || '').trim();
    if (!incomingText) {
      return res.status(400).json({ success: false, error: 'نص رسالة الاختبار مطلوب.' });
    }

    const cleanPhone = String(phone).replace(/\D/g, '') || '01143888355';
    let capturedReply = '';
    let capturedMedia: any = null;

    const mockSock = {
      sendPresenceUpdate: async () => {},
      presenceSubscribe: async () => {},
      readMessages: async () => {},
      sendMessage: async (_jid: string, content: any) => {
        if (content.text) capturedReply = content.text;
        if (content.image) capturedMedia = { caption: content.caption };
        return { key: { id: `sim_${Date.now()}` } };
      },
    };

    const result = await processIncomingWhatsAppMessage({
      rawPhone: cleanPhone,
      incomingText,
      slotId,
      senderSock: mockSock,
      isSimulation: true,
    });

    const config = getWhatsAppAiConfig();
    const latencyMs = Date.now() - startTime;

    return res.json({
      success: true,
      simulation: true,
      incomingText,
      replyText: result.replyText || capturedReply || 'لا يوجد رد مولد',
      actionExecuted: result.actionExecuted || 'none',
      detectedIntent: result.detectedIntent || 'general_inquiry',
      modelUsed: config.model,
      latencyMs,
      hasMedia: Boolean(capturedMedia),
      mediaCaption: capturedMedia?.caption,
    });
  } catch (err: any) {
    console.error('[AI Simulate] Error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'فشلت محاكاة رد الذكاء الاصطناعي' });
  }
});

// 11. Live AI Conversation Feed
app.get(['/api/whatsapp/ai/conversations', '/api/admin/whatsapp/ai/conversations'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({ success: false, error: 'غير مصرح (403 Forbidden)' });
    }
    const conversations = getAllAiConversations();
    return res.json({ success: true, conversations });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل جلب المحادثات' });
  }
});

// 12. Live AI Audit Logs
app.get(['/api/whatsapp/ai/audit', '/api/admin/whatsapp/ai/audit'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({ success: false, error: 'غير مصرح (403 Forbidden)' });
    }
    const logs = getAiAuditLogs();
    return res.json({ success: true, logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل جلب سجل التدقيق' });
  }
});

// 13. Mute / Unmute Single Conversation (Human Takeover Toggle)
app.post(['/api/whatsapp/ai/toggle-conversation', '/api/admin/whatsapp/ai/toggle-conversation'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({ success: false, error: 'غير مصرح (403 Forbidden)' });
    }
    const { phone, action } = req.body || {};
    if (!phone) {
      return res.status(400).json({ success: false, error: 'رقم الهاتف مطلوب.' });
    }
    const cleanPhone = String(phone).replace(/\D/g, '');
    if (action === 'unmute') {
      unmuteConversation(cleanPhone);
      return res.json({ success: true, message: `تم تفعيل الرد الآلي للرقم ${cleanPhone}` });
    } else {
      muteConversationForHuman(cleanPhone, 1440);
      return res.json({ success: true, message: `تم كتم الروبوت وتحويل المحادثة للتدخل البشري للرقم ${cleanPhone}` });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل تبديل حالة المحادثة' });
  }
});

// 14. Emergency Kill Switch for AI Auto-replies
app.post(['/api/whatsapp/ai/kill-switch', '/api/admin/whatsapp/ai/kill-switch'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({ success: false, error: 'غير مصرح (403 Forbidden)' });
    }
    const { enabled } = req.body || {};
    const updated = saveWhatsAppAiConfig({ enabled: Boolean(enabled) });
    return res.json({
      success: true,
      enabled: updated.enabled,
      message: updated.enabled ? 'تم تفعيل وكيل الذكاء الاصطناعي بنجاح' : 'تم تفعيل زر الطوارئ وإيقاف كافة ردود الذكاء الاصطناعي',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل تعديل حالة الطوارئ' });
  }
});

// 15. Manual Send Gift & QR Package to a Business
app.post(['/api/whatsapp/gift/send-manual', '/api/admin/whatsapp/gift/send-manual'], async (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({ success: false, error: 'غير مصرح (403 Forbidden)' });
    }
    const { businessId, phone, slotId = '1' } = req.body || {};
    const targetPhone = phone || '';
    const cleanPhone = targetPhone.replace(/\D/g, '');

    const biz = businessId ? (findBusinessById(businessId) || findBusinessByPhone(targetPhone)) : findBusinessByPhone(targetPhone);
    if (!biz) {
      return res.status(404).json({ success: false, error: 'لم يتم العثور على المنشأة المطلوبة.' });
    }

    const session = slotSessions[slotId] || slotSessions['1'];
    if (!session || !session.sock || session.connectionState !== 'connected') {
      return res.status(400).json({ success: false, error: 'هاتف الإرسال المحدد غير متصل حالياً.' });
    }

    const giftPkg = await prepareBusinessGiftPackage(biz);
    const targetJid = (cleanPhone.startsWith('20') || cleanPhone.length > 11) ? `${cleanPhone}@s.whatsapp.net` : `20${cleanPhone.replace(/^0+/, '')}@s.whatsapp.net`;
    const itemsToSend = giftPkg.bundle && giftPkg.bundle.length > 0
      ? giftPkg.bundle
      : [{ buffer: giftPkg.buffer, caption: giftPkg.caption, title: 'ملصق الـ QR' }];

    for (let i = 0; i < itemsToSend.length; i++) {
      await session.sock.sendMessage(targetJid, {
        image: itemsToSend[i].buffer,
        caption: itemsToSend[i].caption,
      });
      if (i < itemsToSend.length - 1) {
        await new Promise(res => setTimeout(res, 2000));
      }
    }

    recordDeliveredGift({
      businessId: biz.id,
      businessName: biz.nameAr || biz.name || 'منشأة',
      phone: cleanPhone,
      deliveredAt: new Date().toISOString(),
      source: giftPkg.source,
      targetUrl: giftPkg.targetUrl,
    });

    return res.json({
      success: true,
      message: `تم إرسال باقة ملصقات الـ QR والهدية (${itemsToSend.length} ملصقات فاخرة) بنجاح إلى ${biz.nameAr} (${cleanPhone})!`,
      source: giftPkg.source,
      count: itemsToSend.length,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل إرسال كارت الهدية' });
  }
});

// 15b. Upload & Assign Companion App Design (from QR Booster / Poster Studio)
app.post(
  ['/api/whatsapp/gift/upload-companion-design', '/api/admin/whatsapp/gift/upload-companion-design'],
  async (req, res) => {
    try {
      const { businessId, imageBase64, designDataUrl, image, format = 'png', autoSend = false, phone, slotId = '1' } = req.body || {};
      const rawImage = imageBase64 || designDataUrl || image;
      if (!businessId || !rawImage) {
        return res.status(400).json({ success: false, error: 'businessId والصورة (imageBase64 أو designDataUrl) مطلوبان.' });
      }

      // Clean base64 string
      const base64Data = rawImage.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const designsDir = path.resolve(process.cwd(), 'data/generated_designs');
      if (!fs.existsSync(designsDir)) {
        fs.mkdirSync(designsDir, { recursive: true });
      }

      const filePath = path.join(designsDir, `${businessId}.${format === 'jpg' || format === 'jpeg' ? 'jpg' : 'png'}`);
      fs.writeFileSync(filePath, buffer);

      // Register in business_gifts_registry.json
      const registryPath = path.resolve(process.cwd(), 'data/business_gifts_registry.json');
      let registry: Record<string, any> = {};
      if (fs.existsSync(registryPath)) {
        try {
          registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
        } catch {}
      }
      registry[businessId] = {
        businessId,
        filePath,
        uploadedAt: new Date().toISOString(),
        source: 'qr_booster',
      };
      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');

      console.log(`🎁 [Gift Service] Saved companion design for business (${businessId}) to ${filePath}`);

      // Optional immediate send
      if (autoSend && phone) {
        const cleanPhone = String(phone).replace(/\D/g, '');
        const session = slotSessions[slotId] || slotSessions['1'];
        if (session && session.sock && session.connectionState === 'connected') {
          const targetJid = cleanPhone.startsWith('20')
            ? `${cleanPhone}@s.whatsapp.net`
            : `20${cleanPhone.replace(/^0+/, '')}@s.whatsapp.net`;

          const biz = findBusinessById(businessId) || findBusinessByPhone(cleanPhone) || {
            id: businessId,
            nameAr: 'منشأتكم الكريمة',
            phone: cleanPhone,
          };
          const giftPkg = await prepareBusinessGiftPackage(biz as any);

          await session.sock.sendMessage(targetJid, {
            image: buffer,
            caption: giftPkg.caption,
          });

          recordDeliveredGift({
            businessId,
            businessName: (biz as any).nameAr || (biz as any).name || 'منشأة',
            phone: cleanPhone,
            deliveredAt: new Date().toISOString(),
            source: 'external_app',
            targetUrl: giftPkg.targetUrl,
          });

          return res.json({
            success: true,
            message: `تم حفظ التصميم وإرساله بنجاح لصاحب المنشأة (${cleanPhone})!`,
            filePath,
            sent: true,
          });
        }
      }

      return res.json({
        success: true,
        message: 'تم حفظ واعتماد التصميم في خزانة الهدايا بنجاح.',
        filePath,
        sent: false,
      });
    } catch (err: any) {
      console.error('[Upload Gift Error]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'فشل حفظ التصميم' });
    }
  }
);

// 16. Delivered Gifts History
app.get(['/api/whatsapp/gift/history', '/api/admin/whatsapp/gift/history', '/api/whatsapp/gift/delivered'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({ success: false, error: 'غير مصرح (403 Forbidden)' });
    }
    const history = getDeliveredGifts();
    return res.json({ success: true, history, deliveredGifts: history });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل جلب سجل الهدايا' });
  }
});

// 16b. Preview Branded QR Image Buffer
app.get(['/api/whatsapp/gift/preview-qr', '/api/admin/whatsapp/gift/preview-qr'], async (req, res) => {
  const { url = 'https://www.dalilaak.com', name = 'دليلك' } = req.query;
  try {
    const buffer = await generateBrandedQrBuffer(String(url), String(name));
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(buffer);
  } catch (err: any) {
    return res.status(500).send('فشل توليد كود الـ QR');
  }
});

// 17. Reset Slot Circuit Breaker
app.post(['/api/whatsapp/safety/reset-breaker', '/api/admin/whatsapp/safety/reset-breaker'], (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({ success: false, error: 'غير مصرح (403 Forbidden)' });
    }
    const { slotId } = req.body || {};
    if (slotId) {
      resetSlotCircuitBreaker(slotId);
      return res.json({ success: true, message: `تم تصفير قاطع الدائرة للهاتف (${slotId}) بنجاح.` });
    }
    return res.status(400).json({ success: false, error: 'رقم الشريحة مطلوب.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'فشل تصفير قاطع الدائرة' });
  }
});

// -----------------------------------------------------------------------------
// Start Standalone Server
// -----------------------------------------------------------------------------
function startListening(targetPort: number) {
  const server = app.listen(targetPort, '0.0.0.0', () => {
    console.log('');
    console.log('====================================================================');
    console.log(` 🚀 [Dalelak] Standalone WhatsApp Service Running on Port ${targetPort}`);
    console.log(` 🔗 Local URL: http://localhost:${targetPort}`);
    console.log(` 🛡️ Dedicated Baileys Engine & Local Disk Persistence Enabled`);
    console.log('====================================================================');
    console.log('');

    // Check & report saved progress on disk
    const saved = getCampaignProgress();
    if (saved) {
      console.log(` 📂 [Local Store] Detected saved campaign progress on disk:`);
      console.log(`    - ID: ${saved.id} (${saved.templateType})`);
      console.log(`    - Status: ${saved.status}`);
      console.log(`    - Progress: ${saved.successful} sent / ${saved.skipped} skipped / ${saved.failed} failed of ${saved.total}`);
      console.log(`    - Last Index: ${saved.lastIndex ?? 0}`);
    }

    // Auto-restore WhatsApp sessions if saved credentials exist for Slot 1 or Slot 2
    try {
      const slot1Creds = path.resolve(process.cwd(), 'data/baileys_auth_info_1/creds.json');
      const legacyCreds = path.resolve(process.cwd(), 'data/baileys_auth_info/creds.json');
      const slot2Creds = path.resolve(process.cwd(), 'data/baileys_auth_info_2/creds.json');

      let restoredAny = false;
      if (fs.existsSync(slot1Creds) || fs.existsSync(legacyCreds)) {
        console.log(' 📱 [WhatsApp Gateway] Detected Slot 1 credentials. Auto-restoring in background...');
        initWhatsAppGateway('1').catch((err) => {
          console.warn(' 📱 [WhatsApp Gateway] Slot 1 auto-restore notice:', err?.message);
        });
        restoredAny = true;
      }
      if (fs.existsSync(slot2Creds)) {
        console.log(' 📱 [WhatsApp Gateway] Detected Slot 2 credentials. Auto-restoring in background...');
        initWhatsAppGateway('2').catch((err) => {
          console.warn(' 📱 [WhatsApp Gateway] Slot 2 auto-restore notice:', err?.message);
        });
        restoredAny = true;
      }

      if (!restoredAny) {
        console.log(' ℹ️ [WhatsApp Gateway] No saved credentials found. Ready to scan QR code from dashboard.');
      }
    } catch {}
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[WhatsApp Server] Port ${targetPort} is already in use. Trying port ${targetPort + 1}...`);
      startListening(targetPort + 1);
    } else {
      console.error('[WhatsApp Server] Failed to start:', err);
    }
  });
}

// Fallback for dashboard SPA navigation
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  const standaloneDashboard = DASHBOARD_DIR ? path.join(DASHBOARD_DIR, 'index.html') : null;
  if (standaloneDashboard && fs.existsSync(standaloneDashboard)) {
    return res.sendFile(standaloneDashboard);
  }
  return res.status(404).json({ error: 'Endpoint not found' });
});

startListening(PORT);
