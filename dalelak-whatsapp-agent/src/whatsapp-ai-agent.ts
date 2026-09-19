import fs from 'fs';
import path from 'path';
import { Business, AdminFollowUpNote } from './types.js';
import { getDisplayDirectoryUrl } from './directoryUrl.js';
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


export function recordAdminFollowUp(
  bizId: string,
  noteText: string,
  type: 'general' | 'call' | 'visit' = 'general',
  status: 'completed' | 'pending' = 'completed'
): boolean {
  try {
    const storePaths = [
      BIZ_STORE_PATH,
      path.resolve(process.cwd(), 'data/server_biz_store.json'),
      path.resolve(process.cwd(), '../data/server_biz_store.json'),
    ];
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
            fs.writeFileSync(sp, JSON.stringify(businesses, null, 2), 'utf-8');
            console.log(`📝 [Admin Follow-Up Logged] For ${bizId}: "${noteText.substring(0, 50)}..."`);
          }
        }
      }
    }
    return true;
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

export function findBusinessByIdOrText(text: string): Business | null {
  try {
    if (!text) return null;
    const storePaths = [BIZ_STORE_PATH, path.resolve(process.cwd(), 'data/server_biz_store.json'), path.resolve(process.cwd(), '../data/server_biz_store.json')];
    let businesses: Business[] | null = null;
    for (const sp of storePaths) {
      if (fs.existsSync(sp)) {
        try { businesses = JSON.parse(fs.readFileSync(sp, 'utf-8')); if (Array.isArray(businesses)) break; } catch {}
      }
    }
    if (!businesses || !Array.isArray(businesses)) return null;
    if (!Array.isArray(businesses)) return null;

    // 1. Match by URL containing ID e.g. biz/biz_gplaces_...
    const urlMatch = text.match(/biz\/([a-zA-Z0-9_\-]+)/);
    if (urlMatch && urlMatch[1]) {
      const matchId = urlMatch[1].trim();
      const found = businesses.find(b => b.id === matchId);
      if (found) return found;
    }

    // 2. Match by Arabic name in brackets or text
    const nameMatch = text.match(/[«"']([^»"']{3,40})[»"']/);
    if (nameMatch && nameMatch[1]) {
      const targetName = nameMatch[1].trim().toLowerCase();
      const found = businesses.find(b => 
        (b.nameAr && b.nameAr.toLowerCase().includes(targetName)) || 
        (b.name && b.name.toLowerCase().includes(targetName))
      );
      if (found) return found;
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
    let leads: any[] = [];
    if (fs.existsSync(LEADS_STORE_PATH)) {
      try {
        leads = JSON.parse(fs.readFileSync(LEADS_STORE_PATH, 'utf-8'));
      } catch {}
    }

    const newLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessId: biz.id,
      businessName: biz.nameAr || biz.name,
      phone: biz.ownerPhone || biz.phone,
      governorate: biz.governorate,
      city: biz.city,
      request: clientRequest,
      preferredTime: preferredTime || 'في أقرب وقت ممكن',
      status: 'pending',
      source: 'whatsapp_ai_agent',
      createdAt: new Date().toISOString(),
    };

    leads.unshift(newLead);
    fs.writeFileSync(LEADS_STORE_PATH, JSON.stringify(leads, null, 2), 'utf-8');
    console.log(`✅ [AI Agent] Registered rep follow-up lead for: ${biz.nameAr}`);
  } catch (e) {
    console.warn('[AI Agent] Failed to record lead:', e);
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
        },
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
• الحالة 1: العميل يسأل "مين أنتم؟" أو "إيه منصة دليلك دي؟":
  - الرد: وضح باختصار وود أننا منصة دليلك المعتمدة لتوثيق الأنشطة والخدمات في مصر وربطها بالعملاء وبخرائط جوجل مجاناً.

• الحالة 2: العميل يسأل "الخدمة دي بفلوس؟" أو "في أي اشتراك أو مصاريف؟":
  - الرد: أكد له بنسبة 100% وبشكل قاطع: لا يوجد أي مصاريف نهائياً، الإدراج والتوثيق وهدية كود الـ QR مجانية بالكامل مدى الحياة (0.00 ج.م) وبدون أي التزامات مالية.

• الحالة 3: العميل يسأل "جبتوا رقمي منين؟" أو "مين سجلني عندكم؟":
  - الرد: اشرح له بلباقة أن فرق التوثيق والمسح الميداني لمنصة دليلك بتنزل تجمع وتوثق الأنشطة المعروفة في المنطقة من خلال اللافتات والبيانات المتاحة للجمهور لخدمة المنطقة.

• الحالة 4: العميل يطلب هديته أو كود الـ QR ("فين الهدية؟" / "ابعتلي الـ QR"):
  - الإجراء: استدعِ فوراً أداة [sendBusinessGiftPackage]، وأخبر العميل أنك تقوم بتجهيز وإرسال كارت الهدية والـ QR الخاص بمنشأته بجودة طباعية عالية الآن.

• الحالة 4-مكرر: العميل يعلق على التصميم أو يسأل عن تصميمات أخرى ("في تصميمات تانية؟" / "التصميم خالي أو بسيط" / "التصميم سيء" / "أنت باعتلي باركود بس"):
  - الإجراء: اعتذر له بلباقة وود مصري راقٍ جداً، وأكد له أن الكود المرسل سابقاً كان المعاينة الأولية السريعة، وأخبره أنك تجهز له الآن «الباقة الإعلانية الفاخرة الكاملة» (4 تصميمات بأعلى دقة طباعة: البوستر الكلاسيكي الفاخر، والنسخة الملكية المذهبة VIP، وستاند الكاونتر الأفقي، وشيت التوزيع والقص الجماعي للطاولات).

• الحالة 5: العميل يريد تسجيل أو تعديل بياناته ("عاوز أسجل محلي" / "عاوز أغير الرقم/العنوان"):
  - الإجراء: استدعِ أداة [updateBusinessInformation] بالبيانات الجديدة التي ذكرها، أو اطلب منه باحترام اسم النشاط وعنوانه لإدراجه.

• الحالة 6: العميل يطلب زيارة مندوب أو تصوير للمكان ("عاوز مندوب يجيلي" / "عاوز حد يصور المحل"):
  - الإجراء: استدعِ أداة [scheduleFieldRepVisit]، وأكد له أنه تم تسجيل طلبه وجدولة زيارة منسق المنطقة للتواصل معه وتحديد الموعد المناسب.

• الحالة 7: العميل غير مهتم أو يطلب حذف الرقم ("مش مهتم" / "احذفوا رقمي" / "بلاش رسايل"):
  - الإجراء: احترم رغبته فوراً واعتذر بذوق رفيع: "حقك علينا يا فندم وشكراً لوقتك، تم إلغاء اشتراك الرقم ولن تصلكم أي رسائل أخرى، ونتمنى لكم كامل التوفيق والنجاح." ولا تواصل النقاش.

ضوابط الأمان والمحاكاة البشرية الصارمة (Zero-Detection Rules):
===================================================
1. أسلوبك ونبرتك:
   ${toneStyleGuide}
2. الاختصار والذكاء: لا تكتب فقرات طويلة جداً كأنها مقالات. تحدث بجمل رشيقة وعملية.
3. التنوع: لا تكرر نفس الجمل إذا كان العميل يتابع كلامه في نفس اليوم.
4. الأمانة: لا تخترع أرقام هواتف أو وعوداً مالية غير موجودة بالمنظومة.`;
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

export async function processIncomingWhatsAppMessage(params: {
  rawPhone: string;
  incomingText: string;
  slotId: string;
  senderSock: any;
  messageKey?: any;
}): Promise<{
  handled: boolean;
  replyText?: string;
  actionExecuted?: string;
  reason?: string;
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

  const cleanPhone = rawPhone.replace(/\D/g, '');
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

  // 🖨️ Detect Print Order Request ("اطبعلي" / "خدمة الطباعة")
  if (biz && (/اطبع|طباعة|طبعلي|توصيل/i.test(incomingText))) {
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
  const messagesPayload = [
    { role: 'system', content: systemPrompt },
    ...thread.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const generateReplyPromise = (async () => {
    let apiResponse: Response | null = null;
    let lastErrorText = '';

    for (let i = 0; i < candidateKeys.length; i++) {
      const currentKey = candidateKeys[i];
      const provider = resolveProviderEndpointAndModel(currentKey, config.model);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 22000);

        const resp = await fetch(provider.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentKey}`,
          },
          body: JSON.stringify({
            model: provider.model,
            messages: messagesPayload,
            tools: GROK_TOOLS,
            tool_choice: 'auto',
            temperature: 0.7,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (resp.ok) {
          apiResponse = resp;
          console.log(`✨ [AI Agent] Succeeded using key #${i + 1} via ${provider.providerName} (model: ${provider.model})`);
          break;
        } else {
          lastErrorText = await resp.text();
          console.warn(
            `⚠️ [AI Agent] Key #${i + 1} (${provider.providerName}) failed (HTTP ${resp.status}): ${lastErrorText.slice(0, 140)}. Trying next key...`
          );
        }
      } catch (keyErr: any) {
        lastErrorText = keyErr?.message || 'Network error';
        console.warn(`⚠️ [AI Agent] Key #${i + 1} (${provider.providerName}) request error: ${lastErrorText}. Trying next key...`);
      }
    }

    if (!apiResponse || !apiResponse.ok) {
      console.error(`[AI Agent] All ${candidateKeys.length} Grok API keys exhausted:`, lastErrorText);
      return null;
    }

    const resJson: any = await apiResponse.json();
    return resJson.choices?.[0]?.message || null;
  })();

  // 4. 🛡️ NATURAL HUMAN STEALTH DELAY (Anti-Bot Zero-Detection)
  // Check if this is an ongoing back-and-forth active conversation (within 55s of our last reply)
  const nowMs = Date.now();
  const lastReplyTimeMs = thread.lastReplyAt ? new Date(thread.lastReplyAt).getTime() : 0;
  const isOngoingActiveChat = (nowMs - lastReplyTimeMs) < 55000;

  // If ongoing chat: human is already holding phone (6-12s). If new message: stealth reaction (15-30s).
  const reactionDelaySec = isOngoingActiveChat
    ? Math.floor(6 + Math.random() * 6)
    : Math.floor(15 + Math.random() * 16);

  console.log(`⏳ [AI Agent] Stealth Reaction (${isOngoingActiveChat ? 'Active Thread' : 'New Inbound'}): Waiting ${reactionDelaySec}s silently before reading for ${cleanPhone}...`);
  await new Promise((r) => setTimeout(r, reactionDelaySec * 1000));

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
  await new Promise((r) => setTimeout(r, Math.floor(1200 + Math.random() * 1000)));

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
        detectedIntent = 'request_gift_or_qr';
        actionExecuted = 'sent_gift_qr';
        actionDetails = fnArgs;

        if (biz) {
          try {
            const giftPkg = await prepareBusinessGiftPackage(biz);
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
              replyText = `تم إرسال كارت الـ QR والهدية الترويجية المعتمدة لحضرتك في الصورة أعلاه بنجاح 🎁✨! يسعدنا دائماً خدمتكم.`;
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
      }
    }
  }

  // 🛡️ Zero-Silence Absolute Guarantee: Under no circumstances should the bot stay silent
  if (!replyText || !replyText.trim()) {
    if (biz) {
      replyText = `أهلاً وسهلاً بحضرتك وبإدارة «${venueName}» في منصة دليلك 💐. تحت أمركم يا فندم، رابط صفحتكم بالدليل العام:\n${getDisplayDirectoryUrl(biz)}\nقول لنا إزاي نقدر نساعدك اليوم؟`;
    } else {
      replyText = `أهلاً وسهلاً بحضرتك في منصة دليلك! 😊 إحنا منصة دليلك المتخصصة في توثيق الأنشطة والخدمات في مصر. تحت أمرك يا فندم، قول لي إزاي نقدر نساعدك اليوم؟`;
    }
  }

  // 9. 🛡️ Dynamic Typing Duration & Zero Dangling Presence Guarantee (try...finally)
  if (config.typingSimulationEnabled && senderSock?.sendPresenceUpdate && replyText) {
    const charCount = replyText.length;
    // 45ms per character, clamped safely between 3s and 10s per user directive
    const dynamicTypingMs = Math.min(10000, Math.max(3000, Math.floor(charCount * 45)));
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
  };
}
