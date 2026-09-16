/**
 * 🗺️ منظومة الحصر الجغرافي الصارم والسياج الرقمي (Geo Boundary & Geofencing Guard)
 * 
 * تضمن عدم تسرب أو سحب أي منشأة تقع خارج النطاق الجغرافي المحدد بدقة:
 * 1. حساب المسافة المباشرة (Haversine Formula) بالكيلومتر بين إحداثيات المكان ومركز النطاق المختار.
 * 2. تطبيق نصف قطر أقصى صارم (3، 5، 8، 12، 15 كم) واستبعاد أي مكان يتجاوزه فوراً.
 * 3. الفحص النصي للعنوان لتجنب الأماكن ذات العناوين المتقاطعة من مدن أو محافظات أخرى بعيدة.
 */

export interface GeoLocationPoint {
  lat: number;
  lng: number;
}

export interface GeoBoundaryCheckOptions {
  strictBoundary: boolean;
  maxRadiusKm: number;
  hubLocation?: GeoLocationPoint;
  hubName?: string;
  hubGov?: string;
}

export interface GeoBoundaryCheckResult {
  withinBoundary: boolean;
  distanceKm?: number;
  distanceText?: string;
  rejectionReason?: string;
}

/**
 * حساب المسافة الدقيقة بين نقطتين جغرافيّتين بوحدة الكيلومتر (معادلة هافرسين Haversine)
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return 0;
  }
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * تنسيق المسافة نصياً بالعربية (مثل: 850 م أو 3.2 كم)
 */
export function formatLocalizedDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} م`;
  }
  return `${distanceKm.toFixed(1)} كم`;
}

/**
 * 🛡️ فحص انطباق المكان على الحدود الجغرافية الصارمة للنطاق
 */
export function evaluatePlaceGeoBoundary(
  placeLocation: { lat?: number; lng?: number },
  placeAddress: string | undefined,
  options: GeoBoundaryCheckOptions
): GeoBoundaryCheckResult {
  // إذا لم يتم تفعيل الحصر الصارم
  if (!options.strictBoundary) {
    return { withinBoundary: true };
  }

  // إذا كانت إحداثيات المكان ومركز النطاق متوفرة
  if (
    typeof placeLocation.lat === 'number' &&
    typeof placeLocation.lng === 'number' &&
    options.hubLocation &&
    typeof options.hubLocation.lat === 'number' &&
    typeof options.hubLocation.lng === 'number'
  ) {
    const distanceKm = calculateHaversineDistanceKm(
      options.hubLocation.lat,
      options.hubLocation.lng,
      placeLocation.lat,
      placeLocation.lng
    );

    const distanceText = formatLocalizedDistance(distanceKm);

    if (distanceKm > options.maxRadiusKm) {
      return {
        withinBoundary: false,
        distanceKm,
        distanceText,
        rejectionReason: `خارج النطاق الجغرافي المسموح (المسافة: ${distanceText}، الحد الأقصى: ${options.maxRadiusKm} كم)`,
      };
    }

    return {
      withinBoundary: true,
      distanceKm,
      distanceText,
    };
  }

  // فحص عنوان المكان في حال غياب الإحداثيات الدقيقة
  if (placeAddress && options.hubName) {
    const cleanAddr = placeAddress.toLowerCase();
    const cleanHub = options.hubName.toLowerCase();

    // التحقق من تعارض المدن الكبرى الصريح
    const conflictingCities: Record<string, string[]> = {
      'الإسكندرية': ['القاهرة', 'الجيزة', 'المنصورة', 'طنطا', 'أسوان', 'الأقصر'],
      'الشيخ زايد': ['الإسكندرية', 'المنصورة', 'طنطا', 'بورسعيد', 'أسوان', 'المعادي', 'مدينة نصر', 'التجمع'],
      'حدائق الأهرام': ['الإسكندرية', 'المنصورة', 'طنطا', 'بورسعيد', 'المعادي', 'مدينة نصر', 'التجمع'],
      'التجمع': ['الإسكندرية', 'الشيخ زايد', 'أكتوبر', 'الهرم', 'فيصل'],
      'مدينة نصر': ['الإسكندرية', 'الشيخ زايد', 'أكتوبر', 'الهرم', 'فيصل'],
      'المعادي': ['الإسكندرية', 'الشيخ زايد', 'أكتوبر'],
    };

    for (const [key, conflicts] of Object.entries(conflictingCities)) {
      if (cleanHub.includes(key)) {
        for (const conflict of conflicts) {
          if (cleanAddr.includes(conflict)) {
            return {
              withinBoundary: false,
              rejectionReason: `العنوان يقع في منطقة متعارضة (${conflict}) خارج نطاق (${cleanHub})`,
            };
          }
        }
      }
    }
  }

  return { withinBoundary: true };
}

/**
 * 📍 إحداثيات مركز حدائق الأهرام (الجيزة) المعتمدة في منصة دليلك
 */
export const HADAYEK_AL_AHRAM_CENTER: GeoLocationPoint & { name: string } = {
  lat: 29.9822,
  lng: 31.1165,
  name: 'حدائق الأهرام',
};

export interface HadayekScopeCheckResult {
  matches: boolean;
  distanceKm?: number;
  distanceText?: string;
  matchReason: 'coords' | 'text' | 'none';
}

/**
 * 🎯 فحص انطباق المنشأة على نطاق حدائق الأهرام الجغرافي (نصف قطر 8 كم)
 * 
 * - يعتمد أولاً وبدقة تامة على الإحداثيات الجغرافية (lat, lng) ومعادلة Haversine.
 * - إذا كانت المنشأة ضمن 8 كم من مركز حدائق الأهرام، يتم شملها فوراً بغض النظر عن الاسم أو المدينة المسجلة (حتى لو لم تُسجل باسم حدائق الأهرام).
 * - كإجراء احتياطي للمنشآت ذات الإحداثيات المفقودة أو الصفرية: يتم فحص النصوص (العنوان، الشارع، المعالم، الاسم، الوصف).
 */
export function isWithinHadayekAlAhramScope(
  business: {
    lat?: number | string | null;
    lng?: number | string | null;
    city?: string | null;
    street?: string | null;
    landmark?: string | null;
    governorate?: string | null;
    nameAr?: string | null;
    name?: string | null;
    description?: string | null;
    notes?: string | null;
  },
  radiusKm = 8
): HadayekScopeCheckResult {
  const numLat = typeof business.lat === 'number' ? business.lat : parseFloat(String(business.lat || ''));
  const numLng = typeof business.lng === 'number' ? business.lng : parseFloat(String(business.lng || ''));

  const hasValidCoords = !isNaN(numLat) && !isNaN(numLng) && (numLat !== 0 || numLng !== 0);

  if (hasValidCoords) {
    const dist = calculateHaversineDistanceKm(
      numLat,
      numLng,
      HADAYEK_AL_AHRAM_CENTER.lat,
      HADAYEK_AL_AHRAM_CENTER.lng
    );

    if (dist <= radiusKm) {
      return {
        matches: true,
        distanceKm: dist,
        distanceText: formatLocalizedDistance(dist),
        matchReason: 'coords',
      };
    }
    return {
      matches: false,
      distanceKm: dist,
      distanceText: formatLocalizedDistance(dist),
      matchReason: 'none',
    };
  }

  // في حال غياب الإحداثيات، فحص الكلمات المفتاحية في النصوص كإجراء احترازي
  const combinedText = [
    business.city,
    business.street,
    business.landmark,
    business.governorate,
    business.nameAr,
    business.name,
    business.description,
    business.notes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const hadayekKeywords = [
    'حدائق الاهرام',
    'حدائق الأهرام',
    'هضبة الاهرام',
    'هضبة الأهرام',
    'بوابة خفرع',
    'بوابة خوفو',
    'بوابة منقرع',
    'بوابة مينا',
    'بوابة حورس',
    'بوابة صولجان',
    'بوابة أحمس',
    'البوابة الاولى',
    'البوابة الأولى',
    'البوابة الثانية',
    'البوابة الثالثة',
    'البوابة الرابعة',
    'شارع الجيش',
    'الثروة المعدنية',
    'شارع الضغط',
  ];

  if (hadayekKeywords.some((keyword) => combinedText.includes(keyword))) {
    return {
      matches: true,
      matchReason: 'text',
    };
  }

  return {
    matches: false,
    matchReason: 'none',
  };
}

