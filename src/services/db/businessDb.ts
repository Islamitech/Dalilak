import { supabase, supabaseRestFetch, isSupabaseConfigured } from '../../lib/supabase';
import { uploadMultipleMediaToStorage } from '../storage';
import { Business } from '../../types';
import { safeSetLocalStorageItem, safeGetLocalStorageItem, getSafeBusinessesForStorage, safeParseJson, getApiAuthHeaders } from '../../utils/storage';
import {
  saveOfflineBusiness,
  getOfflineBusinesses,
  removeOfflineBusiness,
} from '../offlineSync';
import { mapDbToBusiness, mapBusinessToDb, mapPartialBusinessToDb, parsePhotosArray, parseVideosArray } from './dbMappers';

export function getCachedBusinesses(): Business[] {
  const raw = safeGetLocalStorageItem('dalelak_cached_businesses') || safeGetLocalStorageItem('dalelak_directory_cache');
  const cached = safeParseJson<Business[]>(raw, []);
  if (Array.isArray(cached) && cached.length > 0) {
    return cached.filter(
      (b) => b && !b.isDeleted && b.packageId !== 'pkg_interested_lead' && (b as any).verificationStatus !== 'lead' && !b.id.startsWith('lead_')
    );
  }
  return [];
}

const FAST_BUSINESS_SELECT = 'id,name_ar,name_en,category,governorate,city,street,landmark,phone,secondary_phone,working_hours,description,lat,lng,owner_name,owner_phone,owner_email,national_id,package_id,package_name,package_price,amount_paid,payment_status,verification_status,rep_id,rep_name,invoice_number,invoice_date,notes,created_at';

export { FAST_BUSINESS_SELECT };

/**
 * ⚡ Stale-While-Revalidate Full Cloud Fetch
 * Returns fresh data and updates offline cache
 */
export async function fetchBusinessesFromDb(): Promise<Business[]> {
  const cached = getCachedBusinesses();
  const cachedPhotoMap = new Map<string, string[]>();
  cached.forEach((b) => {
    if (b.photos && b.photos.length > 0) {
      cachedPhotoMap.set(b.id, b.photos);
    }
  });
  let resultList: Business[] = [];

  // 1. Supabase Cloud fetch (PRIMARY SOURCE OF TRUTH - FAST HIGH-SPEED QUERY)
  if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const res = await supabaseRestFetch(`businesses?select=${FAST_BUSINESS_SELECT}&package_id=neq.pkg_interested_lead&order=created_at.desc`);
      if (res.ok) {
        const restData = await res.json();
        if (Array.isArray(restData) && restData.length > 0) {
          resultList = restData.map((item) => {
            const b = mapDbToBusiness(item);
            if ((!b.photos || b.photos.length === 0) && cachedPhotoMap.has(b.id)) {
              b.photos = cachedPhotoMap.get(b.id)!;
            }
            return b;
          });
          try {
            const safePayload = JSON.stringify(getSafeBusinessesForStorage(resultList));
            safeSetLocalStorageItem('dalelak_cached_businesses', safePayload);
            safeSetLocalStorageItem('dalelak_directory_cache', safePayload);
            safeSetLocalStorageItem('dalelak_last_sync_timestamp', new Date().toISOString());
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Supabase fetch businesses REST error, trying fallback:', err);
    }

    if (resultList.length === 0) {
      try {
        const { data, error } = await supabase.from('businesses').select(FAST_BUSINESS_SELECT).neq('package_id', 'pkg_interested_lead').order('created_at', { ascending: false });
        if (!error && data && Array.isArray(data) && data.length > 0) {
          resultList = data.map((item) => {
            const b = mapDbToBusiness(item);
            if ((!b.photos || b.photos.length === 0) && cachedPhotoMap.has(b.id)) {
              b.photos = cachedPhotoMap.get(b.id)!;
            }
            return b;
          });
          try {
            const safePayload = JSON.stringify(getSafeBusinessesForStorage(resultList));
            safeSetLocalStorageItem('dalelak_cached_businesses', safePayload);
            safeSetLocalStorageItem('dalelak_directory_cache', safePayload);
            safeSetLocalStorageItem('dalelak_last_sync_timestamp', new Date().toISOString());
          } catch {}
        }
      } catch (err) {
        console.warn('Supabase fetch businesses SDK error:', err);
      }
    }
  }

  // 2. Local Server API fetch fallback (runs if Supabase is offline or restricted)
  if (resultList.length === 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const localRes = await fetch('/api/businesses', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (localRes.ok) {
        const localData = await localRes.json();
        if (Array.isArray(localData) && localData.length > 0) {
          resultList = localData.map(mapDbToBusiness);
        }
      }
    } catch {}
  }

  // 3. LocalStorage cache merge & fallback
  if (resultList.length === 0 && cached.length > 0) {
    resultList = cached;
  } else if (cached.length > 0) {
    const map = new Map<string, Business>();
    resultList.forEach((b) => map.set(b.id, b));
    cached.forEach((c) => {
      const existing = map.get(c.id);
      if (!existing) {
        map.set(c.id, c);
      } else if ((!existing.photos || existing.photos.length === 0) && c.photos && c.photos.length > 0) {
        map.set(c.id, { ...existing, photos: c.photos });
      }
    });
    resultList = Array.from(map.values());
  }

  // ⚡ 4. Guaranteed Merge with IndexedDB Offline Businesses (Preserve photos from local store)
  try {
    const offlineList = await getOfflineBusinesses();
    if (offlineList && offlineList.length > 0) {
      const map = new Map<string, Business>();
      resultList.forEach((b) => map.set(b.id, b));
      offlineList.forEach((b) => {
        const existing = map.get(b.id);
        if (!existing) {
          map.set(b.id, b);
        } else if ((!existing.photos || existing.photos.length === 0) && b.photos && b.photos.length > 0) {
          // Restore photos from IndexedDB if memory/cloud copy lost them
          map.set(b.id, { ...existing, photos: b.photos });
        } else if (existing.photos && existing.photos.length > 0) {
          removeOfflineBusiness(b.id).catch(() => {});
        }
      });
      resultList = Array.from(map.values());
    }
  } catch {}

  return resultList.filter(
    (b) => b && !b.isDeleted && b.packageId !== 'pkg_interested_lead' && (b as any).verificationStatus !== 'lead' && !b.id.startsWith('lead_')
  );
}

/**
 * 📸 Fetch high-resolution photos on demand for a single business
 * Multi-tier: Supabase Cloud -> Local Server -> IndexedDB -> LocalStorage
 */
export async function fetchBusinessPhotosOnDemand(businessId: string): Promise<string[]> {
  if (!businessId) return [];

  // 1. Supabase Cloud fetch if online
  if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const res = await supabaseRestFetch(`businesses?id=eq.${businessId}&select=photos`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data[0]) {
          const parsed = parsePhotosArray(data[0]);
          if (parsed.length > 0) return parsed;
        }
      }
    } catch (err) {
      console.warn('Supabase fetch photos on demand REST error:', err);
    }

    try {
      const { data, error } = await supabase.from('businesses').select('photos').eq('id', businessId).single();
      if (!error && data) {
        const parsed = parsePhotosArray(data);
        if (parsed.length > 0) return parsed;
      }
    } catch (sdkErr) {
      console.warn('Supabase fetch photos on demand SDK error:', sdkErr);
    }
  }

  // 2. Local Server API fetch fallback
  try {
    const localRes = await fetch(`/api/businesses/${encodeURIComponent(businessId)}`);
    if (localRes.ok) {
      const localData = await localRes.json();
      const photos = parsePhotosArray(localData);
      if (photos.length > 0) return photos;
    }
  } catch {}

  // 3. IndexedDB Offline store fallback
  try {
    const offlineList = await getOfflineBusinesses();
    const match = offlineList.find((b) => b.id === businessId);
    if (match && Array.isArray(match.photos) && match.photos.length > 0) {
      return match.photos;
    }
  } catch {}

  // 4. LocalStorage cache fallback
  try {
    const cached = getCachedBusinesses();
    const match = cached.find((b) => b.id === businessId);
    if (match && Array.isArray(match.photos) && match.photos.length > 0) {
      return match.photos;
    }
  } catch {}

  return [];
}

/**
 * 📸 Background Photo Hydration
 * Non-blocking progressive photo fetch for businesses that do not have photos yet.
 * Runs in background after initial render so user sees all businesses in < 300ms.
 */
export async function hydrateBusinessesPhotosInBackground(
  businesses: Business[],
  onUpdate: (updatedList: Business[]) => void
): Promise<void> {
  if (!isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
  if (!Array.isArray(businesses) || businesses.length === 0) return;

  try {
    const res = await supabaseRestFetch(
      'businesses?select=id,photos&package_id=neq.pkg_interested_lead&order=created_at.desc'
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const photoMap = new Map<string, string[]>();
        data.forEach((item: any) => {
          if (item.id) {
            const parsed = parsePhotosArray(item);
            if (parsed.length > 0) photoMap.set(item.id, parsed);
          }
        });

        if (photoMap.size > 0) {
          const updated = businesses.map((b) => {
            const photos = photoMap.get(b.id);
            if (photos && photos.length > 0) {
              return { ...b, photos };
            }
            return b;
          });
          onUpdate(updated);

          // Update cache with safe limits
          try {
            safeSetLocalStorageItem('dalelak_cached_businesses', JSON.stringify(getSafeBusinessesForStorage(updated)));
            safeSetLocalStorageItem('dalelak_directory_cache', JSON.stringify(getSafeBusinessesForStorage(updated)));
          } catch {}
        }
      }
    }
  } catch (err) {
    console.warn('Background photo hydration notice:', err);
  }
}

/**
 * ⚡ Background Delta Sync (المزامنة الفروقية الذكية)
 * Only fetches rows modified/created after lastSyncTime to save bandwidth
 */
export async function syncDeltaBusinessesFromDb(): Promise<{ updated: boolean; businesses: Business[]; count: number }> {
  const cached = getCachedBusinesses();
  const lastSync = localStorage.getItem('dalelak_last_sync_timestamp');

  // If no previous sync timestamp or empty cache, perform full sync
  if (!lastSync || cached.length === 0) {
    const fresh = await fetchBusinessesFromDb();
    return { updated: fresh.length > 0, businesses: fresh, count: fresh.length };
  }

  if (!isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return { updated: false, businesses: cached, count: 0 };
  }

  try {
    const lastSyncDate = new Date(lastSync);
    const safeTime = new Date(Math.max(0, lastSyncDate.getTime() - 5 * 60 * 1000)).toISOString();
    const encLastSync = encodeURIComponent(safeTime);
    // Note: Live Supabase table only has created_at column (updated_at does not exist)
    const query = `businesses?select=${FAST_BUSINESS_SELECT}&package_id=neq.pkg_interested_lead&created_at=gte.${encLastSync}&order=created_at.desc`;
    const res = await supabaseRestFetch(query);

    // Also prune deleted records & detect missing records: lightweight fetch of active IDs
    let activeIds: Set<string> | null = null;
    try {
      const idsRes = await supabaseRestFetch('businesses?select=id&package_id=neq.pkg_interested_lead');
      if (idsRes.ok) {
        const idsData = await idsRes.json();
        if (Array.isArray(idsData)) {
          activeIds = new Set(idsData.map((x: any) => x.id));
        }
      }
    } catch {}

    let hasChanges = false;
    let freshDeltaCount = 0;
    const map = new Map<string, Business>();

    // If activeIds is available, prune any cached business deleted on the server
    cached.forEach((b) => {
      if (!activeIds || activeIds.has(b.id) || b.id.startsWith('offline_')) {
        map.set(b.id, b);
      } else {
        hasChanges = true; // Pruning deleted business
      }
    });

    if (res.ok) {
      const deltaData = await res.json();
      if (Array.isArray(deltaData) && deltaData.length > 0) {
        const freshDeltaList = deltaData
          .map(mapDbToBusiness)
          .filter((b) => b && !b.isDeleted && b.packageId !== 'pkg_interested_lead' && (b as any).verificationStatus !== 'lead' && !b.id.startsWith('lead_'));
        
        freshDeltaList.forEach((b) => {
          const existing = map.get(b.id);
          if ((!b.photos || b.photos.length === 0) && existing && existing.photos && existing.photos.length > 0) {
            b.photos = existing.photos;
          }
          map.set(b.id, b);
        });
        freshDeltaCount = freshDeltaList.length;
        if (freshDeltaCount > 0) hasChanges = true;
      }
    }

    // ⚡ Self-Healing: Check for any newly added IDs on server that are not yet in local cache (independent of clock skew)
    if (activeIds && activeIds.size > 0) {
      const missingIds: string[] = [];
      activeIds.forEach((id) => {
        if (!map.has(id)) {
          missingIds.push(id);
        }
      });

      if (missingIds.length > 0) {
        try {
          const idFilter = encodeURIComponent(`(${missingIds.slice(0, 50).join(',')})`);
          const missingRes = await supabaseRestFetch(`businesses?select=${FAST_BUSINESS_SELECT}&id=in.${idFilter}`);
          if (missingRes.ok) {
            const missingData = await missingRes.json();
            if (Array.isArray(missingData) && missingData.length > 0) {
              missingData.map(mapDbToBusiness).forEach((b) => {
                if (b && !b.isDeleted && b.packageId !== 'pkg_interested_lead') {
                  const existing = map.get(b.id);
                  if ((!b.photos || b.photos.length === 0) && existing && existing.photos && existing.photos.length > 0) {
                    b.photos = existing.photos;
                  }
                  map.set(b.id, b);
                  hasChanges = true;
                  freshDeltaCount++;
                }
              });
            }
          }
        } catch (missingErr) {
          console.warn('Auto-healing fetch notice:', missingErr);
        }
      }
    }

    if (hasChanges) {
      // Also merge pending offline businesses
      try {
        const offlineList = await getOfflineBusinesses();
        offlineList.forEach((b) => map.set(b.id, b));
      } catch {}

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()
      );

      try {
        const safePayload = JSON.stringify(getSafeBusinessesForStorage(merged));
        safeSetLocalStorageItem('dalelak_cached_businesses', safePayload);
        safeSetLocalStorageItem('dalelak_directory_cache', safePayload);
        safeSetLocalStorageItem('dalelak_last_sync_timestamp', new Date().toISOString());
      } catch {}

      return { updated: true, businesses: merged, count: freshDeltaCount };
    }
  } catch (err) {
    console.warn('Delta sync error:', err);
  }

  // Update sync timestamp heartbeat even if no new items
  try {
    safeSetLocalStorageItem('dalelak_last_sync_timestamp', new Date().toISOString());
  } catch {}

  return { updated: false, businesses: cached, count: 0 };
}

export async function saveBusinessToDb(biz: Business): Promise<{ success: boolean; cloudSaved: boolean; error?: string }> {
  // Convert any remaining raw Base64 photos into clean storage URLs
  let safePhotos = biz.photos || [];
  // Strictly filter videos to valid hosted URLs only (no giant base64 payloads)
  let safeVideos = (biz.videos || []).filter(v => typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://')));

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (isOnline) {
    try {
      const hasBase64Photos = safePhotos.some(p => p.startsWith('data:image/'));
      if (hasBase64Photos) {
        safePhotos = await uploadMultipleMediaToStorage(safePhotos, 'photos');
      }
    } catch {}
  }

  const cleanBiz: Business = { ...biz, photos: safePhotos, videos: safeVideos };
  const dbRecord = mapBusinessToDb(cleanBiz);

  // 1. Immediate LocalStorage cache update
  try {
    const cached = safeParseJson<Business[]>(localStorage.getItem('dalelak_cached_businesses'), []);
    const map = new Map<string, Business>();
    map.set(cleanBiz.id, cleanBiz);
    if (Array.isArray(cached)) {
      cached.forEach((b: Business) => {
        if (!map.has(b.id)) map.set(b.id, b);
      });
    }
    safeSetLocalStorageItem('dalelak_cached_businesses', JSON.stringify(Array.from(map.values())));
    safeSetLocalStorageItem('dalelak_directory_cache', JSON.stringify(Array.from(map.values())));
  } catch {}

  let savedToCloud = false;
  let cloudError: string | undefined = undefined;

  // 2. Direct Supabase Cloud Save if Online
  if (isOnline && isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('businesses')
        .upsert(dbRecord, { onConflict: 'id' });

      if (!error) {
        savedToCloud = true;
        await removeOfflineBusiness(cleanBiz.id).catch(() => {});
        return { success: true, cloudSaved: true };
      } else {
        cloudError = error.message;
        console.warn('Supabase SDK upsert error:', error);
      }
    } catch (sdkErr: any) {
      cloudError = sdkErr?.message || String(sdkErr);
      console.warn('Supabase SDK upsert notice:', sdkErr);
    }

    try {
      const res = await supabaseRestFetch('businesses', {
        method: 'POST',
        headers: {
          'Prefer': 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(dbRecord),
      });

      if (res.ok) {
        savedToCloud = true;
        await removeOfflineBusiness(cleanBiz.id).catch(() => {});
        return { success: true, cloudSaved: true };
      } else {
        const errText = await res.text().catch(() => '');
        cloudError = errText || `HTTP ${res.status}`;
        console.warn('Supabase REST save notice (saved offline):', res.status, errText);
      }
    } catch (err: any) {
      cloudError = err?.message || String(err);
      console.warn('Supabase REST save notice (saved offline):', err);
    }
  }

  // 3. Fallback: Save to IndexedDB ONLY if offline or cloud save failed
  if (!savedToCloud) {
    await saveOfflineBusiness(cleanBiz);
  }

  // 4. Local Server API fetch fallback
  try {
    await fetch('/api/businesses', {
      method: 'POST',
      headers: { ...getApiAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanBiz),
    });
  } catch {}

  return { success: true, cloudSaved: savedToCloud, error: cloudError };
}

export async function updateBusinessInDb(id: string, updates: Partial<Business>): Promise<void> {
  // 1. Immediately update LocalStorage cache
  let mergedObj: Business = { id } as Business;
  try {
    const cached = safeParseJson<Business[]>(localStorage.getItem('dalelak_cached_businesses'), []);
    const map = new Map<string, Business>();
    if (Array.isArray(cached)) {
      cached.forEach((b: Business) => {
        if (b && b.id) map.set(b.id, b);
      });
    }
    const current = map.get(id) || ({} as Business);
    mergedObj = { ...current, ...updates, id } as Business;
    map.set(id, mergedObj);
    safeSetLocalStorageItem('dalelak_cached_businesses', JSON.stringify(Array.from(map.values())));
    safeSetLocalStorageItem('dalelak_directory_cache', JSON.stringify(Array.from(map.values())));
  } catch {}

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // 2. Real-time Supabase Cloud Update
  let syncedSuccessfully = false;
  if (isOnline && isSupabaseConfigured()) {
    // Ensure any Base64 photos in updates are uploaded to Supabase Storage
    if (updates.photos && Array.isArray(updates.photos) && updates.photos.some((p) => typeof p === 'string' && p.startsWith('data:image/'))) {
      try {
        const uploaded = await uploadMultipleMediaToStorage(updates.photos, 'photos');
        updates.photos = uploaded;
        mergedObj.photos = uploaded;
      } catch {}
    }
    const partialDbUpdates = mapPartialBusinessToDb(updates, mergedObj);
    const fullRecord = mapBusinessToDb(mergedObj);

    // A. Direct Client SDK Partial Update / Upsert
    try {
      const { data: updateData, error: updateErr } = await supabase
        .from('businesses')
        .update(partialDbUpdates)
        .eq('id', id)
        .select('id');

      if (!updateErr && Array.isArray(updateData) && updateData.length > 0) {
        syncedSuccessfully = true;
      } else {
        const { error: upsertErr } = await supabase
          .from('businesses')
          .upsert(fullRecord, { onConflict: 'id' });
        if (!upsertErr) syncedSuccessfully = true;
      }
    } catch (err) {
      console.warn('Supabase SDK update business warning:', err);
    }

    // B. Direct REST PATCH / Upsert Fallback if SDK didn't complete
    if (!syncedSuccessfully) {
      try {
        const res = await supabaseRestFetch(`businesses?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: {
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(partialDbUpdates),
        });

        const restData: any = res.ok ? await res.json().catch((): any => null) : null;
        const patchedCount = Array.isArray(restData) ? restData.length : 0;

        if (res.ok && patchedCount > 0) {
          syncedSuccessfully = true;
        } else {
          // If record wasn't in DB yet, POST upsert
          const postRes = await supabaseRestFetch('businesses', {
            method: 'POST',
            headers: {
              'Prefer': 'resolution=merge-duplicates,return=representation',
            },
            body: JSON.stringify(fullRecord),
          });
          if (postRes.ok) {
            syncedSuccessfully = true;
          }
        }
      } catch (err) {
        console.warn('Supabase REST update business warning:', err);
      }
    }
  }

  // 3. Fallback queue in Offline IndexedDB if offline or cloud sync failed
  if (!syncedSuccessfully) {
    await saveOfflineBusiness(mergedObj);
  } else {
    // If synced to cloud, remove any old offline sync entry
    await removeOfflineBusiness(id).catch(() => {});
  }

  // 4. Sync to local server API
  try {
    await fetch(`/api/businesses/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { ...getApiAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(mergedObj),
    });
  } catch {}
}

export function getDeletedBusinesses(): Business[] {
  const raw = safeGetLocalStorageItem('dalelak_soft_deleted_businesses');
  return safeParseJson<Business[]>(raw, []);
}

/**
 * 📦 Soft Delete Business (الأثر على السيرفر):
 * Marks the business as deleted so it disappears from normal users/admins,
 * but preserves all data in Supabase & server audit for the Super Admin.
 */
export async function softDeleteBusinessInDb(
  biz: Business,
  deletedBy: string,
  deletedByRole?: string,
  deletedReason?: string
): Promise<void> {
  const updatedBiz: Business = {
    ...biz,
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy,
    deletedByRole,
    deletedReason,
  };

  // 1. Remove from active cache and put in soft deleted registry
  try {
    const cached = safeParseJson<Business[]>(localStorage.getItem('dalelak_cached_businesses'), []);
    const filtered = cached.filter((b: Business) => b.id !== biz.id);
    safeSetLocalStorageItem('dalelak_cached_businesses', JSON.stringify(filtered));

    const dirCached = safeParseJson<Business[]>(localStorage.getItem('dalelak_directory_cache'), []);
    const dirFiltered = dirCached.filter((b: Business) => b.id !== biz.id);
    safeSetLocalStorageItem('dalelak_directory_cache', JSON.stringify(dirFiltered));

    const deletedList = getDeletedBusinesses().filter((b) => b.id !== biz.id);
    safeSetLocalStorageItem('dalelak_soft_deleted_businesses', JSON.stringify([updatedBiz, ...deletedList]));
  } catch {}

  // 2. Persist soft-delete to Supabase DB
  await updateBusinessInDb(biz.id, updatedBiz);
}

/**
 * 🟢 Restores a soft-deleted business back to active state
 */
export async function restoreBusinessInDb(biz: Business): Promise<Business> {
  const restored: Business = {
    ...biz,
    isDeleted: false,
    deletedAt: undefined,
    deletedBy: undefined,
    deletedByRole: undefined,
    deletedReason: undefined,
  };

  // 1. Remove from soft deleted registry and restore to active cache
  try {
    const deletedList = getDeletedBusinesses().filter((b) => b.id !== biz.id);
    safeSetLocalStorageItem('dalelak_soft_deleted_businesses', JSON.stringify(deletedList));

    const cached = safeParseJson<Business[]>(localStorage.getItem('dalelak_cached_businesses'), []);
    safeSetLocalStorageItem('dalelak_cached_businesses', JSON.stringify([restored, ...cached.filter((b) => b.id !== biz.id)]));
  } catch {}

  // 2. Persist restored state to Supabase DB
  await updateBusinessInDb(biz.id, restored);
  return restored;
}

/**
 * 🔴 Permanent Purge (حذف نهائي بات):
 * Completely deletes the business record from Supabase, local server, and all local storage.
 */
export async function hardDeleteBusinessFromDb(id: string): Promise<void> {
  // 1. Purge from all caches & registries
  try {
    const cached = safeParseJson<Business[]>(localStorage.getItem('dalelak_cached_businesses'), []);
    if (Array.isArray(cached)) {
      safeSetLocalStorageItem('dalelak_cached_businesses', JSON.stringify(cached.filter((b: Business) => b.id !== id)));
    }
  } catch {}

  try {
    const directoryCache = safeParseJson<Business[]>(localStorage.getItem('dalelak_directory_cache'), []);
    if (Array.isArray(directoryCache)) {
      safeSetLocalStorageItem('dalelak_directory_cache', JSON.stringify(directoryCache.filter((b: Business) => b.id !== id)));
    }
  } catch {}

  try {
    const deletedList = getDeletedBusinesses().filter((b) => b.id !== id);
    safeSetLocalStorageItem('dalelak_soft_deleted_businesses', JSON.stringify(deletedList));
  } catch {}

  // 2. Delete from Supabase REST
  if (isSupabaseConfigured()) {
    try {
      await supabaseRestFetch(`businesses?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Supabase delete business error:', err);
    }
  }

  // 3. Delete from local server
  try {
    await fetch(`/api/businesses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getApiAuthHeaders(),
    });
  } catch {}
}

export const deleteBusinessFromDb = hardDeleteBusinessFromDb;

