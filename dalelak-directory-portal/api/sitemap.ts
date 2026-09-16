import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = 'https://xdqpbajymacpdccorjcj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x';

function slugify(name?: string): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .replace(/[\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[«»"'""''\(\)\[\]{}#@!$%^&*+=\\\/|:;<>?,.~`،؛؟٪_]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .filter(Boolean)
    .slice(0, 7)
    .join('-');
}

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'www.dalilaak.com';
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const origin = `${proto}://${host}`;

    // Fetch verified and published businesses from Supabase
    const apiUrl = `${SUPABASE_URL}/rest/v1/businesses?verification_status=eq.verified&package_id=neq.pkg_interested_lead&select=id,name_ar,name_en,city,updated_at,created_at,notes&order=created_at.desc&limit=2500`;

    const dbRes = await fetch(apiUrl, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Accept: 'application/json',
      },
    });

    let businesses: any[] = [];
    if (dbRes.ok) {
      const rows = await dbRes.json();
      if (Array.isArray(rows)) {
        businesses = rows;
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    const urls: string[] = [
      `  <url>
    <loc>${origin}/</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
      `  <url>
    <loc>${origin}/search</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`,
    ];

    for (const biz of businesses) {
      // Check if not unpublished or draft
      let isPublished = true;
      let customSlug = '';
      if (typeof biz.notes === 'string' && biz.notes.startsWith('{')) {
        try {
          const parsed = JSON.parse(biz.notes);
          if (parsed.publishedStatus === 'draft' || parsed.publishedStatus === 'unlisted') {
            isPublished = false;
          }
          if (parsed.customDirectoryUrl) {
            customSlug = parsed.customDirectoryUrl;
          }
        } catch {}
      }

      if (!isPublished) continue;

      const rawName = biz.name_ar || biz.name_en || 'نشاط';
      const nameSlug = slugify(rawName) || 'نشاط';
      const citySlug = biz.city ? slugify(biz.city) : '';
      const locPart = citySlug && !nameSlug.includes(citySlug) ? `-${citySlug}` : '';
      const locUrl = `${origin}/biz/${biz.id}`;
      const lastMod = (biz.updated_at || biz.created_at || todayStr).slice(0, 10);

      urls.push(`  <url>
    <loc>${escapeXml(locUrl)}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    }

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400');
    return res.status(200).send(sitemapXml);

  } catch (err) {
    console.error('Error generating sitemap:', err);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}
