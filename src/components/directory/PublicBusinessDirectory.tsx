import React, { useState, useMemo } from 'react';
import { Business, User } from '../../types';
import { EGYPT_GOVERNORATES, CATEGORY_GROUPS } from '../../data/mockData';
import { formatActivityDateTime, sortBusinessesNewestFirst } from '../../utils/dateFormatters';
import { getRepFieldIntroWhatsAppUrl } from '../../utils/whatsappMessages';
import { safeSetLocalStorageItem, safeGetLocalStorageItem } from '../../utils/storage';
import {
  Store,
  ShieldCheck,
  MapPin,
  Clock,
  Building2,
  Search,
  LayoutGrid,
  List,
  Loader2,
  PlusCircle,
  Play,
  Phone,
  MessageCircle,
  Navigation,
  FileText,
  Eye,
} from 'lucide-react';

interface PublicBusinessDirectoryProps {
  businesses: Business[];
  isLoadingData: boolean;
  hasInitialCloudSynced: boolean;
  currentUser: User | null;
  scopedBusinesses: Business[];
  onAddNewClick: () => void;
  onShowInvoice: (biz: Business) => void;
  onEditBusiness: (biz: Business) => void;
  onSelectVideoBiz: (biz: Business) => void;
}

export const PublicBusinessDirectory: React.FC<PublicBusinessDirectoryProps> = ({
  businesses,
  isLoadingData,
  hasInitialCloudSynced,
  currentUser,
  scopedBusinesses,
  onAddNewClick,
  onShowInvoice,
  onEditBusiness,
  onSelectVideoBiz,
}) => {
  // Local Directory Filters & View Mode
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [govFilter, setGovFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'in_progress' | 'fully_paid' | 'unpaid'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (safeGetLocalStorageItem('dalelak_home_view_mode') as 'grid' | 'list') || 'list');

  // 100% STRICT DIRECTORY FILTER (Only verified businesses in public directory)
  const verifiedPublicBusinesses = useMemo(() => {
    return businesses.filter((b) => b.verificationStatus === 'verified');
  }, [businesses]);

  const homeStats = useMemo(() => {
    const totalRegistered = businesses.length;
    const directoryApproved = verifiedPublicBusinesses.length;
    const pendingDirectory = businesses.filter((b) => b.verificationStatus !== 'verified').length;

    const googleMapsVerified = businesses.filter((b) => {
      const url = (b.googleMapsUrl || '').trim();
      const hasRealUrl = url.startsWith('http') && !url.includes('search/?api=1&query=');
      const isAlreadyOnGooglePkg = b.isAlreadyOnGoogle || b.packageId === 'pkg_already_on_google';
      return hasRealUrl || isAlreadyOnGooglePkg;
    }).length;

    const govs = new Set(businesses.map((b) => b.governorate).filter(Boolean)).size;
    const fullyPaid = verifiedPublicBusinesses.filter((b) => b.isFeeExempt || b.paymentStatus === 'fully_paid' || (b.amountPaid || 0) >= (b.packagePrice || 250)).length;
    const exempt = verifiedPublicBusinesses.filter((b) => b.isFeeExempt || b.packagePrice === 0).length;

    return {
      totalRegistered,
      directoryApproved,
      googleMapsVerified,
      pendingDirectory,
      govs,
      fullyPaid,
      exempt,
      total: directoryApproved,
    };
  }, [verifiedPublicBusinesses, businesses]);

  const filteredBusinesses = useMemo(() => {
    return sortBusinessesNewestFirst(
      verifiedPublicBusinesses.filter((b) => {
        if (searchQuery) {
          const q = searchQuery.trim().toLowerCase();
          const matchName = (b.nameAr || '').toLowerCase().includes(q) || (b.nameEn || '').toLowerCase().includes(q);
          const matchCity = (b.city || '').toLowerCase().includes(q) || (b.governorate || '').toLowerCase().includes(q);
          const matchOwner = (b.ownerName || '').toLowerCase().includes(q) || (b.ownerPhone || '').includes(q);
          const matchRep = (b.repName || '').toLowerCase().includes(q);
          const matchInvoice = (b.invoiceNumber || '').toLowerCase().includes(q);
          if (!matchName && !matchCity && !matchOwner && !matchRep && !matchInvoice) {
            return false;
          }
        }
        if (govFilter !== 'all' && !b.governorate.includes(govFilter)) {
          return false;
        }
        if (categoryFilter !== 'all') {
          const grp = CATEGORY_GROUPS.find((g) => g.group === categoryFilter);
          if (grp) {
            if (!grp.items.includes(b.category) && !b.category.includes(categoryFilter)) {
              return false;
            }
          } else if (!b.category.includes(categoryFilter)) {
            return false;
          }
        }
        if (verificationFilter === 'fully_paid') {
          if (!b.isFeeExempt && b.paymentStatus !== 'fully_paid' && (b.amountPaid || 0) < (b.packagePrice || 250)) return false;
        } else if (verificationFilter === 'unpaid') {
          if (b.isFeeExempt || b.paymentStatus === 'fully_paid' || (b.amountPaid || 0) >= (b.packagePrice || 250)) return false;
        }
        return true;
      })
    );
  }, [verifiedPublicBusinesses, searchQuery, govFilter, categoryFilter, verificationFilter]);

  return (
    <div className="space-y-4">
      {/* ── TOP KPI METRICS BAR ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {/* 1. إجمالي الأنشطة المسجلة */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 sm:p-4 rounded-2xl shadow-xs flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-500/15 text-slate-600 dark:text-slate-300 flex items-center justify-center font-black shrink-0">
            <Store className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] sm:text-[11px] text-[var(--text-muted)] font-bold truncate">إجمالي المسجل</div>
            {isLoadingData && businesses.length === 0 ? (
              <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 animate-pulse rounded-lg mt-1" />
            ) : (
              <div className="text-base sm:text-lg font-black text-[var(--text-primary)] font-mono">{homeStats.totalRegistered}</div>
            )}
          </div>
        </div>

        {/* 2. معتمد بالدليل العام */}
        <div className="bg-[var(--bg-card)] border border-emerald-500/30 p-3 sm:p-4 rounded-2xl shadow-xs flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-black shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-bold truncate">معتمد بالدليل 🟢</div>
            {isLoadingData && businesses.length === 0 ? (
              <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 animate-pulse rounded-lg mt-1" />
            ) : (
              <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{homeStats.directoryApproved}</div>
            )}
          </div>
        </div>

        {/* 3. موثق بـ Google Maps */}
        <div className="bg-[var(--bg-card)] border border-blue-500/30 p-3 sm:p-4 rounded-2xl shadow-xs flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-black shrink-0">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-bold truncate">موثق بـ Google 🗺️</div>
            {isLoadingData && businesses.length === 0 ? (
              <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 animate-pulse rounded-lg mt-1" />
            ) : (
              <div className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 font-mono">{homeStats.googleMapsVerified}</div>
            )}
          </div>
        </div>

        {/* 4. قيد مراجعة الدليل */}
        <div className="bg-[var(--bg-card)] border border-amber-500/30 p-3 sm:p-4 rounded-2xl shadow-xs flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-black shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-bold truncate">قيد مراجعة الدليل ⏳</div>
            {isLoadingData && businesses.length === 0 ? (
              <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 animate-pulse rounded-lg mt-1" />
            ) : (
              <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 font-mono">{homeStats.pendingDirectory}</div>
            )}
          </div>
        </div>

        {/* 5. المحافظات المغطاة */}
        <div className="col-span-2 sm:col-span-1 bg-[var(--bg-card)] border border-[var(--border-color)] p-3 sm:p-4 rounded-2xl shadow-xs flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center font-black shrink-0">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] sm:text-[11px] text-[var(--text-muted)] font-bold truncate">المحافظات المغطاة</div>
            {isLoadingData && businesses.length === 0 ? (
              <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 animate-pulse rounded-lg mt-1" />
            ) : (
              <div className="text-base sm:text-lg font-black text-purple-600 dark:text-purple-400 font-mono">{homeStats.govs}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── UNIFIED DIRECTORY TOOLBAR & FILTERS ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-3.5 sm:p-5 space-y-3.5 shadow-sm">
        {/* Row 1: Search + Governorate + View Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-amber-500 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="ابحث باسم المحل، المالك، الهاتف، أو المدينة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs sm:text-sm rounded-2xl pr-10 pl-8 py-2.5 focus:outline-none focus:border-amber-500 font-bold shadow-inner placeholder:text-[var(--text-muted)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={govFilter}
              onChange={(e) => setGovFilter(e.target.value)}
              className="flex-1 sm:flex-initial bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold rounded-2xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
            >
              <option value="all">📍 كل المحافظات</option>
              {EGYPT_GOVERNORATES.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>

            {/* View Switcher: Grid vs List */}
            <div className="flex items-center bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--border-color)] shrink-0">
              <button
                onClick={() => { setViewMode('grid'); safeSetLocalStorageItem('dalelak_home_view_mode', 'grid'); }}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="عرض البطاقات العصرية"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setViewMode('list'); safeSetLocalStorageItem('dalelak_home_view_mode', 'list'); }}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
                title="عرض القائمة المجدولة"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Status Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          {[
            { key: 'all', label: '⭐ جميع الأنشطة المعتمدة', count: homeStats.total },
            { key: 'fully_paid', label: '💳 مسددة بالكامل', count: homeStats.fullyPaid },
            { key: 'unpaid', label: '⚠️ بانتظار السداد', count: Math.max(0, homeStats.total - homeStats.fullyPaid) },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setVerificationFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${
                verificationFilter === tab.key
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs font-black'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-amber-500/40'
              }`}
            >
              <span>{tab.label}</span>
              {isLoadingData && businesses.length === 0 ? (
                <span className="w-3.5 h-3 bg-slate-300 dark:bg-slate-700 animate-pulse rounded-full" />
              ) : (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                  verificationFilter === tab.key ? 'bg-slate-950 text-amber-400' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Row 3: Category Quick Chips Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold border-t border-[var(--border-color)]/50 pt-2.5">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              categoryFilter === 'all'
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black border border-amber-500/40'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
            }`}
          >
            ⭐ جميع التصنيفات
          </button>
          {CATEGORY_GROUPS.map((grp) => (
            <button
              key={grp.group}
              onClick={() => setCategoryFilter(grp.group === categoryFilter ? 'all' : grp.group)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0 ${
                categoryFilter === grp.group
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black border border-amber-500/40 shadow-2xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
              }`}
            >
              <span>{grp.icon}</span>
              <span>{grp.group}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 1. LOADING SKELETON STATE (Shown ONLY on first cold visit with empty cache) ── */}
      {isLoadingData && businesses.length === 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2.5 py-3.5 px-4 bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm rounded-2xl animate-pulse shadow-xs">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
            <span>جاري جلب وتحديث الأنشطة التجارية والبيانات من السحابة...</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={`skel-${i}`}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between animate-pulse"
              >
                <div className="relative aspect-[16/8.5] bg-slate-200 dark:bg-slate-800" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3" />
                  <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" />
                    <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-xl w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2. EMPTY STATE ── */}
      {hasInitialCloudSynced && filteredBusinesses.length === 0 && (
        <div className="text-center py-12 px-4 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] space-y-3.5 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto text-2xl shadow-inner">
            🏪
          </div>
          {currentUser?.role === 'rep' && scopedBusinesses.length === 0 ? (
            <>
              <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)]">
                لم تقم بتسجيل أي نشاط تجاري حتى الآن
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                هذه المساحة مخصصة لعرض وإدارة الأنشطة والزيارات الميدانية الخاصة بك. ابدأ الآن بتوثيق أول محل تجاري لتفعيل حسابك وكسب عمولتك فوراً!
              </p>
              <button
                onClick={onAddNewClick}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 font-extrabold text-xs px-6 py-3 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer mt-1"
              >
                <PlusCircle className="w-4 h-4" />
                <span>تسجيل أول نشاط تجاري الآن ➕</span>
              </button>
            </>
          ) : (
            <>
              <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)]">
                لا توجد أنشطة تجارية مطابقة للبحث أو التصفية الحالية
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                جرب تغيير خيارات التصفية أو البحث، أو اضغط على "تسجيل نشاط جديد" للبدء في توثيق المحلات.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setGovFilter('all');
                  setCategoryFilter('all');
                  setVerificationFilter('all');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-xl border border-amber-500/30 cursor-pointer transition-colors"
              >
                إعادة ضبط الفلاتر 🔄
              </button>
            </>
          )}
        </div>
      )}

      {/* ── 3. GRID MODE ── */}
      {(!isLoadingData || businesses.length > 0) && viewMode === 'grid' && filteredBusinesses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredBusinesses.map((biz) => {
            const isExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
            const remaining = isExempt ? 0 : Math.max(0, (biz.packagePrice || 0) - (biz.amountPaid || 0));
            const isVerified = biz.verificationStatus === 'verified';
            const hasPhotos = biz.photos && biz.photos.length > 0;
            const hasVideos = Boolean(biz.videos && biz.videos.length > 0);
            const coverPhoto = hasPhotos ? biz.photos[0] : null;

            return (
              <div
                key={biz.id}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-xs hover:shadow-lg hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Visual Header / Cover */}
                <div className="relative aspect-[16/8.5] bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-slate-900/10 overflow-hidden">
                  {coverPhoto ? (
                    <img
                      src={coverPhoto}
                      alt={biz.nameAr}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-amber-500/60 bg-[var(--bg-surface)]">
                      <Store className="w-8 h-8 opacity-40 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold text-[var(--text-muted)] opacity-70">منظومة دليلك الميدانية</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Center Play Button Overlay for Videos */}
                  {hasVideos && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVideoBiz(biz);
                      }}
                      className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-slate-950/75 hover:bg-amber-500 text-amber-400 hover:text-slate-950 flex items-center justify-center backdrop-blur-md border border-amber-500/60 shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 z-10 cursor-pointer group-hover:scale-105"
                      title="تشغيل فيديو النشاط (30 ثانية)"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>
                  )}

                  {/* Floating Verified & Video Badges */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                    <span
                      className={`text-[9.5px] font-black px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm border ${
                        isVerified
                          ? 'bg-emerald-500/90 text-white border-emerald-400/40'
                          : 'bg-amber-500/90 text-slate-950 border-amber-400/40'
                      }`}
                    >
                      {isVerified ? '✓ معتمد بالدليل' : '⏳ قيد المراجعة'}
                    </span>

                    {hasVideos && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectVideoBiz(biz);
                        }}
                        className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-black shadow-md hover:scale-105 transition-transform cursor-pointer border border-amber-400/60"
                        title="مشاهدة فيديو النشاط الميداني"
                      >
                        <Play className="w-2.5 h-2.5 fill-slate-950" />
                        <span>فيديو 30ث</span>
                      </button>
                    )}
                  </div>

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-950/70 text-slate-200 backdrop-blur-md border border-white/10">
                      {biz.invoiceNumber || 'INV'}
                    </span>
                  </div>

                  {/* Bottom info on photo */}
                  <div className="absolute bottom-2 right-2.5 left-2.5 flex items-center justify-between text-white">
                    <span className="text-[10px] font-bold bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10 truncate max-w-[170px]">
                      {biz.category}
                    </span>
                    {biz.workingHours && (
                      <span className="text-[9px] font-medium opacity-80 truncate max-w-[130px] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {biz.workingHours}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-3.5 sm:p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-black text-sm sm:text-base text-[var(--text-primary)] group-hover:text-amber-500 transition-colors line-clamp-1">
                        {biz.nameAr}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] font-bold mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{biz.governorate} • {biz.city} {biz.street ? `• ${biz.street}` : ''}</span>
                      </div>
                    </div>

                    {/* Representative & Date Strip */}
                    <div className="flex items-center justify-between text-[10.5px] bg-[var(--input-bg)] px-2.5 py-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] font-bold">
                      <span className="truncate max-w-[140px] text-[var(--text-secondary)]">👤 {biz.repName || 'مندوب ميداني'}</span>
                      <span className="font-mono text-[9.5px] shrink-0">{formatActivityDateTime(biz.createdDate || biz.invoiceDate)}</span>
                    </div>

                    {/* Financial Package & Payment Row */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-1">
                        {isExempt ? (
                          <span className="text-[11px] font-black text-teal-700 dark:text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                            🆓 نشاط رائج (مجاني 0 ج)
                          </span>
                        ) : (
                          <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            {biz.packagePrice || 250} ج.م
                          </span>
                        )}
                      </div>
                      <div>
                        {isExempt ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                            ✓ إدراج مجاني
                          </span>
                        ) : remaining === 0 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            ✓ مسدد بالكامل
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            متبقي {remaining} ج
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Interactive Actions */}
                  <div className="pt-2 border-t border-[var(--border-color)]/60 space-y-2">
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      {/* Call */}
                      <a
                        href={`tel:${biz.phone || biz.ownerPhone}`}
                        className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-emerald-500/15 text-[var(--text-secondary)] hover:text-emerald-600 flex flex-col items-center justify-center gap-0.5 transition-colors text-[9.5px] font-bold border border-[var(--border-color)]"
                        title="اتصال هاتفي"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>اتصال</span>
                      </a>

                      {/* WhatsApp */}
                      <a
                        href={getRepFieldIntroWhatsAppUrl(biz, currentUser?.name)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-emerald-500/15 text-[var(--text-secondary)] hover:text-emerald-600 flex flex-col items-center justify-center gap-0.5 transition-colors text-[9.5px] font-bold border border-[var(--border-color)]"
                        title="محادثة واتساب ميدانية"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span>واتساب</span>
                      </a>

                      {/* Google Maps */}
                      {biz.googleMapsUrl && biz.googleMapsUrl.trim().startsWith('http') ? (
                        <a
                          href={biz.googleMapsUrl.trim()}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex flex-col items-center justify-center gap-0.5 transition-colors text-[9.5px] font-bold border border-[var(--border-color)]"
                          title="الموقع موثق رسمياً: فتح على خرائط Google"
                        >
                          <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                          <span>الخريطة</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 flex flex-col items-center justify-center gap-0.5 text-[9.5px] font-bold border border-slate-300 dark:border-slate-700/80 cursor-not-allowed opacity-60"
                          title="النشاط غير موثق بعد (قيد مراجعة واعتماد خرائط Google)"
                        >
                          <Navigation className="w-3.5 h-3.5 opacity-40" />
                          <span>غير مدرج</span>
                        </button>
                      )}

                      {/* Invoice Preview */}
                      <button
                        type="button"
                        onClick={() => onShowInvoice(biz)}
                        className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-purple-500/15 text-[var(--text-secondary)] hover:text-purple-600 flex flex-col items-center justify-center gap-0.5 transition-colors text-[9.5px] font-bold border border-[var(--border-color)] cursor-pointer"
                        title="عرض الفاتورة الإلكترونية"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-500" />
                        <span>فاتورة</span>
                      </button>
                    </div>

                    {/* Primary Details / Edit Button */}
                    <button
                      onClick={() => onEditBusiness(biz)}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 stroke-[2.5]" />
                      <span>تفاصيل وتعديل النشاط</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 4. LIST / TABLE MODE ── */}
      {(!isLoadingData || businesses.length > 0) && viewMode === 'list' && filteredBusinesses.length > 0 && (
        <div className="space-y-3">
          {/* MOBILE VIEW (< md) */}
          <div className="md:hidden space-y-2.5">
            {filteredBusinesses.map((biz) => {
              const isExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
              const remaining = isExempt ? 0 : Math.max(0, (biz.packagePrice || 0) - (biz.amountPaid || 0));
              const isVerified = biz.verificationStatus === 'verified';
              const ownerPhone = biz.ownerPhone || biz.phone || '';

              const hasPhotos = Array.isArray(biz.photos) && biz.photos.length > 0;
              const coverPhoto = hasPhotos ? biz.photos[0] : null;
              const hasVideos = Boolean(Array.isArray(biz.videos) && biz.videos.length > 0);

              return (
                <div
                  key={`mob_${biz.id}`}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-2xl shadow-xs space-y-2"
                >
                  {/* Row 1: Photo + Name + Badges */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {/* Photo Thumbnail */}
                      <div
                        onClick={() => onEditBusiness(biz)}
                        className="relative w-12 h-12 rounded-xl overflow-hidden bg-[var(--input-bg)] border border-[var(--border-color)] shrink-0 cursor-pointer group shadow-2xs"
                      >
                        {coverPhoto ? (
                          <img src={coverPhoto} alt={biz.nameAr} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-amber-500/60">
                            <Store className="w-5 h-5" />
                          </div>
                        )}
                        {hasVideos && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectVideoBiz(biz);
                            }}
                            className="absolute inset-0 bg-slate-950/50 flex items-center justify-center cursor-pointer hover:bg-amber-500/80 transition-colors"
                            title="مشاهدة فيديو النشاط"
                          >
                            <Play className="w-3.5 h-3.5 text-amber-400 fill-current" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          onClick={() => onEditBusiness(biz)}
                          className="font-black text-sm text-[var(--text-primary)] hover:text-amber-500 cursor-pointer truncate"
                        >
                          {biz.nameAr}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] font-bold mt-0.5">
                          <span>{biz.governorate}</span>
                          <span>•</span>
                          <span>{biz.city}</span>
                          <span>•</span>
                          <span className="text-[var(--text-muted)]">{biz.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border ${
                          isVerified
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {isVerified ? 'معتمد ✓' : 'مراجعة ⏳'}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Finance & Rep */}
                  <div className="flex items-center justify-between text-[11px] bg-[var(--input-bg)] px-2.5 py-1.5 rounded-xl border border-[var(--border-color)]">
                    <span className="font-bold text-[var(--text-secondary)]">
                      {isExempt ? (
                        <span className="text-teal-600 dark:text-teal-400">مجاني 0 ج</span>
                      ) : (
                        <span>{biz.packagePrice || 250} ج.م ({remaining === 0 ? 'مسدد' : `متبقي ${remaining}`})</span>
                      )}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">
                      {biz.repName || 'مندوب ميداني'}
                    </span>
                  </div>

                  {/* Row 3: Fast Quick Actions */}
                  <div className="flex items-center justify-between gap-1.5 pt-0.5">
                    <button
                      onClick={() => onEditBusiness(biz)}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-black py-1.5 px-2 rounded-xl shadow-2xs transition-transform active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>التفاصيل</span>
                    </button>

                    {biz.googleMapsUrl && biz.googleMapsUrl.trim().startsWith('http') && !biz.googleMapsUrl.includes('search/?api=1&query=') ? (
                      <a
                        href={biz.googleMapsUrl.trim()}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 border border-blue-500/30 p-1.5 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                        title="فتح موقع النشاط على خرائط Google"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="bg-[var(--input-bg)] text-slate-400 border border-[var(--border-color)] p-1.5 rounded-xl opacity-40 cursor-not-allowed flex items-center justify-center"
                        title="الخريطة غير مفعلة (لم يتم إضافة الرابط بعد)"
                      >
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    )}

                    <button
                      onClick={() => onShowInvoice(biz)}
                      className="bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] border border-[var(--border-color)] text-[11px] font-bold py-1.5 px-2.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      title="عرض الفاتورة"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      <span>فاتورة</span>
                    </button>

                    {ownerPhone && (
                      <a
                        href={`https://wa.me/2${ownerPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 p-1.5 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                        title="مراسلة واتساب"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {ownerPhone && (
                      <a
                        href={`tel:${ownerPhone}`}
                        className="bg-blue-600/15 hover:bg-blue-600/25 text-blue-600 dark:text-blue-400 border border-blue-500/30 p-1.5 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                        title="اتصال هاتفي"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP VIEW (>= md): High-Speed Clean Data Table */}
          <div className="hidden md:block bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs table-auto">
                <thead className="bg-[var(--input-bg)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-black text-[11px]">
                  <tr>
                    <th className="py-3 px-4 min-w-[170px]">النشاط التجاري</th>
                    <th className="py-3 px-3 min-w-[130px]">التصنيف</th>
                    <th className="py-3 px-3 min-w-[130px]">الموقع</th>
                    <th className="py-3 px-3 min-w-[110px]">حالة التوثيق</th>
                    <th className="py-3 px-3 min-w-[125px]">الموقف المالي</th>
                    <th className="py-3 px-3 min-w-[120px]">المندوب المسجل</th>
                    <th className="py-3 px-4 text-center min-w-[140px]">الإجراءات السريعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/60">
                  {filteredBusinesses.map((biz) => {
                    const isExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
                    const remaining = isExempt ? 0 : Math.max(0, (biz.packagePrice || 0) - (biz.amountPaid || 0));
                    const isVerified = biz.verificationStatus === 'verified';
                    const ownerPhone = biz.ownerPhone || biz.phone || '';

                    const hasPhotos = Array.isArray(biz.photos) && biz.photos.length > 0;
                    const coverPhoto = hasPhotos ? biz.photos[0] : null;
                    const hasVideos = Boolean(Array.isArray(biz.videos) && biz.videos.length > 0);

                    return (
                      <tr key={`desktop_list_${biz.id}`} className="hover:bg-[var(--input-bg)]/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {/* Photo Thumbnail */}
                            <div
                              onClick={() => onEditBusiness(biz)}
                              className="relative w-10 h-10 rounded-xl overflow-hidden bg-[var(--input-bg)] border border-[var(--border-color)] shrink-0 cursor-pointer group shadow-2xs"
                            >
                              {coverPhoto ? (
                                <img src={coverPhoto} alt={biz.nameAr} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-amber-500/50">
                                  <Store className="w-4 h-4" />
                                </div>
                              )}
                              {hasVideos && (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectVideoBiz(biz);
                                  }}
                                  className="absolute inset-0 bg-slate-950/50 flex items-center justify-center cursor-pointer hover:bg-amber-500/80 transition-colors"
                                  title="مشاهدة فيديو النشاط"
                                >
                                  <Play className="w-3.5 h-3.5 text-amber-400 fill-current" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div
                                onClick={() => onEditBusiness(biz)}
                                className="font-black text-[var(--text-primary)] hover:text-amber-500 cursor-pointer text-sm truncate max-w-[160px]"
                              >
                                {biz.nameAr}
                              </div>
                              <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                                <span>{biz.invoiceNumber}</span>
                                {hasPhotos && (
                                  <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 rounded">
                                    📷 {biz.photos.length}
                                  </span>
                                )}
                                {hasVideos && (
                                  <span className="text-[9px] font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-1 rounded">
                                    🎬 فيديو
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="bg-[var(--input-bg)] px-2 py-0.5 rounded-lg border border-[var(--border-color)] font-bold text-[11px] text-[var(--text-secondary)]">
                            {biz.category}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-[var(--text-primary)]">{biz.governorate}</div>
                          <div className="text-[10.5px] text-[var(--text-muted)] truncate max-w-[140px]">{biz.city}</div>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                              isVerified
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            }`}
                          >
                            <span>{isVerified ? '✓ معتمد بالدليل' : '⏳ قيد المراجعة'}</span>
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-black text-[var(--text-primary)] font-mono">
                            {isExempt ? (
                              <span className="text-teal-600 dark:text-teal-400 text-[11px]">مجاني (0 ج)</span>
                            ) : (
                              <span>{biz.packagePrice || 250} ج.م</span>
                            )}
                          </div>
                          <div className="text-[10px] font-bold mt-0.5">
                            {isExempt ? (
                              <span className="text-teal-600 dark:text-teal-400">إدراج ترويجي</span>
                            ) : remaining === 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">مسدد بالكامل ✓</span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 font-mono">متبقي {remaining} ج</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-[var(--text-secondary)] truncate max-w-[130px]">
                            {biz.repName || 'مندوب ميداني'}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--text-muted)]">
                            {formatActivityDateTime(biz.createdDate || biz.invoiceDate)}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onEditBusiness(biz)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-colors cursor-pointer flex items-center gap-1"
                              title="عرض وتعديل النشاط"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>عرض</span>
                            </button>

                            {biz.googleMapsUrl && biz.googleMapsUrl.trim().startsWith('http') && !biz.googleMapsUrl.includes('search/?api=1&query=') ? (
                              <a
                                href={biz.googleMapsUrl.trim()}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25 border border-blue-500/30 transition-transform active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs"
                                title="فتح موقع النشاط المعتمد على خرائط Google 🗺️"
                              >
                                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                              </a>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="p-1.5 rounded-xl bg-[var(--input-bg)] text-slate-400 border border-[var(--border-color)] opacity-40 cursor-not-allowed flex items-center justify-center"
                                title="الخريطة غير مفعلة - لم يتم إضافة وتوثيق رابط Google بعد"
                              >
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                            )}

                            <button
                              onClick={() => onShowInvoice(biz)}
                              className="p-1.5 rounded-xl bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-amber-500 border border-[var(--border-color)] transition-colors cursor-pointer"
                              title="عرض الفاتورة"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-500" />
                            </button>
                            {ownerPhone && (
                              <a
                                href={`https://wa.me/2${ownerPhone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
                                title="مراسلة واتساب"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {ownerPhone && (
                              <a
                                href={`tel:${ownerPhone}`}
                                className="p-1.5 rounded-xl bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border border-blue-500/30 transition-colors"
                                title="اتصال هاتفي"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
