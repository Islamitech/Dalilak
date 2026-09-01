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
  return [];
}

export async function removeOfflinePayout(id: string): Promise<void> {
  try {
    const db = await openOfflineDb();
    if (db.objectStoreNames.contains(STORES.PAYOUTS)) {
      const tx = db.transaction(STORES.PAYOUTS, 'readwrite');
      tx.objectStore(STORES.PAYOUTS).delete(id);
    }
  } catch {}
}

/**
 * Automatically purges any offline records that are already confirmed to exist in the cloud database.
 * This ensures that already-uploaded activities are NEVER re-uploaded or kept in pending status.
 */
export async function purgeConfirmedOfflineRecords(): Promise<void> {
  try {
    if (!isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) return;

    const db = await openOfflineDb();

    // 1. Purge legacy/unsupported payouts store
    if (db.objectStoreNames.contains(STORES.PAYOUTS)) {
      const txP = db.transaction(STORES.PAYOUTS, 'readwrite');
      txP.objectStore(STORES.PAYOUTS).clear();
    }

    // 2. Check offline businesses against cloud
    const txB = db.transaction(STORES.BUSINESSES, 'readonly');
    const storeB = txB.objectStore(STORES.BUSINESSES);
    const requestB = storeB.getAll();

    const offlineBusinesses: Business[] = await new Promise((resolve) => {
      requestB.onsuccess = () => resolve(requestB.result || []);
      requestB.onerror = () => resolve([]);
    });

    if (offlineBusinesses.length > 0) {
      const ids = offlineBusinesses.map((b) => b.id);
      const { data: cloudRecords, error } = await supabase
        .from('businesses')
        .select('id')
        .in('id', ids);

      if (!error && Array.isArray(cloudRecords) && cloudRecords.length > 0) {
        const confirmedIds = new Set(cloudRecords.map((r: any) => r.id));
        for (const id of confirmedIds) {
          await removeOfflineBusiness(id);
        }
      }
    }

    // 3. Check offline leads against cloud
    const txL = db.transaction(STORES.LEADS, 'readonly');
    const storeL = txL.objectStore(STORES.LEADS);
    const requestL = storeL.getAll();

    const offlineLeads: InterestedLead[] = await new Promise((resolve) => {
      requestL.onsuccess = () => resolve(requestL.result || []);
      requestL.onerror = () => resolve([]);
    });

    if (offlineLeads.length > 0) {
      const leadIds = offlineLeads.map((l) => l.id);
      const { data: cloudLeads, error: leadError } = await supabase
        .from('leads')
        .select('id')
        .in('id', leadIds);

      if (!leadError && Array.isArray(cloudLeads) && cloudLeads.length > 0) {
        const confirmedLeadIds = new Set(cloudLeads.map((r: any) => r.id));
        for (const id of confirmedLeadIds) {
          await removeOfflineLead(id);
        }
      }
    }
  } catch (err) {
    console.warn('Purge confirmed offline records warning:', err);
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

  const [businesses, leads] = await Promise.all([
    getOfflineBusinesses(effectiveUid),
    getOfflineLeads(effectiveUid),
  ]);

  const lastSyncTime = typeof localStorage !== 'undefined' ? localStorage.getItem('dalelak_last_sync_timestamp') : null;

  return {
    isOnline,
    isSyncing: isCurrentlySyncing,
    pendingBusinessesCount: businesses.length,
    pendingLeadsCount: leads.length,
    pendingPayoutsCount: 0,
    totalPendingCount: businesses.length + leads.length,
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
    // 🛡️ Pre-sync optimization: Purge already-confirmed items to save mobile data and prevent phantom re-uploads
    await purgeConfirmedOfflineRecords();

    const [businesses, leads] = await Promise.all([
      getOfflineBusinesses(effectiveUid),
      getOfflineLeads(effectiveUid),
    ]);

    const totalItems = businesses.length + leads.length;
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
        // Quick verification: Check if already stored in cloud to avoid duplicate uploads
        try {
          const { data: existingCheck } = await supabase
            .from('businesses')
            .select('id')
            .eq('id', biz.id)
            .maybeSingle();

          if (existingCheck && existingCheck.id) {
            // Already confirmed in cloud: remove from local offline store immediately
            await removeOfflineBusiness(biz.id);
            syncedCount++;
            continue;
          }
        } catch {}

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

    // 2. Sync Offline Leads (Reliable Supabase Upsert)
    for (const lead of leads) {
      currentIndex++;
      if (onProgress) onProgress(currentIndex, totalItems, `مزامنة عميل مهتم: ${lead.clientName}`);

      try {
        const cleanPhone = lead.phone || '01000000000';
        const leadPayload = {
          id: lead.id,
          name_ar: lead.businessName ? lead.businessName.trim() : `عميل مهتم: ${lead.clientName}`,
          owner_name: lead.clientName,
          owner_phone: cleanPhone,
          phone: cleanPhone,
          secondary_phone: lead.secondaryPhone || null,
          category: lead.businessCategory || 'نشاط تجاري / خدمي آخر',
          governorate: lead.governorate || 'الجيزة',
          city: lead.city || 'حدائق الأهرام',
          package_id: 'pkg_interested_lead',
          package_name: 'عميل مهتم بالمتابعة',
          package_price: 0,
          amount_paid: 0,
          payment_status: 'unpaid',
          verification_status: 'lead',
          rep_id: lead.repId || 'rep_1',
          rep_name: lead.repName || 'مندوب معتمد',
          invoice_number: `LEAD-${lead.id.replace(/\D/g, '').slice(-6) || Date.now()}`,
          invoice_date: (lead.createdDate || new Date().toISOString()).split('T')[0],
          notes: JSON.stringify({
            isInterestedLead: true,
            clientName: lead.clientName,
            businessName: lead.businessName,
            businessCategory: lead.businessCategory,
            interestLevel: lead.interestLevel,
            notes: lead.notes,
            followUpDate: lead.followUpDate,
            lastContactedDate: lead.lastContactedDate,
            status: lead.status,
          }),
        };

        let leadSaved = false;

        try {
          const res = await supabaseRestFetch('businesses', {
            method: 'POST',
            headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
            body: JSON.stringify(leadPayload),
          });
          if (res.ok) {
            leadSaved = true;
          } else {
            const { error } = await supabase.from('businesses').upsert([leadPayload]);
            if (!error) leadSaved = true;
          }
        } catch {}

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
  const [businesses, leads] = await Promise.all([
    getOfflineBusinesses(),
    getOfflineLeads(),
  ]);

  const backupData = {
    exportDate: new Date().toISOString(),
    system: 'Dalelak Offline Representative Backup',
    businessesCount: businesses.length,
    leadsCount: leads.length,
    businesses,
    leads,
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
// AUTOMATIC EVENT LISTENERS INITIALIZATION (WITH THROTTLING & DATA PROTECTION)
// -----------------------------------------------------------------------------

let lastOnlineSyncTime = 0;

if (typeof window !== 'undefined') {
  // Purge any stale confirmed records on app startup
  setTimeout(() => {
    purgeConfirmedOfflineRecords().catch(() => {});
  }, 1000);

  window.addEventListener('online', () => {
    dispatchOfflineStateChangeEvent();
    const now = Date.now();
    // Only auto-trigger if at least 2 minutes passed since last attempt to protect mobile data
    if (now - lastOnlineSyncTime > 2 * 60 * 1000) {
      lastOnlineSyncTime = now;
      setTimeout(() => {
        syncAllPendingOfflineData().catch(() => {});
      }, 3000);
    }
  });

  window.addEventListener('offline', () => {
    dispatchOfflineStateChangeEvent();
  });
}
