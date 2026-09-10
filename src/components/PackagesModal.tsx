import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Logo } from './Logo';
import { Sparkles, X } from 'lucide-react';
import { PackagesHub } from './PackagesHub';
import { Business } from '../types';

interface PackagesModalProps {
  onClose: () => void;
  onSelectPackage?: (packageId: string) => void;
  mode?: 'admin' | 'public';
  businesses?: Business[];
  onSendPackageBiz?: (biz: Business, packageId?: string) => void;
}

export const PackagesModal: React.FC<PackagesModalProps> = ({ 
  onClose,
  onSelectPackage,
  mode = 'admin',
  businesses,
  onSendPackageBiz
}) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-fade-in">
      <div className="bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-4 text-[var(--text-primary)] relative modal-content transition-colors duration-300 my-auto max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-[var(--border-color)] cursor-pointer transition-colors shadow-sm z-10"
          aria-label="إغلاق النافذة"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 pe-1 space-y-4 custom-scrollbar">
          <PackagesHub 
            mode={mode}
            businesses={businesses}
            onSendPackageBiz={onSendPackageBiz}
            onSelectPackage={onSelectPackage}
            onClose={onClose}
          />
        </div>

        {/* Footer Close Button */}
        <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between shrink-0">
          <p className="text-[11px] text-[var(--text-muted)] font-bold hidden sm:block">
            ✓ أسعار رسمية موحدة معتمدة في جميع محافظات مصر
          </p>
          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] hover:bg-slate-200 text-[var(--text-primary)] font-bold text-xs px-5 py-2.5 rounded-xl border border-[var(--border-color)] cursor-pointer transition-colors mr-auto sm:mr-0"
          >
            إغلاق الدليل
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
