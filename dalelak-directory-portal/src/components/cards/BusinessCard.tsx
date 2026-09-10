import React from 'react';
import { Business } from '../../types';
import {
  calculateDistanceKm,
  formatDistanceString,
  getBusinessOpenStatus,
  getBusinessMapDetails,
  getSmartWhatsAppUrl,
} from '../../utils/directoryEnhancements';
import {
  ShieldCheck,
  Heart,
  Star,
  Clock,
  Compass,
  Navigation,
  MessageCircle,
  Phone,
  MapPin,
  Play,
} from 'lucide-react';

export interface BusinessCardProps {
  business: Business;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  userCoords: { lat: number; lng: number } | null;
  onOpenVideoModal?: (biz: Business) => void;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  onOpenBusiness,
  onToggleFavorite,
  isFavorite,
  userCoords,
  onOpenVideoModal,
}) => {
  const mainPhoto =
    business.coverPhoto ||
    (business.photos && business.photos.length > 0
      ? business.photos[0]
      : `/api/biz-og?biz=${business.id}&v=${encodeURIComponent(business.createdDate || business.createdAt || '')}`);

  const openStatus = getBusinessOpenStatus(business.workingHours);
  const distanceKm = userCoords ? calculateDistanceKm(userCoords.lat, userCoords.lng, business.lat, business.lng) : null;
  const { effectiveUrl, isOfficial } = getBusinessMapDetails(business);
  const smartWhatsAppUrl = getSmartWhatsAppUrl(business);

  return (
    <div
      onClick={() => onOpenBusiness(business)}
      className="group bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-amber-400/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between hover:-translate-y-0.5 cursor-pointer"
    >
      {/* 1. Visual Anchor: 4:3 Photo with restrained overlays */}
      <div className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden">
        <img
          src={mainPhoto}
          alt={business.nameAr}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

        {/* Top-Right: Official Verification Shield */}
        <div className="absolute top-3 right-3 z-10">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-xs backdrop-blur-md"
            title="منشأة معتمدة في دليلك"
          >
            <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>موثق</span>
          </span>
        </div>

        {/* Top-Left: Open / Closed Status Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md border shadow-xs ${openStatus.statusClass}`}
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
            onToggleFavorite(business.id);
          }}
          className={`absolute bottom-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-md ${
            isFavorite
              ? 'bg-rose-600 text-white scale-110 shadow-rose-600/50'
              : 'bg-slate-950/60 text-white/80 hover:text-white hover:bg-slate-950 hover:scale-105'
          }`}
          title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          aria-label="المفضلة"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Center (Inside Photo): Video Play Button Overlay */}
        {business.videos && business.videos.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenVideoModal) {
                  onOpenVideoModal(business);
                } else {
                  onOpenBusiness(business);
                }
              }}
              className="pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-950/65 hover:bg-amber-500 text-white hover:text-slate-950 border-2 border-white/90 hover:border-amber-400 backdrop-blur-md shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 group/play cursor-pointer"
              title="مشاهدة الفيديو التعريفي"
              aria-label={`مشاهدة الفيديو التعريفي لـ ${business.nameAr}`}
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current translate-x-[-1px] group-hover/play:scale-110 transition-transform" />
            </button>
          </div>
        )}

        {/* Bottom-Left (Inside Photo): Distance indicator */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5">
          {distanceKm !== null && (
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-900/60 text-amber-300 border border-amber-500/30 backdrop-blur-md shadow-xs">
              <Compass className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{formatDistanceString(distanceKm)}</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Business Decision Summary */}
      <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Category & Region */}
          <div className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--text-muted)]">
            <span className="text-amber-700 font-extrabold truncate">
              {business.category}
            </span>
            <span className="truncate text-[11px] font-medium text-slate-500">
              {[business.city || business.street, business.governorate].filter(Boolean).join(' • ') || 'مصر'}
            </span>
          </div>

          {/* Business Name */}
          <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)] leading-snug line-clamp-2 group-hover:text-amber-600 transition-colors">
            {business.nameAr}
          </h3>

          {/* Hours & Rating */}
          <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-bold">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)] min-w-0">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">
                {business.workingHours
                  ? business.workingHours
                  : openStatus.isOpen
                  ? 'مفتوح لاستقبال الزوار'
                  : 'مغلق حالياً'}
              </span>
            </div>

            {business.googleRatingEnabled && business.googleRating && business.googleRating > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-amber-600 font-black shrink-0 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{business.googleRating.toFixed(1)}</span>
                {business.googleReviewsCount !== undefined && (
                  <span className="text-[10px] text-slate-500 font-normal">({business.googleReviewsCount})</span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* 3. Action Trio (اتجاهات | واتساب | اتصال) */}
        <div className="pt-3 border-t border-[var(--border-color)] grid grid-cols-3 gap-1.5">
          {/* Directions */}
          {effectiveUrl ? (
            <a
              href={effectiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200"
              title={isOfficial ? 'فتح خرائط Google' : 'الموقع على الخريطة'}
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>اتجاهات</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenBusiness(business);
              }}
              className="py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 bg-slate-50 text-[var(--text-muted)] border border-slate-200"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>الموقع</span>
            </button>
          )}

          {/* WhatsApp */}
          {business.phone ? (
            <a
              href={smartWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="py-2 px-1 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
              title="محادثة واتساب مباشرة"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>واتساب</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="py-2 px-1 rounded-xl text-xs bg-slate-50 text-[var(--text-muted)] border border-slate-200 font-bold flex items-center justify-center gap-1 opacity-50 cursor-not-allowed"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>واتساب</span>
            </button>
          )}

          {/* Call */}
          {business.phone ? (
            <a
              href={`tel:${business.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="py-2 px-1 rounded-xl text-xs font-bold bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-200 flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
              title="اتصال هاتفي فوري"
            >
              <Phone className="w-3.5 h-3.5 text-slate-600" />
              <span>اتصال</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="py-2 px-1 rounded-xl text-xs bg-slate-50 text-[var(--text-muted)] border border-slate-200 font-bold flex items-center justify-center gap-1 opacity-50 cursor-not-allowed"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>اتصال</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
