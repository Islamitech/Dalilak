/**
 * Official Public Directory URL Utility for Dalelak
 * Handles clean, semantic, SEO-friendly URLs featuring venue name, city, and verified entity ID.
 * 
 * Target official production domain: https://www.dalilaak.com
 */

export const PUBLIC_DIRECTORY_DOMAIN = 'https://www.dalilaak.com';

/**
 * Normalizes and converts an Arabic or English venue name or location into a clean, URL-safe slug.
 * Removes symbols, punctuation, quotes, tashkeel, tatweel, and converts spaces to clean single hyphens.
 * Normalizes Arabic letters for maximum search engine compatibility.
 * 
 * Example: "«مطعم أبو خالد للمأكولات»" -> "مطعم-ابو-خالد-للماكولات"
 */
export function slugifyBusinessName(name?: string): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    // 1. Remove BiDi control characters
    .replace(/[\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
    // 2. Remove Arabic diacritics / Tashkeel & Tatweel
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // 3. Normalize Arabic letter variants for SEO consistency
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    // 4. Remove punctuation, symbols, quotes, brackets & special characters (Arabic & English)
    .replace(/[«»"'""''\(\)\[\]{}#@!$%^&*+=\\\/|:;<>?,.~`،؛؟٪_]/g, ' ')
    // 5. Replace whitespace and multiple hyphens with single hyphen
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    // 6. Trim hyphens from beginning and end
    .replace(/^-+|-+$/g, '')
    // 7. Cap word length (up to 7 words) to keep URLs concise and punchy
    .split('-')
    .filter(Boolean)
    .slice(0, 7)
    .join('-');
}

export interface BusinessUrlInput {
  id: string;
  nameAr?: string;
  nameEn?: string;
  category?: string;
  city?: string;
  governorate?: string;
  customDirectoryUrl?: string;
}

/**
 * Builds the canonical clean SEO slug for a business entity.
 * Priority:
 * 1. User-defined custom slug (if present)
 * 2. Semantic Arabic Slug (Name + City + Entity ID)
 * 
 * Example: "مطعم-ابو-خالد-الشيخ-زايد-biz_1788118588424"
 */
export function getBusinessSlug(business: BusinessUrlInput): string {
  if (!business || !business.id) return '';

  // 1. Prioritize manual custom slug override if explicitly set
  if (business.customDirectoryUrl && business.customDirectoryUrl.trim()) {
    const custom = business.customDirectoryUrl.trim();
    const cleanCustom = custom.replace(/^https?:\/\/[^/]+\/biz\//i, '').replace(/^\/biz\//i, '').replace(/^\//, '');
    return slugifyBusinessName(cleanCustom);
  }

  // 2. Build semantic keyword-rich slug
  const rawName = business.nameAr || business.nameEn || '';
  const nameSlug = slugifyBusinessName(rawName) || 'نشاط';
  const citySlug = business.city ? slugifyBusinessName(business.city) : '';

  // Include city for Local SEO if available and not already in name
  const locationPart = citySlug && !nameSlug.includes(citySlug) ? `-${citySlug}` : '';

  return `${nameSlug}${locationPart}-${business.id}`;
}

/**
 * Extracts the core database business ID (e.g., "biz_1788118588424")
 * from a semantic slug, URL path, or query parameter.
 * 
 * Examples:
 *   "مطعم-ابو-خالد-الشيخ-زايد-biz_1788118588424" -> "biz_1788118588424"
 *   "biz_1788118588424" -> "biz_1788118588424"
 */
export function extractBusinessIdFromSlug(slugOrParam?: string): string {
  if (!slugOrParam) return '';
  const decoded = decodeURIComponent(slugOrParam).trim();
  const match = decoded.match(/(biz_[a-zA-Z0-9_-]+)/i);
  return match ? match[1] : decoded;
}

export interface DirectoryUrlOptions {
  /** Force standard query string (?biz=...) instead of path (/biz/...) */
  format?: 'path' | 'query';
  /** Add preview query flag */
  preview?: boolean;
  /** Referral code to append */
  refCode?: string;
  /**
   * Whether to include semantic SEO slug in URL path.
   * Default: true (Clean, semantic, keyword-rich SEO URL).
   */
  includeSlug?: boolean;
  /** Force URL percent-encoding for external protocol handlers */
  encode?: boolean;
}

/**
 * Generates the official public directory link for any venue.
 * By default, outputs the clean semantic SEO URL:
 *   "https://www.dalilaak.com/biz/مطعم-ابو-خالد-الشيخ-زايد-biz_1788118588424"
 * 
 * Guarantees 100% collision-free routing, full Google SEO keyword visibility,
 * and reliable link preview resolution across all platforms.
 */
export function getPublicDirectoryUrl(
  business: BusinessUrlInput,
  options?: DirectoryUrlOptions
): string {
  const domain = PUBLIC_DIRECTORY_DOMAIN;
  if (!business || !business.id) return domain;

  // 1. Manual user override: if customDirectoryUrl is a full external URL
  if (business.customDirectoryUrl && business.customDirectoryUrl.trim()) {
    const custom = business.customDirectoryUrl.trim();
    if (custom.startsWith('http://') || custom.startsWith('https://')) {
      return custom;
    }
    if (custom.startsWith('/')) {
      return `${domain}${custom}`;
    }
  }

  // 2. Resolve clean SEO slug (Default: true)
  const shouldIncludeSlug = options?.includeSlug !== false;
  const identifier = shouldIncludeSlug ? getBusinessSlug(business) : business.id;

  if (options?.format === 'query') {
    const params = new URLSearchParams();
    params.set('biz', business.id);
    if (shouldIncludeSlug) {
      const slugOnly = slugifyBusinessName(business.nameAr || business.nameEn);
      if (slugOnly) params.set('name', slugOnly);
    }
    if (options.preview) params.set('preview', 'true');
    if (options.refCode) params.set('ref', options.refCode);
    return `${domain}/?${params.toString()}`;
  }

  // Clean canonical SEO path: https://www.dalilaak.com/biz/...
  const safeIdentifier = options?.encode ? encodeURIComponent(identifier) : identifier;
  let pathUrl = `${domain}/biz/${safeIdentifier}`;

  const searchParams = new URLSearchParams();
  if (options?.preview) searchParams.set('preview', 'true');
  if (options?.refCode) searchParams.set('ref', options.refCode);
  const queryStr = searchParams.toString();
  if (queryStr) {
    pathUrl += `?${queryStr}`;
  }

  return pathUrl;
}

/**
 * Generates the relative internal path for a business (e.g., "/biz/مطعم-ابو-خالد-biz_123")
 * for in-app navigation, anchor href attributes, and history.pushState.
 */
export function getDirectoryPath(business: BusinessUrlInput): string {
  if (!business || !business.id) return '/search';
  const slug = getBusinessSlug(business);
  return `/biz/${slug}`;
}

/**
 * Generates the automatic default directory link (ignoring any manual customDirectoryUrl override).
 */
export function getAutomaticDirectoryUrl(
  business: BusinessUrlInput,
  options?: DirectoryUrlOptions
): string {
  const domain = PUBLIC_DIRECTORY_DOMAIN;
  if (!business || !business.id) return domain;

  const rawName = business.nameAr || business.nameEn || '';
  const nameSlug = slugifyBusinessName(rawName) || 'نشاط';
  const citySlug = business.city ? slugifyBusinessName(business.city) : '';
  const locationPart = citySlug && !nameSlug.includes(citySlug) ? `-${citySlug}` : '';
  const identifier = options?.includeSlug === false ? business.id : `${nameSlug}${locationPart}-${business.id}`;
  return `${domain}/biz/${identifier}`;
}

/**
 * Returns a clean, human-friendly canonical direct public directory link for display and messaging.
 */
export function getDisplayDirectoryUrl(
  business: BusinessUrlInput,
  options?: DirectoryUrlOptions
): string {
  const url = getPublicDirectoryUrl(business, { ...options, encode: false });
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}
