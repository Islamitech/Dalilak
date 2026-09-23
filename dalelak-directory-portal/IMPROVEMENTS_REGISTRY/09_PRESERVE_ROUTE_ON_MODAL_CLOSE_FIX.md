# 🚨 إصلاح جذري: منع إعادة التوجيه القسري لصفحة البحث عند إغلاق تفاصيل النشاط
## Critical Routing Bug Fix: Preserve Current Active Route on Modal Close
**الملف المعني:** `src/components/PublicShowcase.tsx`  
**حالة التعديل:** موثق وجاهز للتطبيق دون تعديل مباشر على الملفات الحالية.

---

### 🔍 التشخيص الهندسي وحجم العطل (The Routing Bug Discovery):

#### السلوك الخاطئ الحالي:
عندما يتصفح المستخدم **الخريطة التفاعلية (`/` أو `/map`)** أو **صفحة المفضلة (`/favorites`)** أو **الصفحة الرئيسية**:
1. ينقر المستخدم على أي كارت أو دبوس نشاط لفتح نافذة التفاصيل (`ActivityDetailModal`).
2. يقوم المستخدم بقراءة التفاصيل أو الاتصال أو استعراض الصور.
3. عند الضغط على زر الإغلاق ✕:
   - **يُفاجأ المستخدم بنقله قسراً وخروجه من الخريطة بالكامل إلى صفحة قائمة البحث (`/search`)!**

#### السبب الجذري في الكود (Root Cause):
في دالة `handleCloseBusiness` داخل `src/components/PublicShowcase.tsx` (السطر 204):
```typescript
const handleCloseBusiness = () => {
  if (selectedBiz?.category) {
    setCategoryFilter(selectedBiz.category);
  }
  isDirectLinkOpenRef.current = false;
  setSelectedBiz(null);
  setCurrentPath('/search'); // ❌ خطأ برمجي: فرض التوجيه إلى /search دائماً!
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('biz');
    url.searchParams.delete('b');
    url.searchParams.delete('id');
    url.searchParams.delete('preview');
    const clean = '/search'; // ❌ كتابة مسار /search فوق المسار الحالي!
    window.history.replaceState(null, '', clean + (url.search ? url.search : ''));
  } catch {}
};
```

---

### 🔧 الحل البرمجي المقترح (Exact Code Enhancement):

الحفاظ على مسار التصفح الحالي للمستخدم (`currentPath`)، وفقط في حالة الدخول عبر رابط مباشر `/biz/...` يتم التوجيه إلى `/search`:

```typescript
// ✅ الكود المصحح الذي يحافظ على ثبات تجربة التصفح 100%:
const handleCloseBusiness = () => {
  isDirectLinkOpenRef.current = false;
  setSelectedBiz(null);

  // إذا دخل المستخدم مباشرة عبر رابط منشأة مستقل (/biz/...)، نوجهه لصفحة البحث العامة
  if (window.location.pathname.startsWith('/biz/')) {
    setCurrentPath('/search');
    try {
      window.history.replaceState(null, '', '/search');
    } catch {}
  } else {
    // 🛡️ الحفاظ التام على المسار النشط (الخريطة تبقى خريطة، والمفضلة تبقى مفضلة)
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('biz');
      url.searchParams.delete('b');
      url.searchParams.delete('id');
      url.searchParams.delete('preview');
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
    } catch {}
  }
};
```

---

### 📊 الأثر والمردود على تجربة المستخدم (Measurable Impact):
1. **استقرار تجربة الخريطة 100%:** عند فتح تفاصيل نشاط من الخريطة وإغلاقه، يظل المستخدم على نفس موقع الخريطة ونفس مستوى التكبير دون أي خروج مفاجئ.
2. **استقرار صفحة المفضلة:** البقاء داخل قائمة المفضلة عند فحص كروت الأماكن المحفوظة.
3. **تطبيق معايير SPA الاحترافية:** عدم التلاعب بسياق تصفح المستخدم وإلغاء أي سلوك توجيه قسري غير مبرر.
