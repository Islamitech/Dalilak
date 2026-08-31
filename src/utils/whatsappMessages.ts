import { Business } from '../types';

const DIRECTORY_URL = 'https://www.dalilaak.com/';

export function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '').replace(/^0/, '');
  return clean.startsWith('20') ? clean : `20${clean}`;
}

/**
 * Event 1: Initial Registration & Official Invoice Message
 */
export function generateInvoiceWhatsAppMessage(biz: Business): string {
  const pkgPrice = biz.packagePrice || 250;
  const amtPaid = biz.amountPaid || 0;
  const remaining = Math.max(0, pkgPrice - amtPaid);

  return (
    `*فاتورة توثيق نشاط تجاري - شركة دليلك لخرائط جوجل* 🗺️\n` +
    `-----------------------------------------\n` +
    `📋 *اسم النشاط:* ${biz.nameAr || ''}\n` +
    `👤 *صاحب النشاط:* ${biz.ownerName || ''}\n` +
    `📍 *الموقع:* ${biz.governorate || ''} - ${biz.city || ''}\n` +
    `🧾 *رقم الفاتورة:* ${biz.invoiceNumber || ''}\n` +
    `📅 *تاريخ الإصدار:* ${biz.invoiceDate || ''}\n\n` +
    `📦 *الباقة المختارة:* ${biz.packageName || 'باقة التوثيق الأساسي'}\n` +
    `💰 *إجمالي قيمة الباقة:* ${pkgPrice} ج.م\n` +
    `✅ *المبلغ المدفوع:* ${amtPaid} ج.م\n` +
    `⏳ *المبلغ المتبقي:* ${remaining} ج.م\n` +
    `📌 *حالة الدفع:* ${
      biz.paymentStatus === 'fully_paid'
        ? 'مدفوعة بالكامل ✅'
        : biz.paymentStatus === 'partially_paid'
        ? `مدفوع جزء منها (متبقي ${remaining} ج.م) ⏳`
        : 'لم يتم الدفع بعد ❌'
    }\n\n` +
    `🌟 *تهانينا! تم إدراج ونشر نشاطكم مباشرة في دليل الأنشطة والخدمات المعتمد في مصر:* ✨\n` +
    `🌐 *رابط دليل الأنشطة المباشر:* ${DIRECTORY_URL}\n\n` +
    `*ملاحظة:* تم رفع وتثبيت بيانات نشاطكم بنجاح وهو متاح الآن للعملاء على المنظومة، وتتم متابعة مراجعة وتوثيق النشاط حتى اعتماده على خرائط Google. شكرًا لثقتكم بشركة دليلك!`
  );
}

export function getInvoiceWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = encodeURIComponent(generateInvoiceWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Event 2: Google Maps Live Verification & Approval Notification Message
 */
export function generateGoogleMapsVerifiedWhatsAppMessage(biz: Business): string {
  const pkgPrice = biz.packagePrice || 250;
  const amtPaid = biz.amountPaid || 0;
  const remaining = Math.max(0, pkgPrice - amtPaid);
  const isFullyPaid = biz.paymentStatus === 'fully_paid' || remaining === 0;
  const activeMapUrl = biz.googleMapsUrl || (biz.lat && biz.lng ? `https://www.google.com/maps/?q=${biz.lat},${biz.lng}` : DIRECTORY_URL);

  return (
    `*🎉 تهانينا! تم توثيق واعتماد نشاطكم رسمياً على خرائط Google 🗺️*\n\n` +
    `أهلاً بحضرتك أستاذ *${biz.ownerName || 'صاحب النشاط'}*\n` +
    `يسر شركة *دليلك* إعلامكم بأنه تم نشر وتفعيل نشاطكم التجاري *(${biz.nameAr})* بنجاح على خرائط Google Maps والمنصات الجغرافية المعتمدة.\n\n` +
    `📍 *رابط موقعكم المباشر على خرائط Google:*\n` +
    `${activeMapUrl}\n\n` +
    `🌐 *رابط صفحتكم على دليل الأنشطة المعتمد:* ${DIRECTORY_URL}\n\n` +
    (isFullyPaid
      ? `✅ *حالة الحساب:* مسدد بالكامل (${pkgPrice} ج.م) — لا توجد أي مستحقات معلقة.\n\n`
      : `⚠️ *حالة الحساب:* متبقي سداد (*${remaining} ج.م*)\n\n` +
        `💳 *طرق الدفع المعتمدة للتسوية:*\n` +
        `- إنستاباي (InstaPay): @daz31181\n` +
        `- فودافون كاش / محافظ إلكترونية: 01143888355 أو 01556221141\n\n` +
        `*(يرجى إرسال صورة إيصال التحويل لتأكيد إتمام التسوية وإصدار المخالصة النهائية)*\n\n`) +
    `نتمنى لنشاطكم دوام التوفيق والازدهار!\n` +
    `فريق عمل منظومة دليلك 🚀`
  );
}

export function getGoogleMapsVerifiedWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = encodeURIComponent(generateGoogleMapsVerifiedWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Event 3: Full Payment Settlement & Final Receipt Message
 */
export function generatePaymentReceiptWhatsAppMessage(biz: Business): string {
  const total = biz.packagePrice || 250;
  const paid = biz.amountPaid || total;

  return (
    `*🧾 إيصال وتأكيد سداد مالي معتمد - شركة دليلك* ✅\n` +
    `-----------------------------------------\n` +
    `عزيزي العميل أستاذ / *${biz.ownerName || 'صاحب النشاط'}*\n` +
    `نؤكد استلام واعتماد سداد اشتراك نشاطكم التجاري *(${biz.nameAr})*:\n\n` +
    `📦 *الباقة:* ${biz.packageName || 'باقة التوثيق'}\n` +
    `💰 *إجمالي قيمة الاشتراك:* ${total} ج.م\n` +
    `💵 *المبلغ المسدد:* ${paid} ج.م\n` +
    `✨ *المتبقي:* 0 ج.م (خالص تماماً ومسدد بالكامل)\n` +
    `🧾 *رقم الفاتورة المرجعي:* ${biz.invoiceNumber || 'INV-2026'}\n\n` +
    `🌐 *رابط دليل الأنشطة:* ${DIRECTORY_URL}\n\n` +
    `نشكركم لالتزامكم وثقتكم المستمرة في منظومة دليلك!`
  );
}

export function getPaymentReceiptWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = encodeURIComponent(generatePaymentReceiptWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * Event 4: Exclusive Package Upgrade Offers Message
 */
export function generateUpgradeOffersWhatsAppMessage(biz: Business): string {
  return (
    `*🌟 عروض الترقية والتطوير الحصرية لنشاطكم - شركة دليلك* 🚀\n` +
    `-----------------------------------------\n` +
    `تحية طيبة أستاذ *${biz.ownerName || 'صاحب النشاط'}*، شريك نجاحنا في *(${biz.nameAr})*\n\n` +
    `يسعدنا تقديم باقات الترقية الحصرية المخصصة لمضاعفة مبيعات وانتشار نشاطكم التجاري:\n\n` +
    `1️⃣ *باقة التأسيس والربط الذكي (عرض 500 ج.م بدلاً من 1000 ج.م):*\n` +
    `- تثبيت رسمي ومتقدم على Google Maps مع لوحة تحكم كاملة.\n` +
    `- ربط احترافي مع WhatsApp Business، كتالوج المنتجات، وصفحات التواصل.\n` +
    `- توليد باركود ذكي (QR Code) مع ستاند طاولة رسمي لموقعك.\n` +
    `- دعم فني مخصص لمدة عام كامل.\n\n` +
    `2️⃣ *باقة الدعم الميداني والتسويق الرقمي VIP (باقة 1000 ج.م):*\n` +
    `- جلسة تصوير احترافية ومونتاج فيديو ترويجي قصير (Reel) لمحلكم.\n` +
    `- حملة إعلانات ممولة مستهدفة لمنطقتك الجغرافية لزيادة الزبائن.\n` +
    `- تقارير شهرية وإدارة كاملة لتقييمات Google ومراجعات العملاء.\n\n` +
    `📞 *لطلب الترقية الفورية:* تواصل معنا مباشرة عبر هذه المحادثة لحجز موعد التطوير!\n` +
    `🌐 الموقع الرسمي: ${DIRECTORY_URL}`
  );
}

export function getUpgradeOffersWhatsAppUrl(biz: Business): string {
  const phone = formatWhatsAppPhone(biz.ownerPhone || biz.phone);
  const text = encodeURIComponent(generateUpgradeOffersWhatsAppMessage(biz));
  return `https://wa.me/${phone}?text=${text}`;
}
