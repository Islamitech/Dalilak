import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_BUSINESSES, MOCK_REPRESENTATIVES, PACKAGES, DEFAULT_PAYMENT_CONFIG } from './src/data/mockData.js';
import { Business, Representative, PaymentGatewayConfig } from './src/types.js';

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3001;

app.use(express.json({ limit: '25mb' }));

// In-memory persistent data store
let businesses: Business[] = [...INITIAL_BUSINESSES];
let representatives: Representative[] = [...MOCK_REPRESENTATIVES];
let paymentConfig: PaymentGatewayConfig = { ...DEFAULT_PAYMENT_CONFIG };

// REST API Endpoints

// 1. Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Daleelek - Google Maps Business Registration' });
});

// 2. Auth endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;

  if (role === 'admin' || email === 'admin@gmail.com') {
    if (email === 'admin@gmail.com' && password === 'Aa132456') {
      return res.json({
        user: {
          id: 'admin_1',
          name: 'مدير النظام دليلك',
          email: 'admin@gmail.com',
          role: 'admin',
        },
        token: 'admin-secret-token-2026',
      });
    } else {
      return res.status(401).json({ error: 'كلمة المرور أو البريد الإلكتروني للمدير غير صحيح' });
    }
  }

  // Representative login
  const rep = representatives.find((r) => r.email.toLowerCase() === email?.toLowerCase());
  if (rep) {
    return res.json({
      user: {
        id: rep.id,
        name: rep.name,
        email: rep.email,
        role: 'rep',
        repData: rep,
      },
      token: `rep-token-${rep.id}`,
    });
  }

  // Fallback rep login for testing
  const firstRep = representatives[0];
  return res.json({
    user: {
      id: firstRep.id,
      name: firstRep.name,
      email: firstRep.email,
      role: 'rep',
      repData: firstRep,
    },
    token: `rep-token-${firstRep.id}`,
  });
});

// 3. Businesses API
app.get('/api/businesses', (_req, res) => {
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
      newBiz.createdDate = new Date().toISOString().split('T')[0];
    }

    businesses.unshift(newBiz);
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
  res.json(businesses[index]);
});

app.delete('/api/businesses/:id', (req, res) => {
  const { id } = req.params;
  businesses = businesses.filter((b) => b.id !== id);
  res.json({ success: true, message: 'تم حذف النشاط بنجاح' });
});

// 4. Representatives API
app.get('/api/representatives', (_req, res) => {
  res.json(representatives);
});

app.post('/api/representatives', (req, res) => {
  const newRep: Representative = {
    id: `acc_${Date.now()}`,
    name: req.body.name,
    email: req.body.email || `acc_${Date.now()}@daleelek.eg`,
    phone: req.body.phone,
    role: req.body.role || 'rep',
    roleTitle: req.body.roleTitle || (req.body.role === 'admin' ? 'مدير نظام' : req.body.role === 'supervisor' ? 'مشرف منطقة' : req.body.role === 'accountant' ? 'محاسب' : 'مندوب ميداني'),
    governorate: req.body.governorate || 'القاهرة',
    targetMonth: Number(req.body.targetMonth) || 20,
    avatar: req.body.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    commissionRate: Number(req.body.commissionRate) || 15,
    status: req.body.status || 'active',
    password: req.body.password || 'Aa123456',
  };
  representatives.push(newRep);
  res.status(201).json(newRep);
});

app.put('/api/representatives/:id', (req, res) => {
  const { id } = req.params;
  const index = representatives.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'الحساب غير موجود' });
  }
  representatives[index] = { ...representatives[index], ...req.body };
  res.json(representatives[index]);
});

app.delete('/api/representatives/:id', (req, res) => {
  const { id } = req.params;
  representatives = representatives.filter((r) => r.id !== id);
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
