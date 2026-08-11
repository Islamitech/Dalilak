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
    await supabase.from('businesses').delete().eq('id', id);
  } catch (err) {
    console.log('Supabase delete business notice:', err);
  }
}

// 2. REPRESENTATIVES OPERATIONS
export async function fetchRepsFromDb(): Promise<Representative[]> {
  try {
    const { data, error } = await supabase.from('representatives').select('*');
    if (!error && data && data.length > 0) {
      const mapped = data.map(mapDbToRep);
      localStorage.setItem('dalelak_representatives', JSON.stringify(mapped));
      return mapped;
    }
  } catch (err) {
    console.log('Supabase fetch reps notice:', err);
  }

  // Fallback to localStorage persistence
  const localReps = localStorage.getItem('dalelak_representatives');
  if (localReps) {
    try {
      const parsed = JSON.parse(localReps);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  return MOCK_REPRESENTATIVES;
}

export async function saveRepToDb(rep: Representative): Promise<void> {
  // Always update localStorage first for instantaneous UI update
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
    secondaryPhone: item.secondary_phone,
    workingHours: item.working_hours || item.workingHours || '9 ص - 10 م',
    description: item.description || '',
    lat: Number(item.lat) || 30.0444,
    lng: Number(item.lng) || 31.2357,
    ownerName: item.owner_name || item.ownerName || 'صاحب النشاط',
    ownerPhone: item.owner_phone || item.ownerPhone || '',
    ownerEmail: item.owner_email,
    nationalId: item.national_id,
    photos: item.photos || ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=400'],
    repId: item.rep_id || item.repId || 'rep_1',
    repName: item.rep_name || item.repName || 'محمود عبد الفتاح',
    packageId: item.package_id || item.packageId || 'pkg_basic',
    packageName: item.package_name || item.packageName || 'باقة دليلك الأساسية',
    packagePrice: Number(item.package_price || item.packagePrice) || 350,
    amountPaid: Number(item.amount_paid || item.amountPaid) || 350,
    paymentStatus: item.payment_status || item.paymentStatus || 'fully_paid',
    verificationStatus: item.verification_status || item.verificationStatus || 'verified',
    invoiceNumber: item.invoice_number || item.invoiceNumber || 'INV-2026-001',
    invoiceDate: item.invoice_date || item.invoiceDate || new Date().toISOString().split('T')[0],
    createdDate: item.created_date || item.createdDate || new Date().toISOString().split('T')[0],
  };
}

function mapBusinessToDb(biz: Business): any {
  return {
    id: biz.id,
    name_ar: biz.nameAr,
    name_en: biz.nameEn,
    category: biz.category,
    governorate: biz.governorate,
    city: biz.city,
    street: biz.street,
    phone: biz.phone,
    owner_name: biz.ownerName,
    owner_phone: biz.ownerPhone,
    lat: biz.lat,
    lng: biz.lng,
    package_name: biz.packageName,
    package_price: biz.packagePrice,
    amount_paid: biz.amountPaid,
    payment_status: biz.paymentStatus,
    verification_status: biz.verificationStatus,
    rep_id: biz.repId,
    rep_name: biz.repName,
    invoice_number: biz.invoiceNumber,
    invoice_date: biz.invoiceDate,
  };
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
    status: item.status || 'suspended',
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
