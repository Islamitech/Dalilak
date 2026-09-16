import { useMemo } from 'react';
import { Business, Representative, PayoutRequest, InterestedLead, User } from '../../../types';
import { calculateRepSettlement, calculateRepCommissionFromCash } from '../../../utils/commission';
import { isReferredByInviter, getRepReferralSummary } from '../../../utils/referral';
import { safeParseJson } from '../../../utils/storage';
import { getDeletedRepresentatives } from '../../../services/db/repDb';
import { isBusinessFollowUpOverdue } from '../../../utils/followUpUtils';
import { getCategoryGroupFor, isTrendingFreeActivity, isCollectedInvoiceActivity, isUnpaidActivity } from '../../../utils/categoryMatcher';

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

  // 🚀 HIGH SPEED SINGLE-PASS METRICS COMPUTATION (1 loop instead of 18 loops across 1300+ items)
  const {
    totalRevenue,
    totalContractValue,
    totalDebt,
    collectionRate,
    exemptCount,
    verifiedCount,
    inProgressCount,
    notSubmittedCount,
    directoryApprovedCount,
    pendingApprovalCount,
    trendingFreeCount,
    collectedInvoicesCount,
    unpaidBusinessesCount,
    verificationRate,
    overdueReviewBusinesses,
    overdueReviewCount,
    overdueReviewIds,
    overdueFollowUpBusinesses,
    overdueFollowUpCount,
    overdueFollowUpIds,
    verifiedWithDebtBusinesses,
    verifiedWithDebtCount,
    verifiedWithDebtTotal,
    verifiedWithDebtIds,
    categoryStats,
  } = useMemo(() => {
    let rev = 0;
    let contractVal = 0;
    let debt = 0;
    let exempt = 0;
    let verified = 0;
    let inProgress = 0;
    let notSubmitted = 0;
    let dirApproved = 0;
    let pendingAppr = 0;
    let trendingFree = 0;
    let collectedInvs = 0;
    let unpaidCount = 0;

    const overdueRevBiz: Business[] = [];
    const overdueRevIds = new Set<string>();

    const overdueFollowBiz: Business[] = [];
    const overdueFollowIds = new Set<string>();

    const verWithDebtBiz: Business[] = [];
    const verWithDebtIds = new Set<string>();
    let verWithDebtSum = 0;

    const catMap = new Map<string, number>();

    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (let i = 0; i < realBusinesses.length; i++) {
      const b = realBusinesses[i];

      // 1. Financial totals
      const isFeeExempt = b.isFeeExempt || b.packagePrice === 0;
      const basePaid = isFeeExempt ? 0 : (b.amountPaid || 0);
      const basePrice = isFeeExempt ? 0 : (b.packagePrice || 0);
      const baseDebt = isFeeExempt ? 0 : Math.max(0, basePrice - basePaid);

      let addInvsPaid = 0;
      let addInvsTotal = 0;
      let addInvsDebt = 0;
      if (b.additionalInvoices && b.additionalInvoices.length > 0) {
        for (let j = 0; j < b.additionalInvoices.length; j++) {
          const inv = b.additionalInvoices[j];
          const aPaid = Number(inv.amountPaid) || 0;
          const aTotal = Number(inv.amount) || 0;
          addInvsPaid += aPaid;
          addInvsTotal += aTotal;
          addInvsDebt += Math.max(0, aTotal - aPaid);
        }
      }

      rev += basePaid + addInvsPaid;
      contractVal += basePrice + addInvsTotal;
      debt += baseDebt + addInvsDebt;

      if (isFeeExempt) {
        exempt++;
      }

      // 2. Maps & Directory verification
      const url = (b.googleMapsUrl || '').trim();
      const hasMap = url.startsWith('http') && !url.includes('search/?api=1&query=');
      if (hasMap) {
        verified++;
      } else if (b.googleSyncStatus === 'in_progress') {
        inProgress++;
      }

      if (b.verificationStatus === 'verified') {
        dirApproved++;
        if (!hasMap && b.googleSyncStatus !== 'in_progress') {
          notSubmitted++;
        }
      } else {
        pendingAppr++;
      }

      // 3. Category & trending filters
      if (isTrendingFreeActivity(b)) {
        trendingFree++;
      }
      if (isCollectedInvoiceActivity(b)) {
        collectedInvs++;
      }
      if (isUnpaidActivity(b)) {
        unpaidCount++;
      }

      // 4. Overdue review (> 48h in progress and no map)
      if (!hasMap && b.googleSyncStatus === 'in_progress') {
        const submitTime = b.googleSyncDate
          ? new Date(b.googleSyncDate).getTime()
          : b.createdDate
          ? new Date(b.createdDate).getTime()
          : 0;
        if (submitTime > 0 && (now - submitTime > TWO_DAYS_MS)) {
          overdueRevBiz.push(b);
          overdueRevIds.add(b.id);
        }
      }

      // 5. Overdue CRM follow-up
      if (isBusinessFollowUpOverdue(b)) {
        overdueFollowBiz.push(b);
        overdueFollowIds.add(b.id);
      }

      // 6. Verified with debt
      const isExemptDebt = Boolean(
        b.isFeeExempt ||
        (b.packagePrice || 0) === 0 ||
        b.packageId === 'pkg_exempt' ||
        b.packageId === 'pkg_already_on_google' ||
        b.registrationType === 'already_on_google'
      );
      if (!isExemptDebt && hasMap) {
        const pkgDebt = Math.max(0, (b.packagePrice || 0) - (b.amountPaid || 0));
        const totalRemaining = pkgDebt + addInvsDebt;
        if (totalRemaining > 0) {
          verWithDebtBiz.push(b);
          verWithDebtIds.add(b.id);
          verWithDebtSum += totalRemaining;
        }
      }

      // 7. Category group stats
      const group = getCategoryGroupFor(b.category, b.description);
      if (group) {
        catMap.set(group, (catMap.get(group) || 0) + 1);
      }
    }

    const collRate = contractVal > 0 ? ((rev / contractVal) * 100).toFixed(1) : '0';
    const verRate = realBusinesses.length > 0 ? ((verified / realBusinesses.length) * 100).toFixed(1) : '0';

    const catStats = Array.from(catMap.entries())
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalRevenue: rev,
      totalContractValue: contractVal,
      totalDebt: debt,
      collectionRate: collRate,
      exemptCount: exempt,
      verifiedCount: verified,
      inProgressCount: inProgress,
      notSubmittedCount: notSubmitted,
      directoryApprovedCount: dirApproved,
      pendingApprovalCount: pendingAppr,
      trendingFreeCount: trendingFree,
      collectedInvoicesCount: collectedInvs,
      unpaidBusinessesCount: unpaidCount,
      verificationRate: verRate,
      overdueReviewBusinesses: overdueRevBiz,
      overdueReviewCount: overdueRevBiz.length,
      overdueReviewIds: overdueRevIds,
      overdueFollowUpBusinesses: overdueFollowBiz,
      overdueFollowUpCount: overdueFollowBiz.length,
      overdueFollowUpIds: overdueFollowIds,
      verifiedWithDebtBusinesses: verWithDebtBiz,
      verifiedWithDebtCount: verWithDebtBiz.length,
      verifiedWithDebtTotal: verWithDebtSum,
      verifiedWithDebtIds: verWithDebtIds,
      categoryStats: catStats,
    };
  }, [realBusinesses]);

  // CRM Leads Stats
  const leadStats = useMemo(() => {
    const total = leads.length;
    let pendingFollowup = 0;
    let contacted = 0;
    let converted = 0;
    let highInterest = 0;

    for (let i = 0; i < leads.length; i++) {
      const l = leads[i];
      if (l.status === 'pending_followup') pendingFollowup++;
      if (l.status === 'contacted') contacted++;
      if (l.status === 'converted') converted++;
      if (l.interestLevel === 'high') highInterest++;
    }

    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    return { total, pendingFollowup, contacted, converted, highInterest, conversionRate };
  }, [leads]);

  // Combined Governorate Breakdown & Package Share Breakdown in a single pass
  const { governorateStats, packageStats } = useMemo(() => {
    const govMap = new Map<string, { count: number; revenue: number; verified: number; exempt: number }>();
    const pkgMap = new Map<string, { count: number; revenue: number }>();

    for (let i = 0; i < businesses.length; i++) {
      const b = businesses[i];
      if (!b) continue;

      // Governorate stats
      const gov = b.governorate || 'القاهرة';
      const existingGov = govMap.get(gov) || { count: 0, revenue: 0, verified: 0, exempt: 0 };
      existingGov.count += 1;
      if (!b.isFeeExempt && (b.packagePrice || 0) > 0) {
        existingGov.revenue += (b.amountPaid || 0);
      } else {
        existingGov.exempt += 1;
      }
      const addInvsPaid = (b.additionalInvoices || []).reduce((sum, inv) => sum + (Number(inv.amountPaid) || 0), 0);
      existingGov.revenue += addInvsPaid;
      if (b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced') {
        existingGov.verified += 1;
      }
      govMap.set(gov, existingGov);

      // Package stats
      const isExempt = b.isFeeExempt || b.packagePrice === 0;
      const pkgTitle = isExempt ? 'أنشطة رائجة بالمنطقة (إدراج مجاني بدون رسوم)' : (b.packageTitle || b.packageName || 'الباقة الأساسية');
      const existingPkg = pkgMap.get(pkgTitle) || { count: 0, revenue: 0 };
      existingPkg.count += 1;
      existingPkg.revenue += isExempt ? 0 : (b.packagePrice || 0);
      pkgMap.set(pkgTitle, existingPkg);

      if (b.additionalInvoices && b.additionalInvoices.length > 0) {
        for (let j = 0; j < b.additionalInvoices.length; j++) {
          const inv = b.additionalInvoices[j];
          const invTitle = 'فواتير خدمات إضافية للمنصة';
          const existingInv = pkgMap.get(invTitle) || { count: 0, revenue: 0 };
          existingInv.count += 1;
          existingInv.revenue += Number(inv.amount) || 0;
          pkgMap.set(invTitle, existingInv);
        }
      }
    }

    const sortedGov = Array.from(govMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);

    const sortedPkg = Array.from(pkgMap.entries())
      .map(([title, data]) => ({
        title,
        count: data.count,
        revenue: data.revenue,
        percentage: businesses.length > 0 ? ((data.count / businesses.length) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.count - a.count);

    return { governorateStats: sortedGov, packageStats: sortedPkg };
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
    const ARABIC_MONTH_NAMES = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const monthsMap = new Map<string, {
      monthKey: string;
      monthLabel: string;
      grossRevenue: number;
      repCommissions: number;
      netPlatform: number;
      verifiedCount: number;
      totalBizCount: number;
      disbursedPayouts: number;
      cashRetainedCommissions: number;
      repsActive: Set<string>;
      repEarningsMap: Map<string, { name: string; earnings: number; count: number }>;
    }>();

    realBusinesses.forEach((b) => {
      const d = b.createdDate ? new Date(b.createdDate) : new Date();
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${ARABIC_MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

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
          cashRetainedCommissions: 0,
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

        if (b.paymentMethod === 'cash_by_rep' && repShare > 0) {
          m.cashRetainedCommissions += repShare;
        }

        if (isFieldRep && repShare > 0) {
          const repIdentifier = b.repId || b.repName || 'rep';
          m.repsActive.add(repIdentifier);

          const curRep = m.repEarningsMap.get(repIdentifier) || { name: b.repName || rep?.name || 'مندوب معتمد', earnings: 0, count: 0 };
          curRep.earnings += repShare;
          curRep.count += 1;
          m.repEarningsMap.set(repIdentifier, curRep);
        }
      }

      // Add platform electronic revenue from additional service invoices
      if (b.additionalInvoices && b.additionalInvoices.length > 0) {
        b.additionalInvoices.forEach((inv) => {
          const invDate = inv.issueDate || inv.createdAt ? new Date(inv.issueDate || inv.createdAt) : d;
          const invMonthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`;
          const invMonthLabel = `${ARABIC_MONTH_NAMES[invDate.getMonth()]} ${invDate.getFullYear()}`;

          if (!monthsMap.has(invMonthKey)) {
            monthsMap.set(invMonthKey, {
              monthKey: invMonthKey,
              monthLabel: invMonthLabel,
              grossRevenue: 0,
              repCommissions: 0,
              netPlatform: 0,
              verifiedCount: 0,
              totalBizCount: 0,
              disbursedPayouts: 0,
              cashRetainedCommissions: 0,
              repsActive: new Set(),
              repEarningsMap: new Map(),
            });
          }

          const invMonth = monthsMap.get(invMonthKey)!;
          const invPaid = Number(inv.amountPaid) || 0;
          invMonth.grossRevenue += invPaid;
          invMonth.netPlatform += invPaid; // 100% platform electronic revenue
        });
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
        let topRep = { name: '', earnings: 0 };
        m.repEarningsMap.forEach((val) => {
          if (val.earnings > topRep.earnings) topRep = val;
        });

        const activeRepsCount = Math.max(1, m.repsActive.size);
        const avgRepIncome = Math.round(m.repCommissions / activeRepsCount);
        
        let topRepName = topRep.name;
        if (!topRepName) {
          topRepName = m.grossRevenue > 0 && m.repCommissions === 0 ? 'تسجيل إداري (100% للمنصة)' : '-';
        }

        const totalActualDisbursed = m.cashRetainedCommissions + m.disbursedPayouts;

        return {
          ...m,
          topRepName,
          topRepEarnings: topRep.earnings,
          avgRepIncome,
          totalActualDisbursed,
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
    pendingApprovalCount,
    trendingFreeCount,
    collectedInvoicesCount,
    unpaidBusinessesCount,
    verificationRate,
    leadStats,
    overdueReviewBusinesses,
    overdueReviewCount,
    overdueReviewIds,
    overdueFollowUpBusinesses,
    overdueFollowUpCount,
    overdueFollowUpIds,
    verifiedWithDebtBusinesses,
    verifiedWithDebtCount,
    verifiedWithDebtTotal,
    verifiedWithDebtIds,
    governorateStats,
    categoryStats,
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
