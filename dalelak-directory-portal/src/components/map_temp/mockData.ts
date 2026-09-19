import { Business } from '../../types';

/**
 * 🧪 Helper to generate complete Mock Business objects
 * strictly adhering to the `Business` type definition without missing fields.
 */
const createMockBiz = (data: Partial<Business> & {
  id: string;
  nameAr: string;
  category: string;
  street: string;
  lat: number;
  lng: number;
}): Business => ({
  nameEn: '',
  governorate: 'الجيزة',
  city: 'حدائق الأهرام',
  phone: '01012345678',
  workingHours: '10:00 ص - 10:00 م',
  description: 'نشاط تجاري تجريبي في حدائق الأهرام',
  ownerName: 'تاجر تجريبي',
  ownerPhone: '01000000000',
  photos: [],
  repId: 'rep_sandbox',
  repName: 'مندوب تجريبي',
  packageId: 'pkg_vip_annual',
  packageName: 'الباقة الذهبية VIP',
  packagePrice: 1500,
  amountPaid: 1500,
  paymentStatus: 'fully_paid',
  verificationStatus: 'verified',
  invoiceNumber: `INV-${data.id.toUpperCase()}`,
  invoiceDate: '2026-01-01',
  createdDate: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...data,
});

/**
 * 🧪 Mock Businesses for Map Temp Sandbox
 * Completely isolated from Supabase and external APIs.
 * Covers all major categories and zones in Hadayek Al-Ahram with precise coordinates.
 */
export const MOCK_SANDBOX_BUSINESSES: Business[] = [
  createMockBiz({
    id: 'mock_biz_1',
    nameAr: 'مطعم كرم الشام - البوابة الأولى',
    nameEn: 'Karam El Sham - Gate 1',
    category: 'مطاعم ومأكولات',
    street: 'شارع الجيش، بجوار البوابة الأولى (خوفو)',
    landmark: 'بوابة خوفو',
    phone: '01012345678',
    secondaryPhone: '01112345678',
    workingHours: '10:00 ص - 02:00 ص',
    description: 'أشهى المأكولات السورية والشاورما والوجبات السريعة في قلب حدائق الأهرام.',
    lat: 29.9782,
    lng: 31.1115,
    packagePrice: 1500,
    amountPaid: 1500,
    coverPhoto: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
    ],
  }),
  createMockBiz({
    id: 'mock_biz_2',
    nameAr: 'صيدليات العزبي - منطقة ج',
    nameEn: 'El Ezaby Pharmacy - Zone G',
    category: 'صيدليات وأدوية',
    street: 'شارع الثروة المعدنية، عمارة 142 ج',
    landmark: 'بجوار مدرسة الأهرام التجريبية',
    phone: '19600',
    secondaryPhone: '01099887766',
    workingHours: 'خدمة 24 ساعة يومياً',
    description: 'صيدلية متكاملة، توصيل سريع لجميع بوابات ومناطق حدائق الأهرام.',
    lat: 29.9752,
    lng: 31.1085,
    packageId: 'pkg_business_annual',
    packageName: 'باقة الأعمال المعتمدة',
    packagePrice: 900,
    amountPaid: 900,
    coverPhoto: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=80',
    ],
  }),
  createMockBiz({
    id: 'mock_biz_3',
    nameAr: 'سوبر ماركت خير زمان - منطقة أ',
    nameEn: 'Kheir Zaman Supermarket - Zone A',
    category: 'سوبر ماركت / هايبر وبقالة',
    street: 'شارع الضغط العالي، عمارة 85 أ',
    landmark: 'أمام مول الأندلس',
    phone: '16007',
    workingHours: '08:00 ص - 01:00 ص',
    description: 'أفضل العروض والأسعار المخفضة على كافة المواد الغذائية والمنتجات المنزلية.',
    lat: 29.9855,
    lng: 31.1030,
    coverPhoto: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80',
    ],
  }),
  createMockBiz({
    id: 'mock_biz_4',
    nameAr: 'مقهى وكافيه سيلانترو - البوابة الرابعة',
    nameEn: 'Cilantro Cafe - Gate 4',
    category: 'كافيهات ومقاهي',
    street: 'شارع الثروة المعدنية الرئيسي، مدخل بوابة مينا',
    landmark: 'البوابة الرابعة',
    phone: '01234567890',
    workingHours: '07:00 ص - 02:00 ص',
    description: 'مكان هادئ راقي لتناول ألذ أنواع القهوة المختصة والحلويات ومشروبات الصيف.',
    lat: 29.9535,
    lng: 31.0895,
    packageId: 'pkg_business_annual',
    packageName: 'باقة الأعمال المعتمدة',
    packagePrice: 900,
    amountPaid: 900,
    coverPhoto: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    ],
  }),
  createMockBiz({
    id: 'mock_biz_5',
    nameAr: 'مركز النخبة الطبي للعيادات التخصصية - منطقة هـ',
    nameEn: 'Elite Medical Clinics - Zone H',
    category: 'أطباء وعيادات',
    street: 'شارع الجيش، تقاطع منطقة هـ مع د',
    landmark: 'برج الأطباء',
    phone: '01000998877',
    secondaryPhone: '0233445566',
    workingHours: '10:00 ص - 10:00 م',
    description: 'مجموعة عيادات متكاملة تضم نخبة من أساتذة واستشاريي كليات الطب في كافة التخصصات.',
    lat: 29.9675,
    lng: 31.1065,
    coverPhoto: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    ],
  }),
  createMockBiz({
    id: 'mock_biz_6',
    nameAr: 'مركز الأهرام لصيانة وإصلاح السيارات - منطقة ن',
    nameEn: 'Al-Ahram Auto Service - Zone N',
    category: 'سيارات وصيانة',
    street: 'الحد الفاصل لمنطقة ن، قرب البوابة الرابعة',
    landmark: 'بنزينة إمارت مصر',
    phone: '01122334455',
    workingHours: '09:00 ص - 11:00 م',
    description: 'فحص كمبيوتر، ميكانيكا، كهرباء، وعفشة مع ضمان معتمد على جميع قطع الغيار.',
    lat: 29.9575,
    lng: 31.0945,
    packageId: 'pkg_business_annual',
    packageName: 'باقة الأعمال المعتمدة',
    packagePrice: 900,
    amountPaid: 900,
    coverPhoto: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
    ],
  }),
];

export const MOCK_PRESETS = [
  { id: 'full', name: 'جميع الأنشطة التجريبية (6 أنشطة)', data: MOCK_SANDBOX_BUSINESSES },
  { id: 'empty', name: 'خريطة نقية (بدون أنشطة)', data: [] },
  { id: 'single_g', name: 'نشاط وحيد في منطقة ج (صيدلية العزبي)', data: [MOCK_SANDBOX_BUSINESSES[1]] },
  { id: 'single_n', name: 'نشاط وحيد في منطقة ن (مركز صيانة السيارات)', data: [MOCK_SANDBOX_BUSINESSES[5]] },
];
