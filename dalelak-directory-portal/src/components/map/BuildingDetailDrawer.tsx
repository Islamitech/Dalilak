import React, { useState } from 'react';
import { Building2, Navigation, MapPin, ExternalLink, X, Compass, Store, Radar, ChevronDown, ChevronUp } from 'lucide-react';
import { Business } from '../../types';
import { getHadayekZone, getRecommendedGateForZone } from '../../data/hadayekAtlasData';

export interface BuildingDetailData {
  buildingNumber: string;
  zoneLetter: string;
  lat: number;
  lng: number;
}

export interface BuildingDetailDrawerProps {
  building: BuildingDetailData | null;
  onClose: () => void;
  businesses?: Business[];
  onSelectBusiness?: (biz: Business) => void;
  onStartNavigation?: (target: { title: string; lat: number; lng: number; type: 'building' | 'business'; details?: string }) => void;
  onOpenRadar?: () => void;
}

export const BuildingDetailDrawer: React.FC<BuildingDetailDrawerProps> = ({
  building,
  onClose,
  businesses = [],
  onSelectBusiness,
  onStartNavigation,
  onOpenRadar,
}) => {
  const [isBusinessesOpen, setIsBusinessesOpen] = useState<boolean>(false);

  if (!building) return null;

  const zone = getHadayekZone(building.zoneLetter);
  const zoneName = zone ? zone.nameAr : `منطقة ${building.zoneLetter}`;
  const gateInfo = getRecommendedGateForZone(building.zoneLetter);

  // Find registered businesses at this building
  const matchingBusinesses = businesses.filter((b) => {
    const isZone = b.street?.includes(building.zoneLetter) || b.city?.includes(building.zoneLetter);
    const hasNum = b.street?.includes(building.buildingNumber) || b.landmark?.includes(building.buildingNumber) || b.nameAr?.includes(building.buildingNumber);
    return isZone && hasNum;
  });

  const handleStartNav = () => {
    if (onStartNavigation) {
      onStartNavigation({
        title: `عمارة ${building.buildingNumber} - ${zoneName}`,
        lat: building.lat,
        lng: building.lng,
        type: 'building',
        details: `أقرب بوابة: ${gateInfo.primaryGate.popularNameAr}`,
      });
    }
  };

  const handleOpenGoogleMaps = () => {
    const query = `عمارة ${building.buildingNumber} منطقة ${building.zoneLetter} حدائق الأهرام`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${building.lat},${building.lng}&query=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="absolute bottom-2.5 sm:bottom-4 left-2.5 sm:left-4 right-2.5 sm:right-4 max-w-2xl mx-auto bg-white border-2 border-slate-200/90 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-2xl z-[1100] flex flex-col gap-3 animate-fade-in-scale text-slate-900 select-none font-['Cairo',sans-serif]"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
            <Building2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                حدائق الأهرام
              </span>
              <span className="bg-blue-50 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-200">
                {zoneName}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              عمارة رقم {building.buildingNumber}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 text-xs font-black w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center cursor-pointer transition-colors shrink-0"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Gate & Landmark Info */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-slate-600 font-bold">
            أفضل مسار دخول: <strong className="text-slate-900">{gateInfo.primaryGate.nameAr}</strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          {gateInfo.primaryGate.accessRoadAr}
        </span>
      </div>

      {/* Associated Businesses Collapsible Dropdown (Hidden results by default) */}
      {matchingBusinesses.length > 0 && (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/70 transition-all">
          <button
            type="button"
            onClick={() => setIsBusinessesOpen(!isBusinessesOpen)}
            className="w-full p-2.5 flex items-center justify-between text-right hover:bg-slate-100/90 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 flex items-center justify-center shrink-0">
                <Store className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-slate-900">
                    الأنشطة والخدمات في نفس المبنى أو قربه
                  </span>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                    {matchingBusinesses.length} أنشطة
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                  اضغط {isBusinessesOpen ? 'لإخفاء القائمة' : 'لعرض الأنشطة والمحلات المسجلة هنا'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-600 font-bold text-[11px] shrink-0 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs mr-2">
              <span>{isBusinessesOpen ? 'إخفاء' : 'عرض'}</span>
              {isBusinessesOpen ? <ChevronUp className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
            </div>
          </button>

          {isBusinessesOpen && (
            <div className="p-2.5 pt-1 border-t border-slate-200/80 bg-white/60 max-h-36 overflow-y-auto space-y-1.5 scrollbar-thin animate-slide-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {matchingBusinesses.map((biz) => (
                  <button
                    key={biz.id}
                    type="button"
                    onClick={() => onSelectBusiness && onSelectBusiness(biz)}
                    className="w-full text-right p-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-colors flex items-center justify-between gap-1.5 cursor-pointer shadow-2xs group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-slate-900 truncate group-hover:text-emerald-800 transition-colors">
                        {biz.nameAr}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold truncate">
                        {biz.category}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 group-hover:text-emerald-700 font-bold shrink-0">
                      عرض ⬅️
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 📡 Proximity Radar Trigger Button */}
      {onOpenRadar && (
        <button
          type="button"
          onClick={onOpenRadar}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98"
        >
          <Radar className="w-4 h-4 text-slate-950 animate-pulse" />
          <span>📡 عرض رادار الخدمات المحيطة (أقرب 10 أنشطة لهذا المبنى)</span>
        </button>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs font-black">
        <button
          type="button"
          onClick={handleStartNav}
          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
        >
          <Navigation className="w-4 h-4" />
          <span>بدء التوجيه والملاحة</span>
        </button>

        <button
          type="button"
          onClick={handleOpenGoogleMaps}
          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200"
        >
          <ExternalLink className="w-4 h-4 text-slate-600" />
          <span>خرائط Google</span>
        </button>
      </div>
    </div>
  );
};
