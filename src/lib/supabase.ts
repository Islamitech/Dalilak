import { createClient } from '@supabase/supabase-js';
import { PlaceItem } from '@/app/components/store';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdqpbajymacpdccorjcj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function mapPlaceToDb(place: PlaceItem): any {
  return {
    id: place.id,
    business_name: place.businessName || 'منشأة ميدانية',
    name_en: place.nameEn || '',
    status: place.status || (place.visitResult === 'rejected' ? 'مرفوض' : 'موثق ومكتمل'),
    category: place.category || place.mainCategory || 'عام',
    sub_category: place.subCategory || place.category || 'عام',
    custom_category: place.customCategory || '',
    latitude: place.latitude ? String(place.latitude) : '',
    longitude: place.longitude ? String(place.longitude) : '',
    dms: place.dms || '',
    city: place.city || 'القاهرة',
    neighborhood: place.neighborhood || '',
    street: place.street || '',
    landmark: place.landmark || '',
    phone: place.phone || '',
    whatsapp: (place as any).whatsapp || place.phone || '',
    google_email: (place as any).googleEmail || '',
    work_from: (place as any).workFrom || '09:00 ص',
    work_to: (place as any).workTo || '10:00 م',
    holidays: (place as any).holidays || [],
    facade_image: place.facadeImage || place.exteriorPhoto || '',
    internal_image: place.internalImage || '',
    documenter_id: place.documenterId || null,
    documenter_name: place.documenterName || 'أحمد عزالدين',
    notes: place.notes || place.adminRequest || '',
    date: place.date || new Date().toLocaleDateString('ar-EG'),
    time: place.time || new Date().toLocaleTimeString('ar-EG'),
    total_amount: Number(place.totalAmount ?? 300),
    paid_amount: Number(place.paidAmount ?? 150),
    remaining_amount: Number(place.remainingAmount ?? 150),
    payment_status: place.paymentStatus || 'دفع جزء من المبلغ (عربون)',
    created_at: place.createdAt || new Date().toISOString()
  };
}

export function mapDbToPlace(p: any): PlaceItem {
  return {
    id: p.id,
    businessName: p.business_name || '',
    nameEn: p.name_en || '',
    status: p.status || 'موثق ومكتمل',
    category: p.category || '',
    mainCategory: p.category || '',
    subCategory: p.sub_category || '',
    customCategory: p.custom_category || '',
    latitude: p.latitude ? Number(p.latitude) : undefined,
    longitude: p.longitude ? Number(p.longitude) : undefined,
    city: p.city || '',
    neighborhood: p.neighborhood || '',
    street: p.street || '',
    landmark: p.landmark || '',
    phone: p.phone || '',
    whatsapp: p.whatsapp || '',
    googleEmail: p.google_email || '',
    facadeImage: p.facade_image || '',
    exteriorPhoto: p.facade_image || '',
    internalImage: p.internal_image || '',
    additionalImages: [],
    documenterName: p.documenter_name || 'أحمد عزالدين',
    documenterId: p.documenter_id || 'emp-1',
    notes: p.notes || '',
    adminRequest: p.notes || '',
    date: p.date || '',
    time: p.time || '',
    dms: p.dms || '',
    totalAmount: p.total_amount ?? 300,
    paidAmount: p.paid_amount ?? 300,
    remainingAmount: p.remaining_amount ?? 0,
    paymentStatus: p.payment_status || 'مدفوعة بالكامل',
    createdAt: p.created_at,
    visitResult: p.status === 'مرفوض' ? 'rejected' : 'accepted',
  };
}

export async function savePlaceToCloud(place: PlaceItem): Promise<{ success: boolean; error?: string }> {
  try {
    const dbRecord = mapPlaceToDb(place);
    const { error } = await supabase.from('places').upsert(dbRecord, { onConflict: 'id' });
    if (error) {
      console.error('Supabase places upsert error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('savePlaceToCloud error:', err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function fetchPlacesFromCloud(): Promise<PlaceItem[]> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Supabase fetchPlaces error:', error);
      return [];
    }
    return (data || []).map(mapDbToPlace);
  } catch (err) {
    console.error('fetchPlacesFromCloud exception:', err);
    return [];
  }
}
