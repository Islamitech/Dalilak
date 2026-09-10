import React from 'react';
import { Business } from '../../../types';
import { sanitizeExternalUrl } from '../../../utils/urlSanitizer';
import { formatEGP } from '../../../utils/formatCurrency';
import { formatStandardDateTime } from '../../../utils/dateFormatters';
import { isRepAccountDeleted } from '../../../utils/accountStatus';
import { calcBusinessFinancials } from './businessesTabUtils';
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Globe,
  Zap,
  DollarSign,
  ClipboardList,
  FileText,
  Eye,
  Sparkles,
} from 'lucide-react';

export interface BusinessesDesktopRowProps {
  biz: Business;
  onCollectPayment?: (biz: Business) => void;
  onSetSyncModalBiz: (biz: Business | null) => void;
  onSetEditingBusiness: (biz: Business | null) => void;
  onSetEditingBusinessInitialTab: (tab: string | undefined) => void;
  onShowInvoice: (biz: Business) => void;
  onSelectFollowUpBiz: (biz: Business) => void;
  onSendPackageBiz?: (biz: Business) => void;
}

export const BusinessesDesktopRow: React.FC<BusinessesDesktopRowProps> = ({
  biz,
  onCollectPayment,
  onSetSyncModalBiz,
  onSetEditingBusiness,
  onSetEditingBusinessInitialTab,
  onShowInvoice,
  onSelectFollowUpBiz,
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
    platDue,
    fuSummary,
  } = calcBusinessFinancials(biz);

  return (
    <tr className="hover:bg-amber-500/5 transition-colors">
      {/* 1. Name and Category */}
      <td className="p-3">
        <p className="font-black text-[var(--text-primary)]">{biz.nameAr}</p>
        <p className="text-[10px] text-[var(--text-muted)] font-mono">{biz.nameEn || biz.category}</p>
        {isExempt && (
          <span className="text-[9.5px] bg-teal-500/20 text-teal-700 px-1.5 py-0.5 rounded font-bold inline-block mt-0.5">
            رائج (معفى من الرسوم)
          </span>
        )}
      </td>

      {/* 2. Owner & Location */}
      <td className="p-3">
        <p className="font-bold text-[var(--text-primary)]">{biz.ownerName}</p>
        <p className="text-[10px] text-[var(--text-muted)] font-mono">{biz.ownerPhone}</p>
        <p className="text-[10px] text-[var(--text-secondary)]">{biz.governorate} - {biz.city}</p>
        {biz.repLocationUrl && (
          <a
            href={sanitizeExternalUrl(biz.repLocationUrl)}
            target="_blank"
            rel="noreferrer"
            className="text-[9px] text-amber-600 font-bold hover:underline inline-flex items-center gap-1 mt-0.5"
            title="معاينة إحداثيات موقع المندوب الميداني"
          >
            <MapPin className="w-2.5 h-2.5" />
            <span>موقع المندوب</span>
          </a>
        )}
      </td>

      {/* 3. Rep & Registration Date */}
      <td className="p-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-bold text-[var(--text-primary)]">{biz.repName}</p>
          {isRepAccountDeleted({ id: biz.repId, name: biz.repName }) && (
            <span className="bg-rose-500/15 text-rose-500 text-[9.5px] font-black px-1.5 py-0.5 rounded-md border border-rose-500/30 inline-block">
              حساب محذوف
            </span>
          )}
        </div>
        <p className="text-[10px] text-[var(--text-muted)] font-mono dir-ltr">{formatStandardDateTime(biz.createdDate)}</p>
      </td>

      {/* 4. Package & Financial Status */}
      <td className="p-3">
        <div className="space-y-1">
          {isExempt ? (
            <span className="badge-success text-[10px] font-black px-2 py-0.5 rounded-full inline-block">
              معفى
            </span>
          ) : debtAmount > 0 && (biz.amountPaid || 0) === 0 ? (
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block bg-amber-500/15 text-amber-700 border border-amber-500/30">
              غير مدفوعة
            </span>
          ) : debtAmount === 0 ? (
            <span className="badge-success text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block">
              مدفوعة
            </span>
          ) : (
            <>
              <span className="badge-warning text-[10px] font-black px-2 py-0.5 rounded-full inline-block">
                مقدم (متبقي {formatEGP(debtAmount)})
              </span>
              {isCash && (
                <p className="text-[9.5px] text-amber-700 font-bold font-mono">
                  كاش (مستحق: {formatEGP(platDue)})
                </p>
              )}
            </>
          )}
          {biz.additionalInvoices && biz.additionalInvoices.length > 0 && (
            <span className="text-[9.5px] bg-sky-500/15 text-sky-700 font-bold px-1.5 py-0.5 rounded-md border border-sky-500/30 inline-block">
              +{biz.additionalInvoices.length} خدمات إضافية ({formatEGP(biz.additionalInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0))})
            </span>
          )}
        </div>
      </td>

      {/* 5. Verification Status */}
      <td className="p-3">
        <div className="space-y-1">
          <div>
            {isDirectoryApproved ? (
              <span className="bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                <span>معتمد بالدليل</span>
              </span>
            ) : biz.verificationStatus === 'rejected' ? (
              <span className="bg-rose-500/15 text-rose-700 border border-rose-500/30 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                <span>مرفوض بالدليل</span>
              </span>
            ) : (
              <span className="bg-amber-500/15 text-amber-700 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-amber-500" />
                <span>قيد مراجعة الدليل</span>
              </span>
            )}
          </div>
          <div>
            {hasGoogleMap ? (
              <a
                href={sanitizeExternalUrl(biz.googleMapsUrl)}
                target="_blank"
                rel="noreferrer"
                className="text-[9.5px] bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 font-bold px-2 py-0.5 rounded-md border border-blue-500/30 inline-flex items-center gap-1 transition-colors cursor-pointer"
                title="فتح الرابط المعتمد على خرائط Google"
              >
                <Globe className="w-2.5 h-2.5" />
                <span>موثق بـ Google</span>
              </a>
            ) : isInGoogleReview ? (
              <span className="text-[9.5px] bg-purple-500/15 text-purple-700 font-bold px-2 py-0.5 rounded-md border border-purple-500/30 inline-flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                <span>قيد توثيق Google</span>
              </span>
            ) : (
              <span className="text-[9.5px] text-slate-500 font-medium px-1.5 py-0.5 rounded border border-slate-700/40 inline-flex items-center gap-1 opacity-70">
                <span>غير مربوط بـ Google</span>
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 6. Actions */}
      <td className="p-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          {/* 1. زر رفع ومزامنة Google (⚡) */}
          {!hasGoogleMap ? (
            <button
              type="button"
              onClick={() => onSetSyncModalBiz(biz)}
              className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
              title="رفع ومزامنة النشاط مباشرة إلى Google Maps"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-8 h-8 rounded-xl bg-slate-500/10 text-slate-400 border border-slate-500/20 flex items-center justify-center cursor-not-allowed opacity-50 shrink-0"
              title="النشاط موثق ومربوط بخرائط Google بالفعل"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
          )}

          {/* 2. زر التحصيل المالي (💲) */}
          {!isExempt && debtAmount > 0 ? (
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
              className="w-8 h-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
              title={`تحصيل متبقي السداد: ${formatEGP(debtAmount)}`}
            >
              <DollarSign className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-8 h-8 rounded-xl bg-slate-500/10 text-slate-400 border border-slate-500/20 flex items-center justify-center cursor-not-allowed opacity-50 shrink-0"
              title={isExempt ? 'نشاط معفى من الرسوم' : 'الحساب مسدد بالكامل'}
            >
              <DollarSign className="w-3.5 h-3.5" />
            </button>
          )}

          {/* 3. زر سجل الملاحظات والمتابعات */}
          <button
            type="button"
            onClick={() => onSelectFollowUpBiz(biz)}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center relative transition-all shadow-2xs cursor-pointer hover:scale-105 active:scale-95 shrink-0 ${
              fuSummary.isOverdue
                ? 'bg-rose-500/20 border-rose-500 text-rose-600 animate-pulse'
                : fuSummary.dueTodayCount > 0
                ? 'bg-amber-500/20 border-amber-500 text-amber-600'
                : 'bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-secondary)] hover:text-amber-600 border-[var(--border-color)]'
            }`}
            title={
              fuSummary.isOverdue
                ? `هناك ${fuSummary.overdueCount} متابعة متأخرة`
                : fuSummary.dueTodayCount > 0
                ? `متابعة مستحقة اليوم (${fuSummary.dueTodayCount})`
                : `سجل الملاحظات والمتابعات الإدارية (${biz.adminFollowUps?.length || 0})`
            }
          >
            <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
            {fuSummary.isOverdue ? (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-bounce">
                {fuSummary.overdueCount}
              </span>
            ) : (biz.adminFollowUps && biz.adminFollowUps.length > 0) ? (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {biz.adminFollowUps.length}
              </span>
            ) : null}
          </button>

          {/* 3.5 زر إرسال تفاصيل باقة تسويقية عبر واتساب */}
          {onSendPackageBiz && (
            <button
              type="button"
              onClick={() => onSendPackageBiz(biz)}
              className="w-8 h-8 rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/15 hover:from-amber-500 hover:to-yellow-500 text-amber-600 hover:text-slate-950 border border-amber-500/30 flex items-center justify-center transition-all shadow-2xs cursor-pointer hover:scale-105 active:scale-95 shrink-0"
              title="إرسال تفاصيل باقة تسويقية للمنشأة عبر واتساب 💎"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}

          {/* 4. زر معاينة وإصدار الفاتورة */}
          <button
            type="button"
            onClick={() => onShowInvoice(biz)}
            className="w-8 h-8 rounded-xl bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-secondary)] hover:text-amber-600 border border-[var(--border-color)] flex items-center justify-center transition-all shadow-2xs cursor-pointer hover:scale-105 active:scale-95 shrink-0"
            title="معاينة وإصدار الفاتورة"
          >
            <FileText className="w-3.5 h-3.5 text-sky-500" />
          </button>

          {/* 5. زر عرض وتعديل التفاصيل */}
          <button
            type="button"
            onClick={() => onSetEditingBusiness(biz)}
            className="w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
            title="عرض وتعديل التفاصيل الكاملة (مع خيارات الحذف الإداري)"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
