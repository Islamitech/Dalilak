import React from 'react';
import { Business, User } from '../../types';
import { isTrendingFreeActivity } from '../../utils/categoryMatcher';
import { formatActivityDateTime } from '../../utils/dateFormatters';
import { sanitizeExternalUrl } from '../../utils/urlSanitizer';
import { getRepDisplayInfo } from '../../utils/repDisplay';
import { getRepFieldIntroWhatsAppUrl } from '../../utils/whatsapp';
import { PhotoWatermarkBadge } from '../PhotoWatermarkBadge';
import { getVerificationBadge, getBusinessMapDetails } from './types';
import {
  Store,
  MapPin,
  Clock,
  Play,
  Star,
  Phone,
  MessageCircle,
  Navigation,
  FileText,
  Eye,
} from 'lucide-react';

export interface DirectoryGridCardProps {
  biz: Business;
  currentUser: User | null;
  onShowInvoice: (biz: Business) => void;
  onEditBusiness: (biz: Business) => void;
  onSelectVideoBiz: (biz: Business) => void;
}

export const DirectoryGridCard: React.FC<DirectoryGridCardProps> = ({
  biz,
  currentUser,
  onShowInvoice,
  onEditBusiness,
  onSelectVideoBiz,
}) => {
  const isExempt = isTrendingFreeActivity(biz);
  const pkgDebt = isExempt ? 0 : Math.max(0, (biz.packagePrice || 0) - (biz.amountPaid || 0));
  const addDebt = (biz.additionalInvoices || []).reduce(
    (sum, inv) => sum + Math.max(0, (Number(inv.amount) || 0) - (Number(inv.amountPaid) || 0)),
    0
  );
  const remaining = pkgDebt + addDebt;
  const vBadge = getVerificationBadge(biz.verificationStatus);
  const hasPhotos = biz.photos && biz.photos.length > 0;
  const hasVideos = Boolean(biz.videos && biz.videos.length > 0);
  const coverPhoto = biz.coverPhoto || (hasPhotos ? biz.photos[0] : null);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      data-readability-ignore="true"
      data-reader-skip="true"
      className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-xs hover:shadow-lg hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group protected-asset-shield"
    >
      {/* Visual Header / Cover with Anti-Extraction Shield */}
      <div
        className="relative aspect-[16/8.5] bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-slate-900/10 overflow-hidden select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt=""
            role="presentation"
            aria-hidden="true"
            data-reader-skip="true"
            data-readability-ignore="true"
            loading="lazy"
            decoding="async"
            draggable={false}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none select-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-amber-500/60 bg-[var(--bg-surface)]">
            <Store className="w-8 h-8 opacity-40 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-[var(--text-muted)] opacity-70">منظومة دليلك الميدانية</span>
          </div>
        )}

        {/* Anti-Extraction Transparent Protection Shield */}
        <div
          className="absolute inset-0 z-[5] select-none pointer-events-auto"
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

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
            className={`text-[9.5px] font-black px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs border ${vBadge.className}`}
          >
            {vBadge.text}
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

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-950/70 text-slate-200 backdrop-blur-md border border-white/10">
            {biz.invoiceNumber || 'INV'}
          </span>
          {coverPhoto && (
            <PhotoWatermarkBadge position="top-left" className="!relative !top-auto !left-auto" />
          )}
        </div>

        {/* Bottom info on photo */}
        <div className="absolute bottom-2 right-2.5 left-2.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-1.5 truncate max-w-[210px]">
            <span className="text-[10px] font-bold bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10 truncate">
              {biz.category}
            </span>
            {biz.googleRatingEnabled && biz.googleRating && (
              <span className="inline-flex items-center gap-1 bg-amber-500/25 border border-amber-400/40 text-amber-300 text-[9.5px] font-black px-1.5 py-0.5 rounded-md backdrop-blur-md">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>{biz.googleRating.toFixed(1)}</span>
                {biz.googleReviewsCount !== undefined && (
                  <span className="text-[8.5px] opacity-75">({biz.googleReviewsCount})</span>
                )}
              </span>
            )}
          </div>
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
              <span className="truncate">
                {biz.governorate} • {biz.city} {biz.street ? `• ${biz.street}` : ''}
              </span>
            </div>
          </div>

          {/* Representative & Date Strip */}
          <div className="flex items-center justify-between text-[10.5px] bg-[var(--input-bg)] px-2.5 py-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] font-bold">
            <span className="truncate max-w-[140px] text-[var(--text-secondary)]">
              {(() => {
                const info = getRepDisplayInfo(biz.repName, {
                  repId: biz.repId,
                  isFeeExempt: isExempt,
                  packageId: biz.packageId,
                });
                return info.isPlatformOfficial ? '🏛️ إدارة المنصة' : `👤 ${info.displayName}`;
              })()}
            </span>
            <span className="font-mono text-[9.5px] shrink-0">
              {formatActivityDateTime(biz.createdDate || biz.invoiceDate)}
            </span>
          </div>

          {/* Financial Package & Payment Row */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-1">
              {isExempt ? (
                <span className="text-[11px] font-black text-teal-700 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                  🆓 نشاط رائج (مجاني 0 ج)
                </span>
              ) : (
                <span className="text-[11px] font-black text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {biz.packagePrice || 250} ج.م
                </span>
              )}
            </div>
            <div>
              {isExempt ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-600 border border-teal-500/30">
                  ✓ إدراج مجاني
                </span>
              ) : remaining === 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                  ✓ مسدد بالكامل
                </span>
              ) : (biz.amountPaid || 0) === 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30">
                  غير مدفوع ⏳
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30">
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
              href={sanitizeExternalUrl(`tel:${(biz.phone || biz.ownerPhone || '').replace(/[^\d+]/g, '')}`, '#')}
              className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-emerald-500/15 text-[var(--text-secondary)] hover:text-emerald-600 flex flex-col items-center justify-center gap-0.5 transition-colors text-[9.5px] font-bold border border-[var(--border-color)]"
              title="اتصال هاتفي"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              <span>اتصال</span>
            </a>

            {/* WhatsApp */}
            <a
              href={sanitizeExternalUrl(getRepFieldIntroWhatsAppUrl(biz, currentUser?.name), '#')}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-emerald-500/15 text-[var(--text-secondary)] hover:text-emerald-600 flex flex-col items-center justify-center gap-0.5 transition-colors text-[9.5px] font-bold border border-[var(--border-color)]"
              title="محادثة واتساب ميدانية"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>واتساب</span>
            </a>

            {/* Google Maps / Direction */}
            {(() => {
              const { effectiveUrl, isOfficial } = getBusinessMapDetails(biz);
              if (effectiveUrl) {
                return (
                  <a
                    href={sanitizeExternalUrl(effectiveUrl, '#')}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-emerald-500/15 text-emerald-600 flex flex-col items-center justify-center gap-0.5 transition-colors text-[9.5px] font-bold border border-[var(--border-color)]"
                    title={
                      isOfficial
                        ? 'الموقع موثق رسمياً: فتح على خرائط Google'
                        : 'الموقع الجغرافي الميداني للنشاط على الخريطة'
                    }
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                    <span>الخريطة</span>
                  </a>
                );
              }
              return (
                <button
                  type="button"
                  disabled
                  className="p-2 rounded-xl bg-slate-200 text-slate-400 flex flex-col items-center justify-center gap-0.5 text-[9.5px] font-bold border border-slate-300 cursor-not-allowed opacity-60"
                  title="لم يتم تحديد الموقع الجغرافي بعد"
                >
                  <Navigation className="w-3.5 h-3.5 opacity-40" />
                  <span>غير محدد</span>
                </button>
              );
            })()}

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
};
