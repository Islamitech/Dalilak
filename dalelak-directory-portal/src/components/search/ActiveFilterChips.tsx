import React from 'react';
import { X, RotateCcw } from 'lucide-react';

export interface ActiveFilterChipsProps {
  categoryFilter: string;
  onClearCategory: () => void;
  selectedGov: string;
  onClearGov: () => void;
  selectedCity: string;
  onClearCity: () => void;
  openNowOnly: boolean;
  onClearOpenNow: () => void;
  hasVideoOnly?: boolean;
  onClearHasVideo?: () => void;
  sortBy: string;
  onClearSort: () => void;
  onResetAll: () => void;
  hasActiveFilters: boolean;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  categoryFilter,
  onClearCategory,
  selectedGov,
  onClearGov,
  selectedCity,
  onClearCity,
  openNowOnly,
  onClearOpenNow,
  hasVideoOnly = false,
  onClearHasVideo,
  sortBy,
  onClearSort,
  onResetAll,
  hasActiveFilters,
}) => {
  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1 text-xs">
      <span className="text-[11px] font-bold text-slate-500 ml-1">الفلاتر المطبقة:</span>

      {categoryFilter !== 'all' && (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-bold animate-fade-in">
          <span>التصنيف: {categoryFilter}</span>
          <button
            type="button"
            onClick={onClearCategory}
            className="w-4 h-4 rounded-full hover:bg-amber-200 flex items-center justify-center cursor-pointer transition-colors"
            title="إلغاء هذا الفلتر"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      )}

      {selectedGov !== 'all' && (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-bold animate-fade-in">
          <span>المحافظة: {selectedGov}</span>
          <button
            type="button"
            onClick={onClearGov}
            className="w-4 h-4 rounded-full hover:bg-blue-200 flex items-center justify-center cursor-pointer transition-colors"
            title="إلغاء هذا الفلتر"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      )}

      {selectedCity !== 'all' && (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-bold animate-fade-in">
          <span>المنطقة: {selectedCity}</span>
          <button
            type="button"
            onClick={onClearCity}
            className="w-4 h-4 rounded-full hover:bg-blue-200 flex items-center justify-center cursor-pointer transition-colors"
            title="إلغاء هذا الفلتر"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      )}

      {openNowOnly && (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold animate-fade-in">
          <span>مفتوح الآن</span>
          <button
            type="button"
            onClick={onClearOpenNow}
            className="w-4 h-4 rounded-full hover:bg-emerald-200 flex items-center justify-center cursor-pointer transition-colors"
            title="إلغاء هذا الفلتر"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      )}

      {hasVideoOnly && (
        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-900 border border-purple-200 px-2.5 py-1 rounded-lg text-xs font-bold animate-fade-in">
          <span>يحتوي على فيديو</span>
          {onClearHasVideo && (
            <button
              type="button"
              onClick={onClearHasVideo}
              className="w-4 h-4 rounded-full hover:bg-purple-200 flex items-center justify-center cursor-pointer transition-colors"
              title="إلغاء هذا الفلتر"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </span>
      )}

      {sortBy !== 'default' && (
        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-bold animate-fade-in">
          <span>
            ترتيب:{' '}
            {sortBy === 'nearest'
              ? 'الأقرب أولاً'
              : sortBy === 'newest'
              ? 'الأحدث'
              : sortBy === 'open_now'
              ? 'المفتوح أولاً'
              : sortBy}
          </span>
          <button
            type="button"
            onClick={onClearSort}
            className="w-4 h-4 rounded-full hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
            title="إلغاء الترتيب"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      )}

      <button
        type="button"
        onClick={onResetAll}
        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer mr-auto"
      >
        <RotateCcw className="w-3 h-3" />
        <span>إعادة ضبط الكل</span>
      </button>
    </div>
  );
};
