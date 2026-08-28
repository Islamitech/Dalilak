import { PayoutRequest, PayoutMethod } from '../types';

/**
 * Dynamic Percentage Commission Utility:
 * Calculates representative earnings strictly as a percentage (%) of collected payments
 * and handles available balances, pending payout requests, and disbursed earnings.
 */

export const DEFAULT_COMMISSION_RATE = 42.86; // Default 42.86% rate

export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  vodafone_cash: 'فودافون كاش (Vodafone Cash)',
  instapay: 'إنستاباي (InstaPay)',
  orange_cash: 'أورنج كاش (Orange Cash)',
  etisalat_cash: 'اتصالات كاش (Etisalat Cash)',
  we_pay: 'وي باي (WE Pay)',
  bank_transfer: 'تحويل بنكي (Bank Transfer)',
  cash: 'استلام نقدي في المقر',
};

/**
 * Returns full potential commission amount for a package based on commission percentage rate.
 */
export function getPackageCommission(packagePrice: number, rate: number = DEFAULT_COMMISSION_RATE): number {
  const price = packagePrice || 250;
  const commissionRate = rate || DEFAULT_COMMISSION_RATE;
  return Math.round((price * commissionRate) / 100);
}

/**
 * Calculates actual earned commission dynamically based on collected amount and percentage rate.
 */
export function calculateBusinessCommission(
  _packagePrice: number,
  amountPaid: number,
  rate: number = DEFAULT_COMMISSION_RATE
): number {
  const paid = amountPaid || 0;
  const commissionRate = rate || DEFAULT_COMMISSION_RATE;
  return Math.round((paid * commissionRate) / 100);
}

/**
 * Calculates total earned commission for all business registrations based on percentage rate.
 */
export function calculateTotalRepCommission(
  businesses: Array<{ packagePrice: number; amountPaid: number }>,
  rate: number = DEFAULT_COMMISSION_RATE
): number {
  const commissionRate = rate || DEFAULT_COMMISSION_RATE;
  return businesses.reduce((sum, b) => {
    return sum + calculateBusinessCommission(b.packagePrice, b.amountPaid, commissionRate);
  }, 0);
}

/**
 * Calculates total amount of payouts currently pending approval for a rep.
 */
export function calculateRepPendingPayout(repId: string, payouts: PayoutRequest[] = []): number {
  return payouts
    .filter((p) => p.repId === repId && p.status === 'pending')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
}

/**
 * Calculates total amount of payouts already approved and disbursed to a rep.
 */
export function calculateRepTotalPaidOut(repId: string, payouts: PayoutRequest[] = []): number {
  return payouts
    .filter((p) => p.repId === repId && p.status === 'approved')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
}

/**
 * Calculates total cash physically collected by the representative in hand.
 * Cash collected is ONLY for activities where the rep collected cash during registration ('cash_by_rep' or cashCollectedByRep > 0).
 * Deferred payments settled later via the platform ('platform_collected' / 'gateway_online' / 'bank_transfer') are received by the platform and NOT cash in rep's hand.
 */
export function calculateRepTotalCashCollected(
  businesses: Array<{ amountPaid: number; paymentMethod?: string; cashCollectedByRep?: number }>
): number {
  return businesses.reduce((sum, b) => {
    const paid = Number(b.amountPaid) || 0;
    if (paid <= 0) return sum;

    if (b.cashCollectedByRep !== undefined) {
      return sum + (Number(b.cashCollectedByRep) || 0);
    }

    if (b.paymentMethod === 'cash_by_rep') {
      return sum + paid;
    }

    // Default: If not explicitly cash_by_rep, it is collected via platform/gateway (0 cash in rep's hand)
    return sum + 0;
  }, 0);
}

/**
 * Calculates rep's commission earned specifically from the cash he collected.
 */
export function calculateRepCommissionFromCash(
  businesses: Array<{ packagePrice: number; amountPaid: number; paymentMethod?: string; cashCollectedByRep?: number }>,
  rate: number = DEFAULT_COMMISSION_RATE
): number {
  const commissionRate = rate || DEFAULT_COMMISSION_RATE;
  return businesses.reduce((sum, b) => {
    const paid = Number(b.amountPaid) || 0;
    if (paid <= 0) return sum;

    let cash = 0;
    if (b.cashCollectedByRep !== undefined) {
      cash = Number(b.cashCollectedByRep) || 0;
    } else if (b.paymentMethod === 'cash_by_rep') {
      cash = paid;
    }

    return sum + Math.round((cash * commissionRate) / 100);
  }, 0);
}

/**
 * Calculates platform's due share from cash collected by the representative in hand.
 */
export function calculatePlatformDueFromRep(
  businesses: Array<{ packagePrice: number; amountPaid: number; paymentMethod?: string; cashCollectedByRep?: number }>,
  rate: number = DEFAULT_COMMISSION_RATE
): number {
  const totalCash = calculateRepTotalCashCollected(businesses);
  const repShare = calculateRepCommissionFromCash(businesses, rate);
  return Math.max(0, totalCash - repShare);
}

/**
 * Comprehensive financial settlement for a representative:
 * Balances total earnings vs cash already in hand.
 */
export interface RepSettlementSummary {
  totalEarnedCommission: number;    // All earned commission on paid amounts (Cash + Gateway + Referral)
  totalCashInHand: number;          // Cash collected directly by rep
  repShareFromCash: number;         // Rep's earned commission on cash collected
  platformShareFromCash: number;    // Platform's share on cash collected
  onlineCollectedAmount: number;    // Payments made directly to platform
  repShareFromOnline: number;       // Rep's commission on online payments
  netBalance: number;               // Final net balance (+ for withdrawable credit, - for debt to platform)
  isDebtToPlatform: boolean;        // true if rep owes platform money
  debtToPlatformAmount: number;     // Amount rep must remit to platform
  withdrawableBalance: number;      // Amount rep can withdraw from platform
  pendingPayout: number;
  totalPaidOut: number;
  // Pending verification / pay later metrics:
  pendingVerificationCommission: number; // Expected commission on unpaid or under-review activities
  pendingVerificationCount: number;      // Number of activities pending verification / payment
}

export function calculateRepSettlement(
  repId: string,
  businesses: Array<{ 
    packagePrice: number; 
    amountPaid: number; 
    paymentMethod?: string; 
    cashCollectedByRep?: number;
    verificationStatus?: string;
    googleSyncStatus?: string;
    paymentStatus?: string;
  }>,
  rate: number = DEFAULT_COMMISSION_RATE,
  payouts: PayoutRequest[] = [],
  referralEarnings: number = 0
): RepSettlementSummary {
  const commissionRate = rate || DEFAULT_COMMISSION_RATE;
  
  // Calculate direct commission strictly from collected/paid amounts
  const totalDirectEarned = calculateTotalRepCommission(businesses, commissionRate);
  const totalEarnedCommission = totalDirectEarned + referralEarnings;
  
  const totalCashInHand = calculateRepTotalCashCollected(businesses);
  const repShareFromCash = calculateRepCommissionFromCash(businesses, commissionRate);
  const platformShareFromCash = Math.max(0, totalCashInHand - repShareFromCash);

  const totalPaidAll = businesses.reduce((s, b) => s + (Number(b.amountPaid) || 0), 0);
  const onlineCollectedAmount = Math.max(0, totalPaidAll - totalCashInHand);
  const repShareFromOnline = Math.round((onlineCollectedAmount * commissionRate) / 100);

  const pendingPayout = calculateRepPendingPayout(repId, payouts);
  const totalPaidOut = calculateRepTotalPaidOut(repId, payouts);

  // Pending verification & pay-later expected commissions
  let pendingVerificationCommission = 0;
  let pendingVerificationCount = 0;

  businesses.forEach((b) => {
    const isUnverified = b.verificationStatus !== 'verified' && b.googleSyncStatus !== 'synced';
    const isUnpaid = (b.amountPaid || 0) === 0 || b.paymentStatus === 'unpaid';
    
    if (isUnverified || isUnpaid) {
      pendingVerificationCount += 1;
      const unpaidPortion = Math.max(0, (b.packagePrice || 250) - (b.amountPaid || 0));
      // Expected commission from remaining unpaid balance or unverified package
      const expectedComm = Math.round((unpaidPortion * commissionRate) / 100);
      pendingVerificationCommission += expectedComm;
    }
  });

  // 1. Electronic Wallet Credit remaining with the platform (cannot be negative):
  const remainingOnlineCredit = Math.max(0, (referralEarnings + repShareFromOnline) - totalPaidOut);

  // 2. Physical Cash Remittance Due to Platform:
  // Debt to platform ONLY exists if the rep collected physical cash in hand from customers
  const isDebtToPlatform = platformShareFromCash > 0;
  const debtToPlatformAmount = platformShareFromCash;

  // 3. Withdrawable balance for new payout requests:
  const withdrawableBalance = Math.max(0, remainingOnlineCredit - pendingPayout);

  const finalNetBalance = isDebtToPlatform ? -debtToPlatformAmount : withdrawableBalance;

  return {
    totalEarnedCommission,
    totalCashInHand,
    repShareFromCash,
    platformShareFromCash,
    onlineCollectedAmount,
    repShareFromOnline,
    netBalance: finalNetBalance,
    isDebtToPlatform,
    debtToPlatformAmount,
    withdrawableBalance,
    pendingPayout,
    totalPaidOut,
    pendingVerificationCommission,
    pendingVerificationCount,
  };
}

/**
 * Calculates real-time available balance that the representative can withdraw right now.
 * Available = Total Earned (Direct + Referral Bonus) - Pending Payouts - Total Paid Out
 */
export function calculateRepAvailableBalance(
  repId: string,
  totalEarned: number,
  payouts: PayoutRequest[] = []
): number {
  const pending = calculateRepPendingPayout(repId, payouts);
  const paidOut = calculateRepTotalPaidOut(repId, payouts);
  return Math.max(0, totalEarned - pending - paidOut);
}

/**
 * Returns an accurate, human-friendly Arabic label for how an activity was paid.
 * Differentiates between physical cash in rep's hand vs online platform payments.
 */
export function getBusinessPaymentLabel(biz: {
  amountPaid?: number;
  paymentMethod?: string;
  cashCollectedByRep?: number;
  paymentStatus?: string;
}): { label: string; shortLabel: string; isCash: boolean; icon: string } {
  const paid = Number(biz.amountPaid) || 0;
  if (paid <= 0 || biz.paymentStatus === 'unpaid') {
    return {
      label: '⏳ الدفع لاحقاً (بانتظار السداد)',
      shortLabel: 'غير مسدد',
      isCash: false,
      icon: '⏳',
    };
  }

  // Check if it's explicitly recorded as electronic/platform payment
  if (biz.paymentMethod === 'gateway_online') {
    return {
      label: `💳 سداد إلكتروني عبر البوابة (${paid} ج.م)`,
      shortLabel: `إلكتروني (${paid} ج)`,
      isCash: false,
      icon: '💳',
    };
  }

  if (biz.paymentMethod === 'bank_transfer') {
    return {
      label: `🏛️ تحويل بنكي للمنصة (${paid} ج.م)`,
      shortLabel: `تحويل بنكي (${paid} ج)`,
      isCash: false,
      icon: '🏛️',
    };
  }

  if (biz.paymentMethod === 'platform_collected') {
    return {
      label: `📲 تحويل مباشر للمنصة (فودافون/إنستاباي) (${paid} ج.م)`,
      shortLabel: `تحويل للمنصة (${paid} ج)`,
      isCash: false,
      icon: '📲',
    };
  }

  // Physical cash collected by rep in field
  const isCash =
    biz.cashCollectedByRep !== undefined
      ? (biz.cashCollectedByRep || 0) > 0
      : biz.paymentMethod === 'cash_by_rep';

  if (isCash) {
    return {
      label: `💵 كاش استلمه المندوب (${paid} ج.م)`,
      shortLabel: `كاش ميداني (${paid} ج)`,
      isCash: true,
      icon: '💵',
    };
  }

  // Default fallback for paid records
  return {
    label: `💳 سداد إلكتروني معتمد (${paid} ج.م)`,
    shortLabel: `سداد معتمد (${paid} ج)`,
    isCash: false,
    icon: '💳',
  };
}
