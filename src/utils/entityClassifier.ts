/**
 * 🏛️ محرك التصنيف الجغرافي الصارم وفصل الكيانات (Entity Nature Classifier & Exclusion Engine)
 * يفصل بنسبة 100% بين:
 * 1. الأنشطة التجارية والخدمية (Commercial Businesses & Field Services)
 * 2. المجمعات والعمارات السكنية الخرسانية (Residential Buildings & Compounds)
 * 3. الطرق والبوابات والمرافق العامة (Roads, Gates & Urban Infrastructure)
 */

export type EntityBucket = 'COMMERCIAL_BUSINESS' | 'RESIDENTIAL_COMPLEX' | 'ROAD_INFRASTRUCTURE' | 'EXCLUDED_NON_COMMERCIAL';

export interface EntityClassificationResult {
  bucket: EntityBucket;
  isAllowedForIngestion: boolean;
  detectedType: string;
  reason: string;
}

// 🚫 1. القائمة السوداء الصارمة للتصنيفات السكنية الصامتة (Residential Exclusion Blacklist)
export const EXCLUDED_RESIDENTIAL_TYPES = new Set([
  'apartment_building',
  'apartment_complex',
  'housing_complex',
  'condominium_complex',
  'residential',
  'residential_area',
  'premise',
  'subpremise',
  'compound',
  'gated_community',
  'villa',
  'building',
]);

// 🚫 2. القائمة السوداء للطرق والمعالم والتقسيمات الجغرافية (Infrastructure Exclusion Blacklist)
export const EXCLUDED_INFRASTRUCTURE_TYPES = new Set([
  'route',
  'street_address',
  'intersection',
  'highway',
  'sublocality',
  'sublocality_level_1',
  'sublocality_level_2',
  'locality',
  'political',
  'neighborhood',
  'administrative_area_level_1',
  'administrative_area_level_2',
  'country',
  'postal_code',
  'bus_station',
  'bus_stop',
  'transit_station',
  'parking',
  'parking_lot',
  'toll_booth',
]);

// 🚫 3. الكيانات والمرافق المستبعدة افتراضياً
export const EXCLUDED_GENERAL_TYPES = new Set([
  'cemetery',
  'funeral_home',
]);

// 🛡️ 4. الأنماط اللغوية للسكنيات والشوارع التي تظهر ككيانات على الخريطة (Regex Patterns)
const RESIDENTIAL_NAME_REGEX = /^(عمارة|عماره|برج|مبنى|كمبوند|كومباوند|فيلا|سكن|مساكن|أبراج|ابراج)\s+(\d+|[أ-يa-z])/i;
const ROAD_GATE_NAME_REGEX = /^(شارع|طريق|محور|ميدان|تقاطع|كوبري|نفق|بوابة|بوابه|حدائق الأهرام\s*-\s*بوابة)\s+/i;
const PURE_NUMBERED_BUILDING = /^(عمارة|عماره)?\s*\d+\s*[أ-يa-z]?(\s*حدائق\s*الأهرام)?$/i;

// ✅ 5. الفئات التجارية والخدمية المعتمدة في الجدول التجاري الرسمي (Places Table A)
export const COMMERCIAL_PRIMARY_TYPES = new Set([
  // الأغذية والمشروبات والضيافة
  'restaurant', 'cafe', 'coffee_shop', 'bakery', 'meal_takeaway', 'meal_delivery',
  'fast_food_restaurant', 'ice_cream_shop', 'sandwich_shop', 'pastry_shop',
  
  // البقالة والتموين والتجزئة
  'supermarket', 'grocery_store', 'convenience_store', 'butcher_shop', 'fruit_and_vegetable_store',
  'market', 'store', 'department_store', 'shopping_mall', 'discount_store',
  
  // الصحة والجمال والصيدليات
  'pharmacy', 'dentist', 'doctor', 'hospital', 'medical_clinic', 'physiotherapist',
  'beauty_salon', 'hair_salon', 'barber_shop', 'spa', 'nail_salon',
  
  // الحرف والصيانة والسيارات
  'car_repair', 'auto_repair', 'car_wash', 'auto_parts_store', 'gas_station',
  'plumber', 'electrician', 'locksmith', 'laundry', 'dry_cleaner', 'painter',
  'hardware_store', 'home_improvement_store',
  
  // الأزياء والإلكترونيات والمفروشات
  'clothing_store', 'shoe_store', 'jewelry_store', 'electronics_store',
  'furniture_store', 'home_goods_store', 'book_store', 'stationery_store',
  'optician', 'pet_store', 'sporting_goods_store', 'toy_store',
  
  // اللياقة والترفيه
  'gym', 'fitness_center', 'sports_club', 'swimming_pool',
  
  // الخدمات المهنية والتعليمية
  'school', 'preschool', 'daycare', 'education_center',
  'bank', 'atm', 'post_office', 'insurance_agency', 'travel_agency',
  'lawyer', 'accountant', 'real_estate_agency', 'corporate_office'
]);

/**
 * الفاحص الجراحي لطبيعة الكيان:
 * يفحص الكيان ويعيد تقريراً حاسماً عما إذا كان نشاطاً تجارياً مؤهلاً أو كياناً مستبعداً
 */
export function classifyEntityNature(place: {
  id?: string;
  displayName?: { text?: string } | string;
  primaryType?: string;
  types?: string[];
  formattedAddress?: string;
}): EntityClassificationResult {
  const name = (typeof place.displayName === 'string' ? place.displayName : place.displayName?.text || '').trim();
  const primaryType = (place.primaryType || '').toLowerCase();
  const allTypes = (place.types || []).map((t) => t.toLowerCase());

  // 1. فحص الطرق والبوابات أولاً
  if (ROAD_GATE_NAME_REGEX.test(name) || allTypes.some((t) => EXCLUDED_INFRASTRUCTURE_TYPES.has(t))) {
    // استثناء إذا كان الاسم يحتوي على نشاط تجاري صريح (مثل: كافيه شارع الجيش)
    const hasCommercialIndicator = allTypes.some((t) => COMMERCIAL_PRIMARY_TYPES.has(t));
    if (!hasCommercialIndicator) {
      return {
        bucket: 'ROAD_INFRASTRUCTURE',
        isAllowedForIngestion: false,
        detectedType: primaryType || 'route',
        reason: 'طريق أو بوابة أو معلم بنية تحتية غير تجاري',
      };
    }
  }

  // 2. فحص العمارات والكتل السكنية الصامتة
  if (
    PURE_NUMBERED_BUILDING.test(name) ||
    (RESIDENTIAL_NAME_REGEX.test(name) && !allTypes.some((t) => COMMERCIAL_PRIMARY_TYPES.has(t))) ||
    allTypes.some((t) => EXCLUDED_RESIDENTIAL_TYPES.has(t))
  ) {
    const hasCommercialIndicator = allTypes.some((t) => COMMERCIAL_PRIMARY_TYPES.has(t));
    if (!hasCommercialIndicator) {
      return {
        bucket: 'RESIDENTIAL_COMPLEX',
        isAllowedForIngestion: false,
        detectedType: primaryType || 'residential',
        reason: 'عمارة أو مجمع سكني خرساني صامت (لا يحتوي نشاطاً تجارياً معتمداً)',
      };
    }
  }

  // 3. فحص الكيانات المستبعدة العامة
  if (allTypes.some((t) => EXCLUDED_GENERAL_TYPES.has(t))) {
    return {
      bucket: 'EXCLUDED_NON_COMMERCIAL',
      isAllowedForIngestion: false,
      detectedType: primaryType || 'general_excluded',
      reason: 'مرفق أو كيان غير تجاري مستبعد',
    };
  }

  // 4. التحقق من الصفة التجارية الإيجابية
  const isCommercialType = COMMERCIAL_PRIMARY_TYPES.has(primaryType) || allTypes.some((t) => COMMERCIAL_PRIMARY_TYPES.has(t));
  if (isCommercialType) {
    return {
      bucket: 'COMMERCIAL_BUSINESS',
      isAllowedForIngestion: true,
      detectedType: primaryType || 'commercial',
      reason: 'نشاط تجاري أو خدمي معتمد ومؤهل للإدراج في الدليل',
    };
  }

  // 5. في حال عدم وجود نوع واضح لكن الاسم يشير لنشاط تجاري معروف
  const commercialKeywords = ['محل', 'سوبرماركت', 'صيدلية', 'مطعم', 'كافيه', 'عيادة', 'صالون', 'مغسلة', 'ورشة', 'معرض', 'مكتب', 'سنتر', 'جيم', 'ماركت', 'مخبز', 'حلواني'];
  if (commercialKeywords.some((kw) => name.includes(kw))) {
    return {
      bucket: 'COMMERCIAL_BUSINESS',
      isAllowedForIngestion: true,
      detectedType: 'inferred_commercial',
      reason: 'نشاط تجاري مستنتج بدقة دلالية من اسم المنشأة',
    };
  }

  // الكيانات غير المحسومة تُعامل بحذر وتُستبعد لحماية نقاء الدليل
  return {
    bucket: 'EXCLUDED_NON_COMMERCIAL',
    isAllowedForIngestion: false,
    detectedType: primaryType || 'unknown_unverified',
    reason: 'كيان غير تجاري أو غير محسوم النشاط',
  };
}
