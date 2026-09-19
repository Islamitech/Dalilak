import React, { useState, useMemo } from 'react';
import {
  HADAYEK_ZONES,
  HadayekZone,
  getHadayekZone,
  getRecommendedGateForZone,
  estimateBuildingCoordinates,
} from '../../data/hadayekAtlasData';
import {
  Compass,
  MapPin,
  Navigation,
  Search,
  Building2,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export interface HadayekAtlasNavigatorProps {
  onSelectTarget: (target: {
    zone: HadayekZone;
    buildingNumber: string;
    coords: { lat: number; lng: number };
  }) => void;
  onOpenGatesGuide?: () => void;
  className?: string;
}

export const HadayekAtlasNavigator: React.FC<HadayekAtlasNavigatorProps> = ({
  onSelectTarget,
  onOpenGatesGuide,
  className = '',
}) => {
  // 1. Local State
  const [selectedZoneLetter, setSelectedZoneLetter] = useState<string>('ل');
  const [buildingInput, setBuildingInput] = useState<string>('');
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  // 2. Active Zone & Gate Inference
  const currentZone = useMemo(() => {
    return getHadayekZone(selectedZoneLetter) || HADAYEK_ZONES[0];
  }, [selectedZoneLetter]);

  const { primaryGate } = useMemo(() => {
    return getRecommendedGateForZone(selectedZoneLetter);
  }, [selectedZoneLetter]);

  // 3. Coordinate Estimation for the Building
  const estimatedCoords = useMemo(() => {
    return estimateBuildingCoordinates(selectedZoneLetter, buildingInput || '1');
  }, [selectedZoneLetter, buildingInput]);

  // Handle Search Submission
  const handleExecuteNavigation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsNavigating(true);

    onSelectTarget({
      zone: currentZone,
      buildingNumber: buildingInput.trim(),
      coords: { lat: estimatedCoords.lat, lng: estimatedCoords.lng },
    });

    setTimeout(() => {
      setIsNavigating(false);
    }, 400);
  };

  // Direct Google Maps Route
  const handleOpenGoogleMapsRoute = () => {
    const lat = estimatedCoords.lat;
    const lng = estimatedCoords.lng;
    const query = buildingInput.trim()
      ? `عمارة ${buildingInput.trim()} منطقة ${currentZone.letterAr} حدائق الأهرام`
      : `${currentZone.nameAr} حدائق الأهرام`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&query=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Quick Zone selector buttons
  const popularZoneLetters = ['ل', 'هـ', 'أ', 'ك', 'ح', 'و'];

  return (
    <div
      className={`bg-[var(--bg-card)]/90 backdrop-blur-xl border border-amber-500/25 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden transition-all ${className}`}
      dir="rtl"
    >
      {/* Decorative Brand Accent Gradient */}
      <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

      {/* Header: Identity & Gates Guide Link */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-xs">
            <Compass className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                أطلس حدائق الأهرام الذكي
              </h2>
              <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                محدد العمارات
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] font-medium mt-0.5">
              حدد أي عمارة بالحدائق وتعرّف فوراً على أقرب بوابة والخدمات المحيطة
            </p>
          </div>
        </div>

        {onOpenGatesGuide && (
          <button
            type="button"
            onClick={onOpenGatesGuide}
            className="hidden sm:flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-400 hover:text-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100/70 px-3 py-1.5 rounded-xl border border-amber-500/20 transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>دليل البوابات الأربع</span>
          </button>
        )}
      </div>

      {/* Form: Zone Selector + Building Number + Action Button */}
      <form onSubmit={handleExecuteNavigation} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
          {/* 1. Zone Selector */}
          <div className="sm:col-span-5 relative">
            <label className="block text-[11px] font-black text-[var(--text-secondary)] mb-1">
              اختر المنطقة
            </label>
            <div className="relative">
              <select
                value={selectedZoneLetter}
                onChange={(e) => setSelectedZoneLetter(e.target.value)}
                className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-[var(--border-color)] focus:border-amber-500 rounded-2xl px-4 py-2 text-sm font-black text-[var(--text-primary)] appearance-none cursor-pointer outline-none transition-all"
              >
                {HADAYEK_ZONES.map((zone) => (
                  <option key={zone.id} value={zone.letterAr}>
                    {zone.nameAr} ({zone.letterAr}) — {zone.famousLandmarksAr[0] || 'الحدائق'}
                  </option>
                ))}
              </select>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 2. Building Number Input */}
          <div className="sm:col-span-4 relative">
            <label className="block text-[11px] font-black text-[var(--text-secondary)] mb-1">
              رقم العمارة (اختياري)
            </label>
            <div className="relative">
              <input
                type="text"
                value={buildingInput}
                onChange={(e) => setBuildingInput(e.target.value)}
                placeholder="مثال: 240 أو 185"
                className="w-full h-12 bg-slate-50 dark:bg-slate-900 border border-[var(--border-color)] focus:border-amber-500 rounded-2xl px-4 py-2 text-sm font-black text-[var(--text-primary)] placeholder:text-slate-400 outline-none transition-all font-mono"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 3. Execute Navigation Button */}
          <div className="sm:col-span-3 flex items-end">
            <button
              type="submit"
              disabled={isNavigating}
              className="w-full h-12 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>{isNavigating ? 'جاري الرصد...' : 'انتقال ومسح المحيط'}</span>
            </button>
          </div>
        </div>

        {/* Popular Zone Chips for 1-Click Jumping */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[11px] font-bold text-[var(--text-secondary)] ml-1">
            مناطق شائعة:
          </span>
          {popularZoneLetters.map((letter) => {
            const isSelected = selectedZoneLetter === letter;
            return (
              <button
                key={letter}
                type="button"
                onClick={() => setSelectedZoneLetter(letter)}
                className={`text-[11px] font-black px-2.5 py-1 rounded-xl transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-transparent hover:border-slate-300'
                }`}
              >
                منطقة ({letter})
              </button>
            );
          })}
        </div>

        {/* 🚪 Smart Gate Recommendation & Route Banner */}
        <div className="mt-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <Navigation className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  🚪 البوابة الموصى بها للدخول:
                </span>
                <span className="text-xs font-black text-[var(--text-primary)]">
                  {primaryGate.nameAr} ({primaryGate.popularNameAr})
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                عبر {primaryGate.accessRoadAr} ⬅️ يخدم مباشرة {currentZone.nameAr} و {currentZone.mainStreetsAr[0]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleOpenGoogleMapsRoute}
              className="flex-1 sm:flex-none text-xs font-black bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>ملاحة Google</span>
            </button>

            {onOpenGatesGuide && (
              <button
                type="button"
                onClick={onOpenGatesGuide}
                className="sm:hidden text-xs font-black text-amber-700 bg-amber-100/80 px-3 py-2 rounded-xl"
              >
                البوابات
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
