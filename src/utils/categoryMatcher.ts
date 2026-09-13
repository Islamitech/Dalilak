import { CATEGORY_GROUPS } from '../data/mockData';
import { normalizeArabicText } from './arabicSearch';

/**
 * 🏷️ Canonical Category Aliases mapping common button labels/shorthand to exact CATEGORY_GROUPS
 */
export const CATEGORY_ALIASES: Record<string, string> = {
  'الكل': 'all',
  'مطاعم': 'المطاعم والأغذية والمشروبات',
  'مطاعم ومأكولات': 'المطاعم والأغذية والمشروبات',
  'مطاعم وكافيهات': 'المطاعم والأغذية والمشروبات',
  'أغذية ومشروبات': 'المطاعم والأغذية والمشروبات',
  'سوبرماركت': 'المطاعم والأغذية والمشروبات',
  'سوبر ماركت': 'المطاعم والأغذية والمشروبات',
  'بقالة': 'المطاعم والأغذية والمشروبات',
  'مقهى': 'المطاعم والأغذية والمشروبات',
  'كافيه': 'المطاعم والأغذية والمشروبات',

  'طبي وصيدلي': 'العيادات والرعاية الصحية والطبية',
  'رعاية صحية': 'العيادات والرعاية الصحية والطبية',
  'أطباء وعيادات': 'العيادات والرعاية الصحية والطبية',
  'صيدليات': 'العيادات والرعاية الصحية والطبية',
  'صيدلية': 'العيادات والرعاية الصحية والطبية',
  'عيادة طبية': 'العيادات والرعاية الصحية والطبية',
  'مركز طبي': 'العيادات والرعاية الصحية والطبية',

  'سيارات وصيانة': 'السيارات والمركبات والصيانة',
  'سيارات': 'السيارات والمركبات والصيانة',
  'صيانة سيارات': 'السيارات والمركبات والصيانة',
  'تصليح سيارات': 'السيارات والمركبات والصيانة',
  'معرض سيارات': 'السيارات والمركبات والصيانة',
  'معرض سيارات / صيانة': 'السيارات والمركبات والصيانة',
  'غسيل سيارات': 'السيارات والمركبات والصيانة',

  'تجميل وعناية': 'التجميل والعناية الشخصية واللياقة',
  'حلاقة وكوافير': 'التجميل والعناية الشخصية واللياقة',
  'صالون حلاقة': 'التجميل والعناية الشخصية واللياقة',
  'صالون حلاقة رجالي': 'التجميل والعناية الشخصية واللياقة',
  'صالون تجميل': 'التجميل والعناية الشخصية واللياقة',
  'حلاقة': 'التجميل والعناية الشخصية واللياقة',
  'كوافير': 'التجميل والعناية الشخصية واللياقة',
  'بيوتي سنتر': 'التجميل والعناية الشخصية واللياقة',
  'جيم ولياقة': 'التجميل والعناية الشخصية واللياقة',
  'صالة رياضة': 'التجميل والعناية الشخصية واللياقة',
  'غرفة لياقة': 'التجميل والعناية الشخصية واللياقة',
  'عناية بالشعر': 'التجميل والعناية الشخصية واللياقة',

  'ملابس وأزياء': 'الملابس والأزياء والإكسسوارات',
  'متجر ملابس': 'الملابس والأزياء والإكسسوارات',
  'محل ملابس': 'الملابس والأزياء والإكسسوارات',
  'متجر ملابس حريمي': 'الملابس والأزياء والإكسسوارات',
  'أزياء وموضة': 'الملابس والأزياء والإكسسوارات',
  'أحذية وجلود': 'الملابس والأزياء والإكسسوارات',

  'إلكترونيات وهواتف': 'الهواتف والإلكترونيات والكمبيوتر',
  'هواتف وموبايل': 'الهواتف والإلكترونيات والكمبيوتر',
  'موبايل وهواتف': 'الهواتف والإلكترونيات والكمبيوتر',
  'متجر هواتف جوالة': 'الهواتف والإلكترونيات والكمبيوتر',
  'صيانة موبايل': 'الهواتف والإلكترونيات والكمبيوتر',
  'كمبيوتر ولابتوب': 'الهواتف والإلكترونيات والكمبيوتر',

  'أثاث وديكور': 'الأثاث والديكور والمنزل',
  'متجر أثاث': 'الأثاث والديكور والمنزل',
  'أدوات منزلية': 'الأثاث والديكور والمنزل',

  'خدمات ومكاتب': 'الشركات والخدمات والمكاتب المهنية',
  'شركات ومقاولات': 'الشركات والخدمات والمكاتب المهنية',
  'خدمات مهنية': 'الشركات والخدمات والمكاتب المهنية',
  'مكتب حكومي': 'الشركات والخدمات والمكاتب المهنية',

  'مكتبات وطباعة': 'المكتبات والأدوات المدرسية والطباعة',
  'مكتبة': 'المكتبات والأدوات المدرسية والطباعة',
  'متجر كتب': 'المكتبات والأدوات المدرسية والطباعة',

  'تعليم وتدريب': 'التعليم والتدريب وتنمية المهارات',
  'مدارس وحضانات': 'التعليم والتدريب وتنمية المهارات',
  'رياض أطفال': 'التعليم والتدريب وتنمية المهارات',
  'مدرسة': 'التعليم والتدريب وتنمية المهارات',

  'حرف وصيانة فنية': 'الحرف والورش والصيانة الفنية',
  'خدمات منزلية': 'الحرف والورش والصيانة الفنية',

  'سياحة وفنادق': 'السياحة والفنادق والمناسبات',
  'فنادق ومناسبات': 'السياحة والفنادق والمناسبات',
  'فندق': 'السياحة والفنادق والمناسبات',
  'قاعة زفاف': 'السياحة والفنادق والمناسبات',

  'أنشطة عامة': 'أنشطة وخدمات عامة أخرى',
};

/**
 * Specific core taxonomy keywords strictly for matching CATEGORY and SERVICES (never notes or address)
 */
export const GROUP_KEYWORDS: Record<string, string[]> = {
  'المطاعم والأغذية والمشروبات': [
    'مطعم', 'اكل', 'ماكولات', 'مشويات', 'شاورما', 'كافيه', 'مقهى', 'كوفي', 'قهوة',
    'مخبز', 'حلواني', 'حلويات', 'معجنات', 'سوبر ماركت', 'سوبرماركت', 'ماركت', 'هايبر', 'بقالة',
    'عصائر', 'عصير', 'ايس كريم', 'جيلاتي', 'جزارة', 'لحوم', 'لحمة', 'دواجن', 'فراخ',
    'اسماك', 'سمك', 'فسخاني', 'عطارة', 'بهارات', 'توابل', 'خضار', 'فواكه', 'فاكهة',
    'محمص', 'مكسرات', 'تسالي', 'بن', 'فول', 'طعمية', 'كشري', 'بيتزا', 'برجر', 'فطير'
  ],
  'العيادات والرعاية الصحية والطبية': [
    'عيادة', 'طبيب', 'دكتور', 'مركز طبي', 'صحي', 'صحة', 'اسنان', 'عيون', 'بصريات',
    'نظارات', 'جلدية', 'اطفال', 'ولادة', 'نساء', 'باطنة', 'قلب', 'صدر', 'انف واذن',
    'تغذية', 'عظام', 'مفاصل', 'علاج طبيعي', 'صيدلية', 'صيدليات', 'دواء', 'ادوية',
    'معمل', 'تحاليل', 'اشعة', 'مستشفى', 'مستشفيات', 'مجمع طبي', 'بيطري'
  ],
  'الملابس والأزياء والإكسسوارات': [
    'ملابس', 'ازياء', 'موضة', 'متجر ملابس', 'محل ملابس', 'رجالي', 'بدل', 'قميص',
    'بنطلون', 'حريمي', 'فساتين', 'فستان', 'عبايات', 'عباية', 'اطفال', 'مواليد',
    'احذية', 'حذاء', 'جزم', 'كوتشي', 'شنط', 'شنطة', 'حقائب', 'جلود', 'مجوهرات',
    'ذهب', 'فضة', 'ساعات', 'عطور', 'برفيوم'
  ],
  'الهواتف والإلكترونيات والكمبيوتر': [
    'هاتف', 'هواتف', 'موبايل', 'موبايلات', 'جوال', 'تليفون', 'صيانة موبايل', 'اكسسوارات موبايل',
    'كمبيوتر', 'حاسوب', 'لابتوب', 'شبكات', 'طابعات', 'اجهزة كهربائية', 'كاميرات مراقبة', 'شاشات'
  ],
  'السيارات والمركبات والصيانة': [
    'سيارات', 'سيارة', 'عربيات', 'عربية', 'معرض سيارات', 'ميكانيكا', 'ميكانيكي',
    'صيانة سيارات', 'تصليح سيارات', 'كهرباء سيارات', 'تكييف سيارات', 'مغسلة سيارات',
    'كار ووش', 'ديتيلينج', 'تلميع سيارات', 'كاوتش', 'اطارات', 'بطاريات', 'قطع غيار سيارات', 'تغيير زيت', 'موتوسيكلات'
  ],
  'التجميل والعناية الشخصية واللياقة': [
    'حلاقة', 'حلاق', 'صالون', 'صالونات', 'كوافير', 'بيوتي سنتر', 'عناية بالبشرة',
    'عناية بالشعر', 'سبا', 'جاكوزي', 'جيم', 'صالة لياقة', 'فتنس', 'رياضة', 'ملاعب', 'تخسيس'
  ],
  'الأثاث والديكور والمنزل': [
    'اثاث', 'موبيليا', 'غرف نوم', 'سفرة', 'انتريه', 'مفروشات', 'ستائر', 'سجاد',
    'ادوات منزلية', 'مطبخ', 'مطابخ', 'دهانات', 'بويات', 'ديكور', 'ورق حائط', 'اضاءة', 'نجف', 'سيراميك'
  ],
  'الشركات والخدمات والمكاتب المهنية': [
    'شركة', 'شركات', 'مكتب', 'محاماة', 'محامي', 'محاسبة', 'ضرائب', 'مقاولات',
    'تشطيبات', 'تسويق', 'دعاية', 'اعلان', 'ترجمة', 'عقارات', 'سمسار', 'شحن', 'ستوديو تصوير'
  ],
  'المكتبات والأدوات المدرسية والطباعة': [
    'مكتبة', 'مكتبات', 'ادوات مدرسية', 'قرطاسية', 'تصوير مستندات', 'طباعة', 'كتب', 'روايات'
  ],
  'التعليم والتدريب وتنمية المهارات': [
    'حضانة', 'روضة', 'مدرسة', 'مدارس', 'تعليم', 'دروس', 'سنتر تعليمي', 'كورسات', 'لغات', 'برمجة', 'تدريب'
  ],
  'الحرف والورش والصيانة الفنية': [
    'حدادة', 'نجارة', 'الوميتال', 'زجاج', 'صيانة تكييف', 'سباك', 'سباكة', 'كهربائي', 'كهرباء منازل', 'مغسلة ملابس', 'دراي كلين', 'مكوجي'
  ],
  'السياحة والفنادق والمناسبات': [
    'فندق', 'فنادق', 'شقق فندقية', 'منتجع', 'قاعة مناسبات', 'قاعة افراح', 'سياحة', 'طيران'
  ],
  'أنشطة وخدمات عامة أخرى': [
    'مشتل', 'زهور', 'محطة وقود', 'بنزينة', 'غاز', 'خيرية', 'خدمات عامة'
  ],
};

/**
 * Resolves any raw filter input (alias, subcategory, or group name) to its canonical group
 */
export function resolveCanonicalCategoryGroup(categoryInput: string): string {
  const trimmed = (categoryInput || '').trim();
  if (!trimmed || trimmed === 'all') return 'all';

  // 1. Direct match in CATEGORY_ALIASES
  if (CATEGORY_ALIASES[trimmed]) {
    return CATEGORY_ALIASES[trimmed];
  }

  // 2. Exact match in CATEGORY_GROUPS
  const exactGroup = CATEGORY_GROUPS.find((g) => g.group === trimmed);
  if (exactGroup) return exactGroup.group;

  // 3. Subcategory item match
  for (const groupObj of CATEGORY_GROUPS) {
    if (groupObj.items.some((item) => item === trimmed || item.includes(trimmed) || trimmed.includes(item))) {
      return groupObj.group;
    }
  }

  // 4. Normalized alias match
  const normInput = normalizeArabicText(trimmed);
  for (const [alias, group] of Object.entries(CATEGORY_ALIASES)) {
    if (normalizeArabicText(alias) === normInput) {
      return group;
    }
  }

  // 5. Keyword search in groups
  for (const [groupName, keywords] of Object.entries(GROUP_KEYWORDS)) {
    if (keywords.some((kw) => normInput.includes(kw) || kw.includes(normInput))) {
      return groupName;
    }
  }

  return trimmed;
}

/**
 * Broad umbrella categories that naturally encompass multiple specific subcategories.
 * When a user filters by a subcategory, an umbrella business is an authentic match.
 */
const UMBRELLA_CATEGORIES: Record<string, string[]> = {
  // Umbrella: "متجر ملابس" encompasses men, women, and kids clothes
  'متجر ملابس': ['محل ملابس رجالي وبدل', 'محل ملابس حريمي وعبايات', 'محل ملابس أطفال ومواليد', 'محل أحذية وشنط وجلود'],
  'محل ملابس': ['محل ملابس رجالي وبدل', 'محل ملابس حريمي وعبايات', 'محل ملابس أطفال ومواليد', 'محل أحذية وشنط وجلود'],
  'ملابس': ['محل ملابس رجالي وبدل', 'محل ملابس حريمي وعبايات', 'محل ملابس أطفال ومواليد'],
  'clothing store': ['محل ملابس رجالي وبدل', 'محل ملابس حريمي وعبايات', 'محل ملابس أطفال ومواليد'],
  'مركز تسوق': ['محل ملابس رجالي وبدل', 'محل ملابس حريمي وعبايات', 'محل ملابس أطفال ومواليد', 'محل أحذية وشنط وجلود', 'سوبر ماركت / هايبر وبقالة'],
  'سوبر ماركت': ['سوبر ماركت / هايبر وبقالة', 'خضروات وفواكه طازجة', 'عطارة وتوابل / أعشاب طبيعية', 'جزارة / لحوم ودواجن وأسماك'],
  'سوبرماركت': ['سوبر ماركت / هايبر وبقالة', 'خضروات وفواكه طازجة', 'عطارة وتوابل / أعشاب طبيعية', 'جزارة / لحوم ودواجن وأسماك'],
  'هايبر ماركت': ['سوبر ماركت / هايبر وبقالة', 'خضروات وفواكه طازجة', 'أدوات منزلية ومطبخ', 'أجهزة كهربائية ومنزلية'],
  'مطعم': ['مطعم / مأكولات ومشويات'],
  'كافيه': ['كافيه / مقهى وكوفي شوب'],
  'مقهى': ['كافيه / مقهى وكوفي شوب'],
  'عيادة': ['عيادة طبية / مركز تخصصي'],
  'صالون حلاقة': ['صالون حلاقة رجالي وعناية'],
  'صالون تجميل': ['بيوتي سنتر وكوافير حريمي'],
  'فندق': ['فندق وشقق فندقية ومنتجعات'],
  'رياض أطفال': ['حضانة أطفال ورعاية نهارية'],
  'متجر أثاث': ['معرض أثاث وموبيليات منزلية'],
  'صالة رياضة': ['جيم وصالة لياقة بدنية (Fitness)'],
  'متجر هواتف جوالة': ['محل هواتف وصيانة موبايل وإكسسوارات'],
  'صيانة سيارات': ['مركز صيانة سيارات وميكانيكا'],
  'ميكانيكا': ['مركز صيانة سيارات وميكانيكا'],
};

/**
 * 🔍 Infer the parent Category Group for any given category string
 * Note: Accepts optional services array or string (for backwards compatibility), strictly isolating from address landmarks.
 */
export function getCategoryGroupFor(category?: string | null, servicesOrDesc?: string[] | string | null): string {
  if (!category && (!servicesOrDesc || (Array.isArray(servicesOrDesc) && servicesOrDesc.length === 0))) return 'أنشطة وخدمات عامة أخرى';

  const cleanCat = (category || '').trim();

  // 1. Direct match in CATEGORY_GROUPS items
  for (const groupObj of CATEGORY_GROUPS) {
    if (groupObj.items.includes(cleanCat)) {
      return groupObj.group;
    }
  }

  // 2. Keyword match in category
  const normCat = normalizeArabicText(cleanCat);
  if (normCat) {
    for (const [groupName, keywords] of Object.entries(GROUP_KEYWORDS)) {
      if (keywords.some((kw) => normCat.includes(kw))) {
        return groupName;
      }
    }
  }

  // 3. Keyword match in dedicated services tags (if array passed)
  if (Array.isArray(servicesOrDesc) && servicesOrDesc.length > 0) {
    const normServices = normalizeArabicText(servicesOrDesc.join(' '));
    if (normServices) {
      for (const [groupName, keywords] of Object.entries(GROUP_KEYWORDS)) {
        if (keywords.some((kw) => normServices.includes(kw))) {
          return groupName;
        }
      }
    }
  }

  return 'أنشطة وخدمات عامة أخرى';
}

export interface BusinessOrLeadEntity {
  category?: string | null;
  businessCategory?: string | null;
  description?: string | null;
  notes?: string | null;
  nameAr?: string | null;
  businessName?: string | null;
  services?: string[] | null;
}

/**
 * ⚡ Multi-Layer Precise Category Matching Engine
 * Matches a business or lead against a category filter:
 * 1. Exact string or normalized substring match on category field
 * 2. Group-level match (when filter is a group name)
 * 3. Umbrella category match (e.g. "متجر ملابس" matches "ملابس رجالي")
 * 4. Dedicated services tags match
 * (Addresses, landmarks, descriptions, and notes are strictly excluded to avoid false positives)
 */
export function matchesCategoryFilter(
  entity: BusinessOrLeadEntity,
  categoryFilter: string
): boolean {
  if (!categoryFilter || categoryFilter === 'all') return true;

  const rawCat = (entity.category || entity.businessCategory || '').trim();
  const normCat = normalizeArabicText(rawCat);
  const normFilter = normalizeArabicText(categoryFilter);

  // 1. Direct exact or substring match in category field
  if (rawCat === categoryFilter || (normCat && normFilter && (normCat.includes(normFilter) || normFilter.includes(normCat)))) {
    return true;
  }

  // 2. Check if categoryFilter is one of the main groups (e.g. 'الملابس والأزياء والإكسسوارات')
  const matchedGroup = CATEGORY_GROUPS.find((g) => g.group === categoryFilter);
  if (matchedGroup) {
    // 2a. Does the category explicitly belong to this group's items?
    if (matchedGroup.items.some((item) => item === rawCat || item.includes(rawCat) || rawCat.includes(item))) {
      return true;
    }

    // 2b. If category explicitly belongs to ANOTHER group, strictly reject!
    const explicitOtherGroup = CATEGORY_GROUPS.find(
      (g) => g.group !== categoryFilter && g.items.some((item) => item === rawCat || item.includes(rawCat) || rawCat.includes(item))
    );
    if (explicitOtherGroup) {
      return false;
    }

    // 2c. Inferred group check on category and services
    const inferredGroup = getCategoryGroupFor(rawCat, entity.services);
    if (inferredGroup === categoryFilter) {
      return true;
    }
    // Strict Negative Boundary: If inferred group is a specific other taxonomy group, reject!
    if (inferredGroup && inferredGroup !== 'أنشطة وخدمات عامة أخرى' && inferredGroup !== categoryFilter) {
      return false;
    }

    // 2d. Check keywords in category or dedicated services
    const keywords = GROUP_KEYWORDS[categoryFilter] || [];
    const categoryAndServicesText = normalizeArabicText(
      `${rawCat} ${(entity.services || []).join(' ')}`
    );

    if (keywords.some((kw) => categoryAndServicesText.includes(kw))) {
      return true;
    }

    return false;
  }

  // 3. CategoryFilter is a specific subcategory (e.g. 'محل ملابس رجالي وبدل')
  // 3a. Umbrella matching: If entity has broad umbrella category (e.g. "متجر ملابس"), check if it encompasses this subcategory
  for (const [umbrella, children] of Object.entries(UMBRELLA_CATEGORIES)) {
    const normUmbrella = normalizeArabicText(umbrella);
    if (normCat.includes(normUmbrella)) {
      if (children.some((child) => child === categoryFilter || normalizeArabicText(child) === normFilter)) {
        return true;
      }
    }
  }

  // 3b. Dedicated services tags check
  if (entity.services && entity.services.length > 0) {
    const normServices = normalizeArabicText(entity.services.join(' '));
    if (normServices.includes(normFilter)) {
      return true;
    }
  }

  return false;
}
