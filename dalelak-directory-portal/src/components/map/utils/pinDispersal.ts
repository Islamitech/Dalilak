import { Business } from '../../../types';

export interface DispersedPinResult {
  biz: Business;
  originCoord: [number, number];
  dispersedCoord: [number, number];
  pixelOffset: [number, number];
  isCoincident: boolean;
  isDispersed: boolean;
}

/**
 * Calculates geographic distance in kilometers between two GPS points using Haversine formula
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface DisperseOptions {
  cardMode?: boolean;
  cardWidth?: number;
  minSpacing?: number;
}

/**
 * Computes screen-space spiderfy pixel offsets for coincident pins without any geographic distortion.
 * - Leaves biz.lat and biz.lng 100% unchanged (0m geographic offset).
 * - When cardMode is enabled, separates cards with minimum horizontal distance (cardWidth + 12px ~ 196px).
 * - For normal pins: distributes with 20-50px spiderfy radius (concentric rings for large clusters).
 */
export function disperseCoincidentPins(
  businesses: Business[],
  _districtCentroid?: [number, number] | null,
  coincidenceThresholdMeters = 8,
  options?: DisperseOptions
): DispersedPinResult[] {
  if (!businesses || businesses.length === 0) return [];

  const cardWidth = options?.cardWidth || 184;
  const minSpacing = options?.minSpacing || cardWidth + 12;
  const isCardMode = Boolean(options?.cardMode);

  // 1. Group businesses into spatial coincidence clusters (< coincidenceThresholdMeters)
  const clusters: Business[][] = [];
  const visited = new Set<string>();

  for (let i = 0; i < businesses.length; i++) {
    const bA = businesses[i];
    if (visited.has(bA.id)) continue;

    const cluster: Business[] = [bA];
    visited.add(bA.id);

    for (let j = i + 1; j < businesses.length; j++) {
      const bB = businesses[j];
      if (visited.has(bB.id)) continue;

      const distKm = calculateDistanceKm(bA.lat, bA.lng, bB.lat, bB.lng);
      if (distKm * 1000 < coincidenceThresholdMeters) {
        cluster.push(bB);
        visited.add(bB.id);
      }
    }
    clusters.push(cluster);
  }

  // 2. Compute screen-space pixel offsets
  const results: DispersedPinResult[] = [];

  for (const cluster of clusters) {
    const count = cluster.length;

    cluster.forEach((biz, idx) => {
      // Physical GPS coordinate: 100% true and unshifted
      const trueCoord: [number, number] = [biz.lat, biz.lng];

      let pixelOffset: [number, number] = [0, 0];

      if (isCardMode) {
        // Disperse horizontally based on actual card width + 12px margin
        if (count === 2) {
          pixelOffset = idx === 0 ? [-Math.round(minSpacing / 2), 0] : [Math.round(minSpacing / 2), 0];
        } else if (count === 3) {
          const offsets: [number, number][] = [
            [-minSpacing, 0],
            [0, 0],
            [minSpacing, 0],
          ];
          pixelOffset = offsets[idx] || [0, 0];
        } else if (count > 3) {
          const step = minSpacing;
          const start = -((count - 1) * step) / 2;
          pixelOffset = [Math.round(start + idx * step), 0];
        }
      } else {
        // Standard pin spiderfy
        if (count === 2) {
          pixelOffset = idx === 0 ? [-22, 0] : [22, 0];
        } else if (count >= 3 && count <= 4) {
          const radius = 28;
          const angle = (2 * Math.PI * idx) / count - Math.PI / 2;
          pixelOffset = [Math.round(radius * Math.cos(angle)), Math.round(radius * Math.sin(angle))];
        } else if (count >= 5 && count <= 8) {
          const radius = 38;
          const angle = (2 * Math.PI * idx) / count - Math.PI / 2;
          pixelOffset = [Math.round(radius * Math.cos(angle)), Math.round(radius * Math.sin(angle))];
        } else if (count > 8) {
          const innerCount = 6;
          if (idx < innerCount) {
            const radius = 32;
            const angle = (2 * Math.PI * idx) / innerCount - Math.PI / 2;
            pixelOffset = [Math.round(radius * Math.cos(angle)), Math.round(radius * Math.sin(angle))];
          } else {
            const outerIdx = idx - innerCount;
            const outerCount = count - innerCount;
            const radius = 60;
            const angle = (2 * Math.PI * outerIdx) / outerCount - Math.PI / 2 + Math.PI / outerCount;
            pixelOffset = [Math.round(radius * Math.cos(angle)), Math.round(radius * Math.sin(angle))];
          }
        }
      }

      results.push({
        biz,
        originCoord: trueCoord,
        dispersedCoord: trueCoord,
        pixelOffset,
        isCoincident: count > 1,
        isDispersed: count > 1,
      });
    });
  }

  return results;
}

/**
 * Calculates the maximum prominent activity cards that can realistically fit horizontally
 * on the current map canvas without overlapping or getting clipped.
 * - Desktop (>= 768px): 3 cards + cluster
 * - Tablet / Landscape mobile (480px - 767px): 2 cards + cluster
 * - Small mobile (< 480px): 1 card + cluster
 */
export function getResponsiveCardLimit(mapWidth: number): number {
  if (mapWidth >= 768) return 3;
  if (mapWidth >= 480) return 2;
  return 1;
}

/**
 * Computes dynamic screen-space dispersal for activity cards based on actual map projection.
 * - Minimum horizontal distance between two cards: cardWidth + 12px (approx 196px).
 * - Leaves biz.lat and biz.lng 100% unaltered.
 * - Clamps cards within visible screen viewport boundaries (clearing top header bars).
 * - Only recalculated on zoomend and moveend, preserving 60 FPS panning.
 */
export function disperseActivityCardsScreenSpace(
  businesses: Business[],
  map: any,
  options?: {
    cardWidth?: number;
    cardHeight?: number;
    minSpacing?: number;
  }
): Map<string, [number, number]> {
  const offsets = new Map<string, [number, number]>();
  if (!businesses || businesses.length === 0) return offsets;

  const cardWidth = options?.cardWidth || 184;
  const cardHeight = options?.cardHeight || 143;
  const minSpacing = options?.minSpacing || cardWidth + 12;

  if (!map || typeof map.latLngToContainerPoint !== 'function' || typeof map.getSize !== 'function') {
    // If map projection is not ready yet, return zero offsets
    businesses.forEach((b) => offsets.set(b.id, [0, 0]));
    return offsets;
  }

  const containerSize = map.getSize();
  const mapWidth = containerSize.x || 800;
  const mapHeight = containerSize.y || 600;

  // 1. Convert each business GPS coord into screen pixel coordinates
  const items = businesses.map((biz) => {
    const pt = map.latLngToContainerPoint([biz.lat, biz.lng]);
    return {
      id: biz.id,
      biz,
      x: pt.x,
      y: pt.y,
      dx: 0,
      dy: 0,
    };
  });

  // 2. Identify coincident / near-coincident items (within 15px screen distance)
  // and give them an initial symmetrical horizontal spread centered on their anchor
  const visited = new Set<string>();
  for (let i = 0; i < items.length; i++) {
    if (visited.has(items[i].id)) continue;
    const group = [items[i]];
    visited.add(items[i].id);
    for (let j = i + 1; j < items.length; j++) {
      if (!visited.has(items[j].id)) {
        if (Math.hypot(items[i].x - items[j].x, items[i].y - items[j].y) < 15) {
          group.push(items[j]);
          visited.add(items[j].id);
        }
      }
    }
    if (group.length > 1) {
      const k = group.length;
      group.forEach((item, idx) => {
        item.dx = (idx - (k - 1) / 2) * minSpacing;
      });
    }
  }

  // 3. Iterative relaxation to resolve overlaps between adjacent items
  for (let pass = 0; pass < 10; pass++) {
    let hasOverlap = false;
    items.sort((a, b) => (a.x + a.dx) - (b.x + b.dx));

    for (let i = 0; i < items.length - 1; i++) {
      const a = items[i];
      const b = items[i + 1];

      const posX_A = a.x + a.dx;
      const posX_B = b.x + b.dx;
      const distX = posX_B - posX_A;

      const posY_A = a.y + a.dy;
      const posY_B = b.y + b.dy;
      const distY = Math.abs(posY_B - posY_A);

      if (distX < minSpacing && distY < cardHeight) {
        hasOverlap = true;
        const overlap = minSpacing - distX;
        const shift = Math.ceil(overlap / 2);
        a.dx -= shift;
        b.dx += shift;
      }
    }

    if (!hasOverlap) break;
  }

  // 4. Viewport boundaries clamping with spacing preservation
  const padLeft = 12;
  const padRight = 12;
  const padTop = 75; // Space for MapModernTopBar
  const padBottom = 25;

  const minCenterScreenX = padLeft + cardWidth / 2;
  const maxCenterScreenX = mapWidth - padRight - cardWidth / 2;
  const minCenterScreenY = padTop + cardHeight;
  const maxCenterScreenY = mapHeight - padBottom;

  // Left-to-right clamp
  items.sort((a, b) => (a.x + a.dx) - (b.x + b.dx));
  for (let i = 0; i < items.length; i++) {
    const curX = items[i].x + items[i].dx;
    if (curX < minCenterScreenX) {
      items[i].dx += (minCenterScreenX - curX);
    }
    if (i > 0) {
      const prevX = items[i - 1].x + items[i - 1].dx;
      const curXNow = items[i].x + items[i].dx;
      const distY = Math.abs((items[i].y + items[i].dy) - (items[i - 1].y + items[i - 1].dy));
      if (distY < cardHeight && curXNow - prevX < minSpacing) {
        items[i].dx += (minSpacing - (curXNow - prevX));
      }
    }
  }

  // Right-to-left clamp
  for (let i = items.length - 1; i >= 0; i--) {
    const curX = items[i].x + items[i].dx;
    if (curX > maxCenterScreenX) {
      items[i].dx -= (curX - maxCenterScreenX);
    }
    if (i < items.length - 1) {
      const nextX = items[i + 1].x + items[i + 1].dx;
      const curXNow = items[i].x + items[i].dx;
      const distY = Math.abs((items[i].y + items[i].dy) - (items[i + 1].y + items[i + 1].dy));
      if (distY < cardHeight && nextX - curXNow < minSpacing) {
        items[i].dx -= (minSpacing - (nextX - curXNow));
      }
    }
  }

  // Vertical clamp & record final rounded offsets
  items.forEach((item) => {
    const curY = item.y + item.dy;
    if (curY < minCenterScreenY) {
      item.dy += (minCenterScreenY - curY);
    } else if (curY > maxCenterScreenY) {
      item.dy -= (curY - maxCenterScreenY);
    }

    offsets.set(item.id, [Math.round(item.dx), Math.round(item.dy)]);
  });

  return offsets;
}
