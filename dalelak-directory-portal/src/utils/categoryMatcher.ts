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

export interface BusinessOrLeadEntity {
  id?: string;
  category?: string | null;
  businessCategory?: string | null;
  description?: string | null;
  notes?: string | null;
  nameAr?: string | null;
  nameEn?: string | null;
  businessName?: string | null;
  services?: string[] | null;
}

/**
 * ⚡ Precision Multi-Layer Category Matching Engine
 * Strictly prevents landmark/address contamination (NEVER matches location landmarks like "بجوار صيدلية" or "فوق كافيه").
 * Matches ONLY the explicit category field and structured services tags.
 */
export function matchesCategoryFilter(
  entity: BusinessOrLeadEntity,
  categoryFilter: string
): boolean {
  if (!categoryFilter || categoryFilter === 'all') return true;

  const rawCat = (entity.category || entity.businessCategory || '').trim();
  if (!rawCat) return false;

  const resolvedTargetGroup = resolveCanonicalCategoryGroup(categoryFilter);
  const normCat = normalizeArabicText(rawCat);
  const normFilter = normalizeArabicText(categoryFilter);
  const normTarget = normalizeArabicText(resolvedTargetGroup);

  // 1. Exact direct matches
  if (
    rawCat === categoryFilter ||
    rawCat === resolvedTargetGroup ||
    normCat === normFilter ||
    normCat === normTarget
  ) {
    return true;
  }

  // 1b. Direct canonical alias match
  const catAlias = CATEGORY_ALIASES[rawCat];
  if (catAlias && (catAlias === categoryFilter || catAlias === resolvedTargetGroup)) {
    return true;
  }

  // 2. Resolve Entity's own Group
  const entityGroup = resolveCanonicalCategoryGroup(rawCat);
  if (entityGroup && entityGroup === resolvedTargetGroup) {
    return true;
  }

  // 2b. If the entity's category explicitly belongs to ANOTHER known group, strictly REJECT!
  if (entityGroup && entityGroup !== 'أنشطة وخدمات عامة أخرى' && entityGroup !== resolvedTargetGroup) {
    return false;
  }

  // 3. Match against structured services tags (if any exist)
  if (Array.isArray(entity.services) && entity.services.length > 0) {
    const servicesText = normalizeArabicText(entity.services.join(' '));
    const targetKeywords = GROUP_KEYWORDS[resolvedTargetGroup] || [];
    if (targetKeywords.some((kw) => kw.length >= 3 && servicesText.includes(kw))) {
      return true;
    }
  }

  return false;
}
