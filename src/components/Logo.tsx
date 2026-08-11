import React from 'react';

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
    <div className={`relative ${iconDimensions} flex-shrink-0 group cursor-pointer`}>
      {/* Soft Ambient Gold Glow */}
      <div className="absolute inset-0 rounded-2xl bg-amber-500/30 blur-sm group-hover:bg-amber-400/50 transition-all duration-300" />

      {/* Clean Minimalist Vector Emblem */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative transform group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
      >
        {/* Outer Rounded Golden Squircle Base */}
        <rect x="5" y="5" width="90" height="90" rx="26" fill="url(#dalilakGoldGrad)" />
        {/* Subtle Metallic Border Highlight */}
        <rect x="7" y="7" width="86" height="86" rx="24" stroke="url(#dalilakLightHighlight)" strokeWidth="2.5" opacity="0.8" fill="none" />

        {/* Central Teardrop Map Pin (Dark Charcoal Body) */}
        <path
          d="M50 16 C36 16 26 26 26 40 C26 55 50 78 50 78 C50 78 74 55 74 40 C74 26 64 16 50 16 Z"
          fill="#0f172a"
          stroke="url(#dalilakLightHighlight)"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Inner Golden Ring */}
        <circle cx="50" cy="38" r="14" fill="#0f172a" stroke="url(#dalilakGoldGrad)" strokeWidth="2.5" />

        {/* Store Roof (White & Gold Accent) */}
        <path d="M42 37 L50 30 L58 37 Z" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" strokeLinejoin="round" />

        {/* Store House Body (Crisp White) */}
        <rect x="44" y="37" width="12" height="9" rx="1.5" fill="#ffffff" />
        {/* Door (Emerald Green) */}
        <rect x="48" y="40" width="4" height="6" rx="0.8" fill="#10b981" />

        {/* Green Verification Dot (Bottom Right of Pin) */}
        <circle cx="64" cy="52" r="5" fill="#10b981" stroke="#0f172a" strokeWidth="1.5" />
        <path d="M62 52 L63.5 53.5 L66 50.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Gradients */}
        <defs>
          <linearGradient id="dalilakGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>

          <linearGradient id="dalilakLightHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
      </svg>
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

          <span className="hidden sm:inline-flex bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30 items-center gap-1 shadow-sm shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>خرائط جوجل مصر</span>
          </span>
        </div>

        {showSubtitle && (
          <p className="hidden sm:block text-[10px] sm:text-[11px] text-[var(--text-secondary)] font-bold tracking-normal transition-colors duration-300 mt-0.5">
            تسجيل وتوثيق الأنشطة التجارية
          </p>
        )}
      </div>
    </div>
  );
};
