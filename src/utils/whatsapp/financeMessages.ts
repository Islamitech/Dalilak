import { Business, AdditionalServiceInvoice } from '../../types';
import { formatWhatsAppPhone, cleanWhatsAppText, safeWhatsAppEncode } from './phoneFormatter';
import { OFFICIAL_PLATFORM_HEADER, getVenueContextLabel, DIRECTORY_URL } from './venueContext';

/**
 * Reads the active platform payment configuration from localStorage with safe fallback.
 */
export function getActivePaymentConfig() {
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

// -----------------------------------------------------------------------------
// OFFICIAL STREAMLINED INVOICE MESSAGE
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
// ADDITIONAL SERVICE INVOICE
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
// CONSOLIDATED MASTER COLLECTION
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
// PAYMENT SETTLEMENT RECEIPT
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
// OVERDUE WARNING & ACCOUNTABILITY
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
// POST-DEADLINE LEGAL ACTIONS
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
