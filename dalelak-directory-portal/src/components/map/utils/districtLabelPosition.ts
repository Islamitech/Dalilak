import { isPointInPolygon, type HadayekOfficialDistrict } from '../../../data/hadayekDistrictsGeoData';

const positions = new Map<number, [number, number]>();

/** Stable interior label anchor, maximizing distance from the district boundary.
 * Coordinates stay geographic: panning/zooming must never reposition a label.
 */
export function getDistrictLabelPosition(district: HadayekOfficialDistrict): [number, number] {
  const cached = positions.get(district.id);
  if (cached) return cached;
  let best: [number, number] = [district.centerLat, district.centerLng];
  let bestDistance = -1;
  const scale = Math.cos(district.centerLat * Math.PI / 180);
  for (const ring of district.polygons) {
    if (ring.length < 3) continue;
    let south = Math.min(...ring.map(p => p[0]));
    let north = Math.max(...ring.map(p => p[0]));
    let west = Math.min(...ring.map(p => p[1]));
    let east = Math.max(...ring.map(p => p[1]));
    let ringBest: [number, number] = ring[0];
    let ringDistance = -1;
    for (let pass = 0; pass < 3; pass++) {
      const dy = (north - south) / 24;
      const dx = (east - west) / 24;
      if (!dy || !dx) break;
      for (let row = 0; row < 24; row++) for (let col = 0; col < 24; col++) {
        const lat = south + (row + .5) * dy;
        const lng = west + (col + .5) * dx;
        if (!isPointInPolygon(lat, lng, ring)) continue;
        let distance = Infinity;
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i], b = ring[(i + 1) % ring.length];
          const x = (b[1] - a[1]) * scale, y = b[0] - a[0];
          const px = (lng - a[1]) * scale, py = lat - a[0];
          const t = x || y ? Math.max(0, Math.min(1, (px * x + py * y) / (x * x + y * y))) : 0;
          distance = Math.min(distance, (px - t * x) ** 2 + (py - t * y) ** 2);
        }
        if (distance > ringDistance) { ringDistance = distance; ringBest = [lat, lng]; }
      }
      south = ringBest[0] - dy; north = ringBest[0] + dy;
      west = ringBest[1] - dx; east = ringBest[1] + dx;
    }
    if (ringDistance > bestDistance) { bestDistance = ringDistance; best = ringBest; }
  }
  positions.set(district.id, best);
  return best;
}
