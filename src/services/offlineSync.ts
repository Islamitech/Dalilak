import { Business, InterestedLead, PayoutRequest } from '../types';
import { supabase, isSupabaseConfigured, supabaseRestFetch } from '../lib/supabase';
import { uploadMediaToSupabaseStorage } from './storage';

const DB_NAME = 'dalelak_offline_db';
const DB_VERSION = 1;

const STORES = {
  BUSINESSES: 'offline_businesses',
  LEADS: 'offline_leads',
  PAYOUTS: 'offline_payouts',
};

export interface OfflineSyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingBusinessesCount: number;
  pendingLeadsCount: number;
  pendingPayoutsCount: number;
  totalPendingCount: number;
  lastSyncTime: string | null;
  syncProgress?: { current: number; total: number; message: string } | null;
}

/**
 * Open or upgrade IndexedDB database
 */
export function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this device/browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.BUSINESSES)) {
        db.createObjectStore(STORES.BUSINESSES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.LEADS)) {
        db.createObjectStore(STORES.LEADS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.PAYOUTS)) {
        db.createObjectStore(STORES.PAYOUTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Helper to get currently active authenticated user identity (id or email)
 */
export function getActiveUserId(): string | null {
  try {
    const sessionUser = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('dalelak_active_user') : null;
    if (sessionUser) {
      const parsed = JSON.parse(sessionUser);
      if (parsed && (parsed.id || parsed.email)) return (parsed.id || parsed.email).toString();
    }
    const localUser = typeof localStorage !== 'undefined' ? localStorage.getItem('dalelak_active_user') : null;
    if (localUser) {
      const parsed = JSON.parse(localUser);
      if (parsed && (parsed.id || parsed.email)) return (parsed.id || parsed.email).toString();
    }
  } catch {}
  return null;
}

// -----------------------------------------------------------------------------
// BUSINESSES STORE HELPERS
// -----------------------------------------------------------------------------

export async function saveOfflineBusiness(business: Business, userId?: string): Promise<void> {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction(STORES.BUSINESSES, 'readwrite');
    const store = tx.objectStore(STORES.BUSINESSES);
    
    const currentUid = userId || getActiveUserId() || business.repId || 'unknown';

    // Add offline metadata tag
    const offlineRecord = {
      ...business,
      _offlineUserId: currentUid,
      _offlineTimestamp: Date.now(),
      _isOfflinePending: true,
    };

    store.put(offlineRecord);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        dispatchOfflineStateChangeEvent();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save offline business in IndexedDB:', err);
  }
}

export async function getOfflineBusinesses(targetUserId?: string | null): Promise<Business[]> {
  try {
    const effectiveUid = targetUserId !== undefined ? targetUserId : getActiveUserId();
    // If no user is logged in, do not return any pending offline records to prevent cross-account leak
    if (!effectiveUid) return [];

    const db = await openOfflineDb();
    const tx = db.transaction(STORES.BUSINESSES, 'readonly');
    const store = tx.objectStore(STORES.BUSINESSES);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const all: Business[] = request.result || [];
        const filtered = all.filter((b: any) => {
          const recordUid = (b._offlineUserId || b.repId || '').toString().toLowerCase();
          const currentUidStr = effectiveUid.toString().toLowerCase();
          return recordUid === currentUidStr || recordUid === 'unknown';
        });
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to get offline businesses from IndexedDB:', err);
    return [];
  }
}

export async function removeOfflineBusiness(id: string): Promise<void> {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction(STORES.BUSINESSES, 'readwrite');
    const store = tx.objectStore(STORES.BUSINESSES);
    store.delete(id);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        dispatchOfflineStateChangeEvent();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to delete offline business from IndexedDB:', err);
  }
}

// -----------------------------------------------------------------------------
// LEADS STORE HELPERS
// -----------------------------------------------------------------------------

export async function saveOfflineLead(lead: InterestedLead, userId?: string): Promise<void> {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction(STORES.LEADS, 'readwrite');
    const store = tx.objectStore(STORES.LEADS);

    const currentUid = userId || getActiveUserId() || lead.repId || 'unknown';

    store.put({
      ...lead,
      _offlineUserId: currentUid,
      _offlineTimestamp: Date.now(),
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        dispatchOfflineStateChangeEvent();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save offline lead in IndexedDB:', err);
  }
}

export async function getOfflineLeads(targetUserId?: string | null): Promise<InterestedLead[]> {
  try {
    const effectiveUid = targetUserId !== undefined ? targetUserId : getActiveUserId();
    if (!effectiveUid) return [];

    const db = await openOfflineDb();
    const tx = db.transaction(STORES.LEADS, 'readonly');
    const store = tx.objectStore(STORES.LEADS);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const all: InterestedLead[] = request.result || [];
        const filtered = all.filter((l: any) => {
          const recordUid = (l._offlineUserId || l.repId || '').toString().toLowerCase();
          const currentUidStr = effectiveUid.toString().toLowerCase();
          return recordUid === currentUidStr || recordUid === 'unknown';
        });
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to get offline leads from IndexedDB:', err);
    return [];
  }
}

export async function removeOfflineLead(id: string): Promise<void> {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction(STORES.LEADS, 'readwrite');
    const store = tx.objectStore(STORES.LEADS);
    store.delete(id);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        dispatchOfflineStateChangeEvent();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to delete offline lead from IndexedDB:', err);
  }
}

// -----------------------------------------------------------------------------
// PAYOUTS STORE HELPERS
// -----------------------------------------------------------------------------

export async function saveOfflinePayout(payout: PayoutRequest, userId?: string): Promise<void> {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction(STORES.PAYOUTS, 'readwrite');
    const store = tx.objectStore(STORES.PAYOUTS);

    const currentUid = userId || getActiveUserId() || payout.repId || 'unknown';

    store.put({
      ...payout,
      _offlineUserId: currentUid,
      _offlineTimestamp: Date.now(),
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        dispatchOfflineStateChangeEvent();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save offline payout in IndexedDB:', err);
  }
}

export async function getOfflinePayouts(targetUserId?: string | null): Promise<PayoutRequest[]> {
  try {
    const effectiveUid = targetUserId !== undefined ? targetUserId : getActiveUserId();
    if (!effectiveUid) return [];

    const db = await openOfflineDb();
    const tx = db.transaction(STORES.PAYOUTS, 'readonly');
    const store = tx.objectStore(STORES.PAYOUTS);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const all: PayoutRequest[] = request.result || [];
        const filtered = all.filter((p: any) => {
          const recordUid = (p._offlineUserId || p.repId || '').toString().toLowerCase();
          const currentUidStr = effectiveUid.toString().toLowerCase();
          return recordUid === currentUidStr || recordUid === 'unknown';
        });
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to get offline payouts from IndexedDB:', err);
    return [];
  }
}

export async function removeOfflinePayout(id: string): Promise<void> {
  try {
    const db = await openOfflineDb();
    const tx = db.transaction(STORES.PAYOUTS, 'readwrite');
    const store = tx.objectStore(STORES.PAYOUTS);
    store.delete(id);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        dispatchOfflineStateChangeEvent();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to delete offline payout from IndexedDB:', err);
  }
}

// -----------------------------------------------------------------------------
// PENDING COUNTS & STATUS
// -----------------------------------------------------------------------------

export async function getOfflineSyncStatus(targetUserId?: string | null): Promise<OfflineSyncStatus> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const effectiveUid = targetUserId !== undefined ? targetUserId : getActiveUserId();

  if (!effectiveUid) {
    return {
      isOnline,
      isSyncing: false,
      pendingBusinessesCount: 0,
      pendingLeadsCount: 0,
      pendingPayoutsCount: 0,
      totalPendingCount: 0,
      lastSyncTime: null,
    };
  }

  const [businesses, leads, payouts] = await Promise.all([
    getOfflineBusinesses(effectiveUid),
    getOfflineLeads(effectiveUid),
    getOfflinePayouts(effectiveUid),
  ]);

  const lastSyncTime = typeof localStorage !== 'undefined' ? localStorage.getItem('dalelak_last_sync_timestamp') : null;

  return {
    isOnline,
    isSyncing: isCurrentlySyncing,
    pendingBusinessesCount: businesses.length,
    pendingLeadsCount: leads.length,
    pendingPayoutsCount: payouts.length,
    totalPendingCount: businesses.length + leads.length + payouts.length,
    lastSyncTime,
  };
}

// -----------------------------------------------------------------------------
// AUTOMATIC CLOUD SYNC ENGINE
// -----------------------------------------------------------------------------

let isCurrentlySyncing = false;

export async function syncAllPendingOfflineData(
  targetUserId?: string | null,
  onProgress?: (current: number, total: number, itemName: string) => void
): Promise<{ success: boolean; syncedCount: number; failedCount: number }> {
  if (isCurrentlySyncing) {
    return { success: false, syncedCount: 0, failedCount: 0 };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, syncedCount: 0, failedCount: 0 };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, syncedCount: 0, failedCount: 0 };
  }

  const effectiveUid = targetUserId !== undefined ? targetUserId : getActiveUserId();
  if (!effectiveUid) {
    return { success: true, syncedCount: 0, failedCount: 0 };
  }

  isCurrentlySyncing = true;
  dispatchOfflineStateChangeEvent();

  let syncedCount = 0;
  let failedCount = 0;

  try {
    const [businesses, leads, payouts] = await Promise.all([
      getOfflineBusinesses(effectiveUid),
      getOfflineLeads(effectiveUid),
      getOfflinePayouts(effectiveUid),
    ]);

    const totalItems = businesses.length + leads.length + payouts.length;
    if (totalItems === 0) {
      isCurrentlySyncing = false;
      dispatchOfflineStateChangeEvent();
      return { success: true, syncedCount: 0, failedCount: 0 };
    }

    let currentIndex = 0;

    // 1. Sync Offline Businesses
    for (const biz of businesses) {
      currentIndex++;
      if (onProgress) onProgress(currentIndex, totalItems, `مزامنة نشاط: ${biz.nameAr}`);

      try {
        // Step A: Upload any base64/blob photos to Supabase Storage
        let cleanPhotos: string[] = [];
        if (Array.isArray(biz.photos) && biz.photos.length > 0) {
          for (const photo of biz.photos) {
            if (typeof photo === 'string' && photo.startsWith('data:')) {
              try {
                const publicUrl = await uploadMediaToSupabaseStorage(photo, 'photos');
                cleanPhotos.push(publicUrl);
              } catch {
                cleanPhotos.push(photo);
              }
            } else if (typeof photo === 'string') {
              cleanPhotos.push(photo);
            }
          }
        }

        // Step B: Sanitize videos array (must be valid hosted URLs only)
        const cleanVideos = (biz.videos || []).filter(
          (v) => typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://'))
        );

        const cleanBizToSave: Business = {
          ...biz,
          photos: cleanPhotos,
          videos: cleanVideos,
        };

        // Step C: Save to Supabase Cloud
        const repLocationUrl = cleanBizToSave.repLocationUrl || (cleanBizToSave.lat && cleanBizToSave.lng ? `https://www.google.com/maps?q=${cleanBizToSave.lat},${cleanBizToSave.lng}` : null);
        const googleMapsUrl = (cleanBizToSave.googleMapsUrl && cleanBizToSave.googleMapsUrl.trim().startsWith('http') && !cleanBizToSave.googleMapsUrl.includes('search/?api=1&query=')) ? cleanBizToSave.googleMapsUrl.trim() : null;

        const dbPayload: any = {
          id: cleanBizToSave.id,
          name_ar: cleanBizToSave.nameAr,
          name_en: cleanBizToSave.nameEn || null,
          category: cleanBizToSave.category || 'عام',
          governorate: cleanBizToSave.governorate || 'القاهرة',
          city: cleanBizToSave.city || 'القاهرة',
          street: cleanBizToSave.street || 'الموقع الجغرافي المسجل على الخريطة',
          landmark: cleanBizToSave.landmark || null,
          phone: cleanBizToSave.phone,
          secondary_phone: cleanBizToSave.secondaryPhone || null,
          working_hours: cleanBizToSave.workingHours || 'يومياً',
          description: cleanBizToSave.description || `نشاط ${cleanBizToSave.nameAr}`,
          lat: Number(cleanBizToSave.lat) || 30.0444,
          lng: Number(cleanBizToSave.lng) || 31.2357,
          owner_name: cleanBizToSave.ownerName || 'صاحب النشاط',
          owner_phone: cleanBizToSave.ownerPhone || cleanBizToSave.phone,
          owner_email: cleanBizToSave.ownerEmail || null,
          national_id: cleanBizToSave.nationalId || null,
          photos: cleanPhotos,
          package_id: cleanBizToSave.packageId || 'pkg_basic',
          package_name: cleanBizToSave.packageName || '1. باقة التوثيق الأساسي',
          package_price: Number(cleanBizToSave.packagePrice) || 250,
          amount_paid: Number(cleanBizToSave.amountPaid) || 0,
          payment_status: cleanBizToSave.paymentStatus || 'unpaid',
          verification_status: cleanBizToSave.verificationStatus || 'pending',
          rep_id: cleanBizToSave.repId || 'rep_1',
          rep_name: cleanBizToSave.repName || 'مندوب معتمد',
          invoice_number: cleanBizToSave.invoiceNumber,
          invoice_date: cleanBizToSave.invoiceDate,
          created_at: cleanBizToSave.createdDate || new Date().toISOString(),
          notes: JSON.stringify({
            paymentMethod: cleanBizToSave.paymentMethod,
            cashCollectedByRep: cleanBizToSave.cashCollectedByRep,
            repCommissionRate: cleanBizToSave.repCommissionRate,
            googleSyncStatus: cleanBizToSave.googleSyncStatus,
            googlePlaceId: cleanBizToSave.googlePlaceId,
            googleSyncDate: cleanBizToSave.googleSyncDate,
            repLocationUrl,
            googleMapsUrl,
            videos: cleanVideos,
            userNotes: cleanBizToSave.notes,
          }),
        };

        let isSaved = false;

        // Try Supabase SDK upsert first
        try {
          const { error } = await supabase
            .from('businesses')
            .upsert(dbPayload, { onConflict: 'id' });
          if (!error) {
            isSaved = true;
          }
        } catch {}

        // Fallback to Supabase PostgREST Fetch
        if (!isSaved) {
          const res = await supabaseRestFetch('businesses', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
            body: JSON.stringify(dbPayload),
          });
          if (res.ok) {
            isSaved = true;
          }
        }

        if (isSaved) {
          // Successfully stored on Cloud: remove from offline queue
          await removeOfflineBusiness(biz.id);
          syncedCount++;
        } else {
          failedCount++;
        }
      } catch (bizErr) {
        console.warn(`Error syncing offline business ${biz.id}:`, bizErr);
        failedCount++;
      }
    }

    // 2. Sync Offline Leads
    for (const lead of leads) {
      currentIndex++;
      if (onProgress) onProgress(currentIndex, totalItems, `مزامنة عميل مهتم: ${lead.clientName}`);

      try {
        const leadPayload = {
          id: lead.id,
          client_name: lead.clientName,
          business_name: lead.businessName || null,
          business_category: lead.businessCategory || null,
          phone: lead.phone,
          secondary_phone: lead.secondaryPhone || null,
          governorate: lead.governorate || 'القاهرة',
          city: lead.city || 'القاهرة',
          interest_level: lead.interestLevel || 'medium',
          notes: lead.notes || null,
          follow_up_date: lead.followUpDate || null,
          rep_id: lead.repId || 'rep_1',
          rep_name: lead.repName || 'مندوب معتمد',
          last_contacted_date: lead.lastContactedDate || null,
          status: lead.status || 'pending_followup',
        };

        let leadSaved = false;

        try {
          const res = await supabaseRestFetch('leads', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
            body: JSON.stringify(leadPayload),
          });
          if (res.ok) leadSaved = true;
        } catch {}

        if (!leadSaved) {
          try {
            const localRes = await fetch('/api/leads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(lead),
            });
            if (localRes.ok) leadSaved = true;
          } catch {}
        }

        if (leadSaved) {
          await removeOfflineLead(lead.id);
          syncedCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    // 3. Sync Offline Payouts
    for (const payout of payouts) {
      currentIndex++;
      if (onProgress) onProgress(currentIndex, totalItems, `مزامنة طلب تسوية: ${payout.amount} ج.م`);

      try {
        const payoutPayload = {
          id: payout.id,
          rep_id: payout.repId,
          rep_name: payout.repName,
          rep_phone: payout.repPhone || null,
          amount: payout.amount,
          method: payout.method,
          account_details: payout.accountDetails,
          status: payout.status || 'pending',
          request_date: payout.requestDate,
          receipt_photo: payout.receiptPhoto || null,
          transaction_ref: payout.transactionRef || null,
          admin_notes: payout.adminNotes || null,
          type: payout.type || 'payout',
        };

        let payoutSaved = false;

        try {
          const res = await supabaseRestFetch('payout_requests', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
            body: JSON.stringify(payoutPayload),
          });
          if (res.ok) payoutSaved = true;
        } catch {}

        if (!payoutSaved) {
          try {
            const localRes = await fetch('/api/payouts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payout),
            });
            if (localRes.ok) payoutSaved = true;
          } catch {}
        }

        if (payoutSaved) {
          await removeOfflinePayout(payout.id);
          syncedCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    if (syncedCount > 0) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('dalelak_last_sync_timestamp', new Date().toISOString());
      }
    }
  } catch (globalSyncErr) {
    console.warn('Global offline sync warning:', globalSyncErr);
  } finally {
    isCurrentlySyncing = false;
    dispatchOfflineStateChangeEvent();
  }

  return {
    success: failedCount === 0,
    syncedCount,
    failedCount,
  };
}

// -----------------------------------------------------------------------------
// EVENT DISPATCHER FOR REACTIVE UI UPDATES
// -----------------------------------------------------------------------------

function dispatchOfflineStateChangeEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dalelak_offline_state_changed'));
  }
}

// -----------------------------------------------------------------------------
// EMERGENCY OFFLINE BACKUP JSON EXPORT
// -----------------------------------------------------------------------------

export async function exportOfflineBackupJson(): Promise<void> {
  const [businesses, leads, payouts] = await Promise.all([
    getOfflineBusinesses(),
    getOfflineLeads(),
    getOfflinePayouts(),
  ]);

  const backupData = {
    exportDate: new Date().toISOString(),
    system: 'Dalelak Offline Representative Backup',
    businessesCount: businesses.length,
    leadsCount: leads.length,
    payoutsCount: payouts.length,
    businesses,
    leads,
    payouts,
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dalelak-offline-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -----------------------------------------------------------------------------
// AUTOMATIC EVENT LISTENERS INITIALIZATION
// -----------------------------------------------------------------------------

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    dispatchOfflineStateChangeEvent();
    // Auto-trigger sync after 2.5 seconds to let connection stabilize
    setTimeout(() => {
      syncAllPendingOfflineData().catch(() => {});
    }, 2500);
  });

  window.addEventListener('offline', () => {
    dispatchOfflineStateChangeEvent();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      syncAllPendingOfflineData().catch(() => {});
    }
  });
}
