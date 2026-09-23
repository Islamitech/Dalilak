/**
 * 🚗 Hadayek Al-Ahram Real Road Routing Engine
 * Fetches actual turn-by-turn road geometry using OpenStreetMap / OSRM routing
 */

export interface RealRoadRouteResult {
  points: [number, number][]; // [lat, lng] array
  distanceMeters: number;
  durationSeconds: number;
}

const routeCache = new Map<string, RealRoadRouteResult>();

export async function fetchRealRoadRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RealRoadRouteResult | null> {
  const cacheKey = `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}->${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return null;
    const data = await res.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const rawCoords: [number, number][] = route.geometry.coordinates; // [lng, lat]
      // Leaflet requires [lat, lng]
      const points: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);

      const result: RealRoadRouteResult = {
        points,
        distanceMeters: Math.round(route.distance),
        durationSeconds: Math.round(route.duration),
      };

      routeCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn('[RoutingEngine] Real road routing lookup failed, falling back to direct line:', err);
  }

  return null;
}
