import { useMemo } from 'react';
import { Business, Representative, InterestedLead, PayoutRequest } from '../../../types';
import { calculateRepSettlement } from '../../../utils/commission';
import { SupervisorMetrics } from '../types';

export interface UseSupervisorMetricsProps {
  businesses: Business[];
  representatives: Representative[];
  leads?: InterestedLead[];
  payoutRequests?: PayoutRequest[];
  selectedGov: string;
}

export function exportGovernorateToCsv(businesses: Business[], selectedGov: string): boolean {
  try {
    const headers = ['المعرف', 'اسم النشاط', 'المدينة', 'المندوب', 'الهاتف', 'حالة الاعتماد', 'حالة السداد', 'المبلغ'];
    const rows = businesses.map((b) => [
      b.id,
      `"${b.nameAr.replace(/"/g, '""')}"`,
      `"${b.city}"`,
      `"${b.repName || 'غير محدد'}"`,
      `"${b.phone}"`,
      b.verificationStatus === 'verified' ? 'معتمد' : 'قيد المراجعة',
      b.paymentStatus === 'fully_paid' ? 'مسدد' : 'غير مسدد',
      b.amountPaid || 0,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `دليلك_محافظة_${selectedGov}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export const useSupervisorMetrics = ({
  businesses,
  representatives,
  leads = [],
  payoutRequests = [],
  selectedGov,
}: UseSupervisorMetricsProps) => {
  // 1. Governorate-Scoped Entities (High Performance Memos)
  const scopedBusinesses = useMemo(() => {
    const govClean = selectedGov.trim().toLowerCase();
    return businesses.filter(
      (b) => (b.governorate || '').trim().toLowerCase() === govClean
    );
  }, [businesses, selectedGov]);

  const scopedReps = useMemo(() => {
    const govClean = selectedGov.trim().toLowerCase();
    return representatives.filter(
      (r) => (r.governorate || '').trim().toLowerCase() === govClean
    );
  }, [representatives, selectedGov]);

  const scopedRepsMap = useMemo(() => {
    const map = new Map<string, Representative>();
    scopedReps.forEach((r) => {
      map.set(r.id.toLowerCase(), r);
      if (r.name) map.set(r.name.toLowerCase().trim(), r);
    });
    return map;
  }, [scopedReps]);

  const scopedLeads = useMemo(() => {
    const govClean = selectedGov.trim().toLowerCase();
    return leads.filter(
      (l) => (l.governorate || '').trim().toLowerCase() === govClean
    );
  }, [leads, selectedGov]);

  const scopedPayoutRequests = useMemo(() => {
    return payoutRequests.filter((p) => {
      const repId = (p.repId || '').toLowerCase().trim();
      const repName = (p.repName || '').toLowerCase().trim();
      return scopedRepsMap.has(repId) || scopedRepsMap.has(repName);
    });
  }, [payoutRequests, scopedRepsMap]);

  // 2. High-Performance Scoped Metrics
  const metrics: SupervisorMetrics = useMemo(() => {
    const totalBusinesses = scopedBusinesses.length;
    const verifiedBusinesses = scopedBusinesses.filter(
      (b) => b.verificationStatus === 'verified'
    ).length;
    const pendingBusinesses = scopedBusinesses.filter(
      (b) => b.verificationStatus === 'pending' || b.verificationStatus === 'in_progress'
    ).length;
    const unpaidBusinesses = scopedBusinesses.filter(
      (b) => b.paymentStatus === 'unpaid'
    ).length;

    const totalReps = scopedReps.length;
    const activeReps = scopedReps.filter((r) => r.status === 'active').length;

    // Governorate Target Calculation
    const targetMonthTotal = scopedReps.reduce(
      (acc, r) => acc + (r.targetMonth || 25),
      0
    );
    const effectiveGovTarget = targetMonthTotal > 0 ? targetMonthTotal : 25;
    const targetPercent = Math.min(
      100,
      Math.round((totalBusinesses / effectiveGovTarget) * 100)
    );

    // Financial settlements per rep
    let totalCashInRepsHands = 0;
    let totalDebtToPlatform = 0;

    scopedReps.forEach((rep) => {
      const repBiz = scopedBusinesses.filter(
        (b) => b.repId === rep.id || b.repName === rep.name
      );
      const repSettlement = calculateRepSettlement(
        rep.id,
        repBiz,
        rep.commissionRate || 42.86,
        scopedPayoutRequests,
        0
      );
      if (repSettlement.totalCashInHand > 0) {
        totalCashInRepsHands += repSettlement.totalCashInHand;
      }
      if (repSettlement.isDebtToPlatform) {
        totalDebtToPlatform += repSettlement.debtToPlatformAmount;
      }
    });

    const pendingPayouts = scopedPayoutRequests.filter(
      (p) => p.status === 'pending'
    );
    const pendingPayoutsAmount = pendingPayouts.reduce(
      (acc, p) => acc + (p.amount || 0),
      0
    );

    return {
      totalBusinesses,
      verifiedBusinesses,
      pendingBusinesses,
      unpaidBusinesses,
      totalReps,
      activeReps,
      effectiveGovTarget,
      targetPercent,
      totalCashInRepsHands,
      totalDebtToPlatform,
      pendingPayoutsCount: pendingPayouts.length,
      pendingPayoutsAmount,
    };
  }, [scopedBusinesses, scopedReps, scopedPayoutRequests]);

  const exportData = () => exportGovernorateToCsv(scopedBusinesses, selectedGov);

  return {
    scopedBusinesses,
    scopedReps,
    scopedRepsMap,
    scopedLeads,
    scopedPayoutRequests,
    metrics,
    exportData,
  };
};
