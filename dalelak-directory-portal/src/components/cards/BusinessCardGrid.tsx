import React, { useState, useEffect } from 'react';
import { Business } from '../../types';
import { BusinessCard } from './BusinessCard';
import { Search, RotateCcw, Sparkles } from 'lucide-react';

export interface BusinessCardGridProps {
  businesses: Business[];
  loading?: boolean;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  userCoords: { lat: number; lng: number } | null;
  onResetFilters: () => void;
  onOpenVideoModal?: (biz: Business) => void;
  pageSize?: number;
}

export const BusinessCardGrid: React.FC<BusinessCardGridProps> = ({
  businesses,
  loading = false,
  onOpenBusiness,
  onToggleFavorite,
  favorites,
  userCoords,
  onResetFilters,
  onOpenVideoModal,
  pageSize = 12,
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [businesses, pageSize]);

  const visibleList = businesses.slice(0, visibleCount);
  const hasMore = visibleCount < businesses.length;

  // 1. Loading Skeleton
  if (loading && businesses.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in py-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={`skel-${i}`}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs animate-pulse flex flex-col justify-between"
          >
            <div className="aspect-[4/3] bg-slate-200" />
            <div className="p-4 sm:p-5 space-y-3">
              <div className="space-y-2">
                <div className="h-3 bg-slate-200 rounded-md w-1/3" />
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-3 bg-slate-200 rounded-md w-1/2" />
              </div>
              <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-1.5">
                <div className="h-8 bg-slate-200 rounded-xl" />
                <div className="h-8 bg-slate-200 rounded-xl" />
                <div className="h-8 bg-slate-200 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2. Empty State
  if (!loading && businesses.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-sm max-w-lg mx-auto animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <Search className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="font-black text-base text-[var(--text-primary)]">
            لم نجد أنشطة مطابقة لخيارات بحثك
          </h3>
          <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed">
            جرّب توسيع النطاق الجغرافي، أو تغيير التصنيف المختار، أو إزالة بعض الفلاتر.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800 bg-amber-500/15 hover:bg-amber-500/25 px-5 py-2.5 rounded-xl border border-amber-500/30 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة ضبط كافة الفلاتر</span>
        </button>
      </div>
    );
  }

  // 3. Grid View
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleList.map((biz) => (
          <BusinessCard
            key={biz.id}
            business={biz}
            onOpenBusiness={onOpenBusiness}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favorites.includes(biz.id)}
            userCoords={userCoords}
            onOpenVideoModal={onOpenVideoModal}
          />
        ))}
      </div>

      {/* Pagination / Load More Status */}
      <div className="pt-2 pb-4 flex flex-col items-center justify-center gap-2">
        <p className="text-xs text-slate-500 font-bold">
          عرض {visibleList.length} من أصل {businesses.length} نشاطاً
        </p>

        {hasMore && (
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + pageSize)}
            className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm px-8 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <span>تحميل المزيد ({businesses.length - visibleList.length} متبقي)</span>
          </button>
        )}
      </div>
    </div>
  );
};
