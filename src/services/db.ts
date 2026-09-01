import { supabase, supabaseRestFetch, isSupabaseConfigured } from '../lib/supabase';
import { uploadMultipleMediaToStorage } from './storage';
import { Business, Representative, PaymentGatewayConfig, PayoutRequest, InterestedLead, PaymentStatus } from '../types';
import { safeSetLocalStorageItem, safeGetLocalStorageItem, getSafeBusinessesForStorage } from '../utils/storage';
import {
  saveOfflineBusiness,
  getOfflineBusinesses,
  removeOfflineBusiness,
  saveOfflineLead,
  getOfflineLeads,
  removeOfflineLead,
  saveOfflinePayout,
  getOfflinePayouts,
  removeOfflinePayout,
} from './offlineSync';

/**
 * 🏛️ Live Supabase Database Service
 * 100% Cloud-native persistent CRUD operations with automated schema conversion
 * and multi-layer caching (LocalStorage + Local Server + Supabase Cloud)
 */

// =============================================================================
// 1. BUSINESSES OPERATIONS (الأنشطة التجارية والمحلات)
// =============================================================================

export function getCachedBusinesses(): Business[] {
  try {
    const raw = safeGetLocalStorageItem('dalelak_cached_businesses') || safeGetLocalStorageItem('dalelak_directory_cache');
    if (raw) {
      const cached = JSON.parse(raw);
      if (Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    }
  } catch {}
  return [];
}

/**
 * ⚡ Stale-While-Revalidate Full Cloud Fetch
 * Returns fresh data and updates offline cache
 */
export async function fetchBusinessesFromDb(): Promise<Business[]> {
  const cached = getCachedBusinesses();
  let resultList: Business[] = [];

  // 1. Supabase Cloud fetch (PRIMARY SOURCE OF TRUTH)
  if (isSupabaseConfigured() && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const res = await supabaseRestFetch('businesses?select=*&order=created_at.desc');
      if (res.ok) {
        const restData = await res.json();
        if (Array.isArray(restData) && restData.length > 0) {
          resultList = restData.map(mapDbToBusiness);
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
        const { data, error } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });
        if (!error && data && Array.isArray(data) && data.length > 0) {
          resultList = data.map(mapDbToBusiness);
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

  // 2. LocalStorage cache fallback
  if (resultList.length === 0 && cached.length > 0) {
    resultList = cached;
  }

  // 3. Local Server API fetch fallback
  if (resultList.length === 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const localRes = await fetch('/api/businesses', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (localRes.ok) {
        const localData = await localRes.json();
        if (Array.isArray(localData) && localData.length > 0) {
          resultList = localData;
        }
      }
    } catch {}
  }

  // ⚡ 4. Guaranteed Merge with IndexedDB Offline Businesses (Always visible, never vanish)
  try {
    const offlineList = await getOfflineBusinesses();
    if (offlineList && offlineList.length > 0) {
      const map = new Map<string, Business>();
      resultList.forEach((b) => map.set(b.id, b));
      offlineList.forEach((b) => map.set(b.id, b));
      resultList = Array.from(map.values());
    }
  } catch {}

  return resultList;
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
    const query = `businesses?select=*&created_at=gte.${encodeURIComponent(lastSync)}&order=created_at.desc`;
    const res = await supabaseRestFetch(query);

    if (res.ok) {
      const deltaData = await res.json();
      if (Array.isArray(deltaData) && deltaData.length > 0) {
        const freshDeltaList = deltaData.map(mapDbToBusiness);
        
        // Merge delta updates with cached map (New/modified items override old)
        const map = new Map<string, Business>();
        cached.forEach((b) => map.set(b.id, b));
        freshDeltaList.forEach((b) => map.set(b.id, b));

        // Also merge pending offline businesses
        try {
          const offlineList = await getOfflineBusinesses();
          offlineList.forEach((b) => map.set(b.id, b));
        } catch {}

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()
        );

        try {
          safeSetLocalStorageItem('dalelak_cached_businesses', JSON.stringify(merged));
          safeSetLocalStorageItem('dalelak_directory_cache', JSON.stringify(merged));
          safeSetLocalStorageItem('dalelak_last_sync_timestamp', new Date().toISOString());
        } catch {}

        return { updated: true, businesses: merged, count: freshDeltaList.length };
      }
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

export async function saveBusinessToDb(biz: Business): Promise<void> {
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

  // 1. 🗄️ Guaranteed IndexedDB local persistence (Zero Data Loss even when offline)
  await saveOfflineBusiness(cleanBiz);

  // 2. Immediate LocalStorage cache update
  try {
    const cached = JSON.parse(localStorage.getItem('dalelak_cached_businesses') || '[]');
    const map = new Map<string, Business>();
    map.set(cleanBiz.id, cleanBiz);
    if (Array.isArray(cached)) {
      cached.forEach((b: Business) => {
        if (!map.has(b.id)) map.set(b.id, b);
      });
    }
    safeSetLocalStorageItem('dalelak_cached_businesses', JSON.stringify(Array.from(map.values())));
  } catch {}

  // 3. Direct Supabase Cloud Save if Online
  if (isOnline && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .upsert(dbRecord, { onConflict: 'id' })
        .select();

      if (!error && data && Array.isArray(data) && data.length > 0) {
        await removeOfflineBusiness(cleanBiz.id);
        return;
      }
    } catch (sdkErr) {
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
        await removeOfflineBusiness(cleanBiz.id);
        return;
      }
    } catch (err) {
      console.warn('Supabase REST save notice (saved offline):', err);
    }
  }

  // 4. Local Server API fetch fallback
  try {
    await fetch('/api/businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanBiz),
    });
  } catch {}
}

export async function updateBusinessInDb(id: string, updates: Partial<Business>): Promise<void> {
  // 1. Immediately update LocalStorage cache
  let mergedObj: Business = { id } as Business;
  try {
    const cached = JSON.parse(localStorage.getItem('dalelak_cached_businesses') || '[]');
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
  } catch {}

  const fullRecord = getSafeCoreBusinessDbRecord(mergedObj);
  const dbUpdates = { ...fullRecord };
  delete dbUpdates.id;

  // 2. Sync to Supabase via Direct REST PATCH + UPSERT Fallback
  if (isSupabaseConfigured()) {
    try {
      const res = await supabaseRestFetch(`businesses?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(dbUpdates),
      });

      const restData = res.ok ? await res.json().catch(() => null) : null;
      const patchedCount = Array.isArray(restData) ? restData.length : 0;

      // If PATCH updated 0 rows (record not in Supabase yet), perform an upsert
      if (!res.ok || patchedCount === 0) {
        await supabaseRestFetch('businesses', {
          method: 'POST',
          headers: {
            'Prefer': 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(fullRecord),
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Supabase update business warning:', err);
    }
  }

  // 3. Sync to local server API
  try {
    await fetch(`/api/businesses/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mergedObj),
    });
  } catch {}
}

export async function deleteBusinessFromDb(id: string): Promise<void> {
  // 1. Delete from LocalStorage cache immediately
  try {
    const cached = JSON.parse(localStorage.getItem('dalelak_cached_businesses') || '[]');
    if (Array.isArray(cached)) {
      const filtered = cached.filter((b: Business) => b.id !== id);
      safeSetLocalStorageItem('dalelak_cached_businesses', JSON.stringify(filtered));
    }
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
    });
  } catch {}
}

// =============================================================================
// 2. REPRESENTATIVES OPERATIONS (المناديب والمشرفين والإدارة)
// =============================================================================

export async function fetchRepsFromDb(): Promise<Representative[]> {
  // 1. Supabase Cloud fetch (PRIMARY SOURCE OF TRUTH)
  if (isSupabaseConfigured()) {
    try {
      const res = await supabaseRestFetch('representatives?select=*&order=created_at.desc');
      if (res.ok) {
        const restData = await res.json();
        if (Array.isArray(restData) && restData.length > 0) {
          const freshList = restData.map(mapDbToRep);
          try {
            safeSetLocalStorageItem('dalelak_cached_reps', JSON.stringify(freshList));
          } catch {}
          return freshList;
        }
      }
    } catch (err) {
      console.warn('Supabase fetch reps REST error:', err);
    }

    try {
      const { data, error } = await supabase.from('representatives').select('*').order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        const freshList = data.map(mapDbToRep);
        try {
          safeSetLocalStorageItem('dalelak_cached_reps', JSON.stringify(freshList));
        } catch {}
        return freshList;
      }
    } catch (err) {
      console.warn('Supabase fetch reps SDK error:', err);
    }
  }

  // 2. Offline fallback from local cache
  try {
    const cached = JSON.parse(localStorage.getItem('dalelak_cached_reps') || '[]');
    if (Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  } catch {}

  return [];
}

export async function saveRepToDb(rep: Representative): Promise<void> {
  const dbRecord = mapRepToDb(rep);

  // 1. Direct Supabase Cloud Save / Upsert
  if (isSupabaseConfigured()) {
    try {
      const res = await supabaseRestFetch('representatives', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(dbRecord),
      });

      if (!res.ok) {
        await supabaseRestFetch(`representatives?id=eq.${encodeURIComponent(rep.id)}`, {
          method: 'PATCH',
          body: JSON.stringify(dbRecord),
        });
      }
    } catch (err) {
      console.warn('Supabase save rep REST warning:', err);
    }
  }

  // 2. Update in LocalStorage cache
  try {
    const cached = JSON.parse(localStorage.getItem('dalelak_cached_reps') || '[]');
    const map = new Map<string, Representative>();
    map.set(rep.email.toLowerCase(), rep);
    if (Array.isArray(cached)) {
      cached.forEach((r: Representative) => {
        if (!map.has(r.email.toLowerCase())) map.set(r.email.toLowerCase(), r);
      });
    }
    safeSetLocalStorageItem('dalelak_cached_reps', JSON.stringify(Array.from(map.values())));
  } catch {}

  // 3. Always sync to local server
  try {
    await fetch('/api/representatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rep),
    });
  } catch {}
}

export async function updateRepInDb(id: string, updates: Partial<Representative>): Promise<void> {
  // 1. Update in LocalStorage
  try {
    const cached = JSON.parse(localStorage.getItem('dalelak_custom_reps') || '[]');
    if (Array.isArray(cached)) {
      const updated = cached.map((r: Representative) => (r.id === id ? { ...r, ...updates } : r));
      safeSetLocalStorageItem('dalelak_custom_reps', JSON.stringify(updated));
    }
  } catch {}

  // 2. Update in Supabase Cloud
  const dbUpdates = mapRepToDb(updates as Representative);
  delete dbUpdates.id;
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('representatives').update(dbUpdates).eq('id', id);
      if (error) {
        await supabaseRestFetch(`representatives?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(dbUpdates),
        });
      }
    } catch (err) {
      console.error('Supabase update rep error:', err);
    }
  }

  // 3. Always sync to local server
  try {
    await fetch(`/api/representatives/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch {}
}

export async function deleteRepFromDb(id: string): Promise<void> {
  // 1. Blacklist in deleted reps registry
  try {
    const delArr = JSON.parse(localStorage.getItem('dalelak_deleted_rep_ids') || '[]');
    const delSet = new Set(Array.isArray(delArr) ? delArr : []);
    delSet.add(id.toLowerCase());
    safeSetLocalStorageItem('dalelak_deleted_rep_ids', JSON.stringify(Array.from(delSet)));
  } catch {}

  // 2. Remove from LocalStorage custom reps
  try {
    const cached = JSON.parse(localStorage.getItem('dalelak_custom_reps') || '[]');
    if (Array.isArray(cached)) {
      const filtered = cached.filter((r: Representative) => r.id !== id && r.email?.toLowerCase() !== id.toLowerCase());
      safeSetLocalStorageItem('dalelak_custom_reps', JSON.stringify(filtered));
    }
  } catch {}

  // 3. Delete from Supabase Cloud
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('representatives').delete().eq('id', id);
      if (error) {
        await supabaseRestFetch(`representatives?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      }
    } catch (err) {
      console.error('Supabase delete rep error:', err);
    }
  }

  // 4. Delete from Local Server
  try {
    await fetch(`/api/representatives/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch {}
}

export async function updateRepSessionInDb(id: string, sessionId?: string, timestamp?: number): Promise<void> {
  const updates: any = {
    active_session_id: sessionId || null,
    last_active_timestamp: timestamp || null,
  };

  // 1. Real-time active session synchronization to Supabase Cloud
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('representatives').update(updates).eq('id', id);
      if (error) {
        await supabaseRestFetch(`representatives?id=eq.${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
      }
    } catch (err) {
      console.warn('Supabase update session warning:', err);
    }
  }

  // 2. Real-time active session synchronization to local Express backend if present
  try {
    await fetch('/api/auth/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id, sessionId, timestamp }),
    });
  } catch {}
}

// =============================================================================
// 3. PAYOUT & REMITTANCE REQUESTS (طلبات الصرف والتوريد المالي)
// =============================================================================

export async function fetchPayoutRequestsFromDb(repId?: string): Promise<PayoutRequest[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('payout_requests').select('*').order('request_date', { ascending: false });
      if (repId) {
        query = query.eq('rep_id', repId);
      }
      const { data, error } = await query;
      if (!error && data && Array.isArray(data) && data.length > 0) {
        return data.map(mapDbToPayout);
      }

      const restEndpoint = repId
        ? `payout_requests?rep_id=eq.${encodeURIComponent(repId)}&select=*&order=request_date.desc`
        : 'payout_requests?select=*&order=request_date.desc';
      const res = await supabaseRestFetch(restEndpoint);
      if (res.ok) {
        const restData = await res.json();
        if (Array.isArray(restData) && restData.length > 0) {
          return restData.map(mapDbToPayout);
        }
      }
    } catch (err) {
      console.error('Supabase fetch payout requests error:', err);
    }
  }

  try {
    const localRes = await fetch('/api/payouts');
    if (localRes.ok) {
      const localData = await localRes.json();
      if (Array.isArray(localData) && localData.length > 0) {
        return repId ? localData.filter((p: any) => p.repId === repId) : localData;
      }
    }
  } catch {}

  return [];
}

export async function createPayoutRequestInDb(payout: PayoutRequest): Promise<PayoutRequest> {
  const dbRecord = mapPayoutToDb(payout);
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // 1. IndexedDB persistence
  await saveOfflinePayout(payout);

  if (isOnline && isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('payout_requests').insert([dbRecord]);
      if (!error) {
        await removeOfflinePayout(payout.id);
      } else {
        const res = await supabaseRestFetch('payout_requests', {
          method: 'POST',
          body: JSON.stringify(dbRecord),
        });
        if (res.ok) {
          await removeOfflinePayout(payout.id);
        }
      }
    } catch (err) {
      console.error('Supabase create payout request error:', err);
    }
  }

  try {
    await fetch('/api/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payout),
    });
  } catch {}

  return payout;
}

export async function updatePayoutRequestInDb(payout: PayoutRequest): Promise<PayoutRequest> {
  const dbUpdates = mapPayoutToDb(payout);
  delete dbUpdates.id;
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('payout_requests').update(dbUpdates).eq('id', payout.id);
      if (error) {
        await supabaseRestFetch(`payout_requests?id=eq.${encodeURIComponent(payout.id)}`, {
          method: 'PATCH',
          body: JSON.stringify(dbUpdates),
        });
      }
    } catch (err) {
      console.error('Supabase update payout request error:', err);
    }
  }

  try {
    await fetch(`/api/payouts/${encodeURIComponent(payout.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payout),
    });
  } catch {}

  return payout;
}

// =============================================================================
// 4. INTERESTED LEADS (العملاء المحتملين والمتابعات Mappings)
// =============================================================================

export async function fetchLeadsFromDb(repId?: string): Promise<InterestedLead[]> {
  const cached = JSON.parse(localStorage.getItem('dalelak_cached_leads') || '[]');
  const leadMap = new Map<string, InterestedLead>();
  if (Array.isArray(cached)) {
    cached.forEach((l: InterestedLead) => {
      if (l && l.id) leadMap.set(l.id, l);
    });
  }

  // 1. Supabase Cloud fetch (PRIMARY SOURCE OF TRUTH)
  if (isSupabaseConfigured()) {
    try {
      const restEndpoint = repId
        ? `leads?rep_id=eq.${encodeURIComponent(repId)}&select=*&order=created_at.desc`
        : 'leads?select=*&order=created_at.desc';
      const res = await supabaseRestFetch(restEndpoint);
      if (res.ok) {
        const restData = await res.json();
        if (Array.isArray(restData)) {
          restData.forEach((item: any) => {
            const mapped = mapDbToLead(item);
            leadMap.set(mapped.id, mapped);
          });
        }
      }
    } catch (err) {
      console.warn('Supabase fetch leads REST error:', err);
    }

    try {
      let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (repId) query = query.eq('rep_id', repId);
      const { data, error } = await query;
      if (!error && data && Array.isArray(data)) {
        data.forEach((item: any) => {
          const mapped = mapDbToLead(item);
          leadMap.set(mapped.id, mapped);
        });
      }
    } catch (err) {
      console.warn('Supabase fetch leads SDK error:', err);
    }
  }

  const combined = Array.from(leadMap.values()).sort(
    (a, b) => new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()
  );
  try {
    safeSetLocalStorageItem('dalelak_cached_leads', JSON.stringify(combined));
  } catch {}
  return combined;
}

export async function saveLeadToDb(lead: InterestedLead): Promise<InterestedLead> {
  const dbRecord = mapLeadToDb(lead);
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // 1. Guaranteed IndexedDB local persistence
  await saveOfflineLead(lead);

  // 2. Immediate Local Cache update
  try {
    const cached = JSON.parse(localStorage.getItem('dalelak_cached_leads') || '[]');
    const map = new Map<string, InterestedLead>();
    map.set(lead.id, lead);
    if (Array.isArray(cached)) {
      cached.forEach((l: InterestedLead) => {
        if (!map.has(l.id)) map.set(l.id, l);
      });
    }
    safeSetLocalStorageItem('dalelak_cached_leads', JSON.stringify(Array.from(map.values())));
  } catch {}

  // 3. Direct Supabase Cloud Save / Upsert
  if (isOnline && isSupabaseConfigured()) {
    try {
      const res = await supabaseRestFetch('leads', {
        method: 'POST',
        headers: {
          'Prefer': 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(dbRecord),
      });

      if (res.ok) {
        await removeOfflineLead(lead.id);
      } else {
        const { error } = await supabase.from('leads').upsert([dbRecord]);
        if (!error) {
          await removeOfflineLead(lead.id);
        }
      }
    } catch (err) {
      console.warn('Supabase save lead notice (saved offline):', err);
    }
  }

  // 3. Save to Local Server
  try {
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
  } catch {}

  return lead;
}

export async function updateLeadInDb(lead: InterestedLead): Promise<InterestedLead> {
  const dbUpdates = mapLeadToDb(lead);
  delete dbUpdates.id;

  // 1. Immediate Local Cache update
  try {
    const cached = JSON.parse(localStorage.getItem('dalelak_cached_leads') || '[]');
    if (Array.isArray(cached)) {
      const updated = cached.map((l: InterestedLead) => (l.id === lead.id ? lead : l));
      safeSetLocalStorageItem('dalelak_cached_leads', JSON.stringify(updated));
    }
  } catch {}

  // 2. Direct Supabase Cloud Update
  if (isSupabaseConfigured()) {
    try {
      const res = await supabaseRestFetch(`leads?id=eq.${encodeURIComponent(lead.id)}`, {
        method: 'PATCH',
        body: JSON.stringify(dbUpdates),
      });

      if (!res.ok) {
        const { error } = await supabase.from('leads').update(dbUpdates).eq('id', lead.id);
        if (error) {
          console.warn('Supabase update lead fallback error:', error);
        }
      }
    } catch (err) {
      console.error('Supabase update lead error:', err);
    }
  }

  // 3. Update in Local Server
  try {
    await fetch(`/api/leads/${encodeURIComponent(lead.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
  } catch {}

  return lead;
}

export async function deleteLeadFromDb(id: string): Promise<void> {
  // 1. Immediate Local Cache remove
  try {
    const cached = JSON.parse(localStorage.getItem('dalelak_cached_leads') || '[]');
    if (Array.isArray(cached)) {
      const filtered = cached.filter((l: InterestedLead) => l.id !== id);
      safeSetLocalStorageItem('dalelak_cached_leads', JSON.stringify(filtered));
    }
  } catch {}

  // 2. Direct Supabase Cloud Delete
  if (isSupabaseConfigured()) {
    try {
      const res = await supabaseRestFetch(`leads?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        await supabase.from('leads').delete().eq('id', id);
      }
    } catch (err) {
      console.error('Supabase delete lead error:', err);
    }
  }

  // 3. Delete from Local Server
  try {
    await fetch(`/api/leads/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch {}
}

// =============================================================================
// 5. PAYMENT GATEWAY CONFIG (إعدادات بوابات الدفع والمحافظ)
// =============================================================================

export async function fetchPaymentConfigFromDb(): Promise<PaymentGatewayConfig | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('payment_config').select('*').limit(1).maybeSingle();
      if (!error && data) {
        return {
          vodafoneCashNumber: data.vodafone_cash_number || data.voda_number || '01143888355',
          vodafoneCashNumber2: data.vodafone_cash_number_2 || data.voda_number_2 || undefined,
          fawryMerchantCode: data.fawry_merchant_code || undefined,
          instaPayHandle: data.insta_pay_handle || '@daz31181',
          cardGatewayActive: data.card_gateway_active ?? true,
        };
      }
    } catch (err) {
      console.error('Supabase fetch payment config error:', err);
    }
  }

  try {
    const localRes = await fetch('/api/payment-config');
    if (localRes.ok) {
      const localData = await localRes.json();
      if (localData && typeof localData === 'object') {
        return localData;
      }
    }
  } catch {}

  return null;
}

export async function savePaymentConfigToDb(config: PaymentGatewayConfig): Promise<void> {
  const dbRecord = {
    id: 'default',
    vodafone_cash_number: config.vodafoneCashNumber,
    vodafone_cash_number_2: config.vodafoneCashNumber2 || null,
    fawry_merchant_code: config.fawryMerchantCode || null,
    insta_pay_handle: config.instaPayHandle || '@daz31181',
    card_gateway_active: config.cardGatewayActive ?? true,
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('payment_config').upsert([dbRecord]);
      if (error) {
        await supabaseRestFetch('payment_config', {
          method: 'POST',
          body: JSON.stringify(dbRecord),
        });
      }
    } catch (err) {
      console.error('Supabase save payment config error:', err);
    }
  }

  try {
    await fetch('/api/payment-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  } catch {}
}

// =============================================================================
// 6. DATA MAPPERS & SANITIZERS (تحويل وتطهير البيانات بين الـ SQL والـ Code)
// =============================================================================

function parsePhotosArray(item: any): string[] {
  const raw = item.photos || item.photos_urls || item.photosUrls;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('data:')) {
      return [trimmed];
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string' && parsed.trim().length > 0) return [parsed];
    } catch {
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const matches = [...trimmed.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
        if (matches.length > 0) return matches;
      }
      if (trimmed.includes(',')) {
        return trimmed.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (trimmed.startsWith('http') || trimmed.startsWith('/')) {
        return [trimmed];
      }
    }
  }
  return [];
}

function parseVideosArray(item: any): string[] {
  const raw = item.videos || item.videos_urls || item.videosUrls;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('data:')) {
      return [trimmed];
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string' && parsed.trim().length > 0) return [parsed];
    } catch {
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const matches = [...trimmed.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
        if (matches.length > 0) return matches;
      }
      if (trimmed.includes(',')) {
        return trimmed.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      if (trimmed.startsWith('http') || trimmed.startsWith('/')) {
        return [trimmed];
      }
    }
  }
  return [];
}

function mapDbToBusiness(item: any): Business {
  // Extract packed metadata from notes if present
  let metaPaymentMethod = item.payment_method || item.paymentMethod;
  let metaCashCollectedByRep = item.cash_collected_by_rep !== undefined ? Number(item.cash_collected_by_rep) : item.cashCollectedByRep !== undefined ? Number(item.cashCollectedByRep) : undefined;
  let metaGoogleSyncStatus = item.google_sync_status || item.googleSyncStatus;
  let metaGooglePlaceId = item.google_place_id || item.googlePlaceId;
  let metaGoogleSyncDate = item.google_sync_date || item.googleSyncDate;
  let metaRepLocationUrl = item.rep_location_url || item.repLocationUrl;
  let metaGoogleMapsUrl = item.google_maps_url || item.googleMapsUrl;
  let metaRepCommissionRate = item.rep_commission_rate !== undefined && item.rep_commission_rate !== null ? Number(item.rep_commission_rate) : item.repCommissionRate;
  let metaIsFeeExempt = item.is_fee_exempt ?? item.isFeeExempt;
  let metaFeeExemptionReason = item.fee_exemption_reason || item.feeExemptionReason;
  let metaVideos: string[] | undefined = undefined;
  let pureNotes = item.notes;

  if (typeof item.notes === 'string' && item.notes.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(item.notes.trim());
      if (parsed && typeof parsed === 'object') {
        if (parsed.paymentMethod && !metaPaymentMethod) metaPaymentMethod = parsed.paymentMethod;
        if (parsed.cashCollectedByRep !== undefined && metaCashCollectedByRep === undefined) metaCashCollectedByRep = Number(parsed.cashCollectedByRep);
        if (parsed.googleSyncStatus && !metaGoogleSyncStatus) metaGoogleSyncStatus = parsed.googleSyncStatus;
        if (parsed.googlePlaceId && !metaGooglePlaceId) metaGooglePlaceId = parsed.googlePlaceId;
        if (parsed.googleSyncDate && !metaGoogleSyncDate) metaGoogleSyncDate = parsed.googleSyncDate;
        if (parsed.repLocationUrl && !metaRepLocationUrl) metaRepLocationUrl = parsed.repLocationUrl;
        if (parsed.googleMapsUrl && !metaGoogleMapsUrl) metaGoogleMapsUrl = parsed.googleMapsUrl;
        if (parsed.repCommissionRate !== undefined && metaRepCommissionRate === undefined) metaRepCommissionRate = Number(parsed.repCommissionRate);
        if (parsed.isFeeExempt !== undefined && metaIsFeeExempt === undefined) metaIsFeeExempt = parsed.isFeeExempt;
        if (parsed.feeExemptionReason && !metaFeeExemptionReason) metaFeeExemptionReason = parsed.feeExemptionReason;
        if (parsed.videos && Array.isArray(parsed.videos)) metaVideos = parsed.videos;
        pureNotes = parsed.userNotes !== undefined ? parsed.userNotes : undefined;
      }
    } catch {}
  }

  const isFeeExempt = Boolean(metaIsFeeExempt || item.package_price === 0 || item.packagePrice === 0 || item.package_id === 'pkg_exempt');
  const parsedVideos = parseVideosArray(item);
  const finalVideos = parsedVideos.length > 0 ? parsedVideos : (metaVideos || []);

  // Preserve real package price and configuration
  const rawPkgPrice = item.package_price !== undefined && item.package_price !== null
    ? Number(item.package_price)
    : item.packagePrice !== undefined && item.packagePrice !== null
    ? Number(item.packagePrice)
    : isFeeExempt ? 0 : 250;
  const packagePrice = isFeeExempt ? 0 : (isNaN(rawPkgPrice) ? 250 : rawPkgPrice);
  const packageId = isFeeExempt ? 'pkg_exempt' : (item.package_id || item.packageId || (packagePrice === 750 ? 'pkg_pro' : packagePrice === 2000 ? 'pkg_vip' : 'pkg_basic'));
  const packageName = isFeeExempt ? 'نشاط رائج بالمنطقة (إدراج مجاني بدون رسوم)' : (item.package_name || item.packageName || (packageId === 'pkg_pro' ? '2. عرض التأسيس والربط الذكي' : packageId === 'pkg_vip' ? '3. عرض الدعم الميداني والإدارة الشاملة VIP' : '1. باقة التوثيق الأساسي'));

  const rawPaid = Number(item.amount_paid !== undefined && item.amount_paid !== null ? item.amount_paid : (item.amountPaid || 0)) || 0;
  const rawStatus = item.payment_status || item.paymentStatus;
  const isFullyPaid = isFeeExempt || rawStatus === 'fully_paid' || (packagePrice > 0 && rawPaid >= packagePrice);
  const amountPaid = isFeeExempt ? 0 : (isFullyPaid ? packagePrice : rawPaid);
  const paymentStatus: PaymentStatus = isFullyPaid ? 'fully_paid' : amountPaid > 0 ? 'partially_paid' : 'unpaid';

  // Determine actual payment method (Never blindly default to cash_by_rep!)
  const paymentMethod: Business['paymentMethod'] = isFeeExempt
    ? 'platform_collected'
    : (metaPaymentMethod || (amountPaid > 0 ? (metaCashCollectedByRep && metaCashCollectedByRep > 0 ? 'cash_by_rep' : 'platform_collected') : 'platform_collected'));

  const cashCollectedByRep = isFeeExempt
    ? 0
    : (metaCashCollectedByRep !== undefined
    ? metaCashCollectedByRep
    : paymentMethod === 'cash_by_rep'
    ? amountPaid
    : 0);

  const lat = Number(item.lat) || 30.0444;
  const lng = Number(item.lng) || 31.2357;

  // 1. Rep Field Location URL (Unverified - for Admin Review/Upload use only)
  const repLocationUrl = metaRepLocationUrl || item.rep_location_url || item.repLocationUrl || (lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : undefined);

  // 2. Official Verified Google Maps URL (Added by Admin only - strictly verified URLs, never synthetic coordinates fallback)
  let rawGoogleMapsUrl = metaGoogleMapsUrl || item.google_maps_url || item.googleMapsUrl || '';
  if (typeof rawGoogleMapsUrl === 'string') {
    rawGoogleMapsUrl = rawGoogleMapsUrl.trim();
  } else {
    rawGoogleMapsUrl = '';
  }
  const cleanGoogleMapsUrl = (rawGoogleMapsUrl && rawGoogleMapsUrl.startsWith('http') && !rawGoogleMapsUrl.includes('search/?api=1&query='))
    ? rawGoogleMapsUrl
    : undefined;

  return {
    id: item.id || `biz_${Date.now()}`,
    nameAr: item.name_ar || item.nameAr || 'نشاط تجاري',
    nameEn: item.name_en || item.nameEn,
    category: item.category || 'عام',
    governorate: item.governorate || 'القاهرة',
    city: item.city || 'القاهرة',
    street: item.street || '',
    landmark: item.landmark,
    phone: item.phone || '',
    secondaryPhone: item.secondary_phone || item.secondaryPhone,
    workingHours: item.working_hours || item.workingHours || '9 ص - 10 م',
    description: item.description || '',
    lat,
    lng,
    ownerName: item.owner_name || item.ownerName || 'صاحب النشاط',
    ownerPhone: item.owner_phone || item.ownerPhone || '',
    ownerEmail: item.owner_email || item.ownerEmail,
    nationalId: item.national_id || item.nationalId,
    photos: parsePhotosArray(item),
    videos: finalVideos,
    repId: item.rep_id || item.repId || 'rep_1',
    repName: item.rep_name || item.repName || 'مندوب معتمد',
    repCommissionRate: metaRepCommissionRate,
    packageId,
    packageName,
    packagePrice,
    amountPaid,
    paymentMethod,
    cashCollectedByRep,
    paymentStatus,
    verificationStatus: item.verification_status || item.verificationStatus || 'pending',
    repLocationUrl,
    googleMapsUrl: cleanGoogleMapsUrl,
    googlePlaceId: item.google_place_id || item.googlePlaceId || metaGooglePlaceId,
    googleSyncStatus: item.google_sync_status || item.googleSyncStatus || metaGoogleSyncStatus || 'not_synced',
    googleSyncDate: item.google_sync_date || item.googleSyncDate || metaGoogleSyncDate,
    invoiceNumber: item.invoice_number || item.invoiceNumber || 'INV-2026-001',
    invoiceDate: item.invoice_date || item.invoiceDate || new Date().toISOString().split('T')[0],
    notes: pureNotes,
    createdDate: item.created_at || item.created_date || item.createdDate || item.invoice_date || new Date().toISOString(),
    isFeeExempt,
    feeExemptionReason: metaFeeExemptionReason,
  };
}

function getSafeCoreBusinessDbRecord(biz: Partial<Business>): any {
  const isExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
  const record: any = {};
  if (biz.id !== undefined) record.id = biz.id;
  record.name_ar = (biz.nameAr && biz.nameAr.trim()) || (biz.nameEn && biz.nameEn.trim()) || 'نشاط تجاري';
  if (biz.nameEn !== undefined) record.name_en = biz.nameEn?.trim() || null;
  record.category = biz.category || 'عام';
  record.governorate = biz.governorate || 'القاهرة';
  record.city = biz.city || record.governorate || 'القاهرة';
  record.street = biz.street || 'الموقع الجغرافي المسجل على الخريطة';
  record.landmark = biz.landmark?.trim() || null;
  record.phone = (biz.phone && biz.phone.trim()) || (biz.ownerPhone && biz.ownerPhone.trim()) || '01000000000';
  record.secondary_phone = biz.secondaryPhone?.trim() || null;
  record.working_hours = biz.workingHours || 'يومياً من 9:00 صباحاً حتى 11:00 مساءً';
  record.description = biz.description || `نشاط ${record.name_ar} في ${record.governorate}`;
  record.lat = Number(biz.lat) || 30.0444;
  record.lng = Number(biz.lng) || 31.2357;
  record.owner_name = (biz.ownerName && biz.ownerName.trim()) || 'صاحب النشاط';
  record.owner_phone = (biz.ownerPhone && biz.ownerPhone.trim()) || (biz.phone && biz.phone.trim()) || record.phone || '01000000000';
  record.owner_email = biz.ownerEmail?.trim() || null;
  record.national_id = biz.nationalId?.trim() || null;
  record.photos = Array.isArray(biz.photos) ? biz.photos : [];
  record.package_id = isExempt ? 'pkg_exempt' : (biz.packageId || 'pkg_basic');
  record.package_name = isExempt ? 'نشاط رائج بالمنطقة (إدراج مجاني بدون رسوم)' : (biz.packageName || '1. باقة التوثيق الأساسي');
  record.package_price = isExempt ? 0 : (Number(biz.packagePrice) || 250);
  record.amount_paid = isExempt ? 0 : (Number(biz.amountPaid) || 0);
  record.payment_status = isExempt ? 'fully_paid' : (biz.paymentStatus || 'unpaid');
  record.verification_status = biz.verificationStatus || 'pending';
  record.rep_id = biz.repId || 'rep_1';
  record.rep_name = biz.repName || 'مندوب معتمد';
  record.rep_location_url = biz.repLocationUrl || (biz.lat && biz.lng ? `https://www.google.com/maps?q=${biz.lat},${biz.lng}` : null);
  record.google_maps_url = (biz.googleMapsUrl && biz.googleMapsUrl.trim().startsWith('http') && !biz.googleMapsUrl.includes('search/?api=1&query=')) ? biz.googleMapsUrl.trim() : null;
  record.invoice_number = biz.invoiceNumber || `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
  record.invoice_date = biz.invoiceDate || new Date().toISOString().split('T')[0];
  record.created_at = biz.createdDate || new Date().toISOString();

  // Safely preserve financial, sync, and video metadata in notes JSON
  const repLocationUrl = biz.repLocationUrl || (biz.lat && biz.lng ? `https://www.google.com/maps?q=${biz.lat},${biz.lng}` : null);
  const googleMapsUrl = (biz.googleMapsUrl && biz.googleMapsUrl.trim().startsWith('http') && !biz.googleMapsUrl.includes('search/?api=1&query=')) ? biz.googleMapsUrl.trim() : null;

  const metaObj = {
    paymentMethod: biz.paymentMethod,
    cashCollectedByRep: isExempt ? 0 : biz.cashCollectedByRep,
    repCommissionRate: isExempt ? 0 : biz.repCommissionRate,
    isFeeExempt: isExempt,
    feeExemptionReason: biz.feeExemptionReason,
    googleSyncStatus: biz.googleSyncStatus,
    googlePlaceId: biz.googlePlaceId,
    googleSyncDate: biz.googleSyncDate,
    repLocationUrl,
    googleMapsUrl,
    videos: Array.isArray(biz.videos)
      ? biz.videos.filter(v => typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://')))
      : [],
    userNotes: typeof biz.notes === 'string' && biz.notes.trim().startsWith('{') ? undefined : biz.notes,
  };
  record.notes = JSON.stringify(metaObj);

  return record;
}

function mapBusinessToDb(biz: Partial<Business>): any {
  return getSafeCoreBusinessDbRecord(biz);
}

function mapDbToRep(item: any): Representative {
  let parsedAvatar = item.avatar || '';
  let metaReferralCode: string | undefined = item.referral_code || item.referralCode;
  let metaReferredByCode: string | undefined = item.referred_by_code || item.referredByCode;
  let metaReferralUnlocked = item.referral_unlocked ?? item.referralUnlocked;
  let metaAdminBypassReferral = item.admin_bypass_referral ?? item.adminBypassReferral;
  let metaReferralRewardGranted = item.referral_reward_granted ?? item.referralRewardGranted;
  let metaActivationFacePhoto: string | undefined = item.activation_face_photo || item.activationFacePhoto;
  let metaNationalIdCardPhoto: string | undefined = item.national_id_card_photo || item.nationalIdCardPhoto;
  let metaNationalIdCardBackPhoto: string | undefined = item.national_id_card_back_photo || item.nationalIdCardBackPhoto;
  let metaPendingPhone: string | undefined = item.pending_phone || item.pendingPhone;
  let metaPhoneStatus = item.phone_status || item.phoneStatus || 'none';

  // Backward compatibility check for legacy JSON avatar packing
  if (typeof parsedAvatar === 'string' && parsedAvatar.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(parsedAvatar.trim());
      if (parsed && typeof parsed === 'object') {
        parsedAvatar = parsed.avatar || '';
        if (parsed.referralCode && !metaReferralCode) metaReferralCode = parsed.referralCode;
        if (parsed.referredByCode && !metaReferredByCode) metaReferredByCode = parsed.referredByCode;
        if (parsed.referralUnlocked !== undefined && metaReferralUnlocked === undefined) metaReferralUnlocked = parsed.referralUnlocked;
        if (parsed.adminBypassReferral !== undefined && metaAdminBypassReferral === undefined) metaAdminBypassReferral = parsed.adminBypassReferral;
        if (parsed.referralRewardGranted !== undefined && metaReferralRewardGranted === undefined) metaReferralRewardGranted = parsed.referralRewardGranted;
        if (parsed.activationFacePhoto && !metaActivationFacePhoto) metaActivationFacePhoto = parsed.activationFacePhoto;
        if (parsed.nationalIdCardPhoto && !metaNationalIdCardPhoto) metaNationalIdCardPhoto = parsed.nationalIdCardPhoto;
        if (parsed.nationalIdCardBackPhoto && !metaNationalIdCardBackPhoto) metaNationalIdCardBackPhoto = parsed.nationalIdCardBackPhoto;
        if (parsed.pendingPhone && !metaPendingPhone) metaPendingPhone = parsed.pendingPhone;
        if (parsed.phoneStatus && metaPhoneStatus === 'none') metaPhoneStatus = parsed.phoneStatus;
      }
    } catch {}
  }

  const cleanId = (item.id || '').replace(/\D/g, '').slice(-4) || (item.phone || '').replace(/\D/g, '').slice(-4) || '2026';
  const defaultRefCode = item.id === 'rep_ahmed_ezalden' ? 'DALIL-8355' : `DALIL-${cleanId}`;

  return {
    id: item.id,
    name: item.name || 'مندوب معتمد',
    email: item.email || '',
    phone: item.phone || '',
    pendingPhone: metaPendingPhone,
    phoneStatus: metaPhoneStatus,
    nationalId: item.national_id || item.nationalId,
    activationFacePhoto: metaActivationFacePhoto || '',
    nationalIdCardPhoto: metaNationalIdCardPhoto || '',
    nationalIdCardBackPhoto: metaNationalIdCardBackPhoto || '',
    role: item.role || 'rep',
    roleTitle: item.role_title || item.roleTitle || 'مندوب مبيعات ميداني',
    governorate: item.governorate || 'القاهرة',
    targetMonth: Number(item.target_month || item.targetMonth) || 25,
    avatar: parsedAvatar,
    avatarStatus: item.avatar_status || item.avatarStatus || 'none',
    commissionRate: Number(item.commission_rate || item.commissionRate) || 42.86,
    status: item.status || 'active',
    password: item.password || (item.role === 'admin' ? 'admin' : 'Aa123456'),
    activeSessionId: item.active_session_id || item.activeSessionId,
    lastActiveTimestamp: item.last_active_timestamp ? Number(item.last_active_timestamp) : (item.lastActiveTimestamp ? Number(item.lastActiveTimestamp) : undefined),
    referralCode: metaReferralCode || defaultRefCode,
    referredByCode: metaReferredByCode || undefined,
    referralUnlocked: Boolean(metaReferralUnlocked),
    adminBypassReferral: Boolean(metaAdminBypassReferral),
    referralRewardGranted: Boolean(metaReferralRewardGranted),
  };
}

function mapRepToDb(rep: Partial<Representative>): any {
  const record: any = {};

  if (rep.id !== undefined) record.id = rep.id;
  if (rep.name !== undefined) record.name = rep.name;
  if (rep.email !== undefined) record.email = rep.email;
  if (rep.phone !== undefined) record.phone = rep.phone;
  if (rep.pendingPhone !== undefined) record.pending_phone = rep.pendingPhone || null;
  if (rep.phoneStatus !== undefined) record.phone_status = rep.phoneStatus || 'none';
  if (rep.nationalId !== undefined) record.national_id = rep.nationalId || null;
  if (rep.activationFacePhoto !== undefined) record.activation_face_photo = rep.activationFacePhoto || null;
  if (rep.nationalIdCardPhoto !== undefined) record.national_id_card_photo = rep.nationalIdCardPhoto || null;
  if (rep.nationalIdCardBackPhoto !== undefined) record.national_id_card_back_photo = rep.nationalIdCardBackPhoto || null;
  if (rep.role !== undefined) record.role = rep.role;
  if (rep.roleTitle !== undefined) record.role_title = rep.roleTitle;
  if (rep.governorate !== undefined) record.governorate = rep.governorate;
  if (rep.targetMonth !== undefined) record.target_month = Number(rep.targetMonth) || 25;
  if (rep.avatar !== undefined) record.avatar = rep.avatar || null;
  if (rep.avatarStatus !== undefined) record.avatar_status = rep.avatarStatus || 'approved';
  if (rep.commissionRate !== undefined) record.commission_rate = Number(rep.commissionRate) || 42.86;
  if (rep.status !== undefined) record.status = rep.status;
  if (rep.password !== undefined) record.password = rep.password;
  if (rep.activeSessionId !== undefined) record.active_session_id = rep.activeSessionId || null;
  if (rep.lastActiveTimestamp !== undefined) record.last_active_timestamp = rep.lastActiveTimestamp || null;
  if (rep.referralCode !== undefined) record.referral_code = rep.referralCode || null;
  if (rep.referredByCode !== undefined) record.referred_by_code = rep.referredByCode || null;
  if (rep.referralUnlocked !== undefined) record.referral_unlocked = Boolean(rep.referralUnlocked);
  if (rep.adminBypassReferral !== undefined) record.admin_bypass_referral = Boolean(rep.adminBypassReferral);
  if (rep.referralRewardGranted !== undefined) record.referral_reward_granted = Boolean(rep.referralRewardGranted);

  return record;
}

function mapDbToPayout(item: any): PayoutRequest {
  return {
    id: item.id || `payout_${Date.now()}`,
    repId: item.rep_id || item.repId,
    repName: item.rep_name || item.repName || 'مندوب معتمد',
    repPhone: item.rep_phone || item.repPhone || '',
    amount: Number(item.amount) || 0,
    method: item.method || 'instapay',
    accountDetails: item.account_details || item.accountDetails || '',
    status: item.status || 'pending',
    requestDate: item.request_date || item.requestDate || item.created_at || new Date().toISOString(),
    processedDate: item.processed_date || item.processedDate,
    receiptPhoto: item.receipt_photo || item.receiptPhoto,
    transactionRef: item.transaction_ref || item.transactionRef,
    adminNotes: item.admin_notes || item.adminNotes,
    type: item.type || (item.receipt_photo ? 'remittance' : 'payout'),
  };
}

function mapPayoutToDb(payout: PayoutRequest): any {
  return {
    id: payout.id,
    rep_id: payout.repId,
    rep_name: payout.repName,
    rep_phone: payout.repPhone,
    amount: Number(payout.amount) || 0,
    method: payout.method,
    account_details: payout.accountDetails,
    status: payout.status,
    request_date: payout.requestDate,
    processed_date: payout.processedDate || null,
    receipt_photo: payout.receiptPhoto || null,
    transaction_ref: payout.transactionRef || null,
    admin_notes: payout.adminNotes || null,
    type: payout.type || 'payout',
  };
}

function mapDbToLead(item: any): InterestedLead {
  return {
    id: item.id || `lead_${Date.now()}`,
    clientName: item.client_name || item.clientName || item.name || 'عميل محتمل',
    businessName: item.business_name || item.businessName || item.business_type || 'نشاط تجاري',
    businessCategory: item.business_category || item.businessCategory,
    phone: item.phone || '',
    secondaryPhone: item.secondary_phone || item.secondaryPhone,
    governorate: item.governorate || 'القاهرة',
    city: item.city || 'القاهرة',
    interestLevel: item.interest_level || item.interestLevel || 'high',
    notes: item.notes,
    followUpDate: item.follow_up_date || item.followUpDate,
    createdDate: item.created_at || item.created_date || item.createdDate || new Date().toISOString(),
    repId: item.rep_id || item.repId || 'rep_1',
    repName: item.rep_name || item.repName || 'مندوب معتمد',
    lastContactedDate: item.last_contacted_date || item.lastContactedDate,
    status: item.status || 'pending_followup',
  };
}

function mapLeadToDb(lead: InterestedLead): any {
  return {
    id: lead.id,
    client_name: lead.clientName,
    business_name: lead.businessName || null,
    business_category: lead.businessCategory || null,
    phone: lead.phone,
    secondary_phone: lead.secondaryPhone || null,
    governorate: lead.governorate,
    city: lead.city || null,
    interest_level: lead.interestLevel,
    notes: lead.notes || null,
    follow_up_date: lead.followUpDate || null,
    created_at: lead.createdDate,
    rep_id: lead.repId,
    rep_name: lead.repName,
    last_contacted_date: lead.lastContactedDate || null,
    status: lead.status,
  };
}
