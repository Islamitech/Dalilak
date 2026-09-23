import React, { useState, useEffect } from 'react';
import {
  Navigation,
  MapPin,
  Car,
  Footprints,
  ExternalLink,
  X,
  Compass,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { HADAYEK_OFFICIAL_GATES, HadayekOfficialGate } from '../../data/hadayekDistrictsGeoData';
import { calculateDirectDistanceMeters, formatHadayekDistance } from '../../data/hadayekAtlasData';
import { fetchRealRoadRoute, RealRoadRouteResult } from '../../utils/hadayekRouting';

export interface NavigationTarget {
  title: string;
  lat: number;
  lng: number;
  type: 'building' | 'business';
  details?: string;
}

export interface InAppNavigationDrawerProps {
  target: NavigationTarget | null;
  onClose: () => void;
  onUpdateRoute?: (route: {
    origin: { lat: number; lng: number; label: string };
    destination: { lat: number; lng: number; label: string };
    points?: [number, number][];
    distanceMeters?: number;
    durationSeconds?: number;
  } | null) => void;
}

export const InAppNavigationDrawer: React.FC<InAppNavigationDrawerProps> = ({
  target,
  onClose,
  onUpdateRoute,
}) => {
  if (!target) return null;

  const [originType, setOriginType] = useState<'gps' | 'gate' | 'custom'>('gps');
  const [selectedGateId, setSelectedGateId] = useState<string>('gate_1');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGettingGps, setIsGettingGps] = useState<boolean>(false);
  const [realRouteData, setRealRouteData] = useState<RealRoadRouteResult | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);

  // Get user GPS location
  const fetchGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('خاصية تحديد الموقع الجغرافي غير مدعومة في متصفحك.');
      setOriginType('gate');
      return;
    }

    setIsGettingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsGettingGps(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGpsError('تعذر تحديد موقعك الحالي عبر GPS. يرجى تفعيل إذن الموقع أو اختيار نقطة البداية يدوياً.');
        setIsGettingGps(false);
        setOriginType('gate');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  useEffect(() => {
    if (originType === 'gps' && !gpsCoords && !isGettingGps) {
      fetchGpsLocation();
    }
  }, [originType]);

  // Determine active origin point
  const currentOrigin = React.useMemo<{ lat: number; lng: number; label: string } | null>(() => {
    if (originType === 'gps' && gpsCoords) {
      return {
        lat: gpsCoords.lat,
        lng: gpsCoords.lng,
        label: 'موقعي الجغرافي الحالي (GPS)',
      };
    }
    if (originType === 'gate') {
      const gate = HADAYEK_OFFICIAL_GATES.find((g) => g.id === selectedGateId) || HADAYEK_OFFICIAL_GATES[0];
      return {
        lat: gate.lat,
        lng: gate.lng,
        label: gate.popularNameAr,
      };
    }
    return null;
  }, [originType, gpsCoords, selectedGateId]);

  // Fetch real road geometry and update route
  useEffect(() => {
    let isMounted = true;
    if (!currentOrigin || !target) {
      setRealRouteData(null);
      if (onUpdateRoute) onUpdateRoute(null);
      return;
    }

    setIsLoadingRoute(true);
    fetchRealRoadRoute(currentOrigin, { lat: target.lat, lng: target.lng }).then((route) => {
      if (!isMounted) return;
      setIsLoadingRoute(false);
      if (route) {
        setRealRouteData(route);
        if (onUpdateRoute) {
          onUpdateRoute({
            origin: currentOrigin,
            destination: {
              lat: target.lat,
              lng: target.lng,
              label: target.title,
            },
            points: route.points,
            distanceMeters: route.distanceMeters,
            durationSeconds: route.durationSeconds,
          });
        }
      } else {
        setRealRouteData(null);
        if (onUpdateRoute) {
          onUpdateRoute({
            origin: currentOrigin,
            destination: {
              lat: target.lat,
              lng: target.lng,
              label: target.title,
            },
          });
        }
      }
    });

    return () => { isMounted = false; };
  }, [currentOrigin, target]);

  // Calculate Distance & Times from real roads
  const stats = React.useMemo(() => {
    if (!currentOrigin) return null;
    if (realRouteData) {
      return {
        distanceText: formatHadayekDistance(realRouteData.distanceMeters),
        drivingMinutes: Math.max(1, Math.round(realRouteData.durationSeconds / 60)),
        walkingMinutes: Math.max(2, Math.round((realRouteData.distanceMeters * 1.05) / ((4.5 * 1000) / 60))),
        isRealRoad: true,
      };
    }

    const directMeters = calculateDirectDistanceMeters(
      currentOrigin.lat,
      currentOrigin.lng,
      target.lat,
      target.lng
    );

    const roadDistanceMeters = Math.round(directMeters * 1.35);
    const drivingMinutes = Math.max(1, Math.round(roadDistanceMeters / ((25 * 1000) / 60)));
    const walkingMinutes = Math.max(2, Math.round((directMeters * 1.25) / ((4.5 * 1000) / 60)));

    return {
      distanceText: formatHadayekDistance(roadDistanceMeters),
      drivingMinutes,
      walkingMinutes,
      isRealRoad: false,
    };
  }, [currentOrigin, target, realRouteData]);

  const handleEndNavigation = () => {
    if (onUpdateRoute) onUpdateRoute(null);
    onClose();
  };

  const handleOpenGoogleMapsVoiceNav = () => {
    if (!currentOrigin) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentOrigin.lat},${currentOrigin.lng}&destination=${target.lat},${target.lng}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="absolute bottom-2.5 sm:bottom-4 left-2.5 sm:left-4 right-2.5 sm:right-4 max-w-2xl mx-auto bg-white border-2 border-slate-200/90 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-2xl z-[1100] flex flex-col gap-3.5 animate-slide-up text-slate-900 select-none font-['Cairo',sans-serif]"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black bg-amber-100 text-amber-950 px-2 py-0.5 rounded-full border border-amber-300">
                الملاحة الذكية
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {target.type === 'building' ? '🏢 مبنى' : '🏪 منشأة معتمدة'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              التوجيه إلى: {target.title}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleEndNavigation}
          className="text-slate-400 hover:text-slate-700 text-xs font-black w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center cursor-pointer transition-colors shrink-0"
          title="إنهاء الملاحة"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Origin Selection: GPS vs Manual Gate */}
      <div className="space-y-2">
        <label className="text-xs font-black text-slate-700 block">
          نقطة الانطلاق (البداية):
        </label>
        <div className="grid grid-cols-2 gap-2">
          {/* GPS Button */}
          <button
            type="button"
            onClick={() => {
              setOriginType('gps');
              if (!gpsCoords) fetchGpsLocation();
            }}
            className={`p-2.5 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              originType === 'gps'
                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-sm ring-1 ring-emerald-400'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isGettingGps ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <MapPin className="w-4 h-4 text-emerald-600" />
            )}
            <span>موقعي الحالي (GPS)</span>
          </button>

          {/* Manual Gate Button */}
          <button
            type="button"
            onClick={() => setOriginType('gate')}
            className={`p-2.5 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              originType === 'gate'
                ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-sm ring-1 ring-amber-400'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-600" />
            <span>نقطة يدوية (بوابة)</span>
          </button>
        </div>

        {/* Gate Selection Dropdown (if manual) */}
        {originType === 'gate' && (
          <div className="mt-2 relative">
            <select
              value={selectedGateId}
              onChange={(e) => setSelectedGateId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl pr-3 pl-8 py-2.5 outline-none cursor-pointer"
              style={{ colorScheme: 'light' }}
            >
              {HADAYEK_OFFICIAL_GATES.map((gate) => (
                <option key={gate.id} value={gate.id}>
                  🚪 {gate.nameAr} - {gate.accessRoadAr.split('/')[0]}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
          </div>
        )}

        {/* GPS Error alert */}
        {originType === 'gps' && gpsError && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}
      </div>

      {/* Route Statistics Bar */}
      {stats && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] text-slate-500 font-bold">المسافة المقدرة</div>
            <div className="text-sm font-black text-slate-900 mt-0.5">{stats.distanceText}</div>
          </div>
          <div className="border-r border-slate-200">
            <div className="text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1">
              <Car className="w-3 h-3 text-amber-600" />
              <span>بالسيارة</span>
            </div>
            <div className="text-sm font-black text-amber-700 mt-0.5">~{stats.drivingMinutes} دقيقة</div>
          </div>
          <div className="border-r border-slate-200">
            <div className="text-[10px] text-slate-500 font-bold flex items-center justify-center gap-1">
              <Footprints className="w-3 h-3 text-blue-600" />
              <span>سيراً</span>
            </div>
            <div className="text-sm font-black text-blue-700 mt-0.5">~{stats.walkingMinutes} دقيقة</div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-slate-100 text-xs font-black">
        <button
          type="button"
          onClick={handleOpenGoogleMapsVoiceNav}
          disabled={!currentOrigin}
          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          title="تتبع المسار مباشرة على خرائط Google"
        >
          <ExternalLink className="w-4 h-4" />
          <span>تتبع المسار مباشرة (افتح خرائط Google)</span>
        </button>

        <button
          type="button"
          onClick={handleEndNavigation}
          className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200"
        >
          <span>إنهاء الملاحة</span>
        </button>
      </div>
    </div>
  );
};
