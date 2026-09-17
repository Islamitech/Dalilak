import { Business } from '../../types';

export type DirectorySortOption = 'random' | 'newest' | 'oldest' | 'alpha';

export interface VerificationBadge {
  text: string;
  className: string;
  badgeClass: string;
}

export const getVerificationBadge = (status?: string): VerificationBadge => {
  if (status === 'verified') {
    return {
      text: 'معتمد 🟢',
      className: 'bg-emerald-500/90 text-white border-emerald-400/40',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    };
  }
  if (status === 'rejected') {
    return {
      text: 'مرفوض ❌',
      className: 'bg-rose-500/90 text-white border-rose-400/40',
      badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
    };
  }
  if (status === 'needs_action') {
    return {
      text: 'يتطلب إجراء ⚠️',
      className: 'bg-orange-500/90 text-white border-orange-400/40',
      badgeClass: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    };
  }
  return {
    text: 'قيد المراجعة ⏳',
    className: 'bg-amber-500/90 text-slate-950 border-amber-400/40',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  };
};

export const getBusinessMapDetails = (biz: Business) => {
  const officialUrl =
    biz.googleMapsUrl &&
    typeof biz.googleMapsUrl === 'string' &&
    biz.googleMapsUrl.trim().startsWith('http') &&
    !biz.googleMapsUrl.includes('search/?api=1&query=') &&
    !biz.googleMapsUrl.includes('maps?q=') &&
    !biz.googleMapsUrl.includes('google.com/maps?q=')
      ? biz.googleMapsUrl.trim()
      : null;

  const repUrl =
    biz.repLocationUrl &&
    typeof biz.repLocationUrl === 'string' &&
    biz.repLocationUrl.trim().startsWith('http')
      ? biz.repLocationUrl.trim()
      : biz.lat && biz.lng
      ? `https://www.google.com/maps?q=${biz.lat},${biz.lng}`
      : null;

  const effectiveUrl = officialUrl || repUrl;
  const isOfficial = Boolean(officialUrl);

  return {
    effectiveUrl,
    isOfficial,
    hasLocation: Boolean(effectiveUrl),
  };
};

/**
 * Fast, deterministic pseudo-random shuffle (Mulberry32 PRNG)
 * Ensures fair, randomized distribution across all businesses
 * while maintaining strict UI stability during search typing and pagination.
 */
export function shuffleBusinessesWithSeed(list: Business[], seed: number): Business[] {
  const result = [...list];
  let currentSeed = seed;
  for (let i = result.length - 1; i > 0; i--) {
    currentSeed = (currentSeed + 0x6d2b79f5) | 0;
    let t = Math.imul(currentSeed ^ (currentSeed >>> 15), 1 | currentSeed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    const rand = ((t >>> 0) / 4294967296);
    const j = Math.floor(rand * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
