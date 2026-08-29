import React, { useState, useEffect } from 'react';
import { Business } from './types';
import { PublicShowcase } from './components/PublicShowcase';
import { ThemeProvider } from './contexts/ThemeContext';

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
  const [loading, setLoading] = useState<boolean>(businesses.length === 0);

  // Fetch real-time businesses from Supabase REST API with automated polling and BroadcastChannel
  useEffect(() => {
    let isMounted = true;

    async function loadBusinesses() {
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
          if (Array.isArray(raw) && raw.length > 0 && isMounted) {
            const mapped: Business[] = raw.map((r: any) => {
              let metaVideos: string[] = [];
              let metaGoogleSyncStatus = r.google_sync_status;
              let metaGoogleMapsUrl = r.google_maps_url;
              let metaGooglePlaceId = r.google_place_id;

              if (typeof r.notes === 'string' && r.notes.trim().startsWith('{')) {
                try {
                  const parsed = JSON.parse(r.notes.trim());
                  if (parsed && typeof parsed === 'object') {
                    if (Array.isArray(parsed.videos)) metaVideos = parsed.videos;
                    if (parsed.googleSyncStatus) metaGoogleSyncStatus = parsed.googleSyncStatus;
                    if (parsed.googleMapsUrl) metaGoogleMapsUrl = parsed.googleMapsUrl;
                    if (parsed.googlePlaceId) metaGooglePlaceId = parsed.googlePlaceId;
                  }
                } catch {}
              }

              const rawPhotos = Array.isArray(r.photos) ? r.photos : [];
              const rawVideos = Array.isArray(r.videos) && r.videos.length > 0 ? r.videos : metaVideos;

              return {
                id: r.id,
                nameAr: r.name_ar || r.nameAr || '',
                nameEn: r.name_en || r.nameEn || '',
                category: r.category || 'خدمات عامة',
                governorate: r.governorate || 'الجيزة',
                city: r.city || '',
                street: r.street || '',
                landmark: r.landmark || '',
                lat: typeof r.lat === 'number' ? r.lat : 30.0444,
                lng: typeof r.lng === 'number' ? r.lng : 31.2357,
                phone: r.phone || '',
                secondaryPhone: r.secondary_phone || r.secondaryPhone || '',
                whatsapp: r.whatsapp || '',
                workingHours: r.working_hours || r.workingHours || '',
                description: r.description || '',
                photos: rawPhotos,
                videos: rawVideos,
                logo: r.logo || '',
                googlePlaceId: metaGooglePlaceId || r.google_place_id || r.googlePlaceId || '',
                googleMapsUrl: metaGoogleMapsUrl || r.google_maps_url || r.googleMapsUrl || '',
                verificationStatus: r.verification_status || r.verificationStatus || 'verified',
                googleSyncStatus: metaGoogleSyncStatus || r.google_sync_status || r.googleSyncStatus || 'synced',
                createdAt: r.created_at || r.createdAt || new Date().toISOString(),
                createdDate: r.created_at || r.createdDate || new Date().toISOString(),
                amountPaid: typeof r.amount_paid === 'number' ? r.amount_paid : 0,
                ownerName: r.owner_name || r.ownerName || '',
                ownerPhone: r.owner_phone || r.ownerPhone || '',
                repId: r.rep_id || r.repId || '',
                repName: r.rep_name || r.repName || '',
                packageId: r.package_id || r.packageId || 'pkg_basic',
                packageName: r.package_name || r.packageName || 'باقة التوثيق الأساسي',
                packagePrice: typeof r.package_price === 'number' ? r.package_price : 250,
                paymentStatus: r.payment_status || r.paymentStatus || 'fully_paid',
                invoiceNumber: r.invoice_number || r.invoiceNumber || '',
                invoiceDate: r.invoice_date || r.invoiceDate || '',
              };
            });

            setBusinesses(mapped);
            try {
              localStorage.setItem('dalelak_directory_cache', JSON.stringify(mapped));
            } catch {}
          }
        }
      } catch (e) {
        console.warn('Failed to fetch from live Supabase DB:', e);
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) setLoading(false);
      }
    }

    loadBusinesses();

    // ⚡ Real-Time Cross-Tab Instant Sync Listener
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
          loadBusinesses();
        }
      };
    }

    // Background Poll Interval every 7 seconds
    const intervalId = setInterval(loadBusinesses, 7000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      if (syncChannel) syncChannel.close();
    };
  }, []);

  // Parse referral code if present in URL
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref') || urlParams.get('rep') || '';

  return (
    <ThemeProvider>
      <PublicShowcase businesses={businesses} referralCode={refCode} />
    </ThemeProvider>
  );
}
