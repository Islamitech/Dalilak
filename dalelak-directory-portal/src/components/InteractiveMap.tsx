import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  InteractiveMapProps,
  MapTileLayerType,
  MAP_QUICK_CATEGORIES,
  useMapInstance,
  useMapPinsClustering,
  useMapGeolocation,
  useMapSearch,
  useMapState,
  MapHeaderBar,
  MapModernTopBar,
  MapSearchBox,
  MapFloatingControls,
  MapSelectedBusinessDrawer,
  BuildingDetailDrawer,
  ZoneScopedSearchBar,
  InAppNavigationDrawer,
  MapFooterBar,
} from './map';
import { filterBusinessesForMap } from '../utils/hadayekZoneHelper';

export type { InteractiveMapProps, MapTileLayerType };
export { MAP_QUICK_CATEGORIES };

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  mode = 'view',
  lat = 29.9683,
  lng = 31.1002,
  onLocationSelect,
  businesses = [],
  onSelectBusiness,
  onEditBusiness,
  heightClass = 'h-[380px]',
  targetBuilding = null,
  onSelectBuilding: externalOnSelectBuilding,
  showHadayekGates = true,
  selectedZone,
  onSelectZone,
  categoryFilter,
  onCategoryChange,
  initialShowBusinesses = false,
  onToggleBusinessesVisibility,
  defaultExpanded = false,
  onExploreDirectory,
  onOpenGatesGuide,
  quickCategories,
  activeRoute: externalActiveRoute,
  onUpdateRoute,
  onStartNavigation: externalOnStartNavigation,
  onClearBuilding,
  onOpenRadar,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const state = useMapState({ initialShowBusinesses, defaultExpanded, initialSelectedZone: selectedZone });

  const activeZone = selectedZone !== undefined ? selectedZone : state.selectedZone;
  const activeCategory = categoryFilter !== undefined ? categoryFilter : state.mapCategoryFilter;

  const matchingBusinessesCount = useMemo(() => {
    return filterBusinessesForMap(
      businesses,
      activeZone || 'all',
      activeCategory || 'all',
      state.onlyVerifiedFilter
    ).length;
  }, [businesses, activeZone, activeCategory, state.onlyVerifiedFilter]);

  // Local state for interactive building inspection
  const [selectedBuildingState, setSelectedBuildingState] = useState<{
    buildingNumber: string;
    zoneLetter: string;
    lat: number;
    lng: number;
  } | null>(null);

  // Sync selectedBuildingState with targetBuilding from props
  useEffect(() => {
    if (targetBuilding && targetBuilding.buildingNumber && targetBuilding.zoneLetter) {
      setSelectedBuildingState({
        buildingNumber: targetBuilding.buildingNumber,
        zoneLetter: targetBuilding.zoneLetter,
        lat: targetBuilding.lat || 0,
        lng: targetBuilding.lng || 0,
      });
    } else if (!targetBuilding) {
      setSelectedBuildingState(null);
    }
  }, [targetBuilding]);

  // Local state for in-app navigation target
  const [navigationTargetState, setNavigationTargetState] = useState<{
    title: string;
    lat: number;
    lng: number;
    type: 'building' | 'business';
    details?: string;
  } | null>(null);

  // Local route state
  const [localRoute, setLocalRoute] = useState<{
    origin: { lat: number; lng: number; label: string };
    destination: { lat: number; lng: number; label: string };
  } | null>(null);

  const activeRoute = externalActiveRoute !== undefined ? externalActiveRoute : localRoute;

  // Sync state if selectedZone prop changes from parent
  useEffect(() => {
    if (selectedZone !== undefined) {
      state.setSelectedZone(selectedZone);
    }
  }, [selectedZone]);

  // Sync state if categoryFilter prop changes from parent
  useEffect(() => {
    if (categoryFilter !== undefined) {
      state.setMapCategoryFilter(categoryFilter);
    }
  }, [categoryFilter]);

  const mapInstance = useMapInstance({
    containerRef,
    mode,
    lat,
    lng,
    zoomLevel: 14,
    isExpanded: state.isExpanded,
    onLocationSelect,
  });

  const effectiveTargetBuilding =
    targetBuilding ||
    (selectedBuildingState
      ? {
          zoneLetter: selectedBuildingState.zoneLetter,
          buildingNumber: selectedBuildingState.buildingNumber,
          lat: selectedBuildingState.lat,
          lng: selectedBuildingState.lng,
        }
      : null);

  useMapPinsClustering({
    mapInstance,
    state,
    mode,
    businesses,
    showHadayekGates,
    selectedZone: activeZone,
    categoryFilter: activeCategory,
    targetBuilding: effectiveTargetBuilding,
    onSelectBusiness: (biz) => {
      setSelectedBuildingState(null);
      state.setSelectedBiz(biz);
      if (onSelectBusiness) onSelectBusiness(biz);
    },
    onSelectZone,
    onSelectBuilding: (bldg) => {
      setSelectedBuildingState(bldg);
      state.setSelectedBiz(null);
      if (externalOnSelectBuilding) externalOnSelectBuilding(bldg);
    },
    activeRoute,
  });

  const geolocation = useMapGeolocation({
    updateSelectedPosition: mapInstance.updateSelectedPosition,
    setGpsAccuracy: mapInstance.setGpsAccuracy,
  });

  const search = useMapSearch({
    updateSelectedPosition: async (lat, lng, flyTo, zoom) => {
      await mapInstance.updateSelectedPosition(lat, lng, flyTo, zoom);
    },
  });

  useEffect(() => {
    if (mapInstance.isMapReady && mapInstance.leafletMapRef.current) {
      const timer = setTimeout(() => {
        mapInstance.leafletMapRef.current?.invalidateSize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mapInstance.isMapReady]);

  const filteredBusinessesCount = matchingBusinessesCount;

  const canvasWrapperClasses = 'relative w-full flex-1 h-full min-h-0 overflow-hidden z-0';

  const mapInnerContent = (
    <>
      {mode === 'picker' && (
        <>
          <MapHeaderBar
            mode={mode}
            filteredBusinessesCount={filteredBusinessesCount}
            tileLayer={mapInstance.tileLayer}
            switchTileLayer={mapInstance.switchTileLayer}
            state={state}
            businesses={businesses}
            onGovChange={(gov) => state.handleGovChange(gov, mapInstance.updateSelectedPosition)}
            isLocating={geolocation.isLocating}
            handleGetLocation={geolocation.handleGetLocation}
            showHadayekGates={showHadayekGates}
            onToggleBusinessesVisibility={onToggleBusinessesVisibility}
            onSelectZone={onSelectZone}
            onCategorySelect={onCategoryChange}
            mapInstance={mapInstance}
            onExploreDirectory={onExploreDirectory}
          />
          <MapSearchBox
            searchQuery={search.searchQuery}
            isSearching={search.isSearching}
            searchResults={search.searchResults}
            showSearchResults={search.showSearchResults}
            setShowSearchResults={search.setShowSearchResults}
            handleSearchChange={search.handleSearchChange}
            handleSelectSearchResult={search.handleSelectSearchResult}
            handleClearSearch={search.handleClearSearch}
          />
        </>
      )}

      <div className={canvasWrapperClasses}>
        <div ref={containerRef} className="w-full h-full cursor-crosshair leaflet-map-canvas touch-none" />

        {/* 🧭 Clean District & Activity Filter Bar (Shows only within Hadayek Al-Ahram area) */}
        {mode === 'view' && (Math.abs(lat - 29.9683) < 0.06 && Math.abs(lng - 31.1002) < 0.06) && (
          <MapModernTopBar
            selectedZone={activeZone}
            onSelectZone={(z) => {
              state.setSelectedZone(z);
              setSelectedBuildingState(null);
              setNavigationTargetState(null);
              setLocalRoute(null);
              if (onClearBuilding) onClearBuilding();
              if (onSelectZone) onSelectZone(z);
            }}
            categoryFilter={activeCategory}
            onCategoryChange={(cat) => {
              state.setMapCategoryFilter(cat);
              if (onCategoryChange) onCategoryChange(cat);
            }}
            quickCategories={quickCategories}
            filteredBusinessesCount={filteredBusinessesCount}
          />
        )}

        {/* ⚠️ Empty Category Notice Banner (Non-intrusive lightweight pill) */}
        {mode === 'view' && activeCategory && activeCategory !== 'all' && matchingBusinessesCount === 0 && (
          <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[850] pointer-events-none transition-all duration-300">
            <div className="bg-slate-900/90 backdrop-blur-md text-amber-300 border border-amber-500/40 rounded-full px-4 py-1.5 text-xs font-bold shadow-xl flex items-center gap-2 select-none">
              <span className="text-sm">🔍</span>
              <span>لا توجد أنشطة مسجلة في تصنيف &quot;{activeCategory}&quot; {activeZone && activeZone !== 'all' ? `بمنطقة ${activeZone}` : 'حالياً'}</span>
            </div>
          </div>
        )}

        {/* 🔍 In-Zone Scoped Search Bar (Displays when a zone is active) */}
        {mode === 'view' && activeZone && activeZone !== 'all' && !navigationTargetState && (
          <div className="absolute top-16 sm:top-20 right-3 left-3 sm:right-6 sm:left-6 z-[890] pointer-events-none flex justify-center">
            <div className="pointer-events-auto w-full max-w-md">
              <ZoneScopedSearchBar
                selectedZone={activeZone}
                businesses={businesses}
                selectedBuilding={selectedBuildingState}
                onSelectBuilding={(bldg) => {
                  setSelectedBuildingState(bldg);
                  state.setSelectedBiz(null);
                  if (externalOnSelectBuilding) externalOnSelectBuilding(bldg);
                }}
                onSelectBusiness={(biz) => {
                  state.setSelectedBiz(biz);
                  setSelectedBuildingState(null);
                  if (onSelectBusiness) onSelectBusiness(biz);
                }}
                onClearBuilding={() => {
                  setSelectedBuildingState(null);
                  if (onClearBuilding) onClearBuilding();
                }}
                onClearZone={() => {
                  state.setSelectedZone('');
                  setSelectedBuildingState(null);
                  if (onClearBuilding) onClearBuilding();
                  if (onSelectZone) onSelectZone('');
                }}
              />
            </div>
          </div>
        )}

        <MapFloatingControls
          mode={mode}
          centerReticleActive={state.centerReticleActive}
          setCenterReticleActive={state.setCenterReticleActive}
          handleZoomIn={mapInstance.handleZoomIn}
          handleZoomOut={mapInstance.handleZoomOut}
          handlePinCenterOfMap={mapInstance.handlePinCenterOfMap}
          handleResetPosition={mapInstance.handleResetPosition}
          handlePan={mapInstance.handlePan}
          tileLayer={mapInstance.tileLayer}
          switchTileLayer={mapInstance.switchTileLayer}
        />

        {/* 🏪 Selected Business Drawer */}
        {mode === 'view' && !navigationTargetState && !selectedBuildingState && (
          <MapSelectedBusinessDrawer
            selectedBiz={state.selectedBiz}
            setSelectedBiz={state.setSelectedBiz}
            onSelectBusiness={onSelectBusiness}
            onStartNavigation={(biz) => {
              const target = {
                title: biz.nameAr,
                lat: biz.lat,
                lng: biz.lng,
                type: 'business' as const,
                details: biz.category,
              };
              setNavigationTargetState(target);
              if (externalOnStartNavigation) externalOnStartNavigation(target);
            }}
          />
        )}

        {/* 🏢 Selected Building Detail Drawer */}
        {mode === 'view' && !navigationTargetState && selectedBuildingState && (
          <BuildingDetailDrawer
            building={selectedBuildingState}
            businesses={businesses}
            onClose={() => {
              setSelectedBuildingState(null);
              if (onClearBuilding) onClearBuilding();
            }}
            onSelectBusiness={(biz) => {
              state.setSelectedBiz(biz);
              setSelectedBuildingState(null);
              if (onSelectBusiness) onSelectBusiness(biz);
            }}
            onStartNavigation={(target) => {
              setNavigationTargetState(target);
              if (externalOnStartNavigation) externalOnStartNavigation(target);
            }}
            onOpenRadar={onOpenRadar}
          />
        )}

        {/* 🧭 Interactive In-App Navigation Drawer */}
        {mode === 'view' && navigationTargetState && (
          <InAppNavigationDrawer
            target={navigationTargetState}
            onClose={() => {
              setNavigationTargetState(null);
              setLocalRoute(null);
              if (onUpdateRoute) onUpdateRoute(null);
            }}
            onUpdateRoute={(route) => {
              setLocalRoute(route);
              if (onUpdateRoute) onUpdateRoute(route);
            }}
          />
        )}
      </div>
    </>
  );

  return (
    <div className="relative w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-100">
      {mapInnerContent}
    </div>
  );
};

