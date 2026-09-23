import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Radar } from 'lucide-react';
import { Business } from '../../types';
import { InteractiveMap, MAP_QUICK_CATEGORIES } from '../InteractiveMap';
import { getAvailableQuickCategoriesInZone } from '../../utils/hadayekZoneHelper';
import {
  HadayekZone,
  HADAYEK_ZONES,
  getHadayekZone,
  getRecommendedGateForZone,
  estimateBuildingCoordinates,
  searchBuildingCoordinatesExact,
} from '../../data/hadayekAtlasData';
import { ProximityRadarDrawer } from '../atlas/ProximityRadarDrawer';
import { HadayekGatesModal } from '../atlas/HadayekGatesModal';

export interface MapViewProps {
  businesses: Business[];
  filteredBusinesses: Business[];
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  selectedZone?: string;
  onZoneChange?: (zone: string) => void;
  sortBy: any;
  onSortChange: (s: any) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  userCoords: { lat: number; lng: number } | null;
  onNavigate: (path: string) => void;
  lat?: number;
  lng?: number;
}

export const MapView: React.FC<MapViewProps> = ({
  businesses,
  filteredBusinesses,
  categoryFilter,
  onCategoryChange,
  selectedZone,
  onZoneChange,
  sortBy,
  onSortChange,
  openNowOnly,
  onToggleOpenNow,
  onOpenBusiness,
  onToggleFavorite,
  favorites,
  userCoords,
  onNavigate,
  lat = 29.9683,
  lng = 31.1002,
}) => {
  const [isGatesModalOpen, setIsGatesModalOpen] = useState<boolean>(false);
  const [isRadarOpen, setIsRadarOpen] = useState<boolean>(false);

  // 1. Read URL params (?zone=...&bldg=...)
  const [activeZoneLetter, setActiveZoneLetter] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('zone') || '';
  });

  const [activeBuildingNumber, setActiveBuildingNumber] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('bldg') || '';
  });

  const [exactBuildingCoords, setExactBuildingCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Keep state synced if URL changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const z = params.get('zone') || '';
    const b = params.get('bldg') || '';
    if (z !== activeZoneLetter) setActiveZoneLetter(z);
    if (b !== activeBuildingNumber) setActiveBuildingNumber(b);
  }, []);

  // Whenever activeZoneLetter and activeBuildingNumber change, resolve exact cadastral coordinates
  useEffect(() => {
    if (!activeZoneLetter || !activeBuildingNumber) {
      setExactBuildingCoords(null);
      return;
    }

    let isMounted = true;
    searchBuildingCoordinatesExact(activeZoneLetter, activeBuildingNumber).then((coords) => {
      if (isMounted && coords) {
        setExactBuildingCoords(coords);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeZoneLetter, activeBuildingNumber]);

  // Sync state if selectedZone prop changes from parent
  useEffect(() => {
    if (selectedZone !== undefined) {
      const cleanZone = selectedZone === 'all' ? '' : selectedZone;
      if (cleanZone !== activeZoneLetter) {
        setActiveZoneLetter(cleanZone);
      }
    }
  }, [selectedZone]);

  // Compute zone-scoped available quick categories and activity counts
  const quickCategories = useMemo(() => {
    return getAvailableQuickCategoriesInZone(businesses, activeZoneLetter, MAP_QUICK_CATEGORIES);
  }, [businesses, activeZoneLetter]);

  const activeCategoryObj = useMemo(() => {
    if (!categoryFilter || categoryFilter === 'all') return null;
    return quickCategories.find((c) => c.id === categoryFilter) || {
      id: categoryFilter,
      name: categoryFilter,
      icon: '📍',
      count: 0,
    };
  }, [categoryFilter, quickCategories]);

  // 2. Compute Target Building / Zone (Only if an explicit building number is requested)
  const targetBuilding = useMemo(() => {
    if (!activeZoneLetter || !activeBuildingNumber) return null;
    const zone = getHadayekZone(activeZoneLetter);
    if (!zone) return null;
    const coords = exactBuildingCoords || estimateBuildingCoordinates(zone.letterAr, activeBuildingNumber);
    return {
      zone,
      zoneLetter: zone.letterAr,
      buildingNumber: activeBuildingNumber,
      lat: coords.lat,
      lng: coords.lng,
      coords: { lat: coords.lat, lng: coords.lng },
    };
  }, [activeZoneLetter, activeBuildingNumber, exactBuildingCoords]);

  // Recommended gate for current target
  const gateInfo = useMemo(() => {
    if (!activeZoneLetter) return null;
    return getRecommendedGateForZone(activeZoneLetter);
  }, [activeZoneLetter]);

  const handleSelectZoneJump = useCallback((zoneLetter: string) => {
    const nextZone = zoneLetter === 'all' || !zoneLetter ? '' : zoneLetter;
    setActiveZoneLetter(nextZone);
    setActiveBuildingNumber('');
    setExactBuildingCoords(null);
    setIsRadarOpen(false);
    if (onZoneChange) onZoneChange(nextZone || 'all');
    if (typeof window !== 'undefined') {
      const newUrl = new URL(window.location.href);
      if (nextZone) {
        newUrl.searchParams.set('zone', nextZone);
      } else {
        newUrl.searchParams.delete('zone');
      }
      newUrl.searchParams.delete('bldg');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [onZoneChange]);

  const handleClearTarget = useCallback(() => {
    setActiveZoneLetter('');
    setActiveBuildingNumber('');
    setExactBuildingCoords(null);
    setIsRadarOpen(false);
    if (onZoneChange) onZoneChange('all');
    if (typeof window !== 'undefined') {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('zone');
      newUrl.searchParams.delete('bldg');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [onZoneChange]);

  const handleClearBuilding = useCallback(() => {
    setActiveBuildingNumber('');
    setExactBuildingCoords(null);
    setIsRadarOpen(false);
    if (typeof window !== 'undefined') {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('bldg');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);

  return (
    <div className="relative w-full h-full flex-1 min-h-0 overflow-hidden flex flex-col bg-slate-100 select-none font-['Cairo',sans-serif]" dir="rtl">
      {/* 🗺️ Screen-Integrated Map Canvas */}
      <div className="relative w-full h-full flex-1 min-h-0 overflow-hidden z-0">
        <InteractiveMap
          businesses={businesses}
          mode="view"
          lat={lat}
          lng={lng}
          initialShowBusinesses={false}
          categoryFilter={categoryFilter}
          onCategoryChange={onCategoryChange}
          targetBuilding={targetBuilding}
          showHadayekGates={true}
          selectedZone={activeZoneLetter}
          onSelectZone={handleSelectZoneJump}
          onSelectBusiness={(biz) => {
            onOpenBusiness(biz);
          }}
          onSelectBuilding={(bldg) => {
            setActiveZoneLetter(bldg.zoneLetter);
            setActiveBuildingNumber(bldg.buildingNumber);
            if (typeof bldg.lat === 'number' && typeof bldg.lng === 'number' && bldg.lat !== 0) {
              setExactBuildingCoords({ lat: bldg.lat, lng: bldg.lng });
            }
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('zone', bldg.zoneLetter);
            newUrl.searchParams.set('bldg', bldg.buildingNumber);
            window.history.replaceState({}, '', newUrl.toString());
          }}
          onClearBuilding={handleClearBuilding}
          onOpenRadar={() => setIsRadarOpen(true)}
          heightClass="h-full"
          defaultExpanded={false}
          onExploreDirectory={() => onNavigate('/search')}
          onOpenGatesGuide={() => setIsGatesModalOpen(true)}
          quickCategories={quickCategories}
        />

        {/* 📡 Proximity Radar Floating Drawer */}
        {targetBuilding && isRadarOpen && (
          <ProximityRadarDrawer
            target={targetBuilding}
            businesses={businesses}
            onOpenBusiness={onOpenBusiness}
            onClose={() => setIsRadarOpen(false)}
          />
        )}
      </div>

      {/* Gates Modal */}
      <HadayekGatesModal
        isOpen={isGatesModalOpen}
        onClose={() => setIsGatesModalOpen(false)}
        onSelectZone={(z) => handleSelectZoneJump(z)}
      />
    </div>
  );
};
