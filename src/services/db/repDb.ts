import { supabase, supabaseRestFetch, isSupabaseConfigured } from '../../lib/supabase';
import { Representative } from '../../types';
import { MOCK_REPRESENTATIVES } from '../../data/mockData';
import { safeSetLocalStorageItem, safeGetLocalStorageItem, getSafeRepsForStorage, safeParseJson, getApiAuthHeaders } from '../../utils/storage';
import { mapDbToRep, mapRepToDb } from './dbMappers';


const SAFE_REP_SELECT = 'id,name,email,phone,national_id,role,role_title,governorate,target_month,avatar,avatar_status,commission_rate,status,created_at';

export async function fetchRepsFromDb(): Promise<Representative[]> {
  // 1. Supabase Cloud fetch (PRIMARY SOURCE OF TRUTH)
  if (isSupabaseConfigured()) {
    try {
      const res = await supabaseRestFetch(`representatives?select=${SAFE_REP_SELECT}&order=created_at.desc`);
      if (res.ok) {
        const restData = await res.json();
        if (Array.isArray(restData) && restData.length > 0) {
          const freshList = restData.map(mapDbToRep);
          try {
            safeSetLocalStorageItem('dalelak_cached_reps', JSON.stringify(getSafeRepsForStorage(freshList)));
          } catch {}
          return freshList;
        }
      } else {
        // Fallback to select=* if column selection encounters schema mismatch
        const fallbackRes = await supabaseRestFetch('representatives?select=*&order=created_at.desc');
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (Array.isArray(fallbackData) && fallbackData.length > 0) {
            const freshList = fallbackData.map(mapDbToRep);
            try {
              safeSetLocalStorageItem('dalelak_cached_reps', JSON.stringify(getSafeRepsForStorage(freshList)));
            } catch {}
            return freshList;
          }
        }
      }
    } catch (err) {
      console.warn('Supabase fetch reps REST error:', err);
    }

    try {
      let { data, error } = await supabase.from('representatives').select(SAFE_REP_SELECT).order('created_at', { ascending: false });
      if (error || !data || data.length === 0) {
        const fallback = await supabase.from('representatives').select('*').order('created_at', { ascending: false });
        data = fallback.data;
        error = fallback.error;
      }
      if (!error && data && Array.isArray(data) && data.length > 0) {
        const freshList = data.map(mapDbToRep);
        try {
          safeSetLocalStorageItem('dalelak_cached_reps', JSON.stringify(getSafeRepsForStorage(freshList)));
        } catch {}
        return freshList;
      }
    } catch (err) {
      console.warn('Supabase fetch reps SDK error:', err);
    }
  }

  // 2. Local Server API fetch fallback (runs if Supabase is restricted or offline)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const localRes = await fetch('/api/representatives', {
      headers: getApiAuthHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (localRes.ok) {
      const localData = await localRes.json();
      if (Array.isArray(localData) && localData.length > 0) {
        return localData.map(mapDbToRep);
      }
    }
  } catch {}

  // 3. Offline fallback from local cache (merging cached and custom reps)
  try {
    const cached = safeParseJson<Representative[]>(localStorage.getItem('dalelak_cached_reps'), []) || [];
    const custom = safeParseJson<Representative[]>(localStorage.getItem('dalelak_custom_reps'), []) || [];
    const map = new Map<string, Representative>();
    cached.forEach((r) => map.set(r.id, r));
    custom.forEach((r) => map.set(r.id, r));
    if (map.size > 0) {
      return Array.from(map.values());
    }
  } catch {}

  return [...MOCK_REPRESENTATIVES];
}

export async function saveRepToDb(rep: Representative): Promise<void> {
  const dbRecord = mapRepToDb(rep);

  // 1. Direct Supabase Cloud Save / Upsert
  if (isSupabaseConfigured()) {
    try {
      // First try update by ID if it already exists
      const { error: updateErr, data } = await supabase
        .from('representatives')
        .update(dbRecord)
        .eq('id', rep.id)
        .select();

      if (updateErr || !data || data.length === 0) {
        // Record doesn't exist yet or update error — perform upsert
        const { error: upsertErr } = await supabase
          .from('representatives')
          .upsert(dbRecord, { onConflict: 'id' });

        if (upsertErr) {
          const patchRes = await supabaseRestFetch(`representatives?id=eq.${encodeURIComponent(rep.id)}`, {
            method: 'PATCH',
            body: JSON.stringify(dbRecord),
          });

          if (!patchRes.ok) {
            await supabaseRestFetch('representatives', {
              method: 'POST',
              headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
              body: JSON.stringify(dbRecord),
            });
          }
        }
      }
    } catch (err) {
      console.warn('Supabase save rep REST warning:', err);
    }
  }

  // 2. Update in LocalStorage cache (syncing both cached and custom reps keys)
  try {
    const updateCache = (key: string) => {
      const cached = safeParseJson<Representative[]>(localStorage.getItem(key), []);
      const map = new Map<string, Representative>();
      map.set(rep.id, rep);
      if (rep.email) map.set(rep.email.toLowerCase(), rep);
      if (Array.isArray(cached)) {
        cached.forEach((r: Representative) => {
          const emailKey = (r.email || '').toLowerCase();
          if (!map.has(r.id) && (!emailKey || !map.has(emailKey))) {
            map.set(r.id, r);
          }
        });
      }
      safeSetLocalStorageItem(key, JSON.stringify(getSafeRepsForStorage(Array.from(map.values()))));
    };

    updateCache('dalelak_cached_reps');
    updateCache('dalelak_custom_reps');
  } catch {}

  // 3. Always sync to local server
  try {
    await fetch('/api/representatives', {
      method: 'POST',
      headers: { ...getApiAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(rep),
    });
  } catch {}
}

export async function updateRepInDb(id: string, updates: Partial<Representative>): Promise<void> {
  // 1. Update in LocalStorage (both custom and cached keys)
  try {
    const updateCache = (key: string) => {
      const cached = safeParseJson<Representative[]>(localStorage.getItem(key), []);
      if (Array.isArray(cached)) {
        const updated = cached.map((r: Representative) => (r.id === id ? { ...r, ...updates } : r));
        safeSetLocalStorageItem(key, JSON.stringify(updated));
      }
    };
    updateCache('dalelak_custom_reps');
    updateCache('dalelak_cached_reps');
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
      headers: { ...getApiAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch {}
}

export async function deleteRepFromDb(id: string): Promise<void> {
  // 1. Blacklist in deleted reps registry
  try {
    const delArr = safeParseJson<string[]>(localStorage.getItem('dalelak_deleted_rep_ids'), []);
    const delSet = new Set(Array.isArray(delArr) ? delArr : []);
    delSet.add(id.toLowerCase());
    safeSetLocalStorageItem('dalelak_deleted_rep_ids', JSON.stringify(Array.from(delSet)));
  } catch {}

  // 2. Remove from LocalStorage custom reps
  try {
    const cached = safeParseJson<Representative[]>(localStorage.getItem('dalelak_custom_reps'), []);
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
      headers: getApiAuthHeaders(),
    });
  } catch {}
}

export async function updateRepSessionInDb(id: string, sessionId?: string, timestamp?: number): Promise<void> {
  const now = timestamp || Date.now();

  // 1. Real-time active session synchronization to LocalStorage
  try {
    const cached = safeParseJson<Representative[]>(localStorage.getItem('dalelak_custom_reps'), []);
    if (Array.isArray(cached)) {
      const updated = cached.map((r: Representative) =>
        r.id === id || r.phone === id
          ? { ...r, activeSessionId: sessionId !== undefined ? sessionId : r.activeSessionId, lastActiveTimestamp: now }
          : r
      );
      safeSetLocalStorageItem('dalelak_custom_reps', JSON.stringify(updated));
    }
  } catch {}

  // 2. Real-time active session synchronization to Supabase Cloud via dedicated columns
  // 🔐 BUG-04 FIX: استخدام عمودي active_session_id و last_active_timestamp مباشرة
  // بدلاً من تخزين بيانات الجلسة داخل حقل avatar (كان يُسبب تلف صور المندوبين في DB)
  if (isSupabaseConfigured()) {
    try {
      const sessionUpdates: Record<string, any> = {
        last_active_timestamp: now,
      };
      if (sessionId !== undefined) {
        sessionUpdates.active_session_id = sessionId;
      }

      await supabaseRestFetch(`representatives?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(sessionUpdates),
      });
    } catch (err) {
      console.warn('Supabase session sync warning:', err);
    }
  }

  // 3. Real-time active session synchronization to local Express backend if present
  try {
    await fetch('/api/auth/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id, sessionId, timestamp: now }),
    });
  } catch {}
}
