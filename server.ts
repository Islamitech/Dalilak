import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_BUSINESSES, MOCK_REPRESENTATIVES, DEFAULT_PAYMENT_CONFIG } from './src/data/mockData.js';
import { Business, Representative, PaymentGatewayConfig } from './src/types.js';

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3001;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    fs.writeFileSync(REPS_STORE_PATH, JSON.stringify(reps, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error persisting reps:', e);
  }
}

function loadStoredBusinesses(): Business[] {
  try {
    if (fs.existsSync(BIZ_STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(BIZ_STORE_PATH, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.error('Error loading stored businesses:', e);
  }
  return [...INITIAL_BUSINESSES];
}

function persistStoredBusinesses(bizList: Business[]) {
  try {
    fs.writeFileSync(BIZ_STORE_PATH, JSON.stringify(bizList, null, 2), 'utf-8');
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
    fs.writeFileSync(PAYOUTS_STORE_PATH, JSON.stringify(payoutList, null, 2), 'utf-8');
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
    const dir = path.dirname(LEADS_STORE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LEADS_STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting leads:', err);
  }
}

let businesses: Business[] = loadStoredBusinesses();
let representatives: Representative[] = loadStoredReps();
let payoutRequests: any[] = loadStoredPayouts();
let leadsStore: any[] = loadStoredLeads();
let paymentConfig: PaymentGatewayConfig = { ...DEFAULT_PAYMENT_CONFIG };

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
  if (typeof req.body.testMode === 'boolean') {
    isServerTestMode = req.body.testMode;
  }
  res.json({ 
    success: true, 
    testMode: isServerTestMode,
    message: isServerTestMode ? 'تم تفعيل وضع الاختبار المحلي' : 'تم تفعيل وضع الإنتاج المباشر'
  });
});

app.post('/api/test-mode/reset', (_req, res) => {
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
    return res.status(401).json({ error: `⚠️ الحساب (${cleanEmail}) غير مسجل في قاعدة البيانات. لا يُسمح بتسجيل الدخول لأي حساب غير مسجل.` });
  }

  // Verify password strictly based on role
  const storedPassword = (rep.password || '').trim();
  const isAdminUser = rep.role === 'admin' || rep.email.toLowerCase() === 'info@dalilaak.com';
  const isPassValid =
    storedPassword && storedPassword !== '••••••••'
      ? storedPassword === cleanPassword
      : (isAdminUser ? cleanPassword === 'admin' : cleanPassword === 'Aa123456');

  if (!isPassValid) {
    return res.status(401).json({ error: '⚠️ كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة.' });
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

  return res.json({
    user: {
      id: rep.id,
      name: rep.name,
      email: rep.email,
      role: rep.role,
      repData: rep,
      activeSessionId: newSessionId,
      lastActiveTimestamp: now,
    },
    sessionId: newSessionId,
    token: 'auth-token-' + rep.id,
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

app.post('/api/businesses', (req, res) => {
  try {
    const newBiz: Business = req.body;
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
  businesses = businesses.filter((b) => b.id !== id);
  persistStoredBusinesses(businesses);

  if (targetBiz) {
    leadsStore = leadsStore.filter((l) => l.id !== id && (!targetBiz.phone || l.phone !== targetBiz.phone));
    persistStoredLeads(leadsStore);
  }

  res.json({ success: true, message: 'تم حذف النشاط وكافة بياناته نهائياً بنجاح' });
});

// 4. Representatives API
app.get('/api/representatives', (_req, res) => {
  representatives = loadStoredReps();
  res.json(representatives);
});

app.post('/api/representatives', (req, res) => {
  const repData = req.body;
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
    password: repData.password || 'Aa123456',
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
    representatives[existingIdx] = { ...representatives[existingIdx], ...newRep };
  } else {
    representatives.unshift(newRep);
  }

  persistStoredReps(representatives);
  res.status(201).json(newRep);
});

app.put('/api/representatives/:id', (req, res) => {
  const { id } = req.params;
  const index = representatives.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'الحساب غير موجود' });
  }
  representatives[index] = { ...representatives[index], ...req.body };
  persistStoredReps(representatives);
  res.json(representatives[index]);
});

app.delete('/api/representatives/:id', (req, res) => {
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
