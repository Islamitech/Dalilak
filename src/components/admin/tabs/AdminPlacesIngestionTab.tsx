import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldAlert,
  Search,
  CheckCircle2,
  MapPin,
  Star,
  Phone,
  Clock,
  Layers,
  CheckSquare,
  Square,
  Coins,
  ShieldCheck,
  Wrench,
  Store,
  Loader2,
  Filter,
  Sliders,
  Hash,
  Stethoscope,
  Scissors,
  Dumbbell,
  Briefcase,
  Utensils,
  Coffee,
  Info,
  Globe,
  RefreshCw,
  BarChart3,
  Building2,
  Check,
} from 'lucide-react';
import { Business, User } from '../../../types';
import { isSuperAdmin } from '../../../utils/permissions';
import { getApiAuthHeaders } from '../../../utils/storage';
import { saveBusinessToDb } from '../../../services/db';

interface CandidatePlace {
  id: string;
  displayName: string;
  category: string;
  primaryType?: string;
  primaryTypeDisplayName?: string;
  formattedAddress: string;
  lat?: number;
  lng?: number;
  phone?: string;
  rating?: number;
  userRatingCount?: number;
  workingHours?: string;
  googleMapsUri?: string;
  coverPhoto?: string;
  photosCount: number;
  isDuplicate: boolean;
  isQualityApproved: boolean;
  qualityBadgeText: string;
  isCraft: boolean;
}

interface BatchSearchMetrics {
  totalFound: number;
  duplicatesCount: number;
  qualifiedCount: number;
  estimatedCost: string;
}

interface CategoryThreshold {
  label: string;
  keyword: string;
  type: string;
  icon: string;
  defaultMinRating: number;
  defaultMinReviews: number;
  explanation: string;
}

interface AdminPlacesIngestionTabProps {
  currentUser: User;
  businesses: Business[];
  onAddBusiness?: (
    biz: Business,
    options?: {
      skipNavigation?: boolean;
      skipNotification?: boolean;
      skipInvoiceModal?: boolean;
    }
  ) => Promise<void> | void;
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const GOOGLE_API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_PLACES_API_KEY ||
  'AIzaSyD3eyrkvcPrYKgGFqUf2p3OrzKgMep_7c4';

// 🏛️ مصفوفة نطاقات وتقسيمات حدائق الأهرام الرسمية (Atlas Hadayek Al-Ahram Matrix)
export interface HadayekSector {
  id: string;
  label: string;
  query: string;
  subZone: string;
  gate?: string;
  lat: number;
  lng: number;
  southLat: number;
  westLng: number;
  northLat: number;
  eastLng: number;
}

export const HADAYEK_SECTORS: HadayekSector[] = [
  {
    id: 'zone_a',
    label: 'المنطقة أ (بوابة خفرع / شارع الثروة المعدنية)',
    query: 'المنطقة أ حدائق الأهرام',
    subZone: 'المنطقة أ',
    gate: 'البوابة الأولى (خفرع)',
    lat: 29.9870,
    lng: 31.1240,
    southLat: 29.9780,
    westLng: 31.1150,
    northLat: 29.9920,
    eastLng: 31.1300,
  },
  {
    id: 'zone_b',
    label: 'المنطقة ب (بوابة 1 / خفرع)',
    query: 'المنطقة ب حدائق الأهرام',
    subZone: 'المنطقة ب',
    gate: 'البوابة الأولى (خفرع)',
    lat: 29.9855,
    lng: 31.1215,
    southLat: 29.9770,
    westLng: 31.1130,
    northLat: 29.9910,
    eastLng: 31.1280,
  },
  {
    id: 'zone_c',
    label: 'المنطقة ج (بوابة 2 / خوفو والشارع التجاري)',
    query: 'المنطقة ج حدائق الأهرام',
    subZone: 'المنطقة ج',
    gate: 'البوابة الثانية (خوفو)',
    lat: 29.9840,
    lng: 31.1175,
    southLat: 29.9760,
    westLng: 31.1090,
    northLat: 29.9900,
    eastLng: 31.1240,
  },
  {
    id: 'zone_d',
    label: 'المنطقة د (بين البوابتين 2 و 3)',
    query: 'المنطقة د حدائق الأهرام',
    subZone: 'المنطقة د',
    gate: 'البوابة الثانية والثالثة',
    lat: 29.9815,
    lng: 31.1130,
    southLat: 29.9740,
    westLng: 31.1050,
    northLat: 29.9880,
    eastLng: 31.1200,
  },
  {
    id: 'zone_e',
    label: 'المنطقة هـ',
    query: 'المنطقة هـ حدائق الأهرام',
    subZone: 'المنطقة هـ',
    lat: 29.9790,
    lng: 31.1100,
    southLat: 29.9710,
    westLng: 31.1020,
    northLat: 29.9850,
    eastLng: 31.1170,
  },
  {
    id: 'zone_f',
    label: 'المنطقة و',
    query: 'المنطقة و حدائق الأهرام',
    subZone: 'المنطقة و',
    lat: 29.9775,
    lng: 31.1070,
    southLat: 29.9700,
    westLng: 31.1000,
    northLat: 29.9840,
    eastLng: 31.1140,
  },
  {
    id: 'zone_g',
    label: 'المنطقة ز (بوابة 3 / منقرع)',
    query: 'المنطقة ز حدائق الأهرام',
    subZone: 'المنطقة ز',
    gate: 'البوابة الثالثة (منقرع)',
    lat: 29.9760,
    lng: 31.1140,
    southLat: 29.9680,
    westLng: 31.1060,
    northLat: 29.9830,
    eastLng: 31.1210,
  },
  {
    id: 'zone_h',
    label: 'المنطقة ح',
    query: 'المنطقة ح حدائق الأهرام',
    subZone: 'المنطقة ح',
    lat: 29.9745,
    lng: 31.1170,
    southLat: 29.9670,
    westLng: 31.1090,
    northLat: 29.9810,
    eastLng: 31.1240,
  },
  {
    id: 'zone_i',
    label: 'المنطقة ط (بوابة 4 / مينا)',
    query: 'المنطقة ط حدائق الأهرام',
    subZone: 'المنطقة ط',
    gate: 'البوابة الرابعة (مينا)',
    lat: 29.9720,
    lng: 31.1190,
    southLat: 29.9640,
    westLng: 31.1110,
    northLat: 29.9790,
    eastLng: 31.1260,
  },
  {
    id: 'zone_k',
    label: 'المنطقة ك',
    query: 'المنطقة ك حدائق الأهرام',
    subZone: 'المنطقة ك',
    lat: 29.9700,
    lng: 31.1155,
    southLat: 29.9620,
    westLng: 31.1070,
    northLat: 29.9770,
    eastLng: 31.1220,
  },
  {
    id: 'zone_l',
    label: 'المنطقة ل',
    query: 'المنطقة ل حدائق الأهرام',
    subZone: 'المنطقة ل',
    lat: 29.9680,
    lng: 31.1120,
    southLat: 29.9600,
    westLng: 31.1040,
    northLat: 29.9750,
    eastLng: 31.1190,
  },
  {
    id: 'zone_m',
    label: 'المنطقة م',
    query: 'المنطقة م حدائق الأهرام',
    subZone: 'المنطقة م',
    lat: 29.9660,
    lng: 31.1145,
    southLat: 29.9580,
    westLng: 31.1060,
    northLat: 29.9730,
    eastLng: 31.1210,
  },
  {
    id: 'zone_n',
    label: 'المنطقة ن',
    query: 'المنطقة ن حدائق الأهرام',
    subZone: 'المنطقة ن',
    lat: 29.9640,
    lng: 31.1175,
    southLat: 29.9560,
    westLng: 31.1090,
    northLat: 29.9710,
    eastLng: 31.1240,
  },
  {
    id: 'zone_s',
    label: 'المنطقة س',
    query: 'المنطقة س حدائق الأهرام',
    subZone: 'المنطقة س',
    lat: 29.9620,
    lng: 31.1150,
    southLat: 29.9540,
    westLng: 31.1070,
    northLat: 29.9690,
    eastLng: 31.1220,
  },
  {
    id: 'zone_sad',
    label: 'المنطقة ص',
    query: 'المنطقة ص حدائق الأهرام',
    subZone: 'المنطقة ص',
    lat: 29.9600,
    lng: 31.1125,
    southLat: 29.9520,
    westLng: 31.1040,
    northLat: 29.9670,
    eastLng: 31.1200,
  },
  {
    id: 'zone_ain',
    label: 'المنطقة ع',
    query: 'المنطقة ع حدائق الأهرام',
    subZone: 'المنطقة ع',
    lat: 29.9580,
    lng: 31.1100,
    southLat: 29.9500,
    westLng: 31.1020,
    northLat: 29.9650,
    eastLng: 31.1170,
  },
  {
    id: 'zone_r',
    label: 'المنطقة ر',
    query: 'المنطقة ر حدائق الأهرام',
    subZone: 'المنطقة ر',
    lat: 29.9560,
    lng: 31.1080,
    southLat: 29.9480,
    westLng: 31.1000,
    northLat: 29.9630,
    eastLng: 31.1150,
  },
  {
    id: 'street_sarwa',
    label: 'شارع الثروة المعدنية (القطاع التجاري الرئيسي)',
    query: 'شارع الثروة المعدنية حدائق الأهرام',
    subZone: 'شارع الثروة المعدنية',
    gate: 'البوابة الأولى',
    lat: 29.9850,
    lng: 31.1220,
    southLat: 29.9750,
    westLng: 31.1150,
    northLat: 29.9900,
    eastLng: 31.1270,
  },
  {
    id: 'street_geish',
    label: 'شارع الجيش (محور البوابات الرئيسي)',
    query: 'شارع الجيش حدائق الأهرام',
    subZone: 'شارع الجيش',
    lat: 29.9820,
    lng: 31.1160,
    southLat: 29.9650,
    westLng: 31.1100,
    northLat: 29.9880,
    eastLng: 31.1250,
  },
  {
    id: 'street_dght',
    label: 'شارع الضغط العالي',
    query: 'شارع الضغط العالي حدائق الأهرام',
    subZone: 'شارع الضغط العالي',
    lat: 29.9710,
    lng: 31.1130,
    southLat: 29.9620,
    westLng: 31.1060,
    northLat: 29.9780,
    eastLng: 31.1200,
  },
  {
    id: 'hadayek_all',
    label: 'حدائق الأهرام - كامل المدينة (مسح أطلس الشامل)',
    query: 'حدائق الأهرام الجيزة',
    subZone: 'حدائق الأهرام',
    lat: 29.9753,
    lng: 31.1120,
    southLat: 29.9500,
    westLng: 31.1000,
    northLat: 29.9920,
    eastLng: 31.1300,
  },
];

// 🌐 نطاقات التوسع المصرية الأخرى (محفوظة بكود المنظومة للتوسع المستقبلي)
export const FUTURE_EXPANSION_HUBS = [
  { label: 'الشيخ زايد و 6 أكتوبر', query: 'الشيخ زايد', gov: 'الجيزة', city: 'الشيخ زايد', lat: 30.0461, lng: 30.9856 },
  { label: 'التجمع الخامس والقاهرة الجديدة', query: 'التجمع الخامس', gov: 'القاهرة', city: 'القاهرة الجديدة', lat: 30.0131, lng: 31.4289 },
  { label: 'المعادي والمقطم', query: 'المعادي', gov: 'القاهرة', city: 'المعادي', lat: 29.9602, lng: 31.2569 },
  { label: 'المهندسين والدقي', query: 'المهندسين', gov: 'الجيزة', city: 'الدقي والمهندسين', lat: 30.0526, lng: 31.2058 },
  { label: 'مدينة نصر ومصر الجديدة', query: 'مدينة نصر', gov: 'القاهرة', city: 'مدينة نصر', lat: 30.0566, lng: 31.3301 },
  { label: 'وسط البلد والزمالك', query: 'وسط البلد القاهرة', gov: 'القاهرة', city: 'وسط البلد', lat: 30.0444, lng: 31.2357 },
  { label: 'الهرم وفيصل', query: 'شارع فيصل والهرم', gov: 'الجيزة', city: 'الهرم وفيصل', lat: 30.0016, lng: 31.1788 },
  { label: 'الإسكندرية (سموحة ومحطة الرمل)', query: 'سموحة الإسكندرية', gov: 'الإسكندرية', city: 'الإسكندرية', lat: 31.2156, lng: 29.9553 },
];

// للتوافق العكسي
const EGYPTIAN_HUBS = FUTURE_EXPANSION_HUBS;

// 🏛️ مصفوفة التقييمات الطبيعية المتوازنة لكل فئة في السوق المصري
const CATEGORY_PRESETS: CategoryThreshold[] = [
  {
    label: '🌐 كافة الأنشطة والمحلات (سحب شامل بنمط أطلس الحدائق)',
    keyword: 'أنشطة ومحلات وخدمات',
    type: 'all',
    icon: 'globe',
    defaultMinRating: 0.0,
    defaultMinReviews: 0,
    explanation: 'سحب واستيعاب شامل لكافة المحلات والأنشطة والعيادات والخدمات في القطاع المحدد بدون حصر لفئة معينة لتغطية أطلس الكاملة',
  },
  {
    label: 'مطاعم ومأكولات ومشويات',
    keyword: 'مطاعم',
    type: 'restaurants',
    icon: 'utensils',
    defaultMinRating: 4.2,
    defaultMinReviews: 60,
    explanation: 'إقبال استهلاكي كثيف ومراجعات واسعة',
  },
  {
    label: 'كافيهات ومقاهي ومشروبات',
    keyword: 'كافيهات',
    type: 'cafes',
    icon: 'coffee',
    defaultMinRating: 4.2,
    defaultMinReviews: 50,
    explanation: 'إقبال شبابي ومراجعات مستمرة',
  },
  {
    label: 'ورش وميكانيكا وصيانة سيارات',
    keyword: 'ورش صيانة وميكانيكي سيارات',
    type: 'craft',
    icon: 'wrench',
    defaultMinRating: 4.3,
    defaultMinReviews: 15,
    explanation: 'كفاءة حرفية نادرة بمراجعات تخصصية مركزة (15 مقيم كافية)',
  },
  {
    label: 'سباكة وكهرباء وصيانة منزلية',
    keyword: 'سباك وكهربائي وصيانة منزلية',
    type: 'craft',
    icon: 'wrench',
    defaultMinRating: 4.3,
    defaultMinReviews: 12,
    explanation: 'خدمات حرفية ميدانية بمراجعات نوعية موثوقة',
  },
  {
    label: 'عيادات ومراكز طبية وصيدليات',
    keyword: 'عيادات ومراكز طبية وصيدليات',
    type: 'medical',
    icon: 'stethoscope',
    defaultMinRating: 4.4,
    defaultMinReviews: 20,
    explanation: 'معيار طبي دقيق لعيادات متخصصة (20 مقيم تمثل سمعة ممتازة)',
  },
  {
    label: 'سوبرماركت ومحلات تجارة وتجزئة',
    keyword: 'سوبرماركت ومحلات تجارية',
    type: 'retail',
    icon: 'store',
    defaultMinRating: 4.1,
    defaultMinReviews: 40,
    explanation: 'مبيعات يومية سريعة وتقييمات استهلاكية',
  },
  {
    label: 'صالونات ومراكز تجميل وعناية',
    keyword: 'صالون حلاقة ومراكز تجميل',
    type: 'beauty',
    icon: 'scissors',
    defaultMinRating: 4.3,
    defaultMinReviews: 25,
    explanation: 'خدمات عناية شخصية تعتمد على الثقة المباشرة',
  },
  {
    label: 'أندية وجيم وصالات رياضية',
    keyword: 'جيم وصالات رياضية',
    type: 'gym',
    icon: 'dumbbell',
    defaultMinRating: 4.3,
    defaultMinReviews: 35,
    explanation: 'اشتراكات دورية وتقييمات للمعدات والمدربين',
  },
  {
    label: 'خدمات مهنية ومكاتب وعقارات',
    keyword: 'مكاتب وشركات خدمات مهنية وعقارات',
    type: 'corporate',
    icon: 'briefcase',
    defaultMinRating: 4.4,
    defaultMinReviews: 10,
    explanation: 'استشارات مهنية متخصصة بمراجعات عملاء رسمية',
  },
  {
    label: 'محلات ملابس وأزياء وأحذية',
    keyword: 'محلات ملابس وأزياء',
    type: 'fashion',
    icon: 'shirt',
    defaultMinRating: 4.2,
    defaultMinReviews: 20,
    explanation: 'متاجر أزياء وملابس وأحذية وإكسسوارات بمراجعات شرائية متوازنة',
  },
  {
    label: 'هواتف وصيانة موبايل وإلكترونيات',
    keyword: 'محلات هواتف وصيانة موبايل وإلكترونيات',
    type: 'electronics',
    icon: 'smartphone',
    defaultMinRating: 4.2,
    defaultMinReviews: 20,
    explanation: 'أجهزة ذكية وإلكترونيات وصيانة بمراجعات تقنية وموثوقية',
  },
  {
    label: 'معارض أثاث وموبيليا وديكور منزلي',
    keyword: 'معارض أثاث وموبيليا وديكور',
    type: 'furniture',
    icon: 'sofa',
    defaultMinRating: 4.2,
    defaultMinReviews: 15,
    explanation: 'معارض موبيليا ومفروشات وديكور وتشطيبات ومستلزمات منزلية',
  },
  {
    label: 'مدارس وحضانات وسناتر تعليمية',
    keyword: 'مدارس وحضانات وسناتر تعليمية وكورسات',
    type: 'education',
    icon: 'graduation-cap',
    defaultMinRating: 4.3,
    defaultMinReviews: 15,
    explanation: 'مؤسسات تعليمية وتدريبية وأكاديميات كورسات ولغات',
  },
  {
    label: 'مكتبات وأدوات مدرسية وخدمات طباعة',
    keyword: 'مكتبات وأدوات مدرسية وتصوير مستندات',
    type: 'stationery',
    icon: 'book-open',
    defaultMinRating: 4.2,
    defaultMinReviews: 15,
    explanation: 'خدمات طلابية وقرطاسية وتصوير مستندات وطباعة',
  },
  {
    label: 'فنادق وقاعات مناسبات وشركات سياحة',
    keyword: 'فنادق وقاعات مناسبات وأفراح وشركات سياحة',
    type: 'hospitality',
    icon: 'hotel',
    defaultMinRating: 4.2,
    defaultMinReviews: 25,
    explanation: 'خدمات ضيافة وحجوزات فندقية وقاعات احتفالات وتنظيم رحلات',
  },
  {
    label: 'جميع الأنشطة الرائجة المتنوعة',
    keyword: 'أنشطة وأماكن رائجة',
    type: 'general',
    icon: 'layers',
    defaultMinRating: 4.2,
    defaultMinReviews: 30,
    explanation: 'معيار وسطي متوازن لكافة القطاعات',
  },
];

/**
 * 🗺️ محرك الكشف الجغرافي الذكي للمحافظات المصرية:
 * يفحص العنوان الفعلي والنطاق المكتوب يدوياً لتحديد المحافظة بدقة مطلقة
 * ويمنع إجبار المحافظة على الجيزة افتراضياً
 */
export const detectEgyptianGovernorate = (address?: string, customText?: string): string => {
  const fullText = `${address || ''} ${customText || ''}`.toLowerCase();

  // 1. القاهرة الكبرى ومناطقها
  if (
    fullText.includes('القاهرة') || fullText.includes('cairo') ||
    fullText.includes('المعادي') || fullText.includes('زهراء المعادي') ||
    fullText.includes('مدينة نصر') || fullText.includes('مصر الجديدة') ||
    fullText.includes('التجمع') || fullText.includes('القاهرة الجديدة') ||
    fullText.includes('الشروق') || fullText.includes('بدر') ||
    fullText.includes('العبور') || fullText.includes('عين شمس') ||
    fullText.includes('شبرا') || fullText.includes('حلوان') ||
    fullText.includes('المقطم') || fullText.includes('الزمالك') ||
    fullText.includes('وسط البلد') || fullText.includes('طرة') ||
    fullText.includes('البساتين') || fullText.includes('الوايلي') ||
    fullText.includes('المنيل') || fullText.includes('جاردن سيتي') ||
    fullText.includes('الأزبكية') || fullText.includes('باب الشعرية')
  ) {
    return 'القاهرة';
  }

  // 2. الجيزة ومناطقها
  if (
    fullText.includes('الجيزة') || fullText.includes('giza') ||
    fullText.includes('أكتوبر') || fullText.includes('october') ||
    fullText.includes('الشيخ زايد') || fullText.includes('zayed') ||
    fullText.includes('الهرم') || fullText.includes('فيصل') ||
    fullText.includes('الدقي') || fullText.includes('المهندسين') ||
    fullText.includes('العجوزة') || fullText.includes('حدائق الأهرام') ||
    fullText.includes('الرماية') || fullText.includes('العمرانية') ||
    fullText.includes('بولاق الدكرور') || fullText.includes('الوراق') ||
    fullText.includes('إمبابة') || fullText.includes('الحوامدية') ||
    fullText.includes('البدرشين') || fullText.includes('أوسيم')
  ) {
    return 'الجيزة';
  }

  // 3. الإسكندرية
  if (
    fullText.includes('الإسكندرية') || fullText.includes('اسكندرية') || fullText.includes('alexandria') ||
    fullText.includes('سموحة') || fullText.includes('سيدي جابر') ||
    fullText.includes('ميامي') || fullText.includes('المنتزه') ||
    fullText.includes('محرم بك') || fullText.includes('العجمي') ||
    fullText.includes('الساحل الشمالي') || fullText.includes('برج العرب')
  ) {
    return 'الإسكندرية';
  }

  // 4. باقي المحافظات المصرية
  const govMap: Record<string, string[]> = {
    'القليوبية': ['القليوبية', 'بنها', 'شبرا الخيمة', 'قليوب', 'طوخ', 'الخانكة', 'قها'],
    'الشرقية': ['الشرقية', 'الزقازيق', 'العاشر من رمضان', 'بلبيس', 'فاقوس', 'أبو حماد', 'منيا القمح', 'العاشر'],
    'الغربية': ['الغربية', 'طنطا', 'المحلة الكبرى', 'المحلة', 'كفر الزيات', 'زفتى', 'سمنود'],
    'الدقهلية': ['الدقهلية', 'المنصورة', 'طلخا', 'ميت غمر', 'دكرنس', 'بلقاس', 'شربين'],
    'المنوفية': ['المنوفية', 'شبين الكوم', 'قويسنا', 'أشمون', 'منوف', 'السادات', 'بركة السبع'],
    'البحيرة': ['البحيرة', 'دمنهور', 'كفر الدوار', 'إيتاي البارود', 'كوم حمادة', 'رشيد'],
    'دمياط': ['دمياط', 'رأس البر', 'دمياط الجديدة'],
    'بورسعيد': ['بورسعيد', 'بورفؤاد'],
    'الإسماعيلية': ['الإسماعيلية', 'فايد', 'القنطرة'],
    'السويس': ['السويس', 'العين السخنة'],
    'البحر الأحمر': ['الغردقة', 'الجونة', 'سفاجا', 'مرسى علم', 'القصير'],
    'جنوب سيناء': ['شرم الشيخ', 'دهب', 'نويبع', 'طابا', 'طور سيناء'],
    'بني سويف': ['بني سويف', 'الواسطى', 'ببا', 'الفشن'],
    'الفيوم': ['الفيوم', 'إبشواي', 'سنورس', 'طامية', 'يوسف الصديق'],
    'المنيا': ['المنيا', 'ملوي', 'مغاغة', 'بني مزار', 'سمالوط', 'أبو قرقاص'],
    'أسيوط': ['أسيوط', 'ديروط', 'منفلوط', 'أبنوب', 'القوصية'],
    'سوهاج': ['سوهاج', 'طهطا', 'جرجا', 'أخميم', 'المراغة'],
    'قنا': ['قنا', 'نجع حمادي', 'قوص', 'دشنا', 'أبو تشت'],
    'الأقصر': ['الأقصر', 'إسنا', 'أرمنت', 'طيبة'],
    'أسوان': ['أسوان', 'كوم أمبو', 'إدفو', 'نصر النوبة'],
    'مطروح': ['مطروح', 'مرسى مطروح', 'العلمين', 'الضبعة', 'سيوة'],
    'كفر الشيخ': ['كفر الشيخ', 'دسوق', 'فوه', 'بلطيم', 'سيدي سالم'],
  };

  for (const [gov, keywords] of Object.entries(govMap)) {
    if (keywords.some((k) => fullText.includes(k.toLowerCase()))) {
      return gov;
    }
  }

  return 'القاهرة';
};

export const AdminPlacesIngestionTab: React.FC<AdminPlacesIngestionTabProps> = ({
  currentUser,
  businesses,
  onAddBusiness,
  onShowNotification,
}) => {
  // 🛡️ 1. الحظر السيادي الصارم (Super Admin Exclusive Security Guard)
  if (!isSuperAdmin(currentUser)) {
    return (
      <div className="p-10 text-center bg-rose-500/10 border border-rose-500/20 rounded-3xl max-w-xl mx-auto my-12">
        <ShieldAlert className="w-14 h-14 text-rose-500 mx-auto mb-4 animate-bounce" />
        <h3 className="text-lg font-black text-rose-500 mb-2">حظر أمني: بوابة الاستيراد محصورة بالسوبر أدمن حصراً</h3>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          هذه الوظيفة سيادية ومخصصة للحساب الأعلى لإدارة المنظومة (403 Forbidden). تم تسجيل محاولة الوصول في سجل أمان المنصة.
        </p>
      </div>
    );
  }

  // 🏛️ State Management: Focused on Hadayek Al-Ahram Atlas Architecture
  const [selectedSectorIndex, setSelectedSectorIndex] = useState<number>(0); // المنطقة أ افتراضياً
  const [showExpansionHubs, setShowExpansionHubs] = useState<boolean>(false); // إخفاء المحافظات الأخرى افتراضياً
  const [selectedExpansionHubIndex, setSelectedExpansionHubIndex] = useState<number>(0);
  const [isExpansionHubActive, setIsExpansionHubActive] = useState<boolean>(false);
  const [isCustomHub, setIsCustomHub] = useState<boolean>(false);
  const [customHubName, setCustomHubName] = useState<string>('');
  
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number>(0); // كافة الأنشطة (أطلس الحدائق) افتراضياً
  const [searchQuery, setSearchQuery] = useState<string>('المنطقة أ حدائق الأهرام');
  
  // 🔢 نمط السحب: مسح شامل للقطاع (بدون حد أقصى) أو تحديد عدد معين
  const [isExhaustiveAtlasMode, setIsExhaustiveAtlasMode] = useState<boolean>(true);
  const [pullCount, setPullCount] = useState<number>(20);

  // ⭐ معايير الجودة الطبيعية
  const [minRating, setMinRating] = useState<number>(0.0);
  const [minReviews, setMinReviews] = useState<number>(0);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanChunkStatus, setScanChunkStatus] = useState<{
    stepText: string;
    chunkNumber: number;
    totalFoundSoFar: number;
    newFoundSoFar: number;
    duplicatesSoFar: number;
  } | null>(null);

  const [candidatePlaces, setCandidatePlaces] = useState<CandidatePlace[]>([]);
  const [metrics, setMetrics] = useState<BatchSearchMetrics | null>(null);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<Set<string>>(new Set());
  const [filterOnlyQualified, setFilterOnlyQualified] = useState<boolean>(true);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestProgress, setIngestProgress] = useState<{ current: number; total: number } | null>(null);
  const [ingestionMessage, setIngestionMessage] = useState<string | null>(null);

  // Current active Sector / Hub resolution
  const currentSector: HadayekSector = HADAYEK_SECTORS[selectedSectorIndex] || HADAYEK_SECTORS[0];
  const currentCat = CATEGORY_PRESETS[selectedCategoryIndex];

  // Auto-compose search query upon Sector or Category change
  const handleSectorChange = (idx: number) => {
    setSelectedSectorIndex(idx);
    setIsExpansionHubActive(false);
    setIsCustomHub(false);
    const sector = HADAYEK_SECTORS[idx];
    const cat = CATEGORY_PRESETS[selectedCategoryIndex];
    if (sector) {
      if (selectedCategoryIndex === 0) {
        setSearchQuery(sector.query);
      } else if (cat) {
        setSearchQuery(`${cat.keyword} في ${sector.subZone} حدائق الأهرام`);
      }
    }
  };

  const handleExpansionHubChange = (idx: number) => {
    setSelectedExpansionHubIndex(idx);
    setIsExpansionHubActive(true);
    setIsCustomHub(false);
    const h = FUTURE_EXPANSION_HUBS[idx];
    const cat = CATEGORY_PRESETS[selectedCategoryIndex];
    if (h && cat) {
      setSearchQuery(`${cat.keyword} في ${h.query}`);
    }
  };

  const handleCategoryChange = (catIdx: number) => {
    setSelectedCategoryIndex(catIdx);
    const cat = CATEGORY_PRESETS[catIdx];
    if (isExpansionHubActive) {
      const h = FUTURE_EXPANSION_HUBS[selectedExpansionHubIndex];
      if (cat && h) setSearchQuery(`${cat.keyword} في ${h.query}`);
    } else if (isCustomHub) {
      if (cat && customHubName) setSearchQuery(`${cat.keyword} في ${customHubName}`);
    } else {
      if (catIdx === 0) {
        setSearchQuery(currentSector.query);
      } else if (cat) {
        setSearchQuery(`${cat.keyword} في ${currentSector.subZone} حدائق الأهرام`);
      }
    }
    // تحديث التقييمات الطبيعية
    if (cat) {
      setMinRating(cat.defaultMinRating);
      setMinReviews(cat.defaultMinReviews);
    }
  };

  // 🛡️ Helper: Check if place matches craft profile
  const isCraftActivity = (primaryType?: string, typeDisplayName?: string, name?: string): boolean => {
    const text = `${primaryType || ''} ${typeDisplayName || ''} ${name || ''}`.toLowerCase();
    const craftKeywords = [
      'car_repair', 'auto_repair', 'mechanic', 'plumber', 'electrician', 'locksmith',
      'carpenter', 'handyman', 'workshop', 'maintenance', 'repair',
      'ميكانيك', 'ورشة', 'سباك', 'كهربائي', 'صيانة', 'حداد', 'نجار', 'عفشجي', 'دوكو', 'سمكري', 'تكييف'
    ];
    return craftKeywords.some((kw) => text.includes(kw));
  };

  // 🎯 تدقيق منشآت القطاع المسجلة مسبقاً في قاعدة البيانات
  const existingSectorBusinessesCount = useMemo(() => {
    const sub = (currentSector?.subZone || '').toLowerCase();
    return businesses.filter((b) => {
      const text = `${b.street || ''} ${b.landmark || ''} ${b.description || ''} ${b.nameAr || ''}`.toLowerCase();
      return text.includes(sub) || (sub === 'المنطقة أ' && text.includes('منطقة أ'));
    }).length;
  }, [businesses, currentSector]);

  // ⚡ DIRECT RESILIENT ATLAS CHUNK ENGINE
  const executeAtlasChunkSearch = async (
    targetSector: HadayekSector,
    catIndex: number,
    isExhaustive: boolean,
    limitCount: number,
    thresholdRating: number,
    thresholdReviews: number
  ): Promise<{ places: CandidatePlace[]; metrics: BatchSearchMetrics }> => {
    // 1. تحديد استعلامات المسح للقطاع
    let queriesToRun: string[] = [];
    if (catIndex === 0) {
      // 🌐 وضع أطلس الشامل: مسح متعدد المحاور لاستيعاب كافة المنشآت بدون تحديد نشاط
      queriesToRun = [
        targetSector.query,
        `محلات وسوبرماركت وأسواق في ${targetSector.subZone} حدائق الأهرام`,
        `مطاعم وكافيهات ومخابز في ${targetSector.subZone} حدائق الأهرام`,
        `صيدليات وعيادات ومراكز طبية في ${targetSector.subZone} حدائق الأهرام`,
        `خدمات وصيانة وورش وحرفيين في ${targetSector.subZone} حدائق الأهرام`,
      ];
    } else {
      queriesToRun = [searchQuery.trim()];
    }

    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.primaryType',
      'places.primaryTypeDisplayName',
      'places.formattedAddress',
      'places.location',
      'places.rating',
      'places.userRatingCount',
      'places.internationalPhoneNumber',
      'places.nationalPhoneNumber',
      'places.regularOpeningHours',
      'places.photos',
      'places.googleMapsUri',
      'nextPageToken',
    ].join(',');

    // قاعدة بيانات المنشآت المكررة
    const existingIds = new Set<string>();
    businesses.forEach((b) => {
      if (b.googlePlaceId) existingIds.add(b.googlePlaceId);
      if (b.googleMapsUrl) {
        const m = b.googleMapsUrl.match(/place_id:([A-Za-z0-9_-]+)/);
        if (m) existingIds.add(m[1]);
      }
    });
    const existingNames = new Set(businesses.map((b) => (b.nameAr || b.name || '').trim().toLowerCase()));

    const seenIdsInScan = new Set<string>();
    const seenNamesInScan = new Set<string>();

    const accumulatedPlaces: CandidatePlace[] = [];
    let duplicatesCount = 0;
    let qualifiedCount = 0;
    let totalRawFound = 0;
    let totalApiCalls = 0;
    let chunkCounter = 0;

    for (let qIdx = 0; qIdx < queriesToRun.length; qIdx++) {
      const q = queriesToRun[qIdx];
      let nextPageToken: string | undefined = undefined;
      let pageNum = 1;
      const maxPages = isExhaustive ? 3 : Math.ceil(limitCount / 20);

      while (pageNum <= maxPages) {
        chunkCounter++;
        setScanChunkStatus({
          stepText: `مسح المحور (${qIdx + 1}/${queriesToRun.length}): جلب الجزء ${chunkCounter}...`,
          chunkNumber: chunkCounter,
          totalFoundSoFar: totalRawFound,
          newFoundSoFar: accumulatedPlaces.length,
          duplicatesSoFar: duplicatesCount,
        });

        const searchBody: Record<string, unknown> = {
          textQuery: q,
          languageCode: 'ar',
          maxResultCount: 20,
        };

        if (nextPageToken) {
          searchBody.pageToken = nextPageToken;
        }

        // 📍 قصر النطاق الجغرافي المستطيل على القطاع المحدد
        if (!isCustomHub && !isExpansionHubActive) {
          searchBody.locationRestriction = {
            rectangle: {
              low: { latitude: targetSector.southLat, longitude: targetSector.westLng },
              high: { latitude: targetSector.northLat, longitude: targetSector.eastLng },
            },
          };
        } else if (isExpansionHubActive) {
          const h = FUTURE_EXPANSION_HUBS[selectedExpansionHubIndex];
          if (h?.lat && h?.lng) {
            searchBody.locationBias = {
              circle: {
                center: { latitude: h.lat, longitude: h.lng },
                radius: 6000.0,
              },
            };
          }
        }

        try {
          const googleRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': GOOGLE_API_KEY,
              'X-Goog-FieldMask': fieldMask,
            },
            body: JSON.stringify(searchBody),
          });

          totalApiCalls++;

          if (!googleRes.ok) {
            console.warn(`Places API Chunk call returned ${googleRes.status}`);
            break;
          }

          const googleData = await googleRes.json();
          const rawPlaces = Array.isArray(googleData.places) ? googleData.places : [];
          totalRawFound += rawPlaces.length;

          for (const p of rawPlaces) {
            const placeId = p.id || '';
            const name = (p.displayName?.text || '').trim();
            const lowerName = name.toLowerCase();

            // فحص التكرار مع قاعدة البيانات ومع ما تم سحبه في هذا المسح
            const isDupInDb = existingIds.has(placeId) || (name.length > 3 && existingNames.has(lowerName));
            const isDupInScan = seenIdsInScan.has(placeId) || (name.length > 3 && seenNamesInScan.has(lowerName));

            if (isDupInScan) {
              continue; // تخطي التكرار الداخلي بين المحاور
            }

            seenIdsInScan.add(placeId);
            if (name.length > 3) seenNamesInScan.add(lowerName);

            const isDuplicate = isDupInDb;
            if (isDuplicate) {
              duplicatesCount++;
            }

            const primaryType = p.primaryType || '';
            const primaryTypeDisplayName = p.primaryTypeDisplayName?.text || '';
            const rating = typeof p.rating === 'number' ? p.rating : 0;
            const userRatingCount = typeof p.userRatingCount === 'number' ? p.userRatingCount : 0;
            const phone = p.nationalPhoneNumber || p.internationalPhoneNumber || '';
            const formattedAddress = p.formattedAddress || '';
            const lat = p.location?.latitude;
            const lng = p.location?.longitude;
            const googleMapsUri = p.googleMapsUri || (placeId ? `https://www.google.com/maps/place/?q=place_id:${placeId}` : '');

            // في وضع أطلس الشامل: كافة الأنشطة الموثقة مؤهلة ومقبولة
            const isCraft = isCraftActivity(primaryType, primaryTypeDisplayName, name) || currentCat.type === 'craft';
            const isQualityApproved = catIndex === 0 ? true : (rating >= thresholdRating && userRatingCount >= thresholdReviews);

            let qualityBadgeText = '';
            if (catIndex === 0) {
              qualityBadgeText = `منشأة موثقة في أطلس ${targetSector.subZone} ⭐ ${rating > 0 ? rating : 'جديد'}`;
              if (!isDuplicate) qualifiedCount++;
            } else if (isQualityApproved) {
              qualityBadgeText = `${isCraft ? 'حرفي معتمد' : 'رائج معتمد'} ⭐ ${rating} (${userRatingCount} مقيّم)`;
              if (!isDuplicate) qualifiedCount++;
            } else {
              qualityBadgeText = `دون المعايير الطبيعية (${rating}★ و ${userRatingCount} مقيّم)`;
            }

            let coverPhoto: string | undefined = undefined;
            if (p.photos && Array.isArray(p.photos) && p.photos.length > 0) {
              const photoName = p.photos[0].name;
              if (photoName) {
                // حفظ مرجع الصورة المباشر لتوفير استهلاك الـ API اثناء المسح
                coverPhoto = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=1600&maxWidthPx=1600&key=${GOOGLE_API_KEY}`;
              }
            }

            let workingHours: string | undefined = undefined;
            if (p.regularOpeningHours?.weekdayDescriptions && Array.isArray(p.regularOpeningHours.weekdayDescriptions)) {
              const todayDesc = p.regularOpeningHours.weekdayDescriptions[0];
              if (todayDesc) {
                workingHours = todayDesc.replace(/^[A-Za-z]+:\s*/, '').replace(/^[^\s:]+:\s*/, '');
              }
            }

            accumulatedPlaces.push({
              id: placeId,
              displayName: name,
              category: primaryTypeDisplayName || (catIndex === 0 ? 'نشاط تجاري وخدمي' : currentCat.label),
              primaryType,
              primaryTypeDisplayName,
              formattedAddress,
              lat,
              lng,
              phone,
              rating,
              userRatingCount,
              workingHours,
              googleMapsUri,
              coverPhoto,
              photosCount: Array.isArray(p.photos) ? p.photos.length : 0,
              isDuplicate,
              isQualityApproved,
              qualityBadgeText,
              isCraft,
            });

            // إذا لم يكن الوضع شاملاً ووصلنا للعدد المحدد
            if (!isExhaustive && accumulatedPlaces.length >= limitCount) {
              break;
            }
          }

          if (!isExhaustive && accumulatedPlaces.length >= limitCount) {
            break;
          }

          nextPageToken = googleData.nextPageToken;
          if (!nextPageToken) {
            break; // استنفاد صفحات هذا الاستعلام
          }

          pageNum++;
          // الانتظار نصف ثانية لتفعيل توكن الصفحة التالية في سيرفرات جوجل
          await new Promise((r) => setTimeout(r, 600));
        } catch (callErr) {
          console.warn('Chunk search error:', callErr);
          break;
        }
      }

      if (!isExhaustive && accumulatedPlaces.length >= limitCount) {
        break;
      }
    }

    const estimatedCost = (totalApiCalls * 0.032).toFixed(3);

    return {
      places: accumulatedPlaces,
      metrics: {
        totalFound: totalRawFound,
        duplicatesCount,
        qualifiedCount,
        estimatedCost: `$${estimatedCost}`,
      },
    };
  };

  // 🚀 تشغيل المسح المباشر بنمط أطلس حدائق الأهرام
  const handleExecuteScan = async () => {
    setIsScanning(true);
    setMetrics(null);
    setCandidatePlaces([]);
    setSelectedPlaceIds(new Set());
    setIngestionMessage(null);

    try {
      const data = await executeAtlasChunkSearch(
        currentSector,
        selectedCategoryIndex,
        isExhaustiveAtlasMode,
        pullCount,
        minRating,
        minReviews
      );

      if (data && Array.isArray(data.places)) {
        setCandidatePlaces(data.places);
        setMetrics(data.metrics);

        // تحديد كافة المنشآت المؤهلة وغير المكررة افتراضياً
        const qualifiedIds = new Set<string>();
        data.places.forEach((p) => {
          if (p.isQualityApproved && !p.isDuplicate) {
            qualifiedIds.add(p.id);
          }
        });
        setSelectedPlaceIds(qualifiedIds);

        const msg = `🏛️ تم بنجاح سحب وتدقيق ${data.places.length} منشأة في ${currentSector.subZone} (${data.metrics.qualifiedCount} جديدة جاهزة للحقن)`;
        if (onShowNotification) onShowNotification(msg, 'success');
      } else {
        throw new Error('لم يتم استلام أي نتائج من محرك خرائط Google');
      }
    } catch (err: any) {
      const errMsg = err?.message || 'فشل الاتصال بمحرك البحث لخرائط Google';
      if (onShowNotification) onShowNotification(errMsg, 'error');
    } finally {
      setIsScanning(false);
      setScanChunkStatus(null);
    }
  };

  // Filtered displayed places
  const displayedPlaces = useMemo(() => {
    if (!filterOnlyQualified) return candidatePlaces;
    return candidatePlaces.filter((p) => p.isQualityApproved && !p.isDuplicate);
  }, [candidatePlaces, filterOnlyQualified]);

  // Selection toggles
  const handleToggleSelectAll = () => {
    if (selectedPlaceIds.size === displayedPlaces.length) {
      setSelectedPlaceIds(new Set());
    } else {
      setSelectedPlaceIds(new Set(displayedPlaces.map((p) => p.id)));
    }
  };

  const handleTogglePlace = (id: string) => {
    setSelectedPlaceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 🚀 استيراد وحقن المنشآت المختارة بنمط أطلس حدائق الأهرام
  const handleIngestSelected = async () => {
    if (selectedPlaceIds.size === 0) {
      if (onShowNotification) onShowNotification('يرجى تحديد منشأة واحدة على الأقل للاستيراد', 'warning');
      return;
    }

    const placesToIngest = candidatePlaces.filter((p) => selectedPlaceIds.has(p.id));
    setIsIngesting(true);
    setIngestProgress({ current: 0, total: placesToIngest.length });

    let successCount = 0;
    try {
      for (let i = 0; i < placesToIngest.length; i++) {
        const p = placesToIngest[i];
        setIngestProgress({ current: i + 1, total: placesToIngest.length });

        const resolvedGov = isExpansionHubActive ? FUTURE_EXPANSION_HUBS[selectedExpansionHubIndex]?.gov || 'الجيزة' : 'الجيزة';
        const resolvedCity = isExpansionHubActive ? FUTURE_EXPANSION_HUBS[selectedExpansionHubIndex]?.city || 'حدائق الأهرام' : 'حدائق الأهرام';
        const resolvedStreet = isExpansionHubActive 
          ? (p.formattedAddress || resolvedCity) 
          : `${currentSector.subZone} - حدائق الأهرام`;
        const resolvedLandmark = isExpansionHubActive
          ? 'منشأة معتمدة بالمنطقة'
          : (currentSector.gate ? `${currentSector.gate} - ${currentSector.subZone}` : `حدائق الأهرام - ${currentSector.subZone}`);

        const newBiz: Business = {
          id: `biz_atlas_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          nameAr: p.displayName,
          category: p.category || (selectedCategoryIndex === 0 ? 'نشاط تجاري وخدمي' : currentCat.label),
          governorate: resolvedGov,
          city: resolvedCity,
          street: resolvedStreet,
          landmark: resolvedLandmark,
          phone: p.phone || '',
          workingHours: p.workingHours || 'يومياً: 09:00 ص - 11:00 م',
          description: `${p.displayName} - منشأة موثقة في دليل وأطلس حدائق الأهرام (${currentSector.subZone})`,
          lat: p.lat || currentSector.lat,
          lng: p.lng || currentSector.lng,
          ownerName: `إدارة ${p.displayName}`,
          ownerPhone: p.phone || '',
          photos: p.coverPhoto ? [p.coverPhoto] : [],
          coverPhoto: p.coverPhoto,
          repId: currentUser.id || 'admin_platform',
          repName: 'إدارة أطلس دليلك',
          packageId: 'pkg_exempt',
          packageName: 'باقة أطلس الشرفية (إدراج معتمد)',
          packagePrice: 0,
          amountPaid: 0,
          paymentStatus: 'fully_paid',
          verificationStatus: 'verified',
          publishedStatus: 'published',
          isFeeExempt: true,
          feeExemptionReason: `إدراج شرفي معتمد وموثق في أطلس ${currentSector.subZone}`,
          isAlreadyOnGoogle: true,
          googlePlaceId: p.id,
          googleMapsUrl: p.googleMapsUri || (p.id ? `https://www.google.com/maps/place/?q=place_id:${p.id}` : ''),
          googleRatingEnabled: true,
          googleRating: p.rating,
          googleReviewsCount: p.userRatingCount,
          invoiceNumber: `ATL-${Date.now().toString().slice(-6)}`,
          invoiceDate: new Date().toISOString().split('T')[0],
          createdDate: new Date().toISOString(),
        };

        if (onAddBusiness) {
          await onAddBusiness(newBiz, {
            skipNavigation: true,
            skipNotification: true,
            skipInvoiceModal: true,
          });
        } else {
          await saveBusinessToDb(newBiz);
        }
        successCount++;
      }

      const finishMsg = `🎉 تم بنجاح توثيق وحقن ${successCount} منشأة شرفية جديدة في أطلس ${currentSector.subZone}!`;
      setIngestionMessage(finishMsg);
      if (onShowNotification) onShowNotification(finishMsg, 'success');

      // Update candidates to mark ingested
      setCandidatePlaces((prev) =>
        prev.map((c) => (selectedPlaceIds.has(c.id) ? { ...c, isDuplicate: true } : c))
      );
      setSelectedPlaceIds(new Set());
    } catch (err: any) {
      const errMsg = `حدث خطأ أثناء الاستيراد: ${err?.message || 'تعذر استكمال حفظ المنشآت'}`;
      if (onShowNotification) onShowNotification(errMsg, 'error');
    } finally {
      setIsIngesting(false);
      setIngestProgress(null);
    }
  };

  const getCategoryIconPrefix = (type: string) => {
    switch (type) {
      case 'all':
        return '🌐 ';
      case 'restaurants':
        return '🍔 ';
      case 'cafes':
        return '☕ ';
      case 'fashion':
        return '👗 ';
      case 'electronics':
        return '📱 ';
      case 'furniture':
        return '🛋️ ';
      case 'craft':
        return '🛠️ ';
      case 'medical':
        return '🩺 ';
      case 'retail':
        return '🛒 ';
      case 'beauty':
        return '💇 ';
      case 'gym':
        return '🏋️ ';
      case 'corporate':
        return '💼 ';
      default:
        return '🏢 ';
    }
  };

  return (
    <div className="space-y-6 text-right pb-24 animate-fade-in" dir="rtl">
      {/* ── HEADER BANNER: ATLAS HADAYEK AL-AHRAM SOVEREIGN HUB ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>محرك أطلس حدائق الأهرام الشامل (Atlas Engine)</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                نظام السحب الجزئي المتتابع (Chunk-by-Chunk)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <span>استيراد وتوثيق أنشطة قطاعات حدائق الأهرام الميدانية</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              محرك مسح استيعابي يربط خرائط Google مباشرة بقاعدة بيانات دليلك، يسحب المنشآت والأنشطة أجزاءً أجزاء بدقة 100% لكل قطاع أبجدي وبوابة دون التقيد بنشاط معين، محققاً هدف التغطية الكاملة بنمط أطلس الميداني.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-indigo-400/20 rounded-2xl p-3.5 text-center min-w-[190px] shrink-0">
            <div className="text-[10.5px] text-slate-400 font-bold mb-1 flex items-center justify-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>المسجل مسبقاً بالقطاع الحالي</span>
            </div>
            <div className="text-xl font-black text-amber-400 font-mono">
              {existingSectorBusinessesCount} منشأة
            </div>
            <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
              في {currentSector.subZone}
            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH SCOPE CONTROLS & QUERY BUILDER ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-black text-[var(--text-primary)] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-500" />
            <span>إعدادات مسح القطاع ونمط أطلس الاستيعابي</span>
          </span>
          <span className="text-xs font-bold text-[var(--text-muted)]">
            القطاع المحدد: <strong className="text-amber-500">{currentSector.label}</strong>
          </span>
        </h3>

        {/* Row 1: Sector & Category Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Hadayek Al-Ahram Sector Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[var(--text-muted)] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>قطاع / منطقة حدائق الأهرام</span>
              </span>
              <button
                type="button"
                onClick={() => setShowExpansionHubs(!showExpansionHubs)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer underline"
              >
                {showExpansionHubs ? 'إخفاء نطاقات التوسع' : 'نطاقات التوسع المستقبلي'}
              </button>
            </label>

            {!isExpansionHubActive && !isCustomHub && (
              <select
                value={selectedSectorIndex}
                onChange={(e) => handleSectorChange(Number(e.target.value))}
                className="w-full bg-[var(--input-bg)] border border-amber-500/40 text-[var(--text-primary)] text-xs font-black p-3 rounded-2xl focus:border-amber-500 focus:outline-hidden cursor-pointer"
              >
                <optgroup label="🏛️ المناطق والتقسيمات الأبجدية">
                  {HADAYEK_SECTORS.slice(0, 17).map((s, i) => (
                    <option key={s.id} value={i}>
                      📍 {s.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🛣️ المحاور والشوارع التجارية الرئيسية">
                  {HADAYEK_SECTORS.slice(17, 20).map((s, i) => (
                    <option key={s.id} value={i + 17}>
                      🛣️ {s.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌐 النطاق العام">
                  <option value={20}>🌐 {HADAYEK_SECTORS[20].label}</option>
                </optgroup>
              </select>
            )}

            {/* Expansion Hubs if toggled */}
            {showExpansionHubs && (
              <div className="pt-2">
                <label className="text-[11px] font-bold text-indigo-300 block mb-1">
                  🌐 نطاقات التوسع المصرية المحفوظة:
                </label>
                <select
                  value={selectedExpansionHubIndex}
                  onChange={(e) => handleExpansionHubChange(Number(e.target.value))}
                  className="w-full bg-[var(--input-bg)] border border-indigo-500/40 text-[var(--text-primary)] text-xs font-black p-2.5 rounded-xl cursor-pointer"
                >
                  {FUTURE_EXPANSION_HUBS.map((h, i) => (
                    <option key={i} value={i}>
                      🌍 {h.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-[var(--text-muted)] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>نمط النشاط المطلوب سحبه</span>
            </label>
            <select
              value={selectedCategoryIndex}
              onChange={(e) => handleCategoryChange(Number(e.target.value))}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-black p-3 rounded-2xl focus:border-amber-500 focus:outline-hidden cursor-pointer"
            >
              {CATEGORY_PRESETS.map((c, i) => (
                <option key={i} value={i}>
                  {getCategoryIconPrefix(c.type)}{c.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. نمط الاستيعاب والسحب الجزئي (طلب المستخدم الصريح) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[var(--text-muted)] flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-amber-500" />
                <span>عمق المسح (Chunk Batching)</span>
              </label>
              <button
                type="button"
                onClick={() => setIsExhaustiveAtlasMode(!isExhaustiveAtlasMode)}
                className={`text-[10px] font-black px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  isExhaustiveAtlasMode 
                    ? 'bg-amber-500 text-slate-950' 
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isExhaustiveAtlasMode ? 'سحب كامل للقطاع ♾️' : 'تحديد عدد أقصى'}
              </button>
            </div>

            {isExhaustiveAtlasMode ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-center">
                <div className="text-xs font-black text-amber-400">
                  ♾️ مسح استيعابي شامل للقطاع
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  يسحب كافة الأنشطة والمحلات الموثقة على الخريطة تباعاً أجزاءً أجزاء حتى الاكتمال
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={5}
                  max={200}
                  step={5}
                  value={pullCount}
                  onChange={(e) => setPullCount(Math.max(5, Number(e.target.value) || 20))}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-black p-3 rounded-2xl focus:border-amber-500 focus:outline-hidden font-mono text-center"
                />
                <span className="text-xs font-bold text-[var(--text-muted)] shrink-0">مكان كحد أقصى</span>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Search Query Input & Atlas Sweep Trigger */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-black text-[var(--text-muted)] flex items-center justify-between">
            <span>استعلام مسح الخرائط التوجيهي</span>
            <span className="text-[10px] text-amber-500 font-bold">
              {selectedCategoryIndex === 0 ? '✨ وضع أطلس الشامل مفعل (مسح متعدد المحاور)' : 'مسح فئة محددة'}
            </span>
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="استعلام المسح..."
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold p-3.5 pr-10 rounded-2xl focus:border-amber-500 focus:outline-hidden"
              />
            </div>
            <button
              type="button"
              disabled={isScanning}
              onClick={handleExecuteScan}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs px-6 py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ سحب الأجزاء...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>بدء مسح أطلس للقطاع</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Chunk Progress Bar when Scanning */}
        {isScanning && scanChunkStatus && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 animate-pulse space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-amber-400">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span>{scanChunkStatus.stepText}</span>
              </span>
              <span>الجزء #{scanChunkStatus.chunkNumber}</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold text-slate-300">
              <span>إجمالي المفحوص: {scanChunkStatus.totalFoundSoFar}</span>
              <span className="text-emerald-400">منشآت فريدة جديدة: {scanChunkStatus.newFoundSoFar}</span>
              <span className="text-slate-400">مكرر تم حمايته: {scanChunkStatus.duplicatesSoFar}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── ATLAS SECTOR COVERAGE & AUDIT DASHBOARD ── */}
      {metrics && (
        <div className="bg-[var(--bg-card)] border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-black text-[var(--text-primary)]">
                لوحة تدقيق وتغطية القطاع الميداني: <span className="text-emerald-400">{currentSector.subZone}</span>
              </h4>
            </div>
            <span className="text-xs font-black bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
              تغطية أطلس نشطة ومحققة 100%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)]">
              <div className="text-[11px] text-[var(--text-muted)] font-bold mb-1">المسجل مسبقاً بالدليل</div>
              <div className="text-lg font-black text-slate-200 font-mono">{existingSectorBusinessesCount}</div>
            </div>
            <div className="p-3 bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)]">
              <div className="text-[11px] text-[var(--text-muted)] font-bold mb-1">المكتشف عبر Google Maps</div>
              <div className="text-lg font-black text-amber-400 font-mono">{metrics.totalFound}</div>
            </div>
            <div className="p-3 bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)]">
              <div className="text-[11px] text-[var(--text-muted)] font-bold mb-1">مكرر تم حجب استهلاكه</div>
              <div className="text-lg font-black text-slate-400 font-mono">{metrics.duplicatesCount}</div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
              <div className="text-[11px] text-emerald-400 font-bold mb-1">منشآت فريدة جاهزة للحقن</div>
              <div className="text-lg font-black text-emerald-400 font-mono">{metrics.qualifiedCount}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs font-bold text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>إجمالي منشآت {currentSector.subZone} في دليلك بعد الاستيراد: <strong>{existingSectorBusinessesCount + metrics.qualifiedCount}</strong> منشأة موثقة</span>
            </div>
            <div className="font-mono text-amber-400">
              التكلفة الفعلية المقدرة: {metrics.estimatedCost}
            </div>
          </div>
        </div>
      )}

      {/* ── BATCH INGESTION ACTION BAR & CANDIDATE LIST ── */}
      {candidatePlaces.length > 0 && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-2 text-xs font-black text-[var(--text-primary)] hover:text-amber-500 transition-colors cursor-pointer"
              >
                {selectedPlaceIds.size === displayedPlaces.length ? (
                  <CheckSquare className="w-4 h-4 text-amber-500" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>تحديد الكل ({displayedPlaces.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterOnlyQualified(!filterOnlyQualified)}
                className={`text-xs font-black px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  filterOnlyQualified
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-color)]'
                }`}
              >
                {filterOnlyQualified ? 'عرض الجاهز للاستيراد فقط' : 'عرض كافة النتائج'}
              </button>
            </div>

            <button
              type="button"
              disabled={isIngesting || selectedPlaceIds.size === 0}
              onClick={handleIngestSelected}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs px-8 py-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isIngesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ حقن المنشآت ({ingestProgress?.current}/{ingestProgress?.total})...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد استيراد وتوثيق ({selectedPlaceIds.size}) منشأة في الدليل</span>
                </>
              )}
            </button>
          </div>

          {ingestionMessage && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black text-center">
              {ingestionMessage}
            </div>
          )}

          {/* Places Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedPlaces.map((p) => {
              const isSelected = selectedPlaceIds.has(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => !p.isDuplicate && handleTogglePlace(p.id)}
                  className={`bg-[var(--bg-card)] border rounded-3xl p-4 sm:p-5 transition-all relative flex flex-col justify-between cursor-pointer ${
                    p.isDuplicate
                      ? 'opacity-50 border-[var(--border-color)] bg-slate-900/40 cursor-not-allowed'
                      : isSelected
                      ? 'border-amber-500 shadow-md bg-amber-500/5'
                      : 'border-[var(--border-color)] hover:border-slate-500'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {!p.isDuplicate && (
                          <div className="shrink-0 mt-0.5">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-amber-500" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-[var(--text-primary)] line-clamp-1">
                            {p.displayName}
                          </h4>
                          <span className="text-[10px] text-amber-500 font-bold">
                            {p.category}
                          </span>
                        </div>
                      </div>

                      {p.isDuplicate && (
                        <span className="text-[9.5px] font-black bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full shrink-0">
                          مسجل مسبقاً
                        </span>
                      )}
                    </div>

                    {/* Address & Sector */}
                    <div className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{p.formattedAddress || `${currentSector.subZone} - حدائق الأهرام`}</span>
                    </div>

                    {/* Phone & Rating */}
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{p.phone || 'غير مسجل'}</span>
                      </span>
                      <span className="flex items-center gap-1 font-bold text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{(p.rating ?? 0) > 0 ? `${p.rating} (${p.userRatingCount || 0})` : 'جديد'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Quality Badge */}
                  <div className="mt-3 pt-2 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="line-clamp-1">{p.qualityBadgeText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
