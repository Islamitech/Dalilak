/**
 * 🎥 Single Camera Movement Coordinator & Decision Engine
 * 
 * Central authoritative planner determining if and when camera movements are permitted.
 * Guarantees:
 * 1. Category changes trigger ZERO camera transitions.
 * 2. Zone selection triggers exactly ONE camera transition per unique selection.
 * 3. Clearing zone triggers ONE transition back to Hadayek overview.
 * 4. Selecting a business triggers ONE centering transition.
 */

export interface CameraTransitionDecision {
  shouldMove: boolean;
  type?: 'zone' | 'overview' | 'business';
  targetBounds?: [number, number][];
  targetCenter?: [number, number];
  targetZoom?: number;
  reason: string;
}

export function planCameraTransitionOnZoneChange(
  previousZone: string,
  newZone: string,
  districts?: Array<{ letterAr: string; polygons: [number, number][][] }>
): CameraTransitionDecision {
  const normPrev = (previousZone || '').trim();
  const normNext = (newZone || '').trim();

  // Repeating the same zone triggers ZERO transitions
  if (normPrev === normNext) {
    return {
      shouldMove: false,
      reason: 'Zone unchanged; camera remains stable.',
    };
  }

  // Zone selected
  if (normNext !== '') {
    const targetDistrict = districts?.find((d) => d.letterAr === normNext);
    const bounds = targetDistrict?.polygons?.[0];

    return {
      shouldMove: true,
      type: 'zone',
      targetBounds: bounds,
      reason: `Zone changed from "${normPrev}" to "${normNext}"; framing zone boundaries.`,
    };
  }

  // Zone cleared -> Return to Hadayek overview
  return {
    shouldMove: true,
    type: 'overview',
    targetCenter: [29.9683, 31.1002],
    targetZoom: 14,
    reason: `Zone cleared; returning camera to Hadayek general overview.`,
  };
}

export function planCameraTransitionOnCategoryChange(
  previousCategory: string,
  newCategory: string
): CameraTransitionDecision {
  // Category change updates pins and cards only; ZERO camera movement
  return {
    shouldMove: false,
    reason: 'Category filter change must never move camera.',
  };
}

export function planCameraTransitionOnBusinessSelect(
  previousBizId: string | null,
  newBizId: string | null,
  bizCoords?: { lat: number; lng: number }
): CameraTransitionDecision {
  if (!newBizId || newBizId === previousBizId) {
    return {
      shouldMove: false,
      reason: 'No business selected or selection unchanged.',
    };
  }

  if (bizCoords && typeof bizCoords.lat === 'number' && typeof bizCoords.lng === 'number') {
    return {
      shouldMove: true,
      type: 'business',
      targetCenter: [bizCoords.lat, bizCoords.lng],
      targetZoom: 17,
      reason: `Centering on newly selected business ${newBizId}.`,
    };
  }

  return {
    shouldMove: false,
    reason: 'Business coordinates missing.',
  };
}
