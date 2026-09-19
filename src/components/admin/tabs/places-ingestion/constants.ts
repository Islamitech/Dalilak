import {
  HADAYEK_SECTORS_DATA,
  HadayekSector,
} from '../../../../services/geo/hadayekAtlasData';
import { normalizeArabicText } from '../../../../utils/arabicSearch';
import { CategoryThreshold } from './types';

export const GOOGLE_API_KEY =
  (import.meta as any).env?.VITE_GOOGLE_PLACES_API_KEY ||
  'AIzaSyD3eyrkvcPrYKgGFqUf2p3OrzKgMep_7c4';

// 🏛️ مصفوفة نطاقات وتقسيمات حدائق الأهرام الميدانية الدقيقة (Atlas Hadayek Matrix)
export const HADAYEK_SECTORS: HadayekSector[] = HADAYEK_SECTORS_DATA;

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

export const EGYPTIAN_HUBS = FUTURE_EXPANSION_HUBS;

// 🏛️ مصفوفة التقييمات الطبيعية المتوازنة لكل فئة في السوق المصري
export const CATEGORY_PRESETS: CategoryThreshold[] = [
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

// 🏛️ مفاتيح الذاكرة الدائمة للمنشآت المستخرجة والمفحوصة مسبقاً لمنع التكرار نهائياً
export const INGESTION_SEEN_IDS_KEY = 'dalilak_ingestion_seen_place_ids';
export const INGESTION_SEEN_NAMES_KEY = 'dalilak_ingestion_seen_place_names';

export const getIngestionSeenRecords = (): { seenIds: Set<string>; seenNames: Set<string> } => {
  try {
    const rawIds = localStorage.getItem(INGESTION_SEEN_IDS_KEY);
    const rawNames = localStorage.getItem(INGESTION_SEEN_NAMES_KEY);
    const idsArr: string[] = rawIds ? JSON.parse(rawIds) : [];
    const namesArr: string[] = rawNames ? JSON.parse(rawNames) : [];
    return {
      seenIds: new Set(idsArr),
      seenNames: new Set(namesArr.map((n) => normalizeArabicText(n))),
    };
  } catch (e) {
    return { seenIds: new Set(), seenNames: new Set() };
  }
};

export const saveIngestionSeenRecords = (newPlaces: Array<{ id?: string; displayName?: string }>) => {
  try {
    const { seenIds, seenNames } = getIngestionSeenRecords();
    newPlaces.forEach((p) => {
      if (p.id) seenIds.add(p.id);
      const norm = normalizeArabicText(p.displayName || '');
      if (norm.length > 2) seenNames.add(norm);
    });
    localStorage.setItem(INGESTION_SEEN_IDS_KEY, JSON.stringify(Array.from(seenIds)));
    localStorage.setItem(INGESTION_SEEN_NAMES_KEY, JSON.stringify(Array.from(seenNames)));
  } catch (e) {
    console.warn('Failed to persist seen records to localStorage:', e);
  }
};

export const clearIngestionSeenRecords = () => {
  try {
    localStorage.removeItem(INGESTION_SEEN_IDS_KEY);
    localStorage.removeItem(INGESTION_SEEN_NAMES_KEY);
  } catch (e) {}
};

export const getCategoryIconPrefix = (type: string) => {
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

export const isCraftActivity = (primaryType?: string, typeDisplayName?: string, name?: string): boolean => {
  const text = `${primaryType || ''} ${typeDisplayName || ''} ${name || ''}`.toLowerCase();
  const craftKeywords = [
    'car_repair', 'auto_repair', 'mechanic', 'plumber', 'electrician', 'locksmith',
    'carpenter', 'handyman', 'workshop', 'maintenance', 'repair',
    'ميكانيك', 'ورشة', 'سباك', 'كهربائي', 'صيانة', 'حداد', 'نجار', 'عفشجي', 'دوكو', 'سمكري', 'تكييف'
  ];
  return craftKeywords.some((kw) => text.includes(kw));
};
