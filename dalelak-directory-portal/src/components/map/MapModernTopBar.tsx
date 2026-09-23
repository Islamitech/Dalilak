import React from 'react';
import { MapPin, ChevronDown, X } from 'lucide-react';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../../data/hadayekDistrictsGeoData';
import { MAP_QUICK_CATEGORIES } from './constants/mapConstants';

export interface MapModernTopBarProps {
  selectedZone?: string;
  onSelectZone?: (zone: string) => void;
  categoryFilter?: string;
  onCategoryChange?: (category: string) => void;
  quickCategories?: Array<{ id: string; name: string; icon: string; count?: number }>;
  filteredBusinessesCount?: number;
}

export const MapModernTopBar: React.FC<MapModernTopBarProps> = ({
  selectedZone = '',
  onSelectZone,
  categoryFilter = 'all',
  onCategoryChange,
  quickCategories,
  filteredBusinessesCount,
}) => {
  const categories = quickCategories && quickCategories.length > 0 ? quickCategories : MAP_QUICK_CATEGORIES;

  return (
    <div
      className="absolute top-2.5 sm:top-4 right-2.5 left-2.5 sm:right-5 sm:left-5 z-[900] pointer-events-none select-none font-['Cairo',sans-serif]"
      dir="rtl"
    >
      <div className="pointer-events-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 max-w-7xl mx-auto w-full">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* District Selector Pill */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md hover:shadow-lg rounded-2xl p-1 sm:p-1.5 flex items-center gap-1 sm:gap-1.5 shrink-0 transition-all">
            <div className="relative inline-flex items-center">
              <select
                value={selectedZone || ''}
                onChange={(e) => onSelectZone && onSelectZone(e.target.value)}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl pr-2 pl-6 py-1 cursor-pointer outline-none transition-colors"
                style={{ colorScheme: 'light' }}
                title="تحديد المنطقة"
              >
                <option value="">🧭 كل المناطق (أ - ع)</option>
                {HADAYEK_OFFICIAL_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.letterAr}>
                    {d.nameAr}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-1.5 pointer-events-none" />
            </div>

            {selectedZone && (
              <button
                type="button"
                onClick={() => onSelectZone && onSelectZone('')}
                className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="إلغاء تحديد المنطقة وعرض كل المناطق"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Activity Category Selector Pill */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md hover:shadow-lg rounded-2xl p-1 sm:p-1.5 flex items-center gap-1 sm:gap-1.5 shrink-0 transition-all">
            <div className="relative inline-flex items-center">
              <select
                value={categoryFilter || 'all'}
                onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
                className={`border font-bold text-xs rounded-xl pr-2 pl-6 py-1 cursor-pointer outline-none transition-colors ${
                  categoryFilter && categoryFilter !== 'all'
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-950 font-black'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
                style={{ colorScheme: 'light' }}
                title="اختر نوع النشاط لعرضه على الخريطة"
              >
                <option value="all">🌟 اختر نوع النشاط لإظهاره</option>
                {categories
                  .filter((c) => c.id !== 'all')
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-1.5 pointer-events-none" />
            </div>

            {categoryFilter && categoryFilter !== 'all' && (
              <button
                type="button"
                onClick={() => onCategoryChange && onCategoryChange('all')}
                className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="إلغاء الفلتر وإخفاء الأنشطة"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
