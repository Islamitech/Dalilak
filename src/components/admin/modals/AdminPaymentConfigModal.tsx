import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PaymentGatewayConfig } from '../../../types';
import { CreditCard } from 'lucide-react';

interface AdminPaymentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentConfig: PaymentGatewayConfig;
  onUpdatePaymentConfig: (config: PaymentGatewayConfig) => void;
}

export const AdminPaymentConfigModal: React.FC<AdminPaymentConfigModalProps> = ({
  isOpen,
  onClose,
  paymentConfig,
  onUpdatePaymentConfig,
}) => {
  const [vodaNumber, setVodaNumber] = useState<string>('');
  const [vodaNumber2, setVodaNumber2] = useState<string>('');
  const [instaHandle, setInstaHandle] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setVodaNumber(paymentConfig.vodafoneCashNumber || '01143888355');
      setVodaNumber2(paymentConfig.vodafoneCashNumber2 || '01556221141');
      setInstaHandle(paymentConfig.instaPayHandle || '@daz31181');
    }
  }, [isOpen, paymentConfig]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePaymentConfig({
      ...paymentConfig,
      vodafoneCashNumber: vodaNumber.trim() || '01143888355',
      vodafoneCashNumber2: vodaNumber2.trim() || '01556221141',
      instaPayHandle: instaHandle.trim() || '@daz31181',
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 text-xs my-auto text-[var(--text-primary)] shadow-2xl transition-colors duration-300 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h3 className="font-black text-base text-[var(--text-primary)] flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <span>تعديل محافظ التحويل الإلكتروني</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[var(--text-primary)] font-extrabold mb-1">
              رقم المحفظة الرئيسي (1) - فودافون كاش / اتصالات / وي / أورانج:
            </label>
            <input
              type="tel"
              required
              placeholder="01143888355"
              value={vodaNumber}
              onChange={(e) => setVodaNumber(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-emerald-700 dark:text-emerald-300 font-mono font-black rounded-xl p-3 focus:outline-none focus:border-amber-500 dir-ltr text-right shadow-xs"
            />
          </div>

          <div>
            <label className="block text-[var(--text-primary)] font-extrabold mb-1">
              معرف / حساب إنستاباي الرسمي (InstaPay Handle / IPA):
            </label>
            <input
              type="text"
              placeholder="@daz31181"
              value={instaHandle}
              onChange={(e) => setInstaHandle(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-purple-500/40 text-purple-700 dark:text-purple-300 font-mono font-black rounded-xl p-3 focus:outline-none focus:border-purple-500 dir-ltr text-right shadow-xs"
            />
            <span className="text-[10.5px] text-[var(--text-muted)] font-bold mt-0.5 block">
              مثال: @daz31181 لاستقبال التحويلات اللحظية من تطبيق InstaPay
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold px-4 py-2 rounded-xl border border-[var(--border-color)] cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-2 rounded-xl shadow cursor-pointer"
          >
            حفظ الأرقام
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
};
