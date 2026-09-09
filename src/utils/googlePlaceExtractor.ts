import { matchScopeByCoords } from './geocoding';
import { CATEGORY_GROUPS } from '../data/mockData';
import { classifyPlaceCategory } from './googleCategoryClassifier';

export interface ExtractedGooglePlace {
  name?: string;
  phone?: string;
  category?: string;
  group?: string;
  googleCategoryTitle?: string;
  governorate?: string;
  city?: string;
  street?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  reviewCount?: number;
  address?: string;
  workingHours?: string;
  photo?: string;
  photos?: string[];
  resolvedUrl: string;
}

export function isGoogleMapsUrl(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const lower = input.trim().toLowerCase();
  return (
    lower.includes('maps.app.goo.gl') ||
    lower.includes('goo.gl/maps') ||
    lower.includes('google.com/maps') ||
    lower.includes('maps.google.com')
  );
}

export const BIDI_CONTROL_REGEX = /[\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069\uFEFF]/g;

export function stripBiDiControls(str?: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(BIDI_CONTROL_REGEX, '').trim();
}

/**
 * Sanitizes place names extracted from Google Maps links or titles (Update 38 & Update 47).
 * Separates pure business name from attached district/street address tokens,
 * and completely purges invisible BiDi directional overrides (\u202A-\u202E).
 */
export function sanitizePlaceNameAndAddress(rawName: string): { cleanName: string; extraAddress?: string } {
  if (!rawName || typeof rawName !== 'string') {
    return { cleanName: '' };
  }

  let text = stripBiDiControls(rawName)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .trim();

  // Remove trailing Google branding
  text = text.replace(/\s*[-·|–]\s*(Google Maps|خرائط Google|Google).*$/i, '').trim();

  // Split by common delimiters: Arabic comma (،), English comma (,), middle dot (·), or pipe (|)
  const parts = text.split(/\s*[\u060C,·|]\s*/).map(p => stripBiDiControls(p)).filter(Boolean);

  if (parts.length <= 1) {
    return { cleanName: stripBiDiControls(text) };
  }

  const cleanName = stripBiDiControls(parts[0]);
  const extraAddress = parts.slice(1).map(p => stripBiDiControls(p)).filter(Boolean).join('، ');

  return { cleanName, extraAddress };
}

/**
 * Instant (0ms) client-side parser of Google Maps URLs
 */
export function parseClientSideGoogleUrl(rawUrl: string): Partial<ExtractedGooglePlace> {
  const url = (rawUrl || '').trim();
  const result: Partial<ExtractedGooglePlace> = { resolvedUrl: url };

  // Place name from /place/{name}/
  const placeMatch = url.match(/\/place\/([^/@?]+)/);
  if (placeMatch) {
    let rawDecoded = '';
    try {
      rawDecoded = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ').trim();
    } catch {
      rawDecoded = placeMatch[1].replace(/\+/g, ' ').trim();
    }
    if (rawDecoded) {
      const { cleanName, extraAddress } = sanitizePlaceNameAndAddress(rawDecoded);
      result.name = cleanName;
      if (extraAddress) {
        result.address = extraAddress;
        result.street = extraAddress;
      }
    }
  }

  // Coordinates
  const coordsMatch =
    url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
    url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
    url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);

  if (coordsMatch) {
    result.lat = parseFloat(coordsMatch[1]);
    result.lng = parseFloat(coordsMatch[2]);
  }

  return result;
}

/**
 * Matches common Google category terms with Dalelak's CATEGORY_GROUPS using the comprehensive classifier
 */
export function mapGoogleCategoryToDalelak(text: string): string | undefined {
  if (!text) return undefined;
  const classified = classifyPlaceCategory(text);
  return classified?.category;
}

/**
 * Fetches and resolves Google Maps place data with backend resolver + client fallback
 */
export async function extractGooglePlaceData(rawUrl: string): Promise<ExtractedGooglePlace | null> {
  const cleanUrl = (rawUrl || '').trim();
  if (!cleanUrl) return null;

  // 1. Initial 0ms client-side parse
  const initial = parseClientSideGoogleUrl(cleanUrl);

  // 2. Resilient multi-endpoint backend resolver with auto-retry (Update 37)
  const isLocal = typeof window !== 'undefined' && window.location.origin.includes('localhost');
  const resolverEndpoints = isLocal
    ? ['/api/google-place-resolver']
    : [
        'https://www.dalilaak.com/api/google-place-resolver',
        'https://dalilak-directory.vercel.app/api/google-place-resolver',
      ];

  let data: any = null;

  for (const endpoint of resolverEndpoints) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6500);

        const res = await fetch(`${endpoint}?url=${encodeURIComponent(cleanUrl)}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          if (json && json.success) {
            data = json;
            break;
          }
        }
      } catch (err) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }
    if (data) break;
  }

  try {
    if (data) {
      const finalLat = data.lat || initial.lat;
      const finalLng = data.lng || initial.lng;

      let derivedGov: string | undefined = undefined;
      let derivedCity: string | undefined = undefined;

      if (finalLat && finalLng) {
        const scope = matchScopeByCoords(finalLat, finalLng);
        derivedGov = scope.governorate;
        derivedCity = scope.city;
      }

      // 🏷️ Clean classification target: prioritize clean name & Google category (Update 36 & 38)
      const rawPlaceName = data.name || initial.name || '';
      const { cleanName: cleanPlaceName, extraAddress } = sanitizePlaceNameAndAddress(rawPlaceName);
      const cleanGoogleCategory = data.category || '';
      const isBoilerplate = (t?: string): boolean => {
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
      const rawAddress = (data.address && !isBoilerplate(data.address))
        ? data.address.trim()
        : (extraAddress || initial.address || undefined);
      const safeAddress = stripBiDiControls(rawAddress) || undefined;

      // Primary classification attempt: place name + Google category
      const primaryTarget = [cleanPlaceName, cleanGoogleCategory].filter(Boolean).join(' ').trim();
      let classified = classifyPlaceCategory(primaryTarget);

      // Secondary classification attempt: include safe address if primary didn't resolve
      if (!classified && safeAddress) {
        classified = classifyPlaceCategory(`${cleanPlaceName} ${safeAddress}`.trim());
      }

      const finalPhotos = Array.isArray(data.photos) && data.photos.length > 0
        ? data.photos.slice(0, 5)
        : (data.photo ? [data.photo] : undefined);

      return {
        name: cleanPlaceName || undefined,
        phone: data.phone,
        category: classified?.category || data.category,
        group: classified?.group,
        googleCategoryTitle: classified?.googleCategoryTitle || data.category,
        governorate: derivedGov,
        city: derivedCity,
        street: safeAddress,
        lat: finalLat,
        lng: finalLng,
        rating: data.rating,
        reviewCount: data.reviewCount,
        address: safeAddress,
        workingHours: data.workingHours,
        photo: data.photo || (finalPhotos && finalPhotos.length > 0 ? finalPhotos[0] : undefined),
        photos: finalPhotos,
        resolvedUrl: data.resolvedUrl || cleanUrl,
      };
    }
  } catch (err) {
    console.warn('Google place resolver processing error, falling back to client-parsed data:', err);
  }

  // 3. Fallback: return client-side parsed data
  if (initial.name || (initial.lat && initial.lng)) {
    let derivedGov: string | undefined = undefined;
    let derivedCity: string | undefined = undefined;
    if (initial.lat && initial.lng) {
      const scope = matchScopeByCoords(initial.lat, initial.lng);
      derivedGov = scope.governorate;
      derivedCity = scope.city;
    }

    const { cleanName, extraAddress } = sanitizePlaceNameAndAddress(initial.name || '');
    const classified = cleanName ? classifyPlaceCategory(cleanName) : null;
    const fallbackAddress = initial.address || extraAddress;

    return {
      name: cleanName || undefined,
      phone: undefined,
      category: classified?.category,
      group: classified?.group,
      googleCategoryTitle: classified?.googleCategoryTitle,
      governorate: derivedGov,
      city: derivedCity,
      street: fallbackAddress,
      lat: initial.lat,
      lng: initial.lng,
      rating: undefined,
      reviewCount: undefined,
      address: fallbackAddress,
      photo: undefined,
      photos: undefined,
      resolvedUrl: initial.resolvedUrl || cleanUrl,
    };
  }

  return null;
}
