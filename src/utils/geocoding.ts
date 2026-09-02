import { EGYPT_GOVERNORATES } from '../data/mockData';

export interface LocationAddressData {
  governorate?: string;
  city?: string;
  street?: string;
  landmark?: string;
  displayName?: string;
}

export interface PlaceSearchResult {
  lat: number;
  lng: number;
  displayName: string;
  governorate?: string;
  city?: string;
  street?: string;
}

/**
 * Parses Google Maps URLs, coordinate strings, or search queries into lat/lng
 */
export function parseLocationQuery(query: string): { lat: number; lng: number } | null {
  if (!query || typeof query !== 'string') return null;
  const trimmed = query.trim();

  // 1. Direct Lat,Lng format: e.g. "30.0444, 31.2357" or "30.0444,31.2357" or "30.0444 31.2357"
  const coordsRegex = /^(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)$/;
  const coordsMatch = trimmed.match(coordsRegex);
  if (coordsMatch) {
    const lat = parseFloat(coordsMatch[1]);
    const lng = parseFloat(coordsMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }

  // 2. Google Maps URL patterns:
  // e.g. https://www.google.com/maps?q=30.0444,31.2357
  // e.g. https://www.google.com/maps/place/.../@30.0444,31.2357,17z/...
  // e.g. https://maps.google.com/?ll=30.0444,31.2357
  const urlCoordsRegex = /[@?&](?:q=|ll=|loc:)?(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/;
  const urlMatch = trimmed.match(urlCoordsRegex);
  if (urlMatch) {
    const lat = parseFloat(urlMatch[1]);
    const lng = parseFloat(urlMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
  }

  return null;
}

/**
 * Multi-provider Reverse Geocoding with Scope/District-level resolution
 * Resolves to standard Egyptian Scope (e.g. "الجيزة - حدائق الأهرام", "الجيزة - الهرم", "القاهرة - عين شمس")
 * Never populates raw microscopic street names automatically.
 */
const geocodeCache = new Map<string, LocationAddressData>();

export async function fetchLocationAddress(lat: number, lng: number): Promise<LocationAddressData> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // 1. High-accuracy coordinate scope boundary matching (instant & zero network dependency)
  const coordScope = matchScopeByCoords(lat, lng);

  // Provider 1: OpenStreetMap Nominatim with Arabic localization
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar,en`,
      {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      let govMatch = '';
      const rawState = (addr.state || addr.governorate || addr.province || addr.region || '').trim();
      if (rawState) {
        const found = EGYPT_GOVERNORATES.find((g) => {
          const cleanG = g.replace(/\s*\(.*\)/, '').trim();
          return rawState.includes(cleanG) || cleanG.includes(rawState);
        });
        if (found) govMatch = found;
      }

      // Prioritize recognized district / suburb / town over microscopic road names
      const rawCity = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || addr.town || addr.district || addr.city || addr.village || '';
      const cleanCity = sanitizeDistrictScope(rawCity, govMatch || coordScope.governorate) || coordScope.city;

      return {
        governorate: govMatch || coordScope.governorate,
        city: cleanCity,
        street: undefined, // Never inject microscopic streets automatically!
        displayName: `${govMatch || coordScope.governorate} - ${cleanCity}`,
      };
    }
  } catch (err) {
    // Failover to secondary geocoder or coordinate boundary lookup
  }

  // Provider 2: BigDataCloud Open Reverse Geocoding Fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ar`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const rawState = (data.principalSubdivision || '').trim();
      let govMatch = '';
      if (rawState) {
        const found = EGYPT_GOVERNORATES.find((g) => {
          const cleanG = g.replace(/\s*\(.*\)/, '').trim();
          return rawState.includes(cleanG) || cleanG.includes(rawState);
        });
        if (found) govMatch = found;
      }

      const cleanCity = sanitizeDistrictScope(data.locality || data.city, govMatch || coordScope.governorate) || coordScope.city;

      const result: LocationAddressData = {
        governorate: govMatch || coordScope.governorate,
        city: cleanCity,
        street: undefined,
        displayName: `${govMatch || coordScope.governorate} - ${cleanCity}`,
      };
      geocodeCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    // Secondary fallback
  }

  // Safe fallback: Accurate district scope matching by coordinates
  const fallbackResult: LocationAddressData = {
    governorate: coordScope.governorate,
    city: coordScope.city,
    street: undefined,
    displayName: `${coordScope.governorate} - ${coordScope.city}`,
  };
  geocodeCache.set(cacheKey, fallbackResult);
  return fallbackResult;
}

/**
 * Searches Egyptian places, streets, and districts using Nominatim
 */
export async function searchPlacesInEgypt(query: string): Promise<PlaceSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  // Check if query is already coordinates or Google Maps link
  const parsed = parseLocationQuery(query);
  if (parsed) {
    const addr = await fetchLocationAddress(parsed.lat, parsed.lng);
    return [
      {
        lat: parsed.lat,
        lng: parsed.lng,
        displayName: `إحداثيات محددة: ${parsed.lat}, ${parsed.lng}`,
        governorate: addr.governorate,
        city: addr.city,
        street: addr.street,
      },
    ];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query.trim()
      )}&countrycodes=eg&limit=5&addressdetails=1&accept-language=ar`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const list = await res.json();
      return list.map((item: any) => {
        const addr = item.address || {};
        let govMatch = '';
        const rawState = (addr.state || addr.governorate || addr.province || '').trim();
        if (rawState) {
          const found = EGYPT_GOVERNORATES.find((g) => {
            const cleanG = g.replace(/\s*\(.*\)/, '').trim();
            return rawState.includes(cleanG) || cleanG.includes(rawState);
          });
          if (found) govMatch = found;
        }

        return {
          lat: Number(parseFloat(item.lat).toFixed(6)),
          lng: Number(parseFloat(item.lon).toFixed(6)),
          displayName: item.display_name,
          governorate: govMatch,
          city: addr.city || addr.town || addr.suburb || addr.county || '',
          street: addr.road || addr.street || '',
        };
      });
    }
  } catch (err) {
    console.warn('Place search notice:', err);
  }

  return [];
}

/**
 * Major Egyptian District/Scope boundary matcher by GPS coordinates
 * Standardized to recognized community names (e.g. حدائق الأهرام، الهرم، مدينة 6 أكتوبر، عين شمس)
 */
export function matchScopeByCoords(lat: number, lng: number): { governorate: string; city: string } {
  // 📍 الجيزة - حدائق الأهرام (Hadayek Al-Ahram Prime Beta Focus)
  if (lat >= 29.9400 && lat <= 30.0100 && lng >= 31.0700 && lng <= 31.1400) {
    return { governorate: 'الجيزة', city: 'حدائق الأهرام' };
  }

  // 📍 الجيزة - الهرم
  if (lat >= 29.9750 && lat <= 30.0300 && lng >= 31.1400 && lng <= 31.2150) {
    return { governorate: 'الجيزة', city: 'الهرم' };
  }

  // 📍 الجيزة - فيصل
  if (lat >= 29.9900 && lat <= 30.0400 && lng >= 31.1450 && lng <= 31.2050) {
    return { governorate: 'الجيزة', city: 'فيصل' };
  }

  // 📍 الجيزة - مدينة 6 أكتوبر
  if (lat >= 29.8300 && lat <= 30.0400 && lng >= 30.8200 && lng <= 31.0700) {
    return { governorate: 'الجيزة', city: 'مدينة 6 أكتوبر' };
  }

  // 📍 الجيزة - الشيخ زايد
  if (lat >= 30.0100 && lat <= 30.1200 && lng >= 30.8800 && lng <= 31.0600) {
    return { governorate: 'الجيزة', city: 'الشيخ زايد' };
  }

  // 📍 الجيزة - الدقي والمهندسين
  if (lat >= 30.0250 && lat <= 30.0750 && lng >= 31.1800 && lng <= 31.2250) {
    return { governorate: 'الجيزة', city: 'الدقي والمهندسين' };
  }

  // 📍 القاهرة - عين شمس
  if (lat >= 30.1100 && lat <= 30.1700 && lng >= 31.3100 && lng <= 31.3700) {
    return { governorate: 'القاهرة', city: 'عين شمس' };
  }

  // 📍 القاهرة - مدينة نصر
  if (lat >= 30.0200 && lat <= 30.0950 && lng >= 31.3000 && lng <= 31.4200) {
    return { governorate: 'القاهرة', city: 'مدينة نصر' };
  }

  // 📍 القاهرة - مصر الجديدة
  if (lat >= 30.0700 && lat <= 30.1400 && lng >= 31.3000 && lng <= 31.3800) {
    return { governorate: 'القاهرة', city: 'مصر الجديدة' };
  }

  // 📍 القاهرة - التجمع الخامس / القاهرة الجديدة
  if (lat >= 29.9600 && lat <= 30.0800 && lng >= 31.3900 && lng <= 31.5800) {
    return { governorate: 'القاهرة', city: 'التجمع الخامس / القاهرة الجديدة' };
  }

  // 📍 القاهرة - المعادي
  if (lat >= 29.9200 && lat <= 30.0000 && lng >= 31.2300 && lng <= 31.3300) {
    return { governorate: 'القاهرة', city: 'المعادي' };
  }

  // 📍 القاهرة - المقطم
  if (lat >= 30.0000 && lat <= 30.0500 && lng >= 31.2600 && lng <= 31.3400) {
    return { governorate: 'القاهرة', city: 'المقطم' };
  }

  // 📍 القاهرة - شبرا
  if (lat >= 30.0600 && lat <= 30.1200 && lng >= 31.2200 && lng <= 31.2800) {
    return { governorate: 'القاهرة', city: 'شبرا' };
  }

  // 📍 القاهرة - المطرية والزيتون
  if (lat >= 30.0900 && lat <= 30.1500 && lng >= 31.2800 && lng <= 31.3400) {
    return { governorate: 'القاهرة', city: 'المطرية والزيتون' };
  }

  // 📍 القاهرة - وسط البلد
  if (lat >= 30.0350 && lat <= 30.0650 && lng >= 31.2200 && lng <= 31.2650) {
    return { governorate: 'القاهرة', city: 'وسط البلد' };
  }

  // 📍 القاهرة - حلوان
  if (lat >= 29.8000 && lat <= 29.8900 && lng >= 31.2700 && lng <= 31.3600) {
    return { governorate: 'القاهرة', city: 'حلوان' };
  }

  // General Governorate fallbacks
  const gov = matchGovByCoords(lat, lng);
  if (gov === 'الجيزة') return { governorate: 'الجيزة', city: 'حدائق الأهرام' };
  if (gov === 'الإسكندرية') return { governorate: 'الإسكندرية', city: 'سموحة / وسط الإسكندرية' };
  if (gov === 'الدقهلية (المنصورة)') return { governorate: 'الدقهلية (المنصورة)', city: 'المنصورة' };
  if (gov === 'الغربية (طنطا)') return { governorate: 'الغربية (طنطا)', city: 'طنطا' };

  return { governorate: gov, city: gov };
}

/**
 * Clean up raw geocoded text into recognizable Egyptian major city/district scope
 */
export function sanitizeDistrictScope(rawText: string | undefined | null, governorate?: string): string {
  if (!rawText || typeof rawText !== 'string') return '';
  const text = rawText.trim();

  // Known replacements
  if (text.includes('Hadayek') || text.includes('الأهرام') || text.includes('اهرام') || text.includes('Pyramids Gardens')) {
    return 'حدائق الأهرام';
  }
  if (text.includes('Haram') || text.includes('الهرم')) return 'الهرم';
  if (text.includes('Faisal') || text.includes('فيصل')) return 'فيصل';
  if (text.includes('October') || text.includes('أكتوبر') || text.includes('اكتوبر')) return 'مدينة 6 أكتوبر';
  if (text.includes('Zayed') || text.includes('زايد')) return 'الشيخ زايد';
  if (text.includes('Dokki') || text.includes('الدقي')) return 'الدقي';
  if (text.includes('Mohandessin') || text.includes('المهندسين')) return 'المهندسين';
  if (text.includes('Maadi') || text.includes('المعادي')) return 'المعادي';
  if (text.includes('Nasr') || text.includes('مدينة نصر')) return 'مدينة نصر';
  if (text.includes('Heliopolis') || text.includes('مصر الجديدة')) return 'مصر الجديدة';
  if (text.includes('Ain Shams') || text.includes('عين شمس')) return 'عين شمس';
  if (text.includes('Tagamoa') || text.includes('التجمع') || text.includes('New Cairo') || text.includes('القاهرة الجديدة')) {
    return 'التجمع الخامس / القاهرة الجديدة';
  }
  if (text.includes('Mokattam') || text.includes('المقطم')) return 'المقطم';
  if (text.includes('Shubra') || text.includes('شبرا')) return 'شبرا';
  if (text.includes('Helwan') || text.includes('حلوان')) return 'حلوان';

  // If text already looks clean and not a street
  if (text.length > 2 && text.length < 35 && !text.includes('شارع') && !text.includes('St') && !text.includes('Street') && !text.includes('حارة')) {
    return text;
  }

  return '';
}

/**
 * Approximate governorate boundary matcher by GPS coordinates (zero fake street names)
 */
function matchGovByCoords(lat: number, lng: number): string {
  if (lat >= 29.8 && lat <= 30.4 && lng >= 31.1 && lng <= 31.6) {
    return lat > 30.03 && lng > 31.22 ? 'القاهرة' : 'الجيزة';
  } else if (lat >= 31.0 && lat <= 31.4 && lng >= 29.7 && lng <= 30.2) {
    return 'الإسكندرية';
  } else if (lat >= 30.9 && lat <= 31.4 && lng >= 31.2 && lng <= 31.7) {
    return 'الدقهلية (المنصورة)';
  } else if (lat >= 30.6 && lat <= 31.0 && lng >= 30.8 && lng <= 31.2) {
    return 'الغربية (طنطا)';
  } else if (lat >= 30.3 && lat <= 30.9 && lng >= 31.3 && lng <= 31.9) {
    return 'الشرقية (الزقازيق)';
  } else if (lat >= 30.2 && lat <= 30.7 && lng >= 31.0 && lng <= 31.4) {
    return 'القليوبية (بنها)';
  } else if (lat >= 30.3 && lat <= 30.8 && lng >= 30.7 && lng <= 31.2) {
    return 'المنوفية (شبين الكوم)';
  } else if (lat >= 30.8 && lat <= 31.4 && lng >= 30.1 && lng <= 30.8) {
    return 'البحيرة (دمنهور)';
  } else if (lat >= 31.1 && lat <= 31.5 && lng >= 32.1 && lng <= 32.5) {
    return 'بورسعيد';
  } else if (lat >= 30.3 && lat <= 30.9 && lng >= 32.1 && lng <= 32.6) {
    return 'الإسماعيلية';
  } else if (lat >= 29.7 && lat <= 30.2 && lng >= 32.3 && lng <= 32.8) {
    return 'السويس';
  } else if (lat >= 27.8 && lat <= 28.4 && lng >= 30.5 && lng <= 31.1) {
    return 'المنيا';
  } else if (lat >= 26.9 && lat <= 27.5 && lng >= 30.9 && lng <= 31.5) {
    return 'أسيوط';
  } else if (lat >= 26.3 && lat <= 26.8 && lng >= 31.4 && lng <= 32.0) {
    return 'سوهاج';
  } else if (lat >= 25.4 && lat <= 26.0 && lng >= 32.4 && lng <= 33.0) {
    return 'الأقصر';
  } else if (lat >= 23.8 && lat <= 24.4 && lng >= 32.6 && lng <= 33.2) {
    return 'أسوان';
  }
  return 'القاهرة';
}
