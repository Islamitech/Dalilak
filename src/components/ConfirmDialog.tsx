import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  // Lock body scroll while dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-overlay"
      style={{ background: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
      aria-modal="true"
      role="alertdialog"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div
        className="bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-5 modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + Header */}
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isDanger
                ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id="confirm-dialog-title"
              className="font-black text-base text-[var(--text-primary)] leading-snug"
            >
              {title}
            </h3>
            <p
              id="confirm-dialog-desc"
              className="text-sm text-[var(--text-secondary)] font-medium mt-1.5 leading-relaxed"
            >
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-colors cursor-pointer shrink-0"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-[var(--text-secondary)] bg-[var(--input-bg)] hover:bg-[var(--border-color)] border border-[var(--border-color)] transition-all active:scale-95 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-black text-white transition-all active:scale-95 cursor-pointer shadow-md ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
