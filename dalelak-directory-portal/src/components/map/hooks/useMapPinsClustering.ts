import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Business } from '../../../types';
import { HADAYEK_OFFICIAL_DISTRICTS, HADAYEK_OFFICIAL_GATES } from '../../../data/hadayekDistrictsGeoData';
import {
  createLightweightBadgeHtml,
  createExpandedActivityCardHtml,
  createCompactActivityPinHtml,
  createDistrictClusterHtml,
  createBuildingBadgeHtml,
  createNavigationPinHtml,
  attachCardDomListeners,
} from '../badgeMarkers';
import { isBusinessInHadayekZone, filterBusinessesForMap } from '../../../utils/hadayekZoneHelper';
import { matchesCategoryFilter } from '../../../utils/categoryMatcher';
import {
  disperseCoincidentPins,
  disperseActivityCardsScreenSpace,
  getResponsiveCardLimit,
} from '../utils/pinDispersal';
import { planCameraTransitionOnZoneChange } from '../utils/cameraPlanner';
import { computeMarkerIconKey } from '../utils/markerReconciliation';
import { useMapInstance } from './useMapInstance';
import { useMapState } from './useMapState';

export interface UseMapPinsClusteringProps {
  mapInstance: ReturnType<typeof useMapInstance>;
  state: ReturnType<typeof useMapState>;
  mode?: 'picker' | 'view';
  businesses: Business[];
  showHadayekGates?: boolean;
  selectedZone?: string;
  categoryFilter?: string;
  targetBuilding?: {
    zoneLetter?: string;
    buildingNumber?: string;
    lat?: number;
    lng?: number;
  } | null;
  onSelectBusiness?: (biz: Business) => void;
  onSelectZone?: (zoneLetter: string) => void;
  onSelectBuilding?: (building: { buildingNumber: string; zoneLetter: string; lat: number; lng: number }) => void;
  activeRoute?: {
    origin: { lat: number; lng: number; label: string };
    destination: { lat: number; lng: number; label: string };
    points?: [number, number][];
    distanceMeters?: number;
    durationSeconds?: number;
  } | null;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const useMapPinsClustering = ({
  mapInstance,
  state,
  mode = 'view',
  businesses,
  showHadayekGates = true,
  selectedZone: selectedZoneProp,
  categoryFilter: categoryFilterProp,
  targetBuilding,
  onSelectBusiness,
  onSelectZone,
  onSelectBuilding,
  activeRoute,
}: UseMapPinsClusteringProps) => {
  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({});
  const {
    leafletMapRef,
    isMapReady,
    markersGroupRef,
    pickerMarkerRef,
    accuracyCircleRef,
    currentLat,
    currentLng,
    zoomLevel,
    gpsAccuracy,
    updateSelectedPosition,
  } = mapInstance;

  const {
    showBusinesses,
    selectedGovFilter,
    selectedZone: stateZone,
    mapCategoryFilter: stateCategory,
    onlyVerifiedFilter,
    selectedBiz,
    setSelectedBiz,
    showDistrictsOverlay,
    showGatesLayer,
    showTargetPin,
    isInHadayekScope,
  } = state;

  // Single Source of Truth for zone and category
  const effectiveSelectedZone =
    selectedZoneProp !== undefined
      ? selectedZoneProp === 'all'
        ? ''
        : selectedZoneProp
      : stateZone === 'all'
      ? ''
      : stateZone;

  const effectiveCategoryFilter =
    categoryFilterProp !== undefined ? categoryFilterProp : stateCategory;

  const districtPolygonsRef = useRef<Array<{ letterAr: string; polygon: any; color: string }>>([]);
  const districtMarkersRef = useRef<{ [letterAr: string]: any }>({});
  const maskPolygonRef = useRef<any>(null);

  // Dedicated LayerGroups for strict rendering isolation
  const districtsLayerGroupRef = useRef<any>(null);
  const cardsLayerGroupRef = useRef<any>(null);
  const clusterLayerGroupRef = useRef<any>(null);
  const selectedLayerGroupRef = useRef<any>(null);
  const gatesLayerGroupRef = useRef<any>(null);
  const targetLayerGroupRef = useRef<any>(null);
  const routeLayerGroupRef = useRef<any>(null);

  // Stable persistent Marker Registry for reconciliation (businessId -> marker data)
  const markersRegistryRef = useRef<Map<string, { marker: any; biz: Business; iconKey: string }>>(new Map());
  const selectedMarkerRef = useRef<any>(null);
  const clusterMarkerRef = useRef<any>(null);

  // Single Camera Movement Coordinator state
  const cameraTransitionTokenRef = useRef<number>(0);
  const previousSelectedZoneRef = useRef<string>(effectiveSelectedZone);
  const lastFlownTargetRef = useRef<string | null>(null);
  const lastSelectedBizIdRef = useRef<string | null>(null);
  const preSelectedStateRef = useRef<{ center: [number, number]; zoom: number } | null>(null);

  const onSelectBusinessRef = useRef(onSelectBusiness);
  onSelectBusinessRef.current = onSelectBusiness;

  const onSelectZoneRef = useRef(onSelectZone);
  onSelectZoneRef.current = onSelectZone;

  const selectedBizRef = useRef(selectedBiz);
  selectedBizRef.current = selectedBiz;

  // Reset expanded clusters whenever zone or category changes
  useEffect(() => {
    setExpandedZones({});
  }, [effectiveSelectedZone, effectiveCategoryFilter]);

  // Handler to select district
  const handleSelectDistrict = useCallback((letter: string) => {
    state.setSelectedZone(letter);
    if (onSelectZoneRef.current) onSelectZoneRef.current(letter);
  }, [state]);

  // Global handler for popup action button
  useEffect(() => {
    (window as any).__selectHadayekDistrict = (letter: string) => {
      handleSelectDistrict(letter);
      state.setShowBusinesses(true);
    };
    return () => {
      delete (window as any).__selectHadayekDistrict;
    };
  }, [handleSelectDistrict, state]);

  // Cleanup selected business if it no longer matches the current zone or category filters
  useEffect(() => {
    if (!selectedBiz) return;
    const hasCategoryFilter = Boolean(effectiveCategoryFilter && effectiveCategoryFilter !== 'all' && effectiveCategoryFilter.trim() !== '');
    if (hasCategoryFilter) {
      if (!matchesCategoryFilter(selectedBiz, effectiveCategoryFilter)) {
        setSelectedBiz(null);
        return;
      }
    }
    const hasActiveZone = Boolean(effectiveSelectedZone && effectiveSelectedZone.trim() !== '');
    if (hasActiveZone && !isBusinessInHadayekZone(selectedBiz, effectiveSelectedZone)) {
      setSelectedBiz(null);
    }
  }, [effectiveSelectedZone, effectiveCategoryFilter, businesses, selectedBiz, setSelectedBiz]);

  // 1. 🛡️ Initialize Dedicated Leaflet Panes and LayerGroups ONCE on map ready
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L) return;

    // Ensure custom panes exist with clear z-index order
    if (!map.getPane('maskPane')) {
      const maskPane = map.createPane('maskPane');
      maskPane.style.zIndex = '350';
      maskPane.style.pointerEvents = 'none';
    }
    if (!map.getPane('districtsPane')) {
      const districtsPane = map.createPane('districtsPane');
      districtsPane.style.zIndex = '360';
    }
    if (!map.getPane('pinsPane')) {
      const pinsPane = map.createPane('pinsPane');
      pinsPane.style.zIndex = '600';
    }
    if (!map.getPane('selectedPinPane')) {
      const selectedPinPane = map.createPane('selectedPinPane');
      selectedPinPane.style.zIndex = '700';
    }

    if (!districtsLayerGroupRef.current || !map.hasLayer(districtsLayerGroupRef.current)) {
      if (districtsLayerGroupRef.current) {
        try { districtsLayerGroupRef.current.remove(); } catch {}
      }
      districtsLayerGroupRef.current = window.L.layerGroup([], { pane: 'districtsPane' }).addTo(map);
    }

    if (!cardsLayerGroupRef.current || !map.hasLayer(cardsLayerGroupRef.current)) {
      if (cardsLayerGroupRef.current) {
        try { cardsLayerGroupRef.current.remove(); } catch {}
      }
      cardsLayerGroupRef.current = window.L.layerGroup([], { pane: 'pinsPane' }).addTo(map);
    }

    if (!clusterLayerGroupRef.current || !map.hasLayer(clusterLayerGroupRef.current)) {
      if (clusterLayerGroupRef.current) {
        try { clusterLayerGroupRef.current.remove(); } catch {}
      }
      clusterLayerGroupRef.current = window.L.layerGroup([], { pane: 'pinsPane' }).addTo(map);
    }

    if (!selectedLayerGroupRef.current || !map.hasLayer(selectedLayerGroupRef.current)) {
      if (selectedLayerGroupRef.current) {
        try { selectedLayerGroupRef.current.remove(); } catch {}
      }
      selectedLayerGroupRef.current = window.L.layerGroup([], { pane: 'selectedPinPane' }).addTo(map);
    }

    if (!gatesLayerGroupRef.current || !map.hasLayer(gatesLayerGroupRef.current)) {
      if (gatesLayerGroupRef.current) {
        try { gatesLayerGroupRef.current.remove(); } catch {}
      }
      gatesLayerGroupRef.current = window.L.layerGroup([], { pane: 'districtsPane' }).addTo(map);
    }

    if (!targetLayerGroupRef.current || !map.hasLayer(targetLayerGroupRef.current)) {
      if (targetLayerGroupRef.current) {
        try { targetLayerGroupRef.current.remove(); } catch {}
      }
      targetLayerGroupRef.current = window.L.layerGroup([], { pane: 'selectedPinPane' }).addTo(map);
    }

    if (!routeLayerGroupRef.current || !map.hasLayer(routeLayerGroupRef.current)) {
      if (routeLayerGroupRef.current) {
        try { routeLayerGroupRef.current.remove(); } catch {}
      }
      routeLayerGroupRef.current = window.L.layerGroup([], { pane: 'districtsPane' }).addTo(map);
    }
  }, [isMapReady]);

  // 2. 🗺️ Create Hadayek Districts Layout, Polygons & Markers ONCE on map ready
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L || !districtsLayerGroupRef.current) return;

    const districtsLayer = districtsLayerGroupRef.current;
    districtsLayer.clearLayers();
    districtPolygonsRef.current = [];
    districtMarkersRef.current = {};

    // World envelope for inverted spotlight focus mask
    const worldRing: [number, number][] = [
      [35.0, 25.0],
      [35.0, 37.0],
      [25.0, 37.0],
      [25.0, 25.0],
    ];

    // Create persistent inverted mask polygon on maskPane (interactive: false)
    const mask = window.L.polygon([worldRing], {
      pane: 'maskPane',
      stroke: false,
      fillColor: '#090d16',
      fillOpacity: 0.0,
      fillRule: 'evenodd',
      interactive: false,
      className: 'hadayek-spotlight-focus-mask',
    });
    districtsLayer.addLayer(mask);
    maskPolygonRef.current = mask;

    // Create polygons and markers for all districts once
    HADAYEK_OFFICIAL_DISTRICTS.forEach((district) => {
      // Cadastral boundary polygons
      district.polygons.forEach((polyCoords) => {
        const polygon = window.L.polygon(polyCoords, {
          pane: 'districtsPane',
          color: district.color,
          weight: 2,
          opacity: 0.85,
          fillColor: district.color,
          fillOpacity: 0.07,
          className: 'hadayek-district-polygon',
        });

        polygon.on('click', () => {
          handleSelectDistrict(district.letterAr);
        });

        districtsLayer.addLayer(polygon);
        districtPolygonsRef.current.push({ letterAr: district.letterAr, polygon, color: district.color });
      });

      // Centroid marker with Arabic letter
      const badgeHtml = `
        <div class="hadayek-zone-letter-badge" style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid ${district.color};
          color: #0f172a;
          font-family: 'Cairo', system-ui, sans-serif;
          font-weight: 900;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
          cursor: pointer;
          user-select: none;
          line-height: 1;
        ">${district.letterAr}</div>
      `;

      const badgeIcon = window.L.divIcon({
        className: 'hadayek-zone-letter-marker',
        html: badgeHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = window.L.marker([district.centerLat, district.centerLng], {
        icon: badgeIcon,
        pane: 'districtsPane',
        zIndexOffset: 200,
      });

      marker.on('click', () => {
        handleSelectDistrict(district.letterAr);
      });

      districtsLayer.addLayer(marker);
      districtMarkersRef.current[district.letterAr] = marker;
    });

    return () => {
      districtsLayer.clearLayers();
      districtPolygonsRef.current = [];
      districtMarkersRef.current = {};
      maskPolygonRef.current = null;
    };
  }, [isMapReady, handleSelectDistrict]);

  // 2b. 🎨 Update District Styles & Spotlight Mask without recreating nodes + Single Camera Transition Owner
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L) return;

    const hasActiveZone = Boolean(effectiveSelectedZone && effectiveSelectedZone.trim() !== '');

    // 1. Update Inverted Spotlight Mask
    if (maskPolygonRef.current) {
      if (hasActiveZone) {
        const activeDistrict = HADAYEK_OFFICIAL_DISTRICTS.find((d) => d.letterAr === effectiveSelectedZone);
        if (activeDistrict && activeDistrict.polygons && activeDistrict.polygons.length > 0) {
          const worldRing: [number, number][] = [
            [35.0, 25.0],
            [35.0, 37.0],
            [25.0, 37.0],
            [25.0, 25.0],
          ];
          maskPolygonRef.current.setLatLngs([worldRing, ...activeDistrict.polygons]);
          maskPolygonRef.current.setStyle({ fillOpacity: 0.52 });
        } else {
          maskPolygonRef.current.setStyle({ fillOpacity: 0.0 });
        }
      } else {
        maskPolygonRef.current.setStyle({ fillOpacity: 0.0 });
      }
    }

    // 2. Update styles for each district polygon
    districtPolygonsRef.current.forEach(({ letterAr, polygon, color }) => {
      const isSelected = hasActiveZone && letterAr === effectiveSelectedZone;
      if (isSelected) {
        polygon.setStyle({
          color: '#f59e0b',
          weight: 3.5,
          opacity: 1.0,
          fillColor: '#ffffff',
          fillOpacity: 0.0,
          className: 'selected-district-polygon-focus',
        });
      } else {
        polygon.setStyle({
          color,
          weight: hasActiveZone ? 1 : 2,
          opacity: hasActiveZone ? 0.35 : 0.85,
          fillColor: color,
          fillOpacity: hasActiveZone ? 0.02 : 0.07,
          className: 'hadayek-district-polygon',
        });
      }
    });

    // 3. Update centroid marker icons & zIndex
    HADAYEK_OFFICIAL_DISTRICTS.forEach((district) => {
      const marker = districtMarkersRef.current[district.letterAr];
      if (!marker) return;

      const isSelected = hasActiveZone && district.letterAr === effectiveSelectedZone;
      const badgeHtml = `
        <div class="hadayek-zone-letter-badge" style="
          width: ${isSelected ? '28px' : '24px'};
          height: ${isSelected ? '28px' : '24px'};
          border-radius: 50%;
          background: ${isSelected ? district.color : '#ffffff'};
          border: 2px solid ${isSelected ? '#fef08a' : district.color};
          color: ${isSelected ? '#ffffff' : '#0f172a'};
          font-family: 'Cairo', system-ui, sans-serif;
          font-weight: 900;
          font-size: ${isSelected ? '14px' : '12px'};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: ${isSelected ? '0 0 14px rgba(0, 0, 0, 0.45), 0 3px 8px rgba(0, 0, 0, 0.3)' : '0 2px 5px rgba(0, 0, 0, 0.25)'};
          opacity: ${hasActiveZone && !isSelected ? 0.5 : 1.0};
          cursor: pointer;
          user-select: none;
          line-height: 1;
        ">${district.letterAr}</div>
      `;

      const badgeSize = isSelected ? [28, 28] : [24, 24];
      const badgeAnchor = isSelected ? [14, 14] : [12, 12];

      const badgeIcon = window.L.divIcon({
        className: 'hadayek-zone-letter-marker',
        html: badgeHtml,
        iconSize: badgeSize,
        iconAnchor: badgeAnchor,
      });

      marker.setIcon(badgeIcon);
      marker.setZIndexOffset(isSelected ? 400 : 200);
    });

    // 4. 🚀 Single Owner Camera Transition for District Selection/Clearing
    const decision = planCameraTransitionOnZoneChange(
      previousSelectedZoneRef.current,
      effectiveSelectedZone,
      HADAYEK_OFFICIAL_DISTRICTS
    );

    if (decision.shouldMove) {
      previousSelectedZoneRef.current = effectiveSelectedZone;
      cameraTransitionTokenRef.current++;

      if (decision.type === 'zone' && decision.targetBounds) {
        try {
          map.stop();
          const bounds = window.L.latLngBounds(decision.targetBounds);
          map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 16.5, duration: 0.6 });
        } catch {}
      } else if (decision.type === 'overview' && decision.targetCenter) {
        try {
          map.stop();
          map.flyTo(decision.targetCenter, decision.targetZoom || 14, { duration: 0.6 });
        } catch {}
      }
    }
  }, [effectiveSelectedZone, isMapReady]);

  // 2c. 🖱️ Map Background Click Deselects Active Activity & Restores Top 3 Cards
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady) return;

    const handleMapClick = () => {
      if (mode !== 'view') return;
      if (selectedBizRef.current) {
        setSelectedBiz(null);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isMapReady, mode, setSelectedBiz]);

  // 2d. 📍 Selected Activity Camera Centering & Pre-State Restoration
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady) return;

    if (!selectedBiz) {
      lastSelectedBizIdRef.current = null;
      // If we previously saved map center and zoom before selecting the card, restore it!
      if (preSelectedStateRef.current) {
        try {
          cameraTransitionTokenRef.current++;
          map.stop();
          map.flyTo(
            preSelectedStateRef.current.center,
            preSelectedStateRef.current.zoom,
            { duration: 0.6 }
          );
        } catch {}
        preSelectedStateRef.current = null;
      }
      return;
    }

    if (lastSelectedBizIdRef.current === selectedBiz.id) return;
    lastSelectedBizIdRef.current = selectedBiz.id;

    // Save map center and zoom BEFORE centering on the selected business
    if (!preSelectedStateRef.current) {
      preSelectedStateRef.current = {
        center: [map.getCenter().lat, map.getCenter().lng],
        zoom: map.getZoom(),
      };
    }

    try {
      cameraTransitionTokenRef.current++;
      map.stop();
      map.flyTo([selectedBiz.lat, selectedBiz.lng], Math.max(map.getZoom(), 17), { duration: 0.7 });
    } catch {}
  }, [selectedBiz, isMapReady]);

  // 3. 🏢 Precision Target Building Pin
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L || !targetLayerGroupRef.current) return;

    const targetLayer = targetLayerGroupRef.current;
    targetLayer.clearLayers();

    if (!targetBuilding || !showTargetPin || typeof targetBuilding.lat !== 'number' || typeof targetBuilding.lng !== 'number') {
      lastFlownTargetRef.current = null;
      return;
    }

    const bldgNum = targetBuilding.buildingNumber || '1';
    const zoneLet = targetBuilding.zoneLetter || '';
    const bldgLabel = bldgNum ? `عمارة ${bldgNum}` : 'المبنى المحدد';

    const bldgHtml = `
      <div style="position: relative; width: 140px; height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; cursor: pointer; user-select: none; font-family: 'Cairo', sans-serif; pointer-events: auto;">
        <div style="background: rgba(15, 23, 42, 0.95); border: 2px solid #ef4444; border-radius: 9999px; padding: 3px 9px; display: flex; align-items: center; gap: 5px; box-shadow: 0 4px 14px rgba(0,0,0,0.5), 0 0 10px rgba(239,68,68,0.4); white-space: nowrap; margin-bottom: 2px;">
          <span style="font-size: 11px;">🏢</span>
          <span style="color: #ffffff; font-weight: 800; font-size: 11px;">${escapeHtml(bldgLabel)}</span>
          ${zoneLet ? `<span style="color: #cbd5e1; font-weight: 700; font-size: 9px; border-right: 1px solid #475569; padding-right: 4px; margin-right: 2px;">منطقة ${escapeHtml(zoneLet)}</span>` : ''}
        </div>
        <div style="width: 2px; height: 8px; background: #ef4444; box-shadow: 0 0 4px #ef4444;"></div>
        <div style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444; border: 2px solid #ffffff; box-shadow: 0 0 8px #ef4444, 0 0 0 2px rgba(239, 68, 68, 0.35); flex-shrink: 0;"></div>
      </div>
    `;

    const bldgIcon = window.L.divIcon({
      className: 'custom-precision-building-pin',
      html: bldgHtml,
      iconSize: [140, 50],
      iconAnchor: [70, 50],
    });

    const marker = window.L.marker([targetBuilding.lat, targetBuilding.lng], {
      icon: bldgIcon,
      pane: 'pinsPane',
      zIndexOffset: 2000,
    });

    marker.on('click', () => {
      if (onSelectBuilding) {
        onSelectBuilding({
          buildingNumber: bldgNum,
          zoneLetter: zoneLet,
          lat: targetBuilding.lat!,
          lng: targetBuilding.lng!,
        });
      }
    });

    targetLayer.addLayer(marker);

    const targetKey = `${zoneLet}_${bldgNum}_${targetBuilding.lat}_${targetBuilding.lng}`;
    if (lastFlownTargetRef.current !== targetKey) {
      lastFlownTargetRef.current = targetKey;
      try {
        map.stop();
        map.flyTo([targetBuilding.lat, targetBuilding.lng], Math.max(map.getZoom(), 17), { duration: 0.7 });
      } catch {}
    }
  }, [isMapReady, targetBuilding, showTargetPin, onSelectBuilding]);

  // 4. 🧭 In-App Route Polyline & Pins Effect
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L || !routeLayerGroupRef.current) return;

    const routeLayer = routeLayerGroupRef.current;
    routeLayer.clearLayers();

    if (!activeRoute || !activeRoute.origin || !activeRoute.destination) return;

    const { origin, destination } = activeRoute;

    const routePoints: [number, number][] =
      activeRoute.points && activeRoute.points.length > 1
        ? activeRoute.points
        : [
            [origin.lat, origin.lng],
            [destination.lat, destination.lng],
          ];

    const glowLine = window.L.polyline(routePoints, {
      color: '#f59e0b',
      weight: 8,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false,
    });
    routeLayer.addLayer(glowLine);

    const routeLine = window.L.polyline(routePoints, {
      color: '#d97706',
      weight: 4.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false,
    });
    routeLayer.addLayer(routeLine);

    const originPinData = createNavigationPinHtml('origin', origin.label);
    const originIcon = window.L.divIcon({
      className: 'route-origin-pin',
      html: originPinData.html,
      iconSize: originPinData.iconSize,
      iconAnchor: originPinData.iconAnchor,
    });
    const originMarker = window.L.marker([origin.lat, origin.lng], {
      icon: originIcon,
      pane: 'pinsPane',
      zIndexOffset: 1500,
    });
    routeLayer.addLayer(originMarker);

    const destPinData = createNavigationPinHtml('destination', destination.label);
    const destIcon = window.L.divIcon({
      className: 'route-dest-pin',
      html: destPinData.html,
      iconSize: destPinData.iconSize,
      iconAnchor: destPinData.iconAnchor,
    });
    const destMarker = window.L.marker([destination.lat, destination.lng], {
      icon: destIcon,
      pane: 'pinsPane',
      zIndexOffset: 1510,
    });
    routeLayer.addLayer(destMarker);

    try {
      const bounds = window.L.latLngBounds(routePoints);
      map.flyToBounds(bounds, { padding: [80, 80], maxZoom: 16.5, duration: 0.8 });
    } catch {}
  }, [isMapReady, activeRoute]);

  // 4b. 🚪 Hadayek Official Gates
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L || !gatesLayerGroupRef.current) return;

    const gatesLayer = gatesLayerGroupRef.current;
    gatesLayer.clearLayers();

    if (!showHadayekGates || !showGatesLayer) return;

    HADAYEK_OFFICIAL_GATES.forEach((gate) => {
      const gateHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; cursor: pointer; user-select: none;">
          <div style="background: #4f46e5; color: #ffffff; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; box-shadow: 0 1.5px 4px rgba(0,0,0,0.4); font-family: 'Arial', sans-serif;">${gate.number || '🚪'}</div>
          <div style="color: #312e81; font-family: 'Cairo', system-ui, sans-serif; font-weight: 800; font-size: 12px; text-shadow: -1.5px -1.5px 0 #ffffff, 1.5px -1.5px 0 #ffffff, -1.5px 1.5px 0 #ffffff, 1.5px 1.5px 0 #ffffff, 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap; letter-spacing: -0.2px;">${escapeHtml(gate.popularNameAr || gate.shortNameAr)}</div>
        </div>
      `;

      const gateIcon = window.L.divIcon({
        className: 'custom-gate-pin-native',
        html: gateHtml,
        iconSize: [100, 40],
        iconAnchor: [50, 10],
      });

      const gateMarker = window.L.marker([gate.lat, gate.lng], {
        icon: gateIcon,
        pane: 'pinsPane',
        zIndexOffset: 400,
      });
      gateMarker.bindPopup(`
        <div dir="rtl" style="font-family: 'Cairo', system-ui, sans-serif; text-align: right; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
            <span style="background: #4f46e5; color: #fff; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900;">${gate.number || '🚪'}</span>
            <b style="color: #1e1b4b; font-size: 13px;">${escapeHtml(gate.nameAr)}</b>
          </div>
          <p style="margin: 4px 0; font-size: 11px; color: #475569; line-height: 1.4;"><b>🛣️ الطريق:</b> ${escapeHtml(gate.accessRoadAr)}</p>
          <p style="margin: 4px 0; font-size: 11px; color: #047857; line-height: 1.4;"><b>🎯 تخدم مناطق:</b> ${escapeHtml(gate.servedZones.join('، '))}</p>
          <div style="margin-top: 8px;">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${gate.lat},${gate.lng}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; background: #4f46e5; color: #fff; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; text-decoration: none;">
              <span>📍 الاتجاهات عبر Google Maps</span>
            </a>
          </div>
        </div>
      `);
      gatesLayer.addLayer(gateMarker);
    });
  }, [showHadayekGates, showGatesLayer, isMapReady]);

  // 5. 📍 Picker Mode Pin
  useEffect(() => {
    if (mode !== 'picker') return;
    const map = leafletMapRef.current;
    const markersGroup = markersGroupRef.current;

    if (!map || !markersGroup || !isMapReady || !window.L) return;

    markersGroup.clearLayers();

    const pickerIcon = window.L.divIcon({
      className: 'custom-picker-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab; user-select: none;">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #020617; font-weight: 900; font-size: 11px; padding: 3px 10px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0,0,0,0.6); white-space: nowrap; border: 1.5px solid #fef08a; margin-bottom: 2px; display: inline-flex; align-items: center; gap: 4px; font-family: Cairo, sans-serif;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#020617" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
            <span>موقع المنشأة المحدد</span>
          </div>
          <div style="position: relative; width: 36px; height: 46px; display: flex; justify-content: center;">
            <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
              <path d="M18 0C8.05887 0 0 8.05887 0 18C0 30.5 18 46 18 46C18 46 36 30.5 36 18C36 8.05887 27.9411 0 18 0Z" fill="#F59E0B"/>
              <path d="M18 2C9.16344 2 2 9.16344 2 18C2 29.2 18 43.5 18 43.5C18 43.5 34 29.2 34 18C34 9.16344 26.8366 2 18 2Z" stroke="#FEF08A" stroke-width="1.5"/>
              <circle cx="18" cy="18" r="8" fill="#0F172A"/>
              <circle cx="18" cy="18" r="4" fill="#F59E0B"/>
              <circle cx="18" cy="18" r="1.5" fill="#FFFFFF"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 68],
      iconAnchor: [18, 68],
    });

    const marker = window.L.marker([currentLat, currentLng], {
      icon: pickerIcon,
      pane: 'pinsPane',
      draggable: true,
      autoPan: true,
    });

    marker.on('dragend', (e: any) => {
      const ll = e.target.getLatLng();
      updateSelectedPosition(ll.lat, ll.lng, false);
    });

    markersGroup.addLayer(marker);
    pickerMarkerRef.current = marker;

    if (gpsAccuracy && gpsAccuracy < 500) {
      if (accuracyCircleRef.current) {
        markersGroup.removeLayer(accuracyCircleRef.current);
      }
      const circle = window.L.circle([currentLat, currentLng], {
        radius: gpsAccuracy,
        color: '#38bdf8',
        fillColor: '#38bdf8',
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '4, 4',
      });
      markersGroup.addLayer(circle);
      accuracyCircleRef.current = circle;
    }
  }, [mode, isMapReady, currentLat, currentLng, gpsAccuracy, updateSelectedPosition]);

  // 6. 📍 View Mode: Render Businesses with Smart Reconciliation & Screen-Space Dispersal
  const visibleBusinesses = useMemo(() => {
    if (mode !== 'view') return [];
    const hasCategory = Boolean(effectiveCategoryFilter && effectiveCategoryFilter !== 'all' && effectiveCategoryFilter.trim() !== '');
    if (!hasCategory) return [];

    return filterBusinessesForMap(
      businesses,
      effectiveSelectedZone || 'all',
      effectiveCategoryFilter,
      onlyVerifiedFilter
    );
  }, [mode, businesses, effectiveSelectedZone, effectiveCategoryFilter, onlyVerifiedFilter]);

  const sortedBusinesses = useMemo(() => {
    return [...visibleBusinesses].sort((a, b) => {
      const scoreA =
        (a.verificationStatus === 'verified' ? 100 : 0) +
        ((a.googleRating || a.rating || 0) * 10) +
        (a.isFeatured ? 50 : 0) +
        (a.videoUrl ? 15 : 0) +
        ((a.photos?.length || 0) * 2);
      const scoreB =
        (b.verificationStatus === 'verified' ? 100 : 0) +
        ((b.googleRating || b.rating || 0) * 10) +
        (b.isFeatured ? 50 : 0) +
        (b.videoUrl ? 15 : 0) +
        ((b.photos?.length || 0) * 2);
      if (scoreB !== scoreA) return scoreB - scoreA;

      const reviewsA = a.googleReviewsCount || 0;
      const reviewsB = b.googleReviewsCount || 0;
      if (reviewsB !== reviewsA) return reviewsB - reviewsA;

      const dateA = a.createdDate || '';
      const dateB = b.createdDate || '';
      if (dateB !== dateA) return dateB.localeCompare(dateA);

      // 🛡️ Deterministic tie-breaker: guarantees 100% stable ranking across renders
      return a.id.localeCompare(b.id);
    });
  }, [visibleBusinesses]);

  // Main Reconciliation Effect
  useEffect(() => {
    if (mode !== 'view') return;
    const map = leafletMapRef.current;
    if (!map || !isMapReady || !window.L) return;

    const cardsLayer = cardsLayerGroupRef.current;
    const clusterLayer = clusterLayerGroupRef.current;
    const selectedLayer = selectedLayerGroupRef.current;
    if (!cardsLayer || !clusterLayer || !selectedLayer) return;

    // Rule 1: Activities MUST ONLY appear if an activity type/category is selected from filters!
    const hasCategoryFilter = Boolean(effectiveCategoryFilter && effectiveCategoryFilter !== 'all' && effectiveCategoryFilter.trim() !== '');
    if (!hasCategoryFilter) {
      cardsLayer.clearLayers();
      clusterLayer.clearLayers();
      selectedLayer.clearLayers();
      markersRegistryRef.current.clear();
      selectedMarkerRef.current = null;
      clusterMarkerRef.current = null;
      return;
    }

    // 🎯 CASE A: An Activity IS Selected -> Render ONLY the Expanded Details Card
    if (selectedBiz) {
      cardsLayer.clearLayers();
      clusterLayer.clearLayers();
      markersRegistryRef.current.clear();
      clusterMarkerRef.current = null;

      const cardData = createExpandedActivityCardHtml(selectedBiz);
      const bizIcon = window.L.divIcon({
        className: 'custom-biz-pin selected-expanded-card animate-scale-in',
        html: cardData.html,
        iconSize: cardData.iconSize,
        iconAnchor: cardData.iconAnchor,
      });

      if (selectedMarkerRef.current && selectedLayer.hasLayer(selectedMarkerRef.current)) {
        selectedMarkerRef.current.setLatLng([selectedBiz.lat, selectedBiz.lng]);
        selectedMarkerRef.current.setIcon(bizIcon);
        attachCardDomListeners(selectedMarkerRef.current, cardData.fallbackCover, () => setSelectedBiz(null));
      } else {
        selectedLayer.clearLayers();
        const marker = window.L.marker([selectedBiz.lat, selectedBiz.lng], {
          icon: bizIcon,
          pane: 'selectedPinPane',
          zIndexOffset: 1200,
        });
        marker.on('click', () => {
          if (onSelectBusinessRef.current) onSelectBusinessRef.current(selectedBiz);
        });
        selectedLayer.addLayer(marker);
        attachCardDomListeners(marker, cardData.fallbackCover, () => setSelectedBiz(null));
        selectedMarkerRef.current = marker;
      }
      return;
    }

    // 🎯 CASE B: No Activity Selected -> Clear Selected Layer & Show Top Cards + Cluster
    if (selectedMarkerRef.current) {
      selectedLayer.clearLayers();
      selectedMarkerRef.current = null;
    }

    const activeZoneKey = effectiveSelectedZone || 'all';
    const isExpanded = Boolean(expandedZones[activeZoneKey]);

    if (isExpanded) {
      // Cluster opened: burst open all businesses into compact activity pins
      clusterLayer.clearLayers();
      clusterMarkerRef.current = null;

      const dispersed = disperseCoincidentPins(sortedBusinesses, null, 8, { cardMode: false });
      const currentIds = new Set(dispersed.map((d) => d.biz.id));

      // Remove stale markers
      markersRegistryRef.current.forEach((entry, id) => {
        if (!currentIds.has(id)) {
          try { cardsLayer.removeLayer(entry.marker); } catch {}
          markersRegistryRef.current.delete(id);
        }
      });

      dispersed.forEach(({ biz, pixelOffset }, idx) => {
        const isTop = idx < 3;
        const pinData = createCompactActivityPinHtml(
          biz,
          false,
          isTop,
          isTop ? idx + 1 : undefined,
          pixelOffset
        );
        const iconKey = computeMarkerIconKey(biz, idx, pixelOffset, 'compact');
        const pinIcon = window.L.divIcon({
          className: 'custom-biz-pin burst-compact-pin animate-scale-in',
          html: pinData.html,
          iconSize: pinData.iconSize,
          iconAnchor: pinData.iconAnchor,
        });

        const existing = markersRegistryRef.current.get(biz.id);
        if (existing) {
          existing.biz = biz;
          if (existing.iconKey !== iconKey) {
            existing.marker.setIcon(pinIcon);
            existing.iconKey = iconKey;
          }
        } else {
          const marker = window.L.marker([biz.lat, biz.lng], {
            icon: pinIcon,
            pane: 'pinsPane',
            zIndexOffset: 500 - idx * 2,
          });
          marker.on('click', () => {
            const currentBiz = markersRegistryRef.current.get(biz.id)?.biz || biz;
            setSelectedBiz(currentBiz);
            if (onSelectBusinessRef.current) onSelectBusinessRef.current(currentBiz);
          });
          cardsLayer.addLayer(marker);
          markersRegistryRef.current.set(biz.id, { marker, biz, iconKey });
        }
      });
    } else {
      // Responsive Card Limit: Desktop (>=768px): 3 cards; Tablet (480-767px): 2 cards; Mobile (<480px): 1 card
      const containerWidth = map.getSize()?.x || 800;
      const cardLimit = getResponsiveCardLimit(containerWidth);
      const topCards = sortedBusinesses.slice(0, cardLimit);
      const remaining = sortedBusinesses.slice(cardLimit);

      const offsets = disperseActivityCardsScreenSpace(topCards, map, {
        cardWidth: 184,
        cardHeight: 143,
        minSpacing: 196,
      });

      const topIds = new Set(topCards.map((b) => b.id));

      // 1. Remove markers not in top cards
      markersRegistryRef.current.forEach((entry, id) => {
        if (!topIds.has(id)) {
          try { cardsLayer.removeLayer(entry.marker); } catch {}
          markersRegistryRef.current.delete(id);
        }
      });

      // 2. Add or update prominent cards
      topCards.forEach((biz, idx) => {
        const offset = offsets.get(biz.id) || [0, 0];
        const cardData = createLightweightBadgeHtml(biz, false, true, idx + 1, offset);
        const iconKey = computeMarkerIconKey(biz, idx, offset, 'card');

        const cardIcon = window.L.divIcon({
          className: 'custom-biz-pin top-prominent-card',
          html: cardData.html,
          iconSize: cardData.iconSize,
          iconAnchor: cardData.iconAnchor,
        });

        const existing = markersRegistryRef.current.get(biz.id);
        if (existing) {
          existing.biz = biz;
          if (existing.iconKey !== iconKey) {
            existing.marker.setIcon(cardIcon);
            existing.iconKey = iconKey;
            attachCardDomListeners(existing.marker, cardData.fallbackCover);
          }
        } else {
          const marker = window.L.marker([biz.lat, biz.lng], {
            icon: cardIcon,
            pane: 'pinsPane',
            zIndexOffset: 600 - idx * 10,
          });
          marker.on('click', () => {
            const currentBiz = markersRegistryRef.current.get(biz.id)?.biz || biz;
            setSelectedBiz(currentBiz);
            if (onSelectBusinessRef.current) onSelectBusinessRef.current(currentBiz);
          });
          cardsLayer.addLayer(marker);
          attachCardDomListeners(marker, cardData.fallbackCover);
          markersRegistryRef.current.set(biz.id, { marker, biz, iconKey });
        }
      });

      // 3. Cluster Marker for remaining items
      if (remaining.length > 0) {
        const centerLat = remaining.reduce((acc, b) => acc + b.lat, 0) / remaining.length;
        const centerLng = remaining.reduce((acc, b) => acc + b.lng, 0) / remaining.length;
        const clusterData = createDistrictClusterHtml(remaining.length, effectiveCategoryFilter);

        const clusterIcon = window.L.divIcon({
          className: 'custom-district-cluster-pin animate-bounce-subtle',
          html: clusterData.html,
          iconSize: clusterData.iconSize,
          iconAnchor: clusterData.iconAnchor,
        });

        if (clusterMarkerRef.current && clusterLayer.hasLayer(clusterMarkerRef.current)) {
          clusterMarkerRef.current.setLatLng([centerLat, centerLng]);
          clusterMarkerRef.current.setIcon(clusterIcon);
        } else {
          clusterLayer.clearLayers();
          const marker = window.L.marker([centerLat, centerLng], {
            icon: clusterIcon,
            pane: 'pinsPane',
            zIndexOffset: 700,
          });
          marker.on('click', () => {
            const validPts = remaining.map((b) => [b.lat, b.lng] as [number, number]);
            if (validPts.length > 0) {
              try {
                map.stop();
                const bounds = window.L.latLngBounds(validPts);
                map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 18, duration: 0.8 });
              } catch {}
            }
            setExpandedZones((prev) => ({ ...prev, [activeZoneKey]: true }));
          });
          clusterLayer.addLayer(marker);
          clusterMarkerRef.current = marker;
        }
      } else {
        clusterLayer.clearLayers();
        clusterMarkerRef.current = null;
      }
    }
  }, [
    mode,
    isMapReady,
    sortedBusinesses,
    effectiveSelectedZone,
    effectiveCategoryFilter,
    selectedBiz,
    expandedZones,
    setSelectedBiz,
  ]);

  // 7. 🔄 Recalculate Screen-Space Offsets on zoomend and moveend ONLY (preserving 60 FPS panning)
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !isMapReady || mode !== 'view') return;

    const handleMovementEnd = () => {
      if (selectedBizRef.current) return;
      const containerWidth = map.getSize()?.x || 800;
      const cardLimit = getResponsiveCardLimit(containerWidth);
      const topCards = sortedBusinesses.slice(0, cardLimit);
      if (topCards.length <= 1) return;

      const offsets = disperseActivityCardsScreenSpace(topCards, map, {
        cardWidth: 184,
        cardHeight: 143,
        minSpacing: 196,
      });

      topCards.forEach((biz, idx) => {
        const entry = markersRegistryRef.current.get(biz.id);
        if (!entry) return;

        const offset = offsets.get(biz.id) || [0, 0];
        const iconKey = computeMarkerIconKey(biz, idx, offset, 'card');

        if (entry.iconKey !== iconKey) {
          const cardData = createLightweightBadgeHtml(biz, false, true, idx + 1, offset);
          const newIcon = window.L.divIcon({
            className: 'custom-biz-pin top-prominent-card',
            html: cardData.html,
            iconSize: cardData.iconSize,
            iconAnchor: cardData.iconAnchor,
          });
          entry.marker.setIcon(newIcon);
          entry.iconKey = iconKey;
          attachCardDomListeners(entry.marker, cardData.fallbackCover);
        }
      });
    };

    map.on('moveend', handleMovementEnd);
    map.on('zoomend', handleMovementEnd);

    return () => {
      map.off('moveend', handleMovementEnd);
      map.off('zoomend', handleMovementEnd);
    };
  }, [isMapReady, mode, sortedBusinesses]);
};
