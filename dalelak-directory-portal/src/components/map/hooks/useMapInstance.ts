import { useState, useEffect, useRef, useCallback } from 'react';
import { LocationAddressData, fetchLocationAddress } from '../../../utils/geocoding';
import { MapTileLayerType } from '../constants/mapConstants';

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
  const [tileLayer, setTileLayer] = useState<MapTileLayerType>('google-streets');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

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

  useEffect(() => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    liveCenterRef.current.lat = lat;
    liveCenterRef.current.lng = lng;
  }, [lat, lng]);

  // Tile layer URL resolver with high-performance tile caching options
  const getTileLayerConfig = useCallback((type: MapTileLayerType) => {
    const commonOptions = {
      keepBuffer: 8,
      updateWhenIdle: false,
      updateWhenZooming: false,
      crossOrigin: true,
    };

    switch (type) {
      case 'google-hybrid':
        return {
          url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          maxZoom: 20,
          maxNativeZoom: 20,
          subdomains: ['0', '1', '2', '3'],
          attribution: 'Imagery © Google',
          ...commonOptions,
        };
      case 'google-streets':
        return {
          url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          maxZoom: 20,
          maxNativeZoom: 20,
          subdomains: ['0', '1', '2', '3'],
          attribution: 'Map data © Google',
          ...commonOptions,
        };
      case 'dalelak-clean':
      default:
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          maxZoom: 19,
          maxNativeZoom: 19,
          subdomains: ['a', 'b', 'c'],
          attribution: '© خريطة دليلك الميدانية / OpenStreetMap contributors',
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
      crossOrigin: cfg.crossOrigin,
    });

    newLayer.addTo(leafletMapRef.current);
    tileLayerRef.current = newLayer;
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
      const map = window.L.map(containerRef.current, {
        center: [centerToUse.lat, centerToUse.lng],
        zoom: centerToUse.zoom || zoomLevel,
        zoomControl: false,
        attributionControl: false,
      });

      const cfg = getTileLayerConfig(tileLayer);
      const layer = window.L.tileLayer(cfg.url, {
        maxZoom: cfg.maxZoom,
        maxNativeZoom: cfg.maxNativeZoom,
        subdomains: cfg.subdomains,
        attribution: cfg.attribution,
        keepBuffer: cfg.keepBuffer,
        updateWhenIdle: cfg.updateWhenIdle,
        updateWhenZooming: cfg.updateWhenZooming,
        crossOrigin: cfg.crossOrigin,
      }).addTo(map);

      tileLayerRef.current = layer;
      markersGroupRef.current = window.L.layerGroup().addTo(map);
      leafletMapRef.current = map;
      if (containerRef.current) {
        (containerRef.current as any)._leaflet_map = map;
      }

      // Automatically calibrate Hadayek Al-Ahram bounds on initial load (Gate 1 to Gate Horus, أ to ص)
      if (mode === 'view' && !liveCenterRef.current) {
        try {
          map.fitBounds([[29.9477, 31.0881], [29.9888, 31.1122]], { padding: [16, 16], maxZoom: 14 });
        } catch {}
      }

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
        updateSelectedPosition(e.latlng.lat, e.latlng.lng, false);
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
  }, [mode, isExpanded, getTileLayerConfig, updateSelectedPosition]);

  // Handle Resize & Fullscreen Invalidation (Zero Center Drift - commit 3471e21)
  useEffect(() => {
    const handleResize = () => {
      if (leafletMapRef.current) {
        if (containerRef.current && !containerRef.current.classList.contains('leaflet-container')) {
          containerRef.current.classList.add('leaflet-container');
        }
        const targetCenter = liveCenterRef.current;
        requestAnimationFrame(() => {
          if (leafletMapRef.current) {
            leafletMapRef.current.invalidateSize({ animate: false, pan: true });
            if (targetCenter && typeof targetCenter.lat === 'number' && !isNaN(targetCenter.lat)) {
              leafletMapRef.current.setView([targetCenter.lat, targetCenter.lng], targetCenter.zoom, { animate: false });
            }
          }
        });
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

    const t1 = setTimeout(handleResize, 30);
    const t2 = setTimeout(handleResize, 100);
    const t3 = setTimeout(handleResize, 250);
    const t4 = setTimeout(handleResize, 450);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isExpanded, containerRef]);

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
