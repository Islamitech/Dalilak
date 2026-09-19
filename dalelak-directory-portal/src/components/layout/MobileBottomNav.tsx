import React from 'react';
import { Compass, Search, Map as MapIcon, Heart, PlusCircle } from 'lucide-react';

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

  const items = [
    {
      path: '/',
      label: 'أطلس الحدائق',
      icon: Compass,
      isActive: cleanRoute === '/',
    },
    {
      path: '/search',
      label: 'استكشف',
      icon: Search,
      isActive: cleanRoute === '/search',
    },
    {
      path: '/map',
      label: 'الخريطة',
      icon: MapIcon,
      isActive: cleanRoute === '/map',
    },
    {
      path: '/favorites',
      label: 'المفضلة',
      icon: Heart,
      badge: favoritesCount > 0 ? favoritesCount : undefined,
      isActive: cleanRoute === '/favorites',
    },
    {
      path: '/for-business',
      label: 'أضف نشاطك',
      icon: PlusCircle,
      isActive: cleanRoute === '/for-business' || cleanRoute === '/add-business',
      isHighlight: true,
    },
  ];

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-card)]/95 backdrop-blur-xl border-t border-[var(--border-color)] shadow-2xl transition-all"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        direction: 'rtl',
      }}
    >
      <div className="grid grid-cols-5 h-15 max-w-md mx-auto items-center px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => onNavigate(item.path)}
              className={`relative flex flex-col items-center justify-center py-1 px-0.5 transition-all cursor-pointer select-none rounded-xl active:scale-90 ${
                active
                  ? 'text-amber-600 dark:text-amber-400 font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
              }`}
            >
              {/* Active Indicator Top Pill */}
              {active && (
                <span className="absolute -top-1.5 w-6 h-1 bg-amber-500 rounded-full" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    active
                      ? 'stroke-[2.5] scale-110 text-amber-600 dark:text-amber-400'
                      : item.isHighlight
                      ? 'text-amber-500'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -left-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-mono font-black flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] mt-0.5 tracking-tight truncate max-w-full ${
                active ? 'font-black text-amber-700 dark:text-amber-400' : 'font-medium'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
