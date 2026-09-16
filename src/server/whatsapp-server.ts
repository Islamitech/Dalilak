import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
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
  PRIMARY_WHATSAPP_SENDER_PHONE,
} from './whatsapp-gateway.js';
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

  // If call is local machine and no headers provided, still permit for local automated CLI scripts
  if (isLocalClient && (!userEmail && !userPhone)) {
    return true;
  }

  return false;
}

// -----------------------------------------------------------------------------
// Health & Info Endpoint
// -----------------------------------------------------------------------------
app.get(['/', '/health', '/api/health'], (_req, res) => {
  const session = getWhatsAppSessionStatus();
  const campaign = getCampaignProgress();
  return res.json({
    status: 'ok',
    service: 'Dalelak Dedicated WhatsApp Gateway',
    version: '2.0.0 (Standalone)',
    port: PORT,
    connectionState: session.state,
    connectedUser: session.connectedUser,
    activeCampaign: campaign
      ? {
          id: campaign.id,
          status: campaign.status,
          total: campaign.total,
          current: campaign.current,
          successful: campaign.successful,
          failed: campaign.failed,
          skipped: campaign.skipped,
        }
      : null,
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
    const status = await initWhatsAppGateway();
    return res.json({ success: true, status });
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
    await disconnectWhatsAppGateway();
    return res.json({
      success: true,
      message: 'تم إنهاء جلسة واتساب وحذف ملفات الاعتماد بأمان.',
    });
  } catch (err: any) {
    console.error('[WhatsApp Server] Disconnect error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'فشل قطع الاتصال بجلسة واتساب' });
  }
});

// 4. Launch Broadcast Campaign
app.post(['/api/whatsapp/broadcast', '/api/admin/whatsapp/broadcast'], async (req, res) => {
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
      targetBusinesses = [],
      minDelaySeconds = 10,
      maxDelaySeconds = 20,
      skipRecentlyContacted = true,
    } = req.body;

    const targetList: Business[] = Array.isArray(targetBusinesses) ? targetBusinesses : [];

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
app.post(['/api/whatsapp/clear-progress', '/api/admin/whatsapp/clear-progress'], (req, res) => {
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

    // Auto-restore WhatsApp session if saved credentials exist
    try {
      const credsPath = path.resolve(process.cwd(), 'data/baileys_auth_info/creds.json');
      if (fs.existsSync(credsPath)) {
        console.log(' 📱 [WhatsApp Gateway] Detected saved credentials. Auto-restoring session in background...');
        initWhatsAppGateway().catch((err) => {
          console.warn(' 📱 [WhatsApp Gateway] Auto-restore notice:', err?.message);
        });
      } else {
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

startListening(PORT);
