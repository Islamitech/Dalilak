import React from 'react';
import { Business, User } from '../../types';
import { isTrendingFreeActivity } from '../../utils/categoryMatcher';
import { getCategoryFallbackCover } from '../../utils/categoryPhotos';
import { formatActivityDateTime } from '../../utils/dateFormatters';
import { sanitizeExternalUrl } from '../../utils/urlSanitizer';
import { getRepDisplayInfo } from '../../utils/repDisplay';
import { formatWhatsAppPhone } from '../../utils/whatsapp/phoneFormatter';
import { getPublicDirectoryUrl } from '../../utils/directoryUrl';
import { getVerificationBadge, getBusinessMapDetails } from './types';
import {
  Store,
  MapPin,
  Play,
  Phone,
  MessageCircle,
  FileText,
  Eye,
  ExternalLink,
} from 'lucide-react';

export interface DirectoryListRowProps {
  biz: Business;
  currentUser: User | null;
  onShowInvoice: (biz: Business) => void;
  onEditBusiness: (biz: Business) => void;
  onSelectVideoBiz: (biz: Business) => void;
}

/**
 * Mobile view card for List Mode (< md)
 */
export const DirectoryListMobileCard: React.FC<DirectoryListRowProps> = ({
  biz,
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
  const ownerPhone = biz.ownerPhone || biz.phone || '';

  const hasPhotos = Array.isArray(biz.photos) && biz.photos.length > 0;
  const fallbackCover = getCategoryFallbackCover(biz.category);
  const coverPhoto = biz.coverPhoto || (hasPhotos ? biz.photos[0] : null) || fallbackCover;
  const hasVideos = Boolean(Array.isArray(biz.videos) && biz.videos.length > 0);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 rounded-2xl shadow-xs space-y-2.5 overflow-hidden">
      {/* Row 1: Photo + Name + Badges */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Photo Thumbnail */}
          <div
            onClick={() => onEditBusiness(biz)}
            className="relative w-12 h-12 rounded-xl overflow-hidden bg-[var(--input-bg)] border border-[var(--border-color)] shrink-0 cursor-pointer group shadow-2xs"
          >
            <img
              src={coverPhoto}
              alt={biz.nameAr || 'صورة المنشأة'}
              loading="lazy"
              decoding="async"
              onError={(e: any) => {
                if (e.currentTarget.src !== fallbackCover) {
                  e.currentTarget.src = fallbackCover;
                }
              }}
              className="w-full h-full object-cover"
            />
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
          <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border ${vBadge.badgeClass}`}>
            {vBadge.text}
          </span>
        </div>
      </div>

      {/* Row 2: Finance & Rep */}
      <div className="flex items-center justify-between text-[11px] bg-[var(--input-bg)] px-2.5 py-1.5 rounded-xl border border-[var(--border-color)]">
        <span className="font-bold text-[var(--text-secondary)]">
          {isExempt ? (
            <span className="text-teal-600">مجاني 0 ج</span>
          ) : (
            <span>
              {biz.packagePrice || 250} ج.م (
              {remaining === 0 ? 'مسدد' : (biz.amountPaid || 0) === 0 ? 'غير مدفوع ⏳' : `متبقي ${remaining}`}
              )
            </span>
          )}
        </span>
        <span className="text-[10px] text-[var(--text-muted)] font-mono">
          {(() => {
            const info = getRepDisplayInfo(biz.repName, {
              repId: biz.repId,
              isFeeExempt: isExempt,
              packageId: biz.packageId,
            });
            return info.isPlatformOfficial ? '🏛️ إدارة المنصة' : info.displayName;
          })()}
        </span>
      </div>

      {/* Row 3: Fast Quick Actions (2-Tier Zero-Overflow Grid) */}
      <div className="pt-2 border-t border-[var(--border-color)] space-y-2">
        {/* Tier 1: Primary Management Actions (Equal 50% split) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onEditBusiness(biz)}
            className="min-h-[42px] bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black py-2 px-2.5 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-4 h-4 stroke-[2.5]" />
            <span>التفاصيل الكاملة</span>
          </button>

          <button
            type="button"
            onClick={() => onShowInvoice(biz)}
            className="min-h-[42px] bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            title="عرض الفاتورة"
          >
            <FileText className="w-4 h-4 text-amber-500" />
            <span>الفاتورة</span>
          </button>
        </div>

        {/* Tier 2: Quick Communication & Navigation Grid (Equal 4-cell distribution, strictly bounded) */}
        <div className="grid grid-cols-4 gap-1.5">
          {(() => {
            const { effectiveUrl, isOfficial } = getBusinessMapDetails(biz);
            if (effectiveUrl) {
              return (
                <a
                  href={sanitizeExternalUrl(effectiveUrl, '#')}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[40px] bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 border border-blue-500/30 p-1 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 text-[11px] font-bold"
                  title={
                    isOfficial
                      ? 'فتح موقع النشاط المعتمد على خرائط Google'
                      : 'معاينة الموقع الجغرافي الميداني للنشاط على الخريطة'
                  }
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="hidden sm:inline">الموقع</span>
                </a>
              );
            }
            return (
              <button
                type="button"
                disabled
                className="min-h-[40px] bg-[var(--input-bg)] text-slate-400 border border-[var(--border-color)] p-1 rounded-xl opacity-40 cursor-not-allowed flex items-center justify-center text-[11px]"
                title="لم يتم تحديد الموقع الجغرافي بعد"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
              </button>
            );
          })()}

          {ownerPhone ? (
            <a
              href={`https://wa.me/${formatWhatsAppPhone(ownerPhone)}`}
              target="_blank"
              rel="noreferrer"
              className="min-h-[40px] bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-600 border border-emerald-500/30 p-1 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 text-[11px] font-bold"
              title="مراسلة واتساب"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">واتساب</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="min-h-[40px] bg-[var(--input-bg)] text-slate-400 border border-[var(--border-color)] p-1 rounded-xl opacity-40 cursor-not-allowed flex items-center justify-center text-[11px]"
              title="لا يتوفر هاتف"
            >
              <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}

          {ownerPhone ? (
            <a
              href={sanitizeExternalUrl(`tel:${ownerPhone.replace(/[^\d+]/g, '')}`, '#')}
              className="min-h-[40px] bg-blue-600/15 hover:bg-blue-600/25 text-blue-600 border border-blue-500/30 p-1 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 text-[11px] font-bold"
              title="اتصال هاتفي"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">اتصال</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="min-h-[40px] bg-[var(--input-bg)] text-slate-400 border border-[var(--border-color)] p-1 rounded-xl opacity-40 cursor-not-allowed flex items-center justify-center text-[11px]"
              title="لا يتوفر هاتف"
            >
              <Phone className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}

          <a
            href={getPublicDirectoryUrl(biz)}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[40px] bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 border border-amber-500/30 p-1 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-95 text-[11px] font-bold"
            title="فتح صفحة المنشأة على الدليل العام (رابط دائم)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="hidden sm:inline">الدليل</span>
          </a>
        </div>
      </div>
    </div>
  );
};

/**
 * Desktop view table row for List Mode (>= md)
 */
export const DirectoryListTableRow: React.FC<DirectoryListRowProps> = ({
  biz,
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
  const ownerPhone = biz.ownerPhone || biz.phone || '';

  const hasPhotos = Array.isArray(biz.photos) && biz.photos.length > 0;
  const fallbackCover = getCategoryFallbackCover(biz.category);
  const coverPhoto = biz.coverPhoto || (hasPhotos ? biz.photos[0] : null) || fallbackCover;
  const hasVideos = Boolean(Array.isArray(biz.videos) && biz.videos.length > 0);

  return (
    <tr className="hover:bg-[var(--input-bg)]/50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5">
          {/* Photo Thumbnail */}
          <div
            onClick={() => onEditBusiness(biz)}
            className="relative w-10 h-10 rounded-xl overflow-hidden bg-[var(--input-bg)] border border-[var(--border-color)] shrink-0 cursor-pointer group shadow-2xs"
          >
            <img
              src={coverPhoto}
              alt={biz.nameAr || 'صورة المنشأة'}
              loading="lazy"
              decoding="async"
              onError={(e: any) => {
                if (e.currentTarget.src !== fallbackCover) {
                  e.currentTarget.src = fallbackCover;
                }
              }}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
            />
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
                <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 px-1 rounded">
                  📷 {biz.photos.length}
                </span>
              )}
              {hasVideos && (
                <span className="text-[9px] font-bold text-yellow-600 bg-yellow-500/10 px-1 rounded">
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
          className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${vBadge.badgeClass}`}
        >
          <span>{vBadge.text}</span>
        </span>
      </td>

      <td className="py-3 px-3">
        <div className="font-black text-[var(--text-primary)] font-mono">
          {isExempt ? (
            <span className="text-teal-600 text-[11px]">مجاني (0 ج)</span>
          ) : (
            <span>{biz.packagePrice || 250} ج.م</span>
          )}
        </div>
        <div className="text-[10px] font-bold mt-0.5">
          {isExempt ? (
            <span className="text-teal-600">إدراج ترويجي</span>
          ) : remaining === 0 ? (
            <span className="text-emerald-600">مسدد بالكامل ✓</span>
          ) : (biz.amountPaid || 0) === 0 ? (
            <span className="text-amber-700 font-bold">غير مدفوع ⏳</span>
          ) : (
            <span className="text-amber-600 font-mono">متبقي {remaining} ج</span>
          )}
        </div>
      </td>

      <td className="py-3 px-3">
        <div className="font-bold text-[var(--text-secondary)] truncate max-w-[130px]">
          {(() => {
            const info = getRepDisplayInfo(biz.repName, {
              repId: biz.repId,
              isFeeExempt: isExempt,
              packageId: biz.packageId,
            });
            return info.isPlatformOfficial ? '🏛️ إدارة المنصة' : info.displayName;
          })()}
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

          {(() => {
            const { effectiveUrl, isOfficial } = getBusinessMapDetails(biz);
            if (effectiveUrl) {
              return (
                <a
                  href={sanitizeExternalUrl(effectiveUrl, '#')}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-xl bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border border-blue-500/30 transition-transform active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs"
                  title={
                    isOfficial
                      ? 'فتح موقع النشاط المعتمد على خرائط Google 🗺️'
                      : 'معاينة الموقع الجغرافي الميداني للنشاط 🗺️'
                  }
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                </a>
              );
            }
            return (
              <button
                type="button"
                disabled
                className="p-1.5 rounded-xl bg-[var(--input-bg)] text-slate-400 border border-[var(--border-color)] opacity-40 cursor-not-allowed flex items-center justify-center"
                title="لم يتم تحديد الموقع الجغرافي بعد"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
              </button>
            );
          })()}

          <a
            href={getPublicDirectoryUrl(biz)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-xl bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border border-amber-500/30 transition-transform active:scale-95 flex items-center justify-center cursor-pointer shadow-2xs"
            title="فتح الرابط المباشر للمنشأة على الدليل العام (SEO)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
          </a>

          <button
            onClick={() => onShowInvoice(biz)}
            className="p-1.5 rounded-xl bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-amber-500 border border-[var(--border-color)] transition-colors cursor-pointer"
            title="عرض الفاتورة"
          >
            <FileText className="w-3.5 h-3.5 text-amber-500" />
          </button>
          {ownerPhone && (
            <a
              href={`https://wa.me/${formatWhatsAppPhone(ownerPhone)}`}
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
              href={sanitizeExternalUrl(`tel:${ownerPhone.replace(/[^\d+]/g, '')}`, '#')}
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
};
