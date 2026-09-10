import React from 'react';
import { MapPin, Sparkles, Loader2, Navigation, Maximize2, Minimize2 } from 'lucide-react';
import { MapTileLayerType, GOVERNORATE_COORDS } from './mapTypes';

interface MapHeaderBarProps {
  mode: 'picker' | 'view';
  filteredBusinessesCount: number;
  tileLayer: MapTileLayerType;
  onSwitchTileLayer: (layer: MapTileLayerType) => void;
  selectedGovFilter: string;
  onGovChange: (gov: string) => void;
  isLocating: boolean;
  onGetLocation: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const MapHeaderBar: React.FC<MapHeaderBarProps> = ({
  mode,
  filteredBusinessesCount,
  tileLayer,
  onSwitchTileLayer,
  selectedGovFilter,
  onGovChange,
  isLocating,
  onGetLocation,
  isExpanded,
  onToggleExpand,
}) => {
  return (
    <div className="bg-[var(--map-header-bg)] p-2.5 sm:p-3 border-b border-[var(--map-header-border)] flex flex-wrap items-center justify-between gap-2 z-20">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow">
          <MapPin className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h4 className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
            <span>{mode === 'picker' ? 'تحديد وتوجيه موقع النشاط بدقة خريطة جوجل' : 'خريطة الأنشطة والتوثيق الميداني المباشر'}</span>
            <span className="bg-emerald-500/15 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>دقة قمر صناعي 100%</span>
            </span>
          </h4>
          <p className="text-[10px] text-amber-400 font-medium">
            {mode === 'picker'
              ? 'انقر على أي نقطة، أو اسحب الدبوس بدقة، أو ابحث باسم الشارع / الصق رابط جوجل ماب'
              : `إجمالي ${filteredBusinessesCount} نشاط تجاري موثق على الخريطة`}
          </p>
        </div>
      </div>

      {/* Controls Bar Right Side */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Tile Layer Switcher Pills */}
        <div className="flex items-center bg-[var(--input-bg)] p-0.5 rounded-xl border border-[var(--border-color)] text-[11px] font-bold">
          <button
            type="button"
            onClick={() => onSwitchTileLayer('google-streets')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              tileLayer === 'google-streets'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="عرض خريطة شوارع جوجل الرسمية (Google Streets)"
          >
            <span>🗺️ شوارع جوجل</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchTileLayer('google-hybrid')}
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
        {mode === 'picker' && (
          <button
            type="button"
            onClick={onGetLocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black px-3 py-1.5 rounded-xl shadow transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            title="تحديد موقعي الحالي بأعلى دقة قمر صناعي GPS"
          >
            {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5 fill-slate-950" />}
            <span>{isLocating ? 'جاري التحديد...' : 'موقعي الفعلي'}</span>
          </button>
        )}

        {/* Fullscreen Expand / Minimize Button */}
        <button
          type="button"
          onClick={onToggleExpand}
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
