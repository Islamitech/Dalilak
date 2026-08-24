import React, { useState, useEffect, useMemo } from 'react';
import { DocViewerModal } from './DocViewerModal';
import { Business, Representative, PaymentGatewayConfig, UserRole, VerificationStatus, PaymentStatus } from '../types';
import { EGYPT_GOVERNORATES, PACKAGES, BUSINESS_CATEGORIES } from '../data/mockData';
import { calculateTotalRepCommission } from '../utils/commission';
import { formatActivityDateTime, sortBusinessesNewestFirst } from '../utils/dateFormatters';
import { getRepReferralCode, isReferralSystemUnlocked, calculateReferralCommissionRate } from '../utils/referral';
import { compressImageFile } from '../utils/imageCompressor';
import { UserAvatar } from './UserAvatar';
import { BusinessEditModal } from './BusinessEditModal';
import { GoogleMapsSyncModal } from './GoogleMapsSyncModal';
import {
  ShieldCheck,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Zap,
  Send,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  ExternalLink,
  Phone,
  FileText,
  FileSignature,
  CreditCard,
  UserCheck,
  UserX,
  Briefcase,
  Crown,
  Calculator,
  Camera,
  Activity,
  Store,
  MapPin,
  Settings,
  X,
  Save,
  Check,
  Building2,
  Eye,
  Image as ImageIcon,
  User,
  Info,
  Calendar,
  Hash,
  Compass,
  UploadCloud,
  PieChart,
  BarChart3,
  Award,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface AdminDashboardProps {
  businesses: Business[];
  representatives: Representative[];
  paymentConfig: PaymentGatewayConfig;
  onUpdateBusiness: (biz: Business) => void;
  onDeleteBusiness: (id: string) => void;
  onAddRepresentative: (rep: Partial<Representative>) => void;
  onUpdateRepresentative?: (rep: Representative) => void;
  onDeleteRepresentative?: (id: string) => void;
  onUpdatePaymentConfig: (config: PaymentGatewayConfig) => void;
  onShowInvoice: (biz: Business) => void;
  onCollectPayment?: (biz: Business) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  businesses,
  representatives,
  paymentConfig,
  onUpdateBusiness,
  onDeleteBusiness,
  onAddRepresentative,
  onUpdateRepresentative,
  onDeleteRepresentative,
  onUpdatePaymentConfig,
  onShowInvoice,
  onCollectPayment,
}) => {
  // Main Tab State
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'businesses' | 'reps' | 'gateways'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSubtab = urlParams.get('subtab');
    if (urlSubtab && ['overview', 'businesses', 'reps', 'gateways'].includes(urlSubtab)) {
      return urlSubtab as any;
    }

    const savedSubtab = localStorage.getItem('dalelak_active_admin_tab');
    if (savedSubtab && ['overview', 'businesses', 'reps', 'gateways'].includes(savedSubtab)) {
      return savedSubtab as any;
    }

    return 'overview';
  });

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

  // Search & Filter States
  const [bizSearchQuery, setBizSearchQuery] = useState<string>('');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');

  const [accountSearchQuery, setAccountSearchQuery] = useState<string>('');
  const [accountRoleFilter, setAccountRoleFilter] = useState<string>('all');
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>('all');

  // ---------------------------------------------------------------------------
  // MODAL STATES
  // ---------------------------------------------------------------------------
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

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
  const [fawryCode, setFawryCode] = useState<string>(paymentConfig.fawryMerchantCode || '');
  const [instaHandle, setInstaHandle] = useState<string>(paymentConfig.instaPayHandle || '');

  const [previewAvatarRep, setPreviewAvatarRep] = useState<Representative | null>(null);
  const [selectedAdminDoc, setSelectedAdminDoc] = useState<{ type: 'field_letter' | 'digital_badge' | 'rep_contract', rep: Representative } | null>(null);
  const [syncModalBiz, setSyncModalBiz] = useState<Business | null>(null);

  // ---------------------------------------------------------------------------
  // COMPREHENSIVE STATISTICS CALCULATIONS
  // ---------------------------------------------------------------------------
  const totalRevenue = businesses.reduce((acc, b) => acc + (b.amountPaid || 0), 0);
  const totalContractValue = businesses.reduce((acc, b) => acc + (b.packagePrice || 0), 0);
  const totalDebt = businesses.reduce((acc, b) => acc + Math.max(0, (b.packagePrice || 0) - (b.amountPaid || 0)), 0);
  const collectionRate = totalContractValue > 0 ? ((totalRevenue / totalContractValue) * 100).toFixed(1) : '0';
  const avgDealValue = businesses.length > 0 ? Math.round(totalContractValue / businesses.length) : 0;

  // Verification Pipeline Metrics
  const verifiedCount = businesses.filter((b) => b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced').length;
  const inProgressCount = businesses.filter(
    (b) => (b.verificationStatus === 'in_progress' || b.googleSyncStatus === 'in_progress') && b.verificationStatus !== 'verified' && b.googleSyncStatus !== 'synced'
  ).length;
  const notSubmittedCount = businesses.filter(
    (b) => b.verificationStatus !== 'verified' && b.verificationStatus !== 'in_progress' && b.googleSyncStatus !== 'synced' && b.googleSyncStatus !== 'in_progress'
  ).length;
  const verificationRate = businesses.length > 0 ? ((verifiedCount / businesses.length) * 100).toFixed(1) : '0';

  // Overdue Google Verification Detection (> 48 hours without approval)
  const overdueReviewBusinesses = useMemo(() => {
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return businesses.filter((b) => {
      const isInProgress = (b.verificationStatus === 'in_progress' || b.googleSyncStatus === 'in_progress') && b.verificationStatus !== 'verified' && b.googleSyncStatus !== 'synced';
      if (!isInProgress) return false;
      const createdTime = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return !createdTime || (now - createdTime > TWO_DAYS_MS);
    });
  }, [businesses]);

  const overdueReviewCount = overdueReviewBusinesses.length;

  // Verified Businesses with Unpaid / Remaining Balance
  const verifiedWithDebtBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      const isLive = b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced';
      const remaining = Math.max(0, (b.packagePrice || 0) - (b.amountPaid || 0));
      return isLive && remaining > 0;
    });
  }, [businesses]);

  const verifiedWithDebtCount = verifiedWithDebtBusinesses.length;
  const verifiedWithDebtTotal = verifiedWithDebtBusinesses.reduce(
    (sum, b) => sum + Math.max(0, (b.packagePrice || 0) - (b.amountPaid || 0)),
    0
  );

  // Governorate Breakdown
  const governorateStats = useMemo(() => {
    const govMap = new Map<string, { count: number; revenue: number; verified: number }>();
    businesses.forEach((b) => {
      const gov = b.governorate || 'القاهرة';
      const existing = govMap.get(gov) || { count: 0, revenue: 0, verified: 0 };
      existing.count += 1;
      existing.revenue += (b.amountPaid || 0);
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
      const pkgTitle = b.packageTitle || 'الباقة الفضية';
      const existing = pkgMap.get(pkgTitle) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += (b.packagePrice || 0);
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
        const collected = repBiz.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
        const verified = repBiz.filter((b) => b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced').length;
        const target = rep.targetMonth || 25;
        const achievement = target > 0 ? ((repBiz.length / target) * 100).toFixed(1) : '0';
        
        // Presence status: Online if last activity was within 59 minutes
        const isOnline = Boolean(
          rep.lastActiveTimestamp && (now - rep.lastActiveTimestamp < FIFTY_NINE_MINS_MS)
        );

        let lastActiveText = 'غير متصل';
        if (rep.lastActiveTimestamp) {
          const diffMinutes = Math.floor((now - rep.lastActiveTimestamp) / 60000);
          if (diffMinutes <= 1) {
            lastActiveText = 'نشط الآن';
          } else if (diffMinutes < 60) {
            lastActiveText = `نشط منذ ${diffMinutes} د`;
          } else {
            const diffHours = Math.floor(diffMinutes / 60);
            lastActiveText = diffHours < 24 ? `منذ ${diffHours} س` : 'غير متصل';
          }
        }

        return {
          rep,
          totalBiz: repBiz.length,
          verifiedBiz: verified,
          collectedRevenue: collected,
          target,
          achievement: Number(achievement),
          isOnline,
          lastActiveText,
        };
      })
      .sort((a, b) => b.totalBiz - a.totalBiz);
  }, [mergedAdminReps, businesses]);

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
      fawryMerchantCode: fawryCode.trim(),
      instaPayHandle: instaHandle.trim(),
    });
    setShowPaymentModal(false);
  };

  // Render role badge helper
  const renderRoleBadge = (role: UserRole = 'rep') => {
    switch (role) {
      case 'admin':
        return (
          <span className="bg-purple-500/15 text-purple-900 dark:text-purple-300 border border-purple-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <ShieldCheck className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>مدير النظام</span>
          </span>
        );
      case 'supervisor':
        return (
          <span className="bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>مشرف منطقة</span>
          </span>
        );
      case 'accountant':
        return (
          <span className="bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <Calculator className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>محاسب ومحصل</span>
          </span>
        );
      default:
        return (
          <span className="bg-blue-500/15 text-blue-900 dark:text-blue-300 border border-blue-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <Briefcase className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>مندوب ميداني</span>
          </span>
        );
    }
  };

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
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)]">لوحة تحكم مدير النظام</h2>
              <span className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                dalilaakeg@gmail.com
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-bold mt-0.5">
              الإدارة المركزية المباشرة لتوثيقات الأنشطة والمناديب والمؤشرات المالية
            </p>
          </div>
        </div>

        {/* Tab Selector Navigation */}
        <div className="flex items-center gap-1.5 bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-color)] text-xs shadow-inner">
          <button
            onClick={() => setActiveAdminTab('overview')}
            className={`px-4 py-2 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeAdminTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>الإحصائيات</span>
          </button>
          
          <button
            onClick={() => setActiveAdminTab('businesses')}
            className={`px-4 py-2 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeAdminTab === 'businesses'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>الأنشطة ({businesses.length})</span>
            {notSubmittedCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('reps')}
            className={`px-4 py-2 rounded-xl font-black transition-all relative cursor-pointer flex items-center gap-1.5 ${
              activeAdminTab === 'reps'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>الحسابات ({mergedAdminReps.length})</span>
            {mergedAdminReps.some((r) => r.status === 'suspended') && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('gateways')}
            className={`px-4 py-2 rounded-xl font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeAdminTab === 'gateways'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>بوابات الدفع</span>
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
                <span className="font-bold font-sans">{businesses.length} نشاط</span>
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

          {/* Team Performance Table (Pure Statistics & Metrics) */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>إحصائيات ومعدلات إنجاز فريق العمل الميداني</span>
              </h3>
              <span className="text-xs text-[var(--text-muted)] font-bold">
                ترتيب حسب أعلى الأنشطة المسجلة
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
              <table className="w-full text-xs text-right border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-[var(--input-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold">
                    <th className="p-3">اسم العضو / المندوب</th>
                    <th className="p-3">المحافظة والصلاحية</th>
                    <th className="p-3 text-center">الأنشطة المسجلة</th>
                    <th className="p-3 text-center">الأنشطة الموثقة</th>
                    <th className="p-3 text-center">المبالغ المحصلة</th>
                    <th className="p-3 text-center">المستهدف والإنجاز</th>
                    <th className="p-3 text-center">التواجد والنشاط (آخر 59 دقيقة)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {repPerformanceStats.map(({ rep, totalBiz, verifiedBiz, collectedRevenue, target, achievement, isOnline, lastActiveText }) => (
                    <tr key={rep.id} className="hover:bg-amber-500/5 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <UserAvatar avatar={rep.avatar} name={rep.name} role={rep.role} size="sm" />
                          <div>
                            <p className="font-black text-[var(--text-primary)]">{rep.name}</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-mono">{rep.phone}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <p className="font-bold text-[var(--text-primary)]">{rep.governorate}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{rep.roleTitle || 'مندوب'}</p>
                      </td>

                      <td className="p-3 text-center font-mono font-black text-sm text-[var(--text-primary)]">
                        {totalBiz}
                      </td>

                      <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {verifiedBiz}
                      </td>

                      <td className="p-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {collectedRevenue.toLocaleString()} ج.م
                      </td>

                      <td className="p-3 text-center">
                        <div className="space-y-1">
                          <span className={`font-mono font-bold text-xs ${achievement >= 100 ? 'text-emerald-600' : achievement >= 50 ? 'text-amber-600' : 'text-slate-500'}`}>
                            {achievement}% ({totalBiz}/{target})
                          </span>
                          <div className="w-20 bg-[var(--input-bg)] h-1.5 rounded-full mx-auto overflow-hidden">
                            <div
                              className={`h-full rounded-full ${achievement >= 100 ? 'bg-emerald-500' : achievement >= 50 ? 'bg-amber-500' : 'bg-slate-400'}`}
                              style={{ width: `${Math.min(100, achievement)}%` }}
                            />
                          </div>
                        </div>
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
              onClick={() => setVerificationFilter('not_submitted')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                verificationFilter === 'not_submitted'
                  ? 'bg-rose-600 text-white font-black shadow-xs'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>لم تُرفع بعد ({notSubmittedCount})</span>
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
              <span>قيد المراجعة ({inProgressCount})</span>
            </button>
            {overdueReviewCount > 0 && (
              <button
                onClick={() => setVerificationFilter('overdue')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  verificationFilter === 'overdue'
                    ? 'bg-orange-600 text-white font-black shadow-xs'
                    : 'bg-orange-500/10 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20 border border-orange-500/30'
                }`}
              >
                <span>⏱️ تجاوزت المدة ({overdueReviewCount})</span>
              </button>
            )}
            {verifiedWithDebtCount > 0 && (
              <button
                onClick={() => setVerificationFilter('verified_debt')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  verificationFilter === 'verified_debt'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                }`}
              >
                <span>⚠️ موثقة ولها متبقي ({verifiedWithDebtCount})</span>
              </button>
            )}
            <button
              onClick={() => setVerificationFilter('verified')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                verificationFilter === 'verified'
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>موثقة ومعتمدة ({verifiedCount})</span>
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

          {/* Businesses Data Table */}
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
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
                {filteredBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[var(--text-muted)] font-bold">
                      لا توجد أنشطة مطابقة للبحث أو التصفية الحالية.
                    </td>
                  </tr>
                ) : (
                  filteredBusinesses.map((biz) => {
                    const isLiveVerified = biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced';
                    const isInGoogleReview = (biz.verificationStatus === 'in_progress' || biz.googleSyncStatus === 'in_progress') && !isLiveVerified;
                    const isNotSubmitted = !isLiveVerified && !isInGoogleReview && biz.verificationStatus !== 'rejected';
                    const isOverdue = overdueReviewBusinesses.some((ov) => ov.id === biz.id);
                    const debtAmount = Math.max(0, (biz.packagePrice || 0) - (biz.amountPaid || 0));

                    return (
                      <tr key={biz.id} className="hover:bg-amber-500/5 transition-colors">
                        <td className="p-3">
                          <p className="font-extrabold text-[var(--text-primary)] text-sm">{biz.nameAr}</p>
                          {biz.nameEn && <p className="text-[10px] text-[var(--text-muted)] font-mono">{biz.nameEn}</p>}
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold mt-0.5">{biz.category}</p>
                        </td>

                        <td className="p-3">
                          <p className="font-bold text-[var(--text-primary)]">{biz.governorate} ({biz.city})</p>
                          <p className="text-[11px] text-[var(--text-secondary)] font-bold">المندوب: {biz.repName}</p>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-xs text-[var(--text-primary)] font-bold font-sans">
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{formatActivityDateTime(biz.createdDate || biz.invoiceDate)}</span>
                          </div>
                        </td>

                        <td className="p-3">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block ${
                            biz.paymentStatus === 'fully_paid'
                              ? 'badge-success'
                              : biz.paymentStatus === 'partially_paid'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}>
                            {biz.paymentStatus === 'fully_paid' ? 'مدفوع بالكامل' : biz.paymentStatus === 'partially_paid' ? `متبقي ${debtAmount.toLocaleString()} ج.م` : 'غير مسدد'}
                          </span>
                        </td>

                        <td className="p-3">
                          {isLiveVerified ? (
                            <div className="space-y-1">
                              <span className="badge-success text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>موثق ومعتمد ✅</span>
                              </span>
                              {debtAmount > 0 && (
                                <span className="badge-warning text-[9px] font-black px-2 py-0.5 rounded-full block w-fit">
                                  ⚠️ متبقي {debtAmount.toLocaleString()} ج.م
                                </span>
                              )}
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
                            {!isLiveVerified && (
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
                  })
                )}
              </tbody>
            </table>
          </div>
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
                onClick={openAddAccountModal}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 shadow-md shrink-0 transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>إضافة حساب جديد</span>
              </button>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
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
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAccounts.map((acc) => {
              const role = acc.role || 'rep';
              const isSuspended = acc.status === 'suspended';
              const isOnline = Boolean(
                acc.lastActiveTimestamp && (Date.now() - acc.lastActiveTimestamp < 59 * 60 * 1000)
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
                      {renderRoleBadge(role)}
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
                    {/* Referral & Mission Status Row */}
                    {(() => {
                      const repBizCount = businesses.filter((b) => b.repId === acc.id || b.repName === acc.name).length;
                      const repRefCode = getRepReferralCode(acc);
                      const isRefUnlocked = isReferralSystemUnlocked(acc, repBizCount);
                      const invitedCount = mergedAdminReps.filter((r) => r.id !== acc.id && r.referredByCode?.toUpperCase() === repRefCode).length;

                      return (
                        <div className="bg-[var(--input-bg)] p-2 rounded-xl border border-[var(--border-color)] flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 font-mono font-bold">
                            <span className="text-[var(--text-muted)]">كود:</span>
                            <span className="text-amber-700 dark:text-amber-300">{repRefCode}</span>
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
                setShowPaymentModal(true);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl shadow flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <Settings className="w-4 h-4" />
              <span>تعديل أرقام المحافظ</span>
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

            {/* 2. InstaPay */}
            <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)] flex items-center justify-between opacity-80">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-primary)] font-extrabold block">شبكة المدفوعات اللحظية إنستاباي (InstaPay Egypt):</span>
                  <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/30">
                    قيد التطوير والربط
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">جاري استكمال الربط المباشر مع المنظومة البنكية للمدفوعات اللحظية</p>
              </div>
              <span className="bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-purple-500/30">
                InstaPay
              </span>
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
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveAccountModal}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-xs my-auto text-[var(--text-primary)] shadow-2xl transition-colors duration-300 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <h3 className="font-black text-base text-[var(--text-primary)]">
                {editingAccId ? 'تعديل بيانات وصلاحيات الحساب' : 'إضافة حساب مستخدم جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {editingAccId && (
                (() => {
                  const editingRep = mergedAdminReps.find((r) => r.id === editingAccId);
                  const bizCount = editingRep ? businesses.filter((b) => b.repId === editingRep.id).length : 0;
                  const target = editingRep?.targetMonth || 20;

                  return (
                    <>
                      <div className="sm:col-span-2 bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl grid grid-cols-3 gap-2 text-center text-xs font-bold my-1">
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] block mb-0.5">الأنشطة المسجلة:</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-black">{bizCount} نشاط</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] block mb-0.5">المستهدف الشهري:</span>
                          <span className="text-[var(--text-primary)] font-black">{target} نشاط</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--text-muted)] block mb-0.5">نسبة الإنجاز:</span>
                          <span className="text-amber-600 dark:text-amber-400 font-black">
                            {target > 0 ? ((bizCount / target) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>

                      {/* Avatar Image & National ID Card Review */}
                      <div className="sm:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-color)] p-3.5 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                          <span className="font-extrabold text-[var(--text-primary)] text-xs flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-amber-500" />
                            <span>مراجعة وثائق الهوية والتحقق الرسمية</span>
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] font-bold">مطلوب للتفعيل</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* 1. Face Activation / Verification Photo */}
                          <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)] space-y-1.5 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-[var(--text-primary)]">📸 صورة تفعيل الحساب</span>
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded border bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40">
                                سجلات الإدارة
                              </span>
                            </div>

                            {(() => {
                              const facePhoto = editingRep?.activationFacePhoto || editingRep?.avatar;
                              return facePhoto ? (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={facePhoto}
                                    alt="صورة التفعيل"
                                    className="w-12 h-12 rounded-xl object-cover border-2 border-amber-500/50 shadow-xs cursor-pointer hover:opacity-90 transition-transform active:scale-95 shrink-0"
                                    onClick={() => setPreviewAvatarRep({ ...editingRep, avatar: facePhoto })}
                                    title="اضغط للتكبير"
                                  />
                                  <div className="space-y-1">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewAvatarRep({ ...editingRep, avatar: facePhoto })}
                                      className="text-[10px] bg-amber-500/10 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-bold px-2 py-1 rounded-lg block cursor-pointer"
                                    >
                                      🔍 تكبير
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="py-2 text-center bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] text-[10px] text-[var(--text-muted)] font-bold">
                                  غير مرفقة
                                </div>
                              );
                            })()}

                            {/* Direct Admin Upload / Replace */}
                            <label className="text-[10px] bg-[var(--bg-surface)] hover:bg-amber-500/15 text-[var(--text-primary)] font-bold p-1 rounded-lg border border-[var(--border-color)] text-center cursor-pointer block transition-colors">
                              <span>📷 {editingRep?.activationFacePhoto || editingRep?.avatar ? 'استبدال الصورة' : 'إرفاق صورة الوجه'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file && editingRep && onUpdateRepresentative) {
                                    try {
                                      const compressed = await compressImageFile(file, 800, 800, 0.85);
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
                          <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)] space-y-1.5 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-[var(--text-primary)]">🪪 وجه البطاقة</span>
                              <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold">أمامي</span>
                            </div>

                            {editingRep?.nationalIdCardPhoto ? (
                              <div className="flex items-center gap-2">
                                <img
                                  src={editingRep.nationalIdCardPhoto}
                                  alt="وجه البطاقة الأمامي"
                                  className="w-16 h-11 rounded-xl object-cover border-2 border-blue-500/50 shadow-xs cursor-pointer hover:opacity-90 transition-transform active:scale-95 shrink-0"
                                  onClick={() => setPreviewAvatarRep({ ...editingRep, avatar: editingRep.nationalIdCardPhoto })}
                                  title="اضغط للتكبير"
                                />
                                <button
                                  type="button"
                                  onClick={() => setPreviewAvatarRep({ ...editingRep, avatar: editingRep.nationalIdCardPhoto })}
                                  className="text-[10px] bg-blue-500/10 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 font-bold px-2 py-1 rounded-lg block cursor-pointer"
                                >
                                  🔍 تكبير
                                </button>
                              </div>
                            ) : (
                              <div className="py-2 text-center bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] text-[10px] text-[var(--text-muted)] font-bold">
                                غير مرفق
                              </div>
                            )}

                            {/* Direct Admin Upload / Replace */}
                            <label className="text-[10px] bg-[var(--bg-surface)] hover:bg-blue-500/15 text-[var(--text-primary)] font-bold p-1 rounded-lg border border-[var(--border-color)] text-center cursor-pointer block transition-colors">
                              <span>📎 {editingRep?.nationalIdCardPhoto ? 'استبدال الوجه' : 'إرفاق وجه البطاقة'}</span>
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
                          <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)] space-y-1.5 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-[var(--text-primary)]">🔄 ظهر البطاقة</span>
                              <span className="text-[9px] text-purple-600 dark:text-purple-400 font-bold">خلفي</span>
                            </div>

                            {editingRep?.nationalIdCardBackPhoto ? (
                              <div className="flex items-center gap-2">
                                <img
                                  src={editingRep.nationalIdCardBackPhoto}
                                  alt="ظهر البطاقة الخلفي"
                                  className="w-16 h-11 rounded-xl object-cover border-2 border-purple-500/50 shadow-xs cursor-pointer hover:opacity-90 transition-transform active:scale-95 shrink-0"
                                  onClick={() => setPreviewAvatarRep({ ...editingRep, avatar: editingRep.nationalIdCardBackPhoto })}
                                  title="اضغط للتكبير"
                                />
                                <button
                                  type="button"
                                  onClick={() => setPreviewAvatarRep({ ...editingRep, avatar: editingRep.nationalIdCardBackPhoto })}
                                  className="text-[10px] bg-purple-500/10 hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 font-bold px-2 py-1 rounded-lg block cursor-pointer"
                                >
                                  🔍 تكبير
                                </button>
                              </div>
                            ) : (
                              <div className="py-2 text-center bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] text-[10px] text-[var(--text-muted)] font-bold">
                                غير مرفق
                              </div>
                            )}

                            {/* Direct Admin Upload / Replace */}
                            <label className="text-[10px] bg-[var(--bg-surface)] hover:bg-purple-500/15 text-[var(--text-primary)] font-bold p-1 rounded-lg border border-[var(--border-color)] text-center cursor-pointer block transition-colors">
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

                      {/* Documents Preview Section */}
                      <div className="sm:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-color)] p-3 rounded-2xl space-y-2">
                        <label className="block text-[var(--text-primary)] font-extrabold text-[11px] mb-1">
                          📂 الأوراق الثبوتية والمستندات الرسمية للمندوب
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (editingRep) setSelectedAdminDoc({ type: 'field_letter', rep: editingRep });
                            }}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] py-2 rounded-xl border border-amber-500/20 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <FileText className="w-4 h-4 text-amber-500" />
                            <span>تصريح الميدان</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (editingRep) setSelectedAdminDoc({ type: 'digital_badge', rep: editingRep });
                            }}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] py-2 rounded-xl border border-amber-500/20 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <UserCheck className="w-4 h-4 text-amber-500" />
                            <span>بطاقة المندوب</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (editingRep) setSelectedAdminDoc({ type: 'rep_contract', rep: editingRep });
                            }}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] py-2 rounded-xl border border-amber-500/20 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <FileSignature className="w-4 h-4 text-amber-500" />
                            <span>عقد الانضمام</span>
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()
              )}

              {/* Account Role */}
              <div className="sm:col-span-2">
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">
                  نوع وتصنيف الحساب والصلاحية *
                </label>
                <select
                  value={modalRole}
                  onChange={(e) => setModalRole(e.target.value as UserRole)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-xs"
                >
                  <option value="rep">💼 مندوب مبيعات ميداني (تسجيل المحلات والتحصيل)</option>
                  <option value="supervisor">👑 مشرف إدارة منطقة ومحافظة</option>
                  <option value="accountant">🧾 محاسب ومحصل فواتير إلكترونية</option>
                  <option value="admin">🛡️ مدير النظام (أدمن بجميع الصلاحيات)</option>
                </select>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">الاسم الثلاثي *</label>
                <input
                  type="text"
                  required
                  placeholder="مصطفى علي محمود"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">رقم الهاتف للتواصل *</label>
                <input
                  type="tel"
                  required
                  placeholder="010xxxxxxx"
                  value={modalPhone}
                  onChange={(e) => setModalPhone(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-800 dark:text-amber-300 font-mono font-black rounded-xl p-3 focus:outline-none focus:border-amber-500 dir-ltr text-right shadow-xs"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">البريد الإلكتروني للدخول</label>
                <input
                  type="email"
                  placeholder="user@daleelek.eg"
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              {/* Governorate */}
              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">المحافظة / النطاق *</label>
                <select
                  value={modalGov}
                  onChange={(e) => setModalGov(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-xs"
                >
                  {EGYPT_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Target & Commission */}
              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">المستهدف الشهري (عدد أنشطة)</label>
                <input
                  type="number"
                  min={1}
                  value={modalTarget}
                  onChange={(e) => setModalTarget(Number(e.target.value))}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">نسبة العمولة (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  value={modalCommission}
                  onChange={(e) => setModalCommission(Number(e.target.value))}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">حالة الحساب *</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value as any)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-xs"
                >
                  <option value="active">✅ نشط ومصرح له بالعمل</option>
                  <option value="suspended">⏳ معلق وبانتظار المراجعة</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[var(--text-primary)] font-extrabold mb-1">كلمة المرور *</label>
                <input
                  type="text"
                  required
                  value={modalPassword}
                  onChange={(e) => setModalPassword(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold font-mono rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              {/* Referral Settings Section */}
              <div className="sm:col-span-2 bg-[var(--bg-surface)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-3">
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

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
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
          </form>
        </div>
      )}

      {/* MODAL 3: PAYMENT GATEWAY CONFIG MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePaymentConfigModal}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 text-xs my-auto text-[var(--text-primary)] shadow-2xl transition-colors duration-300"
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
                  رقم المحفظة الإضافي (2) - محفظة احتياطية بديلة:
                </label>
                <input
                  type="tel"
                  placeholder="01556221141"
                  value={vodaNumber2}
                  onChange={(e) => setVodaNumber2(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-emerald-700 dark:text-emerald-300 font-mono font-black rounded-xl p-3 focus:outline-none focus:border-amber-500 dir-ltr text-right shadow-xs"
                />
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
        </div>
      )}

      {/* MODAL 4: AVATAR / DOCUMENT PREVIEW MODAL */}
      {previewAvatarRep && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl relative text-[var(--text-primary)] my-auto transition-colors duration-300">
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
        </div>
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
          isOpen={true}
          onClose={() => setSyncModalBiz(null)}
          onUpdateBusiness={(updated) => {
            if (onUpdateBusiness) onUpdateBusiness(updated);
            setSyncModalBiz(null);
          }}
        />
      )}
    </div>
  );
};
