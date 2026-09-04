import React from 'react';
import { createPortal } from 'react-dom';
import { FileCheck } from 'lucide-react';

interface AdminReceiptModalProps {
  receiptPhoto: string | null;
  onClose: () => void;
}

export const AdminReceiptModal: React.FC<AdminReceiptModalProps> = ({
  receiptPhoto,
  onClose,
}) => {
  if (!receiptPhoto) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 cursor-pointer animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-[var(--bg-card)] border-2 border-amber-500/50 rounded-3xl shadow-2xl space-y-3 cursor-default overflow-hidden my-auto p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-500" />
            <span>معاينة وتدقيق صورة إيصال السداد / التحويل</span>
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center justify-center p-2 max-h-[72vh] overflow-auto bg-slate-950/60 rounded-2xl border border-[var(--border-color)]">
          <img
            src={receiptPhoto}
            alt="صورة الإيصال بالحجم الكامل"
            loading="lazy"
            decoding="async"
            className="max-w-full max-h-[68vh] object-contain rounded-xl shadow-xl"
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)]">
          <span className="text-[11px] text-[var(--text-muted)]">
            يمكنك مراجعة رقم الحوالة، اسم المستفيد، والتاريخ للتأكد من وصول المبلغ.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
          >
            إغلاق المعاينة
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
