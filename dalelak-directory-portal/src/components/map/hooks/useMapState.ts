import { useState } from 'react';
import { Business } from '../../../types';
import { GOVERNORATE_COORDS } from '../constants/mapConstants';

export interface UseMapStateProps {
  initialShowBusinesses?: boolean;
  defaultExpanded?: boolean;
  initialSelectedZone?: string;
}

export const useMapState = ({
  initialShowBusinesses = false,
  defaultExpanded = false,
  initialSelectedZone = '',
}: UseMapStateProps = {}) => {
  const [showBusinesses, setShowBusinesses] = useState<boolean>(initialShowBusinesses);
  const [selectedZone, setSelectedZone] = useState<string>(initialSelectedZone);
  const [mapCategoryFilter, setMapCategoryFilter] = useState<string>('all');
  const [onlyVerifiedFilter, setOnlyVerifiedFilter] = useState<boolean>(false);
  const [isMapFilterOpen, setIsMapFilterOpen] = useState<boolean>(false);
  const [showGatesLayer, setShowGatesLayer] = useState<boolean>(false);
  const [showDistrictsOverlay, setShowDistrictsOverlay] = useState<boolean>(true);
  const [showTargetPin] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedGovFilter, setSelectedGovFilter] = useState<string>('حدائق الأهرام');
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [centerReticleActive, setCenterReticleActive] = useState<boolean>(false);
  const [isInHadayekScope, setIsInHadayekScope] = useState<boolean>(true);

  const handleGovChange = (
    govName: string,
    updateSelectedPosition: (lat: number, lng: number, flyTo?: boolean, customZoom?: number) => void
  ) => {
    setSelectedGovFilter(govName);
    if (govName !== 'all' && GOVERNORATE_COORDS[govName]) {
      const coords = GOVERNORATE_COORDS[govName];
      updateSelectedPosition(coords.lat, coords.lng, true, 14);
    }
  };

  const handleCopyCoords = (currentLat: number, currentLng: number) => {
    const coordsStr = `${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`;
    navigator.clipboard.writeText(coordsStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return {
    showBusinesses,
    setShowBusinesses,
    mapCategoryFilter,
    setMapCategoryFilter,
    onlyVerifiedFilter,
    setOnlyVerifiedFilter,
    isMapFilterOpen,
    setIsMapFilterOpen,
    showGatesLayer,
    setShowGatesLayer,
    showDistrictsOverlay,
    setShowDistrictsOverlay,
    showTargetPin,
    isExpanded,
    setIsExpanded,
    copied,
    selectedGovFilter,
    setSelectedGovFilter,
    selectedZone,
    setSelectedZone,
    selectedBiz,
    setSelectedBiz,
    centerReticleActive,
    setCenterReticleActive,
    isInHadayekScope,
    setIsInHadayekScope,
    handleGovChange,
    handleCopyCoords,
  };
};
