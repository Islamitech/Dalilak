import React from 'react';
import {
  X,
  RotateCcw,
  MapPin,
  Layers,
  Clock,
  Star,
  Video,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { EGYPT_GOVERNORATES, CATEGORY_GROUPS, HADAYEK_ALAHRAM_ZONES, EGYPT_CITIES_BY_GOV } from '../../data/mockData';

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
  sortBy: string;
  onSortChange: (sort: string) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  hasRatingOnly: boolean;
  onToggleHasRating: () => void;
  hasVideoOnly: boolean;
  onToggleHasVideo: () => void;
  resultsCount: number;
  onResetAll: () => void;
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
  sortBy,
  onSortChange,
  openNowOnly,
  onToggleOpenNow,
  hasRatingOnly,
  onToggleHasRating,
  hasVideoOnly,
  onToggleHasVideo,
  resultsCount,
  onResetAll,
}) => {
  if (!isOpen) return null;

  const isGiza = selectedGov === 'الجيزة';
  const isHadayek = selectedCity.includes('حدائق الأهرام');
  const availableCities = selectedGov && EGYPT_CITIES_BY_GOV[selectedGov] ? EGYPT_CITIES_BY_GOV[selectedGov] : [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ direction: 'rtl' }}>
      {/* 1. Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* 2. Responsive Container: Mobile Bottom Sheet / Desktop Side Drawer */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-full sm:max-w-md z-10 flex flex-col justify-end sm:justify-start pointer-events-none">
        <div className="w-full bg-[var(--bg-card)] border-t sm:border-t-0 sm:border-l border-[var(--border-color)] rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col max-h-[90vh] sm:h-full pointer-events-auto animate-slide-up sm:animate-slide-left">
          
          {/* Mobile Drag Handle Indicator */}
          <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
            <div className="w-12 h-1 bg-slate-300 rounded-full" />
          </div>

          {/* Drawer Header */}
          <div className="px-5 py-3.5 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base">تصفية الأنشطة</h3>
                <p className="text-[11px] text-slate-500 font-bold">خصص نتائج البحث بما يناسبك</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Filters Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs">
            
            {/* 1. Location Selection (الموقع الجغرافي) */}
            <div className="space-y-2.5">
              <h4 className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>المحافظة والمنطقة</span>
              </h4>

              {/* Governorate Dropdown */}
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
                  <option value="all">كل محافظات مصر</option>
                  {EGYPT_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Dropdown */}
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
                <div className="space-y-1 animate-fade-in bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80">
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

            {/* 2. Category Filter (فئة النشاط) */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <h4 className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>فئة النشاط والخدمة</span>
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

            {/* 3. Friendly Quick Checks (خيارات ومميزات إضافية) */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100">
              <h4 className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>خيارات ومميزات</span>
              </h4>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 text-xs">مفتوح الآن لاستقبال العملاء</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={openNowOnly}
                    onChange={onToggleOpenNow}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span className="font-bold text-slate-800 text-xs">يحتوي على تقييمات معتمدة</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasRatingOnly}
                    onChange={onToggleHasRating}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-slate-800 text-xs">يحتوي على فيديو تعريفي</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasVideoOnly}
                    onChange={onToggleHasVideo}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* 4. Sorting Method (ترتيب النتائج) */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <h4 className="font-black text-slate-900 text-xs">ترتيب النتائج</h4>
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
                    className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      sortBy === s.id
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {sortBy === s.id && <Check className="w-3 h-3" />}
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Drawer Sticky Footer Actions */}
          <div className="p-4 border-t border-[var(--border-color)] bg-slate-50 flex items-center justify-between gap-3 pb-safe">
            <button
              type="button"
              onClick={onResetAll}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
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
    </div>
  );
};
