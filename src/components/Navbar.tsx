import React from 'react';
import { User } from '../types';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LogIn, LogOut } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  activeTab?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[var(--nav-bg)] backdrop-blur-md border-b border-[var(--border-color)] text-[var(--text-primary)] shadow-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 overflow-hidden">
        {/* Brand Logo */}
        <Logo size="md" />

        {/* Right side controls: Theme Toggle + User Badge / Login */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Theme Toggle Button (Light/Dark Switcher) */}
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full py-1 px-2.5 sm:px-3.5 shadow-sm transition-colors duration-300">
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center font-black text-[11px] sm:text-xs shrink-0 ${
                  user.role === 'admin'
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300 text-slate-950'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400 text-white'
                }`}>
                  {user.role === 'admin' ? 'M' : user.name.charAt(0)}
                </div>
                <div className="text-right">
                  <p className="text-[11px] sm:text-xs font-bold text-[var(--text-primary)] truncate max-w-[65px] sm:max-w-[140px] leading-tight">
                    {user.name}
                  </p>
                  <p className="hidden sm:block text-[10px] text-amber-600 dark:text-amber-400 font-extrabold leading-none mt-0.5">
                    {user.role === 'admin'
                      ? 'مدير النظام'
                      : user.role === 'supervisor'
                      ? 'مشرف منطقة'
                      : user.role === 'accountant'
                      ? 'محاسب ومحصل'
                      : 'مندوب معتمد'}
                  </p>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
                className="p-1.5 sm:p-2 rounded-full text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-[11px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span>تسجيل الدخول</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
