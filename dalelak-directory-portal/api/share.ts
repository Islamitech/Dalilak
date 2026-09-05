import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://xdqpbajymacpdccorjcj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x';

function escapeHtml(str: string): string {
  return (str || '').replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case '\'': return '&#039;';
      default: return m;
    }
  });
}

let cachedTemplate = '';

function getBaseTemplate(): string {
  if (cachedTemplate) return cachedTemplate;

  const distPath = path.join(process.cwd(), 'dist', 'index.html');
  if (fs.existsSync(distPath)) {
    try {
      cachedTemplate = fs.readFileSync(distPath, 'utf8');
      return cachedTemplate;
    } catch {}
  }

  const rootPath = path.join(process.cwd(), 'index.html');
  if (fs.existsSync(rootPath)) {
    try {
      cachedTemplate = fs.readFileSync(rootPath, 'utf8');
      return cachedTemplate;
    } catch {}
  }

  return '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const rawBiz = req.query.biz || req.query.id;
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'www.dalilaak.com';
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const origin = `${proto}://${host}`;

    if (!rawBiz || typeof rawBiz !== 'string') {
      const template = getBaseTemplate();
      if (template) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(template.replace(/(src|href)="\.\//g, '$1="/'));
      }
      return res.redirect(302, '/');
    }

    const bizId = decodeURIComponent(rawBiz).trim();

    // Fetch business from Supabase
    const apiUrl = `${SUPABASE_URL}/rest/v1/businesses?id=eq.${encodeURIComponent(bizId)}&select=id,name_ar,name_en,category,governorate,city,street,phone,description,photos`;
    const dbRes = await fetch(apiUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Accept: 'application/json',
      },
    });

    let biz: any = null;
    if (dbRes.ok) {
      const rows = await dbRes.json();
      if (Array.isArray(rows) && rows.length > 0) {
        biz = rows[0];
      }
    }

    const template = getBaseTemplate();

    if (!biz) {
      if (template) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(template.replace(/(src|href)="\.\//g, '$1="/'));
      }
      return res.redirect(302, '/');
    }

    const nameAr = biz.name_ar || biz.name_en || 'نشاط تجاري معتمد';
    const category = biz.category || 'دليل الأنشطة والخدمات';
    const locationParts = [biz.city, biz.street, biz.governorate].filter(Boolean);
    const locationStr = locationParts.length > 0 ? locationParts.join(' - ') : 'مصر';
    const phone = biz.phone || '';

    const pageTitle = `نشاط ${nameAr} | منصة دليلك المعتمدة ✨`;
    const shareDesc = `${category} • ${locationStr}${phone ? ` • تواصل: ${phone}` : ''} • اضغط لمشاهدة التفاصيل والموقع المباشر على الخريطة عبر منصة دليلك.`;
    const photoVer = Array.isArray(biz.photos) && biz.photos[0] ? biz.photos[0].length : (biz.created_at || '');
    const ogImageUrl = `${origin}/api/biz-og?biz=${encodeURIComponent(biz.id)}${photoVer ? `&v=${encodeURIComponent(photoVer)}` : ''}`;
    const pageUrl = `${origin}/?biz=${encodeURIComponent(biz.id)}`;

    let html = template;

    if (!html) {
      // Minimal standalone fallback HTML if no template found on disk
      html = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="title" content="${escapeHtml(pageTitle)}" />
    <meta name="description" content="${escapeHtml(shareDesc)}" />
    <meta property="og:type" content="business.business" />
    <meta property="og:site_name" content="منصة دليلك - Dalelak" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta property="og:title" content="${escapeHtml(pageTitle)}" />
    <meta property="og:description" content="${escapeHtml(shareDesc)}" />
    <meta property="og:image" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(shareDesc)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body style="background:#020617;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
    <div style="text-align:center;">
      <h2>جاري تحويلك إلى نشاط ${escapeHtml(nameAr)}...</h2>
      <script>window.location.replace('${pageUrl}');</script>
    </div>
  </body>
</html>`;
    } else {
      // Fix relative paths for assets
      html = html.replace(/(src|href)="\.\//g, '$1="/');

      // Replace Meta Tags
      html = html.replace(/<title>.*?<\/title>/gi, `<title>${escapeHtml(pageTitle)}</title>`);
      html = html.replace(/<meta\s+name="title"\s+content=".*?"\s*\/?>/gi, `<meta name="title" content="${escapeHtml(pageTitle)}" />`);
      html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, `<meta name="description" content="${escapeHtml(shareDesc)}" />`);

      // Open Graph Tags
      html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/gi, `<meta property="og:title" content="${escapeHtml(pageTitle)}" />`);
      html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/gi, `<meta property="og:description" content="${escapeHtml(shareDesc)}" />`);
      html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/gi, `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`);
      html = html.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/gi, `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />`);
      html = html.replace(/<meta\s+property="og:image:secure_url"\s+content=".*?"\s*\/?>/gi, `<meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}" />`);

      // Twitter Tags
      html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/gi, `<meta name="twitter:title" content="${escapeHtml(pageTitle)}" />`);
      html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/gi, `<meta name="twitter:description" content="${escapeHtml(shareDesc)}" />`);
      html = html.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/gi, `<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />`);
      html = html.replace(/<meta\s+name="twitter:url"\s+content=".*?"\s*\/?>/gi, `<meta name="twitter:url" content="${escapeHtml(pageUrl)}" />`);

      // Canonical URL
      html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/gi, `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=600');
    return res.status(200).send(html);

  } catch (err) {
    console.error('Error in share handler:', err);
    return res.redirect(302, '/');
  }
}
