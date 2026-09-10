import { Business } from '../types';
import { PACKAGES } from '../data/mockData';
import { formatWhatsAppPhone, safeWhatsAppEncode, cleanWhatsAppText } from './whatsapp/phoneFormatter';

/**
 * Generate formatted WhatsApp marketing pitch message for available package upgrades
 */
export function generateUpgradeOffersWhatsAppMessage(business: Business): string {
  const owner = business.ownerName || 'عميلنا العزيز';
  const bizName = business.nameAr || 'نشاطكم التجاري';

  const otherPackages = PACKAGES.filter((p) => p.id !== business.packageId);

  let message =
    `*السلام عليكم أستاذ / ${owner}* 🌸\n` +
    `بخصوص نشاطكم التجاري *"${bizName}"* المسجل لدى *منصة دليلك لخرائط جوجل* 🗺️\n\n` +
    `يسعدنا أن نقدم لكم عروض التطوير والتسويق الحصرية لنقل نشاطكم لمستوى أعلى وزيادة مبيعاتكم:\n\n` +
    `-----------------------------------------\n`;

  otherPackages.forEach((pkg) => {
    const isVip = pkg.id === 'pkg_vip';
    const isPro = pkg.id === 'pkg_pro';
    const icon = isVip ? '👑' : isPro ? '🚀' : '✨';

    const priceText = pkg.priceLabel ? pkg.priceLabel : `${pkg.price} ج.م${isVip ? ' أول شهر' : ''}`;
    message += `${icon} *${pkg.title}* (${priceText})\n`;
    message += `📝 *نبذة:* ${pkg.description}\n`;
    message += `💎 *أهم المميزات:*\n`;

    pkg.features.forEach((feat) => {
      message += `  • ${feat}\n`;
    });

    message += `\n-----------------------------------------\n`;
  });

  message +=
    `💡 *ملاحظة:* يمكنكم تفعيل أي من هذه العروض الآن للاستفادة الفورية من زيادة الوصول وجذب الزبائن.\n\n` +
    `يسعدنا الرد على كافة استفساراتكم ومرافقتكم نحو النجاح!\n` +
    `*فريق منصة دليلك للتسويق والخرائط الذكية* 🗺️✨`;

  return message;
}

/**
 * Generate WhatsApp URL for package upgrade offers
 */
export function getUpgradeOffersWhatsAppUrl(business: Business): string {
  const message = cleanWhatsAppText(generateUpgradeOffersWhatsAppMessage(business));
  const phone = formatWhatsAppPhone(business.ownerPhone || business.phone);
  return `https://wa.me/${phone}?text=${safeWhatsAppEncode(message)}`;
}
