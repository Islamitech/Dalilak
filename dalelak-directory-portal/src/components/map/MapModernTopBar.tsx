import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { HADAYEK_OFFICIAL_DISTRICTS } from '../../data/hadayekDistrictsGeoData';
import { MAP_QUICK_CATEGORIES } from './constants/mapConstants';
export interface MapModernTopBarProps {
 selectedZone?: string;
 onSelectZone?: (zone: string) => void;
 categoryFilter?: string;
 onCategoryChange?: (category: string) => void;
 quickCategories?: Array<{ id: string; name: string; icon: string; count?: number }>;
 filteredBusinessesCount?: number;
 searchMode: 'browse' | 'building';
 onSearchModeChange: (mode: 'browse' | 'building') => void;
 children?: React.ReactNode;
 buildingNumber?: string;
}
export const MapModernTopBar: React.FC<MapModernTopBarProps> = ({
 selectedZone = '', onSelectZone, categoryFilter = 'all', onCategoryChange,
 quickCategories, searchMode, onSearchModeChange, children, buildingNumber,
}) => {
 const [expanded, setExpanded] = useState(Boolean(selectedZone || categoryFilter !== 'all'));
 const regionRef = useRef<HTMLSelectElement>(null);
 useEffect(() => { if (selectedZone || categoryFilter !== 'all') setExpanded(true); }, [selectedZone, categoryFilter]);
 const categories = quickCategories?.length ? quickCategories : MAP_QUICK_CATEGORIES;
 const open = () => {
   flushSync(() => setExpanded(true));
   regionRef.current?.focus();
   try { regionRef.current?.showPicker?.(); } catch { /* Keep the focused select available in browsers without showPicker. */ }
 };
 return (
 <div dir="rtl" className="absolute top-3 inset-x-3 sm:inset-x-5 z-[900] pointer-events-none">
  <div className="relative max-w-2xl mx-auto pointer-events-auto">
   <div className="flex items-center gap-1 min-h-12 px-1.5 bg-white/95 border border-slate-200 rounded-full shadow-sm">
    <button type="button" aria-label={expanded ? 'إغلاق أدوات البحث' : 'فتح البحث والفلاتر'} onClick={() => expanded ? setExpanded(false) : open()} className="shrink-0 w-9 h-11 flex items-center justify-center text-amber-600"><SlidersHorizontal size={20} /></button>
    {expanded ? <>
     <select ref={regionRef} aria-label="اختر المنطقة" value={selectedZone === 'all' ? '' : selectedZone}
      onChange={e => onSelectZone?.(e.target.value)}
      className="min-w-0 w-[27%] max-w-32 shrink-0 h-10 rounded-xl border border-slate-200 bg-white px-1 text-xs text-slate-800">
      <option value="">المنطقة</option>
      {HADAYEK_OFFICIAL_DISTRICTS.map(d => <option key={d.id} value={d.letterAr}>منطقة {d.letterAr}</option>)}
     </select>
     <select aria-label="نوع البحث" value={searchMode === 'building' ? 'building' : categoryFilter}
      onChange={e => { const building = e.target.value === 'building'; onSearchModeChange(building ? 'building' : 'browse'); onCategoryChange?.(building ? 'all' : e.target.value); }}
      className="min-w-0 w-[23%] max-w-36 shrink-0 h-10 rounded-xl border border-slate-200 bg-white px-1 text-xs text-slate-800">
      <option value="all">نوع البحث</option>
      <option value="building" disabled={!selectedZone || selectedZone === 'all'}>مبنى</option>
      {categories.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
     </select>
     <div className="min-w-0 flex-1">{searchMode === 'building' && selectedZone ? children : <span className="block truncate px-1 text-xs text-slate-500">{categoryFilter !== 'all' ? 'أنشطة المنطقة' : 'اختر ما تبحث عنه'}</span>}</div>
     <button type="button" aria-label="مسح البحث والفلاتر" onClick={() => { onSelectZone?.(''); onCategoryChange?.('all'); onSearchModeChange('browse'); setExpanded(false); }} className="w-7 h-11 shrink-0 flex items-center justify-center text-slate-500"><X size={16} /></button>
    </> : <button type="button" onClick={open} className="flex-1 min-w-0 flex justify-between items-center gap-2 h-11 px-2 text-sm text-slate-600"><span className="truncate">ابحث في حدائق الأهرام…</span><Search size={19} className="shrink-0" /></button>}
   </div>
   {buildingNumber && <div aria-label="موقع المبنى" className="mt-2 w-fit rounded-full bg-white/95 border border-slate-200 px-3 py-1.5 text-xs text-slate-700 shadow-sm">منطقة {selectedZone} ← مبنى {buildingNumber}</div>}
  </div>
 </div>);
};
