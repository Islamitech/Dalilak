/**
 * Venue Context & Semantic Description Utilities
 * Handles contextual naming (المحل، العيادة، المتجر...), official verification seals,
 * and automated marketing descriptions in standard professional Arabic.
 */

// Direct directory URL
export const DIRECTORY_URL = 'https://www.dalilaak.com/?ref=app';

/**
 * Official Institutional Header - Universal across Egypt
 * Strictly confidential internal launch zone, zero regional restrictions.
 */
export const OFFICIAL_PLATFORM_HEADER = 'منصة «دليلك» للخدمات والأعمال التجارية والتسويق الرقمي';

/**
 * Helper to get contextual humanized venue label instead of generic 'نشاط'
 */
export function getVenueContextLabel(category?: string): string {
  if (!category) return 'المكان';
  const cat = category.toLowerCase();
  if (
    cat.includes('مطعم') ||
    cat.includes('مأكولات') ||
    cat.includes('كافيه') ||
    cat.includes('مقهى') ||
    cat.includes('حلواني') ||
    cat.includes('مخبز') ||
    cat.includes('عصائر')
  ) {
    return 'المحل';
  }
  if (
    cat.includes('ملابس') ||
    cat.includes('أحذية') ||
    cat.includes('سوبرماركت') ||
    cat.includes('ماركت') ||
    cat.includes('تجزئة') ||
    cat.includes('بقالة') ||
    cat.includes('متجر') ||
    cat.includes('محل')
  ) {
    return 'المتجر';
  }
  if (
    cat.includes('عيادة') ||
    cat.includes('طبيب') ||
    cat.includes('دكتور') ||
    cat.includes('أسنان') ||
    cat.includes('عيادات') ||
    cat.includes('مركز طبي') ||
    cat.includes('مستشفى') ||
    cat.includes('معمل')
  ) {
    return 'العيادة';
  }
  if (cat.includes('صيدلية') || cat.includes('صيدليات') || cat.includes('دواء')) {
    return 'الصيدلية';
  }
  if (
    cat.includes('محام') ||
    cat.includes('استشار') ||
    cat.includes('عقار') ||
    cat.includes('هندسي') ||
    cat.includes('مكتب') ||
    cat.includes('محاسب')
  ) {
    return 'المكتب';
  }
  if (
    cat.includes('شركة') ||
    cat.includes('مصنع') ||
    cat.includes('ورشة') ||
    cat.includes('مركز صيانة') ||
    cat.includes('معرض') ||
    cat.includes('مؤسسة')
  ) {
    return 'المنشأة';
  }
  return 'المكان';
}

/**
 * Bank of Exclusive Dalelak Official Verification Badges
 */
export const DALELAK_SEALS = [
  'منشأة معتمدة بالدليل',
  'إدراج موثق بالمنظومة',
  'منشأة مسجلة ومعتمدة',
];

/**
 * Automated Fallback Description Generator in Standard Professional Arabic
 * With Immutability & Custom Override Guard:
 * If manual description is provided, it is returned strictly untouched.
 */
export function generateSmartBusinessDescription(category?: string, manualDescription?: string): string {
  // Strict Guard: User/Rep custom text is 100% immutable
  if (manualDescription && manualDescription.trim().length > 0) {
    return manualDescription.trim();
  }

  const cat = (category || '').toLowerCase();
  let baseDesc = 'خدمة راقية وجودة مضمونة تهتم بأدق التفاصيل لتوفير تجربة متميزة تلبي تطلعات العملاء.';

  if (
    cat.includes('مطعم') ||
    cat.includes('مأكولات') ||
    cat.includes('أكل') ||
    cat.includes('مشويات') ||
    cat.includes('بيتزا') ||
    cat.includes('شاورما') ||
    cat.includes('حلواني') ||
    cat.includes('مخبز')
  ) {
    baseDesc = 'أشهى المأكولات وقائمة أطباق متنوعة بأعلى معايير الجودة والضيافة.';
  } else if (cat.includes('كافيه') || cat.includes('مقهى') || cat.includes('عصائر') || cat.includes('قهوة')) {
    baseDesc = 'تشكيلة مختارة من المشروبات الساخنة والباردة والمخبوزات في أجواء مريحة وخدمة راقية.';
  } else if (
    cat.includes('ملابس') ||
    cat.includes('أزياء') ||
    cat.includes('أحذية') ||
    cat.includes('شنط') ||
    cat.includes('موضة')
  ) {
    baseDesc = 'أحدث خطوط الموضة وأجود الخامات بتشكيلة واسعة تناسب كافة الأذواق وبأفضل قيمة.';
  } else if (
    cat.includes('عيادة') ||
    cat.includes('طبيب') ||
    cat.includes('دكتور') ||
    cat.includes('أسنان') ||
    cat.includes('عيادات') ||
    cat.includes('مركز طبي')
  ) {
    baseDesc = 'رعاية طبية متكاملة بأحدث أجهزة الكشف والتشخيص بأعلى درجات العناية والاهتمام بصحة الأسرة.';
  } else if (cat.includes('صيدلية') || cat.includes('صيدليات') || cat.includes('دواء')) {
    baseDesc = 'توفير كافة الأصناف الدوائية ومستحضرات العناية الصحية مع استشارة صيدلية متخصصة وخدمة سريعة.';
  } else if (
    cat.includes('سوبرماركت') ||
    cat.includes('ماركت') ||
    cat.includes('بقالة') ||
    cat.includes('خضار') ||
    cat.includes('ألبان')
  ) {
    baseDesc = 'توفير كافة مستلزمات المنزل والأسرة بأعلى معايير الجودة وتنوع مستمر يلبي كافة الاحتياجات.';
  } else if (
    cat.includes('حرف') ||
    cat.includes('ورشة') ||
    cat.includes('صيانة') ||
    cat.includes('سباك') ||
    cat.includes('كهربا') ||
    cat.includes('نجار') ||
    cat.includes('سيارات')
  ) {
    baseDesc = 'خدمات صيانة متخصصة بدقة والتزام بأيدي فنيين محترفين وبأحدث التجهيزات مع ضمان الجودة.';
  } else if (
    cat.includes('عقار') ||
    cat.includes('محام') ||
    cat.includes('محاسب') ||
    cat.includes('مكتب') ||
    cat.includes('استشار')
  ) {
    baseDesc = 'استشارات مهنية موثوقة وخبرة متقدمة لدعم قراراتكم بأعلى معايير الأمان والاحترافية.';
  } else if (
    cat.includes('صالون') ||
    cat.includes('حلاقة') ||
    cat.includes('بيوتي') ||
    cat.includes('كوافير') ||
    cat.includes('تجميل')
  ) {
    baseDesc = 'خدمات العناية والتصفيف الاحترافي بأيدي متخصصين مع الالتزام بأعلى معايير النظافة والراحة.';
  } else if (cat.includes('موبايل') || cat.includes('إلكترون') || cat.includes('كمبيوتر') || cat.includes('أجهزة')) {
    baseDesc = 'أحدث الأجهزة والإلكترونيات ومستلزماتها المعتمدة مع خدمات صيانة سريعة وموثوقة.';
  }

  return baseDesc;
}
