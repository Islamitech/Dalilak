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
    sm: 'w-8 h-8 sm:w-10 sm:h-10',
    md: 'w-9 h-9 sm:w-12 sm:h-12',
    lg: 'w-12 h-12 sm:w-16 sm:h-16',
  }[size];

  const titleSize = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-xl',
    lg: 'text-xl sm:text-2xl',
  }[size];

  return (
    <div className={`flex items-center gap-2 sm:gap-3 select-none ${className}`}>
      {/* 3D Breakout Emblem Container */}
      <div className={`relative ${iconDimensions} flex-shrink-0 group cursor-pointer`}>
        {/* Ambient Gold Glow */}
        <div className="absolute inset-0 rounded-2xl bg-amber-400/40 blur-md group-hover:bg-amber-300/60 transition-all" />

        {/* 3D SVG Badge with Top Pin Breakout Effect */}
        <svg
          width="512"
          height="540"
          viewBox="0 -35 512 547"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative overflow-visible transform group-hover:scale-105 transition-transform"
        >
          <rect x="20" y="45" width="472" height="455" rx="104" fill="url(#goldBg)" />
          <rect x="20" y="45" width="472" height="455" rx="104" fill="url(#goldShadow)" opacity="0.2" />
          <rect x="28" y="53" width="456" height="439" rx="96" stroke="rgba(255,255,255,0.3)" strokeWidth="3.5" />

          {/* Map Pin Emblem */}
          <g transform="translate(256, 215) scale(1.38)">
              <ellipse cx="0" cy="74" rx="46" ry="12" fill="rgba(0,0,0,0.35)" />
              <path 
                d="M0 -76 C-44 -76 -78 -36 -78 0 C-78 44 0 92 0 92 C0 92 78 44 78 0 C78 -36 44 -76 0 -76Z" 
                fill="url(#darkGrad)" 
                stroke="url(#goldGrad)" 
                strokeWidth="4.5"
              />
              <path 
                d="M-28 -48 C-44 -32 -52 -14 -52 4 C-52 28 -20 52 0 64" 
                stroke="rgba(255,255,255,0.18)" 
                strokeWidth="4" 
                fill="none"
                strokeLinecap="round" 
              />
              <circle cx="0" cy="-8" r="36" fill="url(#goldGrad)" stroke="#ffffff" strokeWidth="2" opacity="0.95" />
              <circle cx="0" cy="-8" r="30" fill="#0f172a" stroke="url(#goldGrad)" strokeWidth="2.5" />
              <path d="M-16 -15 L0 -28 L16 -15 V-10 H-16 V-15Z" fill="url(#goldGrad)" />
              <path d="M-15 -10 V3 H15 V-10 H-15ZM-5 3 V-5 H5 V3 H-5Z" fill="#ffffff" />
              <path d="M-4 -5 H4 V3 H-4 V-5Z" fill="#10b981" />
              <circle cx="30" cy="26" r="12" fill="#10b981" stroke="#0f172a" strokeWidth="3" />
              <path d="M25 26 L28.5 29.5 L35 22.5" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          
          <circle cx="256" cy="270" r="160" stroke="url(#goldGrad)" strokeWidth="2" opacity="0.08" />
          <circle cx="256" cy="270" r="185" stroke="url(#goldGrad)" strokeWidth="1.5" opacity="0.05" />
          
          <defs>
              <linearGradient id="goldBg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="25%" stopColor="#f5d742" />
                  <stop offset="50%" stopColor="#d4af37" />
                  <stop offset="85%" stopColor="#b8860b" />
                  <stop offset="100%" stopColor="#784f04" />
              </linearGradient>
              
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fffbeb" />
                  <stop offset="30%" stopColor="#fef08a" />
                  <stop offset="65%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              
              <linearGradient id="darkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="40%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
              </linearGradient>
              
              <radialGradient id="goldShadow" cx="50%" cy="100%" r="70%">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
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
