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

  // Pure mathematical, crystal-clear SVG Vector Icon (Official Golden Pin & Silver Skyline)
  const VectorIcon = () => (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full transform group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
    >
      <defs>
        {/* Luxury Polished Gold Gradient */}
        <linearGradient id="dalelakAppAmber" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="30%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Polished Silver/Platinum Gradient for Buildings */}
        <linearGradient id="dalelakPlatinum" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#F1F5F9" />
          <stop offset="85%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>

        {/* Deep Midnight Obsidian Gradient for Dark Backdrop */}
        <linearGradient id="dalelakAppDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#111827" />
          <stop offset="50%" stopColor="#0B132B" />
          <stop offset="100%" stopColor="#030712" />
        </linearGradient>
      </defs>

      {/* 1. Deep Midnight Squircle Base */}
      <rect
        x="3"
        y="3"
        width="94"
        height="94"
        rx="24"
        fill="url(#dalelakAppDark)"
      />
      {/* Outer Golden Border Rim */}
      <rect
        x="3"
        y="3"
        width="94"
        height="94"
        rx="24"
        fill="none"
        stroke="url(#dalelakAppAmber)"
        strokeWidth="3.5"
      />
      {/* Inner Accent Gold Line */}
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="21"
        fill="none"
        stroke="url(#dalelakAppAmber)"
        strokeWidth="1"
        opacity="0.4"
      />

      {/* 2. Golden Map Pin */}
      <path
        d="M50 14 C32 14 19 27 19 44 C19 60 38 78 50 89 C62 78 81 60 81 44 C81 27 68 14 50 14 Z"
        fill="url(#dalelakAppAmber)"
      />

      {/* 3. Dark Inner Circular Core */}
      <circle
        cx="50"
        cy="42"
        r="18"
        fill="#0A0F1D"
      />
      <circle
        cx="50"
        cy="42"
        r="18"
        fill="none"
        stroke="url(#dalelakAppAmber)"
        strokeWidth="1"
        opacity="0.4"
      />

      {/* 4. Silver/Platinum Business Skyline (3 Buildings + Arched Base) */}
      {/* Curved Horizon Base */}
      <path
        d="M37 52 C44 49 56 49 63 52 L63 54.5 C56 51.5 44 51.5 37 54.5 Z"
        fill="url(#dalelakPlatinum)"
      />
      {/* Left Building */}
      <path
        d="M39 51 L39 42 L44 38 L44 50 Z"
        fill="url(#dalelakPlatinum)"
        opacity="0.9"
      />
      {/* Left Highlight */}
      <path d="M44 38 L39 42" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" />

      {/* Center Tower (Tallest) */}
      <path
        d="M45.5 49 L45.5 32 L51 28 L55 30.5 L55 49 Z"
        fill="url(#dalelakPlatinum)"
      />
      {/* Center Tower Crown Highlight */}
      <path d="M45.5 32 L51 28 L55 30.5" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="50" y1="31" x2="50" y2="48" stroke="#0A0F1D" strokeWidth="0.8" opacity="0.8" />

      {/* Right Building */}
      <path
        d="M56.5 50 L56.5 41.5 L61.5 43.5 L61.5 51 Z"
        fill="url(#dalelakPlatinum)"
        opacity="0.9"
      />
      {/* Right Highlight */}
      <path d="M56.5 41.5 L61.5 43.5" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" />
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
              منظومة معتمدة
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-bold mt-1">
            المنصة الشاملة لإدارة وتوثيق الأنشطة والخدمات — مصر
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

  // 4. FULL BRAND IDENTITY (ICON + CRISP ARABIC TITLE)
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
        </div>

        {showSubtitle && (
          <p
            className={`hidden sm:block ${subtitleSize} font-bold tracking-normal transition-colors duration-300 mt-1 leading-tight ${
              lightText ? 'text-amber-100/90' : 'text-[var(--text-secondary)]'
            }`}
          >
            دليل الأنشطة والخدمات الميدانية
          </p>
        )}
      </div>
    </div>
  );
};
