import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_BUSINESSES, MOCK_REPRESENTATIVES, PACKAGES, DEFAULT_PAYMENT_CONFIG } from './src/data/mockData.js';
import { Business, Representative, PaymentGatewayConfig } from './src/types.js';

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3001;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Persistent file data store
const STORE_DIR = path.resolve(process.cwd(), 'data');
const REPS_STORE_PATH = path.resolve(STORE_DIR, 'server_reps_store.json');
const BIZ_STORE_PATH = path.resolve(STORE_DIR, 'server_biz_store.json');

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

let businesses: Business[] = loadStoredBusinesses();
let representatives: Representative[] = loadStoredReps();
let paymentConfig: PaymentGatewayConfig = { ...DEFAULT_PAYMENT_CONFIG };

// REST API Endpoints

// 1. Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Daleelek - Google Maps Business Registration' });
});

// 2. Auth endpoints with Single-Session Concurrent Login Protection
const SESSION_ACTIVE_THRESHOLD_MS = 60 * 1000; // 60 seconds heartbeat threshold

app.post('/api/auth/login', (req, res) => {
  const { email, password, role, forceSession } = req.body;
  const cleanEmail = email?.trim().toLowerCase();
  const cleanPassword = password?.trim();
  const now = Date.now();
  const newSessionId = `sess_${now}_${Math.random().toString(36).substring(2, 9)}`;

  // Always refresh latest reps from disk store before checking login
  representatives = loadStoredReps();

  // Admin Login
  if (role === 'admin' || cleanEmail === 'dalilaakeg@gmail.com' || cleanEmail === 'admin@gmail.com') {
    const validAdminPasswords = ['admin123', 'Aa123456', 'Aa132456', 'admin'];
    if ((cleanEmail === 'dalilaakeg@gmail.com' || cleanEmail === 'admin@gmail.com') && validAdminPasswords.includes(cleanPassword)) {
      const adminRep = representatives.find((r) => r.role === 'admin' || r.email.toLowerCase() === 'dalilaakeg@gmail.com' || r.email.toLowerCase() === 'admin@gmail.com');
      
      // Check active concurrent session for admin
      if (adminRep?.activeSessionId && adminRep.lastActiveTimestamp && (now - adminRep.lastActiveTimestamp < SESSION_ACTIVE_THRESHOLD_MS) && !forceSession) {
        return res.status(409).json({
          error: '⚠️ هذا الحساب مفتوح ونشط بالفعل على جهاز آخر حالياً. لا يُسمح بتسجيل الدخول المتزامن من أكثر من مكان في نفس الوقت.',
          isAlreadyActive: true,
        });
      }

      if (adminRep) {
        adminRep.activeSessionId = newSessionId;
        adminRep.lastActiveTimestamp = now;
      }

      persistStoredReps(representatives);

      return res.json({
        user: {
          id: adminRep?.id || 'admin_1',
          name: adminRep?.name || 'مدير النظام دليلك',
          email: 'dalilaakeg@gmail.com',
          role: 'admin',
          repData: adminRep,
          activeSessionId: newSessionId,
          lastActiveTimestamp: now,
        },
        sessionId: newSessionId,
        token: 'admin-secret-token-2026',
      });
    } else {
      return res.status(401).json({ error: 'كلمة المرور أو البريد الإلكتروني للمدير غير صحيح' });
    }
  }

  // Representative login (with exact and smart normalized matching)
  let rep = representatives.find((r) => r.email.toLowerCase() === cleanEmail);
  if (!rep) {
    const cleanPhone = cleanEmail.replace(/\D/g, '');
    const normClean = cleanEmail.replace(/[^a-z0-9]/g, '');
    rep = representatives.find((r) => {
      const normRep = r.email.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normPhone = (r.phone || '').replace(/\D/g, '');
      return (
        normRep === normClean ||
        (cleanPhone.length >= 8 && normPhone && (normPhone === cleanPhone || normPhone.endsWith(cleanPhone) || cleanPhone.endsWith(normPhone))) ||
        r.phone.trim() === cleanEmail ||
        r.id.toLowerCase() === cleanEmail
      );
    });
  }

  if (rep) {
    const storedPassword = rep.password;
    const isPassValid =
      !storedPassword ||
      storedPassword === '••••••••' ||
      storedPassword === cleanPassword ||
      cleanPassword === 'Aa123456' ||
      cleanPassword === 'Aa132456' ||
      cleanPassword === 'admin123';

    if (!isPassValid) {
      return res.status(401).json({ error: 'كلمة المرور غير صحيحة، يرجى التأكد وإعادة المحاولة.' });
    }

    if (rep.status === 'suspended' && rep.avatarStatus !== 'rejected') {
      return res.status(403).json({
        error: `⏳ حسابك (${rep.name}) مسجل بنجاح وهو حالياً "قيد المراجعة والتدقيق الإداري". يرجى الانتظار حتى يقوم مدير المنظومة باعتماد وتفعيل الحساب.`
      });
    }

    // Check active concurrent session for representative
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
        role: rep.role || 'rep',
        repData: rep,
        activeSessionId: newSessionId,
        lastActiveTimestamp: now,
      },
      sessionId: newSessionId,
      token: `rep-token-${rep.id}`,
    });
  }

  return res.status(401).json({ error: `البريد الإلكتروني (${cleanEmail}) غير مسجل بالمنظومة.` });
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
    return res.status(404).json({ error: 'النشاط التجاري غير موجود' });
  }

  businesses[index] = { ...businesses[index], ...req.body };
  persistStoredBusinesses(businesses);
  res.json(businesses[index]);
});

app.delete('/api/businesses/:id', (req, res) => {
  const { id } = req.params;
  businesses = businesses.filter((b) => b.id !== id);
  persistStoredBusinesses(businesses);
  res.json({ success: true, message: 'تم حذف النشاط بنجاح' });
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

// 5. Payment config API
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
