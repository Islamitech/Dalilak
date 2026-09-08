import { useMemo } from 'react';
import { Representative } from '../../../types';
import { getRepReferralCode } from '../../../utils/referral';

export const detectReferralCodeFromEnv = (initialCode?: string): string => {
  if (initialCode && initialCode.trim()) return initialCode.trim().toUpperCase();
  if (typeof window !== 'undefined') {
    const p = new URLSearchParams(window.location.search);
    const urlRef = p.get('ref') || p.get('referral') || p.get('inviter') || '';
    if (urlRef) return urlRef.trim().toUpperCase();
    const cached = localStorage.getItem('dalelak_pending_referral');
    if (cached) return cached.trim().toUpperCase();
  }
  return '';
};

export const useMatchedInviter = (
  referralCode: string,
  representatives: Representative[]
): Representative | null => {
  return useMemo(() => {
    const cleanRef = referralCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanRef) return null;
    return (
      representatives.find((r) => {
        const rCode = getRepReferralCode(r).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const rCustom = (r.referralCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const rPhone = (r.phone || '').replace(/\D/g, '');
        const rSuffix = rCode.slice(-4);
        const customSuffix = rCustom.slice(-4);
        return (
          rCode === cleanRef ||
          (rCustom && rCustom === cleanRef) ||
          (cleanRef.length >= 10 && rPhone && rPhone === cleanRef) ||
          (cleanRef.length === 4 && (cleanRef === rSuffix || cleanRef === customSuffix))
        );
      }) || null
    );
  }, [referralCode, representatives]);
};
