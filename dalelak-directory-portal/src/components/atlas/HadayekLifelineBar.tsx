import React from 'react';
import { HADAYEK_LIFELINES } from '../../data/hadayekAtlasData';
import { Pill, ShoppingCart, Wrench, Croissant, Compass } from 'lucide-react';

export interface HadayekLifelineBarProps {
  onSelectCategory: (categoryQuery: string) => void;
  onOpenGatesGuide: () => void;
  activeCategory?: string;
  className?: string;
}

export const HadayekLifelineBar: React.FC<HadayekLifelineBarProps> = ({
  onSelectCategory,
  onOpenGatesGuide,
  activeCategory = '',
  className = '',
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Pill':
        return Pill;
      case 'ShoppingCart':
        return ShoppingCart;
      case 'Wrench':
        return Wrench;
      case 'Croissant':
        return Croissant;
      case 'Compass':
      default:
        return Compass;
    }
  };

  return (
    <div className={`space-y-2.5 ${className}`} dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <h3 className="text-xs sm:text-sm font-black text-[var(--text-primary)]">
            خدمات الطوارئ والحياة اليومية بالحدائق
          </h3>
        </div>
        <span className="text-[10px] font-bold text-[var(--text-secondary)]">
          وصول سريع بضغطة واحدة
        </span>
      </div>

      {/* Horizontal / Responsive Chips Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
        {HADAYEK_LIFELINES.map((item) => {
          const Icon = getIcon(item.icon);
          const isGates = item.id === 'gates_guide';
          const isActive = !isGates && activeCategory === item.categoryQuery;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (isGates) {
                  onOpenGatesGuide();
                } else {
                  onSelectCategory(item.categoryQuery);
                }
              }}
              className={`p-3 rounded-2xl border text-right transition-all flex items-start gap-2.5 cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black'
                  : 'bg-[var(--bg-card)] hover:bg-slate-50 dark:hover:bg-slate-800/80 border-[var(--border-color)] hover:border-amber-500/40 text-[var(--text-primary)]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive
                    ? 'bg-slate-950 text-amber-400'
                    : isGates
                    ? 'bg-amber-500/15 text-amber-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.5]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 justify-between">
                  <h4 className="text-xs font-black truncate">{item.nameAr}</h4>
                </div>
                {item.badgeAr && (
                  <span
                    className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {item.badgeAr}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
