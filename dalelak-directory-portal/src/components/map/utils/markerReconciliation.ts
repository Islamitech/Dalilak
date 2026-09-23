/**
 * 📍 Marker Registry Reconciliation Engine
 * 
 * Manages incremental updates to Leaflet markers:
 * 1. Computes composite icon keys reflecting all visible properties (name, photo, category, rating, working hours, offset).
 * 2. Retains identical Marker instances across non-affecting re-renders without DOM destruction.
 * 3. Triggers icon updates only when relevant properties change.
 * 4. Ensures Click Handlers always refer to the latest Business data.
 */

import { Business } from '../../../types';

export interface MarkerRegistryEntry<TMarker = any> {
  marker: TMarker;
  biz: Business;
  iconKey: string;
}

export function computeMarkerIconKey(
  biz: Business,
  idx: number,
  offset: [number, number],
  mode: 'card' | 'compact' | 'selected' = 'card'
): string {
  const photo = biz.coverPhoto || biz.photos?.[0] || '';
  const rating = biz.googleRating ?? biz.rating ?? '';
  const hours = biz.workingHours || '';
  const name = biz.nameAr || biz.name || '';
  const cat = biz.category || '';
  const status = biz.verificationStatus || '';

  return `${mode}_${biz.id}_${idx}_${offset[0]}_${offset[1]}_${name}_${cat}_${photo}_${hours}_${status}_${rating}`;
}

export interface ReconcileResult<TMarker> {
  added: string[];
  retained: string[];
  updated: string[];
  removed: string[];
}

export function reconcileMarkerRegistry<TMarker>(
  registry: Map<string, MarkerRegistryEntry<TMarker>>,
  targetItems: Array<{ biz: Business; idx: number; offset: [number, number]; mode?: 'card' | 'compact' | 'selected' }>,
  callbacks: {
    createMarker: (biz: Business, idx: number, iconKey: string) => TMarker;
    updateMarkerIcon: (marker: TMarker, biz: Business, iconKey: string) => void;
    removeMarker: (marker: TMarker, id: string) => void;
  }
): ReconcileResult<TMarker> {
  const targetIds = new Set(targetItems.map((item) => item.biz.id));
  const added: string[] = [];
  const retained: string[] = [];
  const updated: string[] = [];
  const removed: string[] = [];

  // 1. Remove markers no longer in target set
  registry.forEach((entry, id) => {
    if (!targetIds.has(id)) {
      callbacks.removeMarker(entry.marker, id);
      registry.delete(id);
      removed.push(id);
    }
  });

  // 2. Add or update target markers
  targetItems.forEach(({ biz, idx, offset, mode = 'card' }) => {
    const iconKey = computeMarkerIconKey(biz, idx, offset, mode);
    const existing = registry.get(biz.id);

    if (existing) {
      // Always refresh business data reference to prevent stale closures
      existing.biz = biz;

      if (existing.iconKey !== iconKey) {
        callbacks.updateMarkerIcon(existing.marker, biz, iconKey);
        existing.iconKey = iconKey;
        updated.push(biz.id);
      } else {
        retained.push(biz.id);
      }
    } else {
      const marker = callbacks.createMarker(biz, idx, iconKey);
      registry.set(biz.id, { marker, biz, iconKey });
      added.push(biz.id);
    }
  });

  return { added, retained, updated, removed };
}
