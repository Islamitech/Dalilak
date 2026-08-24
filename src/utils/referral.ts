import { Representative, Business } from '../types';

export const INVITATION_GIFT_BONUS = 250; // EGP bonus awarded to inviter when referred rep reaches 10 businesses milestone

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
 * Unlocked if:
 * 1. Admin explicitly enabled/bypassed it (adminBypassReferral === true)
 * 2. Marked as referralUnlocked === true
 * 3. Has registered >= 25 businesses
 */
export function isReferralSystemUnlocked(rep: Representative, myBusinessesCount: number): boolean {
  if (rep.role === 'admin' || rep.role === 'supervisor') return true;
  if (rep.adminBypassReferral || rep.referralUnlocked) return true;
  return myBusinessesCount >= 25;
}

export interface RepReferralSummary {
  referralCode: string;
  isUnlocked: boolean;
  totalInvitedCount: number;
  qualifiedRepsCount: number; // reached 10+ businesses
  totalReferralCommission: number; // from 3% to 7% of revenues
  totalGiftsEarned: number; // 250 EGP per qualified rep
  totalNetEarnings: number; // gifts + commission
  inviterInfo?: {
    rep: Representative;
    code: string;
  };
  invitedRepsDetails: Array<{
    rep: Representative;
    bizCount: number;
    totalRevenue: number;
    currentRate: number;
    commissionEarned: number;
    isMission1Complete: boolean;
    remainingForMission1: number;
  }>;
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
  const myBizCount = allBusinesses.filter(
    (b) => b.repId === inviterRep.id || b.repName === inviterRep.name
  ).length;
  const isUnlocked = isReferralSystemUnlocked(inviterRep, myBizCount);

  // Normalize code for clean comparison
  const normalizedOwnCode = referralCode.trim().toUpperCase();
  const normalizedRepId = (inviterRep.id || '').trim().toLowerCase();

  // Find all reps who registered with this referral code
  const invitedReps = allReps.filter((r) => {
    if (!r || r.id === inviterRep.id) return false;
    const refBy = (r.referredByCode || '').trim().toUpperCase();
    if (!refBy) return false;
    return (
      refBy === normalizedOwnCode ||
      (inviterRep.referralCode && refBy === inviterRep.referralCode.trim().toUpperCase()) ||
      r.referredByCode?.toLowerCase() === normalizedRepId
    );
  });

  // Find who invited the current rep (if applicable)
  let inviterInfo: { rep: Representative; code: string } | undefined = undefined;
  if (inviterRep.referredByCode) {
    const parentCode = inviterRep.referredByCode.trim().toUpperCase();
    const parentRep = allReps.find(
      (r) =>
        r.id !== inviterRep.id &&
        (getRepReferralCode(r) === parentCode || (r.referralCode && r.referralCode.trim().toUpperCase() === parentCode))
    );
    if (parentRep) {
      inviterInfo = {
        rep: parentRep,
        code: parentCode,
      };
    }
  }

  let totalReferralCommission = 0;
  let qualifiedRepsCount = 0;

  const invitedRepsDetails = invitedReps.map((rep) => {
    const repBiz = allBusinesses.filter((b) => b.repId === rep.id || b.repName === rep.name);
    const bizCount = repBiz.length;
    const totalRevenue = repBiz.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
    const currentRate = calculateReferralCommissionRate(bizCount);
    const commissionEarned = Math.round(totalRevenue * (currentRate / 100));

    const isMission1Complete = bizCount >= 10;
    if (isMission1Complete) {
      qualifiedRepsCount += 1;
    }

    totalReferralCommission += commissionEarned;

    return {
      rep,
      bizCount,
      totalRevenue,
      currentRate,
      commissionEarned,
      isMission1Complete,
      remainingForMission1: Math.max(0, 10 - bizCount),
    };
  });

  const totalGiftsEarned = qualifiedRepsCount * INVITATION_GIFT_BONUS;
  const totalNetEarnings = totalReferralCommission + totalGiftsEarned;

  return {
    referralCode,
    isUnlocked,
    totalInvitedCount: invitedReps.length,
    qualifiedRepsCount,
    totalReferralCommission,
    totalGiftsEarned,
    totalNetEarnings,
    inviterInfo,
    invitedRepsDetails,
  };
}
