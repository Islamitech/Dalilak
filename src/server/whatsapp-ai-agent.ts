import fs from 'fs';
import path from 'path';
import { Business, AdminFollowUpNote, AdminFollowUpCategory, InterestedLead } from '../types.js';
import { getDisplayDirectoryUrl } from '../utils/directoryUrl.js';
import { prepareBusinessGiftPackage, recordDeliveredGift, getDeliveredGifts, DeliveredGiftRecord } from './whatsapp-gift-service.js';

export interface WhatsAppAiConfig {
  apiKey: string; // Primary key (backward compatible)
  apiKeys?: string[]; // Multiple Grok keys: [key1, key2, key3]
  activeKeyIndex?: number;
  model: string;
  enabled: boolean;
  tone: 'egyptian_warm' | 'formal_official' | 'marketing_promotional';
  autoGiftEnabled: boolean;
  autoUpdateBusinessEnabled: boolean;
  autoRepLeadEnabled: boolean;
  typingSimulationEnabled: boolean;
  humanTakeoverCooldownMinutes: number;
}

export interface AiConversationMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: string;
  toolCallId?: string;
  name?: string;
}

export interface AiConversationThread {
  phone: string;
  businessId?: string;
  businessName?: string;
  isMutedByHuman?: boolean;
  mutedUntil?: string | null;
  lastIncomingAt?: string;
  lastReplyAt?: string;
  lastActionExecuted?: string;
  lastDetectedIntent?: string;
  messages: AiConversationMessage[];
}

export interface AiAuditLogItem {
  id: string;
  timestamp: string;
  senderPhone: string;
  businessId?: string;
  businessName?: string;
  incomingText: string;
  detectedIntent: string;
  aiReply: string;
  actionExecuted: string;
  actionDetails?: any;
  slotId?: string;
}

const CONFIG_PATH = path.resolve(process.cwd(), 'data/whatsapp_ai_config.json');
const CONVERSATIONS_PATH = path.resolve(process.cwd(), 'data/whatsapp_ai_conversations.json');
const AUDIT_LOG_PATH = path.resolve(process.cwd(), 'data/whatsapp_ai_audit_log.json');
const BIZ_STORE_PATH = path.resolve(process.cwd(), 'data/server_biz_store.json');
const LEADS_STORE_PATH = path.resolve(process.cwd(), 'data/server_leads_store.json');
const TRAINING_CONFIG_PATH_1 = path.resolve(process.cwd(), 'data/dalelak_packages_and_rules.json');
const TRAINING_CONFIG_PATH_2 = 'C:\\Users\\Ahmed\\Desktop\\ملف_تدريب_وباقات_دليلك.json';
const TRAINING_CONFIG_PATH_3 = 'C:\\Users\\Ahmed\\Desktop\\pc\\dalelak_ai_training_inputs.json';
const OPT_OUT_REGISTRY_PATH = path.resolve(process.cwd(), 'data/whatsapp_opt_out_registry.json');

function saveOptOut(phone: string, reason: string): void {
  try {
    const cleanPhone = phone.replace(/\D/g, '');
    let reg: Record<string, any> = {};
    if (fs.existsSync(OPT_OUT_REGISTRY_PATH)) {
      try {
        reg = JSON.parse(fs.readFileSync(OPT_OUT_REGISTRY_PATH, 'utf-8'));
      } catch {}
    }
    reg[cleanPhone] = { phone: cleanPhone, reason, optedOutAt: new Date().toISOString() };
    fs.writeFileSync(OPT_OUT_REGISTRY_PATH, JSON.stringify(reg, null, 2), 'utf-8');
    console.log(`🛑 [Opt-Out Registry] Added ${cleanPhone} to permanent do-not-contact list.`);
  } catch (err) {
    console.warn('Error saving opt-out:', err);
  }
}

export interface DalelakPackageItem {
  id: string;
  name_ar: string;
  price_egp: number | string;
  billing_cycle?: string;
  payment_method?: string;
  is_active?: boolean;
  deliverables?: string[];
  target_audience?: string;
  how_to_pitch?: string;
  keywords_trigger?: string[];
}

export interface DalelakTrainingConfig {
  meta?: any;
  business_identity?: {
    platform_name?: string;
    agent_role?: string;
    official_phone?: string;
    official_website?: string;
    currency?: string;
    about_summary?: string;
  };
  packages: DalelakPackageItem[];
  rules_and_policies?: {
    free_services?: string[];
    payment_rules?: {
      accepted_methods?: string[];
      strictly_prohibited?: string[];
      pricing_transparency_note?: string;
    };
    delivery_policy?: {
      timeline?: string;
      procedure?: string;
    };
    greeting_guard?: { rule?: string };
    objection_guard?: { rule?: string };
  };
  custom_faqs_and_scenarios?: Array<{
    topic: string;
    question_patterns: string[];
    approved_answer: string;
  }>;
  objection_handling_scripts?: Array<{
    objection: string;
    script: string;
  }>;
}

let cachedTrainingConfig: DalelakTrainingConfig | null = null;
let lastTrainingConfigMtime = 0;

function normalizeTrainingConfig(rawConfig: any): DalelakTrainingConfig {
  if (Array.isArray(rawConfig?.packages)) {
    return rawConfig as DalelakTrainingConfig;
  }
  const packages: DalelakPackageItem[] = [];

  // 1. Free Tier
  if (rawConfig?.free_tier) {
    const ft = rawConfig.free_tier;
    packages.push({
      id: ft.package_id || 'pkg_exempt',
      name_ar: ft.name || 'باقة الإدراج والهدية الترويجية المجانية',
      price_egp: ft.price_egp ?? 0,
      payment_method: 'مجانية بالكامل (0.00 ج)',
      is_active: true,
      deliverables: Array.isArray(ft.features) ? ft.features : ['توثيق المنشأة بالدليل', '4 تصاميم QR رقمية', 'ربط تقييمات خرائط Google']
    });
  }

  // 2. Physical Merchandise (Acrylic Stands)
  if (rawConfig?.physical_merchandise) {
    const pm = rawConfig.physical_merchandise;
    if (pm.acrylic_stand_single) {
      packages.push({
        id: 'acrylic_stand_single',
        name_ar: pm.acrylic_stand_single.name || 'استاند الطاولات الأكريليكي الفاخر',
        price_egp: pm.acrylic_stand_single.price_egp ?? 100,
        payment_method: 'نقداً عند الاستلام فقط (COD) مع المندوب عند التسليم في مقر النشاط',
        is_active: true,
        deliverables: [
          pm.acrylic_stand_single.specs || 'استاند أكريليك كريستال شفاف مقاس A5 مقاوم للحرارة والكسر + طباعة حرارية 300 DPI',
          'شحن وتوصيل للمقر مع المندوب',
          'معاينة الجودة قبل السداد'
        ],
        how_to_pitch: 'إذا طلب العميل طباعة البوستر أو كتب (اطبعلي) أو طلب استاند، أكد له أن تكلفتها 100 جنيه فقط شاملة الاستاند الأكريليكي والطباعة والتوصيل لمقره والدفع كاش عند الاستلام.'
      });
    }
    if (pm.acrylic_stands_multi_branch) {
      const mb = pm.acrylic_stands_multi_branch;
      packages.push({
        id: 'acrylic_stands_multi_branch',
        name_ar: 'باقات استاندات الأكريليك لسلاسل الفروع والكميات',
        price_egp: '90 ج للاستاند (من 2 إلى 5) | 75 ج للاستاند (من 6 إلى 15)',
        payment_method: 'تنسيق مباشر مع مندوب الحسابات الميداني',
        is_active: true,
        deliverables: [
          `من 2 إلى 5 استاندات: ${mb.tier_2_to_5_stands_egp || 90} ج.م للاستاند`,
          `من 6 إلى 15 استاند: ${mb.tier_6_to_15_stands_egp || 75} ج.م للاستاند`,
          `أكثر من 15 استاند: ${mb.tier_above_15_stands || 'تسعير خاص مخفض بحسب التوريد'}`
        ]
      });
    }
  }

  // 3. Core Tracks Packages (Foundational, Growth, Enterprise)
  if (rawConfig?.core_tracks_packages) {
    const tracks = rawConfig.core_tracks_packages;
    for (const trackKey of Object.keys(tracks)) {
      const trackObj = tracks[trackKey];
      if (typeof trackObj === 'object' && trackObj !== null) {
        for (const pkgKey of Object.keys(trackObj)) {
          const p = trackObj[pkgKey];
          if (p && typeof p === 'object' && p.name) {
            packages.push({
              id: p.id || pkgKey,
              name_ar: p.name,
              price_egp: p.price_egp ?? 0,
              billing_cycle: p.billing || 'مرة واحدة',
              payment_method: 'نقداً مع المندوب الميداني أو حسب تنسيق الإدارة',
              is_active: true,
              deliverables: Array.isArray(p.features) ? p.features : []
            });
          }
        }
      }
    }
  }

  // 4. Directory Showcase Subscriptions
  if (rawConfig?.directory_showcase_subscriptions) {
    const subs = rawConfig.directory_showcase_subscriptions;
    for (const subKey of Object.keys(subs)) {
      const s = subs[subKey];
      if (s && typeof s === 'object' && s.name) {
        packages.push({
          id: `showcase_${subKey}`,
          name_ar: s.name,
          price_egp: s.price_egp ?? 0,
          billing_cycle: s.billing || 'سنوياً',
          payment_method: 'اشتراك سنوي معتمد',
          is_active: true,
          deliverables: Array.isArray(s.features) ? s.features : []
        });
      }
    }
  }

  // Also support packages_matrix schema if present
  if (rawConfig?.packages_matrix) {
    const pm = rawConfig.packages_matrix;
    if (pm.free_digital_tier && !packages.some(p => p.id.includes('free') || p.id === 'pkg_exempt')) {
      packages.push({
        id: 'free_digital_tier',
        name_ar: 'باقة التوثيق الرقمي المجاني',
        price_egp: pm.free_digital_tier.price_egp ?? 0,
        payment_method: 'مجانية بالكامل (0.00 ج)',
        is_active: true,
        deliverables: Array.isArray(pm.free_digital_tier.features) ? pm.free_digital_tier.features : ['توثيق المنشأة بالدليل', 'ربط خرائط جوجل', 'كود QR رقمي']
      });
    }
    if (pm.single_stand_pack && !packages.some(p => p.id.includes('stand'))) {
      packages.push({
        id: 'single_stand_pack',
        name_ar: 'باقة الاستاند الأكريليكي الفاخر',
        price_egp: pm.single_stand_pack.price_egp ?? 100,
        payment_method: pm.single_stand_pack.payment_mode === 'COD_only' ? 'الدفع كاش عند الاستلام فقط (COD) مع المندوب' : String(pm.single_stand_pack.payment_mode || 'COD'),
        is_active: true,
        deliverables: Array.isArray(pm.single_stand_pack.features) ? pm.single_stand_pack.features : ['استاند طاولات أكريليك فاخر', 'طباعة حرارية مقاومة للماء', 'توصيل للمقر']
      });
    }
  }

  return {
    business_identity: {
      platform_name: rawConfig?.platform_identity?.name || 'منصة دليلك',
      official_phone: rawConfig?.platform_identity?.official_phone || '01556221141',
      official_website: rawConfig?.platform_identity?.website || 'https://www.dalilaak.com'
    },
    packages: packages.length > 0 ? packages : [
      { id: 'pkg_exempt', name_ar: 'التوثيق والهدية المجانية', price_egp: 0, payment_method: 'مجاني', deliverables: ['توثيق جوجل ماب', '4 تصاميم QR'] },
      { id: 'pkg_basic', name_ar: 'باقة التوثيق الأساسي لخرائط Google (250 ج)', price_egp: 250, payment_method: 'مع المندوب', deliverables: ['تثبيت GPS', 'رفع الصور واللوجو', 'Local SEO'] },
      { id: 'acrylic_stand_single', name_ar: 'استاند الطاولات الأكريليكي الفاخر (100 ج)', price_egp: 100, payment_method: 'COD كاش عند الاستلام', deliverables: ['استاند أكريليك مقاس A5', 'طباعة حرارية 300 DPI', 'توصيل للمقر'] }
    ],
    rules_and_policies: {
      free_services: [
        'إدراج المنشأة في الدليل العام لمنصة دليلك',
        '4 تصاميم رقمية فاخرة لرموز QR بدقة 300 DPI',
        'ربط تقييمات خرائط Google Maps مباشرة',
        'تعديل بيانات المنشأة الأساسية أو المنيو الذكي مجاني 100% دائماً وفي أي وقت'
      ],
      payment_rules: {
        accepted_methods: [
          'الدفع نقداً عند الاستلام فقط (COD) مع المندوب للاستاندات والمطبوعات المادية',
          'فودافون كاش رسمي على 01556221141 أو إنستاباي dalelak@instapay للباقات التسويقية والاشتراكات المعتمدة'
        ],
        strictly_prohibited: rawConfig?.strict_prohibitions || [
          'حظر المطالبة بأي مبالغ قبل المعاينة والاستلام في المقر للاستاندات والمطبوعات',
          'حظر طلب تحويلات بنكية غير معلومة أو بدون فاتورة رسمية',
          'حظر الادعاء بأن سعر الاستاند 500 جنيه (السعر الحقيقي 100 ج فقط)'
        ]
      }
    }
  };
}

export function getDalelakTrainingConfig(): DalelakTrainingConfig {
  try {
    const candidates = [TRAINING_CONFIG_PATH_1, TRAINING_CONFIG_PATH_2, TRAINING_CONFIG_PATH_3];
    let newestPath = TRAINING_CONFIG_PATH_1;
    let maxMtime = 0;

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        try {
          const m = fs.statSync(p).mtimeMs;
          if (m > maxMtime) {
            maxMtime = m;
            newestPath = p;
          }
        } catch {}
      }
    }

    if (cachedTrainingConfig && maxMtime === lastTrainingConfigMtime && maxMtime > 0) {
      return cachedTrainingConfig;
    }

    if (fs.existsSync(newestPath)) {
      let raw = fs.readFileSync(newestPath, 'utf-8');
      // Strip only line-start comments or block comments, preserving // inside URLs
      raw = raw.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      const parsed = JSON.parse(raw);
      cachedTrainingConfig = normalizeTrainingConfig(parsed);
      lastTrainingConfigMtime = maxMtime;

      // Sync the newest file to other existing mirror paths
      for (const dest of [TRAINING_CONFIG_PATH_1, TRAINING_CONFIG_PATH_2]) {
        if (dest !== newestPath) {
          try { fs.copyFileSync(newestPath, dest); } catch {}
        }
      }

      console.log(`📚 [AI Agent] Successfully loaded training configuration from: ${path.basename(newestPath)} (${cachedTrainingConfig.packages.length} packages).`);
      return cachedTrainingConfig;
    }
  } catch (err) {
    console.warn('[AI Agent] Error loading dalelak training config:', err);
  }

  return {
    packages: [
      {
        id: 'pkg_digital_free',
        name_ar: 'باقة التوثيق الرقمي الشرفي المجاني',
        price_egp: 0,
        payment_method: 'مجاناً بالكامل (0.00 ج)',
        is_active: true,
        deliverables: ['توثيق المنشأة بالدليل', 'ربط خرائط Google', 'كود QR ذكي عالي الدقة']
      },
      {
        id: 'pkg_print_cod_100',
        name_ar: 'باقة الطباعة الفاخرة واستاند الكاونتر',
        price_egp: 100,
        payment_method: 'نقداً عند الاستلام فقط (COD) مع المندوب',
        is_active: true,
        deliverables: ['طباعة ملونة فاخرة 300 DPI', 'استاند كاونتر أكريليك شفاف', 'توصيل للمقر اليوم']
      },
      {
        id: 'pkg_growth_250',
        name_ar: 'باقة النمو والتسويق الرقمي المتقدم (باقة 250)',
        price_egp: 250,
        payment_method: 'نقداً عند الاستلام مع المندوب',
        is_active: true,
        deliverables: ['جميع مميزات باقة الطباعة', '2 استاند أكريليك كاونتر', 'شيت ملصقات إضافي موسع', 'ترويج بالدليل']
      }
    ]
  };
}


const DEFAULT_CONFIG: WhatsAppAiConfig = {
  apiKey: process.env.GROK_API_KEY || '',
  model: process.env.GROK_MODEL || 'openai/gpt-oss-120b',
  enabled: true,
  tone: 'egyptian_warm',
  autoGiftEnabled: true,
  autoUpdateBusinessEnabled: true,
  autoRepLeadEnabled: true,
  typingSimulationEnabled: true,
  humanTakeoverCooldownMinutes: 1440, // 24 hours
};

/**
 * 📁 Ensures directory and stores exist
 */
function ensureDataStore() {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * ⚙️ Loads AI Configuration
 */
export function getWhatsAppAiConfig(): WhatsAppAiConfig {
  try {
    ensureDataStore();
    let stored: any = {};
    if (fs.existsSync(CONFIG_PATH)) {
      stored = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }

    const envKeys = [
      process.env.GROK_API_KEY,
      process.env.GROK_API_KEY_2,
      process.env.GROK_API_KEY_3,
    ].filter(Boolean) as string[];

    let apiKeys: string[] = [];
    if (Array.isArray(stored.apiKeys) && stored.apiKeys.length > 0) {
      apiKeys = stored.apiKeys.map((k: any) => String(k || '').trim()).filter(Boolean);
    } else if (stored.apiKey) {
      apiKeys = [String(stored.apiKey).trim()];
    } else if (envKeys.length > 0) {
      apiKeys = envKeys;
    }

    const primaryKey = apiKeys[0] || stored.apiKey || process.env.GROK_API_KEY || '';

    return {
      ...DEFAULT_CONFIG,
      ...stored,
      apiKey: primaryKey,
      apiKeys,
    };
  } catch (e) {
    console.warn('[AI Agent] Error loading config:', e);
    return { ...DEFAULT_CONFIG, apiKey: process.env.GROK_API_KEY || '', apiKeys: [] };
  }
}

/**
 * 💾 Saves AI Configuration
 */
export function saveWhatsAppAiConfig(config: Partial<WhatsAppAiConfig>): WhatsAppAiConfig {
  ensureDataStore();
  const current = getWhatsAppAiConfig();

  let newApiKeys = [...(current.apiKeys || [])];

  if (Array.isArray(config.apiKeys)) {
    newApiKeys = config.apiKeys.map((k, idx) => {
      const trimmed = String(k || '').trim();
      // If masked value passed from UI, keep the existing key at that index
      if (trimmed.includes('•') || trimmed.includes('*')) {
        return current.apiKeys?.[idx] || '';
      }
      return trimmed;
    }).filter(Boolean);
  } else if (typeof config.apiKey === 'string') {
    const trimmed = config.apiKey.trim();
    if (!trimmed.includes('•') && !trimmed.includes('*')) {
      if (newApiKeys.length > 0) {
        newApiKeys[0] = trimmed;
      } else if (trimmed) {
        newApiKeys = [trimmed];
      }
    }
  }

  const primaryKey = newApiKeys[0] || (config.apiKey ? config.apiKey.trim() : current.apiKey);

  const updated: WhatsAppAiConfig = {
    ...current,
    ...config,
    apiKey: primaryKey,
    apiKeys: newApiKeys,
  };

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

/**
 * 📂 Loads Conversation Threads
 */
function loadConversations(): Record<string, AiConversationThread> {
  try {
    ensureDataStore();
    if (fs.existsSync(CONVERSATIONS_PATH)) {
      return JSON.parse(fs.readFileSync(CONVERSATIONS_PATH, 'utf-8'));
    }
  } catch (e) {
    console.warn('[AI Agent] Error loading conversations:', e);
  }
  return {};
}

/**
 * 💾 Saves Conversation Threads
 */
function saveConversations(conversations: Record<string, AiConversationThread>): void {
  try {
    ensureDataStore();
    fs.writeFileSync(CONVERSATIONS_PATH, JSON.stringify(conversations, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[AI Agent] Error saving conversations:', e);
  }
}

/**
 * 📋 Loads Live AI Audit Log
 */
export function getAiAuditLogs(): AiAuditLogItem[] {
  try {
    ensureDataStore();
    if (fs.existsSync(AUDIT_LOG_PATH)) {
      return JSON.parse(fs.readFileSync(AUDIT_LOG_PATH, 'utf-8'));
    }
  } catch {}
  return [];
}

/**
 * 📝 Appends an item to the AI Audit Log
 */
function appendAuditLog(item: AiAuditLogItem): void {
  try {
    ensureDataStore();
    const logs = getAiAuditLogs();
    logs.unshift(item);
    if (logs.length > 300) {
      logs.length = 300;
    }
    fs.writeFileSync(AUDIT_LOG_PATH, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[AI Agent] Error recording audit log:', e);
  }
}

/**
 * 🔍 Matches phone number to business in database
 */
/**
 * 🔍 Matches business by URL (/biz/...) or name in text
 */


// 🛡️ Safe Atomic File Writing: Prevents race conditions and file corruption
function atomicWriteFileSync(filePath: string, data: string): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`;
    fs.writeFileSync(tmpPath, data, 'utf-8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    fs.writeFileSync(filePath, data, 'utf-8');
  }
}

export function recordAdminFollowUp(
  bizId: string,
  noteText: string,
  type: 'general' | 'call' | 'visit' = 'general',
  status: 'completed' | 'pending' = 'completed'
): boolean {
  try {
    const storePaths = Array.from(new Set([
      BIZ_STORE_PATH,
      path.resolve(process.cwd(), 'data/server_biz_store.json'),
    ]));
    let recorded = false;
    for (const sp of storePaths) {
      if (fs.existsSync(sp)) {
        const businesses: Business[] = JSON.parse(fs.readFileSync(sp, 'utf-8'));
        if (Array.isArray(businesses)) {
          const idx = businesses.findIndex((b) => b.id === bizId);
          if (idx !== -1) {
            const followUps = Array.isArray(businesses[idx].adminFollowUps) ? businesses[idx].adminFollowUps : [];
            const newNote: AdminFollowUpNote = {
              id: `fu_wa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              authorId: 'whatsapp_ai_agent',
              authorName: 'المساعد الذكي (واتساب دليلك)',
              authorRole: 'system',
              type,
              status,
              category: 'whatsapp',
              text: noteText,
              createdAt: new Date().toISOString(),
            };
            followUps.unshift(newNote);
            businesses[idx].adminFollowUps = followUps.slice(0, 50);
            businesses[idx].updatedAt = new Date().toISOString();
            atomicWriteFileSync(sp, JSON.stringify(businesses, null, 2));
            console.log(`📝 [Admin Follow-Up Logged] For ${bizId}: "${noteText.substring(0, 50)}..."`);
            recorded = true;
          }
        }
      }
    }
    return recorded;
  } catch (e) {
    console.warn('[AI Agent] Failed to record admin follow-up:', e);
    return false;
  }
}

export function findBusinessById(id: string): Business | null {
  try {
    if (!id) return null;
    const storePaths = [
      BIZ_STORE_PATH,
      path.resolve(process.cwd(), 'data/server_biz_store.json'),
      path.resolve(process.cwd(), '../data/server_biz_store.json'),
    ];
    for (const sp of storePaths) {
      if (fs.existsSync(sp)) {
        const businesses: Business[] = JSON.parse(fs.readFileSync(sp, 'utf-8'));
        if (Array.isArray(businesses)) {
          const found = businesses.find((b) => b.id === id);
          if (found) return found;
        }
      }
    }
  } catch (e) {
    console.warn('[AI Agent] Error finding business by ID:', e);
  }
  return null;
}

const COMMON_ARABIC_STOPWORDS = new Set([
  'السلام', 'عليكم', 'سلام', 'صباح', 'الخير', 'مساء', 'النور', 'اهلا', 'أهلا', 'سهلا', 'مرحبا',
  'شكرا', 'شكراً', 'فندم', 'باشا', 'حضرتك', 'لو', 'سمحت', 'الله', 'ورحمة', 'وبركاته', 'يا',
  'في', 'من', 'على', 'عن', 'إلى', 'مع', 'هذا', 'هذه', 'تم', 'كل', 'أنا', 'احنا', 'انت', 'انتم',
  'سوبر', 'ماركت', 'مطعم', 'كافيه', 'محل', 'شركة', 'مركز', 'صيدلية', 'مخبز', 'معرض', 'مكتب',
  'عطارة', 'توابل', 'أعشاب', 'طبيعية', 'القاهرة', 'الجديدة', 'مصر', 'الجيزة', 'الشارع', 'شارع',
  'طريق', 'ميدان', 'محافظة', 'مدينة', 'خدمات', 'تجاري', 'نشاط', 'منشأة', 'مكان', 'إدارة', 'ادارة'
]);

export function findBusinessByIdOrText(text: string): Business | null {
  try {
    if (!text) return null;
    const trimmed = text.trim();

    // 🛑 0. Immediate short-circuit: Pure greetings, common conversational words or inquiries MUST NEVER match any business!
    const isPureGreetingOrChat = /^(السلام\s*عليكم|سلام\s*عليكم|وعليكم\s*السلام|صباح\s*الخير|صباح\s*النور|مساء\s*الخير|مساء\s*النور|أهلاً|اهلا|مرحبا|هاي|hello|hi|شكرا|شكراً|لو\s*سمحت|يا\s*فندم|مين\s*معايا|ازيك|ازيكم|تمام|الحمد\s*لله|الله\s*يسلمك|الله\s*يبارك\s*فيك|مين\s*حضرتك|خدمة\s*العملاء|مين\s*أنتم|مين\s*انتم)(\s+ورحمة\s+الله\s+وبركاته)?\s*[!؟?.]*$/i.test(trimmed);
    if (isPureGreetingOrChat) {
      return null;
    }

    const storePaths = [BIZ_STORE_PATH, path.resolve(process.cwd(), 'data/server_biz_store.json'), path.resolve(process.cwd(), '../data/server_biz_store.json')];
    let businesses: Business[] | null = null;
    for (const sp of storePaths) {
      if (fs.existsSync(sp)) {
        try { businesses = JSON.parse(fs.readFileSync(sp, 'utf-8')); if (Array.isArray(businesses)) break; } catch {}
      }
    }
    if (!businesses || !Array.isArray(businesses)) return null;

    // 1. Match by URL containing ID e.g. biz/biz_gplaces_...
    const urlMatch = text.match(/biz\/([a-zA-Z0-9_\-]+)/);
    if (urlMatch && urlMatch[1]) {
      const matchId = urlMatch[1].trim();
      const found = businesses.find(b => b.id === matchId);
      if (found) return found;
    }

    // 2. Match by Arabic name in brackets or quotes e.g. «معرض الزعيم للسيارات»
    const nameMatch = text.match(/[«"']([^»"']{3,40})[»"']/);
    if (nameMatch && nameMatch[1]) {
      const targetName = nameMatch[1].trim().toLowerCase();
      // Skip if target inside brackets is just a common stopword
      if (!COMMON_ARABIC_STOPWORDS.has(targetName)) {
        const found = businesses.find(b => 
          (b.nameAr && b.nameAr.toLowerCase().includes(targetName)) || 
          (b.name && b.name.toLowerCase().includes(targetName))
        );
        if (found) return found;
      }
    }

    // 3. Match explicit ownership claim e.g. "أنا صاحب / إدارة [اسم المنشأة]" or "نشاطي هو [اسم المنشأة]"
    const explicitClaimMatch = text.match(/(?:أنا\s*صاحب|إدارة|نشاطي\s*هو|اسم\s*المحل\s*هو|اسم\s*النشاط\s*هو)\s+([^.\n،,]{3,40})/i);
    if (explicitClaimMatch && explicitClaimMatch[1]) {
      const claimedName = explicitClaimMatch[1].trim().toLowerCase();
      const found = businesses.find(b => {
        const ar = (b.nameAr || '').toLowerCase();
        const en = (b.name || '').toLowerCase();
        return (ar && (claimedName.includes(ar) || ar.includes(claimedName))) ||
               (en && (claimedName.includes(en) || en.includes(claimedName)));
      });
      if (found) return found;
    }

    // 4. Match by MULTIPLE distinct business keywords (minimum 2 distinct non-stopword words required)
    // A single word in a freeform sentence MUST NEVER trigger a match to prevent false positives!
    const cleanText = text.toLowerCase();
    for (const b of businesses) {
      const arName = (b.nameAr || '').toLowerCase();
      const enName = (b.name || '').toLowerCase();
      
      const distinctWords = arName
        .split(/[\s,،.\-_/]+/)
        .filter(w => w.length > 2 && !COMMON_ARABIC_STOPWORDS.has(w));

      // Strictly require at least 2 distinct words to match from casual text!
      if (distinctWords.length >= 2) {
        const matched = distinctWords.filter(w => cleanText.includes(w));
        if (matched.length >= 2) {
          return b;
        }
      }
      if (enName.length > 5 && !COMMON_ARABIC_STOPWORDS.has(enName) && cleanText.includes(enName)) {
        return b;
      }
    }
  } catch (e) {
    console.warn('[AI Agent] Error matching business by text/URL:', e);
  }
  return null;
}

export function findBusinessByPhone(rawPhone: string): Business | null {
  try {
    const cleanDigits = rawPhone.replace(/\D/g, '');
    if (!cleanDigits) return null;

    if (fs.existsSync(BIZ_STORE_PATH)) {
      const businesses: Business[] = JSON.parse(fs.readFileSync(BIZ_STORE_PATH, 'utf-8'));
      if (Array.isArray(businesses)) {
        for (const biz of businesses) {
          const bizPhone = (biz.phone || '').replace(/\D/g, '');
          const ownerPhone = (biz.ownerPhone || '').replace(/\D/g, '');
          if (
            (bizPhone && (cleanDigits.endsWith(bizPhone.slice(-9)) || bizPhone.endsWith(cleanDigits.slice(-9)))) ||
            (ownerPhone && (cleanDigits.endsWith(ownerPhone.slice(-9)) || ownerPhone.endsWith(cleanDigits.slice(-9))))
          ) {
            return biz;
          }
        }
      }
    }
  } catch (e) {
    console.warn('[AI Agent] Error matching business by phone:', e);
  }
  return null;
}

/**
 * 🛠️ Updates business record in local database
 */
function updateBusinessRecord(bizId: string, updates: Partial<Business>): boolean {
  try {
    if (!fs.existsSync(BIZ_STORE_PATH)) return false;
    const businesses: Business[] = JSON.parse(fs.readFileSync(BIZ_STORE_PATH, 'utf-8'));
    if (!Array.isArray(businesses)) return false;

    const idx = businesses.findIndex((b) => b.id === bizId);
    if (idx === -1) return false;

    businesses[idx] = {
      ...businesses[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(BIZ_STORE_PATH, JSON.stringify(businesses, null, 2), 'utf-8');
    console.log(`✅ [AI Agent] Business ${bizId} updated successfully:`, Object.keys(updates));
    return true;
  } catch (e) {
    console.error('[AI Agent] Failed to update business record:', e);
    return false;
  }
}

/**
 * 🤝 Records a new representative visit lead
 */
function recordRepLead(biz: Business, clientRequest: string, preferredTime?: string): void {
  try {
    ensureDataStore();
    let leads: InterestedLead[] = [];
    if (fs.existsSync(LEADS_STORE_PATH)) {
      try {
        leads = JSON.parse(fs.readFileSync(LEADS_STORE_PATH, 'utf-8'));
      } catch {}
    }

    const nowIso = new Date().toISOString();
    const newLead: InterestedLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      clientName: biz.ownerName || biz.nameAr || biz.name || 'عميل محتمل',
      businessName: biz.nameAr || biz.name,
      businessCategory: biz.category || 'عام',
      phone: biz.ownerPhone || biz.phone,
      governorate: biz.governorate || 'الجيزة',
      city: biz.city || 'حدائق الأهرام',
      interestLevel: 'high',
      notes: `طلب زيارة/تجهيز عبر الواتساب: "${clientRequest}" (الموعد المفضل: ${preferredTime || 'في أقرب وقت ممكن'})`,
      adminFollowUps: [
        {
          id: `fu_lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          authorId: 'whatsapp_ai_agent',
          authorName: 'المساعد الذكي (واتساب دليلك)',
          authorRole: 'system',
          type: 'visit',
          status: 'pending',
          category: 'whatsapp',
          text: `طلب من العميل عبر الواتساب: "${clientRequest}". الموعد المفضل: ${preferredTime || 'في أقرب وقت ممكن'}`,
          createdAt: nowIso,
        },
      ],
      createdDate: nowIso,
      repId: biz.repId || 'rep_1',
      repName: biz.repName || 'مندوب معتمد',
      status: 'pending_followup',
    };

    leads.unshift(newLead);
    atomicWriteFileSync(LEADS_STORE_PATH, JSON.stringify(leads, null, 2));
    console.log(`✅ [AI Agent] Registered rep follow-up lead for: ${biz.nameAr}`);
  } catch (e) {
    console.warn('[AI Agent] Failed to record lead:', e);
  }
}

/**
 * 👔 Records an inquiry from a field representative or marketer trying to contact administration
 */
export function recordRepresentativeInquiry(
  phone: string,
  repName?: string,
  inquiryDetails?: string
): void {
  try {
    ensureDataStore();
    const storePath = path.resolve(process.cwd(), 'data/server_reps_inquiries.json');
    let inquiries: any[] = [];
    if (fs.existsSync(storePath)) {
      try {
        inquiries = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
      } catch {}
    }

    const newInquiry = {
      id: `rep_inq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      repName: repName || 'مندوب / مسوق',
      phone,
      details: inquiryDetails || 'محاولة تواصل مع الإدارة عبر واتساب خدمة العملاء',
      status: 'pending_admin_contact',
      source: 'whatsapp_ai_agent',
      createdAt: new Date().toISOString(),
    };

    inquiries.unshift(newInquiry);
    fs.writeFileSync(storePath, JSON.stringify(inquiries, null, 2), 'utf-8');
    console.log(`👔 [AI Agent] Registered representative inquiry from: ${repName || phone} (${phone})`);

    // Also register in leads store so admins see it immediately in dashboard
    let leads: any[] = [];
    if (fs.existsSync(LEADS_STORE_PATH)) {
      try {
        leads = JSON.parse(fs.readFileSync(LEADS_STORE_PATH, 'utf-8'));
      } catch {}
    }
    leads.unshift({
      id: `lead_rep_${Date.now()}`,
      businessId: 'rep_contact',
      businessName: `مندوب: ${repName || phone}`,
      phone,
      request: `تواصل مندوب/مسوق: ${inquiryDetails || 'يرغب في التواصل مع الإدارة بخصوص العمل أو التنسيق'}`,
      preferredTime: 'في أقرب وقت ممكن',
      status: 'pending',
      source: 'whatsapp_rep_inquiry',
      createdAt: new Date().toISOString(),
    });
    fs.writeFileSync(LEADS_STORE_PATH, JSON.stringify(leads, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[AI Agent] Failed to record representative inquiry:', e);
  }
}

/**
 * 👤 Human Takeover: Checks if conversation is currently muted for manual handling
 */
export function isConversationMuted(phone: string): boolean {
  const conversations = loadConversations();
  const thread = conversations[phone];
  if (!thread || !thread.isMutedByHuman) return false;

  if (thread.mutedUntil) {
    const expires = new Date(thread.mutedUntil).getTime();
    if (Date.now() < expires) {
      return true; // Still muted
    }
  }

  return false;
}

/**
 * 🔇 Marks a conversation as muted (human intervened)
 */
export function muteConversationForHuman(phone: string, minutes: number = 1440): void {
  const conversations = loadConversations();
  const thread = conversations[phone] || {
    phone,
    messages: [],
  };

  const mutedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  thread.isMutedByHuman = true;
  thread.mutedUntil = mutedUntil;
  conversations[phone] = thread;
  saveConversations(conversations);
  console.log(`👤 [Human Takeover] Conversation with ${phone} is muted until ${mutedUntil}`);
}

/**
 * 🔊 Unmutes a conversation to let AI handle it again
 */
export function unmuteConversation(phone: string): void {
  const conversations = loadConversations();
  if (conversations[phone]) {
    conversations[phone].isMutedByHuman = false;
    conversations[phone].mutedUntil = null;
    saveConversations(conversations);
    console.log(`🤖 [AI Resume] Conversation with ${phone} is now unmuted`);
  }
}

/**
 * 📋 Returns all conversation threads for admin monitoring
 */
export function getAllAiConversations(): AiConversationThread[] {
  const conversations = loadConversations();
  return Object.values(conversations).sort((a, b) => {
    const timeA = new Date(a.lastIncomingAt || 0).getTime();
    const timeB = new Date(b.lastIncomingAt || 0).getTime();
    return timeB - timeA;
  });
}

/**
 * 🔍 Returns specific conversation thread by phone
 */
export function getAiConversationByPhone(rawPhone: string): AiConversationThread | null {
  const cleanPhone = rawPhone.replace(/\D/g, '');
  if (!cleanPhone) return null;
  const conversations = loadConversations();
  if (conversations[cleanPhone]) return conversations[cleanPhone];
  
  // Try suffix matching for 9+ digits
  for (const [key, thread] of Object.entries(conversations)) {
    if (key.endsWith(cleanPhone) || cleanPhone.endsWith(key)) {
      return thread;
    }
  }
  return null;
}

/**
 * 🛠️ Defines Grok Function Calling Tools
 */
export const GROK_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'sendBusinessGiftPackage',
      description: 'إرسال كارت الـ QR والهدية الترويجية المعتمدة للمنشأة كصورة عالية الجودة عند طلب العميل للهدية أو كود النشاط أو رغبته في استلام الهدية',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'سبب الإرسال: مثلاً طلب العميل الهدية أو موافقته على التوثيق' },
          hidePhone: { type: 'boolean', description: 'إخفاء أو حذف رقم الهاتف من التصميم إذا طلب العميل ذلك أو اعترض على وجود رقم بالبوستر' },
          customPhone: { type: 'string', description: 'رقم هاتف مخصص لاعتماده في التصميم بدلاً من الرقم المسجل بالدليل' },
        },
        required: ['reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateBusinessInformation',
      description: 'تحديث بيانات المنشأة الرسمية في قاعدة البيانات (مثل رقم هاتف الواتساب الإضافي، مواعيد العمل، العنوان)',
      parameters: {
        type: 'object',
        properties: {
          updatedPhone: { type: 'string', description: 'رقم الهاتف أو الواتساب الجديد إن وجد' },
          updatedHours: { type: 'string', description: 'مواعيد العمل الجديدة إن ذكرها' },
          updatedNotes: { type: 'string', description: 'أي ملاحظات إضافية ذكرها العميل لتحديثها' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'scheduleFieldRepVisit',
      description: 'تسجيل طلب زيارة ميدانية لمندوب دليلك لتصوير وتوثيق المنشأة والاتفاق على خدمات تسويقية أو إعلانية',
      parameters: {
        type: 'object',
        properties: {
          clientRequest: { type: 'string', description: 'ما طلبه العميل تحديداً من المندوب' },
          preferredTime: { type: 'string', description: 'الموعد المفضل للزيارة إن ذكره' },
        },
        required: ['clientRequest'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'activateDirectoryBadge',
      description: 'اعتماد وتفعيل بطاقة المنشأة رسمياً بالدليل وتأكيد التوثيق الشرفي المجاني بالكامل',
      parameters: {
        type: 'object',
        properties: {
          confirmationNote: { type: 'string', description: 'تأكيد موافقة العميل على التوثيق' },
        },
        required: ['confirmationNote'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'escalateToHumanAdmin',
      description: 'تصعيد المحادثة للإدارة البشرية وكتم الروبوت مؤقتاً في الحالات الاستثنائية أو الشكاوى أو الأسئلة المعقدة',
      parameters: {
        type: 'object',
        properties: {
          reason: { type: 'string', description: 'سبب تصعيد المحادثة للإدارة' },
        },
        required: ['reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'forwardRepresentativeInquiryToAdmin',
      description: 'تسجيل وتوجيه بيانات مندوب ميداني أو مسوق يحاول التواصل مع الإدارة عبر هذا الرقم، لحفظ رقمه وتنبيه الإداريين للتواصل معه',
      parameters: {
        type: 'object',
        properties: {
          repName: { type: 'string', description: 'اسم المندوب إن ذكره' },
          inquiryDetails: { type: 'string', description: 'تفاصيل ما يريده المندوب أو استفساره' },
        },
        required: ['inquiryDetails'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'forwardCustomPricingInquiryToAdmin',
      description: 'تسجيل وتوجيه أي استفسار من العميل عن باقات إضافية، خدمات غير مسعرة، كميات خاصة، أو أسعار مخصصة غير محددة بالباقات، لتسجيله في متابعات النشاط داخل التطبيق وتنبيه الإدارة للرد عليه أو التواصل معه',
      parameters: {
        type: 'object',
        properties: {
          clientInquiry: { type: 'string', description: 'تفاصيل ما استفسر عنه العميل بخصوص الباقات أو الأسعار الإضافية' },
          preferredContactTime: { type: 'string', description: 'الموعد المفضل للتواصل إن ذكره' },
        },
        required: ['clientInquiry'],
      },
    },
  },
];

/**
 * 🎲 Spintax Resolver Engine
 * Parses patterns like {option1|option2|option3} and picks a random natural choice.
 * Ensures outgoing and generated texts have maximum variance against spam filters.
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

/**
 * 🏛️ Helper for natural venue semantic labels (المحل، العيادة، المطعم، المتجر...)
 */
function getSemanticVenueLabel(category?: string): string {
  if (!category) return 'المنشأة';
  const cat = category.toLowerCase();
  if (cat.includes('مطعم') || cat.includes('مأكولات') || cat.includes('كافيه') || cat.includes('مقهى') || cat.includes('حلواني') || cat.includes('مشويات')) {
    return 'المطعم / الكافيه';
  }
  if (cat.includes('عيادة') || cat.includes('طبيب') || cat.includes('دكتور') || cat.includes('أسنان') || cat.includes('مركز طبي')) {
    return 'العيادة / المركز الطبي';
  }
  if (cat.includes('صيدلية') || cat.includes('دواء')) {
    return 'الصيدلية';
  }
  if (cat.includes('سيارات') || cat.includes('ميكانيك') || cat.includes('صيانة')) {
    return 'مركز الصيانة';
  }
  if (cat.includes('سوبرماركت') || cat.includes('ماركت') || cat.includes('بقالة') || cat.includes('متجر') || cat.includes('محل') || cat.includes('ملابس')) {
    return 'المتجر / المحل';
  }
  return 'المنشأة';
}

/**
 * 🧠 Compiles the Comprehensive Master Blueprint System Prompt
 * Provides the AI model with a 360-degree mental model of Dalelak:
 * - Enterprise identity and mission
 * - Exact context of outreach
 * - Complete objection handling matrix
 * - Natural Egyptian conversational behavior guidelines
 * - Strict Zero-Detection guardrails
 */
function buildSystemPrompt(biz: Business | null, tone: WhatsAppAiConfig['tone']): string {
  const isRegisteredBiz = !!biz;
  const venueName = biz ? (biz.nameAr || biz.name || '') : '';
  const category = biz ? (biz.category || '') : '';
  const location = biz ? [biz.governorate, biz.city].filter(Boolean).join(' - ') : '';
  const directoryUrl = biz ? getDisplayDirectoryUrl(biz) : 'https://www.dalilaak.com';
  const venueType = getSemanticVenueLabel(category);

  // 🔄 Dynamic check for trained system prompt (synced from Dalelak AI Agent Trainer)
  const config = getWhatsAppAiConfig();
  const trainedPromptCandidates = [
    path.resolve(process.cwd(), 'data/trained_system_prompt.txt'),
    path.resolve(process.cwd(), '../data/trained_system_prompt.txt'),
    'C:\\Users\\Ahmed\\Desktop\\Dalelak_AI_Agent_Trainer\\data\\dalelak_master_system_prompt.txt',
  ];

  let trainedPrompt = (config as any).customSystemPrompt || '';
  for (const tp of trainedPromptCandidates) {
    if (fs.existsSync(tp)) {
      try {
        const content = fs.readFileSync(tp, 'utf-8');
        if (content && content.trim()) {
          trainedPrompt = content.trim();
          break;
        }
      } catch {}
    }
  }

  if (trainedPrompt) {
    const venueContext = isRegisteredBiz
      ? `\n\n═══════════════════════════════════════════════════════\n📌 سياق وبيانات المنشأة الحالية للتواصل:\n- الاسم: «${venueName}» (${venueType})\n- التصنيف: ${category}\n- النطاق الجغرافي: ${location}\n- الرابط بالدليل: ${directoryUrl}\n═══════════════════════════════════════════════════════`
      : `\n\n═══════════════════════════════════════════════════════\n📌 سياق الطرف المتواصل حالياً:\n- متواصل جديد / غير مسجل مسبقاً بقاعدة البيانات.\n═══════════════════════════════════════════════════════`;
    return `${trainedPrompt}${venueContext}`;
  }

  const trainingConfig = getDalelakTrainingConfig();

  const activePackages = (trainingConfig.packages || []).filter(p => p.is_active !== false);
  let packagesCatalogPrompt = '';
  activePackages.forEach((pkg, index) => {
    const priceStr = pkg.price_egp === 0 ? 'مجاناً بالكامل (0.00 ج.م)' : (typeof pkg.price_egp === 'number' ? `${pkg.price_egp} جنيه مصري` : String(pkg.price_egp));
    packagesCatalogPrompt += `\n     ${index + 1}. «${pkg.name_ar}»:\n`;
    packagesCatalogPrompt += `        - السعر: ${priceStr}\n`;
    if (pkg.payment_method) packagesCatalogPrompt += `        - طريقة الدفع: ${pkg.payment_method}\n`;
    if (pkg.deliverables && pkg.deliverables.length > 0) {
      packagesCatalogPrompt += `        - المميزات والمحتويات: ${pkg.deliverables.join(' + ')}\n`;
    }
    if (pkg.how_to_pitch) {
      packagesCatalogPrompt += `        - توجيه العرض والشرح: ${pkg.how_to_pitch}\n`;
    }
  });

  let freeServicesPrompt = '';
  if (trainingConfig.rules_and_policies?.free_services && trainingConfig.rules_and_policies.free_services.length > 0) {
    freeServicesPrompt = trainingConfig.rules_and_policies.free_services.map((s, i) => `     • ${s}`).join('\n');
  } else {
    freeServicesPrompt = '     • توثيق المنشأة بالدليل وربطها بخرائط Google.\n     • كود الـ QR الرقمي عالي الدقة (300 DPI).\n     • تحديث مواعيد العمل والأسعار والمنيو فوراً بدون أي رسوم.';
  }

  let customFaqsPrompt = '';
  if (trainingConfig.custom_faqs_and_scenarios && trainingConfig.custom_faqs_and_scenarios.length > 0) {
    customFaqsPrompt = '\n\nإرشادات الرد على الأسئلة الشائعة الإضافية المعتمدة من الإدارة:\n===================================================\n' +
      trainingConfig.custom_faqs_and_scenarios.map(f => `• موضوع [${f.topic}]: إذا سأل العميل عن (${f.question_patterns.join(' / ')}):\n  - الرد المعتمد: "${f.approved_answer}"`).join('\n\n');
  }

  let objectionPrompt = '';
  if (trainingConfig.objection_handling_scripts && trainingConfig.objection_handling_scripts.length > 0) {
    objectionPrompt = '\n\nسيناريوهات التعامل مع اعتراضات وملاحظات العملاء:\n===================================================\n' +
      trainingConfig.objection_handling_scripts.map(o => `• إذا كان الاعتراض [${o.objection}]:\n  - الرد المعتمد: "${o.script}"`).join('\n\n');
  }

  let toneStyleGuide = '';
  if (tone === 'formal_official') {
    toneStyleGuide = 'التحدث بلغة عربية فصحى رسمية راقية، متزنة ومهذبة للغاية، تعبر عن الإدارة العامة لمنظومة دليلك.';
  } else if (tone === 'marketing_promotional') {
    toneStyleGuide = 'التحدث بأسلوب تسويقي ذكي وجذاب، يبرز القيمة الحقيقية للظهور الميداني والتقييمات الرقمية وزيادة المبيعات.';
  } else {
    // Default: egyptian_warm (الأكثر أماناً وإقناعاً وبشرية 100%)
    toneStyleGuide = `التحدث بأسلوب خدمة عملاء مصري راقي جداً، مهذب وطبيعي 100% (استخدم بتلقائية ودفء: يا فندم، تحياتنا لحضرتك، تحت أمرك يا فندم، مرحب بيك، ربنا يبارك في رزقكم).
- تجنب تماماً أي أسلوب آلي مكرر أو مصطنع أو فصحى معقدة تجعل العميل يشعر بأنه يكلم روبوت.
- الردود يجب أن تكون ذكية، بشرية، مباشرة، وقصيرة (من سطرين إلى ثلاثة أسطر بحد أقصى) بدون إنشاءات طويلة أو مبالغات.`;
  }

  const followUps = (biz && Array.isArray(biz.adminFollowUps)) ? biz.adminFollowUps : [];
  const hasDeliveredGift = followUps.some((f: any) => (f.text || '').includes('تسليم باقة') || (f.text || '').includes('هدية')) || (biz && getDeliveredGifts().some((g: DeliveredGiftRecord) => g.businessId === biz.id));

  let historySection = '';
  if (isRegisteredBiz && hasDeliveredGift) {
    historySection = `\n   - 📜 الذاكرة التاريخية للنشاط: هذا النشاط استلم باقة كود الـ QR الرسمية المعتمدة مسبقاً!\n   - آخر المتابعات المسجلة:\n` +
      (followUps.slice(0, 3).map((f: any) => `     • [${f.createdAt ? f.createdAt.split('T')[0] : ''}] ${f.text}`).join('\n') || '     • تم تسليم هدية الـ QR بنجاح.') +
      `\n   - توجيه التفاعل الذكي: العميل يعرف منصة دليلك وقد استلم هديته مسبقاً! لا تسأله عن اسم محله ولا تعرض عليه استلام الهدية كأول مرة. رحب به بحرارة، واسأله عن انطباعه عن كود الـ QR المستلم، واعرض عليه المساعدة في طلب خدمة الطباعة الفاخرة والتوصيل (100 ج بكلمة: اطبعلي) أو تحديث بيانات المنشأة.`;
  }

  const identitySection = isRegisteredBiz
    ? `2. بيانات النشاط المسجل الذي تتحدث معه حالياً:
   - اسم المنشأة: «${venueName}» (${venueType})
   - التصنيف التجاري: ${category}
   - النطاق الجغرافي المسجل: ${location}
   - رابط كارت النشاط المعتمد بالدليل: ${directoryUrl}
   - حالة الإدراج: إدراج شرفي موثق ومجاني تماماً مدى الحياة (0.00 ج.م).${historySection}`
    : `2. بيانات الطرف المتواصل حالياً:
   - هذا الرقم يتواصل معنا ومحتمل أن يكون صاحب نشاط جديد أو مستفسراً عاماً (غير مقيد كمنشأة معتمدة مسبقاً في قاعدة بياناتنا).
   - رحب به بأسلوب مصري راقٍ ومهذب، واسأله بلطف كيف يمكنك مساعدته، أو إن كان يملك محلاً/نشاطاً تجارياً يرغب في توثيقه مجاناً في دليلك واستلام هدية كود الـ QR.
   - لا تخاطبه باسم «المنشأة الكريمة» ولا تفترض مسبقاً أنك تعرف اسم نشاطه حتى يخبرك به.`;

  return `أنت «المساعد الذكي الرسمي والممثل المعتمد لخدمة عملاء منصة دليلك المعتمدة (Dalelak Platform)» في مصر.

المخطط الهيكلي لمنصة دليلك والنشاط الحالي:
===================================================
1. من نحن:
   منصة دليلك هي المنظومة الرقمية الشاملة لتوثيق وتسجيل المعالم والأنشطة والخدمات الميدانية في مختلف المحافظات والمدن المصرية، لمساعدة العملاء في الوصول السريع للأنشطة وربطها المباشر بخرائط Google والدليل العام.

${identitySection}

3. سياق وهدف المحادثة:
   ${isRegisteredBiz ? 'التواصل مع إدارة هذا النشاط تقديراً لسمعتهم بالمنطقة، لتهنئتهم باعتماد بطاقتهم بالدليل مجاناً، وتقديم هدية رسمية معتمدة عبارة عن تصميم بوستر وكارت استجابة سريعة (QR Code) عالي الجودة للطباعة والعرض للزبائن لدعم التقييمات على خرائط جوجل والدليل.' : 'الترحيب بالمستفسر باحترام، والإجابة عن أي سؤال حول خدمات منصة دليلك، ومساعدته في توثيق نشاطه التجاري مجاناً بالكامل إن كان صاحب نشاط.'}

مصفوفة التعامل مع كافة الحالات والاعتراضات (Objection Handling Matrix):
===================================================
• الحالة 0: التحية والاستفسار الأولي (حظر قطعي لإرسال الهدية أو البوسترات):
  - إذا ألقى العميل التحية فقط ("السلام عليكم" / "صباح الخير" / "مساء الخير" / "مرحبا" / "مين معايا"):
  - الرد: رد التحية فوراً بأحسن منها بلطف وترحاب مصري راقٍ ("وعليكم السلام ورحمة الله وبركاته يا فندم! 🌟 أهلاً وسهلاً بحضرتك في منصة دليلك. تشرفنا بك، كيف نقدر نساعدك اليوم؟").
  - الحظر القطعي الصارم: يُمنع منعاً باتاً استدعاء أداة [sendBusinessGiftPackage] عند مجرد التحية أو الاستفسار الأولي! لا ترسل الهدية ولا البوسترات إلا إذا طلب العميل صراحة وبوضوح هديته أو كود النشاط أو وافق على استلامها بعد أن تعرضها عليه.

• الحالة 1: العميل يسأل "مين أنتم؟" أو "إيه منصة دليلك دي؟":
  - الرد: وضح باختصار وود أننا منصة دليلك المعتمدة لتوثيق الأنشطة والخدمات في مصر وربطها بالعملاء وبخرائط جوجل مجاناً.

• الحالة 2: العميل يسأل "الخدمة دي بفلوس؟" أو "في أي اشتراك أو مصاريف؟":
  - الرد: أكد له بنسبة 100% وبشكل قاطع: التوثيق الرقمي وكود الـ QR وتحديث الأسعار مجاني بالكامل مدى الحياة (0.00 ج.م) وبدون أي التزامات مالية. وإذا رغب في استلام مطبوعات أو باقات إضافية، وضح له باقات دليلك المعتمدة بلطف.

• الحالة 3: العميل يسأل "جبتوا رقمي منين؟" أو "مين سجلني عندكم؟":
  - الرد: اشرح له بلباقة أن فرق التوثيق والمسح الميداني لمنصة دليلك بتنزل تجمع وتوثق الأنشطة المعروفة في المنطقة من خلال اللافتات والبيانات المتاحة للجمهور لخدمة المنطقة.

• الحالة 4: العميل يطلب هديته أو كود الـ QR ("فين الهدية؟" / "ابعتلي الـ QR"):
  - الإجراء: استدعِ فوراً أداة [sendBusinessGiftPackage]، وأخبر العميل أنك تقوم بتجهيز وإرسال كارت الهدية والـ QR الخاص بمنشأته بجودة طباعية عالية الآن.

• الحالة 4-مكرر: العميل يعلق على التصميم أو يسأل عن تصميمات أخرى ("في تصميمات تانية؟" / "التصميم خالي أو بسيط" / "التصميم سيء" / "أنت باعتلي باركود بس"):
  - الإجراء: اعتذر له بلباقة وود مصري راقٍ جداً، وأكد له أن الكود المرسل سابقاً كان المعاينة الأولية السريعة، وأخبره أنك تجهز له الآن «الباقة الإعلانية الفاخرة الكاملة» (4 تصميمات بأعلى دقة طباعة: البوستر الكلاسيكي الفاخر، والنسخة الملكية المذهبة VIP، وستاند الكاونتر الأفقي، وشيت التوزيع والقص الجماعي للطاولات).

• الحالة 4-ثالثاً: العميل يطلب خدمة الطباعة الفاخرة والتوصيل أو يكتب كلمة "(اطبعلي)" أو يسأل عن باقة معينة:
  - الإجراء: رحب بطلبه بحرارة وشغف واشكره على اختياره لخدمات دليلك.
  - إذا طلب الباقة الأساسية للطباعة (100 ج): أكد له أنه تم تسجيل طلبه فوراً وقيمته 100 جنيه فقط شاملة كل شيء (طباعة ملونة فاخرة بدقة 300 DPI + استاند كاونتر أكريليك شفاف + توصيل لنفس موقع المنشأة اليوم)، والدفع كاش عند الاستلام مع المندوب.
  - إذا طلب أو استفسر عن «باقة 250» أو باقة تسويقية أخرى: اشرح له مميزات باقة 250 ج (تشمل 2 استاند أكريليك كاونتر + شيت ملصقات موسع + ترويج بالدليل ودفع كاش عند الاستلام مع المندوب).
  - اطلب منه بلطف تأكيد العنوان الدقيق ورقم التليفون للتسليم إن لم يكن ذكرهما، وأكد له أن منسق التجهيز والتسليم سيتواصل معه قبل التحرك مباشرة. (لا تستدعِ أداة إرسال البوسترات مجدداً إذا كانت قد أُرسلت بالفعل).

• الحالة 5: العميل يريد تسجيل أو تعديل بياناته ("عاوز أسجل محلي" / "عاوز أغير الرقم/العنوان"):
  - الإجراء: استدعِ أداة [updateBusinessInformation] بالبيانات الجديدة التي ذكرها، أو اطلب منه باحترام اسم النشاط وعنوانه لإدراجه.

• الحالة 6: العميل يطلب زيارة مندوب أو تصوير للمكان ("عاوز مندوب يجيلي" / "عاوز حد يصور المحل"):
  - الإجراء: استدعِ أداة [scheduleFieldRepVisit]، وأكد له أنه تم تسجيل طلبه وجدولة زيارة منسق المنطقة للتواصل معه وتحديد الموعد المناسب.

• الحالة 7: العميل غير مهتم أو يطلب حذف الرقم ("مش مهتم" / "احذفوا رقمي" / "بلاش رسايل"):
  - الإجراء: احترم رغبته فوراً واعتذر بذوق رفيع: "حقك علينا يا فندم وشكراً لوقتك، تم إلغاء اشتراك الرقم ولن تصلكم أي رسائل أخرى، ونتمنى لكم كامل التوفيق والنجاح." ولا تواصل النقاش.

• الحالة 8: مناديب ميدانيون أو مسوقون أو باحثون عن عمل يحاولون التواصل ("أنا مندوب" / "عاوز اتواصل مع الإدارة" / "أنا مسوق وعاوز شغل/تنسيق"):
  - التوجيه الصارم الحاسم: وضح له بلباقة واحترافية أن هذا الرقم مخصص حصرياً لخدمة عملاء وأصحاب المنشآت في منصة دليلك، ولكن تم تسجيل بياناته ورقم هاتفه وسيتم إرسالها إلى مسؤولي الإدارة للتواصل معه، وعليه الانتظار حتى يتواصل معه أحد الإداريين.
  - الإجراء البرمجي: استدعِ أداة [forwardRepresentativeInquiryToAdmin] لتسجيل رقمه وتنبيه الإدارة فوراً.

• الحالة 9: كتالوج الباقات الرسمية وقاعدة التسعير السيادية الصارمة (توجيه الإدارة الحاسم):
  - سياسة وقواعد التسعير الصارمة (ممنوع مخالفتها قطعياً):
    1. الرد بالمبالغ المالية والأسعار مسموح فقط وحصرياً لأسعار الباقات الرسمية الموضحة في الكتالوج المعتمد أدناه.
    2. أي استفسارات عن باقات إضافية، كميات خاصة، خدمات غير مسعرة، أو أسعار غير محددة برقم صريح في الكتالوج:
       - يُمنع منعاً باتاً اختلاق أو تخمين أي مبالغ مالية!
       - استدعِ فوراً أداة [forwardCustomPricingInquiryToAdmin] لتسجيل الاستفسار في متابعات النشاط داخل التطبيق وتنبيه الإدارة لمراجعتها والتواصل مع العميل بالسعر.
       - الرد على العميل يكون حصراً: «تم إرسال استعلامكم للمختص وسيقوم بالتواصل معكم مباشرة لتقديم عرض السعر والتفاصيل المناسبة لمنشأتكم 🤝».
  - كتالوج الباقات الرسمية المعتمدة:
${packagesCatalogPrompt}
  - قائمة الخدمات المجانية 100% مدى الحياة:
${freeServicesPrompt}
  - سياسة وقواعد الأسعار والدفع المعتمدة:
    1. الدفع نقداً عند الاستلام فقط (COD) حصرياً عبر المندوب عند تسليم المطبوعات في مقر النشاط بعد المعاينة.
    2. لطلبات الكميات الإضافية أو سلاسل الفروع: قل للعميل باحترام: «تم إرسال استعلامكم للمختص وسيقوم بالتواصل معكم مباشرة لتقديم عرض السعر والتفاصيل المخصصة».
    3. محظورات قطعية: يُمنع منعاً باتاً طلب أي حسابات بنكية أو تحويلات مسبقة عبر فودافون كاش أو انستاباي قبل المعاينة والاستلام مع المندوب.

• الحالة 10: استفسارات الدعم الفني وجودة المسح الضوئي ("الكود مبيفتحش بسرعة في الإضاءة الخافتة" / "الكاميرا مبتلقطش"):
  - الرد والإجراء: اعتذر بلباقة وطمأنه فوراً برسالة نصية ودودة. وضح له أننا نوفر نسخة مخصصة عالية التباين (High Contrast) بأحرف داكنة وهوامش عريضة مصممة خصيصاً للقراءة السريعة في الإضاءات الخافتة وكاميرات الهواتف القديمة، واعرض عليه إرسالها فوراً بدقة 300 DPI مجاناً بدون أي تكلفة، وزوده برقم الدعم الفني إذا طلبه. (ملاحظة هامة: لا تستدعِ أداة [sendBusinessGiftPackage] في هذا الاستفسار الأولي إلا إذا طلب العميل صراحة إرسال النسخة أو قال ياريت تبعتوها لي).

• الحالة 11: المنشآت الطبية والعيادات والمراكز التخصصية ("حجز مواعيد" / "ترخيص وزارة الصحة" / "كروت استقبال عيادات"):
  - الرد والإجراء: وضح له إمكانية إضافة زر حجز مباشر وتحديد مواعيد وتخصصات الأطباء على صفحة المركز في دليلك، مع إمكانية توثيق بيانات الترخيص الطبي. وإذا طلب الباقة الفاخرة المطبوعة للاستقبال، سجل طلبه وعنوانه فوراً لإرسالها.
${customFaqsPrompt}${objectionPrompt}

ضوابط الأمان والمحاكاة البشرية الصارمة (Zero-Detection Rules):
===================================================
1. أسلوبك ونبرتك:
   ${toneStyleGuide}
2. الاختصار والذكاء: لا تكتب فقرات طويلة جداً كأنها مقالات. تحدث بجمل رشيقة وعملية.
3. التنوع: لا تكرر نفس الجمل إذا كان العميل يتابع كلامه في نفس اليوم.
4. الأمانة: لا تخترع أرقام هواتف أو وعوداً مالية غير موجودة بالمنظومة.
5. حظر الاندفاع وإعادة إرسال الهدية إذا اشتكى العميل: إذا اعترض العميل بأن "الرقم غلط" أو "مش بتاعي" أو طلب تعديل، لا ترسل له الهدية ولا تستدعِ sendBusinessGiftPackage، بل اعترف بالخطأ واعتذر بلطف واطلب منه الرقم الصحيح لتصحيحه.
6. روح المرونة والذكاء البشري (حظر التصلب أو الردود المعلبة):
   - أنت لست آلة أسئلة شائعة ولا مجيباً آلياً يرد بجمل محفوظة وجامدة!
   - أنت محاور مصري ذكي وشاطر ومريح جداً، تفهم نية العميل وروحه ولو عبر عنها بأي طريقة عامية أو غير مرتبة.
   - صغ أفكارك ومعلومات المنصة بحرية وبما يناسب نبرة العميل وحالته (إذا كان يمزح لاطفه بود، وإذا كان مستعجلاً اختصر، وإذا كان قلقاً طمئنه).
   - الصرامة تكون فقط في الحفاظ على الأمان والأسعار المعتمدة (الحدود)، أما طريقة الكلام والشرح والترحيب ففيها مرونة وطلاقة كاملة 100%.`;
}

/**
 * 🌐 Resolves Provider Endpoint and Model based on Key Format or Model Name
 * Supports:
 * - Groq (Free Cloud tier, ultra-fast): Keys starting with 'gsk_'
 * - Google Gemini (Free AI Studio tier): Keys starting with 'AIza'
 * - OpenRouter (Free Tier models): Keys starting with 'sk-or-'
 * - xAI Grok: Keys starting with 'xai-'
 */
export function resolveProviderEndpointAndModel(key: string, configuredModel?: string): {
  endpoint: string;
  model: string;
  providerName: string;
} {
  const trimmed = (key || '').trim();

  // Groq (Completely free tier, function calling, ultra-fast)
  if (trimmed.startsWith('gsk_')) {
    const isSupportedGroqModel = configuredModel && (
      configuredModel.includes('gpt-oss') ||
      configuredModel.includes('qwen') ||
      configuredModel.includes('allam')
    );
    return {
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      model: isSupportedGroqModel ? configuredModel! : 'openai/gpt-oss-120b',
      providerName: 'Groq (Free Cloud Tier)',
    };
  }

  // Google Gemini AI Studio (Free tier)
  if (trimmed.startsWith('AIza')) {
    const isGeminiModel = configuredModel && configuredModel.includes('gemini');
    return {
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      model: isGeminiModel ? configuredModel! : 'gemini-1.5-flash',
      providerName: 'Google Gemini (Free AI Studio)',
    };
  }

  // OpenRouter
  if (trimmed.startsWith('sk-or-')) {
    return {
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      model: configuredModel || 'meta-llama/llama-3.3-70b-instruct:free',
      providerName: 'OpenRouter (Free Tier)',
    };
  }

  // Default: xAI Grok
  return {
    endpoint: 'https://api.x.ai/v1/chat/completions',
    model: configuredModel || 'grok-2-mini',
    providerName: 'xAI Grok',
  };
}

/**
 * 🚀 Processes an Incoming WhatsApp Message through the Grok AI Agent
 */
// Active Presence Tracker to keep account 'available' (Online) naturally during conversations
let presenceRetentionTimer: NodeJS.Timeout | null = null;

function schedulePresenceRetention(senderSock: any, targetJid: string, durationMs = 45000) {
  if (presenceRetentionTimer) {
    clearTimeout(presenceRetentionTimer);
    presenceRetentionTimer = null;
  }
  if (!senderSock?.sendPresenceUpdate) return;

  senderSock.sendPresenceUpdate('available').catch(() => {});
  senderSock.sendPresenceUpdate('available', targetJid).catch(() => {});

  presenceRetentionTimer = setTimeout(() => {
    senderSock.sendPresenceUpdate('unavailable').catch(() => {});
    senderSock.sendPresenceUpdate('unavailable', targetJid).catch(() => {});
    presenceRetentionTimer = null;
  }, durationMs);
}
const conversationProcessingLocks = new Map<string, Promise<any>>();
const processedIncomingMessageIds = new Map<string, number>();

function isDuplicateIncomingMessage(messageKeyId?: string, cleanPhone?: string, text?: string): boolean {
  const key = messageKeyId ? `id_${messageKeyId}` : `txt_${cleanPhone || ''}_${(text || '').trim().slice(0, 50)}`;
  if (!key || key === 'txt__') return false;
  const now = Date.now();
  for (const [k, ts] of processedIncomingMessageIds.entries()) {
    if (now - ts > 300000) processedIncomingMessageIds.delete(k);
  }
  if (processedIncomingMessageIds.has(key)) {
    const elapsed = now - (processedIncomingMessageIds.get(key) || 0);
    if (elapsed < 60000) {
      return true;
    }
  }
  processedIncomingMessageIds.set(key, now);
  return false;
}

/**
 * 🤖 Central Inbound Processor for WhatsApp Messages
 * Serializes messages per phone number to prevent overlapping generation or race conditions.
 */
export async function processIncomingWhatsAppMessage(params: {
  rawPhone: string;
  incomingText: string;
  slotId: string;
  senderSock: any;
  messageKey?: any;
  isSimulation?: boolean;
}): Promise<{
  handled: boolean;
  replyText?: string;
  actionExecuted?: string;
  reason?: string;
  detectedIntent?: string;
}> {
  // 🌟 UNIVERSAL SLOT CAPABILITY: Slot 1, Slot 2, and any future slots act as active AI Customer Service Agents.

  const cleanPhone = params.rawPhone.replace(/\D/g, '');

  // 🛡️ INBOUND MESSAGE DEDUPLICATION (60s Sliding Window - skipped in simulation):
  // Eliminates race conditions and duplicate webhook events
  if (!params.isSimulation && isDuplicateIncomingMessage(params.messageKey?.id, cleanPhone, params.incomingText)) {
    console.log(`🛡️ [Deduplication] Inbound message from ${cleanPhone} (${params.messageKey?.id || 'text-hash'}) received again within 60s. Skipping duplicate.`);
    return { handled: true, reason: 'Duplicate message filtered by deduplication cache' };
  }

  const prevPromise = conversationProcessingLocks.get(cleanPhone) || Promise.resolve();

  const currentPromise = (async () => {
    try {
      await prevPromise;
    } catch (err) {
      console.warn(`[AI Agent Queue] Previous turn error for ${cleanPhone}:`, err);
    }
    return await executeProcessIncomingWhatsAppMessage(params, cleanPhone);
  })();

  conversationProcessingLocks.set(cleanPhone, currentPromise);
  return currentPromise;
}

async function executeProcessIncomingWhatsAppMessage(
  params: {
    rawPhone: string;
    incomingText: string;
    slotId: string;
    senderSock: any;
    messageKey?: any;
    isSimulation?: boolean;
  },
  cleanPhone: string
): Promise<{
  handled: boolean;
  replyText?: string;
  actionExecuted?: string;
  reason?: string;
  detectedIntent?: string;
}> {
  const { rawPhone, incomingText, slotId, senderSock, messageKey } = params;
  const config = getWhatsAppAiConfig();

  if (!config.enabled) {
    return { handled: false, reason: 'AI Agent is globally disabled in settings' };
  }

  if (!config.apiKey) {
    console.warn('[AI Agent] Missing GROK_API_KEY. AI auto-reply cannot proceed.');
    return { handled: false, reason: 'Missing GROK_API_KEY' };
  }

  if (isConversationMuted(cleanPhone)) {
    console.log(`👤 [Human Takeover] Message from ${cleanPhone} skipped because conversation is muted for human management.`);
    return { handled: false, reason: 'Conversation is currently muted for human takeover' };
  }

  // 1. Load Conversation History FIRST
  const conversations = loadConversations();
  const thread = conversations[cleanPhone] || {
    phone: cleanPhone,
    businessId: undefined,
    businessName: 'مستفسر عام',
    messages: [],
  };

  // 🕒 Session Window Check (Dual-Layer Memory):
  // If more than 24 hours passed since last message, start a fresh dialogue turn while preserving business identity
  const lastIncomingTime = thread.lastIncomingAt ? new Date(thread.lastIncomingAt).getTime() : 0;
  const hoursSinceLastMessage = lastIncomingTime ? (Date.now() - lastIncomingTime) / (1000 * 60 * 60) : 0;
  if (hoursSinceLastMessage > 24 && thread.messages.length > 0) {
    console.log(`🔄 [Session Renewal] ${hoursSinceLastMessage.toFixed(1)}h since last message from ${cleanPhone}. Opening fresh dialogue session while retaining permanent dossier.`);
    thread.messages = [];
  }

  // 2. Identify Business Context (Phone -> Message Text/URL -> Existing Thread History)
  let biz = findBusinessByPhone(rawPhone);
  if (!biz) {
    biz = findBusinessByIdOrText(incomingText);
  }
  if (!biz && thread.businessId) {
    biz = findBusinessById(thread.businessId);
  }

  // Preserve identified business identity - NEVER overwrite with 'مستفسر عام' once identified!
  if (biz) {
    thread.businessId = biz.id;
    thread.businessName = biz.nameAr || biz.name || thread.businessName;
  }
  const venueName: string = (biz ? (biz.nameAr || biz.name) : '') || (thread.businessName !== 'مستفسر عام' ? thread.businessName : '') || 'مستفسر عام';

  thread.lastIncomingAt = new Date().toISOString();
  thread.businessId = biz?.id || thread.businessId;
  thread.businessName = venueName;

  thread.messages.push({
    role: 'user',
    content: incomingText,
    timestamp: new Date().toISOString(),
  });

  // 🧹 Auto-Pruning: Sliding window of 14 messages to prevent prompt bloat while maintaining hot context
  if (thread.messages.length > 14) {
    thread.messages = thread.messages.slice(-14);
  }

  conversations[cleanPhone] = thread;
  saveConversations(conversations);

  const incomingLower = (incomingText || '').toLowerCase();
  const hasNegativeIntent = /مش\s*عاوز|مش\s*عايز|مش\s*بتاعي|مش\s*بتاعتي|الرقم\s*غلط|رقم\s*غلط|شيل\s*الرقم|امسح\s*الرقم|الغي|إلغي|غير\s*التصميم|بدل\s*التصميم|تصميم\s*قديم|مش\s*عاجبني|سيء|سئ|وحش/i.test(incomingLower);

  // 🛑 ANTI-BAN CRITICAL: Instant Opt-Out / Do-Not-Contact Handshake
  const isOptOutRequest =
    /^(توقف|stop|إلغاء|الغي|الغي\s*رقمي|احذف\s*رقمي|مش\s*عاوز\s*رسائل|مش\s*عايز\s*رسائل|مش\s*عاوز\s*رسايل|مش\s*عايز\s*رسايل|unsubscribe)$/i.test(incomingLower.trim()) ||
    /(شيل\s*رقمي\s*من\s*عندكم|بلاش\s*رسائل|ماتبعتوش\s*تاني|ما\s*تبعتوش|عدم\s*الإزعاج)/i.test(incomingLower);

  if (isOptOutRequest) {
    console.log(`🛑 [Opt-Out Detected] Customer ${cleanPhone} requested to unsubscribe. Honoring request immediately.`);
    saveOptOut(cleanPhone, `طلب العميل: "${incomingText}"`);
    muteConversationForHuman(cleanPhone, 43200); // 30 days mute

    const optOutAck = 'تم إلغاء رقمكم من قائمة الإرسال بالكامل يا فندم ولن تصلكم أي رسائل تسويقية مرة أخرى. نعتذر لحضرتك تماماً وشكراً لتفهمك! 🙏💐';
    const targetJid = rawPhone.includes('@') ? rawPhone : `${cleanPhone}@s.whatsapp.net`;
    if (senderSock?.sendMessage) {
      await senderSock.sendMessage(targetJid, { text: optOutAck }).catch(() => {});
    }
    return {
      handled: true,
      replyText: optOutAck,
      actionExecuted: 'opt_out_unsubscribed',
    };
  }

  // 🖨️ Detect Print Order Request ("اطبعلي" / "خدمة الطباعة") - ONLY if not negative
  if (biz && (/اطبع|طباعة|طبعلي|توصيل/i.test(incomingText)) && !hasNegativeIntent) {
    recordAdminFollowUp(
      biz.id,
      `طلب العميل خدمة الطباعة الفاخرة والتوصيل (100 ج) عبر الواتساب بنص: "${incomingText}". مطلوب تحويل الطلب لقسم التجهيز الميداني والتواصل لترتيب الاستلام.`,
      'visit',
      'pending'
    );
  }

  const targetJid = rawPhone.includes('@') ? rawPhone : `${cleanPhone}@s.whatsapp.net`;

  // 3. 🚀 PARALLEL AI GENERATION (Starts immediately in background during stealth delay)
  const availableKeys = [
    ...(Array.isArray(config.apiKeys) ? config.apiKeys : []),
    config.apiKey,
  ].map((k) => String(k || '').trim()).filter(Boolean);
  const candidateKeys = Array.from(new Set(availableKeys));

  if (candidateKeys.length === 0) {
    console.warn('[AI Agent] No valid Grok API Keys configured.');
    return { handled: false, reason: 'No valid Grok API Keys configured' };
  }

  const systemPrompt = buildSystemPrompt(biz, config.tone);
  // Keep last 8 messages (4 human + 4 AI) to ensure prompt stays within Groq TPM limits
  const recentMessages = (thread.messages || []).slice(-8);
  const messagesPayload = [
    { role: 'system', content: systemPrompt },
    ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const generateReplyPromise = (async () => {
    let apiResponse: Response | null = null;
    let lastErrorText = '';

    for (let i = 0; i < candidateKeys.length; i++) {
      const currentKey = candidateKeys[i];
      const provider = resolveProviderEndpointAndModel(currentKey, config.model);
      const modelsToTry = provider.endpoint.includes('groq.com')
        ? [provider.model, 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'groq/compound-mini', 'allam-2-7b'].filter((v, idx, arr) => arr.indexOf(v) === idx)
        : [provider.model];

      for (const targetModel of modelsToTry) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 22000);

          const isAllam = targetModel.includes('allam');
          const supportsTools = !isAllam && !targetModel.includes('compound');
          const payloadToSend = isAllam
            ? [
                { role: 'system', content: systemPrompt.slice(0, 1800) },
                ...recentMessages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
              ]
            : messagesPayload;

          const reqBody: any = {
            model: targetModel,
            messages: payloadToSend,
            temperature: 0.7,
          };
          if (supportsTools) {
            reqBody.tools = GROK_TOOLS;
            reqBody.tool_choice = 'auto';
          }

          const resp = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${currentKey}`,
            },
            body: JSON.stringify(reqBody),
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (resp.ok) {
            apiResponse = resp;
            console.log(`✨ [AI Agent] Succeeded using key #${i + 1} via ${provider.providerName} (model: ${targetModel})`);
            break;
          } else {
            lastErrorText = await resp.text();
            console.warn(
              `⚠️ [AI Agent] Key #${i + 1} (${targetModel}) failed (HTTP ${resp.status}): ${lastErrorText.slice(0, 140)}`
            );
            if (resp.status !== 429 && resp.status !== 400 && resp.status !== 503) {
              break;
            }
          }
        } catch (keyErr: any) {
          lastErrorText = keyErr?.message || 'Network error';
          console.warn(`⚠️ [AI Agent] Key #${i + 1} (${targetModel}) request error: ${lastErrorText}`);
          break;
        }
      }
      if (apiResponse && apiResponse.ok) break;
    }

    if (!apiResponse || !apiResponse.ok) {
      console.error(`[AI Agent] All ${candidateKeys.length} Grok API keys exhausted:`, lastErrorText);
      return null;
    }

    const resJson: any = await apiResponse.json();
    return resJson.choices?.[0]?.message || null;
  })();

  // 4. 🛡️ NATURAL HUMAN STEALTH DELAY (Anti-Bot Zero-Detection)
  // Check if this is an ongoing back-and-forth active conversation (within 90s of our last reply)
  const nowMs = Date.now();
  const lastReplyTimeMs = thread.lastReplyAt ? new Date(thread.lastReplyAt).getTime() : 0;
  const isOngoingActiveChat = (nowMs - lastReplyTimeMs) < 90000;

  // 🧘 Realistic Human Pacing Delay (Per User Directive):
  // Ongoing chat: 14 to 20 seconds silent reading & reflection
  // New inbound message: 18 to 26 seconds silent reading & reflection
  const reactionDelaySec = isOngoingActiveChat
    ? Math.floor(14 + Math.random() * 7)
    : Math.floor(18 + Math.random() * 9);

  if (!params.isSimulation) {
    console.log(`⏳ [AI Agent] Stealth Reaction (${isOngoingActiveChat ? 'Active Thread' : 'New Inbound'}): Waiting ${reactionDelaySec}s silently before reading for ${cleanPhone}...`);
    await new Promise((r) => setTimeout(r, reactionDelaySec * 1000));
  }

  // 5. Mark Message as Read (Blue Ticks) ONLY AFTER the stealth delay finishes
  if (senderSock?.readMessages && messageKey) {
    try {
      await senderSock.readMessages([messageKey]).catch(() => {});
    } catch {}
  }

  // 🛡️ Set presence to 'available' (متصل الآن) as the human opened WhatsApp
  if (senderSock?.sendPresenceUpdate) {
    try {
      await senderSock.presenceSubscribe?.(targetJid).catch(() => {});
      await senderSock.sendPresenceUpdate('available').catch(() => {});
      await senderSock.sendPresenceUpdate('available', targetJid).catch(() => {});
    } catch {}
  }

  // 6. Brief natural pause after opening chat (1.2s - 2.2s)
  if (!params.isSimulation) {
    await new Promise((r) => setTimeout(r, Math.floor(1200 + Math.random() * 1000)));
  }

  // 7. Await the pre-generated API message
  const responseMessage = await generateReplyPromise;
  if (!responseMessage) {
    return { handled: false, reason: 'Empty or failed response from Grok' };
  }

  let replyText = responseMessage.content || '';
  let actionExecuted = 'none';
  let actionDetails: any = null;
  let detectedIntent = 'general_inquiry';

  // 8. Handle Tool Calls / Autonomous Actions
  if (Array.isArray(responseMessage.tool_calls) && responseMessage.tool_calls.length > 0) {
    for (const toolCall of responseMessage.tool_calls) {
      const fnName = toolCall.function?.name;
      let fnArgs: any = {};
      try {
        fnArgs = JSON.parse(toolCall.function?.arguments || '{}');
      } catch {}

      console.log(`⚙️ [AI Agent] Grok invoked function: ${fnName}`, fnArgs);

      if (fnName === 'sendBusinessGiftPackage' && config.autoGiftEnabled) {
        // 🛑 1. PURE GREETING & INITIAL INQUIRY GUARD:
        // NEVER send gift packages if the incoming message is just a greeting ("السلام عليكم", "صباح الخير", etc.)
        // or a general inquiry without explicit request for gifts/QR!
        const isPureGreetingOrGeneralInquiry = /^(السلام\s*عليكم|سلام\s*عليكم|وعليكم\s*السلام|صباح\s*الخير|صباح\s*النور|مساء\s*الخير|مساء\s*النور|أهلاً|اهلا|مرحبا|هاي|hello|hi|شكرا|شكراً|لو\s*سمحت|يا\s*فندم|مين\s*معايا|ازيك|ازيكم|تمام|الحمد\s*لله|الله\s*يسلمك|الله\s*يبارك\s*فيك|مين\s*حضرتك|خدمة\s*العملاء|مين\s*أنتم|مين\s*انتم)(\s+ورحمة\s+الله\s+وبركاته)?\s*[!؟?.]*$/i.test(incomingText.trim());
        if (isPureGreetingOrGeneralInquiry) {
          console.warn(`🛑 [AI Agent Greeting Guard] Blocked sendBusinessGiftPackage on pure greeting/inquiry: "${incomingText}"`);
          detectedIntent = 'greeting';
          actionExecuted = 'blocked_gift_on_greeting';
          const venueGreeting = venueName && venueName !== 'مستفسر عام' ? ` وبمنشأة «${venueName}» الكريمة` : '';
          replyText = `وعليكم السلام ورحمة الله وبركاته يا فندم! 🌟 أهلاً وسهلاً بحضرتك في منصة دليلك${venueGreeting}. تشرفنا بك، كيف نقدر نساعدك أو نخدم منشأتكم الكريمة اليوم؟`;
          continue;
        }

        // 🛑 2. NEGATIVE INTENT & OBJECTION GUARD:
        // If customer is objecting, complaining of a wrong number, or asking to change/remove data,
        // DO NOT resend the gift package! Intercept and resolve the objection.
        if (hasNegativeIntent) {
          console.warn(`🛑 [AI Agent Negative Guard] Blocked sendBusinessGiftPackage because customer expressed objection/negation: "${incomingText}"`);
          detectedIntent = 'objection_or_data_correction';
          actionExecuted = 'blocked_gift_resend';

          const isPhoneError = /الرقم\s*غلط|رقم\s*غلط|مش\s*بتاعي|مش\s*بتاعتي|شيل\s*الرقم|امسح\s*الرقم/i.test(incomingLower);
          const isNotMyBusiness = /مش\s*بتاعي|مش\s*بتاعتي|مش\s*أنا|مش\s*انا|غلطان|رقم\s*غلط/i.test(incomingLower);
          if (isNotMyBusiness) {
            thread.businessId = undefined;
            thread.businessName = 'مستفسر عام';
          }

          if (biz) {
            recordAdminFollowUp(
              biz.id,
              `اعتراض من العميل عبر الواتساب: "${incomingText}". مطلوب مراجعة بيانات وتصميم المنشأة والتواصل للتصحيح.`,
              'general',
              'pending'
            );
          }

          if (isPhoneError) {
            replyText = `حقك علينا يا فندم وألف اعتذار عن أي خطأ في رقم الهاتف بالملصق! 🙏 تم تسجيل ملاحظتك فوراً لحذف وتعديل الرقم، ونحن بنجهز لحضرتك تصميماً مصححاً بالكامل وبدون هذا الرقم أو بالرقم المعتمد الذي تفضله. تحب نعتمد رقم هاتف أو واتساب بديل محدد للمحل؟`;
          } else {
            replyText = `أعتذر جداً لحضرتك يا فندم وحقك علينا تماماً! 🙏 تم تسجيل ملاحظتك باهتمام، ونحن تحت أمرك في أي تعديل تطلبه على التصميم أو البيانات. وضح لنا ما تود تغييره وسنقوم بتنفيذه فوراً.`;
          }
          continue;
        }

        detectedIntent = 'request_gift_or_qr';
        actionExecuted = 'sent_gift_qr';
        if (!biz && fnArgs) {
          biz = findBusinessByIdOrText(fnArgs.businessName || fnArgs.reason || fnArgs.businessId || '');
          if (biz) {
            thread.businessId = biz.id;
            thread.businessName = biz.nameAr || biz.name || thread.businessName;
          }
        }

        if (slotId !== '1') {
          // 🛡️ ARCHITECTURAL ROUTING DIRECTIVE: ONLY Slot 1 is authorized to dispatch QR/barcode media files.
          console.log(`🛡️ [Slot Routing Guard] Gift media bundle request intercepted on Slot ${slotId}. Guiding client to website portal.`);
          replyText = `أهلاً وسهلاً بحضرتك يا فندم! 🎁 كروت وملصقات الـ QR المعتمدة وتصاميم الهدايا يتم إصدارها وإرسالها لكم تلقائياً من المركز الرقمي الرئيسي (الخط الرسمي 1) بمجرد طلب الهدية من خلال رابط صفحتكم بالدليل:\n🔗 ${biz ? getDisplayDirectoryUrl(biz) : 'https://dalilaak.com'}\n\nتفضل بالدخول على الرابط واضغط على زر طلب الهدية المجانية وسيقوم النظام بإرسال كافة التصاميم فوراً 🤝`;
          actionExecuted = 'guided_to_website_gift_portal';
        } else if (biz) {
          try {
            const shouldHidePhone = Boolean(
              fnArgs?.hidePhone === true ||
              /شيل\s*الرقم|احذف\s*الرقم|بدون\s*رقم|من\s*غير\s*رقم|ماتحطش\s*رقم|امسح\s*الرقم/i.test(incomingText)
            );
            const customPhoneArg = fnArgs?.customPhone ? String(fnArgs.customPhone).trim() : undefined;
            const giftPkg = await prepareBusinessGiftPackage(biz, {
              hidePhone: shouldHidePhone,
              customPhone: customPhoneArg,
              forceRegenerate: shouldHidePhone || Boolean(customPhoneArg),
            });
            const itemsToSend = giftPkg.bundle && giftPkg.bundle.length > 0
              ? giftPkg.bundle
              : [{ buffer: giftPkg.buffer, caption: giftPkg.caption, title: 'ملصق الـ QR' }];

            console.log(`🎁 [AI Agent] Sending gift bundle (${itemsToSend.length} designs) to ${cleanPhone} (${venueName})...`);

            for (let i = 0; i < itemsToSend.length; i++) {
              const item = itemsToSend[i];
              const sendPromise = senderSock.sendMessage(targetJid, {
                image: item.buffer,
                caption: item.caption,
              });
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Media send timeout after 12s on design ${i + 1}`)), 12000)
              );
              await Promise.race([sendPromise, timeoutPromise]);
              console.log(`✅ [AI Agent] Sent bundle item ${i + 1}/${itemsToSend.length} (${(item as any).title || 'ملصق'}) to ${targetJid}`);

              // Anti-flood pacing delay (2s) between images
              if (i < itemsToSend.length - 1) {
                await new Promise(res => setTimeout(res, 2000));
              }
            }

            recordDeliveredGift({
              businessId: biz.id,
              businessName: venueName,
              phone: cleanPhone,
              deliveredAt: new Date().toISOString(),
              source: giftPkg.source,
              targetUrl: giftPkg.targetUrl,
            });

            // 📝 Dual-Layer: Automatically record in core Dalilak admin follow-up ledger
            recordAdminFollowUp(
              biz.id,
              `تم تسليم باقة ملصقات الـ QR وتصاميم الهدية للعميل (${venueName}) عبر الواتساب بنجاح.`,
              'general',
              'completed'
            );

            if (!replyText) {
              const alreadyDelivered = getDeliveredGifts().some(g => g.phone === cleanPhone || (biz && g.businessId === biz.id));
              if (alreadyDelivered) {
                replyText = `تم إعادة إرسال باقة تصاميم كارت الـ QR المعتمدة لحضرتك في الصورة أعلاه بنجاح 🎁✨! يسعدنا دائماً خدمتكم يا فندم ونتمنى لكم كامل التوفيق.`;
              } else {
                replyText = `تم إرسال كارت الـ QR والهدية الترويجية المعتمدة لحضرتك في الصورة أعلاه بنجاح 🎁✨! يسعدنا دائماً خدمتكم.`;
              }
            }
          } catch (giftErr: any) {
            console.error('[AI Agent] Failed or timed out sending gift package:', giftErr);
            // 🛡️ Resilient fallback: Ensure business link and congratulations are always delivered even if image fails
            if (!replyText) {
              replyText = `ألف مبروك لإدارة «${venueName}» الكرام 💐🎁\nيسعدنا إهداؤكم كارت الـ QR الذكي والهدية الترويجية المعتمدة لمنشأتكم في منصة «دليلك»:\n🔗 رابط صفحتكم المباشر بالدليل:\n${getDisplayDirectoryUrl(biz)}\n\nيسعدنا دائماً خدمتكم!`;
            }
          }
        } else {
          // If business context is not yet identified
          if (!replyText) {
            const low = (incomingText || '').toLowerCase();
            if (low.includes('تصميم') || low.includes('سئ') || low.includes('سيء') || low.includes('تاني') || low.includes('غير') || low.includes('وحش') || low.includes('فاضي')) {
              replyText = `حقك علينا تماماً يا فندم! كود الـ QR المرسل كان المعاينة الأولية السريعة، ونحن حالياً نجهز لحضرتك الباقة الإعلانية الكاملة الفاخرة (4 تصاميم جاهزة للطباعة: الكلاسيكي الفاخر، والملكي المذهب VIP، وستاند الكاونتر، وشيت الطاولات) وهتوصلك حالاً فور اكتمال التوليد!`;
            } else {
              replyText = `أهلاً وسهلاً بحضرتك في منصة دليلك 🎁! يسعدنا جداً إهداؤكم كارت الـ QR والهدية الترويجية المعتمدة مجاناً (0.00 ج). من فضلك شاركنا اسم منشأتكم الكريمة وعنوانها أو رابط صفحتكم بالدليل لنجهزه ونرسله لك فوراً.`;
            }
          }
        }
      } else if (fnName === 'updateBusinessInformation' && config.autoUpdateBusinessEnabled && biz) {
        detectedIntent = 'update_business_info';
        actionExecuted = 'updated_business_info';
        actionDetails = fnArgs;

        const updates: Partial<Business> = {};
        if (fnArgs.updatedPhone) updates.phone = fnArgs.updatedPhone;
        if (fnArgs.updatedNotes) updates.notes = fnArgs.updatedNotes;
        if (fnArgs.updatedHours) updates.workingHours = fnArgs.updatedHours;
        updateBusinessRecord(biz.id, updates);
        if (!replyText) {
          replyText = `تم تحديث بيانات منشأتكم الكريمة بالدليل بنجاح يا فندم ✓. شاكرين لحضرتك حرصكم على دقة البيانات.`;
        }
      } else if (fnName === 'scheduleFieldRepVisit' && config.autoRepLeadEnabled && biz) {
        detectedIntent = 'schedule_rep_visit';
        actionExecuted = 'scheduled_rep_visit';
        actionDetails = fnArgs;

        recordRepLead(biz, fnArgs.clientRequest || 'طلب زيارة ميدانية', fnArgs.preferredTime);
        if (!replyText) {
          replyText = `تم تسجيل طلبكم وسيتواصل منسق المنطقة الميداني معكم لترتيب الموعد والتفاصيل 🤝.`;
        }
      } else if (fnName === 'activateDirectoryBadge' && biz) {
        detectedIntent = 'activate_badge';
        actionExecuted = 'activated_badge';
        actionDetails = fnArgs;

        updateBusinessRecord(biz.id, { verificationStatus: 'verified', publishedStatus: 'published' });
        if (!replyText) {
          replyText = `ألف مبروك! تم اعتماد وتفعيل بطاقة منشأتكم رسمياً بالدليل العام ✓. رابط صفحتكم المباشر:\n${getDisplayDirectoryUrl(biz)}`;
        }
      } else if (fnName === 'escalateToHumanAdmin') {
        detectedIntent = 'escalate_to_human';
        actionExecuted = 'escalated_to_admin';
        actionDetails = fnArgs;

        muteConversationForHuman(cleanPhone, 1440);
        if (!replyText) {
          replyText = `تحياتنا لحضرتك يا فندم، تم تحويل استفساركم لمسؤول الإدارة المباشر وسيتواصل معكم فوراً 🤝.`;
        }
      } else if (fnName === 'forwardRepresentativeInquiryToAdmin') {
        detectedIntent = 'rep_inquiry_forward';
        actionExecuted = 'forwarded_rep_to_admin';
        actionDetails = fnArgs;

        recordRepresentativeInquiry(cleanPhone, fnArgs.repName, fnArgs.inquiryDetails);
        if (!replyText) {
          replyText = `أهلاً بحضرتك يا فندم. نود التوضيح أن هذا الرقم مخصص حصرياً لخدمة عملاء وأصحاب المنشآت بالدليل، ولكن تم تسجيل بياناتكم ورقمكم وسيتم إرسالها فوراً إلى مسؤولي الإدارة للتواصل معكم قريباً. يرجى التفضل بالانتظار وسيتواصل معكم أحد الإداريين. بالتوفيق دائماً 🤝`;
        }
      } else if (fnName === 'forwardCustomPricingInquiryToAdmin') {
        detectedIntent = 'custom_pricing_inquiry';
        actionExecuted = 'forwarded_custom_pricing_to_admin';
        actionDetails = fnArgs;

        const clientReq = fnArgs.clientInquiry || incomingText;
        if (biz) {
          // 📝 Record in business follow-up notes inside the application for admin review
          recordAdminFollowUp(
            biz.id,
            `استفسار عن سعر أو باقة إضافية غير محددة: "${clientReq}". مطلوب مراجعة الحسابات وتزويد العميل بالسعر المخصص والتواصل معه.`,
            'general',
            'pending'
          );
          recordRepLead(biz, `طلب تسعير خاص/باقة إضافية: ${clientReq}`, fnArgs.preferredContactTime || 'في أقرب وقت ممكن');
        } else {
          let leads: InterestedLead[] = [];
          if (fs.existsSync(LEADS_STORE_PATH)) {
            try { leads = JSON.parse(fs.readFileSync(LEADS_STORE_PATH, 'utf-8')); } catch {}
          }
          const nowIso = new Date().toISOString();
          const newLead: InterestedLead = {
            id: `lead_price_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            clientName: thread.businessName && thread.businessName !== 'مستفسر عام' ? thread.businessName : `عميل واتساب (${cleanPhone})`,
            businessName: thread.businessName || 'مستفسر عام',
            phone: cleanPhone,
            governorate: 'الجيزة',
            city: 'حدائق الأهرام',
            interestLevel: 'high',
            notes: `استفسار عن أسعار مخصصة أو باقات إضافية: "${clientReq}" (الموعد المفضل: ${fnArgs.preferredContactTime || 'في أقرب وقت ممكن'})`,
            adminFollowUps: [
              {
                id: `fu_price_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                authorId: 'whatsapp_ai_agent',
                authorName: 'المساعد الذكي (واتساب دليلك)',
                authorRole: 'system',
                type: 'general',
                status: 'pending',
                category: 'whatsapp',
                text: `استفسار عن سعر أو باقة إضافية: "${clientReq}". مطلوب تزويد العميل بالسعر المخصص والتواصل معه.`,
                createdAt: nowIso,
              },
            ],
            createdDate: nowIso,
            repId: 'rep_1',
            repName: 'إدارة الحسابات',
            status: 'pending_followup',
          };
          leads.unshift(newLead);
          atomicWriteFileSync(LEADS_STORE_PATH, JSON.stringify(leads, null, 2));
        }

        if (!replyText) {
          replyText = `تم إرسال استعلامكم لمسؤول الحسابات المختص وسيقوم بالتواصل معكم مباشرة لتقديم عرض السعر والتفاصيل المخصصة لمنشأتكم 🤝`;
        }
      }
    }
  }

  // 👔 Heuristic Safety Net: If caller is a representative/marketer asking to contact administration
  if (!actionExecuted || actionExecuted === 'none') {
    const isRepQuery = /مندوب|مسوق|مندوبين|شغل مناديب|وظيفة مندوب|توزيع ميداني/i.test(incomingText);
    if (isRepQuery) {
      detectedIntent = 'rep_inquiry_forward';
      actionExecuted = 'forwarded_rep_to_admin';
      recordRepresentativeInquiry(cleanPhone, undefined, incomingText);
      replyText = `أهلاً بحضرتك يا فندم. نود التوضيح أن هذا الرقم مخصص حصرياً لخدمة عملاء وأصحاب المنشآت في منصة دليلك. تم تسجيل بياناتكم ورقمكم وسيتم إرسالها فوراً إلى مسؤولي الإدارة للتواصل معكم قريباً. يرجى التفضل بالانتظار وسيتواصل معكم أحد الإداريين. بالتوفيق دائماً 🤝`;
    }
  }

  // 🛡️ SOVEREIGN PRICING DIRECTIVE GUARD:
  // "الرد بالمبالغ فقط يكون على اسعار الباقات الموضحة فقط , اي استفسارات عن باقات اضافية او اسعار غير محددة في الباقات
  // يقوم بالرد انه تم ارسال الاستعلام للمختص وسوف يرسل له السعر , ويقوم بارسال الاستفسار للاداري , او تسجيل الاستفسار في المتابعات داخل التطبيق نفسة للنشاط"
  const isCustomOrUnlistedPriceQuery = /باقات\s*إضافية|باقة\s*إضافية|سعر\s*خاص|عرض\s*سعر|كميات\s*كبيرة|فروع\s*زيادة|استاندات\s*إضافية|تسعير\s*خاص/i.test(incomingText);
  if (isCustomOrUnlistedPriceQuery && (!actionExecuted || actionExecuted === 'none' || !replyText.includes('المختص'))) {
    console.log(`🛡️ [AI Agent Pricing Boundary] Intercepted unlisted pricing query from ${cleanPhone}. Recording in admin follow-up and leads.`);
    detectedIntent = 'custom_pricing_inquiry';
    actionExecuted = 'forwarded_custom_pricing_to_admin';
    if (biz) {
      recordAdminFollowUp(
        biz.id,
        `استفسار عن باقات إضافية أو تسعير مخصص: "${incomingText}". تم إرسال الاستعلام للمختص وسيتواصل مع العميل لتزويده بالسعر.`,
        'general',
        'pending'
      );
      recordRepLead(biz, `استفسار تسعير خاص/باقة إضافية: ${incomingText}`, 'في أقرب وقت ممكن');
    } else {
      let leads: InterestedLead[] = [];
      if (fs.existsSync(LEADS_STORE_PATH)) {
        try { leads = JSON.parse(fs.readFileSync(LEADS_STORE_PATH, 'utf-8')); } catch {}
      }
      const nowIso = new Date().toISOString();
      const newLead: InterestedLead = {
        id: `lead_price_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        clientName: thread.businessName && thread.businessName !== 'مستفسر عام' ? thread.businessName : `عميل واتساب (${cleanPhone})`,
        businessName: thread.businessName || 'مستفسر عام',
        phone: cleanPhone,
        governorate: 'الجيزة',
        city: 'حدائق الأهرام',
        interestLevel: 'high',
        notes: `استفسار عن أسعار مخصصة/باقات إضافية: "${incomingText}"`,
        adminFollowUps: [
          {
            id: `fu_price_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            authorId: 'whatsapp_ai_agent',
            authorName: 'المساعد الذكي (واتساب دليلك)',
            authorRole: 'system',
            type: 'general',
            status: 'pending',
            category: 'whatsapp',
            text: `استفسار عن باقات إضافية أو تسعير مخصص: "${incomingText}". تم إرسال الاستعلام للمختص وسيتواصل مع العميل لتزويده بالسعر.`,
            createdAt: nowIso,
          },
        ],
        createdDate: nowIso,
        repId: 'rep_1',
        repName: 'إدارة الحسابات',
        status: 'pending_followup',
      };
      leads.unshift(newLead);
      atomicWriteFileSync(LEADS_STORE_PATH, JSON.stringify(leads, null, 2));
    }
    replyText = `تم إرسال استعلامكم لمسؤول الحسابات المختص وسيقوم بالتواصل معكم مباشرة لتقديم عرض السعر والتفاصيل المخصصة لمنشأتكم 🤝`;
  }

  // 🛡️ Zero-Silence Absolute Guarantee: Under no circumstances should the bot stay silent
  if (!replyText || !replyText.trim()) {
    if (biz) {
      replyText = `أهلاً وسهلاً بحضرتك وبإدارة «${venueName}» في منصة دليلك 💐. تحت أمركم يا فندم، رابط صفحتكم بالدليل العام:\n${getDisplayDirectoryUrl(biz)}\nقول لنا إزاي نقدر نساعدك اليوم؟`;
    } else {
      replyText = `أهلاً وسهلاً بحضرتك في منصة دليلك! 😊 إحنا منصة دليلك المتخصصة في توثيق الأنشطة والخدمات في مصر. تحت أمرك يا فندم، قول لي إزاي نقدر نساعدك اليوم؟`;
    }
  }

  // 🛡️ RUNTIME CONTENT & PRICING SANITIZER:
  // Strictly prevent prohibited advance wire transfers, unapproved bank accounts, or fraudulent terms from reaching WhatsApp
  const prohibitedPaymentTermsRegex = /حوالة|تحويل\s*بنكي|حساب\s*بنكي|انستاباي\s*قبل|فودافون\s*كاش\s*مقدماً|فاتورة\s*إلكترونية|بطاقة\s*ائتمان/i;
  if (prohibitedPaymentTermsRegex.test(replyText)) {
    console.warn(`🛑 [AI Agent Sanitizer] Intercepted prohibited payment terms in replyText: "${replyText}"`);
    replyText = `أهلاً بحضرتك يا فندم! نود التوضيح والتأكيد أن التوثيق الرقمي وكود الـ QR وتحديث الأسعار مجاني تماماً بالدليل (0.00 ج)، وكافة باقات الطباعة والمطبوعات يتم سدادها نقداً عند الاستلام (COD) حصرياً مع المندوب عند التسليم في مقر النشاط بعد المعاينة والتأكد من الجودة. يسعدنا دائماً خدمتكم!`;
  }

  // 9. 🛡️ Dynamic Typing Duration & Zero Dangling Presence Guarantee (try...finally)
  if (!params.isSimulation && config.typingSimulationEnabled && senderSock?.sendPresenceUpdate && replyText) {
    const charCount = replyText.length;
    // 60ms per character, clamped safely between 4.5s and 9s per user directive
    const dynamicTypingMs = Math.min(9000, Math.max(4500, Math.floor(charCount * 60)));
    try {
      await senderSock.presenceSubscribe?.(targetJid).catch(() => {});
      await senderSock.sendPresenceUpdate('composing', targetJid).catch(() => {});
      await new Promise((r) => setTimeout(r, dynamicTypingMs));
    } finally {
      // GUARANTEED: Composing is stopped, but keep account 'available' (متصل الآن) so it does NOT drop to Offline
      await senderSock.sendPresenceUpdate('paused', targetJid).catch(() => {});
      await senderSock.sendPresenceUpdate('available').catch(() => {});
      await senderSock.sendPresenceUpdate('available', targetJid).catch(() => {});
    }
  }

  // 10. Send the conversational reply
  if (replyText) {
    await senderSock.sendMessage(targetJid, {
      text: replyText,
    });

    thread.messages.push({
      role: 'assistant',
      content: replyText,
      timestamp: new Date().toISOString(),
    });
    thread.lastReplyAt = new Date().toISOString();
    thread.lastActionExecuted = actionExecuted;
    thread.lastDetectedIntent = detectedIntent;

    conversations[cleanPhone] = thread;
    saveConversations(conversations);

    // Record in live Audit Log
    appendAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      senderPhone: cleanPhone,
      businessId: biz?.id,
      businessName: venueName,
      incomingText,
      detectedIntent,
      aiReply: replyText,
      actionExecuted,
      actionDetails,
      slotId,
    });

    console.log(`🤖 [AI Agent] Replied to ${cleanPhone} [Slot ${slotId}]: "${replyText.substring(0, 50)}..." (Action: ${actionExecuted})`);

    // Keep account 'available' (متصل الآن) for 45 seconds while human waits/watches chat
    schedulePresenceRetention(senderSock, targetJid, 45000);
  }

  return {
    handled: true,
    replyText,
    actionExecuted,
    detectedIntent,
  };
}
