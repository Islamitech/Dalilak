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
