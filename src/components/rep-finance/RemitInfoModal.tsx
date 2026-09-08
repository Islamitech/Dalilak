import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Representative, PayoutRequest, PayoutMethod } from '../../types';
import { PAYOUT_METHOD_LABELS } from '../../utils/commission';
import { compressImageFile } from '../../utils/imageCompressor';
import { formatStandardDateTime } from '../../utils/dateFormatters';
import {
  CreditCard,
  Clock,
  FileCheck,
  Copy,
  Trash2,
  Loader2,
  Camera,
  Send,
  CheckCircle2,
} from 'lucide-react';

export interface RemitInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  rep: Representative;
  settlement: any;
  pendingRemittance?: PayoutRequest;
  onRequestPayout?: (payout: PayoutRequest) => void;
  onRemittanceCreated?: (newRemittance: PayoutRequest) => void;
}

export const RemitInfoModal: React.FC<RemitInfoModalProps> = ({
  isOpen,
  onClose,
  rep,
  settlement,
  pendingRemittance,
  onRequestPayout,
  onRemittanceCreated,
}) => {
  const [remitMethod, setRemitMethod] = useState<PayoutMethod>('instapay');
  const [remitAccountDetails] = useState('');
  const [remitTransactionRef, setRemitTransactionRef] = useState('');
  const [remitReceiptPhoto, setRemitReceiptPhoto] = useState('');
  const [isCompressingReceipt, setIsCompressingReceipt] = useState(false);
  const [isSubmittingRemit, setIsSubmittingRemit] = useState(false);
  const [remitSuccess, setRemitSuccess] = useState(false);

  if (!isOpen) return null;

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingReceipt(true);
      const compressed = await compressImageFile(file, 1200, 1200, 0.8, { applyWatermark: false });
      setRemitReceiptPhoto(compressed);
    } catch (err) {
      console.error('Error compressing receipt photo:', err);
    } finally {
      setIsCompressingReceipt(false);
    }
  };

  const handleSubmitRemittance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remitReceiptPhoto) {
      alert('يرجى إرفاق صورة أو لقطة شاشة لإيصال السداد');
      return;
    }
    setIsSubmittingRemit(true);
    try {
      const newRemittance: PayoutRequest = {
        id: `remit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        repId: rep.id,
        repName: rep.name,
        repPhone: rep.phone,
        type: 'remittance',
        amount: settlement.debtToPlatformAmount,
        method: remitMethod,
        accountDetails:
          remitAccountDetails || (remitMethod === 'instapay' ? '@daz31181' : '01143888355'),
        transactionRef: remitTransactionRef || undefined,
        receiptPhoto: remitReceiptPhoto,
        status: 'pending',
        requestDate: new Date().toISOString(),
      };

      if (onRequestPayout) {
        onRequestPayout(newRemittance);
      }
      if (onRemittanceCreated) {
        onRemittanceCreated(newRemittance);
      }
      setRemitSuccess(true);
      setTimeout(() => {
        setRemitSuccess(false);
        onClose();
      }, 2500);
    } catch (err) {
      console.error('Failed to submit remittance:', err);
      alert('حدث خطأ أثناء إرسال إيصال السداد، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmittingRemit(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
      dir="rtl"
    >
      <div className="bg-[var(--bg-card)] border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-xs text-[var(--text-primary)] shadow-2xl relative animate-fade-in my-auto max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <h4 className="font-black text-base text-[var(--text-primary)]">
              إشعار وتوريد سداد حساب المنصة
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {pendingRemittance ? (
          <div className="space-y-4 py-2">
            <div className="bg-amber-500/15 border-2 border-amber-500/40 p-4 rounded-2xl text-center space-y-1.5">
              <div className="w-11 h-11 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-black text-sm text-amber-800 dark:text-amber-300">
                جاري مراجعة وتأكيد عملية السداد ⏳
              </h4>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                سيتم تصفية وتحديث الحساب فور اعتماد المسؤول
              </p>
            </div>

            {/* Pending Remittance Summary Details */}
            <div className="bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                <span className="text-[var(--text-muted)] font-bold">
                  المبلغ المسدد قيد المراجعة:
                </span>
                <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                  {pendingRemittance.amount.toLocaleString()} ج.م
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                <span className="text-[var(--text-muted)] font-bold">وسيلة التحويل المستخدمة:</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {PAYOUT_METHOD_LABELS[pendingRemittance.method]}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                <span className="text-[var(--text-muted)] font-bold">تاريخ الإرسال:</span>
                <span className="font-mono text-[11px] text-[var(--text-muted)] dir-ltr">
                  {formatStandardDateTime(pendingRemittance.requestDate)}
                </span>
              </div>

              {pendingRemittance.transactionRef && (
                <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                  <span className="text-[var(--text-muted)] font-bold">رقم العملية / الحوالة:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {pendingRemittance.transactionRef}
                  </span>
                </div>
              )}

              {pendingRemittance.receiptPhoto && (
                <div className="pt-1">
                  <span className="text-[10px] text-[var(--text-muted)] block font-bold mb-1.5">
                    صورة إيصال السداد المرفقة:
                  </span>
                  <div className="rounded-xl overflow-hidden border border-amber-500/30 bg-slate-950/60 p-2 flex items-center gap-3">
                    <img
                      src={pendingRemittance.receiptPhoto}
                      alt="صورة الإيصال"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-700"
                    />
                    <div>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>الإيصال مرفق ومحفوظ بالنظام</span>
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                        بانتظار مطابقة الحساب وتأكيد المشرف
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-bold py-3 rounded-xl border border-[var(--border-color)] cursor-pointer text-xs"
            >
              إغلاق النافذة
            </button>
          </div>
        ) : remitSuccess ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-black text-base text-emerald-600 dark:text-emerald-400">
              تم إرسال إشعار وإيصال السداد بنجاح!
            </h4>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              سيقوم مسؤولو الإدارة والمالية بمراجعة صورة الإيصال وتأكيد المعاملة وتصفية ذمتك المالية
              فوراً.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitRemittance} className="space-y-4">
            <div className="bg-amber-500/15 border border-amber-500/30 p-3.5 rounded-2xl space-y-1 text-amber-900 dark:text-amber-200 font-medium">
              <div className="flex items-center justify-between font-black text-xs">
                <span>المبلغ المستحق لتوريده للمنصة:</span>
                <span className="text-base font-mono text-amber-600 dark:text-amber-400 font-black">
                  {settlement.debtToPlatformAmount} ج.م
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                يرجى تحويل المبلغ عبر الحسابات المعتمدة أدناه ثم رفع لقطة شاشة أو صورة الإيصال
                لإرسالها للإدارة للتدقيق والاعتماد.
              </p>
            </div>

            {/* Accounts to Transfer to */}
            <div className="space-y-2">
              <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-purple-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-bold">
                    معرف إنستاباي المعتمد (InstaPay):
                  </span>
                  <span className="text-purple-600 dark:text-purple-300 font-mono font-black text-sm dir-ltr text-right inline-block">
                    @daz31181
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('@daz31181');
                    alert('تم نسخ معرف إنستاباي: @daz31181');
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>نسخ</span>
                </button>
              </div>

              <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] block font-bold">
                    محفظة فودافون كاش الرسمية:
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm dir-ltr text-right inline-block">
                    01143888355
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('01143888355');
                    alert('تم نسخ رقم فودافون كاش: 01143888355');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>نسخ</span>
                </button>
              </div>
            </div>

            {/* Payment Method Used */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                  وسيلة التحويل المستخدمة:
                </label>
                <select
                  value={remitMethod}
                  onChange={(e) => setRemitMethod(e.target.value as PayoutMethod)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs font-bold focus:border-amber-500 outline-none"
                >
                  <option value="instapay">إنستاباي (InstaPay)</option>
                  <option value="vodafone_cash">فودافون كاش</option>
                  <option value="orange_cash">أورنج كاش</option>
                  <option value="etisalat_cash">اتصالات كاش</option>
                  <option value="we_pay">وي باي (WE Pay)</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="cash">سداد كاش يدوي</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                  رقم العملية / الحوالة (اختياري):
                </label>
                <input
                  type="text"
                  value={remitTransactionRef}
                  onChange={(e) => setRemitTransactionRef(e.target.value)}
                  placeholder="مثال: REF-92841"
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs font-mono focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Receipt Photo Upload Section */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)]">
                صورة إيصال / لقطة شاشة السداد <span className="text-rose-500">*</span>
              </label>

              {remitReceiptPhoto ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-slate-950/40 p-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={remitReceiptPhoto}
                      alt="Receipt preview"
                      className="w-16 h-16 object-cover rounded-xl border border-slate-700 bg-slate-900"
                    />
                    <div>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>تم إرفاق صورة الإيصال</span>
                      </span>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        جاهز للإرسال والمراجعة
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRemitReceiptPhoto('')}
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف</span>
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-amber-500/40 hover:border-amber-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[var(--input-bg)] transition-colors hover:bg-amber-500/5">
                  {isCompressingReceipt ? (
                    <div className="flex flex-col items-center gap-1.5 py-2">
                      <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                      <span className="text-xs text-amber-500 font-bold">
                        جارٍ معالجة وضغط الصورة...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-bold text-[var(--text-primary)] block">
                          اضغط هنا لرفع صورة الإيصال أو لقطة الشاشة
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          يدعم الصور وملفات JPG / PNG
                        </span>
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    disabled={isCompressingReceipt}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
              <button
                type="submit"
                disabled={isSubmittingRemit || isCompressingReceipt || !remitReceiptPhoto}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                {isSubmittingRemit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ الإرسال...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>إرسال إشعار وإيصال السداد للإدارة 🚀</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-bold py-3 px-4 rounded-xl border border-[var(--border-color)] cursor-pointer text-xs"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
