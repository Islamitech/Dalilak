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
  const iconPixelSizes = {
    sm: 36,
    md: 46,
    lg: 58,
    xl: 74,
    '2xl': 96,
  }[size];

  const titleSize = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-2xl',
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

  // Professional SVG Vector Emblem
  const EmblemSvg = ({ sizeInPx }: { sizeInPx: number }) => (
    <svg
      width={sizeInPx}
      height={sizeInPx}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 group-hover:scale-105 filter drop-shadow-md"
    >
      <defs>
        {/* Luxury Gold Amber Gradient */}
        <linearGradient id="goldPlate" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="25%" stopColor="#F59E0B" />
          <stop offset="65%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        {/* Deep Slate Inset Gradient */}
        <linearGradient id="innerPlate" x1="35" y1="35" x2="165" y2="165" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="50%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        {/* Pin Accent Gradient */}
        <linearGradient id="pinGold" x1="70" y1="40" x2="130" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="30%" stopColor="#FDE68A" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Emerald Beacon Gradient */}
        <linearGradient id="emeraldBadge" x1="140" y1="140" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="40%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Ambient Glow Filter */}
        <filter id="emblemGlow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#F59E0B" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* 1. Outer Metallic Gold Rounded Squircle Base */}
      <rect
        x="12"
        y="12"
        width="176"
        height="176"
        rx="46"
        fill="url(#goldPlate)"
        filter="url(#emblemGlow)"
      />

      {/* 2. Inner Deep Obsidian Plate with Fine Border */}
      <rect
        x="22"
        y="22"
        width="156"
        height="156"
        rx="38"
        fill="url(#innerPlate)"
        stroke="url(#goldPlate)"
        strokeWidth="2.5"
      />

      {/* 3. Subtle Compass Navigation Grid & Rays */}
      <circle cx="100" cy="94" r="54" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.4" />
      <circle cx="100" cy="94" r="36" stroke="#FDE68A" strokeWidth="1" strokeDasharray="2 4" opacity="0.3" />

      {/* Compass North-South-East-West Accent Marks */}
      <path d="M100 32 L100 42" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <path d="M100 146 L100 156" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <path d="M38 94 L48 94" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <path d="M152 94 L162 94" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />

      {/* 4. Centerpiece: Stylized Modern Map Pin with Dynamic Angle */}
      <g filter="drop-shadow(0 6px 10px rgba(0,0,0,0.5))">
        {/* Main Pin Body */}
        <path
          d="M100 48C76.8 48 58 66.8 58 90C58 121.5 100 158 100 158C100 158 142 121.5 142 90C142 66.8 123.2 48 100 48Z"
          fill="url(#pinGold)"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Pin Inner Lens / Ring */}
        <circle cx="100" cy="90" r="18" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2.5" />

        {/* Core Center Sparkle Dot */}
        <circle cx="100" cy="90" r="8" fill="url(#goldPlate)" />
        <circle cx="98" cy="88" r="2.5" fill="#FFFFFF" opacity="0.9" />
      </g>

      {/* 5. Bottom Right: Official Verification Seal Beacon */}
      <g transform="translate(132, 132)">
        {/* Glow Ring */}
        <circle cx="24" cy="24" r="26" fill="#0F172A" />
        <circle
          cx="24"
          cy="24"
          r="23"
          fill="url(#emeraldBadge)"
          stroke="#FFFFFF"
          strokeWidth="3"
          filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))"
        />
        {/* Verification Checkmark */}
        <path
          d="M15 24L21 30L33 18"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );

  // 1. ICON-ONLY VARIANT
  if (variant === 'icon') {
    return (
      <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
        <EmblemSvg sizeInPx={iconPixelSizes} />
      </div>
    );
  }

  // 2. OFFICIAL SEAL BADGE VARIANT (For Invoices, ID Cards, Legal Contracts)
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-3 bg-[var(--bg-surface)]/90 border border-amber-500/30 rounded-2xl p-2.5 sm:p-3 shadow-md backdrop-blur-md select-none ${className}`}>
        <EmblemSvg sizeInPx={iconPixelSizes} />
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

  // 3. WATERMARK VARIANT
  if (variant === 'watermark') {
    return (
      <div className={`pointer-events-none opacity-5 select-none ${className}`}>
        <EmblemSvg sizeInPx={iconPixelSizes * 2} />
      </div>
    );
  }

  // 4. FULL BRAND IDENTITY (ICON + LOGOTYPE + SUBTITLE)
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3.5 select-none group ${className}`}>
      <EmblemSvg sizeInPx={iconPixelSizes} />

      {/* Brand Typography */}
      <div className="flex flex-col justify-center text-right">
        <div className="flex items-center gap-2">
          <span
            className={`font-black ${titleSize} tracking-tight font-['Cairo'] leading-none flex items-center gap-1.5 transition-colors duration-300 ${
              lightText ? 'text-white' : 'text-[var(--text-primary)]'
            }`}
          >
            <span className="bg-gradient-to-l from-amber-500 via-yellow-500 to-amber-600 dark:from-amber-400 dark:via-yellow-300 dark:to-amber-500 bg-clip-text text-transparent drop-shadow-xs">
              دليلك
            </span>
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-500/25">
            خرائط جوجل 🇪🇬
          </span>
        </div>

        {showSubtitle && (
          <p
            className={`hidden sm:block ${subtitleSize} font-bold tracking-normal transition-colors duration-300 mt-1 leading-tight ${
              lightText ? 'text-amber-200/90' : 'text-[var(--text-secondary)]'
            }`}
          >
            المنصة الرسمية لتسجيل وتوثيق الأنشطة التجارية
          </p>
        )}
      </div>
    </div>
  );
};
