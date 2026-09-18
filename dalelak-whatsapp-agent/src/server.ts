import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';

process.on('uncaughtException', (err) => {
  console.error('[Dalelak Standalone Agent] Uncaught exception caught safely:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Dalelak Standalone Agent] Unhandled rejection at:', promise, 'reason:', reason);
});
import {
  connectSlot,
  disconnectSlot,
  getSlotStatus,
  getAllSlotsStatus,
  slotSessions,
  resetCircuitBreaker,
  recordOutboundMessage,
  rotationConfig,
  switchActiveSlot,
  setRotationMode,
  updateSlotSafetySettings,
  pingSlotHealth,
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
} from './whatsapp-ai-agent.js';
import {
  prepareBusinessGiftPackage,
  recordDeliveredGift,
  getDeliveredGifts,
  generateBrandedQrBuffer,
} from './whatsapp-gift-service.js';
import { formatWhatsAppPhone, cleanWhatsAppText } from './phoneFormatter.js';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../public');

const app = express();
const PORT = Number(process.env.PORT) || 3005;
const HOST = process.env.HOST || '0.0.0.0';

// Native Lightweight CORS & Security Headers
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve embedded dashboard static files
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
}

// Serve root dashboard
app.get('/', (_req, res) => {
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.json({ status: 'ok', service: 'dalelak-whatsapp-agent' });
});

// ----------------------------------------------------
// Health & Radar Telemetry
// ----------------------------------------------------
app.get('/api/whatsapp/health', (_req, res) => {
  const slots = getAllSlotsStatus();
  const isAnyConnected = slots.some((s) => s.state === 'connected');
  res.json({
    status: 'ok',
    service: 'dalelak-whatsapp-agent',
    timestamp: new Date().toISOString(),
    isAnyConnected,
    slots,
    rotationConfig,
  });
});

app.get('/api/whatsapp/status', (_req, res) => {
  res.json({
    success: true,
    slots: getAllSlotsStatus(),
    rotationConfig,
  });
});

// Dual-Slot Rotation Handlers
app.post('/api/whatsapp/rotation/switch', (req, res) => {
  const { targetSlot } = req.body || {};
  const updated = switchActiveSlot(targetSlot);
  res.json({ success: true, rotationConfig: updated });
});

app.post('/api/whatsapp/rotation/mode', (req, res) => {
  const { mode = 'batch_round_robin', batchSize = 15 } = req.body || {};
  const updated = setRotationMode(mode, Number(batchSize) || 15);
  res.json({ success: true, rotationConfig: updated });
});

app.post('/api/whatsapp/connect', async (req, res) => {
  const { slot = '1' } = req.body;
  try {
    await connectSlot(slot);
    res.json({
      success: true,
      message: `Connecting slot ${slot}...`,
      status: getSlotStatus(slot),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to connect slot' });
  }
});

app.post('/api/whatsapp/disconnect', async (req, res) => {
  const { slot = '1' } = req.body;
  try {
    await disconnectSlot(slot);
    res.json({ success: true, message: `Disconnected slot ${slot}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to disconnect slot' });
  }
});

app.post('/api/whatsapp/circuit-breaker/reset', (req, res) => {
  const { slot = '1', slotId } = req.body || {};
  const target = slotId || slot || '1';
  resetCircuitBreaker(target);
  res.json({ success: true, message: `Circuit breaker reset for slot ${target}` });
});

app.post('/api/whatsapp/slot/settings', (req, res) => {
  const { slotId = '1', hourlyCap, batchSize } = req.body || {};
  const updated = updateSlotSafetySettings(slotId, {
    hourlyCap: hourlyCap ? Number(hourlyCap) : undefined,
    batchSize: batchSize ? Number(batchSize) : undefined,
  });
  res.json({ success: true, message: 'تم حفظ وتطبيق إعدادات الخط والسرعة بنجاح', ...updated });
});

app.post(['/api/whatsapp/slot/ping', '/api/whatsapp/ping'], async (req, res) => {
  const { slotId = '1' } = req.body || {};
  const result = await pingSlotHealth(slotId);
  res.json({
    slotId,
    ...result,
    message: result.success
      ? `الخط متصل ومستقر بنبض ممتاز (${result.latencyMs}ms)`
      : 'الخط غير متصل حالياً أو بمرحلة التهيئة',
  });
});

app.post(['/api/whatsapp/clear-progress', '/api/whatsapp/campaign/clear-progress'], (_req, res) => {
  const campFile = path.resolve(process.cwd(), 'data/whatsapp_campaign_progress.json');
  if (fs.existsSync(campFile)) {
    try { fs.unlinkSync(campFile); } catch {}
  }
  res.json({ success: true, message: 'تم تصفير وأرشفة تقدم الحملة بنجاح.' });
});

// ----------------------------------------------------
// Grok AI Agent Endpoints
// ----------------------------------------------------
app.get('/api/whatsapp/ai/config', (_req, res) => {
  const cfg = getWhatsAppAiConfig();
  res.json({
    success: true,
    config: {
      ...cfg,
      apiKey: cfg.apiKey ? `xai-${cfg.apiKey.slice(-4).padStart(cfg.apiKey.length, '•')}` : '',
      isKeyConfigured: Boolean(cfg.apiKey),
    },
  });
});

app.post('/api/whatsapp/ai/config', (req, res) => {
  const updates = req.body || {};
  if (updates.apiKey && updates.apiKey.includes('•')) {
    delete updates.apiKey; // Do not overwrite with masked key
  }
  const saved = saveWhatsAppAiConfig(updates);
  res.json({
    success: true,
    message: 'تم حفظ إعدادات Grok بنجاح',
    config: {
      ...saved,
      apiKey: saved.apiKey ? `xai-${saved.apiKey.slice(-4).padStart(saved.apiKey.length, '•')}` : '',
      isKeyConfigured: Boolean(saved.apiKey),
    },
  });
});

app.get('/api/whatsapp/ai/conversations', (_req, res) => {
  const threads = getAllAiConversations();
  res.json({ success: true, threads });
});

app.get('/api/whatsapp/ai/audit', (_req, res) => {
  const logs = getAiAuditLogs();
  res.json({ success: true, logs });
});

app.post('/api/whatsapp/ai/mute', (req, res) => {
  const { phone, minutes = 1440 } = req.body;
  if (!phone) return res.status(400).json({ success: false, error: 'Phone number is required' });
  muteConversationForHuman(phone, Number(minutes));
  res.json({ success: true, message: `تم كتم الرد الآلي للرقم ${phone} لمدة ${minutes} دقيقة للتدخل البشري` });
});

app.post('/api/whatsapp/ai/unmute', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ success: false, error: 'Phone number is required' });
  unmuteConversation(phone);
  res.json({ success: true, message: `تم استئناف الذكاء الاصطناعي للرقم ${phone}` });
});

app.post('/api/whatsapp/ai/emergency-kill', (req, res) => {
  const { enabled } = req.body;
  saveWhatsAppAiConfig({ enabled: Boolean(enabled) });
  res.json({
    success: true,
    enabled: Boolean(enabled),
    message: enabled ? 'تم استئناف عمل الذكاء الاصطناعي' : 'تم تفعيل إيقاف الطوارئ لكافة ردود الذكاء الاصطناعي',
  });
});

// ----------------------------------------------------
// Gifts & QR Codes Endpoints
// ----------------------------------------------------
app.get('/api/whatsapp/gift/delivered', (_req, res) => {
  const list = getDeliveredGifts();
  res.json({ success: true, deliveredGifts: list });
});

app.post('/api/whatsapp/gift/send-manual', async (req, res) => {
  const { phone, slot = '1', businessId } = req.body;
  if (!phone) return res.status(400).json({ success: false, error: 'Phone is required' });

  const cleanPhone = formatWhatsAppPhone(phone);
  let biz = businessId ? findBusinessById(businessId) : null;
  if (!biz) biz = findBusinessByPhone(cleanPhone);
  if (!biz) {
    biz = {
      id: businessId || `biz_${cleanPhone}`,
      nameAr: 'منشأة تجارية',
      phone: cleanPhone,
    };
  }

  const session = slotSessions[slot] || slotSessions['1'];
  if (!session || !session.sock || session.connectionState !== 'connected') {
    return res.status(400).json({ success: false, error: 'هاتف الإرسال المحدد غير متصل حالياً.' });
  }

  try {
    const giftPkg = await prepareBusinessGiftPackage(biz);
    const targetJid = `${cleanPhone}@s.whatsapp.net`;
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

    recordOutboundMessage(slot);
    recordDeliveredGift({
      businessId: biz.id,
      businessName: biz.nameAr || biz.name || 'منشأة',
      phone: cleanPhone,
      deliveredAt: new Date().toISOString(),
      source: giftPkg.source,
      targetUrl: giftPkg.targetUrl,
    });

    res.json({
      success: true,
      message: `تم إرسال باقة ملصقات الـ QR والهدية (${itemsToSend.length} ملصقات فاخرة) بنجاح إلى ${biz.nameAr} (${cleanPhone})!`,
      source: giftPkg.source,
      count: itemsToSend.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'فشل إرسال كارت الهدية' });
  }
});

// Upload & Assign Companion App Design
app.post(['/api/whatsapp/gift/upload-companion-design', '/api/admin/whatsapp/gift/upload-companion-design'], async (req, res) => {
  try {
    const { businessId, imageBase64, designDataUrl, image, format = 'png', autoSend = false, phone, slot = '1' } = req.body || {};
    const rawImage = imageBase64 || designDataUrl || image;
    if (!businessId || !rawImage) {
      return res.status(400).json({ success: false, error: 'businessId والصورة (imageBase64 أو designDataUrl) مطلوبان.' });
    }

    const base64Data = rawImage.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const designsDir = path.resolve(process.cwd(), 'data/generated_designs');
    if (!fs.existsSync(designsDir)) {
      fs.mkdirSync(designsDir, { recursive: true });
    }

    const filePath = path.join(designsDir, `${businessId}.${format === 'jpg' || format === 'jpeg' ? 'jpg' : 'png'}`);
    fs.writeFileSync(filePath, buffer);

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

    if (autoSend && phone) {
      const cleanPhone = formatWhatsAppPhone(phone);
      const session = slotSessions[slot] || slotSessions['1'];
      if (session && session.sock && session.connectionState === 'connected') {
        const targetJid = `${cleanPhone}@s.whatsapp.net`;
        const biz = findBusinessByPhone(cleanPhone) || { id: businessId, nameAr: 'منشأة تجارية', phone: cleanPhone };
        const giftPkg = await prepareBusinessGiftPackage(biz as any);

        await session.sock.sendMessage(targetJid, {
          image: buffer,
          caption: giftPkg.caption,
        });

        recordOutboundMessage(slot);
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
    return res.status(500).json({ success: false, error: err?.message || 'فشل حفظ التصميم' });
  }
});

app.get('/api/whatsapp/gift/preview-qr', async (req, res) => {
  const { url = 'https://www.dalilaak.com', name = 'دليلك' } = req.query;
  try {
    const buffer = await generateBrandedQrBuffer(String(url), String(name));
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).send('Failed to render QR');
  }
});

// Fallback to embedded dashboard index.html
app.get('*', (_req, res) => {
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      service: 'dalelak-whatsapp-agent',
      status: 'online',
      message: 'Standalone WhatsApp Agent is running.',
    });
  }
});

app.listen(PORT, HOST, () => {
  console.log('=============================================================');
  console.log(`🚀 [Dalelak WhatsApp Standalone Agent] Running on http://${HOST}:${PORT}`);
  console.log(`📡 Multi-Slot Anti-Ban Radar & xAI Grok Engine Online.`);
  console.log('=============================================================');
});
