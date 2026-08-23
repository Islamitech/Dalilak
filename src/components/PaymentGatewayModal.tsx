import React, { useState } from 'react';
import { Business, PaymentGatewayConfig } from '../types';
import { CreditCard, Phone, CheckCircle2, ShieldCheck, Copy, Check, AlertTriangle, Sparkles, Smartphone, Layers, Clock } from 'lucide-react';

interface PaymentGatewayModalProps {
  business: Business;
  config: PaymentGatewayConfig;
  onClose: () => void;
  onPaymentSuccess: (amountPaid: number) => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  business,
  config,
  onClose,
  onPaymentSuccess,
}) => {
  const remaining = Math.max(0, business.packagePrice - business.amountPaid);
  // Default to vodafone cash as it is the only active payment method
  const [selectedMethod, setSelectedMethod] = useState<'vodafone' | 'fawry' | 'instapay' | 'card'>('vodafone');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [simulatedPayAmount, setSimulatedPayAmount] = useState<number>(remaining || business.packagePrice);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const activeVodafoneNumber = config.vodafoneCashNumber || '01143888355';

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleConfirmSimulatedPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess(business.amountPaid + Number(simulatedPayAmount));
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--modal-overlay)] backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 modal-overlay overflow-y-auto">
      <div className="bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 text-[var(--text-primary)] relative modal-content transition-colors duration-300 my-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-[var(--border-color)] cursor-pointer transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center space-y-1 pt-1">
          <div className="w-12 h-12 bg-emerald-500/15 text-emerald-500 rounded-2xl mx-auto flex items-center justify-center font-bold border border-emerald-500/30">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)]">بوابة الدفع والتحصيل المعتمدة - مصر</h3>
          <p className="text-xs text-[var(--text-muted)]">{business.nameAr} - باقة {business.packageName}</p>
        </div>

        {/* Total remaining breakdown */}
        <div className="bg-[var(--payment-surface)] p-3.5 rounded-2xl border border-[var(--payment-border)] flex items-center justify-between text-xs">
          <div>
            <span className="text-[var(--text-muted)] block text-[10px]">المبلغ المتبقي للتحصيل:</span>
            <span className="font-black text-rose-500 text-base">{remaining} جنيه مصري</span>
          </div>

          <div className="text-left">
            <span className="text-[var(--text-muted)] block text-[10px]">قيمة الباقة الكاملة:</span>
            <span className="font-bold text-[var(--text-secondary)]">{business.packagePrice} ج.م</span>
          </div>
        </div>

        {/* Notice: Sole Active Method */}
        <div className="bg-emerald-500/10 border border-emerald-500/25 p-2.5 rounded-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>طريقة الدفع المعتمدة والمفعلة حالياً هي محفظة <strong>فودافون كاش</strong>. باقي الوسائل قيد التطوير والتفعيل قريباً.</span>
        </div>

        {/* Payment Methods Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[var(--payment-surface)] p-1.5 rounded-2xl border border-[var(--payment-border)] text-[11px] font-bold">
          {/* Vodafone Cash - Sole Active */}
          <button
            type="button"
            onClick={() => setSelectedMethod('vodafone')}
            className={`py-2 px-1.5 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
              selectedMethod === 'vodafone'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black shadow-md'
                : 'text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>فودافون كاش</span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-black ${
                selectedMethod === 'vodafone' ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}>مفعل</span>
            </div>
          </button>

          {/* Fawry - Under Development */}
          <button
            type="button"
            onClick={() => setSelectedMethod('fawry')}
            className={`py-2 px-1.5 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
              selectedMethod === 'fawry'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-300 font-black'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-75'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>فوري</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1 py-0.2 rounded">قيد التطوير</span>
            </div>
          </button>

          {/* InstaPay - Under Development */}
          <button
            type="button"
            onClick={() => setSelectedMethod('instapay')}
            className={`py-2 px-1.5 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
              selectedMethod === 'instapay'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-300 font-black'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-75'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>إنستاباي</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1 py-0.2 rounded">قيد التطوير</span>
            </div>
          </button>

          {/* Card / Visa - Under Development */}
          <button
            type="button"
            onClick={() => setSelectedMethod('card')}
            className={`py-2 px-1.5 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
              selectedMethod === 'card'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-300 font-black'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-75'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>فيزا / كارت</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1 py-0.2 rounded">قيد التطوير</span>
            </div>
          </button>
        </div>

        {/* Method details */}
        <div className="bg-[var(--payment-surface)] p-4 rounded-2xl border border-[var(--payment-border)] space-y-3 text-xs">
          {/* 1. VODAFONE CASH (ACTIVE) */}
          {selectedMethod === 'vodafone' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[var(--text-secondary)] font-bold">التحويل المباشر عبر محفظة فودافون كاش المعتمدة:</p>
                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-md">
                  الوسيلة المعتمدة حالياً
                </span>
              </div>

              <div className="flex items-center justify-between bg-[var(--input-bg)] p-3 rounded-xl border border-emerald-500/30 font-mono text-emerald-600 dark:text-emerald-400 shadow-sm">
                <div className="text-right">
                  <span className="text-[10px] text-[var(--text-muted)] block font-sans">رقم فودافون كاش للتحويل:</span>
                  <span className="text-base font-black tracking-wider dir-ltr inline-block">{activeVodafoneNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(activeVodafoneNumber, 'voda')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all shadow active:scale-95"
                >
                  {copiedCode === 'voda' ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الرقم</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] space-y-1 text-[11px] text-[var(--text-secondary)]">
                <p className="font-bold text-[var(--text-primary)]">📌 خطوات التحويل والتأكيد:</p>
                <p>1. قم بطلب كود التحويل من محفظتك: <strong>*9*7*{activeVodafoneNumber}*المبلغ#</strong></p>
                <p>2. أو قم بالتحويل المباشر من تطبيق أنا فودافون إلى الرقم <strong>{activeVodafoneNumber}</strong>.</p>
                <p>3. احتفظ برسالة التأكيد، وأدخل المبلغ المحصل أدناه لإصدار الفاتورة وتحديث حالة النشاط.</p>
              </div>
            </div>
          )}

          {/* 2. FAWRY (UNDER DEVELOPMENT) */}
          {selectedMethod === 'fawry' && (
            <div className="space-y-2.5">
              <div className="bg-amber-500/15 border border-amber-500/30 p-3 rounded-xl space-y-1.5 text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-1.5 font-black text-xs">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>خدمة الدفع عبر فوري قيد التطوير والربط البرمجي</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  يتم حالياً استكمال الربط المباشر مع شبكة فوري (Fawry). برجاء استخدام محفظة <strong>فودافون كاش ({activeVodafoneNumber})</strong> كوسيلة دفع معتمدة حالياً.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMethod('vodafone')}
                className="w-full bg-[var(--input-bg)] hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold p-2.5 rounded-xl border border-emerald-500/30 text-center cursor-pointer transition-colors text-xs"
              >
                التحويل الآن عبر فودافون كاش ({activeVodafoneNumber}) ←
              </button>
            </div>
          )}

          {/* 3. INSTAPAY (UNDER DEVELOPMENT) */}
          {selectedMethod === 'instapay' && (
            <div className="space-y-2.5">
              <div className="bg-amber-500/15 border border-amber-500/30 p-3 rounded-xl space-y-1.5 text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-1.5 font-black text-xs">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>خدمة إنستاباي (InstaPay) قيد التطوير والاعتماد</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  جاري إتمام الربط الآلي مع منظومة المدفوعات اللحظية إنستاباي. يرجى سداد المبلغ عبر محفظة <strong>فودافون كاش ({activeVodafoneNumber})</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMethod('vodafone')}
                className="w-full bg-[var(--input-bg)] hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold p-2.5 rounded-xl border border-emerald-500/30 text-center cursor-pointer transition-colors text-xs"
              >
                التحويل الآن عبر فودافون كاش ({activeVodafoneNumber}) ←
              </button>
            </div>
          )}

          {/* 4. VISA / MASTERCARD (UNDER DEVELOPMENT) */}
          {selectedMethod === 'card' && (
            <div className="space-y-2.5">
              <div className="bg-amber-500/15 border border-amber-500/30 p-3 rounded-xl space-y-1.5 text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-1.5 font-black text-xs">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>الدفع ببطاقات فيزا / ميزة / ماستركارد قيد التطوير</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  بوابة الدفع المباشر بالبطاقات البنكية قيد المراجعة الأمنية والربط البنكي. يرجى استخدام محفظة <strong>فودافون كاش ({activeVodafoneNumber})</strong> حالياً.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMethod('vodafone')}
                className="w-full bg-[var(--input-bg)] hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold p-2.5 rounded-xl border border-emerald-500/30 text-center cursor-pointer transition-colors text-xs"
              >
                التحويل الآن عبر فودافون كاش ({activeVodafoneNumber}) ←
              </button>
            </div>
          )}

          {/* Amount to register payment */}
          <div className="pt-2 border-t border-[var(--border-color)] space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-[var(--text-secondary)]">أدخل المبلغ المحول عبر فودافون كاش (ج.م):</label>
              {remaining === 0 && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black px-2 py-0.5 rounded-full">
                  مسددة بالكامل
                </span>
              )}
            </div>
            <input
              type="number"
              min="1"
              max={remaining > 0 ? remaining : business.packagePrice}
              value={simulatedPayAmount}
              disabled={remaining === 0}
              onChange={(e) => setSimulatedPayAmount(Math.max(0, Number(e.target.value)))}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-emerald-600 dark:text-emerald-400 font-black rounded-xl p-2.5 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50 shadow-inner"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleConfirmSimulatedPayment}
          disabled={isProcessing || remaining === 0 || simulatedPayAmount <= 0}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-black text-xs py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>
            {isProcessing
              ? 'جاري تأكيد التحويل وتحديث الفاتورة...'
              : remaining === 0
              ? 'الفاتورة مسددة بالكامل'
              : `تأكيد استلام تحويل ${simulatedPayAmount} ج.م عبر فودافون كاش`}
          </span>
        </button>
      </div>
    </div>
  );
};
