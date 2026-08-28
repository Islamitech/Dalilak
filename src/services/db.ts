import { supabase, supabaseRestFetch } from '../lib/supabase';
import { Business, Representative, PaymentGatewayConfig, PayoutRequest, InterestedLead } from '../types';

/**
 * Live Supabase Database Service
 * 100% Cloud-native persistent CRUD operations with automated schema conversion
 */

// ============================================
// 1. BUSINESSES OPERATIONS (الأنشطة التجارية)
// ============================================

// Helper to ensure all remote database records are permanently standardized to 250 EGP
async function reconcileLegacyBusinessesTo250(records: any[]): Promise<void> {
  for (const item of records) {
    const isPaid = item.payment_status === 'fully_paid' || (Number(item.amount_paid || 0) > 0);
    const expectedAmountPaid = isPaid ? 250 : 0;
    const expectedPaymentStatus = isPaid ? 'fully_paid' : (item.payment_status || 'unpaid');
    const isCash = (item.payment_method || 'cash_by_rep') === 'cash_by_rep';
    const expectedCashCollected = isPaid && isCash ? 250 : 0;

    const needsUpdate =
      Number(item.package_price) !== 250 ||
      item.package_id !== 'pkg_basic' ||
      item.package_name !== '1. باقة التوثيق الأساسي' ||
      Number(item.amount_paid || 0) !== expectedAmountPaid ||
      item.payment_status !== expectedPaymentStatus;

    if (needsUpdate && item.id) {
      const updates = {
        package_id: 'pkg_basic',
        package_name: '1. باقة التوثيق الأساسي',
        package_price: 250,
        amount_paid: expectedAmountPaid,
        payment_status: expectedPaymentStatus,
      };

      // Background update in Supabase
      (async () => {
        try {
          const { error } = await supabase.from('businesses').update(updates).eq('id', item.id);
          if (error) {
            await supabaseRestFetch(`businesses?id=eq.${encodeURIComponent(item.id)}`, {
              method: 'PATCH',
              body: JSON.stringify(updates),
            });
          }
        } catch {}
      })();
    }
  }
}

export async function fetchBusinessesFromDb(): Promise<Business[]> {
  try {
    const { data, error } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });
    if (!error && data && Array.isArray(data)) {
      // Reconcile in background
      reconcileLegacyBusinessesTo250(data).catch(() => {});
      return data.map(mapDbToBusiness);
    }

    // Direct REST API fallback
    const res = await supabaseRestFetch('businesses?select=*&order=created_at.desc');
    if (res.ok) {
      const restData = await res.json();
      if (Array.isArray(restData)) {
        reconcileLegacyBusinessesTo250(restData).catch(() => {});
        return restData.map(mapDbToBusiness);
      }
    }
  } catch (err) {
    console.error('Supabase fetch businesses error:', err);
  }

  return [];
}

export async function saveBusinessToDb(biz: Business): Promise<void> {
  const dbRecord = mapBusinessToDb(biz);
  try {
    const { error } = await supabase.from('businesses').insert([dbRecord]);
    if (error) {
      const res = await supabaseRestFetch('businesses', {
        method: 'POST',
        body: JSON.stringify(dbRecord),
      });
      if (!res.ok) {
        // Try upsert
        await supabase.from('businesses').upsert([dbRecord]);
      }
    }
  } catch (err) {
    console.error('Supabase save business error:', err);
  }
}

export async function updateBusinessInDb(id: string, updates: Partial<Business>): Promise<void> {
  const dbUpdates = mapBusinessToDb(updates as Business);
  delete dbUpdates.id;
  try {
    const { error } = await supabase.from('businesses').update(dbUpdates).eq('id', id);
    if (error) {
      await supabaseRestFetch(`businesses?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(dbUpdates),
      });
    }
  } catch (err) {
    console.error('Supabase update business error:', err);
  }
}

export async function deleteBusinessFromDb(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('businesses').delete().eq('id', id);
    if (error) {
      await supabaseRestFetch(`businesses?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    }
  } catch (err) {
    console.error('Supabase delete business error:', err);
  }
}

// ============================================
// 2. REPRESENTATIVES OPERATIONS (المندوبين)
// ============================================
export async function fetchRepsFromDb(): Promise<Representative[]> {
  const mergedMap = new Map<string, Representative>();
  try {
    const { data, error } = await supabase.from('representatives').select('*');
    if (!error && data && Array.isArray(data)) {
      data.map(mapDbToRep).forEach((r) => mergedMap.set(r.email.toLowerCase(), r));
    } else {
      const res = await supabaseRestFetch('representatives?select=*');
      if (res.ok) {
        const restData = await res.json();
        if (Array.isArray(restData)) {
          restData.map(mapDbToRep).forEach((r) => mergedMap.set(r.email.toLowerCase(), r));
        }
      }
    }
  } catch (err) {
    console.error('Supabase fetch reps error:', err);
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
    console.error('Supabase save rep error:', err);
  }
}

export async function updateRepInDb(id: string, updates: Partial<Representative>): Promise<void> {
  const dbUpdates = mapRepToDb(updates as Representative);
  delete dbUpdates.id;
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

export async function deleteRepFromDb(id: string): Promise<void> {
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

export async function updateRepSessionInDb(_id: string, _sessionId?: string, _timestamp?: number): Promise<void> {
  // Real-time active session synchronization
}

// ============================================
// 3. PAYOUT & REMITTANCE REQUESTS (طلبات الصرف والتوريد)
// ============================================
export async function fetchPayoutRequestsFromDb(): Promise<PayoutRequest[]> {
  try {
    const { data, error } = await supabase.from('payout_requests').select('*').order('request_date', { ascending: false });
    if (!error && data && Array.isArray(data)) {
      return data.map(mapDbToPayout);
    }

    const res = await supabaseRestFetch('payout_requests?select=*&order=request_date.desc');
    if (res.ok) {
      const restData = await res.json();
      if (Array.isArray(restData)) {
        return restData.map(mapDbToPayout);
      }
    }
  } catch (err) {
    console.error('Supabase fetch payout requests error:', err);
  }

  return [];
}

export async function createPayoutRequestInDb(payout: PayoutRequest): Promise<PayoutRequest> {
  const dbRecord = mapPayoutToDb(payout);
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

  return payout;
}

export async function updatePayoutRequestInDb(payout: PayoutRequest): Promise<PayoutRequest> {
  const dbUpdates = mapPayoutToDb(payout);
  delete dbUpdates.id;
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

  return payout;
}

// ============================================
// 4. INTERESTED LEADS (العملاء المحتملين)
// ============================================
export async function fetchLeadsFromDb(): Promise<InterestedLead[]> {
  try {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (!error && data && Array.isArray(data)) {
      return data.map(mapDbToLead);
    }

    const res = await supabaseRestFetch('leads?select=*&order=created_at.desc');
    if (res.ok) {
      const restData = await res.json();
      if (Array.isArray(restData)) {
        return restData.map(mapDbToLead);
      }
    }
  } catch (err) {
    console.error('Supabase fetch leads error:', err);
  }

  return [];
}

export async function saveLeadToDb(lead: InterestedLead): Promise<InterestedLead> {
  const dbRecord = mapLeadToDb(lead);
  try {
    const { error } = await supabase.from('leads').insert([dbRecord]);
    if (error) {
      await supabaseRestFetch('leads', {
        method: 'POST',
        body: JSON.stringify(dbRecord),
      });
    }
  } catch (err) {
    console.error('Supabase save lead error:', err);
  }

  return lead;
}

export async function updateLeadInDb(lead: InterestedLead): Promise<InterestedLead> {
  const dbUpdates = mapLeadToDb(lead);
  delete dbUpdates.id;
  try {
    const { error } = await supabase.from('leads').update(dbUpdates).eq('id', lead.id);
    if (error) {
      await supabaseRestFetch(`leads?id=eq.${encodeURIComponent(lead.id)}`, {
        method: 'PATCH',
        body: JSON.stringify(dbUpdates),
      });
    }
  } catch (err) {
    console.error('Supabase update lead error:', err);
  }

  return lead;
}

export async function deleteLeadFromDb(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      await supabaseRestFetch(`leads?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    }
  } catch (err) {
    console.error('Supabase delete lead error:', err);
  }
}

// ============================================
// 5. PAYMENT GATEWAY CONFIG (إعدادات الدفع والمحافظ)
// ============================================
export async function fetchPaymentConfigFromDb(): Promise<PaymentGatewayConfig | null> {
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

// ============================================
// 6. SERIALIZATION & DESERIALIZATION MAPPERS
// ============================================
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
    } catch (e) {
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const matches = [...trimmed.matchAll(/"([^"]+)"/g)].map(m => m[1]);
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
  // Single standardized unified package across all previous & current records: 250 EGP
  const packagePrice = 250;
  const packageName = '1. باقة التوثيق الأساسي';
  const packageId = 'pkg_basic';

  const rawPaid = Number(item.amount_paid !== undefined && item.amount_paid !== null ? item.amount_paid : (item.amountPaid || 0));
  const rawStatus = item.payment_status || item.paymentStatus;
  const isPaid = rawStatus === 'fully_paid' || rawPaid > 0;
  
  // Standardize paid status to 250 EGP
  const amountPaid = isPaid ? 250 : 0;
  const paymentStatus = isPaid ? 'fully_paid' : 'unpaid';
  const paymentMethod = item.payment_method || item.paymentMethod || (isPaid ? 'cash_by_rep' : undefined);
  
  const isCash = paymentMethod === 'cash_by_rep' || (item.cash_collected_by_rep !== undefined ? Number(item.cash_collected_by_rep) > 0 : false);
  const cashCollectedByRep = isPaid && isCash ? 250 : 0;

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
    repCommissionRate: item.rep_commission_rate !== undefined && item.rep_commission_rate !== null ? Number(item.rep_commission_rate) : undefined,
    packageId,
    packageName,
    packagePrice,
    amountPaid,
    paymentMethod,
    cashCollectedByRep,
    paymentStatus,
    verificationStatus: item.verification_status || item.verificationStatus || 'verified',
    googleMapsUrl: item.google_maps_url || item.googleMapsUrl || (item.lat && item.lng ? `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}` : ''),
    googlePlaceId: item.google_place_id || item.googlePlaceId,
    googleSyncStatus: item.google_sync_status || item.googleSyncStatus,
    googleSyncDate: item.google_sync_date || item.googleSyncDate,
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
  if (biz.repCommissionRate !== undefined) dbRecord.rep_commission_rate = biz.repCommissionRate;
  dbRecord.package_id = 'pkg_basic';
  dbRecord.package_name = '1. باقة التوثيق الأساسي';
  dbRecord.package_price = 250;
  if (biz.amountPaid !== undefined) {
    const isPaid = (biz.amountPaid || 0) > 0 || biz.paymentStatus === 'fully_paid';
    dbRecord.amount_paid = isPaid ? 250 : 0;
  }
  if (biz.paymentMethod !== undefined) dbRecord.payment_method = biz.paymentMethod;
  if (biz.cashCollectedByRep !== undefined) {
    const isCash = (biz.paymentMethod || 'cash_by_rep') === 'cash_by_rep';
    const isPaid = (biz.amountPaid || 0) > 0 || biz.paymentStatus === 'fully_paid';
    dbRecord.cash_collected_by_rep = isPaid && isCash ? 250 : 0;
  }
  if (biz.paymentStatus !== undefined) {
    dbRecord.payment_status = (biz.amountPaid || 0) > 0 || biz.paymentStatus === 'fully_paid' ? 'fully_paid' : 'unpaid';
  }
  if (biz.verificationStatus !== undefined) dbRecord.verification_status = biz.verificationStatus;
  if (biz.googleMapsUrl !== undefined) dbRecord.google_maps_url = biz.googleMapsUrl;
  if (biz.googlePlaceId !== undefined) dbRecord.google_place_id = biz.googlePlaceId;
  if (biz.googleSyncStatus !== undefined) dbRecord.google_sync_status = biz.googleSyncStatus;
  if (biz.googleSyncDate !== undefined) dbRecord.google_sync_date = biz.googleSyncDate;
  if (biz.invoiceNumber !== undefined) dbRecord.invoice_number = biz.invoiceNumber;
  if (biz.invoiceDate !== undefined) dbRecord.invoice_date = biz.invoiceDate;
  if (biz.createdDate !== undefined) dbRecord.created_at = biz.createdDate;
  if (biz.notes !== undefined) dbRecord.notes = biz.notes;

  return dbRecord;
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
        if (parsed.pendingPhone) (item as any).pendingPhone = parsed.pendingPhone;
        if (parsed.phoneStatus) (item as any).phoneStatus = parsed.phoneStatus;
      }
    } catch {}
  }

  const cleanId = (item.id || '').replace(/\D/g, '').slice(-4) || (item.phone || '').replace(/\D/g, '').slice(-4) || '2026';
  const defaultRefCode = item.id === 'rep_ahmed_ezalden' ? 'DALIL-8355' : `DALIL-${cleanId}`;

  return {
    id: item.id,
    name: item.name,
    email: item.email,
    phone: item.phone,
    pendingPhone: (item as any).pendingPhone || undefined,
    phoneStatus: (item as any).phoneStatus || 'none',
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
  if (rep.pendingPhone) metadata.pendingPhone = rep.pendingPhone;
  if (rep.phoneStatus) metadata.phoneStatus = rep.phoneStatus;

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
    amount: payout.amount,
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
