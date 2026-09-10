import React from 'react';
import { MapPin, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Representative, PackageOption, PaymentStatus } from '../../types';
import { PACKAGES, EXEMPT_PACKAGE } from '../../data/mockData';

interface FormPackageSelectorProps {
  registrationType: 'new_verification' | 'already_on_google' | 'interested_lead';
  currentRep: Representative | null;
  canExempt: boolean;
  isFeeExempt: boolean;
  setIsFeeExempt: (val: boolean) => void;
  setSelectedPackage: (pkg: PackageOption) => void;
  setAmountPaid: (amt: number) => void;
  setPaymentStatus: (st: PaymentStatus) => void;
}

export const FormPackageSelector: React.FC<FormPackageSelectorProps> = ({
  registrationType,
  currentRep,
  canExempt,
  isFeeExempt,
  setIsFeeExempt,
  setSelectedPackage,
  setAmountPaid,
  setPaymentStatus,
}) => {
  return (
    <>
      {/* 5. باقات التوثيق والخدمات */}
      {registrationType === 'already_on_google' ? (
        <div className="bg-gradient-to-br from-blue-500/10 via-[var(--bg-card)] to-indigo-500/10 border-2 border-blue-500/40 rounded-3xl p-4 sm:p-5 space-y-3 shadow-md text-right">
          <div className="flex items-center gap-2.5 text-blue-500 border-b border-[var(--border-color)] pb-2.5">
            <MapPin className="w-5 h-5" />
            <h3 className="font-black text-sm text-[var(--text-primary)]">
              باقة الإدراج الميداني للأنشطة المسجلة بالفعل على Google Maps
            </h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
            هذا النشاط قائم بالفعل في الشارع ومفعل على خرائط Google. يتم إدراجه في دليل المنظومة كنشاط موثق رسمياً <strong className="text-blue-600 font-bold">(إدراج مجاني 0 ج.م بدون أي مديونية أو عمولات)</strong> مع توليد فاتورة ترحيبية فورية وإشعار انضمام.
          </p>
          <div className="flex items-center gap-2 pt-1 text-xs font-bold text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>قيد المراجعة والاعتماد للرفع على الدليل من قبل الإدارة (0 ج.م)</span>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-md transition-colors duration-300">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2 text-amber-500">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">5. باقة التوثيق الميداني المعتمدة</h3>
            </div>
            <span className="text-xs font-black text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1 rounded-xl shadow-xs">
              250 ج.م (الباقة الأساسية)
            </span>
          </div>

          <div className="bg-gradient-to-br from-amber-500/15 via-[var(--bg-card)] to-yellow-500/10 border-2 border-amber-500/50 rounded-2xl p-4 space-y-2 text-right shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm">
                  1
                </div>
                <span className="font-black text-sm text-[var(--text-primary)]">باقة التوثيق الأساسي لخرائط Google</span>
              </div>
              <span className="font-mono font-black text-base text-amber-600">250 ج.م</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
              التفعيل الميداني الرسمي واستخراج الإحداثيات الدقيقة على خرائط Google، تثبيت مواعيد العمل والهواتف، ورفع الصور مع إصدار الفاتورة المعتمدة وهدية تصميم باركود QR.
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-[11px] font-bold text-amber-700">
              <span>عمولة المندوب المعتمدة:</span>
              <span className="font-mono font-black">+{Math.round((250 * (currentRep?.commissionRate || 42.86)) / 100)} ج.م</span>
              <span className="text-[10px] text-[var(--text-muted)]">(تتاح الباقات الإضافية للتطوير والترقية لاحقاً من قسم التفاصيل)</span>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 Admin/Manager Special Feature: Fee-Exempt Popular Area Landmark/Activity */}
      {canExempt && (
        <div className={`p-4 sm:p-5 rounded-3xl border-2 transition-all duration-300 ${
          isFeeExempt
            ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-emerald-500/60 shadow-lg'
            : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-emerald-500/30'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                isFeeExempt ? 'bg-emerald-500 text-white shadow-md' : 'bg-emerald-500/10 text-emerald-500'
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                    منشأة رائجة ومعلم بالمنطقة (إدراج مجاني بدون مقابل مالي)
                  </h4>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-700 px-2 py-0.5 rounded-full font-black">
                    خاص بالإدارة
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-bold mt-0.5">
                  المنشآت ذات الرواج والشهرة العالية في المنطقة لإثراء الدليل مجاناً (فاتورة 0 ج.م - لا تحتسب ضمن الإحصائيات)
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isFeeExempt}
                onChange={(e) => {
                  const val = e.target.checked;
                  setIsFeeExempt(val);
                  if (val) {
                    setSelectedPackage(EXEMPT_PACKAGE);
                    setAmountPaid(0);
                    setPaymentStatus('fully_paid');
                  } else {
                    setSelectedPackage(PACKAGES[0]);
                    setAmountPaid(PACKAGES[0].price);
                    setPaymentStatus('fully_paid');
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 shadow-inner"></div>
            </label>
          </div>
        </div>
      )}
    </>
  );
};
