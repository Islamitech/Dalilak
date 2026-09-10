import React from 'react';
import { X, SlidersHorizontal, RotateCcw, Check, MapPin, Layers, Clock, Star, Video } from 'lucide-react';
import {
  EGYPT_GOVERNORATES,
  EGYPT_CITIES_BY_GOV,
  HADAYEK_ALAHRAM_ZONES,
  CATEGORY_GROUPS,
} from '../../data/mockData';

export interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGov: string;
  onGovChange: (gov: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectedZone: string;
  onZoneChange: (zone: string) => void;
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  hasRatingOnly: boolean;
  onToggleHasRating: () => void;
  hasVideoOnly: boolean;
  onToggleHasVideo: () => void;
  sortBy: string;
  onSortChange: (s: any) => void;
  onResetAll: () => void;
  resultsCount: number;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  selectedGov,
  onGovChange,
  selectedCity,
  onCityChange,
  selectedZone,
  onZoneChange,
  categoryFilter,
  onCategoryChange,
  openNowOnly,
  onToggleOpenNow,
  hasRatingOnly,
  onToggleHasRating,
  hasVideoOnly,
  onToggleHasVideo,
  sortBy,
  onSortChange,
  onResetAll,
  resultsCount,
}) => {
  if (!isOpen) return null;

  const availableCities = selectedGov !== 'all' ? (EGYPT_CITIES_BY_GOV[selectedGov] || []) : [];
  const isHadayek = selectedCity.includes('حدائق الأهرام');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end animate-fade-in">
      <div
        className="w-full max-w-md h-full bg-[var(--bg-card)] border-r border-[var(--border-color)] shadow-2xl flex flex-col text-right animate-slide-left overflow-hidden"
        style={{ direction: 'rtl' }}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[var(--text-primary)]">خيارات التصفية والفرز</h3>
              <p className="text-[11px] text-slate-500 font-bold">تحديد نطاق البحث الجغرافي والنوعي</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Filter Body */}
        <div className="p-4 sm:p-5 space-y-6 flex-1 overflow-y-auto text-xs">
          {/* 1. Geographic Location (المحافظة والمنطقة) */}
          <div className="space-y-3">
            <h4 className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>النطاق الجغرافي</span>
            </h4>

            {/* Governorate */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 block">المحافظة:</label>
              <select
                value={selectedGov}
                onChange={(e) => {
                  onGovChange(e.target.value);
                  onCityChange('all');
                  onZoneChange('all');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">كافة المحافظات</option>
                {EGYPT_GOVERNORATES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            {availableCities.length > 0 && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-[11px] font-bold text-slate-500 block">المدينة / الحي:</label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    onCityChange(e.target.value);
                    onZoneChange('all');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">كافة مناطق المحافظة</option>
                  {availableCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Hadayek Al-Ahram Sub-Zones */}
            {isHadayek && (
              <div className="space-y-1 animate-fade-in bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60">
                <label className="text-[11px] font-bold text-amber-900 block">المنطقة / البوابة (حدائق الأهرام):</label>
                <select
                  value={selectedZone}
                  onChange={(e) => onZoneChange(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="all">كل مناطق حدائق الأهرام</option>
                  {HADAYEK_ALAHRAM_ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. Category Filter (الفئات والمجموعات) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>فئة النشاط</span>
            </h4>

            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">كافة الفئات والأنشطة</option>
              {CATEGORY_GROUPS.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  <option value={group.group}>كل {group.group}</option>
                  {group.items.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* 3. Special Conditions & Status (الحالات والخصائص) */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>الخصائص والتوثيق</span>
            </h4>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={openNowOnly}
                  onChange={onToggleOpenNow}
                  className="w-4 h-4 text-amber-500 rounded-sm focus:ring-amber-400 cursor-pointer"
                />
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800">مفتوح الآن لاستقبال العملاء</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={hasRatingOnly}
                  onChange={onToggleHasRating}
                  className="w-4 h-4 text-amber-500 rounded-sm focus:ring-amber-400 cursor-pointer"
                />
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span className="font-bold text-slate-800">يحتوي على تقييمات Google Maps</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={hasVideoOnly}
                  onChange={onToggleHasVideo}
                  className="w-4 h-4 text-amber-500 rounded-sm focus:ring-amber-400 cursor-pointer"
                />
                <div className="flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-bold text-slate-800">يحتوي على فيديو تعريفي</span>
                </div>
              </label>
            </div>
          </div>

          {/* 4. Sorting Rule */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <h4 className="font-black text-slate-900 text-xs">طريقة ترتيب النتائج</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'default', label: 'الأفضل مطابقة' },
                { id: 'nearest', label: 'الأقرب مسافة' },
                { id: 'newest', label: 'الأحدث تسجيلاً' },
                { id: 'open_now', label: 'المفتوح أولاً' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSortChange(s.id)}
                  className={`p-2 rounded-xl text-[11px] font-bold border text-center transition-all cursor-pointer ${
                    sortBy === s.id
                      ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-[var(--border-color)] bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onResetAll}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer text-center"
          >
            <span>عرض {resultsCount} نشاطاً</span>
          </button>
        </div>
      </div>
    </div>
  );
};
