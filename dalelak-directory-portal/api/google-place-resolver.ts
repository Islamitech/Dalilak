import type { VercelRequest, VercelResponse } from '@vercel/node';

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
}

function cleanPlaceName(rawName: string): string {
  let name = decodeHtmlEntities(rawName).trim();
  name = name.replace(/\s*[-·|–]\s*(Google Maps|خرائط Google|Google).*$/i, '').trim();
  return name;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const rawUrl = (req.query.url as string) || (req.body && req.body.url);
    if (!rawUrl || typeof rawUrl !== 'string') {
      return res.status(400).json({ error: 'يرجى تزويد رابط خرائط Google صالح' });
    }

    const trimmedUrl = rawUrl.trim();
    let destinationUrl = trimmedUrl;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let htmlContent = '';
    try {
      const response = await fetch(trimmedUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        },
        signal: controller.signal,
      });
      destinationUrl = response.url || trimmedUrl;
      htmlContent = await response.text();
    } catch {
      // If network fetch fails, proceed with URL parsing
    } finally {
      clearTimeout(timeoutId);
    }

    let placeName = '';
    const placeUrlMatch = destinationUrl.match(/\/place\/([^/@?]+)/);
    if (placeUrlMatch) {
      try {
        placeName = decodeURIComponent(placeUrlMatch[1]).replace(/\+/g, ' ').trim();
      } catch {
        placeName = placeUrlMatch[1].replace(/\+/g, ' ').trim();
      }
    }

    const ogTitleMatch =
      htmlContent.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      htmlContent.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      const parsedOg = cleanPlaceName(ogTitleMatch[1]);
      if (parsedOg && (!placeName || parsedOg.length > placeName.length)) {
        placeName = parsedOg;
      }
    }

    if (!placeName) {
      const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        placeName = cleanPlaceName(titleMatch[1]);
      }
    }

    let lat: number | undefined = undefined;
    let lng: number | undefined = undefined;

    const coordsMatch =
      destinationUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      destinationUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
      destinationUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);

    if (coordsMatch) {
      lat = parseFloat(coordsMatch[1]);
      lng = parseFloat(coordsMatch[2]);
    } else {
      const embedMatch = htmlContent.match(/@(-?\d{1,2}\.\d{4,}),(-?\d{1,3}\.\d{4,})/);
      if (embedMatch) {
        lat = parseFloat(embedMatch[1]);
        lng = parseFloat(embedMatch[2]);
      }
    }

    let phone: string | undefined = undefined;
    const phoneMatches = htmlContent.match(/(?:\+20\s*|0)(1[0125]\d{8}|2\d{7,8})/g);
    if (phoneMatches && phoneMatches.length > 0) {
      const rawDigits = phoneMatches[0].replace(/\D/g, '');
      if (rawDigits.startsWith('20')) {
        phone = '0' + rawDigits.substring(2);
      } else if (rawDigits.startsWith('0')) {
        phone = rawDigits;
      }
    }

    let address: string | undefined = undefined;
    let rating: number | undefined = undefined;
    let reviewCount: number | undefined = undefined;
    let photo: string | undefined = undefined;
    const photos: string[] = [];
    const seenHashes = new Set<string>();

    const ogImageMatch =
      htmlContent.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      htmlContent.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    if (ogImageMatch && ogImageMatch[1] && !ogImageMatch[1].includes('google_maps_logo') && !ogImageMatch[1].includes('staticmap')) {
      const rawOg = ogImageMatch[1];
      const cleanOg = rawOg.replace(/=w\d+-h\d+.*$/, '=s1600').replace(/=s\d+.*$/, '=s1600');
      photo = cleanOg;
      photos.push(cleanOg);

      const ogHashMatch = rawOg.match(/\/p\/([A-Za-z0-9_-]+)/);
      if (ogHashMatch) seenHashes.add(ogHashMatch[1]);
    }

    // Extract all Google Photos CDN photo hashes (AF1Qip...)
    const lhRegex = /https:\/\/(?:lh[3-6]\.googleusercontent\.com|lh[3-6]\.ggpht\.com)\/p\/([A-Za-z0-9_-]{20,})/g;
    let match: RegExpExecArray | null;
    while ((match = lhRegex.exec(htmlContent)) !== null && photos.length < 12) {
      const photoId = match[1];
      if (!seenHashes.has(photoId)) {
        seenHashes.add(photoId);
        const fullUrl = `https://lh3.googleusercontent.com/p/${photoId}=s1600`;
        photos.push(fullUrl);
      }
    }

    // Extract Street View Panoramas if under limit
    const svRegex = /https:\/\/streetviewpixels-pa\.googleapis\.com\/v1\/thumbnail\?panoid=([A-Za-z0-9_-]{15,})/g;
    while ((match = svRegex.exec(htmlContent)) !== null && photos.length < 12) {
      const panoId = match[1];
      if (!seenHashes.has(panoId)) {
        seenHashes.add(panoId);
        const fullUrl = `https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=${panoId}&w=1200&h=800&yaw=0&pitch=0&thumbfov=90`;
        photos.push(fullUrl);
      }
    }

    const ogDescMatch =
      htmlContent.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
      htmlContent.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i);
    if (ogDescMatch && ogDescMatch[1]) {
      const desc = decodeHtmlEntities(ogDescMatch[1]);
      const ratingMatch = desc.match(/([1-5](?:[.,]\d)?)\s*(?:★|نجمة|star)/i);
      if (ratingMatch) {
        rating = parseFloat(ratingMatch[1].replace(',', '.'));
      }
      const revMatch = desc.match(/\((\d+[\d,]*)\)/);
      if (revMatch) {
        reviewCount = parseInt(revMatch[1].replace(/,/g, ''), 10);
      }
      address = desc;
    }

    return res.status(200).json({
      success: true,
      name: placeName || undefined,
      phone: phone || undefined,
      lat: lat && !isNaN(lat) ? Number(lat.toFixed(6)) : undefined,
      lng: lng && !isNaN(lng) ? Number(lng.toFixed(6)) : undefined,
      rating: rating || undefined,
      reviewCount: reviewCount || undefined,
      address: address || undefined,
      photo: photo || (photos.length > 0 ? photos[0] : undefined),
      photos: photos.length > 0 ? photos : undefined,
      resolvedUrl: destinationUrl,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'حدث خطأ أثناء فك رابط خرائط Google',
    });
  }
}
