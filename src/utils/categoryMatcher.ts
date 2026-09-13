import { CATEGORY_GROUPS } from '../data/mockData';
import { normalizeArabicText } from './arabicSearch';

/**
 * 🏷️ Keywords mapping for each main category group in Dalelak
 */
const GROUP_KEYWORDS: Record<string, string[]> = {
  'المطاعم والكافيهات والمأكولات': [
    'مطعم', 'اكل', 'ماكولات', 'مشويات', 'شاورما', 'كافيه', 'مقهى', 'كوفي',
    'مخبز', 'حلواني', 'حلويات', 'معجنات',
    'عصائر', 'ايس كريم', 'جيلاتي', 'فول', 'طعمية', 'كشري', 'بيتزا',
    'برجر', 'فطير', 'restaurant', 'cafe', 'bakery', 'pizza', 'burger'
  ],
  'السوبر ماركت والبقالة والتموين': [
    'سوبر ماركت', 'سوبرماركت', 'ماركت', 'هايبر', 'هايبر ماركت',
    'بقالة', 'ميني ماركت', 'جزارة', 'لحوم', 'دواجن', 'فراخ',
    'اسماك', 'سمك', 'فسخاني', 'عطارة', 'بهارات', 'توابل', 'خضار', 'فواكه',
    'محمص', 'مكسرات', 'تسالي', 'بن', 'قهوة', 'تموين',
    'supermarket', 'market', 'grocery', 'butcher'
  ],
  'العيادات والرعاية الصحية والطبية': [
    'عيادة', 'طبيب', 'دكتور', 'مركز طبي', 'صحي', 'اسنان', 'عيون', 'بصريات',
    'نظارات', 'جلدية', 'جراحة تجميل', 'عيادة تجميل', 'تجميل ليزر', 'ليزر', 'اطفال', 'ولادة', 'نساء', 'باطنة',
    'تغذية', 'عظام', 'مفاصل', 'علاج طبيعي', 'صيدلية', 'دواء', 'ادوية', 'معمل',
    'تحاليل', 'اشعة', 'مستشفى', 'مجمع طبي', 'بيطري', 'حيوانات', 'clinic', 'hospital', 'pharmacy', 'doctor'
  ],
  'الملابس والأزياء والإكسسوارات': [
    'ملابس', 'ازياء', 'موضة', 'متجر ملابس', 'محل ملابس', 'رجالي', 'بدل',
    'حريمي', 'عبايات', 'اطفال', 'مواليد', 'احذية', 'جزم', 'شنط', 'حقائب',
    'جلود', 'مجوهرات', 'ذهب', 'فضة', 'صاغة', 'ساعات', 'نظارات شمسية',
    'مستحضرات تجميل', 'ميكب', 'مكياج', 'عطور', 'برفيوم', 'بخور', 'لانجري',
    'طرح', 'ايشاربات', 'clothing', 'clothes', 'fashion', 'shoes', 'jewelry', 'perfume'
  ],
  'الهواتف والإلكترونيات والكمبيوتر': [
    'هاتف', 'هواتف', 'موبايل', 'جوال', 'صيانة موبايل', 'اكسسوارات', 'كمبيوتر',
    'لابتوب', 'حاسب', 'شبكات', 'طابعات', 'اجهزة كهربائية', 'منزلية', 'دش',
    'ستالايت', 'كاميرات مراقبة', 'امن', 'شاشات', 'تلفزيون', 'الكترونيات',
    'phone', 'mobile', 'computer', 'laptop', 'electronics'
  ],
  'السيارات والمركبات والصيانة': [
    'سيارات', 'سيارة', 'معرض سيارات', 'ميكانيكا', 'ميكانيكي', 'صيانة سيارات',
    'كهرباء سيارات', 'تكييف سيارات', 'مغسلة سيارات', 'ديتيلينج', 'تلميع',
    'كاوتش', 'اطارات', 'بطاريات', 'ضبط زوايا', 'قطع غيار', 'زيوت', 'شحوم',
    'موتوسيكلات', 'سكوتر', 'سمكري', 'دوكو', 'عفشة', 'شكمان', 'car', 'auto', 'mechanic', 'motors'
  ],
  'التجميل والعناية الشخصية واللياقة': [
    'حلاقة', 'صالون', 'كوافير', 'بيوتي سنتر', 'عناية بالبشرة', 'سبا', 'جاكوزي',
    'حمام مغربي', 'جيم', 'صالة لياقة', 'فتنس', 'fitness', 'رياضة', 'ملاعب',
    'اكاديمية رياضية', 'مساج', 'تخسيس', 'salon', 'barber', 'spa', 'gym'
  ],
  'الأثاث والديكور والمنزل': [
    'اثاث', 'موبيليا', 'مفروشات', 'ستائر', 'سجاد', 'ادوات منزلية', 'مطبخ',
    'مطابخ', 'دهانات', 'بويات', 'ديكور', 'ورق حائط', 'اضاءة', 'نجف',
    'ادوات صحية', 'سيراميك', 'بورسلين', 'رخام', 'دريسنج روم', 'furniture', 'decor', 'kitchen'
  ],
  'الشركات والخدمات والمكاتب المهنية': [
    'شركة', 'تجارة', 'محاماة', 'استشارات قانونية', 'محاسبة', 'ضرائب',
    'مقاولات', 'تشطيبات', 'بناء', 'تسويق', 'دعاية', 'اعلان', 'ترجمة',
    'فيزا', 'عقارات', 'تسويق عقاري', 'شحن', 'نقل عفش', 'ستوديو', 'تصوير', 'فوتوجرافي'
  ],
  'المكتبات والأدوات المدرسية والطباعة': [
    'مكتبة', 'ادوات مدرسية', 'قرطاسية', 'تصوير مستندات', 'طباعة', 'كتب',
    'روايات', 'ادوات هندسية', 'رسم', 'العاب اطفال', 'هدايا', 'تغليف',
    'مستلزمات مناسبات', 'خدمات طالب', 'ملازم', 'bookstore', 'stationery', 'printing'
  ],
  'التعليم والتدريب وتنمية المهارات': [
    'حضانة', 'روضة', 'مدرسة', 'تعليم', 'دروس', 'سنتر تعليمي', 'كورسات',
    'لغات', 'برمجة', 'تدريب', 'اكاديمية', 'school', 'academy', 'training', 'education'
  ],
  'الحرف والورش والصيانة الفنية': [
    'حدادة', 'كريتال', 'نجارة', 'خشب', 'الوميتال', 'زجاج', 'صيانة تكييف',
    'تبريد', 'سباك', 'كهربائي', 'مغسلة ملابس', 'دراي كلين', 'مكوجي', 'workshop', 'laundry'
  ],
  'السياحة والفنادق والمناسبات': [
    'فندق', 'شقق فندقية', 'منتجع', 'قاعة مناسبات', 'افراح', 'حفلات',
    'مؤتمرات', 'حجز رحلات', 'سياحة', 'hotel', 'resort', 'tourism'
  ],
  'أنشطة وخدمات عامة أخرى': [
    'مشتل', 'زهور', 'نباتات', 'محطة وقود', 'بنزينة', 'غاز', 'خيرية',
    'مؤسسة اهلية', 'خدمات عامة'
  ],
};

/**
 * Broad umbrella categories that naturally encompass multiple specific subcategories.
 * When a user filters by a subcategory, an umbrella business is an authentic match.
 */
const UMBRELLA_CATEGORIES: Record<string, string[]> = {
  // Umbrella: "متجر ملابس" encompasses men, women, and kids clothes
  'متجر ملابس': ['محل ملابس رجالي وبدل', 'محل ملابس حريمي وعبايات', 'محل ملابس أطفال ومواليد'],
  'محل ملابس': ['محل ملابس رجالي وبدل', 'محل ملابس حريمي وعبايات', 'محل ملابس أطفال ومواليد'],
  'ملابس': ['محل ملابس رجالي وبدل', 'محل ملابس حريمي وعبايات', 'محل ملابس أطفال ومواليد'],
  'clothing store': ['محل ملابس رجالي وبدل', 'محل ملابس حريمي وعبايات', 'محل ملابس أطفال ومواليد'],
  'مركز تسوق': ['محل ملابس رجالي وبدل', 'محل ملابس حريمي وعبايات', 'محل ملابس أطفال ومواليد', 'محل أحذية وشنط وجلود', 'سوبر ماركت / هايبر وبقالة'],
  'سوبر ماركت': ['سوبر ماركت / هايبر وبقالة', 'خضروات وفواكه طازجة', 'عطارة وتوابل / أعشاب طبيعية', 'جزارة / لحوم ودواجن وأسماك'],
  'هايبر ماركت': ['سوبر ماركت / هايبر وبقالة', 'خضروات وفواكه طازجة', 'أدوات منزلية ومطبخ', 'أجهزة كهربائية ومنزلية'],
  'مطعم': ['مطعم / مأكولات ومشويات'],
  'عيادة': ['عيادة طبية / مركز تخصصي'],
};

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

  // 2. Keyword match in category
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
  category?: string | null;
  businessCategory?: string | null;
  description?: string | null;
  notes?: string | null;
  nameAr?: string | null;
  businessName?: string | null;
  services?: string[] | null;
}

/**
 * ⚡ Multi-Layer Category Matching Engine
 * Matches a business or lead against a category filter:
 * 1. Exact string match
 * 2. Group-level match (when filter is a group name)
 * 3. Umbrella category match (e.g. "متجر ملابس" matches "ملابس رجالي")
 * 4. Semantic match in description, notes, services, or business name
 */
export function matchesCategoryFilter(
  entity: BusinessOrLeadEntity,
  categoryFilter: string
): boolean {
  if (!categoryFilter || categoryFilter === 'all') return true;

  const rawCat = (entity.category || entity.businessCategory || '').trim();
  const normCat = normalizeArabicText(rawCat);
  const normFilter = normalizeArabicText(categoryFilter);

  // 🛡️ CRITICAL TAXONOMY GUARD: Strict Mutual Exclusion between Restaurants & Supermarkets
  const isRestaurantFilter =
    categoryFilter === 'المطاعم والكافيهات والمأكولات' ||
    categoryFilter === 'المطاعم والأغذية والمشروبات' ||
    categoryFilter.includes('مطاعم') ||
    categoryFilter.includes('مطعم') ||
    categoryFilter.includes('مأكولات') ||
    categoryFilter.includes('كافيه');

  const isSupermarketFilter =
    categoryFilter === 'السوبر ماركت والبقالة والتموين' ||
    categoryFilter.includes('سوبر') ||
    categoryFilter.includes('ماركت') ||
    categoryFilter.includes('بقالة');

  const rawCombined = `${rawCat} ${entity.nameAr || ''} ${entity.businessName || ''}`.toLowerCase();
  const isSupermarketEntity =
    rawCat === 'سوبر ماركت / هايبر وبقالة' ||
    rawCat === 'سوبرماركت' ||
    rawCat === 'سوبر ماركت' ||
    rawCat === 'خضروات وفواكه طازجة' ||
    rawCat === 'جزارة / لحوم ودواجن وأسماك' ||
    rawCat === 'عطارة وتوابل / أعشاب طبيعية' ||
    rawCombined.includes('سوبر ماركت') ||
    rawCombined.includes('سوبرماركت') ||
    rawCombined.includes('ماركت') ||
    rawCombined.includes('هايبر') ||
    rawCombined.includes('بقالة');

  // If filtering by restaurants/cafes, NEVER return supermarkets/groceries!
  if (isRestaurantFilter && isSupermarketEntity) {
    return false;
  }

  // 1. Direct exact or substring match in category field
  if (rawCat === categoryFilter || (normCat && normFilter && normCat.includes(normFilter))) {
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

    // 2c. Inferred group check
    const inferredGroup = getCategoryGroupFor(rawCat, entity.description || entity.notes);
    if (inferredGroup === categoryFilter) {
      return true;
    }
    // 🛡️ Strict Negative Boundary: If inferred group is a specific other taxonomy group, reject!
    if (inferredGroup && inferredGroup !== 'أنشطة وخدمات عامة أخرى' && inferredGroup !== categoryFilter) {
      return false;
    }

    // 2d. Check if category or services text has group keywords (NEVER in nameAr)
    const keywords = GROUP_KEYWORDS[categoryFilter] || [];
    const categoryAndServicesText = normalizeArabicText(
      `${rawCat} ${(entity.services || []).join(' ')} ${entity.description || ''} ${entity.notes || ''}`
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

  // 3b. Dedicated services tags check (strictly excluding address, landmarks, description, and notes)
  if (entity.services && entity.services.length > 0) {
    const normServices = normalizeArabicText(entity.services.join(' '));
    if (normServices.includes(normFilter)) {
      return true;
    }
  }

  return false;
}

/**
 * 🌟 الأنشطة الرائجة: المنشآت التي تم تسجيلها بشكل مجاني / بدون تحصيل رسوم
 */
export const isTrendingFreeActivity = (b: {
  isFeeExempt?: boolean;
  packageId?: string;
  packagePrice?: number;
  paymentStatus?: string;
  amountPaid?: number;
  notes?: string;
}): boolean => {
  return Boolean(
    b.isFeeExempt ||
    b.packageId === 'pkg_free_directory' ||
    b.packageId === 'free_directory_listing' ||
    (b.packagePrice === 0) ||
    b.paymentStatus === 'exempt' ||
    b.paymentStatus === 'free' ||
    ((!b.amountPaid || b.amountPaid === 0) && (b.isFeeExempt || b.packagePrice === 0 || !b.paymentStatus || b.paymentStatus === 'unpaid')) ||
    b.notes?.includes('trending_free') ||
    b.notes?.includes('نشاط رائج') ||
    b.notes?.includes('مكان رائج') ||
    b.notes?.includes('مجاني')
  );
};

/**
 * 💳 الأنشطة ذات الفواتير المحصلة: المنشآت المسددة باقات مدفوعة
 */
export const isCollectedInvoiceActivity = (b: {
  paymentStatus?: string;
  amountPaid?: number;
  packagePrice?: number;
  invoiceNumber?: string;
  isFeeExempt?: boolean;
}): boolean => {
  if (b.isFeeExempt || (b.packagePrice || 0) === 0) return false;
  return Boolean(
    b.paymentStatus === 'fully_paid' ||
    ((b.amountPaid || 0) >= (b.packagePrice || 250) && (b.amountPaid || 0) > 0) ||
    ((b.amountPaid || 0) > 0 && Boolean(b.invoiceNumber))
  );
};
