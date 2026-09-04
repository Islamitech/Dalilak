import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { PayoutRequest } from '../../../types';
import { PAYOUT_METHOD_LABELS } from '../../../utils/commission';
import { Check, X, Eye } from 'lucide-react';

interface AdminPayoutActionModalProps {
  modalData: {
    payout: PayoutRequest;
    action: 'approve' | 'reject';
  } | null;
  onClose: () => void;
  onUpdatePayoutRequest?: (payout: PayoutRequest) => void;
  onSelectReceiptPhoto: (photo: string) => void;
}

export const AdminPayoutActionModal: React.FC<AdminPayoutActionModalProps> = ({
  modalData,
  onClose,
  onUpdatePayoutRequest,
  onSelectReceiptPhoto,
}) => {
  if (!modalData) return null;

  const { payout, action } = modalData;
  const isRemittance = payout.type === 'remittance';

  const [transactionRef, setTransactionRef] = useState<string>(payout.transactionRef || '');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdatePayoutRequest) {
      let finalAdminNotes = '';
      if (action === 'approve') {
        finalAdminNotes = adminNotes.trim() || payout.adminNotes || '';
      } else {
        finalAdminNotes = rejectReason.trim() + (adminNotes.trim() ? ` - ${adminNotes.trim()}` : '');
      }

      const updated: PayoutRequest = {
        ...payout,
        status: action === 'approve' ? 'approved' : 'rejected',
        processedDate: new Date().toISOString(),
        transactionRef: transactionRef.trim() || payout.transactionRef,
        adminNotes: finalAdminNotes || payout.adminNotes,
      };
      onUpdatePayoutRequest(updated);
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 text-xs my-auto text-[var(--text-primary)] shadow-2xl transition-colors duration-300 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
              action === 'approve'
                ? isRemittance
                  ? 'bg-blue-500/15 text-blue-500'
                  : 'bg-emerald-500/15 text-emerald-500'
                : 'bg-rose-500/15 text-rose-500'
            }`}
          >
            {action === 'approve' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-black text-base text-[var(--text-primary)]">
              {action === 'approve'
                ? isRemittance
                  ? 'تأكيد استلام السداد وتصفية الحساب 💳'
                  : 'تأكيد اعتماد وصرف الحوالة 💵'
                : isRemittance
                ? 'رفض إشعار السداد ❌'
                : 'رفض طلب سحب العمولة ❌'}
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] font-medium">
              المندوب: <strong className="text-amber-700 dark:text-amber-300">{payout.repName}</strong>
            </p>
          </div>
        </div>

        {/* Payout Summary Box */}
        <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)] font-bold">
              {isRemittance ? 'المبلغ المسدد للمنصة:' : 'المبلغ المطلوب:'}
            </span>
            <span
              className={`font-mono font-black text-sm ${
                isRemittance ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {payout.amount.toLocaleString()} ج.م
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)] font-bold">وسيلة التحويل:</span>
            <span className="font-bold text-[var(--text-primary)]">
              {PAYOUT_METHOD_LABELS[payout.method]}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)] font-bold">
              {isRemittance ? 'الحساب / المحفظة المحول منها:' : 'رقم الحساب / المحفظة:'}
            </span>
            <span className="font-mono font-black text-amber-700 dark:text-amber-300">
              {payout.accountDetails}
            </span>
          </div>

          {/* Receipt Photo Preview Inside Modal */}
          {payout.receiptPhoto && (
            <div className="pt-2 border-t border-[var(--border-color)]">
              <span className="text-[10.5px] font-bold text-[var(--text-secondary)] block mb-1">
                صورة إيصال السداد المرفقة:
              </span>
              <div
                onClick={() => onSelectReceiptPhoto(payout.receiptPhoto!)}
                className="rounded-xl overflow-hidden border border-amber-500/40 cursor-pointer relative group bg-slate-950 flex items-center justify-center p-1"
              >
                <img
                  src={payout.receiptPhoto}
                  alt="إيصال السداد"
                  loading="lazy"
                  decoding="async"
                  className="max-h-36 object-contain rounded-lg group-hover:opacity-80 transition-opacity"
                />
                <span className="absolute bottom-2 bg-slate-900/90 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/40 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>اضغط للمعاينة بالحجم الكامل</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {action === 'approve' ? (
            <div>
              <label className="block text-[var(--text-primary)] font-bold mb-1">
                رقم المعاملة / إيصال التحويل (Transaction Ref / الحوالة):
              </label>
              <input
                type="text"
                placeholder="مثال: TXN-9482910 أو رقم إشعار كاش"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                يظهر رقم المعاملة للمندوب في سجله المالي لتأكيد استلام المبلغ.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-rose-600 dark:text-rose-400 font-bold mb-1">
                سبب الرفض (سيصل للمندوب في الإشعار) *:
              </label>
              <input
                type="text"
                required
                placeholder="مثال: صورة الإيصال غير واضحة / المبلغ لم يصل في المحفظة"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-rose-500/40 text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-rose-500 shadow-xs"
              />
            </div>
          )}

          <div>
            <label className="block text-[var(--text-primary)] font-bold mb-1">
              ملاحظة إضافية للمندوب (اختياري):
            </label>
            <input
              type="text"
              placeholder="ملاحظات توضيحية..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold px-4 py-2 rounded-xl border border-[var(--border-color)] cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className={`font-black px-5 py-2 rounded-xl shadow cursor-pointer text-white transition-transform active:scale-95 ${
                action === 'approve'
                  ? isRemittance
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {action === 'approve'
                ? isRemittance
                  ? 'تأكيد السداد وتصفية الذمة'
                  : 'تأكيد الحوالة وصرف المبلغ'
                : 'تأكيد رفض الطلب'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
