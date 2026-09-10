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

const BIDI_CONTROL_REGEX = /[\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069\uFEFF]/g;

export function stripBiDiControls(str?: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(BIDI_CONTROL_REGEX, '').trim();
}

function cleanPlaceName(rawName: string): { name: string; extraAddress?: string } {
  let name = stripBiDiControls(decodeHtmlEntities(rawName));
  name = name.replace(/\s*[-·|–]\s*(Google Maps|خرائط Google|Google).*$/i, '').trim();

  // Guard: if name itself is purely "Google Maps" or "خرائط Google" or "Google", discard it
  if (/^(Google Maps|خرائط Google|Google)$/i.test(name)) {
    return { name: '' };
  }

  // Split by common Google Maps delimiters: Arabic comma (،), English comma (,), middle dot (·), pipe (|)
  const parts = name.split(/\s*[\u060C,·|]\s*/).map(s => stripBiDiControls(s)).filter(Boolean);
  if (parts.length <= 1) {
    return { name: stripBiDiControls(name) };
  }

  const clean = stripBiDiControls(parts[0]);
  const extraAddress = parts.slice(1).map(s => stripBiDiControls(s)).filter(Boolean).join('، ');
  return { name: clean, extraAddress };
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

function addPlacePhoto(rawUrl: string, list: string[], seen: Set<string>, limit = 1): void {
  if (!rawUrl || typeof rawUrl !== 'string' || list.length >= limit) return;
  if (
    rawUrl.includes('google_maps_logo') ||
    rawUrl.includes('staticmap') ||
    rawUrl.includes('maps_512dp') ||
    rawUrl.includes('photo.jpg') ||
    rawUrl.includes('streetviewpixels') ||
    rawUrl.includes('default_avatar') ||
    rawUrl.includes('default-user') ||
    rawUrl.includes('default-avatar')
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

/**
 * Extracts photos exclusively belonging to the target place from Google Maps structured JSON (Update 39).
 * Isolates place photos and strictly excludes competitor/nearby recommendation blocks (nodes [99] and [204]).
 */
function extractStructuredPlacePhotos(payload: string, limit = 1): string[] {
  const photos: string[] = [];
  const seenHashes = new Set<string>();
  if (!payload || typeof payload !== 'string') return photos;

  try {
    let cleanJson = payload.trim();
    if (cleanJson.startsWith(")]}'")) cleanJson = cleanJson.slice(4).trim();
    const gjson = JSON.parse(cleanJson);
    const json6 = gjson && gjson[6];

    if (json6 && Array.isArray(json6)) {
      // 1. Primary Featured & Storefront Photos: json[6][72]
      if (json6[72] && Array.isArray(json6[72])) {
        for (const group of json6[72]) {
          if (Array.isArray(group)) {
            for (const item of group) {
              if (item && Array.isArray(item[6]) && typeof item[6][0] === 'string') {
                addPlacePhoto(item[6][0], photos, seenHashes, limit);
              }
            }
          }
        }
      }

      // 2. Identity / Hero Photo: json[6][51]
      if (photos.length < limit && json6[51] && Array.isArray(json6[51])) {
        for (const group of json6[51]) {
          if (Array.isArray(group)) {
            for (const item of group) {
              if (item && Array.isArray(item[6]) && typeof item[6][0] === 'string') {
                addPlacePhoto(item[6][0], photos, seenHashes, limit);
              }
            }
          }
        }
      }

      // 3. User Photos Gallery Tab ("All"): json[6][171]
      if (photos.length < limit && json6[171] && Array.isArray(json6[171])) {
        for (const tab of json6[171]) {
          if (tab && tab[0] && Array.isArray(tab[0][3])) {
            for (const photoItem of tab[0][3]) {
              if (photoItem && Array.isArray(photoItem[6]) && typeof photoItem[6][0] === 'string') {
                addPlacePhoto(photoItem[6][0], photos, seenHashes, limit);
              }
            }
          }
        }
      }

      // 4. Safe place-specific media arrays (excluding competitor/nearby recommendation nodes: 99, 204)
      const safeKeys = [37, 105, 120];
      for (const k of safeKeys) {
        if (photos.length >= limit) break;
        if (json6[k] && Array.isArray(json6[k])) {
          const searchSafe = (node: unknown): void => {
            if (photos.length >= limit || !node) return;
            if (typeof node === 'string') {
              if (
                node.startsWith('https://lh3.googleusercontent.com/') ||
                node.startsWith('https://lh5.googleusercontent.com/') ||
                node.startsWith('https://lh4.googleusercontent.com/') ||
                node.startsWith('https://lh6.googleusercontent.com/')
              ) {
                addPlacePhoto(node, photos, seenHashes, limit);
              }
            } else if (Array.isArray(node)) {
              node.forEach(searchSafe);
            }
          };
          searchSafe(json6[k]);
        }
      }
    }
  } catch {
    // Ignore parse errors, fallback cleanly
  }

  return photos;
}

const GOOGLE_PLACES_API_KEY =
  process.env.GOOGLE_PLACES_API_KEY || 'AIzaSyD3eyrkvcPrYKgGFqUf2p3OrzKgMep_7c4';

interface PlacesApiPhotoResult {
  photos: string[];
  displayName?: string;
  formattedAddress?: string;
  googleCategory?: string;
  googleType?: string;
}

/**
 * Fetches verified official business photos directly from Google Places API (New) (Update 40 & 41).
 * Retrieves up to 5-10 high-resolution (s1600) photos strictly belonging to the target business profile,
 * and extracts official localized Arabic category from primaryTypeDisplayName.
 */
async function fetchOfficialPlacesPhotos(
  query: string,
  lat?: number,
  lng?: number,
  limit = 1
): Promise<PlacesApiPhotoResult> {
  if (!GOOGLE_PLACES_API_KEY || !query) {
    return { photos: [] };
  }

  try {
    const searchBody: Record<string, unknown> = {
      textQuery: query,
      languageCode: 'ar',
    };

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      searchBody.locationBias = {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 1000.0,
        },
      };
    }

    const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.primaryType,places.primaryTypeDisplayName,places.formattedAddress,places.photos',
      },
      body: JSON.stringify(searchBody),
    });

    if (!searchRes.ok) {
      return { photos: [] };
    }

    const searchData = await searchRes.json();
    if (!searchData.places || !Array.isArray(searchData.places) || searchData.places.length === 0) {
      return { photos: [] };
    }

    const matchedPlace = searchData.places[0];
    const googleCategory = matchedPlace.primaryTypeDisplayName?.text;
    const googleType = matchedPlace.primaryType;
    const rawPhotos = matchedPlace.photos;
    if (!Array.isArray(rawPhotos) || rawPhotos.length === 0) {
      return {
        photos: [],
        displayName: stripBiDiControls(matchedPlace.displayName?.text),
        formattedAddress: stripBiDiControls(matchedPlace.formattedAddress),
        googleCategory,
        googleType,
      };
    }

    const targetPhotos = rawPhotos.slice(0, limit);
    const resolvedUrls = (
      await Promise.all(
        targetPhotos.map(async (p: { name?: string }) => {
          if (!p.name) return null;
          try {
            const mediaUrl = `https://places.googleapis.com/v1/${p.name}/media?maxHeightPx=1600&maxWidthPx=1600&key=${GOOGLE_PLACES_API_KEY}&skipHttpRedirect=true`;
            const mediaRes = await fetch(mediaUrl);
            if (mediaRes.ok) {
              const mediaData = await mediaRes.json();
              if (mediaData && mediaData.photoUri && typeof mediaData.photoUri === 'string') {
                return mediaData.photoUri as string;
              }
            }
          } catch {
            // Continue fetching other photos
          }
          return null;
        })
      )
    ).filter((u): u is string => Boolean(u));

    return {
      photos: resolvedUrls,
      displayName: stripBiDiControls(matchedPlace.displayName?.text),
      formattedAddress: stripBiDiControls(matchedPlace.formattedAddress),
      googleCategory,
      googleType,
    };
  } catch {
    return { photos: [] };
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
      let rawUrlName = '';
      try {
        rawUrlName = decodeURIComponent(placeUrlMatch[1]).replace(/\+/g, ' ').trim();
      } catch {
        rawUrlName = placeUrlMatch[1].replace(/\+/g, ' ').trim();
      }
      if (rawUrlName) {
        const cleaned = cleanPlaceName(rawUrlName);
        placeName = cleaned.name;
        if (cleaned.extraAddress) {
          extractedAddressFromTitle = cleaned.extraAddress;
        }
      }
    }

    // Support query parameter q (e.g. /maps?q=... or shortlink redirect target)
    if (!placeName) {
      try {
        const urlObj = new URL(destinationUrl);
        const qParam = urlObj.searchParams.get('q');
        if (qParam && !qParam.match(/^-?\d+\.\d+,-?\d+\.\d+$/)) {
          const cleaned = cleanPlaceName(qParam);
          if (cleaned.name) {
            placeName = cleaned.name;
            if (cleaned.extraAddress && !extractedAddressFromTitle) {
              extractedAddressFromTitle = cleaned.extraAddress;
            }
          }
        }
      } catch {
        // Ignore invalid URL
      }
    }

    let titleParts: string[] = [];
    const ogTitleMatch =
      htmlContent.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      htmlContent.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      const rawOg = ogTitleMatch[1];
      if (rawOg.includes('·')) {
        titleParts = rawOg.split('·').map(s => s.trim());
      }
      const cleanedOg = cleanPlaceName(rawOg);
      if (!placeName && cleanedOg.name) {
        placeName = cleanedOg.name;
        if (cleanedOg.extraAddress && !extractedAddressFromTitle) {
          extractedAddressFromTitle = cleanedOg.extraAddress;
        }
      }
    }

    if (!placeName) {
      const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        const cleanedTitle = cleanPlaceName(titleMatch[1]);
        if (cleanedTitle.name && !cleanedTitle.name.includes('خرائط Google') && !cleanedTitle.name.includes('Google Maps')) {
          placeName = cleanedTitle.name;
          if (cleanedTitle.extraAddress && !extractedAddressFromTitle) {
            extractedAddressFromTitle = cleanedTitle.extraAddress;
          }
        }
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
    const seenHashes = new Set<string>();

    // ─── Photo Extraction (Update 40: Google Places API New + Anti-Bleed Scraper Hybrid) ───
    const photos: string[] = [];
    let officialGoogleCategory: string | undefined = undefined;

    // Strategy 1 (Top Priority): Official Places API (New) (5 guaranteed high-res photos)
    const searchQuery = placeName || extractedAddressFromTitle;
    if (searchQuery) {
      try {
        const apiResult = await fetchOfficialPlacesPhotos(searchQuery, lat, lng, 5);
        if (apiResult.photos && apiResult.photos.length > 0) {
          for (const p of apiResult.photos) {
            addPlacePhoto(p, photos, seenHashes, 5);
          }
        }
        if (!placeName && apiResult.displayName) {
          placeName = apiResult.displayName;
        }
        if (!address && apiResult.formattedAddress && !isBoilerplateAddress(apiResult.formattedAddress)) {
          address = apiResult.formattedAddress;
        }
        if (apiResult.googleCategory) {
          officialGoogleCategory = apiResult.googleCategory;
        }
      } catch {
        // Fallback silently to scraper
      }
    }

    // Strategy 2: Preload JSON Structured Photos (Update 39 Anti-Bleed Isolation) fallback / backfill
    if (photos.length < 5 && preloadPayload) {
      const scraperPhotos = extractStructuredPlacePhotos(preloadPayload, 5);
      for (const p of scraperPhotos) {
        if (photos.length >= 5) break;
        addPlacePhoto(p, photos, seenHashes, 5);
      }
    }

    // Strategy 3: OpenGraph Cover Photo fallback (only if still no photos)
    if (photos.length === 0) {
      const ogImageMatch =
        htmlContent.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
        htmlContent.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
      if (ogImageMatch && ogImageMatch[1]) {
        const rawOg = ogImageMatch[1].replace(/&amp;/g, '&');
        if (!rawOg.includes('staticmap') && !rawOg.includes('google_maps_logo')) {
          addPlacePhoto(rawOg, photos, seenHashes, 5);
        }
      }
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

    // ─── 6. Category Extraction from Google Places (Update 36 & 41) ───────────
    let placeCategory: string | undefined = officialGoogleCategory;

    // A. From preloadPayload JSON (internal Google Places structure fallback)
    if (!placeCategory && preloadPayload) {
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
      name: placeName ? stripBiDiControls(placeName) : undefined,
      category: placeCategory ? stripBiDiControls(placeCategory) : undefined,
      phone: phone || undefined,
      lat: lat && !isNaN(lat) ? Number(lat.toFixed(6)) : undefined,
      lng: lng && !isNaN(lng) ? Number(lng.toFixed(6)) : undefined,
      rating: rating || undefined,
      reviewCount: reviewCount || undefined,
      address: address ? stripBiDiControls(address) : undefined,
      workingHours: workingHours || undefined,
      photo,
      photos: photos.length > 0 ? [photos[0]] : undefined,
      resolvedUrl: destinationUrl,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'حدث خطأ أثناء فك رابط خرائط Google',
    });
  }
}
