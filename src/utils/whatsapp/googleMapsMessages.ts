import { Business } from '../../types';
import { formatWhatsAppPhone, cleanWhatsAppText, safeWhatsAppEncode } from './phoneFormatter';
import { OFFICIAL_PLATFORM_HEADER, getVenueContextLabel, DIRECTORY_URL } from './venueContext';
import { getActivePaymentConfig } from './financeMessages';

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
// EVENT 1.8: GOOGLE VERIFICATION OTP (2-STEP WORKFLOW)
// -----------------------------------------------------------------------------

/**
 * Step A: Pre-Coordination & Courtesy Check Message (Sent First)
 * Explains that Google requires a routine step to verify the venue's phone,
 * and politely asks for a reply with "جاهز" before triggering the code.
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
