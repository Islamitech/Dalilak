'use client';

import React, { useEffect, useRef, useSyncExternalStore } from 'react';

interface InteractiveMapProps {
  lat: number;
  lng: number;
  onChangeLocation?: (lat: number, lng: number) => void;
  interactive?: boolean;
  heightClass?: string;
  popupTitle?: string;
}

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function InteractiveMap({
  lat,
  lng,
  onChangeLocation,
  interactive = true,
  heightClass = 'h-72 sm:h-96',
  popupTitle = 'موقع المكان المحدد',
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  const isMounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!isMounted || !mapContainerRef.current) return;

    let isSubscribed = true;

    import('leaflet').then((L) => {
      if (!isSubscribed || !mapContainerRef.current) return;

      const validLat = Number.isFinite(lat) && lat !== 0 ? lat : 30.0444;
      const validLng = Number.isFinite(lng) && lng !== 0 ? lng : 31.2357;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [validLat, validLng],
          zoom: 16,
          zoomControl: true,
          scrollWheelZoom: interactive,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center;">
              <div style="width: 38px; height: 38px; background: #059669; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 10px 25px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 18px; font-weight: bold;">
                📍
              </div>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 38],
          popupAnchor: [0, -38],
        });

        const createPopupContent = (lLat: number, lLng: number, title: string) => `
          <div style="font-family: var(--font-cairo), sans-serif; text-align: right; min-width: 200px; padding: 4px;">
            <h4 style="margin: 0 0 6px 0; font-weight: 800; font-size: 13px; color: #0f172a;">${title}</h4>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 8px; border-radius: 8px; margin-bottom: 8px; direction: ltr; font-family: monospace; font-size: 11px; color: #0f172a; text-align: left;">
              <div><strong style="color: #059669;">LAT:</strong> ${lLat.toFixed(6)}</div>
              <div><strong style="color: #4f46e5;">LNG:</strong> ${lLng.toFixed(6)}</div>
            </div>
            <a href="https://www.google.com/maps/search/?api=1&query=${lLat.toFixed(6)},${lLng.toFixed(6)}" target="_blank" rel="noopener noreferrer" style="display: block; background: #4f46e5; color: #ffffff; text-align: center; padding: 6px 10px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 11px;">
              فتح في خرائط جوجل 🔍
            </a>
          </div>
        `;

        const marker = L.marker([validLat, validLng], {
          draggable: interactive,
          icon: customIcon,
        }).addTo(map);

        marker.bindPopup(createPopupContent(validLat, validLng, popupTitle));

        markerRef.current = marker;
        mapInstanceRef.current = map;

        if (interactive && onChangeLocation) {
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            const nLat = Number(pos.lat.toFixed(6));
            const nLng = Number(pos.lng.toFixed(6));
            marker.setPopupContent(createPopupContent(nLat, nLng, popupTitle)).openPopup();
            onChangeLocation(nLat, nLng);
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          map.on('click', (e: any) => {
            const nLat = Number(e.latlng.lat.toFixed(6));
            const nLng = Number(e.latlng.lng.toFixed(6));
            marker.setLatLng([nLat, nLng]);
            map.panTo([nLat, nLng]);
            marker.setPopupContent(createPopupContent(nLat, nLng, popupTitle)).openPopup();
            onChangeLocation(nLat, nLng);
          });
        }
      } else {
        if (markerRef.current) {
          markerRef.current.setLatLng([validLat, validLng]);
          mapInstanceRef.current.panTo([validLat, validLng]);
        }
      }
    });

    return () => {
      isSubscribed = false;
    };
  }, [isMounted, lat, lng, interactive, onChangeLocation, popupTitle]);

  if (!isMounted) {
    return (
      <div className={`w-full ${heightClass} rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400 font-bold`}>
        جاري تحميل الخريطة التفاعلية...
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100">
      <div ref={mapContainerRef} className={`w-full ${heightClass} z-10`} />
      {interactive && (
        <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>انقر على الخريطة أو اسحب الدبوس لتحديث الموقع تلقائياً</span>
        </div>
      )}
    </div>
  );
}
