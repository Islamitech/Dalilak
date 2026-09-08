import React from 'react';
import { Business } from '../../types';
import { InteractiveMap } from '../InteractiveMap';
import { PhotoWatermarkBadge } from '../PhotoWatermarkBadge';
import {
  calculateDistanceKm,
  formatDistanceString,
  getBusinessOpenStatus,
  getBusinessMapDetails,
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
                    <div className="h-56 bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900" />
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

          {/* Empty State - Filter No Results */}
          {!loading && businesses.length > 0 && filteredBusinesses.length === 0 && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="font-black text-base text-[var(--text-primary)]">لا توجد نتائج مطابقة</h3>
              <p className="text-xs text-[var(--text-muted)] font-bold">جرب تغيير خيارات الفلترة أو اختيار محافظة أخرى</p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-xl border border-amber-500/30 cursor-pointer transition-colors"
              >
                إعادة ضبط خيارات البحث
              </button>
            </div>
          )}

          {/* 🃏 BUSINESSES GRID */}
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
                const hasPhotos = biz.photos && biz.photos.length > 0;
                const hasVideos = biz.videos && biz.videos.length > 0;

                return (
                  <div
                    key={biz.id}
                    className="group bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-amber-500/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
                    style={{ animationDelay: `${idx * 60}ms`, animation: 'fadeInUp 0.4s ease-out both' }}
                  >
                    {/* Photo Banner */}
                    <div
                      className="relative h-56 bg-slate-950 overflow-hidden cursor-pointer"
                      onClick={() => handleOpenBusiness(biz)}
                    >
                      <img
                        src={mainPhoto}
                        alt={biz.nameAr}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent" />

                      {/* Top-right: Favorite */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(biz.id);
                        }}
                        className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-md ${
                          isFav
                            ? 'bg-rose-600 text-white scale-110 shadow-rose-600/50'
                            : 'bg-slate-950/60 text-white/80 hover:text-white hover:bg-slate-950/80 hover:scale-105'
                        }`}
                        title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      {/* Top-left: Status + Distance + Watermark */}
                      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full backdrop-blur-md border shadow-md ${openStatus.statusClass}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${openStatus.dotColor} ${
                              openStatus.isOpen ? 'animate-ping' : ''
                            }`}
                          />
                          <span>{openStatus.badgeText}</span>
                        </span>

                        {distanceKm !== null && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-950/80 text-amber-300 border border-amber-500/30 backdrop-blur-md shadow-md">
                            <Compass className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{formatDistanceString(distanceKm)}</span>
                          </span>
                        )}

                        <PhotoWatermarkBadge position="top-left" size="sm" className="!relative !top-auto !left-auto" />
                      </div>

                      {/* Photo count badge */}
                      {hasPhotos && biz.photos!.length > 1 && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-950/70 text-white border border-white/20 backdrop-blur-md">
                            <ImageIcon className="w-2.5 h-2.5" />
                            {biz.photos!.length}
                          </span>
                        </div>
                      )}

                      {/* Video Play Button */}
                      {hasVideos && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVideoBiz(biz);
                          }}
                          className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-amber-500 hover:bg-yellow-400 text-slate-950 flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 z-10 cursor-pointer border-2 border-white/80"
                          title="تشغيل فيديو المكان"
                        >
                          <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                        </button>
                      )}

                      {/* Bottom: Category + Name + Google Rating */}
                      <div
                        className="absolute bottom-3 right-3 left-3 space-y-1"
                        onClick={() => handleOpenBusiness(biz)}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-block bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-md">
                            {biz.category}
                          </span>
                          {biz.googleRatingEnabled && biz.googleRating && (
                            <span className="inline-flex items-center gap-1 bg-slate-950/85 border border-amber-400/40 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-md shadow-xs">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{biz.googleRating.toFixed(1)}</span>
                              {biz.googleReviewsCount !== undefined && (
                                <span className="text-[9px] opacity-75">({biz.googleReviewsCount})</span>
                              )}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-black text-white leading-tight truncate drop-shadow-md">
                          {biz.nameAr}
                        </h3>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between text-xs">
                      <div className="space-y-2">
                        {/* Working Hours */}
                        {biz.workingHours && (
                          <div className="flex items-center gap-2 text-[var(--text-muted)] text-[11px] font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate">{biz.workingHours}</span>
                          </div>
                        )}
                        {/* Address */}
                        {(biz.city || biz.street) && (
                          <div className="flex items-center gap-2 text-[var(--text-muted)] text-[11px] font-bold">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{[biz.city, biz.governorate].filter(Boolean).join('، ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-[var(--border-color)] flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenBusiness(biz)}
                          className="flex-1 bg-amber-500 hover:bg-yellow-400 text-slate-950 font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center shadow-xs hover:shadow-amber-500/30 hover:shadow-md active:scale-95"
                        >
                          {hasVideos ? 'التفاصيل والفيديو' : 'التفاصيل والصور'}
                        </button>

                        {biz.phone && (
                          <a
                            href={`tel:${biz.phone}`}
                            className="w-9 h-9 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs border border-emerald-500/30"
                            title="اتصال هاتفياً"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}

                        {(() => {
                          const { effectiveUrl, isOfficial } = getBusinessMapDetails(biz);
                          if (!effectiveUrl) return null;
                          return (
                            <a
                              href={effectiveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs border ${
                                isOfficial
                                  ? 'bg-blue-500/15 hover:bg-blue-600 text-blue-600 hover:text-white border-blue-500/30'
                                  : 'bg-emerald-500/15 hover:bg-emerald-600 text-emerald-600 hover:text-white border-emerald-500/30'
                              }`}
                              title={isOfficial ? 'فتح على خرائط Google' : 'الموقع الجغرافي الميداني للمكان على الخريطة'}
                            >
                              {isOfficial ? <Navigation className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                            </a>
                          );
                        })()}

                        <button
                          type="button"
                          onClick={(e) => handleShareBusiness(biz, e)}
                          className="w-9 h-9 rounded-xl bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-muted)] flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs border border-[var(--border-color)]"
                          title="مشاركة رابط المنشأة"
                        >
                          {copiedBizId === biz.id ? (
                            <CheckCheck className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
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
