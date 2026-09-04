import React from 'react';
import { createPortal } from 'react-dom';
import { Representative } from '../../types';
import { CreditCard, ShieldCheck, CheckCircle2, X, Clock } from 'lucide-react';

interface BusinessPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  nameAr: string;
  ownerName: string;
  ownerPhone: string;
  selectedPackage: any;
  isFeeExempt: boolean;
  paymentStatus: 'unpaid' | 'partially_paid' | 'fully_paid';
  setPaymentStatus: (status: 'unpaid' | 'partially_paid' | 'fully_paid') => void;
  amountPaid: number;
  setAmountPaid: (amount: number) => void;
  paymentMethod: string;
  setPaymentMethod: (method: any) => void;
  notes: string;
  setNotes: (notes: string) => void;
  currentRep?: Representative | null;
  onConfirmPayment: () => void;
}

export const BusinessPaymentModal: React.FC<BusinessPaymentModalProps> = ({
  isOpen,
  onClose,
  nameAr,
  ownerName,
  ownerPhone,
  selectedPackage,
  isFeeExempt,
  paymentStatus,
  setPaymentStatus,
  amountPaid,
  setAmountPaid,
  paymentMethod,
  setPaymentMethod,
  notes,
  setNotes,
  currentRep,
  onConfirmPayment,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
      dir="rtl"
    >
      <div className="bg-[var(--bg-card)] border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-5 text-xs text-[var(--text-primary)] shadow-2xl animate-fade-in-scale my-auto max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)]">
                تأكيد حالة الدفع والتحصيل المالي
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-bold">
                يرجى مراجعة وتحديد حالة سداد الفاتورة بدقة قبل الحفظ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--input-bg)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center font-bold transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Business Summary Card */}
        <div className="bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[var(--text-muted)] font-bold">النشاط:</span>
            <span className="font-black text-[var(--text-primary)] text-sm">{nameAr}</span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-[var(--text-muted)] font-bold">صاحب النشاط:</span>
            <span className="font-bold text-[var(--text-primary)]">
              {ownerName} ({ownerPhone})
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-[var(--border-color)]">
            <span className="text-amber-500 font-bold">الباقة المختارة:</span>
            <span className="font-black text-amber-500 font-mono text-sm">
              {selectedPackage.title} ({selectedPackage.price} ج.م)
            </span>
          </div>
        </div>

        {/* Payment Status / Exemption Box */}
        {isFeeExempt ? (
          <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-2 border-emerald-500/40 rounded-2xl p-4 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-black text-sm text-emerald-800 dark:text-emerald-300">
              نشاط رائج بالمنطقة (إدراج مجاني معفى من الرسوم - 0 ج.م)
            </h4>
            <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
              تم إعفاء هذا النشاط بقرار إداري. لا توجد أي مديونية أو مبالغ مستحقة للتحصيل أو عمولات.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* Payment Status Radio Cards */}
            <div>
              <label className="block font-bold mb-1.5 text-[var(--text-secondary)]">
                حالة التحصيل المالي:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('fully_paid');
                    setAmountPaid(selectedPackage.price);
                  }}
                  className={`p-3 rounded-2xl border-2 font-black text-center transition-all cursor-pointer shadow-xs ${
                    paymentStatus === 'fully_paid'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-emerald-500/40'
                  }`}
                >
                  <div className="text-base mb-0.5">✅</div>
                  <div>مسدد بالكامل</div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    ({selectedPackage.price} ج)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('partially_paid');
                    setAmountPaid(Math.round(selectedPackage.price / 2));
                  }}
                  className={`p-3 rounded-2xl border-2 font-black text-center transition-all cursor-pointer shadow-xs ${
                    paymentStatus === 'partially_paid'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                      : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-amber-500/40'
                  }`}
                >
                  <div className="text-base mb-0.5">⏳</div>
                  <div>دفعة مقدمة</div>
                  <div className="text-[10px] opacity-80 mt-0.5">عربون جزء من المبلغ</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus('unpaid');
                    setAmountPaid(0);
                    setPaymentMethod('gateway_online');
                  }}
                  className={`p-3 rounded-2xl border-2 font-black text-center transition-all cursor-pointer shadow-xs ${
                    paymentStatus === 'unpaid'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                      : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-rose-500/40'
                  }`}
                >
                  <div className="text-base mb-0.5">⏱️</div>
                  <div>الدفع عند التوثيق</div>
                  <div className="text-[10px] opacity-80 mt-0.5">بعد اكتمال الرابط</div>
                </button>
              </div>
            </div>

            {/* Custom Amount for Partial Payments */}
            {paymentStatus === 'partially_paid' && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl space-y-1.5 animate-fade-in">
                <label className="block text-xs font-bold text-amber-800 dark:text-amber-300">
                  المبلغ المحصل فعلياً بالجنيه (عربون):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={selectedPackage.price}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full bg-[var(--input-bg)] border border-amber-500 font-mono font-black text-base rounded-xl p-2.5 text-center focus:outline-none"
                  />
                  <span className="font-bold text-xs text-[var(--text-muted)] shrink-0">
                    متبقي: {selectedPackage.price - amountPaid} ج.م
                  </span>
                </div>
              </div>
            )}

            {/* Payment Method Selector & Financial Summary (Hidden when unpaid/deferred) */}
            {paymentStatus === 'unpaid' ? (
              <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-2 border-amber-500/40 rounded-2xl p-4 sm:p-5 text-center space-y-2.5 animate-fade-in shadow-xs">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="font-black text-sm sm:text-base text-amber-800 dark:text-amber-300">
                  تنبيه: الفاتورة مؤجلة السداد حتى توثيق النشاط ⏳
                </h4>
                <p className="text-xs text-[var(--text-secondary)] font-bold leading-relaxed max-w-md mx-auto">
                  تم تأجيل سداد الفاتورة حتى يتم توثيق النشاط التجاري واكتمال اعتماده وربطه رسمياً على خرائط Google.
                </p>
                <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)] text-[11px] font-bold text-sky-600 dark:text-sky-400 flex items-center justify-center gap-1.5 flex-wrap">
                  <span>💳 طريقة السداد التلقائية:</span>
                  <span className="font-black">تحويل إلكتروني مباشر للمنصة بعد اكتمال التوثيق ({selectedPackage.price} ج.م)</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 animate-fade-in">
                {/* Payment Method Selector */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-[var(--text-secondary)]">
                    طريقة استلام وسداد المبلغ:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div
                      onClick={() => setPaymentMethod('gateway_online')}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between shadow-xs ${
                        paymentMethod === 'gateway_online'
                          ? 'bg-blue-500/15 border-blue-500 ring-2 ring-blue-500/20 text-blue-800 dark:text-blue-300'
                          : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-blue-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                            paymentMethod === 'gateway_online'
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-500/10 text-blue-500'
                          }`}
                        >
                          💳
                        </div>
                        <div>
                          <div className="font-black text-xs">تحويل إلكتروني مباشر للمنصة</div>
                          <div className="text-[10px] opacity-80">
                            فودافون كاش / إنستاباي / بطاقة بنكية
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-[var(--border-color)] text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
                        ✨ عمولتك كاملة في رصيدك فوراً بدون عهدة
                      </div>
                    </div>

                    <div
                      onClick={() => setPaymentMethod('cash_by_rep')}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between shadow-xs ${
                        paymentMethod === 'cash_by_rep'
                          ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/20 text-amber-800 dark:text-amber-300'
                          : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                            paymentMethod === 'cash_by_rep'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}
                        >
                          💵
                        </div>
                        <div>
                          <div className="font-black text-xs">كاش بيدك في الميدان</div>
                          <div className="text-[10px] opacity-80">
                            استلمت المبلغ نقداً من العميل بيدك
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-[var(--border-color)] text-[10.5px] font-bold text-amber-700 dark:text-amber-400">
                        ⚠️ أخذت عمولتك بيدك وتلتزم بتوريد حصة المنصة
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Commission & Platform Share Calculation */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-[var(--text-primary)]">
                      الموقف المالي ({currentRep?.commissionRate || 42.86}%):
                    </span>
                    <span className="bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                      المحصل: {amountPaid} ج.م
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)]">
                      <span className="text-[10px] text-[var(--text-muted)] block font-bold">
                        عمولتك المعتمدة:
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black font-mono text-sm">
                        +{Math.round((amountPaid * (currentRep?.commissionRate || 42.86)) / 100)} ج.م
                      </span>
                    </div>

                    <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)]">
                      <span className="text-[10px] text-[var(--text-muted)] block font-bold">
                        {paymentMethod === 'cash_by_rep' ? 'مطلوب توريده للمنصة:' : 'كاش استلمته بيدك:'}
                      </span>
                      <span
                        className={`font-black font-mono text-sm ${
                          paymentMethod === 'cash_by_rep'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {paymentMethod === 'cash_by_rep'
                          ? `${
                              amountPaid -
                              Math.round((amountPaid * (currentRep?.commissionRate || 42.86)) / 100)
                            } ج.م`
                          : '0 ج.م (سداد للمنصة)'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10.5px] text-[var(--text-secondary)] font-bold flex items-start gap-1.5 pt-1">
                    <span className="text-amber-500 font-black shrink-0">💡 ملاحظة:</span>
                    <span>
                      {paymentMethod === 'cash_by_rep'
                        ? 'استلمت الكاش بيدك وأخذت عمولتك فوراً، ويتم تقييد باقي المبلغ عليك لتوريده للمنصة.'
                        : 'تم السداد مباشرة للمنصة إلكترونياً، لذلك عمولتك بالكامل رصيد أرباح متاح لك لسحبه فورياً.'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Optional Notes */}
        <div>
          <label className="block font-bold mb-1 text-[var(--text-secondary)]">
            ملاحظات مالية أو تفاصيل التحصيل (اختياري):
          </label>
          <input
            type="text"
            placeholder="مثال: تم الاتفاق على تحصيل باقي المبلغ عند معاينة التوثيق..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-2.5 font-medium focus:outline-none focus:border-amber-500 shadow-sm"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={onConfirmPayment}
            className="flex-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            {paymentStatus === 'unpaid' ? (
              <>
                <Clock className="w-5 h-5" />
                <span>حفظ النشاط (فاتورة مؤجلة حتى التوثيق) 🚀</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>تأكيد الدفع وحفظ النشاط فوراً 🚀</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] hover:bg-slate-500/10 text-[var(--text-secondary)] font-bold py-3.5 px-5 rounded-xl border border-[var(--border-color)] transition-all cursor-pointer text-xs"
          >
            رجوع للتعديل
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
