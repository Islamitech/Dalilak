import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { BaseModal } from './BaseModal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
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
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const iconColor = isDanger 
    ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' 
    : isWarning 
      ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' 
      : 'text-sky-500 bg-sky-500/10 border-sky-500/20';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      showCloseButton={!loading}
      preventBackdropClose={loading}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${iconColor}`}>
          {variant === 'info' ? (
            <Info className="w-6 h-6" />
          ) : (
            <AlertTriangle className="w-6 h-6" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-black text-base text-[var(--text-primary)] leading-snug">
            {title}
          </h3>
          <p className="text-sm text-[var(--text-secondary)] font-medium mt-1.5 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 justify-end mt-6 pt-3 border-t border-[var(--border-color)]">
        <Button
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>

        <Button
          variant={isDanger ? 'danger' : 'primary'}
          size="sm"
          loading={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </BaseModal>
  );
};
