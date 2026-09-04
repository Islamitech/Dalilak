import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Representative,
  Business,
  PayoutRequest,
  User,
  UserRole,
} from '../types';
import {
  calculateRepSettlement,
  calculateTotalRepCommission,
  calculateRepCommissionFromCash,
  PAYOUT_METHOD_LABELS,
} from '../utils/commission';
import {
  getRepReferralSummary,
  getRepReferralCode,
  isReferralSystemUnlocked,
} from '../utils/referral';
import { formatActivityDateTime } from '../utils/dateFormatters';
import { UserAvatar } from './UserAvatar';
import {
  X,
  Store,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  FileText,
  Eye,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  Search,
  Filter,
  Check,
  Calendar,
  CreditCard,
  Building2,
  Lock,
  Unlock,
  Percent,
} from 'lucide-react';

interface RepAccountDossierModalProps {
  rep: Representative | null;
  onClose: () => void;
  businesses: Business[];
  allReps: Representative[];
  payoutRequests?: PayoutRequest[];
  onUpdateRepresentative?: (updatedRep: Representative) => void;
  onEditBusiness?: (biz: Business) => void;
  onUpdatePayoutRequest?: (payout: PayoutRequest) => void;
  currentUser?: User | null;
}

export const RepAccountDossierModal: React.FC<RepAccountDossierModalProps> = ({
  rep,
  onClose,
  businesses,
  allReps,
  payoutRequests = [],
  onUpdateRepresentative,
  onEditBusiness,
  onUpdatePayoutRequest,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'activities' | 'ledger' | 'referrals' | 'kyc'>('activities');
  const [bizSearch, setBizSearch] = useState('');
  const [bizFilter, setBizFilter] = useState<'all' | 'verified' | 'pending' | 'cash' | 'online' | 'exempt'>('all');
  const [editingCommRate, setEditingCommRate] = useState<number>(rep?.commissionRate || 42.86);
  const [editingRoleTitle, setEditingRoleTitle] = useState<string>(rep?.roleTitle || '');
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (rep) {
      setEditingCommRate(rep.commissionRate || 42.86);
      setEditingRoleTitle(rep.roleTitle || '');
    }
  }, [rep]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Extract all businesses registered by this representative
  const repBusinesses = useMemo(() => {
    if (!rep) return [];
    return businesses.filter(
      (b) => b.repId === rep.id || b.repName === rep.name || b.repId === rep.phone
    );
  }, [businesses, rep]);

  const effectiveRate = rep?.commissionRate && rep.commissionRate < 100 ? rep.commissionRate : 42.86;

  // Calculate master financial settlement
  const settlement = useMemo(() => {
    if (!rep) return null;
    return calculateRepSettlement(rep.id, repBusinesses, effectiveRate, payoutRequests);
  }, [rep?.id, repBusinesses, effectiveRate, payoutRequests]);

  // Referral Network Summary
  const referralSummary = useMemo(() => {
    if (!rep) return null;
    return getRepReferralSummary(rep, allReps, businesses);
  }, [rep, allReps, businesses]);

  // Payout and Remittance Requests for this rep
  const repPayouts = useMemo(() => {
    if (!rep) return [];
    return payoutRequests.filter(
      (p) => p.repId === rep.id || p.repName === rep.name || p.repPhone === rep.phone
    );
  }, [payoutRequests, rep]);

  // Filtered Businesses list
  const filteredRepBusinesses = useMemo(() => {
    return repBusinesses.filter((biz) => {
      const matchesSearch =
        !bizSearch.trim() ||
        biz.nameAr?.toLowerCase().includes(bizSearch.toLowerCase()) ||
        biz.nameEn?.toLowerCase().includes(bizSearch.toLowerCase()) ||
        biz.city?.toLowerCase().includes(bizSearch.toLowerCase()) ||
        biz.invoiceNumber?.toLowerCase().includes(bizSearch.toLowerCase());

      if (!matchesSearch) return false;

      const isExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
      const isVerified = biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced';
      const isCash = !isExempt && (biz.cashCollectedByRep !== undefined ? (biz.cashCollectedByRep || 0) > 0 : biz.paymentMethod === 'cash_by_rep');

      if (bizFilter === 'verified') return isVerified;
      if (bizFilter === 'pending') return !isVerified;
      if (bizFilter === 'cash') return isCash;
      if (bizFilter === 'online') return !isCash && !isExempt && (biz.amountPaid || 0) > 0;
      if (bizFilter === 'exempt') return isExempt;

      return true;
    });
  }, [repBusinesses, bizSearch, bizFilter]);

  // Statistics
  const totalRevenue = repBusinesses.reduce((sum, b) => (b.isFeeExempt || b.packagePrice === 0 ? sum : sum + (b.amountPaid || 0)), 0);
  const verifiedCount = repBusinesses.filter((b) => b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced').length;
  const exemptCount = repBusinesses.filter((b) => b.isFeeExempt || b.packagePrice === 0).length;
  const pendingReviewCount = repBusinesses.length - verifiedCount;

  if (!rep || !settlement || !referralSummary) return null;

  // Handle Commission Rate Update
  const handleSaveCommissionRate = () => {
    if (!onUpdateRepresentative) return;
    setIsSavingRate(true);
    try {
      onUpdateRepresentative({
        ...rep,
        commissionRate: Number(editingCommRate) || 42.86,
        roleTitle: editingRoleTitle.trim() || undefined,
      });
      showToast('تم حفظ وتحديث نسبة العمولة بنجاح ✅');
    } finally {
      setIsSavingRate(false);
    }
  };

  // Handle Role Change
  const handleChangeRole = (newRole: UserRole) => {
    if (!onUpdateRepresentative) return;
    const newRoleTitle = (
      newRole === 'supervisor' ? 'مشرف إدارة منطقة ومحافظة' :
      newRole === 'accountant' ? 'محاسب ومحصل فواتير إلكترونية' :
      newRole === 'admin' ? 'مدير النظام المعتمد' : 'مندوب مبيعات ميداني'
    );
    setEditingRoleTitle(newRoleTitle);
    onUpdateRepresentative({
      ...rep,
      role: newRole,
      roleTitle: newRoleTitle,
    });
    showToast(`تم تغيير الرتبة إلى: ${newRole === 'admin' ? 'مدير نظام' : newRole === 'supervisor' ? 'مشرف منطقة' : newRole === 'accountant' ? 'محاسب' : 'مندوب ميداني'} ✅`);
  };

  // Handle Status Toggle (Active/Suspended)
  const handleToggleStatus = () => {
    if (!onUpdateRepresentative) return;
    const newStatus = rep.status === 'suspended' ? 'active' : 'suspended';
    onUpdateRepresentative({
      ...rep,
      status: newStatus,
    });
    showToast(newStatus === 'active' ? 'تم تفعيل الحساب والموافقة عليه 🟢' : 'تم تعليق الحساب مؤقتاً ⏳');
  };

  // Handle Referral Unlock Toggle
  const handleToggleReferralUnlock = () => {
    if (!onUpdateRepresentative) return;
    const currentUnlocked = isReferralSystemUnlocked(rep, repBusinesses.length);
    onUpdateRepresentative({
      ...rep,
      adminBypassReferral: !currentUnlocked,
      referralUnlocked: !currentUnlocked,
    });
    showToast(!currentUnlocked ? 'تم فتح وتفعيل كود الإحالة مباشرة ✨' : 'تم قفل كود الإحالة 🔒');
  };

  const handleApprovePayout = (payout: PayoutRequest) => {
    if (!onUpdatePayoutRequest) return;
    const updated: PayoutRequest = {
      ...payout,
      status: 'approved',
      processedDate: new Date().toISOString(),
    };
    onUpdatePayoutRequest(updated);
    showToast('تم اعتماد العملية المالية وتحديث الحساب بنجاح ✅');
  };

  const handleRejectPayout = (payout: PayoutRequest) => {
    if (!onUpdatePayoutRequest) return;
    const updated: PayoutRequest = {
      ...payout,
      status: 'rejected',
      processedDate: new Date().toISOString(),
    };
    onUpdatePayoutRequest(updated);
    showToast('تم رفض العملية وتحديث السجل 🔴');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-5xl w-full max-h-[96vh] flex flex-col text-xs text-[var(--text-primary)] shadow-2xl overflow-hidden my-auto text-right animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Notification */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-black text-xs px-4 py-2 rounded-2xl shadow-xl border border-emerald-400 flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* ── 1. MODAL HEADER & REP IDENTITY ─────────────────────────────────── */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <UserAvatar
              avatar={rep.avatar}
              name={rep.name}
              role={rep.role}
              avatarStatus={rep.avatarStatus}
              size="lg"
              isAdminPreview={true}
            />

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-white truncate">
                  {rep.name}
                </h3>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30" title={rep.roleTitle}>
                  {rep.roleTitle || (rep.role === 'admin' ? '🛡️ مدير نظام' : rep.role === 'supervisor' ? '👔 مشرف منطقة' : rep.role === 'accountant' ? '💼 محاسب' : '🚶 مندوب ميداني')}
                </span>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    rep.status === 'suspended'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {rep.status === 'suspended' ? '⏳ تحت المراجعة' : '🟢 حساب مفعل'}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap text-xs text-slate-300">
                <span className="flex items-center gap-1 font-bold">
                  <Phone className="w-3 h-3 text-amber-400" />
                  <span className="font-mono dir-ltr">{rep.phone}</span>
                </span>
                {rep.email && (
                  <span className="flex items-center gap-1 font-bold">
                    <Mail className="w-3 h-3 text-amber-400" />
                    <span className="font-mono">{rep.email}</span>
                  </span>
                )}
                <span className="flex items-center gap-1 font-bold">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>{rep.governorate || 'الجيزة'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            {onUpdateRepresentative && (
              <button
                type="button"
                onClick={handleToggleStatus}
                className={`text-xs font-black px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                  rep.status === 'suspended'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{rep.status === 'suspended' ? 'قبول وتفعيل الحساب' : 'تعليق الحساب'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── 2. TOP FINANCIAL & RECONCILIATION KPI RIBBON ─────────────────────── */}
        <div className="bg-[var(--bg-surface)] p-3 sm:p-4 border-b border-[var(--border-color)] shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
            {/* 1. Total Businesses */}
            <div className="bg-[var(--input-bg)] p-2.5 rounded-2xl border border-[var(--border-color)] space-y-0.5">
              <span className="text-[10px] text-[var(--text-muted)] font-bold block">أنشطة مسجلة</span>
              <span className="font-black text-base text-[var(--text-primary)] font-mono block">
                {repBusinesses.length} <span className="text-[10px]">نشاط</span>
              </span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block">
                {verifiedCount} موثق • {exemptCount} معفى
              </span>
            </div>

            {/* 2. Total Collected Revenue */}
            <div className="bg-[var(--input-bg)] p-2.5 rounded-2xl border border-[var(--border-color)] space-y-0.5">
              <span className="text-[10px] text-[var(--text-muted)] font-bold block">إجمالي الإيراد المحصل</span>
              <span className="font-black text-base text-emerald-600 dark:text-emerald-400 font-mono block">
                {totalRevenue.toLocaleString()} <span className="text-[10px]">ج</span>
              </span>
              <span className="text-[9px] text-[var(--text-muted)] block">من فواتير الأنشطة</span>
            </div>

            {/* 3. Physical Cash in Hand */}
            <div className="bg-[var(--input-bg)] p-2.5 rounded-2xl border border-[var(--border-color)] space-y-0.5">
              <span className="text-[10px] text-[var(--text-muted)] font-bold block">كاش محصل باليد</span>
              <span className="font-black text-base text-blue-600 dark:text-blue-400 font-mono block">
                {settlement.totalCashInHand.toLocaleString()} <span className="text-[10px]">ج</span>
              </span>
              <span className="text-[9px] text-[var(--text-muted)] block">مقبوضات نقدية في الشارع</span>
            </div>

            {/* 4. Total Earned Commissions */}
            <div className="bg-amber-500/10 p-2.5 rounded-2xl border border-amber-500/30 space-y-0.5">
              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-black block">إجمالي العمولات المستحقة</span>
              <span className="font-black text-base text-amber-600 dark:text-amber-400 font-mono block">
                {settlement.totalEarnedCommission.toLocaleString()} <span className="text-[10px]">ج</span>
              </span>
              <span className="text-[9px] text-amber-700/80 dark:text-amber-300/80 font-bold block">
                {effectiveRate}% عمولة أساسية + إحالة
              </span>
            </div>

            {/* 5. Approved Payouts Paid Out */}
            <div className="bg-[var(--input-bg)] p-2.5 rounded-2xl border border-[var(--border-color)] space-y-0.5">
              <span className="text-[10px] text-[var(--text-muted)] font-bold block">حوالات تم صرفها</span>
              <span className="font-black text-base text-indigo-600 dark:text-indigo-400 font-mono block">
                {settlement.totalPaidOut.toLocaleString()} <span className="text-[10px]">ج</span>
              </span>
              <span className="text-[9px] text-[var(--text-muted)] block">محافظ / إنستاباي / بنك</span>
            </div>

            {/* 6. Net Financial Status (Debt or Withdrawable) */}
            <div
              className={`p-2.5 rounded-2xl border space-y-0.5 ${
                settlement.isDebtToPlatform
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              <span className="text-[10px] font-black block">
                {settlement.isDebtToPlatform ? '⚠️ عهدة كاش للتوريد' : '🟢 رصيد متاح للسحب'}
              </span>
              <span className="font-black text-base font-mono block">
                {settlement.isDebtToPlatform
                  ? settlement.debtToPlatformAmount.toLocaleString()
                  : settlement.withdrawableBalance.toLocaleString()}{' '}
                <span className="text-[10px]">ج</span>
              </span>
              <span className="text-[9px] font-bold block opacity-90">
                {settlement.isDebtToPlatform ? 'مطلوب توريدها للمنصة' : 'جاهز للصرف فوراً'}
              </span>
            </div>
          </div>
        </div>

        {/* ── 3. SUB-TABS NAVIGATION ─────────────────────────────────────────── */}
        <div className="flex items-center gap-1 p-2 bg-[var(--input-bg)] border-b border-[var(--border-color)] overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'activities'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>الأنشطة الميدانية المسجلة ({repBusinesses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ledger'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>كشف الحساب والتسوية النقدية</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('referrals')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'referrals'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>شبكة المناديب المحالة ({referralSummary.totalInvitedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kyc')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'kyc'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>الوثائق ونسبة العمولة والصلاحيات</span>
          </button>
        </div>

        {/* ── 4. TAB CONTENTS (SCROLLABLE AREA) ───────────────────────────────── */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* ═══════════ TAB 1: ACTIVITIES REGISTERED ═══════════ */}
          {activeTab === 'activities' && (
            <div className="space-y-3.5">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3 top-3" />
                  <input
                    type="text"
                    placeholder="بحث في أنشطة المندوب بالاسم أو التصنيف أو الفاتورة..."
                    value={bizSearch}
                    onChange={(e) => setBizSearch(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl pr-8 pl-3 py-2 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setBizFilter('all')}
                    className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] whitespace-nowrap transition-colors ${
                      bizFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    الكل ({repBusinesses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBizFilter('verified')}
                    className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] whitespace-nowrap transition-colors ${
                      bizFilter === 'verified' ? 'bg-emerald-600 text-white' : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    🟢 موثق ({verifiedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBizFilter('pending')}
                    className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] whitespace-nowrap transition-colors ${
                      bizFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    ⏳ قيد التوثيق ({pendingReviewCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBizFilter('cash')}
                    className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] whitespace-nowrap transition-colors ${
                      bizFilter === 'cash' ? 'bg-blue-600 text-white' : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    💵 كاش باليد
                  </button>
                  <button
                    type="button"
                    onClick={() => setBizFilter('exempt')}
                    className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] whitespace-nowrap transition-colors ${
                      bizFilter === 'exempt' ? 'bg-teal-600 text-white' : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    🆓 معفى ({exemptCount})
                  </button>
                </div>
              </div>

              {/* Businesses Table */}
              {filteredRepBusinesses.length === 0 ? (
                <div className="p-8 text-center bg-[var(--input-bg)] rounded-3xl border border-[var(--border-color)] space-y-2">
                  <Store className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
                  <p className="font-black text-sm text-[var(--text-muted)]">لا توجد أنشطة مطابقة للبحث أو الفلتر المختار</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
                  <table className="w-full text-xs text-right border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-[var(--input-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold text-[11px]">
                        <th className="p-3">اسم النشاط والتصنيف</th>
                        <th className="p-3">تاريخ الإضافة</th>
                        <th className="p-3">الباقة والمبلغ</th>
                        <th className="p-3">طريقة السداد</th>
                        <th className="p-3">عمولة المندوب</th>
                        <th className="p-3">حالة التوثيق</th>
                        <th className="p-3 text-center">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {filteredRepBusinesses.map((biz) => {
                        const isExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
                        const isVerified = biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced';
                        const isCash = !isExempt && (biz.cashCollectedByRep !== undefined ? (biz.cashCollectedByRep || 0) > 0 : biz.paymentMethod === 'cash_by_rep');
                        const paid = isExempt ? 0 : Number(biz.amountPaid) || 0;
                        const commEarned = isExempt ? 0 : Math.round((paid * effectiveRate) / 100);

                        return (
                          <tr key={biz.id} className="hover:bg-amber-500/5 transition-colors">
                            <td className="p-3">
                              <p className="font-extrabold text-sm text-[var(--text-primary)]">{biz.nameAr}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] mt-0.5">
                                <span className="text-amber-700 dark:text-amber-400 font-bold">{biz.category}</span>
                                <span>•</span>
                                <span>{biz.governorate} ({biz.city})</span>
                              </div>
                            </td>

                            <td className="p-3 text-[11px] font-mono text-[var(--text-muted)]">
                              {formatActivityDateTime(biz.createdDate || biz.invoiceDate)}
                            </td>

                            <td className="p-3 font-bold">
                              {isExempt ? (
                                <span className="text-teal-600 dark:text-teal-400 font-black">إدراج مجاني (0 ج)</span>
                              ) : (
                                <div>
                                  <span className="text-[var(--text-primary)]">{biz.packagePrice || 250} ج.م</span>
                                  <p className="text-[10px] text-emerald-600 font-black">مسدد: {paid} ج.م</p>
                                </div>
                              )}
                            </td>

                            <td className="p-3">
                              {isExempt ? (
                                <span className="text-[10px] font-bold text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded-md">معفى</span>
                              ) : isCash ? (
                                <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                                  💵 كاش باليد ({paid} ج)
                                </span>
                              ) : paid > 0 ? (
                                <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/30">
                                  💳 تحويل للمنصة
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md">لم يدفع بعد</span>
                              )}
                            </td>

                            <td className="p-3 font-black text-amber-600 dark:text-amber-400 font-mono">
                              {isExempt ? '0 ج.م' : `${commEarned} ج.م`}
                            </td>

                            <td className="p-3">
                              {isVerified ? (
                                <span className="badge-success text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>موثق رسمي</span>
                                </span>
                              ) : (
                                <span className="badge-warning text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>قيد المراجعة</span>
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-center">
                              {onEditBusiness && (
                                <button
                                  type="button"
                                  onClick={() => onEditBusiness(biz)}
                                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] px-2.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 mx-auto"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>تفاصيل</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ TAB 2: FINANCIAL LEDGER & CASH RECONCILIATION ═══════════ */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              {/* Detailed Mathematical Statement */}
              <div className="bg-[var(--input-bg)] p-4 sm:p-5 rounded-3xl border border-[var(--border-color)] space-y-3.5">
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
                  <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-500" />
                    <span>كشف الحساب التفصيلي والتسوية المحاسبية للمندوب</span>
                  </h4>
                  <span className="text-[10px] font-bold text-[var(--text-muted)]">النسبة المعتمدة: {effectiveRate}%</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] font-bold">
                    <span>1. إجمالي المبالغ النقدية المحصلة بيد المندوب في الشارع:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-black text-sm">
                      {settlement.totalCashInHand.toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] font-bold">
                    <span>2. استقطاع عمولة المندوب المستحقة فورياً من الكاش ({effectiveRate}%):</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-black text-sm">
                      - {settlement.repShareFromCash.toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] font-bold">
                    <span>3. حصة المنصة المستحقة من الكاش المحصل:</span>
                    <span className="font-mono text-[var(--text-primary)] font-black text-sm">
                      = {settlement.platformShareFromCash.toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] font-bold">
                    <span>4. توريدات الكاش المحولة والمعتمدة من المندوب للمنصة:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-sm">
                      - {settlement.totalRemittedToPlatform.toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 font-black">
                    <span className="text-amber-900 dark:text-amber-300">5. المتبقي الفعلي من عهدة الكاش المستحقة للمنصة:</span>
                    <span className="font-mono text-amber-700 dark:text-amber-400 text-base">
                      {settlement.remainingCashDebt.toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] font-bold">
                    <span>6. عمولات المندوب من مدفوعات المنصة الإلكترونية + أرباح الإحالة:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black text-sm">
                      + {(settlement.totalEarnedCommission - settlement.repShareFromCash).toLocaleString()} ج.م
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] font-bold">
                    <span>7. الحوالات المنصرفة فعلياً للمندوب (فودافون كاش / إنستاباي / بنك):</span>
                    <span className="font-mono text-rose-600 dark:text-rose-400 font-black text-sm">
                      - {settlement.totalPaidOut.toLocaleString()} ج.م
                    </span>
                  </div>

                  {/* Net Ledger Result Card */}
                  <div
                    className={`p-3.5 rounded-2xl border-2 flex items-center justify-between text-sm font-black ${
                      settlement.isDebtToPlatform
                        ? 'bg-rose-500/15 border-rose-500/60 text-rose-700 dark:text-rose-300 shadow-md'
                        : 'bg-emerald-500/15 border-emerald-500/60 text-emerald-700 dark:text-emerald-300 shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {settlement.isDebtToPlatform ? <AlertTriangle className="w-5 h-5 text-rose-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      <span>
                        {settlement.isDebtToPlatform
                          ? '⚠️ الموقف النهائي: عهدة كاش مستحقة على المندوب مطلوب توريدها'
                          : '🟢 الموقف النهائي: رصيد دائن مستحق للمندوب متاح للسحب'}
                      </span>
                    </div>
                    <span className="font-mono text-lg">
                      {settlement.isDebtToPlatform
                        ? settlement.debtToPlatformAmount.toLocaleString()
                        : settlement.withdrawableBalance.toLocaleString()}{' '}
                      ج.م
                    </span>
                  </div>
                </div>
              </div>

              {/* Transactions History Table */}
              <div className="bg-[var(--input-bg)] p-4 rounded-3xl border border-[var(--border-color)] space-y-3">
                <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <span>سجل طلبات السحب والحوالات وتوريدات الكاش ({repPayouts.length})</span>
                </h4>

                {repPayouts.length === 0 ? (
                  <p className="text-center text-xs text-[var(--text-muted)] font-bold py-4">
                    لا توجد طلبات سحب أو توريدات مسجلة لهذا الحساب حتى الآن
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
                    <table className="w-full text-xs text-right border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-[var(--bg-card)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold">
                          <th className="p-2.5">رقم الطلب والتاريخ</th>
                          <th className="p-2.5">النوع والوسيلة</th>
                          <th className="p-2.5">المبلغ</th>
                          <th className="p-2.5">الحالة</th>
                          <th className="p-2.5 text-center">التحكم</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]">
                        {repPayouts.map((p) => {
                          const isRemittance = p.type === 'remittance';
                          const isApproved = p.status === 'approved';
                          const isPending = p.status === 'pending';

                          return (
                            <tr key={p.id} className="hover:bg-amber-500/5">
                              <td className="p-2.5">
                                <span className="font-mono font-bold text-[var(--text-primary)]">{p.id}</span>
                                <p className="text-[10px] text-[var(--text-muted)]">{formatActivityDateTime(p.requestDate)}</p>
                              </td>

                              <td className="p-2.5">
                                <span className={`font-bold ${isRemittance ? 'text-blue-600' : 'text-purple-600'}`}>
                                  {isRemittance ? '📥 توريد كاش للمنصة' : '📤 سحب عمولة للمندوب'}
                                </span>
                                <p className="text-[10px] text-[var(--text-muted)] font-mono">
                                  {PAYOUT_METHOD_LABELS[p.method] || p.method}
                                </p>
                              </td>

                              <td className="p-2.5 font-black font-mono text-sm text-emerald-600">
                                {p.amount.toLocaleString()} ج.م
                              </td>

                              <td className="p-2.5">
                                <span
                                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                    isApproved
                                      ? 'badge-success'
                                      : isPending
                                      ? 'badge-warning animate-pulse'
                                      : 'badge-danger'
                                  }`}
                                >
                                  {isApproved ? 'مكتمل ومعتمد ✅' : isPending ? '⏳ قيد المراجعة' : 'مرفوض 🔴'}
                                </span>
                              </td>

                              <td className="p-2.5 text-center">
                                {isPending && (
                                  <div className="flex items-center justify-center gap-1.5">
                                    {onUpdatePayoutRequest && (
                                      <button
                                        type="button"
                                        onClick={() => handleApprovePayout(p)}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2 py-1 rounded-lg cursor-pointer"
                                      >
                                        اعتماد
                                      </button>
                                    )}
                                    {onUpdatePayoutRequest && (
                                      <button
                                        type="button"
                                        onClick={() => handleRejectPayout(p)}
                                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] px-2 py-1 rounded-lg cursor-pointer"
                                      >
                                        رفض
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════ TAB 3: REFERRAL NETWORK ═══════════ */}
          {activeTab === 'referrals' && (
            <div className="space-y-4">
              {/* Referral Overview Card */}
              <div className="bg-[var(--input-bg)] p-4 sm:p-5 rounded-3xl border border-[var(--border-color)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
                  <div>
                    <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-500" />
                      <span>كود الإحالة وشبكة المناديب المسجلين عن طريقه</span>
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] font-bold mt-0.5">
                      عمولات إضافية تتراوح بين 3% و 7% من إيرادات المناديب المدعوين + 250 ج عند تحقيق كل مندوب 10 أنشطة
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-[var(--bg-card)] px-3 py-1.5 rounded-xl border border-amber-500/40 text-xs font-mono font-black text-amber-600 dark:text-amber-400">
                      كود: {referralSummary.referralCode}
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleReferralUnlock}
                      className={`text-xs font-black px-3 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                        referralSummary.isUnlocked
                          ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                          : 'bg-amber-500 text-slate-950 font-black'
                      }`}
                    >
                      {referralSummary.isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>{referralSummary.isUnlocked ? '✨ مفتوح (اضغط للقفل)' : 'تجاوز وتفعيل الكود'}</span>
                    </button>
                  </div>
                </div>

                {/* Referral KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                  <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] space-y-0.5">
                    <span className="text-[10px] text-[var(--text-muted)] font-bold block">إجمالي المدعوين</span>
                    <span className="font-black text-base text-[var(--text-primary)] font-mono block">
                      {referralSummary.totalInvitedCount} <span className="text-[10px]">عضو</span>
                    </span>
                  </div>

                  <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] space-y-0.5">
                    <span className="text-[10px] text-[var(--text-muted)] font-bold block">مناديب أنجزوا 10+ أنشطة</span>
                    <span className="font-black text-base text-emerald-600 font-mono block">
                      {referralSummary.qualifiedRepsCount} <span className="text-[10px]">مؤهل</span>
                    </span>
                  </div>

                  <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] space-y-0.5">
                    <span className="text-[10px] text-[var(--text-muted)] font-bold block">عمولات الإحالة (3%-7%)</span>
                    <span className="font-black text-base text-amber-600 font-mono block">
                      {referralSummary.totalReferralCommission.toLocaleString()} <span className="text-[10px]">ج</span>
                    </span>
                  </div>

                  <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/30 space-y-0.5">
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-black block">إجمالي أرباح الإحالة</span>
                    <span className="font-black text-base text-emerald-600 font-mono block">
                      {referralSummary.totalNetEarnings.toLocaleString()} <span className="text-[10px]">ج</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Invited Representatives Table */}
              <div className="space-y-2.5">
                <h4 className="font-black text-xs text-[var(--text-primary)]">قائمة المناديب المحالة عن طريقه:</h4>
                {referralSummary.invitedRepsDetails.length === 0 ? (
                  <p className="text-center text-xs text-[var(--text-muted)] font-bold py-6 bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)]">
                    لم يقم هذا المندوب بدعوة أي مناديب آخرين حتى الآن
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
                    <table className="w-full text-xs text-right border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-[var(--input-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold">
                          <th className="p-2.5">المندوب المدعو</th>
                          <th className="p-2.5">المحافظة والهاتف</th>
                          <th className="p-2.5">الأنشطة المسجلة</th>
                          <th className="p-2.5">إيراد مبيعاته</th>
                          <th className="p-2.5">نسبة العمولة</th>
                          <th className="p-2.5">العمولة المكتسبة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]">
                        {referralSummary.invitedRepsDetails.map((inv) => (
                          <tr key={inv.rep.id} className="hover:bg-amber-500/5">
                            <td className="p-2.5 font-bold text-[var(--text-primary)]">{inv.rep.name}</td>
                            <td className="p-2.5 text-[11px] text-[var(--text-muted)]">{inv.rep.governorate} • {inv.rep.phone}</td>
                            <td className="p-2.5 font-mono font-bold text-center">{inv.bizCount}</td>
                            <td className="p-2.5 font-mono text-emerald-600 font-bold">{inv.totalRevenue.toLocaleString()} ج.م</td>
                            <td className="p-2.5 font-bold text-amber-600">{inv.currentRate}%</td>
                            <td className="p-2.5 font-black text-emerald-600 font-mono">{inv.commissionEarned.toLocaleString()} ج.م</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════ TAB 4: KYC & SETTINGS ═══════════ */}
          {activeTab === 'kyc' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Commission Rate & Role Setting */}
                <div className="bg-[var(--input-bg)] p-4 rounded-3xl border border-[var(--border-color)] space-y-3">
                  <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-2.5">
                    <Percent className="w-4 h-4 text-amber-500" />
                    <span>إعدادات نسبة العمولة والرتبة</span>
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-[var(--text-muted)] mb-1">
                        نسبة العمولة الميدانية المعتمدة (%):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={editingCommRate}
                          onChange={(e) => setEditingCommRate(Number(e.target.value))}
                          className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-black text-sm rounded-xl p-2 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          disabled={isSavingRate}
                          onClick={handleSaveCommissionRate}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl transition-transform active:scale-95 cursor-pointer"
                        >
                          {isSavingRate ? 'جاري...' : 'حفظ النسبة'}
                        </button>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">النسبة الافتراضية للنظام هي 42.86% (107 ج من باقة الـ 250 ج).</p>
                    </div>

                    <div>
                      <label className="block font-bold text-[var(--text-muted)] mb-1">
                        المسمى الوظيفي المعتمد (يظهر في الهوية وكافة الوثائق):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="مثال: مشرف منطقة ومحافظة / مدير توثيق ميداني..."
                          value={editingRoleTitle}
                          onChange={(e) => setEditingRoleTitle(e.target.value)}
                          className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl p-2 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          disabled={isSavingRate}
                          onClick={handleSaveCommissionRate}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3.5 py-2 rounded-xl transition-transform active:scale-95 cursor-pointer text-xs shrink-0"
                        >
                          حفظ المسمى
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-[var(--text-muted)] mb-1">
                        رتبة الحساب والصلاحيات:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleChangeRole('rep')}
                          className={`p-2 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                            rep.role === 'rep'
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs'
                              : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-amber-500/40'
                          }`}
                        >
                          مندوب ميداني
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChangeRole('supervisor')}
                          className={`p-2 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                            rep.role === 'supervisor'
                              ? 'bg-blue-600 text-white border-blue-400 font-black shadow-xs'
                              : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-blue-500/40'
                          }`}
                        >
                          مشرف منطقة
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChangeRole('accountant')}
                          className={`p-2 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                            rep.role === 'accountant'
                              ? 'bg-teal-600 text-white border-teal-400 font-black shadow-xs'
                              : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-teal-500/40'
                          }`}
                        >
                          محاسب مالي
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChangeRole('admin')}
                          className={`p-2 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                            rep.role === 'admin'
                              ? 'bg-purple-600 text-white border-purple-400 font-black shadow-xs'
                              : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-purple-500/40'
                          }`}
                        >
                          مدير نظام
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Documents & National ID */}
                <div className="bg-[var(--input-bg)] p-4 rounded-3xl border border-[var(--border-color)] space-y-3">
                  <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-2.5">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span>وثائق الهوية والتسجيل المرفوعة</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-[var(--bg-card)] p-2.5 rounded-2xl border border-[var(--border-color)] text-center space-y-1.5">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] block">صورة الوجه التوثيقية</span>
                      {rep.activationFacePhoto ? (
                        <img
                          src={rep.activationFacePhoto}
                          alt="صورة الوجه"
                          className="w-full h-24 object-cover rounded-xl border border-slate-700"
                        />
                      ) : (
                        <div className="w-full h-24 bg-slate-800 rounded-xl flex items-center justify-center text-[10px] text-slate-500 font-bold">
                          غير مرفوعة
                        </div>
                      )}
                    </div>

                    <div className="bg-[var(--bg-card)] p-2.5 rounded-2xl border border-[var(--border-color)] text-center space-y-1.5">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] block">بطاقة الرقم القومي</span>
                      {rep.nationalIdCardPhoto ? (
                        <img
                          src={rep.nationalIdCardPhoto}
                          alt="بطاقة الرقم القومي"
                          className="w-full h-24 object-cover rounded-xl border border-slate-700"
                        />
                      ) : (
                        <div className="w-full h-24 bg-slate-800 rounded-xl flex items-center justify-center text-[10px] text-slate-500 font-bold">
                          غير مرفوعة
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)] font-mono text-[11px] flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">الرقم القومي:</span>
                    <span className="font-black text-[var(--text-primary)]">{rep.nationalId || 'غير مسجل'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 5. MODAL FOOTER ─────────────────────────────────────────────────── */}
        <div className="p-3.5 sm:p-4 bg-[var(--input-bg)] border-t border-[var(--border-color)] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-[var(--text-muted)] font-bold">
            معرف الحساب: <span className="font-mono text-[var(--text-primary)]">{rep.id}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--bg-card)] hover:bg-slate-500/10 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-black px-6 py-2 rounded-xl transition-colors cursor-pointer active:scale-95"
          >
            إغلاق الملف
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
