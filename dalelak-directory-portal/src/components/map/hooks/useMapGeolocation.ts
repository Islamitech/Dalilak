import { useState, useRef, useEffect, useCallback } from 'react';

export interface UseMapGeolocationProps {
  updateSelectedPosition: (lat: number, lng: number, flyTo?: boolean, customZoom?: number) => Promise<void>;
  setGpsAccuracy: (acc: number | null) => void;
}

export const useMapGeolocation = ({
  updateSelectedPosition,
  setGpsAccuracy,
}: UseMapGeolocationProps) => {
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<any>(null);
  const updateSelectedPositionRef = useRef(updateSelectedPosition);
  const setGpsAccuracyRef = useRef(setGpsAccuracy);

  useEffect(() => {
    updateSelectedPositionRef.current = updateSelectedPosition;
    setGpsAccuracyRef.current = setGpsAccuracy;
  }, [updateSelectedPosition, setGpsAccuracy]);

  const clearPending = useCallback(() => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPending();
    };
  }, [clearPending]);

  // 🎯 Ultra-Precision Satellite GPS Locator (Multi-Sample Convergence)
  const handleGetLocation = useCallback(() => {
    clearPending();
    setIsLocating(true);
    setGpsAccuracyRef.current(null);

    if (!('geolocation' in navigator)) {
      setIsLocating(false);
      alert('خدمة تحديد الموقع GPS غير مدعومة على هذا المتصفح.');
      return;
    }

    let isFinalized = false;
    let bestPosition: GeolocationPosition | null = null;
    let sampleCount = 0;

    const finalizePosition = (pos: GeolocationPosition) => {
      if (isFinalized) return;
      isFinalized = true;
      clearPending();
      setIsLocating(false);

      const uLat = Number(pos.coords.latitude.toFixed(6));
      const uLng = Number(pos.coords.longitude.toFixed(6));
      const acc = Math.round(pos.coords.accuracy);

      setGpsAccuracyRef.current(acc);
      updateSelectedPositionRef.current(uLat, uLng, true, 18);
    };

    // Watch Position convergence over up to 3.5 seconds
    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          if (isFinalized) return;
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
          if (isFinalized) return;
          console.warn('High precision GPS error, falling back:', error);
          if (bestPosition) {
            finalizePosition(bestPosition);
          } else {
            // Last single attempt
            navigator.geolocation.getCurrentPosition(
              (pos) => finalizePosition(pos),
              () => {
                if (isFinalized) return;
                isFinalized = true;
                clearPending();
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
    } catch {
      setIsLocating(false);
    }

    // Timeout safety to lock the best reading obtained within 4.5 seconds
    timeoutIdRef.current = setTimeout(() => {
      if (!isFinalized) {
        if (bestPosition) {
          finalizePosition(bestPosition);
        } else {
          isFinalized = true;
          clearPending();
          setIsLocating(false);
        }
      }
    }, 4500);
  }, [clearPending]);

  return {
    isLocating,
    handleGetLocation,
  };
};
