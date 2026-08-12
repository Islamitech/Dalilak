import React, { useState } from 'react';
import { Business, PaymentGatewayConfig } from '../types';
import { CreditCard, QrCode, Phone, CheckCircle2, ShieldCheck, Copy, Check } from 'lucide-react';

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
  const [selectedMethod, setSelectedMethod] = useState<'fawry' | 'vodafone' | 'instapay' | 'card'>('fawry');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [simulatedPayAmount, setSimulatedPayAmount] = useState<number>(remaining || business.packagePrice);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

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
    <div className="fixed inset-0 z-50 bg-[var(--modal-overlay)] backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 modal-overlay">
      <div className="bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 text-[var(--text-primary)] relative modal-content transition-colors duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border border-[var(--border-color)] cursor-pointer"
        >
          ✕
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-2xl mx-auto flex items-center justify-center font-bold border border-amber-500/30">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="font-black text-base text-[var(--text-primary)]">بوابة الدفع الإلكتروني المعتمدة - مصر</h3>
          <p className="text-xs text-[var(--text-muted)]">{business.nameAr} - باقة {business.packageName}</p>
        </div>

        {/* Total remaining breakdown */}
        <div className="bg-[var(--payment-surface)] p-3 rounded-2xl border border-[var(--payment-border)] flex items-center justify-between text-xs">
          <div>
            <span className="text-[var(--text-muted)] block text-[10px]">المبلغ المتبقي للتحصيل:</span>
            <span className="font-black text-rose-500 text-base">{remaining} جنيه مصري</span>
          </div>

          <div className="text-left">
            <span className="text-[var(--text-muted)] block text-[10px]">قيمة الباقة الكاملة:</span>
            <span className="font-bold text-[var(--text-secondary)]">{business.packagePrice} ج.م</span>
          </div>
        </div>

        {/* Payment Methods Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-[var(--payment-surface)] p-1 rounded-2xl border border-[var(--payment-border)] text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setSelectedMethod('fawry')}
            className={`py-2 rounded-xl transition-colors cursor-pointer ${selectedMethod === 'fawry' ? 'bg-amber-500 text-slate-950 font-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            فوري
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethod('vodafone')}
            className={`py-2 rounded-xl transition-colors cursor-pointer ${selectedMethod === 'vodafone' ? 'bg-amber-500 text-slate-950 font-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            فودافون كاش
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethod('instapay')}
            className={`py-2 rounded-xl transition-colors cursor-pointer ${selectedMethod === 'instapay' ? 'bg-amber-500 text-slate-950 font-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            إنستاباي
          </button>
          <button
            type="button"
            onClick={() => setSelectedMethod('card')}
            className={`py-2 rounded-xl transition-colors cursor-pointer ${selectedMethod === 'card' ? 'bg-amber-500 text-slate-950 font-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            فيزا / كارت
          </button>
        </div>

        {/* Method details */}
        <div className="bg-[var(--payment-surface)] p-4 rounded-2xl border border-[var(--payment-border)] space-y-3 text-xs">
          {selectedMethod === 'fawry' && (
            <div className="space-y-2">
              <p className="text-[var(--text-secondary)] font-bold">الدفع عبر منافذ فوري في جميع أنحاء مصر:</p>
              <div className="flex items-center justify-between bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] font-mono text-amber-600 dark:text-amber-300">
                <span>كود التاجر: {config.fawryMerchantCode}</span>
                <button onClick={() => handleCopy(config.fawryMerchantCode, 'fawry')} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  {copiedCode === 'fawry' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">توجه لأقرب منفذ فوري واطلب الدفع لكود خدمة دليلك مع إعطاء الماكينة رقم الهاتف.</p>
            </div>
          )}

          {selectedMethod === 'vodafone' && (
            <div className="space-y-2">
              <p className="text-[var(--text-secondary)] font-bold">التحويل المباشر عبر محفظة فودافون كاش:</p>
              <div className="flex items-center justify-between bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] font-mono text-emerald-600 dark:text-emerald-400 dir-ltr">
                <span>{config.vodafoneCashNumber}</span>
                <button onClick={() => handleCopy(config.vodafoneCashNumber, 'voda')} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  {copiedCode === 'voda' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">قم بتحويل المبلغ إلى الرقم أعلاه وتأكيد العملية فوراً مع مندوب الشركة.</p>
            </div>
          )}

          {selectedMethod === 'instapay' && (
            <div className="space-y-2">
              <p className="text-[var(--text-secondary)] font-bold">التحويل اللحظي عبر تطبيق إنستاباي InstaPay:</p>
              <div className="flex items-center justify-between bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] font-mono text-purple-600 dark:text-purple-300 dir-ltr">
                <span>{config.instaPayHandle}</span>
                <button onClick={() => handleCopy(config.instaPayHandle, 'insta')} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  {copiedCode === 'insta' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {selectedMethod === 'card' && (
            <div className="space-y-2">
              <p className="text-[var(--text-secondary)] font-bold">الدفع أونلاين ببطاقات ميزة / فيزا / ماستركارد:</p>
              <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-[var(--border-color)] text-center text-[var(--text-muted)] text-[11px]">
                تكامل آمن مشفر ببطاقات الخصم والائتمان المحلية
              </div>
            </div>
          )}

          {/* Amount to simulate payment */}
          <div className="pt-2 border-t border-[var(--border-color)] space-y-1">
            <label className="block font-bold text-[var(--text-secondary)]">أدخل المبلغ المراد إثبات دفعه الآن (ج.م):</label>
            <input
              type="number"
              min="1"
              max={remaining || business.packagePrice}
              value={simulatedPayAmount}
              onChange={(e) => setSimulatedPayAmount(Number(e.target.value))}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-600 dark:text-amber-400 font-black rounded-xl p-2.5 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfirmSimulatedPayment}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-black text-xs py-3.5 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>{isProcessing ? 'جاري معالجة وتأكيد العملية...' : 'تأكيد استلام الدفعة وإصدار الفاتورة'}</span>
        </button>
      </div>
    </div>
  );
};
