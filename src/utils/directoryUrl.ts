/**
 * Official Public Directory URL Utility for Dalelak
 * Handles clean, semantic URLs featuring the venue's Arabic/commercial name.
 * 
 * Target official production domain: https://www.dalilaak.com
 */

export const PUBLIC_DIRECTORY_DOMAIN = 'https://www.dalilaak.com';

/**
 * Normalizes and converts an Arabic or English venue name into a clean, URL-safe slug.
 * Removes symbols, punctuation, quotes, and converts spaces to clean hyphens.
 * 
 * Example: "«مطعم أبو خالد للمأكولات»" -> "مطعم-أبو-خالد-للمأكولات"
 */
export function slugifyBusinessName(name?: string): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .trim()
    .replace(/[«»"'""''\(\)\[\]{}#@!$%^&*+=\\\/|:;<>?,.~`]/g, '') // Remove punctuation & special chars
    .replace(/\s+/g, '-') // Replace spaces with a single hyphen
    .replace(/-+/g, '-') // Collapse multiple hyphens into one
    .replace(/^-|-$/g, ''); // Trim hyphens from start and end
}

/**
 * Extracts the core database business ID (e.g., "biz_1788118588424")
 * from a semantic slug, URL path, or query parameter.
 * 
 * Examples:
 *   "مطعم-أبو-خالد-biz_1788118588424" -> "biz_1788118588424"
 *   "biz_1788118588424" -> "biz_1788118588424"
 */
export function extractBusinessIdFromSlug(slugOrParam?: string): string {
  if (!slugOrParam) return '';
  const match = slugOrParam.match(/(biz_[a-zA-Z0-9_-]+)/i);
  return match ? match[1] : slugOrParam.trim();
}

export interface DirectoryUrlOptions {
  /** Force standard query string (?biz=...) instead of path (/biz/...) */
  format?: 'path' | 'query';
  /** Add preview query flag */
  preview?: boolean;
  /** Referral code to append */
  refCode?: string;
}

/**
 * Generates the official, beautiful public directory link for any venue.
 * Combines the Arabic venue name with its unique entity ID for 100% collision-free
 * routing, maximum SEO power, and pristine appearance across WhatsApp and social media.
 * 
 * Output Example:
 *   "https://www.dalilaak.com/biz/مطعم-أبو-خالد-biz_1788118588424"
 */
export function getPublicDirectoryUrl(
  business: { id: string; nameAr?: string; nameEn?: string; category?: string; customDirectoryUrl?: string },
  options?: DirectoryUrlOptions
): string {
  const domain = PUBLIC_DIRECTORY_DOMAIN;
  if (!business || !business.id) return domain;

  // 1. Manual user override: if customDirectoryUrl is set, prioritize it directly!
  if (business.customDirectoryUrl && business.customDirectoryUrl.trim()) {
    const custom = business.customDirectoryUrl.trim();
    if (custom.startsWith('http://') || custom.startsWith('https://')) {
      return custom;
    }
    if (custom.startsWith('/')) {
      return `${domain}${custom}`;
    }
    return `${domain}/biz/${encodeURIComponent(custom)}`;
  }

  const rawName = business.nameAr || business.nameEn || '';
  const slug = slugifyBusinessName(rawName);
  const identifier = slug ? `${slug}-${business.id}` : business.id;

  if (options?.format === 'query') {
    const params = new URLSearchParams();
    params.set('biz', business.id);
    if (slug) params.set('name', slug);
    if (options.preview) params.set('preview', 'true');
    if (options.refCode) params.set('ref', options.refCode);
    return `${domain}/?${params.toString()}`;
  }

  // Modern clean path: https://www.dalilaak.com/biz/مطعم-أبو-خالد-biz_1788118588424
  let pathUrl = `${domain}/biz/${encodeURIComponent(identifier)}`;
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
 * Generates the automatic default directory link (ignoring any manual customDirectoryUrl override).
 */
export function getAutomaticDirectoryUrl(
  business: { id: string; nameAr?: string; nameEn?: string; category?: string },
  options?: DirectoryUrlOptions
): string {
  const domain = PUBLIC_DIRECTORY_DOMAIN;
  if (!business || !business.id) return domain;

  const rawName = business.nameAr || business.nameEn || '';
  const slug = slugifyBusinessName(rawName);
  const identifier = slug ? `${slug}-${business.id}` : business.id;
  return `${domain}/biz/${encodeURIComponent(identifier)}`;
}

/**
 * Returns a human-readable, unencoded display version of the URL for UI display and copying.
 * Shows the actual Arabic text without %D9%85... percent-encoding.
 */
export function getDisplayDirectoryUrl(
  business: { id: string; nameAr?: string; nameEn?: string; category?: string; customDirectoryUrl?: string },
  options?: DirectoryUrlOptions
): string {
  const encoded = getPublicDirectoryUrl(business, options);
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}
