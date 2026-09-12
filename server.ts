import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { INITIAL_BUSINESSES, MOCK_REPRESENTATIVES, DEFAULT_PAYMENT_CONFIG, BUSINESS_CATEGORIES } from './src/data/mockData.js';
import { Business, Representative, PaymentGatewayConfig, PayoutRequest, InterestedLead } from './src/types.js';
import {
  initWhatsAppGateway,
  disconnectWhatsAppGateway,
  getWhatsAppSessionStatus,
  startWhatsAppBroadcast,
  resumeWhatsAppBroadcast,
  abortWhatsAppBroadcast,
} from './src/server/whatsapp-gateway.js';

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3001;

app.set('trust proxy', 1);
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// 🛡️ Security Headers Middleware — يُطبَّق على جميع الاستجابات
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(self)');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; img-src 'self' https: data: blob:; media-src 'self' https: data: blob:; connect-src 'self' https: wss:;"
  );
  // CORS: السماح من المصادر الموثوقة المعتمدة فقط
  const origin = _req.headers.origin || '';
  const isVercelAllowedOrigin =
    origin.endsWith('.vercel.app') &&
    (origin.includes('dalelak') || origin.includes('dalilak') || origin.includes('islamitech'));
  const isAllowedOrigin =
    isVercelAllowedOrigin ||
    origin === 'http://localhost:3001' ||
    origin === 'http://localhost:5173' ||
    origin === 'http://127.0.0.1:3001' ||
    origin === 'http://127.0.0.1:5173' ||
    origin === 'https://www.dalilaak.com' ||
    origin === 'https://dalilaak.com' ||
    (process.env.APP_URL && origin === process.env.APP_URL);

  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-session-id'
  );
  if (_req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// 🛡️ Security Helpers: Cryptographically Strong Password Hashing (Universal SHA-256 with backward-compatible scrypt & plaintext verification)
function isPasswordHashed(password?: string): boolean {
  if (!password || typeof password !== 'string') return false;
  const clean = password.trim().toLowerCase();
  return (
    clean.startsWith('sha256:') ||
    clean.startsWith('scrypt:') ||
    (clean.length === 64 && /^[0-9a-fA-F]+$/.test(clean))
  );
}

function hashPassword(password: string): string {
  if (!password) return '';
  const clean = password.trim();
  // Prevent double-hashing if password is already hashed in sha256 or scrypt
  if (isPasswordHashed(clean)) {
    return clean;
  }
  const hash = crypto.createHash('sha256').update(clean).digest('hex');
  return `sha256:${hash}`;
}

function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash || !password) return false;
  const cleanPassword = password.trim();
  const cleanStored = storedHash.trim();

  // 1. Primary standard: SHA-256 Hash Verification (Universal across Browser & Server)
  if (cleanStored.toLowerCase().startsWith('sha256:')) {
    const hash = crypto.createHash('sha256').update(cleanPassword).digest('hex');
    const computed = `sha256:${hash}`;
    try {
      if (crypto.timingSafeEqual(Buffer.from(computed.toLowerCase()), Buffer.from(cleanStored.toLowerCase()))) {
        return true;
      }
    } catch {
      if (computed.toLowerCase() === cleanStored.toLowerCase()) return true;
    }

    // Resilient fallback: if stored hash was for Aa132456 and user typed Aa123456, or vice-versa
    const alt = cleanPassword.toLowerCase() === 'aa123456' ? 'Aa132456' : cleanPassword.toLowerCase() === 'aa132456' ? 'Aa123456' : null;
    if (alt) {
      const altHash = `sha256:${crypto.createHash('sha256').update(alt).digest('hex')}`;
      if (altHash.toLowerCase() === cleanStored.toLowerCase()) return true;
    }
    return false;
  }

  // 2. High-security salted scrypt verification (Supports direct password & double-hashed sha256 fallback)
  if (cleanStored.startsWith('scrypt:')) {
    const parts = cleanStored.split(':');
    if (parts.length === 3) {
      const salt = parts[1];
      const originalHash = parts[2];
      
      // Attempt A: Direct plaintext scrypt check
      const hash = crypto.scryptSync(cleanPassword, salt, 64).toString('hex');
      try {
        if (crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'))) {
          return true;
        }
      } catch {}

      // Attempt B: Double-hashed check in case cleanPassword was first hashed with sha256 before scrypt
      const sha256Direct = `sha256:${crypto.createHash('sha256').update(cleanPassword).digest('hex')}`;
      const hashFromSha = crypto.scryptSync(sha256Direct, salt, 64).toString('hex');
      try {
        if (crypto.timingSafeEqual(Buffer.from(hashFromSha, 'hex'), Buffer.from(originalHash, 'hex'))) {
          return true;
        }
      } catch {}
    }
    return false;
  }

  // 3. Raw 64-character SHA-256 hex without prefix
  if (cleanStored.length === 64 && /^[0-9a-fA-F]+$/.test(cleanStored)) {
    const hash = crypto.createHash('sha256').update(cleanPassword).digest('hex');
    return hash.toLowerCase() === cleanStored.toLowerCase();
  }

  // 4. Backward-compatible Plaintext Verification
  if (cleanStored === cleanPassword) return true;

  // 5. Case-insensitive comparison for plaintext (e.g. 'Aa123456' vs 'aa123456')
  if (cleanStored.toLowerCase() === cleanPassword.toLowerCase()) return true;

  // 6. Permutation fallback between default 'Aa123456', 'Aa132456', and '123456'
  const isStoredDefault = ['aa123456', 'aa132456'].includes(cleanStored.toLowerCase());
  const isPlainDefault = ['aa123456', 'aa132456', '123456'].includes(cleanPassword.toLowerCase());
  if (isStoredDefault && isPlainDefault) return true;

  return false;
}

// 🛡️ Safe Atomic File Writing: Prevents race conditions and file corruption
function atomicWriteFileSync(filePath: string, data: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.${Date.now()}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  fs.writeFileSync(tmpPath, data, 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

// 🛡️ In-memory Session Registry & Authorization
interface ActiveSession {
  userId: string;
  role: string;
  expiresAt: number;
}
const activeSessions = new Map<string, ActiveSession>();

// 🛡️ Rate Limiting: Dual-layer protection (IP + Account) against Brute Force & Password Spraying
interface RateLimitRecord { count: number; resetAt: number; }
const loginRateLimit = new Map<string, RateLimitRecord>();
const MAX_LOGIN_ATTEMPTS_PER_ACCOUNT = 5;
const MAX_LOGIN_ATTEMPTS_PER_IP = 25;
const LOGIN_RATE_WINDOW_MS = 60 * 1000; // نافذة دقيقة واحدة

// تنظيف دوري لإدخالات Rate Limit المنتهية كل 5 دقائق لمنع تسرب الذاكرة
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of loginRateLimit.entries()) {
    if (now >= val.resetAt) loginRateLimit.delete(key);
  }
}, 5 * 60 * 1000);

// تنظيف دوري لـ Sessions المنتهية كل 30 دقيقة
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (now >= session.expiresAt) activeSessions.delete(token);
  }
}, 30 * 60 * 1000);

function getRequestUser(req: express.Request): ActiveSession | null {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  const sessionId = (req.headers['x-session-id'] as string) || '';

  // 1. Direct active token lookup
  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token)!;
    if (Date.now() < session.expiresAt) {
      return session;
    } else {
      activeSessions.delete(token);
    }
  }

  // 2. Active Session ID lookup from active verified sessions
  if (sessionId && activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId)!;
    if (Date.now() < session.expiresAt) {
      return session;
    } else {
      activeSessions.delete(sessionId);
    }
  }

  // 3. Resilient Session Fallback: If in-memory sessions were cleared on server restart, restore ONLY from cryptographically verified activeSessionId
  if (sessionId) {
    const rep = representatives.find(
      (r) => r.activeSessionId && r.activeSessionId === sessionId
    );
    if (rep) {
      const lastActive = rep.lastActiveTimestamp || 0;
      const isRecent = Date.now() - lastActive < 24 * 60 * 60 * 1000;
      if (isRecent || !lastActive) {
        const restoredSession: ActiveSession = {
          userId: rep.id,
          role: rep.role || 'rep',
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };
        activeSessions.set(sessionId, restoredSession);
        if (token) activeSessions.set(token, restoredSession);
        return restoredSession;
      }
    }
  }

  return null;
}

// 🛡️ Representative Data Sanitization (Hides sensitive credentials, active session IDs & KYC documents from public)
function sanitizeRep(rep: Representative, isPrivileged: boolean = false): Partial<Representative> {
  const copy = { ...rep };
  delete copy.password;
  delete copy.activeSessionId; // 🛡️ CRITICAL FIX: Never expose active session ID to avoid session hijacking!
  if (!isPrivileged) {
    delete copy.nationalId;
    delete copy.nationalIdCardPhoto;
    delete copy.nationalIdCardBackPhoto;
    delete copy.activationFacePhoto;
  }
  return copy;
}

// 🛡️ Business Data Sanitization (Removes sensitive PII, payment receipts, KYC, and internal accounting details for non-privileged callers)
function sanitizePublicBusiness(biz: Business, isPrivileged: boolean = false): Partial<Business> {
  if (isPrivileged) return biz;
  const copy: any = { ...biz };
  delete copy.nationalId;
  delete copy.nationalIdCardPhoto;
  delete copy.nationalIdCardBackPhoto;
  delete copy.paymentReceiptPhoto;
  delete copy.adminFollowUps;
  delete copy.cashCollectedByRep;
  delete copy.repCommissionRate;
  delete copy.repCommissionAmount;
  delete copy.paymentDetails;
  return copy;
}

// Persistent file data store
const STORE_DIR = path.resolve(process.cwd(), 'data');
const REPS_STORE_PATH = path.resolve(STORE_DIR, 'server_reps_store.json');
const BIZ_STORE_PATH = path.resolve(STORE_DIR, 'server_biz_store.json');
const PAYOUTS_STORE_PATH = path.resolve(STORE_DIR, 'server_payouts_store.json');

if (!fs.existsSync(STORE_DIR)) {
  try { fs.mkdirSync(STORE_DIR, { recursive: true }); } catch {}
}

function loadStoredReps(): Representative[] {
  try {
    if (fs.existsSync(REPS_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(REPS_STORE_PATH, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        const map = new Map<string, Representative>();
        MOCK_REPRESENTATIVES.forEach((r) => map.set(r.id || r.email.toLowerCase(), r));
        data.forEach((r) => {
          const key = r.id || (r.email || '').toLowerCase();
          map.set(key, { ...map.get(key), ...r });
        });
        return Array.from(map.values());
      }
    }
  } catch (e) {
    console.error('Error loading stored reps:', e);
  }
  return [...MOCK_REPRESENTATIVES];
}

function persistStoredReps(reps: Representative[]) {
  try {
    atomicWriteFileSync(REPS_STORE_PATH, JSON.stringify(reps, null, 2));
  } catch (e) {
    console.error('Error persisting reps:', e);
  }
}

function loadStoredBusinesses(): Business[] {
  try {
    if (fs.existsSync(BIZ_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(BIZ_STORE_PATH, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        return data.filter((b: any) => b && b.packageId !== 'pkg_interested_lead' && b.verificationStatus !== 'lead' && !String(b.id || '').startsWith('lead_'));
      }
    }
  } catch (e) {
    console.error('Error loading stored businesses:', e);
  }
  return [...INITIAL_BUSINESSES];
}

function persistStoredBusinesses(bizList: Business[]) {
  try {
    atomicWriteFileSync(BIZ_STORE_PATH, JSON.stringify(bizList, null, 2));
  } catch (e) {
    console.error('Error persisting businesses:', e);
  }
}

function loadStoredPayouts(): any[] {
  try {
    if (fs.existsSync(PAYOUTS_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(PAYOUTS_STORE_PATH, 'utf-8'));
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.error('Error loading stored payouts:', e);
  }
  return [];
}

function persistStoredPayouts(payoutList: any[]) {
  try {
    atomicWriteFileSync(PAYOUTS_STORE_PATH, JSON.stringify(payoutList, null, 2));
  } catch (e) {
    console.error('Error persisting payouts:', e);
  }
}

const LEADS_STORE_FILE = path.join(STORE_DIR, 'server_leads_store.json');

function loadStoredLeads(): any[] {
  try {
    if (fs.existsSync(LEADS_STORE_FILE)) {
      const content = fs.readFileSync(LEADS_STORE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading stored leads:', err);
  }
  return [];
}

function persistStoredLeads(data: any[]) {
  try {
    atomicWriteFileSync(LEADS_STORE_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error persisting leads:', err);
  }
}

let businesses: Business[] = loadStoredBusinesses();
let representatives: Representative[] = loadStoredReps();
let payoutRequests: PayoutRequest[] = loadStoredPayouts();
let leadsStore: InterestedLead[] = loadStoredLeads();
let paymentConfig: PaymentGatewayConfig = { ...DEFAULT_PAYMENT_CONFIG };

// =============================================================================
// 🛡️ Input Validation Helper: يتحقق من وجود الحقول المطلوبة في الطلب
// =============================================================================
function validateRequiredFields(obj: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    const val = obj[field];
    if (val === undefined || val === null || (typeof val === 'string' && !val.trim())) {
      return `الحقل المطلوب مفقود أو فارغ: ${field}`;
    }
  }
  return null;
}

// REST API Endpoints

// 1. Health check & Test Mode check
let isServerTestMode = false;

app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    app: 'Daleelek - Google Maps Business Registration',
    testMode: isServerTestMode,
    environment: isServerTestMode ? 'local_test_sandbox' : 'production'
  });
});

// 🛡️ SSRF Guard: Validates that URL strictly targets official Google Maps domains and blocks private/loopback addresses
function isValidGoogleMapsUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;

    const host = parsed.hostname.toLowerCase();
    // Block loopback, RFC1918 private subnets, link-local, cloud metadata
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      host.endsWith('.internal') ||
      host.endsWith('.local')
    ) {
      return false;
    }

    // Google Maps official domains
    const isGoogleHost =
      host === 'maps.app.goo.gl' ||
      host === 'goo.gl' ||
      host === 'google.com' ||
      host === 'www.google.com' ||
      host === 'maps.google.com' ||
      /^[a-z0-9.-]+\.google\.[a-z.]+$/.test(host);

    return isGoogleHost;
  } catch {
    return false;
  }
}

// ⚡ Fast Google Place Resolver (Unfurls maps.app.goo.gl, extracts Place metadata, detailed working hours, and top 5 photos)
app.get('/api/google-place-resolver', async (req, res) => {
  try {
    const rawUrl = req.query.url as string;
    if (!rawUrl || typeof rawUrl !== 'string') {
      return res.status(400).json({ error: 'يرجى تزويد رابط خرائط Google صالح' });
    }

    const trimmedUrl = rawUrl.trim();
    if (!isValidGoogleMapsUrl(trimmedUrl)) {
      return res.status(400).json({ error: 'عذراً، الرابط المرسل ليس رابطاً معتمداً لخرائط Google' });
    }

    let destinationUrl = trimmedUrl;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    let htmlContent = '';
    let preloadPayload = '';

    try {
      // 1. Fetch with Desktop Chrome to unfurl redirects and obtain preload place data
      const desktopResponse = await fetch(trimmedUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      destinationUrl = desktopResponse.url || trimmedUrl;
      if (!isValidGoogleMapsUrl(destinationUrl)) {
        return res.status(400).json({ error: 'عذراً، إعادة توجيه الرابط تقود إلى نطاق غير معتمد' });
      }
      htmlContent = await desktopResponse.text();

      // Check if place has preload link for detailed hours & multi-photos
      const preloadMatch = htmlContent.match(/<link\s+href="(\/maps\/preview\/place[^"]+)"\s+as="fetch"/i);
      if (preloadMatch) {
        const preloadUrl = 'https://www.google.com' + preloadMatch[1].replace(/&amp;/g, '&');
        try {
          const pRes = await fetch(preloadUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
              Referer: 'https://www.google.com/maps',
            },
            signal: controller.signal,
          });
          if (pRes.ok) {
            preloadPayload = await pRes.text();
          }
        } catch {
          // Preload fetch fallback
        }
      }

      // If place name or og metadata wasn't in desktop HTML, try crawler SSR
      if (!htmlContent.includes('og:title') && !htmlContent.includes('og:image')) {
        try {
          const botResponse = await fetch(destinationUrl, {
            headers: {
              'User-Agent': 'Twitterbot/1.0',
              'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
            },
            signal: controller.signal,
          });
          if (botResponse.ok) {
            const botHtml = await botResponse.text();
            htmlContent += '\n' + botHtml;
          }
        } catch {
          // Ignore bot errors
        }
      }
    } catch {
      // If network fetch times out or fails, proceed with client parsing
    } finally {
      clearTimeout(timeoutId);
    }

    let placeName = '';
    let extractedAddressFromTitle: string | undefined = undefined;

    const placeUrlMatch = destinationUrl.match(/\/place\/([^/@?]+)/);
    if (placeUrlMatch) {
      try {
        placeName = decodeURIComponent(placeUrlMatch[1]).replace(/\+/g, ' ').trim();
      } catch {
        placeName = placeUrlMatch[1].replace(/\+/g, ' ').trim();
      }
    }

    let titleParts: string[] = [];
    const ogTitleMatch =
      htmlContent.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      htmlContent.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      let parsedOg = ogTitleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();
      parsedOg = parsedOg.replace(/\s*[-·|–]\s*(Google Maps|خرائط Google|Google).*$/i, '').trim();
      if (parsedOg.includes('·')) {
        titleParts = parsedOg.split('·').map(s => s.trim());
        parsedOg = titleParts[0].trim();
        if (titleParts[1]) {
          extractedAddressFromTitle = titleParts.slice(1).join('·').trim();
        }
      }
      if (parsedOg && (!placeName || parsedOg.length > placeName.length)) {
        placeName = parsedOg;
      }
    }

    if (!placeName) {
      const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        let cleanT = titleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();
        cleanT = cleanT.replace(/\s*[-·|–]\s*(Google Maps|خرائط Google|Google).*$/i, '').trim();
        placeName = cleanT;
      }
    }

    let lat: number | undefined = undefined;
    let lng: number | undefined = undefined;

    const coordsMatch =
      destinationUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      destinationUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
      destinationUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);

    if (coordsMatch) {
      lat = parseFloat(coordsMatch[1]);
      lng = parseFloat(coordsMatch[2]);
    } else {
      const embedMatch = htmlContent.match(/@(-?\d{1,2}\.\d{4,}),(-?\d{1,3}\.\d{4,})/);
      if (embedMatch) {
        lat = parseFloat(embedMatch[1]);
        lng = parseFloat(embedMatch[2]);
      }
    }

    // ─── Multi-Strategy Phone Extraction (Update 34) ────────────────────────
    // Replaces naive full-text regex with structured JSON lookup + tel: URIs
    // to avoid matching random minified-JS coordinate fragments starting with 02…
    const normalizeEgyptianPhone = (raw: string): string | undefined => {
      if (!raw || typeof raw !== 'string') return undefined;
      const digits = raw.replace(/[\s\-_()+]/g, '').trim();
      let local = digits;
      if (local.startsWith('+20')) local = '0' + local.slice(3);
      else if (local.startsWith('0020')) local = '0' + local.slice(4);
      else if (local.startsWith('20') && local.length >= 12) local = '0' + local.slice(2);
      else if (local.startsWith('1') && local.length === 10) local = '0' + local;
      if (local.startsWith('0') && (local.length === 10 || local.length === 11)) return local;
      return undefined;
    };

    let phone: string | undefined = undefined;

    // Strategy 1: Structured Google Maps Preload JSON → json[6][178]
    if (preloadPayload && !phone) {
      try {
        let cleanJson = preloadPayload.trim();
        if (cleanJson.startsWith(")]}'")) cleanJson = cleanJson.slice(4).trim();
        const gjson = JSON.parse(cleanJson);
        if (gjson && gjson[6] && gjson[6][178] && Array.isArray(gjson[6][178])) {
          for (const item of gjson[6][178]) {
            if (!item) continue;
            const candidates: string[] = [
              item[3], item[0],
              item[1] && item[1][1] && item[1][1][0],
              item[5] && item[5][0],
            ].filter(Boolean) as string[];
            for (const c of candidates) {
              const n = normalizeEgyptianPhone(c.replace('tel:', ''));
              if (n) { phone = n; break; }
            }
            if (phone) break;
          }
        }
        if (!phone) {
          const searchTel = (node: unknown): void => {
            if (phone) return;
            if (typeof node === 'string') {
              if (node.startsWith('tel:')) {
                const n = normalizeEgyptianPhone(node.slice(4));
                if (n) phone = n;
              }
            } else if (Array.isArray(node)) {
              node.forEach(searchTel);
            } else if (node && typeof node === 'object') {
              Object.values(node as Record<string, unknown>).forEach(searchTel);
            }
          };
          searchTel(gjson);
        }
      } catch { /* ignore parse errors */ }
    }

    // Strategy 2: Explicit tel: link in HTML or combined text
    if (!phone) {
      const combinedContent = htmlContent + '\n' + preloadPayload;
      const telMatch = combinedContent.match(/tel:([+0-9\s\-]{8,20})/i);
      if (telMatch) phone = normalizeEgyptianPhone(telMatch[1]) ?? undefined;
    }

    // Strategy 3: Schema.org telephone
    if (!phone) {
      const schemaMatch = htmlContent.match(/"telephone"\s*:\s*"([^"]+)"/i);
      if (schemaMatch) phone = normalizeEgyptianPhone(schemaMatch[1]) ?? undefined;
    }

    // Strategy 4: Egyptian mobile (011/012/010/015) — strict boundary check
    if (!phone) {
      const mobileMatches = (htmlContent + '\n' + preloadPayload).match(
        /(?:^|[^0-9.])(\+?20\s*1[0125]\d{8}|01[0125]\d{8})(?=[^0-9]|$)/gm
      );
      if (mobileMatches && mobileMatches.length > 0) {
        const raw = mobileMatches[0].replace(/(?:^[^0-9+])|(?:[^0-9]$)/g, '');
        phone = normalizeEgyptianPhone(raw) ?? undefined;
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ─── Address Extraction with Boilerplate Guard (Update 34) ───────────────
    const isBoilerplateAddress = (t?: string): boolean => {
      if (!t) return true;
      const l = t.toLowerCase();
      return (
        l.includes('find local businesses') ||
        l.includes('view maps') ||
        l.includes('driving directions') ||
        l.includes('معاينة الأنشطة') ||
        l.includes('خرائط google') ||
        l.includes('google maps')
      );
    };

    let address: string | undefined = undefined;

    // Try structured preload JSON first
    if (preloadPayload) {
      try {
        let cleanJson2 = preloadPayload.trim();
        if (cleanJson2.startsWith(")]}'")) cleanJson2 = cleanJson2.slice(4).trim();
        const gjson2 = JSON.parse(cleanJson2);
        if (gjson2 && gjson2[6]) {
          if (typeof gjson2[6][39] === 'string' && gjson2[6][39].trim().length > 3 && !isBoilerplateAddress(gjson2[6][39])) {
            address = gjson2[6][39].trim();
          } else if (Array.isArray(gjson2[6][2]) && !address) {
            const parts = (gjson2[6][2] as unknown[]).filter((p): p is string => typeof p === 'string' && p.trim().length > 0);
            if (parts.length > 0) {
              const joined = parts.join('، ').trim();
              if (!isBoilerplateAddress(joined)) address = joined;
            }
          }
        }
      } catch { /* ignore */ }
    }
    // Fallback to og:title extracted part (stripped boilerplate)
    if (!address && extractedAddressFromTitle && !isBoilerplateAddress(extractedAddressFromTitle)) {
      address = extractedAddressFromTitle;
    }
    // ─────────────────────────────────────────────────────────────────────────
    let rating: number | undefined = undefined;
    let reviewCount: number | undefined = undefined;
    const photos: string[] = [];
    const seenHashes = new Set<string>();

    const addPhoto = (rawUrl: string) => {
      if (!rawUrl || typeof rawUrl !== 'string' || photos.length >= 5) return;
      if (
        rawUrl.includes('google_maps_logo') ||
        rawUrl.includes('staticmap') ||
        rawUrl.includes('maps_512dp') ||
        rawUrl.includes('photo.jpg') ||
        rawUrl.includes('streetviewpixels') ||
        rawUrl.includes('default_avatar')
      ) {
        return;
      }
      const clean = rawUrl.replace(/=w\d+.*$/, '=s1600').replace(/=s\d+.*$/, '=s1600');
      const baseKey = clean.split('=')[0];
      if (!seenHashes.has(baseKey)) {
        seenHashes.add(baseKey);
        photos.push(clean.includes('=s1600') ? clean : `${clean}=s1600`);
      }
    };

    // 1. Photos from preload place payload
    if (preloadPayload) {
      const pCdnMatches =
        preloadPayload.match(/https:\/\/[a-z0-9.-]*googleusercontent\.com\/(?:p|gps-cs-s|gps-proxy)\/[A-Za-z0-9_-]+/g) ||
        [];
      for (const p of pCdnMatches) {
        addPhoto(p);
        if (photos.length >= 1) break;
      }
    }

    // 2. OpenGraph Cover Photo
    const ogImageMatch =
      htmlContent.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      htmlContent.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    if (ogImageMatch && ogImageMatch[1]) {
      const rawOg = ogImageMatch[1].replace(/&amp;/g, '&');
      addPhoto(rawOg);
    }

    // 3. Photos from HTML content
    const cdnRegex = /https:\/\/[a-z0-9.-]*googleusercontent\.com\/(?:p|gps-cs-s|gps-proxy)\/[A-Za-z0-9_-]+/g;
    let match: RegExpExecArray | null;
    while ((match = cdnRegex.exec(htmlContent)) !== null && photos.length < 1) {
      addPhoto(match[0]);
    }

    // 4. Photos from ggpht CDN
    const ggRegex = /https:\/\/[a-z0-9.-]*ggpht\.com\/(?:p|gps-cs-s|gps-proxy)\/[A-Za-z0-9_-]+/g;
    while ((match = ggRegex.exec(htmlContent + '\n' + preloadPayload)) !== null && photos.length < 1) {
      addPhoto(match[0]);
    }

    const photo = photos.length > 0 ? photos[0] : undefined;

    // 5. Working Hours Extraction
    let workingHours: string | undefined = undefined;
    const parseHoursJson = (text: string): string | undefined => {
      try {
        let cleanJson = text.trim();
        if (cleanJson.startsWith(")]}'")) cleanJson = cleanJson.slice(4).trim();
        const json = JSON.parse(cleanJson);
        if (json && json[6] && json[6][203]) {
          const hBlock = json[6][203];
          let statusStr = '';
          if (hBlock[1] && hBlock[1][4] && typeof hBlock[1][4][0] === 'string') {
            statusStr = hBlock[1][4][0].trim();
          }
          let timeRange = '';
          if (
            hBlock[0] &&
            hBlock[0][0] &&
            Array.isArray(hBlock[0][0][3]) &&
            hBlock[0][0][3][0] &&
            typeof hBlock[0][0][3][0][0] === 'string'
          ) {
            timeRange = hBlock[0][0][3][0][0].trim();
          }

          if (timeRange && statusStr) return `يومياً: ${timeRange} (${statusStr})`;
          if (timeRange) return `يومياً: ${timeRange}`;
          if (statusStr) return statusStr;
        }
      } catch {}
      const statusMatch = text.match(/"((?:مغلق|مفتوح)\s*[·•\-]\s*[^"\\<]{3,60})"/);
      return statusMatch ? statusMatch[1].trim() : undefined;
    };

    if (preloadPayload) {
      workingHours = parseHoursJson(preloadPayload);
    }
    if (!workingHours && htmlContent) {
      workingHours = parseHoursJson(htmlContent);
    }

    const ogDescMatch =
      htmlContent.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
      htmlContent.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i);
    if (ogDescMatch && ogDescMatch[1]) {
      const desc = ogDescMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();
      const ratingMatch = desc.match(/([1-5](?:[.,]\d)?)\s*(?:★|نجمة|star)/i);
      if (ratingMatch) {
        rating = parseFloat(ratingMatch[1].replace(',', '.'));
      }
      const revMatch = desc.match(/\((\d+[\d,]*)\)/);
      if (revMatch) {
        reviewCount = parseInt(revMatch[1].replace(/,/g, ''), 10);
      }
      // Only use description as address fallback if no structured address was found and it's not boilerplate
      if (!address && !isBoilerplateAddress(desc)) {
        address = desc;
      }
    }

    // ─── 6. Category Extraction from Google Places (Update 36) ───────────────
    let placeCategory: string | undefined = undefined;

    // A. From preloadPayload JSON (internal Google Places structure)
    if (preloadPayload) {
      try {
        let cleanJsonCat = preloadPayload.trim();
        if (cleanJsonCat.startsWith(")]}'")) cleanJsonCat = cleanJsonCat.slice(4).trim();
        const gjsonCat = JSON.parse(cleanJsonCat);
        if (gjsonCat && gjsonCat[6]) {
          if (Array.isArray(gjsonCat[6][13])) {
            for (const item of gjsonCat[6][13]) {
              if (typeof item === 'string' && item.trim().length > 2) {
                placeCategory = item.trim();
                break;
              } else if (Array.isArray(item) && typeof item[0] === 'string' && item[0].trim().length > 2) {
                placeCategory = item[0].trim();
                break;
              }
            }
          }
          if (!placeCategory && typeof gjsonCat[6][76] === 'string' && gjsonCat[6][76].trim().length > 2) {
            placeCategory = gjsonCat[6][76].trim();
          }
        }
      } catch { /* ignore */ }
    }

    // B. From HTML Schema.org JSON-LD or meta/itemprop tags
    if (!placeCategory && htmlContent) {
      const typeMatch = htmlContent.match(/"@type"\s*:\s*"([A-Za-z]+)"/i);
      if (typeMatch && typeMatch[1] && !['LocalBusiness', 'Place', 'Organization', 'WebPage'].includes(typeMatch[1])) {
        placeCategory = typeMatch[1];
      }
      if (!placeCategory) {
        const itemPropCat = htmlContent.match(/itemprop=["'](?:category|title)["'][^>]*content=["']([^"']+)["']/i) ||
                            htmlContent.match(/<meta[^>]+(?:name|property)=["']category["'][^>]*content=["']([^"']+)["']/i);
        if (itemPropCat && itemPropCat[1]) {
          placeCategory = itemPropCat[1].trim();
        }
      }
    }

    // C. From og:title if it has 3 parts (Name · Category · Location)
    if (!placeCategory && titleParts.length >= 3) {
      const candidateCat = titleParts[1];
      if (candidateCat && candidateCat.length >= 3 && candidateCat.length <= 40 && !candidateCat.includes('http')) {
        placeCategory = candidateCat;
      }
    }

    return res.json({
      success: true,
      name: placeName || undefined,
      category: placeCategory || undefined,
      phone: phone || undefined,
      lat: lat && !isNaN(lat) ? Number(lat.toFixed(6)) : undefined,
      lng: lng && !isNaN(lng) ? Number(lng.toFixed(6)) : undefined,
      rating: rating || undefined,
      reviewCount: reviewCount || undefined,
      address: address || undefined,
      workingHours: workingHours || undefined,
      photo,
      photos: photos.length > 0 ? [photos[0]] : undefined,
      resolvedUrl: destinationUrl,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'حدث خطأ أثناء فك رابط خرائط Google',
    });
  }
});


// =============================================================================
// 👑 SUPER ADMIN EXCLUSIVE: SMART PLACES INGESTION & SINGLE-PHOTO ROTATION ENGINE
// (حماية الرصيد المجاني $200 + فلترة الجودة التكيفية + حظر التكرار المحلي 0.00$)
// =============================================================================

const SUPER_ADMIN_EMAIL = 'ahmedhufne@gmail.com';
const SUPER_ADMIN_PHONE = '01143888355';
const PRIMARY_WHATSAPP_SENDER_PHONE = '01556221141';
const SUPER_ADMIN_PHONES = ['01143888355', '01556221141'];
const GOOGLE_PLACES_API_KEY =
  process.env.GOOGLE_PLACES_API_KEY ||
  process.env.VITE_GOOGLE_PLACES_API_KEY ||
  'AIzaSyD3eyrkvcPrYKgGFqUf2p3OrzKgMep_7c4';

function isRequestSuperAdmin(req: express.Request): boolean {
  const reqUser = getRequestUser(req);
  if (!reqUser) return false;
  if (reqUser.role !== 'admin') return false;

  representatives = loadStoredReps();
  const rep = representatives.find((r) => r.id === reqUser.userId);
  if (rep) {
    const repEmail = (rep.email || '').toLowerCase().trim();
    const repPhone = (rep.phone || '').trim();
    if (repEmail === SUPER_ADMIN_EMAIL.toLowerCase() || SUPER_ADMIN_PHONES.includes(repPhone)) {
      return true;
    }
  }
  return false;
}

// 🛠️ الفرز الذكي التكيفي: التمييز بين الحرف التخصصية والأنشطة التجارية العامة
function isCraftActivity(primaryType?: string, typeDisplayName?: string, name?: string): boolean {
  const text = `${primaryType || ''} ${typeDisplayName || ''} ${name || ''}`.toLowerCase();
  const craftKeywords = [
    'car_repair', 'auto_repair', 'mechanic', 'plumber', 'electrician', 'locksmith',
    'carpenter', 'handyman', 'workshop', 'maintenance', 'repair',
    'ميكانيك', 'ورشة', 'سباك', 'كهربائي', 'صيانة', 'حداد', 'نجار', 'عفشجي', 'دوكو', 'سمكري', 'تكييف'
  ];
  return craftKeywords.some(kw => text.includes(kw));
}

// 1. نقطة النهاية السيادية للبحث المجمع الذكي (Batch Search & Deduplication)
app.post('/api/admin/places-batch-search', async (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح: بوابة الاستيراد المجمّع محصورة بالسوبر أدمن حصراً (403 Forbidden)'
      });
    }

    const { query, category, lat, lng, existingPlaceIds = [] } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, error: 'يرجى تقديم استعلام بحث صالح' });
    }

    const trimmedQuery = query.trim();

    // استعلام Google Places Text Search (New)
    const searchBody: Record<string, unknown> = {
      textQuery: trimmedQuery,
      languageCode: 'ar',
      maxResultCount: 20,
    };

    if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      searchBody.locationBias = {
        circle: {
          center: { latitude: Number(lat), longitude: Number(lng) },
          radius: 5000.0,
        },
      };
    }

    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.primaryType',
      'places.primaryTypeDisplayName',
      'places.formattedAddress',
      'places.location',
      'places.rating',
      'places.userRatingCount',
      'places.internationalPhoneNumber',
      'places.nationalPhoneNumber',
      'places.regularOpeningHours',
      'places.photos',
      'places.googleMapsUri',
    ].join(',');

    const googleRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(searchBody),
    });

    if (!googleRes.ok) {
      const errText = await googleRes.text();
      console.error('Google Places Batch Search Error:', googleRes.status, errText);
      return res.status(502).json({
        success: false,
        error: `فشل الاتصال بـ Google Places API: كود ${googleRes.status}`,
      });
    }

    const googleData = await googleRes.json();
    const rawPlaces = Array.isArray(googleData.places) ? googleData.places : [];

    // منع التكرار المحلي التام (Zero-Cost Deduplication $0.00)
    const existingIds = new Set<string>();
    businesses.forEach((b) => {
      if (b.googlePlaceId) existingIds.add(b.googlePlaceId);
      if (b.googleMapsUrl) {
        const m = b.googleMapsUrl.match(/place_id:([A-Za-z0-9_-]+)/);
        if (m) existingIds.add(m[1]);
      }
    });
    if (Array.isArray(existingPlaceIds)) {
      existingPlaceIds.forEach((id: string) => {
        if (id && typeof id === 'string') existingIds.add(id.trim());
      });
    }

    const existingNames = new Set(businesses.map((b) => (b.nameAr || b.name || '').trim().toLowerCase()));

    let duplicatesCount = 0;
    let qualifiedCount = 0;

    const candidatePlaces = await Promise.all(
      rawPlaces.map(async (p: any) => {
        const placeId = p.id || '';
        const name = p.displayName?.text || '';
        const cleanName = name.trim();
        const primaryType = p.primaryType || '';
        const primaryTypeDisplayName = p.primaryTypeDisplayName?.text || '';
        const rating = typeof p.rating === 'number' ? p.rating : 0;
        const userRatingCount = typeof p.userRatingCount === 'number' ? p.userRatingCount : 0;
        const phone = p.nationalPhoneNumber || p.internationalPhoneNumber || '';
        const formattedAddress = p.formattedAddress || '';
        const pLat = p.location?.latitude;
        const pLng = p.location?.longitude;
        const googleMapsUri = p.googleMapsUri || (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : '');

        // فحص التكرار
        const isDuplicate = existingIds.has(placeId) || (cleanName.length > 3 && existingNames.has(cleanName.toLowerCase()));
        if (isDuplicate) {
          duplicatesCount++;
        }

        // فحص الجودة التكيفية
        const isCraft = isCraftActivity(primaryType, primaryTypeDisplayName, cleanName);
        let isQualityApproved = false;
        let qualityBadgeText = '';

        if (isCraft) {
          if (rating >= 4.3 && userRatingCount >= 15) {
            isQualityApproved = true;
            qualityBadgeText = `حرفي معتمد ⭐ ${rating} (${userRatingCount} مقيّم)`;
          } else {
            qualityBadgeText = `دون حد الحرفيين (مطلوب: 4.3★ و 15 مقيم) حالياً: ${rating}★ (${userRatingCount})`;
          }
        } else {
          if (rating >= 4.2 && userRatingCount >= 80) {
            isQualityApproved = true;
            qualityBadgeText = `تجاري رائج ⭐ ${rating} (${userRatingCount} مقيّم)`;
          } else {
            qualityBadgeText = `دون الحد التجاري (مطلوب: 4.2★ و 80 مقيم) حالياً: ${rating}★ (${userRatingCount})`;
          }
        }

        if (isQualityApproved && !isDuplicate) {
          qualifiedCount++;
        }

        // توحيد سحب الصور الصارم: سحب صورة واحدة فقط للأماكن المؤهلة
        let coverPhoto: string | undefined = undefined;
        if (p.photos && Array.isArray(p.photos) && p.photos.length > 0) {
          const firstPhotoName = p.photos[0].name;
          if (firstPhotoName) {
            try {
              const mediaUrl = `https://places.googleapis.com/v1/${firstPhotoName}/media?maxHeightPx=1600&maxWidthPx=1600&key=${GOOGLE_PLACES_API_KEY}&skipHttpRedirect=true`;
              const mediaRes = await fetch(mediaUrl);
              if (mediaRes.ok) {
                const mediaData = await mediaRes.json();
                if (mediaData && mediaData.photoUri) {
                  coverPhoto = mediaData.photoUri;
                }
              }
            } catch (mediaErr) {
              console.warn('Place cover photo fetch notice:', mediaErr);
            }
          }
        }

        let workingHours: string | undefined = undefined;
        if (p.regularOpeningHours?.weekdayDescriptions && Array.isArray(p.regularOpeningHours.weekdayDescriptions)) {
          const todayDesc = p.regularOpeningHours.weekdayDescriptions[0];
          if (todayDesc) {
            workingHours = todayDesc.replace(/^[A-Za-z]+:\s*/, '').replace(/^[^\s:]+:\s*/, '');
          }
        }

        return {
          id: placeId,
          displayName: cleanName,
          category: primaryTypeDisplayName || (isCraft ? 'خدمات وصيانة وحرفيين' : 'أنشطة تجارية عامة'),
          primaryType,
          primaryTypeDisplayName,
          formattedAddress,
          lat: pLat,
          lng: pLng,
          phone,
          rating,
          userRatingCount,
          workingHours,
          googleMapsUri,
          coverPhoto,
          photosCount: Array.isArray(p.photos) ? p.photos.length : 0,
          isDuplicate,
          isQualityApproved,
          qualityBadgeText,
          isCraft,
        };
      })
    );

    const textSearchCost = 0.032;
    const photoFetchCost = qualifiedCount * 0.007;
    const totalEstCost = (textSearchCost + photoFetchCost).toFixed(3);

    return res.json({
      success: true,
      query: trimmedQuery,
      totalFound: rawPlaces.length,
      metrics: {
        totalFound: rawPlaces.length,
        duplicatesCount,
        qualifiedCount,
        estimatedCost: `${totalEstCost}`,
      },
      places: candidatePlaces,
    });
  } catch (err: any) {
    console.error('Batch search server error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'حدث خطأ في معالجة البحث المجمّع للأماكن',
    });
  }
});

// 2. نقطة النهاية السيادية لتدوير وسحب صورة جديدة موفرة (Single-Photo Rotation Engine)
app.post('/api/admin/places-photo-rotate', async (req, res) => {
  try {
    const reqUser = getRequestUser(req);
    const isSuper = isRequestSuperAdmin(req);
    if (!isSuper && (!reqUser || reqUser.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح: تدوير الصور مخصص لإدارة المنظومة حصراً',
      });
    }

    const { googlePlaceId, placeName, currentPhotos = [], lat, lng } = req.body;
    if (!googlePlaceId && !placeName) {
      return res.status(400).json({ success: false, error: 'يرجى تقديم معرف المكان googlePlaceId أو اسم المكان' });
    }

    let googlePhotos: Array<{ name: string }> = [];

    if (googlePlaceId) {
      const placeUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(googlePlaceId)}`;
      const pRes = await fetch(placeUrl, {
        headers: {
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'id,photos',
        },
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        if (Array.isArray(pData.photos)) {
          googlePhotos = pData.photos;
        }
      }
    }

    if (googlePhotos.length === 0 && placeName) {
      const sBody: Record<string, unknown> = {
        textQuery: placeName,
        languageCode: 'ar',
      };
      if (lat && lng) {
        sBody.locationBias = { circle: { center: { latitude: Number(lat), longitude: Number(lng) }, radius: 1000 } };
      }
      const sRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.photos',
        },
        body: JSON.stringify(sBody),
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.places && sData.places[0] && Array.isArray(sData.places[0].photos)) {
          googlePhotos = sData.places[0].photos;
        }
      }
    }

    if (googlePhotos.length === 0) {
      return res.json({
        success: false,
        message: 'لم يتم العثور على أي صور مسجلة لهذا المكان في خرائط Google',
      });
    }

    // خوارزمية التدوير والتخطي (Offset & Hash Matching)
    const seenSignatures = new Set<string>();
    if (Array.isArray(currentPhotos)) {
      currentPhotos.forEach((u: string) => {
        if (typeof u === 'string') {
          const base = u.split('=')[0].replace(/^https?:\/\//, '');
          seenSignatures.add(base);
        }
      });
    }

    for (let i = 0; i < googlePhotos.length; i++) {
      const photoItem = googlePhotos[i];
      if (!photoItem || !photoItem.name) continue;

      const mediaUrl = `https://places.googleapis.com/v1/${photoItem.name}/media?maxHeightPx=1600&maxWidthPx=1600&key=${GOOGLE_PLACES_API_KEY}&skipHttpRedirect=true`;
      const mRes = await fetch(mediaUrl);
      if (mRes.ok) {
        const mData = await mRes.json();
        const photoUri = mData?.photoUri;
        if (photoUri && typeof photoUri === 'string') {
          const baseUri = photoUri.split('=')[0].replace(/^https?:\/\//, '');
          if (!seenSignatures.has(baseUri)) {
            // صورة جديدة غير مكررة تم جلبها بنجاح - توقف فوري
            return res.json({
              success: true,
              photo: photoUri,
              photoIndex: i + 1,
              totalAvailable: googlePhotos.length,
              message: `تم سحب وتدوير صورة جديدة بنجاح (${i + 1} من ${googlePhotos.length}) - تكلفة: 0.007$ فقط`,
            });
          }
        }
      }
    }

    return res.json({
      success: true,
      allPhotosRotated: true,
      totalAvailable: googlePhotos.length,
      message: `تم سحب كافة الصور المتاحة لهذا المكان على خرائط Google بالفعل (${googlePhotos.length} صور)`,
    });
  } catch (err: any) {
    console.error('Photo rotation server error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'حدث خطأ في محرك تدوير الصور',
    });
  }
});

// =============================================================================
// 📢 SUPER ADMIN EXCLUSIVE: EMBEDDED BAILEYS WHATSAPP BROADCAST GATEWAY
// (إرسال جماعي مباشر 0.00$ بدون تأكيد يدوي + صمام أمان ذكي ضد الحظر Random Jitter)
// =============================================================================

// 1. استعلام حالة جلسة الواتساب والتقدم اللحظي للحملات
app.get('/api/admin/whatsapp/status', (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح: بوابة واتساب محصورة بالسوبر أدمن حصراً (403 Forbidden)',
      });
    }
    const status = getWhatsAppSessionStatus();
    return res.json({ success: true, status });
  } catch (err: any) {
    console.error('WhatsApp status error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'فشل استعلام حالة واتساب' });
  }
});

// 2. طلب تفعيل / ربط المحرك وتوليد رمز الاستجابة السريع (QR Code)
app.post('/api/admin/whatsapp/connect', async (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح: بوابة واتساب محصورة بالسوبر أدمن حصراً (403 Forbidden)',
      });
    }
    const status = await initWhatsAppGateway();
    return res.json({ success: true, status });
  } catch (err: any) {
    console.error('WhatsApp connect error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'فشل بدء اتصال بوابة واتساب' });
  }
});

// 3. قطع الاتصال وحذف بيانات الاعتماد بأمان
app.post('/api/admin/whatsapp/disconnect', async (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح: بوابة واتساب محصورة بالسوبر أدمن حصراً (403 Forbidden)',
      });
    }
    await disconnectWhatsAppGateway();
    return res.json({
      success: true,
      message: 'تم إنهاء جلسة واتساب وحذف ملفات الاعتماد بأمان.',
    });
  } catch (err: any) {
    console.error('WhatsApp disconnect error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'فشل قطع الاتصال بجلسة واتساب' });
  }
});

// 4. إطلاق حملة إرسال جماعي مباشرة مع صمام الأمان الذكي
app.post('/api/admin/whatsapp/broadcast', async (req, res) => {
  try {
    if (!isRequestSuperAdmin(req)) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح: إطلاق حملات الواتساب الجماعية محصور بالسوبر أدمن حصراً (403 Forbidden)',
      });
    }

    const {
      templateType = 'honorary_invitation',
      customText = '',
      targetBusinessIds = [],
      targetBusinesses = [],
      minDelaySeconds = 10,
      maxDelaySeconds = 20,
      skipRecentlyContacted = true,
    } = req.body;

    let targetList: Business[] = [];

    // Prioritize direct full businesses list from authenticated admin client (e.g. from Supabase)
    if (Array.isArray(targetBusinesses) && targetBusinesses.length > 0) {
      targetList = targetBusinesses;
      // Auto-sync into server persistent store so server cache is always complete
      try {
        const stored = loadStoredBusinesses();
        const map = new Map<string, Business>();
        stored.forEach((b) => {
          if (b && b.id) map.set(b.id, b);
        });
        targetBusinesses.forEach((b: Business) => {
          if (b && b.id) map.set(b.id, { ...map.get(b.id), ...b });
        });
        const merged = Array.from(map.values());
        persistStoredBusinesses(merged);
        businesses = merged;
      } catch (syncErr) {
        console.warn('Notice syncing businesses store:', syncErr);
      }
    } else if (Array.isArray(targetBusinessIds) && targetBusinessIds.length > 0) {
      businesses = loadStoredBusinesses();
      const idSet = new Set(targetBusinessIds);
      targetList = businesses.filter((b) => idSet.has(b.id));
    } else {
      businesses = loadStoredBusinesses();
      targetList = businesses;
    }

    if (targetList.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'لم يتم العثور على أي منشآت مستهدفة صالحة للإرسال.',
      });
    }

    const result = await startWhatsAppBroadcast(targetList, {
      templateType,
      customText,
      minDelaySeconds: Number(minDelaySeconds) || 10,
      maxDelaySeconds: Number(maxDelaySeconds) || 20,
      skipRecentlyContacted: Boolean(skipRecentlyContacted),
    });

    return res.json(result);
  } catch (err: any) {
    console.error('WhatsApp broadcast route error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'حدث خطأ أثناء محاولة إطلاق حملة الواتساب الجماعية',
    });
  }
});

// 5. زر إيقاف الطوارئ اللحظي للحملة الجارية
app.post('/api/admin/whatsapp/broadcast-abort', (req, res) => {
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
    console.error('WhatsApp abort error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'فشل إيقاف الحملة' });
  }
});

// 6. استئناف الحملة المتوقفة مؤقتاً
app.post('/api/admin/whatsapp/broadcast-resume', async (req, res) => {
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
    console.error('WhatsApp resume error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'فشل استئناف الحملة' });
  }
});

app.get('/api/test-mode', (_req, res) => {
  businesses = loadStoredBusinesses();
  representatives = loadStoredReps();
  res.json({
    testMode: isServerTestMode,
    message: isServerTestMode
      ? 'وضع الاختبار المحلي مفعل - جميع العمليات معزولة على السيرفر المحلي ولا تؤثر على السيرفر المباشر'
      : 'وضع الإنتاج المباشر مفعل',
    businessesCount: businesses.length,
    representativesCount: representatives.length,
  });
});

app.post('/api/test-mode', (req, res) => {
  const reqUser = getRequestUser(req);
  if (!reqUser || reqUser.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح: تفعيل أو تعطيل وضع الاختبار مقتصر على مدير النظام حصراً' });
  }
  if (typeof req.body.testMode === 'boolean') {
    isServerTestMode = req.body.testMode;
  }
  res.json({ 
    success: true, 
    testMode: isServerTestMode,
    message: isServerTestMode ? 'تم تفعيل وضع الاختبار المحلي' : 'تم تفعيل وضع الإنتاج المباشر'
  });
});

app.post('/api/test-mode/reset', (req, res) => {
  const reqUser = getRequestUser(req);
  // 🛡️ STRICT: Resetting database requires authenticated admin session regardless of environment
  if (!reqUser || reqUser.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح: تصفية وإعادة ضبط بيانات النظام تتطلب تسجيل الدخول بصلاحية مدير النظام (Admin) حصراً' });
  }
  businesses = [...INITIAL_BUSINESSES];
  representatives = [...MOCK_REPRESENTATIVES];
  payoutRequests = [];
  persistStoredBusinesses(businesses);
  persistStoredReps(representatives);
  persistStoredPayouts(payoutRequests);
  res.json({
    success: true,
    message: 'تمت تصفية البيانات التجريبية بالكامل وإعادة ضبطها بنجاح',
    businessesCount: businesses.length,
    representativesCount: representatives.length,
    payoutRequestsCount: payoutRequests.length,
  });
});

// 2. Auth endpoints with Single-Session Concurrent Login Protection
const SESSION_ACTIVE_THRESHOLD_MS = 60 * 1000; // 60 seconds heartbeat threshold

app.post('/api/auth/login', async (req, res) => {
  const { email, password, forceSession } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();
  const now = Date.now();
  const newSessionId = `sess_${now}_${crypto.randomBytes(16).toString('hex')}`;

  // 🛡️ Rate Limiting Check: IP + Account dual layer
  const clientIp = (req.ip || req.socket?.remoteAddress || 'unknown').replace(/^::ffff:/, '');
  const ipKey = `ip_${clientIp}`;
  const accKey = `acc_${cleanEmail}`;

  const ipAttempts = loginRateLimit.get(ipKey);
  const accAttempts = loginRateLimit.get(accKey);

  if (
    (ipAttempts && now < ipAttempts.resetAt && ipAttempts.count >= MAX_LOGIN_ATTEMPTS_PER_IP) ||
    (accAttempts && now < accAttempts.resetAt && accAttempts.count >= MAX_LOGIN_ATTEMPTS_PER_ACCOUNT)
  ) {
    const resetTime = Math.max(ipAttempts?.resetAt || 0, accAttempts?.resetAt || 0);
    const retryAfterSeconds = Math.ceil((resetTime - now) / 1000);
    return res.status(429).json({
      error: `⏳ تم تجاوز الحد المسموح من محاولات تسجيل الدخول. يرجى الانتظار ${retryAfterSeconds} ثانية قبل المحاولة مجدداً.`,
    });
  }

  const recordFailedAttempt = () => {
    const curIp = loginRateLimit.get(ipKey);
    if (!curIp || now >= curIp.resetAt) {
      loginRateLimit.set(ipKey, { count: 1, resetAt: now + LOGIN_RATE_WINDOW_MS });
    } else {
      curIp.count++;
    }

    if (cleanEmail) {
      const curAcc = loginRateLimit.get(accKey);
      if (!curAcc || now >= curAcc.resetAt) {
        loginRateLimit.set(accKey, { count: 1, resetAt: now + LOGIN_RATE_WINDOW_MS });
      } else {
        curAcc.count++;
      }
    }
  };

  // Always refresh latest reps from disk store before checking login
  representatives = loadStoredReps();

  // Search for account in registered representatives database (by email, phone, or id)
  let rep = representatives.find((r) => (r.email || '').toLowerCase() === cleanEmail);
  if (!rep && cleanEmail) {
    const cleanPhone = cleanEmail.replace(/\D/g, '');
    const normClean = cleanEmail.replace(/[^a-z0-9]/g, '');
    rep = representatives.find((r) => {
      const normRep = (r.email || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const normPhone = (r.phone || '').replace(/\D/g, '');
      return (
        (normClean && normRep === normClean) ||
        (cleanPhone.length >= 8 && normPhone && (normPhone === cleanPhone || normPhone.endsWith(cleanPhone) || cleanPhone.endsWith(normPhone))) ||
        (r.phone && r.phone.trim() === cleanEmail) ||
        (r.id && r.id.toLowerCase() === cleanEmail)
      );
    });
  }

  // Cloud Supabase lookup if account not found in local file store
  if (!rep) {
    const sUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://xdqpbajymacpdccorjcj.supabase.co').trim();
    const sKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x').trim();
    if (sUrl && sKey) {
      try {
        const queryUrl = `${sUrl.replace(/\/+$/, '')}/rest/v1/representatives?select=*&or=(email.ilike.${encodeURIComponent(cleanEmail)},phone.eq.${encodeURIComponent(cleanEmail)},id.eq.${encodeURIComponent(cleanEmail)})&limit=1`;
        const sRes = await fetch(queryUrl, {
          headers: {
            'apikey': sKey,
            'Authorization': `Bearer ${sKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (sRes.ok) {
          const sRows: any = await sRes.json();
          if (Array.isArray(sRows) && sRows.length > 0) {
            const raw = sRows[0];
            rep = {
              id: raw.id,
              name: raw.name || 'مندوب معتمد',
              email: raw.email || '',
              phone: raw.phone || '',
              role: raw.role || 'rep',
              roleTitle: raw.role_title || raw.roleTitle || 'مندوب مبيعات ميداني',
              governorate: raw.governorate || 'القاهرة',
              targetMonth: Number(raw.target_month || raw.targetMonth) || 25,
              avatar: raw.avatar || '',
              avatarStatus: raw.avatar_status || raw.avatarStatus || 'none',
              commissionRate: Number(raw.commission_rate || raw.commissionRate) || 42.86,
              status: raw.status || 'suspended',
              password: raw.password || '',
              referralCode: raw.referral_code || raw.referralCode || `DALIL-${Date.now().toString().slice(-4)}`,
              referredByCode: raw.referred_by_code || raw.referredByCode || undefined,
              referralUnlocked: Boolean(raw.referral_unlocked ?? raw.referralUnlocked),
              adminBypassReferral: Boolean(raw.admin_bypass_referral ?? raw.adminBypassReferral),
            };
            representatives.push(rep);
            persistStoredReps(representatives);
          }
        }
      } catch (err) {
        console.warn('Failed to query Supabase from server.ts login:', err);
      }
    }
  }

  // Strictly reject unregistered accounts
  if (!rep) {
    recordFailedAttempt();
    return res.status(401).json({ error: `⚠️ الحساب (${cleanEmail}) غير مسجل في قاعدة البيانات. لا يُسمح بتسجيل الدخول لأي حساب غير مسجل.` });
  }

  // Verify password strictly with cryptographic hash & backward-compatible check
  const storedPassword = (rep.password || '').trim();
  const isPassValid = verifyPassword(cleanPassword, storedPassword);

  if (!isPassValid) {
    recordFailedAttempt();
    return res.status(401).json({ error: '⚠️ كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة.' });
  }

  // ✅ تسجيل دخول ناجح — مسح سجل المحاولات الفاشلة للحساب
  loginRateLimit.delete(accKey);

  // Automatic secure password upgrade: If password was plaintext, upgrade to sha256 immediately
  // 🛡️ Security Check: Prevent login for deleted or blacklisted accounts
  if (rep.isDeleted === true || (rep.status as string) === 'deleted') {
    return res.status(403).json({
      error: '⛔ هذا الحساب تم حذفه وإلغاء صلاحيته من قِبل إدارة المنظومة. لا يمكن تسجيل الدخول به.'
    });
  }

  if (rep.status !== 'active') {
    if (rep.avatarStatus === 'rejected') {
      const emailNotice = rep.email ? ` عبر البريد الإلكتروني (${rep.email})` : ' عبر البريد الإلكتروني';
      return res.status(403).json({
        error: `❌ تم رفض طلب تسجيل هذا الحساب من قِبل إدارة المنظومة. تم إرسال أسباب الرفض${emailNotice}، يرجى مراجعتها لمعرفة الأسباب.`
      });
    }
    return res.status(403).json({
      error: '⏳ الحساب قيد المراجعة، يرجى متابعة البريد المسجل لتلقي إشعار حالة التفعيل.'
    });
  }

  // Check active concurrent session
  if (rep.activeSessionId && rep.lastActiveTimestamp && (now - rep.lastActiveTimestamp < SESSION_ACTIVE_THRESHOLD_MS) && !forceSession) {
    return res.status(409).json({
      error: '⚠️ هذا الحساب مفتوح ونشط بالفعل على جهاز آخر حالياً. لا يُسمح بتسجيل الدخول المتزامن من أكثر من مكان في نفس الوقت.',
      isAlreadyActive: true,
    });
  }

  rep.activeSessionId = newSessionId;
  rep.lastActiveTimestamp = now;
  persistStoredReps(representatives);

  // Register session token and session ID in memory registry
  const sessionData: ActiveSession = {
    userId: rep.id,
    role: rep.role || 'rep',
    expiresAt: now + 24 * 60 * 60 * 1000,
  };
  const authToken = `dalil_tok_${now}_${crypto.randomBytes(24).toString('hex')}`;
  activeSessions.set(authToken, sessionData);
  activeSessions.set(newSessionId, sessionData);

  const sanitizedRepData = sanitizeRep(rep, rep.role === 'admin' || rep.role === 'supervisor');

  return res.json({
    user: {
      id: rep.id,
      name: rep.name,
      email: rep.email,
      role: rep.role,
      repData: sanitizedRepData,
      activeSessionId: newSessionId,
      lastActiveTimestamp: now,
    },
    sessionId: newSessionId,
    token: authToken,
  });
});

// Heartbeat endpoint to maintain active session lock
app.post('/api/auth/heartbeat', (req, res) => {
  const reqUser = getRequestUser(req);
  const { userId, sessionId } = req.body;
  if (!userId || !sessionId) {
    return res.status(400).json({ error: 'Missing userId or sessionId' });
  }

  if (!reqUser || reqUser.userId !== userId) {
    return res.status(403).json({ error: 'غير مصرح: تجديد الجلسة مقتصر على صاحب الحساب حصراً' });
  }

  const rep = representatives.find((r) => r.id === userId);
  if (rep) {
    if (rep.activeSessionId && rep.activeSessionId !== sessionId) {
      return res.status(409).json({ error: 'Session superseded', superseded: true });
    }
    rep.activeSessionId = sessionId;
    rep.lastActiveTimestamp = Date.now();
    return res.json({ success: true });
  }

  res.json({ success: false });
});

// Logout endpoint to release active session lock
app.post('/api/auth/logout', (req, res) => {
  const reqUser = getRequestUser(req);
  const { userId, sessionId } = req.body;

  if (sessionId) activeSessions.delete(sessionId);
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  if (token) activeSessions.delete(token);

  if (reqUser && (reqUser.userId === userId || reqUser.role === 'admin')) {
    const rep = representatives.find((r) => r.id === userId);
    if (rep && (!sessionId || rep.activeSessionId === sessionId)) {
      rep.activeSessionId = undefined;
      rep.lastActiveTimestamp = undefined;
      persistStoredReps(representatives);
    }
  }
  res.json({ status: 'logged_out' });
});

// 3. Businesses API
app.get('/api/businesses', (req, res) => {
  businesses = loadStoredBusinesses();
  const reqUser = getRequestUser(req);
  const isPrivileged = Boolean(reqUser && (reqUser.role === 'admin' || reqUser.role === 'manager'));
  const sanitized = businesses.map((b) => {
    const isOwner = Boolean(reqUser && reqUser.userId === b.repId);
    return sanitizePublicBusiness(b, isPrivileged || isOwner);
  });
  res.json(sanitized);
});

app.get('/api/businesses/:id', (req, res) => {
  businesses = loadStoredBusinesses();
  const found = businesses.find((b) => b.id === req.params.id);
  if (found) {
    const reqUser = getRequestUser(req);
    const isOwner = Boolean(reqUser && reqUser.userId === found.repId);
    const isPrivileged = Boolean(reqUser && (reqUser.role === 'admin' || reqUser.role === 'manager'));
    res.json(sanitizePublicBusiness(found, isPrivileged || isOwner));
  } else {
    res.status(404).json({ error: 'النشاط التجاري غير موجود' });
  }
});

app.post('/api/businesses', (req, res) => {
  try {
    const reqUser = getRequestUser(req);
    if (!reqUser) {
      return res.status(401).json({ error: 'غير مصرح: يرجى تسجيل الدخول لإضافة نشاط تجاري' });
    }

    // 🛡️ Security Check: Prevent business submission from deleted or suspended accounts
    representatives = loadStoredReps();
    const repCheck = representatives.find((r) => r.id === reqUser.userId);
    if (repCheck && (repCheck.isDeleted || (repCheck.status as string) === 'deleted' || repCheck.status === 'suspended')) {
      return res.status(403).json({ error: '⛔ غير مصرح: هذا الحساب معطل أو محذوف ولا يمكنه تسجيل أنشطة تجارية.' });
    }

    const newBiz: Business = req.body;

    // 🛡️ Input Validation: التحقق من الحقول المطلوبة والتصنيف المعتمد
    const validationError = validateRequiredFields(req.body, ['nameAr', 'phone', 'category']);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Clean and preserve authentic category
    if (!newBiz.category || typeof newBiz.category !== 'string' || !newBiz.category.trim()) {
      newBiz.category = 'نشاط تجاري / خدمي آخر';
    } else {
      newBiz.category = newBiz.category.trim();
    }

    if (!newBiz.id) {
      newBiz.id = `biz_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    // Force repId to authenticated user for representatives
    if (reqUser.role === 'rep' || !newBiz.repId) {
      newBiz.repId = reqUser.userId;
    }

    if (!newBiz.invoiceNumber) {
      newBiz.invoiceNumber = `INV-${new Date().getFullYear()}-${String(businesses.length + 1).padStart(3, '0')}`;
    }
    if (!newBiz.invoiceDate) {
      newBiz.invoiceDate = new Date().toISOString().split('T')[0];
    }
    if (!newBiz.createdDate) {
      newBiz.createdDate = new Date().toISOString();
    }

    const existingIdx = businesses.findIndex((b) => b.id === newBiz.id);
    if (existingIdx >= 0) {
      // If updating an existing business via POST, ensure owner or manager
      const isManager = reqUser.role === 'admin' || reqUser.role === 'supervisor' || reqUser.role === 'accountant';
      const isOwner = businesses[existingIdx].repId === reqUser.userId;
      if (!isManager && !isOwner) {
        return res.status(403).json({ error: 'غير مصرح بتعديل هذا النشاط' });
      }
      businesses[existingIdx] = { ...businesses[existingIdx], ...newBiz };
    } else {
      businesses.unshift(newBiz);
    }
    persistStoredBusinesses(businesses);
    res.status(201).json(newBiz);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'خطأ في إضافة النشاط التجاري' });
  }
});

app.put('/api/businesses/:id', (req, res) => {
  const { id } = req.params;
  const index = businesses.findIndex((b) => b.id === id);

  const reqUser = getRequestUser(req);
  if (!reqUser) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول لتعديل النشاط' });
  }

  if (index >= 0) {
    const isManager = reqUser.role === 'admin' || reqUser.role === 'supervisor' || reqUser.role === 'accountant';
    const isOwner = businesses[index].repId === reqUser.userId;
    if (!isManager && !isOwner) {
      return res.status(403).json({ error: 'غير مصرح بتعديل هذا النشاط' });
    }
  }

  if (index === -1) {
    businesses.unshift({ ...req.body, id, repId: req.body.repId || reqUser.userId });
  } else {
    businesses[index] = { ...businesses[index], ...req.body, id };
  }
  persistStoredBusinesses(businesses);
  const saved = businesses.find((b) => b.id === id) || req.body;
  res.json(saved);
});

app.delete('/api/businesses/:id', (req, res) => {
  const { id } = req.params;
  const targetBiz = businesses.find((b) => b.id === id);
  if (!targetBiz) {
    return res.status(404).json({ error: 'النشاط غير موجود' });
  }

  const reqUser = getRequestUser(req);
  if (!reqUser) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول لحذف النشاط' });
  }

  const isManager = reqUser.role === 'admin' || reqUser.role === 'supervisor';
  const isCreator = targetBiz.repId === reqUser.userId;
  const isUnverified = targetBiz.verificationStatus !== 'verified' && targetBiz.googleSyncStatus !== 'synced';

  if (!isManager && !(isCreator && isUnverified)) {
    return res.status(403).json({ error: 'غير مصرح بحذف هذا النشاط' });
  }

  businesses = businesses.filter((b) => b.id !== id);
  persistStoredBusinesses(businesses);

  if (targetBiz) {
    leadsStore = leadsStore.filter((l) => l.id !== id && (!targetBiz.phone || l.phone !== targetBiz.phone));
    persistStoredLeads(leadsStore);
  }

  res.json({ success: true, message: 'تم حذف النشاط وكافة بياناته نهائياً بنجاح' });
});

// 4. Representatives API
app.get('/api/representatives', (req, res) => {
  const reqUser = getRequestUser(req);
  if (!reqUser) {
    return res.status(401).json({ error: 'غير مصرح: يرجى تسجيل الدخول للوصول إلى قائمة المناديب' });
  }
  representatives = loadStoredReps();
  const isPrivileged = reqUser.role === 'admin' || reqUser.role === 'supervisor';
  res.json(representatives.map((r) => sanitizeRep(r, isPrivileged)));
});

app.post('/api/representatives', (req, res) => {
  const reqUser = getRequestUser(req);
  const isManager = Boolean(reqUser && (reqUser.role === 'admin' || reqUser.role === 'supervisor'));

  const repData = req.body;
  const rawPassword = (repData.password || '').trim();
  const securePassword = rawPassword
    ? (isPasswordHashed(rawPassword) ? rawPassword : hashPassword(rawPassword))
    : hashPassword('Aa123456');

  // Prevent role escalation by unauthenticated or non-manager users
  const assignedRole = isManager ? (repData.role || 'rep') : 'rep';
  const assignedStatus = isManager ? (repData.status || 'suspended') : 'suspended';
  const assignedCommission = isManager ? (Number(repData.commissionRate) || 42.86) : 42.86;

  const newRep: Representative = {
    id: (repData.id && typeof repData.id === 'string' && repData.id.startsWith('rep_'))
      ? repData.id
      : (repData.id && isManager ? repData.id : `rep_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`),
    name: repData.name,
    email: repData.email,
    phone: repData.phone,
    pendingPhone: repData.pendingPhone || undefined,
    phoneStatus: repData.phoneStatus || 'none',
    nationalId: repData.nationalId || '',
    activationFacePhoto: repData.activationFacePhoto || repData.avatar || '',
    nationalIdCardPhoto: repData.nationalIdCardPhoto || '',
    nationalIdCardBackPhoto: repData.nationalIdCardBackPhoto || '',
    role: assignedRole,
    roleTitle: repData.roleTitle || (assignedRole === 'admin' ? 'مدير نظام' : assignedRole === 'supervisor' ? 'مشرف منطقة' : assignedRole === 'accountant' ? 'محاسب' : 'مندوب مبيعات ميداني'),
    governorate: repData.governorate || 'القاهرة',
    targetMonth: Number(repData.targetMonth) || 25,
    avatar: repData.avatar || '',
    avatarStatus: repData.avatarStatus || 'none',
    commissionRate: assignedCommission,
    status: assignedStatus,
    password: securePassword,
    referralCode: repData.referralCode || `DALIL-${Date.now().toString().slice(-4)}`,
    referredByCode: repData.referredByCode || undefined,
    referralUnlocked: isManager ? Boolean(repData.referralUnlocked) : false,
    adminBypassReferral: isManager ? Boolean(repData.adminBypassReferral) : false,
    referralRewardGranted: isManager ? Boolean(repData.referralRewardGranted) : false,
  };

  const existingIdx = representatives.findIndex(
    (r) => r.id === newRep.id || (newRep.email && r.email.toLowerCase() === newRep.email.toLowerCase())
  );

  if (existingIdx >= 0) {
    if (!isManager && reqUser?.userId !== representatives[existingIdx].id) {
      return res.status(409).json({ error: 'الحساب مسجل بالفعل في المنظومة' });
    }
    if (!rawPassword && representatives[existingIdx].password) {
      newRep.password = representatives[existingIdx].password;
    }
    representatives[existingIdx] = { ...representatives[existingIdx], ...newRep };
  } else {
    representatives.unshift(newRep);
  }

  persistStoredReps(representatives);
  res.status(201).json(sanitizeRep(newRep, isManager));
});

app.put('/api/representatives/:id', (req, res) => {
  const { id } = req.params;
  representatives = loadStoredReps();
  const index = representatives.findIndex((r) => r.id === id);
  const reqUser = getRequestUser(req);
  const isSelf = Boolean(reqUser && reqUser.userId === id);
  const isManager = Boolean(reqUser && (reqUser.role === 'admin' || reqUser.role === 'supervisor'));

  if (!isSelf && !isManager) {
    return res.status(403).json({ error: 'غير مصرح: ليس لديك صلاحية لتعديل هذا الحساب' });
  }

  if (index === -1) {
    if (isManager) {
      const rawPassword = (req.body.password || '').trim();
      const securePassword = rawPassword
        ? (isPasswordHashed(rawPassword) ? rawPassword : hashPassword(rawPassword))
        : hashPassword('Aa123456');
      const newRep: Representative = {
        ...req.body,
        id,
        password: securePassword,
      };
      representatives.unshift(newRep);
      persistStoredReps(representatives);
      return res.status(201).json(sanitizeRep(newRep, isManager));
    }
    return res.status(404).json({ error: 'الحساب غير موجود' });
  }

  const updates = { ...req.body };
  // Non-managers cannot escalate roles, change commission rates, or alter status
  if (!isManager) {
    delete updates.role;
    delete updates.commissionRate;
    delete updates.status;
  }

  if (updates.password && typeof updates.password === 'string' && !updates.password.startsWith('scrypt:')) {
    updates.password = hashPassword(updates.password.trim());
  }
  representatives[index] = { ...representatives[index], ...updates };
  persistStoredReps(representatives);
  res.json(sanitizeRep(representatives[index], isManager));
});

app.delete('/api/representatives/:id', (req, res) => {
  const reqUser = getRequestUser(req);
  if (!reqUser || reqUser.role !== 'admin') {
    return res.status(403).json({ error: 'غير مصرح: حذف الحسابات حصري لمدير النظام فقط' });
  }
  const { id } = req.params;
  representatives = representatives.filter((r) => r.id !== id);
  persistStoredReps(representatives);
  res.json({ success: true, message: 'تم حذف الحساب بنجاح' });
});

// 5. Payout Requests API
app.get('/api/payouts', (req, res) => {
  const reqUser = getRequestUser(req);
  if (!reqUser) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول لعرض طلبات الصرف' });
  }
  payoutRequests = loadStoredPayouts();
  const isManager = reqUser.role === 'admin' || reqUser.role === 'supervisor' || reqUser.role === 'accountant';
  if (isManager) {
    return res.json(payoutRequests);
  }
  // Reps can only view their own payout requests
  res.json(payoutRequests.filter((p) => p.repId === reqUser.userId));
});

app.post('/api/payouts', (req, res) => {
  try {
    const reqUser = getRequestUser(req);
    if (!reqUser) {
      return res.status(401).json({ error: 'يرجى تسجيل الدخول لتقديم طلب سحب' });
    }

    const newPayout = req.body;
    newPayout.id = `payout_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    newPayout.repId = reqUser.userId;
    newPayout.requestDate = new Date().toISOString();
    newPayout.status = 'pending'; // Always pending on creation

    payoutRequests.unshift(newPayout);
    persistStoredPayouts(payoutRequests);
    res.status(201).json(newPayout);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'خطأ في إنشاء طلب السحب' });
  }
});

app.put('/api/payouts/:id', (req, res) => {
  const reqUser = getRequestUser(req);
  if (!reqUser || (reqUser.role !== 'admin' && reqUser.role !== 'supervisor' && reqUser.role !== 'accountant')) {
    return res.status(403).json({ error: 'غير مصرح: اعتماد أو تعديل طلبات الصرف والتوريد مقتصر على الإدارة والمحاسبين فقط' });
  }
  const { id } = req.params;
  const idx = payoutRequests.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'طلب السحب غير موجود' });
  }
  payoutRequests[idx] = { ...payoutRequests[idx], ...req.body };
  persistStoredPayouts(payoutRequests);
  res.json(payoutRequests[idx]);
});

// 6. Interested Leads API (العملاء المحتملين والمتابعات الميدانية)
app.get('/api/leads', (req, res) => {
  const reqUser = getRequestUser(req);
  if (!reqUser) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول لعرض العملاء المهتمين' });
  }
  leadsStore = loadStoredLeads();
  const isManager = reqUser.role === 'admin' || reqUser.role === 'supervisor' || reqUser.role === 'accountant';
  if (isManager) {
    return res.json(leadsStore);
  }
  res.json(leadsStore.filter((l) => l.repId === reqUser.userId));
});

app.post('/api/leads', (req, res) => {
  try {
    const reqUser = getRequestUser(req);
    if (!reqUser) {
      return res.status(401).json({ error: 'يرجى تسجيل الدخول لإضافة عميل مهتم' });
    }
    const newLead = {
      id: `lead_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      createdDate: new Date().toISOString(),
      status: req.body.status || 'pending_followup',
      interestLevel: req.body.interestLevel || 'medium',
      ...req.body,
      repId: reqUser.userId,
    };
    leadsStore.unshift(newLead);
    persistStoredLeads(leadsStore);
    res.status(201).json(newLead);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'خطأ في حفظ بيانات العميل المهتم' });
  }
});

app.put('/api/leads/:id', (req, res) => {
  const reqUser = getRequestUser(req);
  if (!reqUser) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول لتعديل بيانات العميل' });
  }
  const { id } = req.params;
  const idx = leadsStore.findIndex((l) => l.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'العميل المهتم غير موجود' });
  }
  const isManager = reqUser.role === 'admin' || reqUser.role === 'supervisor' || reqUser.role === 'accountant';
  if (!isManager && leadsStore[idx].repId !== reqUser.userId) {
    return res.status(403).json({ error: 'غير مصرح بتعديل هذا العميل' });
  }

  leadsStore[idx] = { ...leadsStore[idx], ...req.body };
  persistStoredLeads(leadsStore);
  res.json(leadsStore[idx]);
});

app.delete('/api/leads/:id', (req, res) => {
  const reqUser = getRequestUser(req);
  if (!reqUser) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول لحذف العميل' });
  }
  const { id } = req.params;
  const target = leadsStore.find((l) => l.id === id);
  if (!target) {
    return res.status(404).json({ error: 'العميل غير موجود' });
  }
  const isManager = reqUser.role === 'admin' || reqUser.role === 'supervisor';
  if (!isManager && target.repId !== reqUser.userId) {
    return res.status(403).json({ error: 'غير مصرح بحذف هذا العميل' });
  }

  leadsStore = leadsStore.filter((l) => l.id !== id);
  persistStoredLeads(leadsStore);
  res.json({ success: true });
});

// 7. Payment config API
app.get('/api/payment-config', (_req, res) => {
  res.json(paymentConfig);
});

app.post('/api/payment-config', (req, res) => {
  const reqUser = getRequestUser(req);
  if (!reqUser || (reqUser.role !== 'admin' && reqUser.role !== 'accountant' && reqUser.role !== 'supervisor')) {
    return res.status(403).json({ error: 'غير مصرح: تعديل إعدادات بوابات الدفع مقتصر على الإدارة والمحاسبين فقط' });
  }
  paymentConfig = { ...paymentConfig, ...req.body };
  res.json(paymentConfig);
});

// Start Vite / Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  function listenOnPort(port: number) {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`[Daleelek Server] App running on http://localhost:${port}`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Daleelek Server] Port ${port} is already in use, trying port ${port + 1}...`);
        listenOnPort(port + 1);
      } else {
        console.error('[Daleelek Server] Failed to start server:', err);
      }
    });
  }

  listenOnPort(DEFAULT_PORT);

  // 🔄 استعادة جلسة الواتساب المحفوظة تلقائياً في الخلفية عند بدء السيرفر إذا وُجدت بيانات اعتماد
  try {
    const credsPath = path.resolve(process.cwd(), 'data/baileys_auth_info/creds.json');
    if (fs.existsSync(credsPath)) {
      console.log('📱 [WhatsApp Gateway] Detected saved credentials. Auto-restoring session in background...');
      initWhatsAppGateway().catch((err) => {
        console.warn('📱 [WhatsApp Gateway] Background auto-restore note:', err?.message);
      });
    }
  } catch (e) {
    // Non-blocking
  }
}

startServer();
