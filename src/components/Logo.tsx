import React from 'react';
import { MapPin } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'full' | 'icon';
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  variant = 'full',
}) => {
  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10 sm:w-12 sm:h-12',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
    xl: 'w-16 h-16 sm:w-20 sm:h-20',
  }[size];

  const titleSize = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-xl',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-2xl sm:text-3xl',
  }[size];

  const logoIcon = (
    <div className={`relative ${iconDimensions} flex-shrink-0 group cursor-pointer flex items-center justify-center`}>
      {/* Background glow */}
      <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 blur-sm opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Solid shape */}
      <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 border-[1.5px] sm:border-2 border-white dark:border-slate-800 shadow-lg flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
        <MapPin className="w-[55%] h-[55%] text-white stroke-[2.5]" />
        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 w-[35%] h-[35%] shadow-sm" />
      </div>
    </div>
  );

  if (variant === 'icon') {
    return logoIcon;
  }

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {logoIcon}

      {/* Brand Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`font-black ${titleSize} tracking-tight text-[var(--text-primary)] font-['Cairo'] flex items-center gap-1 transition-colors duration-300 leading-none`}>
            <span>دليلك</span>
          </span>

          <span className="hidden sm:inline-flex bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30 items-center gap-1 shadow-sm shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>خرائط جوجل مصر</span>
          </span>
        </div>

        {showSubtitle && (
          <p className="hidden sm:block text-[10px] sm:text-[11px] text-[var(--text-secondary)] font-bold tracking-normal transition-colors duration-300 mt-0.5">
            المنصة الرسمية لتسجيل الأنشطة التجارية
          </p>
        )}
      </div>
    </div>
  );
};
