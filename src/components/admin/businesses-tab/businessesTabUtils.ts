import { Business } from '../../../types';
import { getBusinessFollowUpSummary } from '../../../utils/followUpUtils';

export interface BusinessFinancials {
  isDirectoryApproved: boolean;
  hasGoogleMap: boolean;
  isGoogleSynced: boolean;
  isInGoogleReview: boolean;
  isAlreadyOnGoogle: boolean;
  isExempt: boolean;
  packageDebt: number;
  additionalDebt: number;
  debtAmount: number;
  isPaid: boolean;
  isCash: boolean;
  repComm: number;
  platDue: number;
  isGoogleVerifiedWithDebt: boolean;
  fuSummary: ReturnType<typeof getBusinessFollowUpSummary>;
}

export function calcBusinessFinancials(biz: Business): BusinessFinancials {
  const isDirectoryApproved = biz.verificationStatus === 'verified';
  const hasGoogleMap = Boolean(
    biz.googleMapsUrl &&
    typeof biz.googleMapsUrl === 'string' &&
    biz.googleMapsUrl.trim().startsWith('http') &&
    !biz.googleMapsUrl.includes('search/?api=1&query=')
  );
  const isGoogleSynced = hasGoogleMap || biz.googleSyncStatus === 'synced';
  const isInGoogleReview = !hasGoogleMap && biz.googleSyncStatus === 'in_progress';
  const isAlreadyOnGoogle = Boolean(
    biz.isAlreadyOnGoogle ||
    biz.packageId === 'pkg_already_on_google' ||
    biz.registrationType === 'already_on_google'
  );
  const isExempt = Boolean(isAlreadyOnGoogle || biz.isFeeExempt || biz.packagePrice === 0);
  const packageDebt = isExempt ? 0 : Math.max(0, (biz.packagePrice || 0) - (biz.amountPaid || 0));
  const additionalDebt = isExempt
    ? 0
    : (biz.additionalInvoices || []).reduce(
        (sum, inv) => sum + Math.max(0, (Number(inv.amount) || 0) - (Number(inv.amountPaid) || 0)),
        0
      );
  const debtAmount = packageDebt + additionalDebt;
  const isPaid = isExempt ? true : debtAmount === 0;
  const isCash =
    !isExempt &&
    (biz.cashCollectedByRep !== undefined
      ? (biz.cashCollectedByRep || 0) > 0
      : biz.paymentMethod !== 'gateway_online' && isPaid);
  const rate = biz.repCommissionRate || 42.86;
  const repComm = isExempt ? 0 : Math.round(((biz.amountPaid || 0) * rate) / 100);
  const platDue = isExempt ? 0 : (biz.amountPaid || 0) - repComm;
  const isGoogleVerifiedWithDebt = hasGoogleMap && !isPaid && !isExempt && debtAmount > 0;
  const fuSummary = getBusinessFollowUpSummary(biz);

  return {
    isDirectoryApproved,
    hasGoogleMap,
    isGoogleSynced,
    isInGoogleReview,
    isAlreadyOnGoogle,
    isExempt,
    packageDebt,
    additionalDebt,
    debtAmount,
    isPaid,
    isCash,
    repComm,
    platDue,
    isGoogleVerifiedWithDebt,
    fuSummary,
  };
}
