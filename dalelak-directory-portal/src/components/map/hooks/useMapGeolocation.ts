import { useState } from 'react';

export interface UseMapGeolocationProps {
  updateSelectedPosition: (lat: number, lng: number, flyTo?: boolean, customZoom?: number) => Promise<void>;
  setGpsAccuracy: (acc: number | null) => void;
}

export const useMapGeolocation = ({
  updateSelectedPosition,
  setGpsAccuracy,
}: UseMapGeolocationProps) => {
  const [isLocating, setIsLocating] = useState<boolean>(false);

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

        // If satellite lock achieved high precision (<= 8 meters) or sampled enough
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

    // Timeout safety to lock the best reading obtained within 4.5 seconds
    setTimeout(() => {
      if (isLocating && bestPosition) {
        finalizePosition(bestPosition);
      } else if (isLocating) {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        setIsLocating(false);
      }
    }, 4500);
  };

  return {
    isLocating,
    handleGetLocation,
  };
};
