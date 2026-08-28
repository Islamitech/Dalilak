import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Logo } from './Logo';
import { ShieldCheck, X } from 'lucide-react';
import { PermissionsHub } from './PermissionsHub';

interface PermissionsModalProps {
  onClose: () => void;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({ onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto modal-overlay animate-fade-in">
      <div className="bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-4 text-[var(--text-primary)] relative modal-content transition-colors duration-300 my-auto max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-[var(--border-color)] cursor-pointer transition-colors shadow-sm z-10"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Top Branding */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 pl-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-[var(--text-primary)]">
                دليل ومصفوفة الصلاحيات والرتب 🛡️
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] font-bold">
                المرجع الإداري والتقني لتوزيع الأدوار والمسؤوليات في منصة دليلك
              </p>
            </div>
          </div>
          <div className="hidden sm:block">
            <Logo size="sm" />
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          <PermissionsHub />
        </div>

        {/* Footer Close Button */}
        <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-primary)] font-bold text-xs px-5 py-2.5 rounded-xl border border-[var(--border-color)] cursor-pointer transition-colors"
          >
            إغلاق الدليل
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
