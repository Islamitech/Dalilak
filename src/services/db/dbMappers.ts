import { Business, Representative, PaymentGatewayConfig, PayoutRequest, InterestedLead, PaymentStatus, UserRole, AdminFollowUpNote } from '../../types';
import { safeParseJson } from '../../utils/storage';

export function parsePhotosArray(item: any): string[] {
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

export function parseVideosArray(item: any): string[] {
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

export function mapDbToBusiness(item: any): Business {
  // Extract packed metadata from notes if present
  let metaPaymentMethod = item.payment_method || item.paymentMethod;
  let metaCashCollectedByRep = item.cash_collected_by_rep !== undefined ? Number(item.cash_collected_by_rep) : item.cashCollectedByRep !== undefined ? Number(item.cashCollectedByRep) : undefined;
  let metaGoogleSyncStatus = item.google_sync_status || item.googleSyncStatus;
  let metaGooglePlaceId = item.google_place_id || item.googlePlaceId;
  let metaGoogleSyncDate = item.google_sync_date || item.googleSyncDate;
  let metaRepLocationUrl = item.rep_location_url || item.repLocationUrl;
  let metaGoogleMapsUrl = item.google_maps_url || item.googleMapsUrl;
  let metaRepCommissionRate = item.rep_commission_rate !== undefined && item.rep_commission_rate !== null ? Number(item.rep_commission_rate) : item.repCommissionRate;
  let metaIsFeeExempt: boolean | undefined = item.is_fee_exempt !== undefined && item.is_fee_exempt !== null 
    ? Boolean(item.is_fee_exempt) 
    : item.isFeeExempt !== undefined && item.isFeeExempt !== null 
    ? Boolean(item.isFeeExempt) 
    : undefined;
  let metaFeeExemptionReason = item.fee_exemption_reason || item.feeExemptionReason;
  let metaIsAlreadyOnGoogle: boolean | undefined = item.is_already_on_google !== undefined ? Boolean(item.is_already_on_google) : item.isAlreadyOnGoogle !== undefined ? Boolean(item.isAlreadyOnGoogle) : undefined;
  let metaRegistrationType = item.registration_type || item.registrationType;
  let metaVideos: string[] | undefined = undefined;
  let metaAdminFollowUps: AdminFollowUpNote[] | undefined = undefined;
  let metaPaymentReceiptPhoto = item.payment_receipt_photo || item.paymentReceiptPhoto;
  let metaPaymentReceiptDate = item.payment_receipt_date || item.paymentReceiptDate;
  let metaIsDeleted: boolean | undefined = item.is_deleted !== undefined ? Boolean(item.is_deleted) : item.isDeleted !== undefined ? Boolean(item.isDeleted) : undefined;
  let metaDeletedAt = item.deleted_at || item.deletedAt;
  let metaDeletedBy = item.deleted_by || item.deletedBy;
  let metaDeletedByRole = item.deleted_by_role || item.deletedByRole;
  let metaDeletedReason = item.deleted_reason || item.deletedReason;
  let pureNotes = item.notes;

  if (typeof item.notes === 'string' && item.notes.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(item.notes.trim());
      if (parsed && typeof parsed === 'object') {
        if (parsed.paymentMethod && !metaPaymentMethod) metaPaymentMethod = parsed.paymentMethod;
        if (parsed.cashCollectedByRep !== undefined && metaCashCollectedByRep === undefined) metaCashCollectedByRep = Number(parsed.cashCollectedByRep);
        if (parsed.paymentReceiptPhoto && !metaPaymentReceiptPhoto) metaPaymentReceiptPhoto = parsed.paymentReceiptPhoto;
        if (parsed.paymentReceiptDate && !metaPaymentReceiptDate) metaPaymentReceiptDate = parsed.paymentReceiptDate;
        if (parsed.googleSyncStatus && !metaGoogleSyncStatus) metaGoogleSyncStatus = parsed.googleSyncStatus;
        if (parsed.googlePlaceId && !metaGooglePlaceId) metaGooglePlaceId = parsed.googlePlaceId;
        if (parsed.googleSyncDate && !metaGoogleSyncDate) metaGoogleSyncDate = parsed.googleSyncDate;
        if (parsed.repLocationUrl && !metaRepLocationUrl) metaRepLocationUrl = parsed.repLocationUrl;
        if (parsed.googleMapsUrl && !metaGoogleMapsUrl) metaGoogleMapsUrl = parsed.googleMapsUrl;
        if (parsed.repCommissionRate !== undefined && metaRepCommissionRate === undefined) metaRepCommissionRate = Number(parsed.repCommissionRate);
        if (parsed.isFeeExempt !== undefined && metaIsFeeExempt === undefined) metaIsFeeExempt = Boolean(parsed.isFeeExempt);
        if (parsed.feeExemptionReason && !metaFeeExemptionReason) metaFeeExemptionReason = parsed.feeExemptionReason;
        if (parsed.isAlreadyOnGoogle !== undefined && metaIsAlreadyOnGoogle === undefined) metaIsAlreadyOnGoogle = Boolean(parsed.isAlreadyOnGoogle);
        if (parsed.registrationType !== undefined && !metaRegistrationType) metaRegistrationType = parsed.registrationType;
        if (parsed.videos && Array.isArray(parsed.videos)) metaVideos = parsed.videos;
        if (parsed.adminFollowUps && Array.isArray(parsed.adminFollowUps)) metaAdminFollowUps = parsed.adminFollowUps;
        if (parsed.isDeleted !== undefined && metaIsDeleted === undefined) metaIsDeleted = Boolean(parsed.isDeleted);
        if (parsed.deletedAt && !metaDeletedAt) metaDeletedAt = parsed.deletedAt;
        if (parsed.deletedBy && !metaDeletedBy) metaDeletedBy = parsed.deletedBy;
        if (parsed.deletedByRole && !metaDeletedByRole) metaDeletedByRole = parsed.deletedByRole;
        if (parsed.deletedReason && !metaDeletedReason) metaDeletedReason = parsed.deletedReason;
        pureNotes = parsed.userNotes !== undefined ? parsed.userNotes : undefined;
      }
    } catch {}
  }

  const directAdminFollowUps = (item.admin_follow_ups && Array.isArray(item.admin_follow_ups))
    ? item.admin_follow_ups
    : (item.adminFollowUps && Array.isArray(item.adminFollowUps) ? item.adminFollowUps : undefined);
  const finalAdminFollowUps: AdminFollowUpNote[] = directAdminFollowUps || metaAdminFollowUps || [];

  const isAlreadyOnGoogle = Boolean(
    metaIsAlreadyOnGoogle ||
    item.is_already_on_google ||
    item.isAlreadyOnGoogle ||
    item.package_id === 'pkg_already_on_google' ||
    item.packageId === 'pkg_already_on_google' ||
    item.registration_type === 'already_on_google' ||
    metaRegistrationType === 'already_on_google'
  );

  const isFeeExempt = isAlreadyOnGoogle || (metaIsFeeExempt !== undefined
    ? metaIsFeeExempt
    : Boolean(item.package_price === 0 || item.packagePrice === 0 || item.package_id === 'pkg_exempt' || item.package_id === 'pkg_already_on_google'));
  const parsedVideos = parseVideosArray(item);
  const finalVideos = parsedVideos.length > 0 ? parsedVideos : (metaVideos || []);

  // Preserve real package price and configuration
  const rawPkgPrice = item.package_price !== undefined && item.package_price !== null
    ? Number(item.package_price)
    : item.packagePrice !== undefined && item.packagePrice !== null
    ? Number(item.packagePrice)
    : isFeeExempt ? 0 : 250;
  const packagePrice = isFeeExempt ? 0 : (isNaN(rawPkgPrice) ? 250 : rawPkgPrice);
  const packageId = isAlreadyOnGoogle
    ? 'pkg_already_on_google'
    : isFeeExempt
    ? 'pkg_exempt'
    : (item.package_id || item.packageId || (packagePrice === 750 ? 'pkg_pro' : packagePrice === 2000 ? 'pkg_vip' : 'pkg_basic'));
  const packageName = isAlreadyOnGoogle
    ? 'نشاط مسجل مسبقاً على Google Maps (إدراج مجاني)'
    : isFeeExempt
    ? 'نشاط رائج بالمنطقة (إدراج مجاني بدون رسوم)'
    : (item.package_name || item.packageName || (packageId === 'pkg_pro' ? '2. عرض التأسيس والربط الذكي' : packageId === 'pkg_vip' ? '3. عرض الدعم الميداني والإدارة الشاملة VIP' : '1. باقة التوثيق الأساسي'));

  const rawPaid = Number(item.amount_paid !== undefined && item.amount_paid !== null ? item.amount_paid : (item.amountPaid || 0)) || 0;
  const rawStatus = item.payment_status || item.paymentStatus;
  const isFullyPaid = isFeeExempt || rawStatus === 'fully_paid' || (packagePrice > 0 && rawPaid >= packagePrice);
  const amountPaid = isFeeExempt ? 0 : (isFullyPaid ? packagePrice : rawPaid);
  const paymentStatus: PaymentStatus = isFullyPaid ? 'fully_paid' : amountPaid > 0 ? 'partially_paid' : 'unpaid';

  // Determine actual payment method (Never blindly default to cash_by_rep!)
  const paymentMethod: Business['paymentMethod'] = isFeeExempt
    ? 'platform_collected'
    : (metaPaymentMethod || (amountPaid > 0 ? (metaCashCollectedByRep && metaCashCollectedByRep > 0 ? 'cash_by_rep' : 'platform_collected') : 'platform_collected'));

  const cashCollectedByRep = isFeeExempt
    ? 0
    : (metaCashCollectedByRep !== undefined
    ? metaCashCollectedByRep
    : paymentMethod === 'cash_by_rep'
    ? amountPaid
    : 0);

  // 🔐 BUG-16 FIX: Number(item.lat) || 30.0444 يُحوّل lat=0 لمركز القاهرة بصمت
  // لأن 0 قيمة falsy في JS — الآن نتحقق صراحةً من وجود قيمة صالحة
  const rawLat = item.lat !== null && item.lat !== undefined ? Number(item.lat) : NaN;
  const rawLng = item.lng !== null && item.lng !== undefined ? Number(item.lng) : NaN;
  const lat = (!isNaN(rawLat) && rawLat !== 0) ? rawLat : 30.0444;
  const lng = (!isNaN(rawLng) && rawLng !== 0) ? rawLng : 31.2357;

  // 1. Rep Field Location URL (Unverified - for Admin Review/Upload use only - strictly omitted for already on google!)
  const repLocationUrl = isAlreadyOnGoogle
    ? undefined
    : (metaRepLocationUrl || item.rep_location_url || item.repLocationUrl || (lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : undefined));

  // 2. Official Verified Google Maps URL (Added by Admin or Rep on initial registration)
  let rawGoogleMapsUrl = metaGoogleMapsUrl || item.google_maps_url || item.googleMapsUrl || '';
  if (typeof rawGoogleMapsUrl === 'string') {
    rawGoogleMapsUrl = rawGoogleMapsUrl.trim();
  } else {
    rawGoogleMapsUrl = '';
  }
  const cleanGoogleMapsUrl = (rawGoogleMapsUrl && rawGoogleMapsUrl.startsWith('http') && !rawGoogleMapsUrl.includes('search/?api=1&query='))
    ? rawGoogleMapsUrl
    : undefined;

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
    lat,
    lng,
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
    paymentReceiptPhoto: metaPaymentReceiptPhoto,
    paymentReceiptDate: metaPaymentReceiptDate,
    verificationStatus: item.verification_status || item.verificationStatus || 'pending',
    repLocationUrl,
    googleMapsUrl: cleanGoogleMapsUrl,
    googlePlaceId: item.google_place_id || item.googlePlaceId || metaGooglePlaceId,
    googleSyncStatus: cleanGoogleMapsUrl ? 'synced' : ((item.google_sync_status === 'in_progress' || metaGoogleSyncStatus === 'in_progress') ? 'in_progress' : 'not_synced'),
    googleSyncDate: item.google_sync_date || item.googleSyncDate || metaGoogleSyncDate,
    invoiceNumber: item.invoice_number || item.invoiceNumber || 'INV-2026-001',
    invoiceDate: item.invoice_date || item.invoiceDate || new Date().toISOString().split('T')[0],
    notes: pureNotes,
    adminFollowUps: finalAdminFollowUps,
    createdDate: item.created_at || item.created_date || item.createdDate || item.invoice_date || new Date().toISOString(),
    isFeeExempt,
    feeExemptionReason: metaFeeExemptionReason,
    isAlreadyOnGoogle: Boolean(metaIsAlreadyOnGoogle || item.package_id === 'pkg_already_on_google'),
    registrationType: metaRegistrationType || (metaIsAlreadyOnGoogle || item.package_id === 'pkg_already_on_google' ? 'already_on_google' : 'new_verification'),
    isDeleted: Boolean(metaIsDeleted),
    deletedAt: metaDeletedAt,
    deletedBy: metaDeletedBy,
    deletedByRole: metaDeletedByRole,
    deletedReason: metaDeletedReason,
  };
}

export function getSafeCoreBusinessDbRecord(biz: Partial<Business>): any {
  const isAlreadyOnGoogle = Boolean(biz.isAlreadyOnGoogle || biz.packageId === 'pkg_already_on_google' || biz.registrationType === 'already_on_google');
  const isExempt = Boolean(isAlreadyOnGoogle || biz.isFeeExempt || biz.packagePrice === 0);
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
  record.package_id = isAlreadyOnGoogle ? 'pkg_already_on_google' : (isExempt ? 'pkg_exempt' : (biz.packageId || 'pkg_basic'));
  record.package_name = isAlreadyOnGoogle ? 'نشاط مسجل مسبقاً على Google Maps (إدراج مجاني)' : (isExempt ? 'نشاط رائج بالمنطقة (إدراج مجاني بدون رسوم)' : (biz.packageName || '1. باقة التوثيق الأساسي'));
  record.package_price = isExempt ? 0 : (Number(biz.packagePrice) || 250);
  record.amount_paid = isExempt ? 0 : (Number(biz.amountPaid) || 0);
  record.payment_status = isExempt ? 'fully_paid' : (biz.paymentStatus || 'unpaid');
  record.verification_status = isAlreadyOnGoogle ? 'verified' : (biz.verificationStatus || 'pending');
  record.rep_id = biz.repId || 'rep_1';
  record.rep_name = biz.repName || 'مندوب معتمد';
  // 🔐 BUG-15 FIX: Math.random() من نطاق 900 فقط يُسبب تكرار أرقام الفواتير
  // الآن: timestamp + random suffix = تفرد فعلي وعملي
  record.invoice_number = biz.invoiceNumber || `INV-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
  record.invoice_date = biz.invoiceDate || new Date().toISOString().split('T')[0];
  record.created_at = biz.createdDate || new Date().toISOString();

  let cleanGoogleMapsUrl: string | null = null;
  if (biz.googleMapsUrl && typeof biz.googleMapsUrl === 'string') {
    let trimmed = biz.googleMapsUrl.trim();
    if (trimmed) {
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        trimmed = `https://${trimmed}`;
      }
      if (!trimmed.includes('search/?api=1&query=')) {
        cleanGoogleMapsUrl = trimmed;
      }
    }
  }

  let cleanRepLocationUrl: string | null = null;
  if (!isAlreadyOnGoogle) {
    if (biz.repLocationUrl && typeof biz.repLocationUrl === 'string') {
      let trimmed = biz.repLocationUrl.trim();
      if (trimmed) {
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          trimmed = `https://${trimmed}`;
        }
        cleanRepLocationUrl = trimmed;
      }
    }
    if (!cleanRepLocationUrl && biz.lat && biz.lng) {
      cleanRepLocationUrl = `https://www.google.com/maps?q=${biz.lat},${biz.lng}`;
    }
  }

  // Safely parse existing meta from notes if present to prevent clobbering during partial saves
  let existingMeta: any = {};
  if (typeof biz.notes === 'string' && biz.notes.trim().startsWith('{')) {
    try {
      existingMeta = JSON.parse(biz.notes.trim()) || {};
    } catch {}
  }

  const finalVideos = Array.isArray(biz.videos)
    ? biz.videos.filter(v => typeof v === 'string' && (v.startsWith('http') || v.startsWith('data:') || v.startsWith('blob:')))
    : (Array.isArray(existingMeta.videos) ? existingMeta.videos : []);

  const finalAdminFollowUps = Array.isArray(biz.adminFollowUps)
    ? biz.adminFollowUps
    : (Array.isArray(existingMeta.adminFollowUps) ? existingMeta.adminFollowUps : []);

  const finalUserNotes = typeof biz.notes === 'string' && !biz.notes.trim().startsWith('{')
    ? biz.notes
    : (existingMeta.userNotes || undefined);

  // Safely preserve financial, sync, video, and admin follow-up metadata in notes JSON
  const metaObj = {
    paymentMethod: isExempt ? 'platform_collected' : (biz.paymentMethod !== undefined ? biz.paymentMethod : existingMeta.paymentMethod),
    cashCollectedByRep: isExempt ? 0 : (biz.cashCollectedByRep !== undefined ? biz.cashCollectedByRep : existingMeta.cashCollectedByRep),
    repCommissionRate: isExempt ? 0 : (biz.repCommissionRate !== undefined ? biz.repCommissionRate : existingMeta.repCommissionRate),
    isFeeExempt: isExempt,
    feeExemptionReason: biz.feeExemptionReason !== undefined ? biz.feeExemptionReason : existingMeta.feeExemptionReason,
    isAlreadyOnGoogle,
    registrationType: isAlreadyOnGoogle ? 'already_on_google' : (biz.registrationType || existingMeta.registrationType || 'new_verification'),
    googleSyncStatus: isAlreadyOnGoogle ? 'synced' : (biz.googleSyncStatus || existingMeta.googleSyncStatus),
    googlePlaceId: biz.googlePlaceId || existingMeta.googlePlaceId,
    googleSyncDate: isAlreadyOnGoogle ? (biz.googleSyncDate || new Date().toISOString().split('T')[0]) : (biz.googleSyncDate || existingMeta.googleSyncDate),
    repLocationUrl: cleanRepLocationUrl || existingMeta.repLocationUrl,
    googleMapsUrl: cleanGoogleMapsUrl || existingMeta.googleMapsUrl,
    videos: finalVideos,
    adminFollowUps: finalAdminFollowUps,
    paymentReceiptPhoto: biz.paymentReceiptPhoto !== undefined ? biz.paymentReceiptPhoto : existingMeta.paymentReceiptPhoto,
    paymentReceiptDate: biz.paymentReceiptDate !== undefined ? biz.paymentReceiptDate : existingMeta.paymentReceiptDate,
    isDeleted: biz.isDeleted !== undefined ? biz.isDeleted : existingMeta.isDeleted,
    deletedAt: biz.deletedAt !== undefined ? biz.deletedAt : existingMeta.deletedAt,
    deletedBy: biz.deletedBy !== undefined ? biz.deletedBy : existingMeta.deletedBy,
    deletedByRole: biz.deletedByRole !== undefined ? biz.deletedByRole : existingMeta.deletedByRole,
    deletedReason: biz.deletedReason !== undefined ? biz.deletedReason : existingMeta.deletedReason,
    userNotes: finalUserNotes,
  };
  record.notes = JSON.stringify(metaObj);

  return record;
}

export function mapBusinessToDb(biz: Partial<Business>): any {
  return getSafeCoreBusinessDbRecord(biz);
}

export function mapPartialBusinessToDb(updates: Partial<Business>, baseBiz?: Business): any {
  const record: any = {};
  if (updates.nameAr !== undefined) record.name_ar = updates.nameAr.trim();
  if (updates.nameEn !== undefined) record.name_en = updates.nameEn?.trim() || null;
  if (updates.category !== undefined) record.category = updates.category;
  if (updates.governorate !== undefined) record.governorate = updates.governorate;
  if (updates.city !== undefined) record.city = updates.city;
  if (updates.street !== undefined) record.street = updates.street;
  if (updates.landmark !== undefined) record.landmark = updates.landmark?.trim() || null;
  if (updates.phone !== undefined) record.phone = updates.phone.trim();
  if (updates.secondaryPhone !== undefined) record.secondary_phone = updates.secondaryPhone?.trim() || null;
  if (updates.workingHours !== undefined) record.working_hours = updates.workingHours;
  if (updates.description !== undefined) record.description = updates.description;
  if (updates.lat !== undefined) record.lat = Number(updates.lat);
  if (updates.lng !== undefined) record.lng = Number(updates.lng);
  if (updates.ownerName !== undefined) record.owner_name = updates.ownerName.trim();
  if (updates.ownerPhone !== undefined) record.owner_phone = updates.ownerPhone.trim();
  if (updates.ownerEmail !== undefined) record.owner_email = updates.ownerEmail?.trim() || null;
  if (updates.nationalId !== undefined) record.national_id = updates.nationalId?.trim() || null;
  if (updates.photos !== undefined && Array.isArray(updates.photos)) record.photos = updates.photos;
  if (updates.packageId !== undefined) record.package_id = updates.packageId;
  if (updates.packageName !== undefined) record.package_name = updates.packageName;
  if (updates.packagePrice !== undefined) record.package_price = Number(updates.packagePrice);
  if (updates.amountPaid !== undefined) record.amount_paid = Number(updates.amountPaid);
  if (updates.paymentStatus !== undefined) record.payment_status = updates.paymentStatus;
  if (updates.verificationStatus !== undefined) record.verification_status = updates.verificationStatus;
  if (updates.repId !== undefined) record.rep_id = updates.repId;
  if (updates.repName !== undefined) record.rep_name = updates.repName;
  if (updates.invoiceNumber !== undefined) record.invoice_number = updates.invoiceNumber;
  if (updates.invoiceDate !== undefined) record.invoice_date = updates.invoiceDate;

  // If any metadata / notes field is updated, serialize notes safely merging with baseBiz
  const hasMetaUpdates =
    updates.notes !== undefined ||
    updates.adminFollowUps !== undefined ||
    updates.videos !== undefined ||
    updates.paymentReceiptPhoto !== undefined ||
    updates.paymentReceiptDate !== undefined ||
    updates.googleMapsUrl !== undefined ||
    updates.googleSyncStatus !== undefined ||
    updates.googlePlaceId !== undefined ||
    updates.googleSyncDate !== undefined ||
    updates.repLocationUrl !== undefined ||
    updates.paymentMethod !== undefined ||
    updates.cashCollectedByRep !== undefined ||
    updates.repCommissionRate !== undefined ||
    updates.isFeeExempt !== undefined ||
    updates.feeExemptionReason !== undefined ||
    updates.isAlreadyOnGoogle !== undefined ||
    updates.registrationType !== undefined;

  if (hasMetaUpdates) {
    const fullMerged = { ...(baseBiz || {}), ...updates } as Business;
    const fullDbRecord = getSafeCoreBusinessDbRecord(fullMerged);
    record.notes = fullDbRecord.notes;
  }

  return record;
}

export function mapDbToRep(item: any): Representative {
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
  let metaPassword: string | undefined = item.password;
  let metaLastActiveTimestamp: number | undefined = item.last_active_timestamp ? Number(item.last_active_timestamp) : (item.lastActiveTimestamp ? Number(item.lastActiveTimestamp) : undefined);
  let metaActiveSessionId: string | undefined = item.active_session_id || item.activeSessionId;
  let metaIsDeleted: boolean | undefined = item.is_deleted !== undefined ? Boolean(item.is_deleted) : item.isDeleted !== undefined ? Boolean(item.isDeleted) : undefined;
  let metaDeletedAt: string | undefined = item.deleted_at || item.deletedAt;
  let metaDeletedBy: string | undefined = item.deleted_by || item.deletedBy;
  let metaDeletedByRole: string | undefined = item.deleted_by_role || item.deletedByRole;

  // Backward compatibility check for JSON avatar packing
  if (typeof parsedAvatar === 'string' && parsedAvatar.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(parsedAvatar.trim());
      if (parsed && typeof parsed === 'object') {
        parsedAvatar = parsed.avatar || '';
        if (parsed.password && !metaPassword) metaPassword = parsed.password;
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
        if (parsed.lastActiveTimestamp && !metaLastActiveTimestamp) metaLastActiveTimestamp = Number(parsed.lastActiveTimestamp);
        if (parsed.activeSessionId && !metaActiveSessionId) metaActiveSessionId = parsed.activeSessionId;
        if (parsed.isDeleted !== undefined && metaIsDeleted === undefined) metaIsDeleted = Boolean(parsed.isDeleted);
        if (parsed.deletedAt && !metaDeletedAt) metaDeletedAt = parsed.deletedAt;
        if (parsed.deletedBy && !metaDeletedBy) metaDeletedBy = parsed.deletedBy;
        if (parsed.deletedByRole && !metaDeletedByRole) metaDeletedByRole = parsed.deletedByRole;
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
    activationFacePhoto: metaActivationFacePhoto || parsedAvatar || '',
    nationalIdCardPhoto: metaNationalIdCardPhoto || '',
    nationalIdCardBackPhoto: metaNationalIdCardBackPhoto || '',
    role: (item.role || 'rep') as UserRole,
    roleTitle: (() => {
      const rawTitle = (item.role_title || item.roleTitle || '').trim();
      const actualRole = item.role || 'rep';
      if (actualRole === 'admin') {
        return rawTitle && rawTitle !== 'مندوب مبيعات ميداني' ? rawTitle : 'مدير النظام (أدمن)';
      }
      if (actualRole === 'supervisor') {
        return rawTitle && rawTitle !== 'مندوب مبيعات ميداني' ? rawTitle : 'مشرف إدارة منطقة ومحافظة';
      }
      if (actualRole === 'accountant') {
        return rawTitle && rawTitle !== 'مندوب مبيعات ميداني' ? rawTitle : 'محاسب ومحصل فواتير';
      }
      return rawTitle || 'مندوب مبيعات ميداني';
    })(),
    governorate: item.governorate || 'القاهرة',
    targetMonth: Number(item.target_month || item.targetMonth) || 25,
    avatar: parsedAvatar,
    avatarStatus: item.avatar_status || item.avatarStatus || 'none',
    commissionRate: Number(item.commission_rate || item.commissionRate) || 42.86,
    status: (item.status as any) || 'suspended',
    password: item.password || metaPassword || undefined,
    activeSessionId: undefined, // Never populate activeSessionId from DB into public rep state
    lastActiveTimestamp: metaLastActiveTimestamp,
    referralCode: metaReferralCode || defaultRefCode,
    referredByCode: metaReferredByCode || undefined,
    referralUnlocked: Boolean(metaReferralUnlocked),
    adminBypassReferral: Boolean(metaAdminBypassReferral),
    referralRewardGranted: Boolean(metaReferralRewardGranted),
    isDeleted: Boolean(metaIsDeleted),
    deletedAt: metaDeletedAt,
    deletedBy: metaDeletedBy,
    deletedByRole: metaDeletedByRole,
  };
}

export function mapRepToDb(rep: Partial<Representative>): any {
  const record: any = {};

  if (rep.id !== undefined) record.id = rep.id;
  if (rep.name !== undefined) record.name = rep.name;
  if (rep.email !== undefined) record.email = rep.email;
  if (rep.phone !== undefined) record.phone = rep.phone;
  if (rep.nationalId !== undefined) record.national_id = rep.nationalId || null;
  if (rep.role !== undefined) record.role = rep.role;
  if (rep.roleTitle !== undefined) record.role_title = rep.roleTitle;
  if (rep.governorate !== undefined) record.governorate = rep.governorate;
  if (rep.targetMonth !== undefined) record.target_month = Number(rep.targetMonth) || 25;
  if (rep.avatarStatus !== undefined) record.avatar_status = rep.avatarStatus || 'approved';
  if (rep.commissionRate !== undefined) record.commission_rate = Number(rep.commissionRate) || 42.86;
  if (rep.status !== undefined) record.status = rep.status;
  if (rep.password !== undefined) record.password = rep.password;

  // Extract clean avatar if already packed
  let cleanAvatar = rep.avatar;
  let existingMeta: any = {};
  if (typeof cleanAvatar === 'string' && cleanAvatar.trim().startsWith('{')) {
    try {
      existingMeta = JSON.parse(cleanAvatar.trim()) || {};
      cleanAvatar = existingMeta.avatar || '';
    } catch {}
  }

  // Pack metadata into avatar JSON to preserve face photo, KYC documents, and referral settings in Supabase
  const avatarBundle = {
    ...existingMeta,
    avatar: cleanAvatar || existingMeta.avatar || '',
    password: rep.password ?? existingMeta.password, // 🛡️ Triple-failsafe: preserves password inside avatar JSON
    referralCode: rep.referralCode ?? existingMeta.referralCode,
    referredByCode: rep.referredByCode ?? existingMeta.referredByCode,
    referralUnlocked: rep.referralUnlocked ?? existingMeta.referralUnlocked,
    adminBypassReferral: rep.adminBypassReferral ?? existingMeta.adminBypassReferral,
    referralRewardGranted: rep.referralRewardGranted ?? existingMeta.referralRewardGranted,
    activationFacePhoto: rep.activationFacePhoto ?? existingMeta.activationFacePhoto ?? '',
    nationalIdCardPhoto: rep.nationalIdCardPhoto ?? existingMeta.nationalIdCardPhoto ?? '',
    nationalIdCardBackPhoto: rep.nationalIdCardBackPhoto ?? existingMeta.nationalIdCardBackPhoto ?? '',
    pendingPhone: rep.pendingPhone ?? existingMeta.pendingPhone,
    phoneStatus: rep.phoneStatus ?? existingMeta.phoneStatus ?? 'none',
    lastActiveTimestamp: rep.lastActiveTimestamp ?? existingMeta.lastActiveTimestamp,
    activeSessionId: rep.activeSessionId ?? existingMeta.activeSessionId,
    isDeleted: rep.isDeleted ?? existingMeta.isDeleted,
    deletedAt: rep.deletedAt ?? existingMeta.deletedAt,
    deletedBy: rep.deletedBy ?? existingMeta.deletedBy,
    deletedByRole: rep.deletedByRole ?? existingMeta.deletedByRole,
  };

  record.avatar = JSON.stringify(avatarBundle);

  return record;
}

export function mapDbToPayout(item: any): PayoutRequest {
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

export function mapPayoutToDb(payout: PayoutRequest): any {
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

export function mapDbToLead(item: any): InterestedLead {
  let lat = item.lat ? Number(item.lat) : undefined;
  let lng = item.lng ? Number(item.lng) : undefined;
  let locationUrl = item.location_url || item.locationUrl;

  if ((!lat || !lng) && item.notes && typeof item.notes === 'string') {
    const match = item.notes.match(/https:\/\/www\.google\.com\/maps\?q=([0-9.]+),([0-9.]+)/);
    if (match) {
      lat = Number(match[1]);
      lng = Number(match[2]);
      if (!locationUrl) locationUrl = match[0];
    }
  }

  let adminFollowUps: AdminFollowUpNote[] = [];
  if (Array.isArray(item.admin_follow_ups)) {
    adminFollowUps = item.admin_follow_ups;
  } else if (Array.isArray(item.adminFollowUps)) {
    adminFollowUps = item.adminFollowUps;
  } else if (typeof item.admin_follow_ups === 'string') {
    adminFollowUps = safeParseJson<AdminFollowUpNote[]>(item.admin_follow_ups, []);
  }

  return {
    id: item.id || `lead_${Date.now()}`,
    clientName: item.client_name || item.clientName || item.name || 'عميل محتمل',
    businessName: item.business_name || item.businessName || item.business_type || 'نشاط تجاري',
    businessCategory: item.business_category || item.businessCategory,
    phone: item.phone || '',
    secondaryPhone: item.secondary_phone || item.secondaryPhone,
    governorate: item.governorate || 'القاهرة',
    city: item.city || 'القاهرة',
    street: item.street || undefined,
    lat,
    lng,
    locationUrl: locationUrl || (lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : undefined),
    interestLevel: item.interest_level || item.interestLevel || 'high',
    notes: item.notes,
    adminFollowUps,
    followUpDate: item.follow_up_date || item.followUpDate,
    createdDate: item.created_at || item.created_date || item.createdDate || item.invoice_date || new Date().toISOString(),
    repId: item.rep_id || item.repId || 'rep_1',
    repName: item.rep_name || item.repName || 'مندوب معتمد',
    lastContactedDate: item.last_contacted_date || item.lastContactedDate,
    status: item.status || 'pending_followup',
  };
}

export function mapLeadToDb(lead: InterestedLead): any {
  return {
    id: lead.id,
    client_name: lead.clientName,
    business_name: lead.businessName || null,
    business_category: lead.businessCategory || null,
    phone: lead.phone,
    secondary_phone: lead.secondaryPhone || null,
    governorate: lead.governorate,
    city: lead.city || null,
    street: lead.street || null,
    lat: lead.lat ?? null,
    lng: lead.lng ?? null,
    location_url: lead.locationUrl || (lead.lat && lead.lng ? `https://www.google.com/maps?q=${lead.lat},${lead.lng}` : null),
    interest_level: lead.interestLevel,
    notes: lead.notes || null,
    admin_follow_ups: Array.isArray(lead.adminFollowUps) ? lead.adminFollowUps : [],
    follow_up_date: lead.followUpDate || null,
    created_at: lead.createdDate,
    rep_id: lead.repId,
    rep_name: lead.repName,
    last_contacted_date: lead.lastContactedDate || null,
    status: lead.status,
  };
}
