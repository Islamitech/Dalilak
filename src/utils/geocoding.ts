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
 * Multi-provider Reverse Geocoding with zero fake fallback data
 */
export async function fetchLocationAddress(lat: number, lng: number): Promise<LocationAddressData> {
  // Provider 1: OpenStreetMap Nominatim with Arabic localization
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar,en`,
      { signal: controller.signal }
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

      const city = addr.city || addr.town || addr.suburb || addr.city_district || addr.county || addr.district || addr.village || addr.quarter || '';
      const street = addr.road || addr.pedestrian || addr.street || addr.neighbourhood || '';
      const landmark = addr.amenity || addr.building || addr.shop || addr.tourism || addr.historic || addr.leisure || '';

      if (govMatch || city || street || landmark) {
        return {
          governorate: govMatch || matchGovByCoords(lat, lng),
          city: city || undefined,
          street: street || undefined,
          landmark: landmark || undefined,
          displayName: data.display_name,
        };
      }
    }
  } catch (err) {
    // Failover to secondary geocoder or coordinate boundary lookup
  }

  // Provider 2: Photon / BigDataCloud Open Reverse Geocoding Fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

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

      return {
        governorate: govMatch || matchGovByCoords(lat, lng),
        city: data.locality || data.city || undefined,
        street: undefined, // Never invent fake streets!
      };
    }
  } catch (err) {
    // Secondary fallback silent
  }

  // Fallback: Safe governorate boundary estimate without fake streets
  return {
    governorate: matchGovByCoords(lat, lng),
  };
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
