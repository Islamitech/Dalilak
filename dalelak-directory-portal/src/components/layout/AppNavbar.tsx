import React, { useState } from 'react';
import { Logo } from '../Logo';
import {
  Search,
  Map as MapIcon,
  Heart,
  Store,
  Menu,
  X,
  Sparkles,
  Info,
  BadgeDollarSign
} from 'lucide-react';

export interface AppNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  favoritesCount?: number;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  currentPath,
  onNavigate,
  favoritesCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: 'الرئيسية' },
    { path: '/search', label: 'استكشف الأنشطة', icon: Search },
    { path: '/map', label: 'الخريطة الحية', icon: MapIcon },
    { path: '/favorites', label: 'المفضلة', icon: Heart, badge: favoritesCount > 0 ? favoritesCount : undefined },
  ];

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-card)]/95 backdrop-blur-md border-b border-[var(--border-color)] transition-colors duration-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Right (RTL Start): Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleLinkClick('/')}
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
            aria-label="الصفحة الرئيسية لمنصة دليلك"
          >
            <Logo size="md" showSubtitle={false} />
          </button>
        </div>

        {/* Center: Desktop Clean Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 text-xs font-black text-[var(--text-secondary)]">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                type="button"
                onClick={() => handleLinkClick(link.path)}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-800 font-black'
                    : 'hover:bg-slate-100 hover:text-[var(--text-primary)] text-[var(--text-secondary)]'
                }`}
              >
                {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />}
                <span>{link.label}</span>
                {link.badge !== undefined && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Left (RTL End): Business Owner CTA & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Subtle Pricing / Growth link for interested owners */}
          <button
            type="button"
            onClick={() => handleLinkClick('/pricing')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-slate-600 hover:text-amber-700 hover:bg-amber-50/60 transition-all cursor-pointer"
          >
            <BadgeDollarSign className="w-4 h-4 text-amber-600" />
            <span>باقات النمو</span>
          </button>

          {/* Primary Business Owner CTA: Dedicated distinct action */}
          <button
            type="button"
            onClick={() => handleLinkClick('/for-business')}
            className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs px-3.5 sm:px-4 py-2.5 rounded-xl shadow-xs hover:shadow-sm flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Store className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">هل تملك نشاطاً؟ أضفه مجاناً</span>
            <span className="sm:hidden">أضف نشاطك</span>
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
            aria-label="القائمة الرئيسية"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--border-color)] bg-[var(--bg-card)] px-4 pt-3 pb-5 space-y-2 animate-fade-in shadow-xl">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                type="button"
                onClick={() => handleLinkClick(link.path)}
                className={`w-full px-4 py-3 rounded-xl flex items-center justify-between text-xs font-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-700'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />}
                  <span>{link.label}</span>
                </div>
                {link.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={() => handleLinkClick('/for-business')}
              className="w-full px-4 py-3 rounded-xl bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                <span>إدراج نشاطك مجاناً</span>
              </div>
              <span className="text-[10px] bg-slate-950 text-white px-2 py-0.5 rounded-md">مجاني</span>
            </button>

            <button
              type="button"
              onClick={() => handleLinkClick('/pricing')}
              className="w-full px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <BadgeDollarSign className="w-4 h-4 text-amber-600" />
              <span>باقات وحلول النمو التسويقي</span>
            </button>

            <button
              type="button"
              onClick={() => handleLinkClick('/about')}
              className="w-full px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
            >
              <Info className="w-4 h-4 text-slate-400" />
              <span>عن منصة دليلك</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
