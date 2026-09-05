import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resvg } from '@resvg/resvg-js';

const SUPABASE_URL = 'https://xdqpbajymacpdccorjcj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x';

function escapeXml(unsafe: string): string {
  return (unsafe || '').replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function generateFallbackCardSvg(biz: any): string {
  const name = escapeXml(biz.name_ar || biz.name_en || 'نشاط معتمد');
  const category = escapeXml(biz.category || 'دليل الأنشطة والخدمات');
  const location = escapeXml(`${biz.city || ''} - ${biz.governorate || 'مصر'}`.trim());
  const phone = escapeXml(biz.phone || '');

  return `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050811"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Decorative Rings -->
  <circle cx="600" cy="315" r="280" fill="none" stroke="url(#gold)" stroke-width="1.5" stroke-dasharray="10,8" opacity="0.25"/>
  <circle cx="600" cy="315" r="240" fill="none" stroke="url(#gold)" stroke-width="1" opacity="0.15"/>

  <!-- Borders -->
  <rect x="25" y="25" width="1150" height="580" rx="28" fill="none" stroke="url(#gold)" stroke-width="2.5" opacity="0.6"/>
  <rect x="35" y="35" width="1130" height="560" rx="20" fill="none" stroke="#f59e0b" stroke-width="1" opacity="0.2"/>

  <!-- Header -->
  <g transform="translate(450, 65)">
    <rect x="0" y="0" width="300" height="46" rx="23" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-width="1.5"/>
    <text x="150" y="30" font-family="sans-serif" font-size="20" font-weight="bold" fill="#fbbf24" text-anchor="middle">منصة دليلك المعتمدة</text>
  </g>

  <!-- Business Name -->
  <text x="600" y="220" font-family="sans-serif" font-size="64" font-weight="900" fill="url(#gold)" text-anchor="middle">${name}</text>

  <!-- Category -->
  <g transform="translate(350, 260)">
    <rect x="0" y="0" width="500" height="52" rx="26" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
    <text x="250" y="34" font-family="sans-serif" font-size="24" font-weight="bold" fill="#f1f5f9" text-anchor="middle">${category}</text>
  </g>

  <!-- Location -->
  <g transform="translate(400, 335)">
    <rect x="0" y="0" width="400" height="46" rx="23" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
    <text x="200" y="30" font-family="sans-serif" font-size="20" font-weight="bold" fill="#cbd5e1" text-anchor="middle">${location}</text>
  </g>

  <!-- Phone & Verified -->
  ${phone ? `
  <g transform="translate(380, 405)">
    <rect x="0" y="0" width="260" height="48" rx="24" fill="#064e3b" fill-opacity="0.6" stroke="#10b981" stroke-width="1.5"/>
    <text x="130" y="31" font-family="sans-serif" font-size="22" font-weight="bold" fill="#34d399" text-anchor="middle">هاتف: ${phone}</text>
  </g>
  <g transform="translate(660, 405)">
    <rect x="0" y="0" width="160" height="48" rx="24" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>
    <text x="80" y="31" font-family="sans-serif" font-size="20" font-weight="bold" fill="#fbbf24" text-anchor="middle">نشاط موثق</text>
  </g>
  ` : `
  <g transform="translate(510, 405)">
    <rect x="0" y="0" width="180" height="48" rx="24" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>
    <text x="90" y="31" font-family="sans-serif" font-size="20" font-weight="bold" fill="#fbbf24" text-anchor="middle">نشاط موثق</text>
  </g>
  `}

  <!-- Footer -->
  <g transform="translate(600, 525)">
    <text x="0" y="0" font-family="sans-serif" font-size="20" font-weight="bold" fill="#94a3b8" text-anchor="middle">شاهد الموقع المباشر على الخريطة والتفاصيل الكاملة</text>
    <text x="0" y="30" font-family="sans-serif" font-size="16" fill="#64748b" text-anchor="middle">www.dalilaak.com</text>
  </g>
</svg>
  `.trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const rawBiz = req.query.biz || req.query.id;
    if (!rawBiz || typeof rawBiz !== 'string') {
      return res.redirect(302, '/og-image.jpg');
    }

    const bizId = decodeURIComponent(rawBiz).trim();

    // 1. Fetch business from Supabase REST API
    const apiUrl = `${SUPABASE_URL}/rest/v1/businesses?id=eq.${encodeURIComponent(bizId)}&select=id,name_ar,name_en,category,governorate,city,street,phone,photos`;
    const dbRes = await fetch(apiUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Accept: 'application/json',
      },
    });

    if (!dbRes.ok) {
      return res.redirect(302, '/og-image.jpg');
    }

    const rows = await dbRes.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.redirect(302, '/og-image.jpg');
    }

    const biz = rows[0];
    let rawPhotos: string[] = [];
    if (Array.isArray(biz.photos)) {
      rawPhotos = biz.photos;
    } else if (typeof biz.photos === 'string' && biz.photos.trim().length > 0) {
      try {
        const p = JSON.parse(biz.photos.trim());
        if (Array.isArray(p)) rawPhotos = p;
        else if (typeof p === 'string') rawPhotos = [p];
      } catch {
        if (biz.photos.startsWith('http') || biz.photos.startsWith('data:')) rawPhotos = [biz.photos];
      }
    }
    const photo = rawPhotos.length > 0 ? rawPhotos[0] : null;

    // 2. Process Business Photo
    if (typeof photo === 'string' && photo.length > 0) {
      // Case A: SVG vector graphic (e.g. data:image/svg+xml;base64,... or raw <svg>)
      if (photo.startsWith('data:image/svg+xml;base64,')) {
        try {
          const b64 = photo.replace('data:image/svg+xml;base64,', '');
          const svgContent = Buffer.from(b64, 'base64').toString('utf8');
          const resvg = new Resvg(svgContent, {
            fitTo: { mode: 'width', value: 1200 },
          });
          const pngBuffer = resvg.render().asPng();

          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
          return res.status(200).send(pngBuffer);
        } catch (svgErr) {
          console.warn('Failed rendering SVG photo:', svgErr);
        }
      }

      // Case B: JPEG base64 (e.g. data:image/jpeg;base64,...)
      if (photo.startsWith('data:image/jpeg;base64,') || photo.startsWith('data:image/jpg;base64,')) {
        const b64 = photo.replace(/^data:image\/jpe?g;base64,/, '');
        const imgBuffer = Buffer.from(b64, 'base64');
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Content-Length', imgBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
        return res.status(200).send(imgBuffer);
      }

      // Case C: PNG base64 (e.g. data:image/png;base64,...)
      if (photo.startsWith('data:image/png;base64,')) {
        const b64 = photo.replace('data:image/png;base64,', '');
        const imgBuffer = Buffer.from(b64, 'base64');
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', imgBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
        return res.status(200).send(imgBuffer);
      }

      // Case D: External HTTP/HTTPS URL (e.g. Supabase Storage or CDN)
      if (photo.startsWith('http://') || photo.startsWith('https://')) {
        return res.redirect(302, photo);
      }
    }

    // 3. Fallback: Generate custom luxury gold card for this business
    const cardSvg = generateFallbackCardSvg(biz);
    const resvg = new Resvg(cardSvg, {
      fitTo: { mode: 'width', value: 1200 },
    });
    const pngBuffer = resvg.render().asPng();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(pngBuffer);

  } catch (err) {
    console.error('Error generating biz-og:', err);
    return res.redirect(302, '/og-image.jpg');
  }
}
