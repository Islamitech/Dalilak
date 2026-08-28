import React, { useState, useEffect } from 'react';
import { Business } from './types';
import { PublicShowcase } from './components/PublicShowcase';
import { ThemeProvider } from './contexts/ThemeContext';

const SUPABASE_REST_URL = 'https://xdqpbajymacpdccorjcj.supabase.co/rest/v1/businesses?select=*&order=created_at.desc';
const SUPABASE_ANON_KEY = 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x';

export default function App() {
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    try {
      const cached = localStorage.getItem('dalelak_directory_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState<boolean>(businesses.length === 0);

  // Fetch real-time businesses from Supabase REST API
  useEffect(() => {
    let isMounted = true;
    async function loadBusinesses() {
      try {
        const res = await fetch(SUPABASE_REST_URL, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });
        if (res.ok) {
          const raw = await res.json();
          if (Array.isArray(raw) && raw.length > 0 && isMounted) {
            const mapped: Business[] = raw.map((r: any) => ({
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
              photos: Array.isArray(r.photos) ? r.photos : [],
              logo: r.logo || '',
              googlePlaceId: r.google_place_id || r.googlePlaceId || '',
              googleMapsUrl: r.google_maps_url || r.googleMapsUrl || '',
              verificationStatus: r.verification_status || r.verificationStatus || 'verified',
              googleSyncStatus: r.google_sync_status || r.googleSyncStatus || 'synced',
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
            }));

            setBusinesses(mapped);
            try {
              localStorage.setItem('dalelak_directory_cache', JSON.stringify(mapped));
            } catch {}
          }
        }
      } catch (e) {
        console.warn('Failed to fetch from live Supabase DB:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBusinesses();
    return () => {
      isMounted = false;
    };
  }, []);

  // Parse referral code if present in URL
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref') || urlParams.get('rep') || '';

  if (loading && businesses.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-200">
        <div className="w-14 h-14 rounded-2xl border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="text-xs font-black text-amber-400">جاري تحميل دليل الأنشطة والخدمات في مصر...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <PublicShowcase businesses={businesses} referralCode={refCode} />
    </ThemeProvider>
  );
}
