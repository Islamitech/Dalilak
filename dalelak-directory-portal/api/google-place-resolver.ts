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

function extractHoursFromPayload(text: string): string | undefined {
  let workingHours: string | undefined = undefined;
  try {
    let cleanJson = text.trim();
    if (cleanJson.startsWith(")]}'")) {
      cleanJson = cleanJson.slice(4).trim();
    }
    const json = JSON.parse(cleanJson);
    if (json && json[6] && json[6][203]) {
      const hBlock = json[6][203];
      let statusStr = '';
      if (hBlock[1] && hBlock[1][4] && typeof hBlock[1][4][0] === 'string') {
        statusStr = hBlock[1][4][0].trim();
      }
      let timeRange = '';
      if (
        hBlock[0] &&
        hBlock[0][0] &&
        Array.isArray(hBlock[0][0][3]) &&
        hBlock[0][0][3][0] &&
        typeof hBlock[0][0][3][0][0] === 'string'
      ) {
        timeRange = hBlock[0][0][3][0][0].trim();
      }

      if (timeRange && statusStr) {
        workingHours = `يومياً: ${timeRange} (${statusStr})`;
      } else if (timeRange) {
        workingHours = `يومياً: ${timeRange}`;
      } else if (statusStr) {
        workingHours = statusStr;
      }
    }
  } catch {
    // Fallback if not JSON
  }

  if (!workingHours) {
    const statusMatch = text.match(/"((?:مغلق|مفتوح)\s*[·•\-]\s*[^"\\<]{3,60})"/);
    if (statusMatch) {
      workingHours = statusMatch[1].trim();
    }
  }

  return workingHours;
}

function addPlacePhoto(rawUrl: string, list: string[], seen: Set<string>, limit = 5): void {
  if (!rawUrl || typeof rawUrl !== 'string' || list.length >= limit) return;
  if (
    rawUrl.includes('google_maps_logo') ||
    rawUrl.includes('staticmap') ||
    rawUrl.includes('maps_512dp') ||
    rawUrl.includes('photo.jpg') ||
    rawUrl.includes('streetviewpixels') ||
    rawUrl.includes('default_avatar')
  ) {
    return;
  }
  const clean = rawUrl.replace(/=w\d+.*$/, '=s1600').replace(/=s\d+.*$/, '=s1600');
  const baseKey = clean.split('=')[0];
  if (!seen.has(baseKey)) {
    seen.add(baseKey);
    list.push(clean.includes('=s1600') ? clean : `${clean}=s1600`);
  }
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
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    let htmlContent = '';
    let preloadPayload = '';

    try {
      // 1. Fetch with Desktop Chrome to unfurl redirects and obtain preload place data
      const desktopResponse = await fetch(trimmedUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      destinationUrl = desktopResponse.url || trimmedUrl;
      htmlContent = await desktopResponse.text();

      // Check if place has preload link for detailed hours & multi-photos
      const preloadMatch = htmlContent.match(/<link\s+href="(\/maps\/preview\/place[^"]+)"\s+as="fetch"/i);
      if (preloadMatch) {
        const preloadUrl = 'https://www.google.com' + preloadMatch[1].replace(/&amp;/g, '&');
        try {
          const pRes = await fetch(preloadUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
              Referer: 'https://www.google.com/maps',
            },
            signal: controller.signal,
          });
          if (pRes.ok) {
            preloadPayload = await pRes.text();
          }
        } catch {
          // Preload fetch failed, fallback to main HTML
        }
      }

      // If place name or og metadata wasn't in desktop HTML, try crawler SSR
      if (!htmlContent.includes('og:title') && !htmlContent.includes('og:image')) {
        try {
          const botResponse = await fetch(destinationUrl, {
            headers: {
              'User-Agent': 'Twitterbot/1.0',
              'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
            },
            signal: controller.signal,
          });
          if (botResponse.ok) {
            const botHtml = await botResponse.text();
            htmlContent += '\n' + botHtml;
          }
        } catch {
          // Ignore bot fetch errors
        }
      }
    } catch {
      // If network fetch fails, proceed with URL parsing
    } finally {
      clearTimeout(timeoutId);
    }

    let placeName = '';
    let extractedAddressFromTitle: string | undefined = undefined;

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
      let parsedOg = cleanPlaceName(ogTitleMatch[1]);
      if (parsedOg.includes('·')) {
        const parts = parsedOg.split('·');
        parsedOg = parts[0].trim();
        if (parts[1]) {
          extractedAddressFromTitle = parts.slice(1).join('·').trim();
        }
      }
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
    const combinedContent = htmlContent + '\n' + preloadPayload;
    const phoneMatches = combinedContent.match(/(?:\+20\s*|0)(1[0125]\d{8}|2\d{7,8})/g);
    if (phoneMatches && phoneMatches.length > 0) {
      const rawDigits = phoneMatches[0].replace(/\D/g, '');
      if (rawDigits.startsWith('20')) {
        phone = '0' + rawDigits.substring(2);
      } else if (rawDigits.startsWith('0')) {
        phone = rawDigits;
      }
    }

    let address: string | undefined = extractedAddressFromTitle;
    let rating: number | undefined = undefined;
    let reviewCount: number | undefined = undefined;
    const photos: string[] = [];
    const seenHashes = new Set<string>();

    // 1. Photos from preload place payload
    if (preloadPayload) {
      const pCdnMatches =
        preloadPayload.match(/https:\/\/[a-z0-9.-]*googleusercontent\.com\/(?:p|gps-cs-s|gps-proxy)\/[A-Za-z0-9_-]+/g) ||
        [];
      for (const p of pCdnMatches) {
        addPlacePhoto(p, photos, seenHashes, 5);
        if (photos.length >= 5) break;
      }
    }

    // 2. OpenGraph Cover Photo
    const ogImageMatch =
      htmlContent.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      htmlContent.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    if (ogImageMatch && ogImageMatch[1]) {
      const rawOg = ogImageMatch[1].replace(/&amp;/g, '&');
      addPlacePhoto(rawOg, photos, seenHashes, 5);
    }

    // 3. Photos from HTML content
    const cdnRegex = /https:\/\/[a-z0-9.-]*googleusercontent\.com\/(?:p|gps-cs-s|gps-proxy)\/[A-Za-z0-9_-]+/g;
    let match: RegExpExecArray | null;
    while ((match = cdnRegex.exec(htmlContent)) !== null && photos.length < 5) {
      addPlacePhoto(match[0], photos, seenHashes, 5);
    }

    // 4. Photos from ggpht CDN
    const ggRegex = /https:\/\/[a-z0-9.-]*ggpht\.com\/(?:p|gps-cs-s|gps-proxy)\/[A-Za-z0-9_-]+/g;
    while ((match = ggRegex.exec(combinedContent)) !== null && photos.length < 5) {
      addPlacePhoto(match[0], photos, seenHashes, 5);
    }

    const photo = photos.length > 0 ? photos[0] : undefined;

    // 5. Working Hours Extraction (from preload payload and HTML)
    let workingHours: string | undefined = undefined;
    if (preloadPayload) {
      workingHours = extractHoursFromPayload(preloadPayload);
    }
    if (!workingHours && htmlContent) {
      workingHours = extractHoursFromPayload(htmlContent);
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
      workingHours: workingHours || undefined,
      photo,
      photos: photos.length > 0 ? photos.slice(0, 5) : undefined,
      resolvedUrl: destinationUrl,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'حدث خطأ أثناء فك رابط خرائط Google',
    });
  }
}
