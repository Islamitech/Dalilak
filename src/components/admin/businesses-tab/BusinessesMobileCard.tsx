import React from 'react';
import { Business } from '../../../types';
import { sanitizeExternalUrl } from '../../../utils/urlSanitizer';
import { formatEGP } from '../../../utils/formatCurrency';
import { isRepAccountDeleted } from '../../../utils/accountStatus';
import { calcBusinessFinancials } from './businessesTabUtils';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Eye,
  Trash2,
  FileText,
  Zap,
  Globe,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface BusinessesMobileCardProps {
  biz: Business;
  onCollectPayment?: (biz: Business) => void;
  onSetSyncModalBiz: (biz: Business | null) => void;
  onSetEditingBusiness: (biz: Business | null) => void;
  onSetEditingBusinessInitialTab: (tab: string | undefined) => void;
  onShowInvoice: (biz: Business) => void;
  onSelectFollowUpBiz: (biz: Business) => void;
  onConfirmDelete: (item: { id: string; name: string }) => void;
  onSendPackageBiz?: (biz: Business) => void;
}

export const BusinessesMobileCard: React.FC<BusinessesMobileCardProps> = ({
  biz,
  onCollectPayment,
  onSetSyncModalBiz,
  onSetEditingBusiness,
  onSetEditingBusinessInitialTab,
  onShowInvoice,
  onSelectFollowUpBiz,
  onConfirmDelete,
  onSendPackageBiz,
}) => {
  const {
    isDirectoryApproved,
    hasGoogleMap,
    isInGoogleReview,
    isExempt,
    packageDebt,
    debtAmount,
    isPaid,
    isCash,
    repComm,
    platDue,
    isGoogleVerifiedWithDebt,
    fuSummary,
  } = calcBusinessFinancials(biz);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl space-y-3 shadow-sm hover:border-amber-500/40 transition-all">
      {/* Header: Name + Dual Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-black text-sm text-[var(--text-primary)] truncate">{biz.nameAr}</h4>
          {biz.nameEn && <p className="text-[10px] text-[var(--text-muted)] font-mono truncate">{biz.nameEn}</p>}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="inline-block text-[11px] text-amber-700 dark:text-amber-400 font-bold">{biz.category}</span>
            {isExempt && (
              <span className="text-[9.5px] bg-teal-500/20 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-md font-black border border-teal-500/30">
                رائج (معفى من الرسوم)
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          {isDirectoryApproved ? (
            <span className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 text-[9.5px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>معتمد بالدليل</span>
            </span>
          ) : biz.verificationStatus === 'rejected' ? (
            <span className="bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/40 text-[9.5px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>مرفوض بالدليل</span>
            </span>
          ) : (
            <span className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-[9.5px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              <span>قيد مراجعة الدليل</span>
            </span>
          )}

          {hasGoogleMap ? (
            <span className="bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
              <Globe className="w-2.5 h-2.5" />
              <span>موثق بـ Google</span>
            </span>
          ) : isInGoogleReview ? (
            <span className="bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              <span>قيد توثيق Google</span>
            </span>
          ) : (
            <span className="bg-slate-800/80 text-slate-400 border border-slate-700 text-[9px] font-medium px-1.5 py-0.5 rounded-md">
              غير مربوط بـ Google
            </span>
          )}

          {fuSummary.isOverdue ? (
            <button
              type="button"
              onClick={() => onSelectFollowUpBiz(biz)}
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 border border-rose-500/40 text-[9px] font-black px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 cursor-pointer animate-pulse"
              title="متابعات متأخرة تحتاج تدخلاً عاجلاً"
            >
              <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
              <span>{fuSummary.overdueCount} متأخرة</span>
            </button>
          ) : fuSummary.dueTodayCount > 0 ? (
            <button
              type="button"
              onClick={() => onSelectFollowUpBiz(biz)}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-[9px] font-black px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 cursor-pointer"
              title="متابعات مستحقة اليوم"
            >
              <Clock className="w-2.5 h-2.5 text-amber-500" />
              <span>اليوم ({fuSummary.dueTodayCount})</span>
            </button>
          ) : Boolean(biz.adminFollowUps && biz.adminFollowUps.length > 0) ? (
            <button
              type="button"
              onClick={() => onSelectFollowUpBiz(biz)}
              className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 cursor-pointer transition-colors"
              title="عرض وسجل المتابعات الإدارية"
            >
              <ClipboardList className="w-2.5 h-2.5 text-amber-500" />
              <span>{biz.adminFollowUps!.length} متابعة</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Urgent Alert if Verified on Google with Remaining Debt */}
      {isGoogleVerifiedWithDebt && (
        <div className="bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 p-2.5 rounded-xl text-xs font-black flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="truncate">موثقة ومطلوب التحصيل</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (packageDebt > 0 && onCollectPayment) {
                onCollectPayment(biz);
              } else {
                onSetEditingBusinessInitialTab('payment');
                onSetEditingBusiness(biz);
              }
            }}
            className="bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] px-2.5 py-1 rounded-lg shadow-xs cursor-pointer shrink-0"
          >
            تحصيل المستحقات
          </button>
        </div>
      )}

      {/* Location, Rep, and Date Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px] bg-[var(--input-bg)]/60 p-2.5 rounded-xl border border-[var(--border-color)]">
        <div className="min-w-0">
          <span className="text-[9px] text-[var(--text-muted)] block font-bold">الموقع والمندوب:</span>
          <span className="font-bold text-[var(--text-primary)] block truncate">{biz.governorate} ({biz.city})</span>
          <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1 truncate">
            <span>مندوب: {biz.repName}</span>
            {isRepAccountDeleted({ id: biz.repId, name: biz.repName }) && (
              <span className="bg-rose-500/15 text-rose-500 text-[9px] font-black px-1.5 py-0.2 rounded-md border border-rose-500/30 shrink-0">
                محذوف
              </span>
            )}
          </span>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <a
              href={sanitizeExternalUrl(biz.repLocationUrl || `https://www.google.com/maps?q=${biz.lat},${biz.lng}`)}
              target="_blank"
              rel="noreferrer"
              className="text-[9px] text-amber-600 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-1"
            >
              <MapPin className="w-2.5 h-2.5" />
              <span>موقع المندوب</span>
            </a>
            {hasGoogleMap && (
              <a
                href={sanitizeExternalUrl(biz.googleMapsUrl)}
                target="_blank"
                rel="noreferrer"
                className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
              >
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>الخريطة الموثقة</span>
              </a>
            )}
          </div>
        </div>

        <div className="min-w-0 text-left">
          <span className="text-[9px] text-[var(--text-muted)] block font-bold">المسؤول والهاتف:</span>
          <span className="font-bold text-[var(--text-primary)] block truncate">{biz.ownerName}</span>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono block dir-ltr truncate">{biz.ownerPhone}</span>
        </div>
      </div>

      {/* Financial Summary Box */}
      <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] text-xs space-y-1">
        <div className="flex items-center justify-between font-mono">
          <span className="text-[10.5px] text-[var(--text-secondary)]">سعر الباقة الإجمالي:</span>
          <span className="font-black text-amber-600 dark:text-amber-400">{isExempt ? 'مجاني (0 ج.م)' : formatEGP(biz.packagePrice || 250)}</span>
        </div>
        <div className="flex items-center justify-between font-mono">
          <span className="text-[10.5px] text-[var(--text-secondary)]">المبلغ المسدد:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatEGP(biz.amountPaid || 0)}</span>
        </div>
        {debtAmount > 0 && (
          <div className="flex items-center justify-between font-mono font-bold text-rose-500">
            <span className="text-[10.5px]">المتبقي للتحصيل:</span>
            <span>{formatEGP(debtAmount)}</span>
          </div>
        )}
        {biz.additionalInvoices && biz.additionalInvoices.length > 0 && (
          <div className="flex items-center justify-between text-[10.5px] font-bold text-sky-600 dark:text-sky-400 pt-1 border-t border-[var(--border-color)]">
            <span>خدمات إضافية ({biz.additionalInvoices.length}):</span>
            <span className="font-mono">
              {formatEGP(biz.additionalInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0))} محصل
            </span>
          </div>
        )}
        {isCash && (
          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono pt-1 border-t border-[var(--border-color)]">
            <span>نصيب المندوب: {formatEGP(repComm)}</span>
            <span>مستحق للمنصة: {formatEGP(platDue)}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => onSelectFollowUpBiz(biz)}
          className={`font-bold text-xs p-2 rounded-xl border cursor-pointer relative ${
            fuSummary.isOverdue
              ? 'bg-rose-500/20 border-rose-500 text-rose-600 animate-pulse'
              : fuSummary.dueTodayCount > 0
              ? 'bg-amber-500/20 border-amber-500 text-amber-600'
              : 'bg-[var(--input-bg)] hover:bg-amber-500/20 text-[var(--text-primary)] border-[var(--border-color)]'
          }`}
          title={`سجل المتابعات الإدارية (${biz.adminFollowUps?.length || 0})`}
        >
          <ClipboardList className="w-4 h-4 text-amber-500" />
          {fuSummary.isOverdue ? (
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-bounce">
              {fuSummary.overdueCount}
            </span>
          ) : Boolean(biz.adminFollowUps && biz.adminFollowUps.length > 0) ? (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {biz.adminFollowUps!.length}
            </span>
          ) : null}
        </button>

        {onSendPackageBiz && (
          <button
            type="button"
            onClick={() => onSendPackageBiz(biz)}
            className="bg-gradient-to-r from-amber-500/15 to-yellow-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-700 dark:text-amber-400 font-black text-xs p-2 rounded-xl border border-amber-500/30 flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
            title="إرسال تفاصيل باقة تسويقية للمنشأة عبر واتساب 💎"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-[10.5px]">باقة 💎</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onShowInvoice(biz)}
          className="bg-[var(--input-bg)] hover:bg-amber-500/20 text-[var(--text-primary)] font-bold text-xs p-2 rounded-xl border border-[var(--border-color)] cursor-pointer"
          title="عرض وإصدار الفاتورة"
        >
          <FileText className="w-4 h-4 text-amber-500" />
        </button>

        <button
          type="button"
          onClick={() => onSetSyncModalBiz(biz)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
          title="ربط خرائط جوجل"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => onSetEditingBusiness(biz)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer flex-1 justify-center"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>التفاصيل</span>
        </button>

        <button
          type="button"
          onClick={() => onConfirmDelete({ id: biz.id, name: biz.nameAr })}
          className="bg-rose-500/15 hover:bg-rose-500 text-rose-600 hover:text-white p-2 rounded-xl border border-rose-500/30 transition-colors cursor-pointer"
          title="حذف المنشأة نهائياً"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
