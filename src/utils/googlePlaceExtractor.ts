import { matchScopeByCoords } from './geocoding';
import { CATEGORY_GROUPS } from '../data/mockData';

export interface ExtractedGooglePlace {
  name?: string;
  phone?: string;
  category?: string;
  governorate?: string;
  city?: string;
  street?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  reviewCount?: number;
  address?: string;
  photo?: string;
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

/**
 * Instant (0ms) client-side parser of Google Maps URLs
 */
export function parseClientSideGoogleUrl(rawUrl: string): Partial<ExtractedGooglePlace> {
  const url = (rawUrl || '').trim();
  const result: Partial<ExtractedGooglePlace> = { resolvedUrl: url };

  // Place name from /place/{name}/
  const placeMatch = url.match(/\/place\/([^/@?]+)/);
  if (placeMatch) {
    try {
      result.name = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ').trim();
    } catch {
      result.name = placeMatch[1].replace(/\+/g, ' ').trim();
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
 * Matches common Google category terms with Dalelak's CATEGORY_GROUPS
 */
export function mapGoogleCategoryToDalelak(text: string): string | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase();

  for (const group of CATEGORY_GROUPS) {
    if (lower.includes(group.group.toLowerCase())) return group.group;
    for (const item of group.items) {
      if (lower.includes(item.toLowerCase())) return group.group;
    }
  }

  // Common keyword heuristic mappings
  if (lower.match(/مطعم|كافيه|مقهى|مأكولات|وجبات|شاورما|بيتزا|restaurant|cafe|food/i)) return 'مطاعم وكافيهات';
  if (lower.match(/صيدلية|طبي|دكتور|عيادة|مستشفى|pharmacy|clinic|hospital|doctor/i)) return 'صيدليات ورعاية صحية';
  if (lower.match(/سوبر ماركت|ماركت|بقالة|تموين|خضار|فواكه|market|grocery/i)) return 'سوبر ماركت ومواد غذائية';
  if (lower.match(/سيارات|ميكانيكا|زيوت|كاوتش|إطارات|صيانة|car|mechanic|auto/i)) return 'خدمات سيارات وصيانة';
  if (lower.match(/ملابس|أزياء|أحذية|حقائب|بوتيك|fashion|clothes/i)) return 'ملابس وموضة';
  if (lower.match(/صالون|حلاقة|كوافير|تجميل|spa|barber|salon/i)) return 'صالونات وعناية شخصية';
  if (lower.match(/موبايل|هواتف|كمبيوتر|إلكترونيات|mobile|phone|computer/i)) return 'إلكترونيات وموبايلات';

  return undefined;
}

/**
 * Fetches and resolves Google Maps place data with backend resolver + client fallback
 */
export async function extractGooglePlaceData(rawUrl: string): Promise<ExtractedGooglePlace | null> {
  const cleanUrl = (rawUrl || '').trim();
  if (!cleanUrl) return null;

  // 1. Initial 0ms client-side parse
  const initial = parseClientSideGoogleUrl(cleanUrl);

  // 2. Determine backend endpoint URL
  const isLocal = typeof window !== 'undefined' && window.location.origin.includes('localhost');
  const resolverEndpoint = isLocal
    ? '/api/google-place-resolver'
    : 'https://www.dalilaak.com/api/google-place-resolver';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${resolverEndpoint}?url=${encodeURIComponent(cleanUrl)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        const finalLat = data.lat || initial.lat;
        const finalLng = data.lng || initial.lng;

        let derivedGov: string | undefined = undefined;
        let derivedCity: string | undefined = undefined;

        if (finalLat && finalLng) {
          const scope = matchScopeByCoords(finalLat, finalLng);
          derivedGov = scope.governorate;
          derivedCity = scope.city;
        }

        const category = mapGoogleCategoryToDalelak(data.address || data.name || '');

        return {
          name: data.name || initial.name,
          phone: data.phone,
          category,
          governorate: derivedGov,
          city: derivedCity,
          street: data.address,
          lat: finalLat,
          lng: finalLng,
          rating: data.rating,
          reviewCount: data.reviewCount,
          address: data.address,
          photo: data.photo,
          resolvedUrl: data.resolvedUrl || cleanUrl,
        };
      }
    }
  } catch (err) {
    console.warn('Google place resolver endpoint error or timeout, falling back to client-parsed data:', err);
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

    return {
      name: initial.name,
      phone: undefined,
      category: mapGoogleCategoryToDalelak(initial.name || ''),
      governorate: derivedGov,
      city: derivedCity,
      street: undefined,
      lat: initial.lat,
      lng: initial.lng,
      rating: undefined,
      reviewCount: undefined,
      address: undefined,
      photo: undefined,
      resolvedUrl: initial.resolvedUrl || cleanUrl,
    };
  }

  return null;
}
