import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'full' | 'icon' | 'badge' | 'watermark';
  lightText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  variant = 'full',
  lightText = false,
}) => {
  const iconDimensions = {
    sm: 'w-8 h-8 sm:w-9 sm:h-9',
    md: 'w-10 h-10 sm:w-11 sm:h-11',
    lg: 'w-13 h-13 sm:w-14 sm:h-14',
    xl: 'w-16 h-16 sm:w-18 sm:h-18',
    '2xl': 'w-20 h-20 sm:w-24 sm:h-24',
  }[size];

  const titleSize = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-3xl sm:text-4xl',
    '2xl': 'text-4xl sm:text-5xl',
  }[size];

  const subtitleSize = {
    sm: 'text-[9px]',
    md: 'text-[10px] sm:text-[11px]',
    lg: 'text-xs sm:text-sm',
    xl: 'text-sm sm:text-base',
    '2xl': 'text-base sm:text-lg',
  }[size];

  // Pure mathematical, crystal-clear SVG Vector Icon
  const VectorIcon = () => (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full transform group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
    >
      <defs>
        {/* Exact Brand Amber Gradient (Matches the + Button and App Theme) */}
        <linearGradient id="dalelakAppAmber" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Emerald Checkmark Gradient */}
        <linearGradient id="dalelakAppEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Deep Slate Inset Gradient for Dark Backdrop */}
        <linearGradient id="dalelakAppDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>

      {/* 1. Squircle Background Base with Golden Ring */}
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="26"
        fill="url(#dalelakAppDark)"
      />
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="26"
        fill="none"
        stroke="url(#dalelakAppAmber)"
        strokeWidth="3.5"
      />

      {/* 2. Golden Map Pin Ring */}
      <path
        d="M50 16 C34 16 22 28 22 44 C22 57 39 72 50 82 C61 72 78 57 78 44 C78 28 66 16 50 16 Z"
        fill="url(#dalelakAppAmber)"
      />

      {/* 3. Dark Inner Circular Core */}
      <circle
        cx="50"
        cy="42"
        r="17"
        fill="#0F172A"
      />

      {/* 4. Bold Vibrant Emerald Verification Checkmark */}
      <path
        d="M40 42 L47 49 L61 34"
        stroke="url(#dalelakAppEmerald)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40 42 L47 49 L61 34"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const IconElement = (
    <div className={`relative ${iconDimensions} shrink-0 group cursor-pointer select-none flex items-center justify-center`}>
      {/* Ambient background glow */}
      <div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-sm group-hover:blur-md transition-all duration-300 pointer-events-none" />
      <VectorIcon />
    </div>
  );

  // 1. ICON ONLY
  if (variant === 'icon') {
    return IconElement;
  }

  // 2. OFFICIAL SEAL BADGE (Invoices, Documents, ID Cards)
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-3 bg-[var(--bg-surface)]/95 border border-amber-500/30 rounded-2xl p-2.5 sm:p-3 shadow-md backdrop-blur-md select-none ${className}`}>
        {IconElement}
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm sm:text-base text-[var(--text-primary)] font-['Cairo'] leading-none">
              دليلك
            </span>
            <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-emerald-500/30">
              معتمد رسمي
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-bold mt-1">
            توثيق خرائط جوجل — جمهورية مصر العربية
          </span>
        </div>
      </div>
    );
  }

  // 3. WATERMARK
  if (variant === 'watermark') {
    return (
      <div className={`pointer-events-none opacity-5 select-none ${className}`}>
        <VectorIcon />
      </div>
    );
  }

  // 4. FULL BRAND IDENTITY (ICON + CRISP ARABIC TITLE + SUBTITLE)
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3.5 select-none group ${className}`}>
      {IconElement}

      <div className="flex flex-col justify-center text-right">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={`font-black ${titleSize} font-['Cairo'] tracking-tight leading-none transition-colors duration-300 ${
              lightText
                ? 'text-white'
                : 'text-amber-500 dark:text-amber-400'
            }`}
          >
            دليلك
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-500/30">
            خرائط جوجل 🇪🇬
          </span>
        </div>

        {showSubtitle && (
          <p
            className={`hidden sm:block ${subtitleSize} font-bold tracking-normal transition-colors duration-300 mt-1 leading-tight ${
              lightText ? 'text-amber-100/90' : 'text-[var(--text-secondary)]'
            }`}
          >
            المنصة الرسمية لتسجيل وتوثيق الأنشطة التجارية
          </p>
        )}
      </div>
    </div>
  );
};
