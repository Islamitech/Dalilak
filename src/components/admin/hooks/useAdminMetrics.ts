import { useMemo } from 'react';
import { Business, Representative, PayoutRequest, InterestedLead, User } from '../../../types';
import { calculateRepSettlement, calculateRepCommissionFromCash } from '../../../utils/commission';
import { isReferredByInviter, getRepReferralSummary } from '../../../utils/referral';
import { safeParseJson } from '../../../utils/storage';
import { getDeletedRepresentatives } from '../../../services/db/repDb';

interface UseAdminMetricsProps {
  currentUser?: User | null;
  businesses: Business[];
  representatives: Representative[];
  payoutRequests?: PayoutRequest[];
  leads?: InterestedLead[];
}

export const useAdminMetrics = ({
  currentUser,
  businesses,
  representatives,
  payoutRequests = [],
  leads = [],
}: UseAdminMetricsProps) => {
  // Filter real businesses (strictly excluding field leads)
  const realBusinesses = useMemo(
    () => businesses.filter((b) => b && b.packageId !== 'pkg_interested_lead' && (b as any).verificationStatus !== 'lead' && !b.id.startsWith('lead_')),
    [businesses]
  );

  // Financial KPI totals (excluding fee-exempt popular area activities)
  const totalRevenue = useMemo(
    () => realBusinesses.reduce((acc, b) => (b.isFeeExempt || b.packagePrice === 0) ? acc : acc + (b.amountPaid || 0), 0),
    [realBusinesses]
  );

  const totalContractValue = useMemo(
    () => realBusinesses.reduce((acc, b) => (b.isFeeExempt || b.packagePrice === 0) ? acc : acc + (b.packagePrice || 0), 0),
    [realBusinesses]
  );

  const totalDebt = useMemo(
    () => realBusinesses.reduce((acc, b) => (b.isFeeExempt || b.packagePrice === 0) ? acc : acc + Math.max(0, (b.packagePrice || 0) - (b.amountPaid || 0)), 0),
    [realBusinesses]
  );

  const collectionRate = useMemo(
    () => totalContractValue > 0 ? ((totalRevenue / totalContractValue) * 100).toFixed(1) : '0',
    [totalRevenue, totalContractValue]
  );

  const exemptCount = useMemo(
    () => realBusinesses.filter((b) => b.isFeeExempt || b.packagePrice === 0).length,
    [realBusinesses]
  );

  // Google Maps Verification Pipeline Metrics
  const verifiedCount = useMemo(
    () => realBusinesses.filter((b) => {
      const url = (b.googleMapsUrl || '').trim();
      return url.startsWith('http') && !url.includes('search/?api=1&query=');
    }).length,
    [realBusinesses]
  );

  const inProgressCount = useMemo(
    () => realBusinesses.filter((b) => {
      const url = (b.googleMapsUrl || '').trim();
      const hasMap = url.startsWith('http') && !url.includes('search/?api=1&query=');
      return !hasMap && b.googleSyncStatus === 'in_progress';
    }).length,
    [realBusinesses]
  );

  const notSubmittedCount = useMemo(
    () => realBusinesses.filter((b) => {
      const url = (b.googleMapsUrl || '').trim();
      const hasMap = url.startsWith('http') && !url.includes('search/?api=1&query=');
      return !hasMap && b.googleSyncStatus !== 'in_progress';
    }).length,
    [realBusinesses]
  );

  const directoryApprovedCount = useMemo(
    () => realBusinesses.filter((b) => b.verificationStatus === 'verified').length,
    [realBusinesses]
  );

  const verificationRate = useMemo(
    () => realBusinesses.length > 0 ? ((verifiedCount / realBusinesses.length) * 100).toFixed(1) : '0',
    [verifiedCount, realBusinesses.length]
  );

  // CRM Leads Stats
  const leadStats = useMemo(() => {
    const total = leads.length;
    const pendingFollowup = leads.filter((l) => l.status === 'pending_followup').length;
    const contacted = leads.filter((l) => l.status === 'contacted').length;
    const converted = leads.filter((l) => l.status === 'converted').length;
    const highInterest = leads.filter((l) => l.interestLevel === 'high').length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    return { total, pendingFollowup, contacted, converted, highInterest, conversionRate };
  }, [leads]);

  // Overdue Google Verification Detection (> 48 hours in progress and not verified)
  const overdueReviewBusinesses = useMemo(() => {
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return realBusinesses.filter((b) => {
      const hasGoogleMap = Boolean(
        b.googleMapsUrl &&
        typeof b.googleMapsUrl === 'string' &&
        b.googleMapsUrl.trim().startsWith('http') &&
        !b.googleMapsUrl.includes('search/?api=1&query=')
      );
      if (hasGoogleMap) return false;

      const isInProgress = b.googleSyncStatus === 'in_progress';
      if (!isInProgress) return false;

      const submitTime = b.googleSyncDate
        ? new Date(b.googleSyncDate).getTime()
        : b.createdDate
        ? new Date(b.createdDate).getTime()
        : 0;

      return submitTime > 0 && (now - submitTime > TWO_DAYS_MS);
    });
  }, [realBusinesses]);

  const overdueReviewCount = overdueReviewBusinesses.length;

  // Activities with Google Maps placed & Unpaid / Remaining Balance
  const verifiedWithDebtBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      const isExempt = Boolean(
        b.isFeeExempt ||
        (b.packagePrice || 0) === 0 ||
        b.packageId === 'pkg_exempt' ||
        b.packageId === 'pkg_already_on_google' ||
        b.registrationType === 'already_on_google'
      );
      if (isExempt) return false;

      const hasGoogleMap = Boolean(
        b.googleMapsUrl &&
        typeof b.googleMapsUrl === 'string' &&
        b.googleMapsUrl.trim().startsWith('http') &&
        !b.googleMapsUrl.includes('search/?api=1&query=')
      );
      if (!hasGoogleMap) return false;

      const remaining = Math.max(0, (b.packagePrice || 0) - (b.amountPaid || 0));
      return remaining > 0 && b.paymentStatus !== 'fully_paid';
    });
  }, [businesses]);

  const verifiedWithDebtCount = verifiedWithDebtBusinesses.length;
  const verifiedWithDebtTotal = useMemo(
    () => verifiedWithDebtBusinesses.reduce(
      (sum, b) => sum + Math.max(0, (b.packagePrice || 0) - (b.amountPaid || 0)),
      0
    ),
    [verifiedWithDebtBusinesses]
  );

  // Governorate Breakdown
  const governorateStats = useMemo(() => {
    const govMap = new Map<string, { count: number; revenue: number; verified: number; exempt: number }>();
    businesses.forEach((b) => {
      const gov = b.governorate || 'القاهرة';
      const existing = govMap.get(gov) || { count: 0, revenue: 0, verified: 0, exempt: 0 };
      existing.count += 1;
      if (!b.isFeeExempt && (b.packagePrice || 0) > 0) {
        existing.revenue += (b.amountPaid || 0);
      } else {
        existing.exempt += 1;
      }
      if (b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced') {
        existing.verified += 1;
      }
      govMap.set(gov, existing);
    });
    return Array.from(govMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [businesses]);

  // Package Share Breakdown
  const packageStats = useMemo(() => {
    const pkgMap = new Map<string, { count: number; revenue: number }>();
    businesses.forEach((b) => {
      const isExempt = b.isFeeExempt || b.packagePrice === 0;
      const pkgTitle = isExempt ? 'أنشطة رائجة بالمنطقة (إدراج مجاني بدون رسوم)' : (b.packageTitle || b.packageName || 'الباقة الأساسية');
      const existing = pkgMap.get(pkgTitle) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += isExempt ? 0 : (b.packagePrice || 0);
      pkgMap.set(pkgTitle, existing);
    });
    return Array.from(pkgMap.entries())
      .map(([title, data]) => ({
        title,
        count: data.count,
        revenue: data.revenue,
        percentage: businesses.length > 0 ? ((data.count / businesses.length) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.count - a.count);
  }, [businesses]);

  // Merged & Strictly Deduplicated Representatives List (Excluding deleted records)
  const mergedAdminReps = useMemo(() => {
    const seenIds = new Set<string>();
    const seenEmails = new Set<string>();
    const result: Representative[] = [];

    const blacklist = new Set(
      (safeParseJson<string[]>(localStorage.getItem('dalelak_deleted_rep_ids'), []) || []).map((x) => String(x).toLowerCase())
    );
    const softDeletedList = getDeletedRepresentatives();
    const softDeletedIds = new Set(softDeletedList.map((r) => (r.id || '').toLowerCase()));
    const softDeletedEmails = new Set(softDeletedList.map((r) => (r.email || '').toLowerCase()).filter(Boolean));
    const softDeletedPhones = new Set(softDeletedList.map((r) => (r.phone || '').trim()).filter(Boolean));

    representatives.forEach((r) => {
      if (r.isDeleted) return;

      const cleanEmail = (r.email || '').trim().toLowerCase();
      const id = (r.id || '').trim();
      const idLower = id.toLowerCase();
      const phoneTrim = (r.phone || '').trim();

      if (idLower && (blacklist.has(idLower) || softDeletedIds.has(idLower))) return;
      if (cleanEmail && (blacklist.has(cleanEmail) || softDeletedEmails.has(cleanEmail))) return;
      if (phoneTrim && (blacklist.has(phoneTrim) || softDeletedPhones.has(phoneTrim))) return;

      if (id && seenIds.has(id)) return;
      if (cleanEmail && seenEmails.has(cleanEmail)) return;
      if (id) seenIds.add(id);
      if (cleanEmail) seenEmails.add(cleanEmail);
      result.push(r);
    });
    return result;
  }, [representatives]);

  // Reps Performance Table
  const repPerformanceStats = useMemo(() => {
    const now = Date.now();
    const FIFTY_NINE_MINS_MS = 59 * 60 * 1000;

    return mergedAdminReps
      .map((rep) => {
        const repBiz = businesses.filter((b) => b.repId === rep.id || b.repName === rep.name);
        const collected = repBiz.reduce((sum, b) => (b.isFeeExempt || b.packagePrice === 0) ? sum : sum + (b.amountPaid || 0), 0);
        const verified = repBiz.filter((b) => b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced').length;
        const target = rep.targetMonth || 25;
        const achievement = target > 0 ? ((repBiz.length / target) * 100).toFixed(1) : '0';

        const isCurrentActiveUser = Boolean(
          currentUser && (currentUser.id === rep.id || (currentUser.email && rep.email && currentUser.email.toLowerCase() === rep.email.toLowerCase()) || currentUser.name === rep.name)
        );
        const effectiveTimestamp = isCurrentActiveUser ? now : (rep.lastActiveTimestamp ? Number(rep.lastActiveTimestamp) : 0);
        const isOnline = Boolean(
          isCurrentActiveUser || (effectiveTimestamp > 0 && (now - effectiveTimestamp < FIFTY_NINE_MINS_MS))
        );

        let lastActiveText = 'غير متصل';
        if (isCurrentActiveUser) {
          lastActiveText = 'نشط الآن 🟢';
        } else if (effectiveTimestamp > 0) {
          const diffMinutes = Math.floor((now - effectiveTimestamp) / 60000);
          if (diffMinutes <= 1) {
            lastActiveText = 'نشط الآن 🟢';
          } else if (diffMinutes < 60) {
            lastActiveText = `نشط منذ ${diffMinutes} د`;
          } else {
            const diffHours = Math.floor(diffMinutes / 60);
            lastActiveText = diffHours < 24 ? `منذ ${diffHours} س` : 'غير متصل';
          }
        }

        const effectiveRate = rep.commissionRate && rep.commissionRate < 100 ? rep.commissionRate : 42.86;
        const repReferral = getRepReferralSummary(rep, mergedAdminReps, businesses);
        const settlement = calculateRepSettlement(rep.id, repBiz, effectiveRate, payoutRequests, repReferral.totalNetEarnings);
        const invitedCount = mergedAdminReps.filter((r) => isReferredByInviter(r, rep)).length;

        return {
          rep,
          totalBiz: repBiz.length,
          verifiedBiz: verified,
          collectedRevenue: collected,
          target,
          achievement: Number(achievement),
          isOnline,
          lastActiveText,
          settlement,
          cashInHand: settlement.totalCashInHand,
          earnedCommission: settlement.totalEarnedCommission,
          debtToPlatform: settlement.debtToPlatformAmount,
          withdrawableBalance: settlement.withdrawableBalance,
          isDebt: settlement.isDebtToPlatform,
          invitedCount,
          referralEarnings: repReferral.totalNetEarnings,
        };
      })
      .sort((a, b) => b.totalBiz - a.totalBiz);
  }, [mergedAdminReps, businesses, payoutRequests, currentUser]);

  // Master Financial Accounting Metrics
  const totalApprovedPayouts = useMemo(
    () => (payoutRequests || [])
      .filter((p) => p.status === 'approved' && (!p.type || p.type === 'payout'))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [payoutRequests]
  );

  const totalPendingPayouts = useMemo(
    () => (payoutRequests || [])
      .filter((p) => p.status === 'pending' && (!p.type || p.type === 'payout'))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [payoutRequests]
  );

  const totalRemittancesReceived = useMemo(
    () => (payoutRequests || [])
      .filter((p) => p.status === 'approved' && p.type === 'remittance')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [payoutRequests]
  );

  const totalCashInRepsHands = useMemo(
    () => businesses.reduce((acc, b) => {
      if (b.isFeeExempt || b.packagePrice === 0) return acc;
      if ((b.cashCollectedByRep || 0) > 0) return acc + (b.cashCollectedByRep || 0);
      if ((b.paymentMethod as string) === 'cash_by_rep') return acc + (b.amountPaid || 0);
      return acc;
    }, 0),
    [businesses]
  );

  const totalEarnedCommissions = useMemo(() => {
    return mergedAdminReps.reduce((sum, rep) => {
      if (rep.role !== 'rep') return sum;
      const repBiz = businesses.filter((b) => b.repId === rep.id || b.repName === rep.name || b.repId === rep.phone);
      const repRate = (rep.commissionRate && rep.commissionRate < 100) ? rep.commissionRate : 42.86;
      const repReferral = getRepReferralSummary(rep, mergedAdminReps, businesses);
      const settlement = calculateRepSettlement(rep.id, repBiz, repRate, payoutRequests, repReferral.totalNetEarnings);
      return sum + settlement.totalEarnedCommission;
    }, 0);
  }, [mergedAdminReps, businesses, payoutRequests]);

  const netPlatformRevenue = Math.max(0, totalRevenue - totalEarnedCommissions);

  const totalCommissionsRetainedInCash = useMemo(() => {
    return mergedAdminReps.reduce((sum, rep) => {
      if (rep.role !== 'rep') return sum;
      const repBiz = businesses.filter((b) => b.repId === rep.id || b.repName === rep.name || b.repId === rep.phone);
      const repRate = (rep.commissionRate && rep.commissionRate < 100) ? rep.commissionRate : 42.86;
      return sum + calculateRepCommissionFromCash(repBiz, repRate);
    }, 0);
  }, [mergedAdminReps, businesses]);

  const netRepsSettlementMatrix = useMemo(() => {
    let totalRepsCashDebtToPlatform = 0;
    let totalPlatformPayableToReps = 0;
    let totalRepCashInHand = 0;

    mergedAdminReps.forEach((rep) => {
      if (rep.role !== 'rep') return;
      const repBiz = businesses.filter((b) => b.repId === rep.id || b.repName === rep.name || b.repId === rep.phone);
      const repRate = (rep.commissionRate && rep.commissionRate < 100) ? rep.commissionRate : 42.86;
      const repReferral = getRepReferralSummary(rep, mergedAdminReps, businesses);
      const settlement = calculateRepSettlement(rep.id, repBiz, repRate, payoutRequests, repReferral.totalNetEarnings);

      totalRepCashInHand += settlement.totalCashInHand;
      if (settlement.isDebtToPlatform) {
        totalRepsCashDebtToPlatform += settlement.debtToPlatformAmount;
      } else {
        totalPlatformPayableToReps += settlement.withdrawableBalance;
      }
    });

    return {
      totalRepsCashDebtToPlatform,
      totalPlatformPayableToReps,
      totalRepCashInHand,
    };
  }, [mergedAdminReps, businesses, payoutRequests]);

  // Monthly Financial Breakdown
  const monthlyFinancialStats = useMemo(() => {
    const monthsMap = new Map<string, {
      monthKey: string;
      monthLabel: string;
      grossRevenue: number;
      repCommissions: number;
      netPlatform: number;
      verifiedCount: number;
      totalBizCount: number;
      disbursedPayouts: number;
      repsActive: Set<string>;
      repEarningsMap: Map<string, { name: string; earnings: number; count: number }>;
    }>();

    realBusinesses.forEach((b) => {
      const d = b.createdDate ? new Date(b.createdDate) : new Date();
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });

      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, {
          monthKey,
          monthLabel,
          grossRevenue: 0,
          repCommissions: 0,
          netPlatform: 0,
          verifiedCount: 0,
          totalBizCount: 0,
          disbursedPayouts: 0,
          repsActive: new Set(),
          repEarningsMap: new Map(),
        });
      }

      const m = monthsMap.get(monthKey)!;
      m.totalBizCount += 1;
      if (b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced') {
        m.verifiedCount += 1;
      }
      if (!b.isFeeExempt && (b.packagePrice || 0) > 0) {
        const paid = b.amountPaid || 0;
        const rep = mergedAdminReps.find((r) => r.id === b.repId || r.name === b.repName || r.phone === b.repId);
        const isFieldRep = rep ? rep.role === 'rep' : (!b.repId?.startsWith('admin_') && b.repName !== 'مدير النظام دليلك');

        let repShare = 0;
        if (isFieldRep) {
          const rate = (rep?.commissionRate && rep.commissionRate < 100) ? rep.commissionRate : 42.86;
          repShare = Math.round((paid * rate) / 100);
        }

        m.grossRevenue += paid;
        m.repCommissions += repShare;
        m.netPlatform += (paid - repShare);

        if (isFieldRep && repShare > 0) {
          const repIdentifier = b.repId || b.repName || 'rep';
          m.repsActive.add(repIdentifier);

          const curRep = m.repEarningsMap.get(repIdentifier) || { name: b.repName || rep?.name || 'مندوب معتمد', earnings: 0, count: 0 };
          curRep.earnings += repShare;
          curRep.count += 1;
          m.repEarningsMap.set(repIdentifier, curRep);
        }
      }
    });

    (payoutRequests || []).forEach((p) => {
      if (p.status === 'approved' && (!p.type || p.type === 'payout')) {
        const d = p.requestDate ? new Date(p.requestDate) : new Date();
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthsMap.has(monthKey)) {
          monthsMap.get(monthKey)!.disbursedPayouts += (Number(p.amount) || 0);
        }
      }
    });

    return Array.from(monthsMap.values())
      .map((m) => {
        let topRep = { name: 'لا يوجد', earnings: 0 };
        m.repEarningsMap.forEach((val) => {
          if (val.earnings > topRep.earnings) topRep = val;
        });
        const activeRepsCount = Math.max(1, m.repsActive.size);
        const avgRepIncome = Math.round(m.repCommissions / activeRepsCount);
        return {
          ...m,
          topRepName: topRep.name,
          topRepEarnings: topRep.earnings,
          avgRepIncome,
        };
      })
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [realBusinesses, payoutRequests, mergedAdminReps]);

  return {
    realBusinesses,
    totalRevenue,
    totalContractValue,
    totalDebt,
    collectionRate,
    exemptCount,
    verifiedCount,
    inProgressCount,
    notSubmittedCount,
    directoryApprovedCount,
    verificationRate,
    leadStats,
    overdueReviewBusinesses,
    overdueReviewCount,
    verifiedWithDebtBusinesses,
    verifiedWithDebtCount,
    verifiedWithDebtTotal,
    governorateStats,
    packageStats,
    mergedAdminReps,
    repPerformanceStats,
    totalApprovedPayouts,
    totalPendingPayouts,
    totalRemittancesReceived,
    totalCashInRepsHands,
    totalEarnedCommissions,
    netPlatformRevenue,
    totalCommissionsRetainedInCash,
    netRepsSettlementMatrix,
    monthlyFinancialStats,
  };
};
