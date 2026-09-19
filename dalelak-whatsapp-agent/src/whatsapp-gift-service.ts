import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { Business } from './types.js';
import { getDisplayDirectoryUrl } from './directoryUrl.js';

export interface BusinessGiftItem {
  type: 'classic_a4' | 'dark_vip' | 'counter_landscape' | 'quad_tables' | 'custom';
  title: string;
  buffer: Buffer;
  caption: string;
  contentType: 'image/png' | 'image/jpeg';
}

export interface BusinessGiftResult {
  buffer: Buffer;
  caption: string;
  contentType: 'image/png' | 'image/jpeg';
  source: 'external_app' | 'generated_qr';
  targetUrl: string;
  bundle: BusinessGiftItem[];
}

export interface DeliveredGiftRecord {
  businessId: string;
  businessName: string;
  phone: string;
  deliveredAt: string;
  source: 'external_app' | 'generated_qr';
  targetUrl: string;
}

const GIFTS_LOG_PATH = path.resolve(process.cwd(), 'data/whatsapp_gifts_log.json');
const GIFTS_REGISTRY_PATH = path.resolve(process.cwd(), 'data/business_gifts_registry.json');
const DESIGNS_DIR = path.resolve(process.cwd(), 'data/generated_designs');

/**
 * 📁 Ensures necessary directories exist
 */
function ensureDirectories() {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DESIGNS_DIR)) {
    fs.mkdirSync(DESIGNS_DIR, { recursive: true });
  }
}

/**
 * 🎁 Checks if the separate design application has generated a design for this business
 */
export async function findCompanionAppDesign(bizId: string): Promise<Buffer | null> {
  ensureDirectories();

  // 1. Check local designs directory from companion app
  const possiblePaths = [
    path.join(DESIGNS_DIR, `${bizId}.png`),
    path.join(DESIGNS_DIR, `${bizId}.jpg`),
    path.join(DESIGNS_DIR, `gift_${bizId}.png`),
    path.join(DESIGNS_DIR, `gift_${bizId}.jpg`),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        return fs.readFileSync(p);
      } catch {}
    }
  }

  // 2. Check gifts registry for pre-rendered URLs or file paths
  if (fs.existsSync(GIFTS_REGISTRY_PATH)) {
    try {
      const reg = JSON.parse(fs.readFileSync(GIFTS_REGISTRY_PATH, 'utf-8'));
      const item = reg[bizId] || reg[`biz_${bizId}`];
      if (item && item.filePath && fs.existsSync(item.filePath)) {
        return fs.readFileSync(item.filePath);
      }
      if (item && item.url && typeof item.url === 'string' && item.url.startsWith('http')) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(item.url, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const arrBuf = await res.arrayBuffer();
          return Buffer.from(arrBuf);
        }
      }
    } catch {}
  }

  return null;
}

/**
 * ⚡ Generates the official Dalelak Branded QR Code image buffer (High-Res PNG)
 */
export async function generateBrandedQrBuffer(targetUrl: string, _venueName: string): Promise<Buffer> {
  // Generate 800x800 crisp PNG QR code with highest error correction
  const qrPngBuffer = await QRCode.toBuffer(targetUrl, {
    width: 800,
    margin: 3,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#0f172a', // Luxury slate navy
      light: '#ffffff',
    },
  });

  return qrPngBuffer;
}

/**
 * 🎁 Prepares the complete gift package (Design / QR + Official Arabic Congratulatory Message)
 */

export function generateFreeQrGiftWhatsAppMessage(biz: Business): string {
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : (biz.name || 'منشأتكم الكريمة');
  const owner = biz.ownerName || 'المحترم';
  const targetUrl = biz.customDirectoryUrl || `https://www.dalilaak.com/biz/${biz.id}`;

  return `*هدية خاصة من منصة دليلك لـ (${venueName})*
-----------------------------------------
أهلاً بحضرتك أستاذ *${owner}*،

*التصاميم المرفقة مع الرسالة دي هدية مجانية تماماً ليك من منصة دليلك!*
كل اللي عليك تطبعها وتحطها في مكانك، عشان الزباين يصوروا الـ QR Code بالموبايل ويقيموا مكانك على الخريطة بكل سهولة وبسرعة ويساعدوك تظهر أول نتيجة بحث.

*خدمة الطباعة الفاخرة والتوصيل:*
لو تحب نطبعها لك بجودة عالية وفاخرة ونوصلها لغاية عندك في نفس اليوم، التكلفة *100 جنيه بس* (شاملة كل شيء).

رد علينا بكلمة *(اطبعلي)* وسيقوم فريقنا بتجهيزها وإرسالها فوراً لموقعكم!

منصة دليلك: ${targetUrl}`;
}


/**
 * 🎁 Finds all companion app poster & sticker designs for this business (4-Design Bundle)
 */
export async function findCompanionAppBundle(bizId: string, biz: Business): Promise<BusinessGiftItem[]> {
  ensureDirectories();
  const venueLabel = biz.category || 'المنشأة الكريمة';
  const targetVenueName = biz.nameAr ? `«${biz.nameAr}»` : (biz.name ? `«${biz.name}»` : venueLabel);
  const targetOwnerName = biz.ownerName || 'المحترم';
  const directoryUrl = getDisplayDirectoryUrl(biz);

  const searchDirs = [
    DESIGNS_DIR,
    path.resolve(process.cwd(), '../data/generated_designs'),
    path.resolve(process.cwd(), '../../data/generated_designs'),
    String.raw`C:\Users\Ahmed\Desktop\Ahmed Files\QR boster\dist\designs`,
    String.raw`C:\Users\Ahmed\Desktop\Ahmed Files\QR boster\public\designs`,
  ];

  const designSpecs: Array<{
    type: 'classic_a4' | 'dark_vip' | 'counter_landscape' | 'quad_tables';
    title: string;
    suffixes: string[];
    caption: string;
  }> = [
    {
      type: 'classic_a4',
      title: 'بوستر A4 كلاسيكي فاخر (حائط)',
      suffixes: ['', '_classic_a4', '_a4'],
      caption:
        `*هدية خاصة من منصة دليلك لـ (${targetVenueName})* 🎁✨\n` +
        `-----------------------------------------\n` +
        `أهلاً بحضرتك أستاذ *${targetOwnerName}*،\n\n` +
        `*الباقة المرفقة (4 تصاميم وملصقات باركود فاخرة) هدية مجانية تماماً ليك من منصة دليلك!* 🌟\n` +
        `كل اللي عليك تطبعها وتوزعها في مكانك، عشان الزباين يصوروا الـ QR Code بالموبايل ويقيموا مكانك على الخريطة بكل سهولة وبسرعة ويساعدوك تظهر أول نتيجة بحث.\n\n` +
        `📄 *التصميم الأول:* بوستر A4 كلاسيكي فاخر (مثالي للتعليق على الحائط أو واجهة المحل).\n\n` +
        `*خدمة الطباعة الفاخرة والتوصيل:*\n` +
        `لو تحب نطبعلك الباقة كاملة بجودة عالية ونوصلها لغاية عندك في نفس اليوم، التكلفة *100 جنيه بس* (شاملة كل شيء).\n\n` +
        `رد علينا بكلمة *(اطبعلي)* وسيقوم فريقنا بتجهيزها وإرسالها فوراً لموقعكم! 🤝\n\n` +
        `🔗 رابط صفحتكم المباشر بالدليل:\n${directoryUrl}\n\n` +
        `منصة دليلك: https://www.dalilaak.com`,
    },
    {
      type: 'dark_vip',
      title: 'بوستر دارك ملكي VIP A4',
      suffixes: ['_dark_vip', '_vip', '_dark'],
      caption:
        `🖤 *التصميم الثاني (Royal Dark VIP A4)*:\n` +
        `بوستر فاخر بتصميم داكن ملكي عالي التباين، مخصص للأماكن المميزة ومكاتب الاستقبال الفاخرة لجذب انتباه العملاء فوراً ✨.`,
    },
    {
      type: 'counter_landscape',
      title: 'ستاند كاونتر واستقبال أفقي',
      suffixes: ['_counter_landscape', '_counter', '_landscape'],
      caption:
        `🏷️ *التصميم الثالث (Counter Stand)*:\n` +
        `ستاند كاونتر أفقي أنيق، مصمم خصيصاً لوضعه بجوار الكاشير أو على طاولة الاستقبال أمام الزبائن مباشرة أثناء الدفع 💳.`,
    },
    {
      type: 'quad_tables',
      title: 'شيت طاولات مقسم 4 ملصقات',
      suffixes: ['_quad_tables', '_tables', '_stickers'],
      caption:
        `🪑 *التصميم الرابع (4x Table Stickers)*:\n` +
        `شيت مقسم لـ 4 ملصقات جاهزة للقص، مخصصة للتثبيت المباشر على طاولات الجلوس أو البارتيشن لتسهيل مسح الباركود على الزبائن وهم في أماكنهم 📲.`,
    },
  ];

  const foundItems: BusinessGiftItem[] = [];

  for (const spec of designSpecs) {
    let itemBuffer: Buffer | null = null;
    let itemContentType: 'image/png' | 'image/jpeg' = 'image/png';

    for (const dir of searchDirs) {
      if (!fs.existsSync(dir)) continue;

      for (const suffix of spec.suffixes) {
        const candidates = [
          path.join(dir, `${bizId}${suffix}.png`),
          path.join(dir, `${bizId}${suffix}.jpg`),
          path.join(dir, `gift_${bizId}${suffix}.png`),
          path.join(dir, `gift_${bizId}${suffix}.jpg`),
        ];

        for (const candidate of candidates) {
          if (fs.existsSync(candidate)) {
            try {
              itemBuffer = fs.readFileSync(candidate);
              itemContentType = candidate.endsWith('.jpg') || candidate.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
              break;
            } catch {}
          }
        }
        if (itemBuffer) break;
      }
      if (itemBuffer) break;
    }

    if (itemBuffer) {
      foundItems.push({
        type: spec.type,
        title: spec.title,
        buffer: itemBuffer,
        caption: spec.caption,
        contentType: itemContentType,
      });
    }
  }

  // If bundle is incomplete (< 4), auto-invoke the approved QR Booster rendering engine on-demand
  if (foundItems.length < 4) {
    const qrBoosterScript = String.raw`C:\Users\Ahmed\Desktop\Ahmed Files\QR boster\scripts\render_bundle.ts`;
    const qrBoosterCwd = String.raw`C:\Users\Ahmed\Desktop\Ahmed Files\QR boster`;

    if (fs.existsSync(qrBoosterScript)) {
      try {
        console.log(`[Gift Service] Bundle incomplete (${foundItems.length}/4) for ${bizId}. Rendering approved 4-poster bundle via QR Booster...`);
        await new Promise<void>((resolve) => {
          exec(
            `cmd /c npx.cmd tsx scripts/render_bundle.ts "${bizId}"`,
            { cwd: qrBoosterCwd, timeout: 25000 },
            (err, stdout, _stderr) => {
              if (err) {
                console.warn('[Gift Service] QR Booster on-demand render warning:', err.message);
              } else {
                console.log('[Gift Service] QR Booster on-demand render output:', stdout.trim().split('\n').pop());
              }
              resolve();
            }
          );
        });

        // Re-read generated designs from disk
        foundItems.length = 0;
        for (const spec of designSpecs) {
          let itemBuffer: Buffer | null = null;
          let itemContentType: 'image/png' | 'image/jpeg' = 'image/png';

          for (const dir of searchDirs) {
            if (!fs.existsSync(dir)) continue;

            for (const suffix of spec.suffixes) {
              const candidates = [
                path.join(dir, `${bizId}${suffix}.png`),
                path.join(dir, `${bizId}${suffix}.jpg`),
                path.join(dir, `gift_${bizId}${suffix}.png`),
                path.join(dir, `gift_${bizId}${suffix}.jpg`),
              ];

              for (const candidate of candidates) {
                if (fs.existsSync(candidate)) {
                  try {
                    itemBuffer = fs.readFileSync(candidate);
                    itemContentType = candidate.endsWith('.jpg') || candidate.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
                    break;
                  } catch {}
                }
              }
              if (itemBuffer) break;
            }
            if (itemBuffer) break;
          }

          if (itemBuffer) {
            foundItems.push({
              type: spec.type,
              title: spec.title,
              buffer: itemBuffer,
              caption: spec.caption,
              contentType: itemContentType,
            });
          }
        }
      } catch (autoErr) {
        console.warn('[Gift Service] Auto-render execution error:', autoErr);
      }
    }
  }

  return foundItems;
}

export async function prepareBusinessGiftPackage(biz: Business): Promise<BusinessGiftResult> {
  ensureDirectories();
  const venueName = biz.nameAr || biz.name || 'المنشأة الكريمة';
  const directoryUrl = getDisplayDirectoryUrl(biz);

  // 1. Try finding complete companion app bundle (4 designs)
  const bundle = await findCompanionAppBundle(biz.id, biz);

  if (bundle.length > 0) {
    return {
      buffer: bundle[0].buffer,
      caption: bundle[0].caption,
      contentType: bundle[0].contentType,
      source: 'external_app',
      targetUrl: directoryUrl,
      bundle,
    };
  }

  // 2. Fallback to instant branded QR if no pre-generated bundle found
  const fallbackBuf = await generateBrandedQrBuffer(directoryUrl, venueName);
  const venueLabel = biz.category || 'المنشأة الكريمة';
  const targetVenueName = biz.nameAr ? `«${biz.nameAr}»` : (biz.name ? `«${biz.name}»` : venueLabel);
  const targetOwnerName = biz.ownerName || 'المحترم';

  const caption =
    `*هدية خاصة من منصة دليلك لـ (${targetVenueName})* 🎁✨\n` +
    `-----------------------------------------\n` +
    `أهلاً بحضرتك أستاذ *${targetOwnerName}*،\n\n` +
    `*التصاميم المرفقة مع الرسالة دي هدية مجانية تماماً ليك من منصة دليلك!* 🌟\n` +
    `كل اللي عليك تطبعها وتحطها في مكانك، عشان الزباين يصوروا الـ QR Code بالموبايل ويقيموا مكانك على الخريطة بكل سهولة وبسرعة ويساعدوك تظهر أول نتيجة بحث.\n\n` +
    `*خدمة الطباعة الفاخرة والتوصيل:*\n` +
    `لو تحب نطبعها لك بجودة عالية وفاخرة ونوصلها لغاية عندك في نفس اليوم، التكلفة *100 جنيه بس* (شاملة كل شيء).\n\n` +
    `رد علينا بكلمة *(اطبعلي)* وسيقوم فريقنا بتجهيزها وإرسالها فوراً لموقعكم! 🤝\n\n` +
    `🔗 رابط صفحتكم المباشر بالدليل:\n${directoryUrl}\n\n` +
    `منصة دليلك: https://www.dalilaak.com`;

  const fallbackItem: BusinessGiftItem = {
    type: 'classic_a4',
    title: 'كارت QR المنشأة',
    buffer: fallbackBuf,
    caption,
    contentType: 'image/png',
  };

  return {
    buffer: fallbackBuf,
    caption,
    contentType: 'image/png',
    source: 'generated_qr',
    targetUrl: directoryUrl,
    bundle: [fallbackItem],
  };
}

/**
 * 📝 Records delivered gift in the persistent registry
 */
export function recordDeliveredGift(record: DeliveredGiftRecord): void {
  try {
    ensureDirectories();
    let history: DeliveredGiftRecord[] = [];
    if (fs.existsSync(GIFTS_LOG_PATH)) {
      try {
        history = JSON.parse(fs.readFileSync(GIFTS_LOG_PATH, 'utf-8'));
      } catch {}
    }
    history.unshift(record);
    if (history.length > 500) {
      history = history.slice(0, 500);
    }
    fs.writeFileSync(GIFTS_LOG_PATH, JSON.stringify(history, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Gift Service] Failed to record delivered gift:', err);
  }
}

/**
 * 📊 Retrieves all delivered gifts
 */
export function getDeliveredGifts(): DeliveredGiftRecord[] {
  try {
    if (fs.existsSync(GIFTS_LOG_PATH)) {
      return JSON.parse(fs.readFileSync(GIFTS_LOG_PATH, 'utf-8'));
    }
  } catch {}
  return [];
}
