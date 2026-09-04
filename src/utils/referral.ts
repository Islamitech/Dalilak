import { Representative, Business } from '../types';
import { isSuperAdmin } from './permissions';

export const INVITATION_GIFT_BONUS = 250; // EGP bonus awarded directly to inviter when referred rep reaches 10 Google-verified businesses milestone

/**
 * Checks if a business activity is verified on Google Maps.
 * Matches:
 * 1. googleSyncStatus === 'synced'
 * 2. verificationStatus === 'verified'
 * 3. authentic Google Maps URL (starts with http and not an unverified search query)
 */
export function isBusinessGoogleVerified(b: {
  googleSyncStatus?: string;
  verificationStatus?: string;
  googleMapsUrl?: string;
}): boolean {
  if (!b) return false;
  if (b.googleSyncStatus === 'synced') return true;
  if (b.verificationStatus === 'verified') return true;
  if (
    b.googleMapsUrl &&
    typeof b.googleMapsUrl === 'string' &&
    b.googleMapsUrl.trim().startsWith('http') &&
    !b.googleMapsUrl.includes('search/?api=1&query=')
  ) {
    return true;
  }
  return false;
}

/**
 * Calculates dynamic referral commission rate based on the activity and efficiency
 * of the invited representative (starts at 3% and scales up to 7%).
 */
export function calculateReferralCommissionRate(referredRepBizCount: number): number {
  if (referredRepBizCount >= 50) return 7;
  if (referredRepBizCount >= 35) return 6;
  if (referredRepBizCount >= 20) return 5;
  if (referredRepBizCount >= 10) return 4;
  return 3;
}

/**
 * Generates or formats a clean referral code for a representative.
 */
export function getRepReferralCode(rep: Representative): string {
  if (rep.referralCode && rep.referralCode.trim()) {
    return rep.referralCode.trim().toUpperCase();
  }
  // Deterministic fallback based on ID / phone
  const cleanId = rep.id.replace(/\D/g, '').slice(-4) || rep.phone.slice(-4) || '2026';
  return `DALIL-${cleanId}`;
}

/**
 * Checks if a representative's referral code is officially unlocked.
 * Strictly requires registering at least 25 businesses in the field (mandatory milestone),
 * or explicit administrator bypass. Only Super Admin has inherent system bypass.
 */
export function isReferralSystemUnlocked(rep: Representative, myBusinessesCount: number = 0): boolean {
  if (!rep) return false;
  if (isSuperAdmin(rep)) return true;
  // If explicitly unlocked or bypassed by admin:
  if (
    rep.adminBypassReferral === true ||
    String(rep.adminBypassReferral) === 'true' ||
    rep.referralUnlocked === true ||
    String(rep.referralUnlocked) === 'true'
  ) {
    return true;
  }
  return (Number(myBusinessesCount) || 0) >= 25;
}

export interface RepReferralSummary {
  referralCode: string;
  isUnlocked: boolean;
  myBusinessesCount: number;
  myVerifiedBusinessesCount: number;
  remainingForUnlock: number;
  totalInvitedCount: number;
  qualifiedRepsCount: number; // reached 10+ Google-verified businesses
  totalReferralCommission: number; // from 3% to 7% of revenues
  totalGiftsEarned: number; // 250 EGP per qualified rep awarded directly
  totalNetEarnings: number; // gifts + commission
  inviterInfo?: {
    rep: Representative;
    code: string;
    myVerifiedCountForInviter: number;
    isInviterGiftUnlocked: boolean;
  };
  invitedRepsDetails: Array<{
    rep: Representative;
    bizCount: number;
    verifiedBizCount: number;
    totalRevenue: number;
    currentRate: number;
    commissionEarned: number;
    isMission1Complete: boolean;
    remainingForMission1: number;
  }>;
}

/**
 * Checks if an invited representative was referred by a specific inviter.
 * Matches by code (e.g. DALIL-8355), 4-digit suffix (8355), phone number, email, or ID.
 */
export function isReferredByInviter(invitedRep: Representative, inviterRep: Representative): boolean {
  if (!invitedRep || !inviterRep || invitedRep.id === inviterRep.id) return false;

  const rawRefBy = (invitedRep.referredByCode || '').trim();
  if (!rawRefBy) return false;

  const cleanRefBy = rawRefBy.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const ownCode = getRepReferralCode(inviterRep).toUpperCase();
  const cleanOwnCode = ownCode.replace(/[^A-Z0-9]/g, '');
  const customCode = (inviterRep.referralCode || '').toUpperCase();
  const cleanCustomCode = customCode.replace(/[^A-Z0-9]/g, '');

  // 1. Direct exact or alphanumeric code match
  if (
    cleanRefBy === cleanOwnCode ||
    (cleanCustomCode && cleanRefBy === cleanCustomCode) ||
    rawRefBy.toUpperCase() === ownCode ||
    (customCode && rawRefBy.toUpperCase() === customCode)
  ) {
    return true;
  }

  // 1.5. Suffix match for 4-digit codes (e.g., '8355' matches 'DALIL-8355' or custom code)
  const refSuffix = cleanRefBy.slice(-4);
  const ownSuffix = cleanOwnCode.slice(-4);
  const customSuffix = cleanCustomCode ? cleanCustomCode.slice(-4) : '';
  if (refSuffix.length === 4 && (refSuffix === ownSuffix || (customSuffix.length === 4 && refSuffix === customSuffix))) {
    return true;
  }

  // 2. Exact match by inviter's phone number (Must be full Egyptian phone >= 10 digits to prevent collision)
  const inviterCleanPhone = (inviterRep.phone || '').replace(/\D/g, '');
  const refCleanPhone = rawRefBy.replace(/\D/g, '');
  if (inviterCleanPhone && refCleanPhone && refCleanPhone.length >= 10 && inviterCleanPhone.length >= 10) {
    if (inviterCleanPhone === refCleanPhone || inviterCleanPhone.endsWith(refCleanPhone) || refCleanPhone.endsWith(inviterCleanPhone)) {
      return true;
    }
  }

  // 3. Match by inviter's email
  const inviterEmail = (inviterRep.email || '').trim().toLowerCase();
  if (inviterEmail && rawRefBy.toLowerCase() === inviterEmail) {
    return true;
  }

  // 4. Match by inviter's unique ID
  const inviterId = (inviterRep.id || '').trim().toLowerCase();
  if (inviterId && rawRefBy.toLowerCase() === inviterId) {
    return true;
  }

  return false;
}

/**
 * Aggregates all referral earnings, network members, and commission tiers for an inviter.
 */
export function getRepReferralSummary(
  inviterRep: Representative,
  allReps: Representative[],
  allBusinesses: Business[]
): RepReferralSummary {
  const referralCode = getRepReferralCode(inviterRep);
  const invId = (inviterRep.id || '').toLowerCase().trim();
  const invName = (inviterRep.name || '').toLowerCase().trim();
  const invPhone = (inviterRep.phone || '').replace(/\D/g, '');

  const myBiz = allBusinesses.filter((b) => {
    const bRepId = (b.repId || '').toLowerCase().trim();
    const bRepName = (b.repName || '').toLowerCase().trim();
    const bRepPhone = ((b as any).repPhone || '').replace(/\D/g, '');
    return (invId && bRepId === invId) ||
           (invName && bRepName === invName) ||
           (invPhone && (bRepId === invPhone || bRepPhone === invPhone));
  });
  const myBizCount = myBiz.length;
  const myVerifiedBizCount = myBiz.filter(isBusinessGoogleVerified).length;
  const isUnlocked = isReferralSystemUnlocked(inviterRep, myBizCount);
  const remainingForUnlock = Math.max(0, 25 - myBizCount);

  // Find all reps who registered with this referral code using robust matching
  const invitedReps = allReps.filter((r) => isReferredByInviter(r, inviterRep));

  // Find who invited the current rep (if applicable)
  let inviterInfo: RepReferralSummary['inviterInfo'] = undefined;
  if (inviterRep.referredByCode) {
    const parentRep = allReps.find((r) => isReferredByInviter(inviterRep, r));
    const myVerifiedCountForInviter = myVerifiedBizCount;
    const isInviterGiftUnlocked = myVerifiedCountForInviter >= 10;
    if (parentRep) {
      inviterInfo = {
        rep: parentRep,
        code: getRepReferralCode(parentRep),
        myVerifiedCountForInviter,
        isInviterGiftUnlocked,
      };
    } else {
      inviterInfo = {
        rep: {
          id: 'inviter_pending',
          name: 'المندوب الداعي المعتمد',
          phone: '',
          role: 'rep',
          roleTitle: 'مندوب معتمد',
          governorate: '',
          targetMonth: 25,
          avatar: '',
          avatarStatus: 'approved',
          commissionRate: 42.86,
          status: 'active',
          referralCode: inviterRep.referredByCode,
        } as Representative,
        code: inviterRep.referredByCode,
        myVerifiedCountForInviter,
        isInviterGiftUnlocked,
      };
    }
  }

  let totalReferralCommission = 0;
  let qualifiedRepsCount = 0;

  const invitedRepsDetails = invitedReps.map((rep) => {
    const repBiz = allBusinesses.filter(
      (b) => b.repId === rep.id || (rep.name && b.repName === rep.name) || (rep.phone && b.repId === rep.phone)
    );
    const bizCount = repBiz.length;
    const verifiedBizCount = repBiz.filter(isBusinessGoogleVerified).length;
    const totalRevenue = repBiz.reduce((sum, b) => (b.isFeeExempt || b.packagePrice === 0) ? sum : sum + (b.amountPaid || 0), 0);
    const currentRate = calculateReferralCommissionRate(bizCount);
    const commissionEarned = Math.round(totalRevenue * (currentRate / 100));

    // 🎯 Milestone: 10 Google-verified businesses earns 250 EGP gift directly to inviter
    const isMission1Complete = verifiedBizCount >= 10;
    if (isMission1Complete) {
      qualifiedRepsCount += 1;
    }

    totalReferralCommission += commissionEarned;

    return {
      rep,
      bizCount,
      verifiedBizCount,
      totalRevenue,
      currentRate,
      commissionEarned,
      isMission1Complete,
      remainingForMission1: Math.max(0, 10 - verifiedBizCount),
    };
  });

  // 🎁 250 EGP gift is awarded directly to the inviter for each invited rep who reached 10 Google-verified businesses:
  const totalGiftsEarned = qualifiedRepsCount * INVITATION_GIFT_BONUS;
  const netCommission = isUnlocked ? totalReferralCommission : 0;
  const totalNetEarnings = netCommission + totalGiftsEarned;

  return {
    referralCode,
    isUnlocked,
    myBusinessesCount: myBizCount,
    myVerifiedBusinessesCount: myVerifiedBizCount,
    remainingForUnlock,
    totalInvitedCount: invitedReps.length,
    qualifiedRepsCount,
    totalReferralCommission: netCommission,
    totalGiftsEarned,
    totalNetEarnings,
    inviterInfo,
    invitedRepsDetails,
  };
}

