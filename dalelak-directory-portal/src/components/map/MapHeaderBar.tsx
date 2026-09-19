import React from 'react';
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
} from 'lucide-react';
import { MapTileLayerType, GOVERNORATE_COORDS, MAP_QUICK_CATEGORIES } from './constants/mapConstants';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../../data/hadayekDistrictsGeoData';
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
  filteredBusinessesCount,
  tileLayer,
  switchTileLayer,
  state,
  onGovChange,
  isLocating = false,
  handleGetLocation,
  showHadayekGates = true,
  onToggleBusinessesVisibility,
  onSelectZone,
  mapInstance,
  onExploreDirectory,
}) => {
  const {
    selectedGovFilter,
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

  return (
    <div className="bg-slate-900/95 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 border-b border-slate-800/80 z-20 text-white select-none transition-all">
      {/* 🌟 1. Primary Compact Row */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 flex-wrap">
        {/* Right Section: Title + Unified Location Dropdown */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow-xs">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-black text-white whitespace-nowrap">
              {mode === 'picker' ? 'تحديد الموقع' : 'خريطة الدليل'}
            </span>

            {/* Compact Governorates Selector (Default: Hadayek Al-Ahram) */}
            <div className="relative inline-flex items-center">
              <select
                value={selectedGovFilter}
                onChange={(e) => onGovChange(e.target.value)}
                className="bg-slate-800/90 hover:bg-slate-700/90 border border-amber-500/30 text-amber-400 font-bold text-[10px] sm:text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-amber-400 cursor-pointer appearance-none pl-5 pr-2 transition-colors"
                title="المحافظة والمنطقة (افتراضياً: حدائق الأهرام)"
              >
                <option value="الجيزة">📍 حدائق الأهرام (الجيزة)</option>
                <option value="all">كل المحافظات</option>
                {Object.keys(GOVERNORATE_COORDS)
                  .filter((g) => g !== 'الجيزة')
                  .map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
              </select>
              <ChevronDown className="w-3 h-3 text-amber-400/80 absolute left-1.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Center Section: Hadayek District Quick-Jump + Map Tile Select */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* 🧭 Quick District Selector (أ إلى ن) */}
          <div className="relative inline-flex items-center">
            <select
              defaultValue=""
              onChange={(e) => {
                const letter = e.target.value;
                if (!letter) return;
                if (onSelectZone) onSelectZone(letter);
                const district = HADAYEK_OFFICIAL_DISTRICTS.find((d) => d.letterAr === letter);
                if (district && mapInstance?.leafletMapRef?.current) {
                  mapInstance.leafletMapRef.current.flyTo([district.centerLat, district.centerLng], 16, { duration: 0.8 });
                }
              }}
              className="bg-slate-800/90 hover:bg-slate-700/90 border border-indigo-500/30 text-indigo-300 font-bold text-[10px] sm:text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-400 cursor-pointer appearance-none pl-5 pr-2 transition-colors"
              title="انتقال سريع لمناطق حدائق الأهرام (أ إلى ن)"
            >
              <option value="" disabled>🧭 انتقال لمنطقة...</option>
              {HADAYEK_OFFICIAL_DISTRICTS.map((d) => (
                <option key={d.id} value={d.letterAr}>
                  {d.nameAr}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-indigo-400/80 absolute left-1.5 pointer-events-none" />
          </div>

          {/* 🗺️ Tile Layer Dropdown (جعل نوع الخريطة سهم منسدل) */}
          <div className="relative inline-flex items-center">
            <select
              value={tileLayer}
              onChange={(e) => switchTileLayer(e.target.value as MapTileLayerType)}
              className="bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 font-bold text-[10px] sm:text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-slate-500 cursor-pointer appearance-none pl-5 pr-2 transition-colors"
              title="نوع الخريطة (شوارع جوجل / قمر صناعي / خريطة دليلك)"
            >
              <option value="google-streets">📍 شوارع جوجل</option>
              <option value="google-hybrid">🛰️ قمر صناعي</option>
              <option value="dalelak-clean">🗺️ خريطة دليلك</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute left-1.5 pointer-events-none" />
          </div>
        </div>

        {/* Left Section: Explore Directory + GPS + Fullscreen Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Explore Directory Button (زر التوجيه لاستكشاف الأنشطة / الدليل) */}
          {onExploreDirectory && (
            <button
              type="button"
              onClick={onExploreDirectory}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-[10px] sm:text-xs px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
              title="استعراض والبحث في أنشطة ومحلات الدليل"
            >
              <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>استكشف الدليل</span>
            </button>
          )}

          {/* GPS Locator Button in Picker */}
          {mode === 'picker' && handleGetLocation && (
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black px-2 py-1 rounded-lg shadow-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              title="تحديد موقعي الفعلي GPS"
            >
              {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3 fill-slate-950" />}
              <span>{isLocating ? '...' : 'موقعي'}</span>
            </button>
          )}

          {/* Fullscreen Expand / Minimize */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 sm:p-1.5 rounded-lg border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
              isExpanded
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={isExpanded ? 'إنهاء وضع الشاشة الكاملة' : 'توسيع الخريطة ملء الشاشة'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 🌟 2. Micro Toggles Strip with Checkboxes (خيارات مصغرة مع مربعات تحكم) */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1.5 mt-1 border-t border-slate-800/60 text-[10px] sm:text-[11px]">
        <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
          {/* 🚪 Checkbox: بوابات الحدائق */}
          {showHadayekGates && (
            <label className="inline-flex items-center gap-1 text-purple-300 hover:text-purple-200 font-bold cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={showGatesLayer}
                onChange={(e) => setShowGatesLayer(e.target.checked)}
                className="rounded accent-purple-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>🚪 بوابات الحدائق</span>
            </label>
          )}

          {/* 🗺️ Checkbox: تقسيمات المناطق */}
          <label className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200 font-bold cursor-pointer select-none transition-colors">
            <input
              type="checkbox"
              checked={showDistrictsOverlay}
              onChange={(e) => setShowDistrictsOverlay(e.target.checked)}
              className="rounded accent-indigo-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>🗺️ تقسيمات المناطق</span>
          </label>

          {/* 📍 Checkbox: إظهار الأنشطة */}
          {mode === 'view' && (
            <label className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={showBusinesses}
                onChange={(e) => {
                  const nextVal = e.target.checked;
                  setShowBusinesses(nextVal);
                  if (onToggleBusinessesVisibility) onToggleBusinessesVisibility(nextVal);
                }}
                className="rounded accent-amber-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>📍 إظهار الأنشطة ({filteredBusinessesCount})</span>
            </label>
          )}

          {/* 🎯 Filters Dropdown Button */}
          {mode === 'view' && (
            <div className="relative inline-flex items-center">
              <button
                type="button"
                onClick={() => setIsMapFilterOpen(!isMapFilterOpen)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  mapCategoryFilter !== 'all' || onlyVerifiedFilter
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title="تصفية وفلترة أنشطة الخريطة"
              >
                <SlidersHorizontal className="w-2.5 h-2.5" />
                <span>فلاتر التصنيفات</span>
                {(mapCategoryFilter !== 'all' || onlyVerifiedFilter) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                )}
              </button>

              {/* Floating Map Filters Menu */}
              {isMapFilterOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-slate-950/95 border border-amber-500/40 rounded-2xl shadow-2xl backdrop-blur-xl p-3.5 z-50 space-y-3 text-right text-white animate-fade-in-scale">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>تصفية وفلترة أنشطة الخريطة</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsMapFilterOpen(false)}
                      className="text-slate-400 hover:text-white p-1 cursor-pointer"
                      title="إغلاق"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Category Grid */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-300 block">تصنيف النشاط:</span>
                    <div className="grid grid-cols-2 gap-1 max-h-44 overflow-y-auto pr-1">
                      {MAP_QUICK_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setMapCategoryFilter(cat.id);
                            setShowBusinesses(true);
                          }}
                          className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg text-right truncate transition-all cursor-pointer flex items-center gap-1.5 ${
                            mapCategoryFilter === cat.id
                              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span className="truncate">{cat.name.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggle Verified & Show/Hide Controls */}
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

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          setMapCategoryFilter('all');
                          setOnlyVerifiedFilter(false);
                          setShowBusinesses(true);
                        }}
                        className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
                      >
                        إعادة تعيين
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowBusinesses(false);
                          setIsMapFilterOpen(false);
                        }}
                        className="text-[11px] font-black text-rose-400 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/30 cursor-pointer transition-colors"
                      >
                        إخفاء الأنشطة
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Direct Link to Explore */}
        {onExploreDirectory && (
          <button
            type="button"
            onClick={onExploreDirectory}
            className="text-[10px] text-amber-400 hover:underline font-bold hidden sm:inline cursor-pointer"
          >
            تصفح كروت الأنشطة بالتفصيل ←
          </button>
        )}
      </div>
    </div>
  );
};
