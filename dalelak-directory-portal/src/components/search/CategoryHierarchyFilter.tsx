import React, { useMemo } from 'react';
import { Layers3 } from 'lucide-react';
import { Business } from '../../types';
import { getCategoryGroupById } from '../../data/categoryTaxonomy';
import { classifyBusinessCategory } from '../../utils/categoryMatcher';

interface CategoryHierarchyFilterProps {
  businesses: Business[];
  mainCategoryId: string;
  subcategoryId: string;
  onMainCategoryChange: (id: string) => void;
  onSubcategoryChange: (id: string) => void;
}

export const CategoryHierarchyFilter: React.FC<CategoryHierarchyFilterProps> = ({
  businesses,
  mainCategoryId,
  subcategoryId,
  onMainCategoryChange,
  onSubcategoryChange,
}) => {
  const group = getCategoryGroupById(mainCategoryId);
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    for (const business of businesses) {
      const classification = classifyBusinessCategory(business);
      if (classification.mainCategoryId !== mainCategoryId || classification.subcategoryId === 'all') continue;
      result.set(classification.subcategoryId, (result.get(classification.subcategoryId) || 0) + 1);
    }
    return result;
  }, [businesses, mainCategoryId]);

  if (!group) return null;
  const children = group.children.filter((child) => (counts.get(child.id) || 0) > 0 || child.id === subcategoryId);

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/55 p-3 space-y-2.5" aria-label="التصنيفات الفرعية">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
          <Layers3 className="w-4 h-4 text-amber-700" />
          <span>حدد نوع الخدمة داخل {group.label}</span>
        </div>
        <button
          type="button"
          onClick={() => onMainCategoryChange('all')}
          className="text-[11px] font-bold text-amber-800 hover:text-amber-950"
        >
          مسح التصنيف
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
        <button
          type="button"
          aria-pressed={subcategoryId === 'all'}
          onClick={() => onSubcategoryChange('all')}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-black transition-colors ${
            subcategoryId === 'all'
              ? 'bg-amber-500 border-amber-500 text-slate-950'
              : 'bg-white border-amber-200 text-slate-700 hover:border-amber-400'
          }`}
        >
          الكل في {group.label}
        </button>
        {children.map((child) => {
          const count = counts.get(child.id) || 0;
          const active = subcategoryId === child.id;
          return (
            <button
              key={child.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSubcategoryChange(active ? 'all' : child.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                active
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-amber-400'
              }`}
            >
              {child.label} <span className="font-mono opacity-70">({count})</span>
            </button>
          );
        })}
        {children.length === 0 && (
          <span className="text-xs font-bold text-slate-500">لا توجد أنشطة فرعية متاحة في النطاق الحالي.</span>
        )}
      </div>
    </div>
  );
};
