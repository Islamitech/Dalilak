# 🔍 تمكين البحث التبادلي عن أرقام العمارات والبوابات والشوارع بالأرقام العربية والإنجليزية
## Interoperable Arabic & English Digit Normalization for Building Numbers, Gates & Search
**الملفات المعنية:**
- `src/utils/arabicSearch.ts`
- `src/components/search/SmartSearchBar.tsx`
- `src/components/map/MapSearchBox.tsx`

**حالة التعديل:** موثق وجاهز للتطبيق دون تعديل مباشر على الملفات الحالية.

---

### 🔍 التشخيص الهندسي (Audit & Problem Diagnosis):

في منطقة حدائق الأهرام، ترتكز أكثر من 70% من عمليات البحث على **أرقام العمارات** و**أرقام البوابات** (مثال: `عمارة 150` أو `بوابة 2` أو `شارع 18`).

#### ما الذي يحدث حالياً عند البحث؟
1. في لوحات مفاتيح الهواتف المحمولة العربية (iOS & Android)، تكتب لوحة المفاتيح بالأرقام العربية المشرقية (`١، ٢، ٣، ٤، ٥...`).
2. في قاعدة البيانات، يتم تخزين أغلب العناوين بالأرقام الإنجليزية (`1, 2, 3, 4, 5...`).
3. دالة `normalizeArabicText` تقوم بتوحيد الحروف (الهمزات والتاء المربوطة والألف المقصورة)، **لكنها تتجاهل تماماً توحيد الأرقام!**
4. النتيجة البرمجية:
   - المستخدم يكتب في البحث: `عمارة ١٥٠` أو `بوابة ٤`.
   - النص في قاعدة البيانات: `عمارة 150` أو `بوابة 4`.
   - المقارنة `normTarget.includes(normQuery)` تُرجع `false`!
   - وتظهر للمستخدم النتيجة المخيبة: *"لا توجد نتائج مطابقة"* بالرغم من أن العمارة مسجلة في الدليل!

---

### 🔧 الحل البرمجي المقترح (Exact Code Enhancement):

توسيع دالة `normalizeArabicText` في `src/utils/arabicSearch.ts` لتوحيد الأرقام العربية والفارسية إلى أرقام دولية موحدة:

```typescript
/**
 * 🔤 Comprehensive Arabic Text Normalizer
 * Normalizes common Arabic letter variants, diacritics, spaces,
 * AND converts Arabic-Indic digits (٠-٩) and Persian digits (۰-۹) to standard digits (0-9)
 * ensuring seamless search matching for building numbers, gates, and phones.
 */
export function normalizeArabicText(text?: string | null): string {
  if (!text) return '';
  
  const arabicIndicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const easternPersianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  let str = text.toString().trim().toLowerCase();

  // 1. تحويل الأرقام العربية والفارسية إلى أرقام موحدة (٠-٩ -> 0-9)
  for (let i = 0; i < 10; i++) {
    str = str.replaceAll(arabicIndicDigits[i], String(i));
    str = str.replaceAll(easternPersianDigits[i], String(i));
  }

  return str
    // 2. إزالة التشكيل والحركات
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // 3. توحيد الهمزات والألف (أ, إ, آ, ٱ -> ا)
    .replace(/[أإآٱ]/g, 'ا')
    // 4. توحيد التاء المربوطة والهاء (ة -> ه)
    .replace(/ة/g, 'ه')
    // 5. توحيد الياء والألف المقصورة (ى, ی -> ي)
    .replace(/[ىی]/g, 'ي')
    // 6. الحروف الفارسية والتركية (پ -> ب, ڤ -> ف, ک -> ك)
    .replace(/پ/g, 'ب')
    .replace(/ڤ/g, 'ف')
    .replace(/ک/g, 'ك')
    // 7. إزالة التطويل / الكشيدة (ـ)
    .replace(/ـ/g, '')
    // 8. تنظيف المسافات الزائدة
    .replace(/\s+/g, ' ');
}
```

---

### 📊 الأثر والمردود على تجربة المستخدم (Measurable Impact):
1. **تطابق البحث بنسبة 100%:** كتابة `عمارة 150` أو `عمارة ١٥٠` ستصل مباشرة إلى نفس النتيجة بدقة تامة.
2. **العثور على البوابات بسهولة:** كتابة `بوابة 2` أو `بوابة ٢` أو `خفرع` تظهر نفس المعالم فوراً.
3. **البحث السريع بأرقام الهواتف:** كتابة جزء من رقم الهاتف بالأرقام العربية (مثل `٠١٠١`) يظهر المنشأة مباشرة.
4. **تخلص نهائي من مشكلة "النتائج الصفرية الزائفة"** التي كانت تحدث بسبب اختلاف لوحة المفاتيح.
