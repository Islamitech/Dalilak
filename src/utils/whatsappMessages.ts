function getActivePaymentConfig() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('dalelak_payment_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          vodafone1: parsed.vodafoneCashNumber || '01143888355',
          vodafone2: parsed.vodafoneCashNumber2 || '01556221141',
          instaPay: parsed.instaPayHandle || '@daz31181',
        };
      }
    }
  } catch {}
  return {
    vodafone1: '01143888355',
    vodafone2: '01556221141',
    instaPay: '@daz31181',
  };
}

import { Business, AdditionalServiceInvoice } from '../types';

// Direct directory URL
const DIRECTORY_URL = 'https://www.dalilaak.com/?ref=app';

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

export function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  if (trimmed.startsWith('+')) {
    return digits;
  }
  if (digits.startsWith('20')) {
    return digits;
  }
  const intlPrefixes = ['966', '971', '965', '968', '974', '973', '962', '218', '249', '1', '44', '49', '33'];
  if (intlPrefixes.some((p) => digits.startsWith(p)) && digits.length >= 10) {
    return digits;
  }
  const localClean = digits.replace(/^0+/, '');
  return `20${localClean}`;
}

export function cleanWhatsAppText(text: string): string {
  return text
    .replace(/[\uFE00-\uFE0F\u200B-\u200D\uFFFD\u00A0]/g, ' ')
    .replace(/\r\n/g, '\n')
    .trim();
}

export function safeWhatsAppEncode(text: string): string {
  const cleaned = cleanWhatsAppText(text);
  return encodeURIComponent(cleaned)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

// -----------------------------------------------------------------------------
// EVENT 0: WELCOME FOR ALREADY GOOGLE ACTIVE VENUES
// -----------------------------------------------------------------------------

export function generateWelcomeAlreadyOnGoogleWhatsAppMessage(biz: Business): string {
  const activeMapUrl = (biz.googleMapsUrl && biz.googleMapsUrl.trim().startsWith('http')) ? biz.googleMapsUrl.trim() : DIRECTORY_URL;
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;

  const raw = 
    `*مرحباً بكم في ${OFFICIAL_PLATFORM_HEADER}*
` +
    `-----------------------------------------
` +
    `• *اسم المكان:* ${venueName}
` +
    `• *المسؤول / العميل:* ${biz.ownerName || 'المحترم'}
` +
    `• *النطاق الجغرافي:* ${biz.governorate || ''} - ${biz.city || ''}
` +
    `• *رقم الملف:* ${biz.invoiceNumber || ''}
` +
    `• *حالة التوثيق على Google Maps:* موثق ومعتمد رسمياً ✅
` +
    `• *رابط موقعكم على خرائط Google:* ${activeMapUrl}

` +
    `*يسعدنا إعلامكم بأنه تم إدراج وربط صفحتكم رسمياً بدليل المنصة المعتمد مجاناً:*
` +
    `🔗 رابط صفحتكم المباشر بالدليل: ${DIRECTORY_URL}

` +
    `*مزايا وجودكم على منصة دليلك:*
` +
    `1. ظهور المكان أمام آلاف العملاء والباحثين في نطاق منطقتكم.
` +
    `2. توثيق رقم التواصل ومواعيد العمل وإتاحة التوجيه والاتصال المباشر.
` +
    `3. إمكانية الاستفادة من حملات التسويق الإلكتروني وملصقات الباركود الذكية.

` +
    `شكراً لتعاونكم مع فريق العمل الميداني لمنصة دليلك 🤝`;

  return cleanWhatsAppText(raw);
}

export function getWelcomeAlreadyOnGoogleWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateWelcomeAlreadyOnGoogleWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

// -----------------------------------------------------------------------------
// EVENT 1: OFFICIAL STREAMLINED INVOICE MESSAGE
// -----------------------------------------------------------------------------

export function generateInvoiceWhatsAppMessage(biz: Business): string {
  const isFeeExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
  const pkgPrice = isFeeExempt ? 0 : (biz.packagePrice || 250);
  const amtPaid = isFeeExempt ? 0 : (biz.amountPaid || 0);
  const remaining = isFeeExempt ? 0 : Math.max(0, pkgPrice - amtPaid);
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;

  let feeSection = '';
  if (isFeeExempt) {
    feeSection = 
      `• *نوع الإدراج:* إدراج شرفي معتمد (إهداء مجاني بالكامل بدون أي رسوم)
` +
      `• *المبلغ المستحق:* 0 ج.م (معفى بالكامل)
` +
      `• *حالة الفاتورة:* إدراج شرفي معتمد ✓\n\n`;
  } else {
    feeSection = 
      `• *نوع الباقة:* ${biz.packageName || 'باقة التوثيق والظهور الأساسي'}
` +
      `• *رسوم الباقة لمرة واحدة:* ${pkgPrice} ج.م (بدون أي اشتراكات أو تجديدات دورية)
` +
      `• *المسدد:* ${amtPaid} ج.م
` +
      (remaining > 0 ? `• *المتبقي:* ${remaining} ج.م\n` : '') +
      `• *حالة الفاتورة:* ${
        biz.paymentStatus === 'fully_paid'
          ? 'مدفوعة بالكامل إلكترونياً ✓'
          : biz.paymentStatus === 'partially_paid'
          ? `مدفوع جزء منها (متبقي ${remaining} ج.م)`
          : 'غير مدفوعة ⏳'
      }\n\n`;
  }

  const raw = 
    `*فاتورة توثيق رسمية — ${OFFICIAL_PLATFORM_HEADER}*
` +
    `-----------------------------------------
` +
    `• *اسم المكان:* ${venueName}
` +
    `• *المسؤول / العميل:* ${biz.ownerName || 'المحترم'}
` +
    `• *النطاق الجغرافي:* ${biz.governorate || ''} - ${biz.city || ''}
` +
    `• *رقم الفاتورة:* ${biz.invoiceNumber || ''}
` +
    `• *تاريخ الإصدار:* ${biz.invoiceDate || ''}

` +
    feeSection +
    `🔗 *رابط المعاينة المباشر لصفحتكم على الدليل:*\n` +
    `${DIRECTORY_URL}\n\n` +
    `*نحيطكم علماً بجاهزية صفحة المنشأة على الدليل، ويرجى استكمال سداد الرسوم المقررة لتأكيد النشر والاعتماد النهائي.*\n` +
    `شاكرين حسن تعاونكم،\n` +
    `الإدارة المالية — منصة دليلك`;

  return cleanWhatsAppText(raw);
}

export function getInvoiceWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateInvoiceWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

// -----------------------------------------------------------------------------
// EVENT 1.5: ADDITIONAL SERVICE INVOICE
// -----------------------------------------------------------------------------

export function generateAdditionalInvoiceWhatsAppMessage(biz: Business, invoice: AdditionalServiceInvoice): string {
  const cfg = getActivePaymentConfig();
  const amt = Number(invoice.amount) || 0;
  const paid = Number(invoice.amountPaid) || 0;
  const remaining = Math.max(0, amt - paid);
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : (invoice.businessName || venueLabel);

  const raw =
    `*فاتورة خدمة إضافية معتمدة — ${OFFICIAL_PLATFORM_HEADER}*
` +
    `-----------------------------------------
` +
    `• *اسم المكان:* ${venueName}
` +
    `• *المسؤول / العميل:* ${biz.ownerName || 'المحترم'}
` +
    `• *الجهة المصدرة:* إدارة المنصة (${invoice.issuedByName || 'الإدارة'})
` +
    `• *رقم الفاتورة الإلكترونية:* ${invoice.invoiceNumber}
` +
    `• *تاريخ الإصدار:* ${invoice.issueDate}

` +
    `• *الخدمة المطلوبة:* ${invoice.serviceTitle}
` +
    `• *إجمالي قيمة الفاتورة:* ${amt} ج.م
` +
    `• *المبلغ المسدد إلكترونياً:* ${paid} ج.م
` +
    (remaining > 0 ? `• *المبلغ المتبقي:* ${remaining} ج.م\n` : '') +
    `• *حالة الفاتورة:* ${
      invoice.paymentStatus === 'fully_paid'
        ? 'مدفوعة بالكامل إلكترونياً ✅'
        : invoice.paymentStatus === 'partially_paid'
        ? `مدفوع جزئياً إلكترونياً (متبقي ${remaining} ج.م) ⏳`
        : 'بانتظار التحويل الإلكتروني ⏳'
    }
` +
    (invoice.notes ? `• *ملاحظات وتفاصيل:* ${invoice.notes}\n` : '') +
    `
*قنوات التحصيل والسداد الإلكتروني المعتمدة لحسابات المنصة:* 
` +
    `📱 فودافون كاش: ${cfg.vodafone1} أو ${cfg.vodafone2}
` +
    `⚡ إنستاباي InstaPay: ${cfg.instaPay}

` +
    `🔗 يمكنكم معاينة الفاتورة الإلكترونية والتحقق منها مباشرة عبر الرابط:
` +
    `https://www.dalilaak.com/?view=invoice&id=${biz.id}&invId=${invoice.id}

` +
    `شكراً لتعاملكم مع منصة دليلك 🤝`;

  return cleanWhatsAppText(raw);
}

export function getAdditionalInvoiceWhatsAppUrl(biz: Business, invoice: AdditionalServiceInvoice): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateAdditionalInvoiceWhatsAppMessage(biz, invoice));
  return `https://wa.me/${phone}?text=${text}`;
}

// -----------------------------------------------------------------------------
// EVENT 1.6: CONSOLIDATED MASTER COLLECTION
// -----------------------------------------------------------------------------

export function generateConsolidatedCollectionWhatsAppMessage(biz: Business): string {
  const cfg = getActivePaymentConfig();
  const owner = biz.ownerName || 'المحترم';
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;
  const isFeeExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);

  const pkgPrice = isFeeExempt ? 0 : (biz.packagePrice || 250);
  const pkgPaid = isFeeExempt ? 0 : (biz.amountPaid || 0);
  const pkgRemaining = isFeeExempt ? 0 : Math.max(0, pkgPrice - pkgPaid);

  const additionalInvoices = biz.additionalInvoices || [];
  const unpaidAdditionalInvoices = additionalInvoices.filter((inv) => {
    const amt = Number(inv.amount) || 0;
    const paid = Number(inv.amountPaid) || 0;
    return inv.paymentStatus !== 'fully_paid' && (amt - paid) > 0;
  });

  const additionalRemainingTotal = unpaidAdditionalInvoices.reduce((acc, inv) => {
    const amt = Number(inv.amount) || 0;
    const paid = Number(inv.amountPaid) || 0;
    return acc + Math.max(0, amt - paid);
  }, 0);

  const totalRemaining = pkgRemaining + additionalRemainingTotal;

  if (totalRemaining === 0) {
    const rawFullyPaid = 
      `*إشعار مخالصة مالية معتمدة — ${OFFICIAL_PLATFORM_HEADER}*
` +
      `-----------------------------------------
` +
      `عناية الأستاذ/ *${owner}* المحترم (${venueName})
` +
      `رقم الملف: *${biz.invoiceNumber || '---'}*

` +
      `نحيطكم علماً بأن جميع الالتزامات والفواتير المالية الخاصة بـ ${venueName} مسددة بالكامل وخالصة الطرف طرفنا ✅.

` +
      `شكراً لالتزامكم ونتمنى لكم دوام التوفيق والنجاح!
` +
      `إدارة الحسابات — منصة دليلك`;
    return cleanWhatsAppText(rawFullyPaid);
  }

  let itemsList = '';
  if (pkgRemaining > 0) {
    itemsList += `1. *رسوم باقة التوثيق الأساسية:*
`;
    itemsList += `   - إجمالي الرسوم لمرة واحدة: ${pkgPrice} ج.م
`;
    itemsList += `   - المسدد: ${pkgPaid} ج.م
`;
    itemsList += `   - المتبقي: ${pkgRemaining} ج.م

`;
  }

  if (unpaidAdditionalInvoices.length > 0) {
    itemsList += `*فواتير الخدمات الإضافية المستحقة:*
`;
    unpaidAdditionalInvoices.forEach((inv, index) => {
      const amt = Number(inv.amount) || 0;
      const paid = Number(inv.amountPaid) || 0;
      const rem = Math.max(0, amt - paid);
      itemsList += `${pkgRemaining > 0 ? index + 2 : index + 1}. *${inv.serviceTitle}* (${inv.invoiceNumber}):
`;
      itemsList += `   - القيمة: ${amt} ج.م | المسدد: ${paid} ج.م | *المتبقي: ${rem} ج.م*
`;
    });
    itemsList += '\n';
  }

  const raw = 
    `*مطالبة مالية شاملة وكشف حساب — ${OFFICIAL_PLATFORM_HEADER}*
` +
    `-----------------------------------------
` +
    `عناية الأستاذ/ *${owner}* المحترم (${venueName})
` +
    `رقم الملف المالي: *${biz.invoiceNumber || '---'}*

` +
    `نود إحاطتكم ببيان المطالبات المالية المستحقة والمعلقة على ملفكم وفقاً للسجلات المحاسبية:

` +
    itemsList +
    `💰 *إجمالي المبلغ المستحق للسداد:* ${totalRemaining} ج.م
` +
    `-----------------------------------------

` +
    `*قنوات التحصيل والسداد الإلكتروني المعتمدة رسمياً:* 
` +
    `📱 فودافون كاش / المحافظ: ${cfg.vodafone1} أو ${cfg.vodafone2}
` +
    `⚡ إنستاباي InstaPay: ${cfg.instaPay}

` +
    `🔗 يمكنكم معاينة رابط صفحتكم على الدليل الإلكتروني:
` +
    `https://www.dalilaak.com/?view=invoice&id=${biz.id}

` +
    `يرجى إرسال صورة التحويل أو إشعار الإيداع بعد السداد لإصدار إيصال المخالصة فوراً.
` +
    `شاكرين ومقدرين حسن تعاونكم،
` +
    `إدارة الحسابات — منصة دليلك`;

  return cleanWhatsAppText(raw);
}

export function getConsolidatedCollectionWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateConsolidatedCollectionWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

// -----------------------------------------------------------------------------
// EVENT 1.8: GOOGLE VERIFICATION OTP (2-STEP WORKFLOW)
// -----------------------------------------------------------------------------

/**
 * Step A: Pre-Coordination & Courtesy Check Message (Sent First)
 * Explains that Google requires a routine step to verify the venue's phone,
 * and politely asks for a reply with "متاح" before triggering the code.
 */
export function generateGoogleVerificationOtpWhatsAppMessage(biz: Business): string {
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;

  const raw =
    `*تنسيق كود التحقق — خرائط Google — ${OFFICIAL_PLATFORM_HEADER}*
` +
    `-----------------------------------------
` +
    `تحياتنا لإدارة ${venueName} الكرام،
` +
    `في إطار ربط وتوثيق هاتفكم الأساسي على خرائط Google، وحيث إن رمز التحقق الصادر عن Google يتطلب الإدخال الفوري؛ يرجى الرد بكلمة (جاهز) للتنسيق وطلب الرمز وإتمام التوثيق مباشرة.
` +
    `شاكرين حسن تعاونكم،
` +
    `فريق التوثيق الرقمي — منصة دليلك`;

  return cleanWhatsAppText(raw);
}

export function getGoogleVerificationOtpWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateGoogleVerificationOtpWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Step B: Instant Real-Time Alert When Admin Requests the SMS Code from Google
 */
export function generateGoogleOtpSentAlertWhatsAppMessage(biz: Business): string {
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;

  const raw =
    `*إشعار صدور كود التحقق من Google — ${OFFICIAL_PLATFORM_HEADER}*
` +
    `-----------------------------------------
` +
    `السادة إدارة ${venueName}،
` +
    `تم الآن طلب رمز التحقق الصادر عن Google، وستصلكم رسالة نصية قصيرة (SMS) تحتوي على 6 أرقام.
` +
    `يرجى التكرم بتزويدنا بالرمز فور وصوله لاستكمال اعتماد وتثبيت الرقم رسمياً على الخريطة مباشرة.
` +
    `فريق التوثيق الرقمي — منصة دليلك`;

  return cleanWhatsAppText(raw);
}

export function getGoogleOtpSentAlertWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateGoogleOtpSentAlertWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

// -----------------------------------------------------------------------------
// POLITE TEMPORARY SUSPENSION MESSAGE
// -----------------------------------------------------------------------------

export function generateTemporarySuspensionWhatsAppMessage(biz: Business): string {
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;
  const payConfig = getActivePaymentConfig();
  const pkgPrice = biz.packagePrice || 250;
  const amtPaid = biz.amountPaid || 0;
  const remaining = Math.max(0, pkgPrice - amtPaid);

  const raw =
    `*إشعار تعليق صفحة العرض مؤقتاً — ${OFFICIAL_PLATFORM_HEADER}*
` +
    `-----------------------------------------
` +
    `تحياتنا لإدارة ${venueName} الكرام،
` +
    `نحيطكم علماً بتعليق صفحة العرض مؤقتاً لعدم استكمال سداد الرسوم المقررة (${remaining} ج.م).
` +
    `ملاحظة: كافة البيانات والوسائط محفوظة في سجلات المنظومة لحين استكمال الإجراءات.
` +
    `طرق السداد المعتمدة لإعادة التفعيل المباشر:
` +
    `• إنستاباي InstaPay: ${payConfig.instaPay}
` +
    `• المحافظ الإلكترونية: ${payConfig.vodafone1} أو ${payConfig.vodafone2}
` +
    `عند إتمام التحويل، يرجى موافاتنا بإشعار السداد لتأكيد إعادة التفعيل فوراً.
` +
    `شاكرين تعاونكم،
` +
    `الإدارة المالية — منصة دليلك`;

  return cleanWhatsAppText(raw);
}

export function getTemporarySuspensionWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateTemporarySuspensionWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

// -----------------------------------------------------------------------------
// TRENDING VENUES FREE HONORARY INVITATION
// -----------------------------------------------------------------------------

export function generateTrendingFreeInvitationWhatsAppMessage(biz: Business): string {
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;

  const raw =
    `*السلام عليكم ورحمة الله وبركاته.. تحياتنا لإدارة ${venueName} الكرام*
` +
    `*${OFFICIAL_PLATFORM_HEADER}*
` +
    `-----------------------------------------
` +
    `نحيطكم علماً باختيار منشأتكم للإدراج والتوثيق ضمن دليل المنصة المعتمد في نطاق منطقتكم كمنشأة مميزة (إدراج معتمد بدون أي رسوم).
` +
    `يتيح إدراج المنشأة توثيق بيانات التواصل ومواعيد العمل وإتاحة الوصول للجمهور والزوار مباشرة.
` +
    `لتأكيد التفعيل، يرجى التكرم بالموافقة لنوافيكم برابط المعاينة المباشر لصفحتكم.
` +
    `شاكرين تعاونكم،
` +
    `إدارة منصة دليلك
` +
    `الموقع الرسمي: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getTrendingFreeInvitationWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateTrendingFreeInvitationWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

// -----------------------------------------------------------------------------
// EVENT 2: GOOGLE MAPS VERIFIED NOTIFICATION
// -----------------------------------------------------------------------------

export function generateGoogleMapsVerifiedWhatsAppMessage(biz: Business): string {
  const isFeeExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
  const pkgPrice = isFeeExempt ? 0 : (biz.packagePrice || 250);
  const amtPaid = isFeeExempt ? 0 : (biz.amountPaid || 0);
  const remaining = isFeeExempt ? 0 : Math.max(0, pkgPrice - amtPaid);
  const isFullyPaid = isFeeExempt || biz.paymentStatus === 'fully_paid' || remaining === 0;
  const activeMapUrl = (biz.googleMapsUrl && biz.googleMapsUrl.trim().startsWith('http')) ? biz.googleMapsUrl.trim() : DIRECTORY_URL;
  const owner = biz.ownerName || 'المحترم';
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;
  const payConfig = getActivePaymentConfig();

  let raw = '';

  if (isFullyPaid || isFeeExempt) {
    raw = 
      `هلا أستاذ *${owner}*، يسعدنا أنه تم توثيق وظهور صفحتكم (*${venueName}*) رسمياً على خرائط Google 🗺️

` +
      `📍 *رابط المكان المباشر على Google Maps:*
` +
      `${activeMapUrl}

` +
      `• *حالة السداد:* مسدد بالكامل (خالص ✓)

` +
      `نتمنى لكم دوام التوفيق والازدهار!
` +
      `${OFFICIAL_PLATFORM_HEADER}`;
  } else {
    raw = 
      `هلا أستاذ *${owner}*، يسعدنا أنه تم توثيق وظهور صفحتكم (*${venueName}*) رسمياً على خرائط Google 🗺️

` +
      `📍 *رابط المكان المباشر على Google Maps:*
` +
      `${activeMapUrl}

` +
      `يرجى الضغط على الرابط أعلاه والتأكد من ظهور البيانات على الخريطة أولاً قبل السداد.

` +
      `• *رسوم الباقة لمرة واحدة:* ${remaining} ج.م (بدون أي اشتراكات)
` +
      `• *طرق الدفع:*
` +
      `- إنستاباي: ${payConfig.instaPay}
` +
      `- فودافون كاش / محافظ: ${payConfig.vodafone1} أو ${payConfig.vodafone2}

` +
      `يرجى إرسال صورة التحويل بعد التأكد والسداد لتأكيد الحساب.
` +
      `${OFFICIAL_PLATFORM_HEADER}`;
  }

  return cleanWhatsAppText(raw);
}

export function getGoogleMapsVerifiedWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateGoogleMapsVerifiedWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

// -----------------------------------------------------------------------------
// EVENT 3: PAYMENT SETTLEMENT RECEIPT
// -----------------------------------------------------------------------------

export function generatePaymentReceiptWhatsAppMessage(biz: Business): string {
  const total = biz.packagePrice || 250;
  const paid = biz.amountPaid || total;
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;

  const raw = 
    `*إيصال وتأكيد سداد معتمد — ${OFFICIAL_PLATFORM_HEADER}*
` +
    `-----------------------------------------
` +
    `عزيزي العميل أستاذ / *${biz.ownerName || 'المحترم'}*
` +
    `نؤكد استلام واعتماد سداد رسوم باقة التوثيق لـ *(${venueName})*:

` +
    `• *الباقة:* ${biz.packageName || 'باقة التوثيق والظهور'}
` +
    `• *إجمالي رسوم الباقة لمرة واحدة:* ${total} ج.م (بدون أي اشتراكات أو تجديدات دورية)
` +
    `• *المبلغ المسدد:* ${paid} ج.م
` +
    `• *المتبقي:* 0 ج.م (خالص تماماً ومسدد بالكامل ✓)
` +
    `• *رقم الفاتورة المرجعي:* ${biz.invoiceNumber || 'INV-2026'}

` +
    `• *رابط صفحتكم بالدليل:* ${DIRECTORY_URL}

` +
    `نشكركم لالتزامكم وثقتكم في منصة دليلك 🤝`;

  return cleanWhatsAppText(raw);
}

export function getPaymentReceiptWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generatePaymentReceiptWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

// -----------------------------------------------------------------------------
// EVENT 3.5: OVERDUE WARNING & ACCOUNTABILITY
// -----------------------------------------------------------------------------

export function generateOverdueWarningWhatsAppMessage(biz: Business): string {
  const isFeeExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
  const pkgPrice = isFeeExempt ? 0 : (biz.packagePrice || 250);
  const amtPaid = isFeeExempt ? 0 : (biz.amountPaid || 0);
  const remaining = isFeeExempt ? 0 : Math.max(0, pkgPrice - amtPaid);
  const owner = biz.ownerName || 'المحترم';
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;
  const invNumber = biz.invoiceNumber || 'INV-2026';
  const payConfig = getActivePaymentConfig();

  const raw =
    `⚠️ *إنذار إداري ومالي نهائي — ${OFFICIAL_PLATFORM_HEADER}*
` +
    `-----------------------------------------
` +
    `أستاذ *${owner}* — إدارة (${venueName}) 📍
` +
    `📄 *رقم الفاتورة الصادرة:* ${invNumber}

` +
    `نود إحاطتكم بأنه تم بالفعل توثيق وظهور مكانكم على خرائط Google بموجب الفاتورة أعلاه وبناءً على موافقتكم المسبقة للمندوب الميداني، حيث تمنع سياساتنا إدراج أي منشأة دون إذن وإقرار صاحبها.

` +
    `وحيث إنه تم التأكد من ظهور المكان واستفادتكم منه مع استمرار المماطلة في سداد مستحقات الفاتورة (*${remaining} ج.م*):

` +
    `🛑 *نحيطكم علماً بأنه سيتم اتخاذ الإجراءات التالية خلال 24 ساعة في حال عدم التسوية:*
` +
    `1. إدراج الصفحة ضمن «القائمة غير الموثوقة» على المنظومة ودليل الخدمات.
` +
    `2. خفض وتعديل التقييم ورفع بلاغ رسمي لمراجعة وتجميد الموقع على خرائط Google.

` +
    `• *طرق السداد الفوري:*
` +
    `- إنستاباي: ${payConfig.instaPay}
` +
    `- فودافون كاش / محافظ: ${payConfig.vodafone1} أو ${payConfig.vodafone2}

` +
    `تواصل مع الدعم الفني للتسوية وإرسال إيصال التحويل لإيقاف الإجراءات فوراً.
` +
    `الإدارة القانونية والمالية — منصة دليلك`;

  return cleanWhatsAppText(raw);
}

export function getOverdueWarningWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateOverdueWarningWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

// -----------------------------------------------------------------------------
// EVENT 3.6: POST-DEADLINE LEGAL ACTIONS
// -----------------------------------------------------------------------------

export function generateLegalActionExecutedWhatsAppMessage(biz: Business): string {
  const isFeeExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
  const pkgPrice = isFeeExempt ? 0 : (biz.packagePrice || 250);
  const amtPaid = isFeeExempt ? 0 : (biz.amountPaid || 0);
  const remaining = isFeeExempt ? 0 : Math.max(0, pkgPrice - amtPaid);
  const owner = biz.ownerName || 'المحترم';
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;
  const invNumber = biz.invoiceNumber || 'INV-2026';
  const payConfig = getActivePaymentConfig();

  const raw =
    `🛑 *إشعار تنفيذ رسمي وتحذير أخير — ${OFFICIAL_PLATFORM_HEADER}*
` +
    `--------------------------------------------------
` +
    `إلى إدارة: *(${venueName})* 📍
` +
    `عناية السيد / *${owner}*
` +
    `📄 *رقم الفاتورة الصادرة:* ${invNumber}
` +
    `💰 *المبلغ المستحق وغير المسدد:* ${remaining} ج.م

` +
    `نحيطكم علماً بأنه نظراً لانتهاء المهلة المقررة (24 ساعة) دون تسوية المستحقات المالية رغم توثيق المكان واستفادتكم منه وبناءً على تعاقدكم المسبق، *فقد بدأنا بالفعل في اتخاذ الإجراءات الإدارية لإلغاء التوثيق وتجميد الصفحة.*

` +
    `--------------------------------------------------
` +
    `⏳ *فرصة التسوية المباشرة لتفادي حظر الموقع:*
` +
    `• إنستاباي (InstaPay): ${payConfig.instaPay}
` +
    `• فودافون كاش / محافظ إلكترونية: ${payConfig.vodafone1} أو ${payConfig.vodafone2}

` +
    `📲 *أرسل إيصال التحويل فوراً على هذه المحادثة لوقف الإجراءات.*\n\n` +
    `الإدارة القانونية والمالية — منصة دليلك`;

  return cleanWhatsAppText(raw);
}

export function getLegalActionExecutedWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.phone);
  const text = encodeURIComponent(generateLegalActionExecutedWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

// -----------------------------------------------------------------------------
// NURTURING & MARKETING CAMPAIGNS
// -----------------------------------------------------------------------------

export function generateUpgradeOffersWhatsAppMessage(biz: Business): string {
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;

  const raw = 
    `*عروض وخدمات التطوير المتقدمة — ${OFFICIAL_PLATFORM_HEADER}*
` +
    `-----------------------------------------
` +
    `أهلاً بك أستاذ *${biz.ownerName || 'المحترم'}* في (${venueName}) 🌟

` +
    `يسعدنا تقديم باقات الترويج والتطوير الحصرية لتوسيع انتشار مكانكم وجذب عملاء جدد:

` +
    `• *باقة التصوير والتغطية الترويجية:*
` +
    `- جلسة تصوير احترافية ومونتاج فيديو ريلز إعلاني عالي الجودة.
` +
    `- تصميم وطباعة ستاندات الباركود الذكية (QR Code) لطاولات المحل.

` +
    `• *باقة الإعلانات الممولة الجغرافية:*
` +
    `- حملات مستهدفة لسكان منطقتكم بدقة.
` +
    `- إدارة كاملة لتقييمات Google ومراجعات العملاء.

` +
    `• *لطلب التطوير:* تواصل معنا مباشرة عبر هذه المحادثة لحجز موعدكم!
` +
    `• الموقع الرسمي: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getUpgradeOffersWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateUpgradeOffersWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

export function generateFreeQrGiftWhatsAppMessage(biz: Business): string {
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;

  const raw = 
    `*هدية خاصة من منصة دليلك لـ (${venueName})*
` +
    `-----------------------------------------
` +
    `أهلاً بحضرتك أستاذ *${biz.ownerName || 'المحترم'}*،

` +
    `*التصاميم المرفقة مع الرسالة دي هدية مجانية تماماً ليك من منصة دليلك!*
` +
    `كل اللي عليك تطبعها وتحطها في مكانك، عشان الزباين يصوروا الـ QR Code بالموبايل ويقيموا مكانك على الخريطة بكل سهولة وبسرعة ويساعدوك تظهر أول نتيجة بحث.

` +
    `*خدمة الطباعة الفاخرة والتوصيل:*
` +
    `لو تحب نطبعها لك بجودة عالية وفاخرة ونوصلها لغاية عندك في نفس اليوم، التكلفة *100 جنيه بس* (شاملة كل شيء).

` +
    `رد علينا بكلمة *(اطبعلي)* وسيقوم فريقنا بتجهيزها وإرسالها فوراً لموقعكم!

` +
    `منصة دليلك: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getFreeQrGiftWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateFreeQrGiftWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

export function generateQrImportanceWhatsAppMessage(biz: Business): string {
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;

  const raw = 
    `*📲 ما أهمية وجود كود الباركود (QR Code) داخل المكان؟*
` +
    `-----------------------------------------
` +
    `• *المكان:* ${venueName}
` +
    `• *المسؤول:* ${biz.ownerName || 'عميلنا العزيز'}

` +
    `وجود كود الباركود (QR Code) في مكان واضح يسهّل على العميل الوصول إلى صفحة مكانكم على خرائط Google دون الحاجة إلى البحث عنها يدويًا.

` +
    `*يمكن للعميل من خلاله:*
` +
    `• الوصول إلى موقع المكان ومعلوماته الرسمية.
` +
    `• الاطلاع على تقييمات وتجارب العملاء الآخرين.
` +
    `• تقييم المكان بعد تجربته مباشرة.

` +
    `لذلك يُفضّل وضعه في مكان واضح وسهل الوصول، خصوصًا في الأماكن التي ينتظر فيها العميل مثل الكاشير أو مقاعد الانتظار أو عند مخرج الباب أثناء الخروج.

` +
    `🎥 *مرفق لحضرتك مع هذه الرسالة فيديو توضيحي لطريقة استخدام ومسح الباركود للزبائن بكل سهولة!*

` +
    `منصة دليلك: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getQrImportanceWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateQrImportanceWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

export function generateVisualConsultingWhatsAppMessage(biz: Business): string {
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;

  const raw = 
    `*نصيحة واستشارة مجانية لتنمية (${venueName})*
` +
    `-----------------------------------------
` +
    `تحية طيبة أستاذ *${biz.ownerName || 'المحترم'}*،

` +
    `دراسات المبيعات تؤكد أن *أول 3 ثوانٍ* يدخل فيها الزبون محلك تحدد بنسبة 70% قراره بالشراء والشعور بالراحة!

` +
    `*نصائحنا السريعة لك هذا الشهر:*
` +
    `1. الاهتمام بنظافة المدخل والواجهة الخارجية لجذب المارة.
` +
    `2. تركيز الإضاءة القوية على المنتجات الأكثر طلباً والأعلى ربحية.
` +
    `3. جعل ممرات الحركة واسعة ومريحة لسهولة تصفح المكان.

` +
    `*خدمة استشارية مجانية تماماً ليك:*
` +
    `صور لنا واجهة مكانكم أو طريقة عرض المنتجات وأرسلها هنا، وسيقوم مستشارو الديكور والتسويق لدينا بتقديم *اقتراحات تطوير مجانية بكل سرور!*

` +
    `نجاحكم وتألقكم هو هدفنا الدائم في دليلك 🤝
` +
    `موقعنا: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getVisualConsultingWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateVisualConsultingWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

export function generateBusinessCheckupWhatsAppMessage(biz: Business): string {
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;

  const raw = 
    `*متابعة دورية واطمئنان على (${venueName})*
` +
    `-----------------------------------------
` +
    `أهلاً بك أستاذ *${biz.ownerName || 'المحترم'}*،

` +
    `فريق عمل «دليلك» يطمئن على حركة المبيعات والزبائن لديكم هذا الشهر!

` +
    `*نحب نذكرك بأن خدمات الدعم الفني في دليلك تحت أمرك مجاناً:*
` +
    `- هل ترغب في تحديث مواعيد وساعات العمل للموسم؟
` +
    `- هل تم تغيير أرقام الهواتف أو إضافة خدمات جديدة للمكان؟
` +
    `- هل تواجه أي استفسار حول ظهور مكانك على الخرائط؟

` +
    `أرسل لنا أي تعديل وسنقوم بتحديثه فوراً على الخرائط والمنظومة لتظل دائماً في صدارة نتائج البحث.

` +
    `دائماً في خدمتكم بكل سرور!
` +
    `منصة دليلك: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getBusinessCheckupWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateBusinessCheckupWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

export function generateSocialProofUpgradeWhatsAppMessage(biz: Business): string {
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;

  const raw = 
    `*كيف تضاعف عدد الزبائن القادمين من منطقتك الجغرافية؟*
` +
    `-----------------------------------------
` +
    `أهلاً أستاذ *${biz.ownerName || 'المحترم'}* في *(${venueName})*،

` +
    `الشهر الماضي، أحد المتاجر الشريكة معنا حقق قفزة بنسبة 40% في الزيارات والطلبات بفضل تفعيل *«باقة التسويق الميداني والربط الذكي VIP»*:

` +
    `*ماذا تتضمن الباقة؟*
` +
    `1. تصوير ومونتاج فيديو ريلز إعلاني قصير احترافي لمحلكم.
` +
    `2. إطلاق حملة إعلانات ممولة جغرافية تستهدف سكان منطقتك المحيطة بمحلك بدقة.
` +
    `3. إدارة احترافية لتقييمات Google Maps لرفع تصنيف محلك إلى 5 نجوم.

` +
    `*إذا كنت جاهزاً للقفزة القادمة في مبيعاتكم:*
` +
    `تواصل معنا اليوم لحجز جلسة التطوير وتفعيل الباقة بخصم خاص لشركاء دليلك!

` +
    `فريق النمو والتطوير — منصة دليلك
` +
    `الموقع الرسمي: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getSocialProofUpgradeWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateSocialProofUpgradeWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

// -----------------------------------------------------------------------------
// EVENT 5: FIELD REPRESENTATIVE DIRECT CONTACT MESSAGE
// -----------------------------------------------------------------------------

export function generateRepFieldIntroWhatsAppMessage(biz: Business, repName?: string): string {
  const finalRepName = repName || biz.repName || 'المندوب الميداني';
  const ownerName = biz.ownerName || 'المحترم';
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;

  const raw = 
    `السلام عليكم أستاذ *${ownerName}* 🤝

` +
    `معك *${finalRepName}*، المندوب الميداني المعتمد من منصة *«دليلك»*.
` +
    `تشرفت بزيارتكم اليوم وتوثيق بيانات *(${venueName})*.

` +
    `نحيط سيادتكم علماً بأن *حساب المنصة الرسمي* سيقوم بإرسال الفاتورة الإلكترونية المعتمدة لحضرتكم عبر الواتساب، كما أن كافة المتابعات وإجراءات التوثيق تتم مباشرة من خلالهم عبر الواتساب.

` +
    `سعدت جداً بخدمتكم وتمنياتنا لكم بدوام التوفيق والازدهار! ✨`;

  return cleanWhatsAppText(raw);
}

export function getRepFieldIntroWhatsAppUrl(biz: Business, repName?: string): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateRepFieldIntroWhatsAppMessage(biz, repName));
  return `https://wa.me/${phone}?text=${text}`;
}

// -----------------------------------------------------------------------------
// MOTIVATIONAL CAMPAIGNS
// -----------------------------------------------------------------------------

export function generateMotivationalHighSatisfactionWhatsAppMessage(biz: Business): string {
  const ownerName = biz.ownerName || 'المحترم';
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;

  const raw = 
    `أهلاً بك أستاذ *${ownerName}* في *(${venueName})* 🌟
` +
    `-----------------------------------------
` +
    `يسعد فريق عمل «دليلك» مشاركتكم تقرير المتابعة لموقعكم خلال الفترة الأخيرة عبر المنظومة وخرائط Google:

` +
    `• صفحتكم مسجلة ضمن أولويات المنصة في منطقتكم الجغرافية.
` +
    `• بعد تثبيت وظهور موقعكم على الخريطة، سجل مكانكم تفاعل وزيارة أكثر من 37 عميلاً عن طريق التوجيه الجغرافي والاتصال المباشر.
` +
    `• نسبة رضا وانطباع العملاء عن خدماتكم ممتازة وتتجاوز 90%.

` +
    `أداء رائع ومميز واستمروا في هذا التألق والنمو! نحن دائماً معكم لدعمكم وتطوير أعمالكم.

` +
    `فريق المتابعة والنمو — منصة دليلك
` +
    `الموقع الرسمي: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getMotivationalHighSatisfactionWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateMotivationalHighSatisfactionWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

export function generateMotivationalCashierFeedbackWhatsAppMessage(biz: Business): string {
  const ownerName = biz.ownerName || 'المحترم';
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;

  const raw = 
    `أهلاً بك أستاذ *${ownerName}* في *(${venueName})* 🌿
` +
    `-----------------------------------------
` +
    `تقرير المتابعة ونبض مكانكم هذا الأسبوع عبر منصة دليلك وخرائط Google:

` +
    `• المكان من المواقع الأكثر بحثاً واهتماماً في المنطقة، وسجل تفاعل وزيارة أكثر من 40 زبوناً.
` +
    `• نسبة رضا الزبائن عن جودة الخدمة والمنتجات مرتفعة وممتازة، مع ملاحظة عابرة من أحد الزبائن حول وجود تأخير بسيط عند الكاشير وقت الذروة.
` +
    `• *نصيحة المنصة لحل الاستياء:* تنظيم طابور الدفع أو تسريع حساب الفواتير سيرفع نسبة ولاء الزبائن ويضمن تقييمات إيجابية كاملة 5 نجوم.

` +
    `مجهود مميز وبداية قوية، ونحن فخورون بوجودكم معنا ومستمرون في دعمكم!

` +
    `فريق المتابعة والنمو — منصة دليلك
` +
    `الموقع الرسمي: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getMotivationalCashierFeedbackWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateMotivationalCashierFeedbackWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

export function generateMotivationalFastResponseFeedbackWhatsAppMessage(biz: Business): string {
  const ownerName = biz.ownerName || 'المحترم';
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;

  const raw = 
    `أهلاً أستاذ *${ownerName}* في *(${venueName})* ✨
` +
    `-----------------------------------------
` +
    `مؤشرات تفاعل الزبائن والجمهور مع موقعكم هذا الشهر:

` +
    `• تم توجيه أكثر من 50 عميلاً إلى مقركم والاتصال بكم عبر الخريطة والمنصة.
` +
    `• انطباع العملاء عن المعاملة ممتاز، ونوصي بالحرص على سرعة الرد على المكالمات الهاتفية الواردة لضمان كسب كافة الطلبات من الزبائن الجدد.

` +
    `خطوة بخطوة نحو تصدر السوق المحلي في منطقتكم!

` +
    `فريق المتابعة والتطوير — منصة دليلك
` +
    `الموقع الرسمي: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getMotivationalFastResponseFeedbackWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateMotivationalFastResponseFeedbackWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

export function generateMotivationalQrReviewsAdviceWhatsAppMessage(biz: Business): string {
  const ownerName = biz.ownerName || 'المحترم';
  const venueLabel = getVenueContextLabel(biz.category);
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : venueLabel;

  const raw = 
    `تحية طيبة أستاذ *${ownerName}* في *(${venueName})* 🚀
` +
    `-----------------------------------------
` +
    `مكانكم يحقق تفاعلاً مميزاً ومستقراً على خرائط Google ومنصة دليلك:

` +
    `• أكثر من 60 شخصاً استعلموا عن مواعيد العمل وموقعكم الجغرافي مؤخراً.
` +
    `• *نصيحة ذهبية:* تشجيع زبائنك السعداء على وضع تقييم 5 نجوم عبر باركود الـ QR سيرفع ترتيب مكانكم للمركز الأول في منطقتكم على محركات البحث.

` +
    `بالتوفيق دائماً، وبإمكانك طلب أي تعديل لبياناتكم في أي وقت مجاناً!

` +
    `فريق النمو وتطوير الأعمال — منصة دليلك
` +
    `الموقع الرسمي: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getMotivationalQrReviewsAdviceWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateMotivationalQrReviewsAdviceWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * 🌟 رسالة طلب السماح والاستئذان للمنشآت الأكثر رواجاً (إدراج شرفي مجاني تماماً)
 * بالصيغة الرسمية المتزنة المعتمدة بالبروتوكول السادس
 */
export function generateTrendingVenuePermissionWhatsAppMessage(lead?: { clientName?: string; businessName?: string }): string {
  const targetName = lead?.businessName ? `«${lead.businessName}»` : (lead?.clientName ? `«${lead.clientName}»` : 'المنشأة');

  const raw =
    `السلام عليكم ورحمة الله وبركاته..
` +
    `تحياتنا لإدارة ${targetName} الكرام،
` +
    `-----------------------------------------
` +
    `نحيطكم علماً باختيار منشأتكم للإدراج والتوثيق ضمن دليل المنصة المعتمد في نطاق منطقتكم كمنشأة مميزة (إدراج معتمد بدون أي رسوم).
` +
    `يتيح إدراج المنشأة توثيق بيانات التواصل ومواعيد العمل وإتاحة الوصول للجمهور والزوار مباشرة.
` +
    `لتأكيد التفعيل، يرجى التكرم بالموافقة لنوافيكم برابط المعاينة المباشر لصفحتكم.
` +
    `شاكرين حسن تعاونكم،
` +
    `إدارة منصة دليلك
` +
    `الموقع الرسمي: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getTrendingVenuePermissionWhatsAppUrl(phone?: string, lead?: { clientName?: string; businessName?: string }): string {
  const cleanPhone = formatWhatsAppPhone(phone);
  const text = safeWhatsAppEncode(generateTrendingVenuePermissionWhatsAppMessage(lead));
  return `https://wa.me/${cleanPhone}?text=${text}`;
}


