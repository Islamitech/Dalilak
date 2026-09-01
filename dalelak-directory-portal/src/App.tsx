import React, { useState, useEffect } from 'react';
import { Business } from './types';
import { PublicShowcase } from './components/PublicShowcase';
import { ThemeProvider } from './contexts/ThemeContext';
import { supabase } from './services/storage';

const SUPABASE_REST_URL = 'https://xdqpbajymacpdccorjcj.supabase.co/rest/v1/businesses?select=*&order=created_at.desc';
const SUPABASE_ANON_KEY = 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x';

export default function App() {
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    try {
      const cached = localStorage.getItem('dalelak_directory_cache') || localStorage.getItem('dalelak_cached_businesses');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    const isPortalInitialized = localStorage.getItem('dalelak_portal_initialized') === 'true';
    const hasCachedData = Boolean(localStorage.getItem('dalelak_directory_cache') || localStorage.getItem('dalelak_cached_businesses'));
    // If directory cache exists or portal was visited before, render instantly in 0ms without skeleton flicker!
    return !isPortalInitialized && !hasCachedData;
  });
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  function mapRawToBusiness(r: any): Business {
    let metaVideos: string[] = [];
    let metaGoogleSyncStatus = r.google_sync_status;
    let metaRepLocationUrl = r.rep_location_url;
    let metaGoogleMapsUrl = r.google_maps_url;
    let metaGooglePlaceId = r.google_place_id;
    let metaIsFeeExempt = r.is_fee_exempt ?? r.isFeeExempt;
    let metaFeeExemptionReason = r.fee_exemption_reason || r.feeExemptionReason;

    if (typeof r.notes === 'string' && r.notes.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(r.notes.trim());
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.videos)) metaVideos = parsed.videos;
          if (parsed.googleSyncStatus) metaGoogleSyncStatus = parsed.googleSyncStatus;
          if (parsed.repLocationUrl) metaRepLocationUrl = parsed.repLocationUrl;
          if (parsed.googleMapsUrl) metaGoogleMapsUrl = parsed.googleMapsUrl;
          if (parsed.googlePlaceId) metaGooglePlaceId = parsed.googlePlaceId;
          if (parsed.isFeeExempt !== undefined && metaIsFeeExempt === undefined) metaIsFeeExempt = parsed.isFeeExempt;
          if (parsed.feeExemptionReason && !metaFeeExemptionReason) metaFeeExemptionReason = parsed.feeExemptionReason;
        }
      } catch {}
    }

    const isFeeExempt = Boolean(metaIsFeeExempt || r.package_price === 0 || r.packagePrice === 0 || r.package_id === 'pkg_exempt');
    const rawPhotos = Array.isArray(r.photos) ? r.photos : [];
    const rawVideos = Array.isArray(r.videos) && r.videos.length > 0 ? r.videos : metaVideos;

    const lat = typeof r.lat === 'number' ? r.lat : 30.0444;
    const lng = typeof r.lng === 'number' ? r.lng : 31.2357;

    // 1. Rep unverified field location
    const repLocationUrl = metaRepLocationUrl || r.rep_location_url || r.repLocationUrl || (lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : undefined);

    // 2. Verified official Google Maps URL (Only valid HTTP URL, strictly not synthetic search query)
    let rawGoogleMapsUrl = metaGoogleMapsUrl || r.google_maps_url || r.googleMapsUrl || '';
    if (typeof rawGoogleMapsUrl === 'string') rawGoogleMapsUrl = rawGoogleMapsUrl.trim();
    else rawGoogleMapsUrl = '';
    const cleanGoogleMapsUrl = (rawGoogleMapsUrl && rawGoogleMapsUrl.startsWith('http') && !rawGoogleMapsUrl.includes('search/?api=1&query='))
      ? rawGoogleMapsUrl
      : undefined;

    return {
      id: r.id,
      nameAr: r.name_ar || r.nameAr || '',
      nameEn: r.name_en || r.nameEn || '',
      category: r.category || 'خدمات عامة',
      governorate: r.governorate || 'الجيزة',
      city: r.city || '',
      street: r.street || '',
      landmark: r.landmark || '',
      lat,
      lng,
      phone: r.phone || '',
      secondaryPhone: r.secondary_phone || r.secondaryPhone || '',
      whatsapp: r.whatsapp || '',
      workingHours: r.working_hours || r.workingHours || '',
      description: r.description || '',
      photos: rawPhotos,
      videos: rawVideos,
      logo: r.logo || '',
      repLocationUrl,
      googlePlaceId: metaGooglePlaceId || r.google_place_id || r.googlePlaceId || '',
      googleMapsUrl: cleanGoogleMapsUrl,
      verificationStatus: r.verification_status || r.verificationStatus || 'pending',
      googleSyncStatus: metaGoogleSyncStatus || r.google_sync_status || r.googleSyncStatus || 'not_synced',
      createdAt: r.created_at || r.createdAt || new Date().toISOString(),
      createdDate: r.created_at || r.createdDate || new Date().toISOString(),
      amountPaid: isFeeExempt ? 0 : (typeof r.amount_paid === 'number' ? r.amount_paid : 0),
      ownerName: r.owner_name || r.ownerName || '',
      ownerPhone: r.owner_phone || r.ownerPhone || '',
      repId: r.rep_id || r.repId || '',
      repName: r.rep_name || r.repName || '',
      packageId: isFeeExempt ? 'pkg_exempt' : (r.package_id || r.packageId || 'pkg_basic'),
      packageName: isFeeExempt ? 'نشاط رائج بالمنطقة (إدراج مجاني بدون رسوم)' : (r.package_name || r.packageName || 'باقة التوثيق الأساسي'),
      packagePrice: isFeeExempt ? 0 : (typeof r.package_price === 'number' ? r.package_price : 250),
      paymentStatus: isFeeExempt ? 'fully_paid' : (r.payment_status || r.paymentStatus || 'fully_paid'),
      invoiceNumber: r.invoice_number || r.invoiceNumber || '',
      invoiceDate: r.invoice_date || r.invoiceDate || '',
      isFeeExempt,
      feeExemptionReason: metaFeeExemptionReason,
    };
  }

  // Trigger brief sync toast
  function triggerSyncToast(msg: string) {
    setSyncToastMessage(msg);
    setTimeout(() => {
      setSyncToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  }

  // Fetch real-time businesses from Supabase REST API + WebSockets Live Channel
  useEffect(() => {
    let isMounted = true;

    async function loadBusinesses(force: boolean = false) {
      if (!force && typeof document !== 'undefined' && document.hidden) return;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      try {
        const res = await fetch(SUPABASE_REST_URL, {
          signal: controller.signal,
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const raw = await res.json();
          if (Array.isArray(raw) && isMounted && raw.length > 0) {
            const mapped: Business[] = raw.map(mapRawToBusiness);

            setBusinesses(() => {
              const updated = mapped.sort(
                (a, b) => new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()
              );

              try {
                localStorage.setItem('dalelak_directory_cache', JSON.stringify(updated));
                localStorage.setItem('dalelak_directory_last_sync', new Date().toISOString());
              } catch {}

              return updated;
            });
          }
        }
      } catch (e) {
        console.warn('Failed to fetch from live Supabase DB:', e);
      } finally {
        clearTimeout(timeoutId);
        try {
          localStorage.setItem('dalelak_portal_initialized', 'true');
        } catch {}
        if (isMounted) setLoading(false);
      }
    }

    // 1. Initial Load
    loadBusinesses(true);

    // 2. ⚡ SUPABASE REALTIME WEBSOCKET SUBSCRIPTION
    const realtimeChannel = supabase
      .channel('dalelak-public-directory-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'businesses' },
        (payload: any) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT') {
            const newBiz = mapRawToBusiness(payload.new);
            setBusinesses((prev) => {
              const filtered = prev.filter((b) => b.id !== newBiz.id);
              const updated = [newBiz, ...filtered];
              try {
                localStorage.setItem('dalelak_directory_cache', JSON.stringify(updated));
              } catch {}
              return updated;
            });
            triggerSyncToast('تم إضافة نشاط جديد واعتماده للتو 🔔');
          } else if (payload.eventType === 'UPDATE') {
            const updatedBiz = mapRawToBusiness(payload.new);
            setBusinesses((prev) => {
              const updated = prev.map((b) => (b.id === updatedBiz.id ? updatedBiz : b));
              try {
                localStorage.setItem('dalelak_directory_cache', JSON.stringify(updated));
              } catch {}
              return updated;
            });
            triggerSyncToast('تم تحديث بيانات النشاط مباشرة ⚡');
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setBusinesses((prev) => {
              const updated = prev.filter((b) => b.id !== payload.old.id);
              try {
                localStorage.setItem('dalelak_directory_cache', JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        }
      )
      .subscribe();

    // 3. Real-Time Cross-Tab Instant Sync Listener via BroadcastChannel
    const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
    if (syncChannel) {
      syncChannel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_DATA') {
          if (event.data.newBusiness) {
            setBusinesses((prev) => {
              const filtered = prev.filter((b) => b.id !== event.data.newBusiness.id);
              const updated = [event.data.newBusiness, ...filtered];
              try {
                localStorage.setItem('dalelak_directory_cache', JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
          loadBusinesses(true);
        }
      };
    }

    // 4. Storage Event Listener for Instant Cross-Tab Sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dalelak_directory_cache' || e.key === 'dalelak_cached_businesses') {
        try {
          if (e.newValue) {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setBusinesses(parsed);
            }
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 5. Tab Visibility Change Listener: catch up when user opens tab
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        loadBusinesses(true);
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // 6. Lightweight Background Delta Poll Interval every 60 seconds
    const intervalId = setInterval(() => loadBusinesses(true), 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      supabase.removeChannel(realtimeChannel);
      if (syncChannel) syncChannel.close();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, []);

  // Parse direct business link, preview mode & referral code if present in URL
  const urlParams = new URLSearchParams(window.location.search);
  const initialBizId = urlParams.get('biz') || urlParams.get('b') || urlParams.get('preview') || urlParams.get('id') || '';
  const isPreviewMode = urlParams.has('preview');
  const refCode = urlParams.get('ref') || urlParams.get('rep') || '';

  return (
    <ThemeProvider>
      {syncToastMessage && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600/90 text-white border border-emerald-400/40 backdrop-blur-xl text-xs font-black shadow-2xl animate-fade-in transition-all"
          style={{ direction: 'rtl' }}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
          <span>{syncToastMessage}</span>
        </div>
      )}
      <PublicShowcase
        businesses={businesses}
        initialBizId={initialBizId}
        isPreviewMode={isPreviewMode}
        referralCode={refCode}
        loading={loading}
      />
    </ThemeProvider>
  );
}
