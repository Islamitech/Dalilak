import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Representative, PayoutRequest, PayoutMethod } from '../types';
import { PAYOUT_METHOD_LABELS } from '../utils/commission';
import { 
  DollarSign, 
  Send, 
  X, 
  AlertCircle, 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  Info 
} from 'lucide-react';

interface RequestPayoutModalProps {
  rep: Representative;
  availableBalance: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmitPayout: (request: PayoutRequest) => void;
}

export const RequestPayoutModal: React.FC<RequestPayoutModalProps> = ({
  rep,
  availableBalance,
  isOpen,
  onClose,
  onSubmitPayout,
}) => {
  const [amount, setAmount] = useState<number>(availableBalance);
  const [method, setMethod] = useState<PayoutMethod>('vodafone_cash');
  const [accountDetails, setAccountDetails] = useState<string>(rep.phone || '');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg('يرجى إدخال مبلغ صحيح للطلب.');
      return;
    }

    if (numAmount > availableBalance) {
      setErrorMsg(`المبلغ المطلوب (${numAmount} ج.م) يتجاوز رصيدك المتاح للسحب (${availableBalance} ج.م).`);
      return;
    }

    if (!accountDetails.trim()) {
      setErrorMsg('يرجى كتابة رقم المحفظة الإلكترونية أو معرف إنستاباي أو الحساب.');
      return;
    }

    setIsSubmitting(true);

    const newRequest: PayoutRequest = {
      id: `payout_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      repId: rep.id,
      repName: rep.name,
      repPhone: rep.phone,
      amount: numAmount,
      method,
      accountDetails: accountDetails.trim(),
      status: 'pending',
      requestDate: new Date().toISOString(),
      adminNotes: notes.trim() || undefined,
    };

    onSubmitPayout(newRequest);
    setIsSubmitting(false);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div 
        className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl max-w-lg w-full shadow-2xl text-[var(--text-primary)] flex flex-col overflow-hidden relative animate-fade-in"
        style={{ maxHeight: '92vh' }}
      >
        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border-color)] shrink-0 bg-[var(--bg-card)]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)]">
                طلب سحب وتحويل الأرباح والعمولات 💵
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">
                التحويل المباشر عبر المحافظ الإلكترونية وحسابات إنستاباي في مصر
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center transition-colors text-xs font-bold border border-[var(--border-color)] cursor-pointer shrink-0"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── SCROLLABLE BODY ──────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
          {/* Available Balance Box */}
          <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 block">
                  الرصيد المتاح للسحب حالياً:
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                  مستحقات الأنشطة المسددة وعمولات شبكة الإحالة
                </span>
              </div>
            </div>
            <div className="text-left shrink-0">
              <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {availableBalance.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mr-1">ج.م</span>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 p-3 rounded-xl flex items-center gap-2 text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Amount to Withdraw */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-[var(--text-primary)]">
                المبلغ المراد سحبه (بالجنيه المصري) *
              </label>
              <button
                type="button"
                onClick={() => setAmount(availableBalance)}
                className="text-[11px] text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
              >
                سحب الرصيد كاملاً ({availableBalance} ج.م)
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                max={availableBalance}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 font-mono font-black text-sm text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
                placeholder="أدخل المبلغ..."
              />
              <span className="absolute left-3 top-3 text-xs font-bold text-[var(--text-muted)]">ج.م</span>
            </div>
          </div>

          {/* Payout Method */}
          <div>
            <label className="block font-bold text-[var(--text-primary)] mb-1.5">
              وسيلة الاستلام والتحويل *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(PAYOUT_METHOD_LABELS) as PayoutMethod[]).map((m) => {
                const isSelected = method === m;
                const isCashAtHq = m === 'cash';

                return (
                  <button
                    type="button"
                    key={m}
                    onClick={() => {
                      setMethod(m);
                      if (m === 'cash' && !accountDetails) {
                        setAccountDetails(`${rep.name} — ر.ق: ${rep.nationalId || ''}`);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-right font-bold text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                      isCashAtHq ? 'sm:col-span-2 justify-center' : ''
                    } ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/40 shadow-sm font-black'
                        : 'bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-primary)] hover:border-amber-500/40 hover:bg-amber-500/5'
                    }`}
                  >
                    {m === 'instapay' ? (
                      <Smartphone className="w-4 h-4 text-purple-500 shrink-0" />
                    ) : m === 'vodafone_cash' ? (
                      <CreditCard className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : m === 'orange_cash' ? (
                      <CreditCard className="w-4 h-4 text-orange-500 shrink-0" />
                    ) : m === 'etisalat_cash' ? (
                      <CreditCard className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : m === 'we_pay' ? (
                      <CreditCard className="w-4 h-4 text-indigo-500 shrink-0" />
                    ) : m === 'bank_transfer' ? (
                      <CreditCard className="w-4 h-4 text-blue-500 shrink-0" />
                    ) : (
                      <DollarSign className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span className="truncate">{PAYOUT_METHOD_LABELS[m]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account / Wallet Details */}
          <div>
            <label className="block font-bold text-[var(--text-primary)] mb-1">
              {method === 'cash'
                ? 'بيانات المستلم لاستلام الكاش من المقر *'
                : 'رقم المحفظة / معرف إنستاباي / تفاصيل الحساب *'}
            </label>
            <input
              type="text"
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              required
              placeholder={
                method === 'cash'
                  ? 'اسم المستلم بالكامل والرقم القومي...'
                  : method === 'instapay'
                  ? 'username@instapay أو رقم الهاتف المسجل'
                  : 'مثال: 01012345678'
              }
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 font-bold text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium">
              {method === 'cash'
                ? 'يرجى إبراز بطاقة الرقم القومي الأصلية عند الاستلام من مقر الشركة.'
                : 'تأكد من صحة رقم المحفظة أو معرف إنستاباي لتجنب أي تأخير في التحويل.'}
            </p>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block font-bold text-[var(--text-primary)] mb-1">
              ملاحظة إضافية للإدارة (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي تفاصيل أو ملاحظات تود توضيحها..."
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* ── FOOTER ACTIONS ────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-secondary)] font-bold px-4 py-2 rounded-xl cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || availableBalance <= 0}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>إرسال طلب السحب للإدارة</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
