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

    let titleParts: string[] = [];
    const ogTitleMatch =
      htmlContent.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      htmlContent.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      let parsedOg = cleanPlaceName(ogTitleMatch[1]);
      if (parsedOg.includes('·')) {
        titleParts = parsedOg.split('·').map(s => s.trim());
        parsedOg = titleParts[0].trim();
        if (titleParts[1]) {
          extractedAddressFromTitle = titleParts.slice(1).join('·').trim();
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

    // ─── Multi-Strategy Phone Extraction (Update 34) ────────────────────────
    const normalizeEgyptianPhone = (raw: string): string | undefined => {
      if (!raw || typeof raw !== 'string') return undefined;
      const digits = raw.replace(/[\s\-_()+]/g, '').trim();
      let local = digits;
      if (local.startsWith('+20')) local = '0' + local.slice(3);
      else if (local.startsWith('0020')) local = '0' + local.slice(4);
      else if (local.startsWith('20') && local.length >= 12) local = '0' + local.slice(2);
      else if (local.startsWith('1') && local.length === 10) local = '0' + local;
      if (local.startsWith('0') && (local.length === 10 || local.length === 11)) return local;
      return undefined;
    };

    let phone: string | undefined = undefined;

    // Strategy 1: Structured Google Maps Preload JSON → json[6][178]
    if (preloadPayload && !phone) {
      try {
        let cleanJson = preloadPayload.trim();
        if (cleanJson.startsWith(")]}'")) cleanJson = cleanJson.slice(4).trim();
        const gjson = JSON.parse(cleanJson);
        if (gjson && gjson[6] && gjson[6][178] && Array.isArray(gjson[6][178])) {
          for (const item of gjson[6][178]) {
            if (!item) continue;
            const candidates: string[] = [
              item[3], item[0],
              item[1] && item[1][1] && item[1][1][0],
              item[5] && item[5][0],
            ].filter(Boolean) as string[];
            for (const c of candidates) {
              const n = normalizeEgyptianPhone(c.replace('tel:', ''));
              if (n) { phone = n; break; }
            }
            if (phone) break;
          }
        }
        if (!phone) {
          const searchTel = (node: unknown): void => {
            if (phone) return;
            if (typeof node === 'string') {
              if (node.startsWith('tel:')) {
                const n = normalizeEgyptianPhone(node.slice(4));
                if (n) phone = n;
              }
            } else if (Array.isArray(node)) {
              node.forEach(searchTel);
            } else if (node && typeof node === 'object') {
              Object.values(node as Record<string, unknown>).forEach(searchTel);
            }
          };
          searchTel(gjson);
        }
      } catch { /* ignore parse errors */ }
    }

    // Strategy 2: Explicit tel: link in HTML or combined text
    if (!phone) {
      const combinedContent = htmlContent + '\n' + preloadPayload;
      const telMatch = combinedContent.match(/tel:([+0-9\s\-]{8,20})/i);
      if (telMatch) phone = normalizeEgyptianPhone(telMatch[1]) ?? undefined;
    }

    // Strategy 3: Schema.org telephone
    if (!phone) {
      const schemaMatch = htmlContent.match(/"telephone"\s*:\s*"([^"]+)"/i);
      if (schemaMatch) phone = normalizeEgyptianPhone(schemaMatch[1]) ?? undefined;
    }

    // Strategy 4: Egyptian mobile strict boundary
    if (!phone) {
      const mobileMatches = (htmlContent + '\n' + preloadPayload).match(
        /(?:^|[^0-9.])(\+?20\s*1[0125]\d{8}|01[0125]\d{8})(?=[^0-9]|$)/gm
      );
      if (mobileMatches && mobileMatches.length > 0) {
        const raw = mobileMatches[0].replace(/(?:^[^0-9+])|(?:[^0-9]$)/g, '');
        phone = normalizeEgyptianPhone(raw) ?? undefined;
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ─── Address Extraction with Boilerplate Guard (Update 34) ───────────────
    const isBoilerplateAddress = (t?: string): boolean => {
      if (!t) return true;
      const l = t.toLowerCase();
      return (
        l.includes('find local businesses') ||
        l.includes('view maps') ||
        l.includes('driving directions') ||
        l.includes('معاينة الأنشطة') ||
        l.includes('خرائط google') ||
        l.includes('google maps')
      );
    };

    let address: string | undefined = undefined;

    // Try structured preload JSON first
    if (preloadPayload) {
      try {
        let cleanJson2 = preloadPayload.trim();
        if (cleanJson2.startsWith(")]}'")) cleanJson2 = cleanJson2.slice(4).trim();
        const gjson2 = JSON.parse(cleanJson2);
        if (gjson2 && gjson2[6]) {
          if (typeof gjson2[6][39] === 'string' && gjson2[6][39].trim().length > 3 && !isBoilerplateAddress(gjson2[6][39])) {
            address = gjson2[6][39].trim();
          } else if (Array.isArray(gjson2[6][2]) && !address) {
            const parts = (gjson2[6][2] as unknown[]).filter((p): p is string => typeof p === 'string' && p.trim().length > 0);
            if (parts.length > 0) {
              const joined = parts.join('، ').trim();
              if (!isBoilerplateAddress(joined)) address = joined;
            }
          }
        }
      } catch { /* ignore */ }
    }
    // Fallback to og:title extracted part
    if (!address && extractedAddressFromTitle && !isBoilerplateAddress(extractedAddressFromTitle)) {
      address = extractedAddressFromTitle;
    }
    // ─────────────────────────────────────────────────────────────────────────
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
    while ((match = ggRegex.exec(htmlContent + '\n' + preloadPayload)) !== null && photos.length < 5) {
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
      // Only use description as address fallback if not already found and not boilerplate
      if (!address && !isBoilerplateAddress(desc)) {
        address = desc;
      }
    }

    // ─── 6. Category Extraction from Google Places (Update 36) ───────────────
    let placeCategory: string | undefined = undefined;

    // A. From preloadPayload JSON (internal Google Places structure)
    if (preloadPayload) {
      try {
        let cleanJsonCat = preloadPayload.trim();
        if (cleanJsonCat.startsWith(")]}'")) cleanJsonCat = cleanJsonCat.slice(4).trim();
        const gjsonCat = JSON.parse(cleanJsonCat);
        if (gjsonCat && gjsonCat[6]) {
          if (Array.isArray(gjsonCat[6][13])) {
            for (const item of gjsonCat[6][13]) {
              if (typeof item === 'string' && item.trim().length > 2) {
                placeCategory = item.trim();
                break;
              } else if (Array.isArray(item) && typeof item[0] === 'string' && item[0].trim().length > 2) {
                placeCategory = item[0].trim();
                break;
              }
            }
          }
          if (!placeCategory && typeof gjsonCat[6][76] === 'string' && gjsonCat[6][76].trim().length > 2) {
            placeCategory = gjsonCat[6][76].trim();
          }
        }
      } catch { /* ignore */ }
    }

    // B. From HTML Schema.org JSON-LD or meta/itemprop tags
    if (!placeCategory && htmlContent) {
      const typeMatch = htmlContent.match(/"@type"\s*:\s*"([A-Za-z]+)"/i);
      if (typeMatch && typeMatch[1] && !['LocalBusiness', 'Place', 'Organization', 'WebPage'].includes(typeMatch[1])) {
        placeCategory = typeMatch[1];
      }
      if (!placeCategory) {
        const itemPropCat = htmlContent.match(/itemprop=["'](?:category|title)["'][^>]*content=["']([^"']+)["']/i) ||
                            htmlContent.match(/<meta[^>]+(?:name|property)=["']category["'][^>]*content=["']([^"']+)["']/i);
        if (itemPropCat && itemPropCat[1]) {
          placeCategory = itemPropCat[1].trim();
        }
      }
    }

    // C. From og:title if it has 3 parts (Name · Category · Location)
    if (!placeCategory && titleParts.length >= 3) {
      const candidateCat = titleParts[1];
      if (candidateCat && candidateCat.length >= 3 && candidateCat.length <= 40 && !candidateCat.includes('http')) {
        placeCategory = candidateCat;
      }
    }

    return res.status(200).json({
      success: true,
      name: placeName || undefined,
      category: placeCategory || undefined,
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
