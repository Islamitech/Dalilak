import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Business } from '../types';
import {
  fetchLocationAddress,
  searchPlacesInEgypt,
  parseLocationQuery,
  LocationAddressData,
  PlaceSearchResult,
} from '../utils/geocoding';
import {
  MapPin,
  Navigation,
  Copy,
  ExternalLink,
  Check,
  Phone,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Crosshair,
  Zap,
  Eye,
  Search,
  Layers,
  Loader2,
  CheckCircle2,
  X,
  Target,
  Sparkles,
} from 'lucide-react';

declare global {
  interface Window {
    L: any;
  }
}

export type MapTileLayerType = 'google-hybrid' | 'google-streets' | 'cartodb';

interface InteractiveMapProps {
  mode?: 'picker' | 'view';
  lat?: number;
  lng?: number;
  onLocationSelect?: (lat: number, lng: number, addressDetails?: LocationAddressData) => void;
  businesses?: Business[];
  onSelectBusiness?: (biz: Business) => void;
  onEditBusiness?: (biz: Business) => void;
  heightClass?: string;
}

// Egyptian governorate approximate coordinates map
const GOVERNORATE_COORDS: Record<string, { lat: number; lng: number }> = {
  'القاهرة': { lat: 30.0444, lng: 31.2357 },
  'الجيزة': { lat: 30.0131, lng: 31.2089 },
  'الإسكندرية': { lat: 31.2001, lng: 29.9187 },
  'الدقهلية (المنصورة)': { lat: 31.0409, lng: 31.3785 },
  'الغربية (طنطا)': { lat: 30.7865, lng: 31.0004 },
  'الشرقية (الزقازيق)': { lat: 30.5877, lng: 31.5020 },
  'القليوبية (بنها)': { lat: 30.4660, lng: 31.1852 },
  'المنوفية (شبين الكوم)': { lat: 30.5503, lng: 31.0106 },
  'البحيرة (دمنهور)': { lat: 31.0361, lng: 30.4682 },
  'كفر الشيخ': { lat: 31.1107, lng: 30.9388 },
  'دمياط': { lat: 31.4175, lng: 31.8144 },
  'بورسعيد': { lat: 31.2653, lng: 32.3019 },
  'الإسماعيلية': { lat: 30.5965, lng: 32.2715 },
  'السويس': { lat: 29.9668, lng: 32.5498 },
  'الفيوم': { lat: 29.3084, lng: 30.8428 },
  'بني سويف': { lat: 29.0661, lng: 31.0994 },
  'المنيا': { lat: 28.0871, lng: 30.7618 },
  'أسيوط': { lat: 27.1783, lng: 31.1859 },
  'سوهاج': { lat: 26.5569, lng: 31.6948 },
  'قنا': { lat: 26.1551, lng: 32.7160 },
  'الأقصر': { lat: 25.6872, lng: 32.6396 },
  'أسوان': { lat: 24.0889, lng: 32.8998 },
  'مطروح': { lat: 31.3543, lng: 27.2373 },
  'البحر الأحمر (الغردقة)': { lat: 27.2579, lng: 33.8116 },
  'جنوب سيناء (شرم الشيخ)': { lat: 27.9158, lng: 34.3299 },
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  mode = 'view',
  lat = 30.0444,
  lng = 31.2357,
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
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedGovFilter, setSelectedGovFilter] = useState<string>('all');
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);

  // High precision controls & Layer switcher (Default: Lightweight CartoDB Data-Saver)
  const [tileLayer, setTileLayer] = useState<MapTileLayerType>('cartodb');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [centerReticleActive, setCenterReticleActive] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const pickerMarkerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);
  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    setCurrentLat(lat);
    setCurrentLng(lng);
  }, [lat, lng]);

  // Tile layer URL resolver
  const getTileLayerConfig = (type: MapTileLayerType) => {
    switch (type) {
      case 'google-hybrid':
        return {
          url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: 'Imagery © Google',
        };
      case 'google-streets':
        return {
          url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: 'Map data © Google',
        };
      case 'cartodb':
      default:
        return {
          url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '© CartoDB / OpenStreetMap',
        };
    }
  };

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
    };
  }, [mode]);

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
      // View Mode: Render all Businesses as native Leaflet markers
      const filteredBusinesses = businesses.filter((b) => {
        if (selectedGovFilter !== 'all' && !b.governorate.includes(selectedGovFilter)) {
          return false;
        }
        return true;
      });

      filteredBusinesses.forEach((biz) => {
        const isVerified = biz.verificationStatus === 'verified';
        const color = isVerified ? '#10b981' : '#f59e0b';
        const bg = isVerified ? '#064e3b' : '#78350f';

        const bizIcon = window.L.divIcon({
          className: 'custom-biz-pin',
          html: `
            <div style="position: relative; transform: translate(-50%, -50%); cursor: pointer;">
              <div style="background: ${bg}; border: 1.5px solid ${color}; color: #ffffff; padding: 4px 8px; border-radius: 12px; font-weight: 800; font-size: 11px; white-space: nowrap; box-shadow: 0 4px 15px rgba(0,0,0,0.6); display: flex; items-center; gap: 4px;">
                <span style="color: ${color};">📍</span>
                <span>${biz.nameAr}</span>
              </div>
            </div>
          `,
          iconSize: [120, 32],
          iconAnchor: [60, 16],
        });

        const marker = window.L.marker([biz.lat, biz.lng], { icon: bizIcon });

        marker.on('click', () => {
          setSelectedBiz(biz);
          map.flyTo([biz.lat, biz.lng], 17, { duration: 0.8 });
          if (onSelectBusiness) onSelectBusiness(biz);
        });

        markersGroup.addLayer(marker);
      });
    }
  }, [mode, businesses, selectedGovFilter, currentLat, currentLng, gpsAccuracy]);

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

  // Search input handler with debounce
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    // Check if direct coordinate or Google Maps link was pasted
    const parsed = parseLocationQuery(text);
    if (parsed) {
      updateSelectedPosition(parsed.lat, parsed.lng, true, 18);
      setShowSearchResults(false);
      return;
    }

    if (text.trim().length >= 2) {
      setIsSearching(true);
      setShowSearchResults(true);
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchPlacesInEgypt(text);
        setSearchResults(results);
        setIsSearching(false);
      }, 400);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (res: PlaceSearchResult) => {
    updateSelectedPosition(res.lat, res.lng, true, 18);
    setSearchQuery(res.displayName.split(',')[0]);
    setShowSearchResults(false);
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

  // Reset Position to default Cairo
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

  const handleCopyCoords = () => {
    const coordsStr = `${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`;
    navigator.clipboard.writeText(coordsStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`;

  const containerClasses = isExpanded
    ? 'fixed inset-2 sm:inset-5 z-50 bg-[var(--bg-card)] border-2 border-amber-500/50 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-scale'
    : 'bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl flex flex-col transition-colors duration-300';

  const mapHeight = isExpanded ? 'flex-1 h-full min-h-[480px]' : heightClass;

  const filteredBusinessesCount = businesses.filter((b) => {
    if (selectedGovFilter !== 'all' && !b.governorate.includes(selectedGovFilter)) {
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
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-40"
        />
      )}

      <div className={containerClasses}>
        {/* Map Header Bar */}
        <div className="bg-[var(--map-header-bg)] p-2.5 sm:p-3 border-b border-[var(--map-header-border)] flex flex-wrap items-center justify-between gap-2 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow">
              <MapPin className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
                <span>{mode === 'picker' ? 'تحديد وتوجيه موقع النشاط بدقة خريطة جوجل' : 'خريطة الأنشطة والتوثيق الميداني المباشر'}</span>
                <span className="bg-emerald-500/15 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>دقة قمر صناعي 100%</span>
                </span>
              </h4>
              <p className="text-[10px] text-amber-400 font-medium">
                {mode === 'picker'
                  ? 'انقر على أي نقطة، أو اسحب الدبوس بدقة، أو ابحث باسم الشارع / الصق رابط جوجل ماب'
                  : `إجمالي ${filteredBusinessesCount} نشاط تجاري موثق على الخريطة`}
              </p>
            </div>
          </div>

          {/* Controls Bar Right Side */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Tile Layer Switcher Pills */}
            <div className="flex items-center bg-[var(--input-bg)] p-0.5 rounded-xl border border-[var(--border-color)] text-[11px] font-bold">
              <button
                type="button"
                onClick={() => switchTileLayer('google-streets')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  tileLayer === 'google-streets'
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="عرض خريطة شوارع جوجل الرسمية (Google Streets)"
              >
                <span>🗺️ شوارع جوجل</span>
              </button>
              <button
                type="button"
                onClick={() => switchTileLayer('google-hybrid')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  tileLayer === 'google-hybrid'
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="عرض القمر الصناعي المباشر من جوجل (Satellite + Labels)"
              >
                <span>🛰️ قمر صناعي</span>
              </button>
            </div>

            {/* Governorate Switcher Dropdown */}
            <select
              value={selectedGovFilter}
              onChange={(e) => handleGovChange(e.target.value)}
              className="bg-[var(--input-bg)] hover:bg-amber-500/10 border border-[var(--border-color)] text-amber-600 dark:text-amber-300 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
              title="الانتقال المباشر للمحافظة"
            >
              <option value="all">كل المحافظات</option>
              {Object.keys(GOVERNORATE_COORDS).map((g) => (
                <option key={g} value={g}>
                  📍 {g}
                </option>
              ))}
            </select>

            {/* GPS Locator Button */}
            {mode === 'picker' && (
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black px-3 py-1.5 rounded-xl shadow transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                title="تحديد موقعي الحالي بأعلى دقة قمر صناعي GPS"
              >
                {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5 fill-slate-950" />}
                <span>{isLocating ? 'جاري التحديد...' : 'موقعي الفعلي'}</span>
              </button>
            )}

            {/* Fullscreen Expand / Minimize Button */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                isExpanded
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg'
                  : 'bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] border-[var(--border-color)]'
              }`}
              title={isExpanded ? 'إنهاء وضع الشاشة الكاملة' : 'توسيع الخريطة ملء الشاشة'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 🔍 Search & Quick Jump / Paste Box */}
        {mode === 'picker' && (
          <div className="relative bg-[var(--map-header-bg)] px-3 py-2 border-b border-[var(--map-header-border)] z-30">
            <div className="relative flex items-center">
              <Search className="absolute right-3 w-4 h-4 text-amber-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchResults(true);
                }}
                placeholder="🔍 ابحث عن اسم شارع أو ميدان، أو الصق إحداثيات أو رابط جوجل ماب مباشرة..."
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold rounded-xl pr-9 pl-8 py-2 focus:outline-none focus:border-amber-500 shadow-inner"
              />
              {isSearching && (
                <Loader2 className="absolute left-8 w-4 h-4 text-amber-500 animate-spin" />
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  className="absolute left-2.5 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search Suggestions Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full right-3 left-3 mt-1 bg-slate-950/95 border border-amber-500/40 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-40 max-h-60 overflow-y-auto divide-y divide-slate-800">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-right p-3 hover:bg-amber-500/20 text-xs text-white transition-colors flex items-start gap-2 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-300">{item.displayName.split(',')[0]}</div>
                      <div className="text-[11px] text-slate-300 line-clamp-1">{item.displayName}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* High-Performance Canvas Container */}
        <div className="relative w-full overflow-hidden flex-1">
          <div
            ref={containerRef}
            className={`w-full ${mapHeight} z-10 cursor-crosshair`}
          />

          {/* 🎯 Precision Center Reticle Crosshair (Overlay in center of screen) */}
          {centerReticleActive && mode === 'picker' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
              <div className="relative flex items-center justify-center">
                {/* Outer Crosshair Ring */}
                <div className="w-16 h-16 rounded-full border-2 border-amber-400/80 border-dashed animate-spin-slow flex items-center justify-center shadow-2xl bg-amber-500/10" />
                {/* Center Cross lines */}
                <div className="absolute w-24 h-0.5 bg-amber-400/90" />
                <div className="absolute h-24 w-0.5 bg-amber-400/90" />
                {/* Center Dot */}
                <div className="absolute w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-950 shadow-lg" />
              </div>
            </div>
          )}

          {/* FLOATING CONTROLS TOOLBAR OVER MAP */}
          {/* 1. Zoom, Center Pin, & Reset Controls (Top Right Overlay) */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
            <button
              type="button"
              onClick={handleZoomIn}
              className="bg-[var(--map-control-bg)] hover:bg-amber-500 text-[var(--map-control-text)] hover:text-slate-950 p-2 rounded-xl border border-[var(--map-control-border)] shadow-xl transition-all font-bold text-xs flex items-center justify-center active:scale-95 cursor-pointer"
              title="تكبير الخريطة (+)"
            >
              <ZoomIn className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={handleZoomOut}
              className="bg-[var(--map-control-bg)] hover:bg-amber-500 text-[var(--map-control-text)] hover:text-slate-950 p-2 rounded-xl border border-[var(--map-control-border)] shadow-xl transition-all font-bold text-xs flex items-center justify-center active:scale-95 cursor-pointer"
              title="تصغير الخريطة (-)"
            >
              <ZoomOut className="w-4 h-4 stroke-[2.5]" />
            </button>

            {mode === 'picker' && (
              <button
                type="button"
                onClick={handlePinCenterOfMap}
                className="bg-[var(--map-control-bg)] hover:bg-amber-500 text-amber-500 hover:text-slate-950 p-2 rounded-xl border border-[var(--map-control-border)] shadow-xl transition-all font-bold text-xs flex items-center justify-center active:scale-95 cursor-pointer"
                title="تثبيت الدبوس في منتصف شاشة الخريطة الحالية"
              >
                <Target className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}

            {mode === 'picker' && (
              <button
                type="button"
                onClick={() => setCenterReticleActive(!centerReticleActive)}
                className={`p-2 rounded-xl border shadow-xl transition-all font-bold text-xs flex items-center justify-center active:scale-95 cursor-pointer ${
                  centerReticleActive
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-[var(--map-control-bg)] hover:bg-amber-500/20 text-amber-500 border-[var(--map-control-border)]'
                }`}
                title="تفعيل/إلغاء علامة التصويب الدقيقة (Crosshair Target)"
              >
                <Crosshair className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}

            <button
              type="button"
              onClick={handleResetPosition}
              className="bg-[var(--map-control-bg)] hover:bg-amber-500/10 text-amber-500 p-2 rounded-xl border border-[var(--map-control-border)] shadow-xl transition-all font-bold text-xs flex items-center justify-center active:scale-95 mt-1 cursor-pointer"
              title="إعادة ضبط الموضع للمركز"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* 2. D-PAD Directional Pan Movement Controls (Top Left Overlay) */}
          <div className="absolute top-3 left-3 bg-[var(--map-control-bg)] border border-[var(--map-control-border)] p-1.5 rounded-2xl shadow-2xl backdrop-blur-md z-20 flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">تحريك دقيق</span>

            <button
              type="button"
              onClick={() => handlePan('up')}
              className="bg-[var(--input-bg)] hover:bg-amber-500 text-[var(--map-control-text)] hover:text-slate-950 p-1.5 rounded-lg border border-[var(--map-control-border)] transition-colors cursor-pointer"
              title="تحريك لأعلى"
            >
              <ChevronUp className="w-4 h-4 stroke-[3]" />
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePan('left')}
                className="bg-[var(--input-bg)] hover:bg-amber-500 text-[var(--map-control-text)] hover:text-slate-950 p-1.5 rounded-lg border border-[var(--map-control-border)] transition-colors cursor-pointer"
                title="تحريك لليسار"
              >
                <ChevronLeft className="w-4 h-4 stroke-[3]" />
              </button>

              <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-bold">
                <Crosshair className="w-3 h-3" />
              </div>

              <button
                type="button"
                onClick={() => handlePan('right')}
                className="bg-[var(--input-bg)] hover:bg-amber-500 text-[var(--map-control-text)] hover:text-slate-950 p-1.5 rounded-lg border border-[var(--map-control-border)] transition-colors cursor-pointer"
                title="تحريك لليمين"
              >
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handlePan('down')}
              className="bg-[var(--input-bg)] hover:bg-amber-500 text-[var(--map-control-text)] hover:text-slate-950 p-1.5 rounded-lg border border-[var(--map-control-border)] transition-colors cursor-pointer"
              title="تحريك لأسفل"
            >
              <ChevronDown className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Selected Business Card Drawer on Map View */}
          {mode === 'view' && selectedBiz && (
            <div className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3 right-2.5 sm:right-3 bg-slate-950/95 border border-amber-500/40 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-xl z-30 flex flex-col gap-2.5 animate-fade-in-scale">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/40">
                      {selectedBiz.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedBiz.verificationStatus === 'verified'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {selectedBiz.verificationStatus === 'verified' ? 'موثق ومبثوث' : 'قيد المراجعة'}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white mt-1.5">{selectedBiz.nameAr}</h3>
                  <p className="text-xs text-slate-300 font-medium">
                    {selectedBiz.governorate} - {selectedBiz.city} {selectedBiz.street ? `(${selectedBiz.street})` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBiz(null)}
                  className="text-slate-400 hover:text-white text-xs font-black w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="إغلاق"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-mono text-xs">
                  <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{selectedBiz.ownerPhone || 'لا يوجد هاتف'}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {onEditBusiness && (
                    <button
                      type="button"
                      onClick={() => onEditBusiness(selectedBiz)}
                      className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-[11px] font-black px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 shadow cursor-pointer transition-transform active:scale-95"
                      title="عرض وتعديل كافة البيانات في نافذة خاصة"
                    >
                      <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>عرض وتعديل</span>
                    </button>
                  )}
                  {selectedBiz.ownerPhone && (
                    <a
                      href={`https://wa.me/20${selectedBiz.ownerPhone.replace(/^0/, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 sm:flex-none bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-[11px] font-black px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 transition-colors"
                    >
                      واتساب
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedBiz.lat},${selectedBiz.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 border border-slate-700 transition-colors"
                  >
                    <span>جوجل ماب</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* GPS Coordinates & Footer Toolbar */}
        <div className="bg-[var(--map-footer-bg)] p-2.5 sm:p-3 border-t border-[var(--map-header-border)] flex flex-wrap items-center justify-between gap-2 text-xs z-20">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[var(--text-muted)] font-bold text-[11px]">الإحداثيات الحالية:</span>
            <span className="font-mono bg-[var(--map-coord-bg)] px-2.5 py-1 rounded-xl border border-[var(--border-color)] text-[var(--map-coord-text)] font-black tracking-wide dir-ltr text-xs">
              {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
            </span>
            <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">
              تكبير: {zoomLevel}x
            </span>
            {gpsAccuracy !== null && (
              <span className="text-[10px] font-black text-sky-400 bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>دقة GPS: ±{gpsAccuracy}متر</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCoords}
              className="flex items-center gap-1 bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] px-2.5 py-1.5 rounded-xl border border-[var(--border-color)] transition-all font-bold text-[11px] cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الإحداثيات'}</span>
            </button>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-950 font-black text-[11px] bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 px-3 py-1.5 rounded-xl shadow transition-transform active:scale-95"
            >
              <span>مطابقة وفتح في جوجل ماب</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
