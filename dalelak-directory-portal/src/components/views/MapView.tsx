import React, { useState, useMemo, useEffect } from 'react';
import { Business } from '../../types';
import { InteractiveMap } from '../InteractiveMap';
import { BusinessCard } from '../cards/BusinessCard';
import { FilterBar } from '../search/FilterBar';
import { getBusinessMapDetails } from '../../utils/directoryEnhancements';
import {
  HadayekZone,
  HADAYEK_ZONES,
  getHadayekZone,
  getRecommendedGateForZone,
  estimateBuildingCoordinates,
} from '../../data/hadayekAtlasData';
import { ProximityRadarDrawer } from '../atlas/ProximityRadarDrawer';
import { HadayekGatesModal } from '../atlas/HadayekGatesModal';
import {
  Compass,
  MapPin,
  X,
  Navigation,
  Phone,
  Building2,
  ExternalLink,
  Layers,
  HelpCircle,
} from 'lucide-react';

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
  const [isGatesModalOpen, setIsGatesModalOpen] = useState<boolean>(false);

  // 1. Read URL params (?zone=...&bldg=...)
  const [activeZoneLetter, setActiveZoneLetter] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('zone') || '';
  });

  const [activeBuildingNumber, setActiveBuildingNumber] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('bldg') || '';
  });

  // Keep state synced if URL changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const z = params.get('zone') || '';
    const b = params.get('bldg') || '';
    if (z !== activeZoneLetter) setActiveZoneLetter(z);
    if (b !== activeBuildingNumber) setActiveBuildingNumber(b);
  }, []);

  // 2. Compute Target Building / Zone (Only if an explicit building number is requested)
  const targetBuilding = useMemo(() => {
    if (!activeZoneLetter || !activeBuildingNumber) return null;
    const zone = getHadayekZone(activeZoneLetter);
    if (!zone) return null;
    const coords = estimateBuildingCoordinates(zone.letterAr, activeBuildingNumber);
    return {
      zone,
      zoneLetter: zone.letterAr,
      buildingNumber: activeBuildingNumber,
      lat: coords.lat,
      lng: coords.lng,
      coords: { lat: coords.lat, lng: coords.lng },
    };
  }, [activeZoneLetter, activeBuildingNumber]);

  // Recommended gate for current target
  const gateInfo = useMemo(() => {
    if (!activeZoneLetter) return null;
    return getRecommendedGateForZone(activeZoneLetter);
  }, [activeZoneLetter]);

  const handleSelectZoneJump = (zoneLetter: string) => {
    setActiveZoneLetter(zoneLetter);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('zone', zoneLetter);
    if (!activeBuildingNumber) newUrl.searchParams.delete('bldg');
    window.history.replaceState({}, '', newUrl.toString());
  };

  const handleClearTarget = () => {
    setActiveZoneLetter('');
    setActiveBuildingNumber('');
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('zone');
    newUrl.searchParams.delete('bldg');
    window.history.replaceState({}, '', newUrl.toString());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4 pb-20" dir="rtl">
      {/* Hadayek Atlas Quick Zone Bar */}
      <div className="bg-[var(--bg-card)] border border-amber-500/25 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-black">
            <Compass className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-black text-[var(--text-primary)] block">
              أطلس مناطق حدائق الأهرام
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              انتقل فورياً لأي منطقة (أ إلى ن) أو اعرض بواباتها
            </span>
          </div>
        </div>

        {/* 16 Zones Horizontal Scroll */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {HADAYEK_ZONES.map((z) => {
            const isSelected = activeZoneLetter === z.letterAr;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => handleSelectZoneJump(z.letterAr)}
                className={`text-[11px] font-black px-2.5 py-1 rounded-xl transition-all cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:border-slate-300'
                }`}
              >
                {z.letterAr}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setIsGatesModalOpen(true)}
          className="text-xs font-black text-amber-700 dark:text-amber-400 hover:underline shrink-0 flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>دليل البوابات</span>
        </button>
      </div>

      {/* Target Building Highlight Banner (if active) */}
      {targetBuilding && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <Building2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-[var(--text-primary)]">
                  {targetBuilding.buildingNumber
                    ? `عمارة ${targetBuilding.buildingNumber} - ${targetBuilding.zone.nameAr}`
                    : targetBuilding.zone.nameAr}
                </span>
                {gateInfo && (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    🚪 البوابة الموصى بها: {gateInfo.primaryGate.nameAr} ({gateInfo.primaryGate.popularNameAr})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                موضحة بالدبوس الذهبي المتوهج ودائرة نطاق القرب (200 متر) على الخريطة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearTarget}
            className="text-xs font-black text-slate-500 hover:text-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            إلغاء التحديد
          </button>
        </div>
      )}

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
          targetBuilding={targetBuilding}
          showHadayekGates={true}
          onSelectZone={handleSelectZoneJump}
          onSelectBusiness={(biz) => {
            setSelectedMapBiz(biz);
          }}
          heightClass="h-[550px] sm:h-[680px]"
        />

        {/* Selected Business Floating Card Overlay on Pin Click */}
        {selectedMapBiz && (() => {
          const { effectiveUrl, isOfficial } = getBusinessMapDetails(selectedMapBiz);
          return (
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
                      {[selectedMapBiz.street, selectedMapBiz.city, selectedMapBiz.governorate].filter(Boolean).join('، ')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedMapBiz(null)}
                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                    title="إغلاق"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onOpenBusiness(selectedMapBiz)}
                    className="py-2 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs text-center cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-xs"
                  >
                    <span>التفاصيل</span>
                  </button>

                  {effectiveUrl ? (
                    <a
                      href={effectiveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                      title={isOfficial ? 'فتح خرائط Google' : 'الموقع والملاحة'}
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                      <span>اتجاهات</span>
                    </a>
                  ) : (
                    <div className="py-2 px-2 rounded-xl bg-slate-50 text-slate-400 font-bold text-xs flex items-center justify-center gap-1 opacity-50 cursor-not-allowed border border-slate-100">
                      <Navigation className="w-3.5 h-3.5 text-slate-400" />
                      <span>اتجاهات</span>
                    </div>
                  )}

                  {selectedMapBiz.phone ? (
                    <a
                      href={`tel:${selectedMapBiz.phone}`}
                      className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                      title="اتصال هاتفي"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-600" />
                      <span>اتصال</span>
                    </a>
                  ) : (
                    <div className="py-2 px-2 rounded-xl bg-slate-50 text-slate-400 font-bold text-xs flex items-center justify-center gap-1 opacity-50 cursor-not-allowed border border-slate-100">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>اتصال</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Proximity Radar for Selected Target Building */}
      {targetBuilding && (
        <ProximityRadarDrawer
          target={targetBuilding}
          businesses={businesses}
          onOpenBusiness={onOpenBusiness}
        />
      )}

      {/* Synchronized Compact Places List below map */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span>أنشطة معروضة على الخريطة ({filteredBusinesses.length})</span>
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('/search')}
            className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
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

      {/* Gates Modal */}
      <HadayekGatesModal
        isOpen={isGatesModalOpen}
        onClose={() => setIsGatesModalOpen(false)}
        onSelectZone={(z) => handleSelectZoneJump(z)}
      />
    </div>
  );
};
