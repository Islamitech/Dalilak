import { supabase, supabaseRestFetch, isSupabaseConfigured } from '../../lib/supabase';
import { PayoutRequest } from '../../types';
import { safeSetLocalStorageItem, safeGetLocalStorageItem, safeParseJson, getApiAuthHeaders } from '../../utils/storage';
import {
  saveOfflinePayout,
  getOfflinePayouts,
  removeOfflinePayout,
} from '../offlineSync';
import { mapDbToPayout, mapPayoutToDb } from './dbMappers';


export async function fetchPayoutRequestsFromDb(repId?: string): Promise<PayoutRequest[]> {
  const cachedStr = typeof localStorage !== 'undefined' ? localStorage.getItem('dalelak_cached_payouts') : null;
  let cached: PayoutRequest[] = [];
  try {
    if (cachedStr) cached = JSON.parse(cachedStr);
  } catch {}

  if (isSupabaseConfigured() && (typeof navigator === 'undefined' || navigator.onLine)) {
    try {
      let query = supabase.from('payout_requests').select('*').order('request_date', { ascending: false });
      if (repId) {
        query = query.eq('rep_id', repId);
      }
      const { data, error } = await query;
      if (!error && data && Array.isArray(data)) {
        const mapped = data.map(mapDbToPayout);

        // ⚡ Auto-Heal: If the rep has pending local payouts submitted previously when table was offline, sync them now
        if (repId && Array.isArray(cached) && cached.length > 0) {
          const missingInCloud = cached.filter((c) => c.repId === repId && !mapped.some((m) => m.id === c.id));
          if (missingInCloud.length > 0) {
            for (const item of missingInCloud) {
              try {
                await supabase.from('payout_requests').upsert([mapPayoutToDb(item)], { onConflict: 'id' });
                mapped.unshift(item);
              } catch {}
            }
          }
        }

        if (typeof localStorage !== 'undefined') {
          safeSetLocalStorageItem('dalelak_cached_payouts', JSON.stringify(mapped));
        }
        return mapped;
      }

      const restEndpoint = repId
        ? `payout_requests?rep_id=eq.${encodeURIComponent(repId)}&select=*&order=request_date.desc`
        : 'payout_requests?select=*&order=request_date.desc';
      const res = await supabaseRestFetch(restEndpoint);
      if (res.ok) {
        const restData = await res.json();
        if (Array.isArray(restData)) {
          const mapped = restData.map(mapDbToPayout);
          if (typeof localStorage !== 'undefined') {
            safeSetLocalStorageItem('dalelak_cached_payouts', JSON.stringify(mapped));
          }
          return mapped;
        }
      }
    } catch (err) {
      console.error('Supabase fetch payout requests error:', err);
    }
  }

  // Fallback: Merge LocalStorage cache with Express Local Server API
  let fallbackList: PayoutRequest[] = cached;
  try {
    const localRes = await fetch('/api/payouts');
    if (localRes.ok) {
      const localData = await localRes.json();
      if (Array.isArray(localData) && localData.length > 0) {
        const map = new Map<string, PayoutRequest>();
        fallbackList.forEach((p) => map.set(p.id, p));
        localData.forEach((p: any) => map.set(p.id, mapDbToPayout(p)));
        fallbackList = Array.from(map.values());
      }
    }
  } catch {}

  if (fallbackList.length > 0) {
    return repId ? fallbackList.filter((p) => p.repId === repId) : fallbackList;
  }

  return [];
}

export async function createPayoutRequestInDb(payout: PayoutRequest): Promise<PayoutRequest> {
  const dbRecord = mapPayoutToDb(payout);
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Immediate LocalStorage update
  try {
    const cachedStr = localStorage.getItem('dalelak_cached_payouts');
    let cachedList: PayoutRequest[] = cachedStr ? JSON.parse(cachedStr) : [];
    cachedList = [payout, ...cachedList.filter((p) => p.id !== payout.id)];
    safeSetLocalStorageItem('dalelak_cached_payouts', JSON.stringify(cachedList));
  } catch {}

  if (isOnline && isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('payout_requests').upsert([dbRecord], { onConflict: 'id' });
      if (error) {
        await supabaseRestFetch('payout_requests', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify(dbRecord),
        });
      }
    } catch (err) {
      console.error('Supabase create payout request error:', err);
    }
  }

  try {
    await fetch('/api/payouts', {
      method: 'POST',
      headers: { ...getApiAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payout),
    });
  } catch {}

  return payout;
}

export async function updatePayoutRequestInDb(payout: PayoutRequest): Promise<PayoutRequest> {
  const dbUpdates = mapPayoutToDb(payout);
  delete dbUpdates.id;

  // Immediate LocalStorage update
  try {
    const cachedStr = localStorage.getItem('dalelak_cached_payouts');
    if (cachedStr) {
      const cachedList: PayoutRequest[] = JSON.parse(cachedStr);
      const updatedList = cachedList.map((p) => (p.id === payout.id ? payout : p));
      safeSetLocalStorageItem('dalelak_cached_payouts', JSON.stringify(updatedList));
    }
  } catch {}

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
      headers: { ...getApiAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payout),
    });
  } catch {}

  return payout;
}

/**
 * 🗑️ Deletes / purges a payout request or remittance order permanently (Super Admin only)
 */
export async function deletePayoutRequestFromDb(id: string): Promise<void> {
  // 1. LocalStorage update
  try {
    const cachedStr = localStorage.getItem('dalelak_cached_payouts');
    if (cachedStr) {
      const cachedList: PayoutRequest[] = JSON.parse(cachedStr);
      const filtered = cachedList.filter((p) => p.id !== id);
      safeSetLocalStorageItem('dalelak_cached_payouts', JSON.stringify(filtered));
    }
  } catch {}

  // 2. Supabase deletion
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('payout_requests').delete().eq('id', id);
      if (error) {
        await supabaseRestFetch(`payout_requests?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      }
    } catch (err) {
      console.error('Supabase delete payout request error:', err);
    }
  }

  // 3. Local server API
  try {
    await fetch(`/api/payouts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getApiAuthHeaders(),
    });
  } catch {}
}

