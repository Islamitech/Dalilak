import { supabase, supabaseRestFetch, isSupabaseConfigured } from '../../lib/supabase';
import { InterestedLead } from '../../types';
import { safeSetLocalStorageItem, safeGetLocalStorageItem, safeParseJson, getApiAuthHeaders } from '../../utils/storage';
import {
  saveOfflineLead,
  getOfflineLeads,
  removeOfflineLead,
} from '../offlineSync';
import { mapDbToLead, mapLeadToDb } from './dbMappers';


export async function fetchLeadsFromDb(repId?: string): Promise<InterestedLead[]> {
  const cached = safeParseJson<InterestedLead[]>(localStorage.getItem('dalelak_cached_leads'), []);
  const leadMap = new Map<string, InterestedLead>();
  if (Array.isArray(cached)) {
    cached.forEach((l: InterestedLead) => {
      if (l && l.id) leadMap.set(l.id, l);
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
              clientName: b.ownerName || b.nameAr || 'عميل محتمل',
              businessName: b.nameAr || b.nameEn || 'نشاط تجاري',
              businessCategory: b.category,
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

    // Also fetch leads backed up in 'businesses' table
    try {
      let bQuery = supabase
        .from('businesses')
        .select('*')
        .or('verification_status.eq.lead,package_id.eq.pkg_interested_lead')
        .order('created_at', { ascending: false });
      if (repId) bQuery = bQuery.eq('rep_id', repId);
      const { data: bLeads, error: bError } = await bQuery;
      if (!bError && Array.isArray(bLeads)) {
        bLeads.forEach((b: any) => {
          if (b.deleted_at) {
            leadMap.delete(b.id);
            return;
          }
          let notesData: any = {};
          if (typeof b.notes === 'string' && b.notes.trim().startsWith('{')) {
            try { notesData = JSON.parse(b.notes.trim()); } catch {}
          }
          leadMap.set(b.id, {
            id: b.id,
            clientName: b.owner_name || b.name_ar || 'عميل مهتم',
            businessName: b.name_ar !== b.owner_name ? b.name_ar : undefined,
            businessCategory: b.category,
            phone: b.phone || b.owner_phone || '',
            secondaryPhone: b.secondary_phone,
            governorate: b.governorate || 'الجيزة',
            city: b.city || 'الجيزة',
            street: b.street,
            lat: b.lat,
            lng: b.lng,
            locationUrl: notesData.locationUrl || (b.lat && b.lng ? `https://www.google.com/maps?q=${b.lat},${b.lng}` : undefined),
            interestLevel: notesData.interestLevel || 'high',
            notes: notesData.leadNotes || (typeof b.notes === 'string' && !b.notes.startsWith('{') ? b.notes : undefined),
            adminFollowUps: notesData.adminFollowUps || [],
            followUpDate: notesData.followUpDate,
            createdDate: b.created_at || new Date().toISOString(),
            repId: b.rep_id || 'rep_1',
            repName: b.rep_name || 'مندوب معتمد',
            lastContactedDate: notesData.lastContactedDate,
            status: notesData.status || 'pending_followup',
          });
        });
      }
    } catch (err) {
      console.warn('Supabase fetch leads from businesses error:', err);
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
  const cleanPhone = lead.phone || '01000000000';

  // 1. Guaranteed IndexedDB local persistence
  await saveOfflineLead(lead);

  // 2. Immediate Local Cache update
  try {
    const cached = safeParseJson<InterestedLead[]>(localStorage.getItem('dalelak_cached_leads'), []);
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

    // Strategy B: Fallback to 'businesses' table
    if (!leadSaved) {
      try {
        const bizLeadPayload = {
          id: lead.id,
          name_ar: lead.businessName || lead.clientName || 'عميل مهتم',
          owner_name: lead.clientName || 'صاحب النشاط',
          phone: cleanPhone,
          owner_phone: cleanPhone, // Required not-null constraint
          secondary_phone: lead.secondaryPhone || null,
          governorate: lead.governorate || 'الجيزة',
          city: lead.city || 'الجيزة',
          street: lead.street || 'زيارة ميدانية',
          lat: Number(lead.lat) || 30.0444,
          lng: Number(lead.lng) || 31.2357,
          rep_id: lead.repId || 'rep_1',
          rep_name: lead.repName || 'مندوب معتمد',
          package_id: 'pkg_interested_lead',
          package_name: 'عميل مهتم / زيارة ميدانية',
          package_price: 0,
          amount_paid: 0,
          payment_status: 'unpaid',
          verification_status: 'lead',
          is_fee_exempt: true,
          notes: JSON.stringify({
            isLead: true,
            clientName: lead.clientName,
            businessName: lead.businessName,
            businessCategory: lead.businessCategory,
            interestLevel: lead.interestLevel || 'high',
            followUpDate: lead.followUpDate,
            lastContactedDate: lead.lastContactedDate,
            status: lead.status || 'pending_followup',
            leadNotes: lead.notes,
            adminFollowUps: Array.isArray(lead.adminFollowUps) ? lead.adminFollowUps : [],
            locationUrl: lead.locationUrl || (lead.lat && lead.lng ? `https://www.google.com/maps?q=${lead.lat},${lead.lng}` : null),
          }),
          created_at: lead.createdDate || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error: bizErr } = await supabase.from('businesses').upsert([bizLeadPayload], { onConflict: 'id' });
        if (!bizErr) {
          leadSaved = true;
        } else {
          const res = await supabaseRestFetch('businesses', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
            body: JSON.stringify(bizLeadPayload),
          });
          if (res.ok) leadSaved = true;
        }
      } catch (bizErr) {
        console.warn('Fallback save lead to businesses error:', bizErr);
      }
    }

    if (leadSaved) {
      await removeOfflineLead(lead.id);
    }
  }

  // 3. Save to Local Server
  try {
    await fetch('/api/leads', {
      method: 'POST',
      headers: { ...getApiAuthHeaders(), 'Content-Type': 'application/json' },
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

    // 3. Also update in businesses table if stored there
    try {
      const cleanPhone = lead.phone || '01000000000';
      const bizUpdates: any = {
        name_ar: lead.businessName || lead.clientName,
        owner_name: lead.clientName,
        phone: cleanPhone,
        owner_phone: cleanPhone,
        secondary_phone: lead.secondaryPhone || null,
        governorate: lead.governorate,
        city: lead.city,
        street: lead.street,
        notes: JSON.stringify({
          isLead: true,
          clientName: lead.clientName,
          businessName: lead.businessName,
          businessCategory: lead.businessCategory,
          interestLevel: lead.interestLevel || 'high',
          followUpDate: lead.followUpDate,
          lastContactedDate: lead.lastContactedDate,
          status: lead.status || 'pending_followup',
          leadNotes: lead.notes,
          adminFollowUps: Array.isArray(lead.adminFollowUps) ? lead.adminFollowUps : [],
          locationUrl: lead.locationUrl || (lead.lat && lead.lng ? `https://www.google.com/maps?q=${lead.lat},${lead.lng}` : null),
        }),
        updated_at: new Date().toISOString(),
      };
      await supabase.from('businesses').update(bizUpdates).eq('id', lead.id);
    } catch {}
  }

  // 4. Update in Local Server
  try {
    await fetch(`/api/leads/${encodeURIComponent(lead.id)}`, {
      method: 'PUT',
      headers: { ...getApiAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
  } catch {}

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

    // Also delete from businesses table if stored there
    try {
      await supabase.from('businesses').delete().eq('id', id);
    } catch {}
  }

  // 3. Delete from Local Server
  try {
    await fetch(`/api/leads/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getApiAuthHeaders(),
    });
  } catch {}
}
