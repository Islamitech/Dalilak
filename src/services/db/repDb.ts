import { supabase, supabaseRestFetch, isSupabaseConfigured } from '../../lib/supabase';
import { Representative } from '../../types';
import { MOCK_REPRESENTATIVES } from '../../data/mockData';
import { safeSetLocalStorageItem, safeGetLocalStorageItem, getSafeRepsForStorage, safeParseJson, getApiAuthHeaders } from '../../utils/storage';
import { mapDbToRep, mapRepToDb } from './dbMappers';


const SAFE_REP_SELECT = 'id,name,email,phone,national_id,role,role_title,governorate,target_month,avatar,avatar_status,commission_rate,status,password,created_at';

function filterOutDeletedReps(reps: Representative[]): { active: Representative[]; deleted: Representative[] } {
  const blacklist = new Set(
    (safeParseJson<string[]>(localStorage.getItem('dalelak_deleted_rep_ids'), []) || [])
      .filter(Boolean)
      .map((x) => String(x).toLowerCase().trim())
      .filter((x) => x.length > 0)
  );
  const softDeletedList = getDeletedRepresentatives();
  const softDeletedIds = new Set(softDeletedList.map((r) => (r.id || '').toLowerCase().trim()).filter(Boolean));
  const softDeletedEmails = new Set(softDeletedList.map((r) => (r.email || '').toLowerCase().trim()).filter(Boolean));
  const softDeletedPhones = new Set(softDeletedList.map((r) => (r.phone || '').trim()).filter(Boolean));

  const active: Representative[] = [];
  const deleted: Representative[] = [];

  reps.forEach((r) => {
    const idLower = (r.id || '').toLowerCase().trim();
    const emailLower = (r.email || '').toLowerCase().trim();
    const phoneTrim = (r.phone || '').trim();

    const isExcluded =
      Boolean(r.isDeleted) ||
      (Boolean(idLower) && (blacklist.has(idLower) || softDeletedIds.has(idLower))) ||
      (Boolean(emailLower) && (blacklist.has(emailLower) || softDeletedEmails.has(emailLower))) ||
      (Boolean(phoneTrim) && (blacklist.has(phoneTrim) || softDeletedPhones.has(phoneTrim)));

    if (isExcluded) {
      deleted.push(r);
    } else {
      active.push(r);
    }
  });

  return { active, deleted };
}

function syncSoftDeletedFromDb(deleted: Representative[]) {
  const blacklist = new Set(
    (safeParseJson<string[]>(localStorage.getItem('dalelak_deleted_rep_ids'), []) || [])
      .filter(Boolean)
      .map((x) => String(x).toLowerCase().trim())
      .filter((x) => x.length > 0)
  );
  const genuinelySoft = deleted.filter(
    (d) =>
      d.isDeleted &&
      !blacklist.has((d.id || '').toLowerCase().trim()) &&
      (!d.email || !blacklist.has(d.email.toLowerCase().trim()))
  );
  if (genuinelySoft.length > 0) {
    try {
      const existingDeleted = getDeletedRepresentatives();
      const delMap = new Map<string, Representative>();
      existingDeleted.forEach((e) => delMap.set(e.id, e));
      genuinelySoft.forEach((d) => delMap.set(d.id, d));
      safeSetLocalStorageItem('dalelak_soft_deleted_reps', JSON.stringify(Array.from(delMap.values())));
    } catch {}
  }
}

export async function fetchRepsFromDb(): Promise<Representative[]> {
  // 1. Supabase Cloud fetch (PRIMARY SOURCE OF TRUTH)
  if (isSupabaseConfigured()) {
    try {
      const res = await supabaseRestFetch(`representatives?select=${SAFE_REP_SELECT}&order=created_at.desc`);
      if (res.ok) {
        const restData = await res.json();
        if (Array.isArray(restData) && restData.length > 0) {
          const freshList = restData.map(mapDbToRep);
          const { active, deleted } = filterOutDeletedReps(freshList);
          syncSoftDeletedFromDb(deleted);

          try {
            safeSetLocalStorageItem('dalelak_cached_reps', JSON.stringify(getSafeRepsForStorage(active)));
          } catch {}
          return active;
        }
      } else {
        // Fallback to select=* if column selection encounters schema mismatch
        const fallbackRes = await supabaseRestFetch('representatives?select=*&order=created_at.desc');
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (Array.isArray(fallbackData) && fallbackData.length > 0) {
            const freshList = fallbackData.map(mapDbToRep);
            const { active, deleted } = filterOutDeletedReps(freshList);
            syncSoftDeletedFromDb(deleted);

            try {
              safeSetLocalStorageItem('dalelak_cached_reps', JSON.stringify(getSafeRepsForStorage(active)));
            } catch {}
            return active;
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
        const { active, deleted } = filterOutDeletedReps(freshList);
        syncSoftDeletedFromDb(deleted);

        try {
          safeSetLocalStorageItem('dalelak_cached_reps', JSON.stringify(getSafeRepsForStorage(active)));
        } catch {}
        return active;
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
        const mapped = localData.map(mapDbToRep);
        const { active } = filterOutDeletedReps(mapped);
        return active;
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
      const { active } = filterOutDeletedReps(Array.from(map.values()));
      return active;
    }
  } catch {}

  const { active } = filterOutDeletedReps([...MOCK_REPRESENTATIVES]);
  return active;
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
        // Fallback: direct plain INSERT
        const insertRes = await supabaseRestFetch('representatives', {
          method: 'POST',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(dbRecord),
        });

        if (!insertRes.ok) {
          // Fallback: PATCH by ID
          await supabaseRestFetch(`representatives?id=eq.${encodeURIComponent(rep.id)}`, {
            method: 'PATCH',
            body: JSON.stringify(dbRecord),
          });
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

export function getDeletedRepresentatives(): Representative[] {
  const raw = safeGetLocalStorageItem('dalelak_soft_deleted_reps');
  return safeParseJson<Representative[]>(raw, []);
}

/**
 * 📦 Soft Delete Representative (الأثر على السيرفر):
 * Marks the rep as deleted so they disappear from normal users/admins,
 * but preserves all data & KYC records in Supabase & server audit for the Super Admin.
 */
export async function softDeleteRepInDb(
  rep: Representative,
  deletedBy: string,
  deletedByRole?: string
): Promise<void> {
  const updatedRep: Representative = {
    ...rep,
    isDeleted: true,
    status: 'suspended',
    activeSessionId: undefined,
    lastActiveTimestamp: undefined,
    deletedAt: new Date().toISOString(),
    deletedBy,
    deletedByRole,
  };

  const targetEmail = (rep.email || '').toLowerCase().trim();
  const targetPhone = (rep.phone || '').trim();

  // 1. Clean from ALL active caches immediately and Blacklist
  try {
    const purgeCache = (key: string) => {
      const cached = safeParseJson<Representative[]>(localStorage.getItem(key), []);
      if (Array.isArray(cached)) {
        const filtered = cached.filter(
          (r: Representative) =>
            r.id !== rep.id &&
            (!targetEmail || (r.email || '').toLowerCase().trim() !== targetEmail) &&
            (!targetPhone || (r.phone || '').trim() !== targetPhone)
        );
        safeSetLocalStorageItem(key, JSON.stringify(filtered));
      }
    };
    purgeCache('dalelak_custom_reps');
    purgeCache('dalelak_cached_reps');

    // Add to soft deleted list
    const deletedList = getDeletedRepresentatives().filter(
      (r) =>
        r.id !== rep.id &&
        (!targetEmail || (r.email || '').toLowerCase().trim() !== targetEmail) &&
        (!targetPhone || (r.phone || '').trim() !== targetPhone)
    );
    safeSetLocalStorageItem('dalelak_soft_deleted_reps', JSON.stringify([updatedRep, ...deletedList]));

    // 🛡️ Blacklist account permanently to block login & actions everywhere
    const delArr = safeParseJson<string[]>(localStorage.getItem('dalelak_deleted_rep_ids'), []);
    const delSet = new Set(Array.isArray(delArr) ? delArr.map((x) => String(x).toLowerCase().trim()) : []);
    if (rep.id) delSet.add(rep.id.toLowerCase().trim());
    if (targetEmail) delSet.add(targetEmail);
    if (targetPhone) delSet.add(targetPhone);
    safeSetLocalStorageItem('dalelak_deleted_rep_ids', JSON.stringify(Array.from(delSet)));

    // ⚡ Terminate any active sessions on this browser if current user is this rep
    const activeUserStr = safeGetLocalStorageItem('dalelak_logged_user') || safeGetLocalStorageItem('dalelak_active_user');
    if (activeUserStr) {
      try {
        const parsed = JSON.parse(activeUserStr);
        if (
          parsed &&
          (parsed.id === rep.id || (parsed.email && parsed.email.toLowerCase() === targetEmail))
        ) {
          localStorage.removeItem('dalelak_logged_user');
          localStorage.removeItem('dalelak_active_user');
          sessionStorage.removeItem('dalelak_active_user');
        }
      } catch {}
    }

    // ⚡ Broadcast immediate termination across all tabs
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_single_session_channel') : null;
    if (channel) {
      channel.postMessage({ type: 'ACCOUNT_TERMINATED', userId: rep.id, email: targetEmail });
      channel.close();
    }
  } catch {}

  // 2. Persist to Supabase directly without touching active local caches
  const dbRecord = mapRepToDb(updatedRep);
  delete dbRecord.id;
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('representatives')
        .update(dbRecord)
        .eq('id', rep.id);

      if (error) {
        await supabaseRestFetch(`representatives?id=eq.${encodeURIComponent(rep.id)}`, {
          method: 'PATCH',
          body: JSON.stringify(dbRecord),
        });
      }
    } catch (err) {
      console.warn('Supabase soft delete rep error:', err);
    }
  }

  // 3. Sync to local server
  try {
    await fetch(`/api/representatives/${encodeURIComponent(rep.id)}`, {
      method: 'PUT',
      headers: { ...getApiAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(dbRecord),
    });
  } catch {}
}

/**
 * 🟢 Restores a soft-deleted representative back to active state
 */
export async function restoreRepInDb(rep: Representative): Promise<Representative> {
  const restored: Representative = {
    ...rep,
    isDeleted: false,
    deletedAt: undefined,
    deletedBy: undefined,
    deletedByRole: undefined,
    status: 'active',
  };

  const targetEmail = (rep.email || '').toLowerCase().trim();
  const targetPhone = (rep.phone || '').trim();

  // 1. Remove from soft deleted list and remove from blacklist
  try {
    const deletedList = getDeletedRepresentatives().filter(
      (r) =>
        r.id !== rep.id &&
        (!targetEmail || (r.email || '').toLowerCase().trim() !== targetEmail) &&
        (!targetPhone || (r.phone || '').trim() !== targetPhone)
    );
    safeSetLocalStorageItem('dalelak_soft_deleted_reps', JSON.stringify(deletedList));

    const delArr = safeParseJson<string[]>(localStorage.getItem('dalelak_deleted_rep_ids'), []);
    const delFiltered = (Array.isArray(delArr) ? delArr : []).filter(
      (id) =>
        id !== rep.id.toLowerCase() &&
        (!targetEmail || id !== targetEmail) &&
        (!targetPhone || id !== targetPhone)
    );
    safeSetLocalStorageItem('dalelak_deleted_rep_ids', JSON.stringify(delFiltered));

    // Restore to active caches
    const cached = safeParseJson<Representative[]>(localStorage.getItem('dalelak_custom_reps'), []) || [];
    safeSetLocalStorageItem('dalelak_custom_reps', JSON.stringify([restored, ...cached.filter((r) => r.id !== rep.id)]));

    const cachedReps = safeParseJson<Representative[]>(localStorage.getItem('dalelak_cached_reps'), []) || [];
    safeSetLocalStorageItem('dalelak_cached_reps', JSON.stringify([restored, ...cachedReps.filter((r) => r.id !== rep.id)]));
  } catch {}

  // 2. Save back to DB
  await saveRepToDb(restored);
  return restored;
}

/**
 * 🔴 Permanent Purge (حذف نهائي بات):
 * Completely deletes the rep record from Supabase, local server, and all local storage.
 */
export async function hardDeleteRepFromDb(id: string): Promise<void> {
  // 1. Look up rep details across registries to capture email and phone for total eradication
  const deletedList = getDeletedRepresentatives();
  const cachedReps = safeParseJson<Representative[]>(localStorage.getItem('dalelak_cached_reps'), []) || [];
  const customReps = safeParseJson<Representative[]>(localStorage.getItem('dalelak_custom_reps'), []) || [];

  const targetRep =
    deletedList.find((r) => r.id === id || (r.email && r.email.toLowerCase() === id.toLowerCase()) || r.phone === id) ||
    cachedReps.find((r) => r.id === id || (r.email && r.email.toLowerCase() === id.toLowerCase()) || r.phone === id) ||
    customReps.find((r) => r.id === id || (r.email && r.email.toLowerCase() === id.toLowerCase()) || r.phone === id);

  const targetEmail = targetRep?.email ? targetRep.email.toLowerCase().trim() : (id.includes('@') ? id.toLowerCase().trim() : undefined);
  const targetPhone = targetRep?.phone ? targetRep.phone.trim() : undefined;

  // 2. Purge from soft deleted list
  try {
    const filteredDeleted = deletedList.filter(
      (r) =>
        r.id !== id &&
        (!targetEmail || (r.email || '').toLowerCase().trim() !== targetEmail) &&
        (!targetPhone || (r.phone || '').trim() !== targetPhone)
    );
    safeSetLocalStorageItem('dalelak_soft_deleted_reps', JSON.stringify(filteredDeleted));
  } catch {}

  // 3. Blacklist in deleted reps registry
  try {
    const delArr = safeParseJson<string[]>(localStorage.getItem('dalelak_deleted_rep_ids'), []);
    const delSet = new Set(Array.isArray(delArr) ? delArr.map((x) => String(x).toLowerCase()) : []);
    delSet.add(id.toLowerCase());
    if (targetEmail) delSet.add(targetEmail);
    if (targetPhone) delSet.add(targetPhone);
    safeSetLocalStorageItem('dalelak_deleted_rep_ids', JSON.stringify(Array.from(delSet)));
  } catch {}

  // 4. Remove from ALL local caches (custom and cached reps)
  try {
    const purgeCache = (key: string) => {
      const cached = safeParseJson<Representative[]>(localStorage.getItem(key), []);
      if (Array.isArray(cached)) {
        const filtered = cached.filter(
          (r: Representative) =>
            r.id !== id &&
            (r.email || '').toLowerCase().trim() !== id.toLowerCase() &&
            (!targetEmail || (r.email || '').toLowerCase().trim() !== targetEmail) &&
            (!targetPhone || (r.phone || '').trim() !== targetPhone)
        );
        safeSetLocalStorageItem(key, JSON.stringify(filtered));
      }
    };
    purgeCache('dalelak_custom_reps');
    purgeCache('dalelak_cached_reps');
  } catch {}

  // 5. Delete from Supabase Cloud
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('representatives').delete().eq('id', id);
      await supabaseRestFetch(`representatives?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (targetEmail) {
        await supabase.from('representatives').delete().ilike('email', targetEmail);
        await supabaseRestFetch(`representatives?email=ilike.${encodeURIComponent(targetEmail)}`, {
          method: 'DELETE',
        });
      }
      if (targetPhone) {
        await supabase.from('representatives').delete().eq('phone', targetPhone);
        await supabaseRestFetch(`representatives?phone=eq.${encodeURIComponent(targetPhone)}`, {
          method: 'DELETE',
        });
      }
    } catch (err) {
      console.error('Supabase hard delete rep error:', err);
    }
  }

  // 6. Delete from Local Server
  try {
    await fetch(`/api/representatives/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getApiAuthHeaders(),
    });
    if (targetEmail) {
      await fetch(`/api/representatives/${encodeURIComponent(targetEmail)}`, {
        method: 'DELETE',
        headers: getApiAuthHeaders(),
      });
    }
  } catch {}
}

export const deleteRepFromDb = hardDeleteRepFromDb;

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
