# 🚪 تحسين نافذة دليل بوابات حدائق الأهرام والملاحة التلقائية وتثبيت التمرير
## Hadayek Gates Modal: Scroll Lock, Escape Key & Google Navigation Deep Links
**الملف المستهدف:** `src/components/atlas/HadayekGatesModal.tsx`  
**حالة التعديل:** موثق وجاهز للتطبيق دون تعديل مباشر على الملفات الحالية.

---

### 🔍 التشخيص الهندسي (Audit & Problem Diagnosis):

نافذة "دليل بوابات حدائق الأهرام" `HadayekGatesModal.tsx` هي أداة ملاحة رئيسية لزوار وسكان حدائق الأهرام للوصول إلى البوابات (خوفو، خفرع، منقرع، مينا، حورس، وأحمس).

من خلال الفحص الدقيق، تم رصد 3 نقاط تتطلب تحسيناً:
1. **تسرب تمرير الخريطة خلف النافذة (Background Map Scroll Bleed):**
   - عند فتح النافذة ومحاولة قراءة تفاصيل البوابات الرابعة والخامسة بالأسفل، يؤدي السحب بأصبع اللمس إلى تحريك وسحب الخريطة في الخلفية! وعند إغلاق النافذة، يجد المستخدم أن خريطة حدائق الأهرام قد تحركت بعيداً.
2. **غياب اختصار لوحة المفاتيح `Escape`:**
   - عدم وجود مستمع لحدث `keydown` لإغلاق الدليل بسرعة بزر `Esc`.
3. **صيغة رابط الملاحة في تطبيق خرائط Google:**
   - في الدالة الحالية:
     `https://www.google.com/maps/dir/?api=1&destination=${gate.lat},${gate.lng}&query=${...}`
     دمج معاملي `destination` مع `query` في نفس الرابط يربك أحياناً تطبيق Google Maps على أجهزة أندرويد وآيفون، ويحوله إلى بحث نصي بدلاً من بدء مسار الملاحة الفوري.
4. **تجاوب تذييل النافذة (Footer Responsiveness) على الموبايل:**
   - في الشاشات الصغيرة (أقل من 400px)، يؤدي سطر النصيحة بجوار زر الإغلاق إلى تزاحم وتداخل أزرار التذييل.

---

### 🔧 الحل البرمجي المقترح (Exact Code Enhancement):

#### 1. قفل تمرير الصفحة وإضافة مستمع زر `Escape`:
في بداية مكون `HadayekGatesModal`:
```tsx
// ✅ قفل تمرير خلفية الصفحة ودعم زر Escape تلقائياً
React.useEffect(() => {
  if (!isOpen) return;

  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  return () => {
    document.body.style.overflow = originalOverflow;
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [isOpen, onClose]);
```

#### 2. توحيد وتصحيح رابط الملاحة الفوري في خرائط Google:
استبدال دالة `handleOpenGateMaps` بالصيغة المباشرة القياسية:
```tsx
// ✅ رابط ملاحة قياسي يفتح تطبيق خرائط Google مباشرة على إحداثيات البوابة المحددة
const handleOpenGateMaps = (gate: HadayekGate) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${gate.lat},${gate.lng}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};
```

#### 3. تحسين تذييل النافذة ليكون عمودياً على شاشات الجوال:
```tsx
// ✅ في تذييل النافذة (Modal Footer):
<div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs shrink-0">
  <span className="text-[11px] text-[var(--text-secondary)] text-center sm:text-right">
    💡 نصيحة دليلك: ادخل دائماً من أقرب بوابة لعمارة وجهتك لتفادي التباطؤ داخل شوارع الحدائق.
  </span>
  <button
    type="button"
    onClick={onClose}
    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 transition-colors cursor-pointer text-center"
  >
    إغلاق
  </button>
</div>
```

---

### 📊 الأثر المتوقع (Measurable Impact):
1. **ثبات واستقرار كامل للخريطة:** عدم تحرك الخريطة خلف النافذة إطلاقاً أثناء قراءة تفاصيل البوابات.
2. **بدء الملاحة بضغطة زر واحدة:** فتح مسار القيادة في Google Maps فوراً للسيارات المتجهة لحدائق الأهرام.
3. **تنسيق بصري متناسق 100%:** مظهر منظم ومريح على كافة شاشات الهواتف دون أي تداخل في النصوص أو الأزرار.
