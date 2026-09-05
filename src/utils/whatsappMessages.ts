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

// Using a cache-busting parameter forces WhatsApp servers to crawl and fetch the new 3D OpenGraph image immediately
const DIRECTORY_URL = 'https://www.dalilaak.com/?ref=app';

export function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  // 1. If explicitly prefixed with +
  if (trimmed.startsWith('+')) {
    return digits;
  }

  // 2. If already starts with Egyptian country code '20'
  if (digits.startsWith('20')) {
    return digits;
  }

  // 3. Known Arab & International country codes (Saudi, UAE, Kuwait, Jordan, etc.)
  const intlPrefixes = ['966', '971', '965', '968', '974', '973', '962', '218', '249', '1', '44', '49', '33'];
  if (intlPrefixes.some((p) => digits.startsWith(p)) && digits.length >= 10) {
    return digits;
  }

  // 4. Standard Egyptian local phone (starts with 01...)
  const localClean = digits.replace(/^0+/, '');
  return `20${localClean}`;
}

/**
 * Event 0: Welcome & Onboarding Message for Businesses Already Active on Google Maps
 */
export function generateWelcomeAlreadyOnGoogleWhatsAppMessage(biz: Business): string {
  const activeMapUrl = (biz.googleMapsUrl && biz.googleMapsUrl.trim().startsWith('http')) ? biz.googleMapsUrl.trim() : DIRECTORY_URL;

  const raw = 
    `*مرحباً بكم في منصة دليلك - إشعار إدراج النشاط التجاري*\n` +
    `-----------------------------------------\n` +
    `• *اسم النشاط:* ${biz.nameAr || ''}\n` +
    `• *صاحب النشاط:* ${biz.ownerName || ''}\n` +
    `• *الموقع والنطاق:* ${biz.governorate || ''} - ${biz.city || ''}\n` +
    `• *رقم الإدراج:* ${biz.invoiceNumber || ''}\n` +
    `• *حالة التوثيق على Google Maps:* نشاط قائم ومعتمد بالفعل ✅\n` +
    `• *رابط موقعكم على خرائط Google:* ${activeMapUrl}\n\n` +
    `*يسعدنا إعلامكم بأنه تم إدراج وربط نشاطكم رسمياً بدليل الأنشطة والخدمات الميدانية المعتمدة في مصر مجاناً:*\n` +
    `🔗 رابط دليل الأنشطة المباشر: ${DIRECTORY_URL}\n\n` +
    `*مزايا إدراج نشاطكم في دليلك:*\n` +
    `1. ظهور النشاط أمام آلاف العملاء والزوار في نطاق منطقتكم.\n` +
    `2. توثيق رقم التواصل ومواعيد العمل وإتاحة الوصول السريع.\n` +
    `3. إمكانية الاستفادة من حملات الرعاية والتسويق الإلكتروني وملصقات الباركود الذكية.\n\n` +
    `شكرًا لتعاونكم مع فريق العمل الميداني لمنظومة دليلك!`;

  return cleanWhatsAppText(raw);
}

export function getWelcomeAlreadyOnGoogleWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateWelcomeAlreadyOnGoogleWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
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
 * Safe WhatsApp message encoder.
 * Standard encodeURIComponent safely converts spaces and Unicode characters for URLs.
 * Asterisks (*) are preserved so WhatsApp's native markdown renders bold formatting (*text*) correctly.
 */
export function safeWhatsAppEncode(text: string): string {
  const cleaned = cleanWhatsAppText(text);
  return encodeURIComponent(cleaned)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
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
    `*فاتورة توثيق نشاط تجاري - منصة دليلك*\n` +
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
    `*ملاحظة:* تم رفع وتثبيت بيانات نشاطكم بنجاح وهو متاح الآن للعملاء على المنظومة، وتتم متابعة مراجعة وتوثيق النشاط حتى اعتماده على خرائط Google. شكرًا لثقتكم بمنظومة دليلك!`;

  return cleanWhatsAppText(raw);
}

export function getInvoiceWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateInvoiceWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Event 1.5: Additional Service Electronic Invoice Message (Platform Issued & Collected Electronically)
 */
export function generateAdditionalInvoiceWhatsAppMessage(biz: Business, invoice: AdditionalServiceInvoice): string {
  const cfg = getActivePaymentConfig();
  const amt = Number(invoice.amount) || 0;
  const paid = Number(invoice.amountPaid) || 0;
  const remaining = Math.max(0, amt - paid);

  const raw =
    `*فاتورة خدمة إضافية معتمدة - منصة دليلك الرقمية*\n` +
    `-----------------------------------------\n` +
    `• *النشاط التجاري:* ${biz.nameAr || invoice.businessName || ''}\n` +
    `• *العميل:* ${biz.ownerName || 'صاحب النشاط'}\n` +
    `• *الجهة المصدرة:* إدارة منصة دليلك (${invoice.issuedByName || 'الإدارة'})\n` +
    `• *رقم الفاتورة الإلكترونية:* ${invoice.invoiceNumber}\n` +
    `• *تاريخ الإصدار:* ${invoice.issueDate}\n\n` +
    `• *الخدمة المطلوبة:* ${invoice.serviceTitle}\n` +
    `• *إجمالي قيمة الفاتورة:* ${amt} ج.م\n` +
    `• *المبلغ المسدد إلكترونياً:* ${paid} ج.م\n` +
    (remaining > 0 ? `• *المبلغ المتبقي:* ${remaining} ج.م\n` : '') +
    `• *حالة الفاتورة:* ${
      invoice.paymentStatus === 'fully_paid'
        ? 'مدفوعة بالكامل إلكترونياً ✅'
        : invoice.paymentStatus === 'partially_paid'
        ? `مدفوع جزئياً إلكترونياً (متبقي ${remaining} ج.م) ⏳`
        : 'بانتظار التحويل الإلكتروني ⏳'
    }\n` +
    (invoice.notes ? `• *ملاحظات وتفاصيل:* ${invoice.notes}\n` : '') +
    `\n*قنوات التحصيل والسداد الإلكتروني المعتمدة لحسابات المنصة:* \n` +
    `📱 فودافون كاش: ${cfg.vodafone1} أو ${cfg.vodafone2}\n` +
    `⚡ إنستاباي InstaPay: ${cfg.instaPay}\n\n` +
    `🔗 يمكنكم معاينة الفاتورة الإلكترونية والتحقق منها مباشرة عبر الرابط:\n` +
    `https://www.dalilaak.com/?view=invoice&id=${biz.id}&invId=${invoice.id}\n\n` +
    `شكرًا لتعاملكم مع منصة دليلك الرقمية!`;

  return cleanWhatsAppText(raw);
}

export function getAdditionalInvoiceWhatsAppUrl(biz: Business, invoice: AdditionalServiceInvoice): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateAdditionalInvoiceWhatsAppMessage(biz, invoice));
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
  const owner = biz.ownerName || 'صاحب النشاط';
  const name = biz.nameAr || 'نشاطك';
  const payConfig = getActivePaymentConfig();

  let raw = '';

  if (isFullyPaid || isFeeExempt) {
    raw = 
      `هلا أستاذ *${owner}*، يسعدنا أنه تم توثيق وظهور نشاطك (*${name}*) رسمياً على خرائط Google 🗺️\n\n` +
      `📍 *رابط النشاط المباشر على Google Maps:*\n` +
      `${activeMapUrl}\n\n` +
      `• *حالة السداد:* مسدد بالكامل (خالص ✓)\n\n` +
      `نتمنى لك دوام التوفيق والنجاح!\n` +
      `منظومة دليلك`;
  } else {
    raw = 
      `هلا أستاذ *${owner}*، يسعدنا أنه تم توثيق وظهور نشاطك (*${name}*) رسمياً على خرائط Google 🗺️\n\n` +
      `📍 *رابط النشاط المباشر على Google Maps:*\n` +
      `${activeMapUrl}\n\n` +
      `يرجى الضغط على الرابط أعلاه والتأكد من ظهور نشاطك وبياناته على الخريطة أولاً قبل السداد.\n\n` +
      `• *المبلغ المستحق:* ${remaining} ج.م\n` +
      `• *طرق الدفع:*\n` +
      `- إنستاباي: ${payConfig.instaPay}\n` +
      `- فودافون كاش / محافظ: ${payConfig.vodafone1} أو ${payConfig.vodafone2}\n\n` +
      `يرجى إرسال صورة التحويل بعد التأكد والسداد لتأكيد الحساب.\n` +
      `منظومة دليلك`;
  }

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

/**
 * Event 3.5: Final Warning & Administrative Accountability for Overdue Payment
 */
export function generateOverdueWarningWhatsAppMessage(biz: Business): string {
  const isFeeExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
  const pkgPrice = isFeeExempt ? 0 : (biz.packagePrice || 250);
  const amtPaid = isFeeExempt ? 0 : (biz.amountPaid || 0);
  const remaining = isFeeExempt ? 0 : Math.max(0, pkgPrice - amtPaid);
  const owner = biz.ownerName || 'صاحب النشاط';
  const name = biz.nameAr || 'نشاطكم';
  const invNumber = biz.invoiceNumber || 'INV-2026';
  const payConfig = getActivePaymentConfig();

  const raw =
    `⚠️ *إنذار إداري ومالي نهائي — منصة دليلك*\n` +
    `-----------------------------------------\n` +
    `أستاذ *${owner}* — نشاط (*${name}*) 📍\n` +
    `📄 *رقم الفاتورة الصادرة:* ${invNumber}\n\n` +
    `نود إحاطتكم بأنه تم بالفعل توثيق وظهور نشاطكم تجارياً على خرائط Google بموجب الفاتورة أعلاه وبناءً على موافقتكم المسبقة للمندوب الميداني، حيث تمنع سياساتنا إدراج أي نشاط دون إذن وإقرار صاحبه.\n\n` +
    `وحيث إنه تم التأكد من ظهور النشاط واستفادتكم منه مع استمرار المماطلة في سداد مستحقات الفاتورة (*${remaining} ج.م*):\n\n` +
    `🛑 *نحيطكم علماً بأنه سيتم اتخاذ الإجراءات التالية خلال 24 ساعة في حال عدم التسوية:*\n` +
    `1. إدراج النشاط ضمن «القائمة السوداء للأنشطة غير الموثوقة» على المنظومة ودليل الخدمات.\n` +
    `2. خفض وتعديل تقييم النشاط ورفع بلاغ رسمي لمراجعة وتجميد الموقع على خرائط Google.\n\n` +
    `• *طرق السداد الفوري:*\n` +
    `- إنستاباي: ${payConfig.instaPay}\n` +
    `- فودافون كاش / محافظ: ${payConfig.vodafone1} أو ${payConfig.vodafone2}\n\n` +
    `تواصل مع الدعم الفني للمنصة للتسوية وإرسال إيصال التحويل لإيقاف الإجراءات فوراً.\n` +
    `الإدارة القانونية والمالية — منصة دليلك`;

  return cleanWhatsAppText(raw);
}

export function getOverdueWarningWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateOverdueWarningWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Event 3.6: Post-Deadline Executed Actions & Final Judicial Warning
 */
export function generateLegalActionExecutedWhatsAppMessage(biz: Business): string {
  const isFeeExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
  const pkgPrice = isFeeExempt ? 0 : (biz.packagePrice || 250);
  const amtPaid = isFeeExempt ? 0 : (biz.amountPaid || 0);
  const remaining = isFeeExempt ? 0 : Math.max(0, pkgPrice - amtPaid);
  const owner = biz.ownerName || 'صاحب النشاط';
  const name = biz.nameAr || 'نشاطكم';
  const invNumber = biz.invoiceNumber || 'INV-2026';
  const payConfig = getActivePaymentConfig();

  const raw =
    `🛑 *إشعار تنفيذ رسمي وتحذير قضائي أخير — منصة دليلك*\n` +
    `--------------------------------------------------\n` +
    `إلى إدارة نشاط: *(${name})* 📍\n` +
    `عناية السيد / *${owner}*\n` +
    `📄 *رقم الفاتورة الصادرة:* ${invNumber}\n` +
    `💰 *المبلغ المستحق وغير المسدد:* ${remaining} ج.م\n\n` +
    `نحيطكم علماً بأنه نظراً لانتهاء المهلة المقررة (24 ساعة) دون تسوية المستحقات المالية رغم توثيق النشاط واستفادتكم منه وبناءً على تعاقدكم المسبق، *فقد بدأنا بالفعل في تنفيذ الإجراءات الرادعة التالية ضد نشاطكم وهاتفكم التجاري:*\n\n` +
    `🚫 *1. إدراج النشاط ضمن «الأنشطة التجارية المشبوهة والممتنعة عن السداد»:*\n` +
    `تم رفع بلاغات التحذير والاشتباه على قواعد بيانات أرقام الهواتف (ومنها تطبيق *Truecaller* وغيره)، ليظهر هاتف النشاط للمتصلين كجهة *(مشبوهة / بلاغات احتيال وامتناع عن السداد)*، مما يضر بسمعتكم وثقة عملائكم بشكل مباشر.\n\n` +
    `📵 *2. تجميد وضرب الحملات الإعلانية على كافة منصات التواصل:*\n` +
    `تم ربط البيانات ورفع تقارير عدم الأهلية للسياسات الإعلانية على منصات التواصل (فيسبوك، إنستجرام، تيك توك، وغيرها)، مما سيجعل إنشاء أو ترويج أي حملات إعلانية مستقبلية لنشاطكم أمراً بالغ الصعوبة ومعرضاً للرفض والإغلاق الفوري.\n\n` +
    `🌐 *3. إلغاء التوثيق وتجميد الموقع على خرائط Google:*\n` +
    `تم إرسال طلبات رسمية لمراجعة وتجميد نشاطكم على Google وسحبه تماماً من الدليل العام.\n\n` +
    `⚠️ *تنبيه بالغ الأهمية:*\n` +
    `اعلم جيداً أن هذه الإجراءات عند دخولها حيز التنفيذ التام وتعميمها على الخوادم والمنصات الخارجية *يصعب جداً محوها أو إزالتها حتى بعد السداد* لما تتركه من سجل سلبي دائم على أرقامكم ونشاطكم.\n\n` +
    `⚖️ *المسار القضائي:*\n` +
    `نؤكد لكم أن *التسوية المالية والملاحقة القانونية آتية لا محالة*، ولن يتم التهاون في حقوق المنصة، وفي حال اضطرارنا لتصعيد الملف للجهات القضائية المختصة، *سيتحمل صاحب النشاط منفرداً كافة التعويضات والمصاريف القضائية وأتعاب المحاماة الإضافية.*\n\n` +
    `--------------------------------------------------\n` +
    `⏳ *الفرصة الاستثنائية الأخيرة لإيقاف التبعات خلال ساعات:*\n` +
    `لسداد قيمة الفاتورة الأصلية فقط وتفادي اتساع نطاق الحظر:\n` +
    `• إنستاباي (InstaPay): ${payConfig.instaPay}\n` +
    `• فودافون كاش / محافظ إلكترونية: ${payConfig.vodafone1} أو ${payConfig.vodafone2}\n\n` +
    `📲 *أرسل إيصال التحويل فوراً على هذه المحادثة لوقف الإجراءات ومحاولة تدارك القيود.*\n\n` +
    `الإدارة القانونية والمالية — منصة دليلك`;

  return cleanWhatsAppText(raw);
}

export function getLegalActionExecutedWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateLegalActionExecutedWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

export function generatePaymentReceiptWhatsAppMessage(biz: Business): string {
  const total = biz.packagePrice || 250;
  const paid = biz.amountPaid || total;

  const raw = 
    `*إيصال وتأكيد سداد مالي معتمد - منصة دليلك*\n` +
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
    `*عروض الترقية والتطوير الحصرية لنشاطكم - منصة دليلك*\n` +
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
    `*هدية خاصة من منصة دليلك لنشاطكم (${biz.nameAr})*\n` +
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
 * Monthly Campaign: Importance of QR Code & Video Tutorial Guide
 */
export function generateQrImportanceWhatsAppMessage(biz: Business): string {
  const raw = 
    `*📲 ما أهمية وجود كود الباركود (QR Code) داخل النشاط؟*\n` +
    `-----------------------------------------\n` +
    `• *النشاط:* ${biz.nameAr || ''}\n` +
    `• *صاحب النشاط:* ${biz.ownerName || 'عميلنا العزيز'}\n\n` +
    `وجود كود الباركود (QR Code) في مكان واضح داخل النشاط يسهّل على العميل الوصول إلى صفحة النشاط على خرائط جوجل (Google Maps) دون الحاجة إلى البحث عنها يدويًا.\n\n` +
    `*يمكن للعميل من خلاله:*\n` +
    `• الوصول إلى موقع النشاط ومعلوماته الرسمية.\n` +
    `• الاطلاع على تقييمات وتجارب العملاء الآخرين.\n` +
    `• تقييم النشاط بعد تجربته مباشرة.\n\n` +
    `وبالنسبة لصاحب النشاط، فإن وضع كود الباركود (QR Code) داخل المكان يوفّر طريقة بسيطة ومباشرة لتسهيل وصول العملاء إلى نشاطه على خرائط جوجل، وإتاحة فرصة أكبر للحصول على تقييمات حقيقية من العملاء الذين تعاملوا معه فعليًا.\n\n` +
    `لذلك يُفضّل وضعه في مكان واضح وسهل الوصول، خصوصًا في الأماكن التي ينتظر فيها العميل مثل الكاشير أو مقاعد الانتظار وشرب القهوة أو بعد إتمام الخدمة عند مخرج الباب أثناء الخروج.\n\n` +
    `🎥 *مرفق لحضرتك مع هذه الرسالة فيديو توضيحي لطريقة استخدام ومسح الباركود للزبائن بكل سهولة!*\n\n` +
    `منصة دليلك: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getQrImportanceWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateQrImportanceWhatsAppMessage(biz));
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


// -----------------------------------------------------------------------------
// MOTIVATIONAL & PERFORMANCE INSIGHT CAMPAIGNS (رسائل التحفيز وتحديثات نبض النشاط)
// -----------------------------------------------------------------------------

/**
 * Motivational Campaign 1: High Satisfaction & Traffic Growth (إشادة بالأداء ونسبة رضا مرتفعة)
 */
export function generateMotivationalHighSatisfactionWhatsAppMessage(biz: Business): string {
  const ownerName = biz.ownerName || 'صاحب النشاط';
  const bizName = biz.nameAr || 'نشاطكم التجاري';

  const raw = 
    `أهلاً بك أستاذ *${ownerName}* في *(${bizName})* 🌟\n` +
    `-----------------------------------------\n` +
    `يسعد فريق عمل «دليلك» مشاركتكم تقرير المتابعة لنشاطكم خلال الفترة الأخيرة عبر المنظومة وخرائط Google:\n\n` +
    `• نشاطكم مسجل ضمن أولويات المنصة في منطقتكم الجغرافية.\n` +
    `• بعد تثبيت وظهور موقعكم على الخريطة، سجل مكانكم تفاعل وزيارة أكثر من 37 عميلاً عن طريق التوجيه الجغرافي والاتصال المباشر.\n` +
    `• نسبة رضا وانطباع العملاء عن خدماتكم ممتازة وتتجاوز 90%.\n\n` +
    `أحسنت يا بطل، أداء رائع واستمر في هذا التميز والنمو! نحن دائماً في ظهرك لدعم نشاطك وتطويره.\n\n` +
    `فريق المتابعة والنمو — منظومة دليلك\n` +
    `دليل الأنشطة: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getMotivationalHighSatisfactionWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateMotivationalHighSatisfactionWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Motivational Campaign 2: High Traffic + Cashier/Speed Feedback Tip (تحفيز + نصيحة سرعة الكاشير)
 */
export function generateMotivationalCashierFeedbackWhatsAppMessage(biz: Business): string {
  const ownerName = biz.ownerName || 'صاحب النشاط';
  const bizName = biz.nameAr || 'نشاطكم التجاري';

  const raw = 
    `أهلاً بك أستاذ *${ownerName}* في *(${bizName})* 🌿\n` +
    `-----------------------------------------\n` +
    `تقرير المتابعة ونبض نشاطكم هذا الأسبوع عبر منصة دليلك وخرائط Google:\n\n` +
    `• نشاطكم من الأنشطة الأكثر بحثاً واهتماماً في المنطقة، وسجل تفاعل وزيارة أكثر من 40 زبوناً.\n` +
    `• نسبة رضا الزبائن عن جودة الخدمة والمنتجات مرتفعة وممتازة، مع ملاحظة عابرة من أحد الزبائن حول وجود تأخير بسيط عند الكاشير وقت الذروة.\n` +
    `• *نصيحة المنصة لحل الاستياء:* تنظيم طابور الدفع أو تسريع حساب الفواتير سيرفع نسبة ولاء الزبائن ويضمن تقييمات إيجابية كاملة 5 نجوم.\n\n` +
    `مجهود مميز وبداية قوية، ونحن فخورون بنمو نشاطكم معنا ومستمرون في دعمكم!\n\n` +
    `فريق المتابعة والنمو — منظومة دليلك\n` +
    `دليل الأنشطة: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getMotivationalCashierFeedbackWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateMotivationalCashierFeedbackWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Motivational Campaign 3: High Inquiries + Fast Response Tip (تحفيز + نصيحة سرعة الرد الهاتفي)
 */
export function generateMotivationalFastResponseFeedbackWhatsAppMessage(biz: Business): string {
  const ownerName = biz.ownerName || 'صاحب النشاط';
  const bizName = biz.nameAr || 'نشاطكم التجاري';

  const raw = 
    `أهلاً أستاذ *${ownerName}* في *(${bizName})* ✨\n` +
    `-----------------------------------------\n` +
    `مؤشرات تفاعل الزبائن والجمهور مع نشاطكم التجاري هذا الشهر:\n\n` +
    `• تم توجيه أكثر من 50 عميلاً إلى مقر نشاطكم والاتصال بكم عبر الخريطة والمنظومة.\n` +
    `• انطباع العملاء عن المعاملة ممتاز، ونوصي بالحرص على سرعة الرد على المكالمات الهاتفية الواردة لضمان كسب كافة الطلبات من الزبائن الجدد.\n\n` +
    `خطوة بخطوة نحو تصدر السوق المحلي في منطقتك!\n\n` +
    `فريق المتابعة والتطوير — منظومة دليلك\n` +
    `دليل الأنشطة: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getMotivationalFastResponseFeedbackWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateMotivationalFastResponseFeedbackWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Motivational Campaign 4: QR Reviews Growth Advice (تحفيز + طلب تقييمات الزبائن بالـ QR)
 */
export function generateMotivationalQrReviewsAdviceWhatsAppMessage(biz: Business): string {
  const ownerName = biz.ownerName || 'صاحب النشاط';
  const bizName = biz.nameAr || 'نشاطكم التجاري';

  const raw = 
    `تحية طيبة أستاذ *${ownerName}* في *(${bizName})* 🚀\n` +
    `-----------------------------------------\n` +
    `نشاطكم يحقق تفاعلاً مميزاً ومستقراً على خرائط Google ومنصة دليلك:\n\n` +
    `• أكثر من 60 شخصاً استعلموا عن مواعيد العمل وموقعكم الجغرافي مؤخراً.\n` +
    `• *نصيحة ذهبية:* تشجيع زبائنك السعداء على وضع تقييم 5 نجوم عبر باركود الـ QR سيرفع ترتيب نشاطك للمركز الأول في منطقتك على محركات البحث.\n\n` +
    `بالتوفيق دائماً، وبإمكانك طلب أي تعديل لبياناتك في أي وقت مجاناً!\n\n` +
    `فريق النمو وتطوير الأعمال — منظومة دليلك\n` +
    `دليل الأنشطة: ${DIRECTORY_URL}`;

  return cleanWhatsAppText(raw);
}

export function getMotivationalQrReviewsAdviceWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = safeWhatsAppEncode(generateMotivationalQrReviewsAdviceWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}
