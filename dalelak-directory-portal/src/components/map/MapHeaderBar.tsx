import React from 'react';
import {
  MapPin,
  Sparkles,
  Navigation,
  Eye,
  EyeOff,
  SlidersHorizontal,
  X,
  Maximize2,
  Minimize2,
  Loader2,
} from 'lucide-react';
import { MapTileLayerType, GOVERNORATE_COORDS, MAP_QUICK_CATEGORIES } from './constants/mapConstants';
import { useMapState } from './hooks/useMapState';

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
    <div className="bg-[var(--map-header-bg)] p-2.5 sm:p-3 border-b border-[var(--map-header-border)] flex flex-wrap items-center justify-between gap-2 z-20">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow">
          <MapPin className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h4 className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
            <span>{mode === 'picker' ? 'تحديد وتوجيه موقع المنشأة بدقة خريطة جوجل' : 'خريطة المنشآت والتوثيق الميداني المباشر'}</span>
            <span className="bg-emerald-500/15 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>دقة قمر صناعي 100%</span>
            </span>
          </h4>
          <p className="text-[10px] text-amber-400 font-medium">
            {mode === 'picker'
              ? 'انقر على أي نقطة، أو اسحب الدبوس بدقة، أو ابحث باسم الشارع / الصق رابط جوجل ماب'
              : `إجمالي ${filteredBusinessesCount} منشأة موثقة على الخريطة`}
          </p>
        </div>
      </div>

      {/* Controls Bar Right Side */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Tile Layer Switcher Pills */}
        <div className="flex items-center bg-[var(--input-bg)] p-0.5 rounded-xl border border-[var(--border-color)] text-[11px] font-bold">
          <button
            type="button"
            onClick={() => switchTileLayer('dalelak-clean')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              tileLayer === 'dalelak-clean'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="عرض خريطة دليلك الميدانية الصماء (خالية من معالم ومتاجر جوجل)"
          >
            <span>🗺️ خريطة دليلك</span>
          </button>
          <button
            type="button"
            onClick={() => switchTileLayer('google-streets')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              tileLayer === 'google-streets'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="عرض خريطة شوارع جوجل العامة (Google Streets)"
          >
            <span>📍 شوارع جوجل</span>
          </button>
          <button
            type="button"
            onClick={() => switchTileLayer('google-hybrid')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              tileLayer === 'google-hybrid'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="عرض القمر الصناعي المباشر من جوجل (Satellite + Labels)"
          >
            <span>🛰️ قمر صناعي</span>
          </button>
        </div>

        {/* Governorate Switcher Dropdown */}
        <select
          value={selectedGovFilter}
          onChange={(e) => onGovChange(e.target.value)}
          className="bg-[var(--input-bg)] hover:bg-amber-500/10 border border-[var(--border-color)] text-amber-600 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
          title="الانتقال المباشر للمحافظة"
        >
          <option value="all">كل المحافظات</option>
          {Object.keys(GOVERNORATE_COORDS).map((g) => (
            <option key={g} value={g}>
              📍 {g}
            </option>
          ))}
        </select>

        {/* GPS Locator Button */}
        {mode === 'picker' && handleGetLocation && (
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black px-3 py-1.5 rounded-xl shadow transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            title="تحديد موقعي الحالي بأعلى دقة قمر صناعي GPS"
          >
            {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5 fill-slate-950" />}
            <span>{isLocating ? 'جاري التحديد...' : 'موقعي الفعلي'}</span>
          </button>
        )}

        {/* 🗺️ زر تقسيمات ومضلعات مناطق الحدائق (أ - ن) */}
        <button
          type="button"
          onClick={() => setShowDistrictsOverlay(!showDistrictsOverlay)}
          className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
            showDistrictsOverlay
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/40'
          }`}
          title="إظهار أو إخفاء مضلعات وتقسيمات مناطق حدائق الأهرام (أ إلى ن)"
        >
          <span>🗺️ تقسيمات المناطق</span>
          <span className={`w-2 h-2 rounded-full ${showDistrictsOverlay ? 'bg-emerald-400' : 'bg-slate-500'}`} />
        </button>

        {/* 🚪 زر بوابات الحدائق */}
        {showHadayekGates && (
          <button
            type="button"
            onClick={() => setShowGatesLayer(!showGatesLayer)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
              showGatesLayer
                ? 'bg-purple-700 hover:bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/40'
            }`}
            title="إظهار أو إخفاء بوابات حدائق الأهرام (خوفو، أحمس، خفرع، منقرع، حورس، مينا)"
          >
            <span>🚪 بوابات الحدائق</span>
            <span className={`w-2 h-2 rounded-full ${showGatesLayer ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          </button>
        )}

        {/* 👁️ زر إخفاء / إظهار الأنشطة لتقليل الزحام */}
        {mode === 'view' && (
          <button
            type="button"
            onClick={() => {
              const nextVal = !showBusinesses;
              setShowBusinesses(nextVal);
              if (onToggleBusinessesVisibility) onToggleBusinessesVisibility(nextVal);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
              showBusinesses
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40'
            }`}
            title={showBusinesses ? 'إخفاء الأنشطة من على الخريطة لتنظيف الرؤية' : 'إظهار الأنشطة على الخريطة'}
          >
            {showBusinesses ? (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>إخفاء الأنشطة</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>إظهار الأنشطة</span>
              </>
            )}
          </button>
        )}

        {/* 🎯 زر فلاتر الخريطة والتصنيفات */}
        {mode === 'view' && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMapFilterOpen(!isMapFilterOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                mapCategoryFilter !== 'all' || onlyVerifiedFilter
                  ? 'bg-emerald-500 text-slate-950 font-black ring-2 ring-emerald-400/50'
                  : 'bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
              title="تصفية وفلترة الأنشطة المعروضة على الخريطة"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
              <span>فلاتر الخريطة</span>
              {(mapCategoryFilter !== 'all' || onlyVerifiedFilter) && (
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
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

                  {showHadayekGates && (
                    <label className="flex items-center justify-between text-xs text-slate-300 font-bold cursor-pointer select-none">
                      <span>إظهار دبابيس بوابات الحدائق</span>
                      <input
                        type="checkbox"
                        checked={showGatesLayer}
                        onChange={(e) => setShowGatesLayer(e.target.checked)}
                        className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  )}

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
                      إعادة تعيين الكل
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowBusinesses(false);
                        setIsMapFilterOpen(false);
                      }}
                      className="text-[11px] font-black text-rose-400 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-rose-500/30 cursor-pointer transition-colors"
                    >
                      إخفاء كافة الأنشطة
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fullscreen Expand / Minimize Button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
            isExpanded
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg'
              : 'bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] border-[var(--border-color)]'
          }`}
          title={isExpanded ? 'إنهاء وضع الشاشة الكاملة' : 'توسيع الخريطة ملء الشاشة'}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
