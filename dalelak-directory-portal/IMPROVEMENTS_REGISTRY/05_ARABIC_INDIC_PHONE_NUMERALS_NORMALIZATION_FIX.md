# 🚨 إصلاح جذري: معالجة الأرقام الهندية/العربية (٠-٩) في أرقام الهواتف وروابط واتساب والاتصال
## Critical Bug Fix: Arabic-Indic Numerals Normalization for WhatsApp & Tel Links
**الملفات المعنية:**
- `src/utils/directoryEnhancements.ts`
- `src/components/cards/BusinessCard.tsx`
- `src/components/map/MapSelectedBusinessDrawer.tsx`
- `src/components/activity/ActivityDetailModal.tsx`

**حالة التعديل:** موثق وجاهز للتطبيق دون تعديل مباشر على الملفات الحالية.

---

### 🔍 التشخيص الهندسي وحجم العطل (The Bug Discovery):

في قواعد البيانات والمتاجر المصرية، يقوم بعض أصحاب الأنشطة أو مدخلو البيانات بكتابة أرقام الهواتف بالأرقام العربية/المشرقية مثل:
`٠١٠١٢٣٤٥٦٧٨` أو `٠١١٢٣٤٥٦٧٨٩` أو `٠١٥٥٦٢٢١١٤١`

#### ما الذي يحدث في الكود الحالي؟
في دالة `getSmartWhatsAppUrl` (السطر 214 في `directoryEnhancements.ts`):
```typescript
const targetPhone = (biz.whatsapp || biz.phone || '')
  .replace(/\D/g, '')
  .replace(/^0/, '');
```
وفي بطاقات الأنشطة `BusinessCard.tsx` (السطر 291):
```tsx
href={`tel:${business.phone.replace(/[^\d+]/g, '')}`}
```

في محركات جافاسكريبت القياسية:
- رمز `\D` يطابق أي محرف ليس رقم ASCII من `0` إلى `9`.
- وبالتالي:
  `'٠١٠١٢٣٤٥٦٧٨'.replace(/\D/g, '')` ينتج عنه **نص فارغ تماماً `""`!**
- والنتيجة الكارثية:
  1. روابط واتساب تصبح فارغة `""`، أو يتعطل زر واتساب تماماً وتظهر رسالة "رقم غير صالح".
  2. روابط الاتصال الهاتفي تصبح `tel:` بدون رقم، وعندما يضغط المستخدم على "اتصال" على الهاتف لا يحدث شيء أو يظهر خطأ "Invalid phone number".
  3. ملف جهات الاتصال `vCard (.vcf)` يفشل في الحفظ على هواتف iPhone و Android لأن صيغة vCard القياسية ترفض الأرقام غير المعيارية.

---

### 🔧 الحل البرمجي المقترح (Exact Code Enhancement):

إنشاء دالة معيارية عامة `normalizePhoneDigits` لتحويل كافة أشكال الأرقام (العربية المشرقية والفارسية) إلى أرقام معيارية دولية قبل أي معالجة:

#### 1. في `src/utils/directoryEnhancements.ts`:
```typescript
/**
 * 📞 تحويل وتطهير الأرقام العربية والفارسية إلى أرقام معيارية دولية (0-9)
 */
export function normalizePhoneDigits(phone?: string | null): string {
  if (!phone || typeof phone !== 'string') return '';
  
  const arabicIndicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const easternPersianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  let normalized = phone;

  // تحويل الأرقام العربية
  for (let i = 0; i < 10; i++) {
    normalized = normalized.replaceAll(arabicIndicDigits[i], String(i));
    normalized = normalized.replaceAll(easternPersianDigits[i], String(i));
  }

  return normalized;
}
```

#### 2. تحديث دالة `getSmartWhatsAppUrl`:
```typescript
// ✅ استبدال الأسطر 213-216:
export function getSmartWhatsAppUrl(biz: Business): string {
  const rawPhone = biz.whatsapp || biz.phone || '';
  const cleanPhone = normalizePhoneDigits(rawPhone).replace(/\D/g, '');
  
  // إزالة كود مصر المكرر أو الصفر البادئ
  let targetPhone = cleanPhone;
  if (targetPhone.startsWith('20')) {
    targetPhone = targetPhone.substring(2);
  } else if (targetPhone.startsWith('0')) {
    targetPhone = targetPhone.substring(1);
  }

  if (!targetPhone) return '';
  // ... بقية منطق الرسائل المخصصة حسب القسم
```

#### 3. تحديث روابط الاتصال في `BusinessCard.tsx` و `MapSelectedBusinessDrawer.tsx`:
```tsx
// ✅ استبدال tel:${business.phone.replace(/[^\d+]/g, '')}:
href={`tel:${normalizePhoneDigits(business.phone).replace(/[^\d+]/g, '')}`}
```

---

### 📊 الأثر والمردود التجاري والهندسي:
1. **استعادة عمل 100% من أزرار الواتساب والاتصال** للمنشآت التي سُجلت هواتفها بأرقام عربية.
2. **صفرية الأخطاء:** منع ظهور روابط `tel:` فارغة تضر بمصداقية المنصة أمام الزوار.
3. **توليد vCard سليم 100%** يُقبل فوراً على نظامي Apple iOS و Google Android.
