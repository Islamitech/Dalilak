import React from 'react';
import { Compass, Search, Map as MapIcon, Heart } from 'lucide-react';

export interface MobileBottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  favoritesCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPath,
  onNavigate,
  favoritesCount = 0,
}) => {
  const cleanRoute = currentPath.toLowerCase().split('?')[0];
  const isSearchMode = typeof window !== 'undefined' && window.location.search.includes('mode=all');

  const items = [
    {
      path: '/search',
      label: 'اكتشف',
      icon: Compass,
      isActive: (cleanRoute === '/search' || cleanRoute === '/discover') && !isSearchMode,
    },
    {
      path: '/search?mode=all',
      label: 'البحث',
      icon: Search,
      isActive: cleanRoute === '/search' && isSearchMode,
    },
    {
      path: '/',
      label: 'الخريطة',
      icon: MapIcon,
      isActive: cleanRoute === '/' || cleanRoute === '/map',
    },
    {
      path: '/favorites',
      label: 'المفضلة',
      icon: Heart,
      badge: favoritesCount > 0 ? favoritesCount : undefined,
      isActive: cleanRoute === '/favorites',
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-2xl transition-all"
      style={{
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
        direction: 'rtl',
      }}
      aria-label="التنقل على الهاتف"
    >
      <div className="grid grid-cols-4 h-15 max-w-md mx-auto items-center px-2 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => onNavigate(item.path)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 sm:px-2 transition-all cursor-pointer select-none rounded-xl active:scale-95 ${
                active
                  ? 'bg-amber-100/80 text-slate-950 font-extrabold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    active
                      ? 'stroke-[2.2] text-slate-950'
                      : 'text-slate-500'
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -left-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-mono font-black flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] mt-0.5 tracking-tight truncate max-w-full ${
                  active ? 'font-extrabold text-slate-950' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
