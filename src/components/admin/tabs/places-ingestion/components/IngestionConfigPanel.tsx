import React from 'react';
import {
  Building2,
  Coins,
  Filter,
  MapPin,
  Layers,
  Hash,
  Crosshair,
  Navigation,
  Sparkles,
  Loader2,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { HadayekSector, ScanChunkStatus } from '../types';
import {
  HADAYEK_SECTORS,
  FUTURE_EXPANSION_HUBS,
  CATEGORY_PRESETS,
  getCategoryIconPrefix,
} from '../constants';

interface IngestionConfigPanelProps {
  currentSector: HadayekSector;
  existingSectorBusinessesCount: number;
  selectedSectorIndex: number;
  showExpansionHubs: boolean;
  setShowExpansionHubs: (show: boolean) => void;
  selectedExpansionHubIndex: number;
  isExpansionHubActive: boolean;
  isCustomHub: boolean;
  selectedCategoryIndex: number;
  isExhaustiveAtlasMode: boolean;
  setIsExhaustiveAtlasMode: (val: boolean) => void;
  pullCount: number;
  setPullCount: (cnt: number) => void;
  customScanRadius: number;
  setCustomScanRadius: (r: number) => void;
  gridDensity: 'standard' | 'deep';
  setGridDensity: (density: 'standard' | 'deep') => void;
  autoExcludePreviousScans: boolean;
  setAutoExcludePreviousScans: (val: boolean) => void;
  enableDeepStratumScan: boolean;
  setEnableDeepStratumScan: (val: boolean) => void;
  seenHistoryCount: number;
  isScanning: boolean;
  scanChunkStatus: ScanChunkStatus | null;
  onSectorChange: (idx: number) => void;
  onExpansionHubChange: (idx: number) => void;
  onCategoryChange: (catIdx: number) => void;
  onExecuteScan: () => void;
  onClearHistoryCache: () => void;
}

export const IngestionConfigPanel: React.FC<IngestionConfigPanelProps> = ({
  currentSector,
  existingSectorBusinessesCount,
  selectedSectorIndex,
  showExpansionHubs,
  setShowExpansionHubs,
  selectedExpansionHubIndex,
  isExpansionHubActive,
  isCustomHub,
  selectedCategoryIndex,
  isExhaustiveAtlasMode,
  setIsExhaustiveAtlasMode,
  pullCount,
  setPullCount,
  customScanRadius,
  setCustomScanRadius,
  gridDensity,
  setGridDensity,
  autoExcludePreviousScans,
  setAutoExcludePreviousScans,
  enableDeepStratumScan,
  setEnableDeepStratumScan,
  seenHistoryCount,
  isScanning,
  scanChunkStatus,
  onSectorChange,
  onExpansionHubChange,
  onCategoryChange,
  onExecuteScan,
  onClearHistoryCache,
}) => {
  return (
    <>
      {/* ── HEADER BANNER: ATLAS HADAYEK AL-AHRAM SOVEREIGN HUB ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>محرك أطلس حدائق الأهرام الشامل (Atlas Engine)</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                نظام السحب الجزئي المتتابع (Chunk-by-Chunk)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <span>استيراد وتوثيق أنشطة قطاعات حدائق الأهرام الميدانية</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              محرك مسح استيعابي يربط خرائط Google مباشرة بقاعدة بيانات دليلك، يسحب المنشآت والأنشطة أجزاءً أجزاء بدقة 100% لكل قطاع أبجدي وبوابة دون التقيد بنشاط معين، محققاً هدف التغطية الكاملة بنمط أطلس الميداني.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-indigo-400/20 rounded-2xl p-3.5 text-center min-w-[190px] shrink-0">
            <div className="text-[10.5px] text-slate-400 font-bold mb-1 flex items-center justify-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>المسجل مسبقاً بالقطاع الحالي</span>
            </div>
            <div className="text-xl font-black text-amber-400 font-mono">
              {existingSectorBusinessesCount} منشأة
            </div>
            <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
              في {currentSector.subZone}
            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH SCOPE CONTROLS & QUERY BUILDER ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-black text-[var(--text-primary)] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-500" />
            <span>إعدادات مسح القطاع ونمط أطلس الاستيعابي</span>
          </span>
          <span className="text-xs font-bold text-[var(--text-muted)]">
            القطاع المحدد: <strong className="text-amber-500">{currentSector.label}</strong>
          </span>
        </h3>

        {/* Row 1: Sector & Category Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Hadayek Al-Ahram Sector Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[var(--text-muted)] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>قطاع / منطقة حدائق الأهرام</span>
              </span>
              <button
                type="button"
                onClick={() => setShowExpansionHubs(!showExpansionHubs)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer underline"
              >
                {showExpansionHubs ? 'إخفاء نطاقات التوسع' : 'نطاقات التوسع المستقبلي'}
              </button>
            </label>

            {!isExpansionHubActive && !isCustomHub && (
              <select
                value={selectedSectorIndex}
                onChange={(e) => onSectorChange(Number(e.target.value))}
                className="w-full bg-[var(--input-bg)] border border-amber-500/40 text-[var(--text-primary)] text-xs font-black p-3 rounded-2xl focus:border-amber-500 focus:outline-hidden cursor-pointer"
              >
                <optgroup label="🏛️ المناطق والتقسيمات الأبجدية الـ 16">
                  {HADAYEK_SECTORS.slice(0, 16).map((s, i) => (
                    <option key={s.id} value={i}>
                      📍 {s.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🛣️ المحاور والشوارع التجارية الرئيسية">
                  {HADAYEK_SECTORS.slice(16, 19).map((s, i) => (
                    <option key={s.id} value={i + 16}>
                      🛣️ {s.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌐 النطاق العام">
                  <option value={19}>🌐 {HADAYEK_SECTORS[19]?.label || 'حدائق الأهرام - كامل المدينة'}</option>
                </optgroup>
              </select>
            )}

            {/* Expansion Hubs if toggled */}
            {showExpansionHubs && (
              <div className="pt-2">
                <label className="text-[11px] font-bold text-indigo-300 block mb-1">
                  🌐 نطاقات التوسع المصرية المحفوظة:
                </label>
                <select
                  value={selectedExpansionHubIndex}
                  onChange={(e) => onExpansionHubChange(Number(e.target.value))}
                  className="w-full bg-[var(--input-bg)] border border-indigo-500/40 text-[var(--text-primary)] text-xs font-black p-2.5 rounded-xl cursor-pointer"
                >
                  {FUTURE_EXPANSION_HUBS.map((h, i) => (
                    <option key={i} value={i}>
                      🌍 {h.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[var(--text-muted)] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>نمط النشاط المطلوب سحبه</span>
            </label>
            <select
              value={selectedCategoryIndex}
              onChange={(e) => onCategoryChange(Number(e.target.value))}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-black p-3 rounded-2xl focus:border-amber-500 focus:outline-hidden cursor-pointer"
            >
              {CATEGORY_PRESETS.map((c, i) => (
                <option key={i} value={i}>
                  {getCategoryIconPrefix(c.type)}{c.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. نمط الاستيعاب والسحب الجزئي */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[var(--text-muted)] flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-amber-500" />
                <span>عمق المسح (Chunk Batching)</span>
              </label>
              <button
                type="button"
                onClick={() => setIsExhaustiveAtlasMode(!isExhaustiveAtlasMode)}
                className={`text-[10px] font-black px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  isExhaustiveAtlasMode 
                    ? 'bg-amber-500 text-slate-950' 
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isExhaustiveAtlasMode ? 'سحب كامل للقطاع ♾️' : 'تحديد عدد أقصى'}
              </button>
            </div>

            {isExhaustiveAtlasMode ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-center">
                <div className="text-xs font-black text-amber-400">
                  ♾️ مسح استيعابي شامل للقطاع
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  يسحب كافة الأنشطة والمحلات الموثقة على الخريطة تباعاً أجزاءً أجزاء حتى الاكتمال
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    max={500}
                    step={10}
                    value={pullCount}
                    onChange={(e) => setPullCount(Math.max(10, Math.min(500, Number(e.target.value) || 100)))}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-black p-3 rounded-2xl focus:border-amber-500 focus:outline-hidden font-mono text-center"
                  />
                  <span className="text-xs font-bold text-[var(--text-muted)] shrink-0">منشأة في الدفعة</span>
                </div>
                <div className="text-[9.5px] text-emerald-400 font-bold flex items-center justify-between px-1">
                  <span>💡 رصد كافة المنشآت بدون تعليق</span>
                  <span>(100 منشأة لكل استيراد)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Pure Geographic Bounding Box & Coordinates Controller */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 to-indigo-950/80 border border-indigo-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/20 pb-2">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-white">
                النطاق الجغرافي الدقيق لخرائط Google (Pure Spatial Coordinates)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                سحب فوري بالإحداثيات دون قيود مسميات
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
              <span className="text-amber-400">مركز القطاع:</span>
              <span>[{currentSector.lat?.toFixed(4)}, {currentSector.lng?.toFixed(4)}]</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* 1. Latitude & Longitude */}
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                <Navigation className="w-3 h-3 text-indigo-400" />
                <span>إحداثيات المركز (Center)</span>
              </div>
              <div className="font-mono font-bold text-slate-200 text-[11px]">
                خط العرض: {currentSector.lat?.toFixed(4) || '29.9800'}
                <br />
                خط الطول: {currentSector.lng?.toFixed(4) || '31.1150'}
              </div>
            </div>

            {/* 2. Bounding Box Viewport */}
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>مستطيل القطاع (Bounding Box)</span>
              </div>
              <div className="font-mono text-[10px] text-slate-300">
                N: {currentSector.northLat?.toFixed(4)} | S: {currentSector.southLat?.toFixed(4)}
                <br />
                E: {currentSector.eastLng?.toFixed(4)} | W: {currentSector.westLng?.toFixed(4)}
              </div>
            </div>

            {/* 3. Scan Radius Slider */}
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 font-bold flex items-center justify-between">
                <span>نصف قطر بؤرة المسح:</span>
                <span className="text-amber-400 font-mono font-bold">{customScanRadius} متر</span>
              </div>
              <input
                type="range"
                min={200}
                max={1000}
                step={50}
                value={customScanRadius}
                onChange={(e) => setCustomScanRadius(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>200م (شوارع ضيقة)</span>
                <span>1000م (قطاع كامل)</span>
              </div>
            </div>

            {/* 4. Instant Spatial Sweep Trigger */}
            <div className="flex items-center">
              <button
                type="button"
                disabled={isScanning}
                onClick={onExecuteScan}
                className="w-full h-full min-h-[44px] bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600 hover:from-indigo-600 hover:to-blue-600 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ الاستكشاف والمسح الجغرافي...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span>بدء الاستكشاف والرصد المكاني (مجاني 100%)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Sub-row: Memory Dedup & Deep Stratum Scan Controls */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Option 1: Auto-exclude previous scans */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-bold text-slate-300 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={autoExcludePreviousScans}
                  onChange={(e) => setAutoExcludePreviousScans(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded-sm cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>حظر تكرار المنشآت المسحوبة سابقاً (توفير الرصيد 100%)</span>
                </span>
              </label>

              {/* Option 2: Deep Stratum Scan */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-bold text-slate-300 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={enableDeepStratumScan}
                  onChange={(e) => setEnableDeepStratumScan(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded-sm cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>تمشيط طبقي مزدوج (شهرة + مسافة)</span>
                </span>
              </label>

              {/* Option 3: Dynamic Micro-Grid Matrix Density (3x3 vs 2x2) */}
              <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setGridDensity('deep');
                    setCustomScanRadius(200);
                  }}
                  className={`px-2 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                    gridDensity === 'deep'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="شبكة مجهرية 9 خلايا بنطاق 200م للغوص في الأزقة والشوارع الداخلية"
                >
                  🎯 أزقة وشوارع داخلية (3x3)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGridDensity('standard');
                    setCustomScanRadius(450);
                  }}
                  className={`px-2 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                    gridDensity === 'standard'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="شبكة قياسية 4 خلايا بنطاق 450م للمحاور الرئيسية"
                >
                  🌐 محاور عامة (2x2)
                </button>
              </div>
            </div>

            {/* Memory stats and reset button */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-[10.5px] font-mono text-slate-400">
                المسحوب والمحمي بالذاكرة: <strong className="text-amber-400">{seenHistoryCount}</strong> منشأة
              </span>
              {seenHistoryCount > 0 && (
                <button
                  type="button"
                  onClick={onClearHistoryCache}
                  className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  title="تصفير ذاكرة الاستبعاد وإعادة السحب من الصفر"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Chunk Progress Bar when Scanning */}
        {isScanning && scanChunkStatus && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 animate-pulse space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-amber-400">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span>{scanChunkStatus.stepText}</span>
              </span>
              <span>الجزء #{scanChunkStatus.chunkNumber}</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold text-slate-300">
              <span>إجمالي المفحوص: {scanChunkStatus.totalFoundSoFar}</span>
              <span className="text-emerald-400">منشآت فريدة جديدة: {scanChunkStatus.newFoundSoFar}</span>
              <span className="text-slate-400">مكرر تم حمايته: {scanChunkStatus.duplicatesSoFar}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
