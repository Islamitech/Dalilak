import React from 'react';

export interface PhotoWatermarkBadgeProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * 🛡️ Official Daleelek Photo Watermark Badge Component
 * Renders an elegant frosted-glass brand pill watermark over photos as a CSS/UI overlay,
 * ensuring prominent brand visibility while keeping underlying stored photos clean for Google Maps.
 */
export const PhotoWatermarkBadge: React.FC<PhotoWatermarkBadgeProps> = ({
  position = 'bottom-right',
  size = 'md',
  className = '',
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-3 end-3 sm:bottom-4 sm:end-4',
    'bottom-left': 'bottom-3 start-3 sm:bottom-4 sm:start-4',
    'top-right': 'top-3 end-3 sm:top-4 sm:end-4',
    'top-left': 'top-3 start-3 sm:top-4 sm:start-4',
  }[position];

  const sizeStyles = {
    sm: {
      container: 'px-2.5 py-1 gap-1.5 rounded-xl border border-amber-500/50 shadow-md',
      icon: 'w-4 h-4 text-[9px] rounded-full',
      arText: 'text-xs font-black text-amber-400',
      enText: 'text-[9.5px] font-extrabold text-slate-100 tracking-wider',
    },
    md: {
      container: 'px-3.5 py-1.5 gap-2 rounded-2xl border border-amber-500/60 shadow-lg',
      icon: 'w-5 h-5 text-xs rounded-full',
      arText: 'text-sm font-black text-amber-400',
      enText: 'text-[11px] font-black text-slate-100 tracking-wider',
    },
    lg: {
      container: 'px-4 py-2 gap-2.5 rounded-2xl border-2 border-amber-500/70 shadow-xl',
      icon: 'w-6 h-6 text-sm rounded-xl',
      arText: 'text-base font-black text-amber-400',
      enText: 'text-xs font-black text-slate-100 tracking-widest',
    },
    xl: {
      container: 'px-4 sm:px-5 py-2 sm:py-2.5 gap-2.5 sm:gap-3 rounded-2xl border-2 border-amber-400/80 shadow-2xl',
      icon: 'w-6 sm:w-7 h-6 sm:h-7 text-xs sm:text-sm rounded-xl',
      arText: 'text-base sm:text-lg font-black text-amber-400',
      enText: 'text-xs sm:text-sm font-black text-white tracking-widest',
    },
  }[size];

  return (
    <div
      className={`absolute ${positionClasses} pointer-events-none z-10 flex items-center bg-slate-950/85 backdrop-blur-md select-none transition-all ${sizeStyles.container} ${className}`}
      dir="ltr"
    >
      <div
        className={`${sizeStyles.icon} bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-sm shrink-0`}
      >
        ✓
      </div>
      <span className={`${sizeStyles.arText} leading-none`}>دليلك</span>
      <span className={`${sizeStyles.enText} font-mono leading-none`}>
        • DALELAK
      </span>
    </div>
  );
};
