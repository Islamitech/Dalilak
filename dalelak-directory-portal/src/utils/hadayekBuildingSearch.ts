import { Business } from '../types';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../data/hadayekDistrictsGeoData';
import {
  searchBuildingCoordinatesExact,
  estimateBuildingCoordinates,
  getHadayekZone,
  getRecommendedGateForZone,
  calculateDirectDistanceMeters,
  formatHadayekDistance,
} from '../data/hadayekAtlasData';
import { isBusinessInHadayekZone } from './hadayekZoneHelper';

export interface BuildingSearchResult {
  type: 'building';
  buildingNumber: string;
  zoneLetter: string;
  zoneName: string;
  lat: number;
  lng: number;
  nearestGateName: string;
  distanceFromZoneCenter?: string;
  associatedBusinessesCount?: number;
}

export interface BusinessZoneSearchResult {
  type: 'business';
  business: Business;
}

export type ZoneScopedSearchResult = BuildingSearchResult | BusinessZoneSearchResult;

let cachedKeys: string[] | null = null;
async function getBuildingKeys(): Promise<string[]> {
  if (cachedKeys) return cachedKeys;
  try {
    const mod = await import('../data/hadayekBuildingsCoords.json');
    const db = (mod as any).default || mod;
    cachedKeys = Object.keys(db);
    return cachedKeys;
  } catch {
    return [];
  }
}

/**
 * Perform high-performance scoped search within a specific Hadayek Al-Ahram zone
 */
export function normalizeBuildingQuery(query: string): string {
  return query.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x6f0)).trim().toLowerCase();
}

export async function searchInsideHadayekZone(
  zoneLetter: string,
  query: string,
  allBusinesses: Business[],
  maxResults: number = 8
): Promise<ZoneScopedSearchResult[]> {
  if (!zoneLetter || !query || query.trim().length === 0) return [];

  const cleanQuery = normalizeBuildingQuery(query);
  const results: ZoneScopedSearchResult[] = [];
  const zone = getHadayekZone(zoneLetter);
  const zoneName = zone ? zone.nameAr : `منطقة ${zoneLetter}`;
  const gateInfo = getRecommendedGateForZone(zoneLetter);
  const nearestGateName = gateInfo.primaryGate.popularNameAr;

  // 1. Check for building numbers (digits matching in query)
  const digitMatch = cleanQuery.match(/\d+/);
  if (digitMatch) {
    const digitQuery = digitMatch[0];
    const allKeys = await getBuildingKeys();

    // Priority 1: Exact digit match
    const candidateNumbers: string[] = [];
    if (allKeys.includes(digitQuery)) {
      candidateNumbers.push(digitQuery);
    }

    // Priority 2: Starts with or contains digit
    for (const k of allKeys) {
      if (candidateNumbers.length >= 6) break;
      if (k !== digitQuery && (k.startsWith(digitQuery) || k === digitQuery)) {
        if (!candidateNumbers.includes(k)) {
          candidateNumbers.push(k);
        }
      }
    }

    // Fallback if no exact key in DB, still add the user's requested number as candidate
    if (!candidateNumbers.includes(digitQuery)) {
      candidateNumbers.unshift(digitQuery);
    }

    for (const bldgNum of candidateNumbers.slice(0, 5)) {
      let coords = await searchBuildingCoordinatesExact(zoneLetter, bldgNum);
      if (!coords) {
        coords = estimateBuildingCoordinates(zoneLetter, bldgNum);
      }

      // Count registered businesses at this building
      const associatedBiz = allBusinesses.filter(
        (b) =>
          isBusinessInHadayekZone(b, zoneLetter) &&
          (b.street?.includes(bldgNum) || b.landmark?.includes(bldgNum) || b.nameAr?.includes(bldgNum))
      );

      results.push({
        type: 'building',
        buildingNumber: bldgNum,
        zoneLetter,
        zoneName,
        lat: coords.lat,
        lng: coords.lng,
        nearestGateName,
        associatedBusinessesCount: associatedBiz.length,
      });
    }
  }

  // 2. Search businesses inside this zone
  const matchingBiz = allBusinesses
    .filter((b) => isBusinessInHadayekZone(b, zoneLetter))
    .filter((b) => {
      const name = (b.nameAr || '').toLowerCase();
      const cat = (b.category || '').toLowerCase();
      const street = (b.street || '').toLowerCase();
      return name.includes(cleanQuery) || cat.includes(cleanQuery) || street.includes(cleanQuery);
    })
    .slice(0, maxResults - results.length);

  for (const b of matchingBiz) {
    results.push({
      type: 'business',
      business: b,
    });
  }

  return results;
}
