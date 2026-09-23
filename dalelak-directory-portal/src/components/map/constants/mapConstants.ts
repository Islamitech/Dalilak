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
  'حدائق الأهرام': { lat: 29.9683, lng: 31.1002 },
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

export interface EgyptLocationItem {
  id: string;
  name: string;
  gov: string;
  lat: number;
  lng: number;
  isMain?: boolean;
}

export const EGYPT_POPULAR_LOCATIONS: EgyptLocationItem[] = [
  { id: 'hadayek-alahram', name: 'حدائق الأهرام', gov: 'الجيزة', lat: 29.9683, lng: 31.1002, isMain: true },
  { id: 'october-6', name: 'مدينة 6 أكتوبر', gov: 'الجيزة', lat: 29.9722, lng: 30.9458 },
  { id: 'sheikh-zayed', name: 'الشيخ زايد', gov: 'الجيزة', lat: 30.0469, lng: 30.9858 },
  { id: 'hadayek-october', name: 'حدائق أكتوبر', gov: 'الجيزة', lat: 29.9192, lng: 31.0664 },
  { id: 'dokki-mohandessin', name: 'المهندسين والدقي', gov: 'الجيزة', lat: 30.0488, lng: 31.2052 },
  { id: 'tagamoa-5', name: 'التجمع الخامس (القاهرة الجديدة)', gov: 'القاهرة', lat: 30.0055, lng: 31.4289 },
  { id: 'maadi', name: 'المعادي', gov: 'القاهرة', lat: 29.9599, lng: 31.2625 },
  { id: 'nasr-city', name: 'مدينة نصر', gov: 'القاهرة', lat: 30.0561, lng: 31.3418 },
  { id: 'heliopolis', name: 'مصر الجديدة', gov: 'القاهرة', lat: 30.0911, lng: 31.3235 },
  { id: 'downtown-cairo', name: 'وسط البلد', gov: 'القاهرة', lat: 30.0444, lng: 31.2357 },
  { id: 'alexandria', name: 'الإسكندرية', gov: 'الإسكندرية', lat: 31.2001, lng: 29.9187 },
  { id: 'mansoura', name: 'المنصورة', gov: 'الدقهلية', lat: 31.0409, lng: 31.3785 },
  { id: 'tanta', name: 'طنطا', gov: 'الغربية', lat: 30.7865, lng: 31.0004 },
];

