import React, { useState, useEffect, useRef } from 'react';
import { Business } from '../types';
import { fetchLocationAddress, LocationAddressData } from '../utils/geocoding';
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
} from 'lucide-react';

declare global {
  interface Window {
    L: any;
  }
}

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
  heightClass = 'h-[360px]',
}) => {
  const [currentLat, setCurrentLat] = useState<number>(lat);
  const [currentLng, setCurrentLng] = useState<number>(lng);
  const [zoomLevel, setZoomLevel] = useState<number>(15);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedGovFilter, setSelectedGovFilter] = useState<string>('all');
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  useEffect(() => {
    setCurrentLat(lat);
    setCurrentLng(lng);
  }, [lat, lng]);

  // Ensure Leaflet is loaded and initialize ultra-fast interactive map
  useEffect(() => {
    let isSubscribed = true;

    const initMap = () => {
      if (!containerRef.current || !window.L || leafletMapRef.current) return;

      // Create Leaflet Map instance with hardware accelerated WebGL/Canvas rendering
      const map = window.L.map(containerRef.current, {
        center: [currentLat, currentLng],
        zoom: zoomLevel,
        zoomControl: false,
        attributionControl: false,
      });

      // Add high-performance sleek CartoDB Voyager tiles
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Group for markers
      const markersGroup = window.L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      leafletMapRef.current = map;

      // Handle map movement end (when user finishes drag or pan)
      map.on('moveend', async () => {
        if (!isSubscribed) return;
        const center = map.getCenter();
        const newLat = Number(center.lat.toFixed(6));
        const newLng = Number(center.lng.toFixed(6));
        const newZoom = map.getZoom();

        setCurrentLat(newLat);
        setCurrentLng(newLng);
        setZoomLevel(newZoom);

        if (mode === 'picker' && onLocationSelect) {
          const addrDetails = await fetchLocationAddress(newLat, newLng);
          onLocationSelect(newLat, newLng, addrDetails);
        }
      });

      // Handle direct map click in picker mode
      map.on('click', async (e: any) => {
        if (mode !== 'picker') return;
        const newLat = Number(e.latlng.lat.toFixed(6));
        const newLng = Number(e.latlng.lng.toFixed(6));

        map.panTo([newLat, newLng], { animate: true, duration: 0.4 });
        setCurrentLat(newLat);
        setCurrentLng(newLng);

        if (onLocationSelect) {
          const addrDetails = await fetchLocationAddress(newLat, newLng);
          onLocationSelect(newLat, newLng, addrDetails);
        }
      });
    };

    // Load Leaflet dynamically if not loaded yet
    if (window.L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        if (isSubscribed) initMap();
      };
      document.head.appendChild(script);
    }

    return () => {
      isSubscribed = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mode]);

  // Update Markers dynamically when business list, filters, or mode changes
  useEffect(() => {
    const map = leafletMapRef.current;
    const markersGroup = markersGroupRef.current;

    if (!map || !markersGroup || !window.L) return;

    markersGroup.clearLayers();

    if (mode === 'picker') {
      // Create glowing Picker Marker at current center
      const pickerIcon = window.L.divIcon({
        className: 'custom-picker-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background: #f59e0b; color: #020617; font-weight: 900; font-size: 10px; padding: 2px 8px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); white-space: nowrap; margin-bottom: 4px;">
              الموقع المحدد للنشاط
            </div>
            <div style="width: 36px; height: 36px; background: rgba(245, 158, 11, 0.3); border-radius: 9999px; display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#f59e0b" stroke="#fef08a" stroke-width="2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5" fill="#0f172a"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [36, 48],
        iconAnchor: [18, 48],
      });

      const marker = window.L.marker([currentLat, currentLng], {
        icon: pickerIcon,
        draggable: true,
      });

      marker.on('dragend', async (e: any) => {
        const ll = e.target.getLatLng();
        const newLat = Number(ll.lat.toFixed(6));
        const newLng = Number(ll.lng.toFixed(6));
        setCurrentLat(newLat);
        setCurrentLng(newLng);

        if (onLocationSelect) {
          const addrDetails = await fetchLocationAddress(newLat, newLng);
          onLocationSelect(newLat, newLng, addrDetails);
        }
      });

      markersGroup.addLayer(marker);
    } else {
      // View Mode: Render all Businesses as native 60fps Leaflet markers
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
          map.flyTo([biz.lat, biz.lng], 16, { duration: 0.8 });
          if (onSelectBusiness) onSelectBusiness(biz);
        });

        markersGroup.addLayer(marker);
      });
    }
  }, [mode, businesses, selectedGovFilter, currentLat, currentLng]);

  // Map Invalidations on Resize, Fullscreen Toggle, or Container Dimension Changes
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

    const timer = setTimeout(handleResize, 250);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, [isExpanded]);

  // GPS Geolocation Handler
  const handleGetLocation = () => {
    setIsLocating(true);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLat = Number(position.coords.latitude.toFixed(6));
          const userLng = Number(position.coords.longitude.toFixed(6));

          setCurrentLat(userLat);
          setCurrentLng(userLng);
          setIsLocating(false);

          if (leafletMapRef.current) {
            leafletMapRef.current.flyTo([userLat, userLng], 16, { duration: 1.2 });
          }

          if (onLocationSelect) {
            const addrDetails = await fetchLocationAddress(userLat, userLng);
            onLocationSelect(userLat, userLng, addrDetails);
          }
        },
        async (error) => {
          console.warn('Geolocation fallback to Cairo:', error);
          const randLat = Number((30.0444 + (Math.random() - 0.5) * 0.01).toFixed(6));
          const randLng = Number((31.2357 + (Math.random() - 0.5) * 0.01).toFixed(6));
          setCurrentLat(randLat);
          setCurrentLng(randLng);
          setIsLocating(false);

          if (leafletMapRef.current) {
            leafletMapRef.current.flyTo([randLat, randLng], 16, { duration: 1.2 });
          }

          if (onLocationSelect) {
            const addrDetails = await fetchLocationAddress(randLat, randLng);
            onLocationSelect(randLat, randLng, addrDetails);
          }
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsLocating(false);
      alert('خدمة GPS غير مدعومة على متصفحك.');
    }
  };

  // Directional Pan Controls
  const handlePan = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!leafletMapRef.current) return;
    const offset = 150;
    const panMap: Record<string, [number, number]> = {
      up: [0, -offset],
      down: [0, offset],
      left: [-offset, 0],
      right: [offset, 0],
    };
    leafletMapRef.current.panBy(panMap[direction], { animate: true, duration: 0.3 });
  };

  // Zoom Controls
  const handleZoomIn = () => leafletMapRef.current?.zoomIn();
  const handleZoomOut = () => leafletMapRef.current?.zoomOut();

  // Reset Position to default Cairo
  const handleResetPosition = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([lat, lng], 15, { duration: 1.0 });
    }
  };

  // Governorate Select & Smooth FlyTo
  const handleGovChange = async (govName: string) => {
    setSelectedGovFilter(govName);
    if (govName !== 'all' && GOVERNORATE_COORDS[govName]) {
      const coords = GOVERNORATE_COORDS[govName];
      setCurrentLat(coords.lat);
      setCurrentLng(coords.lng);

      if (leafletMapRef.current) {
        leafletMapRef.current.flyTo([coords.lat, coords.lng], 13, { duration: 1.2 });
      }

      if (mode === 'picker' && onLocationSelect) {
        const addrDetails = await fetchLocationAddress(coords.lat, coords.lng);
        onLocationSelect(coords.lat, coords.lng, { ...addrDetails, governorate: govName });
      }
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
    ? 'fixed inset-2 sm:inset-6 z-50 bg-[var(--bg-card)] border-2 border-amber-500/50 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-scale'
    : 'bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl flex flex-col transition-colors duration-300';

  const mapHeight = isExpanded ? 'flex-1 h-full min-h-[450px]' : heightClass;

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
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40"
        />
      )}

      <div className={containerClasses}>
        {/* Map Header Bar */}
        <div className="bg-[var(--map-header-bg)] p-3 border-b border-[var(--map-header-border)] flex flex-wrap items-center justify-between gap-2 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow">
              <MapPin className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
                <span>{mode === 'picker' ? 'تحديد وتوجيه موقع النشاط على الخريطة' : 'خريطة الأنشطة والتوثيق الميداني المباشر'}</span>
                <span className="bg-emerald-500/15 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  <span>تفاعل خارق وسريع 60 FPS</span>
                </span>
              </h4>
              <p className="text-[10px] text-amber-400 font-medium">
                {mode === 'picker'
                  ? 'اسحب الخريطة أو الدبوس مباشرة بأي اتجاه للتحديد الفوري دون أي تأخير'
                  : `إجمالي ${filteredBusinessesCount} نشاط تجاري على الخريطة التفاعلية`}
              </p>
            </div>
          </div>

          {/* Controls Bar Right Side */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Governorate Switcher Dropdown */}
            <select
              value={selectedGovFilter}
              onChange={(e) => handleGovChange(e.target.value)}
              className="bg-[var(--input-bg)] hover:bg-amber-500/10 border border-[var(--border-color)] text-amber-600 dark:text-amber-300 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
              title="الانتقال المباشر للمحافظة"
            >
              <option value="all">كل المحافظات (التنقل السريع)</option>
              {Object.keys(GOVERNORATE_COORDS).map((g) => (
                <option key={g} value={g}>
                  📍 محافظة {g}
                </option>
              ))}
            </select>

            {/* GPS Locator Button */}
            {mode === 'picker' && (
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl shadow transition-all active:scale-95 disabled:opacity-50"
              >
                <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'جاري التحديد...' : 'موقعي الحالي'}</span>
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

        {/* High-Performance Canvas Container */}
        <div className="relative w-full overflow-hidden flex-1">
          <div
            ref={containerRef}
            className={`w-full ${mapHeight} z-10 cursor-grab active:cursor-grabbing`}
          />

          {/* FLOATING CONTROLS TOOLBAR OVER MAP */}
          {/* 1. Zoom & Reset Controls (Top Right Overlay) */}
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
            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">تحريك مباشر</span>

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
        <div className="bg-[var(--map-footer-bg)] p-3 border-t border-[var(--map-header-border)] flex flex-wrap items-center justify-between gap-2 text-xs z-20">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-muted)] font-medium">الإحداثيات الحالية:</span>
            <span className="font-mono bg-[var(--map-coord-bg)] px-2.5 py-1 rounded-xl border border-[var(--border-color)] text-[var(--map-coord-text)] font-bold tracking-wide dir-ltr">
              {currentLat.toFixed(6)}, {currentLng.toFixed(6)} (مستوى التكبير: {zoomLevel}x)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCoords}
              className="flex items-center gap-1 bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] px-2.5 py-1.5 rounded-xl border border-[var(--border-color)] transition-all font-medium text-[11px] cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الإحداثيات'}</span>
            </button>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-amber-400 hover:text-amber-300 hover:underline font-bold text-[11px] bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30"
            >
              <span>فتح مباشر في جوجل ماب</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
