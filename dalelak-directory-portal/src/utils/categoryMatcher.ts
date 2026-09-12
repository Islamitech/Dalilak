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
  'طبي وصيدلي': 'العيادات والرعاية الصحية والطبية',
  'رعاية صحية': 'العيادات والرعاية الصحية والطبية',
  'أطباء وعيادات': 'العيادات والرعاية الصحية والطبية',
  'صيدليات': 'العيادات والرعاية الصحية والطبية',
  'سيارات وصيانة': 'السيارات والمركبات والصيانة',
  'سيارات': 'السيارات والمركبات والصيانة',
  'صيانة سيارات': 'السيارات والمركبات والصيانة',
  'تجميل وعناية': 'التجميل والعناية الشخصية واللياقة',
  'حلاقة وكوافير': 'التجميل والعناية الشخصية واللياقة',
  'جيم ولياقة': 'التجميل والعناية الشخصية واللياقة',
  'ملابس وأزياء': 'الملابس والأزياء والإكسسوارات',
  'أزياء وموضة': 'الملابس والأزياء والإكسسوارات',
  'أحذية وجلود': 'الملابس والأزياء والإكسسوارات',
  'إلكترونيات وهواتف': 'الهواتف والإلكترونيات والكمبيوتر',
  'هواتف وموبايل': 'الهواتف والإلكترونيات والكمبيوتر',
  'كمبيوتر ولابتوب': 'الهواتف والإلكترونيات والكمبيوتر',
  'أثاث وديكور': 'الأثاث والديكور والمنزل',
  'أدوات منزلية': 'الأثاث والديكور والمنزل',
  'خدمات ومكاتب': 'الشركات والخدمات والمكاتب المهنية',
  'شركات ومقاولات': 'الشركات والخدمات والمكاتب المهنية',
  'خدمات مهنية': 'الشركات والخدمات والمكاتب المهنية',
  'مكتبات وطباعة': 'المكتبات والأدوات المدرسية والطباعة',
  'أدوات مدرسية': 'المكتبات والأدوات المدرسية والطباعة',
  'تعليم وتدريب': 'التعليم والتدريب وتنمية المهارات',
  'مدارس وحضانات': 'التعليم والتدريب وتنمية المهارات',
  'حرف وصيانة فنية': 'الحرف والورش والصيانة الفنية',
  'خدمات منزلية': 'الحرف والورش والصيانة الفنية',
  'سباكة وكهرباء': 'الحرف والورش والصيانة الفنية',
  'سياحة وفنادق': 'السياحة والفنادق والمناسبات',
  'فنادق ومناسبات': 'السياحة والفنادق والمناسبات',
  'أنشطة عامة': 'أنشطة وخدمات عامة أخرى',
  'متجر ملابس': 'الملابس والأزياء والإكسسوارات',
  'محل ملابس': 'الملابس والأزياء والإكسسوارات',
  'مكتبات': 'المكتبات والأدوات المدرسية والطباعة',
  'مكتبة': 'المكتبات والأدوات المدرسية والطباعة',
  'طباعة وتصوير': 'المكتبات والأدوات المدرسية والطباعة',
  'موبايل وهواتف': 'الهواتف والإلكترونيات والكمبيوتر',
  'صيانة موبايل': 'الهواتف والإلكترونيات والكمبيوتر',
};

/**
 * 🏷️ Deep Semantic & Synonym Keywords mapping for each main category group in Dalelak
 * Includes Arabic roots, common spellings, Egyptian colloquialisms, and English equivalents.
 */
export const GROUP_KEYWORDS: Record<string, string[]> = {
  'المطاعم والأغذية والمشروبات': [
    'مطعم', 'اكل', 'ماكولات', 'مشويات', 'شاورما', 'كافيه', 'مقهى', 'كوفي', 'قهوة',
    'مخبز', 'حلواني', 'حلويات', 'معجنات', 'سوبر ماركت', 'ماركت', 'هايبر', 'بقالة',
    'عصائر', 'عصير', 'ايس كريم', 'جيلاتي', 'جزارة', 'لحوم', 'لحمة', 'دواجن', 'فراخ',
    'اسماك', 'سمك', 'فسخاني', 'عطارة', 'بهارات', 'توابل', 'خضار', 'فواكه', 'فاكهة',
    'محمص', 'مكسرات', 'تسالي', 'بن', 'فول', 'طعمية', 'كشري', 'بيتزا', 'برجر', 'فطير',
    'وجبات', 'سندوتشات', 'سندوتش', 'تيك اواي', 'دليفري', 'شاي', 'نسكافيه', 'مطابخ',
    'شوكولاتة', 'كيك', 'تورتة', 'شاي بلبن', 'مطاعم', 'اغذية', 'مشروبات', 'food',
    'restaurant', 'cafe', 'coffee', 'bakery', 'supermarket', 'market', 'grocery', 'pizza', 'burger'
  ],
  'العيادات والرعاية الصحية والطبية': [
    'عيادة', 'طبيب', 'دكتور', 'مركز طبي', 'صحي', 'صحة', 'اسنان', 'عيون', 'بصريات',
    'نظارات', 'جلدية', 'تجميل', 'ليزر', 'اطفال', 'ولادة', 'نساء', 'باطنة', 'قلب',
    'صدر', 'انف واذن', 'تغذية', 'عظام', 'مفاصل', 'علاج طبيعي', 'صيدلية', 'صيدليات',
    'دواء', 'ادوية', 'معمل', 'تحاليل', 'اشعة', 'مستشفى', 'مستشفيات', 'مجمع طبي',
    'بيطري', 'حيوانات', 'علاج', 'تمريض', 'اسعاف', 'حضانة اطفال مبتسرين', 'clinic',
    'hospital', 'pharmacy', 'doctor', 'dental', 'dentist', 'medical', 'health', 'lab'
  ],
  'الملابس والأزياء والإكسسوارات': [
    'ملابس', 'ازياء', 'موضة', 'متجر ملابس', 'محل ملابس', 'رجالي', 'بدل', 'قميص',
    'بنطلون', 'حريمي', 'فساتين', 'فستان', 'عبايات', 'عباية', 'اطفال', 'مواليد', 'بيبي',
    'احذية', 'حذاء', 'جزم', 'كوتشي', 'شنط', 'شنطة', 'حقائب', 'جلود', 'مجوهرات',
    'ذهب', 'فضة', 'صاغة', 'جواهرجي', 'ساعات', 'ساعة', 'نظارات شمسية', 'مستحضرات تجميل',
    'ميكب', 'مكياج', 'عطور', 'عطر', 'برفيوم', 'بخور', 'لانجري', 'طرح', 'ايشاربات',
    'خياطة', 'ترزي', 'اتيليه', 'clothing', 'clothes', 'fashion', 'shoes', 'jewelry', 'perfume', 'wear'
  ],
  'الهواتف والإلكترونيات والكمبيوتر': [
    'هاتف', 'هواتف', 'موبايل', 'موبايلات', 'جوال', 'تليفون', 'صيانة موبايل', 'اكسسوارات',
    'كمبيوتر', 'حاسوب', 'لابتوب', 'حاسب', 'شبكات', 'طابعات', 'احبار', 'اجهزة كهربائية',
    'اجهزة منزلية', 'دش', 'ستالايت', 'كاميرات مراقبة', 'امن', 'شاشات', 'تلفزيون',
    'الكترونيات', 'بلايستيشن', 'العاب فيديو', 'شواحن', 'سماعات', 'كابلات',
    'phone', 'mobile', 'computer', 'laptop', 'electronics', 'camera', 'screen'
  ],
  'السيارات والمركبات والصيانة': [
    'سيارات', 'سيارة', 'عربيات', 'عربية', 'معرض سيارات', 'ميكانيكا', 'ميكانيكي',
    'صيانة سيارات', 'كهرباء سيارات', 'تكييف سيارات', 'مغسلة سيارات', 'كار ووش', 'ديتيلينج',
    'تلميع', 'كاوتش', 'اطارات', 'بطاريات', 'بطارية', 'ضبط زوايا', 'ترصيص', 'قطع غيار',
    'زيوت', 'شحوم', 'تغيير زيت', 'موتوسيكلات', 'موتوسيكل', 'سكوتر', 'فيسبا', 'سمكري',
    'دوكو', 'عفشة', 'شكمان', 'ريداتير', 'فرامل', 'car', 'cars', 'auto', 'automotive', 'mechanic', 'motors', 'tires'
  ],
  'التجميل والعناية الشخصية واللياقة': [
    'حلاقة', 'حلاق', 'صالون', 'صالونات', 'كوافير', 'بيوتي سنتر', 'عناية بالبشرة',
    'عناية بالشعر', 'سبا', 'جاكوزي', 'حمام مغربي', 'سونا', 'جيم', 'صالة لياقة', 'فتنس',
    'رياضة', 'ملاعب', 'اكاديمية رياضية', 'مساج', 'تخسيس', 'رشاقة', 'كمال اجسام',
    'salon', 'barber', 'spa', 'gym', 'fitness', 'beauty'
  ],
  'الأثاث والديكور والمنزل': [
    'اثاث', 'موبيليا', 'غرف نوم', 'سفرة', 'انتريه', 'صالون', 'مفروشات', 'ستائر',
    'سجاد', 'موكيت', 'ادوات منزلية', 'مطبخ', 'مطابخ', 'دهانات', 'بويات', 'ديكور',
    'ديكورات', 'ورق حائط', 'جبس بورد', 'اضاءة', 'نجف', 'اباجورات', 'ادوات صحية',
    'سباكة معمارية', 'سيراميك', 'بورسلين', 'رخام', 'جرانيت', 'دريسنج روم', 'furniture', 'decor', 'kitchen', 'home'
  ],
  'الشركات والخدمات والمكاتب المهنية': [
    'شركة', 'شركات', 'مكتب', 'تجارة', 'محاماة', 'محامي', 'استشارات قانونية', 'محاسبة',
    'محاسب', 'ضرائب', 'مقاولات', 'تشطيبات', 'بناء', 'عمارة', 'تسويق', 'تسويق الكتروني',
    'دعاية', 'اعلان', 'ترجمة', 'ترجمة معتمدة', 'فيزا', 'سفر', 'عقارات', 'تسويق عقاري',
    'سمسار', 'شحن', 'توصيل', 'نقل عفش', 'ستوديو', 'تصوير', 'فوتوجرافي', 'ديزاين', 'تصميم'
  ],
  'المكتبات والأدوات المدرسية والطباعة': [
    'مكتبة', 'مكتبات', 'ادوات مدرسية', 'قرطاسية', 'تصوير مستندات', 'طباعة', 'طباعة ديجيتال',
    'زنكوجراف', 'كتب', 'روايات', 'ادوات هندسية', 'رسم', 'العاب اطفال', 'هدايا',
    'تغليف هدايا', 'مستلزمات مناسبات', 'خدمات طالب', 'ملازم', 'bookstore', 'stationery', 'printing'
  ],
  'التعليم والتدريب وتنمية المهارات': [
    'حضانة', 'روضة', 'مدرسة', 'مدارس', 'تعليم', 'دروس', 'سنتر تعليمي', 'كورسات',
    'لغات', 'انجليزي', 'برمجة', 'تدريب', 'اكاديمية', 'مركز تدريب', 'تاسيس اطفال',
    'تخاطب', 'صعوبات تعلم', 'school', 'academy', 'training', 'education', 'courses'
  ],
  'الحرف والورش والصيانة الفنية': [
    'حدادة', 'حداد', 'كريتال', 'نجارة', 'نجار', 'خشب', 'الوميتال', 'زجاج', 'صيانة تكييف',
    'تكييفات', 'تبريد', 'غسالات', 'ثلاجات', 'سباك', 'سباكة', 'كهربائي', 'كهرباء منازل',
    'مغسلة ملابس', 'دراي كلين', 'مكوجي', 'تصليح', 'فني', 'ورشة', 'ورش', 'صنايعي',
    'workshop', 'laundry', 'plumber', 'electrician'
  ],
  'السياحة والفنادق والمناسبات': [
    'فندق', 'فنادق', 'شقق فندقية', 'منتجع', 'قرية سياحية', 'قاعة مناسبات', 'قاعة افراح',
    'افراح', 'حفلات', 'تنظيم حفلات', 'مؤتمرات', 'حجز رحلات', 'سياحة', 'طيران', 'hotel', 'resort', 'tourism'
  ],
  'أنشطة وخدمات عامة أخرى': [
    'مشتل', 'زهور', 'ورد', 'نباتات', 'محطة وقود', 'بنزينة', 'غاز', 'خيرية',
    'مؤسسة اهلية', 'خدمات عامة', 'مصلحة'
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
    if (groupObj.items.includes(trimmed)) {
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
 * 🔍 Infer the parent Category Group for any given category string or description
 */
export function getCategoryGroupFor(category?: string | null, description?: string | null): string {
  if (!category && !description) return 'أنشطة وخدمات عامة أخرى';

  const cleanCat = (category || '').trim();

  // 1. Direct match in CATEGORY_GROUPS items
  for (const groupObj of CATEGORY_GROUPS) {
    if (groupObj.items.includes(cleanCat)) {
      return groupObj.group;
    }
  }

  // 1b. Direct alias match
  if (CATEGORY_ALIASES[cleanCat]) {
    return CATEGORY_ALIASES[cleanCat];
  }

  // 2. Keyword match in category (strictly check if category contains full keyword, never the reverse)
  const normCat = normalizeArabicText(cleanCat);
  if (normCat) {
    for (const [groupName, keywords] of Object.entries(GROUP_KEYWORDS)) {
      if (keywords.some((kw) => normCat.includes(kw))) {
        return groupName;
      }
    }
  }

  // 3. Keyword match in description
  const normDesc = normalizeArabicText(description);
  if (normDesc) {
    for (const [groupName, keywords] of Object.entries(GROUP_KEYWORDS)) {
      if (keywords.some((kw) => normDesc.includes(kw))) {
        return groupName;
      }
    }
  }

  return 'أنشطة وخدمات عامة أخرى';
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
 * ⚡ Multi-Layer Category Matching Engine
 * Matches a business or lead against a category filter:
 * 1. Resolves aliases ('مطاعم ومأكولات' -> 'المطاعم والأغذية والمشروبات')
 * 2. Exact or specific category match
 * 3. Group-level match (respects explicit taxonomy boundaries)
 */
export function matchesCategoryFilter(
  entity: BusinessOrLeadEntity,
  categoryFilter: string
): boolean {
  if (!categoryFilter || categoryFilter === 'all') return true;

  const resolvedGroup = resolveCanonicalCategoryGroup(categoryFilter);
  const rawCat = (entity.category || entity.businessCategory || '').trim();
  const normCat = normalizeArabicText(rawCat);
  const normFilter = normalizeArabicText(categoryFilter);
  const normResolved = normalizeArabicText(resolvedGroup);

  // 1. Direct exact match in category field or resolved group
  if (
    rawCat === categoryFilter ||
    rawCat === resolvedGroup ||
    normCat === normFilter ||
    normCat === normResolved
  ) {
    return true;
  }

  // 1b. Direct canonical alias match
  if (
    CATEGORY_ALIASES[rawCat] &&
    (CATEGORY_ALIASES[rawCat] === categoryFilter || CATEGORY_ALIASES[rawCat] === resolvedGroup)
  ) {
    return true;
  }

  // 2. Group-level Matching
  const targetGroup = resolvedGroup !== categoryFilter ? resolvedGroup : categoryFilter;
  const matchedGroup = CATEGORY_GROUPS.find((g) => g.group === targetGroup);

  if (matchedGroup) {
    // 2a. Does the category explicitly belong to this group's items?
    if (matchedGroup.items.includes(rawCat)) {
      return true;
    }

    // 2b. If the category explicitly belongs to ANOTHER group, strictly reject!
    const explicitOtherGroup = CATEGORY_GROUPS.find((g) => g.group !== targetGroup && g.items.includes(rawCat));
    if (explicitOtherGroup) {
      return false;
    }

    // 2c. Inferred group matches
    const inferredGroup = getCategoryGroupFor(rawCat, entity.description || entity.notes);
    if (inferredGroup === targetGroup) {
      return true;
    }

    // 2d. Deep keywords match in entity text (only if category isn't a known foreign entity)
    const keywords = GROUP_KEYWORDS[targetGroup] || [];
    const combinedEntityText = normalizeArabicText(
      `${rawCat} ${entity.nameAr || ''} ${entity.nameEn || ''} ${entity.businessName || ''} ${entity.description || ''} ${entity.notes || ''} ${(entity.services || []).join(' ')}`
    );

    if (keywords.some((kw) => kw.length >= 3 && combinedEntityText.includes(kw))) {
      return true;
    }

    return false;
  }

  // 3. Specific Subcategory Matching
  const targetGroupForSubcat = CATEGORY_GROUPS.find((g) => g.items.includes(categoryFilter))?.group;
  if (targetGroupForSubcat) {
    const explicitOtherGroup = CATEGORY_GROUPS.find((g) => g.group !== targetGroupForSubcat && g.items.includes(rawCat));
    if (explicitOtherGroup) {
      return false;
    }
  }

  // Check if entity mentions subcategory tokens
  const filterTokens = normFilter
    .split(/\s+/)
    .filter((tok) => tok.length >= 3 && !['محل', 'متجر', 'مركز', 'خدمات', 'بيع', 'شراء', 'عامة'].includes(tok));

  if (filterTokens.length > 0) {
    const combinedEntityText = normalizeArabicText(
      `${rawCat} ${entity.nameAr || ''} ${entity.description || ''} ${entity.notes || ''}`
    );

    const matchingTokensCount = filterTokens.filter((tok) => combinedEntityText.includes(tok)).length;
    if (matchingTokensCount >= Math.min(filterTokens.length, 2)) {
      return true;
    }
  }

  return false;
}

