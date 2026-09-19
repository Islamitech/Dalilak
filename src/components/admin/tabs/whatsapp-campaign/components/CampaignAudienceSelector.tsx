import React from 'react';
import { Users, Download, MapPin, XCircle } from 'lucide-react';
import { Business } from '../../../../../types';

interface CampaignAudienceSelectorProps {
  targetBusinesses: Business[];
  totalBusinessesCount: number;
  audienceFilter: 'all' | 'honorary' | 'verified';
  setAudienceFilter: (val: 'all' | 'honorary' | 'verified') => void;
  governorateFilter: string;
  setGovernorateFilter: (val: string) => void;
  cityFilter: string;
  setCityFilter: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  hadayekRadiusFilter: boolean;
  setHadayekRadiusFilter: (val: boolean) => void;
  hadayekTotalCount: number;
  governorateList: string[];
  cityList: string[];
  categoryList: string[];
  validPhoneCount: number;
  landlineCount: number;
  dummyPhoneCount: number;
  onOpenExportContacts: () => void;
  onResetQueueIndex: () => void;
}

export const CampaignAudienceSelector: React.FC<CampaignAudienceSelectorProps> = ({
  targetBusinesses,
  totalBusinessesCount,
  audienceFilter,
  setAudienceFilter,
  governorateFilter,
  setGovernorateFilter,
  cityFilter,
  setCityFilter,
  categoryFilter,
  setCategoryFilter,
  hadayekRadiusFilter,
  setHadayekRadiusFilter,
  hadayekTotalCount,
  governorateList,
  cityList,
  categoryList,
  validPhoneCount,
  landlineCount,
  dummyPhoneCount,
  onOpenExportContacts,
  onResetQueueIndex,
}) => {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="font-black text-sm sm:text-base">1. تحديد الشريحة المستهدفة</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenExportContacts}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
            title="تصدير الشريحة المختارة أو كافة جهات الاتصال لحساب Google"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير جهات الاتصال (VCF)</span>
          </button>
          <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            {targetBusinesses.length} منشأة مطابقة
          </span>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 block">فئة الأنشطة:</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setAudienceFilter('all');
                onResetQueueIndex();
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                audienceFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              كافة الأنشطة بالدليل
            </button>
            <button
              type="button"
              onClick={() => {
                setAudienceFilter('honorary');
                onResetQueueIndex();
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                audienceFilter === 'honorary'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              الشرفية / المستوردة فقط ⭐
            </button>
            <button
              type="button"
              onClick={() => {
                setAudienceFilter('verified');
                onResetQueueIndex();
              }}
              className={`py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                audienceFilter === 'verified'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              الأنشطة الموثقة فقط ✅
            </button>
          </div>
        </div>

        {/* Governorate, City & Category Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="text-[11px] font-bold text-[var(--text-secondary)] mb-1 block">المحافظة / النطاق الجغرافي:</label>
            <select
              value={governorateFilter}
              onChange={(e) => {
                const val = e.target.value;
                setGovernorateFilter(val);
                if (val === '__hadayek_8km__') {
                  setHadayekRadiusFilter(true);
                } else if (hadayekRadiusFilter) {
                  setHadayekRadiusFilter(false);
                }
                onResetQueueIndex();
              }}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
            >
              <option value="all">كافة المحافظات ({totalBusinessesCount})</option>
              <option value="__hadayek_8km__">📍 حدائق الأهرام ومحيطها (نطاق 8 كم جغرافي) ({hadayekTotalCount})</option>
              {governorateList.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[var(--text-secondary)] mb-1 block">المدينة / الحي / المركز:</label>
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                onResetQueueIndex();
              }}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
            >
              <option value="all">كافة المدن / الأحياء ({cityList.length})</option>
              {cityList.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[var(--text-secondary)] mb-1 block">التصنيف:</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                onResetQueueIndex();
              }}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
            >
              <option value="all">كافة التصنيفات</option>
              {categoryList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 📍 HADAYEK AL AHRAM 8KM GEOFENCE FILTER CARD */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            hadayekRadiusFilter || governorateFilter === '__hadayek_8km__'
              ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
              : 'bg-white/5 border-[var(--border-color)] hover:border-emerald-500/40'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                  hadayekRadiusFilter || governorateFilter === '__hadayek_8km__'
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-black text-white">
                    فلتر حدائق الأهرام الجغرافي (نطاق 8 كم من المنتصف)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/30">
                    {hadayekTotalCount} نشاط يقع بالنطاق 📍
                  </span>
                  {(hadayekRadiusFilter || governorateFilter === '__hadayek_8km__') && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black animate-pulse">
                      مفعل الآن ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                  يحصر الأنشطة الواقعة ضمن دائرة 8 كم بالإحداثيات من منتصف حدائق الأهرام، حتى لو لم يُذكر اسم حدائق الأهرام في العنوان.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !(hadayekRadiusFilter || governorateFilter === '__hadayek_8km__');
                setHadayekRadiusFilter(next);
                if (governorateFilter === '__hadayek_8km__') {
                  setGovernorateFilter('all');
                }
                onResetQueueIndex();
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 ${
                hadayekRadiusFilter || governorateFilter === '__hadayek_8km__'
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 active:scale-95'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg active:scale-95'
              }`}
            >
              {hadayekRadiusFilter || governorateFilter === '__hadayek_8km__' ? (
                <>
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>إلغاء حصر النطاق ✕</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  <span>تفعيل فلتر 8 كم 🎯</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Phone Quality Audit Alert */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <p className="font-black text-white flex items-center gap-2">
              <span>أرقام محمول صالحة للواتساب:</span>
              <span className="text-emerald-400 font-mono text-sm">{validPhoneCount}</span>
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              {landlineCount > 0 && (
                <span className="text-blue-400 font-bold">
                  ☎️ تم استبعاد {landlineCount} رقم أرضي / خط ساخن
                </span>
              )}
              {dummyPhoneCount > 0 && (
                <span className="text-amber-400 font-bold">
                  ⚠️ تم استبعاد {dummyPhoneCount} رقم وهمي
                </span>
              )}
            </div>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)] font-mono shrink-0">
            نسبة السلامة: {targetBusinesses.length > 0 ? Math.round((validPhoneCount / targetBusinesses.length) * 100) : 0}%
          </div>
        </div>
      </div>
    </div>
  );
};
