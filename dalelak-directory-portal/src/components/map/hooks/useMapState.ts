import { useState } from 'react';
import { Business } from '../../../types';
import { GOVERNORATE_COORDS } from '../constants/mapConstants';

export interface UseMapStateProps {
  initialShowBusinesses?: boolean;
}

export const useMapState = ({ initialShowBusinesses = false }: UseMapStateProps = {}) => {
  const [showBusinesses, setShowBusinesses] = useState<boolean>(initialShowBusinesses);
  const [mapCategoryFilter, setMapCategoryFilter] = useState<string>('all');
  const [onlyVerifiedFilter, setOnlyVerifiedFilter] = useState<boolean>(false);
  const [isMapFilterOpen, setIsMapFilterOpen] = useState<boolean>(false);
  const [showGatesLayer, setShowGatesLayer] = useState<boolean>(true);
  const [showDistrictsOverlay, setShowDistrictsOverlay] = useState<boolean>(true);
  const [showTargetPin] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedGovFilter, setSelectedGovFilter] = useState<string>('all');
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [centerReticleActive, setCenterReticleActive] = useState<boolean>(false);

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
    selectedBiz,
    setSelectedBiz,
    centerReticleActive,
    setCenterReticleActive,
    handleGovChange,
    handleCopyCoords,
  };
};
