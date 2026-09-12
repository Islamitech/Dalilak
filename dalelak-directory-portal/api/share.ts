import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as fs from 'fs';
import * as path from 'path';

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

  return '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const rawBizQuery = req.query.biz || req.query.id;
    const rawBiz = Array.isArray(rawBizQuery) ? rawBizQuery[0] : rawBizQuery;
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

    const decodedParam = decodeURIComponent(rawBiz).trim();
    // Extract canonical entity ID if embedded inside slug (e.g. "مطعم-أبو-خالد-biz_1788118588424" -> "biz_1788118588424")
    const idMatch = decodedParam.match(/(biz_[a-zA-Z0-9_-]+)/i);
    const bizId = idMatch ? idMatch[1] : decodedParam;

    // Fetch business from Supabase
    const apiUrl = `${SUPABASE_URL}/rest/v1/businesses?id=eq.${encodeURIComponent(bizId)}&select=id,name_ar,name_en,category,governorate,city,street,phone,secondary_phone,description,photos,notes`;
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

    // Fallback: If no business found by ID and no standard ID was present in slug, search by Arabic name
    if (!biz && !idMatch) {
      const cleanName = decodedParam.replace(/-/g, ' ').trim();
      const searchUrl = `${SUPABASE_URL}/rest/v1/businesses?name_ar=ilike.%25${encodeURIComponent(cleanName)}%25&select=id,name_ar,name_en,category,governorate,city,street,phone,secondary_phone,description,photos,notes&limit=1`;
      try {
        const searchRes = await fetch(searchUrl, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Accept: 'application/json',
          },
        });
        if (searchRes.ok) {
          const searchRows = await searchRes.json();
          if (Array.isArray(searchRows) && searchRows.length > 0) {
            biz = searchRows[0];
          }
        }
      } catch {}
    }

    const template = getBaseTemplate();

    if (!biz) {
      if (template) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(template.replace(/(src|href)="\.\//g, '$1="/'));
      }
      return res.redirect(302, '/');
    }

    let googleRatingEnabled = false;
    let googleRating: number | null = null;
    let googleReviewsCount: number | null = null;

    if (typeof biz.notes === 'string' && biz.notes.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(biz.notes.trim());
        if (parsed && typeof parsed === 'object') {
          if (parsed.googleRatingEnabled) googleRatingEnabled = Boolean(parsed.googleRatingEnabled);
          if (parsed.googleRating !== undefined && parsed.googleRating !== null) googleRating = Number(parsed.googleRating);
          if (parsed.googleReviewsCount !== undefined && parsed.googleReviewsCount !== null) googleReviewsCount = Number(parsed.googleReviewsCount);
        }
      } catch {}
    }

    const nameAr = biz.name_ar || biz.name_en || 'نشاط تجاري معتمد';
    const category = biz.category || 'دليل الأنشطة والخدمات';
    const locationParts = [biz.city, biz.street, biz.governorate].filter(Boolean);
    const locationStr = locationParts.length > 0 ? locationParts.join(' - ') : 'مصر';
    const phone = biz.phone || '';
    const secondaryPhone = biz.secondary_phone || '';
    const phones = [phone, secondaryPhone].filter(Boolean).join(' / ');

    // Google rating snippet
    let ratingPart = '';
    if (googleRatingEnabled && googleRating) {
      const formattedRating = googleRating.toFixed(1);
      ratingPart = `⭐ تقييم Google: ${formattedRating}${googleReviewsCount ? ` (${googleReviewsCount} تقييم)` : ''}`;
    }

    const pageTitle = `${nameAr} | منصة دليلك المعتمدة`;
    const cleanPageTitle = pageTitle.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

    // Business Description from "وصف الأنشطة والخدمات"
    const rawDesc = (biz.description || '').trim();

    // If description is short (or empty), include phones and location
    let descBody = '';
    if (rawDesc.length >= 35) {
      // Meaningful rich description entered by the user
      descBody = rawDesc;
      if (phones) {
        descBody += ` • تواصل: ${phones}`;
      }
    } else {
      // Short or empty description: prominently show phones + category + location
      const parts: string[] = [];
      if (rawDesc) parts.push(rawDesc);
      if (phones) parts.push(`تواصل: ${phones}`);
      parts.push(`${category} - ${locationStr}`);
      descBody = parts.join(' • ');
    }

    const shareDesc = [ratingPart, descBody].filter(Boolean).join(' • ');
    const cleanShareDesc = shareDesc.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

    // 🛡️ Resolve direct high-speed photo for OpenGraph preview (Strictly Direct 200 OK CDN)
    let coverPhoto: string | null = null;
    if (typeof biz.notes === 'string' && biz.notes.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(biz.notes.trim());
        if (parsed && typeof parsed === 'object' && parsed.coverPhoto) {
          coverPhoto = parsed.coverPhoto;
        }
      } catch {}
    }

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
    const directPhoto = coverPhoto || (rawPhotos.length > 0 ? rawPhotos[0] : null);

    // ⚡ WhatsApp, Facebook & iMessage strictly mandate direct 200 OK image URLs.
    // If the venue has an enhanced Supabase/CDN photo URL, use it directly!
    let ogImageUrl = '';
    let ogImageType = 'image/jpeg';
    if (typeof directPhoto === 'string' && (directPhoto.startsWith('https://') || directPhoto.startsWith('http://'))) {
      ogImageUrl = directPhoto;
      if (directPhoto.toLowerCase().includes('.png')) {
        ogImageType = 'image/png';
      } else if (directPhoto.toLowerCase().includes('.webp')) {
        ogImageType = 'image/webp';
      }
    } else {
      // Fallback: Dynamic branded card generator
      const photoVer = directPhoto ? directPhoto.length : (biz.created_at || '');
      ogImageUrl = `${origin}/api/biz-og?biz=${encodeURIComponent(biz.id)}${photoVer ? `&v=${encodeURIComponent(photoVer)}` : ''}`;
      ogImageType = 'image/png';
    }
    const pageUrl = `${origin}/?biz=${encodeURIComponent(biz.id)}`;

    let html = template;

    if (!html) {
      // Minimal standalone fallback HTML if no template found on disk
      html = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(cleanPageTitle)}</title>
    <meta name="title" content="${escapeHtml(cleanPageTitle)}" />
    <meta name="description" content="${escapeHtml(cleanShareDesc)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="منصة دليلك - Dalelak" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta property="og:title" content="${escapeHtml(cleanPageTitle)}" />
    <meta property="og:description" content="${escapeHtml(cleanShareDesc)}" />
    <meta property="og:image" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:image:type" content="${ogImageType}" />
    <meta property="og:image:alt" content="${escapeHtml(nameAr)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(cleanPageTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(cleanShareDesc)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body style="background:#020617;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
    <div style="text-align:center;">
      <h2>جاري تحويلك إلى ${escapeHtml(nameAr)}...</h2>
      <script>window.location.replace('${pageUrl}');</script>
    </div>
  </body>
</html>`;
    } else {
      // Fix relative paths for assets
      html = html.replace(/(src|href)="\.\//g, '$1="/');

      // Replace Meta Tags
      html = html.replace(/<title>.*?<\/title>/gi, () => `<title>${escapeHtml(cleanPageTitle)}</title>`);
      html = html.replace(/<meta\s+name="title"\s+content=".*?"\s*\/?>/gi, () => `<meta name="title" content="${escapeHtml(cleanPageTitle)}" />`);
      html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/gi, () => `<meta name="description" content="${escapeHtml(cleanShareDesc)}" />`);

      // Open Graph Tags
      html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:title" content="${escapeHtml(cleanPageTitle)}" />`);
      html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:description" content="${escapeHtml(cleanShareDesc)}" />`);
      html = html.replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:url" content="${escapeHtml(pageUrl)}" />`);
      html = html.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />`);
      html = html.replace(/<meta\s+property="og:image:secure_url"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image:secure_url" content="${escapeHtml(ogImageUrl)}" />`);
      html = html.replace(/<meta\s+property="og:image:type"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image:type" content="${ogImageType}" />`);
      html = html.replace(/<meta\s+property="og:image:alt"\s+content=".*?"\s*\/?>/gi, () => `<meta property="og:image:alt" content="${escapeHtml(nameAr)}" />`);

      // Twitter Tags
      html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:title" content="${escapeHtml(cleanPageTitle)}" />`);
      html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:description" content="${escapeHtml(cleanShareDesc)}" />`);
      html = html.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />`);
      html = html.replace(/<meta\s+name="twitter:url"\s+content=".*?"\s*\/?>/gi, () => `<meta name="twitter:url" content="${escapeHtml(pageUrl)}" />`);

      // Canonical URL
      html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/gi, () => `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=600');
    return res.status(200).send(html);

  } catch (err) {
    console.error('Error in share handler:', err);
    return res.redirect(302, '/');
  }
}
