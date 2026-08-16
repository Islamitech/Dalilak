import { supabase, supabaseRestFetch } from '../lib/supabase';
import { Business, Representative, PaymentGatewayConfig } from '../types';
import { INITIAL_BUSINESSES, MOCK_REPRESENTATIVES, DEFAULT_PAYMENT_CONFIG } from '../data/mockData';

/**
 * Supabase Database Sync Service for Production Mode with localStorage Fallback
 */

// 1. BUSINESSES OPERATIONS
export async function fetchBusinessesFromDb(): Promise<Business[]> {
  try {
    const { data, error } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      const mapped = data.map(mapDbToBusiness);
      localStorage.setItem('dalelak_businesses', JSON.stringify(mapped));
      return mapped;
    }

    // Try REST fetch fallback
    const res = await supabaseRestFetch('businesses?select=*');
    if (res.ok) {
      const restData = await res.json();
      if (Array.isArray(restData) && restData.length > 0) {
        const mapped = restData.map(mapDbToBusiness);
        localStorage.setItem('dalelak_businesses', JSON.stringify(mapped));
        return mapped;
      }
    }
  } catch (err) {
    console.log('Supabase fetch businesses notice:', err);
  }

  const local = localStorage.getItem('dalelak_businesses');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  return INITIAL_BUSINESSES;
}

export async function saveBusinessToDb(biz: Business): Promise<void> {
  try {
    const local = localStorage.getItem('dalelak_businesses');
    let current: Business[] = local ? JSON.parse(local) : [...INITIAL_BUSINESSES];
    const idx = current.findIndex((b) => b.id === biz.id);
    if (idx >= 0) current[idx] = biz;
    else current = [biz, ...current];
    localStorage.setItem('dalelak_businesses', JSON.stringify(current));
  } catch (e) {}

  const dbRecord = mapBusinessToDb(biz);
  try {
    const { error } = await supabase.from('businesses').insert([dbRecord]);
    if (error) {
      await supabaseRestFetch('businesses', {
        method: 'POST',
        body: JSON.stringify(dbRecord),
      });
    }
  } catch (err) {
    console.log('Supabase save business notice:', err);
  }
}

export async function updateBusinessInDb(id: string, updates: Partial<Business>): Promise<void> {
  // Update local storage first for instant feedback
  try {
    const local = localStorage.getItem('dalelak_businesses');
    if (local) {
      const current: Business[] = JSON.parse(local);
      const idx = current.findIndex((b) => b.id === id);
      if (idx >= 0) {
        current[idx] = { ...current[idx], ...updates };
        localStorage.setItem('dalelak_businesses', JSON.stringify(current));
      }
    }
  } catch (e) {}

  const dbUpdates = mapBusinessToDb(updates as Business);
  try {
    const { error } = await supabase.from('businesses').update(dbUpdates).eq('id', id);
    if (error) {
      await supabaseRestFetch(`businesses?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dbUpdates),
      });
    }
  } catch (err) {
    console.log('Supabase update business notice:', err);
  }
}

export async function deleteBusinessFromDb(id: string): Promise<void> {
  try {
    const local = localStorage.getItem('dalelak_businesses');
    if (local) {
      const current: Business[] = JSON.parse(local);
      const updated = current.filter((b) => b.id !== id);
      localStorage.setItem('dalelak_businesses', JSON.stringify(updated));
    }
  } catch (e) {}

  try {
    await supabase.from('businesses').delete().eq('id', id);
  } catch (err) {
    console.log('Supabase delete business notice:', err);
  }
}

// 2. REPRESENTATIVES OPERATIONS
export async function fetchRepsFromDb(): Promise<Representative[]> {
  const mergedMap = new Map<string, Representative>();
  MOCK_REPRESENTATIVES.forEach((r) => mergedMap.set(r.email.toLowerCase(), r));

  const localReps = localStorage.getItem('dalelak_representatives');
  if (localReps) {
    try {
      const parsed = JSON.parse(localReps);
      if (Array.isArray(parsed)) {
        parsed.forEach((r: Representative) => {
          if (r.email) mergedMap.set(r.email.toLowerCase(), r);
        });
      }
    } catch (e) {}
  }

  try {
    const { data, error } = await supabase.from('representatives').select('*');
    if (!error && data && data.length > 0) {
      data.map(mapDbToRep).forEach((r) => mergedMap.set(r.email.toLowerCase(), r));
    }
  } catch (err) {
    console.log('Supabase fetch reps notice:', err);
  }

  const result = Array.from(mergedMap.values());
  localStorage.setItem('dalelak_representatives', JSON.stringify(result));
  return result;
}

export async function saveRepToDb(rep: Representative): Promise<void> {
  try {
    const localReps = localStorage.getItem('dalelak_representatives');
    let currentReps: Representative[] = localReps ? JSON.parse(localReps) : [...MOCK_REPRESENTATIVES];
    const index = currentReps.findIndex((r) => r.id === rep.id || r.email.toLowerCase() === rep.email.toLowerCase());
    if (index >= 0) {
      currentReps[index] = rep;
    } else {
      currentReps = [rep, ...currentReps];
    }
    localStorage.setItem('dalelak_representatives', JSON.stringify(currentReps));
  } catch (e) {
    console.log('localStorage save error:', e);
  }

  const dbRecord = mapRepToDb(rep);
  try {
    const { error } = await supabase.from('representatives').upsert([dbRecord]);
    if (error) {
      await supabaseRestFetch('representatives', {
        method: 'POST',
        body: JSON.stringify(dbRecord),
      });
    }
  } catch (err) {
    console.log('Supabase save rep notice:', err);
  }
}

// 3. MAPPING HELPERS
function parsePhotosArray(item: any): string[] {
  const raw = item.photos || item.photos_urls || item.photosUrls;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    const trimmed = raw.trim();
    
    // 1. If it's a single base64 data URL
    if (trimmed.startsWith('data:')) {
      return [trimmed];
    }
    
    // 2. Try JSON parsing
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string' && parsed.trim().length > 0) return [parsed];
    } catch (e) {
      // 3. Check for PG array format: e.g. {"url1", "url2"}
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const matches = [...trimmed.matchAll(/"([^"]+)"/g)].map(m => m[1]);
        if (matches.length > 0) return matches;
      }
      
      // 4. Split by comma if it's a list of standard URLs (not base64)
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
    repId: item.rep_id || item.repId || 'rep_1',
    repName: item.rep_name || item.repName || 'محمود عبد الفتاح',
    packageId: item.package_id || item.packageId || 'pkg_basic',
    packageName: item.package_name || item.packageName || 'باقة دليلك الأساسية',
    packagePrice: Number(item.package_price || item.packagePrice) || 350,
    amountPaid: Number(item.amount_paid || item.amountPaid) || 350,
    paymentStatus: item.payment_status || item.paymentStatus || 'fully_paid',
    verificationStatus: item.verification_status || item.verificationStatus || 'verified',
    googleMapsUrl: item.google_maps_url || item.googleMapsUrl,
    invoiceNumber: item.invoice_number || item.invoiceNumber || 'INV-2026-001',
    invoiceDate: item.invoice_date || item.invoiceDate || new Date().toISOString().split('T')[0],
    notes: item.notes,
    createdDate: item.created_date || item.createdDate || new Date().toISOString().split('T')[0],
  };
}

function mapBusinessToDb(biz: Partial<Business>): any {
  const dbRecord: any = {};
  
  if (biz.id !== undefined) dbRecord.id = biz.id;
  if (biz.nameAr !== undefined) dbRecord.name_ar = biz.nameAr;
  if (biz.nameEn !== undefined) dbRecord.name_en = biz.nameEn;
  if (biz.category !== undefined) dbRecord.category = biz.category;
  if (biz.governorate !== undefined) dbRecord.governorate = biz.governorate;
  if (biz.city !== undefined) dbRecord.city = biz.city;
  if (biz.street !== undefined) dbRecord.street = biz.street;
  if (biz.landmark !== undefined) dbRecord.landmark = biz.landmark;
  if (biz.phone !== undefined) dbRecord.phone = biz.phone;
  if (biz.secondaryPhone !== undefined) dbRecord.secondary_phone = biz.secondaryPhone;
  if (biz.workingHours !== undefined) dbRecord.working_hours = biz.workingHours;
  if (biz.description !== undefined) dbRecord.description = biz.description;
  if (biz.lat !== undefined) dbRecord.lat = biz.lat;
  if (biz.lng !== undefined) dbRecord.lng = biz.lng;
  if (biz.ownerName !== undefined) dbRecord.owner_name = biz.ownerName;
  if (biz.ownerPhone !== undefined) dbRecord.owner_phone = biz.ownerPhone;
  if (biz.ownerEmail !== undefined) dbRecord.owner_email = biz.ownerEmail;
  if (biz.nationalId !== undefined) dbRecord.national_id = biz.nationalId;
  if (biz.photos !== undefined) {
    dbRecord.photos = Array.isArray(biz.photos) ? biz.photos : [];
    dbRecord.photos_urls = Array.isArray(biz.photos) ? biz.photos : [];
  }
  if (biz.repId !== undefined) dbRecord.rep_id = biz.repId;
  if (biz.repName !== undefined) dbRecord.rep_name = biz.repName;
  if (biz.packageId !== undefined) dbRecord.package_id = biz.packageId;
  if (biz.packageName !== undefined) dbRecord.package_name = biz.packageName;
  if (biz.packagePrice !== undefined) dbRecord.package_price = biz.packagePrice;
  if (biz.amountPaid !== undefined) dbRecord.amount_paid = biz.amountPaid;
  if (biz.paymentStatus !== undefined) dbRecord.payment_status = biz.paymentStatus;
  if (biz.verificationStatus !== undefined) dbRecord.verification_status = biz.verificationStatus;
  if (biz.googleMapsUrl !== undefined) dbRecord.google_maps_url = biz.googleMapsUrl;
  if (biz.invoiceNumber !== undefined) dbRecord.invoice_number = biz.invoiceNumber;
  if (biz.invoiceDate !== undefined) dbRecord.invoice_date = biz.invoiceDate;
  if (biz.notes !== undefined) dbRecord.notes = biz.notes;
  if (biz.createdDate !== undefined) dbRecord.created_date = biz.createdDate;

  return dbRecord;
}

function mapDbToRep(item: any): Representative {
  return {
    id: item.id,
    name: item.name,
    email: item.email,
    phone: item.phone,
    nationalId: item.national_id || item.nationalId,
    role: item.role || 'rep',
    roleTitle: item.role_title || item.roleTitle || 'مندوب مبيعات ميداني',
    governorate: item.governorate || 'القاهرة',
    targetMonth: Number(item.target_month || item.targetMonth) || 25,
    avatar: item.avatar || '',
    avatarStatus: item.avatar_status || item.avatarStatus || 'none',
    commissionRate: Number(item.commission_rate || item.commissionRate) || 42.86,
    status: item.status || 'active',
    password: item.password || 'Aa123456',
  };
}

function mapRepToDb(rep: Representative): any {
  return {
    id: rep.id,
    name: rep.name,
    email: rep.email,
    phone: rep.phone,
    national_id: rep.nationalId,
    role: rep.role,
    role_title: rep.roleTitle,
    governorate: rep.governorate,
    target_month: rep.targetMonth,
    avatar: rep.avatar,
    avatar_status: rep.avatarStatus,
    commission_rate: rep.commissionRate,
    status: rep.status,
    password: rep.password,
  };
}
