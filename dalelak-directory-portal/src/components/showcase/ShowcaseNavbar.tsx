import React from 'react';
import { Logo } from '../Logo';
import { Sparkles, Gift, Rocket, Sun, Moon } from 'lucide-react';

export interface ShowcaseNavbarProps {
  theme: string;
  toggleTheme: () => void;
  onOpenPackagesModal: (pkgId?: string) => void;
}

export const ShowcaseNavbar: React.FC<ShowcaseNavbarProps> = ({
  theme,
  toggleTheme,
  onOpenPackagesModal,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[var(--nav-bg)] backdrop-blur-xl border-b border-[var(--border-color)] transition-colors duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo size="md" showSubtitle={false} />
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-black text-[var(--text-secondary)]">
          <a href="#explore" className="hover:text-amber-500 transition-colors">
            معرض الأنشطة
          </a>
          <button
            type="button"
            onClick={() => onOpenPackagesModal('pkg_free')}
            className="text-emerald-600 dark:text-emerald-400 hover:underline transition-colors flex items-center gap-1.5 font-black cursor-pointer"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>الظهور المجاني (0 ج)</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenPackagesModal('pkg_basic')}
            className="text-amber-500 hover:text-amber-400 transition-all flex items-center gap-1.5 font-black cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-1.5 rounded-full border border-amber-500/30 shadow-xs active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>دليل الباقات المعتمدة</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenPackagesModal('pkg_pro')}
            className="hover:text-amber-500 transition-colors flex items-center gap-1.5 font-black cursor-pointer"
          >
            <Rocket className="w-3.5 h-3.5 text-amber-500" />
            <span>الحملات الدعائية (حسب الطلب)</span>
          </button>
          <a href="#map" className="hover:text-amber-500 transition-colors">
            الخريطة المباشرة
          </a>
          <a href="#why-dalelak" className="hover:text-amber-500 transition-colors">
            لماذا دليلك؟
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenPackagesModal('pkg_basic')}
            className="md:hidden bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] font-black px-2.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
            title="دليل الباقات المعتمدة"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>الباقات</span>
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="w-10 h-10 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-amber-500 transition-all cursor-pointer shadow-xs"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          <a
            href="#free-listing"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all hover:shadow-emerald-500/30 hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <Gift className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">اطلب الظهور مجاناً</span>
            <span className="sm:hidden">أضف مجاناً</span>
          </a>
        </div>
      </div>
    </header>
  );
};
