import { supabase, supabaseRestFetch, isSupabaseConfigured } from '../lib/supabase';
import { Business, Representative, PaymentGatewayConfig, PayoutRequest, InterestedLead, PaymentStatus } from '../types';

/**
 * 🏛️ Live Supabase Database Service
 * 100% Cloud-native persistent CRUD operations with automated schema conversion
 * and multi-layer caching (LocalStorage + Local Server + Supabase Cloud)
 */

// =============================================================================
// 1. BUSINESSES OPERATIONS (الأنشطة التجارية والمحلات)
// =============================================================================

export async function fetchBusinessesFromDb(): Promise<Business[]> {
  // 1. Supabase Cloud fetch (PRIMARY SOURCE OF TRUTH)
  if (isSupabaseConfigured()) {
    try {
      const res = await supabaseRestFetch('businesses?select=*&order=created_at.desc');
      if (res.ok) {
        const restData = await res.json();
        if (Array.isArray(restData) && restData.length > 0) {
          const freshList = restData.map(mapDbToBusiness);
          try {
            localStorage.setItem('dalelak_cached_businesses', JSON.stringify(freshList));
          } catch {}
          return freshList;
        }
      }
    } catch (err) {
      console.warn('Supabase fetch businesses REST error, trying fallback:', err);
    }

    try {
      const { data, error } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        const freshList = data.map(mapDbToBusiness);
        try {
          localStorage.setItem('dalelak_cached_businesses', JSON.stringify(freshList));
        } catch {}
        return freshList;
      }
    } catch (err) {
      console.warn('Supabase fetch businesses SDK error:', err);
    }
  }

  // 2. LocalStorage cache fallback (instant offline render)
  try {
    const cached = JSON.parse(localStorage.getItem('dalelak_cached_businesses') || '[]');
    if (Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  } catch {}

  // 3. Local Server API fetch fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const localRes = await fetch('/api/businesses', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (localRes.ok) {
      const localData = await localRes.json();
      if (Array.isArray(localData) && localData.length > 0) {
        return localData;
      }
    }
  } catch {}

  return [];
}

export async function saveBusinessToDb(biz: Business): Promise<void> {
  const dbRecord = mapBusinessToDb(biz);

  // 1. Immediate LocalStorage cache update
  try {
    const cached = JSON.parse(localStorage.getItem('dalelak_cached_businesses') || '[]');
    const map = new Map<string, Business>();
    map.set(biz.id, biz);
    if (Array.isArray(cached)) {
      cached.forEach((b: Business) => {
        if (!map.has(b.id)) map.set(b.id, b);
      });
    }
    localStorage.setItem('dalelak_cached_businesses', JSON.stringify(Array.from(map.values())));
  } catch {}

  // 2. Direct Supabase Cloud Save using SDK with upsert().select() + REST fallback
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .upsert(dbRecord, { onConflict: 'id' })
        .select();

      if (!error && data && Array.isArray(data) && data.length > 0) {
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

      if (!res.ok) {
        // If conflict or update needed, try direct PATCH
        const patchRes = await supabaseRestFetch(`businesses?id=eq.${encodeURIComponent(biz.id)}`, {
          method: 'PATCH',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(dbRecord),
        }).catch(() => null);

        // If payload was too large (413) or failed, retry with lightweight media fallback
        if (!patchRes || !patchRes.ok) {
          const lightRecord = { ...dbRecord };
          try {
            const lightMeta = {
              ...JSON.parse(dbRecord.notes || '{}'),
              videos: (biz.videos || []).slice(0, 1),
            };
            lightRecord.notes = JSON.stringify(lightMeta);
          } catch {}
          await supabaseRestFetch('businesses', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
            body: JSON.stringify(lightRecord),
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Supabase save business REST warning:', err);
    }
  }

  // 3. Sync to local server
  try {
    await fetch('/api/businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(biz),
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
    localStorage.setItem('dalelak_cached_businesses', JSON.stringify(Array.from(map.values())));
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
      localStorage.setItem('dalelak_cached_businesses', JSON.stringify(filtered));
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

  // 3. Delete from Local Server
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
            localStorage.setItem('dalelak_cached_reps', JSON.stringify(freshList));
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
          localStorage.setItem('dalelak_cached_reps', JSON.stringify(freshList));
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
    localStorage.setItem('dalelak_cached_reps', JSON.stringify(Array.from(map.values())));
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
      localStorage.setItem('dalelak_custom_reps', JSON.stringify(updated));
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
    localStorage.setItem('dalelak_deleted_rep_ids', JSON.stringify(Array.from(delSet)));
  } catch {}

  // 2. Remove from LocalStorage custom reps
  try {
    const cached = JSON.parse(localStorage.getItem('dalelak_custom_reps') || '[]');
    if (Array.isArray(cached)) {
      const filtered = cached.filter((r: Representative) => r.id !== id && r.email?.toLowerCase() !== id.toLowerCase());
      localStorage.setItem('dalelak_custom_reps', JSON.stringify(filtered));
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

export async function updateRepSessionInDb(_id: string, _sessionId?: string, _timestamp?: number): Promise<void> {
  // Real-time active session synchronization
}

// =============================================================================
// 3. PAYOUT & REMITTANCE REQUESTS (طلبات الصرف والتوريد المالي)
// =============================================================================

export async function fetchPayoutRequestsFromDb(): Promise<PayoutRequest[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('payout_requests').select('*').order('request_date', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        return data.map(mapDbToPayout);
      }

      const res = await supabaseRestFetch('payout_requests?select=*&order=request_date.desc');
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
        return localData;
      }
    }
  } catch {}

  return [];
}

export async function createPayoutRequestInDb(payout: PayoutRequest): Promise<PayoutRequest> {
  const dbRecord = mapPayoutToDb(payout);
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('payout_requests').insert([dbRecord]);
      if (error) {
        await supabaseRestFetch('payout_requests', {
          method: 'POST',
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

export async function fetchLeadsFromDb(): Promise<InterestedLead[]> {
  // 1. Supabase Cloud fetch (PRIMARY SOURCE OF TRUTH)
  if (isSupabaseConfigured()) {
    try {
      const res = await supabaseRestFetch('leads?select=*&order=created_at.desc');
      if (res.ok) {
        const restData = await res.json();
        if (Array.isArray(restData) && restData.length > 0) {
          const freshList = restData.map(mapDbToLead);
          try {
            localStorage.setItem('dalelak_cached_leads', JSON.stringify(freshList));
          } catch {}
          return freshList;
        }
      }
    } catch (err) {
      console.warn('Supabase fetch leads REST error:', err);
    }

    try {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (!error && data && Array.isArray(data) && data.length > 0) {
        const freshList = data.map(mapDbToLead);
        try {
          localStorage.setItem('dalelak_cached_leads', JSON.stringify(freshList));
        } catch {}
        return freshList;
      }
    } catch (err) {
      console.warn('Supabase fetch leads SDK error:', err);
    }
  }

  // 2. Offline fallback from local cache
  try {
    const cached = JSON.parse(localStorage.getItem('dalelak_cached_leads') || '[]');
    if (Array.isArray(cached) && cached.length > 0) {
      return cached;
    }
  } catch {}

  // 3. Local Server fetch fallback
  try {
    const localRes = await fetch('/api/leads');
    if (localRes.ok) {
      const localData = await localRes.json();
      if (Array.isArray(localData) && localData.length > 0) {
        try {
          localStorage.setItem('dalelak_cached_leads', JSON.stringify(localData));
        } catch {}
        return localData;
      }
    }
  } catch {}

  return [];
}

export async function saveLeadToDb(lead: InterestedLead): Promise<InterestedLead> {
  const dbRecord = mapLeadToDb(lead);

  // 1. Immediate Local Cache update
  try {
    const cached = JSON.parse(localStorage.getItem('dalelak_cached_leads') || '[]');
    const map = new Map<string, InterestedLead>();
    map.set(lead.id, lead);
    if (Array.isArray(cached)) {
      cached.forEach((l: InterestedLead) => {
        if (!map.has(l.id)) map.set(l.id, l);
      });
    }
    localStorage.setItem('dalelak_cached_leads', JSON.stringify(Array.from(map.values())));
  } catch {}

  // 2. Direct Supabase Cloud Save / Upsert
  if (isSupabaseConfigured()) {
    try {
      const res = await supabaseRestFetch('leads', {
        method: 'POST',
        headers: {
          'Prefer': 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(dbRecord),
      });

      if (!res.ok) {
        const { error } = await supabase.from('leads').upsert([dbRecord]);
        if (error) {
          console.warn('Supabase save lead fallback error:', error);
        }
      }
    } catch (err) {
      console.error('Supabase save lead error:', err);
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
      localStorage.setItem('dalelak_cached_leads', JSON.stringify(updated));
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
      localStorage.setItem('dalelak_cached_leads', JSON.stringify(filtered));
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
  let metaGoogleMapsUrl = item.google_maps_url || item.googleMapsUrl;
  let metaRepCommissionRate = item.rep_commission_rate !== undefined && item.rep_commission_rate !== null ? Number(item.rep_commission_rate) : item.repCommissionRate;
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
        if (parsed.googleMapsUrl && !metaGoogleMapsUrl) metaGoogleMapsUrl = parsed.googleMapsUrl;
        if (parsed.repCommissionRate !== undefined && metaRepCommissionRate === undefined) metaRepCommissionRate = Number(parsed.repCommissionRate);
        if (parsed.videos && Array.isArray(parsed.videos)) metaVideos = parsed.videos;
        pureNotes = parsed.userNotes !== undefined ? parsed.userNotes : undefined;
      }
    } catch {}
  }

  const parsedVideos = parseVideosArray(item);
  const finalVideos = parsedVideos.length > 0 ? parsedVideos : (metaVideos || []);

  // Preserve real package price and configuration
  const packagePrice = Number(item.package_price !== undefined && item.package_price !== null ? item.package_price : (item.packagePrice || 250)) || 250;
  const packageId = item.package_id || item.packageId || (packagePrice === 750 ? 'pkg_pro' : packagePrice === 2000 ? 'pkg_vip' : 'pkg_basic');
  const packageName = item.package_name || item.packageName || (packageId === 'pkg_pro' ? '2. عرض التأسيس والربط الذكي' : packageId === 'pkg_vip' ? '3. عرض الدعم الميداني والإدارة الشاملة VIP' : '1. باقة التوثيق الأساسي');

  const rawPaid = Number(item.amount_paid !== undefined && item.amount_paid !== null ? item.amount_paid : (item.amountPaid || 0)) || 0;
  const rawStatus = item.payment_status || item.paymentStatus;
  const isFullyPaid = rawStatus === 'fully_paid' || (packagePrice > 0 && rawPaid >= packagePrice);
  const amountPaid = isFullyPaid ? packagePrice : rawPaid;
  const paymentStatus: PaymentStatus = isFullyPaid ? 'fully_paid' : amountPaid > 0 ? 'partially_paid' : 'unpaid';

  // Determine actual payment method (Never blindly default to cash_by_rep!)
  const paymentMethod: Business['paymentMethod'] = metaPaymentMethod || (amountPaid > 0 ? (metaCashCollectedByRep && metaCashCollectedByRep > 0 ? 'cash_by_rep' : 'platform_collected') : 'platform_collected');

  const cashCollectedByRep = metaCashCollectedByRep !== undefined
    ? metaCashCollectedByRep
    : paymentMethod === 'cash_by_rep'
    ? amountPaid
    : 0;

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
    lat: Number(item.lat) || 30.0444,
    lng: Number(item.lng) || 31.2357,
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
    googleMapsUrl: item.google_maps_url || item.googleMapsUrl || metaGoogleMapsUrl || (item.lat && item.lng ? `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}` : ''),
    googlePlaceId: item.google_place_id || item.googlePlaceId || metaGooglePlaceId,
    googleSyncStatus: item.google_sync_status || item.googleSyncStatus || metaGoogleSyncStatus || 'not_synced',
    googleSyncDate: item.google_sync_date || item.googleSyncDate || metaGoogleSyncDate,
    invoiceNumber: item.invoice_number || item.invoiceNumber || 'INV-2026-001',
    invoiceDate: item.invoice_date || item.invoiceDate || new Date().toISOString().split('T')[0],
    notes: pureNotes,
    createdDate: item.created_at || item.created_date || item.createdDate || item.invoice_date || new Date().toISOString(),
  };
}

function getSafeCoreBusinessDbRecord(biz: Partial<Business>): any {
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
  record.package_id = biz.packageId || 'pkg_basic';
  record.package_name = biz.packageName || '1. باقة التوثيق الأساسي';
  record.package_price = Number(biz.packagePrice) || 250;
  record.amount_paid = Number(biz.amountPaid) || 0;
  record.payment_status = biz.paymentStatus || 'unpaid';
  record.verification_status = biz.verificationStatus || 'pending';
  record.rep_id = biz.repId || 'rep_1';
  record.rep_name = biz.repName || 'مندوب معتمد';
  record.invoice_number = biz.invoiceNumber || `INV-2026-${Math.floor(100 + Math.random() * 900)}`;
  record.invoice_date = biz.invoiceDate || new Date().toISOString().split('T')[0];
  record.created_at = biz.createdDate || new Date().toISOString();

  // Safely preserve financial, sync, and video metadata in notes JSON
  const metaObj = {
    paymentMethod: biz.paymentMethod,
    cashCollectedByRep: biz.cashCollectedByRep,
    repCommissionRate: biz.repCommissionRate,
    googleSyncStatus: biz.googleSyncStatus,
    googlePlaceId: biz.googlePlaceId,
    googleSyncDate: biz.googleSyncDate,
    googleMapsUrl: biz.googleMapsUrl,
    videos: Array.isArray(biz.videos) ? biz.videos : [],
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
    password: item.password || 'Aa123456',
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
  if (rep.nationalId !== undefined) record.national_id = rep.nationalId;
  if (rep.role !== undefined) record.role = rep.role;
  if (rep.roleTitle !== undefined) record.role_title = rep.roleTitle;
  if (rep.governorate !== undefined) record.governorate = rep.governorate;
  if (rep.targetMonth !== undefined) record.target_month = Number(rep.targetMonth) || 25;
  if (rep.avatarStatus !== undefined) record.avatar_status = rep.avatarStatus || 'approved';
  if (rep.commissionRate !== undefined) record.commission_rate = Number(rep.commissionRate) || 42.86;
  if (rep.status !== undefined) record.status = rep.status;
  if (rep.password !== undefined) record.password = rep.password;

  const metaObj = {
    avatar: rep.avatar || '',
    referralCode: rep.referralCode,
    referredByCode: rep.referredByCode,
    referralUnlocked: rep.referralUnlocked,
    adminBypassReferral: rep.adminBypassReferral,
    referralRewardGranted: rep.referralRewardGranted,
    activationFacePhoto: rep.activationFacePhoto,
    nationalIdCardPhoto: rep.nationalIdCardPhoto,
    nationalIdCardBackPhoto: rep.nationalIdCardBackPhoto,
    pendingPhone: rep.pendingPhone,
    phoneStatus: rep.phoneStatus,
  };

  record.avatar = JSON.stringify(metaObj);

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
