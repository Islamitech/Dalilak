import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  size?: ModalSize;
  swipeable?: boolean;
  showCloseButton?: boolean;
  preventBackdropClose?: boolean;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  zIndex?: number;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-[96vw] h-[94vh]',
};

export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  size = 'lg',
  swipeable = true,
  showCloseButton = true,
  preventBackdropClose = false,
  headerActions,
  footer,
  children,
  className = '',
  bodyClassName = '',
  zIndex = 10000,
}) => {
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // 1. Lock Body Scroll
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow || '';
    };
  }, [isOpen]);

  // 2. Escape Key Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 3. Mobile Swipe Down to Close
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!swipeable) return;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeable) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStartY.current;

    // Only allow downward drag when scrolled to top
    if (delta > 0 && modalContentRef.current && modalContentRef.current.scrollTop <= 0) {
      touchDeltaY.current = delta;
    }
  };

  const handleTouchEnd = () => {
    if (!swipeable) return;
    if (touchDeltaY.current > 110) {
      onClose();
    }
    touchDeltaY.current = 0;
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-4 modal-overlay animate-fade-in"
      style={{
        zIndex,
        background: 'rgba(15, 23, 42, 0.70)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={() => {
        if (!preventBackdropClose) onClose();
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalContentRef}
        className={`
          bg-[var(--modal-bg)] border border-[var(--modal-border)] text-[var(--text-primary)]
          rounded-3xl shadow-2xl w-full flex flex-col overflow-hidden max-h-[92vh]
          modal-content transition-all duration-200
          ${sizeClasses[size]}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile Swipe Handle Indicator */}
        {swipeable && (
          <div className="sm:hidden flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-400/40" />
          </div>
        )}

        {/* Modal Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] shrink-0 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-500 shrink-0 border border-amber-500/20">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)] truncate leading-tight">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerActions}

              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] transition-colors cursor-pointer"
                  aria-label="إغلاق النافذة"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin ${bodyClassName}`}>
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-[var(--border-color)] bg-[var(--bg-card)]/50 shrink-0 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
