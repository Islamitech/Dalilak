import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2, Store, X, Compass, Loader2 } from 'lucide-react';
import { Business } from '../../types';
import { searchInsideHadayekZone, ZoneScopedSearchResult } from '../../utils/hadayekBuildingSearch';
import { getHadayekZone, estimateBuildingCoordinates, searchBuildingCoordinatesExact } from '../../data/hadayekAtlasData';

export interface ZoneScopedSearchBarProps {
  selectedZone: string;
  businesses: Business[];
  selectedBuilding?: { buildingNumber: string; zoneLetter: string } | null;
  onSelectBuilding: (building: { buildingNumber: string; zoneLetter: string; lat: number; lng: number }) => void;
  onSelectBusiness: (biz: Business) => void;
  onClearBuilding?: () => void;
  onClearZone?: () => void;
}

export const ZoneScopedSearchBar: React.FC<ZoneScopedSearchBarProps> = ({
  selectedZone,
  businesses,
  selectedBuilding,
  onSelectBuilding,
  onSelectBusiness,
  onClearBuilding,
  onClearZone,
}) => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<ZoneScopedSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const zoneObj = getHadayekZone(selectedZone);
  const zoneName = zoneObj ? zoneObj.nameAr : `منطقة ${selectedZone}`;

  // Reset query and building selection when zone changes
  useEffect(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    if (onClearBuilding) onClearBuilding();
  }, [selectedZone]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search inside active zone
  useEffect(() => {
    if (!selectedZone || !query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchInsideHadayekZone(selectedZone, query, businesses);
        setResults(found);
        setIsOpen(true);
      } catch (err) {
        console.error('Zone search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, selectedZone, businesses]);

  const buildings = results.filter((r): r is Extract<ZoneScopedSearchResult, { type: 'building' }> => r.type === 'building');
  const matchingBusinesses = results.filter((r): r is Extract<ZoneScopedSearchResult, { type: 'business' }> => r.type === 'business');

  // Direct search handler (triggered by Enter key or Search button)
  const handleDirectSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // 1. If results already visible in dropdown
    if (buildings.length > 0) {
      const topBldg = buildings[0];
      onSelectBuilding({
        buildingNumber: topBldg.buildingNumber,
        zoneLetter: topBldg.zoneLetter,
        lat: topBldg.lat,
        lng: topBldg.lng,
      });
      setQuery(`عمارة ${topBldg.buildingNumber}`);
      setIsOpen(false);
      return;
    }

    if (matchingBusinesses.length > 0) {
      const topBiz = matchingBusinesses[0].business;
      onSelectBusiness(topBiz);
      setIsOpen(false);
      return;
    }

    // 2. Perform instant query or numeric resolution
    setIsLoading(true);
    try {
      const found = await searchInsideHadayekZone(selectedZone, trimmed, businesses);
      const foundBldgs = found.filter((r): r is Extract<ZoneScopedSearchResult, { type: 'building' }> => r.type === 'building');
      const foundBizs = found.filter((r): r is Extract<ZoneScopedSearchResult, { type: 'business' }> => r.type === 'business');

      if (foundBldgs.length > 0) {
        const topBldg = foundBldgs[0];
        onSelectBuilding({
          buildingNumber: topBldg.buildingNumber,
          zoneLetter: topBldg.zoneLetter,
          lat: topBldg.lat,
          lng: topBldg.lng,
        });
        setQuery(`عمارة ${topBldg.buildingNumber}`);
        setIsOpen(false);
        return;
      }

      if (foundBizs.length > 0) {
        onSelectBusiness(foundBizs[0].business);
        setIsOpen(false);
        return;
      }

      // 3. Fallback: If user entered numbers (e.g. "88"), resolve building directly
      const numMatch = trimmed.match(/\d+/);
      if (numMatch) {
        const bldgNum = numMatch[0];
        const exact = await searchBuildingCoordinatesExact(selectedZone, bldgNum);
        const coords = exact || estimateBuildingCoordinates(selectedZone, bldgNum);
        onSelectBuilding({
          buildingNumber: bldgNum,
          zoneLetter: selectedZone,
          lat: coords.lat,
          lng: coords.lng,
        });
        setQuery(`عمارة ${bldgNum}`);
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Direct search execution error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedZone || selectedZone === 'all') return null;

  return (
    <div
      ref={wrapperRef}
      className="relative w-full max-w-lg mx-auto select-none font-['Cairo',sans-serif]"
      dir="rtl"
    >
      <div className="relative flex items-center bg-white/95 backdrop-blur-md border-2 border-amber-400/80 rounded-2xl shadow-lg transition-all focus-within:ring-2 focus-within:ring-amber-500/30 p-1">
        <div className="pr-2.5 pl-1.5 flex items-center pointer-events-none text-amber-600">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleDirectSearch();
            }
          }}
          placeholder={`بحث في ${zoneName} (رقم عمارة أو نشاط)...`}
          className="w-full py-1.5 bg-transparent text-xs sm:text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              if (onClearBuilding) onClearBuilding();
            }}
            className="p-1.5 text-slate-400 hover:text-red-600 ml-1 rounded-full cursor-pointer transition-colors"
            title="مسح البحث وتصفير التحديد"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* 🔍 Direct Search Action Button */}
        <button
          type="button"
          onClick={handleDirectSearch}
          disabled={!query.trim() || isLoading}
          className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 shrink-0 ${
            query.trim()
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-amber-500/20'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
          }`}
          title="بحث فوري (Enter)"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
          )}
          <span>بحث</span>
        </button>

        <div className="pl-1.5 pr-2 border-r border-slate-200 shrink-0 mr-1">
          <span className="text-[10px] font-black bg-amber-50 text-amber-900 px-2 py-0.5 rounded-lg border border-amber-200">
            {zoneName}
          </span>
        </div>
      </div>

      {/* Active Building Chip / Dismiss Bar */}
      {selectedBuilding && (
        <div className="mt-1.5 flex items-center justify-between gap-2 px-3 py-1.5 bg-amber-500/15 border border-amber-400/60 rounded-xl text-amber-950 text-xs shadow-xs animate-slide-up">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-bold">المحدد:</span>
            <span className="font-black bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded text-[11px]">
              عمارة {selectedBuilding.buildingNumber}
            </span>
            <span className="text-[11px] text-amber-800">
              ({zoneName})
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onClearBuilding) onClearBuilding();
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="px-2 py-0.5 rounded-lg bg-white/90 hover:bg-red-50 hover:text-red-600 border border-amber-300 hover:border-red-300 text-slate-700 font-black text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
            title="إلغاء تحديد العمارة"
          >
            <X className="w-3 h-3" />
            <span>إلغاء التحديد</span>
          </button>
        </div>
      )}

      {/* Autocomplete Results Dropdown */}
      {isOpen && (buildings.length > 0 || matchingBusinesses.length > 0) && (
        <div className="absolute top-full mt-1.5 right-0 left-0 bg-white/98 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl z-[950] overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100 animate-slide-up">
          {/* Buildings Section */}
          {buildings.length > 0 && (
            <div className="p-1.5">
              <div className="text-[10px] font-black text-slate-400 px-2 py-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-amber-600" />
                <span>العمائر والمباني في {zoneName}:</span>
              </div>
              {buildings.map((b) => (
                <button
                  key={`bldg_${b.buildingNumber}`}
                  type="button"
                  onClick={() => {
                    onSelectBuilding({
                      buildingNumber: b.buildingNumber,
                      zoneLetter: b.zoneLetter,
                      lat: b.lat,
                      lng: b.lng,
                    });
                    setQuery(`عمارة ${b.buildingNumber}`);
                    setIsOpen(false);
                  }}
                  className="w-full text-right p-2 hover:bg-amber-50/70 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 font-black text-xs shrink-0">
                      🏢
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800">
                        عمارة رقم {b.buildingNumber}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        أقرب بوابة: {b.nearestGateName}
                      </div>
                    </div>
                  </div>
                  {b.associatedBusinessesCount ? (
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-200">
                      {b.associatedBusinessesCount} أنشطة
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}

          {/* Businesses Section */}
          {matchingBusinesses.length > 0 && (
            <div className="p-1.5">
              <div className="text-[10px] font-black text-slate-400 px-2 py-1 flex items-center gap-1">
                <Store className="w-3 h-3 text-emerald-600" />
                <span>الأنشطة والخدمات في {zoneName}:</span>
              </div>
              {matchingBusinesses.map(({ business: biz }) => (
                <button
                  key={`biz_${biz.id}`}
                  type="button"
                  onClick={() => {
                    onSelectBusiness(biz);
                    setIsOpen(false);
                  }}
                  className="w-full text-right p-2 hover:bg-emerald-50/70 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700 font-black text-xs shrink-0">
                      🏪
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-black text-slate-800 truncate">
                        {biz.nameAr}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium truncate">
                        {biz.category} • {biz.street}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md shrink-0">
                    عرض
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
