import { Business } from '../types';
import { findDistrictForCoordinates, HADAYEK_OFFICIAL_DISTRICTS } from '../data/hadayekDistrictsGeoData';
import { HADAYEK_GATES } from '../data/hadayekAtlasData';
import { CATEGORY_GROUPS } from '../data/mockData';
import { matchesCategoryFilter } from './categoryMatcher';
import { normalizeArabicText } from './arabicSearch';

const ZONE_CACHE_LIMIT = 5000;
const businessZoneCache = new Map<string, string | null>();

function hasUsableCoordinates(biz: Business): boolean {
  return (
    typeof biz.lat === 'number' &&
    typeof biz.lng === 'number' &&
    Number.isFinite(biz.lat) &&
    Number.isFinite(biz.lng) &&
    biz.lat !== 0 &&
    biz.lng !== 0 &&
    Math.abs(biz.lat) <= 90 &&
    Math.abs(biz.lng) <= 180
  );
}

function getZoneCacheKey(biz: Business): string {
  return [
    biz.id || '',
    biz.lat,
    biz.lng,
    (biz as any).zone || (biz as any).hadayekZone || '',
    biz.city || '',
    biz.street || '',
    biz.landmark || '',
  ].join('|');
}

function rememberBusinessZone(key: string, zone: string | null): string | null {
  if (businessZoneCache.size >= ZONE_CACHE_LIMIT) {
    const oldestKey = businessZoneCache.keys().next().value;
    if (oldestKey !== undefined) businessZoneCache.delete(oldestKey);
  }
  businessZoneCache.set(key, zone);
  return zone;
}

/**
 * Standardize zone string to extract letter or clean label.
 * e.g., 'منطقة أ' -> 'أ', 'منطقة ل' -> 'ل', 'أ' -> 'أ'
 */
export function extractZoneLetter(zoneInput: string): string {
  if (!zoneInput) return '';
  return zoneInput.replace(/^منطقة\s+/, '').trim();
}

/**
 * Normalize an Arabic letter specifically for zone comparison (أ/إ/آ -> ا, هـ/ة -> ه)
 */
export function normalizeZoneLetter(letter: string): string {
  if (!letter) return '';
  return letter
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/هـ/g, 'ه')
    .trim();
}

/**
 * Tests whether target pattern exists as a distinct token/phrase within normalized text,
 * avoiding ASCII \b bugs and lookbehind compatibility issues.
 * Uses non-capturing groups (?:^|[^ء-يa-zA-Z0-9]) and (?:[^ء-يa-zA-Z0-9]|$)
 */
export function matchArabicWordPattern(text: string, pattern: string): boolean {
  if (!text || !pattern) return false;
  const regex = new RegExp(`(?:^|[^ء-يa-zA-Z0-9])${pattern}(?:[^ء-يa-zA-Z0-9]|$)`, 'i');
  return regex.test(text);
}

/**
 * Determine the official Hadayek zone letter ('أ' - 'ع') for a business.
 * Uses strict hierarchy:
 * 1. Spatial GIS Polygon point-in-polygon check (GPS coordinates) FIRST.
 *    If text declares a different zone than GPS, GPS takes absolute precedence and conflict is logged.
 * 2. Structured field if available (e.g. biz.zone).
 * 3. Text search across street, landmark, city, description, name as last resort fallback.
 */
export function getBusinessHadayekZoneLetter(biz: Business): string | null {
  if (!biz) return null;

  const cacheKey = getZoneCacheKey(biz);
  if (businessZoneCache.has(cacheKey)) {
    return businessZoneCache.get(cacheKey) ?? null;
  }

  const textCorpus = `${biz.street || ''} ${biz.landmark || ''} ${biz.city || ''} ${biz.description || ''} ${biz.nameAr || ''}`;
  const normCorpus = normalizeArabicText(textCorpus);

  // 1. 🌐 Spatial GIS Polygon point-in-polygon coordinates check FIRST
  if (hasUsableCoordinates(biz)) {
    const district = findDistrictForCoordinates(biz.lat, biz.lng);
    if (district && district.letterAr) {
      // Check for textual conflict to log warning
      for (const d of HADAYEK_OFFICIAL_DISTRICTS) {
        const normLetter = normalizeZoneLetter(d.letterAr);
        const isTextMatch =
          matchArabicWordPattern(normCorpus, `منطقه\\s*${normLetter}`) ||
          matchArabicWordPattern(normCorpus, `قطاع\\s*${normLetter}`) ||
          matchArabicWordPattern(normCorpus, `عماره\\s*\\d+\\s*${normLetter}`) ||
          matchArabicWordPattern(normCorpus, `\\d+\\s*${normLetter}`);

        if (isTextMatch && normalizeZoneLetter(d.letterAr) !== normalizeZoneLetter(district.letterAr)) {
          console.warn(
            `[Zone Conflict] Business "${biz.nameAr || biz.id}" text mentions zone "${d.letterAr}", but exact GPS coordinates (${biz.lat}, ${biz.lng}) place it in official district "${district.letterAr}". Enforcing GPS.`
          );
          break;
        }
      }

      return rememberBusinessZone(cacheKey, district.letterAr);
    }

    // Valid GPS is authoritative. Never leak a pin into a textual district
    // when its coordinate is outside every official polygon.
    return rememberBusinessZone(cacheKey, null);
  }

  // 2. Structured field check
  const structuredZone = (biz as any).zone || (biz as any).hadayekZone;
  if (structuredZone && typeof structuredZone === 'string') {
    const letter = extractZoneLetter(structuredZone);
    if (letter) return rememberBusinessZone(cacheKey, letter);
  }

  // 3. Comprehensive text search fallback (only for missing or unresolved coordinates)
  for (const district of HADAYEK_OFFICIAL_DISTRICTS) {
    const normLetter = normalizeZoneLetter(district.letterAr);
    // Patterns: "منطقة أ", "قطاع أ", "عمارة 123 أ", "123 أ", "123أ"
    const isMatched =
      matchArabicWordPattern(normCorpus, `منطقه\\s*${normLetter}`) ||
      matchArabicWordPattern(normCorpus, `قطاع\\s*${normLetter}`) ||
      matchArabicWordPattern(normCorpus, `عماره\\s*\\d+\\s*${normLetter}`) ||
      matchArabicWordPattern(normCorpus, `\\d+\\s*${normLetter}`);

    if (isMatched) {
      return rememberBusinessZone(cacheKey, district.letterAr);
    }
  }

  return rememberBusinessZone(cacheKey, null);
}

/**
 * Checks whether a business is located within the requested Hadayek Al-Ahram zone filter.
 * Supports:
 * - 'all' -> all businesses in Hadayek (excludes non-Hadayek locations)
 * - District letters: 'أ', 'ب', 'ل', 'هـ', etc.
 * - District names: 'منطقة أ', 'منطقة ل', etc.
 * - Gate names: 'البوابة الأولى (خفرع)', 'البوابة الثانية (خوفو)', etc.
 * - Arterial streets: 'شارع الجيش', 'شارع الثروة المعدنية', 'شارع الضغط العالي', etc.
 */
export function isBusinessInHadayekZone(biz: Business, zoneFilter: string): boolean {
  if (!biz) return false;

  const textCorpus = `${biz.street || ''} ${biz.landmark || ''} ${biz.city || ''} ${biz.description || ''} ${biz.nameAr || ''}`;
  const normCorpus = normalizeArabicText(textCorpus);

  // If 'all' is requested, verify the business actually belongs to Hadayek Al-Ahram
  if (!zoneFilter || zoneFilter === 'all') {
    // Exact coordinates must fall inside an official district polygon.
    if (hasUsableCoordinates(biz)) {
      return getBusinessHadayekZoneLetter(biz) !== null;
    }

    // Textual verification fallback
    return (
      normCorpus.includes('حدايق الاهرام') ||
      normCorpus.includes('حدائق الاهرام') ||
      normCorpus.includes('هضبه الاهرام') ||
      normCorpus.includes('هضبة الاهرام') ||
      normCorpus.includes('الاهرام') ||
      normCorpus.includes('منطقه ') ||
      normCorpus.includes('بوابه ')
    );
  }

  const normFilter = normalizeArabicText(zoneFilter);

  // 1. Gate Matching
  const gateMatch = HADAYEK_GATES.find(
    (g) =>
      normFilter.includes(normalizeArabicText(g.nameAr)) ||
      normFilter.includes(normalizeArabicText(g.popularNameAr)) ||
      normFilter.includes(normalizeArabicText(g.shortNameAr))
  );

  if (gateMatch) {
    if (hasUsableCoordinates(biz)) {
      const bizZoneLetter = getBusinessHadayekZoneLetter(biz);
      return Boolean(
        bizZoneLetter &&
        gateMatch.servedZones.some((z) => normalizeZoneLetter(z) === normalizeZoneLetter(bizZoneLetter))
      );
    }

    if (
      normCorpus.includes(normalizeArabicText(gateMatch.popularNameAr)) ||
      normCorpus.includes(normalizeArabicText(gateMatch.shortNameAr)) ||
      normCorpus.includes(normalizeArabicText(gateMatch.nameAr))
    ) {
      return true;
    }
    const bizZoneLetter = getBusinessHadayekZoneLetter(biz);
    if (
      bizZoneLetter &&
      gateMatch.servedZones.some((z) => normalizeZoneLetter(z) === normalizeZoneLetter(bizZoneLetter))
    ) {
      return true;
    }
    return false;
  }

  // 2. Arterial Street Matching
  if (zoneFilter.startsWith('شارع ') || normFilter.startsWith('شارع ')) {
    return normCorpus.includes(normFilter) || normCorpus.includes(normFilter.replace('شارع ', ''));
  }

  // 3. Alphabetical Zone Matching ('منطقة أ' or 'أ')
  const cleanLetter = extractZoneLetter(zoneFilter);
  const targetNormLetter = normalizeZoneLetter(cleanLetter);

  const bizZoneLetter = getBusinessHadayekZoneLetter(biz);
  if (bizZoneLetter) {
    return normalizeZoneLetter(bizZoneLetter) === targetNormLetter;
  }

  // If business has valid coordinates but is not inside this district polygon, do NOT fall back to text
  if (hasUsableCoordinates(biz)) {
    return false;
  }

  // Direct pattern matching fallback (only for businesses without valid GPS coordinates)
  return (
    matchArabicWordPattern(normCorpus, `منطقه\\s*${targetNormLetter}`) ||
    matchArabicWordPattern(normCorpus, `قطاع\\s*${targetNormLetter}`) ||
    matchArabicWordPattern(normCorpus, `عماره\\s*\\d+\\s*${targetNormLetter}`) ||
    matchArabicWordPattern(normCorpus, `\\d+\\s*${targetNormLetter}`)
  );
}

/**
 * Filter an array of businesses down to those in a specific Hadayek zone.
 */
export function getBusinessesInZone(businesses: Business[], zoneFilter: string): Business[] {
  if (!businesses || businesses.length === 0) return [];
  return businesses.filter((b) => isBusinessInHadayekZone(b, zoneFilter));
}

/**
 * Authoritative, unified business filtering function for Map, Counters, and Empty States.
 * Guarantees zero discrepancy between map markers, header counts, and empty notices.
 */
export function filterBusinessesForMap(
  businesses: Business[],
  zoneFilter?: string,
  categoryFilter?: string,
  onlyVerified: boolean = false
): Business[] {
  if (!businesses || businesses.length === 0) return [];

  return businesses.filter((b) => {
    // 1. Valid coordinates required for map
    if (typeof b.lat !== 'number' || typeof b.lng !== 'number' || isNaN(b.lat) || isNaN(b.lng)) {
      return false;
    }

    // 2. Verification filter
    if (onlyVerified && b.verificationStatus !== 'verified') {
      return false;
    }

    // 3. Category filter
    if (categoryFilter && categoryFilter !== 'all' && categoryFilter.trim() !== '') {
      if (!matchesCategoryFilter(b, categoryFilter)) return false;
    }

    // 4. Zone filter
    if (zoneFilter && zoneFilter !== 'all' && zoneFilter.trim() !== '') {
      return isBusinessInHadayekZone(b, zoneFilter);
    }

    return isBusinessInHadayekZone(b, 'all');
  });
}

export interface AvailableCategoryItem {
  name: string;
  count: number;
}

export interface AvailableCategoryGroup {
  group: string;
  icon?: string;
  items: AvailableCategoryItem[];
  totalCount: number;
}

/**
 * Calculates dynamically which category groups and specific categories
 * exist among businesses in the given zone.
 * Only returns groups and items with count > 0.
 */
export function getAvailableCategoryGroupsInZone(
  businesses: Business[],
  zoneFilter: string
): AvailableCategoryGroup[] {
  const zoneBusinesses = getBusinessesInZone(businesses, zoneFilter);
  if (zoneBusinesses.length === 0) return [];

  const result: AvailableCategoryGroup[] = [];

  for (const catGroup of CATEGORY_GROUPS) {
    const matchingItems: AvailableCategoryItem[] = [];
    let groupTotalCount = 0;

    // Check count for each specific sub-item
    for (const item of catGroup.items) {
      const count = zoneBusinesses.filter((b) => matchesCategoryFilter(b, item)).length;
      if (count > 0) {
        matchingItems.push({ name: item, count });
      }
    }

    // Check overall group count
    groupTotalCount = zoneBusinesses.filter((b) => matchesCategoryFilter(b, catGroup.group)).length;

    // If at least one item or the group has businesses, include it
    if (groupTotalCount > 0 || matchingItems.length > 0) {
      result.push({
        group: catGroup.group,
        icon: catGroup.icon,
        items: matchingItems,
        totalCount: Math.max(groupTotalCount, matchingItems.reduce((acc, it) => acc + it.count, 0)),
      });
    }
  }

  return result;
}

/**
 * Dynamically filter map quick categories for a given zone.
 */
export function getAvailableQuickCategoriesInZone(
  businesses: Business[],
  zoneFilter: string,
  quickCategories: Array<{ id: string; name: string; icon: string }>
): Array<{ id: string; name: string; icon: string; count: number }> {
  const zoneBusinesses = getBusinessesInZone(businesses, zoneFilter);

  return quickCategories
    .map((cat) => {
      const count = cat.id === 'all'
        ? zoneBusinesses.length
        : zoneBusinesses.filter((b) => matchesCategoryFilter(b, cat.id)).length;
      return { ...cat, count };
    })
    .filter((cat) => cat.count > 0);
}
