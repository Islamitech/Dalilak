import { Business } from '../../types';
import { formatWhatsAppPhone, cleanWhatsAppText, safeWhatsAppEncode } from './phoneFormatter';
import { OFFICIAL_PLATFORM_HEADER, getVenueContextLabel, DIRECTORY_URL } from './venueContext';

// -----------------------------------------------------------------------------
// TRENDING VENUES FREE HONORARY INVITATION
// -----------------------------------------------------------------------------

export function generateTrendingFreeInvitationWhatsAppMessage(biz: Business): string {
  const venueName = biz.nameAr ? `«${biz.nameAr}»` : 'منشأتكم';

  const raw =
    `السلام عليكم ورحمة الله وبركاته\n` +
    `تحياتنا لإدارة ${venueName} الكرام،\n` +
    `-----------------------------------------\n` +
    `تشرّف فريق دليلك بالتواصل معكم بعد رصد منشأتكم ضمن أبرز المعالم التجارية الرائدة في المنطقة.\n\n` +
    `نودّ إبلاغكم باختيار ${venueName} للحصول على *إدراج شرفي مجاني بالكامل* في دليلنا الرسمي المعتمد — *بدون أي رسوم أو اشتراكات مالية نهائياً*، وذلك تقديراً لمكانتكم وتميّزكم في المنطقة.\n\n` +
    `*مزايا الإدراج الشرفي:*\n` +
    `1. صفحة رسمية معتمدة باسم منشأتكم على منصتنا\n` +
    `2. زر توجيه فوري مباشر بخرائط Google لإيصال الزوار إليكم\n` +
    `3. عرض مواعيد العمل وأرقام التواصل بشكل مرتّب للجمهور\n` +
    `4. معرض صور فائق الجودة يعرض مميزات منشأتكم\n\n` +
    `للتفعيل الفوري، يكفي الردّ بكلمة واحدة: *موافق*\n\n` +
    `إدارة منصة دليلك\n` +
    `الموقع الرسمي: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getTrendingFreeInvitationWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateTrendingFreeInvitationWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

// -----------------------------------------------------------------------------
// TRENDING VENUE PERMISSION INQUIRY
// -----------------------------------------------------------------------------

/**
 * رسالة طلب السماح والاستئذان للمنشآت الأكثر رواجاً (إدراج شرفي مجاني تماماً)
 * بالصيغة الرسمية المتزنة المعتمدة بالبروتوكول السادس — مُحدَّثة التحديث 34
 */
export function generateTrendingVenuePermissionWhatsAppMessage(lead?: { clientName?: string; businessName?: string }): string {
  const targetName = lead?.businessName ? `«${lead.businessName}»` : (lead?.clientName ? `«${lead.clientName}»` : 'منشأتكم');

  const raw =
    `السلام عليكم ورحمة الله وبركاته\n` +
    `تحياتنا لإدارة ${targetName} الكرام،\n` +
    `-----------------------------------------\n` +
    `تشرّف فريق دليلك بالتواصل معكم بعد رصد منشأتكم ضمن أبرز المعالم التجارية الرائدة في المنطقة.\n\n` +
    `نودّ إبلاغكم باختيار ${targetName} للحصول على *إدراج شرفي مجاني بالكامل* في دليلنا الرسمي المعتمد — *بدون أي رسوم أو اشتراكات مالية نهائياً*، وذلك تقديراً لمكانتكم وتميّزكم في المنطقة.\n\n` +
    `*مزايا الإدراج الشرفي:*\n` +
    `1. صفحة رسمية معتمدة باسم منشأتكم على منصتنا\n` +
    `2. زر توجيه فوري مباشر بخرائط Google لإيصال الزوار إليكم\n` +
    `3. عرض مواعيد العمل وأرقام التواصل بشكل مرتّب للجمهور\n` +
    `4. معرض صور فائق الجودة يعرض مميزات منشأتكم\n\n` +
    `للتفعيل الفوري، يكفي الردّ بكلمة واحدة: *موافق*\n\n` +
    `إدارة منصة دليلك\n` +
    `الموقع الرسمي: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getTrendingVenuePermissionWhatsAppUrl(phone?: string, lead?: { clientName?: string; businessName?: string }): string {
  const cleanPhone = formatWhatsAppPhone(phone);
  const text = safeWhatsAppEncode(generateTrendingVenuePermissionWhatsAppMessage(lead));
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

// -----------------------------------------------------------------------------
// FIELD REPRESENTATIVE DIRECT CONTACT MESSAGE
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
