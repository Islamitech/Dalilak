import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { INITIAL_BUSINESSES, MOCK_REPRESENTATIVES, DEFAULT_PAYMENT_CONFIG } from './src/data/mockData.js';
import { Business, Representative, PaymentGatewayConfig, PayoutRequest, InterestedLead } from './src/types.js';

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3001;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 🛡️ Security Headers Middleware — يُطبَّق على جميع الاستجابات
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  // CORS: السماح فقط من المصادر الموثوقة
  const allowedOrigins = [
    process.env.APP_URL,
    'http://localhost:3001',
    'http://localhost:5173',
    'https://www.dalilaak.com',
    'https://dalilaak.com',
  ].filter(Boolean) as string[];
  const origin = _req.headers.origin || '';
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-id');
  if (_req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// 🛡️ Security Helpers: Cross-Platform Universal Password Hashing & Verification
function hashPassword(password: string): string {
  if (!password) return '';
  // منع إعادة تشفير الهاشات الموجودة مسبقاً (Account Lockout Protection)
  if (password.startsWith('sha256:') || password.startsWith('scrypt:')) {
    return password;
  }
  const hash = crypto.createHash('sha256').update(password.trim()).digest('hex');
  return `sha256:${hash}`;
}

function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash || !password) return false;
  const cleanPassword = password.trim();

  // 1. Universal SHA-256 Hash Verification (Matches client Web Crypto API 100%)
  if (storedHash.startsWith('sha256:')) {
    const hash = crypto.createHash('sha256').update(cleanPassword).digest('hex');
    const computed = `sha256:${hash}`;
    try {
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(storedHash));
    } catch {
      return computed === storedHash;
    }
  }

  // 2. Legacy scrypt Hash Verification (Backward compatibility)
  if (storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const originalHash = parts[2];
    const hash = crypto.scryptSync(cleanPassword, salt, 64).toString('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
    } catch {
      return false;
    }
  }

  // 3. Backward-compatible Plaintext Verification
  return storedHash === cleanPassword;
}

// 🛡️ Safe Atomic File Writing: Prevents race conditions and file corruption
function atomicWriteFileSync(filePath: string, data: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 7)}.tmp`;
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

// 🛡️ Rate Limiting: منع هجمات Brute Force على تسجيل الدخول
interface RateLimitRecord { count: number; resetAt: number; }
const loginRateLimit = new Map<string, RateLimitRecord>();
const MAX_LOGIN_ATTEMPTS = 5;
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

  // 2. Active Session ID lookup
  if (sessionId && activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId)!;
    if (Date.now() < session.expiresAt) {
      return session;
    } else {
      activeSessions.delete(sessionId);
    }
  }

  // 3. Representative live session verification strictly via valid activeSessionId
  if (sessionId && sessionId.startsWith('sess_')) {
    const reps = representatives.length > 0 ? representatives : loadStoredReps();
    const rep = reps.find((r) => r.activeSessionId === sessionId);
    if (rep && rep.status !== 'suspended') {
      const sessionObj: ActiveSession = {
        userId: rep.id,
        role: rep.role || 'rep',
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };
      activeSessions.set(sessionId, sessionObj);
      return sessionObj;
    }
  }

  return null;
}

// 🛡️ Representative Data Sanitization (Hides sensitive credentials & KYC documents from public)
function sanitizeRep(rep: Representative, isPrivileged: boolean = false): Partial<Representative> {
  const copy = { ...rep };
  delete copy.password;
  if (!isPrivileged) {
    delete copy.nationalId;
    delete copy.nationalIdCardPhoto;
    delete copy.nationalIdCardBackPhoto;
    delete copy.activationFacePhoto;
  }
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
        MOCK_REPRESENTATIVES.forEach((r) => map.set(r.email.toLowerCase(), r));
        data.forEach((r) => map.set(r.email.toLowerCase(), { ...map.get(r.email.toLowerCase()), ...r }));
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
let isServerTestMode = true;

app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    app: 'Daleelek - Google Maps Business Registration',
    testMode: isServerTestMode,
    environment: isServerTestMode ? 'local_test_sandbox' : 'production'
  });
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
  if (process.env.NODE_ENV === 'production' && (!reqUser || reqUser.role !== 'admin')) {
    return res.status(403).json({ error: 'غير مصرح: تفعيل أو تعطيل وضع الاختبار في بيئة الإنتاج مقتصر على مدير النظام' });
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
  if (!isServerTestMode && (!reqUser || reqUser.role !== 'admin')) {
    return res.status(403).json({ error: 'غير مصرح: إعادة ضبط البيانات تتطلب صلاحية مدير النظام' });
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

app.post('/api/auth/login', (req, res) => {
  const { email, password, forceSession } = req.body || {};
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();
  const now = Date.now();
  const newSessionId = `sess_${now}_${Math.random().toString(36).substring(2, 9)}`;

  // 🛡️ Rate Limiting Check: منع هجمات Brute Force
  const clientIp = (req.ip || req.socket?.remoteAddress || 'unknown').replace(/^::ffff:/, '');
  const rateLimitKey = `login_${clientIp}_${cleanEmail}`;
  const attempts = loginRateLimit.get(rateLimitKey);

  if (attempts && now < attempts.resetAt && attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((attempts.resetAt - now) / 1000);
    return res.status(429).json({
      error: `⏳ تم تجاوز الحد المسموح من محاولات تسجيل الدخول (${MAX_LOGIN_ATTEMPTS} محاولات). يرجى الانتظار ${retryAfterSeconds} ثانية قبل المحاولة مجدداً.`,
    });
  }

  // دالة داخلية لتسجيل محاولة فاشلة
  const recordFailedAttempt = () => {
    const current = loginRateLimit.get(rateLimitKey);
    if (!current || now >= current.resetAt) {
      loginRateLimit.set(rateLimitKey, { count: 1, resetAt: now + LOGIN_RATE_WINDOW_MS });
    } else {
      current.count++;
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

  // Strictly reject unregistered accounts
  if (!rep) {
    recordFailedAttempt();
    return res.status(401).json({ error: `⚠️ الحساب (${cleanEmail}) غير مسجل في قاعدة البيانات. لا يُسمح بتسجيل الدخول لأي حساب غير مسجل.` });
  }

  // Verify password strictly with cryptographic hash & backward-compatible plaintext check
  const storedPassword = (rep.password || '').trim();
  const isPassValid = verifyPassword(cleanPassword, storedPassword);

  if (!isPassValid) {
    recordFailedAttempt();
    return res.status(401).json({ error: '⚠️ كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة.' });
  }

  // ✅ تسجيل دخول ناجح — مسح سجل المحاولات الفاشلة
  loginRateLimit.delete(rateLimitKey);

  // Automatic secure password upgrade: If password was plaintext, hash it immediately
  if (!storedPassword.startsWith('scrypt:') && !storedPassword.startsWith('sha256:')) {
    rep.password = hashPassword(cleanPassword);
  }

  if (rep.status === 'suspended') {
    if (rep.avatarStatus === 'rejected') {
      return res.status(403).json({
        error: `❌ تم إيقاف أو رفض هذا الحساب من قِبل إدارة المنظومة.`
      });
    }
    return res.status(403).json({
      error: `⏳ حسابك (${rep.name}) مسجل بنجاح وهو حالياً "قيد المراجعة والتدقيق الإداري". يرجى الانتظار حتى يقوم مدير المنظومة باعتماد وتفعيل الحساب.`
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

  // Register session token with 24-hour expiration
  const authToken = `dalil_tok_${now}_${crypto.randomBytes(24).toString('hex')}`;
  activeSessions.set(authToken, {
    userId: rep.id,
    role: rep.role || 'rep',
    expiresAt: now + 24 * 60 * 60 * 1000,
  });

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
  const { userId, sessionId } = req.body;
  if (!userId || !sessionId) {
    return res.status(400).json({ error: 'Missing userId or sessionId' });
  }

  const rep = representatives.find((r) => r.id === userId || (userId === 'admin_1' && r.role === 'admin'));
  if (rep) {
    if (rep.activeSessionId && rep.activeSessionId !== sessionId) {
      // Another session took over
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
  const { userId, sessionId } = req.body;
  const rep = representatives.find((r) => r.id === userId || (userId === 'admin_1' && r.role === 'admin'));
  if (rep && (!sessionId || rep.activeSessionId === sessionId)) {
    rep.activeSessionId = undefined;
    rep.lastActiveTimestamp = undefined;
    persistStoredReps(representatives);
  }
  res.json({ status: 'logged_out' });
});

// 3. Businesses API
app.get('/api/businesses', (_req, res) => {
  businesses = loadStoredBusinesses();
  res.json(businesses);
});

app.get('/api/businesses/:id', (req, res) => {
  businesses = loadStoredBusinesses();
  const found = businesses.find((b) => b.id === req.params.id);
  if (found) {
    res.json(found);
  } else {
    res.status(404).json({ error: 'النشاط التجاري غير موجود' });
  }
});

app.post('/api/businesses', (req, res) => {
  try {
    const newBiz: Business = req.body;

    // 🛡️ Input Validation: التحقق من الحقول المطلوبة
    const validationError = validateRequiredFields(req.body, ['nameAr', 'phone', 'repId']);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (!newBiz.id) {
      newBiz.id = `biz_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
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
  if (!isServerTestMode && index >= 0) {
    if (!reqUser) {
      return res.status(401).json({ error: 'يرجى تسجيل الدخول لتعديل النشاط' });
    }
    const isManager = reqUser.role === 'admin' || reqUser.role === 'supervisor' || reqUser.role === 'accountant';
    const isOwner = businesses[index].repId === reqUser.userId;
    if (!isManager && !isOwner) {
      return res.status(403).json({ error: 'غير مصرح بتعديل هذا النشاط' });
    }
  }

  if (index === -1) {
    businesses.unshift({ ...req.body, id });
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
  if (!isServerTestMode) {
    if (!reqUser) {
      return res.status(401).json({ error: 'يرجى تسجيل الدخول لحذف النشاط' });
    }
    const isManager = reqUser.role === 'admin' || reqUser.role === 'supervisor';
    const isCreator = targetBiz.repId === reqUser.userId;
    const isUnverified = targetBiz.verificationStatus !== 'verified' && targetBiz.googleSyncStatus !== 'synced';

    if (!isManager && !(isCreator && isUnverified)) {
      return res.status(403).json({ error: 'غير مصرح بحذف هذا النشاط' });
    }
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
  representatives = loadStoredReps();
  const reqUser = getRequestUser(req);
  const isPrivileged = reqUser?.role === 'admin' || reqUser?.role === 'supervisor';
  res.json(representatives.map((r) => sanitizeRep(r, isPrivileged)));
});

app.post('/api/representatives', (req, res) => {
  const repData = req.body;
  const rawPassword = (repData.password || '').trim();
  const securePassword = rawPassword
    ? (rawPassword.startsWith('scrypt:') ? rawPassword : hashPassword(rawPassword))
    : hashPassword('Aa123456');

  const newRep: Representative = {
    id: repData.id || `rep_${Date.now()}`,
    name: repData.name,
    email: repData.email,
    phone: repData.phone,
    pendingPhone: repData.pendingPhone || undefined,
    phoneStatus: repData.phoneStatus || 'none',
    nationalId: repData.nationalId || '',
    activationFacePhoto: repData.activationFacePhoto || repData.avatar || '',
    nationalIdCardPhoto: repData.nationalIdCardPhoto || '',
    nationalIdCardBackPhoto: repData.nationalIdCardBackPhoto || '',
    role: repData.role || 'rep',
    roleTitle: repData.roleTitle || (repData.role === 'admin' ? 'مدير نظام' : repData.role === 'supervisor' ? 'مشرف منطقة' : repData.role === 'accountant' ? 'محاسب' : 'مندوب مبيعات ميداني'),
    governorate: repData.governorate || 'القاهرة',
    targetMonth: Number(repData.targetMonth) || 25,
    avatar: repData.avatar || '',
    avatarStatus: repData.avatarStatus || 'none',
    commissionRate: Number(repData.commissionRate) || 42.86,
    status: repData.status || 'suspended',
    password: securePassword,
    referralCode: repData.referralCode || `DALIL-${Date.now().toString().slice(-4)}`,
    referredByCode: repData.referredByCode || undefined,
    referralUnlocked: Boolean(repData.referralUnlocked),
    adminBypassReferral: Boolean(repData.adminBypassReferral),
    referralRewardGranted: Boolean(repData.referralRewardGranted),
  };

  const existingIdx = representatives.findIndex(
    (r) => r.id === newRep.id || r.email.toLowerCase() === newRep.email.toLowerCase()
  );
  if (existingIdx >= 0) {
    if (!rawPassword && representatives[existingIdx].password) {
      newRep.password = representatives[existingIdx].password;
    }
    representatives[existingIdx] = { ...representatives[existingIdx], ...newRep };
  } else {
    representatives.unshift(newRep);
  }

  persistStoredReps(representatives);
  res.status(201).json(sanitizeRep(newRep, true));
});

app.put('/api/representatives/:id', (req, res) => {
  const { id } = req.params;
  const index = representatives.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'الحساب غير موجود' });
  }

  const reqUser = getRequestUser(req);
  const isSelf = reqUser && reqUser.userId === id;
  const isManager = reqUser && (reqUser.role === 'admin' || reqUser.role === 'supervisor');

  if (!isServerTestMode && !isSelf && !isManager) {
    return res.status(403).json({ error: 'غير مصرح: ليس لديك صلاحية لتعديل هذا الحساب' });
  }

  const updates = { ...req.body };
  // Non-managers cannot escalate roles, change commission rates, or alter status
  if (!isManager && !isServerTestMode) {
    delete updates.role;
    delete updates.commissionRate;
    delete updates.status;
  }

  if (updates.password && typeof updates.password === 'string' && !updates.password.startsWith('scrypt:')) {
    updates.password = hashPassword(updates.password.trim());
  }
  representatives[index] = { ...representatives[index], ...updates };
  persistStoredReps(representatives);
  res.json(sanitizeRep(representatives[index], true));
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
app.get('/api/payouts', (_req, res) => {
  payoutRequests = loadStoredPayouts();
  res.json(payoutRequests);
});

app.post('/api/payouts', (req, res) => {
  try {
    const newPayout = req.body;
    if (!newPayout.id) {
      newPayout.id = `payout_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    if (!newPayout.requestDate) {
      newPayout.requestDate = new Date().toISOString();
    }
    if (!newPayout.status) {
      newPayout.status = 'pending';
    }
    payoutRequests.unshift(newPayout);
    persistStoredPayouts(payoutRequests);
    res.status(201).json(newPayout);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'خطأ في إنشاء طلب السحب' });
  }
});

app.put('/api/payouts/:id', (req, res) => {
  const reqUser = getRequestUser(req);
  if (!isServerTestMode && (!reqUser || (reqUser.role !== 'admin' && reqUser.role !== 'supervisor' && reqUser.role !== 'accountant'))) {
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
app.get('/api/leads', (_req, res) => {
  leadsStore = loadStoredLeads();
  res.json(leadsStore);
});

app.post('/api/leads', (req, res) => {
  try {
    const newLead = {
      id: req.body.id || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdDate: new Date().toISOString(),
      status: req.body.status || 'pending_followup',
      interestLevel: req.body.interestLevel || 'medium',
      ...req.body,
    };
    leadsStore.unshift(newLead);
    persistStoredLeads(leadsStore);
    res.status(201).json(newLead);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'خطأ في حفظ بيانات العميل المهتم' });
  }
});

app.put('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  const idx = leadsStore.findIndex((l) => l.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'العميل المهتم غير موجود' });
  }
  leadsStore[idx] = { ...leadsStore[idx], ...req.body };
  persistStoredLeads(leadsStore);
  res.json(leadsStore[idx]);
});

app.delete('/api/leads/:id', (req, res) => {
  const { id } = req.params;
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
}

startServer();
