import { supabase, supabaseRestFetch, isSupabaseConfigured } from '../../lib/supabase';
import { InterestedLead } from '../../types';
import { safeSetLocalStorageItem, safeGetLocalStorageItem, safeParseJson, getApiAuthHeaders } from '../../utils/storage';
import {
  saveOfflineLead,
  getOfflineLeads,
  removeOfflineLead,
} from '../offlineSync';
import { mapDbToLead, mapLeadToDb, healCategoryMismatch, stripBiDiControls, BIDI_CONTROL_REGEX } from './dbMappers';


export async function fetchLeadsFromDb(repId?: string): Promise<InterestedLead[]> {
  const cached = safeParseJson<InterestedLead[]>(localStorage.getItem('dalelak_cached_leads'), []);
  const leadMap = new Map<string, InterestedLead>();
  if (Array.isArray(cached)) {
    cached.forEach((l: InterestedLead) => {
      if (l && l.id) {
        leadMap.set(l.id, {
          ...l,
          clientName: stripBiDiControls(l.clientName),
          businessName: stripBiDiControls(l.businessName),
          notes: typeof l.notes === 'string' ? l.notes.replace(BIDI_CONTROL_REGEX, '') : l.notes,
        });
      }
    });
  }

  // Check if any legacy leads exist in cached businesses and recover them
  try {
    const rawBiz = safeGetLocalStorageItem('dalelak_cached_businesses') || safeGetLocalStorageItem('dalelak_directory_cache');
    const parsedBiz = safeParseJson<any[]>(rawBiz, []);
    if (Array.isArray(parsedBiz)) {
      parsedBiz.forEach((b) => {
        if (b && (b.packageId === 'pkg_interested_lead' || b.verificationStatus === 'lead' || (typeof b.id === 'string' && b.id.startsWith('lead_')))) {
          const leadId = typeof b.id === 'string' && b.id.startsWith('lead_') ? b.id : `lead_${b.id}`;
          if (!leadMap.has(leadId) && !leadMap.has(b.id)) {
            leadMap.set(leadId, {
              id: leadId,
              clientName: stripBiDiControls(b.ownerName || b.nameAr || 'عميل محتمل'),
              businessName: stripBiDiControls(b.nameAr || b.nameEn || 'نشاط تجاري'),
              businessCategory: healCategoryMismatch(b.category, b.nameAr || b.nameEn || '', b.description || ''),
              phone: b.phone || b.ownerPhone || '',
              secondaryPhone: b.secondaryPhone,
              governorate: b.governorate || 'القاهرة',
              city: b.city || 'القاهرة',
              street: b.street,
              lat: b.lat,
              lng: b.lng,
              locationUrl: b.googleMapsUrl || (b.lat && b.lng ? `https://www.google.com/maps?q=${b.lat},${b.lng}` : undefined),
              interestLevel: 'high',
              notes: b.notes,
              adminFollowUps: Array.isArray(b.adminFollowUps) ? b.adminFollowUps : [],
              createdDate: b.createdDate || new Date().toISOString(),
              repId: b.repId || 'rep_1',
              repName: b.repName || 'مندوب معتمد',
              status: b.verificationStatus === 'approved' || b.verificationStatus === 'active' ? 'converted' : 'pending_followup',
            });
          }
        }
      });
    }
  } catch {}

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
            if (item.deleted_at) {
              leadMap.delete(item.id);
              return;
            }
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
          if (item.deleted_at) {
            leadMap.delete(item.id);
            return;
          }
          const mapped = mapDbToLead(item);
          leadMap.set(mapped.id, mapped);
        });
      }
    } catch (err) {
      console.warn('Supabase fetch leads SDK error:', err);
    }

    // Leads are strictly isolated to the 'leads' table and never polled from 'businesses'
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
  const sanitizedLead: InterestedLead = {
    ...lead,
    clientName: stripBiDiControls(lead.clientName),
    businessName: stripBiDiControls(lead.businessName),
    notes: typeof lead.notes === 'string' ? lead.notes.replace(BIDI_CONTROL_REGEX, '') : lead.notes,
  };
  const dbRecord = mapLeadToDb(sanitizedLead);
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const cleanPhone = sanitizedLead.phone || '01000000000';

  // 1. Guaranteed IndexedDB local persistence
  await saveOfflineLead(sanitizedLead);

  // 2. Immediate Local Cache update
  try {
    const cached = safeParseJson<InterestedLead[]>(localStorage.getItem('dalelak_cached_leads'), []);
    const map = new Map<string, InterestedLead>();
    map.set(sanitizedLead.id, sanitizedLead);
    if (Array.isArray(cached)) {
      cached.forEach((l: InterestedLead) => {
        if (!map.has(l.id)) map.set(l.id, l);
      });
    }
    safeSetLocalStorageItem('dalelak_cached_leads', JSON.stringify(Array.from(map.values())));
  } catch {}

  // 3. Direct Supabase Cloud Save / Upsert
  if (isOnline && isSupabaseConfigured()) {
    let leadSaved = false;

    // Strategy A: Try 'leads' table
    try {
      const { error } = await supabase.from('leads').upsert([dbRecord], { onConflict: 'id' });
      if (!error) {
        leadSaved = true;
      } else {
        const res = await supabaseRestFetch('leads', {
          method: 'POST',
          headers: {
            'Prefer': 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify(dbRecord),
        });
        if (res.ok) leadSaved = true;
      }
    } catch {}

    if (leadSaved) {
      await removeOfflineLead(lead.id);
    }
  }

  return lead;
}

export async function updateLeadInDb(lead: InterestedLead): Promise<InterestedLead> {
  const dbUpdates = mapLeadToDb(lead);
  delete dbUpdates.id;

  // 1. Immediate Local Cache update
  try {
    const cached = safeParseJson<InterestedLead[]>(localStorage.getItem('dalelak_cached_leads'), []);
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
          // Resilient fallback if admin_follow_ups column not yet created
          const { street, lat, lng, location_url, admin_follow_ups, ...baseUpdates } = dbUpdates;
          await supabase.from('leads').update(baseUpdates).eq('id', lead.id);
        }
      }
    } catch (err) {
      console.error('Supabase update lead error:', err);
    }
  }

  return lead;
}

export async function deleteLeadFromDb(id: string): Promise<void> {
  // 1. Immediate Local Cache remove
  try {
    const cached = safeParseJson<InterestedLead[]>(localStorage.getItem('dalelak_cached_leads'), []);
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

    // Clean up any legacy lead entry in businesses table
    try {
      await supabase.from('businesses').delete().eq('id', id).or('verification_status.eq.lead,package_id.eq.pkg_interested_lead');
    } catch {}
  }
}
