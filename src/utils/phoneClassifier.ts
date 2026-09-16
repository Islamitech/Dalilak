/**
 * 📞 منظومة تصنيف وفلترة أرقام الهواتف الذكية (Phone Classifier & Filter Engine)
 * 
 * تتيح تصنيف كافة أرقام الهواتف الصادرة من Google Places API إلى:
 * 1. mobile: هواتف محمولة تدعم واتساب والاتصال المباشر (مثل شبكات مصر 010/011/012/015، والسعودية 05x).
 * 2. landline: أرقام أرضية ثابتة للمحافظات (02 القاهرة والجيزة، 03 الإسكندرية، وباقي كودات المحافظات).
 * 3. short_code: أرقام مختصرة وخطوط ساخنة (3 إلى 5 أرقام مثل 19xxx و 16xxx و 15xxx، والرقم الموحد 9200).
 * 4. none: أرقام مفقودة أو غير صالحة أو أرقام وهمية افتراضية.
 */

export type PhoneClassificationType = 'mobile' | 'landline' | 'short_code' | 'none';

export interface PhoneClassificationResult {
  rawPhone: string;
  cleanDigits: string;
  type: PhoneClassificationType;
  labelAr: string;
  badgeClass: string;
  isMobile: boolean;
  isLandline: boolean;
  isShortCode: boolean;
  hasValidNumber: boolean;
}

export interface PhoneFilterOptions {
  excludeNoPhone?: boolean;       // حجب المنشآت التي لا تحتوي أرقاماً
  excludeLandline?: boolean;      // حجب الأرقام الأرضية
  excludeShortCodes?: boolean;    // حجب الخطوط الساخنة والأرقام المختصرة
  onlyMobile?: boolean;           // حصر النتائج على المحمول والواتساب فقط
}

/**
 * يفحص وينظف السلسلة الرقمية من أي رموز أو فراغات أو كودات دولية
 */
export function extractCleanDigits(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/\D/g, '');
}

/**
 * فحص الأرقام الوهمية أو المكررة (Placeholders)
 */
export function isDummyOrEmpty(digits: string): boolean {
  if (!digits || digits.length < 3) return true;
  if (/^(.)\1+$/.test(digits)) return true;
  if (['01000000000', '01100000000', '01200000000', '01500000000', '00000000000'].includes(digits)) {
    return true;
  }
  return false;
}

/**
 * 🔍 المصنف الذكي لرقم الهاتف
 */
export function classifyPhoneNumber(phone?: string | null): PhoneClassificationResult {
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return {
      rawPhone: '',
      cleanDigits: '',
      type: 'none',
      labelAr: 'بدون رقم هاتف',
      badgeClass: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
      isMobile: false,
      isLandline: false,
      isShortCode: false,
      hasValidNumber: false,
    };
  }

  const raw = phone.trim();
  let digits = extractCleanDigits(raw);

  if (isDummyOrEmpty(digits)) {
    return {
      rawPhone: raw,
      cleanDigits: digits,
      type: 'none',
      labelAr: 'بدون رقم صالح',
      badgeClass: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
      isMobile: false,
      isLandline: false,
      isShortCode: false,
      hasValidNumber: false,
    };
  }

  let localDigits = digits;
  if (localDigits.startsWith('0020') && localDigits.length > 5) {
    localDigits = localDigits.slice(4);
  } else if (localDigits.startsWith('20') && localDigits.length > 5) {
    localDigits = localDigits.slice(2);
  } else if (localDigits.startsWith('00966') && localDigits.length > 6) {
    localDigits = localDigits.slice(5);
  } else if (localDigits.startsWith('966') && localDigits.length > 6) {
    localDigits = localDigits.slice(3);
  }

  // الخطوط الساخنة والأرقام المختصرة (Short Codes / Hotlines / 9200 / 800)
  const isEgyptHotline = (localDigits.length === 5 && /^1[5-9]/.test(localDigits)) || localDigits.length <= 5;
  const isSaudiUnified = localDigits.startsWith('9200') || localDigits.startsWith('800');
  
  if (isEgyptHotline || isSaudiUnified) {
    return {
      rawPhone: raw,
      cleanDigits: digits,
      type: 'short_code',
      labelAr: 'خط ساخن / مختصر ⚡',
      badgeClass: 'bg-purple-500/15 text-purple-600 border border-purple-500/30',
      isMobile: false,
      isLandline: false,
      isShortCode: true,
      hasValidNumber: true,
    };
  }

  // إضافة الصفر الناقص إن كان الرقم محلياً بدون 0
  if (localDigits.length === 10 && /^[1][0125]/.test(localDigits)) {
    localDigits = '0' + localDigits;
  } else if ((localDigits.length === 8 || localDigits.length === 9) && /^[23]/.test(localDigits)) {
    localDigits = '0' + localDigits;
  } else if (localDigits.length === 9 && /^[45689]/.test(localDigits)) {
    localDigits = '0' + localDigits;
  }


  // 1. الهواتف المحمولة المصرية الصريحة (010, 011, 012, 015 - 11 رقماً)
  const isEgyptMobile = /^01[0125][0-9]{8}$/.test(localDigits);
  if (isEgyptMobile) {
    return {
      rawPhone: raw,
      cleanDigits: digits,
      type: 'mobile',
      labelAr: 'محمول / واتساب 📱',
      badgeClass: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30',
      isMobile: true,
      isLandline: false,
      isShortCode: false,
      hasValidNumber: true,
    };
  }

  // 2. الأرقام الأرضية الثابتة المصرية والسعودية (تفحص قبل الجوال الخليجي لتجنب الخلط بين 050 الدقهلية و05x الخليج)
  const isEgyptLandline = /^(02|03|04[05678]|05[057]|06[245689]|08[2468]|09[23567])[0-9]{6,8}$/.test(localDigits);
  const isSaudiLandline = /^(01[1-7])[0-9]{7}$/.test(localDigits);

  if (isEgyptLandline || isSaudiLandline || localDigits.startsWith('02') || localDigits.startsWith('03')) {
    return {
      rawPhone: raw,
      cleanDigits: digits,
      type: 'landline',
      labelAr: 'هاتف أرضي ☎️',
      badgeClass: 'bg-amber-500/15 text-amber-600 border border-amber-500/30',
      isMobile: false,
      isLandline: true,
      isShortCode: false,
      hasValidNumber: true,
    };
  }

  // 3. الهواتف المحمولة الخليجية أو الدولية (05x لغير كودات مصر الأرضية)
  const isSaudiOrGulfMobile = /^05[0-9]{8}$/.test(localDigits) || /^5[0-9]{8}$/.test(localDigits);
  if (isSaudiOrGulfMobile) {
    return {
      rawPhone: raw,
      cleanDigits: digits,
      type: 'mobile',
      labelAr: 'محمول / واتساب 📱',
      badgeClass: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30',
      isMobile: true,
      isLandline: false,
      isShortCode: false,
      hasValidNumber: true,
    };
  }


  if (localDigits.length >= 9) {
    return {
      rawPhone: raw,
      cleanDigits: digits,
      type: 'mobile',
      labelAr: 'رقم اتصال 📞',
      badgeClass: 'bg-blue-500/15 text-blue-600 border border-blue-500/30',
      isMobile: true,
      isLandline: false,
      isShortCode: false,
      hasValidNumber: true,
    };
  }

  return {
    rawPhone: raw,
    cleanDigits: digits,
    type: 'short_code',
    labelAr: 'رقم مختصر ⚡',
    badgeClass: 'bg-purple-500/15 text-purple-600 border border-purple-500/30',
    isMobile: false,
    isLandline: false,
    isShortCode: true,
    hasValidNumber: true,
  };
}

/**
 * 🛡️ فحص هل الرقم مسموح به وفق شروط الفلترة المحددة
 */
export function isPhoneAllowedByFilter(
  phone: string | null | undefined,
  options: PhoneFilterOptions
): { allowed: boolean; reason?: string; classification: PhoneClassificationResult } {
  const classification = classifyPhoneNumber(phone);

  if (options.onlyMobile) {
    if (!classification.isMobile) {
      return {
        allowed: false,
        reason: 'تم استبعاده لأن الرقم ليس هاتفاً محمولاً (مطلوب موبايل/واتساب فقط)',
        classification,
      };
    }
    return { allowed: true, classification };
  }

  if (options.excludeNoPhone && classification.type === 'none') {
    return {
      allowed: false,
      reason: 'تم استبعاده لعدم توفر رقم هاتف مسجل للمنشأة',
      classification,
    };
  }

  if (options.excludeLandline && classification.type === 'landline') {
    return {
      allowed: false,
      reason: 'تم استبعاده لأن الرقم هاتف أرضي ثابت',
      classification,
    };
  }

  if (options.excludeShortCodes && classification.type === 'short_code') {
    return {
      allowed: false,
      reason: 'تم استبعاده لأن الرقم خط ساخن أو رقم مختصر',
      classification,
    };
  }

  return { allowed: true, classification };
}
