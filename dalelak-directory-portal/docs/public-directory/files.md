# الملفات الجديدة ووظائفها

كل المسارات التالية نسبية إلى جذر المشروع. لا تعديلات إنتاج مقصودة ضمن التسليم النهائي.

```text
directory-preview.html                         مدخل HTML مستقل
vite.directory-preview.config.ts               تشغيل وبناء منفصلان
scripts/verify-directory-preview.mjs             فحص العزل وتجميع اختبارات العرض
src/directory-experience/
  DirectoryExperience.tsx                       تركيب الشاشات وحالة المحاكاة
  contracts/
    directory.ts                                عقود العرض والحالات والفلاتر
    DirectoryCatalogProvider.tsx                 حقن الكتالوج المشترك
  shell/
    Navigation.tsx                              رأس وتنقل هاتف وقائمة إضافية
  state/
    usePreviewNavigation.ts                     تنقل hash وحفظ سياق الصفحات
  discovery/
    HomeScreen.tsx                              الاستكشاف والتصنيفات
    SearchScreen.tsx                            النتائج والفلاتر والفرز والصفحات
    SearchForm.tsx                              بحث ومدينة وموقع محاكى
    PlaceCard.tsx                               بطاقة نشاط وحالات معلومات ناقصة
    CategoryIcon.tsx                            أيقونات موحدة للتصنيفات
  map/
    MapScreen.tsx                               فلاتر ونتائج وبوابات وتحديد
    GeographicCanvas.tsx                        طبقات SVG وعلامات ومجموعات
    mapGeometry.ts                             إسقاط جغرافي وحساب تكبير المؤشر
    useMapViewport.ts                           سحب وتكبير ولمس ولوحة مفاتيح
    map.css                                    تخطيط الخريطة وطبقاتها والتجاوب
  details/
    PlaceDetails.tsx                            نافذة تفاصيل وصور وفيديو محاكى
    ActionPreview.tsx                           نتائج محاكاة التواصل والإبلاغ
  saved/
    SavedScreen.tsx                             مفضلة وحالة فراغ
  owners/
    OwnerScreen.tsx                             نموذج ومراجعة وإرسال محاكى
  information/
    PricingScreen.tsx                           باقات ومقارنة وطلب محاكى
    AboutScreen.tsx                             تعريف ومساعدة وأسئلة شائعة
  design-system/
    directory.css                              Tokens وقواعد مكونات العرض
    preview.css                                Tailwind وتنسيق المدخل المستقل
    Dialog.tsx                                 نافذة معنونة قابلة للتمرير
    useDialogFocus.ts                          حصر واستعادة التركيز وEscape
    ScreenState.tsx                            تحميل/فراغ/خطأ/انقطاع/عدم صلاحية
    DirectoryBoundary.tsx                      احتواء أخطاء rendering
    DesignSystemScreen.tsx                     معرض عناصر وقواعد التصميم
  preview/
    main.tsx                                   ربط React بالـ fixtures
    fixtures.ts                                كل محتوى العرض التجريبي
    PreviewControls.tsx                        تبديل الحالات والاتجاه والفشل
    assets/
      hq-lounge.jpg                            صورة توضيحية محلية
      hq-meeting.jpg                           صورة توضيحية محلية
      hq-executive.jpg                         صورة توضيحية محلية
      hq-workspace.jpg                         صورة توضيحية محلية
  tests/
    screens.test.tsx                           اختبارات عرض وعزل وهندسة الخريطة
docs/public-directory/
  implementation-plan.md                       نتائج الفحص والخطة التاريخية
  delivery.md                                  التقرير بالترتيب المطلوب
  decisions.md                                 قرارات وافتراضات وأسئلة اعتماد
  integration.md                               تشغيل وحدود ونقاط وخطوات الدمج
  files.md                                     هذه القائمة
  review-checklist.md                          نتائج الاختبارات وحدود المراجعة
dist-ux-preview/                               خرج مولد، لا يحرر يدويًا
```

الاعتماد الوحيد على بيانات المشروع الأصلية داخل fixtures هو قراءة src/data/hadayekDistrictsGeoData.ts. الحزم مشتركة من package.json القائم. لا ملفات schema أو migration أو API أو backend جديدة.

إضافات التحديث الأخير:
- map/MapActivityCards.tsx: كروت أبرز الأنشطة والكارت الموسع والطي والرجوع.
- design-system/brand.css: هوية التطبيق الفعلية، معزولة للمعاينة.
- preview/assets/brand-logo.svg: نسخة الشعار الرسمي من public/logo.svg.
