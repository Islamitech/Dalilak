import React, { useState } from 'react';
import {
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
import { MapTileLayerType, MAP_QUICK_CATEGORIES } from './constants/mapConstants';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../../data/hadayekDistrictsGeoData';
import { estimateBuildingCoordinates } from '../../data/hadayekAtlasData';
import { useMapState } from './hooks/useMapState';
import { useMapInstance } from './hooks/useMapInstance';

export interface MapHeaderBarProps {
  mode: 'picker' | 'view';
  filteredBusinessesCount: number;
  tileLayer: MapTileLayerType;
  switchTileLayer: (type: MapTileLayerType) => void;
  state: ReturnType<typeof useMapState>;
  onGovChange: (govName: string) => void;
  isLocating?: boolean;
  handleGetLocation?: () => void;
  showHadayekGates?: boolean;
  onToggleBusinessesVisibility?: (visible: boolean) => void;
  onSelectZone?: (zoneLetter: string) => void;
  mapInstance?: ReturnType<typeof useMapInstance>;
  onExploreDirectory?: () => void;
}

export const MapHeaderBar: React.FC<MapHeaderBarProps> = ({
  mode,
  tileLayer,
  switchTileLayer,
  state,
  isLocating = false,
  handleGetLocation,
  showHadayekGates = true,
  onSelectZone,
  mapInstance,
  onExploreDirectory,
}) => {
  const {
    selectedZone,
    setSelectedZone,
    showDistrictsOverlay,
    setShowDistrictsOverlay,
    showGatesLayer,
    setShowGatesLayer,
    isMapFilterOpen,
    setIsMapFilterOpen,
    mapCategoryFilter,
    setMapCategoryFilter,
    onlyVerifiedFilter,
    setOnlyVerifiedFilter,
    isExpanded,
    setIsExpanded,
    selectedGovFilter,
    setSelectedGovFilter,
  } = state;

  const [buildingQuery, setBuildingQuery] = useState('');

  const handleBuildingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone || !buildingQuery) return;
    
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
    if (!letter) return;
    const district = HADAYEK_OFFICIAL_DISTRICTS.find((d) => d.letterAr === letter);
    if (district && mapInstance?.leafletMapRef?.current && window.L) {
      if (district.polygons && district.polygons[0]) {
        const bounds = window.L.latLngBounds(district.polygons[0]);
        mapInstance.leafletMapRef.current.flyToBounds(bounds, { padding: [40, 40], maxZoom: 17, duration: 0.9 });
      } else {
        mapInstance.leafletMapRef.current.flyTo([district.centerLat, district.centerLng], 17, { duration: 0.9 });
      }
    }
  };

  const activeCategoryObj = MAP_QUICK_CATEGORIES.find((c) => c.id === mapCategoryFilter);

  return (
    <div className="relative z-[1001] bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/90 px-2.5 sm:px-4 py-2 text-white select-none shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 w-full">
        {/* Right Section: Branding & Zone / Layer Selectors */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0 w-full sm:w-auto">
          {/* Aesthetic Title Badge */}
          <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2 sm:px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-black shadow-xs shrink-0">
            <span className="text-sm leading-none">🗺️</span>
            <span className="hidden md:inline tracking-tight">خريطة حدائق الأهرام</span>
          </div>

          {/* 🏙️ City Filter */}
          <div className="relative inline-flex items-center shrink-0">
            <select
              value={selectedGovFilter}
              onChange={(e) => onGovChange(e.target.value)}
              className="bg-slate-900/60 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] sm:text-xs rounded-xl px-2 py-1 focus:outline-none focus:border-emerald-400 cursor-pointer appearance-none pl-5 pr-2 transition-colors"
              title="المدينة / المحافظة"
            >
              <option value="all">🌍 كل المدن</option>
              {Object.keys(GOVERNORATE_COORDS).map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-emerald-400/80 absolute left-1.5 pointer-events-none" />
          </div>

          {/* District Quick-Jump */}
          <div className="relative inline-flex items-center shrink-0">
            <select
              value={selectedZone || ''}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 font-bold text-[11px] sm:text-xs rounded-xl px-2 sm:px-2.5 py-1 focus:outline-none focus:border-amber-400 cursor-pointer appearance-none pl-5 sm:pl-6 pr-2 transition-all shadow-xs"
              title="الانتقال لمنطقة محددة"
            >
              <option value="">🧭 كل المناطق...</option>
              {HADAYEK_OFFICIAL_DISTRICTS.map((d) => (
                <option key={d.id} value={d.letterAr}>
                  {d.nameAr}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute left-1.5 pointer-events-none" />
          </div>

          {/* 🏢 Building Search */}
          {selectedZone && (
            <form onSubmit={handleBuildingSubmit} className="relative inline-flex items-center shrink-0">
              <input
                type="text"
                placeholder="عمارة رقم..."
                value={buildingQuery}
                onChange={(e) => setBuildingQuery(e.target.value)}
                className="bg-slate-900/90 hover:bg-slate-800 border border-sky-500/40 text-sky-300 font-bold text-[11px] sm:text-xs rounded-xl px-2 py-1 focus:outline-none focus:border-sky-400 placeholder:text-sky-300/50 w-20 sm:w-24 transition-colors pr-1.5 pl-6"
                title="ابحث برقم العمارة داخل المنطقة المحددة"
              />
              <button
                type="submit"
                className="absolute left-1.5 text-sky-400 hover:text-sky-300 pointer-events-auto cursor-pointer"
                title="بحث"
              >
                <Search className="w-3 h-3" />
              </button>
            </form>
          )}

        </div>

        {/* Left Section: Activity Filters + Explore + Expand */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0 w-full sm:w-auto mr-0 sm:mr-auto justify-start">
          {/* Districts Overlay Toggle (Pill Button) */}
          <button
            type="button"
            onClick={() => setShowDistrictsOverlay(!showDistrictsOverlay)}
            className={`text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-xl transition-all border flex items-center gap-1 cursor-pointer shrink-0 ${
              showDistrictsOverlay
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-xs'
                : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title="إظهار/إخفاء حدود وتسميات المناطق"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${showDistrictsOverlay ? 'bg-indigo-400' : 'bg-slate-600'}`} />
            <span>مناطق</span>
          </button>

          {/* Gates Toggle (Pill Button) */}
          {showHadayekGates && (
            <button
              type="button"
              onClick={() => setShowGatesLayer(!showGatesLayer)}
              className={`text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-xl transition-all border flex items-center gap-1 cursor-pointer shrink-0 ${
                showGatesLayer
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-xs'
                  : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
              title="إظهار/إخفاء بوابات حدائق الأهرام"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${showGatesLayer ? 'bg-purple-400' : 'bg-slate-600'}`} />
              <span>بوابات</span>
            </button>
          )}

          {/* Active Category Display & Clear Pill */}
          {mode === 'view' && mapCategoryFilter && mapCategoryFilter !== 'all' && (
            <div className="flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-black shadow-xs">
              <span>{activeCategoryObj?.icon || '📍'}</span>
              <span className="truncate max-w-[80px] sm:max-w-[120px]">{activeCategoryObj?.name.split(' ')[0] || mapCategoryFilter}</span>
              <button
                type="button"
                onClick={() => setMapCategoryFilter('all')}
                className="mr-0.5 text-emerald-400 hover:text-white hover:bg-emerald-500/30 rounded-full w-3.5 h-3.5 flex items-center justify-center cursor-pointer transition-colors"
                title="إلغاء الفلتر وإخفاء الأنشطة"
              >
                ✕
              </button>
            </div>
          )}

          {/* Category Filter Drawer Button */}
          {mode === 'view' && (
            <div className="relative inline-flex items-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMapFilterOpen(!isMapFilterOpen);
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer select-none ${
                  mapCategoryFilter !== 'all' || onlyVerifiedFilter
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:border-slate-500'
                }`}
                title="تصفية وفلترة أنشطة الخريطة"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{mapCategoryFilter === 'all' ? 'اختر نشاط' : 'تغيير النشاط'}</span>
              </button>

              {/* Category Filter Popover - Rock Solid Positioned */}
              {isMapFilterOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[999998] bg-slate-950/40 backdrop-blur-[2px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMapFilterOpen(false);
                    }}
                  />
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-[calc(100vw-24px)] sm:w-80 max-w-[340px] bg-slate-950 border border-amber-500/50 rounded-2xl shadow-2xl p-4 z-[999999] space-y-3 text-right text-white"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>اختر نشاطاً لعرضه على الخريطة</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMapFilterOpen(false);
                        }}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                        title="إغلاق"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      الأنشطة تظهر حصرياً حسب النوع المختار للحفاظ على نقاء الخريطة وسهولة قراءة أرقام المباني.
                    </p>

                    {/* Category Grid */}
                    <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
                      {MAP_QUICK_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMapCategoryFilter(cat.id);
                            setIsMapFilterOpen(false);
                          }}
                          className={`text-xs font-bold px-2.5 py-2 rounded-xl text-right truncate transition-all cursor-pointer flex items-center gap-2 border ${
                            mapCategoryFilter === cat.id
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                              : 'bg-slate-900/90 text-slate-200 border-slate-800 hover:border-amber-500/40 hover:bg-slate-800'
                          }`}
                        >
                          <span className="text-sm">{cat.icon}</span>
                          <span className="truncate">{cat.name.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>

                    {/* Verified & Clear Options */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <label className="flex items-center justify-between text-xs text-slate-300 font-bold cursor-pointer select-none">
                        <span>الموثقة رسمياً فقط (Verified)</span>
                        <input
                          type="checkbox"
                          checked={onlyVerifiedFilter}
                          onChange={(e) => setOnlyVerifiedFilter(e.target.checked)}
                          className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                        />
                      </label>

                      <div className="pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMapCategoryFilter('all');
                            setOnlyVerifiedFilter(false);
                            setIsMapFilterOpen(false);
                          }}
                          className="w-full text-center text-xs font-black text-rose-400 hover:bg-rose-500/20 py-2 rounded-xl border border-rose-500/30 cursor-pointer transition-colors"
                        >
                          إخفاء كل الأنشطة من الخريطة
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Explore Directory Button */}
          {onExploreDirectory && (
            <button
              type="button"
              onClick={onExploreDirectory}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] sm:text-xs px-2.5 py-1 rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-95 whitespace-nowrap shadow-xs"
              title="استكشف الدليل الكامل"
            >
              <Compass className="w-3 h-3" />
              <span>استكشف</span>
            </button>
          )}

          {/* GPS Locator in Picker Mode */}
          {mode === 'picker' && handleGetLocation && (
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] sm:text-xs font-black px-2 py-1 rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              title="تحديد موقعي"
            >
              {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3 fill-slate-950" />}
            </button>
          )}

          {/* Fullscreen Expand / Minimize */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center transition-all cursor-pointer ${
              isExpanded
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-700/80'
            }`}
            title={isExpanded ? 'إنهاء وضع الشاشة الكاملة' : 'توسيع الخريطة'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
