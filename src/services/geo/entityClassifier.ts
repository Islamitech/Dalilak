/**
 * ===============================================================================
 * 🏛️ محرك الفرز والتصنيف الجغرافي الذكي للكيانات (Smart Entity Classifier)
 * ===============================================================================
 * يقوم بفرز الكيانات المستخرجة جغرافياً وتصنيفها آلياً إلى 4 أوعية رئيسية مستقلة:
 * 1. COMMERCIAL: الأنشطة التجارية والخدمية والطبية والحرفية (دليل دليلك)
 * 2. RESIDENTIAL: المجمعات السكنية، العمارات، الكمبوندات، الفلل (أطلس العقارات)
 * 3. INFRASTRUCTURE: الشوارع، الطرق، البوابات، المحاور، الميادين (شبكة الملاحة)
 * 4. CIVIC: المعالم المدنية، دور العبادة، المرافق الحكومية العامة
 * ===============================================================================
 */

export type EntityBucket = 'COMMERCIAL' | 'RESIDENTIAL' | 'INFRASTRUCTURE' | 'CIVIC';

export interface RawEntityInput {
  id?: string;
  displayName: string;
  formattedAddress?: string;
  primaryType?: string;
  primaryTypeDisplayName?: string;
  types?: string[];
  lat?: number;
  lng?: number;
}

export interface ClassifiedEntity {
  bucket: EntityBucket;
  bucketLabelAr: string;
  categoryKey: string;
  categoryLabelAr: string;
  icon: string;
  confidence: number;
  isCommercial: boolean;
  metadata: {
    buildingNumber?: string;
    compoundName?: string;
    streetName?: string;
    isCraft?: boolean;
    isMedical?: boolean;
    isFood?: boolean;
  };
}

// -----------------------------------------------------------------------------
// قوائم وسوم Google Places API v1 الرسمية (Google Place Types Ontology)
// -----------------------------------------------------------------------------

const RESIDENTIAL_PLACE_TYPES = new Set([
  'apartment_building',
  'apartment_complex',
  'condominium_complex',
  'housing_complex',
  'residential_community',
  'subdivision',
  'housing_development',
]);

const INFRASTRUCTURE_PLACE_TYPES = new Set([
  'route',
  'street_address',
  'intersection',
  'transit_station',
  'subway_station',
  'bus_station',
  'bus_stop',
  'train_station',
  'light_rail_station',
  'bridge',
  'tunnel',
  'toll_station',
  'highway',
]);

const CIVIC_PLACE_TYPES = new Set([
  'place_of_worship',
  'mosque',
  'church',
  'hindu_temple',
  'synagogue',
  'city_hall',
  'courthouse',
  'embassy',
  'fire_station',
  'local_government_office',
  'police',
  'post_office',
  'public_bath',
]);

// الأنشطة الحرفية والمهنية الدقيقة
const CRAFT_KEYWORDS = [
  'car_repair', 'auto_repair', 'mechanic', 'plumber', 'electrician', 'locksmith',
  'carpenter', 'handyman', 'workshop', 'maintenance', 'repair',
  'ميكانيك', 'ورشة', 'سباك', 'كهربائي', 'صيانة', 'حداد', 'نجار', 'عفشجي', 'دوكو', 'سمكري',
  'تكييف', 'ألوميتال', 'زجاج', 'كاوتش', 'بطاريات', 'خراط', 'لحام', 'مفاتيح', 'سيراميك',
  'نقاش', 'دهانات'
];

// -----------------------------------------------------------------------------
// محرك التحقق من الحدود اللغوية العربية الدقيقة (Unicode Arabic Word Boundary Matcher)
// -----------------------------------------------------------------------------
function hasArabicTerm(text: string, terms: string[]): boolean {
  if (!text) return false;
  // حدود الكلمة للغة العربية والأرقام والرموز
  const regex = new RegExp(`(?:^|[^\\u0621-\\u064A0-9A-Za-z])(?:${terms.join('|')})(?:[^\\u0621-\\u064A0-9A-Za-z]|$)`, 'i');
  return regex.test(text);
}

const INFRASTRUCTURE_TERMS = [
  'شارع', 'طريق', 'محور', 'بوابة', 'ميدان', 'تقاطع', 'نزلة', 'مطلع', 'كوبري', 'نفق', 'حارة', 'درب', 'ممشى', 'جسر'
];

const RESIDENTIAL_TERMS = [
  'عمارة', 'عقار', 'كمبوند', 'كومباوند', 'برج سكني', 'أبراج سكنية', 'فيلا', 'فلل',
  'سكن مصر', 'إسكان مصر', 'دار مصر', 'جنة مصر', 'مجاورة', 'بلوك', 'مدينة سكنية', 'قطعة رقم'
];

const CIVIC_TERMS = [
  'مسجد', 'جامع', 'زاوية', 'كنيسة', 'دير', 'مطرانية', 'نقطة شرطة', 'قسم شرطة', 'مكتب بريد', 'سنترال', 'مجمع خدمات حكومي'
];

const STORE_PREFIXES = [
  'مطعم', 'كافيه', 'سوبرماركت', 'صيدلية', 'محل', 'معرض', 'عيادة', 'مكتبة', 'مخبز', 'صالون', 'جيم', 'ورشة', 'استوديو'
];

/**
 * دالة التصنيف والفرز الرئيسية
 */
export function classifyEntity(raw: RawEntityInput): ClassifiedEntity {
  const name = (raw.displayName || '').trim();
  const address = (raw.formattedAddress || '').trim();
  const primaryType = (raw.primaryType || '').toLowerCase();
  const primaryTypeDisplay = (raw.primaryTypeDisplayName || '').toLowerCase();
  const allTypes = (raw.types || []).map((t) => t.toLowerCase());
  const combinedText = `${name} ${address} ${primaryTypeDisplay}`.toLowerCase();
  const hasStorePrefix = hasArabicTerm(name, STORE_PREFIXES);

  // ---------------------------------------------------------------------------
  // 1️⃣ فحص وعاء البنية التحتية والطرق والبوابات (INFRASTRUCTURE)
  // ---------------------------------------------------------------------------
  const isTypeInfra = INFRASTRUCTURE_PLACE_TYPES.has(primaryType) || allTypes.some((t) => INFRASTRUCTURE_PLACE_TYPES.has(t));
  const isRegexInfra = hasArabicTerm(name, INFRASTRUCTURE_TERMS);

  if ((isTypeInfra || isRegexInfra) && !hasStorePrefix) {
    let streetName = name;
    return {
      bucket: 'INFRASTRUCTURE',
      bucketLabelAr: 'طريق أو محور أو بوابة (بنية تحتية)',
      categoryKey: 'infrastructure',
      categoryLabelAr: 'شوارع ومحاور وملاحة',
      icon: 'map-pin',
      confidence: isTypeInfra && isRegexInfra ? 0.98 : 0.88,
      isCommercial: false,
      metadata: { streetName },
    };
  }

  // ---------------------------------------------------------------------------
  // 2️⃣ فحص وعاء المعالم المدنية ودور العبادة (CIVIC)
  // ---------------------------------------------------------------------------
  const isTypeCivic = CIVIC_PLACE_TYPES.has(primaryType) || allTypes.some((t) => CIVIC_PLACE_TYPES.has(t));
  const isRegexCivic = hasArabicTerm(name, CIVIC_TERMS);

  if (isTypeCivic || isRegexCivic) {
    return {
      bucket: 'CIVIC',
      bucketLabelAr: 'معلم مدني أو دار عبادة',
      categoryKey: 'civic',
      categoryLabelAr: 'خدمات ومعالم عامة',
      icon: 'landmark',
      confidence: isTypeCivic && isRegexCivic ? 0.99 : 0.90,
      isCommercial: false,
      metadata: {},
    };
  }

  // ---------------------------------------------------------------------------
  // 3️⃣ فحص وعاء العقارات والمجمعات السكنية (RESIDENTIAL)
  // ---------------------------------------------------------------------------
  const isTypeResidential = RESIDENTIAL_PLACE_TYPES.has(primaryType) || allTypes.some((t) => RESIDENTIAL_PLACE_TYPES.has(t));
  const isRegexResidential = hasArabicTerm(name, RESIDENTIAL_TERMS);

  // استخراج رقم العمارة أو اسم الكمبوند إذا وجد
  const bldgMatch = name.match(/(?:عمارة|عقار|قطعة)\s*([0-9]+\s*[أ-ي]?)/i);
  const compoundMatch = name.match(/(?:كمبوند|كومباوند|مشروع)\s+([أ-ي\s]+)/i);

  if ((isTypeResidential || isRegexResidential) && !hasStorePrefix) {
    return {
      bucket: 'RESIDENTIAL',
      bucketLabelAr: 'عمارة أو مجمع سكني (أطلس العقارات)',
      categoryKey: 'residential',
      categoryLabelAr: 'مجمعات وعقارات سكنية',
      icon: 'building-2',
      confidence: isTypeResidential && isRegexResidential ? 0.98 : 0.89,
      isCommercial: false,
      metadata: {
        buildingNumber: bldgMatch ? bldgMatch[1].trim() : undefined,
        compoundName: compoundMatch ? compoundMatch[1].trim() : undefined,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 4️⃣ وعاء الأنشطة التجارية والخدمية والمهنية (COMMERCIAL)
  // ---------------------------------------------------------------------------
  let catKey = 'general';
  let catLabel = 'نشاط تجاري وخدمي';
  let icon = 'store';
  let isCraft = false;
  let isMedical = false;
  let isFood = false;

  // أ) الحرف والصيانة
  if (CRAFT_KEYWORDS.some((kw) => combinedText.includes(kw))) {
    catKey = 'craft';
    catLabel = 'ورش وصيانة وخدمات حرفية';
    icon = 'wrench';
    isCraft = true;
  }
  // ب) المطاعم والمأكولات والمخابز
  else if (
    primaryType.includes('restaurant') || primaryType.includes('food') || primaryType.includes('bakery') ||
    hasArabicTerm(combinedText, ['مطعم', 'مشويات', 'شاورما', 'فطاطري', 'بيتزا', 'برجر', 'كشري', 'فول', 'طعمية', 'مأكولات', 'مخبز', 'حلواني', 'أسماك', 'كبابجي'])
  ) {
    catKey = 'restaurants';
    catLabel = 'مطاعم ومأكولات ومخابز';
    icon = 'utensils';
    isFood = true;
  }
  // ج) الكافيهات والمقاهي والمشروبات
  else if (
    primaryType.includes('cafe') || primaryType.includes('coffee') || primaryType.includes('bar') ||
    hasArabicTerm(combinedText, ['كافيه', 'مقهى', 'قهوة', 'كوفي', 'عصائر', 'ايس كريم', 'شاي', 'درايف ثرو'])
  ) {
    catKey = 'cafes';
    catLabel = 'كافيهات ومقاهي ومشروبات';
    icon = 'coffee';
    isFood = true;
  }
  // د) الصحة والمراكز الطبية والصيدليات
  else if (
    primaryType.includes('health') || primaryType.includes('pharmacy') || primaryType.includes('doctor') ||
    primaryType.includes('hospital') || primaryType.includes('dentist') ||
    hasArabicTerm(combinedText, ['صيدلية', 'عيادة', 'مركز طبي', 'مستشفى', 'مختبر', 'معمل تحاليل', 'طبيب', 'دكتور', 'علاج طبيعي', 'أسنان', 'بصريات', 'نظارات'])
  ) {
    catKey = 'medical';
    catLabel = 'عيادات ومراكز طبية وصيدليات';
    icon = 'stethoscope';
    isMedical = true;
  }
  // هـ) السوبرماركت ومحلات التجزئة والأغذية
  else if (
    primaryType.includes('supermarket') || primaryType.includes('grocery') || primaryType.includes('store') ||
    hasArabicTerm(combinedText, ['سوبرماركت', 'ماركت', 'بقالة', 'هايبر', 'خضار', 'فواكه', 'عطارة', 'ألبان', 'محمص', 'ميني ماركت'])
  ) {
    catKey = 'retail';
    catLabel = 'سوبرماركت ومحلات تجارة وتجزئة';
    icon = 'shopping-cart';
  }
  // و) الصالونات ومراكز التجميل
  else if (
    primaryType.includes('hair') || primaryType.includes('beauty') || primaryType.includes('spa') ||
    hasArabicTerm(combinedText, ['صالون', 'حلاقة', 'كوافير', 'تجميل', 'سبا', 'بيوتي سنتر', 'عناية بالبشرة'])
  ) {
    catKey = 'salons';
    catLabel = 'صالونات ومراكز تجميل وعناية';
    icon = 'scissors';
  }
  // ز) الأندية والجيم والرياضة
  else if (
    primaryType.includes('gym') || primaryType.includes('fitness') || primaryType.includes('sports') ||
    hasArabicTerm(combinedText, ['جيم', 'لياقة', 'نادي', 'صالة ألعاب', 'فتنس', 'أكاديمية رياضية', 'ملاعب', 'سباحة'])
  ) {
    catKey = 'gyms';
    catLabel = 'أندية وجيم وصالات رياضية';
    icon = 'dumbbell';
  }
  // ح) المدارس والحضانات والتعليم
  else if (
    primaryType.includes('school') || primaryType.includes('education') ||
    hasArabicTerm(combinedText, ['حضانة', 'مدرسة', 'سنتر تعليمي', 'أكاديمية لغات', 'كورسات', 'تدريب', 'مركز دروس'])
  ) {
    catKey = 'education';
    catLabel = 'مدارس وحضانات ومراكز تعليمية';
    icon = 'graduation-cap';
  }
  // ط) الملابس والأزياء والأحذية
  else if (
    primaryType.includes('clothing') || primaryType.includes('shoe') ||
    hasArabicTerm(combinedText, ['ملابس', 'أزياء', 'أحذية', 'شنط', 'بوتيك', 'ترزي', 'خياط', 'فساتين', 'بدل', 'عبايات'])
  ) {
    catKey = 'fashion';
    catLabel = 'محلات ملابس وأزياء وأحذية';
    icon = 'shirt';
  }
  // ي) الإلكترونيات وصيانة الموبايل
  else if (
    primaryType.includes('electronics') ||
    hasArabicTerm(combinedText, ['موبايل', 'هواتف', 'كمبيوتر', 'لاب توب', 'إلكترونيات', 'صيانة موبايل', 'كاميرات', 'دش', 'شبكات'])
  ) {
    catKey = 'electronics';
    catLabel = 'هواتف وصيانة موبايل وإلكترونيات';
    icon = 'smartphone';
  }
  // ك) معارض الأثاث والموبيليا والديكور
  else if (
    primaryType.includes('furniture') ||
    hasArabicTerm(combinedText, ['أثاث', 'موبيليا', 'ديكور', 'مفروشات', 'سجاد', 'ستائر', 'مطابخ', 'أبواب'])
  ) {
    catKey = 'furniture';
    catLabel = 'معارض أثاث وموبيليا وديكور منزلي';
    icon = 'sofa';
  }
  // ل) الخدمات المهنية والمكاتب والعقارات
  else if (
    primaryType.includes('office') || primaryType.includes('real_estate') || primaryType.includes('lawyer') ||
    hasArabicTerm(combinedText, ['مكتب محاماة', 'تسويق عقاري', 'استشارات هندسية', 'محاسب قانوني', 'سياحة', 'ترجمة', 'دعاية وإعلان'])
  ) {
    catKey = 'services';
    catLabel = 'خدمات مهنية ومكاتب وعقارات';
    icon = 'briefcase';
  }

  return {
    bucket: 'COMMERCIAL',
    bucketLabelAr: 'نشاط تجاري أو خدمي معتمد (دليلك)',
    categoryKey: catKey,
    categoryLabelAr: catLabel,
    icon,
    confidence: 0.95,
    isCommercial: true,
    metadata: {
      isCraft,
      isMedical,
      isFood,
    },
  };
}
