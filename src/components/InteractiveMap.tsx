import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Business } from '../types';
import { fetchLocationAddress } from '../utils/geocoding';
import { getCategoryIcon } from '../utils/directoryEnhancements';
import { triggerHaptic } from '../utils/haptics';
import {
  MapTileLayerType,
  InteractiveMapProps,
  escapeHtml,
  GOVERNORATE_COORDS,
  getTileLayerConfig,
  MapHeaderBar,
  MapSearchBox,
  MapFloatingControls,
  MapSelectedBusinessDrawer,
  MapFooterBar,
} from './map';

export type { MapTileLayerType, InteractiveMapProps };

declare global {
  interface Window {
    L: any;
  }
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  mode = 'view',
  lat = 29.9753, // حدائق الأهرام
  lng = 31.1120, // حدائق الأهرام
  onLocationSelect,
  businesses = [],
  onSelectBusiness,
  onEditBusiness,
  heightClass = 'h-[380px]',
}) => {
  const [currentLat, setCurrentLat] = useState<number>(lat);
  const [currentLng, setCurrentLng] = useState<number>(lng);
  const [zoomLevel, setZoomLevel] = useState<number>(16);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [selectedGovFilter, setSelectedGovFilter] = useState<string>('all');
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);

  // High precision controls & Layer switcher (Default: Dalilak Clean Silent Base Map)
  const [tileLayer, setTileLayer] = useState<MapTileLayerType>('dalelak-clean');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [centerReticleActive, setCenterReticleActive] = useState<boolean>(false);

  // Mobile Touch Scroll Lock: on touch devices, dragging is disabled by default so single-finger touch scrolls the page
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const [isTouchDraggingEnabled, setIsTouchDraggingEnabled] = useState<boolean>(!isTouchDevice);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const pickerMarkerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);

  useEffect(() => {
    setCurrentLat(lat);
    setCurrentLng(lng);
  }, [lat, lng]);

  // Switch Tile Layer
  const switchTileLayer = (newType: MapTileLayerType) => {
    setTileLayer(newType);
    if (!leafletMapRef.current || !window.L) return;

    if (tileLayerRef.current) {
      leafletMapRef.current.removeLayer(tileLayerRef.current);
    }

    const cfg = getTileLayerConfig(newType);
    const newLayer = window.L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      subdomains: cfg.subdomains,
      attribution: cfg.attribution,
    });

    newLayer.addTo(leafletMapRef.current);
    tileLayerRef.current = newLayer;
  };

  // Move marker and trigger callback safely without shaking viewport
  const updateSelectedPosition = useCallback(
    async (newLat: number, newLng: number, flyTo: boolean = false, customZoom?: number) => {
      const precisionLat = Number(newLat.toFixed(6));
      const precisionLng = Number(newLng.toFixed(6));

      setCurrentLat(precisionLat);
      setCurrentLng(precisionLng);

      if (leafletMapRef.current && flyTo) {
        leafletMapRef.current.flyTo([precisionLat, precisionLng], customZoom || 17, { duration: 1.0 });
      }

      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng([precisionLat, precisionLng]);
      }

      if (onLocationSelect) {
        const addrDetails = await fetchLocationAddress(precisionLat, precisionLng);
        onLocationSelect(precisionLat, precisionLng, addrDetails);
      }
    },
    [onLocationSelect]
  );

  // Initialize Map
  useEffect(() => {
    let isSubscribed = true;

    const initMap = () => {
      if (!containerRef.current || !window.L || leafletMapRef.current) return;

      // Ensure container is clean
      try {
        if ((containerRef.current as any)._leaflet_id) {
          (containerRef.current as any)._leaflet_id = null;
        }
      } catch {}

      const map = window.L.map(containerRef.current, {
        center: [currentLat, currentLng],
        zoom: zoomLevel,
        zoomControl: false,
        attributionControl: false,
      });

      const cfg = getTileLayerConfig(tileLayer);
      const layer = window.L.tileLayer(cfg.url, {
        maxZoom: cfg.maxZoom,
        subdomains: cfg.subdomains,
      }).addTo(map);

      tileLayerRef.current = layer;
      markersGroupRef.current = window.L.layerGroup().addTo(map);
      leafletMapRef.current = map;

      // On mobile touch devices, disable dragging initially so page scroll isn't trapped
      if (isTouchDevice && !isExpanded && !isTouchDraggingEnabled) {
        try {
          map.dragging.disable();
        } catch {}
      }

      // Update zoom state on user zoom
      map.on('zoomend', () => {
        if (!isSubscribed) return;
        setZoomLevel(map.getZoom());
      });

      // Handle map click in picker mode (places pin directly on clicked pixel)
      map.on('click', (e: any) => {
        if (mode !== 'picker') return;
        updateSelectedPosition(e.latlng.lat, e.latlng.lng, false);
      });
    };

    if (window.L) {
      initMap();
    } else {
      const checkInterval = setInterval(() => {
        if (!isSubscribed) {
          clearInterval(checkInterval);
          return;
        }
        if (window.L) {
          clearInterval(checkInterval);
          initMap();
        }
      }, 100);

      setTimeout(() => clearInterval(checkInterval), 6000);
    }

    return () => {
      isSubscribed = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mode]);

  // Dynamically sync touch dragging with state
  useEffect(() => {
    if (!leafletMapRef.current) return;
    try {
      if (isExpanded || isTouchDraggingEnabled) {
        leafletMapRef.current.dragging.enable();
      } else if (isTouchDevice) {
        leafletMapRef.current.dragging.disable();
      }
    } catch {}
  }, [isExpanded, isTouchDraggingEnabled, isTouchDevice]);

  // Update Markers dynamically when business list, mode, or position changes
  useEffect(() => {
    const map = leafletMapRef.current;
    const markersGroup = markersGroupRef.current;

    if (!map || !markersGroup || !window.L) return;

    markersGroup.clearLayers();

    if (mode === 'picker') {
      // 🌟 Precision Needle Pin (Direct Anchor at the tip of the needle: [18, 46])
      const pickerIcon = window.L.divIcon({
        className: 'custom-picker-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab; user-select: none;">
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #020617; font-weight: 900; font-size: 11px; padding: 3px 10px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0,0,0,0.6); white-space: nowrap; border: 1.5px solid #fef08a; margin-bottom: 2px;">
              📍 موقع النشاط المحدد
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
        draggable: true,
        autoPan: true,
      });

      marker.on('dragend', (e: any) => {
        const ll = e.target.getLatLng();
        updateSelectedPosition(ll.lat, ll.lng, false);
      });

      markersGroup.addLayer(marker);
      pickerMarkerRef.current = marker;

      // Draw live GPS Accuracy Circle if GPS was used
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
    } else {
      // View Mode: Render Businesses with Smart Screen-Space Marker Clustering
      const filteredBusinesses = businesses.filter((b) => {
        if (typeof b.lat !== 'number' || typeof b.lng !== 'number' || isNaN(b.lat) || isNaN(b.lng)) return false;
        if (selectedGovFilter !== 'all' && !(b.governorate || '').includes(selectedGovFilter)) {
          return false;
        }
        return true;
      });

      // Cluster pins within ~52 screen pixels of each other to avoid overlap
      const clusterRadiusPx = 52;
      const clusters: Array<{
        centerLat: number;
        centerLng: number;
        items: Business[];
      }> = [];

      filteredBusinesses.forEach((biz) => {
        const pt = map.latLngToLayerPoint([biz.lat, biz.lng]);

        let placed = false;
        for (const cl of clusters) {
          const clPt = map.latLngToLayerPoint([cl.centerLat, cl.centerLng]);
          const dist = Math.hypot(pt.x - clPt.x, pt.y - clPt.y);
          if (dist < clusterRadiusPx) {
            cl.items.push(biz);
            cl.centerLat = (cl.centerLat * (cl.items.length - 1) + biz.lat) / cl.items.length;
            cl.centerLng = (cl.centerLng * (cl.items.length - 1) + biz.lng) / cl.items.length;
            placed = true;
            break;
          }
        }

        if (!placed) {
          clusters.push({
            centerLat: biz.lat,
            centerLng: biz.lng,
            items: [biz],
          });
        }
      });

      clusters.forEach((cluster) => {
        if (cluster.items.length === 1) {
          const biz = cluster.items[0];
          const isVerified = biz.verificationStatus === 'verified';
          const isSelected = selectedBiz?.id === biz.id;
          const color = isVerified ? '#10b981' : '#f59e0b';
          const bg = isVerified ? '#064e3b' : '#78350f';
          const safeName = escapeHtml(biz.nameAr || 'منشأة معتمدة');
          const categoryIcon = getCategoryIcon(biz.category);

          const showFullPill = zoomLevel >= 15;
          const htmlContent = showFullPill
            ? `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
                <div style="background: ${isSelected ? '#f59e0b' : bg}; border: 1.5px solid ${isSelected ? '#ffffff' : color}; color: ${isSelected ? '#020617' : '#ffffff'}; padding: 4px 9px; border-radius: 9999px; font-weight: 800; font-size: 11px; white-space: nowrap; box-shadow: 0 4px 15px rgba(0,0,0,0.6); display: flex; align-items: center; gap: 5px; transition: transform 0.2s; font-family: Cairo, sans-serif;">
                  <span style="font-size: 13px;">${categoryIcon}</span>
                  <span>${safeName}</span>
                </div>
                <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid ${isSelected ? '#f59e0b' : color}; margin-top: -1px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.4));"></div>
                <div style="width: 4px; height: 4px; border-radius: 9999px; background: ${isSelected ? '#ffffff' : color}; margin-top: -2px;"></div>
              </div>
            `
            : `
              <div style="position: relative; transform: translate(-50%, -50%); cursor: pointer;">
                <div style="background: ${isSelected ? '#f59e0b' : color}; width: 28px; height: 28px; border-radius: 9999px; border: 2px solid #ffffff; box-shadow: 0 3px 12px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 13px;">
                  ${categoryIcon}
                </div>
              </div>
            `;

          const bizIcon = window.L.divIcon({
            className: 'custom-biz-pin',
            html: htmlContent,
            iconSize: showFullPill ? [140, 38] : [28, 28],
            iconAnchor: showFullPill ? [70, 38] : [14, 14],
          });

          const marker = window.L.marker([biz.lat, biz.lng], { icon: bizIcon });

          marker.on('click', () => {
            setSelectedBiz(biz);
            map.flyTo([biz.lat, biz.lng], Math.max(map.getZoom(), 16), { duration: 0.7 });
            if (onSelectBusiness) onSelectBusiness(biz);
          });

          markersGroup.addLayer(marker);
        } else {
          // Cluster pin
          const clusterIcon = window.L.divIcon({
            className: 'custom-cluster-pin',
            html: `
              <div style="position: relative; transform: translate(-50%, -50%); cursor: pointer;">
                <div style="background: linear-gradient(135deg, #d97706, #b45309); border: 2.5px solid #fef08a; color: #ffffff; width: 44px; height: 44px; border-radius: 9999px; box-shadow: 0 4px 16px rgba(217, 119, 6, 0.55); display: flex; flex-direction: column; align-items: center; justify-content: center; user-select: none; font-family: Cairo, sans-serif;">
                  <span style="font-size: 13px; font-weight: 900; line-height: 1;">${cluster.items.length}</span>
                  <span style="font-size: 8px; font-weight: 800; color: #fef08a; line-height: 1;">أماكن</span>
                </div>
              </div>
            `,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          });

          const clusterMarker = window.L.marker([cluster.centerLat, cluster.centerLng], { icon: clusterIcon });

          clusterMarker.on('click', () => {
            const currentZoom = map.getZoom();
            if (currentZoom < 18) {
              const bounds = window.L.latLngBounds(cluster.items.map((b) => [b.lat, b.lng]));
              map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
            } else {
              setSelectedBiz(cluster.items[0]);
              if (onSelectBusiness) onSelectBusiness(cluster.items[0]);
            }
          });

          markersGroup.addLayer(clusterMarker);
        }
      });
    }
  }, [mode, businesses, selectedGovFilter, currentLat, currentLng, gpsAccuracy, zoomLevel, selectedBiz]);

  // Handle Resize & Fullscreen Invalidation
  useEffect(() => {
    const handleResize = () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(containerRef.current);
    }

    const timer = setTimeout(handleResize, 200);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, [isExpanded]);

  // 🎯 Ultra-Precision Satellite GPS Locator (Multi-Sample Convergence)
  const handleGetLocation = () => {
    setIsLocating(true);
    setGpsAccuracy(null);

    if (!('geolocation' in navigator)) {
      setIsLocating(false);
      alert('خدمة تحديد الموقع GPS غير مدعومة على هذا المتصفح.');
      return;
    }

    let bestPosition: GeolocationPosition | null = null;
    let watchId: number | null = null;
    let sampleCount = 0;

    const finalizePosition = (pos: GeolocationPosition) => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      setIsLocating(false);

      const uLat = Number(pos.coords.latitude.toFixed(6));
      const uLng = Number(pos.coords.longitude.toFixed(6));
      const acc = Math.round(pos.coords.accuracy);

      setGpsAccuracy(acc);
      updateSelectedPosition(uLat, uLng, true, 18);
    };

    // Watch Position convergence over up to 3.5 seconds
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        sampleCount++;
        if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
        }

        // If satellite lock achieved high precision (< 10 meters) or sampled enough
        if (position.coords.accuracy <= 8 || sampleCount >= 4) {
          finalizePosition(bestPosition || position);
        }
      },
      (error) => {
        console.warn('High precision GPS error, falling back:', error);
        if (bestPosition) {
          finalizePosition(bestPosition);
        } else {
          // Last single attempt
          navigator.geolocation.getCurrentPosition(
            (pos) => finalizePosition(pos),
            () => {
              setIsLocating(false);
              alert('تعذر الوصول إلى إشارة GPS دقيقة. يرجى تفعيل خدمة الموقع على جهازك أو التحديد يدوياً على الخريطة.');
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
          );
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 12000,
      }
    );

    // Timeout safety to lock the best reading obtained within 4 seconds
    setTimeout(() => {
      if (isLocating && bestPosition) {
        finalizePosition(bestPosition);
      } else if (isLocating) {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        setIsLocating(false);
      }
    }, 4500);
  };

  // Pin current center of map viewport
  const handlePinCenterOfMap = () => {
    if (!leafletMapRef.current) return;
    const center = leafletMapRef.current.getCenter();
    updateSelectedPosition(center.lat, center.lng, false);
  };

  // Directional Pan Controls
  const handlePan = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!leafletMapRef.current) return;
    const offset = 140;
    const panMap: Record<string, [number, number]> = {
      up: [0, -offset],
      down: [0, offset],
      left: [-offset, 0],
      right: [offset, 0],
    };
    leafletMapRef.current.panBy(panMap[direction], { animate: true, duration: 0.25 });
  };

  // Zoom Controls
  const handleZoomIn = () => leafletMapRef.current?.zoomIn();
  const handleZoomOut = () => leafletMapRef.current?.zoomOut();

  // Reset Position to default Cairo / initial coords
  const handleResetPosition = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
    }
  };

  // Governorate Select & Smooth FlyTo
  const handleGovChange = (govName: string) => {
    setSelectedGovFilter(govName);
    if (govName !== 'all' && GOVERNORATE_COORDS[govName]) {
      const coords = GOVERNORATE_COORDS[govName];
      updateSelectedPosition(coords.lat, coords.lng, true, 14);
    }
  };

  const containerClasses = isExpanded
    ? 'fixed inset-2 sm:inset-5 z-50 bg-[var(--bg-card)] border-2 border-amber-500/50 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-scale'
    : 'bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl flex flex-col transition-colors duration-300';

  const mapHeight = isExpanded ? 'flex-1 h-full min-h-[480px]' : heightClass;

  const filteredBusinessesCount = businesses.filter((b) => {
    if (typeof b.lat !== 'number' || typeof b.lng !== 'number' || isNaN(b.lat) || isNaN(b.lng)) return false;
    if (selectedGovFilter !== 'all' && !(b.governorate || '').includes(selectedGovFilter)) {
      return false;
    }
    return true;
  }).length;

  return (
    <>
      {/* Fullscreen Backdrop overlay */}
      {isExpanded && (
        <div
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
        />
      )}

      <div className={containerClasses}>
        {/* Map Header Bar */}
        <MapHeaderBar
          mode={mode}
          filteredBusinessesCount={filteredBusinessesCount}
          tileLayer={tileLayer}
          onSwitchTileLayer={switchTileLayer}
          selectedGovFilter={selectedGovFilter}
          onGovChange={handleGovChange}
          isLocating={isLocating}
          onGetLocation={handleGetLocation}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
        />

        {/* 🔍 Search & Quick Jump / Paste Box */}
        {mode === 'picker' && (
          <MapSearchBox
            onSelectPosition={(sLat, sLng, fly, zoom) =>
              updateSelectedPosition(sLat, sLng, fly, zoom)
            }
          />
        )}

        {/* High-Performance Canvas Container */}
        <div className="relative w-full overflow-hidden flex-1">
          <div
            ref={containerRef}
            className={`w-full ${mapHeight} z-10 cursor-crosshair`}
          />

          {/* Floating Controls Overlay */}
          <MapFloatingControls
            mode={mode}
            isTouchDevice={isTouchDevice}
            isExpanded={isExpanded}
            isTouchDraggingEnabled={isTouchDraggingEnabled}
            onToggleTouchDragging={() => {
              const next = !isTouchDraggingEnabled;
              setIsTouchDraggingEnabled(next);
              triggerHaptic('selection');
            }}
            centerReticleActive={centerReticleActive}
            onToggleCenterReticle={() => setCenterReticleActive(!centerReticleActive)}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onPinCenterOfMap={handlePinCenterOfMap}
            onResetPosition={handleResetPosition}
            onPan={handlePan}
          />

          {/* Selected Business Card Drawer on Map View */}
          {mode === 'view' && selectedBiz && (
            <MapSelectedBusinessDrawer
              business={selectedBiz}
              onClose={() => setSelectedBiz(null)}
              onSelectBusiness={onSelectBusiness}
              onEditBusiness={onEditBusiness}
            />
          )}
        </div>

        {/* GPS Coordinates & Footer Toolbar */}
        <MapFooterBar
          currentLat={currentLat}
          currentLng={currentLng}
          zoomLevel={zoomLevel}
          gpsAccuracy={gpsAccuracy}
        />
      </div>
    </>
  );
};
