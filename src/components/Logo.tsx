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
    md: 48,
    lg: 60,
    xl: 76,
    '2xl': 98,
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

  // Tailored Concept 2 SVG: The Guide Lighthouse Beacon & Verification Map Pin
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
        {/* Golden Beacon Gradient */}
        <linearGradient id="dalelakGold" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="25%" stopColor="#FDE68A" />
          <stop offset="55%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Cyan Emerald Verification Gradient */}
        <linearGradient id="cyanEmerald" x1="20" y1="60" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="35%" stopColor="#06B6D4" />
          <stop offset="75%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Deep Slate Inset Background */}
        <linearGradient id="slateBase" x1="30" y1="30" x2="170" y2="170" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="50%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        {/* Glow Lighting Filter */}
        <filter id="beaconGlow" x="-15%" y="-15%" width="130%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#06B6D4" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* 1. Outer Rounded Squircle Badge Base */}
      <rect
        x="12"
        y="12"
        width="176"
        height="176"
        rx="46"
        fill="url(#slateBase)"
        stroke="url(#dalelakGold)"
        strokeWidth="2.5"
      />

      {/* 2. Concentric Light Ray Rings */}
      <circle cx="100" cy="80" r="50" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
      <circle cx="100" cy="80" r="32" stroke="#38BDF8" strokeWidth="1" strokeDasharray="2 4" opacity="0.4" />

      {/* 3. Radiant Lighthouse Beams (Light Rays emanating outward) */}
      <path d="M100 24 L100 38" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" />
      <path d="M62 42 L72 52" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      <path d="M138 42 L128 52" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      <path d="M44 80 L58 80" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      <path d="M156 80 L142 80" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />

      {/* 4. The Lighthouse Guide Tower (منارة دليلك) */}
      <g filter="drop-shadow(0 4px 8px rgba(0,0,0,0.5))">
        {/* Top Star Beacon */}
        <path
          d="M100 38 L102.5 44 L108 44.5 L104 48 L105 53.5 L100 50.5 L95 53.5 L96 48 L92 44.5 L97.5 44 Z"
          fill="#FFFBEB"
        />

        {/* Lighthouse Lantern Room Dome & Glow */}
        <path
          d="M93 54 C93 50 107 50 107 54 L109 64 L91 64 Z"
          fill="url(#dalelakGold)"
          stroke="#FFFFFF"
          strokeWidth="1.2"
        />
        <rect x="94" y="58" width="12" height="5" rx="1.5" fill="#FFFBEB" />

        {/* Lighthouse Main Tapered Body */}
        <path
          d="M91 66 L86 104 L114 104 L109 66 Z"
          fill="url(#dalelakGold)"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />

        {/* Windows & Architectural Bands on the Tower */}
        <rect x="96" y="74" width="8" height="9" rx="2" fill="#0F172A" />
        <rect x="95" y="89" width="10" height="11" rx="2" fill="#0F172A" />
        <line x1="88" y1="84" x2="112" y2="84" stroke="#D97706" strokeWidth="2" />
      </g>

      {/* 5. The Dynamic Interlocking Map Pin & Verification Checkmark Swoosh */}
      <g filter="url(#beaconGlow)">
        {/* Outer Map Pin Frame */}
        <path
          d="M100 36 C64 36 38 62 38 98 C38 128 72 158 100 178 C100 178 104 175 108 171"
          stroke="url(#cyanEmerald)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />

        {/* Verification Checkmark Swoosh intertwining through the base */}
        <path
          d="M48 112 C58 112 70 128 88 152 L164 68"
          stroke="url(#cyanEmerald)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Inner Golden Highlights on the Checkmark */}
        <path
          d="M52 112 C60 112 72 128 88 150 L160 72"
          stroke="url(#dalelakGold)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* 6. Sharp GPS Location Pin Point */}
      <path
        d="M100 166 L93 178 L107 178 Z"
        fill="url(#dalelakGold)"
      />
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
      <div className={`inline-flex items-center gap-3 bg-[var(--bg-surface)]/90 border border-cyan-500/30 rounded-2xl p-2.5 sm:p-3 shadow-md backdrop-blur-md select-none ${className}`}>
        <EmblemSvg sizeInPx={iconPixelSizes} />
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm sm:text-base text-[var(--text-primary)] font-['Cairo'] leading-none">
              دليلك
            </span>
            <span className="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-cyan-500/30">
              توثيق معتمد ⚡
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-bold mt-1">
            منظومة توثيق خرائط جوجل — جمهورية مصر العربية
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
            <span className="bg-gradient-to-l from-amber-400 via-yellow-400 to-cyan-400 dark:from-amber-300 dark:via-yellow-200 dark:to-cyan-400 bg-clip-text text-transparent drop-shadow-xs">
              دليلك
            </span>
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-cyan-500/30">
            خرائط جوجل 🇪🇬
          </span>
        </div>

        {showSubtitle && (
          <p
            className={`hidden sm:block ${subtitleSize} font-bold tracking-normal transition-colors duration-300 mt-1 leading-tight ${
              lightText ? 'text-cyan-200/90' : 'text-[var(--text-secondary)]'
            }`}
          >
            المنصة الرسمية لتسجيل وتوثيق الأنشطة التجارية
          </p>
        )}
      </div>
    </div>
  );
};
