import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DocViewerModal } from './DocViewerModal';
import { Business, Representative, PaymentGatewayConfig, UserRole, PayoutRequest, User } from '../types';
import { EGYPT_GOVERNORATES } from '../data/mockData';
import { calculateRepSettlement, calculateRepCommissionFromCash, PAYOUT_METHOD_LABELS } from '../utils/commission';
import { formatActivityDateTime, sortBusinessesNewestFirst } from '../utils/dateFormatters';
import { getRepReferralCode, isReferralSystemUnlocked, isReferredByInviter } from '../utils/referral';
import { compressImageFile } from '../utils/imageCompressor';
import { exportBusinessesToCsv, exportRepsToCsv, exportPayoutsToCsv } from '../utils/exportCsv';
import { canUserDeleteAccount } from '../utils/permissions';
import { UserAvatar } from './UserAvatar';
import { BusinessEditModal } from './BusinessEditModal';
import { GoogleMapsSyncModal } from './GoogleMapsSyncModal';
import { PermissionsModal } from './PermissionsModal';
import { RepAccountDossierModal } from './RepAccountDossierModal';
import {
  ShieldCheck,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Zap,
  Users,
  Plus,
  Edit,
  Trash2,
  Download,
  ChevronRight,
  ChevronLeft,
  Search,
  Phone,
  FileText,
  FileSignature,
  CreditCard,
  UserCheck,
  Briefcase,
  Crown,
  Calculator,
  Store,
  MapPin,
  Settings,
  X,
  Check,
  Eye,
  FileCheck,
  Compass,
  PieChart,
  BarChart3,
  Award,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Calendar,
  TrendingUp,
  Printer,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser?: User | null;
  businesses: Business[];
  representatives: Representative[];
  paymentConfig: PaymentGatewayConfig;
  payoutRequests?: PayoutRequest[];
  onUpdateBusiness: (biz: Business) => void;
  onDeleteBusiness: (id: string) => void;
  onAddRepresentative: (rep: Partial<Representative>) => void;
  onUpdateRepresentative?: (rep: Representative) => void;
  onDeleteRepresentative?: (id: string) => void;
  onUpdatePaymentConfig: (config: PaymentGatewayConfig) => void;
  onUpdatePayoutRequest?: (payout: PayoutRequest) => void;
  onShowInvoice: (biz: Business) => void;
  onCollectPayment?: (biz: Business) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  businesses,
  representatives,
  paymentConfig,
  payoutRequests = [],
  onUpdateBusiness,
  onDeleteBusiness,
  onAddRepresentative,
  onUpdateRepresentative,
  onDeleteRepresentative,
  onUpdatePaymentConfig,
  onUpdatePayoutRequest,
  onShowInvoice,
  onCollectPayment,
}) => {
  // Main Tab State (5 Operational Tabs)
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'businesses' | 'reps' | 'gateways' | 'payouts'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSubtab = urlParams.get('subtab');
    if (urlSubtab && ['overview', 'businesses', 'reps', 'gateways', 'payouts'].includes(urlSubtab)) {
      return urlSubtab as any;
    }

    const savedSubtab = localStorage.getItem('dalelak_active_admin_tab');
    if (savedSubtab && ['overview', 'businesses', 'reps', 'gateways', 'payouts'].includes(savedSubtab)) {
      return savedSubtab as any;
    }

    return 'overview';
  });

  const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);

  // Payout Management States
  const [payoutFilter, setPayoutFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [activePayoutModal, setActivePayoutModal] = useState<{
    payout: PayoutRequest;
    action: 'approve' | 'reject';
  } | null>(null);
  const [payoutTransactionRef, setPayoutTransactionRef] = useState<string>('');
  const [payoutAdminNotes, setPayoutAdminNotes] = useState<string>('');
  const [selectedReceiptPhoto, setSelectedReceiptPhoto] = useState<string | null>(null);
  const [expandedAuditPayoutId, setExpandedAuditPayoutId] = useState<string | null>(null);

  // Search & Filter States
  const [bizSearchQuery, setBizSearchQuery] = useState<string>('');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');

  const [accountSearchQuery, setAccountSearchQuery] = useState<string>('');
  const [accountRoleFilter, setAccountRoleFilter] = useState<string>('all');
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>('all');

  // Pagination States for High Scale (Tens of Thousands of records)
  const [bizPage, setBizPage] = useState<number>(1);
  const [bizPageSize, setBizPageSize] = useState<number>(25);

  const [accountPage, setAccountPage] = useState<number>(1);
  const [accountPageSize, setAccountPageSize] = useState<number>(25);

  const [payoutPage, setPayoutPage] = useState<number>(1);
  const [payoutPageSize, setPayoutPageSize] = useState<number>(25);

  // Reset pagination to page 1 on search or filter change
  useEffect(() => {
    setBizPage(1);
  }, [bizSearchQuery, governorateFilter, paymentFilter, verificationFilter, bizPageSize]);

  useEffect(() => {
    setAccountPage(1);
  }, [accountSearchQuery, accountRoleFilter, accountStatusFilter, accountPageSize]);

  useEffect(() => {
    setPayoutPage(1);
  }, [payoutFilter, payoutPageSize]);

  // Sync activeAdminTab state with localStorage and browser URL query params
  useEffect(() => {
    if (activeAdminTab) {
      localStorage.setItem('dalelak_active_admin_tab', activeAdminTab);
      const url = new URL(window.location.href);
      if (url.searchParams.get('subtab') !== activeAdminTab) {
        url.searchParams.set('subtab', activeAdminTab);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activeAdminTab]);

  // ---------------------------------------------------------------------------
  // MODAL STATES
  // ---------------------------------------------------------------------------
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [selectedDossierRep, setSelectedDossierRep] = useState<Representative | null>(null);

  // Keep editingBusiness in sync with businesses array updates (such as payment updates)
  useEffect(() => {
    if (editingBusiness) {
      const refreshed = businesses.find((b) => b.id === editingBusiness.id);
      if (
        refreshed &&
        (refreshed.amountPaid !== editingBusiness.amountPaid ||
          refreshed.paymentStatus !== editingBusiness.paymentStatus ||
          refreshed.verificationStatus !== editingBusiness.verificationStatus)
      ) {
        setEditingBusiness(refreshed);
      }
    }
  }, [businesses]);

  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [modalRole, setModalRole] = useState<UserRole>('rep');
  const [modalName, setModalName] = useState<string>('');
  const [modalEmail, setModalEmail] = useState<string>('');
  const [modalPhone, setModalPhone] = useState<string>('');
  const [modalGov, setModalGov] = useState<string>('القاهرة');
  const [modalTarget, setModalTarget] = useState<number>(25);
  const [modalCommission, setModalCommission] = useState<number>(42.86);
  const [modalStatus, setModalStatus] = useState<'active' | 'suspended'>('active');
  const [modalPassword, setModalPassword] = useState<string>('Aa123456');
  const [modalReferralCode, setModalReferralCode] = useState<string>('');
  const [modalReferredByCode, setModalReferredByCode] = useState<string>('');
  const [modalAdminBypassReferral, setModalAdminBypassReferral] = useState<boolean>(false);

  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [vodaNumber, setVodaNumber] = useState<string>(paymentConfig.vodafoneCashNumber || '01143888355');
  const [vodaNumber2, setVodaNumber2] = useState<string>(paymentConfig.vodafoneCashNumber2 || '01556221141');
  const [instaHandle, setInstaHandle] = useState<string>(paymentConfig.instaPayHandle || '@daz31181');

  const [previewAvatarRep, setPreviewAvatarRep] = useState<Representative | null>(null);
  const [selectedAdminDoc, setSelectedAdminDoc] = useState<{ type: 'field_letter' | 'digital_badge' | 'rep_contract', rep: Representative } | null>(null);
  const [syncModalBiz, setSyncModalBiz] = useState<Business | null>(null);

  // ---------------------------------------------------------------------------
  // COMPREHENSIVE STATISTICS CALCULATIONS (Excluding fee-exempt popular area activities)
  // ---------------------------------------------------------------------------
  const totalRevenue = businesses.reduce((acc, b) => (b.isFeeExempt || b.packagePrice === 0) ? acc : acc + (b.amountPaid || 0), 0);
  const totalContractValue = businesses.reduce((acc, b) => (b.isFeeExempt || b.packagePrice === 0) ? acc : acc + (b.packagePrice || 0), 0);
  const totalDebt = businesses.reduce((acc, b) => (b.isFeeExempt || b.packagePrice === 0) ? acc : acc + Math.max(0, (b.packagePrice || 0) - (b.amountPaid || 0)), 0);
  const collectionRate = totalContractValue > 0 ? ((totalRevenue / totalContractValue) * 100).toFixed(1) : '0';
  const exemptCount = businesses.filter((b) => b.isFeeExempt || b.packagePrice === 0).length;

  // Verification Pipeline Metrics
  const verifiedCount = businesses.filter((b) => b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced').length;
  const inProgressCount = businesses.filter(
    (b) => (b.verificationStatus === 'in_progress' || b.googleSyncStatus === 'in_progress') && b.verificationStatus !== 'verified' && b.googleSyncStatus !== 'synced'
  ).length;
  const notSubmittedCount = businesses.filter(
    (b) => b.verificationStatus !== 'verified' && b.verificationStatus !== 'in_progress' && b.googleSyncStatus !== 'synced' && b.googleSyncStatus !== 'in_progress'
  ).length;
  const verificationRate = businesses.length > 0 ? ((verifiedCount / businesses.length) * 100).toFixed(1) : '0';

  // Overdue Google Verification Detection: ONLY for businesses submitted for Google review (in_progress) and NOT verified, and > 48 hours passed
  const overdueReviewBusinesses = useMemo(() => {
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return businesses.filter((b) => {
      // 1. If already verified, NEVER trigger overdue alert!
      const isVerified = b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced';
      if (isVerified) return false;

      // 2. Must be actively submitted and pending in Google review
      const isInProgress = (b.verificationStatus === 'in_progress' || b.googleSyncStatus === 'in_progress');
      if (!isInProgress) return false;

      // 3. Check time elapsed since review submission
      const submitTime = b.googleSyncDate
        ? new Date(b.googleSyncDate).getTime()
        : b.createdDate
        ? new Date(b.createdDate).getTime()
        : 0;

      return submitTime > 0 && (now - submitTime > TWO_DAYS_MS);
    });
  }, [businesses]);

  const overdueReviewCount = overdueReviewBusinesses.length;

  // Verified Businesses with Unpaid / Remaining Balance (Excluding fee-exempt activities)
  const verifiedWithDebtBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      if (b.isFeeExempt || b.packagePrice === 0) return false;
      const isLive = b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced';
      const remaining = Math.max(0, (b.packagePrice || 0) - (b.amountPaid || 0));
      return isLive && remaining > 0;
    });
  }, [businesses]);

  const verifiedWithDebtCount = verifiedWithDebtBusinesses.length;
  const verifiedWithDebtTotal = verifiedWithDebtBusinesses.reduce(
    (sum, b) => (b.isFeeExempt || b.packagePrice === 0) ? sum : sum + Math.max(0, (b.packagePrice || 0) - (b.amountPaid || 0)),
    0
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

  // Merged & Strictly Deduplicated Representatives List
  const mergedAdminReps = useMemo(() => {
    const seenIds = new Set<string>();
    const seenEmails = new Set<string>();
    const result: Representative[] = [];

    representatives.forEach((r) => {
      const cleanEmail = (r.email || '').trim().toLowerCase();
      const id = r.id || '';
      if (id && seenIds.has(id)) return;
      if (cleanEmail && seenEmails.has(cleanEmail)) return;
      if (id) seenIds.add(id);
      if (cleanEmail) seenEmails.add(cleanEmail);
      result.push(r);
    });
    return result;
  }, [representatives]);

  // Reps Performance Table with 59-minute Online / Presence Status
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
        
        // Presence status: Online if last activity was within 59 minutes or if currently active user
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
        const settlement = calculateRepSettlement(rep.id, repBiz, effectiveRate, payoutRequests);
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
        };
      })
      .sort((a, b) => b.totalBiz - a.totalBiz);
  }, [mergedAdminReps, businesses, payoutRequests]);

  // ── MASTER FINANCIAL ACCOUNTING & REVENUE MODEL ──
  const totalApprovedPayouts = (payoutRequests || [])
    .filter((p) => p.status === 'approved' && (!p.type || p.type === 'payout'))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalPendingPayouts = (payoutRequests || [])
    .filter((p) => p.status === 'pending' && (!p.type || p.type === 'payout'))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalRemittancesReceived = (payoutRequests || [])
    .filter((p) => p.status === 'approved' && p.type === 'remittance')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalCashInRepsHands = businesses.reduce((acc, b) => {
    if (b.isFeeExempt || b.packagePrice === 0) return acc;
    if ((b.cashCollectedByRep || 0) > 0) return acc + (b.cashCollectedByRep || 0);
    if ((b.paymentMethod as string) === 'cash_by_rep') return acc + (b.amountPaid || 0);
    return acc;
  }, 0);

  const totalEarnedCommissions = useMemo(() => {
    return mergedAdminReps.reduce((sum, rep) => {
      // Only field reps ('rep') receive commission expense from platform; Admin/Managers direct activities yield 0 rep commission
      if (rep.role !== 'rep') return sum;
      const repBiz = businesses.filter((b) => b.repId === rep.id || b.repName === rep.name || b.repId === rep.phone);
      const repRate = (rep.commissionRate && rep.commissionRate < 100) ? rep.commissionRate : 42.86;
      const settlement = calculateRepSettlement(rep.id, repBiz, repRate, payoutRequests);
      return sum + settlement.totalEarnedCommission;
    }, 0);
  }, [mergedAdminReps, businesses, payoutRequests]);

  const netPlatformRevenue = Math.max(0, totalRevenue - totalEarnedCommissions);

  // 💵 Commissions retained / received in cash directly by representatives
  const totalCommissionsRetainedInCash = useMemo(() => {
    return mergedAdminReps.reduce((sum, rep) => {
      if (rep.role !== 'rep') return sum;
      const repBiz = businesses.filter((b) => b.repId === rep.id || b.repName === rep.name || b.repId === rep.phone);
      const repRate = (rep.commissionRate && rep.commissionRate < 100) ? rep.commissionRate : 42.86;
      return sum + calculateRepCommissionFromCash(repBiz, repRate);
    }, 0);
  }, [mergedAdminReps, businesses]);

  // ── ⚖️ ADVANCED CASH & COMMISSIONS SETTLEMENT MATRIX ──
  const netRepsSettlementMatrix = useMemo(() => {
    let totalRepsCashDebtToPlatform = 0; // Net physical cash in reps hands to be remitted to platform
    let totalPlatformPayableToReps = 0;   // Net withdrawable credit platform owes to reps for online receipts
    let totalRepCashInHand = 0;

    mergedAdminReps.forEach((rep) => {
      if (rep.role !== 'rep') return;
      const repBiz = businesses.filter((b) => b.repId === rep.id || b.repName === rep.name || b.repId === rep.phone);
      const repRate = (rep.commissionRate && rep.commissionRate < 100) ? rep.commissionRate : 42.86;
      const settlement = calculateRepSettlement(rep.id, repBiz, repRate, payoutRequests);
      
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

  // ── MONTHLY FINANCIAL MATRIX & BREAKDOWN ──
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

    businesses.forEach((b) => {
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
        if ((b.cashCollectedByRep || 0) > 0 || (b.paymentMethod as string) === 'cash_by_rep') {
          // cash tracked
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
  }, [businesses, payoutRequests, mergedAdminReps]);


  // Filtered Businesses for Businesses Tab
  const filteredBusinesses = useMemo(
    () =>
      sortBusinessesNewestFirst(
        businesses.filter((b) => {
          if (
            bizSearchQuery &&
            !b.nameAr.includes(bizSearchQuery) &&
            !b.ownerName.includes(bizSearchQuery) &&
            !b.ownerPhone.includes(bizSearchQuery)
          ) {
            return false;
          }
          if (governorateFilter !== 'all' && !b.governorate.includes(governorateFilter)) {
            return false;
          }
          if (paymentFilter !== 'all' && b.paymentStatus !== paymentFilter) {
            return false;
          }
          if (verificationFilter === 'not_submitted') {
            const isNotSubmitted =
              b.verificationStatus !== 'verified' &&
              b.verificationStatus !== 'in_progress' &&
              b.googleSyncStatus !== 'synced' &&
              b.googleSyncStatus !== 'in_progress';
            if (!isNotSubmitted) return false;
          } else if (verificationFilter === 'in_progress') {
            const isInProgress =
              (b.verificationStatus === 'in_progress' || b.googleSyncStatus === 'in_progress') &&
              b.verificationStatus !== 'verified' &&
              b.googleSyncStatus !== 'synced';
            if (!isInProgress) return false;
          } else if (verificationFilter === 'overdue') {
            return overdueReviewBusinesses.some((ov) => ov.id === b.id);
          } else if (verificationFilter === 'verified_debt') {
            return verifiedWithDebtBusinesses.some((vd) => vd.id === b.id);
          } else if (verificationFilter === 'verified') {
            if (b.verificationStatus !== 'verified' && b.googleSyncStatus !== 'synced') return false;
          } else if (verificationFilter === 'rejected') {
            if (b.verificationStatus !== 'rejected') return false;
          } else if (verificationFilter !== 'all') {
            if (b.verificationStatus !== verificationFilter) return false;
          }
          return true;
        })
      ),
    [businesses, bizSearchQuery, governorateFilter, paymentFilter, verificationFilter, overdueReviewBusinesses]
  );

  // Filtered Accounts for Accounts Tab
  const filteredAccounts = useMemo(
    () =>
      mergedAdminReps.filter((acc) => {
        if (
          accountSearchQuery &&
          !acc.name.includes(accountSearchQuery) &&
          !acc.email.includes(accountSearchQuery) &&
          !acc.phone.includes(accountSearchQuery)
        ) {
          return false;
        }
        if (accountRoleFilter !== 'all') {
          const accRole = acc.role || 'rep';
          if (accRole !== accountRoleFilter) return false;
        }
        if (accountStatusFilter !== 'all') {
          const accStatus = acc.status || 'active';
          if (accStatus !== accountStatusFilter) return false;
        }
        return true;
      }),
    [mergedAdminReps, accountSearchQuery, accountRoleFilter, accountStatusFilter]
  );

  // Paginated Businesses
  const totalBizPages = Math.max(1, Math.ceil(filteredBusinesses.length / bizPageSize));
  const pagedBusinesses = useMemo(() => {
    const start = (bizPage - 1) * bizPageSize;
    return filteredBusinesses.slice(start, start + bizPageSize);
  }, [filteredBusinesses, bizPage, bizPageSize]);

  // Paginated Accounts
  const totalAccountPages = Math.max(1, Math.ceil(filteredAccounts.length / accountPageSize));
  const pagedAccounts = useMemo(() => {
    const start = (accountPage - 1) * accountPageSize;
    return filteredAccounts.slice(start, start + accountPageSize);
  }, [filteredAccounts, accountPage, accountPageSize]);

  // Filtered and Paginated Payouts
  const filteredPayouts = useMemo(() => {
    return payoutRequests.filter((p) => payoutFilter === 'all' || p.status === payoutFilter);
  }, [payoutRequests, payoutFilter]);

  const totalPayoutPages = Math.max(1, Math.ceil(filteredPayouts.length / payoutPageSize));
  const pagedPayouts = useMemo(() => {
    const start = (payoutPage - 1) * payoutPageSize;
    return filteredPayouts.slice(start, start + payoutPageSize);
  }, [filteredPayouts, payoutPage, payoutPageSize]);

  // ---------------------------------------------------------------------------
  // HANDLERS FOR MODALS & ACTIONS
  // ---------------------------------------------------------------------------
  const openAddAccountModal = () => {
    setEditingAccId(null);
    setModalRole('rep');
    setModalName('');
    setModalEmail('');
    setModalPhone('');
    setModalGov('القاهرة');
    setModalTarget(25);
    setModalCommission(42.86);
    setModalStatus('active');
    setModalPassword('Aa123456');
    setModalReferralCode(`DALIL-${Date.now().toString().slice(-4)}`);
    setModalReferredByCode('');
    setModalAdminBypassReferral(true);
    setShowAccountModal(true);
  };

  const openEditAccountModal = (rep: Representative) => {
    setEditingAccId(rep.id);
    setModalRole(rep.role || 'rep');
    setModalName(rep.name);
    setModalEmail(rep.email);
    setModalPhone(rep.phone);
    setModalGov(rep.governorate || 'القاهرة');
    setModalTarget(rep.targetMonth || 25);
    setModalCommission(rep.commissionRate || 42.86);
    setModalStatus(rep.status || 'active');
    setModalPassword(rep.password || 'Aa123456');
    setModalReferralCode(getRepReferralCode(rep));
    setModalReferredByCode(rep.referredByCode || '');
    setModalAdminBypassReferral(Boolean(rep.adminBypassReferral || rep.referralUnlocked));
    setShowAccountModal(true);
  };

  const handleSaveAccountModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim()) return;

    if (editingAccId) {
      const existing = mergedAdminReps.find((r) => r.id === editingAccId);
      if (existing && onUpdateRepresentative) {
        onUpdateRepresentative({
          ...existing,
          name: modalName.trim(),
          email: modalEmail.trim() || existing.email,
          phone: modalPhone.trim() || existing.phone,
          governorate: modalGov,
          role: modalRole,
          targetMonth: Number(modalTarget) || 25,
          commissionRate: Number(modalCommission) || 42.86,
          status: modalStatus,
          password: modalPassword || existing.password || 'Aa123456',
          referralCode: modalReferralCode.trim().toUpperCase() || existing.referralCode,
          referredByCode: modalReferredByCode.trim().toUpperCase() || undefined,
          adminBypassReferral: modalAdminBypassReferral,
          referralUnlocked: modalAdminBypassReferral,
        });
      }
    } else {
      const newRepId = `rep_${Date.now()}`;
      onAddRepresentative({
        id: newRepId,
        name: modalName.trim(),
        email: modalEmail.trim() || `${newRepId}@daleelek.eg`,
        phone: modalPhone.trim() || '01000000000',
        governorate: modalGov,
        role: modalRole,
        targetMonth: Number(modalTarget) || 25,
        commissionRate: Number(modalCommission) || 42.86,
        status: modalStatus,
        password: modalPassword || 'Aa123456',
        referralCode: modalReferralCode.trim().toUpperCase() || `DALIL-${Date.now().toString().slice(-4)}`,
        referredByCode: modalReferredByCode.trim().toUpperCase() || undefined,
        adminBypassReferral: modalAdminBypassReferral,
        referralUnlocked: modalAdminBypassReferral,
      });
    }

    setShowAccountModal(false);
  };

  const handleSaveBusinessFromModal = (updated: Business) => {
    onUpdateBusiness(updated);
    setEditingBusiness(null);
  };

  const handleSavePaymentConfigModal = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePaymentConfig({
      ...paymentConfig,
      vodafoneCashNumber: vodaNumber.trim() || '01143888355',
      vodafoneCashNumber2: vodaNumber2.trim() || '01556221141',
      instaPayHandle: instaHandle.trim() || '@daz31181',
    });
    setShowPaymentModal(false);
  };

  // Render role badge helper with custom roleTitle priority
  const renderRoleBadge = (role: UserRole = 'rep', customTitle?: string) => {
    const label = customTitle?.trim() || (
      role === 'admin' ? 'مدير النظام' :
      role === 'supervisor' ? 'مشرف منطقة' :
      role === 'accountant' ? 'محاسب ومحصل' : 'مندوب ميداني'
    );

    switch (role) {
      case 'admin':
        return (
          <span className="bg-purple-500/15 text-purple-900 dark:text-purple-300 border border-purple-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs" title={label}>
            <ShieldCheck className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span className="max-w-[130px] truncate">{label}</span>
          </span>
        );
      case 'supervisor':
        return (
          <span className="bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs" title={label}>
            <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span className="max-w-[130px] truncate">{label}</span>
          </span>
        );
      case 'accountant':
        return (
          <span className="bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs" title={label}>
            <Calculator className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="max-w-[130px] truncate">{label}</span>
          </span>
        );
      default:
        return (
          <span className="bg-blue-500/15 text-blue-900 dark:text-blue-300 border border-blue-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs" title={label}>
            <Briefcase className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span className="max-w-[130px] truncate">{label}</span>
          </span>
        );
    }
  };

  // Scroll to top when switching admin sub-tabs
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeAdminTab]);

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-20 font-['Cairo',sans-serif]">
      {/* --------------------------------------------------------------------- */}
      {/* TOP HEADER & NAVIGATION TABS */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 sm:p-5 rounded-3xl shadow-sm flex flex-wrap items-center justify-between gap-4 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)]">
                {currentUser?.role === 'supervisor'
                  ? 'لوحة إدارة المنظومة (مشرف الإدارة)'
                  : currentUser?.role === 'accountant'
                  ? 'لوحة إدارة المنظومة (محاسب ومحصل)'
                  : 'لوحة تحكم مدير النظام'}
              </h2>
              <span className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {currentUser?.role === 'admin' ? '@daz31181' : currentUser?.name || 'إدارة دليلك'}
              </span>

              <button
                type="button"
                onClick={() => setShowPermissionsModal(true)}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5 transition-colors cursor-pointer mr-1"
                title="استعراض مصفوفة ودليل الصلاحيات والرتب"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>دليل الصلاحيات والرتب 🛡️</span>
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-bold mt-0.5">
              الإدارة المركزية المباشرة لتوثيقات الأنشطة والمناديب والمؤشرات المالية
            </p>
          </div>
        </div>

        {/* Tab Selector Navigation - 5 Core Operational Tabs */}
        <div className="w-full lg:w-auto flex items-center gap-1 sm:gap-1.5 bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-color)] text-xs shadow-inner overflow-x-auto scrollbar-none max-w-full">
          <button
            onClick={() => setActiveAdminTab('overview')}
            className={`px-3 sm:px-4 py-2 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeAdminTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>الإحصائيات</span>
          </button>
          
          <button
            onClick={() => setActiveAdminTab('businesses')}
            className={`px-3 sm:px-4 py-2 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeAdminTab === 'businesses'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Store className="w-4 h-4 shrink-0" />
            <span>الأنشطة ({businesses.length})</span>
            {notSubmittedCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('reps')}
            className={`px-3 sm:px-4 py-2 rounded-xl font-black transition-all relative cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeAdminTab === 'reps'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>الحسابات ({mergedAdminReps.length})</span>
            {mergedAdminReps.some((r) => r.status === 'suspended') && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('gateways')}
            className={`px-3 sm:px-4 py-2 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeAdminTab === 'gateways'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>بوابات الدفع</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('payouts')}
            className={`px-3 sm:px-4 py-2 rounded-xl font-black transition-all relative cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeAdminTab === 'payouts'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>صرف العمولات</span>
            {payoutRequests.filter((p) => p.status === 'pending').length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                {payoutRequests.filter((p) => p.status === 'pending').length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW & COMPREHENSIVE STATISTICS ONLY */}
      {/* --------------------------------------------------------------------- */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-4 animate-fade-in">
          {/* Top KPI Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Revenue & Collection Rate */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
                <span>إجمالي التحصيل المالي</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {totalRevenue.toLocaleString()} <span className="text-xs text-[var(--text-secondary)]">ج.م</span>
              </p>
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
                <span>نسبة التحصيل:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-sans">{collectionRate}%</span>
              </div>
            </div>

            {/* 2. Outstanding Debt */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
                <span>المستحقات المعلقة (المتبقي)</span>
                <AlertCircle className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-rose-500">
                {totalDebt.toLocaleString()} <span className="text-xs text-[var(--text-secondary)]">ج.م</span>
              </p>
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
                <span>إجمالي قيمة العقود:</span>
                <span className="font-bold font-sans">{totalContractValue.toLocaleString()} ج.م</span>
              </div>
            </div>

            {/* 3. Verified Businesses KPI */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
                <span>مؤشر التوثيق المعتمد</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {verifiedCount} <span className="text-xs text-[var(--text-secondary)]">نشاط ({verificationRate}%)</span>
              </p>
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
                <span>إجمالي الأنشطة:</span>
                <span className="font-bold font-sans">
                  {businesses.length} نشاط {exemptCount > 0 && <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">({exemptCount} رائج معفى)</span>}
                </span>
              </div>
            </div>

            {/* 4. Active Representatives & Team */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
                <span>فريق العمل والمناديب</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                {mergedAdminReps.length} <span className="text-xs text-[var(--text-secondary)]">عضو</span>
              </p>
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
                <span>المحافظات المغطاة:</span>
                <span className="font-bold font-sans text-amber-600 dark:text-amber-400">{governorateStats.length} محافظة</span>
              </div>
            </div>
          </div>


          {/* ── 🏛️ MASTER FINANCIAL ACCOUNTING & REVENUE BREAKDOWN ── */}
          <div className="bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-surface)] to-[var(--bg-card)] border-2 border-amber-500/30 rounded-3xl p-5 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[var(--text-primary)]">
                    النمط الحسابي الشامل للمنظومة والتحصيل المالي والعمولات
                  </h3>
                  <p className="text-[10.5px] text-[var(--text-muted)] font-medium">
                    توزيع الإيرادات المحصلة، عمولات فريق المناديب، وصافي أرباح المنظومة
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  صافي المنصة: {netPlatformRevenue.toLocaleString()} ج.م
                </span>
              </div>
            </div>

            {/* 6 Key Accounting Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center text-xs">
              <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] font-bold block">إجمالي المحصل الشامل</span>
                <span className="font-black text-base text-emerald-600 dark:text-emerald-400 font-mono block">
                  {totalRevenue.toLocaleString()} <span className="text-[10px]">ج</span>
                </span>
                <span className="text-[9px] text-[var(--text-muted)]">كافة باقات المنظومة</span>
              </div>

              <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] font-bold block">كاش محصل بيد المناديب</span>
                <span className="font-black text-base text-blue-600 dark:text-blue-400 font-mono block">
                  {totalCashInRepsHands.toLocaleString()} <span className="text-[10px]">ج</span>
                </span>
                <span className="text-[9px] text-[var(--text-muted)]">مقبوضات نقدية ميدانية</span>
              </div>

              <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30 space-y-1">
                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-black block">💵 عمولات استلمت نقداً</span>
                <span className="font-black text-base text-amber-600 dark:text-amber-400 font-mono block">
                  {totalCommissionsRetainedInCash.toLocaleString()} <span className="text-[10px]">ج</span>
                </span>
                <span className="text-[9px] text-amber-700/80 dark:text-amber-300/80 font-bold">استقطعها المندوب من الكاش</span>
              </div>

              <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] font-bold block">عمولات تم صرفها بحوالة</span>
                <span className="font-black text-base text-emerald-600 dark:text-emerald-400 font-mono block">
                  {totalApprovedPayouts.toLocaleString()} <span className="text-[10px]">ج</span>
                </span>
                <span className="text-[9px] text-[var(--text-muted)]">إلكتروني / إنستاباي / فودافون</span>
              </div>

              <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] font-bold block">إجمالي عمولات المناديب</span>
                <span className="font-black text-base text-indigo-600 dark:text-indigo-400 font-mono block">
                  {totalEarnedCommissions.toLocaleString()} <span className="text-[10px]">ج</span>
                </span>
                <span className="text-[9px] text-[var(--text-muted)]">كافة الاستحقاقات الشاملة</span>
              </div>

              <div className="bg-teal-500/10 p-3 rounded-2xl border border-teal-500/30 space-y-1">
                <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold block">صافي أرباح المنظومة</span>
                <span className="font-black text-base text-teal-600 dark:text-teal-400 font-mono block">
                  {netPlatformRevenue.toLocaleString()} <span className="text-[10px]">ج</span>
                </span>
                <span className="text-[9px] text-teal-600/80 dark:text-teal-300/80 font-bold">بعد استقطاع كافة العمولات</span>
              </div>
            </div>
          </div>

          {/* ── 📅 MONTHLY INCOME & REVENUE BREAKDOWN ── */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-black text-sm text-[var(--text-primary)]">
                    سجل الإيرادات والدخل الشهري لفريق المناديب والمنظومة
                  </h3>
                  <p className="text-[10.5px] text-[var(--text-muted)]">
                    تحليل الأداء المالي، متوسط دخل المندوب، وأرباح المنظومة عبر الشهور
                  </p>
                </div>
              </div>
              <span className="text-xs text-[var(--text-muted)] font-bold">
                السنة المالية الحالية
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
              <table className="w-full text-xs text-right border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[var(--input-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold">
                    <th className="p-3">الشهر / الفترة</th>
                    <th className="p-3 text-center">الأنشطة الموثقة</th>
                    <th className="p-3 text-center">إجمالي التحصيل</th>
                    <th className="p-3 text-center">عمولات المناديب</th>
                    <th className="p-3 text-center">متوسط دخل المندوب</th>
                    <th className="p-3 text-center">صافي المنصة</th>
                    <th className="p-3 text-center">المصروف فعلياً</th>
                    <th className="p-3 text-center">نجم الشهر 🌟</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {monthlyFinancialStats.map((m) => (
                    <tr key={m.monthKey} className="hover:bg-amber-500/5 transition-colors">
                      <td className="p-3 font-bold text-[var(--text-primary)]">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>{m.monthLabel}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono font-bold">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{m.verifiedCount}</span>
                        <span className="text-[10px] text-[var(--text-muted)]"> / {m.totalBizCount}</span>
                      </td>
                      <td className="p-3 text-center font-mono font-black text-[var(--text-primary)]">
                        {m.grossRevenue.toLocaleString()} ج.م
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                        {m.repCommissions.toLocaleString()} ج.م
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                        {m.avgRepIncome.toLocaleString()} ج.م
                      </td>
                      <td className="p-3 text-center font-mono font-black text-teal-600 dark:text-teal-400">
                        {m.netPlatform.toLocaleString()} ج.م
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {m.disbursedPayouts.toLocaleString()} ج.م
                      </td>
                      <td className="p-3 text-center">
                        {m.topRepEarnings > 0 ? (
                          <div className="inline-flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30 text-[10.5px]">
                            <Crown className="w-3 h-3 text-amber-500" />
                            <span className="font-bold text-amber-800 dark:text-amber-300">{m.topRepName}</span>
                            <span className="font-mono font-bold text-amber-600">({m.topRepEarnings} ج)</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[var(--text-muted)]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SMART OPERATIONAL NOTICES (Non-intrusive, Clean Warnings) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Notice 1: Unsubmitted Activities */}
            {notSubmittedCount > 0 ? (
              <div className="alert-card-danger p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="alert-icon-box w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="alert-title font-black text-sm">
                      يوجد ({notSubmittedCount}) أنشطة مسجلة لم تُرفع لخرائط جوجل بعد
                    </p>
                    <p className="alert-desc text-[11px] font-bold mt-0.5">
                      تتطلب توليد بيانات ورفعها للتوثيق الميداني.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveAdminTab('businesses');
                    setVerificationFilter('not_submitted');
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] px-3 py-1.5 rounded-xl shrink-0 cursor-pointer shadow-xs transition-transform active:scale-95"
                >
                  عرض وفحص
                </button>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="font-bold">كافة الأنشطة المسجلة تم رفعها للتوثيق ولا توجد أنشطة متأخرة.</span>
              </div>
            )}

            {/* Notice 2: Overdue Google Review Notice (> 48h) */}
            {overdueReviewCount > 0 ? (
              <div className="alert-card-warning p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="alert-icon-box w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="alert-title font-black text-sm">
                      تنبيه مراجعة: ({overdueReviewCount}) أنشطة تجاوزت مدة مراجعة جوجل المتوقعة
                    </p>
                    <p className="alert-desc text-[11px] font-bold mt-0.5">
                      أُرسلت للتوثيق منذ أكثر من 48 ساعة دون اعتماد؛ يُنصح بمراجعتها وتدقيق الـ Place ID.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveAdminTab('businesses');
                    setVerificationFilter('overdue');
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-xl shrink-0 cursor-pointer shadow-xs transition-transform active:scale-95"
                >
                  متابعة التوثيق
                </button>
              </div>
            ) : (
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-[var(--text-secondary)]">
                <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="font-bold">مراجعات جوجل تسير ضمن النطاق الزمني الطبيعي.</span>
              </div>
            )}

            {/* Notice 3: Verified Businesses with Remaining Unpaid Debt */}
            {verifiedWithDebtCount > 0 && (
              <div className="md:col-span-2 alert-card-warning border-2 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="alert-icon-box w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="alert-title font-black text-sm">
                      تنبيه مالي مهم: ({verifiedWithDebtCount}) أنشطة موثقة ومعتمدة على الخريطة ولها متبقي سداد!
                    </p>
                    <p className="alert-desc text-[11px] font-bold mt-0.5">
                      تم نشر هذه الأنشطة بنجاح على Google Maps، وما زال عليها مبالغ معلقة بإجمالي <strong className="font-mono font-black">{verifiedWithDebtTotal.toLocaleString()} ج.م</strong> بانتظار استكمال التحصيل.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveAdminTab('businesses');
                    setVerificationFilter('verified_debt');
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] px-3.5 py-1.5 rounded-xl shrink-0 cursor-pointer shadow-xs transition-transform active:scale-95 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>عرض الأنشطة الموثقة ذات المتبقي</span>
                </button>
              </div>
            )}
          </div>

          {/* Detailed Statistics Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 1. Verification Pipeline Status Breakdown */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 sm:p-5 rounded-3xl space-y-4 shadow-xs">
              <h3 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-2.5">
                <Compass className="w-4 h-4 text-amber-500" />
                <span>مراحل خط التوثيق الميداني</span>
              </h3>

              <div className="space-y-3 text-xs">
                {/* Verified */}
                <div className="space-y-1">
                  <div className="flex justify-between font-extrabold">
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>موثقة ومبثوثة رسمياً</span>
                    </span>
                    <span className="font-mono font-black">{verifiedCount} نشاط ({verificationRate}%)</span>
                  </div>
                  <div className="w-full bg-[var(--input-bg)] h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${verificationRate}%` }} />
                  </div>
                </div>

                {/* In Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between font-extrabold">
                    <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>أُرسلت وقيد مراجعة جوجل</span>
                    </span>
                    <span className="font-mono font-black">{inProgressCount} نشاط</span>
                  </div>
                  <div className="w-full bg-[var(--input-bg)] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: businesses.length > 0 ? `${(inProgressCount / businesses.length) * 100}%` : '0%' }}
                    />
                  </div>
                </div>

                {/* Not Submitted */}
                <div className="space-y-1">
                  <div className="flex justify-between font-extrabold">
                    <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>لم تُرفع للتوثيق بعد</span>
                    </span>
                    <span className="font-mono font-black">{notSubmittedCount} نشاط</span>
                  </div>
                  <div className="w-full bg-[var(--input-bg)] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all"
                      style={{ width: businesses.length > 0 ? `${(notSubmittedCount / businesses.length) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Package Distribution & Revenue Share */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 sm:p-5 rounded-3xl space-y-4 shadow-xs">
              <h3 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-2.5">
                <PieChart className="w-4 h-4 text-amber-500" />
                <span>تحليل باقات الاشتراكات</span>
              </h3>

              <div className="space-y-3 text-xs">
                {packageStats.map((pkg) => (
                  <div key={pkg.title} className="space-y-1">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-[var(--text-primary)]">{pkg.title}</span>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{pkg.count} نشاط</span>
                        <span className="text-[var(--text-muted)]">({pkg.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-[var(--input-bg)] h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${pkg.percentage}%` }} />
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] text-left font-mono">
                      إجمالي الإيراد: {pkg.revenue.toLocaleString()} ج.م
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Geographical Distribution */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 sm:p-5 rounded-3xl space-y-4 shadow-xs">
              <h3 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-2.5">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>التوزيع الجغرافي للأنشطة</span>
              </h3>

              <div className="space-y-2.5 text-xs max-h-60 overflow-y-auto pr-1">
                {governorateStats.map((gov) => {
                  const pct = businesses.length > 0 ? ((gov.count / businesses.length) * 100).toFixed(0) : 0;
                  return (
                    <div key={gov.name} className="space-y-1 bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--border-color)]">
                      <div className="flex justify-between font-bold">
                        <span className="text-[var(--text-primary)]">{gov.name}</span>
                        <span className="font-mono text-amber-600 dark:text-amber-400">{gov.count} نشاط ({pct}%)</span>
                      </div>
                      <div className="w-full bg-[var(--input-bg)] h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                        <span>الموثق: {gov.verified}</span>
                        <span>التحصيل: {gov.revenue.toLocaleString()} ج.م</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Team Performance & Comprehensive Account Ledger Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>إحصائيات وحركات وحسابات فريق العمل الميداني الشاملة</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  متابعة دقيقة وفورية لحركات الكاش المحصل، العمولات المستحقة، عهدة التوريد، وشبكة الإحالة لكل حساب
                </p>
              </div>

              <span className="text-xs text-amber-600 dark:text-amber-400 font-black bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30">
                إجمالي الأعضاء: {repPerformanceStats.length}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
              <table className="w-full text-xs text-right border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-[var(--input-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold text-[11px]">
                    <th className="p-3">اسم العضو / المندوب</th>
                    <th className="p-3">المحافظة والصلاحية</th>
                    <th className="p-3 text-center">الأنشطة المسجلة</th>
                    <th className="p-3 text-center">إجمالي التحصيل</th>
                    <th className="p-3 text-center">كاش باليد</th>
                    <th className="p-3 text-center">العمولات المستحقة</th>
                    <th className="p-3 text-center">الموقف المالي / العهدة</th>
                    <th className="p-3 text-center">شبكة الإحالة</th>
                    <th className="p-3 text-center">الحالة والتواجد</th>
                    <th className="p-3 text-center">كشف الحساب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {repPerformanceStats.map(({ rep, totalBiz, verifiedBiz, collectedRevenue, target, achievement, isOnline, lastActiveText, cashInHand, earnedCommission, debtToPlatform, withdrawableBalance, isDebt, invitedCount }) => (
                    <tr
                      key={rep.id}
                      className="hover:bg-amber-500/5 transition-colors cursor-pointer"
                      onClick={() => setSelectedDossierRep(rep)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <UserAvatar avatar={rep.avatar} name={rep.name} role={rep.role} size="sm" />
                          <div>
                            <p className="font-black text-[var(--text-primary)] hover:text-amber-500 transition-colors">{rep.name}</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-mono">{rep.phone}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <p className="font-bold text-[var(--text-primary)]">{rep.governorate}</p>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">{rep.roleTitle || (rep.role === 'admin' ? 'مدير' : rep.role === 'supervisor' ? 'مشرف' : 'مندوب')}</span>
                      </td>

                      <td className="p-3 text-center font-mono">
                        <span className="font-black text-sm text-[var(--text-primary)]">{totalBiz}</span>
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">{verifiedBiz} موثق</p>
                      </td>

                      <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {collectedRevenue.toLocaleString()} ج
                      </td>

                      <td className="p-3 text-center font-mono font-black text-blue-600 dark:text-blue-400">
                        {cashInHand > 0 ? `${cashInHand.toLocaleString()} ج` : '0 ج'}
                      </td>

                      <td className="p-3 text-center font-mono font-black text-amber-600 dark:text-amber-400">
                        {earnedCommission > 0 ? `${earnedCommission.toLocaleString()} ج` : '0 ج'}
                      </td>

                      <td className="p-3 text-center">
                        {isDebt ? (
                          <span className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-xs inline-block whitespace-nowrap">
                            ⚠️ عهدة: {debtToPlatform.toLocaleString()} ج
                          </span>
                        ) : withdrawableBalance > 0 ? (
                          <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-xs inline-block whitespace-nowrap">
                            🟢 متاح: {withdrawableBalance.toLocaleString()} ج
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--input-bg)] px-2 py-0.5 rounded-lg">
                            مصفى (0 ج)
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {invitedCount > 0 ? (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[10px] px-2 py-0.5 rounded-md border border-emerald-500/30">
                            👥 دعا {invitedCount}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--text-muted)]">—</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {isOnline ? (
                          <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-1 rounded-full shadow-xs inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{lastActiveText}</span>
                          </span>
                        ) : (
                          <span className="bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--border-color)] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 opacity-60" />
                            <span>{lastActiveText}</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedDossierRep(rep)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1 mx-auto cursor-pointer"
                          title="فتح كشف الحساب والأنشطة والذمة المالية للمندوب"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>الملف</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: BUSINESSES TABLE & FULL DATA ACCESS ONLY */}
      {/* --------------------------------------------------------------------- */}
      {activeAdminTab === 'businesses' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm animate-fade-in transition-colors duration-300">
          {/* Quick Filter Pill Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setVerificationFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                verificationFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              الكل ({businesses.length})
            </button>
            <button
              onClick={() => setVerificationFilter('in_progress')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                verificationFilter === 'in_progress'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>⏳ قيد مراجعة الدليل ({inProgressCount})</span>
            </button>
            <button
              onClick={() => setVerificationFilter('verified')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                verificationFilter === 'verified'
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>🟢 معتمدة بالدليل ({verifiedCount})</span>
            </button>
            <button
              onClick={() => setVerificationFilter('google_synced')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                verificationFilter === 'google_synced'
                  ? 'bg-blue-600 text-white font-black shadow-xs'
                  : 'bg-blue-500/10 text-blue-800 dark:text-blue-300 hover:bg-blue-500/20 border border-blue-500/30'
              }`}
            >
              <span>🌐 موثقة بـ Google Maps ({businesses.filter(b => b.googleSyncStatus === 'synced' || Boolean(b.googleMapsUrl)).length})</span>
            </button>
            <button
              onClick={() => setVerificationFilter('google_pending')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                verificationFilter === 'google_pending'
                  ? 'bg-purple-600 text-white font-black shadow-xs'
                  : 'bg-purple-500/10 text-purple-800 dark:text-purple-300 hover:bg-purple-500/20 border border-purple-500/30'
              }`}
            >
              <span>⏳ قيد توثيق Google ({businesses.filter(b => b.googleSyncStatus === 'in_progress').length})</span>
            </button>
          </div>

          {/* Search and Dropdown Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3" />
              <input
                type="text"
                placeholder="بحث باسم النشاط، العميل أو الهاتف..."
                value={bizSearchQuery}
                onChange={(e) => setBizSearchQuery(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>

            <select
              value={governorateFilter}
              onChange={(e) => setGovernorateFilter(e.target.value)}
              className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="all">كل المحافظات</option>
              {EGYPT_GOVERNORATES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="all">كل حالات السداد</option>
              <option value="fully_paid">مدفوعة بالكامل</option>
              <option value="partially_paid">مدفوع جزء منها</option>
              <option value="unpaid">لم يتم الدفع نهائياً</option>
            </select>

            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              <option value="all">كل حالات التوثيق ({businesses.length})</option>
              <option value="not_submitted">🚨 لم تُرسل بعد ({notSubmittedCount})</option>
              <option value="in_progress">⏳ بانتظار موافقة جوجل ({inProgressCount})</option>
              <option value="overdue">⏱️ تجاوزت مدة المراجعة ({overdueReviewCount})</option>
              <option value="verified_debt">⚠️ موثقة وعليها متبقي سداد ({verifiedWithDebtCount})</option>
              <option value="verified">✅ موثقة رسمياً ({verifiedCount})</option>
              <option value="rejected">❌ مرفوضة</option>
            </select>
          </div>

          {/* Header Action Toolbar: Export CSV & Count & Page Size */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--text-secondary)]">
                إجمالي الأنشطة المطابقة: <strong className="font-mono font-black text-amber-600 dark:text-amber-400">{filteredBusinesses.length}</strong> نشاط
              </span>
            </div>

            <div className="flex items-center gap-2 mr-auto sm:mr-0">
              <button
                type="button"
                onClick={() => exportBusinessesToCsv(filteredBusinesses)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                title="تصدير السجلات الحالية المصفاة إلى ملف Excel (CSV)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير Excel (CSV)</span>
              </button>

              <div className="flex items-center gap-1 bg-[var(--input-bg)] px-2 py-1 rounded-xl border border-[var(--border-color)] font-bold text-[11px]">
                <span className="text-[var(--text-muted)]">عرض:</span>
                <select
                  value={bizPageSize}
                  onChange={(e) => setBizPageSize(Number(e.target.value))}
                  className="bg-transparent text-[var(--text-primary)] font-black focus:outline-none cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            </div>
          </div>

          {/* Businesses Data: Mobile Cards (< md) + Desktop Table (>= md) */}
          <div className="space-y-3">
            {pagedBusinesses.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-muted)] font-bold bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
                لا توجد أنشطة مطابقة للبحث أو التصفية الحالية.
              </div>
            ) : (
              <>
                {/* 1. Mobile Cards View (Hidden on md and larger) */}
                <div className="block md:hidden space-y-3">
                  {pagedBusinesses.map((biz) => {
                    const isDirectoryApproved = biz.verificationStatus === 'verified';
                    const isGoogleSynced = biz.googleSyncStatus === 'synced' || Boolean(biz.googleMapsUrl);
                    const isInGoogleReview = biz.googleSyncStatus === 'in_progress';
                    const isOverdue = overdueReviewBusinesses.some((ov) => ov.id === biz.id);
                    const isExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
                    const debtAmount = isExempt ? 0 : Math.max(0, (biz.packagePrice || 0) - (biz.amountPaid || 0));
                    const isPaid = !isExempt && (biz.amountPaid || 0) > 0;
                    const isCash = !isExempt && (biz.cashCollectedByRep !== undefined
                      ? (biz.cashCollectedByRep || 0) > 0
                      : biz.paymentMethod !== 'gateway_online' && isPaid);
                    const rate = biz.repCommissionRate || 42.86;
                    const repComm = isExempt ? 0 : Math.round(((biz.amountPaid || 0) * rate) / 100);
                    const platDue = isExempt ? 0 : (biz.amountPaid || 0) - repComm;
                    const expectedComm = isExempt ? 0 : Math.round(((biz.packagePrice || 250) * rate) / 100);

                    return (
                      <div key={`m-${biz.id}`} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl space-y-3 shadow-sm hover:border-amber-500/40 transition-all">
                        {/* Header: Name + Dual Status (Directory + Google Maps) */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-sm text-[var(--text-primary)] truncate">{biz.nameAr}</h4>
                            {biz.nameEn && <p className="text-[10px] text-[var(--text-muted)] font-mono truncate">{biz.nameEn}</p>}
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="inline-block text-[11px] text-amber-700 dark:text-amber-400 font-bold">{biz.category}</span>
                              {isExempt && (
                                <span className="text-[9.5px] bg-teal-500/20 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-md font-black border border-teal-500/30">
                                  🌟 رائج (معفى مجاناً)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            {/* Directory Approval Status */}
                            {isDirectoryApproved ? (
                              <span className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 text-[9.5px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>معتمد بالدليل ✅</span>
                              </span>
                            ) : (
                              <span className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-[9.5px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                <span>قيد مراجعة الدليل ⏳</span>
                              </span>
                            )}

                            {/* Google Maps Sync Status */}
                            {isGoogleSynced ? (
                              <span className="bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                🌐 خرائط Google
                              </span>
                            ) : isInGoogleReview ? (
                              <span className="bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                ⏳ مراجعة Google
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Urgent Alert if Verified but Unpaid (Strictly non-exempt) */}
                        {isGoogleSynced && !isPaid && !isExempt && (
                          <div className="bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 p-2.5 rounded-xl text-xs font-black flex items-center justify-between gap-2 animate-pulse">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                              <span className="truncate">🚨 تم التوثيق على خرائط Google ولم يُسدد بعد! (مستحق: {biz.packagePrice || 250} ج)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (onCollectPayment) {
                                  onCollectPayment(biz);
                                } else {
                                  setEditingBusiness(biz);
                                }
                              }}
                              className="bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] px-2.5 py-1 rounded-lg shadow-xs cursor-pointer shrink-0"
                            >
                              تحصيل الآن 💰
                            </button>
                          </div>
                        )}

                        {/* Location, Rep, and Date Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-[var(--input-bg)]/60 p-2.5 rounded-xl border border-[var(--border-color)]">
                          <div className="min-w-0">
                            <span className="text-[9px] text-[var(--text-muted)] block font-bold">الموقع والمندوب:</span>
                            <span className="font-bold text-[var(--text-primary)] block truncate">{biz.governorate} ({biz.city})</span>
                            <span className="text-[10px] text-[var(--text-secondary)] block truncate">مندوب: {biz.repName}</span>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <a
                                href={biz.repLocationUrl || `https://www.google.com/maps?q=${biz.lat},${biz.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[9px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                                title="موقع المندوب الميداني (غير موثق)"
                              >
                                📍 موقع المندوب
                              </a>
                              {biz.googleMapsUrl && biz.googleMapsUrl.trim().startsWith('http') && (
                                <a
                                  href={biz.googleMapsUrl.trim()}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                                  title="الموقع المعتمد على خرائط Google"
                                >
                                  • ✅ الخريطة الموثقة
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] text-[var(--text-muted)] block font-bold">تاريخ الإضافة:</span>
                            <div className="flex items-center gap-1 font-bold text-[var(--text-primary)] mt-0.5">
                              <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="truncate text-[10px]">{formatActivityDateTime(biz.createdDate || biz.invoiceDate)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Payment & Commission status */}
                        <div className="bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border-color)] text-xs flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            {isExempt ? (
                              <div className="space-y-0.5">
                                <span className="text-[10.5px] font-black px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 inline-flex items-center gap-1">
                                  <span>🆓 إدراج مجاني (معفى من الرسوم 0 ج)</span>
                                </span>
                                <p className="text-[9.5px] text-[var(--text-muted)] font-bold">معلم رائج بالمنطقة - لا توجد مطالبات مالية</p>
                              </div>
                            ) : !isPaid ? (
                              <div>
                                {isDirectoryApproved ? (
                                  <span className="badge-danger text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 animate-pulse">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>🚨 موثق ولم يُسدد! (مطلوب التحصيل)</span>
                                  </span>
                                ) : (
                                  <span className="badge-warning text-[10px] font-black px-2 py-0.5 rounded-full inline-block">
                                    ⏳ الدفع لاحقاً (عند التوثيق)
                                  </span>
                                )}
                                <p className={`text-[10px] font-bold mt-0.5 ${isDirectoryApproved ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                  {isDirectoryApproved ? `مستحق للمنصة: ${biz.packagePrice || 250} ج.م` : `عمولة معلقة: ${expectedComm} ج.م`}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block ${
                                    debtAmount === 0 ? 'badge-success' : 'badge-warning'
                                  }`}>
                                    {debtAmount === 0 ? 'مدفوع بالكامل' : `مدفوع ${biz.amountPaid} (متبقي ${debtAmount})`}
                                  </span>
                                  <span className="text-[10.5px] font-extrabold text-[var(--text-primary)]">
                                    {isCash ? (
                                      <span className="text-amber-700 dark:text-amber-300">💵 كاش ({biz.amountPaid} ج)</span>
                                    ) : (
                                      <span className="text-purple-700 dark:text-purple-300">💳 تحويل إلكتروني</span>
                                    )}
                                  </span>
                                </div>
                                {isCash && (
                                  <p className="text-[9.5px] text-[var(--text-muted)] font-mono mt-0.5">
                                    المندوب: {repComm} ج • مستحق للمنصة: {platDue} ج
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          {debtAmount > 0 && isPaid && (
                            <span className="badge-warning text-[9px] font-black px-2 py-0.5 rounded-full shrink-0">
                              متبقي {debtAmount.toLocaleString()} ج
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1 border-t border-[var(--border-color)]">
                          {!isDirectoryApproved && (
                            <button
                              type="button"
                              onClick={() => setSyncModalBiz(biz)}
                              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>رفع لجوجل</span>
                            </button>
                          )}
                          <button
                            onClick={() => setEditingBusiness(biz)}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>التفاصيل والتعديل</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Desktop Table View (Hidden on mobile < md) */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-[var(--border-color)]">
                  <table className="w-full text-xs text-right border-collapse min-w-[760px]">
                    <thead>
                      <tr className="bg-[var(--input-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold">
                        <th className="p-3">اسم النشاط والتصنيف</th>
                        <th className="p-3">الموقع الجغرافي والمندوب</th>
                        <th className="p-3">تاريخ ووقت الإضافة</th>
                        <th className="p-3">حالة السداد والتحصيل</th>
                        <th className="p-3">حالة التوثيق وGoogle Maps</th>
                        <th className="p-3 text-center">الإجراءات والتحكم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {pagedBusinesses.map((biz) => {
                        const isDirectoryApproved = biz.verificationStatus === 'verified';
                        const isGoogleSynced = Boolean(biz.googleMapsUrl && biz.googleMapsUrl.trim().startsWith('http') && !biz.googleMapsUrl.includes('search/?api=1&query=')) || biz.googleSyncStatus === 'synced';
                        const isInGoogleReview = biz.googleSyncStatus === 'in_progress';
                        const isOverdue = overdueReviewBusinesses.some((ov) => ov.id === biz.id);
                        const isAlreadyOnGoogle = Boolean(biz.isAlreadyOnGoogle || biz.packageId === 'pkg_already_on_google' || biz.registrationType === 'already_on_google');
                        const isExempt = Boolean(isAlreadyOnGoogle || biz.isFeeExempt || biz.packagePrice === 0);
                        const debtAmount = isExempt ? 0 : Math.max(0, (biz.packagePrice || 0) - (biz.amountPaid || 0));
                        const isPaid = isExempt ? true : (biz.amountPaid || 0) > 0;
                        const isCash = !isExempt && (biz.cashCollectedByRep !== undefined
                          ? (biz.cashCollectedByRep || 0) > 0
                          : biz.paymentMethod !== 'gateway_online' && isPaid);
                        const rate = biz.repCommissionRate || 42.86;
                        const repComm = isExempt ? 0 : Math.round(((biz.amountPaid || 0) * rate) / 100);
                        const platDue = isExempt ? 0 : (biz.amountPaid || 0) - repComm;
                        const expectedComm = isExempt ? 0 : Math.round(((biz.packagePrice || 250) * rate) / 100);

                        return (
                          <tr key={biz.id} className={`transition-colors ${isDirectoryApproved && !isPaid && !isExempt ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'hover:bg-amber-500/5'}`}>
                            <td className="p-3">
                              <p className="font-extrabold text-[var(--text-primary)] text-sm">{biz.nameAr}</p>
                              {biz.nameEn && <p className="text-[10px] text-[var(--text-muted)] font-mono">{biz.nameEn}</p>}
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">{biz.category}</p>
                                {isAlreadyOnGoogle ? (
                                  <span className="text-[9.5px] bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-black border border-blue-500/30">
                                    📍 مسجل بـ Google (0 ج)
                                  </span>
                                ) : isExempt ? (
                                  <span className="text-[9.5px] bg-teal-500/20 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-md font-black border border-teal-500/30">
                                    🌟 رائج (معفى مجاناً)
                                  </span>
                                ) : null}
                              </div>
                            </td>

                            <td className="p-3">
                              <p className="font-bold text-[var(--text-primary)]">{biz.governorate} ({biz.city})</p>
                              <p className="text-[11px] text-[var(--text-secondary)] font-bold">المندوب: {biz.repName}</p>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {!isAlreadyOnGoogle && (
                                  <a
                                    href={biz.repLocationUrl || `https://www.google.com/maps?q=${biz.lat},${biz.lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9.5px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold px-2 py-0.5 rounded-md border border-amber-500/30 inline-flex items-center gap-1"
                                    title="فتح موقع المعاينة الميدانية المرسل من المندوب (غير موثق)"
                                  >
                                    <MapPin className="w-2.5 h-2.5 text-amber-500" />
                                    <span>موقع المندوب (غير موثق) ↗</span>
                                  </a>
                                )}
                                {biz.googleMapsUrl && biz.googleMapsUrl.trim().startsWith('http') && (
                                  <a
                                    href={biz.googleMapsUrl.trim()}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9.5px] bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md border border-emerald-500/30 inline-flex items-center gap-1"
                                    title="فتح الموقع المعتمد رسمياً على خرائط Google"
                                  >
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                    <span>خريطة Google الموثقة 🗺️</span>
                                  </a>
                                )}
                              </div>
                            </td>

                            <td className="p-3">
                              <div className="flex items-center gap-1.5 text-xs text-[var(--text-primary)] font-bold font-sans">
                                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>{formatActivityDateTime(biz.createdDate || biz.invoiceDate)}</span>
                              </div>
                            </td>

                            <td className="p-3">
                              {(() => {
                                if (isExempt) {
                                  return (
                                    <div className="space-y-0.5">
                                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 inline-flex items-center gap-1">
                                        <span>🆓 إدراج مجاني (معفى 0 ج)</span>
                                      </span>
                                      <p className="text-[9.5px] text-[var(--text-muted)] font-bold">لا توجد مطالبات مالية</p>
                                    </div>
                                  );
                                }

                                if (!isPaid) {
                                  return (
                                    <div className="space-y-1">
                                      {isGoogleSynced ? (
                                        <span className="badge-danger text-[10.5px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1 animate-pulse">
                                          <AlertTriangle className="w-3.5 h-3.5" />
                                          <span>🚨 موثق بـ Google ولم يُسدد! (مستحق: {biz.packagePrice || 250} ج)</span>
                                        </span>
                                      ) : (
                                        <span className="badge-warning text-[10px] font-black px-2 py-0.5 rounded-full inline-block">
                                          ⏳ الدفع لاحقاً (عند التوثيق)
                                        </span>
                                      )}
                                      <p className={`text-[10px] font-bold ${isDirectoryApproved ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                        {isDirectoryApproved ? `مستحق للمنصة: ${biz.packagePrice || 250} ج.م` : `عمولة معلقة: ${expectedComm} ج.م`}
                                      </p>
                                    </div>
                                  );
                                }

                                return (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block ${
                                        debtAmount === 0 ? 'badge-success' : 'badge-warning'
                                      }`}>
                                        {debtAmount === 0 ? 'مدفوع بالكامل' : `مدفوع ${biz.amountPaid} (متبقي ${debtAmount})`}
                                      </span>
                                    </div>
                                    <p className="text-[10.5px] font-extrabold text-[var(--text-primary)]">
                                      {isCash ? (
                                        <span className="text-amber-700 dark:text-amber-300">💵 كاش بيد المندوب ({biz.amountPaid} ج)</span>
                                      ) : (
                                        <span className="text-purple-700 dark:text-purple-300">💳 تحويل إلكتروني للمنصة</span>
                                      )}
                                    </p>
                                    {isCash && (
                                      <p className="text-[9.5px] text-[var(--text-muted)] font-mono">
                                        المندوب: {repComm} ج • مستحق للمنصة: {platDue} ج
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>

                            <td className="p-3">
                              {isDirectoryApproved ? (
                                <div className="space-y-1">
                                  <span className="badge-success text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>موثق ومعتمد ✅</span>
                                  </span>
                                  {!isExempt && (!isPaid ? (
                                    <span className="badge-danger text-[9px] font-black px-2 py-0.5 rounded-full block w-fit animate-pulse">
                                      🚨 لم يتم الدفع ({biz.packagePrice || 250} ج)
                                    </span>
                                  ) : debtAmount > 0 ? (
                                    <span className="badge-warning text-[9px] font-black px-2 py-0.5 rounded-full block w-fit">
                                      ⚠️ متبقي {debtAmount.toLocaleString()} ج.م
                                    </span>
                                  ) : null)}
                                </div>
                              ) : isInGoogleReview ? (
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                                  isOverdue ? 'badge-warning' : 'badge-warning'
                                }`}>
                                  <Clock className="w-3 h-3" />
                                  <span>{isOverdue ? 'تجاوزت المدة ⏱️' : 'قيد مراجعة جوجل ⏳'}</span>
                                </span>
                              ) : (
                                <span className="badge-danger text-[10px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>لم تُرفع للتوثيق 🚨</span>
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {!isExempt && !isPaid && onCollectPayment && (
                                  <button
                                    type="button"
                                    onClick={() => onCollectPayment(biz)}
                                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10px] px-2.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                    title="تحصيل الفاتورة والمبلغ المتبقي فوراً"
                                  >
                                    <DollarSign className="w-3 h-3" />
                                    <span>تحصيل ({Math.max(0, (biz.packagePrice || 250) - (biz.amountPaid || 0))} ج)</span>
                                  </button>
                                )}

                                {!isDirectoryApproved && (
                                  <button
                                    type="button"
                                    onClick={() => setSyncModalBiz(biz)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] px-2.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                    title="رفع وتوثيق النشاط مباشرة إلى Google Maps"
                                  >
                                    <Zap className="w-3 h-3" />
                                    <span>رفع لجوجل</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => setEditingBusiness(biz)}
                                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                                  title="عرض كل البيانات التي أدخلها المندوب والتعديل عليها"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>التفاصيل والتعديل</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Pagination Controls */}
          {totalBizPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
              <span className="text-[var(--text-muted)] font-bold">
                عرض {((bizPage - 1) * bizPageSize) + 1} إلى {Math.min(filteredBusinesses.length, bizPage * bizPageSize)} من {filteredBusinesses.length} نشاط
              </span>

              <div className="flex items-center gap-1 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)]">
                <button
                  type="button"
                  disabled={bizPage === 1}
                  onClick={() => setBizPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-500/10 cursor-pointer flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>

                <div className="flex items-center gap-1 px-2 font-mono font-bold text-[var(--text-primary)]">
                  <span>{bizPage}</span> / <span>{totalBizPages}</span>
                </div>

                <button
                  type="button"
                  disabled={bizPage === totalBizPages}
                  onClick={() => setBizPage((p) => Math.min(totalBizPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-500/10 cursor-pointer flex items-center gap-1"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: ACCOUNTS MANAGEMENT ONLY */}
      {/* --------------------------------------------------------------------- */}
      {activeAdminTab === 'reps' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="font-black text-base text-[var(--text-primary)] flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>إدارة حسابات المناديب والمشرفين والموظفين</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  مراجعة الوثائق المرفوعة (صورة الوجه، بطاقة الرقم القومي) والتحكم في تفعيل وصلاحيات الحسابات
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPermissionsModal(true)}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs px-3.5 py-2.5 rounded-2xl border border-amber-500/30 flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                title="استعراض مصفوفة ودليل الصلاحيات والرتب"
              >
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>دليل الصلاحيات 🛡️</span>
              </button>

              <button
                type="button"
                onClick={() => exportRepsToCsv(filteredAccounts, businesses)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-md shrink-0 transition-transform active:scale-95 cursor-pointer"
                title="تصدير بيانات الحسابات إلى Excel"
              >
                <Download className="w-4 h-4" />
                <span>تصدير Excel</span>
              </button>

              <button
                onClick={openAddAccountModal}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-md shrink-0 transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>إضافة حساب جديد</span>
              </button>
            </div>

            {/* Filter Controls & Page Size Selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs flex-1">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3 top-3" />
                  <input
                    type="text"
                    placeholder="بحث باسم الحساب، البريد، أو الهاتف..."
                    value={accountSearchQuery}
                    onChange={(e) => setAccountSearchQuery(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl pr-8 pl-3 py-2 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>

                <select
                  value={accountRoleFilter}
                  onChange={(e) => setAccountRoleFilter(e.target.value)}
                  className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 shadow-xs"
                >
                  <option value="all">كل الصلاحيات ({mergedAdminReps.length})</option>
                  <option value="rep">المناديب الميدانيين</option>
                  <option value="supervisor">مشرفي المناطق</option>
                  <option value="accountant">المحاسبين والمحصلين</option>
                  <option value="admin">مديري النظام والأدمن</option>
                </select>

                <select
                  value={accountStatusFilter}
                  onChange={(e) => setAccountStatusFilter(e.target.value)}
                  className="bg-[var(--input-bg)] border border-amber-500/40 text-amber-700 dark:text-amber-300 font-extrabold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 shadow-xs"
                >
                  <option value="all">كل حالات الحسابات</option>
                  <option value="suspended">
                    🔔 المعلقة ({mergedAdminReps.filter((r) => r.status === 'suspended').length})
                  </option>
                  <option value="active">✅ النشطة والمفعلة</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-[var(--input-bg)] px-2.5 py-1.5 rounded-xl border border-[var(--border-color)] font-bold text-xs shrink-0 self-start sm:self-auto">
                <span className="text-[var(--text-muted)]">عرض:</span>
                <select
                  value={accountPageSize}
                  onChange={(e) => setAccountPageSize(Number(e.target.value))}
                  className="bg-transparent text-[var(--text-primary)] font-black focus:outline-none cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pagedAccounts.map((acc) => {
              const role = acc.role || 'rep';
              const isSuspended = acc.status === 'suspended';
              const isCurrentActiveUser = Boolean(
                currentUser && (currentUser.id === acc.id || (currentUser.email && acc.email && currentUser.email.toLowerCase() === acc.email.toLowerCase()) || currentUser.name === acc.name)
              );
              const effectiveTimestamp = isCurrentActiveUser ? Date.now() : (acc.lastActiveTimestamp ? Number(acc.lastActiveTimestamp) : 0);
              const isOnline = Boolean(
                isCurrentActiveUser || (effectiveTimestamp > 0 && (Date.now() - effectiveTimestamp < 59 * 60 * 1000))
              );

              return (
                <div
                  key={acc.id}
                  className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 shadow-xs ${
                    isSuspended
                      ? 'bg-amber-500/5 border-amber-500/40'
                      : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        avatar={acc.avatar}
                        name={acc.name}
                        role={acc.role}
                        avatarStatus={acc.avatarStatus}
                        size="md"
                        isAdminPreview={true}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-[var(--text-primary)]">{acc.name}</h4>
                          {isOnline ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="متواجد بالمنظومة حالياً" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 opacity-50" title="غير متصل" />
                          )}
                        </div>
                        <p className="text-xs text-amber-500 font-bold">{acc.governorate}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono dir-ltr text-right">{acc.phone}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {renderRoleBadge(role, acc.roleTitle)}
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg border shadow-xs ${
                          isSuspended
                            ? 'bg-amber-500/20 text-amber-900 dark:text-amber-300 border-amber-500/50'
                            : 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-400 border-emerald-500/40'
                        }`}
                      >
                        {isSuspended ? '⏳ تحت المراجعة' : '🟢 فعال ومصرح'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-color)] flex flex-col gap-2 text-xs">
                    {/* Financial Settlement & Cash Indicator Row */}
                    {(() => {
                      const repBiz = businesses.filter((b) => b.repId === acc.id || b.repName === acc.name);
                      const repSettlement = calculateRepSettlement(acc.id, repBiz, acc.commissionRate || 42.86, payoutRequests);

                      return (
                        <div className="bg-[var(--input-bg)] p-2 rounded-xl border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-1 text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--text-muted)] font-bold">أنشطة: <strong className="text-[var(--text-primary)]">{repBiz.length}</strong></span>
                            {repSettlement.totalCashInHand > 0 && (
                              <span className="text-amber-600 dark:text-amber-400 font-bold">كاش بيده: {repSettlement.totalCashInHand} ج</span>
                            )}
                          </div>

                          <div>
                            {repSettlement.isDebtToPlatform ? (
                              <span className="bg-amber-500/20 text-amber-800 dark:text-amber-300 font-black px-2 py-0.5 rounded-md border border-amber-500/30">
                                ⚠️ للمنصة: {repSettlement.debtToPlatformAmount} ج.م
                              </span>
                            ) : (
                              <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black px-2 py-0.5 rounded-md">
                                متاح سحب: {repSettlement.withdrawableBalance} ج.م
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Referral & Mission Status Row */}
                    {(() => {
                      const repBizCount = businesses.filter((b) => b.repId === acc.id || b.repName === acc.name).length;
                      const repRefCode = getRepReferralCode(acc);
                      const isRefUnlocked = isReferralSystemUnlocked(acc, repBizCount);
                      const invitedCount = mergedAdminReps.filter((r) => isReferredByInviter(r, acc)).length;

                      return (
                        <div className="bg-[var(--input-bg)] p-2 rounded-xl border border-[var(--border-color)] flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 font-mono font-bold">
                            <span className="text-[var(--text-muted)]">كود:</span>
                            <span className="text-amber-700 dark:text-amber-300">{repRefCode}</span>
                            {invitedCount > 0 && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">دعا {invitedCount}</span>
                            )}
                            {acc.referredByCode && (
                              <span className="text-[10px] text-[var(--text-muted)]">(دعاه: {acc.referredByCode})</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isRefUnlocked ? 'badge-success' : 'badge-warning'}`}>
                              {isRefUnlocked ? '✨ الإحالة مفتوحة' : '🔒 مقفولة'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateRepresentative) {
                                  onUpdateRepresentative({
                                    ...acc,
                                    adminBypassReferral: !isRefUnlocked,
                                    referralUnlocked: !isRefUnlocked,
                                  });
                                }
                              }}
                              className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                              title="تجاوز مهام الإحالة وفتح/قفل الكود مباشرة"
                            >
                              {isRefUnlocked ? 'قفل' : 'تجاوز وتفعيل'}
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="flex items-center gap-2">
                      {isSuspended ? (
                        <>
                          <button
                            onClick={() => {
                              if (onUpdateRepresentative) onUpdateRepresentative({ ...acc, status: 'active' });
                            }}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 rounded-xl shadow flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>قبول وتفعيل</span>
                          </button>
                          <button
                            onClick={() => openEditAccountModal(acc)}
                            className="bg-amber-500/15 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-black px-3 py-2 rounded-xl border border-amber-500/40 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openEditAccountModal(acc)}
                          className="w-full bg-amber-500/15 hover:bg-amber-500 text-amber-900 dark:text-amber-300 hover:text-slate-950 font-black py-2 rounded-xl border border-amber-500/40 flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                          <span>عرض وتعديل البيانات ومراجعة الوثائق</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Accounts Pagination Controls */}
          {totalAccountPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
              <span className="text-[var(--text-muted)] font-bold">
                عرض {((accountPage - 1) * accountPageSize) + 1} إلى {Math.min(filteredAccounts.length, accountPage * accountPageSize)} من {filteredAccounts.length} حساب
              </span>

              <div className="flex items-center gap-1 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)]">
                <button
                  type="button"
                  disabled={accountPage === 1}
                  onClick={() => setAccountPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-500/10 cursor-pointer flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>

                <div className="flex items-center gap-1 px-2 font-mono font-bold text-[var(--text-primary)]">
                  <span>{accountPage}</span> / <span>{totalAccountPages}</span>
                </div>

                <button
                  type="button"
                  disabled={accountPage === totalAccountPages}
                  onClick={() => setAccountPage((p) => Math.min(totalAccountPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-500/10 cursor-pointer flex items-center gap-1"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 4: PAYMENT GATEWAY SETTINGS ONLY */}
      {/* --------------------------------------------------------------------- */}
      {activeAdminTab === 'gateways' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs max-w-2xl mx-auto animate-fade-in transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-2 text-amber-500">
              <CreditCard className="w-5 h-5" />
              <h3 className="font-black text-base text-[var(--text-primary)]">إعدادات وسائل وبوابات الدفع الإلكتروني</h3>
            </div>

            <button
              onClick={() => {
                setVodaNumber(paymentConfig.vodafoneCashNumber || '01143888355');
                setVodaNumber2(paymentConfig.vodafoneCashNumber2 || '01556221141');
                setInstaHandle(paymentConfig.instaPayHandle || '@daz31181');
                setShowPaymentModal(true);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl shadow flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <Settings className="w-4 h-4" />
              <span>تعديل أرقام المحافظ وإنستاباي</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* 1. Vodafone Cash / Wallets */}
            <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-primary)] font-extrabold block">محافظ التحويل الإلكتروني المعتمدة (فودافون كاش / اتصالات / وي / أورانج):</span>
                  <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                    مفعلة للاستلام
                  </span>
                </div>
                <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  E-Wallets
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block font-bold">رقم المحفظة الرئيسي (1):</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono font-black text-base dir-ltr text-right inline-block">
                      {paymentConfig.vodafoneCashNumber || '01143888355'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">رئيسي</span>
                </div>

                <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] block font-bold">رقم المحفظة الإضافي (2):</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono font-black text-base dir-ltr text-right inline-block">
                      {paymentConfig.vodafoneCashNumber2 || '01556221141'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">إضافي</span>
                </div>
              </div>
            </div>

            {/* 2. InstaPay - Active */}
            <div className="bg-purple-500/10 p-4 rounded-2xl border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-primary)] font-extrabold block">شبكة المدفوعات اللحظية إنستاباي (InstaPay Egypt):</span>
                  <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                    مفعلة للاستلام
                  </span>
                </div>
                <span className="bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-black px-3 py-1.5 rounded-xl border border-purple-500/30">
                  InstaPay
                </span>
              </div>

              <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-purple-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-bold">معرف إنستاباي المعتمد (IPA / Username):</span>
                  <span className="text-purple-700 dark:text-purple-300 font-mono font-black text-base dir-ltr text-right inline-block">
                    {paymentConfig.instaPayHandle || '@daz31181'}
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-md">حساب رسمي معتمد</span>
              </div>
            </div>

            {/* 3. Fawry */}
            <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)] flex items-center justify-between opacity-80">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-primary)] font-extrabold block">خدمة الدفع عبر شبكة فوري (Fawry Merchant / FawryPay):</span>
                  <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/30">
                    قيد التطوير والربط
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">جاري الربط البرمجي المباشر مع كود التاجر بشبكة فوري</p>
              </div>
              <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-500/30">
                فوري Fawry
              </span>
            </div>
          </div>
        </div>
      )}



      {/* MASTER DOSSIER MODAL: Representative Financial Ledger, Activities & Referrals */}
      {selectedDossierRep && (
        <RepAccountDossierModal
          rep={selectedDossierRep}
          onClose={() => setSelectedDossierRep(null)}
          businesses={businesses}
          allReps={mergedAdminReps}
          payoutRequests={payoutRequests}
          onUpdateRepresentative={onUpdateRepresentative}
          onEditBusiness={(biz) => {
            setSelectedDossierRep(null);
            setEditingBusiness(biz);
          }}
          onUpdatePayoutRequest={onUpdatePayoutRequest}
          currentUser={currentUser}
        />
      )}

      {/* SHARED MODAL: Business Data View & Editing */}
      <BusinessEditModal
        business={editingBusiness}
        onClose={() => setEditingBusiness(null)}
        onSave={handleSaveBusinessFromModal}
        userRole="admin"
        canEdit={true}
        onShowInvoice={onShowInvoice}
        onCollectPayment={onCollectPayment}
        onDeleteBusiness={onDeleteBusiness}
        businesses={businesses}
      />

      {/* MODAL 2: USER ACCOUNT CREATION / EDITING POP-UP */}
      {showAccountModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <form
              onSubmit={handleSaveAccountModal}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 text-xs my-auto text-[var(--text-primary)] shadow-2xl transition-colors duration-300 max-h-[95vh] overflow-y-auto"
            >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-black border border-amber-500/30">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)]">
                    {editingAccId ? 'تعديل بيانات وتصاريح الحساب' : 'إضافة حساب مستخدم جديد'}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-bold">
                    {editingAccId ? 'مراجعة الهوية الوطنية، الصلاحيات، والمستندات الرسمية' : 'إنشاء حساب جديد وتعيين الصلاحيات والمحافظة'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="bg-[var(--input-bg)] hover:bg-rose-500/15 text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {editingAccId && (
                (() => {
                  const editingRep = mergedAdminReps.find((r) => r.id === editingAccId);
                  const bizCount = editingRep ? businesses.filter((b) => b.repId === editingRep.id).length : 0;
                  const target = editingRep?.targetMonth || 20;
                  const progressPct = target > 0 ? Math.min(100, (bizCount / target) * 100) : 0;

                  return (
                    <>
                      {/* ── KPI PERFORMANCE CARDS ─────────────────────────────────── */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 p-3 rounded-2xl">
                        <div className="text-center bg-[var(--bg-card)]/80 backdrop-blur-xs p-2.5 rounded-xl border border-[var(--border-color)]">
                          <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-0.5">الأنشطة المسجلة</span>
                          <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">{bizCount} نشاط</span>
                        </div>
                        <div className="text-center bg-[var(--bg-card)]/80 backdrop-blur-xs p-2.5 rounded-xl border border-[var(--border-color)]">
                          <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-0.5">المستهدف الشهري</span>
                          <span className="text-sm sm:text-base font-black text-[var(--text-primary)] font-mono">{target} نشاط</span>
                        </div>
                        <div className="text-center bg-[var(--bg-card)]/80 backdrop-blur-xs p-2.5 rounded-xl border border-[var(--border-color)]">
                          <span className="text-[10px] text-[var(--text-muted)] font-bold block mb-0.5">نسبة الإنجاز</span>
                          <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 font-mono">
                            {progressPct.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* ── KYC & IDENTITY DOCUMENTS SHOWCASE (WORLD-CLASS DESIGN) ──── */}
                      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-3.5 sm:p-4 rounded-3xl space-y-3.5 shadow-xs">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-500" />
                            <span className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                              مراجعة وثائق الهوية والتحقق الرسمية (KYC)
                            </span>
                          </div>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            مطلوب للاعتماد
                          </span>
                        </div>

                        {/* 3 Identity Document Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          
                          {/* 1. Official Face Verification Photo */}
                          <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] flex flex-col justify-between space-y-2.5 hover:border-amber-500/30 transition-all shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-[var(--text-primary)] flex items-center gap-1">
                                <span>📸</span>
                                <span>صورة الوجه الرسمية</span>
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                editingRep?.activationFacePhoto || editingRep?.avatar
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              }`}>
                                {editingRep?.activationFacePhoto || editingRep?.avatar ? 'مرفقة ✓' : 'غير مرفقة ✕'}
                              </span>
                            </div>

                            {/* Preview Area */}
                            {(() => {
                              const facePhoto = editingRep?.activationFacePhoto || editingRep?.avatar;
                              return facePhoto ? (
                                <div className="relative group aspect-square max-h-32 rounded-2xl overflow-hidden bg-[var(--input-bg)] border border-amber-500/30 flex items-center justify-center shadow-xs">
                                  <img
                                    src={facePhoto}
                                    alt="صورة الوجه"
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewAvatarRep({ ...editingRep, avatar: facePhoto })}
                                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>تكبير</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="aspect-square max-h-32 rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--input-bg)]/50 flex flex-col items-center justify-center text-[var(--text-muted)] gap-1">
                                  <UserCheck className="w-6 h-6 opacity-40" />
                                  <span className="text-[10px] font-bold">لا توجد صورة شخصية</span>
                                </div>
                              );
                            })()}

                            {/* Upload / Replace Action */}
                            <label className="text-[10.5px] bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-primary)] hover:text-amber-600 font-extrabold py-2 px-2.5 rounded-xl border border-[var(--border-color)] text-center cursor-pointer block transition-colors shadow-2xs">
                              <span>📷 {editingRep?.activationFacePhoto || editingRep?.avatar ? 'استبدال الصورة' : 'إرفاق صورة الوجه'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file && editingRep && onUpdateRepresentative) {
                                    try {
                                      const compressed = await compressImageFile(file, 800, 800, 0.85, { applyWatermark: false });
                                      onUpdateRepresentative({
                                        ...editingRep,
                                        activationFacePhoto: compressed,
                                      });
                                    } catch {}
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                          </div>

                          {/* 2. National ID Card Photo (Front) */}
                          <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] flex flex-col justify-between space-y-2.5 hover:border-blue-500/30 transition-all shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-[var(--text-primary)] flex items-center gap-1">
                                <span>🪪</span>
                                <span>بطاقة الرقم القومي (الوجه)</span>
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                editingRep?.nationalIdCardPhoto
                                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              }`}>
                                {editingRep?.nationalIdCardPhoto ? 'أمامي ✓' : 'غير مرفق ✕'}
                              </span>
                            </div>

                            {/* Preview Area */}
                            {editingRep?.nationalIdCardPhoto ? (
                              <div className="relative group aspect-[16/10] max-h-32 rounded-2xl overflow-hidden bg-[var(--input-bg)] border border-blue-500/30 flex items-center justify-center shadow-xs">
                                <img
                                  src={editingRep.nationalIdCardPhoto}
                                  alt="وجه البطاقة الأمامي"
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewAvatarRep({ ...editingRep, avatar: editingRep.nationalIdCardPhoto })}
                                    className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>تكبير</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-[16/10] max-h-32 rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--input-bg)]/50 flex flex-col items-center justify-center text-[var(--text-muted)] gap-1">
                                <FileText className="w-6 h-6 opacity-40" />
                                <span className="text-[10px] font-bold">الوجه الأمامي غير مرفق</span>
                              </div>
                            )}

                            {/* Upload / Replace Action */}
                            <label className="text-[10.5px] bg-[var(--input-bg)] hover:bg-blue-500/15 text-[var(--text-primary)] hover:text-blue-600 font-extrabold py-2 px-2.5 rounded-xl border border-[var(--border-color)] text-center cursor-pointer block transition-colors shadow-2xs">
                              <span>📎 {editingRep?.nationalIdCardPhoto ? 'استبدال الوجه' : 'إرفاق وجه البطاقة'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file && editingRep && onUpdateRepresentative) {
                                    try {
                                      const compressed = await compressImageFile(file, 1200, 1200, 0.85, { applyWatermark: false });
                                      onUpdateRepresentative({
                                        ...editingRep,
                                        nationalIdCardPhoto: compressed,
                                      });
                                    } catch {}
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                          </div>

                          {/* 3. National ID Card Photo (Back) */}
                          <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] flex flex-col justify-between space-y-2.5 hover:border-purple-500/30 transition-all shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-[var(--text-primary)] flex items-center gap-1">
                                <span>🔄</span>
                                <span>بطاقة الرقم القومي (الظهر)</span>
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                editingRep?.nationalIdCardBackPhoto
                                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              }`}>
                                {editingRep?.nationalIdCardBackPhoto ? 'خلفي ✓' : 'غير مرفق ✕'}
                              </span>
                            </div>

                            {/* Preview Area */}
                            {editingRep?.nationalIdCardBackPhoto ? (
                              <div className="relative group aspect-[16/10] max-h-32 rounded-2xl overflow-hidden bg-[var(--input-bg)] border border-purple-500/30 flex items-center justify-center shadow-xs">
                                <img
                                  src={editingRep.nationalIdCardBackPhoto}
                                  alt="ظهر البطاقة الخلفي"
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewAvatarRep({ ...editingRep, avatar: editingRep.nationalIdCardBackPhoto })}
                                    className="bg-purple-500 hover:bg-purple-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>تكبير</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-[16/10] max-h-32 rounded-2xl border-2 border-dashed border-[var(--border-color)] bg-[var(--input-bg)]/50 flex flex-col items-center justify-center text-[var(--text-muted)] gap-1">
                                <FileText className="w-6 h-6 opacity-40" />
                                <span className="text-[10px] font-bold">الظهر الخلفي غير مرفق</span>
                              </div>
                            )}

                            {/* Upload / Replace Action */}
                            <label className="text-[10.5px] bg-[var(--input-bg)] hover:bg-purple-500/15 text-[var(--text-primary)] hover:text-purple-600 font-extrabold py-2 px-2.5 rounded-xl border border-[var(--border-color)] text-center cursor-pointer block transition-colors shadow-2xs">
                              <span>📎 {editingRep?.nationalIdCardBackPhoto ? 'استبدال الظهر' : 'إرفاق ظهر البطاقة'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file && editingRep && onUpdateRepresentative) {
                                    try {
                                      const compressed = await compressImageFile(file, 1200, 1200, 0.85);
                                      onUpdateRepresentative({
                                        ...editingRep,
                                        nationalIdCardBackPhoto: compressed,
                                      });
                                    } catch {}
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                          </div>

                        </div>
                      </div>

                      {/* ── OFFICIAL DOCUMENTS & LEGAL CREDENTIALS ─────────────────── */}
                      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-3.5 rounded-3xl space-y-2.5">
                        <label className="block text-[var(--text-primary)] font-black text-xs">
                          📂 الأوراق الثبوتية وتصاريح العمل الرسمية للمندوب
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (editingRep) setSelectedAdminDoc({ type: 'field_letter', rep: editingRep });
                            }}
                            className="bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-primary)] hover:text-amber-600 font-extrabold text-xs p-3 rounded-2xl border border-[var(--border-color)] hover:border-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-2xs"
                          >
                            <FileText className="w-4 h-4 text-amber-500" />
                            <span>تصريح العمل الميداني</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (editingRep) setSelectedAdminDoc({ type: 'digital_badge', rep: editingRep });
                            }}
                            className="bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-primary)] hover:text-amber-600 font-extrabold text-xs p-3 rounded-2xl border border-[var(--border-color)] hover:border-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-2xs"
                          >
                            <UserCheck className="w-4 h-4 text-amber-500" />
                            <span>كارنيه الهوية الرقمية</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (editingRep) setSelectedAdminDoc({ type: 'rep_contract', rep: editingRep });
                            }}
                            className="bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-primary)] hover:text-amber-600 font-extrabold text-xs p-3 rounded-2xl border border-[var(--border-color)] hover:border-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-2xs"
                          >
                            <FileSignature className="w-4 h-4 text-amber-500" />
                            <span>عقد الانضمام والعمل</span>
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()
              )}

              {/* ── ACCOUNT SETTINGS & PERMISSIONS FORM ─────────────────────── */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] p-3.5 sm:p-4 rounded-3xl space-y-3 shadow-xs">
                <div className="border-b border-[var(--border-color)] pb-2">
                  <span className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                    ⚙️ البيانات الأساسية والصلاحيات
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Account Role */}
                  <div className="sm:col-span-2">
                    <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">
                      نوع وتصنيف الحساب والصلاحية *
                    </label>
                    <select
                      value={modalRole}
                      onChange={(e) => setModalRole(e.target.value as UserRole)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-extrabold text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
                    >
                      <option value="rep">💼 مندوب مبيعات ميداني (تسجيل المحلات والتحصيل)</option>
                      <option value="supervisor">👑 مشرف إدارة منطقة ومحافظة</option>
                      <option value="accountant">🧾 محاسب ومحصل فواتير إلكترونية</option>
                      <option value="admin">🛡️ مدير النظام (أدمن بجميع الصلاحيات)</option>
                    </select>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">الاسم الثلاثي *</label>
                    <input
                      type="text"
                      required
                      placeholder="مصطفى علي محمود"
                      value={modalName}
                      onChange={(e) => setModalName(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">رقم الهاتف للتواصل *</label>
                    <input
                      type="tel"
                      required
                      placeholder="010xxxxxxx"
                      value={modalPhone}
                      onChange={(e) => setModalPhone(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-800 dark:text-amber-300 font-mono font-black text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 dir-ltr text-right shadow-xs"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">البريد الإلكتروني للدخول</label>
                    <input
                      type="email"
                      placeholder="user@dalelak.eg"
                      value={modalEmail}
                      onChange={(e) => setModalEmail(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>

                  {/* Governorate */}
                  <div>
                    <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">المحافظة / النطاق *</label>
                    <select
                      value={modalGov}
                      onChange={(e) => setModalGov(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
                    >
                      {EGYPT_GOVERNORATES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  {/* Target & Commission */}
                  <div>
                    <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">المستهدف الشهري (عدد أنشطة)</label>
                    <input
                      type="number"
                      min={1}
                      value={modalTarget}
                      onChange={(e) => setModalTarget(Number(e.target.value))}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">نسبة العمولة (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      value={modalCommission}
                      onChange={(e) => setModalCommission(Number(e.target.value))}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs font-mono"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">حالة الحساب *</label>
                    <select
                      value={modalStatus}
                      onChange={(e) => setModalStatus(e.target.value as any)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
                    >
                      <option value="active">✅ نشط ومصرح له بالعمل</option>
                      <option value="suspended">⏳ معلق وبانتظار المراجعة</option>
                    </select>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[var(--text-secondary)] font-bold text-xs mb-1">كلمة المرور *</label>
                    <input
                      type="text"
                      required
                      value={modalPassword}
                      onChange={(e) => setModalPassword(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Referral Settings Section */}
              <div className="bg-[var(--bg-surface)] p-3.5 sm:p-4 rounded-3xl border border-[var(--border-color)] space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>إعدادات نظام الإحالة والدعوة الميدانية</span>
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={modalAdminBypassReferral}
                      onChange={(e) => setModalAdminBypassReferral(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-400"
                    />
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">تجاوز المهام وفتح كود الدعوة فوراً</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[var(--text-muted)] text-[11px] font-bold mb-1">كود الإحالة الخاص بالمندوب:</label>
                    <input
                      type="text"
                      value={modalReferralCode}
                      onChange={(e) => setModalReferralCode(e.target.value.toUpperCase())}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-700 dark:text-amber-300 font-mono font-bold rounded-xl p-2 focus:outline-none focus:border-amber-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-muted)] text-[11px] font-bold mb-1">كود المندوب الذي دعاه (إن وجد):</label>
                    <input
                      type="text"
                      placeholder="مثال: DALIL-7711"
                      value={modalReferredByCode}
                      onChange={(e) => setModalReferredByCode(e.target.value.toUpperCase())}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-700 dark:text-amber-300 font-mono font-bold rounded-xl p-2 focus:outline-none focus:border-amber-500 uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-color)]">
              {editingAccId && canUserDeleteAccount(currentUser) && onDeleteRepresentative && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الحساب نهائياً من المنظومة؟')) {
                      onDeleteRepresentative(editingAccId);
                      setShowAccountModal(false);
                    }
                  }}
                  className="bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/30 font-black px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف الحساب</span>
                </button>
              )}

              <div className="flex items-center gap-2 mr-auto">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold px-4 py-2.5 rounded-xl border border-[var(--border-color)] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg cursor-pointer transition-transform active:scale-95"
                >
                  {editingAccId ? 'حفظ التعديلات' : 'إنشاء وتفعيل الحساب'}
                </button>
              </div>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 5: COMMISSION PAYOUT REQUESTS & DISBURSEMENT */}
      {/* --------------------------------------------------------------------- */}
      {activeAdminTab === 'payouts' && (
        <div className="space-y-4 animate-fade-in">
          {/* Header Summary & Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[var(--bg-card)] border border-amber-500/40 p-4 rounded-3xl shadow-sm space-y-1">
              <div className="flex items-center justify-between text-xs text-amber-500 font-bold">
                <span>الطلبات المعلقة قيد التحويل</span>
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-amber-500 font-mono">
                {payoutRequests.filter((p) => p.status === 'pending').reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString()} <span className="text-xs">ج.م</span>
              </p>
              <p className="text-[10px] text-[var(--text-muted)] font-bold">
                {payoutRequests.filter((p) => p.status === 'pending').length} طلب بانتظار الاعتماد
              </p>
            </div>

            <div className="bg-[var(--bg-card)] border border-emerald-500/40 p-4 rounded-3xl shadow-sm space-y-1">
              <div className="flex items-center justify-between text-xs text-emerald-500 font-bold">
                <span>إجمالي العمولات المصروفة</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-emerald-500 font-mono">
                {payoutRequests.filter((p) => p.status === 'approved').reduce((sum, p) => sum + (Number(p.amount) || 0), 0).toLocaleString()} <span className="text-xs">ج.م</span>
              </p>
              <p className="text-[10px] text-[var(--text-muted)] font-bold">
                {payoutRequests.filter((p) => p.status === 'approved').length} حوالة مكتملة
              </p>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-sm space-y-1">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
                <span>إجمالي طلبات السحب المسجلة</span>
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-black text-[var(--text-primary)] font-mono">
                {payoutRequests.length}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] font-bold">
                من جميع المناديب الميدانيين
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 bg-[var(--bg-card)] p-2 rounded-2xl border border-[var(--border-color)] text-xs flex-wrap">
            <span className="font-bold text-[var(--text-muted)] px-2 text-[11px]">تصفية الطلبات:</span>
            {[
              { key: 'all', label: `الكل (${payoutRequests.length})` },
              { key: 'pending', label: `قيد المراجعة ⏳ (${payoutRequests.filter((p) => p.status === 'pending').length})` },
              { key: 'approved', label: `تم الصرف والتحويل ✅ (${payoutRequests.filter((p) => p.status === 'approved').length})` },
              { key: 'rejected', label: `مرفوضة ❌ (${payoutRequests.filter((p) => p.status === 'rejected').length})` },
            ].map((f) => (
              <button
                type="button"
                key={f.key}
                onClick={() => setPayoutFilter(f.key as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  payoutFilter === f.key
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Payouts Table / List */}
          {payoutRequests.filter((p) => payoutFilter === 'all' || p.status === payoutFilter).length > 0 ? (
            <div className="space-y-2.5">
              {payoutRequests
                .filter((p) => payoutFilter === 'all' || p.status === payoutFilter)
                .map((payout) => {
                  const rep = representatives.find((r) => r.id === payout.repId);
                  const isPending = payout.status === 'pending';
                  const formattedPhone = (payout.repPhone || '').replace(/^0/, '');
                  const waUrl = `https://wa.me/20${formattedPhone}?text=${encodeURIComponent(
                    `مرحباً زميلنا ${payout.repName}، بخصوص طلب سحب العمولة بقيمة ${payout.amount} ج.م...`
                  )}`;

                    const isRemittance = payout.type === 'remittance';
                    return (
                      <div
                        key={payout.id}
                        className={`bg-[var(--bg-card)] border rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 transition-colors ${
                          isRemittance ? 'border-blue-500/40 hover:border-blue-500' : 'border-[var(--border-color)] hover:border-amber-500/40'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                              isRemittance ? 'bg-blue-500/15 text-blue-500' : 'bg-emerald-500/15 text-emerald-500'
                            }`}>
                              {isRemittance ? <CreditCard className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-black text-sm text-[var(--text-primary)]">
                                  {payout.repName}
                                </h4>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                                  isRemittance 
                                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30'
                                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                                }`}>
                                  {isRemittance ? '📥 إشعار سداد وتوريد للمنصة' : '💵 طلب سحب عمولة'}
                                </span>
                                {rep && (
                                  <span className="bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                    مندوب {rep.governorate}
                                  </span>
                                )}
                                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                                  • {new Date(payout.requestDate).toLocaleString('ar-EG')}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                                رقم المندوب: <span className="font-mono font-bold">{payout.repPhone}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-black text-lg ${
                              isRemittance ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {payout.amount.toLocaleString()} ج.م
                            </span>
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                              payout.status === 'approved'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : payout.status === 'rejected'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse-subtle'
                            }`}>
                              {payout.status === 'approved'
                                ? isRemittance ? 'تم اعتماد السداد ✅' : 'تم الصرف والتحويل ✅'
                                : payout.status === 'rejected'
                                ? 'مرفوض ❌'
                                : 'قيد المراجعة ⏳'}
                            </span>
                          </div>
                        </div>

                        {/* Details & Transfer info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)]">
                          <div>
                            <span className="text-[var(--text-muted)] block text-[10px] font-bold">
                              {isRemittance ? 'وسيلة السداد المستخدمة:' : 'وسيلة الاستلام والتحويل:'}
                            </span>
                            <span className="font-bold text-[var(--text-primary)]">
                              {PAYOUT_METHOD_LABELS[payout.method]}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--text-muted)] block text-[10px] font-bold">
                              {isRemittance ? 'رقم الحساب / المحفظة المحول منها أو إليها:' : 'رقم المحفظة / معرف إنستاباي:'}
                            </span>
                            <span className="font-mono font-black text-amber-700 dark:text-amber-300 text-sm">
                              {payout.accountDetails}
                            </span>
                          </div>
                          {payout.transactionRef && (
                            <div className="sm:col-span-2">
                              <span className="text-[var(--text-muted)] block text-[10px] font-bold">رقم المعاملة / الحوالة المسجلة:</span>
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {payout.transactionRef}
                              </span>
                            </div>
                          )}

                          {/* Receipt Photo Section */}
                          {payout.receiptPhoto && (
                            <div className="sm:col-span-2 bg-[var(--bg-card)] p-2.5 rounded-xl border border-amber-500/40 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={payout.receiptPhoto}
                                  alt="صورة إيصال التحويل"
                                  loading="lazy"
                                  decoding="async"
                                  className="w-12 h-12 object-cover rounded-lg border border-slate-600 bg-slate-900 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setSelectedReceiptPhoto(payout.receiptPhoto!)}
                                />
                                <div>
                                  <span className="text-xs font-black text-amber-700 dark:text-amber-300 block">
                                    صورة إيصال / لقطة شاشة السداد 🧾
                                  </span>
                                  <span className="text-[10px] text-[var(--text-muted)]">
                                    اضغط للمعاينة والتدقيق بالحجم الكامل
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedReceiptPhoto(payout.receiptPhoto!)}
                                className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>معاينة الإيصال</span>
                              </button>
                            </div>
                          )}

                          {payout.adminNotes && (
                            <div className="sm:col-span-2">
                              <span className="text-[var(--text-muted)] block text-[10px] font-bold">ملاحظات الإدارة:</span>
                              <span className="italic text-[var(--text-secondary)]">
                                {payout.adminNotes}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* ── 🔍 SMART COMMISSION AUDIT & FRAUD DETECTION ENGINE ── */}
                        {(() => {
                          const repBiz = businesses.filter((b) => b.repId === payout.repId || (rep && (b.repName === rep.name || b.repId === rep.phone)));
                          const repRate = rep?.commissionRate || 42.86;
                          const repSettlement = calculateRepSettlement(payout.repId, repBiz, repRate, payoutRequests);
                          const verifiedBiz = repBiz.filter((b) => b.verificationStatus === 'verified');
                          const unverifiedBiz = repBiz.filter((b) => b.verificationStatus !== 'verified');
                          const isExcessiveAmount = !isRemittance && (payout.amount > (repSettlement.withdrawableBalance + 0.5));
                          const hasDebtToPlatform = repSettlement.isDebtToPlatform;
                          const isAuditExpanded = expandedAuditPayoutId === payout.id;

                          return (
                            <div className="bg-[var(--bg-surface)] border border-amber-500/30 rounded-2xl p-3.5 space-y-3 shadow-xs">
                              {/* Audit Header Bar */}
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-2.5">
                                <div className="flex items-center gap-2">
                                  <ShieldAlert className={`w-4 h-4 ${isExcessiveAmount ? 'text-rose-500 animate-bounce' : hasDebtToPlatform ? 'text-amber-500' : 'text-emerald-500'}`} />
                                  <span className="font-black text-xs text-[var(--text-primary)]">
                                    تقرير التدقيق والتحليل المالي للطلب:
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {isExcessiveAmount ? (
                                    <span className="bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 text-[10.5px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1">
                                      <span>🚨 تنبيه تلاعب: المبلغ المطلوب ({payout.amount} ج) أكبر من رصيده الفعلي ({repSettlement.withdrawableBalance} ج)!</span>
                                    </span>
                                  ) : hasDebtToPlatform && !isRemittance ? (
                                    <span className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-[10.5px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1">
                                      <span>⚠️ تنبيه: المندوب في ذمته كاش محصل للمنصة ({repSettlement.debtToPlatformAmount} ج) لم يورده بعد!</span>
                                    </span>
                                  ) : unverifiedBiz.length > 0 ? (
                                    <span className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10.5px] font-black px-2.5 py-1 rounded-lg">
                                      <span>⏳ تنبيه: ({unverifiedBiz.length}) نشاط قيد التوثيق والمراجعة</span>
                                    </span>
                                  ) : (
                                    <span className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 text-[10.5px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>سليم ومطابق 100%: الأنشطة موثقة ومسددة والمبلغ مستحق</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* 4 Financial Metric Cards */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                                <div className="bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)]">
                                  <span className="text-[10px] text-[var(--text-muted)] font-bold block">إجمالي أنشطة المندوب</span>
                                  <span className="font-black text-sm text-[var(--text-primary)] font-mono">
                                    {repBiz.length} <span className="text-[10px] text-emerald-600 font-sans">({verifiedBiz.length} موثق ✅)</span>
                                  </span>
                                </div>

                                <div className="bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)]">
                                  <span className="text-[10px] text-[var(--text-muted)] font-bold block">كاش استلمه بيده 💵</span>
                                  <span className="font-black text-sm text-amber-600 dark:text-amber-400 font-mono">
                                    {repSettlement.totalCashInHand.toLocaleString()} ج.م
                                  </span>
                                </div>

                                <div className="bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)]">
                                  <span className="text-[10px] text-[var(--text-muted)] font-bold block">عمولته المستحقة 💎</span>
                                  <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                                    {repSettlement.totalEarnedCommission.toLocaleString()} ج.م
                                  </span>
                                </div>

                                <div className={`p-2 rounded-xl border font-mono ${
                                  repSettlement.isDebtToPlatform
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                                }`}>
                                  <span className="text-[10px] text-[var(--text-muted)] font-bold font-sans block">الرصيد الفعلي المتاح للسحب</span>
                                  <span className="font-black text-sm">
                                    {repSettlement.isDebtToPlatform
                                      ? `مستحق عليه: ${repSettlement.debtToPlatformAmount} ج`
                                      : `${repSettlement.withdrawableBalance.toLocaleString()} ج.م`}
                                  </span>
                                </div>
                              </div>

                              {/* Toggle Detailed Breakdown Button */}
                              <div className="flex items-center justify-between pt-1">
                                <button
                                  type="button"
                                  onClick={() => setExpandedAuditPayoutId(isAuditExpanded ? null : payout.id)}
                                  className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:text-amber-600 flex items-center gap-1.5 cursor-pointer"
                                >
                                  {isAuditExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  <span>{isAuditExpanded ? 'إخفاء كشف حساب وتفاصيل الأنشطة ▲' : `عرض كشف حساب الأنشطة والتحصيلات للتدقيق (${repBiz.length} نشاط) ▼`}</span>
                                </button>

                                <span className="text-[10px] text-[var(--text-muted)] font-bold">
                                  نسبة عمولة المندوب المعتمدة: {repRate}%
                                </span>
                              </div>

                              {/* Collapsible Detailed Activities List for Instant Audit */}
                              {isAuditExpanded && (
                                <div className="space-y-2 pt-2 border-t border-[var(--border-color)] max-h-72 overflow-y-auto animate-fade-in">
                                  {repBiz.length > 0 ? (
                                    repBiz.map((biz) => {
                                      const isVerified = biz.verificationStatus === 'verified';
                                      const isPaid = (biz.amountPaid || 0) > 0 || (biz.paymentStatus as string) === 'paid_full' || (biz.paymentStatus as string) === 'paid_deposit';
                                      const isCashHand = (biz.cashCollectedByRep || 0) > 0 || (biz.paymentMethod as string) === 'cash_by_rep';
                                      const commAmt = Math.round(((biz.amountPaid || 0) * repRate) / 100);
                                      const platAmt = (biz.amountPaid || 0) - commAmt;

                                      return (
                                        <div
                                          key={biz.id}
                                          className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-all ${
                                            isPaid && isVerified
                                              ? 'bg-[var(--bg-card)] border-emerald-500/30'
                                              : isPaid && !isVerified
                                              ? 'bg-blue-500/5 border-blue-500/30'
                                              : 'bg-[var(--input-bg)] border-[var(--border-color)]'
                                          }`}
                                        >
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="font-black text-[var(--text-primary)]">
                                                {biz.nameAr || biz.nameEn || 'نشاط تجاري'}
                                              </span>
                                              <span className="text-[10px] text-[var(--text-muted)]">
                                                ({biz.governorate} - {biz.city})
                                              </span>
                                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                                isVerified ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                                              }`}>
                                                {isVerified ? '✅ موثق ومعتمد' : '⏳ قيد المراجعة'}
                                              </span>
                                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                                isPaid ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                                              }`}>
                                                {isPaid ? (isCashHand ? '💵 محصل كاش بيده' : '💳 مسدد إلكترونياً') : '⚠️ غير مسدد'}
                                              </span>
                                            </div>
                                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-bold">
                                              باقة: {biz.packageName} ({biz.packagePrice} ج) • المحصل الفعلي: <strong className="text-[var(--text-primary)]">{biz.amountPaid || 0} ج.م</strong>
                                            </p>
                                          </div>

                                          <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
                                            <div>
                                              <span className="text-[9px] text-emerald-600 block font-sans font-bold">عمولة المندوب:</span>
                                              <span className="font-black text-emerald-600 dark:text-emerald-400">+{commAmt} ج</span>
                                            </div>
                                            <div>
                                              <span className="text-[9px] text-[var(--text-muted)] block font-sans font-bold">للمنصة:</span>
                                              <span className="font-black text-[var(--text-primary)]">{platAmt} ج</span>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <p className="text-center text-xs text-[var(--text-muted)] py-2">
                                      لا توجد أنشطة مسجلة باسم هذا المندوب في النظام بعد.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Admin Actions Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>تواصل واتساب مع المندوب</span>
                          </a>

                          {isPending && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setActivePayoutModal({ payout, action: 'reject' });
                                  setPayoutAdminNotes('');
                                }}
                                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-black text-xs px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                              >
                                ✕ رفض الطلب
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActivePayoutModal({ payout, action: 'approve' });
                                  setPayoutTransactionRef('');
                                  setPayoutAdminNotes('');
                                }}
                                className={`text-white font-black text-xs px-4 py-1.5 rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-1 ${
                                  isRemittance 
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
                                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                                }`}
                              >
                                <Check className="w-4 h-4" />
                                <span>{isRemittance ? 'اعتماد وتأكيد السداد' : 'اعتماد وصرف الحوالة'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                })}
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-8 text-center space-y-2">
              <DollarSign className="w-10 h-10 text-amber-500/50 mx-auto" />
              <p className="font-black text-sm text-[var(--text-primary)]">لا توجد طلبات سحب في هذا القسم حالياً</p>
              <p className="text-xs text-[var(--text-muted)]">عندما يقوم أي مندوب بطلب سحب عمولاته، ستظهر بياناته ومحفظته هنا فورياً.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL 3: PAYMENT GATEWAY CONFIG MODAL */}
      {showPaymentModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <form
              onSubmit={handleSavePaymentConfigModal}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 text-xs my-auto text-[var(--text-primary)] shadow-2xl transition-colors duration-300 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h3 className="font-black text-base text-[var(--text-primary)] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <span>تعديل محافظ التحويل الإلكتروني</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[var(--text-primary)] font-extrabold mb-1">
                    رقم المحفظة الرئيسي (1) - فودافون كاش / اتصالات / وي / أورانج:
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01143888355"
                    value={vodaNumber}
                    onChange={(e) => setVodaNumber(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-emerald-700 dark:text-emerald-300 font-mono font-black rounded-xl p-3 focus:outline-none focus:border-amber-500 dir-ltr text-right shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-primary)] font-extrabold mb-1">
                    معرف / حساب إنستاباي الرسمي (InstaPay Handle / IPA):
                  </label>
                  <input
                    type="text"
                    placeholder="@daz31181"
                    value={instaHandle}
                    onChange={(e) => setInstaHandle(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-purple-500/40 text-purple-700 dark:text-purple-300 font-mono font-black rounded-xl p-3 focus:outline-none focus:border-purple-500 dir-ltr text-right shadow-xs"
                  />
                  <span className="text-[10.5px] text-[var(--text-muted)] font-bold mt-0.5 block">
                    مثال: @daz31181 لاستقبال التحويلات اللحظية من تطبيق InstaPay
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold px-4 py-2 rounded-xl border border-[var(--border-color)] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-2 rounded-xl shadow cursor-pointer"
                >
                  حفظ الأرقام
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {/* MODAL 4: AVATAR / DOCUMENT PREVIEW MODAL */}
      {previewAvatarRep &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl relative text-[var(--text-primary)] my-auto transition-colors duration-300 max-h-[92vh] overflow-y-auto">
              <button
                onClick={() => setPreviewAvatarRep(null)}
                className="absolute top-4 left-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer"
              >
                ✕
              </button>

              <div className="text-center space-y-1 pt-1">
                <h3 className="font-black text-base text-[var(--text-primary)]">معاينة وثيقة الهوية المرفوعة</h3>
                <p className="text-xs text-amber-500 font-bold">
                  {previewAvatarRep.name} • {previewAvatarRep.governorate}
                </p>
              </div>

              <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center space-y-3">
                {previewAvatarRep.avatar ? (
                  <img
                    src={previewAvatarRep.avatar}
                    alt={previewAvatarRep.name}
                    loading="lazy"
                    decoding="async"
                    className="max-w-full max-h-[60vh] object-contain rounded-2xl border-2 border-amber-500 shadow-xl"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-2xl bg-slate-800 flex items-center justify-center text-amber-400 font-black text-4xl">
                    {previewAvatarRep.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateRepresentative) {
                      onUpdateRepresentative({ ...previewAvatarRep, avatarStatus: 'approved' });
                    }
                    setPreviewAvatarRep(null);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 rounded-xl shadow cursor-pointer transition-transform active:scale-95"
                >
                  ✔ قبول وتوثيق
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateRepresentative) {
                      onUpdateRepresentative({ ...previewAvatarRep, avatarStatus: 'rejected' });
                    }
                    setPreviewAvatarRep(null);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2.5 rounded-xl shadow cursor-pointer transition-transform active:scale-95"
                >
                  ✕ رفض الوثيقة
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL 5: DOCUMENT VIEWER MODAL */}
      {selectedAdminDoc && (
        <DocViewerModal
          docType={selectedAdminDoc.type}
          rep={selectedAdminDoc.rep}
          onClose={() => setSelectedAdminDoc(null)}
        />
      )}

      {/* MODAL 6: GOOGLE MAPS SYNC MODAL */}
      {syncModalBiz && (
        <GoogleMapsSyncModal
          business={syncModalBiz}
          isOpen={Boolean(syncModalBiz)}
          onClose={() => setSyncModalBiz(null)}
          onUpdateBusiness={(updated) => {
            if (onUpdateBusiness) onUpdateBusiness(updated);
            setSyncModalBiz(updated);
          }}
        />
      )}

      {/* MODAL 7: PAYOUT APPROVAL OR REJECTION MODAL */}
      {activePayoutModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 text-xs my-auto text-[var(--text-primary)] shadow-2xl transition-colors duration-300 relative max-h-[92vh] overflow-y-auto">
              <button
                onClick={() => setActivePayoutModal(null)}
                className="absolute top-4 left-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer"
              >
                ✕
              </button>

              <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  activePayoutModal.action === 'approve' 
                    ? activePayoutModal.payout.type === 'remittance' ? 'bg-blue-500/15 text-blue-500' : 'bg-emerald-500/15 text-emerald-500'
                    : 'bg-rose-500/15 text-rose-500'
                }`}>
                  {activePayoutModal.action === 'approve' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-black text-base text-[var(--text-primary)]">
                    {activePayoutModal.action === 'approve' 
                      ? activePayoutModal.payout.type === 'remittance' ? 'تأكيد استلام السداد وتصفية الحساب 💳' : 'تأكيد اعتماد وصرف الحوالة 💵' 
                      : activePayoutModal.payout.type === 'remittance' ? 'رفض إشعار السداد ❌' : 'رفض طلب سحب العمولة ❌'}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-medium">
                    المندوب: <strong className="text-amber-700 dark:text-amber-300">{activePayoutModal.payout.repName}</strong>
                  </p>
                </div>
              </div>

              {/* Payout Summary Box */}
              <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)] font-bold">
                    {activePayoutModal.payout.type === 'remittance' ? 'المبلغ المسدد للمنصة:' : 'المبلغ المطلوب:'}
                  </span>
                  <span className={`font-mono font-black text-sm ${
                    activePayoutModal.payout.type === 'remittance' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {activePayoutModal.payout.amount.toLocaleString()} ج.م
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)] font-bold">وسيلة التحويل:</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {PAYOUT_METHOD_LABELS[activePayoutModal.payout.method]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)] font-bold">
                    {activePayoutModal.payout.type === 'remittance' ? 'الحساب / المحفظة المحول منها:' : 'رقم الحساب / المحفظة:'}
                  </span>
                  <span className="font-mono font-black text-amber-700 dark:text-amber-300">
                    {activePayoutModal.payout.accountDetails}
                  </span>
                </div>

                {/* Receipt Photo Preview Inside Modal */}
                {activePayoutModal.payout.receiptPhoto && (
                  <div className="pt-2 border-t border-[var(--border-color)]">
                    <span className="text-[10.5px] font-bold text-[var(--text-secondary)] block mb-1">
                      صورة إيصال السداد المرفقة:
                    </span>
                    <div 
                      onClick={() => setSelectedReceiptPhoto(activePayoutModal.payout.receiptPhoto!)}
                      className="rounded-xl overflow-hidden border border-amber-500/40 cursor-pointer relative group bg-slate-950 flex items-center justify-center p-1"
                    >
                      <img
                        src={activePayoutModal.payout.receiptPhoto}
                        alt="إيصال السداد"
                        loading="lazy"
                        decoding="async"
                        className="max-h-36 object-contain rounded-lg group-hover:opacity-80 transition-opacity"
                      />
                      <span className="absolute bottom-2 bg-slate-900/90 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/40 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>اضغط للمعاينة بالحجم الكامل</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (onUpdatePayoutRequest) {
                    const updated: PayoutRequest = {
                      ...activePayoutModal.payout,
                      status: activePayoutModal.action === 'approve' ? 'approved' : 'rejected',
                      processedDate: new Date().toISOString(),
                      transactionRef: payoutTransactionRef.trim() || activePayoutModal.payout.transactionRef,
                      adminNotes: payoutAdminNotes.trim() || activePayoutModal.payout.adminNotes,
                    };
                    onUpdatePayoutRequest(updated);
                  }
                  setActivePayoutModal(null);
                }}
                className="space-y-3"
              >
                {activePayoutModal.action === 'approve' ? (
                  <div>
                    <label className="block text-[var(--text-primary)] font-bold mb-1">
                      رقم المعاملة / إيصال التحويل (Transaction Ref / الحوالة):
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: TXN-9482910 أو رقم إشعار كاش"
                      value={payoutTransactionRef}
                      onChange={(e) => setPayoutTransactionRef(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                    />
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      يظهر رقم المعاملة للمندوب في سجله المالي لتأكيد استلام المبلغ.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-rose-600 dark:text-rose-400 font-bold mb-1">
                      سبب الرفض (سيصل للمندوب في الإشعار) *:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: صورة الإيصال غير واضحة / المبلغ لم يصل في المحفظة"
                      value={payoutAdminNotes}
                      onChange={(e) => setPayoutAdminNotes(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-rose-500/40 text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-rose-500 shadow-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[var(--text-primary)] font-bold mb-1">
                    ملاحظة إضافية للمندوب (اختياري):
                  </label>
                  <input
                    type="text"
                    placeholder="ملاحظات توضيحية..."
                    value={payoutAdminNotes}
                    onChange={(e) => setPayoutAdminNotes(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    onClick={() => setActivePayoutModal(null)}
                    className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold px-4 py-2 rounded-xl border border-[var(--border-color)] cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className={`font-black px-5 py-2 rounded-xl shadow cursor-pointer text-white transition-transform active:scale-95 ${
                      activePayoutModal.action === 'approve'
                        ? activePayoutModal.payout.type === 'remittance'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {activePayoutModal.action === 'approve' 
                      ? activePayoutModal.payout.type === 'remittance' ? 'تأكيد السداد وتصفية الذمة' : 'تأكيد الحوالة وصرف المبلغ'
                      : 'تأكيد رفض الطلب'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL 8: FULL RECEIPT PHOTO LIGHTBOX PREVIEW */}
      {selectedReceiptPhoto &&
        createPortal(
          <div
            className="fixed inset-0 z-[10050] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 cursor-pointer animate-fade-in"
            onClick={() => setSelectedReceiptPhoto(null)}
          >
            <div
              className="relative max-w-2xl w-full bg-[var(--bg-card)] border-2 border-amber-500/50 rounded-3xl shadow-2xl space-y-3 cursor-default overflow-hidden my-auto p-4 sm:p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-500" />
                  <span>معاينة وتدقيق صورة إيصال السداد / التحويل</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptPhoto(null)}
                  className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center justify-center p-2 max-h-[72vh] overflow-auto bg-slate-950/60 rounded-2xl border border-[var(--border-color)]">
                <img
                  src={selectedReceiptPhoto}
                  alt="صورة الإيصال بالحجم الكامل"
                  loading="lazy"
                  decoding="async"
                  className="max-w-full max-h-[68vh] object-contain rounded-xl shadow-xl"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)]">
                <span className="text-[11px] text-[var(--text-muted)]">
                  يمكنك مراجعة رقم الحوالة، اسم المستفيد، والتاريخ للتأكد من وصول المبلغ.
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptPhoto(null)}
                  className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  إغلاق المعاينة
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* PERMISSIONS MATRIX & ROLES GUIDE MODAL */}
      {showPermissionsModal && (
        <PermissionsModal onClose={() => setShowPermissionsModal(false)} />
      )}
    </div>
  );
};
