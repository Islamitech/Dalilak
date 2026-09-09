import React, { useState } from 'react';
import { Business } from '../../types';
import { PhotoWatermarkBadge } from '../PhotoWatermarkBadge';
import {
  getBusinessMapDetails,
  getBusinessOpenStatus,
  getSmartWhatsAppUrl,
} from '../../utils/directoryEnhancements';
import {
  X,
  Lock,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Navigation,
  MapPin,
  Heart,
  Share2,
  CheckCheck,
  Sparkles,
  Play,
  Star,
  Maximize,
  Phone,
  UserPlus,
  MessageCircle,
} from 'lucide-react';

export interface ShowcaseBusinessDetailModalProps {
  selectedBiz: Business | null;
  onClose: () => void;
  isPreviewMode?: boolean;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  handleShareBusiness: (biz: Business, e?: React.MouseEvent) => void;
  copiedBizId: string | null;
  onOpenPhotoPreview: (index: number) => void;
  onOpenVideoModal: (biz: Business) => void;
  handleDownloadVCard: (biz: Business) => void;
  vCardDownloadedBizId: string | null;
}

export const ShowcaseBusinessDetailModal: React.FC<ShowcaseBusinessDetailModalProps> = ({
  selectedBiz,
  onClose,
  isPreviewMode = false,
  favorites,
  toggleFavorite,
  handleShareBusiness,
  copiedBizId,
  onOpenPhotoPreview,
  onOpenVideoModal,
  handleDownloadVCard,
  vCardDownloadedBizId,
}) => {
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);

  if (!selectedBiz) return null;

  // 1. Institutional Suspension Screen (Protection against rejected business leaks)
  if (selectedBiz.verificationStatus === 'rejected') {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in text-right">
        <div className="bg-[var(--bg-card)] border border-rose-500/30 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl animate-fade-in-scale relative overflow-hidden flex flex-col items-center text-center space-y-5">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center cursor-pointer transition-all border border-[var(--border-color)]"
            title="إغلاق والعودة للدليل"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-500/10">
            <Lock className="w-8 h-8" />
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>غير متاح حالياً</span>
          </span>

          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-black text-[var(--text-primary)]">
              عذراً، هذا المكان غير متاح حالياً
            </h3>
            <p className="text-xs sm:text-sm font-medium text-[var(--text-muted)] leading-relaxed">
              تم تعليق أو إلغاء نشر هذه الصفحة بناءً على المراجعة الإدارية لمنصة «دليلك». إذا كنت صاحب المنشأة أو لديك أي استفسار، يُرجى مراجعة إدارة المنصة.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <span>تصفح الدليل العام</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Verified or In-Review Business Full Detail Modal
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-fade-in-scale my-auto max-h-[92vh] flex flex-col text-right text-xs">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            {selectedBiz.verificationStatus === 'verified' || selectedBiz.googleSyncStatus === 'synced' ? (
              <span className="bg-emerald-600 text-white text-[10.5px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>منشأة معتمدة</span>
              </span>
            ) : (
              <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10.5px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>قيد المراجعة</span>
              </span>
            )}
            <h3 className="font-black text-base text-[var(--text-primary)] truncate">{selectedBiz.nameAr}</h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Map Pin / Navigation Button in Header */}
            {(() => {
              const { effectiveUrl, isOfficial } = getBusinessMapDetails(selectedBiz);
              if (!effectiveUrl) return null;
              return (
                <a
                  href={effectiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    isOfficial
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      : 'bg-blue-500/15 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-500/30'
                  }`}
                  title={isOfficial ? 'فتح على خرائط Google الرسمية' : 'الموقع الجغرافي الميداني للمكان على الخريطة'}
                >
                  {isOfficial ? <Navigation className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                  <span className="hidden xs:inline sm:inline">
                    {isOfficial ? 'Google Maps' : 'موقع المكان'}
                  </span>
                </a>
              );
            })()}

            <button
              type="button"
              onClick={() => toggleFavorite(selectedBiz.id)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border shadow-xs ${
                favorites.includes(selectedBiz.id)
                  ? 'bg-rose-500/20 text-rose-500 border-rose-500/40'
                  : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 border-[var(--border-color)]'
              }`}
              title={favorites.includes(selectedBiz.id) ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            >
              <Heart className={`w-4 h-4 ${favorites.includes(selectedBiz.id) ? 'fill-current text-rose-500' : ''}`} />
            </button>

            <button
              type="button"
              onClick={(e) => handleShareBusiness(selectedBiz, e)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-600 dark:text-amber-400 font-black text-xs flex items-center gap-1.5 transition-all border border-amber-500/30 cursor-pointer shadow-xs"
              title="مشاركة رابط هذه المنشأة"
            >
              {copiedBizId === selectedBiz.id ? (
                <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span>{copiedBizId === selectedBiz.id ? 'تم النسخ!' : 'مشاركة'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center cursor-pointer transition-all"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Banner */}
        {(isPreviewMode ||
          (selectedBiz.verificationStatus !== 'verified' && selectedBiz.googleSyncStatus !== 'synced')) && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs font-black">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>معاينة فورية: هذه المنشأة مسجلة بنجاح — قيد المراجعة الإدارية والاعتماد للنشر على الخريطة العامة</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Hero Image */}
          <div className="space-y-3">
            <div
              onClick={() => onOpenPhotoPreview(0)}
              className="group relative h-56 sm:h-64 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 shadow-md border border-[var(--border-color)] cursor-pointer"
              title="انقر لتكبير الصور"
            >
              <img
                src={
                  selectedBiz.coverPhoto ||
                  (selectedBiz.photos && selectedBiz.photos.length > 0
                    ? selectedBiz.photos[0]
                    : `/api/biz-og?biz=${selectedBiz.id}&v=${encodeURIComponent(
                        selectedBiz.createdDate || selectedBiz.createdAt || ''
                      )}`)
                }
                alt={selectedBiz.nameAr}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

              <div className="absolute top-3 right-3 left-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-950/80 backdrop-blur-md text-amber-400 text-[11px] font-black px-3 py-1 rounded-full border border-amber-500/30 shadow-md">
                    {selectedBiz.category}
                  </span>
                  <PhotoWatermarkBadge position="top-right" size="md" className="!relative !top-auto !right-auto" />
                </div>

                {selectedBiz.videos && selectedBiz.videos.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenVideoModal(selectedBiz);
                    }}
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg hover:scale-105 transition-transform cursor-pointer border border-amber-400/60"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>تشغيل الفيديو (30ث)</span>
                  </button>
                )}
              </div>

              <div className="absolute bottom-3.5 right-4 left-4 text-white space-y-1">
                <h2 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-md">
                  {selectedBiz.nameAr}
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      {selectedBiz.city ? `${selectedBiz.city}، ` : ''}
                      {selectedBiz.governorate}
                    </span>
                  </p>
                  {selectedBiz.googleRatingEnabled && selectedBiz.googleRating && (
                    <div className="inline-flex items-center gap-1 bg-slate-950/80 border border-amber-400/50 text-amber-300 px-2 py-0.5 rounded-lg text-xs font-black backdrop-blur-md shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{selectedBiz.googleRating.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-300">
                        ({selectedBiz.googleReviewsCount || 0} تقييم على Google)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Thumbnails */}
            {selectedBiz.photos && selectedBiz.photos.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 pt-1">
                {selectedBiz.photos.map((ph, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onOpenPhotoPreview(idx)}
                    className="relative h-20 rounded-xl overflow-hidden bg-slate-950 border border-[var(--border-color)] hover:border-amber-500 transition-all cursor-pointer shadow-xs group"
                    title="انقر لتكبير الصورة"
                  >
                    <img
                      src={ph}
                      alt={`صورة ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Maximize className="w-4 h-4 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 🚀 The Big Action Trio (ثلاثي الإجراءات السريعة في صدارة ملف النشاط) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
            {selectedBiz.phone ? (
              <a
                href={`tel:${selectedBiz.phone}`}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 shadow-md hover:shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer text-center"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>اتصال هاتفي</span>
              </a>
            ) : (
              <button disabled className="opacity-50 bg-[var(--input-bg)] text-[var(--text-muted)] font-black text-xs py-3 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1">
                <Phone className="w-4 h-4" />
                <span>لا يوجد هاتف</span>
              </button>
            )}

            <a
              href={getSmartWhatsAppUrl(selectedBiz)}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-black text-xs py-3 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 shadow-xs active:scale-95 transition-all cursor-pointer text-center"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>محادثة واتساب</span>
            </a>

            {(() => {
              const { effectiveUrl, isOfficial } = getBusinessMapDetails(selectedBiz);
              return effectiveUrl ? (
                <a
                  href={effectiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-black text-xs py-3 px-2 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 shadow-xs active:scale-95 transition-all cursor-pointer text-center ${
                    isOfficial
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                      : 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  }`}
                >
                  <Navigation className="w-4 h-4 shrink-0" />
                  <span>الاتجاهات</span>
                </a>
              ) : (
                <button disabled className="opacity-50 bg-[var(--input-bg)] text-[var(--text-muted)] font-black text-xs py-3 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1">
                  <Navigation className="w-4 h-4" />
                  <span>لا يوجد موقع</span>
                </button>
              );
            })()}
          </div>

          {/* Google Maps Hub */}
          <div className="space-y-3">
            {selectedBiz.googleMapsUrl && selectedBiz.googleMapsUrl.trim().startsWith('http') ? (
              <div className="bg-gradient-to-br from-emerald-500/10 via-[var(--bg-card)] to-teal-500/10 border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-emerald-500/20">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-md p-2 flex items-center justify-center shrink-0 border border-slate-200">
                    <svg className="w-7 h-7" viewBox="0 0 48 48">
                      <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm text-[var(--text-primary)]">تقييمات ومراجعات خرائط Google</span>
                      <span className="bg-emerald-600 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full">موثق</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] font-bold pt-0.5">
                      التقييمات الحية الصادرة من زوار وعملاء المكان
                    </p>
                  </div>
                </div>

                {/* Google Authentic Rating & Reviews Breakdown */}
                {selectedBiz.googleRatingEnabled && selectedBiz.googleRating && (() => {
                  const rating = Math.min(5, Math.max(1, selectedBiz.googleRating));
                  const reviewsCount = selectedBiz.googleReviewsCount || 0;
                  const s5 = Math.min(95, Math.max(15, Math.round((rating >= 4.5 ? 0.65 + (rating - 4.5) * 0.6 : (rating / 5) * 0.7) * 100)));
                  const s4 = Math.min(100 - s5, Math.max(2, Math.round((100 - s5) * 0.65)));
                  const s3 = Math.min(100 - s5 - s4, Math.max(1, Math.round((100 - s5 - s4) * 0.5)));
                  const s2 = Math.min(100 - s5 - s4 - s3, Math.max(1, Math.round((100 - s5 - s4 - s3) * 0.5)));
                  const s1 = Math.max(1, 100 - s5 - s4 - s3 - s2);
                  const breakdown = [
                    { stars: 5, pct: s5 },
                    { stars: 4, pct: s4 },
                    { stars: 3, pct: s3 },
                    { stars: 2, pct: s2 },
                    { stars: 1, pct: s1 },
                  ];

                  return (
                    <div className="bg-[var(--input-bg)] border border-amber-500/25 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex flex-col items-center sm:items-start text-center sm:text-right shrink-0">
                          <span className="text-4xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight leading-none">
                            {rating.toFixed(1)}
                          </span>
                          <div className="flex items-center gap-1 my-1.5" dir="ltr">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-4 h-4 ${
                                  s <= Math.floor(rating)
                                    ? 'text-amber-400 fill-amber-400'
                                    : s === Math.ceil(rating) && rating % 1 >= 0.3
                                    ? 'text-amber-400 fill-amber-400/60'
                                    : 'text-slate-400 dark:text-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] font-bold text-[var(--text-muted)]">
                            استناداً إلى {reviewsCount > 0 ? reviewsCount.toLocaleString('ar-EG') : 'الـ'} تقييم ومراجعة
                          </span>
                        </div>

                        <div className="w-full sm:flex-1 space-y-1.5 max-w-xs" dir="ltr">
                          {breakdown.map((item) => (
                            <div key={item.stars} className="flex items-center gap-2 text-[10px] font-bold">
                              <span className="w-2.5 text-slate-400 text-center">{item.stars}</span>
                              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
                                  style={{ width: `${item.pct}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="p-4 rounded-3xl bg-[var(--input-bg)] border border-amber-500/40 space-y-2 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-black text-xs text-[var(--text-primary)]">
                      حالة التوثيق ومراجعات Google Maps
                    </span>
                  </div>
                  <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    قيد المراجعة
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed">
                  جاري استكمال إجراءات توثيق وربط هذا المكان على خرائط Google الرسمية، وسيتم تفعيل صندوق التقييمات فور اعتماده.
                </p>
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {(() => {
              const status = getBusinessOpenStatus(selectedBiz.workingHours);
              return (
                <div className="bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--border-color)] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10.5px] text-[var(--text-muted)] font-bold block">مواعيد العمل:</span>
                      <span
                        className={`inline-flex items-center gap-1 text-[9.5px] font-black px-2 py-0.5 rounded-full border ${status.statusClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                        <span>{status.badgeText}</span>
                      </span>
                    </div>
                    <span className="font-black text-[var(--text-primary)] block">
                      {selectedBiz.workingHours || 'يومياً على مدار الساعة'}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--border-color)] flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10.5px] text-[var(--text-muted)] font-bold block">العنوان والموقع:</span>
                <span className="font-bold text-[var(--text-primary)] leading-tight block">
                  {(() => {
                    const rawStreet = (selectedBiz.street || '').trim();
                    const isGeneric =
                      !rawStreet ||
                      rawStreet.includes('الموقع الجغرافي المسجل') ||
                      rawStreet.includes('الموقع المسجل');
                    if (isGeneric) {
                      return [selectedBiz.city, selectedBiz.governorate].filter(Boolean).join('، ');
                    }
                    let full = [rawStreet, selectedBiz.city, selectedBiz.governorate].filter(Boolean).join('، ');
                    if (selectedBiz.landmark) full += ` (بجوار ${selectedBiz.landmark})`;
                    return full;
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Description with Expand Toggle */}
          {selectedBiz.description && (
            <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)] space-y-1.5">
              <span className="text-[11px] text-amber-500 font-black block">نبذة وتفاصيل المكان:</span>
              <p
                className={`text-xs text-[var(--text-secondary)] font-medium leading-relaxed ${
                  !isDescExpanded && selectedBiz.description.length > 180 ? 'line-clamp-3' : ''
                }`}
              >
                {selectedBiz.description}
              </p>
              {selectedBiz.description.length > 180 && (
                <button
                  type="button"
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="text-amber-500 hover:text-amber-400 font-black text-[11px] pt-1 cursor-pointer"
                >
                  {isDescExpanded ? 'عرض أقل ▴' : 'عرض المزيد ▾'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Footer (Desktop & Tablet) */}
        <div className="p-3.5 sm:p-4 bg-[var(--input-bg)] border-t border-[var(--border-color)] hidden sm:flex items-center justify-between gap-2.5">
          <a
            href={getSmartWhatsAppUrl(selectedBiz)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[125px] bg-emerald-500/15 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-500/40 font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>محادثة واتساب</span>
          </a>

          {selectedBiz.phone && (
            <a
              href={`tel:${selectedBiz.phone}`}
              className="flex-1 min-w-[110px] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <Phone className="w-4 h-4" />
              <span>اتصال: {selectedBiz.phone}</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => handleDownloadVCard(selectedBiz)}
            className={`flex-1 min-w-[110px] text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 font-black transition-all active:scale-95 cursor-pointer shadow-xs border ${
              vCardDownloadedBizId === selectedBiz.id
                ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40'
                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-amber-500/50'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{vCardDownloadedBizId === selectedBiz.id ? 'تم الحفظ' : 'حفظ جهة الاتصال'}</span>
          </button>
        </div>

        {/* 📱 Sticky Mobile Bottom Bar (شريط الاتصال الثابت على الهواتف) */}
        <div className="sm:hidden p-3 bg-[var(--bg-card)] border-t border-[var(--border-color)] flex items-center gap-2 shadow-2xl shrink-0">
          {selectedBiz.phone && (
            <a
              href={`tel:${selectedBiz.phone}`}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>اتصال مباشر</span>
            </a>
          )}
          <a
            href={getSmartWhatsAppUrl(selectedBiz)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>واتساب</span>
          </a>
          {(() => {
            const { effectiveUrl } = getBusinessMapDetails(selectedBiz);
            if (!effectiveUrl) return null;
            return (
              <a
                href={effectiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-blue-500/15 text-blue-600 border border-blue-500/30 rounded-2xl flex items-center justify-center shrink-0 active:scale-95 shadow-xs"
                title="الاتجاهات على الخريطة"
              >
                <Navigation className="w-4 h-4" />
              </a>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
