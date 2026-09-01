import { Business } from '../types';

// Using a cache-busting parameter forces WhatsApp servers to crawl and fetch the new 3D OpenGraph image immediately
const DIRECTORY_URL = 'https://www.dalilaak.com/?ref=app';

export function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '').replace(/^0/, '');
  return clean.startsWith('20') ? clean : `20${clean}`;
}

/**
 * Strips any invisible zero-width characters or problematic variation selectors
 * that can cause replacement characters in WhatsApp decoders.
 */
export function cleanWhatsAppText(text: string): string {
  return text
    .replace(/[\uFE00-\uFE0F\u200B-\u200D\uFFFD\u00A0]/g, ' ')
    .replace(/\r\n/g, '\n')
    .trim();
}

/**
 * Standard encodeURIComponent leaves *, !, (, ), ', ~ unencoded (RFC 3986 unreserved).
 * When WhatsApp Web parses unencoded asterisks alongside UTF-8 percent-encoded Arabic bytes,
 * it inserts a replacement character () before each asterisk.
 * Fully percent-encoding these characters guarantees 100% clean rendering across all platforms.
 */
export function safeWhatsAppEncode(text: string): string {
  const cleaned = cleanWhatsAppText(text);
  return encodeURIComponent(cleaned)
    .replace(/\*/g, '%2A')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/~/g, '%7E');
}

// -----------------------------------------------------------------------------
// OPERATIONAL EVENTS (Invoices & Receipts)
// -----------------------------------------------------------------------------

/**
 * Event 1: Initial Registration & Official Invoice Message
 */
export function generateInvoiceWhatsAppMessage(biz: Business): string {
  const isFeeExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
  const pkgPrice = isFeeExempt ? 0 : (biz.packagePrice || 250);
  const amtPaid = isFeeExempt ? 0 : (biz.amountPaid || 0);
  const remaining = isFeeExempt ? 0 : Math.max(0, pkgPrice - amtPaid);

  const raw = 
    `*فاتورة توثيق نشاط تجاري - شركة دليلك*\n` +
    `-----------------------------------------\n` +
    `• *اسم النشاط:* ${biz.nameAr || ''}\n` +
    `• *صاحب النشاط:* ${biz.ownerName || ''}\n` +
    `• *الموقع:* ${biz.governorate || ''} - ${biz.city || ''}\n` +
    `• *رقم الفاتورة:* ${biz.invoiceNumber || ''}\n` +
    `• *تاريخ الإصدار:* ${biz.invoiceDate || ''}\n\n` +
    (isFeeExempt
      ? `• *نوع الخدمة:* نشاط رائج ومعلم بالمنطقة (إدراج مجاني بدون رسوم)\n` +
        `• *إجمالي القيمة:* 0 ج.م (معفى من الرسوم تماماً)\n` +
        `• *حالة الدفع:* معفى بالكامل (مجاني)\n\n`
      : `• *الباقة المختارة:* ${biz.packageName || 'باقة التوثيق الأساسي'}\n` +
        `• *إجمالي قيمة الباقة:* ${pkgPrice} ج.م\n` +
        `• *المبلغ المدفوع:* ${amtPaid} ج.م\n` +
        `• *المبلغ المتبقي:* ${remaining} ج.م\n` +
        `• *حالة الدفع:* ${
          biz.paymentStatus === 'fully_paid'
            ? 'مدفوعة بالكامل (خالص)'
            : biz.paymentStatus === 'partially_paid'
            ? `مدفوع جزء منها (متبقي ${remaining} ج.م)`
            : 'لم يتم الدفع بعد'
        }\n\n`) +
    `*تهانينا! تم إدراج ونشر نشاطكم مباشرة في دليل الأنشطة والخدمات المعتمد في مصر:*\n` +
    `رابط دليل الأنشطة المباشر: ${DIRECTORY_URL}\n\n` +
    `*ملاحظة:* تم رفع وتثبيت بيانات نشاطكم بنجاح وهو متاح الآن للعملاء على المنظومة، وتتم متابعة مراجعة وتوثيق النشاط حتى اعتماده على خرائط Google. شكرًا لثقتكم بشركة دليلك!`;

  return cleanWhatsAppText(raw);
}

export function getInvoiceWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateInvoiceWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Event 2: Google Maps Live Verification & Approval Notification Message
 */
export function generateGoogleMapsVerifiedWhatsAppMessage(biz: Business): string {
  const isFeeExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
  const pkgPrice = isFeeExempt ? 0 : (biz.packagePrice || 250);
  const amtPaid = isFeeExempt ? 0 : (biz.amountPaid || 0);
  const remaining = isFeeExempt ? 0 : Math.max(0, pkgPrice - amtPaid);
  const isFullyPaid = isFeeExempt || biz.paymentStatus === 'fully_paid' || remaining === 0;
  const activeMapUrl = (biz.googleMapsUrl && biz.googleMapsUrl.trim().startsWith('http')) ? biz.googleMapsUrl.trim() : DIRECTORY_URL;

  const raw = 
    `*تهانينا! تم توثيق واعتماد نشاطكم رسمياً على خرائط Google*\n\n` +
    `أهلاً بحضرتك أستاذ *${biz.ownerName || 'صاحب النشاط'}*\n` +
    `يسر شركة *دليلك* إعلامكم بأنه تم نشر وتفعيل نشاطكم التجاري *(${biz.nameAr})* بنجاح على خرائط Google Maps والمنصات الجغرافية المعتمدة.\n\n` +
    `• *رابط موقعكم المباشر على خرائط Google:*\n` +
    `${activeMapUrl}\n\n` +
    `• *رابط صفحتكم على دليل الأنشطة المعتمد:* ${DIRECTORY_URL}\n\n` +
    (isFeeExempt
      ? `• *حالة الحساب:* إدراج مجاني بدون أي رسوم معلقة.\n\n`
      : isFullyPaid
      ? `• *حالة الحساب:* مسدد بالكامل (${pkgPrice} ج.م) — لا توجد أي مستحقات معلقة.\n\n`
      : `• *حالة الحساب:* متبقي سداد (*${remaining} ج.م*)\n\n` +
        `*طرق الدفع المعتمدة للتسوية:*\n` +
        `- إنستاباي (InstaPay): @daz31181\n` +
        `- فودافون كاش / محافظ إلكترونية: 01143888355 أو 01556221141\n\n` +
        `*(يرجى إرسال صورة إيصال التحويل لتأكيد إتمام التسوية وإصدار المخالصة النهائية)*\n\n`) +
    `نتمنى لنشاطكم دوام التوفيق والازدهار!\n` +
    `فريق عمل منظومة دليلك`;

  return cleanWhatsAppText(raw);
}

export function getGoogleMapsVerifiedWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateGoogleMapsVerifiedWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Event 3: Full Payment Settlement & Final Receipt Message
 */
export function generatePaymentReceiptWhatsAppMessage(biz: Business): string {
  const total = biz.packagePrice || 250;
  const paid = biz.amountPaid || total;

  const raw = 
    `*إيصال وتأكيد سداد مالي معتمد - شركة دليلك*\n` +
    `-----------------------------------------\n` +
    `عزيزي العميل أستاذ / *${biz.ownerName || 'صاحب النشاط'}*\n` +
    `نؤكد استلام واعتماد سداد اشتراك نشاطكم التجاري *(${biz.nameAr})*:\n\n` +
    `• *الباقة:* ${biz.packageName || 'باقة التوثيق'}\n` +
    `• *إجمالي قيمة الاشتراك:* ${total} ج.م\n` +
    `• *المبلغ المسدد:* ${paid} ج.م\n` +
    `• *المتبقي:* 0 ج.م (خالص تماماً ومسدد بالكامل)\n` +
    `• *رقم الفاتورة المرجعي:* ${biz.invoiceNumber || 'INV-2026'}\n\n` +
    `• *رابط دليل الأنشطة:* ${DIRECTORY_URL}\n\n` +
    `نشكركم لالتزامكم وثقتكم المستمرة في منظومة دليلك!`;

  return cleanWhatsAppText(raw);
}

export function getPaymentReceiptWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generatePaymentReceiptWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Event 4: Exclusive Package Upgrade Offers Message
 */
export function generateUpgradeOffersWhatsAppMessage(biz: Business): string {
  const raw = 
    `*عروض الترقية والتطوير الحصرية لنشاطكم - شركة دليلك*\n` +
    `-----------------------------------------\n` +
    `تحية طيبة أستاذ *${biz.ownerName || 'صاحب النشاط'}*، شريك نجاحنا في *(${biz.nameAr})*\n\n` +
    `يسعدنا تقديم باقات الترقية الحصرية المخصصة لمضاعفة مبيعات وانتشار نشاطكم التجاري:\n\n` +
    `1. *باقة التأسيس والربط الذكي (عرض 500 ج.م بدلاً من 1000 ج.م):*\n` +
    `- تثبيت رسمي ومتقدم على Google Maps مع لوحة تحكم كاملة.\n` +
    `- ربط احترافي مع WhatsApp Business، كتالوج المنتجات، وصفحات التواصل.\n` +
    `- توليد باركود ذكي (QR Code) مع ستاند طاولة رسمي لموقعك.\n` +
    `- دعم فني مخصص لمدة عام كامل.\n\n` +
    `2. *باقة الدعم الميداني والتسويق الرقمي VIP (باقة 1000 ج.م):*\n` +
    `- جلسة تصوير احترافية ومونتاج فيديو ترويجي قصير (Reel) لمحلكم.\n` +
    `- حملة إعلانات ممولة مستهدفة لمنطقتك الجغرافية لزيادة الزبائن.\n` +
    `- تقارير شهرية وإدارة كاملة لتقييمات Google ومراجعات العملاء.\n\n` +
    `• *لطلب الترقية الفورية:* تواصل معنا مباشرة عبر هذه المحادثة لحجز موعد التطوير!\n` +
    `• الموقع الرسمي: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getUpgradeOffersWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateUpgradeOffersWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

// -----------------------------------------------------------------------------
// MONTHLY CLIENT NURTURING & VALUE-DRIVEN CAMPAIGNS (ADMIN / SUPERVISOR ONLY)
// -----------------------------------------------------------------------------

/**
 * Monthly Campaign 1: Free QR Stand Design & Print Delivery Upsell (100 EGP)
 */
export function generateFreeQrGiftWhatsAppMessage(biz: Business): string {
  const raw = 
    `*هدية خاصة من شركة دليلك لنشاطكم (${biz.nameAr})*\n` +
    `-----------------------------------------\n` +
    `أهلاً بحضرتك أستاذ *${biz.ownerName || 'صاحب النشاط'}*،\n\n` +
    `*التصاميم المرفقة مع الرسالة دي هدية مجانية تماماً ليك من منظومة دليلك!*\n` +
    `كل اللي عليك تطبعها وتحطها في محلك، عشان الزباين يصوروا الـ QR Code بالموبايل ويقيموا مكانك على الخريطة بكل سهولة وبسرعة ويساعدوك تظهر أول نتيجة بحث.\n\n` +
    `*خدمة الطباعة الفاخرة والتوصيل:*\n` +
    `لو تحب نطبعها لك بجودة عالية وفاخرة ونوصلها لغاية عندك في نفس اليوم، التكلفة *100 جنيه بس* (شاملة كل شيء).\n\n` +
    `رد علينا بكلمة *(اطبعلي)* وسيقوم فريقنا بتجهيزها وإرسالها فوراً لموقعكم!\n\n` +
    `منصة دليلك: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getFreeQrGiftWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateFreeQrGiftWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Monthly Campaign 2: Visual Merchandising & Free Store Layout Consultation
 */
export function generateVisualConsultingWhatsAppMessage(biz: Business): string {
  const raw = 
    `*نصيحة ذهبية واستشارة مجانية لتنمية نشاط (${biz.nameAr})*\n` +
    `-----------------------------------------\n` +
    `تحية طيبة أستاذ *${biz.ownerName || 'صاحب النشاط'}*،\n\n` +
    `دراسات مبيعات التجزئة تؤكد أن *أول 3 ثوانٍ* يدخل فيها الزبون محلك تحدد بنسبة 70% قراره بالشراء والشعور بالراحة!\n\n` +
    `*نصائحنا السريعة لك هذا الشهر:*\n` +
    `1. الاهتمام بنظافة مدخل المحل والواجهة الخارجية لجذب المارة.\n` +
    `2. تركيز الإضاءة القوية على المنتجات الأكثر مبيعاً والأعلى ربحية.\n` +
    `3. جعل ممرات الحركة واسعة ومريحة لسهولة تصفح المحل.\n\n` +
    `*خدمة استشارية مجانية تماماً ليك:*\n` +
    `صور لنا واجهة محلك أو طريقة عرض المنتجات وأرسلها هنا، وسيقوم مستشارو الديكور والتسويق لدينا بتقديم *تقرير واقتراحات تنسيق وتطوير مجانية وبكل سخاء!*\n\n` +
    `نجاحك وتألق محلك هو فخرنا الدائم في دليلك\n` +
    `موقعنا: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getVisualConsultingWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateVisualConsultingWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Monthly Campaign 3: Business Pulse Checkup & Free Working Hours Update
 */
export function generateBusinessCheckupWhatsAppMessage(biz: Business): string {
  const raw = 
    `*متابعة دورية واطمئنان على نشاط (${biz.nameAr})*\n` +
    `-----------------------------------------\n` +
    `أهلاً بك أستاذ *${biz.ownerName || 'صاحب النشاط'}*،\n\n` +
    `فريق عمل «دليلك» يطمئن على حركة المبيعات والزبائن لديكم هذا الشهر!\n\n` +
    `*نحب نذكرك بأن خدمات الدعم الفني في دليلك تحت أمرك مجاناً:*\n` +
    `- هل ترغب في تحديث مواعيد وساعات العمل للموسم؟\n` +
    `- هل تم تغيير أرقام الهواتف أو إضافة خدمات جديدة للمحل؟\n` +
    `- هل تواجه أي استفسار حول ظهور مكانك على الخرائط؟\n\n` +
    `أرسل لنا أي تعديل وسنقوم بتحديثه فوراً على الخرائط والمنظومة لتظل دائماً في صدارة نتائج البحث.\n\n` +
    `دائماً في خدمتكم بكل سرور!\n` +
    `دليل الأنشطة: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getBusinessCheckupWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateBusinessCheckupWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Monthly Campaign 4: Social Proof Success Story & Targeted VIP Ads Pitch
 */
export function generateSocialProofUpgradeWhatsAppMessage(biz: Business): string {
  const raw = 
    `*كيف تضاعف عدد الزبائن القادمين من منطقتك الجغرافية؟*\n` +
    `-----------------------------------------\n` +
    `أهلاً أستاذ *${biz.ownerName || 'صاحب النشاط'}* في *(${biz.nameAr})*،\n\n` +
    `الشهر الماضي، أحد الأنشطة الشريكة معنا حقق قفزة بنسبة 40% في الزيارات والطلبات بفضل تفعيل *«باقة التسويق الميداني والربط الذكي VIP»*:\n\n` +
    `*ماذا تتضمن الباقة؟*\n` +
    `1. تصوير ومونتاج فيديو ريلز إعلاني قصير احترافي لمحلكم.\n` +
    `2. إطلاق حملة إعلانات ممولة جغرافية تستهدف سكان منطقتك المحيطة بمحلك بدقة.\n` +
    `3. إدارة احترافية لتقييمات Google Maps لرفع تصنيف محلك إلى 5 نجوم.\n\n` +
    `*إذا كنت جاهزاً للقفزة القادمة في مبيعات نشاطكم:*\n` +
    `تواصل معنا اليوم لحجز جلسة التطوير وتفعيل الباقة بخصم خاص لشركاء دليلك!\n\n` +
    `فريق النمو والتطوير — منظومة دليلك\n` +
    `الموقع الرسمي: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getSocialProofUpgradeWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateSocialProofUpgradeWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

// -----------------------------------------------------------------------------
// FIELD REPRESENTATIVE INTRO MESSAGE (EXCLUSIVE FOR REPS ON ACTIVITY CARD)
// -----------------------------------------------------------------------------

/**
 * Event 5: Field Representative Direct Contact Message
 * Informs the owner that the official platform account handles the invoice and follow-ups
 */
export function generateRepFieldIntroWhatsAppMessage(biz: Business, repName?: string): string {
  const finalRepName = repName || biz.repName || 'المندوب الميداني';
  const ownerName = biz.ownerName || 'صاحب النشاط';
  const bizName = biz.nameAr || 'نشاطكم التجاري';

  const raw = 
    `السلام عليكم أستاذ *${ownerName}* 🤝\n\n` +
    `معك *${finalRepName}*، المندوب الميداني المعتمد من منصة *«دليلك»*.\n` +
    `تشرفت بزيارتكم اليوم وتوثيق نشاطكم التجاري *(${bizName})*.\n\n` +
    `نحيط سيادتكم علماً بأن *حساب المنصة الرسمي* سيقوم بإرسال الفاتورة الإلكترونية المعتمدة لحضرتكم عبر الواتساب، كما أن كافة المتابعات والالتزامات وإجراءات التوثيق تتم مباشرة من خلالهم عبر الواتساب.\n\n` +
    `سعدت جداً بخدمتكم وتمنياتنا لنشاطكم بدوام التوفيق والازدهار! ✨`;

  return cleanWhatsAppText(raw);
}

export function getRepFieldIntroWhatsAppUrl(biz: Business, repName?: string): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateRepFieldIntroWhatsAppMessage(biz, repName));
  return `https://wa.me/${phone}?text=${text}`;
}

