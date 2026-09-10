import React from 'react';
import { Building2 } from 'lucide-react';
import { CATEGORY_GROUPS, EGYPT_GOVERNORATES, getGroupFromCategory } from '../../data/mockData';

interface FormGeneralInfoSectionProps {
  nameAr: string;
  setNameAr: (val: string) => void;
  nameEn: string;
  setNameEn: (val: string) => void;
  selectedGroup: string;
  handleGroupChange: (newGroupName: string) => void;
  category: string;
  setCategory: (val: string) => void;
  governorate: string;
  setGovernorate: (val: string) => void;
}

export const FormGeneralInfoSection: React.FC<FormGeneralInfoSectionProps> = ({
  nameAr,
  setNameAr,
  nameEn,
  setNameEn,
  selectedGroup,
  handleGroupChange,
  category,
  setCategory,
  governorate,
  setGovernorate,
}) => {
  const currentGroupObj = CATEGORY_GROUPS.find((g) => g.group === selectedGroup) || CATEGORY_GROUPS[0];
  const isKnownCategory = getGroupFromCategory(category) !== undefined;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-md transition-colors duration-300">
      <div className="flex items-center gap-2 text-amber-500 pb-2 border-b border-[var(--border-color)]">
        <Building2 className="w-5 h-5" />
        <h3 className="font-bold text-sm text-[var(--text-primary)]">1. بيانات النشاط التجاري (Google Business Profile)</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[var(--text-primary)] font-bold">اسم النشاط باللغة العربية</label>
            <span className="text-[10px] text-amber-600 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">عربي أو إنجليزي</span>
          </div>
          <input
            type="text"
            placeholder="مثال: مطعم وسوبر ماركت الخير"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 transition-all shadow-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[var(--text-primary)] font-bold">اسم النشاط بالإنجليزية</label>
            <span className="text-[10px] text-blue-600 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded">اختياري / بديل</span>
          </div>
          <input
            type="text"
            placeholder="e.g. El Kheer Restaurant"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 transition-all shadow-sm dir-ltr text-right font-sans"
          />
        </div>

        {/* 1. القسم الرئيسي للنشاط */}
        <div>
          <label className="block text-[var(--text-primary)] font-bold mb-1">
            القسم / النشاط الرئيسي *
          </label>
          <select
            value={selectedGroup}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm text-xs sm:text-sm cursor-pointer"
          >
            {CATEGORY_GROUPS.map((g) => (
              <option key={g.group} value={g.group}>
                {g.icon} {g.group}
              </option>
            ))}
          </select>
        </div>

        {/* 2. التخصص والتصنيف الداخلي */}
        <div>
          <label className="block text-[var(--text-primary)] font-bold mb-1 flex items-center justify-between">
            <span>التخصص / التصنيف الداخلي *</span>
            <span className="text-[10px] text-amber-600 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
              {currentGroupObj.items.length} تخصص متاح
            </span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-700 font-black rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm text-xs sm:text-sm cursor-pointer"
          >
            {!isKnownCategory && category && (
              <option value={category} className="text-emerald-600 font-bold">
                {category} (تصنيف خرائط Google)
              </option>
            )}
            {currentGroupObj.items.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[var(--text-primary)] font-bold mb-1">المحافظة *</label>
          <select
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm cursor-pointer"
          >
            {EGYPT_GOVERNORATES.map((gov) => (
              <option key={gov} value={gov}>
                {gov}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
