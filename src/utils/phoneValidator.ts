import { Business, InterestedLead } from '../types';

/**
 * 📱 Standard Egyptian and International Phone Number Normalizer
 * Strips all non-digit characters, country codes (+20, 0020, 20),
 * and standardizes mobile numbers to 11 digits (01xxxxxxxxx).
 */
export function normalizePhoneNumber(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  let digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  // Strip international prefix (+20 or 0020 or 20) if followed by 10 digits
  if (digits.startsWith('0020') && digits.length >= 12) {
    digits = digits.slice(4);
  } else if (digits.startsWith('20') && digits.length >= 12) {
    digits = digits.slice(2);
  }

  // If 10 digits starting with 10, 11, 12, 15 (Egyptian mobile missing leading 0)
  if (digits.length === 10 && /^(?:10|11|12|15)/.test(digits)) {
    digits = '0' + digits;
  }

  // If 8 digits starting with 2, 3, etc. (Cairo landline missing leading 0)
  if (digits.length === 8 && /^[23]/.test(digits)) {
    digits = '0' + digits;
  }

  return digits;
}

/**
 * Compares two phone strings for semantic equality
 */
export function isSamePhoneNumber(a?: string | null, b?: string | null): boolean {
  const normA = normalizePhoneNumber(a);
  const normB = normalizePhoneNumber(b);
  if (!normA || !normB) return false;
  // Disregard short/invalid test numbers (< 7 digits)
  if (normA.length < 7 || normB.length < 7) return false;
  return normA === normB;
}

export interface DuplicatePhoneMatch {
  type: 'business' | 'lead';
  name: string;
  phone: string;
  location?: string;
  id: string;
}

/**
 * 🔍 Duplicate Phone Detector
 * Checks if a candidate phone number is already registered to an existing business or lead.
 */
export function findDuplicatePhoneEntity(
  candidatePhone?: string | null,
  options?: {
    businesses?: Business[];
    leads?: InterestedLead[];
    excludeId?: string;
    excludeLeadId?: string;
  }
): DuplicatePhoneMatch | null {
  const target = normalizePhoneNumber(candidatePhone);
  if (!target || target.length < 7) return null;

  const { businesses = [], leads = [], excludeId, excludeLeadId } = options || {};

  // 1. Check against active businesses
  for (const b of businesses) {
    if (b.isDeleted) continue;
    if (excludeId && b.id === excludeId) continue;

    const phones = [b.phone, b.ownerPhone, b.secondaryPhone].filter(Boolean);
    for (const p of phones) {
      if (isSamePhoneNumber(target, p)) {
        return {
          type: 'business',
          name: b.nameAr || b.nameEn || 'منشأة تجارية',
          phone: p || target,
          location: [b.governorate, b.city].filter(Boolean).join(' - '),
          id: b.id,
        };
      }
    }
  }

  // 2. Check against active leads (excluding converted)
  for (const l of leads) {
    if (excludeId && l.id === excludeId) continue;
    if (excludeLeadId && l.id === excludeLeadId) continue;
    if (l.status === 'converted') continue;

    const phones = [l.phone, l.secondaryPhone].filter(Boolean);
    for (const p of phones) {
      if (isSamePhoneNumber(target, p)) {
        return {
          type: 'lead',
          name: l.businessName || l.clientName || 'عميل مهتم',
          phone: p || target,
          location: [l.governorate, l.city].filter(Boolean).join(' - '),
          id: l.id,
        };
      }
    }
  }

  return null;
}
