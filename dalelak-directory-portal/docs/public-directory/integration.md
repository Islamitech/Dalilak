# تشغيل ودمج الواجهة

## تشغيل المعاينة

من جذر المشروع، باستخدام الحزم المثبتة:

```powershell
node node_modules/vite/bin/vite.js --config vite.directory-preview.config.ts
```

افتح http://127.0.0.1:5190/directory-preview.html أو أضف #/map للخريطة.

```powershell
node node_modules/typescript/bin/tsc --noEmit
node scripts/verify-directory-preview.mjs
node node_modules/vite/bin/vite.js build --config vite.directory-preview.config.ts
```

الخرج في dist-ux-preview. لا تستخدم إعداد بناء الإنتاج لتسليم هذه المعاينة. publicDir معطّل لتجنب نسخ Service Worker أو أصول الإنتاج غير المطلوبة. لا تسجل المعاينة Service Worker.

## الدمج التدريجي

1. احتفظ بالمدخل المستقل لمراجعة التصميم أولًا. لا تبدّل App.tsx أو main.tsx مباشرة.
2. أنشئ adapter في طبقة التطبيق المضيف يحوّل البيانات العامة المسموح بها إلى DirectoryCatalog. لا تمرر صفوف قاعدة البيانات أو حقول الإدارة كاملة إلى الواجهة.
3. استورد الشاشات ومزود DirectoryCatalogProvider ضمن مسار مستقل أو feature flag في التطبيق المضيف. DirectoryExperience هو جذر **محاكاة**، لا توصله بالإنتاج دون استبدال توصيلاته التجريبية.
4. مرّر حالات البيانات عبر DirectoryDataPort/DiscoveryProps، وأوصل callbacks بإجراءات التطبيق القائمة. API وقاعدة البيانات تظل في الخدمات الموجودة خارج هذا النطاق؛ لا تضف وصولًا مباشرًا إلى قاعدة البيانات من المكونات.
5. استبدل usePreviewNavigation بموجّه المضيف، وحدد حالة المسودة والبحث والمفضلة. تأكد من الرجوع إلى الصفحة والفلاتر نفسها بعد إغلاق التفاصيل.
6. مرّر قدرات العرض من نظام المصادقة والصلاحيات الحالي. الخادم يظل مصدر التحقق؛ إخفاء زر أو عرض unauthorized ليس تنفيذ صلاحيات.
7. استبدل ActionPreview بإجراءات المضيف المعتمدة للاتصال والمشاركة والملاحة. نموذج OwnerScreen يستخدم مؤقت محاكاة؛ يجب استبدال submit بحالة إجراء من المضيف مع التحقق والأخطاء والإلغاء. إنشاء/تعديل/حذف السجلات لا ينفذ داخل طبقة العرض.
8. أزل PreviewControls وfixtures من حزمة الإنتاج. فصل تحميل البيانات عن UI يسمح باستبدال الكتالوج دون إعادة تصميم الشاشات.
9. CSS: tokens وقواعد directory.css تحت نطاق directory-app في معظمها، وأسماء المكونات تبدأ directory-/hm-. preview.css يتضمن reset وخطوطًا عامة وTailwind خاصين بالمدخل المستقل؛ لا تستورده كاملًا داخل تطبيق شقيق. انقل قواعد المكونات إلى stylesheet المضيف المحدود بالنطاق، واستخدم Tailwind/reset الموجودين لديه مرة واحدة.
10. اختبر مسارًا واحدًا أولًا ثم بقية الشاشات، مع مراجعة التسميات والاتجاه والتباين والتعامل مع بيانات طويلة أو ناقصة وكثافة علامات أكبر من عينات العرض.

## نقاط الربط

| المطلوب | الموضع |
|---|---|
| بيانات API العامة | DirectoryCatalog وDirectoryCatalogProvider |
| حالة تحميل/خطأ/إعادة محاولة | DirectoryDataPort وScreenState |
| المصادقة والصلاحيات | التطبيق المضيف؛ callbacks وحالات عرض فقط هنا |
| المفضلة والبحث والمسودة | state في DirectoryExperience وOwnerScreen؛ تستبدل بحالة المضيف |
| إنشاء طلب نشاط | OwnerScreen submit التجريبي؛ يستبدل في طبقة التكامل |
| تعديل/حذف | callbacks من المضيف عند تحديد النطاق؛ لا CRUD فعلي في المعاينة |
| الخريطة والأماكن | GeographicCanvas وعقود coordinates/districts/gates |
| الاتجاهات ووسائل التواصل | DirectoryActions/ActionKind ثم إجراءات المضيف |

## الإزالة

يمكن إزالة src/directory-experience وdirectory-preview.html وvite.directory-preview.config.ts وscripts/verify-directory-preview.mjs وdist-ux-preview ووثائق هذه المهمة دون تبديل مدخل الإنتاج. لا تحذف ملفات data الأصلية لأنها مشتركة ويقرأها مصدر العرض فقط.
