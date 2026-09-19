import React, { useState, useMemo } from 'react';
import { Business } from '../../types';
import { InteractiveMapTemp } from '../map_temp/InteractiveMapTemp';
import { MOCK_SANDBOX_BUSINESSES, MOCK_PRESETS } from '../map_temp/mockData';
import { HADAYEK_ZONES, getHadayekZone, estimateBuildingCoordinates } from '../../data/hadayekAtlasData';
import {
  Compass,
  Building2,
  HelpCircle,
  FlaskConical,
  RefreshCw,
  Layers,
  MapPin,
  X,
  ExternalLink,
  Info
} from 'lucide-react';

export interface MapSandboxViewProps {
  onNavigate?: (path: string) => void;
}

export const MapSandboxView: React.FC<MapSandboxViewProps> = ({ onNavigate }) => {
  // 1. Mock Data State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('full');
  const [selectedMapBiz, setSelectedMapBiz] = useState<Business | null>(null);

  // 2. Zone & Building Navigation Simulation
  const [activeZoneLetter, setActiveZoneLetter] = useState<string>('ج');
  const [activeBuildingNumber, setActiveBuildingNumber] = useState<string>('');

  // 3. Computed businesses from active preset
  const currentBusinesses = useMemo(() => {
    const preset = MOCK_PRESETS.find((p) => p.id === selectedPresetId);
    return preset ? preset.data : MOCK_SANDBOX_BUSINESSES;
  }, [selectedPresetId]);

  // 4. Target Building Simulation
  const targetBuilding = useMemo(() => {
    if (!activeZoneLetter || !activeBuildingNumber) return null;
    const zone = getHadayekZone(activeZoneLetter);
    if (!zone) return null;
    const coords = estimateBuildingCoordinates(zone.letterAr, activeBuildingNumber);
    return {
      zone,
      zoneLetter: zone.letterAr,
      buildingNumber: activeBuildingNumber,
      lat: coords.lat,
      lng: coords.lng,
      coords: { lat: coords.lat, lng: coords.lng },
    };
  }, [activeZoneLetter, activeBuildingNumber]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4 pb-20" dir="rtl">
      {/* 🧪 Sandbox Isolation Header Banner */}
      <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black shadow-inner">
              <FlaskConical className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white">
                  بيئة العمل المعزولة للخريطة (Map Temp Sandbox)
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  مجلد معزول: src/components/map_temp
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                هذه البيئة تعمل بنواة مستقلة 100% مع بيانات تجريبية وهمية (Mock Data) دون أي مساس بالمجلد الأصلي أو بقاعدة البيانات.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                العودة للرئيسية ↩
              </button>
            )}
          </div>
        </div>

        {/* Sandbox Controls Bar */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Preset Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              📦 باقة البيانات الوهمية (Mock Presets):
            </label>
            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              {MOCK_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Building Search Simulator */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              🏢 محاكاة رقم العمارة:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="مثال: 142"
                value={activeBuildingNumber}
                onChange={(e) => setActiveBuildingNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white font-bold rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-400"
              />
              {activeBuildingNumber && (
                <button
                  type="button"
                  onClick={() => setActiveBuildingNumber('')}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Direct Link Simulation Buttons */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">
              📍 محاكاة الرابط المباشر للأنشطة:
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedMapBiz(MOCK_SANDBOX_BUSINESSES[0])}
                className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-black cursor-pointer transition-colors"
              >
                كرم الشام (ب1)
              </button>
              <button
                type="button"
                onClick={() => setSelectedMapBiz(MOCK_SANDBOX_BUSINESSES[1])}
                className="px-2.5 py-1 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[10px] font-black cursor-pointer transition-colors"
              >
                العزبي (ج)
              </button>
              <button
                type="button"
                onClick={() => setSelectedMapBiz(MOCK_SANDBOX_BUSINESSES[5])}
                className="px-2.5 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[10px] font-black cursor-pointer transition-colors"
              >
                صيانة سيارات (ن)
              </button>
              {selectedMapBiz && (
                <button
                  type="button"
                  onClick={() => setSelectedMapBiz(null)}
                  className="px-2 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-black cursor-pointer"
                >
                  إلغاء النشاط ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🧭 Stable Zone Bar with Fixed Dimensions */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-md flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-black text-amber-400">انتقال سريع للمناطق:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveZoneLetter('')}
            className={`px-2.5 h-7 sm:h-8 rounded-xl text-xs font-black transition-colors cursor-pointer shrink-0 flex items-center justify-center border ${
              !activeZoneLetter
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
          >
            الكل
          </button>
          {HADAYEK_ZONES.map((z) => {
            const isSelected = activeZoneLetter === z.letterAr;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setActiveZoneLetter(isSelected ? '' : z.letterAr)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-black transition-colors cursor-pointer shrink-0 flex items-center justify-center border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
                title={`منطقة ${z.letterAr}`}
              >
                {z.letterAr}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🗺️ Main Map Sandbox Container */}
      <div className="relative rounded-3xl overflow-hidden border border-emerald-500/30 bg-slate-900 shadow-2xl">
        <InteractiveMapTemp
          businesses={currentBusinesses}
          mode="view"
          targetBuilding={targetBuilding}
          showHadayekGates={true}
          selectedZone={activeZoneLetter}
          onSelectZone={(z) => setActiveZoneLetter(z)}
          selectedBusiness={selectedMapBiz}
          onSelectBusiness={(biz) => setSelectedMapBiz(biz)}
          heightClass="h-[580px] sm:h-[680px]"
          defaultExpanded={false}
          onExploreDirectory={() => {}}
        />

        {/* Selected Business Floating Card Overlay */}
        {selectedMapBiz && (
          <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-[1000] animate-slide-up">
            <div className="bg-slate-950/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-4 shadow-2xl space-y-3 text-right text-white">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                    {selectedMapBiz.category}
                  </span>
                  <h4 className="font-black text-sm text-white mt-1 truncate">
                    {selectedMapBiz.nameAr}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {[selectedMapBiz.street, selectedMapBiz.city, selectedMapBiz.governorate].filter(Boolean).join('، ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMapBiz(null)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedMapBiz.description && (
                <p className="text-[11px] text-slate-300 line-clamp-2">
                  {selectedMapBiz.description}
                </p>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                <span>📞 {selectedMapBiz.phone}</span>
                <span>⏰ {selectedMapBiz.workingHours}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
