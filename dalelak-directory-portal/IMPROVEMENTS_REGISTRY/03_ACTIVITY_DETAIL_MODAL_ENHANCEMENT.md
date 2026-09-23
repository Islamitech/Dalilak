# 🏢 تحسين نافذة تفاصيل المنشأة ومنع تسرب التمرير ودعم مشاركة الموبايل
## Activity Detail Modal UX: Body Scroll Lock, Escape Key & Native Web Share
**الملف المستهدف:** `src/components/activity/ActivityDetailModal.tsx`  
**حالة التعديل:** موثق وجاهز للتطبيق دون تعديل مباشر.

---

### 🔍 التشخيص الهندسي (Audit & Findings):

من خلال فحص سلوك نافذة تفاصيل النشاط `ActivityDetailModal.tsx` عند فتحها من الخريطة أو من قائمة البحث:
1. **تسرب التمرير إلى خلفية الصفحة (Background Scroll Bleed):**
   - عند فتح النافذة والتمرير داخلها على الهواتف أو الحواسيب، تستمر الصفحة الخلفية (الخريطة أو قائمة الأنشطة) في التمرير في الخلفية! وعند إغلاق النافذة، يجد المستخدم نفسه في مكان عشوائي من الصفحة.
2. **غياب اختصار زر الهروب (`Escape` Key Dismiss):**
   - لا يوجد مستمع لحدث لوحة المفاتيح لإغلاق النافذة بزر `Escape` على الحواسيب والأجهزة اللوحية، مما يُجبر المستخدم على البحث عن زر الإغلاق ✕ بالنقر اليدوي.
3. **محدودية ميزة المشاركة (`Share Limitation`):**
   - زر المشاركة يقتصر فقط على نسخ الرابط للحافظة (`navigator.clipboard.writeText`)، ولا يستفيد من قائمة المشاركة الأصلية للهاتف (`navigator.share`) التي تتيح إرسال الرابط مباشرة عبر واتساب، تيليجرام، أو مسجات الهاتف.

---

### 🔧 الحل البرمجي المقترح (Exact Code Enhancement):

#### 1. إضافة قفل تمرير الصفحة ومستمع زر `Escape`:
في بداية مكون `ActivityDetailModal`:
```tsx
// ✅ قفل تمرير خلفية الصفحة ودعم زر Escape تلقائياً عند فتح النافذة
useEffect(() => {
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
}, [onClose]);
```

#### 2. دعم قائمة مشاركة الهاتف الأصلية (`Native Web Share API` مع بديل الحافظة):
استبدال دالة `handleShare` الحالية (الأسطر 184-192):
```tsx
// ❌ الكود القديم:
const handleShare = async (e: React.MouseEvent) => {
  e.stopPropagation();
  const shareUrl = getPublicDirectoryUrl(business);
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }
};

// ✅ الكود المحسن الجديد:
const handleShare = async (e: React.MouseEvent) => {
  e.stopPropagation();
  const shareUrl = getPublicDirectoryUrl(business);

  if (navigator.share) {
    try {
      await navigator.share({
        title: business.nameAr,
        text: `تعرف على ${business.nameAr} - ${business.category} في ${business.city || 'حدائق الأهرام'} عبر دليلك:`,
        url: shareUrl,
      });
      return;
    } catch (err: any) {
      if (err.name === 'AbortError') return; // المستخدم ألغى المشاركة
    }
  }

  // في حال عدم توفر Web Share (مثل بعض المتصفحات المكتبية)
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }
};
```

---

### 📊 الأثر المتوقع (Measurable Impact):
1. **ثبات الصفحة الخلفية 100%:** منع تشويش المستخدم أثناء التمرير في تفاصيل النشاط.
2. **سرعة وسهولة إغلاق النافذة:** تجربة مألوفة واحترافية لمستخدمي لوحات المفاتيح عبر زر `Esc`.
3. **زيادة مشاركة الأنشطة والانتشار:** إتاحة إرسال النشاط بلمسة واحدة إلى محادثات واتساب وتطبيقات التواصل على الهاتف.
