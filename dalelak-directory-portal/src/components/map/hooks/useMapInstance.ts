import { useState, useEffect, useRef, useCallback } from 'react';
import { LocationAddressData, fetchLocationAddress } from '../../../utils/geocoding';
import { MapTileLayerType } from '../constants/mapConstants';
import { preloadHadayekTiles, cancelHadayekTilePreload, HADAYEK_BOUNDS_COORDS } from '../../../utils/hadayekTilePreloader';

export const HADAYEK_BOUNDS: [[number, number], [number, number]] = [
  HADAYEK_BOUNDS_COORDS.sw,
  HADAYEK_BOUNDS_COORDS.ne,
];

export const HADAYEK_TILE_BOUNDS: [[number, number], [number, number]] = [
  [29.9100, 31.0400],
  [30.0250, 31.1550],
];

export interface UseMapInstanceProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  mode?: 'picker' | 'view';
  lat?: number;
  lng?: number;
  zoomLevel?: number;
  isExpanded?: boolean;
  onLocationSelect?: (lat: number, lng: number, addressDetails?: LocationAddressData) => void;
}

export const useMapInstance = ({
  containerRef,
  mode = 'view',
  lat = 29.9683,
  lng = 31.1002,
  zoomLevel: initialZoom = 14,
  isExpanded = false,
  onLocationSelect,
}: UseMapInstanceProps) => {
  const [currentLat, setCurrentLat] = useState<number>(lat);
  const [currentLng, setCurrentLng] = useState<number>(lng);
  const [zoomLevel, setZoomLevel] = useState<number>(initialZoom);
  const [tileLayer, setTileLayer] = useState<MapTileLayerType>('dalelak-clean');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  const leafletMapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const pickerMarkerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);

  // Live geographic viewport tracker (locks view 100% during expand/collapse/resize - commit 3471e21)
  const liveCenterRef = useRef<{ lat: number; lng: number; zoom: number }>({
    lat,
    lng,
    zoom: zoomLevel,
  });
  const prevPropsCoordRef = useRef<{ lat: number; lng: number }>({ lat, lng });

  // Only respond to prop coordinate changes if they actually changed from the outside
  useEffect(() => {
    if (prevPropsCoordRef.current.lat === lat && prevPropsCoordRef.current.lng === lng) {
      return;
    }
    prevPropsCoordRef.current = { lat, lng };
    setCurrentLat(lat);
    setCurrentLng(lng);
    liveCenterRef.current.lat = lat;
    liveCenterRef.current.lng = lng;

    if (leafletMapRef.current && isMapReady) {
      try {
        const cur = leafletMapRef.current.getCenter();
        if (Math.abs(cur.lat - lat) > 0.0005 || Math.abs(cur.lng - lng) > 0.0005) {
          if (mode === 'picker') {
            leafletMapRef.current.flyTo([lat, lng], 17, { duration: 0.8 });
          }
        }
      } catch {}
    }
  }, [lat, lng, isMapReady, mode]);

  // Tile layer URL resolver with high-performance tile caching options strictly bounded to Hadayek
  const getTileLayerConfig = useCallback((type: MapTileLayerType) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const commonOptions = {
      keepBuffer: isMobile ? 2 : 3,
      updateWhenIdle: true,
      updateWhenZooming: false,
      bounds: HADAYEK_TILE_BOUNDS,
      crossOrigin: true,
    };

    switch (type) {
      case 'google-streets':
        return {
          url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          maxZoom: 20,
          maxNativeZoom: 20,
          subdomains: ['0', '1', '2', '3'],
          attribution: 'Map data © Google',
          ...commonOptions,
        };
      case 'google-hybrid':
        return {
          url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          maxZoom: 20,
          maxNativeZoom: 20,
          subdomains: ['0', '1', '2', '3'],
          attribution: 'Map data © Google',
          ...commonOptions,
        };
      case 'dalelak-clean':
      default:
        // 🗺️ الخريطة المساحية التخطيطية الصفراء الصماء مع أرقام المباني والقطع بدقة
        return {
          url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
          maxZoom: 20,
          maxNativeZoom: 19,
          subdomains: ['a', 'b', 'c'],
          attribution: '© خريطة دليلك المساحية / OpenStreetMap contributors / Humanitarian OSM',
          ...commonOptions,
        };
    }
  }, []);

  // Switch Tile Layer
  const switchTileLayer = useCallback((newType: MapTileLayerType) => {
    setTileLayer(newType);
    if (!leafletMapRef.current || !window.L) return;

    if (tileLayerRef.current) {
      leafletMapRef.current.removeLayer(tileLayerRef.current);
    }

    const cfg = getTileLayerConfig(newType);
    const newLayer = window.L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      maxNativeZoom: cfg.maxNativeZoom,
      subdomains: cfg.subdomains,
      attribution: cfg.attribution,
      keepBuffer: cfg.keepBuffer,
      updateWhenIdle: cfg.updateWhenIdle,
      updateWhenZooming: cfg.updateWhenZooming,
      bounds: cfg.bounds,
      crossOrigin: cfg.crossOrigin,
    });

    newLayer.addTo(leafletMapRef.current);
    tileLayerRef.current = newLayer;

    // Trigger pre-warming for the newly selected tile provider
    preloadHadayekTiles(newType);
  }, [getTileLayerConfig]);

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

  const updateSelectedPositionRef = useRef(updateSelectedPosition);
  updateSelectedPositionRef.current = updateSelectedPosition;
  const getTileLayerConfigRef = useRef(getTileLayerConfig);
  getTileLayerConfigRef.current = getTileLayerConfig;

  // Initialize Map
  useEffect(() => {
    let isSubscribed = true;

    const initMap = () => {
      if (!containerRef.current || !window.L || leafletMapRef.current) return;

      try {
        if ((containerRef.current as any)._leaflet_id) {
          (containerRef.current as any)._leaflet_id = null;
        }
      } catch {}

      const centerToUse = liveCenterRef.current || { lat: currentLat, lng: currentLng, zoom: zoomLevel };
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

      const map = window.L.map(containerRef.current, {
        center: [centerToUse.lat, centerToUse.lng],
        zoom: centerToUse.zoom || zoomLevel,
        zoomControl: false,
        attributionControl: false,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 80,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        inertia: true,
        inertiaDeceleration: 3500,
        inertiaMaxSpeed: 1600,
        easeLinearity: 0.25,
        bounceAtZoomLimits: false,
        maxBoundsViscosity: 0.75, // Natural elastic damping instead of rigid slam
      });

      if (mode === 'view') {
        map.setMaxBounds(HADAYEK_BOUNDS);
        map.options.minZoom = isMobile ? 12.8 : 13.2;
        map.options.maxZoom = 19.5;
      } else {
        map.options.minZoom = 6;
        map.options.maxZoom = 19.5;
      }

      const cfg = getTileLayerConfigRef.current(tileLayer);
      const layer = window.L.tileLayer(cfg.url, {
        maxZoom: cfg.maxZoom,
        maxNativeZoom: cfg.maxNativeZoom,
        subdomains: cfg.subdomains,
        attribution: cfg.attribution,
        keepBuffer: cfg.keepBuffer,
        updateWhenIdle: cfg.updateWhenIdle,
        updateWhenZooming: cfg.updateWhenZooming,
        bounds: cfg.bounds,
        crossOrigin: cfg.crossOrigin,
      }).addTo(map);

      tileLayerRef.current = layer;
      markersGroupRef.current = window.L.layerGroup().addTo(map);
      leafletMapRef.current = map;
      setIsMapReady(true);
      if (containerRef.current) {
        (containerRef.current as any)._leaflet_map = map;
      }

      // 🚀 Background pre-warming of all Hadayek Al-Ahram tiles into cache
      preloadHadayekTiles(tileLayer);

      // Automatically calibrate Hadayek Al-Ahram bounds on initial load
      if (mode === 'view') {
        try {
          map.fitBounds(HADAYEK_BOUNDS, { padding: [16, 16], maxZoom: 14.5 });
        } catch {}
      }

      // Stop ongoing programmatic transitions when the user drags the map
      map.on('dragstart', () => {
        try { map.stop(); } catch {}
      });

      // Update zoom and center state on user navigation
      map.on('zoomend', () => {
        if (!isSubscribed) return;
        setZoomLevel(map.getZoom());
        try {
          const c = map.getCenter();
          const z = map.getZoom();
          if (c && typeof c.lat === 'number' && !isNaN(c.lat)) {
            liveCenterRef.current = { lat: c.lat, lng: c.lng, zoom: z };
          }
        } catch {}
      });

      map.on('moveend', () => {
        if (!isSubscribed) return;
        try {
          const c = map.getCenter();
          const z = map.getZoom();
          if (c && typeof c.lat === 'number' && !isNaN(c.lat)) {
            liveCenterRef.current = { lat: c.lat, lng: c.lng, zoom: z };
          }
        } catch {}
      });

      // Handle map click in picker mode
      map.on('click', (e: any) => {
        if (mode !== 'picker') return;
        updateSelectedPositionRef.current(e.latlng.lat, e.latlng.lng, false);
      });
    };

    // Ensure Leaflet CSS is injected dynamically on demand (Zero-Head Leaflet)
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    if (window.L) {
      initMap();
    } else {
      const existingScript = document.querySelector('script[src*="leaflet.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (isSubscribed) initMap();
        });
      } else {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          if (isSubscribed) initMap();
        };
        document.head.appendChild(script);
      }
    }

    return () => {
      isSubscribed = false;
      cancelHadayekTilePreload();
      setIsMapReady(false);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      if (containerRef.current) {
        try {
          (containerRef.current as any)._leaflet_map = null;
        } catch {}
      }
    };
  }, [mode]);

  // Handle container expansion/collapse without destroying Leaflet instance
  useEffect(() => {
    if (leafletMapRef.current && isMapReady) {
      const timer = setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize({ animate: false, pan: false });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, isMapReady]);

  // Handle Resize & Fullscreen Invalidation (Zero Center Drift - commit 3471e21)
  useEffect(() => {
    const handleResize = () => {
      if (leafletMapRef.current) {
        if (containerRef.current && !containerRef.current.classList.contains('leaflet-container')) {
          containerRef.current.classList.add('leaflet-container');
        }
        leafletMapRef.current.invalidateSize({ animate: false, pan: false });
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

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [containerRef]);

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

  // Reset Position to default
  const handleResetPosition = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
    }
  };

  const handlePinCenterOfMap = () => {
    if (!leafletMapRef.current) return;
    const center = leafletMapRef.current.getCenter();
    updateSelectedPosition(center.lat, center.lng, false);
  };

  return {
    leafletMapRef,
    isMapReady,
    markersGroupRef,
    pickerMarkerRef,
    accuracyCircleRef,
    liveCenterRef,
    currentLat,
    currentLng,
    zoomLevel,
    tileLayer,
    gpsAccuracy,
    setGpsAccuracy,
    switchTileLayer,
    updateSelectedPosition,
    handlePan,
    handleZoomIn,
    handleZoomOut,
    handleResetPosition,
    handlePinCenterOfMap,
  };
};
