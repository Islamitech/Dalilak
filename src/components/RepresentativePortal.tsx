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
  // Navigation tabs for the sovereign Rep portal
  const [activeTab, setActiveTab] = useState<'businesses' | 'leads' | 'wallet'>('businesses');
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
      setTimeout(() => setCopiedReferral(false), 2000);
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
        alert(`تم نسخ رابط الإحالة المباشر: ${url}`);
      }
    }
  };

  const handleCreateLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim() || !newClientName.trim()) {
      alert('يرجى كتابة اسم العميل ورقم الهاتف على الأقل');
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

  return (
    <div className="space-y-5 pb-24 font-['Cairo',sans-serif] animate-fade-in">
      {/* ===================== SOVEREIGN TOP HEADER ===================== */}
      <header className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative">
            <img
              src={rep.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'}
              alt={rep.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[var(--bg-card)] flex items-center justify-center text-white text-[10px]">
              ✓
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-[var(--text-primary)] truncate">{rep.name}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/20">
                <span>مندوب ميداني معتمد</span>
                <span>• {rep.governorate}</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-medium flex items-center gap-2 flex-wrap">
              <span>نسبة العمولة: <strong>{rep.commissionRate || 42.86}%</strong></span>
              <span>•</span>
              <span className="font-mono">{rep.phone}</span>
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[var(--border-color)]">
          {onOpenAdminView && (
            <button
              onClick={onOpenAdminView}
              className="p-2.5 rounded-2xl bg-[var(--input-bg)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-bold transition-all border border-[var(--border-color)] cursor-pointer flex items-center gap-1.5"
              title="لوحة الإدارة"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">الإدارة</span>
            </button>
          )}

          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="p-2.5 rounded-2xl bg-[var(--input-bg)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-bold transition-all border border-[var(--border-color)] cursor-pointer flex items-center gap-1.5"
              title="الملف الشخصي وبطاقة الهوية"
            >
              <IdCard className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">البطاقة والملف</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">خروج</span>
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onAddNewClick}
            className="bg-gradient-to-r from-amber-500 via-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل نشاط جديد</span>
          </button>
        </div>
      </header>

      {/* ===================== PERFORMANCE KPI CARDS ===================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Monthly Target */}
        <div className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border-color)] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)] font-bold">المستهدف الشهري</span>
            <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">{targetAchieved}</span>
            <span className="text-xs text-[var(--text-muted)] font-bold">/ {targetTotal} منشأة</span>
          </div>
          <div className="w-full bg-[var(--bg-secondary)] h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${targetPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-[var(--text-muted)] font-medium">معدل الإنجاز الحالي: {targetPercent}%</p>
        </div>

        {/* Card 2: Cash in Hand (العهدة المعلقة) */}
        <div className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border-color)] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)] font-bold">نقدية كاش باليد</span>
            <span className="p-1.5 rounded-xl bg-blue-500/10 text-blue-500">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-500">
            {settlement.totalCashInHand} <span className="text-xs font-bold text-[var(--text-muted)]">ج.م</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] font-medium">
            {settlement.isDebtToPlatform
              ? `مطلوب توريده للخزينة: ${settlement.debtToPlatformAmount} ج.م`
              : 'الذمة المالية مسواة بالكامل'}
          </p>
        </div>

        {/* Card 3: Earned Net Commission */}
        <div className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border-color)] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)] font-bold">أرباح العمولات المستحقة</span>
            <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {settlement.withdrawableBalance} <span className="text-xs font-bold text-[var(--text-muted)]">ج.م</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setShowPayoutModal(true)}
              disabled={settlement.withdrawableBalance <= 0}
              className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 disabled:opacity-40 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>طلب سحب أرباح</span>
              <ArrowRight className="w-3 h-3 rotate-180" />
            </button>
          </div>
        </div>

        {/* Card 4: Referral System */}
        <div className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border-color)] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)] font-bold">كود الإحالة الميداني</span>
            <span className="p-1.5 rounded-xl bg-purple-500/10 text-purple-500">
              <Share2 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-center justify-between bg-[var(--bg-secondary)] p-2 rounded-xl border border-[var(--border-color)]">
            <span className="font-mono font-black text-sm text-[var(--text-primary)]">{referralCode || 'دليلك'}</span>
            <button
              onClick={handleCopyReferral}
              className="text-xs font-bold text-amber-500 hover:text-amber-600 transition-colors cursor-pointer flex items-center gap-1"
            >
              {copiedReferral ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedReferral ? 'تم' : 'نسخ'}</span>
            </button>
          </div>
          <button
            onClick={handleShareReferralLink}
            className="w-full text-center text-[10px] font-bold text-purple-600 hover:underline cursor-pointer block pt-0.5"
          >
            مشاركة رابط الدعوة المباشر
          </button>
        </div>
      </div>

      {/* ===================== SOVEREIGN INTERNAL TABS ===================== */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('businesses')}
              className={`py-2 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'businesses'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>أنشطتي الموثقة ({myBusinesses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`py-2 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'leads'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>العملاء المهتمون (CRM) ({myLeads.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('wallet')}
              className={`py-2 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'wallet'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>المحفظة والتسويات</span>
            </button>
          </div>

          {/* View Mode Toggle (Only for businesses tab) */}
          {activeTab === 'businesses' && (
            <div className="flex items-center bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)]">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-[var(--bg-card)] text-amber-500 shadow-xs' : 'text-[var(--text-muted)]'
                }`}
                title="عرض بطاقات"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-[var(--bg-card)] text-amber-500 shadow-xs' : 'text-[var(--text-muted)]'
                }`}
                title="عرض قائمة"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'map' ? 'bg-[var(--bg-card)] text-amber-500 shadow-xs' : 'text-[var(--text-muted)]'
                }`}
                title="عرض الخريطة التفاعلية"
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ===================== TAB 1: MY BUSINESSES ===================== */}
        {activeTab === 'businesses' && (
          <div className="pt-4 space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم التجاري، المدينة، رقم الهاتف، أو رقم الفاتورة..."
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl pr-10 pl-4 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
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
                        ? 'bg-amber-500/15 text-amber-500 border-amber-500/40'
                        : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Display based on viewMode */}
            {viewMode === 'map' ? (
              <div className="rounded-2xl overflow-hidden border border-[var(--border-color)]">
                <InteractiveMap
                  mode="view"
                  businesses={filteredBusinesses}
                  onSelectBusiness={(b) => setSelectedDrawerBiz(b)}
                  onEditBusiness={(b) => onEditBusiness(b)}
                  heightClass="h-[480px]"
                />
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="text-center py-16 space-y-3">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

        {/* ===================== TAB 2: LEADS CRM ===================== */}
        {activeTab === 'leads' && (
          <div className="pt-4 space-y-4">
            {/* Top Bar for Leads */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                {(
                  [
                    { id: 'all', label: 'كافة العملاء' },
                    { id: 'high', label: 'اهتمام ساخن 🔥' },
                    { id: 'medium', label: 'اهتمام دافئ ⚡' },
                    { id: 'trending_free', label: 'إدراج شرفي رائج ✨' },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setLeadInterestFilter(pill.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                      leadInterestFilter === pill.id
                        ? 'bg-amber-500/15 text-amber-500 border-amber-500/40'
                        : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAddLeadModal(true)}
                className="bg-[var(--input-bg)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold text-xs px-3.5 py-2 rounded-xl border border-[var(--border-color)] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-amber-500" />
                <span>إضافة عميل مهتم</span>
              </button>
            </div>

            {/* Leads List */}
            {myLeads.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-40" />
                <h3 className="font-bold text-sm text-[var(--text-secondary)]">لا توجد جهات اتصال مسجلة في قائمة المتابعة</h3>
                <p className="text-xs text-[var(--text-muted)]">أضف عميلاً محتملاً جديداً لتتبع مواعيد التواصل الميداني.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm text-[var(--text-primary)]">{lead.clientName}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
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
                        className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors cursor-pointer"
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
                          className="text-amber-500 font-black hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>تحويل إلى تسجيل نشاط</span>
                          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
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

        {/* ===================== TAB 3: WALLET & SETTLEMENTS ===================== */}
        {activeTab === 'wallet' && (
          <div className="pt-4 space-y-5">
            {/* Financial Settlement Card */}
            <div className="p-5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-4">
              <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-500" />
                <span>كشف التسوية المالية وحساب العمولات</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">إجمالي أرباح العمولات:</span>
                  <span className="font-black text-sm text-[var(--text-primary)]">{settlement.totalEarnedCommission} ج.م</span>
                </div>

                <div className="p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">إجمالي الكاش المحصل باليد:</span>
                  <span className="font-black text-sm text-blue-500">{settlement.totalCashInHand} ج.م</span>
                </div>

                <div className="p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                  <span className="text-[10px] text-[var(--text-muted)] block">الرصيد المتاح للسحب:</span>
                  <span className="font-black text-sm text-emerald-600">{settlement.withdrawableBalance} ج.م</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-[var(--text-muted)] font-medium">
                  يتم تحويل الأرباح عبر المحافظ الإلكترونية (فودافون كاش / إنستاباي) خلال 24 ساعة من اعتماد الطلب.
                </p>

                <button
                  onClick={() => setShowPayoutModal(true)}
                  disabled={settlement.withdrawableBalance <= 0}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  طلب سحب جديد
                </button>
              </div>
            </div>

            {/* Payout History Table */}
            <div className="space-y-3">
              <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                سجل طلبات السحب والتحويلات المالية ({payoutRequests.filter((p) => p.repId === rep.id).length})
              </h4>

              {payoutRequests.filter((p) => p.repId === rep.id).length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)] text-xs font-bold bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                  لا توجد طلبات سحب مسجلة حتى الآن.
                </div>
              ) : (
                <div className="space-y-2">
                  {payoutRequests
                    .filter((p) => p.repId === rep.id)
                    .map((payout) => (
                      <div
                        key={payout.id}
                        className="p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-black text-sm text-[var(--text-primary)]">{payout.amount} ج.م</span>
                          <span className="text-[11px] text-[var(--text-muted)] block">
                            طريقة التحويل: {payout.method} • {payout.accountDetails}
                          </span>
                        </div>

                        <div className="text-right">
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
      </div>

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
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-['Cairo',sans-serif]">
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
        </div>
      )}
    </div>
  );
};
