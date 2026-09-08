import React from 'react';
import { Business } from '../../types';
import { InteractiveMap } from '../InteractiveMap';
import { PhotoWatermarkBadge } from '../PhotoWatermarkBadge';
import {
  calculateDistanceKm,
  formatDistanceString,
  getBusinessOpenStatus,
  getBusinessMapDetails,
  getSmartWhatsAppUrl,
} from '../../utils/directoryEnhancements';
import {
  Layers,
  Map as MapIcon,
  Compass,
  Search,
  Award,
  Heart,
  Image as ImageIcon,
  Play,
  Star,
  Clock,
  MapPin,
  Phone,
  Navigation,
  CheckCheck,
  Share2,
  ShieldCheck,
  MessageCircle,
  UtensilsCrossed,
  Wrench,
  Sparkles,
} from 'lucide-react';

export interface ShowcaseCardGridProps {
  filteredBusinesses: Business[];
  businesses: Business[];
  activeView: 'grid' | 'map';
  setActiveView: (view: 'grid' | 'map') => void;
  loading?: boolean;
  initialBizId?: string;
  handleOpenBusiness: (biz: Business) => void;
  toggleFavorite: (id: string) => void;
  favorites: string[];
  userCoords: { lat: number; lng: number } | null;
  handleShareBusiness: (biz: Business, e: React.MouseEvent) => void;
  copiedBizId: string | null;
  setSelectedVideoBiz: (biz: Business | null) => void;
  resetAllFilters: () => void;
  categoryFilter?: string;
  setCategoryFilter?: (c: string) => void;
  sortBy?: string;
  setSortBy?: (s: 'default' | 'nearest' | 'newest' | 'has_video' | 'open_now' | 'alpha') => void;
  handleRequestLocation?: () => void;
}

export const ShowcaseCardGrid: React.FC<ShowcaseCardGridProps> = ({
  filteredBusinesses,
  businesses,
  activeView,
  setActiveView,
  loading = false,
  initialBizId,
  handleOpenBusiness,
  toggleFavorite,
  favorites,
  userCoords,
  handleShareBusiness,
  copiedBizId,
  setSelectedVideoBiz,
  resetAllFilters,
  categoryFilter,
  setCategoryFilter,
  sortBy,
  setSortBy,
  handleRequestLocation,
}) => {
  return (
    <section id="explore" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Section Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" />
            <span>الأنشطة والخدمات المتاحة</span>
            {filteredBusinesses.length > 0 && (
              <span className="text-xs font-mono bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                {filteredBusinesses.length}
              </span>
            )}
          </h2>
          <p className="text-xs text-[var(--text-muted)] font-bold mt-0.5">
            تصفح الأنشطة الميدانية الموثقة مع بيانات الاتصال ومقاطع الفيديو والعناوين الدقيقة
          </p>
        </div>

        {/* Grid / Map Mode Switcher */}
        <div className="flex items-center gap-1 bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--border-color)] shadow-xs">
          <button
            type="button"
            onClick={() => setActiveView('grid')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeView === 'grid'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>عرض الشبكة</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('map')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              activeView === 'map'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>الخريطة المباشرة</span>
          </button>
        </div>
      </div>

      {/* MAP VIEW */}
      {activeView === 'map' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-3 shadow-lg animate-fade-in">
          <InteractiveMap
            businesses={filteredBusinesses}
            mode="view"
            onSelectBusiness={(b) => handleOpenBusiness(b)}
            heightClass="h-[500px] sm:h-[600px]"
          />
        </div>
      )}

      {/* GRID VIEW */}
      {activeView === 'grid' && (
        <div className="space-y-6">
          {/* 🧭 Smart Discovery Rail (أقسام الاستكشاف الذكية السريعة) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-black select-none">
            <button
              type="button"
              onClick={() => {
                if (setCategoryFilter) setCategoryFilter('all');
                if (setSortBy) setSortBy('default');
              }}
              className={`px-4 py-2.5 rounded-2xl shrink-0 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 ${
                (!categoryFilter || categoryFilter === 'all') && (!sortBy || sortBy === 'default')
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>كل الأنشطة</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!userCoords && handleRequestLocation) handleRequestLocation();
                if (setSortBy) setSortBy('nearest');
              }}
              className={`px-4 py-2.5 rounded-2xl shrink-0 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 ${
                sortBy === 'nearest'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>الأقرب إليك</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (setSortBy) setSortBy('open_now');
              }}
              className={`px-4 py-2.5 rounded-2xl shrink-0 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 ${
                sortBy === 'open_now'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>مفتوح الآن</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (setSortBy) setSortBy('newest');
              }}
              className={`px-4 py-2.5 rounded-2xl shrink-0 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 ${
                sortBy === 'newest'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>جديد في منطقتك</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (setCategoryFilter) setCategoryFilter('طبي');
              }}
              className={`px-4 py-2.5 rounded-2xl shrink-0 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 ${
                categoryFilter?.includes('طبي') || categoryFilter?.includes('صيدل')
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 font-black'
                  : 'bg-[var(--input-bg)] text-rose-500 hover:bg-rose-500/10 border border-rose-500/30'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>خدمات الطوارئ والطب</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (setCategoryFilter) setCategoryFilter('مطاعم ومأكولات');
              }}
              className={`px-4 py-2.5 rounded-2xl shrink-0 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 ${
                categoryFilter === 'مطاعم ومأكولات'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>طعام ومطاعم</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (setCategoryFilter) setCategoryFilter('سيارات وصيانة');
              }}
              className={`px-4 py-2.5 rounded-2xl shrink-0 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95 ${
                categoryFilter === 'سيارات وصيانة'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>سيارات وخدمات</span>
            </button>
          </div>

          {/* Loading Shimmer */}
          {loading && businesses.length === 0 && (
            <div className="space-y-6 animate-fade-in py-2">
              <div className="py-6 flex flex-col items-center justify-center space-y-3">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                  <div
                    className="w-11 h-11 rounded-full border-4 border-emerald-500/20 border-b-emerald-500 animate-spin absolute"
                    style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}
                  />
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center absolute text-xs">
                    <Compass className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs sm:text-sm font-black text-[var(--text-primary)] animate-pulse">
                    {initialBizId ? 'جاري فتح وتجهيز بيانات المكان المطلوب...' : 'جاري تحميل الأماكن المعتمدة...'}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] font-bold">
                    يرجى الانتظار لحظات جاري استرجاع البيانات الموثقة...
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={`skel-${i}`}
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-xs flex flex-col animate-pulse"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900" />
                    <div className="p-4 space-y-3">
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
                      </div>
                      <div className="pt-3 border-t border-[var(--border-color)] flex items-center gap-2">
                        <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl flex-1" />
                        <div className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State - DB Empty */}
          {!loading && businesses.length === 0 && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="font-black text-base text-[var(--text-primary)]">لا توجد منشآت أو محلات مسجلة حالياً</h3>
              <p className="text-xs text-[var(--text-muted)] font-bold">سيتم إدراج الأماكن فور اعتمادها ونشرها من إدارة المنظومة</p>
              <a
                href="#packages"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-yellow-400 text-slate-950 font-black text-xs px-6 py-3 rounded-2xl transition-all shadow-md"
              >
                <Award className="w-4 h-4" />
                سجّل مكانك الآن
              </a>
            </div>
          )}

          {/* Actionable Zero-State - Filter No Results */}
          {!loading && businesses.length > 0 && filteredBusinesses.length === 0 && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-sm max-w-xl mx-auto animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="font-black text-base text-[var(--text-primary)]">
                لم نجد نشاطاً مطابقاً لخيارات البحث
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-medium max-w-md mx-auto leading-relaxed">
                جرّب تغيير خيارات البحث، أو إعادة ضبط الفلاتر لتوسيع النطاق. وإذا كنت صاحب هذا النشاط أو ترغب في إدراجه، يمكنك طلبه الآن مجاناً.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2.5 rounded-xl border border-amber-500/30 cursor-pointer transition-colors"
                >
                  إعادة ضبط خيارات البحث
                </button>
                <a
                  href="#free-listing"
                  className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>اطلب إضافة نشاطك مجاناً (0 ج)</span>
                </a>
              </div>
            </div>
          )}

          {/* 🃏 3-TIER BUSINESSES GRID (البطاقة الموحدة ثلاثية الطبقات) */}
          {filteredBusinesses.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((biz, idx) => {
                const mainPhoto =
                  biz.coverPhoto ||
                  (biz.photos && biz.photos.length > 0
                    ? biz.photos[0]
                    : `/api/biz-og?biz=${biz.id}&v=${encodeURIComponent(biz.createdDate || biz.createdAt || '')}`);

                const openStatus = getBusinessOpenStatus(biz.workingHours);
                const isFav = favorites.includes(biz.id);
                const distanceKm = userCoords ? calculateDistanceKm(userCoords.lat, userCoords.lng, biz.lat, biz.lng) : null;
                const { effectiveUrl, isOfficial } = getBusinessMapDetails(biz);
                const smartWhatsAppUrl = getSmartWhatsAppUrl(biz);

                return (
                  <div
                    key={biz.id}
                    className="group bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-amber-500/50 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
                    style={{ animationDelay: `${idx * 40}ms`, animation: 'fadeInUp 0.35s ease-out both' }}
                  >
                    {/* Layer 1: Pure 4:3 Image with strict max 3 overlays */}
                    <div
                      className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden cursor-pointer"
                      onClick={() => handleOpenBusiness(biz)}
                    >
                      <img
                        src={mainPhoto}
                        alt={biz.nameAr}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      {/* Soft bottom gradient only */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent pointer-events-none" />

                      {/* Top-Right: Official Verification Shield */}
                      <div className="absolute top-3 right-3 z-10">
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 shadow-md backdrop-blur-md border border-amber-400 font-sans"
                          title="منشأة معتمدة وموثقة في دليلك"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                          <span>موثق</span>
                        </span>
                      </div>

                      {/* Top-Left: Open / Closed Status Badge */}
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md border shadow-md ${openStatus.statusClass}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${openStatus.dotColor} ${
                              openStatus.isOpen ? 'animate-ping' : ''
                            }`}
                          />
                          <span>{openStatus.isOpen ? 'مفتوح الآن' : 'مغلق حالياً'}</span>
                        </span>
                      </div>

                      {/* Bottom-Right (Inside Photo): Favorite Heart */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(biz.id);
                        }}
                        className={`absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-md ${
                          isFav
                            ? 'bg-rose-600 text-white scale-110 shadow-rose-600/50'
                            : 'bg-slate-950/70 text-white/80 hover:text-white hover:bg-slate-950 hover:scale-105'
                        }`}
                        title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                        aria-label="المفضلة"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      {/* Bottom-Left (Inside Photo): GPS Distance if available */}
                      {distanceKm !== null && (
                        <div className="absolute bottom-3 left-3 z-10">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-950/80 text-amber-300 border border-amber-500/30 backdrop-blur-md shadow-xs">
                            <Compass className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{formatDistanceString(distanceKm)}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Layer 2: Business Decision Summary (Below photo) */}
                    <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div
                        className="space-y-1.5 cursor-pointer"
                        onClick={() => handleOpenBusiness(biz)}
                      >
                        {/* Category & Region */}
                        <div className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--text-muted)]">
                          <span className="text-amber-600 dark:text-amber-400 font-extrabold truncate">
                            {biz.category}
                          </span>
                          <span className="truncate text-[11px] font-medium text-[var(--text-muted)]">
                            {[biz.city || biz.street, biz.governorate].filter(Boolean).join(' • ') || 'مصر'}
                          </span>
                        </div>

                        {/* Business Name */}
                        <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)] leading-snug line-clamp-2 hover:text-amber-500 transition-colors">
                          {biz.nameAr}
                        </h3>

                        {/* Hours & Rating */}
                        <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-bold">
                          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate">
                              {biz.workingHours
                                ? biz.workingHours
                                : openStatus.isOpen
                                ? 'مفتوح لاستقبال العملاء'
                                : 'مغلق حالياً'}
                            </span>
                          </div>

                          {biz.googleRatingEnabled && biz.googleRating && biz.googleRating > 0 && (
                            <span className="inline-flex items-center gap-1 font-mono text-amber-500 font-black shrink-0 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{biz.googleRating.toFixed(1)}</span>
                              {biz.googleReviewsCount !== undefined && (
                                <span className="text-[10px] text-[var(--text-muted)] font-normal">({biz.googleReviewsCount})</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Layer 3: Fixed Action Bar */}
                      <div className="pt-3 border-t border-[var(--border-color)] flex items-center gap-2">
                        {/* Call */}
                        {biz.phone && (
                          <a
                            href={`tel:${biz.phone}`}
                            className="w-10 h-10 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs border border-emerald-500/30 active:scale-95"
                            title="اتصال هاتفي مباشر"
                            aria-label="اتصال هاتفياً"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}

                        {/* WhatsApp */}
                        {biz.phone && (
                          <a
                            href={smartWhatsAppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 text-emerald-600 hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs border border-emerald-600/30 active:scale-95"
                            title="محادثة واتساب مباشرة"
                            aria-label="واتساب"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}

                        {/* Navigation */}
                        {effectiveUrl && (
                          <a
                            href={effectiveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs border active:scale-95 ${
                              isOfficial
                                ? 'bg-blue-500/15 hover:bg-blue-600 text-blue-600 hover:text-white border-blue-500/30'
                                : 'bg-emerald-500/15 hover:bg-emerald-600 text-emerald-600 hover:text-white border-emerald-500/30'
                            }`}
                            title={isOfficial ? 'فتح على خرائط Google' : 'الموقع الجغرافي للمكان على الخريطة'}
                            aria-label="الموقع على الخريطة"
                          >
                            {isOfficial ? <Navigation className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                          </a>
                        )}

                        {/* Primary CTA */}
                        <button
                          type="button"
                          onClick={() => handleOpenBusiness(biz)}
                          className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer text-center shadow-xs hover:shadow-amber-500/20 active:scale-95 truncate"
                        >
                          التفاصيل والتواصل
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
