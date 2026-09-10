import React from 'react';
import {
  Sparkles,
  UtensilsCrossed,
  ShieldCheck,
  Wrench,
  Scissors,
  ShoppingBag,
  GraduationCap,
  Shirt,
  SlidersHorizontal,
  Clock,
  Star,
  Compass,
  Layers,
  Map as MapIcon,
  Video,
} from 'lucide-react';

export interface FilterBarProps {
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  sortBy: 'default' | 'nearest' | 'newest' | 'has_video' | 'open_now' | 'alpha';
  onSortChange: (sort: 'default' | 'nearest' | 'newest' | 'has_video' | 'open_now' | 'alpha') => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  hasVideoOnly?: boolean;
  onToggleHasVideo?: () => void;
  onOpenFilterDrawer: () => void;
  activeFiltersCount: number;
  activeView?: 'grid' | 'map';
  onViewChange?: (view: 'grid' | 'map') => void;
  showViewToggle?: boolean;
}

export const POPULAR_CATEGORY_CHIPS = [
  { label: 'الكل', value: 'all', icon: Sparkles },
  { label: 'مطاعم ومأكولات', value: 'مطاعم ومأكولات', icon: UtensilsCrossed },
  { label: 'طبي وصيدلي', value: 'طبي وصيدلي', icon: ShieldCheck },
  { label: 'سيارات وصيانة', value: 'سيارات وصيانة', icon: Wrench },
  { label: 'تجميل وعناية', value: 'تجميل وعناية', icon: Scissors },
  { label: 'ملابس وأزياء', value: 'ملابس وأزياء', icon: Shirt },
  { label: 'خدمات منزلية', value: 'خدمات منزلية', icon: ShoppingBag },
  { label: 'تعليم وتدريب', value: 'تعليم وتدريب', icon: GraduationCap },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  categoryFilter,
  onCategoryChange,
  sortBy,
  onSortChange,
  openNowOnly,
  onToggleOpenNow,
  hasVideoOnly = false,
  onToggleHasVideo,
  onOpenFilterDrawer,
  activeFiltersCount,
  activeView = 'grid',
  onViewChange,
  showViewToggle = false,
}) => {
  return (
    <div className="w-full space-y-2.5">
      {/* Category Chips Carousel / Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar">
        {POPULAR_CATEGORY_CHIPS.map((cat) => {
          const Icon = cat.icon;
          const isSelected = categoryFilter === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => onCategoryChange(cat.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-amber-600'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Second Row: Quick Filters & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--border-color)]">
        {/* Left: Quick Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Advanced Filters Button */}
          <button
            type="button"
            onClick={onOpenFilterDrawer}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeFiltersCount > 0
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
            <span>فلترة متقدمة</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-mono flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Quick Toggle: Open Now */}
          <button
            type="button"
            onClick={onToggleOpenNow}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all cursor-pointer ${
              openNowOnly
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${openNowOnly ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>مفتوح الآن</span>
          </button>

          {/* Quick Toggle: Nearest */}
          <button
            type="button"
            onClick={() => onSortChange(sortBy === 'nearest' ? 'default' : 'nearest')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all cursor-pointer ${
              sortBy === 'nearest'
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Compass className={`w-3.5 h-3.5 ${sortBy === 'nearest' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span>الأقرب أولاً</span>
          </button>

          {/* Quick Toggle: Has Video */}
          {onToggleHasVideo && (
            <button
              type="button"
              onClick={onToggleHasVideo}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all cursor-pointer ${
                hasVideoOnly
                  ? 'bg-purple-500/15 border-purple-500/40 text-purple-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="عرض الأنشطة التي تحتوي على فيديو تعريفي فقط"
            >
              <Video className={`w-3.5 h-3.5 ${hasVideoOnly ? 'text-purple-600' : 'text-slate-400'}`} />
              <span>فيديو</span>
            </button>
          )}
        </div>

        {/* Right: Sort Dropdown & View Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <span className="hidden sm:inline">ترتيب:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="default">الأفضل مطابقة</option>
              <option value="nearest">الأقرب جغرافياً</option>
              <option value="newest">الأحدث انضماماً</option>
              <option value="open_now">المفتوح أولاً</option>
              <option value="alpha">أبجدياً (أ-ي)</option>
            </select>
          </div>

          {/* View Mode Switcher (if enabled) */}
          {showViewToggle && onViewChange && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => onViewChange('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'grid' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="عرض البطاقات"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onViewChange('map')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'map' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="عرض الخريطة الحية"
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
