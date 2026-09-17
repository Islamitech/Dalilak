const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xdqpbajymacpdccorjcj.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x';

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req: any, res: any) {
  try {
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'www.dalilaak.com';
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const origin = `${proto}://${host}`;
    const today = new Date().toISOString().slice(0, 10);

    let businesses: Array<{ id: string; updated_at?: string; created_at?: string }> = [];

    try {
      const apiUrl = `${SUPABASE_URL}/rest/v1/businesses?verification_status=eq.verified&package_id=neq.pkg_interested_lead&select=id,updated_at,created_at&order=created_at.desc&limit=3000`;
      const dbRes = await fetch(apiUrl, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Accept: 'application/json',
        },
      });
      if (dbRes.ok) {
        const rows = await dbRes.json();
        if (Array.isArray(rows)) {
          businesses = rows;
        }
      }
    } catch {
      // Fallback if Supabase fetch fails
    }

    const urls: string[] = [
      `  <url>\n    <loc>${origin}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
      `  <url>\n    <loc>${origin}/?tab=home</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>`,
      `  <url>\n    <loc>${origin}/?tab=map</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`,
      `  <url>\n    <loc>${origin}/api/docs</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
    ];

    for (const biz of businesses) {
      if (!biz.id) continue;
      const lastMod = (biz.updated_at || biz.created_at || today).slice(0, 10);
      const url = `${origin}/?biz=${encodeURIComponent(biz.id)}`;
      urls.push(
        `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
      );
    }

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=14400, stale-while-revalidate=86400');
    return res.status(200).send(sitemapXml);
  } catch (err) {
    console.error('[Vercel Sitemap] Error:', err);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res
      .status(500)
      .send('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>');
  }
}
