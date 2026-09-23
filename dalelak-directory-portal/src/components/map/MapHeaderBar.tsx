import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  MapPin,
  Navigation,
  SlidersHorizontal,
  X,
  Maximize2,
  Minimize2,
  Loader2,
  Compass,
  ChevronDown,
  Search,
} from 'lucide-react';
import { Business } from '../../types';
import { MapTileLayerType, GOVERNORATE_COORDS, MAP_QUICK_CATEGORIES } from './constants/mapConstants';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../../data/hadayekDistrictsGeoData';
import { estimateBuildingCoordinates, searchBuildingCoordinatesExact } from '../../data/hadayekAtlasData';
import { getAvailableQuickCategoriesInZone } from '../../utils/hadayekZoneHelper';
import { useMapState } from './hooks/useMapState';
import { useMapInstance } from './hooks/useMapInstance';

export interface MapHeaderBarProps {
  mode: 'picker' | 'view';
  filteredBusinessesCount: number;
  tileLayer: MapTileLayerType;
  switchTileLayer: (type: MapTileLayerType) => void;
  state: ReturnType<typeof useMapState>;
  onGovChange: (govName: string) => void;
  businesses?: Business[];
  isLocating?: boolean;
  handleGetLocation?: () => void;
  showHadayekGates?: boolean;
  onToggleBusinessesVisibility?: (visible: boolean) => void;
  selectedZone?: string;
  onSelectZone?: (zoneLetter: string) => void;
  onCategorySelect?: (cat: string) => void;
  mapInstance?: ReturnType<typeof useMapInstance>;
  onExploreDirectory?: () => void;
}

export const MapHeaderBar: React.FC<MapHeaderBarProps> = ({
  mode,
  filteredBusinessesCount,
  tileLayer,
  switchTileLayer,
  state,
  onGovChange,
  businesses = [],
  isLocating = false,
  handleGetLocation,
  showHadayekGates = true,
  onToggleBusinessesVisibility,
  onSelectZone,
  onCategorySelect,
  mapInstance,
  onExploreDirectory,
}) => {
  const {
    selectedGovFilter,
    selectedZone,
    setSelectedZone,
    showDistrictsOverlay,
    setShowDistrictsOverlay,
    showGatesLayer,
    setShowGatesLayer,
    showBusinesses,
    setShowBusinesses,
    isMapFilterOpen,
    setIsMapFilterOpen,
    mapCategoryFilter,
    setMapCategoryFilter,
    onlyVerifiedFilter,
    setOnlyVerifiedFilter,
    isExpanded,
    setIsExpanded,
  } = state;

  const isZoneScoped = Boolean(selectedZone);
  const activeQuickCategories = React.useMemo(() => {
    if (!isZoneScoped || !businesses || businesses.length === 0) {
      return MAP_QUICK_CATEGORIES.map((c) => ({ ...c, count: 0 }));
    }
    return getAvailableQuickCategoriesInZone(businesses, selectedZone, MAP_QUICK_CATEGORIES);
  }, [businesses, isZoneScoped, selectedZone]);

  const filterRef = useRef<HTMLDivElement>(null);
  const [buildingQuery, setBuildingQuery] = useState('');

  const handleBuildingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone || !buildingQuery) return;
    
    // Add searching feedback if possible, or just wait
    const coords = await searchBuildingCoordinatesExact(selectedZone, buildingQuery) || estimateBuildingCoordinates(selectedZone, buildingQuery);
    
    if (mapInstance?.leafletMapRef?.current && window.L) {
      const map = mapInstance.leafletMapRef.current;
      map.flyTo([coords.lat, coords.lng], 19, { duration: 1.0 });

      // Add a distinctive pin for the searched building
      const icon = window.L.divIcon({
        className: 'bg-transparent border-0',
        html: `<div class="relative w-8 h-8 flex items-center justify-center">
                 <div class="absolute w-4 h-4 bg-sky-500 rounded-full animate-ping opacity-75"></div>
                 <div class="relative w-4 h-4 bg-sky-500 border-2 border-white rounded-full shadow-lg"></div>
                 <div class="absolute top-8 whitespace-nowrap bg-slate-900/90 text-sky-300 font-bold px-2 py-0.5 rounded-md text-[10px] border border-sky-500/50 shadow-xl">
                    عمارة ${buildingQuery.match(/\d+/) ? buildingQuery.match(/\d+/)[0] : buildingQuery}
                 </div>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // Remove previous search marker if exists
      if ((map as any)._lastBuildingMarker) {
        (map as any)._lastBuildingMarker.remove();
      }

      const marker = window.L.marker([coords.lat, coords.lng], { icon }).addTo(map);
      (map as any)._lastBuildingMarker = marker;
    }
  };

  const handleDistrictChange = (letter: string) => {
    setSelectedZone(letter);
    if (onSelectZone) onSelectZone(letter);
  };

  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isMapFilterOpen) return;
    const updatePosition = () => {
      if (filterButtonRef.current) {
        const rect = filterButtonRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 6,
          left: Math.max(8, Math.min(rect.left, window.innerWidth - 328)),
        });
      }
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isMapFilterOpen]);

  useEffect(() => {
    if (!isMapFilterOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMapFilterOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMapFilterOpen, setIsMapFilterOpen]);

  return (
    <div className="relative bg-slate-900/95 backdrop-blur-md px-2 py-2 border-b border-slate-800/80 z-30 text-white select-none">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 w-full">
        {/* Quick Selectors & Micro Toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0 w-full sm:w-auto">
          {/* 🏙️ City Fixed Badge */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-black text-[10px] sm:text-xs rounded-md px-2 py-1 shrink-0 shadow-xs" title="الخريطة مثبتة على نطاق حدائق الأهرام">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>حدائق الأهرام</span>
          </div>

          {/* 🧭 District Quick-Jump */}
          <div className="relative inline-flex items-center shrink-0">
            <select
              value={selectedZone || ''}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="bg-slate-800/90 hover:bg-slate-700/90 border border-amber-500/50 text-amber-300 font-black text-[10px] sm:text-xs rounded-md px-2 py-1 focus:outline-none focus:border-amber-400 cursor-pointer appearance-none pl-5 pr-2 transition-colors shadow-xs"
              title="انتقال للمنطقة"
            >
              <option value="">🧭 كل المناطق (أ - ن)</option>
              {HADAYEK_OFFICIAL_DISTRICTS.map((d) => (
                <option key={d.id} value={d.letterAr}>
                  {d.nameAr}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-amber-400/90 absolute left-1.5 pointer-events-none" />
          </div>

          {/* 🏢 Building Search (Visible if Zone is selected) */}
          {selectedZone && (
            <form onSubmit={handleBuildingSubmit} className="relative inline-flex items-center shrink-0">
              <input
                type="text"
                placeholder="عمارة رقم..."
                value={buildingQuery}
                onChange={(e) => setBuildingQuery(e.target.value)}
                className="bg-slate-800/90 hover:bg-slate-700/90 border border-sky-500/40 text-sky-300 font-bold text-[10px] sm:text-xs rounded-md px-1.5 py-0.5 focus:outline-none focus:border-sky-400 placeholder:text-sky-300/50 w-20 sm:w-24 transition-colors pr-1.5 pl-6"
                title="ابحث برقم العمارة داخل المنطقة المحددة"
              />
              <button
                type="submit"
                className="absolute left-1 text-sky-400 hover:text-sky-300 pointer-events-auto cursor-pointer"
                title="بحث"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

        </div>

        {/* Action Buttons: Filters + Explore + Fullscreen */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0 w-full sm:w-auto mr-0 sm:mr-auto justify-start">
          {/* 🚪 Gates Toggle */}
          {showHadayekGates && (
            <label className="inline-flex items-center gap-1 text-purple-300 hover:text-purple-200 font-bold cursor-pointer text-[10px] sm:text-xs transition-colors shrink-0 px-1 border-r border-slate-700/50">
              <input
                type="checkbox"
                checked={showGatesLayer}
                onChange={(e) => setShowGatesLayer(e.target.checked)}
                className="rounded accent-purple-500 w-3 h-3 cursor-pointer"
              />
              <span>بوابات</span>
            </label>
          )}

          {/* 🗺️ Districts Toggle */}
          <label className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200 font-bold cursor-pointer text-[10px] sm:text-xs transition-colors shrink-0 pr-1 border-l border-slate-700/50 pl-1 mr-1">
            <input
              type="checkbox"
              checked={showDistrictsOverlay}
              onChange={(e) => setShowDistrictsOverlay(e.target.checked)}
              className="rounded accent-indigo-500 w-3 h-3 cursor-pointer"
            />
            <span>مناطق</span>
          </label>

          {/* Filters Toggle Button & Anchored Dropdown */}
          {mode === 'view' && (
            <>
              <button
                ref={filterButtonRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isMapFilterOpen) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDropdownPos({
                      top: rect.bottom + 6,
                      left: Math.max(8, Math.min(rect.left, window.innerWidth - 328)),
                    });
                    setIsMapFilterOpen(true);
                  } else {
                    setIsMapFilterOpen(false);
                  }
                }}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold flex items-center gap-1 transition-all cursor-pointer select-none ${
                  mapCategoryFilter !== 'all' || onlyVerifiedFilter
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title="فلاتر وتصنيفات الأنشطة"
              >
                <SlidersHorizontal className="w-2.5 h-2.5" />
                <span>
                  {mapCategoryFilter !== 'all'
                    ? (activeQuickCategories.find((c) => c.id === mapCategoryFilter)?.name.split(' ')[0] || 'نشاط محدد')
                    : 'نوع النشاط'}
                </span>
                {(mapCategoryFilter !== 'all' || onlyVerifiedFilter) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                )}
              </button>

              {/* القائمة المنسدلة للفلتر مثبتة تحت الزر مباشرة وفوق الخريطة بنسبة 100% */}
              {isMapFilterOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                  <>
                    {/* خلفية شفافة تلتقط النقر في أي مكان خارج القائمة لإغلاقها */}
                    <div
                      className="fixed inset-0 z-[999998] bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMapFilterOpen(false);
                      }}
                    />

                    {/* القائمة المنسدلة المتموضعة تحت الزر بدقة */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'fixed',
                        top: dropdownPos ? `${dropdownPos.top}px` : '44px',
                        left: dropdownPos ? `${dropdownPos.left}px` : '16px',
                      }}
                      className="w-72 sm:w-80 max-w-[calc(100vw-16px)] bg-slate-950/98 border-2 border-amber-500/60 rounded-2xl shadow-2xl backdrop-blur-xl p-3 z-[999999] text-right text-white animate-fade-in-scale space-y-2.5 select-none font-['Cairo',sans-serif]"
                      dir="rtl"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>تصفية وفلترة أنشطة الخريطة</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsMapFilterOpen(false)}
                          className="text-slate-400 hover:text-white p-0.5 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                          title="إغلاق"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Quick Category Grid */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                          <span>تصنيف النشاط:</span>
                          {mapCategoryFilter !== 'all' && (
                            <span className="text-[9.5px] font-black text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                              محدد حالياً
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                          <button
                            key="all"
                            type="button"
                            onClick={() => {
                              setMapCategoryFilter('all');
                              setShowBusinesses(false);
                              if (onCategorySelect) onCategorySelect('all');
                              if (onToggleBusinessesVisibility) onToggleBusinessesVisibility(false);
                            }}
                            className={`text-[11px] font-bold px-2 py-1.5 rounded-lg text-right truncate transition-all cursor-pointer flex items-center gap-1.5 border ${
                              mapCategoryFilter === 'all'
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs'
                                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
                            }`}
                          >
                            <span>🧹</span>
                            <span className="truncate">إخفاء الأنشطة (خريطة نظيفة)</span>
                          </button>
                          {activeQuickCategories.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setMapCategoryFilter(cat.id);
                                setShowBusinesses(true);
                                if (onCategorySelect) onCategorySelect(cat.id);
                                if (onToggleBusinessesVisibility) onToggleBusinessesVisibility(true);
                              }}
                              className={`text-[11px] font-bold px-2 py-1.5 rounded-lg text-right truncate transition-all cursor-pointer flex items-center justify-between border ${
                                mapCategoryFilter === cat.id
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs'
                                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="shrink-0">{cat.icon}</span>
                                <span className="truncate">{cat.name.split(' ')[0]}</span>
                              </div>
                              {isZoneScoped && cat.count > 0 && (
                                <span className={`text-[9px] font-mono font-bold px-1 rounded ${mapCategoryFilter === cat.id ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
                                  {cat.count}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Toggle Verified & Show/Hide Controls */}
                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        <label className="flex items-center justify-between text-xs text-slate-300 font-bold cursor-pointer select-none bg-slate-900/50 px-2 py-1.5 rounded-lg border border-slate-800/80 hover:border-slate-700 transition-colors">
                          <span className="text-[11px]">الموثقة رسمياً فقط (Verified)</span>
                          <input
                            type="checkbox"
                            checked={onlyVerifiedFilter}
                            onChange={(e) => setOnlyVerifiedFilter(e.target.checked)}
                            className="rounded accent-amber-500 w-3.5 h-3.5 cursor-pointer"
                          />
                        </label>

                        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={() => {
                              setMapCategoryFilter('all');
                              setOnlyVerifiedFilter(false);
                              setShowBusinesses(false);
                              if (onCategorySelect) onCategorySelect('all');
                              if (onToggleBusinessesVisibility) onToggleBusinessesVisibility(false);
                            }}
                            className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
                          >
                            إعادة تعيين
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setMapCategoryFilter('all');
                              setShowBusinesses(false);
                              if (onCategorySelect) onCategorySelect('all');
                              if (onToggleBusinessesVisibility) onToggleBusinessesVisibility(false);
                              setIsMapFilterOpen(false);
                            }}
                            className="text-[11px] font-black text-rose-400 hover:bg-rose-500/20 px-2 py-1 rounded-lg border border-rose-500/30 cursor-pointer transition-colors"
                          >
                            إخفاء الأنشطة
                          </button>
                        </div>
                      </div>
                    </div>
                  </>,
                  document.body
                )}
            </>
          )}

          {/* Explore Directory Button */}
          {onExploreDirectory && (
            <button
              type="button"
              onClick={onExploreDirectory}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
              title="استكشف الدليل"
            >
              <Compass className="w-3 h-3" />
              <span>استكشف</span>
            </button>
          )}

          {/* GPS Locator Button in Picker */}
          {mode === 'picker' && handleGetLocation && (
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded shadow-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              title="تحديد موقعي"
            >
              {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3 fill-slate-950" />}
            </button>
          )}

          {/* Fullscreen Expand / Minimize */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded border text-[10px] font-bold flex items-center justify-center transition-all cursor-pointer ${
              isExpanded
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={isExpanded ? 'إنهاء وضع الشاشة الكاملة' : 'توسيع الخريطة'}
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
};
