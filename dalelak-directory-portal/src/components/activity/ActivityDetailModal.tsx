import React, { useState } from 'react';
import { Business } from '../../types';
import {
  getBusinessMapDetails,
  getBusinessOpenStatus,
  getSmartWhatsAppUrl,
  downloadBusinessVCard,
} from '../../utils/directoryEnhancements';
import { PhotoWatermarkBadge } from '../PhotoWatermarkBadge';
import {
  X,
  ShieldCheck,
  Star,
  Clock,
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  Share2,
  Heart,
  CheckCheck,
  UserPlus,
  Play,
  Maximize,
  ExternalLink,
  Store,
  AlertTriangle,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ShowcasePhotoLightbox } from '../showcase/ShowcasePhotoLightbox';

export interface ActivityDetailModalProps {
  business: Business | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenVideoModal?: (biz: Business) => void;
  allBusinesses?: Business[];
  onSelectBusiness?: (biz: Business) => void;
  onNavigateToBusinessClaim?: (biz: Business) => void;
}

export const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  business,
  onClose,
  isFavorite,
  onToggleFavorite,
  onOpenVideoModal,
  allBusinesses = [],
  onSelectBusiness,
  onNavigateToBusinessClaim,
}) => {
  const [copied, setCopied] = useState(false);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [vCardSaved, setVCardSaved] = useState(false);

  if (!business) return null;

  // Handle Suspended / Rejected businesses (Institutional Safety)
  if (business.verificationStatus === 'rejected') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white border border-rose-200 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="font-black text-base text-slate-900">هذا النشاط غير متاح حالياً</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            تم تعليق صفحة هذا النشاط بناءً على المراجعة الإدارية لمنظومة «دليلك».
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
          >
            العودة للدليل
          </button>
        </div>
      </div>
    );
  }

  const { effectiveUrl, isOfficial } = getBusinessMapDetails(business);
  const smartWhatsAppUrl = getSmartWhatsAppUrl(business);
  const openStatus = getBusinessOpenStatus(business.workingHours);

  const photos = business.photos && business.photos.length > 0
    ? business.photos
    : business.coverPhoto
    ? [business.coverPhoto]
    : [];

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/biz/${business.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleSaveContact = () => {
    downloadBusinessVCard(business);
    setVCardSaved(true);
    setTimeout(() => setVCardSaved(false), 3000);
  };

  // Similar activities in same category or city
  const similarPlaces = allBusinesses
    .filter((b) => b.id !== business.id && (b.category === business.category || b.city === business.city))
    .slice(0, 3);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col text-right shadow-2xl overflow-hidden my-auto animate-fade-in-scale"
        style={{ direction: 'rtl' }}
      >
        {/* Modal Top Bar */}
        <div className="p-3.5 sm:p-4 border-b border-[var(--border-color)] flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1 text-[10.5px] font-black px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>معتمد</span>
            </span>
            <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)] truncate">
              {business.nameAr}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="مشاركة رابط النشاط"
            >
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'تم النسخ!' : 'مشاركة'}</span>
            </button>

            {/* Favorite */}
            <button
              type="button"
              onClick={() => onToggleFavorite(business.id)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                isFavorite
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-rose-600'
              }`}
              title={isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-rose-600' : ''}`} />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(92vh-130px)] text-xs">
          {/* Main Visual Photo & Gallery */}
          <div className="space-y-3">
            <div
              onClick={() => {
                if (photos.length > 0) setPreviewPhotoIndex(0);
              }}
              onContextMenu={(e) => e.preventDefault()}
              className="relative h-56 sm:h-64 rounded-2xl overflow-hidden bg-slate-950 shadow-md group cursor-pointer select-none protected-asset-shield"
            >
              <img
                src={photos[0] || `/api/biz-og?biz=${business.id}`}
                alt=""
                role="presentation"
                aria-hidden="true"
                data-reader-skip="true"
                data-readability-ignore="true"
                draggable={false}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
              />
              {/* Anti-Extraction Transparent Protection Shield */}
              <div 
                className="absolute inset-0 z-[5] select-none pointer-events-auto"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

              <div className="absolute top-3 right-3 left-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900/60 backdrop-blur-md text-amber-300 text-[11px] font-black px-3 py-1 rounded-full border border-amber-400/30">
                    {business.category}
                  </span>
                  <PhotoWatermarkBadge position="top-right" size="sm" className="!relative !top-auto !right-auto" />
                </div>

                {business.videos && business.videos.length > 0 && onOpenVideoModal && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenVideoModal(business);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md transition-transform cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>فيديو تعريفي</span>
                  </button>
                )}
              </div>

              <div className="absolute bottom-3.5 right-4 left-4 text-white space-y-1 z-10">
                <h2 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-md">
                  {business.nameAr}
                </h2>
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-300 font-bold">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{[business.city, business.governorate].filter(Boolean).join('، ')}</span>
                  </span>

                  {business.googleRatingEnabled && business.googleRating && (
                    <span className="inline-flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded-lg border border-amber-400/40 text-amber-300 font-mono font-black">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{business.googleRating.toFixed(1)}</span>
                      {business.googleReviewsCount !== undefined && (
                        <span className="text-[10px] text-slate-300 font-normal">({business.googleReviewsCount} تقييم)</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Thumbnails */}
            {photos.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {photos.map((ph, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPreviewPhotoIndex(idx)}
                    onContextMenu={(e) => e.preventDefault()}
                    className="relative h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-200 hover:border-amber-500 transition-all cursor-pointer group select-none"
                  >
                    <img 
                      src={ph} 
                      alt="" 
                      role="presentation"
                      aria-hidden="true"
                      draggable={false}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform pointer-events-none select-none" 
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Primary Quick Actions Trio */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {business.phone ? (
              <a
                href={`tel:${business.phone}`}
                className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs py-3 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-xs transition-all text-center"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>اتصال مباشر</span>
              </a>
            ) : (
              <button disabled className="opacity-50 bg-slate-100 text-slate-400 font-bold text-xs py-3 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5">
                <Phone className="w-4 h-4" />
                <span>لا يوجد هاتف</span>
              </button>
            )}

            <a
              href={smartWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 active:scale-95 font-black text-xs py-3 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-xs transition-all text-center"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>محادثة واتساب</span>
            </a>

            {effectiveUrl ? (
              <a
                href={effectiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 active:scale-95 font-black text-xs py-3 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-xs transition-all text-center"
              >
                <Navigation className="w-4 h-4 text-blue-600 shrink-0" />
                <span>الاتجاهات</span>
              </a>
            ) : (
              <button disabled className="opacity-50 bg-slate-100 text-slate-400 font-bold text-xs py-3 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5">
                <Navigation className="w-4 h-4" />
                <span>لا يوجد موقع</span>
              </button>
            )}
          </div>

          {/* Business Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Hours */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">ساعات العمل:</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${openStatus.statusClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${openStatus.dotColor}`} />
                    <span>{openStatus.badgeText}</span>
                  </span>
                </div>
                <p className="font-black text-slate-800">
                  {business.workingHours || 'يومياً على مدار الساعة'}
                </p>
              </div>
            </div>

            {/* Address */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="space-y-1 flex-1">
                <span className="text-[11px] font-bold text-slate-500 block">العنوان الدقيق:</span>
                <p className="font-black text-slate-800 leading-snug">
                  {[business.street, business.landmark ? `(بجوار ${business.landmark})` : '', business.city, business.governorate].filter(Boolean).join('، ')}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {business.description && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[11px] text-amber-700 font-black block">نبذة عن المكان والخدمات:</span>
              <p className={`text-slate-700 leading-relaxed font-medium ${!isDescExpanded && business.description.length > 200 ? 'line-clamp-3' : ''}`}>
                {business.description}
              </p>
              {business.description.length > 200 && (
                <button
                  type="button"
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="text-amber-600 hover:text-amber-700 font-bold text-xs pt-1 cursor-pointer"
                >
                  {isDescExpanded ? 'عرض أقل ▴' : 'عرض المزيد ▾'}
                </button>
              )}
            </div>
          )}

          {/* Google Reviews Breakdown Widget */}
          {business.googleRatingEnabled && business.googleRating && business.googleRating > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span className="font-black text-slate-900">تقييمات زوار المكان على Google Maps</span>
                </div>
                {effectiveUrl && (
                  <a
                    href={effectiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] flex items-center gap-1"
                  >
                    <span>فتح المراجعات على الخريطة</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center shrink-0">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono">
                    {business.googleRating.toFixed(1)}
                  </span>
                  <div className="flex items-center gap-0.5 justify-center pt-1" dir="ltr">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= Math.floor(business.googleRating || 0)
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold block pt-0.5">
                    ({business.googleReviewsCount || 0} تقييم موثق)
                  </span>
                </div>

                <div className="flex-1 text-[11px] text-slate-600 font-medium leading-relaxed border-r border-slate-200 pr-4">
                  هذا التقييم صادر من عملاء وزوار حقيقيين على خرائط Google الرسمية ومربوط مباشرة بحساب النشاط المعتمد.
                </div>
              </div>
            </div>
          )}

          {/* Similar Places */}
          {similarPlaces.length > 0 && (
            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              <h4 className="font-black text-slate-900 text-xs">أنشطة مشابهة في نفس المنطقة</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {similarPlaces.map((sim) => (
                  <button
                    key={sim.id}
                    type="button"
                    onClick={() => {
                      if (onSelectBusiness) onSelectBusiness(sim);
                    }}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 text-right flex items-center gap-2.5 transition-all cursor-pointer"
                  >
                    <img
                      src={sim.coverPhoto || (sim.photos && sim.photos[0]) || `/api/biz-og?biz=${sim.id}`}
                      alt={sim.nameAr}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 text-xs truncate">{sim.nameAr}</p>
                      <p className="text-[10px] text-slate-500 truncate">{sim.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Discreet Claim & Report Footer */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 font-bold">
            <button
              type="button"
              onClick={() => {
                if (onNavigateToBusinessClaim) onNavigateToBusinessClaim(business);
                else {
                  window.open(
                    `https://wa.me/201143888355?text=${encodeURIComponent(
                      `مرحباً دليلك 👋 أنا صاحب منشأة "${business.nameAr}" وأود إدارة وتحديث بياناتها.`
                    )}`,
                    '_blank'
                  );
                }
              }}
              className="text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span>هل أنت صاحب هذا النشاط؟ اطلب إدارته وتحديثه</span>
            </button>

            <a
              href={`https://wa.me/201143888355?text=${encodeURIComponent(
                `إبلاغ عن بيانات: منشأة "${business.nameAr}" (كود: ${business.id})`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>إبلاغ عن خطأ</span>
            </a>
          </div>
        </div>

        {/* Modal Bottom Sticky Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleSaveContact}
            className={`flex-1 text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 font-black transition-all cursor-pointer border ${
              vCardSaved
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <UserPlus className="w-4 h-4 text-slate-600" />
            <span>{vCardSaved ? 'تم حفظ جهة الاتصال' : 'حفظ جهة الاتصال'}</span>
          </button>

          {effectiveUrl && (
            <a
              href={effectiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all text-center"
            >
              <Navigation className="w-4 h-4" />
              <span>الموقع على الخريطة</span>
            </a>
          )}
        </div>
      </div>

      {/* Lightbox for photo inspection */}
      <ShowcasePhotoLightbox
        photos={photos}
        previewPhotoIndex={previewPhotoIndex}
        setPreviewPhotoIndex={setPreviewPhotoIndex}
        handlePrevPhoto={() => {
          if (photos.length === 0) return;
          setPreviewPhotoIndex((prev) => (prev === null ? 0 : (prev - 1 + photos.length) % photos.length));
        }}
        handleNextPhoto={() => {
          if (photos.length === 0) return;
          setPreviewPhotoIndex((prev) => (prev === null ? 0 : (prev + 1) % photos.length));
        }}
      />
    </div>
  );
};
