import React, { useState } from 'react';
import { Business } from '../../types';
import { InteractiveMap } from '../InteractiveMap';
import { BusinessCard } from '../cards/BusinessCard';
import { FilterBar } from '../search/FilterBar';
import { Layers, MapPin, X, Navigation, Phone, MessageCircle } from 'lucide-react';

export interface MapViewProps {
  businesses: Business[];
  filteredBusinesses: Business[];
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  sortBy: any;
  onSortChange: (s: any) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  userCoords: { lat: number; lng: number } | null;
  onNavigate: (path: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  businesses,
  filteredBusinesses,
  categoryFilter,
  onCategoryChange,
  sortBy,
  onSortChange,
  openNowOnly,
  onToggleOpenNow,
  onOpenBusiness,
  onToggleFavorite,
  favorites,
  userCoords,
  onNavigate,
}) => {
  const [selectedMapBiz, setSelectedMapBiz] = useState<Business | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4 pb-20">
      {/* Top Filter Bar with Mode Switcher */}
      <FilterBar
        categoryFilter={categoryFilter}
        onCategoryChange={onCategoryChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
        openNowOnly={openNowOnly}
        onToggleOpenNow={onToggleOpenNow}
        onOpenFilterDrawer={() => onNavigate('/search')}
        activeFiltersCount={0}
        activeView="map"
        showViewToggle={true}
        onViewChange={(v) => {
          if (v === 'grid') onNavigate('/search');
        }}
      />

      {/* Main Map Container */}
      <div className="relative rounded-3xl overflow-hidden border border-[var(--border-color)] bg-slate-900 shadow-xl">
        <InteractiveMap
          businesses={filteredBusinesses}
          mode="view"
          onSelectBusiness={(biz) => {
            setSelectedMapBiz(biz);
          }}
          heightClass="h-[550px] sm:h-[680px]"
        />

        {/* Selected Business Floating Card Overlay on Pin Click */}
        {selectedMapBiz && (
          <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-[1000] animate-slide-up">
            <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-2xl space-y-3 text-right">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    {selectedMapBiz.category}
                  </span>
                  <h4 className="font-black text-sm text-slate-900 mt-1 truncate">
                    {selectedMapBiz.nameAr}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {[selectedMapBiz.street, selectedMapBiz.city].filter(Boolean).join('، ')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMapBiz(null)}
                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onOpenBusiness(selectedMapBiz)}
                  className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs text-center cursor-pointer transition-colors"
                >
                  التفاصيل الكاملة
                </button>

                {selectedMapBiz.phone && (
                  <a
                    href={`tel:${selectedMapBiz.phone}`}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    <span>اتصال</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Synchronized Compact Places List below map */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span>أنشطة معروضة على الخريطة ({filteredBusinesses.length})</span>
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('/search')}
            className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
          >
            عرض القائمة الكاملة
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredBusinesses.slice(0, 4).map((biz) => (
            <BusinessCard
              key={biz.id}
              business={biz}
              onOpenBusiness={onOpenBusiness}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favorites.includes(biz.id)}
              userCoords={userCoords}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
