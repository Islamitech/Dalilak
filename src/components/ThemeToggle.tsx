import React from 'react';
import { useThemeToggle } from '../hooks/useThemeToggle';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { toggleTheme, getToggleLabel, isDark } = useThemeToggle();

  return (
    <button
      onClick={toggleTheme}
      className={`relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-300 border shadow-sm active:scale-95 cursor-pointer select-none shrink-0 ${
        isDark
          ? 'bg-slate-800/90 text-amber-300 border-amber-500/40 hover:bg-slate-800 hover:border-amber-400 shadow-slate-950/40'
          : 'bg-white text-slate-900 border-amber-500/40 hover:bg-amber-50 text-amber-800 shadow-amber-500/10'
      } ${className}`}
      title={isDark ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}
      aria-label="Toggle theme"
    >
      <span className="text-sm transition-transform duration-300">
        {isDark ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />}
      </span>
      <span className="hidden sm:inline">{getToggleLabel()}</span>
    </button>
  );
};
