import React from 'react';
import { PaymentGatewayConfig } from '../../../types';
import { CreditCard, Settings } from 'lucide-react';

interface AdminGatewaysTabProps {
  paymentConfig: PaymentGatewayConfig;
  onOpenPaymentModal: () => void;
}

export const AdminGatewaysTab: React.FC<AdminGatewaysTabProps> = ({
  paymentConfig,
  onOpenPaymentModal,
}) => {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs max-w-2xl mx-auto animate-fade-in transition-colors duration-300">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center gap-2 text-amber-500">
          <CreditCard className="w-5 h-5" />
          <h3 className="font-black text-base text-[var(--text-primary)]">إعدادات وسائل وبوابات الدفع الإلكتروني</h3>
        </div>

        <button
          onClick={onOpenPaymentModal}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-2xl shadow flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
        >
          <Settings className="w-4 h-4" />
          <span>تعديل أرقام المحافظ وإنستاباي</span>
        </button>
      </div>

      <div className="space-y-3 text-xs">
        {/* 1. Vodafone Cash / Wallets */}
        <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-primary)] font-extrabold block">محافظ التحويل الإلكتروني المعتمدة (فودافون كاش / اتصالات / وي / أورانج):</span>
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                مفعلة للاستلام
              </span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-black px-3 py-1.5 rounded-xl border border-emerald-500/30">
              E-Wallets
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block font-bold">رقم المحفظة الرئيسي (1):</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-mono font-black text-base dir-ltr text-right inline-block">
                  {paymentConfig.vodafoneCashNumber || '01143888355'}
                </span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">رئيسي</span>
            </div>

            <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block font-bold">رقم المحفظة الإضافي (2):</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-mono font-black text-base dir-ltr text-right inline-block">
                  {paymentConfig.vodafoneCashNumber2 || '01556221141'}
                </span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">إضافي</span>
            </div>
          </div>
        </div>

        {/* 2. InstaPay */}
        <div className="bg-purple-500/10 p-4 rounded-2xl border border-purple-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-primary)] font-extrabold block">شبكة المدفوعات اللحظية إنستاباي (InstaPay Egypt):</span>
              <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                مفعلة للاستلام
              </span>
            </div>
            <span className="bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-black px-3 py-1.5 rounded-xl border border-purple-500/30">
              InstaPay
            </span>
          </div>

          <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-purple-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block font-bold">معرف إنستاباي المعتمد (IPA / Username):</span>
              <span className="text-purple-700 dark:text-purple-300 font-mono font-black text-base dir-ltr text-right inline-block">
                {paymentConfig.instaPayHandle || '@daz31181'}
              </span>
            </div>
            <span className="text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-md">حساب رسمي معتمد</span>
          </div>
        </div>

        {/* 3. Fawry */}
        <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)] flex items-center justify-between opacity-80">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-primary)] font-extrabold block">خدمة الدفع عبر شبكة فوري (Fawry Merchant / FawryPay):</span>
              <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/30">
                قيد التطوير والربط
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">جاري الربط البرمجي المباشر مع كود التاجر بشبكة فوري</p>
          </div>
          <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-500/30">
            فوري Fawry
          </span>
        </div>
      </div>
    </div>
  );
};
