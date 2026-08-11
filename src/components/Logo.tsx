import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconDimensions = {
    sm: 'w-9 h-9 sm:w-11 sm:h-11',
    md: 'w-10 h-10 sm:w-14 sm:h-14',
    lg: 'w-14 h-14 sm:w-20 sm:h-20',
  }[size];

  const titleSize = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-xl',
    lg: 'text-xl sm:text-2xl',
  }[size];

  return (
    <div className={`flex items-center gap-2 sm:gap-3 select-none ${className}`}>
      {/* 3D Gold Badge + Breakout Pin Emblem Container */}
      <div className={`relative ${iconDimensions} flex-shrink-0 group cursor-pointer`}>
        {/* Ambient Gold Glow */}
        <div className="absolute inset-0 rounded-3xl bg-amber-400/40 blur-md group-hover:bg-amber-300/60 transition-all" />

        {/* 3D High-Precision SVG Logo matching User Reference Image */}
        <svg
          width="512"
          height="540"
          viewBox="0 0 512 540"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative overflow-visible transform group-hover:scale-105 transition-transform drop-shadow-xl"
        >
          {/* Main Gold Square Badge (Rounded Squircle Base) */}
          <rect x="40" y="125" width="432" height="375" rx="80" fill="url(#goldBaseGrad)" />
          {/* Subtle Inner Bevel & Depth Shadow */}
          <rect x="40" y="125" width="432" height="375" rx="80" fill="url(#goldInnerShadow)" opacity="0.3" />
          {/* Inset Gold Line Border */}
          <rect x="54" y="139" width="404" height="347" rx="66" stroke="url(#goldHighlight)" strokeWidth="6" fill="none" opacity="0.9" />

          {/* Pin Point Drop Shadow on Badge */}
          <path d="M256 350 L216 300 Q256 315 296 300 Z" fill="rgba(0,0,0,0.4)" blur="4" />

          {/* Breakout Teardrop Map Pin Container */}
          <g>
            {/* Map Pin Outer Shape (Teardrop) */}
            <path
              d="M256 25 C185 25 132 78 132 150 C132 215 256 345 256 345 C256 345 380 215 380 150 C380 78 327 25 256 25 Z"
              fill="url(#darkPinGrad)"
              stroke="url(#goldHighlight)"
              strokeWidth="11"
              strokeLinejoin="round"
            />

            {/* Inner Ring Circle around House Icon */}
            <circle cx="256" cy="145" r="70" stroke="url(#goldHighlight)" strokeWidth="10" fill="#111827" />

            {/* House / Store Icon Inside Pin */}
            {/* Roof (Golden/Yellow) */}
            <path d="M214 140 L256 102 L298 140 Z" fill="url(#roofGold)" stroke="#d4af37" strokeWidth="2" strokeLinejoin="round" />
            {/* Walls (White) */}
            <rect x="224" y="138" width="64" height="42" rx="4" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
            {/* Door (Emerald Green) */}
            <rect x="246" y="152" width="20" height="28" rx="3" fill="#10b981" stroke="#047857" strokeWidth="1.5" />

            {/* Emerald Green Verified Checkmark Circle Badge (Bottom Right of Pin) */}
            <g transform="translate(325, 205)">
              <circle cx="0" cy="0" r="26" fill="#10b981" stroke="#111827" strokeWidth="6" />
              <path
                d="M-10 1 L-3 8 L11 -6"
                stroke="#ffffff"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </g>

          {/* Gradients Definition */}
          <defs>
            {/* Gold Base Badge Gradient */}
            <linearGradient id="goldBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff7ed" />
              <stop offset="20%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="85%" stopColor="#b8860b" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Gold Highlight & Border Lines */}
            <linearGradient id="goldHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>

            {/* Roof Gold Gradient */}
            <linearGradient id="roofGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            {/* Dark Pin Interior Gradient */}
            <linearGradient id="darkPinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="45%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Inner Depth Shadow */}
            <radialGradient id="goldInnerShadow" cx="50%" cy="50%" r="70%">
              <stop offset="60%" stopColor="transparent" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className={`font-black ${titleSize} tracking-tight text-[var(--text-primary)] font-['Cairo'] flex items-center gap-1 transition-colors duration-300 leading-none`}>
            <span>دليلك</span>
          </span>

          <span className="hidden sm:inline-flex bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30 items-center gap-1 shadow-sm shrink-0">
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
