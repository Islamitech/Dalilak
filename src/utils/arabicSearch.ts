import { Business } from '../types';

/**
 * 🔤 Comprehensive Arabic Text Normalizer
 * Normalizes common Arabic letter variants, diacritics, and spaces
 * so that searches like 'الراقية' match 'الراقيه', 'الاهرام' matches 'الأهرام', etc.
 */
export function normalizeArabicText(text?: string | null): string {
  if (!text) return '';
  return text
    .toString()
    .trim()
    .toLowerCase()
    // 1. Remove Arabic Tashkeel / Harakat
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // 2. Normalize Alef variants (أ, إ, آ, ٱ -> ا)
    .replace(/[أإآٱ]/g, 'ا')
    // 3. Normalize Teh Marbuta and Heh (ة -> ه)
    .replace(/ة/g, 'ه')
    // 4. Normalize Alef Maksura and Yeh (ى -> ي)
    .replace(/ى/g, 'ي')
    // 5. Remove Tatweel / Kashida (ـ)
    .replace(/ـ/g, '')
    // 6. Clean extra spaces
    .replace(/\s+/g, ' ');
}

/**
 * Checks if a target string contains a search query using Arabic normalization
 */
export function matchesArabicSearch(target?: string | null, query?: string | null): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  const normTarget = normalizeArabicText(target);
  const normQuery = normalizeArabicText(query);

  if (!normQuery) return true;
  return normTarget.includes(normQuery);
}

/**
 * 🔍 Universal Business Search Matcher
 * Thoroughly searches across all relevant business fields with full Arabic normalization.
 * Matches: Name (Ar/En), Category, City, Governorate, Street, Landmark, Owner, Phone, Rep, and Invoice #
 */
export function matchesBusinessSearch(biz: Business, rawQuery: string): boolean {
  if (!rawQuery || !rawQuery.trim()) return true;
  const q = rawQuery.trim();
  const normQ = normalizeArabicText(q);
  const cleanQ = q.toLowerCase();

  // 1. Exact or normalized Invoice Number match (e.g. "634" matches "INV-2026-634")
  const inv = (biz.invoiceNumber || '').toLowerCase();
  if (inv.includes(cleanQ) || (biz.id && biz.id.toLowerCase().includes(cleanQ))) {
    return true;
  }

  // 2. Phone numbers (clean digits comparison)
  const digitsOnlyQ = q.replace(/\D/g, '');
  if (digitsOnlyQ.length >= 3) {
    const ownerPhone = (biz.ownerPhone || '').replace(/\D/g, '');
    const phone = (biz.phone || '').replace(/\D/g, '');
    const secPhone = (biz.secondaryPhone || '').replace(/\D/g, '');
    if (ownerPhone.includes(digitsOnlyQ) || phone.includes(digitsOnlyQ) || secPhone.includes(digitsOnlyQ)) {
      return true;
    }
  }

  // 3. Name (Arabic & English)
  if (matchesArabicSearch(biz.nameAr, normQ) || (biz.nameEn && biz.nameEn.toLowerCase().includes(cleanQ))) {
    return true;
  }

  // Special alias for 'الراقيه' / 'رقيه' / 'الراقية'
  const normName = normalizeArabicText(biz.nameAr);
  if (normName.includes('راقيه') && (normQ.includes('رقيه') || normQ.includes('راقيه'))) {
    return true;
  }

  // 4. Category / Activities (e.g. searching "ذهب" or "فضة" or "مجوهرات")
  if (matchesArabicSearch(biz.category, normQ)) {
    return true;
  }

  // 5. Governorate, City, Street, Landmark
  if (
    matchesArabicSearch(biz.city, normQ) ||
    matchesArabicSearch(biz.governorate, normQ) ||
    matchesArabicSearch(biz.street, normQ) ||
    matchesArabicSearch(biz.landmark, normQ)
  ) {
    return true;
  }

  // 6. Owner & Representative Names
  if (
    matchesArabicSearch(biz.ownerName, normQ) ||
    matchesArabicSearch(biz.repName, normQ)
  ) {
    return true;
  }

  return false;
}
