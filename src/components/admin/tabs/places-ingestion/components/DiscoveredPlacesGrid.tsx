import React from 'react';
import {
  Store,
  Building2,
  MapPin,
  Globe,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import { EntityBucket, CandidatePlace } from '../types';
import { PlaceCardItem } from './PlaceCardItem';

interface DiscoveredPlacesGridProps {
  candidatePlaces: CandidatePlace[];
  displayedPlaces: CandidatePlace[];
  activeBucketTab: EntityBucket | 'ALL';
  setActiveBucketTab: (tab: EntityBucket | 'ALL') => void;
  selectedPlaceIds: Set<string>;
  currentSectorSubZone: string;
  showDuplicates: boolean;
  setShowDuplicates: (show: boolean) => void;
  filterOnlyQualified: boolean;
  setFilterOnlyQualified: (filter: boolean) => void;
  isIngesting: boolean;
  ingestProgress: { current: number; total: number } | null;
  ingestionMessage: string | null;
  pulledPhotosPreview: Array<{ id: string; name: string; photo: string }>;
  loadingPreviewId: string | null;
  onToggleSelectAll: () => void;
  onTogglePlace: (id: string) => void;
  onSelectTop100Commercial: () => void;
  onPreviewPhoto: (id: string, name: string, category: string) => void;
  onIngestSelected: () => void;
}

export const DiscoveredPlacesGrid: React.FC<DiscoveredPlacesGridProps> = ({
  candidatePlaces,
  displayedPlaces,
  activeBucketTab,
  setActiveBucketTab,
  selectedPlaceIds,
  currentSectorSubZone,
  showDuplicates,
  setShowDuplicates,
  filterOnlyQualified,
  setFilterOnlyQualified,
  isIngesting,
  ingestProgress,
  ingestionMessage,
  pulledPhotosPreview,
  loadingPreviewId,
  onToggleSelectAll,
  onTogglePlace,
  onSelectTop100Commercial,
  onPreviewPhoto,
  onIngestSelected,
}) => {
  return (
    <div className="space-y-4">
      {/* ── WORKFLOW STEPPER & MILESTONE COMPLETION BANNER ── */}
      <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/70 to-slate-900/90 p-5 sm:p-6 shadow-xl space-y-4">
        {/* Stepper indicator */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-black border border-indigo-500/40">
              1
            </span>
            <span className="text-xs font-black text-indigo-300">
              المرحلة الأولى: الاستكشاف والرصد المكاني (مجاني 100%)
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
              ✅ تم الاستكشاف
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/40">
              2
            </span>
            <span className="text-xs font-black text-emerald-300">
              المرحلة الثانية: تحديد وسحب البيانات (100 ثم 100) بالصور الكاملة
            </span>
          </div>
        </div>

        {/* Main Discovery Announcement */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎉</span>
              <h3 className="text-base sm:text-lg font-black text-white">
                اكتمل الاستكشاف: تم رصد{' '}
                <span className="text-indigo-400 font-mono text-xl sm:text-2xl underline decoration-indigo-500/50">
                  {candidatePlaces.length.toLocaleString('ar-EG')}
                </span>{' '}
                منشأة وكيان في {currentSectorSubZone}!
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              الاستكشاف مجاني 100% (لم يتم خصم أي تكلفة). يتوفر{' '}
              <strong className="text-emerald-400 font-mono">
                {candidatePlaces.filter(p => p.bucket === 'COMMERCIAL' && (!showDuplicates ? !p.isDuplicate : true)).length}
              </strong>{' '}
              نشاط تجاري مؤهل للسحب. سيتم سحب الصور الكاملة، الهاتف، والتقييمات تلقائياً عبر السيرفر لكل دفعة تسحبها.
            </p>
          </div>

          {/* Quick action button */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={onSelectTop100Commercial}
              className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>⚡ تحديد أول 100 منشأة للبدء بالسحب</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── QUAD-BUCKET SEGREGATION TABS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--border-color)]">
        <button
          type="button"
          onClick={() => setActiveBucketTab('COMMERCIAL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeBucketTab === 'COMMERCIAL'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-emerald-400 border border-[var(--border-color)]'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>🏪 الأنشطة التجارية والخدمية</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeBucketTab === 'COMMERCIAL' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {showDuplicates
              ? candidatePlaces.filter((p) => p.bucket === 'COMMERCIAL').length
              : candidatePlaces.filter((p) => p.bucket === 'COMMERCIAL' && !p.isDuplicate).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBucketTab('RESIDENTIAL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeBucketTab === 'RESIDENTIAL'
              ? 'bg-blue-500 text-slate-950 shadow-md'
              : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-blue-400 border border-[var(--border-color)]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>🏢 المجمعات والعقارات السكنية</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeBucketTab === 'RESIDENTIAL' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {showDuplicates
              ? candidatePlaces.filter((p) => p.bucket === 'RESIDENTIAL').length
              : candidatePlaces.filter((p) => p.bucket === 'RESIDENTIAL' && !p.isDuplicate).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBucketTab('INFRASTRUCTURE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeBucketTab === 'INFRASTRUCTURE'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-amber-400 border border-[var(--border-color)]'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>🛣️ الشوارع والمحاور والبوابات</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeBucketTab === 'INFRASTRUCTURE' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-amber-500/20 text-amber-400'
          }`}>
            {showDuplicates
              ? candidatePlaces.filter((p) => p.bucket === 'INFRASTRUCTURE').length
              : candidatePlaces.filter((p) => p.bucket === 'INFRASTRUCTURE' && !p.isDuplicate).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBucketTab('CIVIC')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeBucketTab === 'CIVIC'
              ? 'bg-purple-500 text-slate-950 shadow-md'
              : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-purple-400 border border-[var(--border-color)]'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>🏛️ المعالم والخدمات المدنية</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeBucketTab === 'CIVIC' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-purple-500/20 text-purple-400'
          }`}>
            {showDuplicates
              ? candidatePlaces.filter((p) => p.bucket === 'CIVIC').length
              : candidatePlaces.filter((p) => p.bucket === 'CIVIC' && !p.isDuplicate).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBucketTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeBucketTab === 'ALL'
              ? 'bg-slate-200 text-slate-950 shadow-md'
              : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-slate-200 border border-[var(--border-color)]'
          }`}
        >
          <span>🌐 الكل</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeBucketTab === 'ALL' ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300'
          }`}>
            {showDuplicates
              ? candidatePlaces.length
              : candidatePlaces.filter((p) => !p.isDuplicate).length}
          </span>
        </button>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="flex items-center gap-2 text-xs font-black text-[var(--text-primary)] hover:text-amber-500 transition-colors cursor-pointer"
          >
            {selectedPlaceIds.size === displayedPlaces.length && displayedPlaces.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-amber-500" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>تحديد الكل ({displayedPlaces.length})</span>
          </button>

          {displayedPlaces.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const topBatch = displayedPlaces.slice(0, 100).map((p) => p.id);
                topBatch.forEach((id) => selectedPlaceIds.add(id));
                onSelectTop100Commercial();
              }}
              className="text-xs font-black px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer"
              title="تحديد دفعة آمنة ومدروسة تقتصر على أول 100 منشأة لمنع الضغط والتعليق"
            >
              ⚡ {displayedPlaces.length > 100 ? 'تحديد أول 100 منشأة' : `تحديد المنشآت (${displayedPlaces.length})`}
            </button>
          )}

          <button
            type="button"
            onClick={() => setFilterOnlyQualified(!filterOnlyQualified)}
            className={`text-xs font-black px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              filterOnlyQualified
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-color)]'
            }`}
          >
            {filterOnlyQualified ? 'عرض المؤهل فقط' : 'عرض كافة النتائج'}
          </button>

          <button
            type="button"
            onClick={() => setShowDuplicates(!showDuplicates)}
            className={`text-xs font-black px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              showDuplicates
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-sm'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
            title={showDuplicates ? 'إخفاء المنشآت المسجلة مسبقاً' : 'عرض المنشآت المسجلة مسبقاً لمراجعتها'}
          >
            {showDuplicates ? (
              <>
                <Eye className="w-3.5 h-3.5 text-rose-400" />
                <span>عرض المكرر مفعّل ({candidatePlaces.filter(p => p.isDuplicate).length})</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                <span>المكرر محجوب ({candidatePlaces.filter(p => p.isDuplicate).length} مستبعد)</span>
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          disabled={isIngesting || selectedPlaceIds.size === 0 || (activeBucketTab !== 'COMMERCIAL' && activeBucketTab !== 'ALL')}
          onClick={onIngestSelected}
          className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs px-8 py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isIngesting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جارٍ سحب وتوثيق المنشآت بالصور ({ingestProgress?.current}/{ingestProgress?.total})...</span>
            </>
          ) : activeBucketTab === 'RESIDENTIAL' ? (
            <>
              <Building2 className="w-4 h-4" />
              <span>عقارات سكنية ({displayedPlaces.length}) - لا تحقن بالدليل</span>
            </>
          ) : activeBucketTab === 'INFRASTRUCTURE' ? (
            <>
              <MapPin className="w-4 h-4" />
              <span>شوارع ومحاور ({displayedPlaces.length}) - ملاحة</span>
            </>
          ) : activeBucketTab === 'CIVIC' ? (
            <>
              <Globe className="w-4 h-4" />
              <span>معالم عامة ({displayedPlaces.length})</span>
            </>
          ) : selectedPlaceIds.size === 0 ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>يرجى تحديد المنشآت (اضغط تحديد أول 100 أعلاه لبدء السحب)</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>🚀 بدء سحب وتوثيق ({candidatePlaces.filter(p => selectedPlaceIds.has(p.id) && p.bucket === 'COMMERCIAL').length}) منشأة تجارية بالصور الكاملة</span>
            </>
          )}
        </button>
      </div>

      {ingestionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black text-center">
          {ingestionMessage}
        </div>
      )}

      {/* 📸 معرض الصور المسحوبة فوراً للتوثيق والتحقق البصري */}
      {pulledPhotosPreview.length > 0 && (
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-emerald-500/30 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
              <Camera className="w-4 h-4" />
              <span>معرض المنشآت التي تم سحب وتوثيق صورها للتو ({pulledPhotosPreview.length} منشأة):</span>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
              ✅ تم الحقن بالدليل مع الصور
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
            {pulledPhotosPreview.slice(0, 12).map((item) => (
              <div key={item.id} className="group relative rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950 aspect-[4/3] shadow-xs">
                <img
                  src={item.photo}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[10px] font-black text-white line-clamp-1">
                    {item.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Places Grid or All-Duplicates Clean Slate Banner */}
      {displayedPlaces.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-slate-900/60 border border-emerald-500/30 rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-black text-white">
              القطاع مكتمل ونظيف 100% (لا توجد أي منشآت جديدة غير مسجلة)
            </h4>
            <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
              كافة المنشآت المستخرجة ({candidatePlaces.length} منشأة) مسجلة مسبقاً في المنظومة أو تم سحبها وحمايتها بالذاكرة. تم استبعادها تلقائياً لمنع أي تكرار وتوفير الكوتا 100%.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowDuplicates(true)}
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>معاينة المنشآت المستبعدة المسجلة مسبقاً ({candidatePlaces.filter(p => p.isDuplicate).length})</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedPlaces.map((p) => (
            <PlaceCardItem
              key={p.id}
              place={p}
              isSelected={selectedPlaceIds.has(p.id)}
              loadingPreviewId={loadingPreviewId}
              currentSectorSubZone={currentSectorSubZone}
              onTogglePlace={onTogglePlace}
              onPreviewPhoto={onPreviewPhoto}
            />
          ))}
        </div>
      )}
    </div>
  );
};
