import React from 'react';

interface PhotoWatermarkBadgeProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

/**
 * 🛡️ Official Daleelek Photo Watermark Badge Component
 * Renders an elegant frosted-glass brand pill watermark over photos as a CSS/UI overlay,
 * ensuring public brand presence while keeping underlying stored photos clean and 100% compliant with Google Vision AI.
 */
export const PhotoWatermarkBadge: React.FC<PhotoWatermarkBadgeProps> = ({
  position = 'bottom-right',
  className = '',
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'top-right': 'top-2 right-2',
    'top-left': 'top-2 left-2',
  }[position];

  return (
    <div
      className={`absolute ${positionClasses} pointer-events-none z-10 flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md px-2 py-0.5 rounded-full border border-amber-500/40 shadow-md select-none transition-opacity ${className}`}
      dir="ltr"
    >
      <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-[8px] text-slate-950 font-black shadow-xs shrink-0">
        ✓
      </div>
      <span className="text-[10px] font-black text-amber-400 leading-none">دليلك</span>
      <span className="text-[8px] font-extrabold text-slate-200 tracking-wider font-mono leading-none">
        • DALELAK
      </span>
    </div>
  );
};
