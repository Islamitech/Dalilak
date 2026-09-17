import { OverlayLayer } from './ui/OverlayLayer';
import React, { useState, useMemo } from 'react';
import {
  Users,
  Building2,
  Target,
  Wallet,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ChevronLeft,
  Map as MapIcon,
  MessageSquare,
  SlidersHorizontal,
  LogOut,
  Download,
  AlertCircle,
  CheckCircle2,
  Phone,
  Banknote,
  DollarSign,
  TrendingUp,
  Award,
  Clock,
  ShieldCheck,
  UserPlus,
  Send,
  Eye,
  Check,
  ExternalLink,
} from 'lucide-react';
import {
  Business,
  Representative,
  User,
  PayoutRequest,
  InterestedLead,
  PaymentGatewayConfig,
} from '../types';
import { EGYPT_GOVERNORATES } from '../data/mockData';
import { calculateRepSettlement } from '../utils/commission';
import { UniversalListingCard } from './design-system/UniversalListingCard';
import { BusinessDetailsDrawer } from './BusinessDetailsDrawer';
import { RepAccountDossierModal } from './RepAccountDossierModal';
import { AdminAccountModal } from './admin/modals/AdminAccountModal';
import { AdminPayoutActionModal } from './admin/modals/AdminPayoutActionModal';
import { AdminReceiptModal } from './admin/modals/AdminReceiptModal';
import { LeadWhatsAppModal } from './leads/LeadWhatsAppModal';
import { InteractiveMap } from './InteractiveMap';
import { triggerHaptic } from '../utils/haptics';

export interface SupervisorDashboardProps {
  currentUser: User;
  businesses: Business[];
  representatives: Representative[];
  paymentConfig?: PaymentGatewayConfig;
  payoutRequests?: PayoutRequest[];
  leads?: InterestedLead[];
  onAddNewClick: () => void;
  onShowInvoice: (biz: Business) => void;
  onCollectPayment?: (biz: Business) => void;
  onEditBusiness?: (biz: Business) => void;
  onUpdateBusiness: (biz: Business) => void;
  onDeleteBusiness?: (id: string) => void;
  onAddRepresentative: (rep: Partial<Representative>) => void;
  onUpdateRepresentative?: (rep: Representative) => void;
  onDeleteRepresentative?: (id: string) => void;
  onUpdatePayoutRequest?: (payout: PayoutRequest) => void;
  onCreateLead?: (lead: InterestedLead) => void;
  onUpdateLead?: (lead: InterestedLead) => void;
  onDeleteLead?: (id: string) => void;
  onConvertToBusiness?: (lead: InterestedLead) => void;
  onDirectConvertLead?: (lead: InterestedLead) => void;
  onSwitchToAdvancedAdmin?: () => void;
  onLogout: () => void;
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

type SupervisorSubView = 'hub' | 'reps' | 'target' | 'businesses' | 'finance' | 'map' | 'leads';

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  currentUser,
  businesses,
  representatives,
  paymentConfig,
  payoutRequests = [],
  leads = [],
  onAddNewClick,
  onShowInvoice,
  onCollectPayment,
  onEditBusiness,
  onUpdateBusiness,
  onDeleteBusiness,
  onAddRepresentative,
  onUpdateRepresentative,
  onDeleteRepresentative,
  onUpdatePayoutRequest,
  onCreateLead,
  onUpdateLead,
  onDeleteLead,
  onConvertToBusiness,
  onDirectConvertLead,
  onSwitchToAdvancedAdmin,
  onLogout,
  onShowNotification,
}) => {
  // Navigation & Scoping State
  const [activeView, setActiveView] = useState<SupervisorSubView>('hub');
  const [selectedGov, setSelectedGov] = useState<string>(() => {
    return (
      currentUser.repData?.governorate ||
      'القاهرة'
    );
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [bizStatusFilter, setBizStatusFilter] = useState<'all' | 'pending' | 'verified' | 'unpaid'>('all');
  const [leadInterestFilter, setLeadInterestFilter] = useState<'all' | 'high' | 'medium' | 'trending_free'>('all');

  // Modals
  const [selectedDrawerBiz, setSelectedDrawerBiz] = useState<Business | null>(null);
  const [selectedDossierRep, setSelectedDossierRep] = useState<Representative | null>(null);
  const [isAddRepOpen, setIsAddRepOpen] = useState(false);
  const [selectedLeadForWhatsApp, setSelectedLeadForWhatsApp] = useState<InterestedLead | null>(null);
  const [payoutActionModalData, setPayoutActionModalData] = useState<{
    payout: PayoutRequest;
    action: 'approve' | 'reject';
  } | null>(null);
  const [selectedReceiptPhoto, setSelectedReceiptPhoto] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'info' | 'warning' = 'info') => {
    if (onShowNotification) {
      onShowNotification(msg, type);
    } else {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

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
  const metrics = useMemo(() => {
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

  // 3. Filtered Lists for SubViews
  const filteredBusinesses = useMemo(() => {
    return scopedBusinesses.filter((b) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          b.nameAr.toLowerCase().includes(q) ||
          (b.nameEn && b.nameEn.toLowerCase().includes(q)) ||
          b.city.toLowerCase().includes(q) ||
          b.phone.includes(q) ||
          b.invoiceNumber.toLowerCase().includes(q) ||
          (b.repName && b.repName.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (bizStatusFilter === 'pending') {
        return b.verificationStatus === 'pending' || b.verificationStatus === 'in_progress';
      }
      if (bizStatusFilter === 'verified') {
        return b.verificationStatus === 'verified';
      }
      if (bizStatusFilter === 'unpaid') {
        return b.paymentStatus === 'unpaid';
      }
      return true;
    });
  }, [scopedBusinesses, searchQuery, bizStatusFilter]);

  const filteredReps = useMemo(() => {
    return scopedReps.filter((r) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        (r.email && r.email.toLowerCase().includes(q))
      );
    });
  }, [scopedReps, searchQuery]);

  const filteredLeads = useMemo(() => {
    return scopedLeads.filter((l) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          l.clientName.toLowerCase().includes(q) ||
          (l.businessName && l.businessName.toLowerCase().includes(q)) ||
          l.phone.includes(q);
        if (!match) return false;
      }
      if (leadInterestFilter === 'all') return true;
      if (leadInterestFilter === 'trending_free') return l.isTrending || l.interestLevel === 'trending_free';
      return l.interestLevel === leadInterestFilter;
    });
  }, [scopedLeads, searchQuery, leadInterestFilter]);

  // CSV Export for Governorate
  const handleExportGovernorateData = () => {
    try {
      const headers = ['المعرف', 'اسم النشاط', 'المدينة', 'المندوب', 'الهاتف', 'حالة الاعتماد', 'حالة السداد', 'المبلغ'];
      const rows = scopedBusinesses.map((b) => [
        b.id,
        `"${b.nameAr.replace(/"/g, '""')}"`,
        `"${b.city}"`,
        `"${b.repName || 'غير محدد'}"`,
        `"${b.phone}"`,
        b.verificationStatus === 'verified' ? 'معتمد' : 'قيد المراجعة',
        b.paymentStatus === 'fully_paid' ? 'مسدد' : 'غير مسدد',
        b.amountPaid || 0,
      ]);

      const csvContent =
        '\uFEFF' +
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `دليلك_محافظة_${selectedGov}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`تم تصدير كشف محافظة ${selectedGov} بنجاح!`, 'success');
    } catch {
      showToast('حدث خطأ أثناء تصدير البيانات', 'warning');
    }
  };

  // SubView Universal Header
  const SubViewHeader = ({
    title,
    count,
    badge,
  }: {
    title: string;
    count?: number;
    badge?: string;
  }) => (
    <div className="flex items-center justify-between gap-3 mb-4 bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 sm:p-4 rounded-3xl shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => {
            triggerHaptic('selection');
            setActiveView('hub');
            setSearchQuery('');
          }}
          className="p-2 sm:p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-all active:scale-95 cursor-pointer shrink-0"
          aria-label="العودة للمركز الإشرافي"
          title="العودة للمركز الإشرافي"
        >
          <ArrowRight className="w-5 h-5 text-amber-600" />
        </button>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)] truncate flex items-center gap-2">
            <span>{title}</span>
            {count !== undefined && (
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/20 font-mono">
                {count}
              </span>
            )}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {badge && (
          <span className="text-xs font-bold text-[var(--text-muted)] hidden sm:inline">
            {badge}
          </span>
        )}
        <span className="text-xs font-black bg-amber-500/15 text-amber-800 px-2.5 py-1 rounded-xl border border-amber-500/20">
          {selectedGov}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-24 font-['Cairo',sans-serif] animate-fade-in max-w-5xl mx-auto px-2 sm:px-4">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-950 text-white text-xs font-black py-2.5 px-5 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =====================================================================
       * 1. SOVEREIGN SUPERVISOR HUB (المركز الإشرافي الميداني)
       * ===================================================================== */}
      {activeView === 'hub' && (
        <div className="space-y-4">
          {/* Header Bar */}
          <header className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Identity & Scoped Governorate */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={
                    currentUser.repData?.avatar ||
                    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80'
                  }
                  alt={currentUser.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-amber-500 shadow-sm"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[var(--bg-card)] flex items-center justify-center text-white text-[8px]">
                  🛡️
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-[var(--text-primary)] truncate">
                    أهلاً، {currentUser.name.split(' ')[0]} 👋
                  </h1>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[11px] font-black text-amber-700 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    مشرف إقليمي
                  </span>
                  {/* Governorate Selector Dropdown */}
                  <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--text-muted)]">
                    <span>المحافظة:</span>
                    <select
                      value={selectedGov}
                      onChange={(e) => {
                        setSelectedGov(e.target.value);
                        triggerHaptic('selection');
                      }}
                      className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-2 py-0.5 text-[11px] font-black text-[var(--text-primary)] focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {EGYPT_GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>
                          {gov}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Utility buttons: Extended Admin toggle & Logout */}
            <div className="flex items-center justify-end gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-[var(--border-color)]">
              {onSwitchToAdvancedAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    onSwitchToAdvancedAdmin();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[var(--input-bg)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-all border border-[var(--border-color)] cursor-pointer text-xs font-bold shadow-xs active:scale-95"
                  title="الانتقال إلى لوحة العمليات الكلاسيكية الموسعة (9 تبويبات)"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                  <span>لوحة العمليات الموسعة</span>
                </button>
              )}

              <button
                type="button"
                onClick={onLogout}
                className="p-2 sm:p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Urgent Action Ribbon (Conditional) */}
          {(metrics.pendingBusinesses > 0 || metrics.totalCashInRepsHands > 0) && (
            <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border-2 border-amber-500/40 rounded-3xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[var(--text-primary)]">
                    مهام ميدانية عاجلة تستوجب تدقيقك في {selectedGov}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-[var(--text-muted)] mt-0.5 flex-wrap">
                    {metrics.pendingBusinesses > 0 && (
                      <span className="text-amber-700">
                        ⚡ {metrics.pendingBusinesses} منشأة بانتظار الفحص والاعتماد
                      </span>
                    )}
                    {metrics.totalCashInRepsHands > 0 && (
                      <span className="text-blue-700">
                        💰 {metrics.totalCashInRepsHands.toLocaleString()} ج.م عهدة كاش بيد المناديب
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {metrics.pendingBusinesses > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setBizStatusFilter('pending');
                      setActiveView('businesses');
                    }}
                    className="flex-1 sm:flex-none text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer text-center"
                  >
                    تدقيق الأنشطة
                  </button>
                )}
                {metrics.totalCashInRepsHands > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveView('finance')}
                    className="flex-1 sm:flex-none text-xs font-black bg-[var(--input-bg)] border border-blue-500/30 text-blue-700 hover:bg-blue-500/10 px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer text-center"
                  >
                    كشف العهد
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Hero Primary Action: تسجيل نشاط تجاري جديد */}
          <button
            type="button"
            onClick={onAddNewClick}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm sm:text-base py-4 px-6 rounded-3xl shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between border border-amber-400/40 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-950/10 flex items-center justify-center text-slate-950">
                <Plus className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="text-right">
                <span className="block text-sm sm:text-base font-black">
                  تسجيل نشاط تجاري جديد بالمحافظة
                </span>
                <span className="block text-[11px] font-bold text-slate-900/80">
                  توثيق فوري مباشر وتحديد الإحداثيات والبيانات الميدانية
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-950/10 flex items-center justify-center text-slate-950 group-hover:-translate-x-1 transition-transform">
              <ChevronLeft className="w-5 h-5" />
            </div>
          </button>

          {/* 4 Interactive Stat Cards (Drill-Down) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Box 1: مناديب المحافظة */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setActiveView('reps');
              }}
              className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border-color)] shadow-xs text-right transition-all hover:border-amber-500/50 hover:shadow-md active:scale-[0.98] cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20 transition-colors">
                    <Users className="w-5 h-5 stroke-[2.5]" />
                  </span>
                  <span className="text-[10px] font-black text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    {metrics.activeReps} نشط
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-mono">
                    {metrics.totalReps}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-muted)]">مندوب مسجل</span>
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-bold">
                <span>إدارة فريق المناديب</span>
                <ChevronLeft className="w-3.5 h-3.5 text-amber-600 group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Box 2: مستهدف المحافظة والإنجاز */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setActiveView('target');
              }}
              className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border-color)] shadow-xs text-right transition-all hover:border-emerald-500/50 hover:shadow-md active:scale-[0.98] cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20 transition-colors">
                    <Target className="w-5 h-5 stroke-[2.5]" />
                  </span>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
                    {metrics.targetPercent}%
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
                    {metrics.totalBusinesses}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-muted)]">
                    / {metrics.effectiveGovTarget} تارجت
                  </span>
                </div>
                <div className="w-full bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${metrics.targetPercent}%` }}
                  />
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-bold">
                <span>تنافسية وتحليل الإنجاز</span>
                <ChevronLeft className="w-3.5 h-3.5 text-emerald-600 group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Box 3: منشآت المحافظة والتدقيق */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setActiveView('businesses');
              }}
              className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border-color)] shadow-xs text-right transition-all hover:border-blue-500/50 hover:shadow-md active:scale-[0.98] cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 group-hover:bg-blue-500/20 transition-colors">
                    <Building2 className="w-5 h-5 stroke-[2.5]" />
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      metrics.pendingBusinesses > 0
                        ? 'text-amber-700 bg-amber-500/15'
                        : 'text-blue-700 bg-blue-500/10'
                    }`}
                  >
                    {metrics.pendingBusinesses > 0
                      ? `${metrics.pendingBusinesses} للمراجعة`
                      : `${metrics.verifiedBusinesses} معتمد`}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-mono">
                    {metrics.totalBusinesses}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-muted)]">منشأة مسجلة</span>
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-bold">
                <span>الفحص والاعتماد السريع</span>
                <ChevronLeft className="w-3.5 h-3.5 text-blue-600 group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Box 4: العهد النقدية والتحصيلات */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setActiveView('finance');
              }}
              className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border-color)] shadow-xs text-right transition-all hover:border-purple-500/50 hover:shadow-md active:scale-[0.98] cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 group-hover:bg-purple-500/20 transition-colors">
                    <Wallet className="w-5 h-5 stroke-[2.5]" />
                  </span>
                  <span className="text-[10px] font-black text-purple-700 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    {metrics.pendingPayoutsCount > 0
                      ? `${metrics.pendingPayoutsCount} طلب سحب`
                      : 'التوريدات'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-purple-600 font-mono">
                    {metrics.totalCashInRepsHands.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-muted)]">ج.م عهدة</span>
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-bold">
                <span>كشف التحصيلات والعهد</span>
                <ChevronLeft className="w-3.5 h-3.5 text-purple-600 group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* Direct Quick Action Buttons (4 أزرار مباشرة) */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-[var(--text-muted)] px-1">
              إجراءات سريعة مباشرة بالمحافظة
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Quick Action 1: إضافة مندوب جديد */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setIsAddRepOpen(true);
                }}
                className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all active:scale-95 cursor-pointer text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-xs font-black text-[var(--text-primary)]">
                  + إضافة مندوب جديد
                </span>
              </button>

              {/* Quick Action 2: خريطة المحافظة */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveView('map');
                }}
                className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all active:scale-95 cursor-pointer text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapIcon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-xs font-black text-[var(--text-primary)]">
                  خريطة التغطية
                </span>
              </button>

              {/* Quick Action 3: عملاء CRM */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveView('leads');
                }}
                className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all active:scale-95 cursor-pointer text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-xs font-black text-[var(--text-primary)]">
                  فرص وعملاء CRM ({scopedLeads.length})
                </span>
              </button>

              {/* Quick Action 4: تصدير كشف المحافظة */}
              <button
                type="button"
                onClick={handleExportGovernorateData}
                className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all active:scale-95 cursor-pointer text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Download className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-xs font-black text-[var(--text-primary)]">
                  تصدير كشف المحافظة
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * 2. SUB-VIEW: REPS MANAGEMENT (إدارة مناديب المحافظة)
       * ===================================================================== */}
      {activeView === 'reps' && (
        <div className="space-y-4 animate-fade-in">
          <SubViewHeader
            title={`فريق مناديب ${selectedGov}`}
            count={filteredReps.length}
            badge={`${metrics.activeReps} نشط`}
          />

          {/* Controls Bar */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم أو الهاتف..."
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAddRepOpen(true)}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ إضافة مندوب جديد</span>
            </button>
          </div>

          {/* Reps Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredReps.map((rep) => {
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

              return (
                <div
                  key={rep.id}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 shadow-xs hover:border-amber-500/40 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={
                          rep.avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'
                        }
                        alt={rep.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-amber-500/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-black text-sm text-[var(--text-primary)] truncate">
                            {rep.name}
                          </h3>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                              rep.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-700'
                                : 'bg-rose-500/10 text-rose-700'
                            }`}
                          >
                            {rep.status === 'active' ? 'نشط' : 'معلق'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-amber-500" />
                          <span>{rep.phone}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDossierRep(rep)}
                      className="text-xs font-black px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 border border-amber-500/30 transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      الملف الإداري
                    </button>
                  </div>

                  {/* Quick Stat Pill in Rep Card */}
                  <div className="grid grid-cols-3 gap-2 bg-[var(--input-bg)] p-2.5 rounded-2xl text-center border border-[var(--border-color)] text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block font-bold">المنشآت</span>
                      <span className="font-black font-mono text-[var(--text-primary)]">
                        {repBiz.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block font-bold">التارجت</span>
                      <span className="font-black font-mono text-amber-600">
                        {rep.targetMonth || 25}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] block font-bold">عهدة كاش</span>
                      <span
                        className={`font-black font-mono ${
                          repSettlement.totalCashInHand > 0 ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      >
                        {repSettlement.totalCashInHand} ج.م
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <a
                      href={`https://wa.me/2${rep.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>واتساب</span>
                    </a>
                    <a
                      href={`tel:${rep.phone}`}
                      className="py-1.5 px-3 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-bold border border-[var(--border-color)] flex items-center justify-center gap-1 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-amber-500" />
                      <span>اتصال</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
       * 3. SUB-VIEW: TARGET & LEADERBOARD (مستهدف وتنافسية المحافظة)
       * ===================================================================== */}
      {activeView === 'target' && (
        <div className="space-y-4 animate-fade-in">
          <SubViewHeader
            title={`إنجاز مستهدف ${selectedGov}`}
            count={metrics.totalBusinesses}
            badge={`المطلوب: ${metrics.effectiveGovTarget} منشأة`}
          />

          {/* Large Target Overview Card */}
          <div className="bg-gradient-to-br from-amber-500/10 via-[var(--bg-card)] to-teal-500/10 border-2 border-amber-500/30 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)]">
                  نسبة تحقيق المستهدف الشهري لمحافظة {selectedGov}
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-bold mt-0.5">
                  إجمالي التوثيق الميداني المعتمد والمقدم بواسطة المناديب
                </p>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
                {metrics.targetPercent}%
              </div>
            </div>

            <div className="w-full bg-[var(--bg-secondary)] h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${metrics.targetPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
              <span>المحقق: {metrics.totalBusinesses} نشاط</span>
              <span>المستهدف: {metrics.effectiveGovTarget} نشاط</span>
            </div>
          </div>

          {/* Reps Leaderboard */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs sm:text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>ترتيب إنتاجية المناديب في {selectedGov}</span>
            </h3>

            <div className="space-y-2">
              {scopedReps
                .map((rep) => {
                  const repBizCount = scopedBusinesses.filter(
                    (b) => b.repId === rep.id || b.repName === rep.name
                  ).length;
                  const repTarget = rep.targetMonth || 25;
                  const repPercent = Math.min(
                    100,
                    Math.round((repBizCount / repTarget) * 100)
                  );
                  return { rep, repBizCount, repTarget, repPercent };
                })
                .sort((a, b) => b.repBizCount - a.repBizCount)
                .map((item, index) => (
                  <div
                    key={item.rep.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)] gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-800 font-black text-xs flex items-center justify-center shrink-0">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)] truncate">
                          {item.rep.name}
                        </h4>
                        <span className="text-[10px] text-[var(--text-muted)] font-bold">
                          {item.repBizCount} من {item.repTarget} منشأة
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-20 sm:w-32 bg-[var(--bg-card)] h-2 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${item.repPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-black font-mono text-amber-600">
                        {item.repPercent}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * 4. SUB-VIEW: BUSINESSES AUDIT (فحص واعتماد منشآت المحافظة)
       * ===================================================================== */}
      {activeView === 'businesses' && (
        <div className="space-y-4 animate-fade-in">
          <SubViewHeader
            title={`منشآت محافظة ${selectedGov}`}
            count={filteredBusinesses.length}
            badge={`${metrics.pendingBusinesses} قيد المراجعة`}
          />

          {/* Filter Bar */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-2xl shadow-xs space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم المنشأة، المندوب، الهاتف..."
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setBizStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  bizStatusFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                    : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-color)]'
                }`}
              >
                الكل ({scopedBusinesses.length})
              </button>
              <button
                type="button"
                onClick={() => setBizStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  bizStatusFilter === 'pending'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                    : 'bg-[var(--input-bg)] text-amber-700 border-[var(--border-color)]'
                }`}
              >
                بانتظار الفحص ({metrics.pendingBusinesses})
              </button>
              <button
                type="button"
                onClick={() => setBizStatusFilter('verified')}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  bizStatusFilter === 'verified'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                    : 'bg-[var(--input-bg)] text-emerald-700 border-[var(--border-color)]'
                }`}
              >
                معتمد ({metrics.verifiedBusinesses})
              </button>
              <button
                type="button"
                onClick={() => setBizStatusFilter('unpaid')}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  bizStatusFilter === 'unpaid'
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                    : 'bg-[var(--input-bg)] text-rose-700 border-[var(--border-color)]'
                }`}
              >
                غير مسدد ({metrics.unpaidBusinesses})
              </button>
            </div>
          </div>

          {/* Businesses Listing */}
          <div className="space-y-2.5">
            {filteredBusinesses.map((biz) => (
              <UniversalListingCard
                key={biz.id}
                business={biz}
                variant="row"
                showAdminMetrics={true}
                onClick={(b) => setSelectedDrawerBiz(b)}
              />
            ))}

            {filteredBusinesses.length === 0 && (
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-8 text-center text-xs font-bold text-[var(--text-muted)] space-y-2">
                <Building2 className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
                <p>لا توجد منشآت مطابقة للبحث في محافظة {selectedGov}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
       * 5. SUB-VIEW: FINANCE & CASH COLLECTIONS (العهد النقدية والتحصيلات)
       * ===================================================================== */}
      {activeView === 'finance' && (
        <div className="space-y-4 animate-fade-in">
          <SubViewHeader
            title={`العهد والتحصيلات في ${selectedGov}`}
            count={metrics.totalCashInRepsHands}
            badge={`${metrics.pendingPayoutsCount} طلبات سحب`}
          />

          {/* Finance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-xs space-y-1 text-right">
              <span className="text-[11px] font-bold text-[var(--text-muted)]">
                إجمالي عهد الكاش بيد المناديب
              </span>
              <div className="text-xl sm:text-2xl font-black text-blue-600 font-mono">
                {metrics.totalCashInRepsHands.toLocaleString()} ج.م
              </div>
              <span className="text-[10px] text-blue-700 font-bold block">
                مبالغ محصلة نقداً تستوجب التوريد
              </span>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-xs space-y-1 text-right">
              <span className="text-[11px] font-bold text-[var(--text-muted)]">
                مستحقات للمنصة (صافي مديونيات)
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono">
                {metrics.totalDebtToPlatform.toLocaleString()} ج.م
              </div>
              <span className="text-[10px] text-amber-700 font-bold block">
                مطلوب تحصيلها وتوريدها للشركة
              </span>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-xs space-y-1 text-right">
              <span className="text-[11px] font-bold text-[var(--text-muted)]">
                طلبات سحب العمولات المعلقة
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
                {metrics.pendingPayoutsAmount.toLocaleString()} ج.م
              </div>
              <span className="text-[10px] text-emerald-700 font-bold block">
                {metrics.pendingPayoutsCount} طلبات بانتظار الاعتماد
              </span>
            </div>
          </div>

          {/* Pending Payout Requests for this governorate */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs sm:text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-500" />
              <span>طلبات السحب والتوريد بالمحافظة</span>
            </h3>

            <div className="space-y-2">
              {scopedPayoutRequests.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)] gap-3 flex-wrap sm:flex-nowrap"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                        {payout.repName || payout.repId}
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          payout.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : payout.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-700'
                            : 'bg-amber-500/10 text-amber-700'
                        }`}
                      >
                        {payout.status === 'approved'
                          ? 'معتمد'
                          : payout.status === 'rejected'
                          ? 'مرفوض'
                          : 'قيد الانتظار'}
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                      {payout.method} • {payout.accountDetails || 'بدون تفاصيل'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs sm:text-sm font-black font-mono text-emerald-600">
                      {payout.amount} ج.م
                    </span>

                    {payout.receiptPhoto && (
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptPhoto(payout.receiptPhoto!)}
                        className="p-1.5 rounded-xl bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 text-xs font-bold"
                        title="عرض الإيصال"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}

                    {payout.status === 'pending' && onUpdatePayoutRequest && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setPayoutActionModalData({ payout, action: 'approve' })
                          }
                          className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs cursor-pointer"
                        >
                          اعتماد
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPayoutActionModalData({ payout, action: 'reject' })
                          }
                          className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-black text-xs cursor-pointer"
                        >
                          رفض
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {scopedPayoutRequests.length === 0 && (
                <div className="text-center py-6 text-xs text-[var(--text-muted)] font-bold">
                  لا توجد طلبات سحب حالياً لمناديب {selectedGov}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
       * 6. SUB-VIEW: LEADS CRM (عملاء وفرص المحافظة)
       * ===================================================================== */}
      {activeView === 'leads' && (
        <div className="space-y-4 animate-fade-in">
          <SubViewHeader
            title={`فرص وعملاء ${selectedGov} (CRM)`}
            count={filteredLeads.length}
          />

          {/* Filter */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-2xl shadow-xs space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم العميل، النشاط، أو الهاتف..."
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLeadInterestFilter('all')}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  leadInterestFilter === 'all'
                    ? 'bg-purple-600 text-white border-purple-600 font-black'
                    : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-color)]'
                }`}
              >
                الكل ({scopedLeads.length})
              </button>
              <button
                type="button"
                onClick={() => setLeadInterestFilter('high')}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  leadInterestFilter === 'high'
                    ? 'bg-purple-600 text-white border-purple-600 font-black'
                    : 'bg-[var(--input-bg)] text-purple-700 border-[var(--border-color)]'
                }`}
              >
                اهتمام عالي
              </button>
              <button
                type="button"
                onClick={() => setLeadInterestFilter('trending_free')}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  leadInterestFilter === 'trending_free'
                    ? 'bg-purple-600 text-white border-purple-600 font-black'
                    : 'bg-[var(--input-bg)] text-amber-700 border-[var(--border-color)]'
                }`}
              >
                منطقة معفاة
              </button>
            </div>
          </div>

          {/* Leads List */}
          <div className="space-y-2.5">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 shadow-xs flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)] truncate">
                      {lead.clientName}
                    </h4>
                    {lead.businessName && (
                      <span className="text-[11px] text-[var(--text-muted)] font-bold">
                        ({lead.businessName})
                      </span>
                    )}
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700">
                      {lead.interestLevel === 'high'
                        ? 'عالي الاهتمام'
                        : lead.isTrending
                        ? 'منطقة معفاة'
                        : 'عادي'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2">
                    <span>الهاتف: {lead.phone}</span>
                    {lead.city && <span>• {lead.city}</span>}
                    {lead.repName && <span>• المندوب: {lead.repName}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedLeadForWhatsApp(lead)}
                    className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 text-xs font-black flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>مراسلة واتساب</span>
                  </button>

                  {onDirectConvertLead && (
                    <button
                      type="button"
                      onClick={() => onDirectConvertLead(lead)}
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all cursor-pointer active:scale-95"
                    >
                      تحويل لنشاط
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredLeads.length === 0 && (
              <div className="text-center py-8 text-xs text-[var(--text-muted)] font-bold">
                لا يوجد عملاء مهتمون مسجلون في {selectedGov}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
       * 7. SUB-VIEW: MAP (خريطة تغطية المحافظة)
       * ===================================================================== */}
      {activeView === 'map' && (
        <div className="space-y-4 animate-fade-in">
          <SubViewHeader
            title={`خريطة تغطية ${selectedGov}`}
            count={scopedBusinesses.length}
          />
          <div className="rounded-3xl overflow-hidden border border-[var(--border-color)] shadow-md">
            <InteractiveMap
              mode="view"
              businesses={scopedBusinesses}
              onSelectBusiness={(b) => setSelectedDrawerBiz(b)}
              onEditBusiness={onEditBusiness}
              heightClass="h-[520px]"
            />
          </div>
        </div>
      )}

      {/* =====================================================================
       * MODALS & DRAWERS
       * ===================================================================== */}

      {/* 1. Business Details Drawer for Quick Audit */}
      <BusinessDetailsDrawer
        business={selectedDrawerBiz}
        isOpen={Boolean(selectedDrawerBiz)}
        onClose={() => setSelectedDrawerBiz(null)}
        onShowInvoice={onShowInvoice}
        onCollectPayment={onCollectPayment}
        onEditBusiness={onEditBusiness}
        onUpdateBusiness={onUpdateBusiness}
        onDeleteBusiness={onDeleteBusiness}
        currentUser={currentUser}
      />

      {/* 2. Rep Account Dossier Modal */}
      <RepAccountDossierModal
        rep={selectedDossierRep}
        onClose={() => setSelectedDossierRep(null)}
        businesses={businesses}
        allReps={representatives}
        payoutRequests={payoutRequests}
        onUpdateRepresentative={onUpdateRepresentative}
        onEditBusiness={onEditBusiness}
        onUpdatePayoutRequest={onUpdatePayoutRequest}
        currentUser={currentUser}
      />

      {/* 3. Add Representative Modal */}
      <AdminAccountModal
        isOpen={isAddRepOpen}
        onClose={() => setIsAddRepOpen(false)}
        editingRep={null}
        currentUser={currentUser}
        businesses={businesses}
        onAddRepresentative={(rep) => {
          onAddRepresentative({
            ...rep,
            governorate: selectedGov,
          });
          setIsAddRepOpen(false);
          showToast(`تمت إضافة المندوب في محافظة ${selectedGov} بنجاح!`, 'success');
        }}
        onOpenDocViewer={() => {}}
        onPreviewAvatar={() => {}}
      />

      {/* 4. Payout Action Modal (Approve/Reject) */}
      <AdminPayoutActionModal
        modalData={payoutActionModalData}
        onClose={() => setPayoutActionModalData(null)}
        onUpdatePayoutRequest={(payout) => {
          if (onUpdatePayoutRequest) {
            onUpdatePayoutRequest(payout);
            showToast('تم تحديث حالة طلب السحب بنجاح!', 'success');
          }
        }}
        onSelectReceiptPhoto={(photo) => setSelectedReceiptPhoto(photo)}
      />

      {/* 5. Receipt Photo Modal */}
      <AdminReceiptModal
        receiptPhoto={selectedReceiptPhoto}
        onClose={() => setSelectedReceiptPhoto(null)}
      />

      {/* 6. Lead WhatsApp Modal */}
      {selectedLeadForWhatsApp && (
        <LeadWhatsAppModal
          lead={selectedLeadForWhatsApp}
          onClose={() => setSelectedLeadForWhatsApp(null)}
          onUpdateLead={onUpdateLead}
        />
      )}
    </div>
  );
};
