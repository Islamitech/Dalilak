import { OverlayLayer } from './ui/OverlayLayer';
import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  Wallet,
  Target,
  Plus,
  Search,
  Filter,
  MapPin,
  Phone,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Share2,
  LogOut,
  SlidersHorizontal,
  ExternalLink,
  DollarSign,
  LayoutGrid,
  List,
  Map as MapIcon,
  MessageSquare,
  Sparkles,
  IdCard,
  Link2,
  ChevronLeft,
  Banknote,
  Send,
  X,
} from 'lucide-react';
import { Business, Representative, User, PayoutRequest, InterestedLead } from '../types';
import { calculateRepSettlement, getPackageCommission } from '../utils/commission';
import { getRepReferralSummary, getRepReferralCode } from '../utils/referral';
import { UniversalListingCard } from './design-system/UniversalListingCard';
import { BusinessDetailsDrawer } from './BusinessDetailsDrawer';
import { LeadWhatsAppModal } from './leads/LeadWhatsAppModal';
import { RequestPayoutModal } from './RequestPayoutModal';
import { InteractiveMap } from './InteractiveMap';

interface RepresentativePortalProps {
  user: User;
  rep: Representative;
  businesses: Business[];
  representatives?: Representative[];
  leads?: InterestedLead[];
  payoutRequests?: PayoutRequest[];
  onAddNewClick: () => void;
  onShowInvoice: (b: Business) => void;
  onCollectPayment?: (b: Business) => void;
  onEditBusiness: (b: Business) => void;
  onRequestPayout: (payout: PayoutRequest) => void;
  onLogout: () => void;
  onUpdateRep: (rep: Representative) => void;
  onCreateLead?: (lead: InterestedLead) => void;
  onUpdateLead?: (lead: InterestedLead) => void;
  onDeleteLead?: (id: string) => void;
  onConvertToBusiness?: (lead: InterestedLead) => void;
  onDirectConvertLead?: (lead: InterestedLead) => void;
  onUpdateBusiness?: (b: Business) => void;
  onOpenProfile?: () => void;
  onOpenAdminView?: () => void;
}

type RepSubView = 'home' | 'businesses' | 'leads' | 'wallet' | 'map';

export const RepresentativePortal: React.FC<RepresentativePortalProps> = ({
  user,
  rep,
  businesses,
  representatives = [],
  leads = [],
  payoutRequests = [],
  onAddNewClick,
  onShowInvoice,
  onCollectPayment,
  onEditBusiness,
  onRequestPayout,
  onLogout,
  onUpdateRep,
  onCreateLead,
  onUpdateLead,
  onDeleteLead,
  onConvertToBusiness,
  onDirectConvertLead,
  onUpdateBusiness,
  onOpenProfile,
  onOpenAdminView,
}) => {
  // Navigation: Single Sovereign Home + Deep Drilldown Sub-Views
  const [activeView, setActiveView] = useState<RepSubView>('home');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'map'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending' | 'unpaid' | 'exempt'>('all');
  const [leadInterestFilter, setLeadInterestFilter] = useState<'all' | 'high' | 'medium' | 'trending_free'>('all');

  // Modals state
  const [selectedDrawerBiz, setSelectedDrawerBiz] = useState<Business | null>(null);
  const [selectedLeadForWhatsApp, setSelectedLeadForWhatsApp] = useState<InterestedLead | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // New Lead form state
  const [newClientName, setNewClientName] = useState('');
  const [newBizName, setNewBizName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGov, setNewGov] = useState(rep.governorate || 'القاهرة');
  const [newCity, setNewCity] = useState('');
  const [newInterest, setNewInterest] = useState<'high' | 'medium' | 'low' | 'trending_free'>('high');

  // 1. Rep's Filtered Businesses
  const myBusinesses = useMemo(() => {
    const repIdClean = (rep.id || '').toLowerCase().trim();
    const repNameClean = (rep.name || '').toLowerCase().trim();
    return businesses.filter(
      (b) =>
        (b.repId && b.repId.toLowerCase().trim() === repIdClean) ||
        (b.repName && b.repName.toLowerCase().trim() === repNameClean)
    );
  }, [businesses, rep]);

  // 2. Financial Metrics & Settlements
  const referralSummary = useMemo(
    () => getRepReferralSummary(rep, representatives, businesses),
    [rep, representatives, businesses]
  );
  const referralCode = useMemo(() => getRepReferralCode(rep), [rep]);

  const settlement = useMemo(() => {
    return calculateRepSettlement(
      rep.id,
      myBusinesses,
      rep.commissionRate || 42.86,
      payoutRequests,
      referralSummary.totalNetEarnings
    );
  }, [rep, myBusinesses, payoutRequests, referralSummary]);

  // 3. Target & KPI calculations
  const targetTotal = rep.targetMonth || 25;
  const targetAchieved = myBusinesses.length;
  const targetPercent = Math.min(100, Math.round((targetAchieved / targetTotal) * 100));

  // Verified & Pending counts
  const verifiedCount = useMemo(() => myBusinesses.filter((b) => b.verificationStatus === 'verified').length, [myBusinesses]);
  const unpaidCount = useMemo(() => myBusinesses.filter((b) => b.paymentStatus === 'unpaid').length, [myBusinesses]);

  // 4. Filtered Businesses List
  const filteredBusinesses = useMemo(() => {
    return myBusinesses.filter((b) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          b.nameAr.toLowerCase().includes(q) ||
          (b.nameEn && b.nameEn.toLowerCase().includes(q)) ||
          b.city.toLowerCase().includes(q) ||
          b.phone.includes(q) ||
          b.invoiceNumber.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (statusFilter === 'verified') return b.verificationStatus === 'verified';
      if (statusFilter === 'pending') return b.verificationStatus === 'pending' || b.verificationStatus === 'in_progress';
      if (statusFilter === 'unpaid') return b.paymentStatus === 'unpaid';
      if (statusFilter === 'exempt') return b.isFeeExempt;
      return true;
    });
  }, [myBusinesses, searchQuery, statusFilter]);

  // 5. Rep's Leads List
  const myLeads = useMemo(() => {
    const repIdClean = (rep.id || '').toLowerCase().trim();
    return leads.filter((l) => {
      const matchRep = !l.repId || l.repId.toLowerCase().trim() === repIdClean;
      if (!matchRep) return false;
      if (leadInterestFilter === 'all') return true;
      if (leadInterestFilter === 'trending_free') return l.isTrending || l.interestLevel === 'trending_free';
      return l.interestLevel === leadInterestFilter;
    });
  }, [leads, rep, leadInterestFilter]);

  const handleCopyReferral = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopiedReferral(true);
      setCopiedNotification('تم نسخ كود الإحالة بنجاح!');
      setTimeout(() => {
        setCopiedReferral(false);
        setCopiedNotification(null);
      }, 2500);
    }
  };

  const handleShareReferralLink = () => {
    if (referralCode) {
      const url = `${window.location.origin}/?ref=${referralCode}`;
      if (navigator.share) {
        navigator.share({
          title: `انضم لمنظومة دليلك الميدانية مع المندوب ${rep.name}`,
          text: `سجل نشاطك التجاري أو انضم لفريق المناديب عبر كود الإحالة: ${referralCode}`,
          url,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url);
        setCopiedReferral(true);
        setCopiedNotification('تم نسخ رابط الإحالة المباشر إلى الحافظة!');
        setTimeout(() => {
          setCopiedReferral(false);
          setCopiedNotification(null);
        }, 2500);
      }
    }
  };

  const handleCreateLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim() || !newClientName.trim()) {
      return;
    }
    const newLeadItem: InterestedLead = {
      id: `lead_${Date.now()}`,
      clientName: newClientName.trim(),
      businessName: newBizName.trim() || undefined,
      phone: newPhone.trim(),
      governorate: newGov,
      city: newCity.trim() || undefined,
      interestLevel: newInterest,
      isTrending: newInterest === 'trending_free',
      status: 'pending_followup',
      repId: rep.id,
      repName: rep.name,
      createdDate: new Date().toISOString(),
    };
    if (onCreateLead) {
      onCreateLead(newLeadItem);
    }
    setShowAddLeadModal(false);
    setNewClientName('');
    setNewBizName('');
    setNewPhone('');
    setNewCity('');
  };

  /* ===================================================================
   * SUB-VIEW HEADER — زر العودة للرئيسية وعنوان الشاشة الفرعية
   * =================================================================== */
  const SubViewHeader = ({ title, count, badge }: { title: string; count?: number; badge?: string }) => (
    <div className="flex items-center justify-between gap-3 mb-4 bg-[var(--bg-card)] border border-[var(--border-color)] p-3 sm:p-4 rounded-3xl shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setActiveView('home')}
          className="p-2 sm:p-2.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-all active:scale-95 cursor-pointer shrink-0"
          aria-label="العودة للرئيسية"
          title="العودة للرئيسية"
        >
          <ArrowRight className="w-5 h-5 text-amber-600" />
        </button>
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)] truncate flex items-center gap-2">
            <span>{title}</span>
            {count !== undefined && (
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/20">
                {count}
              </span>
            )}
          </h2>
        </div>
      </div>

      {badge && (
        <span className="text-xs font-bold text-[var(--text-muted)] shrink-0 hidden sm:inline">
          {badge}
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-4 pb-24 font-['Cairo',sans-serif] animate-fade-in max-w-4xl mx-auto px-2 sm:px-4">

      {/* Floating temporary notification toast */}
      {copiedNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-950 text-white text-xs font-black py-2 px-4 rounded-2xl shadow-xl border border-amber-500/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* =====================================================================
       * 🏠 SOVEREIGN HOME SURFACE — واجهة المندوب الرئيسية المبسطة (Uber / Talabat Style)
       * ===================================================================== */}
      {activeView === 'home' && (
        <div className="space-y-4">
          {/* 1. Header Bar: Profile info & Top Utility actions */}
          <header className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-3.5 sm:p-5 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={rep.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'}
                  alt={rep.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-amber-500 shadow-sm"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[var(--bg-card)] flex items-center justify-center text-white text-[8px]">✓</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-[var(--text-primary)] truncate">
                    أهلاً، {rep.name.split(' ')[0]} 👋
                  </h1>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-bold truncate flex items-center gap-1.5 mt-0.5">
                  <span className="text-amber-600">مندوب ميداني</span>
                  <span>•</span>
                  <span>{rep.governorate}</span>
                  {rep.gender && (
                    <>
                      <span>•</span>
                      <span>{rep.gender === 'female' ? 'مندوبة' : 'مندوب'}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onOpenAdminView && (
                <button
                  onClick={onOpenAdminView}
                  className="p-2 sm:p-2.5 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] transition-all border border-[var(--border-color)] cursor-pointer"
                  title="لوحة الإدارة"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              )}
              {onOpenProfile && (
                <button
                  onClick={onOpenProfile}
                  className="p-2 sm:p-2.5 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--bg-secondary)] text-amber-600 transition-all border border-[var(--border-color)] cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="الملف الشخصي وبطاقة الهوية"
                >
                  <IdCard className="w-4 h-4 text-amber-500" />
                  <span className="hidden sm:inline">البطاقة</span>
                </button>
              )}
              <button
                onClick={onLogout}
                className="p-2 sm:p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* 2. Hero Primary CTA: تسجيل نشاط تجاري جديد (بارز ومباشر) */}
          <button
            onClick={onAddNewClick}
            className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm sm:text-base py-4 px-6 rounded-3xl shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between border border-amber-400/40 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-950/10 flex items-center justify-center text-slate-950">
                <Plus className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="text-right">
                <span className="block text-sm sm:text-base font-black">تسجيل نشاط تجاري جديد</span>
                <span className="block text-[11px] font-bold text-slate-900/80">توثيق فوري ميداني بالـ GPS والصور</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-950/10 flex items-center justify-center text-slate-950 group-hover:-translate-x-1 transition-transform">
              <ChevronLeft className="w-5 h-5" />
            </div>
          </button>

          {/* 3. StatActionCards Grid (مربعات إحصائية تفاعلية — تنقر لفتح التفاصيل) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Box 1: رصيد الأرباح (ينتقل للمحفظة والتسويات) */}
            <button
              onClick={() => setActiveView('wallet')}
              className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border-color)] shadow-xs text-right transition-all hover:border-emerald-500/50 hover:shadow-md active:scale-[0.98] cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20 transition-colors">
                    <DollarSign className="w-5 h-5 stroke-[2.5]" />
                  </span>
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    متاح للسحب
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
                    {settlement.withdrawableBalance}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-muted)]">ج.م</span>
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-bold">
                <span>كشف المحفظة</span>
                <ChevronLeft className="w-3.5 h-3.5 text-emerald-600 group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Box 2: المستهدف الشهري (ينتقل للأنشطة) */}
            <button
              onClick={() => setActiveView('businesses')}
              className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border-color)] shadow-xs text-right transition-all hover:border-amber-500/50 hover:shadow-md active:scale-[0.98] cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20 transition-colors">
                    <Target className="w-5 h-5 stroke-[2.5]" />
                  </span>
                  <span className="text-[10px] font-black text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    {targetPercent}%
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-mono">
                    {targetAchieved}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-muted)]">/ {targetTotal} نشاط</span>
                </div>
                <div className="w-full bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${targetPercent}%` }}
                  />
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-bold">
                <span>متابعة الهدف</span>
                <ChevronLeft className="w-3.5 h-3.5 text-amber-600 group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Box 3: أنشطتي الموثقة (ينتقل لقائمة الأنشطة) */}
            <button
              onClick={() => setActiveView('businesses')}
              className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border-color)] shadow-xs text-right transition-all hover:border-blue-500/50 hover:shadow-md active:scale-[0.98] cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 group-hover:bg-blue-500/20 transition-colors">
                    <Building2 className="w-5 h-5 stroke-[2.5]" />
                  </span>
                  <span className="text-[10px] font-black text-blue-700 bg-blue-500/10 px-2 py-0.5 rounded-full">
                    {verifiedCount} معتمد
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-mono">
                    {myBusinesses.length}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-muted)]">منشأة</span>
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-bold">
                <span>استعراض الأنشطة</span>
                <ChevronLeft className="w-3.5 h-3.5 text-blue-600 group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Box 4: العملاء المهتمون Leads CRM (ينتقل لقائمة العملاء) */}
            <button
              onClick={() => setActiveView('leads')}
              className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border-color)] shadow-xs text-right transition-all hover:border-purple-500/50 hover:shadow-md active:scale-[0.98] cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 group-hover:bg-purple-500/20 transition-colors">
                    <Users className="w-5 h-5 stroke-[2.5]" />
                  </span>
                  <span className="text-[10px] font-black text-purple-700 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    متابعة
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-mono">
                    {myLeads.length}
                  </span>
                  <span className="text-xs font-bold text-[var(--text-muted)]">عميل محتمل</span>
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-bold">
                <span>قائمة العملاء (CRM)</span>
                <ChevronLeft className="w-3.5 h-3.5 text-purple-600 group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* 4. Direct Quick Action Buttons (أزرار مباشرة بدون تعقيد) */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-[var(--text-muted)] px-1">إجراءات سريعة مباشرة</h3>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Button 1: الخريطة الميدانية */}
              <button
                onClick={() => setActiveView('map')}
                className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all active:scale-95 cursor-pointer text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapIcon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-xs font-black text-[var(--text-primary)]">الخريطة الميدانية</span>
              </button>

              {/* Button 2: طلب سحب أرباح */}
              <button
                onClick={() => setShowPayoutModal(true)}
                disabled={settlement.withdrawableBalance <= 0}
                className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all active:scale-95 cursor-pointer text-center group disabled:opacity-40"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Banknote className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-xs font-black text-[var(--text-primary)]">طلب سحب أرباح</span>
              </button>

              {/* Button 3: رابط الإحالة */}
              <button
                onClick={handleShareReferralLink}
                className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all active:scale-95 cursor-pointer text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {copiedReferral ? <Check className="w-5 h-5 text-emerald-500 stroke-[3]" /> : <Link2 className="w-5 h-5 stroke-[2.5]" />}
                </div>
                <span className="text-xs font-black text-[var(--text-primary)]">
                  {copiedReferral ? 'تم النسخ ✓' : 'رابط الإحالة'}
                </span>
              </button>
            </div>
          </div>

          {/* 5. Strip: نقدية كاش باليد (تظهر عند وجود مبالغ محصلة باليد) */}
          {settlement.totalCashInHand > 0 && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-[var(--text-primary)] block">نقدية كاش باليد (عهدة محصلة)</span>
                  <span className="text-[11px] text-[var(--text-muted)] font-medium">
                    {settlement.isDebtToPlatform
                      ? `مطلوب توريده للخزينة: ${settlement.debtToPlatformAmount} ج.م`
                      : 'الذمة المالية مسواة'}
                  </span>
                </div>
              </div>
              <span className="text-base font-black text-blue-600 font-mono">
                {settlement.totalCashInHand} ج.م
              </span>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
       * 📂 SUB-VIEW: MY BUSINESSES (أنشطتي الموثقة بالتفصيل)
       * ===================================================================== */}
      {activeView === 'businesses' && (
        <div className="space-y-4">
          <SubViewHeader title="أنشطتي الموثقة" count={myBusinesses.length} badge="سجل المنشآت المسجلة" />

          {/* Search, View Modes & Filters */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-3.5 sm:p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم التجاري، المدينة، رقم الهاتف..."
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl pr-10 pl-9 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer"
                    title="مسح البحث"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)] shrink-0">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'cards' ? 'bg-[var(--bg-card)] text-amber-600 shadow-xs' : 'text-[var(--text-muted)]'
                  }`}
                  title="عرض بطاقات"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-[var(--bg-card)] text-amber-600 shadow-xs' : 'text-[var(--text-muted)]'
                  }`}
                  title="عرض قائمة"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'map' ? 'bg-[var(--bg-card)] text-amber-600 shadow-xs' : 'text-[var(--text-muted)]'
                  }`}
                  title="عرض الخريطة"
                >
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(
                [
                  { id: 'all', label: 'الكل' },
                  { id: 'verified', label: 'موثق ومعتمد' },
                  { id: 'pending', label: 'قيد المراجعة' },
                  { id: 'unpaid', label: 'عليه مديونية' },
                  { id: 'exempt', label: 'إدراج مجاني' },
                ] as const
              ).map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setStatusFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    statusFilter === pill.id
                      ? 'bg-amber-500/15 text-amber-700 border-amber-500/40 font-black'
                      : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Display */}
          {viewMode === 'map' ? (
            <div className="rounded-3xl overflow-hidden border border-[var(--border-color)] shadow-xs">
              <InteractiveMap
                mode="view"
                businesses={filteredBusinesses}
                onSelectBusiness={(b) => setSelectedDrawerBiz(b)}
                onEditBusiness={(b) => onEditBusiness(b)}
                heightClass="h-[480px]"
              />
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-12 text-center space-y-3">
              <Building2 className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-40" />
              <h3 className="font-bold text-sm text-[var(--text-secondary)]">لا توجد منشآت مطابقة للبحث</h3>
              <p className="text-xs text-[var(--text-muted)]">جرب تعديل كلمات البحث أو اختيار فلتر آخر.</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="space-y-2">
              {filteredBusinesses.map((b) => (
                <UniversalListingCard
                  key={b.id}
                  business={b}
                  variant="row"
                  onClick={(biz) => setSelectedDrawerBiz(biz)}
                  showAdminMetrics={true}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredBusinesses.map((b) => (
                <UniversalListingCard
                  key={b.id}
                  business={b}
                  variant="grid"
                  onClick={(biz) => setSelectedDrawerBiz(biz)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
       * 🗺️ SUB-VIEW: MAP (الخريطة الميدانية المباشرة)
       * ===================================================================== */}
      {activeView === 'map' && (
        <div className="space-y-4">
          <SubViewHeader title="الخريطة الميدانية" count={myBusinesses.length} badge="تغطية الأنشطة جغرافياً" />
          <div className="rounded-3xl overflow-hidden border border-[var(--border-color)] shadow-md">
            <InteractiveMap
              mode="view"
              businesses={myBusinesses}
              onSelectBusiness={(b) => setSelectedDrawerBiz(b)}
              onEditBusiness={(b) => onEditBusiness(b)}
              heightClass="h-[calc(100vh-14rem)] min-h-[460px]"
            />
          </div>
        </div>
      )}

      {/* =====================================================================
       * 👥 SUB-VIEW: LEADS CRM (العملاء المهتمون)
       * ===================================================================== */}
      {activeView === 'leads' && (
        <div className="space-y-4">
          <SubViewHeader title="العملاء المهتمون" count={myLeads.length} badge="نظام المتابعة CRM" />

          {/* Actions & Filters */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-3.5 shadow-xs flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(
                [
                  { id: 'all', label: 'كافة العملاء' },
                  { id: 'high', label: 'ساخن 🔥' },
                  { id: 'medium', label: 'دافئ ⚡' },
                  { id: 'trending_free', label: 'رائج ✨' },
                ] as const
              ).map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setLeadInterestFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    leadInterestFilter === pill.id
                      ? 'bg-amber-500/15 text-amber-700 border-amber-500/40 font-black'
                      : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddLeadModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>إضافة عميل مهتم</span>
            </button>
          </div>

          {/* Leads List */}
          {myLeads.length === 0 ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-12 text-center space-y-3">
              <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-40" />
              <h3 className="font-bold text-sm text-[var(--text-secondary)]">لا توجد جهات اتصال مسجلة في قائمة المتابعة</h3>
              <p className="text-xs text-[var(--text-muted)]">أضف عميلاً محتملاً جديداً لتتبع مواعيد التواصل الميداني.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col justify-between gap-3 shadow-xs hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-[var(--text-primary)]">{lead.clientName}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
                          {lead.interestLevel === 'high' ? 'ساخن 🔥' : lead.interestLevel === 'trending_free' ? 'رائج ✨' : 'متوسط'}
                        </span>
                      </div>
                      {lead.businessName && (
                        <p className="text-xs text-[var(--text-secondary)] font-bold mt-0.5">{lead.businessName}</p>
                      )}
                      <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-2">
                        <span className="font-mono">{lead.phone}</span>
                        <span>•</span>
                        <span>{lead.governorate} {lead.city ? `- ${lead.city}` : ''}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedLeadForWhatsApp(lead)}
                      className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                      title="مراسلة سريعة عبر واتساب"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)] text-xs">
                    {onConvertToBusiness && (
                      <button
                        onClick={() => onConvertToBusiness(lead)}
                        className="text-amber-600 font-black hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>تحويل إلى تسجيل نشاط</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteLead && (
                      <button
                        onClick={() => onDeleteLead(lead.id)}
                        className="text-rose-500 hover:underline text-[11px] font-bold cursor-pointer"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
       * 💰 SUB-VIEW: WALLET & SETTLEMENTS (المحفظة والتسويات المالية)
       * ===================================================================== */}
      {activeView === 'wallet' && (
        <div className="space-y-4">
          <SubViewHeader title="المحفظة والتسويات المالية" badge="الحسابات والأرباح" />

          {/* Financial Settlement Card */}
          <div className="p-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-4">
            <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-500" />
              <span>كشف التسوية المالية وحساب العمولات</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] block font-bold">إجمالي أرباح العمولات:</span>
                <span className="font-black text-base text-[var(--text-primary)] font-mono">{settlement.totalEarnedCommission} ج.م</span>
              </div>

              <div className="p-3 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] block font-bold">الكاش المحصل باليد:</span>
                <span className="font-black text-base text-blue-600 font-mono">{settlement.totalCashInHand} ج.م</span>
              </div>

              <div className="p-3 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] block font-bold">الرصيد المتاح للسحب:</span>
                <span className="font-black text-base text-emerald-600 font-mono">{settlement.withdrawableBalance} ج.م</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between flex-wrap gap-2 border-t border-[var(--border-color)]">
              <p className="text-xs text-[var(--text-muted)] font-medium">
                يتم تحويل الأرباح عبر فودافون كاش أو إنستاباي خلال 24 ساعة من اعتماد الطلب.
              </p>

              <button
                onClick={() => setShowPayoutModal(true)}
                disabled={settlement.withdrawableBalance <= 0}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-xs px-5 py-2.5 rounded-2xl shadow-sm transition-all cursor-pointer"
              >
                طلب سحب جديد
              </button>
            </div>
          </div>

          {/* Referral Earnings Card */}
          <div className="p-4 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs space-y-3">
            <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Share2 className="w-4 h-4 text-purple-500" />
              <span>أرباح وكود الإحالة الميداني</span>
            </h4>
            <div className="flex items-center justify-between bg-[var(--bg-secondary)] p-3 rounded-2xl border border-[var(--border-color)]">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block font-bold">كود الإحالة الخاص بك</span>
                <span className="font-mono font-black text-sm text-[var(--text-primary)]">{referralCode || 'دليلك'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyReferral}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/15"
                >
                  {copiedReferral ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReferral ? 'تم' : 'نسخ'}</span>
                </button>
                <button
                  onClick={handleShareReferralLink}
                  className="p-2 rounded-xl bg-purple-500/15 text-purple-600 hover:bg-purple-500/25 transition-colors cursor-pointer"
                  title="مشاركة الرابط"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Payout History Table */}
          <div className="space-y-3">
            <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)] px-1">
              سجل طلبات السحب والتحويلات ({payoutRequests.filter((p) => p.repId === rep.id).length})
            </h4>

            {payoutRequests.filter((p) => p.repId === rep.id).length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] text-xs font-bold bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)]">
                لا توجد طلبات سحب مسجلة حتى الآن.
              </div>
            ) : (
              <div className="space-y-2">
                {payoutRequests
                  .filter((p) => p.repId === rep.id)
                  .map((payout) => (
                    <div
                      key={payout.id}
                      className="p-3.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] flex items-center justify-between text-xs shadow-xs"
                    >
                      <div>
                        <span className="font-black text-sm text-[var(--text-primary)] font-mono">{payout.amount} ج.م</span>
                        <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
                          {payout.method} • {payout.accountDetails}
                        </span>
                      </div>
                      <div className="text-left">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                            payout.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : payout.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}
                        >
                          {payout.status === 'approved' ? 'تم التحويل' : payout.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{payout.requestDate.split('T')[0]}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== MODALS & DRAWERS ===================== */}
      {/* 1. Universal Business Details Drawer */}
      <BusinessDetailsDrawer
        business={selectedDrawerBiz}
        isOpen={Boolean(selectedDrawerBiz)}
        onClose={() => setSelectedDrawerBiz(null)}
        onShowInvoice={onShowInvoice}
        onCollectPayment={onCollectPayment}
        onEditBusiness={onEditBusiness}
        onUpdateBusiness={onUpdateBusiness}
        currentUser={user}
      />

      {/* 2. Leads WhatsApp Modal */}
      <LeadWhatsAppModal
        lead={selectedLeadForWhatsApp}
        onClose={() => setSelectedLeadForWhatsApp(null)}
      />

      {/* 3. Request Payout Modal */}
      {showPayoutModal && (
        <RequestPayoutModal
          isOpen={showPayoutModal}
          onClose={() => setShowPayoutModal(false)}
          rep={rep}
          availableBalance={settlement.withdrawableBalance}
          onSubmitPayout={onRequestPayout}
        />
      )}

      {/* 4. Add Lead Modal */}
      {showAddLeadModal && (
        <OverlayLayer className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-['Cairo',sans-serif]">
          <div className="bg-[var(--bg-card)] rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[var(--border-color)] animate-fade-in space-y-4">
            <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)]">إضافة عميل مهتم جديد</h3>
            <form onSubmit={handleCreateLeadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--text-muted)] font-bold mb-1">اسم العميل / المسؤول:</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="مثال: أحمد محمود"
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-primary)] font-bold"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] font-bold mb-1">اسم النشاط أو المحل (إن وجد):</label>
                <input
                  type="text"
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  placeholder="مثال: صيدلية الأمل"
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-muted)] font-bold mb-1">رقم الهاتف أو الواتساب:</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-primary)] font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[var(--text-muted)] font-bold mb-1">المحافظة:</label>
                  <input
                    type="text"
                    value={newGov}
                    onChange={(e) => setNewGov(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-primary)] font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] font-bold mb-1">الحي / المنطقة:</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="مثال: مدينة نصر"
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-muted)] font-bold mb-1">درجة الاهتمام:</label>
                <select
                  value={newInterest}
                  onChange={(e: any) => setNewInterest(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-primary)] font-bold cursor-pointer"
                >
                  <option value="high">ساخن (جاهز للاشتراك) 🔥</option>
                  <option value="medium">متوسط (يحتاج متابعة) ⚡</option>
                  <option value="trending_free">إدراج شرفي رائج (مجاني) ✨</option>
                  <option value="low">منخفض</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all cursor-pointer"
                >
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </OverlayLayer>
      )}
    </div>
  );
};
