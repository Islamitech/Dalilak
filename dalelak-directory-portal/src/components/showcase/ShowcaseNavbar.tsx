import React from 'react';
import { Logo } from '../Logo';
import { Compass, Store, Map as MapIcon, Layers } from 'lucide-react';

export interface ShowcaseNavbarProps {
  theme?: string;
  toggleTheme?: () => void;
  onOpenPackagesModal: (pkgId?: string) => void;
  onReopenOnboarding?: () => void;
}

export const ShowcaseNavbar: React.FC<ShowcaseNavbarProps> = ({
  onOpenPackagesModal,
  onReopenOnboarding,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[var(--nav-bg)] backdrop-blur-xl border-b border-[var(--border-color)] transition-colors duration-300 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Right: Logo */}
        <div className="flex items-center gap-3">
          <Logo size="md" showSubtitle={false} />
        </div>

        {/* Center: Clean, focused navigation for seeker */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-black text-[var(--text-secondary)]">
          <a
            href="#explore"
            className="hover:text-amber-500 transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>استكشف الأنشطة</span>
          </a>

          <a
            href="#map"
            className="hover:text-amber-500 transition-colors flex items-center gap-1.5"
          >
            <MapIcon className="w-3.5 h-3.5 text-amber-500" />
            <span>الخريطة الحية</span>
          </a>

          {onReopenOnboarding && (
            <button
              type="button"
              onClick={onReopenOnboarding}
              className="text-[var(--text-muted)] hover:text-amber-500 transition-colors flex items-center gap-1 font-bold cursor-pointer"
              title="دليلك يبدأ من مكانك"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>جولة الانطلاق</span>
            </button>
          )}
        </nav>

        {/* Left: Actions (Business Owner CTA) */}
        <div className="flex items-center gap-2.5">
          {/* Distinct Business Owner CTA: Clearly separate from seeker search */}
          <button
            type="button"
            onClick={() => onOpenPackagesModal('pkg_basic')}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-3.5 sm:px-4 py-2.5 rounded-2xl shadow-md hover:shadow-amber-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Store className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">لديك نشاط؟ أضفه مجاناً</span>
            <span className="sm:hidden">أضف نشاطك</span>
          </button>
        </div>
      </div>
    </header>
  );
};
