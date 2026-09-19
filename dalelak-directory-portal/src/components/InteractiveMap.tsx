import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2 } from 'lucide-react';
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
  MapSearchBox,
  MapFloatingControls,
  MapSelectedBusinessDrawer,
  MapFooterBar,
} from './map';

export type { InteractiveMapProps, MapTileLayerType };
export { MAP_QUICK_CATEGORIES };

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  mode = 'view',
  lat = 29.968,
  lng = 31.098,
  onLocationSelect,
  businesses = [],
  onSelectBusiness,
  onEditBusiness,
  heightClass = 'h-[380px]',
  targetBuilding = null,
  showHadayekGates = true,
  onSelectZone,
  initialShowBusinesses = false,
  onToggleBusinessesVisibility,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const state = useMapState({ initialShowBusinesses });

  const mapInstance = useMapInstance({
    containerRef,
    mode,
    lat,
    lng,
    zoomLevel: 16,
    isExpanded: state.isExpanded,
    onLocationSelect,
  });

  useMapPinsClustering({
    mapInstance,
    state,
    mode,
    businesses,
    showHadayekGates,
    targetBuilding,
    onSelectBusiness,
    onSelectZone,
  });

  const geolocation = useMapGeolocation({
    updateSelectedPosition: mapInstance.updateSelectedPosition,
    setGpsAccuracy: mapInstance.setGpsAccuracy,
  });

  const search = useMapSearch({
    updateSelectedPosition: mapInstance.updateSelectedPosition,
  });

  const filteredBusinessesCount = businesses.filter(
    (b) => state.selectedGovFilter === 'all' || b.governorate.includes(state.selectedGovFilter)
  ).length;

  const canvasWrapperClasses = state.isExpanded
    ? 'relative w-full flex-1 h-full min-h-[480px] overflow-hidden min-h-0'
    : `relative w-full ${heightClass} overflow-hidden`;

  const mapInnerContent = (
    <>
      <MapHeaderBar
        mode={mode}
        filteredBusinessesCount={filteredBusinessesCount}
        tileLayer={mapInstance.tileLayer}
        switchTileLayer={mapInstance.switchTileLayer}
        state={state}
        onGovChange={(gov) => state.handleGovChange(gov, mapInstance.updateSelectedPosition)}
        isLocating={geolocation.isLocating}
        handleGetLocation={geolocation.handleGetLocation}
        showHadayekGates={showHadayekGates}
        onToggleBusinessesVisibility={onToggleBusinessesVisibility}
      />

      {mode === 'picker' && (
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
      )}

      <div className={canvasWrapperClasses}>
        <div ref={containerRef} className="w-full h-full cursor-crosshair leaflet-map-canvas" />

        <MapFloatingControls
          mode={mode}
          centerReticleActive={state.centerReticleActive}
          setCenterReticleActive={state.setCenterReticleActive}
          handleZoomIn={mapInstance.handleZoomIn}
          handleZoomOut={mapInstance.handleZoomOut}
          handlePinCenterOfMap={mapInstance.handlePinCenterOfMap}
          handleResetPosition={mapInstance.handleResetPosition}
          handlePan={mapInstance.handlePan}
        />

        {mode === 'view' && (
          <MapSelectedBusinessDrawer
            selectedBiz={state.selectedBiz}
            setSelectedBiz={state.setSelectedBiz}
            onSelectBusiness={onSelectBusiness}
          />
        )}
      </div>

      <MapFooterBar mapInstance={mapInstance} state={state} />
    </>
  );

  return (
    <>
      {/* Inline Placeholder when Expanded (maintains page flow & prevents layout jitter - commit 3471e21) */}
      {state.isExpanded && (
        <div
          className={`relative w-full ${heightClass} rounded-2xl border-2 border-dashed border-amber-500/35 bg-[var(--bg-card)]/40 flex flex-col items-center justify-center gap-2.5 text-slate-400 select-none transition-all duration-300`}
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shadow-inner">
            <Maximize2 className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-xs font-bold text-[var(--text-muted)]">
            الخريطة معروضة الآن في وضع ملء الشاشة الشامل
          </span>
          <button
            type="button"
            onClick={() => state.setIsExpanded(false)}
            className="mt-1 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 text-xs font-bold transition-all cursor-pointer"
          >
            إنهاء وضع التوسيع
          </button>
        </div>
      )}

      {/* Expanded Mode: True Viewport Portal into document.body */}
      {state.isExpanded ? (
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex flex-col font-['Cairo',sans-serif]">
            <div
              onClick={() => state.setIsExpanded(false)}
              className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99998]"
            />
            <div className="relative z-[99999] m-2 sm:m-4 flex-1 bg-[var(--bg-card)] border-2 border-amber-500/60 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-scale">
              {mapInnerContent}
            </div>
          </div>,
          document.body
        )
      ) : (
        <div className="relative bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl flex flex-col transition-colors duration-300">
          {mapInnerContent}
        </div>
      )}
    </>
  );
};
