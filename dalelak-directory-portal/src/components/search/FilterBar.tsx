import React from 'react';
import {
  Sparkles,
  UtensilsCrossed,
  ShieldCheck,
  Wrench,
  Scissors,
  Shirt,
  ShoppingBag,
  GraduationCap,
  SlidersHorizontal,
  Clock,
  Compass,
  Video,
  Layers,
  Map as MapIcon,
  ArrowDownUp,
} from 'lucide-react';

export interface FilterBarProps {
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  sortBy: 'default' | 'nearest' | 'newest' | 'has_video' | 'open_now' | 'alpha';
  onSortChange: (sort: any) => void;
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
  { label: 'مطاعم', value: 'مطاعم ومأكولات', icon: UtensilsCrossed },
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
    <div className="w-full space-y-2">
      {/* 1. Category Chips Carousel: Smooth, compact horizontal scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar -mx-1 px-1">
        {POPULAR_CATEGORY_CHIPS.map((cat) => {
          const Icon = cat.icon;
          const isSelected = categoryFilter === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => onCategoryChange(cat.value)}
              className={`h-8 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs font-black'
                  : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-amber-600'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Action Controls Bar: Sleek, responsive, single-row on mobile */}
      <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-[var(--border-color)] overflow-x-auto pb-0.5 scrollbar-none no-scrollbar">
        {/* Quick Toggles Group */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Friendly Filter Button: Simple Arabic 'تصفية' instead of daunting 'فلترة متقدمة' */}
          <button
            type="button"
            onClick={onOpenFilterDrawer}
            className={`h-8 px-2.5 sm:px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 ${
              activeFiltersCount > 0
                ? 'bg-amber-500/15 border-amber-500/60 text-amber-900 font-black'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}
            title="خيارات التصفية التفصيلية"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>تصفية</span>
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
            className={`h-8 px-2.5 sm:px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 ${
              openNowOnly
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-800 font-black'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${openNowOnly ? 'text-emerald-600' : 'text-slate-400'} shrink-0`} />
            <span>مفتوح الآن</span>
          </button>

          {/* Quick Toggle: Nearest */}
          <button
            type="button"
            onClick={() => onSortChange(sortBy === 'nearest' ? 'default' : 'nearest')}
            className={`h-8 px-2.5 sm:px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 ${
              sortBy === 'nearest'
                ? 'bg-blue-500/15 border-blue-500/50 text-blue-800 font-black'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
            }`}
          >
            <Compass className={`w-3.5 h-3.5 ${sortBy === 'nearest' ? 'text-blue-600' : 'text-slate-400'} shrink-0`} />
            <span>الأقرب إلي</span>
          </button>

          {/* Quick Toggle: Has Video */}
          {onToggleHasVideo && (
            <button
              type="button"
              onClick={onToggleHasVideo}
              className={`h-8 px-2.5 sm:px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 ${
                hasVideoOnly
                  ? 'bg-purple-500/15 border-purple-500/50 text-purple-800 font-black'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
              }`}
              title="عرض الأنشطة التي تحتوي على فيديو تعريفي فقط"
            >
              <Video className={`w-3.5 h-3.5 ${hasVideoOnly ? 'text-purple-600' : 'text-slate-400'} shrink-0`} />
              <span>فيديو</span>
            </button>
          )}
        </div>

        {/* Sort Dropdown & View Mode Switcher */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative flex items-center">
            <div className="h-8 flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 text-xs font-bold text-slate-800 shadow-2xs">
              <ArrowDownUp className="w-3 h-3 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer py-1 pe-1"
                aria-label="ترتيب النتائج"
              >
                <option value="default">الأفضل مطابقة</option>
                                <option value="nearest">الأقرب أولاً</option>
                <option value="newest">الأحدث تسجيلاً</option>
                <option value="open_now">المفتوح أولاً</option>
                <option value="alpha">أبجدياً (أ-ي)</option>
              </select>
            </div>
          </div>

          {/* View Mode Switcher (Grid vs Map) */}
          {showViewToggle && onViewChange && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => onViewChange('grid')}
                className={`h-7 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  activeView === 'grid' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="عرض البطاقات"
                aria-label="عرض البطاقات"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onViewChange('map')}
                className={`h-7 px-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                  activeView === 'map' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="عرض الخريطة الحية"
                aria-label="عرض الخريطة الحية"
              >
                <MapIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
