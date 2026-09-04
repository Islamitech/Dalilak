import React from 'react';
import { Business } from '../../types';
import { PACKAGES, EXEMPT_PACKAGE, ALREADY_ON_GOOGLE_PACKAGE } from '../../data/mockData';
import {
  ShieldCheck,
  Sparkles,
  DollarSign,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface EditPackagePaymentTabProps {
  formData: Business;
  setFormData: React.Dispatch<React.SetStateAction<Business | null>>;
  isEditMode: boolean;
  isAdminOrFinancial: boolean;
  canEdit: boolean;
  remainingDebt: number;
  handleToggleFeeExempt: (isExempt: boolean) => void;
}

export const EditPackagePaymentTab: React.FC<EditPackagePaymentTabProps> = ({
  formData,
  setFormData,
  isEditMode,
  isAdminOrFinancial,
  canEdit,
  remainingDebt,
  handleToggleFeeExempt,
}) => {
  return (
    <div className="space-y-3.5 text-right">
      {/* 🔐 Notice for Representatives */}
      {!isAdminOrFinancial && (
        <div className="bg-sky-500/10 border border-sky-500/30 text-sky-800 dark:text-sky-300 p-3.5 rounded-2xl text-xs font-bold leading-relaxed flex items-center gap-2.5 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-sky-500 shrink-0" />
          <span>تنبيه: الفاتورة مؤجلة السداد لحين اكتمال التوثيق. التحصيل والسداد المالي يتم إلكترونياً ويُدار حصرياً من قِبل إدارة المنظومة ومسؤولي الحسابات.</span>
        </div>
      )}

      {/* 🌟 Special Fee Exemption Box for Responsible Accounts */}
      {isAdminOrFinancial && (
        <div
          className={`p-4 rounded-2xl border-2 transition-all duration-300 ${
            formData.isFeeExempt
              ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-emerald-500/50 shadow-md'
              : 'bg-[var(--input-bg)] border-[var(--border-color)]'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                  formData.isFeeExempt ? 'bg-emerald-500 text-white shadow-sm' : 'bg-emerald-500/10 text-emerald-500'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                    إعفاء النشاط من الرسوم والتحصيل (نشاط رائج ومعلم بالمنطقة)
                  </h4>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-black">
                    صلاحيات الإدارة
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-bold mt-0.5">
                  إزالة التحصيل وتصفير الفاتورة (0 ج.م) واستبعاد النشاط وفواتيره تماماً من الإحصائيات والديون
                </p>
              </div>
            </div>

            {canEdit ? (
              <button
                type="button"
                onClick={() => handleToggleFeeExempt(!formData.isFeeExempt)}
                className={`text-xs font-black px-4 py-2 rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 ${
                  formData.isFeeExempt
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${formData.isFeeExempt ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                <span>{formData.isFeeExempt ? '✓ نشاط معفى (إدراج مجاني)' : 'نشاط تجاري عادي (اضغط للإعفاء)'}</span>
              </button>
            ) : (
              <span
                className={`text-xs font-black px-3 py-1.5 rounded-xl border ${
                  formData.isFeeExempt
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-700/40 text-slate-400 border-slate-600'
                }`}
              >
                {formData.isFeeExempt ? '✓ معفى من التحصيل (مجاني)' : 'نشاط تجاري عادي'}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* الباقة المختارة */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>باقة التوثيق والخدمات</span>
          </span>
          {isEditMode && isAdminOrFinancial ? (
            <select
              value={formData.packageId || (formData.isAlreadyOnGoogle ? ALREADY_ON_GOOGLE_PACKAGE.id : PACKAGES[0].id)}
              onChange={(e) => {
                const val = e.target.value;
                if (val === ALREADY_ON_GOOGLE_PACKAGE.id) {
                  setFormData({
                    ...formData,
                    isFeeExempt: true,
                    isAlreadyOnGoogle: true,
                    packageId: ALREADY_ON_GOOGLE_PACKAGE.id,
                    packageName: ALREADY_ON_GOOGLE_PACKAGE.title,
                    packagePrice: 0,
                    amountPaid: 0,
                    cashCollectedByRep: 0,
                    paymentStatus: 'fully_paid',
                  });
                } else if (val === EXEMPT_PACKAGE.id) {
                  setFormData({
                    ...formData,
                    isFeeExempt: true,
                    packageId: EXEMPT_PACKAGE.id,
                    packageName: EXEMPT_PACKAGE.title,
                    packagePrice: 0,
                    amountPaid: 0,
                    cashCollectedByRep: 0,
                    paymentStatus: 'fully_paid',
                  });
                } else {
                  const pkg = PACKAGES.find((p) => p.id === val);
                  if (pkg) {
                    setFormData({
                      ...formData,
                      isFeeExempt: false,
                      packageId: pkg.id,
                      packageName: pkg.title,
                      packagePrice: pkg.price,
                    });
                  }
                }
              }}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-black text-xs rounded-xl p-2 focus:outline-none focus:border-amber-500 cursor-pointer mt-1"
            >
              <option value={ALREADY_ON_GOOGLE_PACKAGE.id}>
                {ALREADY_ON_GOOGLE_PACKAGE.title} (0 ج.م - مجاناً)
              </option>
              {PACKAGES.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.title} ({pkg.price} ج.م)
                </option>
              ))}
            </select>
          ) : (
            <div className="font-black text-sm text-[var(--text-primary)] pt-0.5">
              {formData.packageName ||
                (formData.isAlreadyOnGoogle
                  ? ALREADY_ON_GOOGLE_PACKAGE.title
                  : formData.isFeeExempt
                  ? 'نشاط رائج بالمنطقة (إدراج مجاني بدون رسوم)'
                  : '1. باقة التوثيق الأساسي')}
            </div>
          )}
        </div>

        {/* سعر الباقة */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>إجمالي قيمة الباقة</span>
          </span>
          <div className="font-black text-base text-[var(--text-primary)] pt-0.5">
            {formData.isFeeExempt ? '0 ج.م (معفى من الرسوم)' : `${formData.packagePrice ?? 250} ج.م`}
          </div>
        </div>

        {/* المبلغ المسدد */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>المبلغ المسدد فعلياً</span>
          </span>
          {isEditMode && isAdminOrFinancial && !formData.isFeeExempt ? (
            <input
              type="number"
              value={formData.amountPaid ?? 0}
              onChange={(e) => {
                const paid = Number(e.target.value) || 0;
                const price = formData.packagePrice || 250;
                const status = paid >= price ? 'fully_paid' : paid > 0 ? 'partially_paid' : 'unpaid';
                setFormData({
                  ...formData,
                  amountPaid: paid,
                  paymentStatus: status,
                });
              }}
              className="w-full bg-[var(--bg-card)] border-2 border-emerald-500 text-emerald-600 font-black text-sm rounded-xl p-2 focus:outline-none shadow-inner mt-1"
            />
          ) : (
            <div className="font-black text-base text-emerald-600 dark:text-emerald-400 pt-0.5">
              {formData.isFeeExempt ? '0 ج.م (معفى)' : `${formData.amountPaid || 0} ج.م`}
            </div>
          )}
        </div>

        {/* المبلغ المتبقي */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 space-y-1">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>المبلغ المتبقي للتحصيل</span>
          </span>
          <div
            className={`font-black text-base pt-0.5 ${
              remainingDebt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'
            }`}
          >
            {formData.isFeeExempt ? '0 ج.م (لا يوجد دين)' : `${remainingDebt} ج.م`}
          </div>
        </div>
      </div>
    </div>
  );
};
