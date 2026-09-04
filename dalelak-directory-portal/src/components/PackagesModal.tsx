import React, { useEffect } from 'react';
import { Sparkles, X, MapPin } from 'lucide-react';
import { PackagesHub } from './PackagesHub';

interface PackagesModalProps {
  isOpen?: boolean;
  onClose: () => void;
  initialPackageId?: string;
  onSelectPackage?: (packageTitle: string) => void;
}

export const PackagesModal: React.FC<PackagesModalProps> = ({ 
  isOpen = true,
  onClose, 
  initialPackageId = 'pkg_basic',
  onSelectPackage 
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto modal-overlay animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{ direction: 'rtl' }}
    >
      <div 
        className="bg-[var(--modal-bg)] border border-[var(--border-color)] rounded-[2rem] max-w-6xl w-full p-4 sm:p-6 shadow-2xl space-y-4 text-[var(--text-primary)] relative modal-content transition-all duration-300 my-auto max-h-[92vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="packages-modal-title"
      >
        {/* Close Button (Top Left in RTL) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 sm:top-5 sm:left-5 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border border-[var(--border-color)] cursor-pointer transition-colors shadow-sm z-20 hover:scale-105 active:scale-95"
          aria-label="إغلاق النافذة"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Modal Top Branding Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3 pl-12 shrink-0">
          {/* Main Title with Sparkle Icon */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 id="packages-modal-title" className="font-black text-base sm:text-xl text-[var(--text-primary)] leading-tight flex items-center gap-2">
                <span>دليل وشرح باقات منصة دليلك</span>
                <span>💎</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)] font-bold mt-0.5">
                المرجع الشامل للتوثيق الميداني والتأسيس الرقمي والإدارة الكاملة في مصر
              </p>
            </div>
          </div>

          {/* Official Badge (Dalelak Platform Seal) */}
          <div className="hidden lg:flex items-center gap-2.5 bg-[var(--input-bg)] border border-amber-500/30 rounded-2xl px-3.5 py-1.5 shadow-sm">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col text-right leading-none">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs text-amber-500">
                  دليلك
                </span>
                <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-amber-500/30">
                  المنظومة الشاملة 🇪🇬
                </span>
              </div>
              <span className="text-[9px] text-[var(--text-muted)] font-bold mt-1">
                المنصة الشاملة لإدارة وتوثيق الأنشطة والخدمات الميدانية
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto flex-1 pr-1 pl-1 space-y-4 custom-scrollbar">
          <PackagesHub 
            initialPackageId={initialPackageId} 
            onSelectPackage={onSelectPackage}
            onClose={onClose}
          />
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between shrink-0">
          <p className="text-xs text-[var(--text-muted)] font-bold hidden sm:flex items-center gap-1.5">
            <span className="text-emerald-500 font-black">✓</span>
            <span>أسعار رسمية موحدة معتمدة في جميع محافظات مصر</span>
          </p>

          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-primary)] font-black text-xs sm:text-sm px-6 py-2.5 rounded-xl border border-[var(--border-color)] cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            إغلاق الدليل
          </button>
        </div>
      </div>
    </div>
  );
};
