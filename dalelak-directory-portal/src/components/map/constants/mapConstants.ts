declare global {
  interface Window {
    L: any;
  }
}

export type MapTileLayerType = 'dalelak-clean' | 'google-streets' | 'google-hybrid';

export function escapeHtml(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Egyptian governorate approximate coordinates map
export const GOVERNORATE_COORDS: Record<string, { lat: number; lng: number }> = {
  'القاهرة': { lat: 30.0444, lng: 31.2357 },
  'الجيزة': { lat: 30.0131, lng: 31.2089 },
  'الإسكندرية': { lat: 31.2001, lng: 29.9187 },
  'الدقهلية (المنصورة)': { lat: 31.0409, lng: 31.3785 },
  'الغربية (طنطا)': { lat: 30.7865, lng: 31.0004 },
  'الشرقية (الزقازيق)': { lat: 30.5877, lng: 31.5020 },
  'القليوبية (بنها)': { lat: 30.4660, lng: 31.1852 },
  'المنوفية (شبين الكوم)': { lat: 30.5503, lng: 31.0106 },
  'البحيرة (دمنهور)': { lat: 31.0361, lng: 30.4682 },
  'كفر الشيخ': { lat: 31.1107, lng: 30.9388 },
  'دمياط': { lat: 31.4175, lng: 31.8144 },
  'بورسعيد': { lat: 31.2653, lng: 32.3019 },
  'الإسماعيلية': { lat: 30.5965, lng: 32.2715 },
  'السويس': { lat: 29.9668, lng: 32.5498 },
  'الفيوم': { lat: 29.3084, lng: 30.8428 },
  'بني سويف': { lat: 29.0661, lng: 31.0994 },
  'المنيا': { lat: 28.0871, lng: 30.7618 },
  'أسيوط': { lat: 27.1783, lng: 31.1859 },
  'سوهاج': { lat: 26.5569, lng: 31.6948 },
  'قنا': { lat: 26.1551, lng: 32.7160 },
  'الأقصر': { lat: 25.6872, lng: 32.6396 },
  'أسوان': { lat: 24.0889, lng: 32.8998 },
  'مطروح': { lat: 31.3543, lng: 27.2373 },
  'البحر الأحمر (الغردقة)': { lat: 27.2579, lng: 33.8116 },
  'جنوب سيناء (شرم الشيخ)': { lat: 27.9158, lng: 34.3299 },
};

export const MAP_QUICK_CATEGORIES = [
  { id: 'all', name: 'الكل (جميع الأنشطة)', icon: '🌟' },
  { id: 'صيدلية', name: 'صيدليات ورعاية طبية', icon: '💊' },
  { id: 'سوبرماركت', name: 'سوبرماركت وبقالة', icon: '🛒' },
  { id: 'مطعم', name: 'مطاعم ومأكولات', icon: '🍔' },
  { id: 'كافيه', name: 'كافيهات ومقاهي', icon: '☕' },
  { id: 'مخبز', name: 'مخابز وأفران', icon: '🥐' },
  { id: 'صيانة', name: 'صيانة ومنزلية وحرفيين', icon: '🔧' },
  { id: 'طبي', name: 'عيادات ومراكز طبية', icon: '🩺' },
  { id: 'تعليم', name: 'مدارس وحضانات', icon: '📚' },
  { id: 'سيارات', name: 'خدمات سيارات', icon: '🚗' },
];
