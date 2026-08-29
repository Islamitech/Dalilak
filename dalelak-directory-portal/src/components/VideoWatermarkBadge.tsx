import React from 'react';

interface VideoWatermarkBadgeProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

/**
 * 🛡️ Official Daleelek Video Watermark Badge Component
 * Renders the sleek frosted-glass brand pill watermark on videos
 * matching global video standards (TikTok/Reels/Google Maps style)
 */
export const VideoWatermarkBadge: React.FC<VideoWatermarkBadgeProps> = ({
  position = 'bottom-right',
  className = '',
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-2.5 right-2.5',
    'bottom-left': 'bottom-2.5 left-2.5',
    'top-right': 'top-2.5 right-2.5',
    'top-left': 'top-2.5 left-2.5',
  }[position];

  return (
    <div
      className={`absolute ${positionClasses} pointer-events-none z-20 flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-500/40 shadow-xl select-none transition-opacity ${className}`}
    >
      <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-[9px] text-slate-950 font-black shadow-xs">
        ✓
      </div>
      <span className="text-[11px] font-black text-amber-400 leading-none">دليلك</span>
      <span className="text-[9px] font-extrabold text-slate-100 tracking-wider font-mono leading-none">
        • DALELAK
      </span>
    </div>
  );
};
