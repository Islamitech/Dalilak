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
      return data.map(mapDbToBusiness);
    }

    // Try REST fetch fallback
    const res = await supabaseRestFetch('businesses?select=*');
    if (res.ok) {
      const restData = await res.json();
      if (Array.isArray(restData) && restData.length > 0) {
        return restData.map(mapDbToBusiness);
      }
    }
  } catch (err) {
    console.log('Supabase fetch businesses notice:', err);
  }

  return [];
}

export async function saveBusinessToDb(biz: Business): Promise<void> {
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
    const { error } = await supabase.from('businesses').delete().eq('id', id);
    if (error) {
      await supabaseRestFetch(`businesses?id=eq.${id}`, {
        method: 'DELETE',
      });
    }
  } catch (err) {
    console.log('Supabase delete business notice:', err);
  }
}

// 2. REPRESENTATIVES OPERATIONS
export async function fetchRepsFromDb(): Promise<Representative[]> {
  const mergedMap = new Map<string, Representative>();

  try {
    const { data, error } = await supabase.from('representatives').select('*');
    if (!error && data && data.length > 0) {
      data.map(mapDbToRep).forEach((r) => mergedMap.set(r.email.toLowerCase(), r));
    } else {
      const res = await supabaseRestFetch('representatives?select=*');
      if (res.ok) {
        const restData = await res.json();
        if (Array.isArray(restData) && restData.length > 0) {
          restData.map(mapDbToRep).forEach((r) => mergedMap.set(r.email.toLowerCase(), r));
        }
      }
    }
  } catch (err) {
    console.log('Supabase fetch reps notice:', err);
  }

  return Array.from(mergedMap.values());
}

export async function saveRepToDb(rep: Representative): Promise<void> {
  const dbRecord = mapRepToDb(rep);
  try {
    const { error } = await supabase.from('representatives').upsert([dbRecord]);
    if (error) {
      const { error: updateErr } = await supabase.from('representatives').update(dbRecord).eq('id', rep.id);
      if (updateErr) {
        await supabaseRestFetch('representatives', {
          method: 'POST',
          body: JSON.stringify(dbRecord),
        });
      }
    }
  } catch (err) {
    console.warn('Supabase save rep catch notice:', err);
  }
}

export async function deleteRepFromDb(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('representatives').delete().eq('id', id);
    if (error) {
      await supabaseRestFetch(`representatives?id=eq.${id}`, {
        method: 'DELETE',
      });
    }
  } catch (err) {
    console.log('Supabase delete rep notice:', err);
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
    repName: item.rep_name || item.repName || 'مندوب معتمد',
    packageId: item.package_id || item.packageId || 'pkg_basic',
    packageName: item.package_name || item.packageName || '1. باقة التوثيق الأساسي',
    packagePrice: item.package_price !== undefined && item.package_price !== null ? Number(item.package_price) : (item.packagePrice !== undefined && item.packagePrice !== null ? Number(item.packagePrice) : 250),
    amountPaid: item.amount_paid !== undefined && item.amount_paid !== null ? Number(item.amount_paid) : (item.amountPaid !== undefined && item.amountPaid !== null ? Number(item.amountPaid) : 0),
    paymentStatus: item.payment_status || item.paymentStatus || 'fully_paid',
    verificationStatus: item.verification_status || item.verificationStatus || 'verified',
    googleMapsUrl: item.google_maps_url || item.googleMapsUrl || (item.lat && item.lng ? `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}` : ''),
    invoiceNumber: item.invoice_number || item.invoiceNumber || 'INV-2026-001',
    invoiceDate: item.invoice_date || item.invoiceDate || new Date().toISOString().split('T')[0],
    notes: item.notes,
    createdDate: item.created_at || item.created_date || item.createdDate || item.invoice_date || new Date().toISOString(),
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
  }
  if (biz.repId !== undefined) dbRecord.rep_id = biz.repId;
  if (biz.repName !== undefined) dbRecord.rep_name = biz.repName;
  if (biz.packageId !== undefined) dbRecord.package_id = biz.packageId;
  if (biz.packageName !== undefined) dbRecord.package_name = biz.packageName;
  if (biz.packagePrice !== undefined) dbRecord.package_price = biz.packagePrice;
  if (biz.amountPaid !== undefined) dbRecord.amount_paid = biz.amountPaid;
  if (biz.paymentStatus !== undefined) dbRecord.payment_status = biz.paymentStatus;
  if (biz.verificationStatus !== undefined) dbRecord.verification_status = biz.verificationStatus;
  if (biz.invoiceNumber !== undefined) dbRecord.invoice_number = biz.invoiceNumber;
  if (biz.invoiceDate !== undefined) dbRecord.invoice_date = biz.invoiceDate;
  if (biz.createdDate !== undefined) dbRecord.created_at = biz.createdDate;
  if (biz.notes !== undefined) dbRecord.notes = biz.notes;

  return dbRecord;
}

export async function updateRepInDb(id: string, updates: Partial<Representative>): Promise<void> {
  const dbUpdates = mapRepToDb(updates as Representative);
  delete dbUpdates.id;
  try {
    const { error } = await supabase.from('representatives').update(dbUpdates).eq('id', id);
    if (error) {
      await supabaseRestFetch(`representatives?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dbUpdates),
      });
    }
  } catch (err) {
    console.log('Supabase update rep notice:', err);
  }
}

export async function updateRepSessionInDb(_id: string, _sessionId?: string, _timestamp?: number): Promise<void> {
  // Session tracking is managed dynamically in real-time memory and local sync
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

  if (typeof parsedAvatar === 'string' && parsedAvatar.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(parsedAvatar.trim());
      if (parsed && typeof parsed === 'object') {
        parsedAvatar = parsed.avatar || '';
        if (parsed.referralCode) metaReferralCode = parsed.referralCode;
        if (parsed.referredByCode) metaReferredByCode = parsed.referredByCode;
        if (parsed.referralUnlocked !== undefined) metaReferralUnlocked = parsed.referralUnlocked;
        if (parsed.adminBypassReferral !== undefined) metaAdminBypassReferral = parsed.adminBypassReferral;
        if (parsed.referralRewardGranted !== undefined) metaReferralRewardGranted = parsed.referralRewardGranted;
        if (parsed.activationFacePhoto) metaActivationFacePhoto = parsed.activationFacePhoto;
        if (parsed.nationalIdCardPhoto) metaNationalIdCardPhoto = parsed.nationalIdCardPhoto;
        if (parsed.nationalIdCardBackPhoto) metaNationalIdCardBackPhoto = parsed.nationalIdCardBackPhoto;
      }
    } catch {}
  }

  // Deterministic fallback referral code if none stored
  const cleanId = (item.id || '').replace(/\D/g, '').slice(-4) || (item.phone || '').replace(/\D/g, '').slice(-4) || '2026';
  const defaultRefCode = item.id === 'rep_ahmed_ezalden' ? 'DALIL-8355' : `DALIL-${cleanId}`;

  return {
    id: item.id,
    name: item.name,
    email: item.email,
    phone: item.phone,
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

function mapRepToDb(rep: Representative): any {
  // Serialize metadata envelope into avatar field to support all fields in Supabase without schema limitation
  let avatarPayload = rep.avatar || '';
  const metadata: any = {
    avatar: rep.avatar || '',
  };
  if (rep.referralCode) metadata.referralCode = rep.referralCode;
  if (rep.referredByCode) metadata.referredByCode = rep.referredByCode;
  if (rep.referralUnlocked !== undefined) metadata.referralUnlocked = rep.referralUnlocked;
  if (rep.adminBypassReferral !== undefined) metadata.adminBypassReferral = rep.adminBypassReferral;
  if (rep.referralRewardGranted !== undefined) metadata.referralRewardGranted = rep.referralRewardGranted;
  if (rep.activationFacePhoto) metadata.activationFacePhoto = rep.activationFacePhoto;
  if (rep.nationalIdCardPhoto) metadata.nationalIdCardPhoto = rep.nationalIdCardPhoto;
  if (rep.nationalIdCardBackPhoto) metadata.nationalIdCardBackPhoto = rep.nationalIdCardBackPhoto;

  avatarPayload = JSON.stringify(metadata);

  const record: any = {
    id: rep.id,
    name: rep.name,
    email: rep.email,
    phone: rep.phone,
    national_id: rep.nationalId || null,
    role: rep.role || 'rep',
    role_title: rep.roleTitle || 'مندوب مبيعات ميداني',
    governorate: rep.governorate || 'القاهرة',
    target_month: Number(rep.targetMonth) || 25,
    avatar: avatarPayload,
    avatar_status: rep.avatarStatus || 'none',
    commission_rate: Number(rep.commissionRate) || 42.86,
    status: rep.status || 'suspended',
    password: rep.password || 'Aa123456',
  };
  return record;
}

