import { PRIMARY_WHATSAPP_SENDER_PHONE } from '../../../../utils/permissions';
import { getApiAuthHeaders } from '../../../../utils/storage';
import { TemplateDefinition } from './types';

export { PRIMARY_WHATSAPP_SENDER_PHONE };

// ☎️ Identifies Egyptian Landline Area Codes and Short Hotlines
export function isLandlineOrHotline(phone?: string | null): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return false;

  // Short hotlines or landlines (5 to 8 digits that don't start with 01)
  if (digits.length <= 8 && !digits.startsWith('01')) return true;

  // Egyptian landlines starting with 02, 03, 013, 040-097
  if (
    /^(?:0020|20)?(?:02|03|013|040|045|047|048|050|055|062|064|065|066|068|069|082|084|086|088|092|093|095|096|097)\d{5,8}$/.test(
      digits
    )
  ) {
    return true;
  }

  // Explicit Cairo/Giza and Alexandria landlines with 7 or 8 local digits
  if (/^(?:02|03)\d{7,8}$/.test(digits)) return true;

  return false;
}

export function isEgyptianMobile(phone?: string | null): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return /^(?:0020|20)?(?:0)?1[0125]\d{8}$/.test(digits);
}

// 🛡️ Phone validator helper (must be valid mobile, not landline, not dummy)
export function isValidTargetPhone(phone?: string | null): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 9) return false;

  // Reject dummy placeholder numbers
  if (
    /^0+$/.test(digits) ||
    digits === '01000000000' ||
    digits === '01100000000' ||
    digits === '01200000000' ||
    digits === '01500000000' ||
    digits === '0000000000'
  ) {
    return false;
  }

  // Reject landlines and hotlines
  if (isLandlineOrHotline(digits)) {
    return false;
  }

  if (isEgyptianMobile(digits)) return true;
  if (digits.length >= 11 && !digits.startsWith('0')) return true;

  return false;
}

export function formatPhoneForWaLink(rawPhone?: string | null): string | null {
  if (!rawPhone) return null;
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.length < 8) return null;
  if (!isValidTargetPhone(digits)) return null;

  if (digits.startsWith('0020')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('01') && digits.length === 11) {
    digits = '2' + digits;
  } else if (digits.startsWith('1') && digits.length === 10) {
    digits = '20' + digits;
  } else if (!digits.startsWith('20') && digits.length === 10) {
    digits = '20' + digits;
  }
  return digits;
}

/**
 * 🎲 Spintax Resolution Helper
 * Resolves {Option A|Option B|Option C} patterns into random single selections
 */
export function resolveSpintaxText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  const regex = /\{([^{}]+)\}/g;
  let result = text;
  let safetyCounter = 0;
  while (regex.test(result) && safetyCounter < 20) {
    result = result.replace(regex, (_, choices) => {
      const parts = choices.split('|');
      const selected = parts[Math.floor(Math.random() * parts.length)];
      return selected !== undefined ? selected.trim() : '';
    });
    safetyCounter++;
  }
  return result;
}

// 🛡️ SAFE API FETCH HELPER (With Dual Localhost & 127.0.0.1 Auto-Probe + Auth Headers Injection)
export async function safeFetchGatewayApi(
  endpoint: string,
  options?: RequestInit,
  customBaseUrl?: string
): Promise<{ success: boolean; data?: any; error?: string; isVercelStatic?: boolean }> {
  try {
    const rawBase = (customBaseUrl || localStorage.getItem('dalelak_whatsapp_gateway_url') || '').trim();
    const baseUrl = rawBase ? rawBase.replace(/\/$/, '') : '';

    const authHeaders = getApiAuthHeaders();
    const mergedHeaders = {
      ...authHeaders,
      ...((options?.headers as Record<string, string>) || {}),
    };
    const reqOptions: RequestInit = {
      ...options,
      headers: mergedHeaders,
    };

    const probeLocalCandidates = async (): Promise<{ success: boolean; data?: any; error?: string } | null> => {
      const candidates = [
        'http://localhost:3005',
        'http://127.0.0.1:3005',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
      ];
      for (const base of candidates) {
        try {
          const localUrl = `${base}${endpoint}`;
          const localRes = await fetch(localUrl, reqOptions);
          const localText = await localRes.text();
          if (localText && !localText.trim().startsWith('<!doctype') && !localText.trim().startsWith('<html')) {
            const parsed = JSON.parse(localText);
            localStorage.setItem('dalelak_whatsapp_gateway_url', base);
            return {
              success: localRes.ok && parsed.success !== false,
              data: parsed,
              error: parsed.error,
            };
          }
        } catch {}
      }
      return null;
    };

    const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint;

    let res: Response;
    let rawText = '';

    try {
      res = await fetch(url, reqOptions);
      rawText = await res.text();
    } catch (fetchErr: any) {
      const localResult = await probeLocalCandidates();
      if (localResult) return localResult;
      throw fetchErr;
    }

    if (
      !rawText ||
      rawText.trim().length === 0 ||
      res.status === 405 ||
      res.status === 404 ||
      rawText.trim().startsWith('<!doctype') ||
      rawText.trim().startsWith('<html')
    ) {
      const localResult = await probeLocalCandidates();
      if (localResult) return localResult;

      return {
        success: false,
        isVercelStatic: true,
        error:
          'سيرفر الواتساب المستقل يتطلب تشغيله محلياً عبر تشغيل_سيرفر_الواتساب.bat أو الأمر npm run whatsapp (المنفذ 3005). يمكنك أيضاً استخدام «الوضع المباشر للكمبيوتر عبر WhatsApp Web» فوراً بنقرة واحدة.',
      };
    }

    if (!rawText || rawText.trim().length === 0) {
      return {
        success: false,
        error: `استجابة فارغة من السيرفر (كود ${res.status})`,
      };
    }

    if (rawText.trim().startsWith('<!doctype') || rawText.trim().startsWith('<html')) {
      return {
        success: false,
        isVercelStatic: true,
        error:
          'استجاب السيرفر بصفحة واجهة ساكنة. يرجى تفعيل «الوضع المباشر للحاسوب عبر WhatsApp Web» أو تشغيل الخادم محلياً.',
      };
    }

    try {
      const parsed = JSON.parse(rawText);
      return {
        success: res.ok && parsed.success !== false,
        data: parsed,
        error: parsed.error,
      };
    } catch {
      return {
        success: false,
        error: `استجابة غير صالحة من السيرفر (كود ${res.status})`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message?.includes('Failed to fetch')
        ? 'تعذر الاتصال بسيرفر الواتساب. تأكد من تشغيل السيرفر على هذا الحاسوب (npm run dev) أو استخدم «الوضع المباشر السريع للكمبيوتر».'
        : err?.message || 'خطأ في الاتصال بالسيرفر',
    };
  }
}

// 📋 Pre-configured high-conversion official message templates
export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    id: 'hadayek_invitation',
    name: 'دعوة مجتمع حدائق الأهرام (تخصيص + طلب صور وتواصل)',
    badge: 'موصى به لحملة حدائق الأهرام 🌟',
    badgeColor: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    description: 'دعوة مخصصة لسكان وعاملي حدائق الأهرام تتضمن اسم المنشأة، رابط المعاينة المباشر، طلب صور ورقم تواصل، والتنبيه المهذب للحفاظ على الإدراج.',
    defaultText: `أهلاً بحضرتك في *دليلك* 💐

لأنك من سكان أو العاملين الكرام بـ *حدائق الأهرام*، تم إدراج نشاطك:
🌟 *({name})*
كـ *إدراج شرفي مجاني مدى الحياة (0.00 ج.م)* على منصة «دليلك» — التطبيق الجغرافي الذكي اللي بيوصل عيادتك، محلك، أو حرفتك لكل اللي بيدوروا على خدماتك في نطاقك الجغرافي.

🔗 *رابط كارت نشاطك ومعاينته واستلام هديتك الترويجية:*
{url}

📸 *علشان نفعل بطاقتك وتظهر للجمهور بأعلى جودة:*
لو مهتم، ابعتلنا هنا مباشرة:
1. نوع وتفاصيل النشاط بدقة.
2. رقم التليفون اللي عليه واتساب للتواصل المباشر مع الزوار والعملاء.
3. كام صورة مميزة للمكان علشان تنزل في الكارت التعريفي بتاعك.

❓ *حابب تعرف أكتر أو تسأل إحنا مين ونطاق تغطيتنا؟*
تفضل اسأل وإحنا هنجاوبك على أي استفسار بكل ترحيب 🤝

🚫 *غير مهتم؟*
شرفتنا ونعتذر جداً للإزعاج، لا داعي للتفاعل مع الرسالة *(ملاحظة: قد يتم إزالة النشاط إذا لم يثبت وسيلة تواصل فعلية)*.

مع خالص التقدير والتمنيات بالتوفيق 💐
*فريق إدارة منصة دليلك*`,
  },
  {
    id: 'honorary_invitation',
    name: 'دعوة إدراج شرفي رسمي مجاني (0.00$)',
    badge: 'موصى به للمستوردين من Google',
    badgeColor: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
    description: 'دعوة ترحيبية رسمية لإعلام صاحب المنشأة بإدراجه كشريك استراتيجي مجاناً في دليل المحافظة مع لمحة عن الخدمات الإعلانية الداعمة.',
    defaultText: `السلام عليكم ورحمة الله وبركاته،

تحية طيبة لإدارة {name} المحترمين 💐

يسعدنا إعلامكم بأنه تم اختيار واعتماد منشأتكم {name} رسميًا كأحد المعالم والأنشطة المميزة ضمن:
🌟 *دليل خدمات المحافظة الذكي* (منصة دليلك)

✨ *مزايا إدراجكم الشرفي المجاني تماماً (0.00 ج.م):*
1. إدراج وتوثيق رقمي مجاني بالكامل وبدون أي اشتراكات أو رسوم نهائياً ودائماً.
2. ظهور رسمي موثق لرواد المنطقة الباحثين عن خدماتكم.
3. صفحة رقمية متكاملة تتضمن الاتصال المباشر، موقعكم الجغرافي، وساعات العمل.
4. دعم كامل للربط المباشر مع خرائط Google.

🔗 *يمكنكم معاينة بطاقة منشأتكم الرقمية عبر الرابط المعتمد التالي:*
{url}

💡 *لمحة عن خدماتنا لشركاء النجاح:*
بجانب التواجد المجاني التام في الدليل، يقدم فريق «دليلك» خدمات احترافية داعمة لنمو أعمالكم تشمل (التسويق الإعلاني الموجه، تصوير ومونتاج الفيديوهات Reels، وتعزيز الظهور الرقمي على Google والمنصات) — ننفذها لكم *بأعلى معايير الجودة وبأسعار رمزية ومنخفضة جداً*.

📞 *للتواصل المباشر مع خدمة العملاء:*
لتحسين وتحديث بطاقة النشاط في الدليل، إرسال صور أو معلومات دقيقة، أو إبداء أي تعليق؛ يرجى التواصل مباشرة عبر واتساب مع الرقم الرسمي لخدمة العملاء:
📲 01556221141 (https://wa.me/201556221141)

مع خالص التحية والتقدير،
*فريق إدارة منصة دليلك المعتمد*`,
  },
  {
    id: 'directory_live',
    name: 'إشعار نشر وتفعيل الصفحة بالدليل',
    badge: 'للأنشطة المكتملة',
    badgeColor: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    description: 'إشعار مباشر باكتمال تجهيز ونشر صفحة النشاط وظهورها للجمهور مع رابط مباشر للمعاينة.',
    defaultText: `أهلاً وسهلاً بكم {owner} 💐
إدارة {name} الكرام،

يسرنا إبلاغكم بأن صفحتكم الرسمية في *دليل المحافظة* باتت *نشطة ومتاحة للجمهور الآن* 🚀

📍 *الموقع:* {location}
🌐 *رابط ملفكم المباشر في الدليل:*
{url}

يمكنكم مشاركة الرابط مع عملائكم واستقبال الاتصالات وطلبات الاتجاهات مباشرة.

📞 *للتواصل مع خدمة العملاء:*
لتحسين بطاقة النشاط في الدليل، إرسال صور أو معلومات دقيقة أو إبداء أي تعليق؛ يسعدنا تواصلكم عبر واتساب خدمة العملاء:
📲 01556221141 (https://wa.me/201556221141)

نتمنى لكم دوام التوفيق والنجاح!
*منصة دليلك*`,
  },
  {
    id: 'welcome_invoice',
    name: 'إشعار الفاتورة والاعتماد الشرفي الموثق',
    badge: 'توثيق مالي ورسمي',
    badgeColor: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
    description: 'إشعار توثيق رقمي وفاتورة رمزية صفرية تثبت الاعتماد الرسمي بالمحافظة.',
    defaultText: `السادة إدارة {name}،
تحية طيبة،

تم إصدار شهادة التوثيق والإدراج الرسمية لمنشأتكم في *منصة دليلك*:
- المنشأة: {name}
- الموقع: {location}
- نوع الاعتماد: إدراج شرفي معتمد (مجاني 0.00 ج.م)

🔗 *رابط المعاينة والتحقق:
{url}

📞 *للتواصل مع خدمة العملاء:*
لتحسين بطاقة النشاط في الدليل، أو إرسال صور أو معلومات دقيقة أو إبداء أي تعليق؛ يرجى التواصل عبر واتساب خدمة العملاء:
📲 01556221141 (https://wa.me/201556221141)

نشكر ثقتكم ونتطلع دائماً لخدمتكم بأفضل معايير الجودة.
*إدارة الشؤون الإدارية - دليلك*`,
  },
  {
    id: 'custom',
    name: 'رسالة مخصصة (نص حر مع متغيرات ذكية)',
    badge: 'تخصيص كامل',
    badgeColor: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
    description: 'اكتب نصك الخاص مع إمكانية استخدام المتغيرات: {name}، {owner}، {location}، {url}',
    defaultText: `تحية طيبة لإدارة {name}،

يسعدنا التواصل معكم من منصة دليلك...
رابط ملفكم: {url}`,
  },
];
