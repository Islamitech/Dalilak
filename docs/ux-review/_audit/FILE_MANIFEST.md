# FILE_MANIFEST — بيان ملفات نطاق فحص الواجهة وتجربة المستخدم

- **المشروع:** دليلك (Dalilak)
- **الجذر:** `c:\Users\Ahmed\Desktop\New folder\Dalelak`
- **بصمة Git الحالية:** `7a25343f849c09dfe4584d82d32aada5437a3db8`
- **تاريخ الرصد والقياس:** 2026-09-17 14:23:00+03:00
- **حالة شجرة العمل:** نظيفة تماماً (Working tree clean - up to date with origin/main)
- **بيئة الفحص:** Node.js v22 + Vite 6 + React 19 + Tailwind CSS 4 + Vitest 5 (60/60 Tests Passing)

---

## 1. بيان ملفات الواجهة وتجربة المستخدم (UI Surfaces & Core Components)

| المسار النسبي | النوع | الحجم (بايت) | الأسطر | داخل النطاق؟ | الغرض / السطح المرتبط |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/App.tsx` | TSX | 32,537 | 713 | نعم (أساسي) | المنسق العام للشاشات والتوجيه والجلسات والإشعارات |
| `src/index.css` | CSS | 15,448 | 581 | نعم (أساسي) | نظام التصميم، المتغيرات، الألوان الدلالية، وسلم الطبقات |
| `src/components/Navbar.tsx` | TSX | 19,513 | 402 | نعم (أساسي) | شريط التنقل العلوي لسطح المكتب والأجهزة اللوحية |
| `src/components/BottomNav.tsx` | TSX | 3,963 | 85 | نعم (أساسي) | شريط التنقل السفلي الثابت للهواتف الذكية |
| `src/components/LoginModal.tsx` | TSX | 10,682 | 256 | نعم (أساسي) | نافذة تسجيل الدخول وحسابات المناديب والمشرفين |
| `src/components/auth/LoginForm.tsx` | TSX | 11,245 | 280 | نعم (أساسي) | استمارة الدخول وفحص الهوية الصفرية والتحقق |
| `src/components/auth/RegisterForm.tsx` | TSX | 14,890 | 360 | نعم (أساسي) | استمارة انضمام مندوب جديد ورفع وثائق الهوية |
| `src/components/home/HomeFeedView.tsx` | TSX | 5,142 | 127 | نعم (أساسي) | الصفحة الرئيسية للدليل وبانر المنظومة ولوحة المندوب السريعة |
| `src/components/directory/PublicBusinessDirectory.tsx` | TSX | 21,469 | 500 | نعم (أساسي) | منسق الدليل العام، محرك البحث والفرز والتبديل |
| `src/components/directory/DirectoryFilterBar.tsx` | TSX | 16,350 | 385 | نعم (أساسي) | شريط البحث وتصفية المحافظات والتصنيفات وكبسولات الحالات |
| `src/components/directory/DirectoryMetricsBar.tsx` | TSX | 8,940 | 210 | نعم (أساسي) | شريط المؤشرات والإحصاءات الميدانية السريعة |
| `src/components/directory/DirectoryGridCard.tsx` | TSX | 18,220 | 420 | نعم (أساسي) | بطاقة عرض المنشأة في نمط الشبكة (Grid) مع درع الحماية |
| `src/components/directory/DirectoryListRow.tsx` | TSX | 15,100 | 350 | نعم (أساسي) | نمط عرض القائمة والجدول السريع المتجاوب |
| `src/components/InteractiveMap.tsx` | TSX | 22,722 | 520 | نعم (أساسي) | خريطة الأنشطة التفاعلية والبحث الجغرافي |
| `src/components/BusinessForm.tsx` | TSX | 35,982 | 840 | نعم (أساسي) | استمارة تسجيل وتوثيق الأنشطة الميدانية |
| `src/components/BusinessDetailsDrawer.tsx` | TSX | 23,134 | 550 | نعم (أساسي) | درج تفاصيل المنشأة والتواصل ومحرك SEO |
| `src/components/InvoiceModal.tsx` | TSX | 28,839 | 680 | نعم (أساسي) | نافذة الفاتورة الإلكترونية والمشاركة عبر واتساب |
| `src/components/InvoicesLeadsHub.tsx` | TSX | 15,138 | 360 | نعم (أساسي) | مركز متابعة الفرص التسويقية والعملاء المحتملين |
| `src/components/RepresentativePortal.tsx` | TSX | 43,230 | 980 | نعم (أساسي) | بوابة المندوب الميدانية الشاملة |
| `src/components/RepDashboard.tsx` | TSX | 14,041 | 340 | نعم (أساسي) | لوحة إحصاءات وأداء المندوب السريعة |
| `src/components/RepProfile.tsx` | TSX | 26,161 | 620 | نعم (أساسي) | ملف المندوب والهوية والمستحقات وطلب السحب |
| `src/components/AdminDashboard.tsx` | TSX | 44,796 | 1,020 | نعم (أساسي) | لوحة الإدارة المركزية والرقابة العامة |
| `src/components/AboutUsModal.tsx` | TSX | 13,749 | 310 | نعم (أساسي) | نافذة التعريف بالمنظومة ورسالتها |
| `src/components/TermsModal.tsx` | TSX | 9,914 | 240 | نعم (أساسي) | نافذة الشروط والأحكام وسياسة الخصوصية |
| `src/components/PackagesHub.tsx` | TSX | 57,992 | 1,320 | نعم (أساسي) | مركز باقات الاشتراك وإعداداتها للمنشآت |
| `src/components/PermissionsHub.tsx` | TSX | 32,888 | 780 | نعم (أساسي) | مركز توثيق وضبط صلاحيات الأدوار |
| `src/components/NotificationCenter.tsx` | TSX | 13,818 | 320 | نعم (أساسي) | مركز الإشعارات وتنبيهات النظام اللحظية |
| `dalelak-directory-portal/` | Directory | - | - | مرجع مقارن | البوابة المستقلة الخفيفة المخصصة للجمهور ومحركات البحث |

---

## 2. الملفات المستبعدة من فحص الواجهة (Excluded Scopes)

| المسار | السبب |
| :--- | :--- |
| `node_modules/`, `dalelak-directory-portal/node_modules/` | تبعيات خارجية ومكتبات نظام جاهزة. |
| `.git/` | سجل المستودع وبيانات التتبع. |
| `dist/`, `dist-directory/` | حزم البناء المترجمة الناتجة عن التشغيل. |
| `data/*.json` | مخازن الكاش وقواعد البيانات المحلية للخدمة. |
| `server.ts`, `api/*` | منطق السيرفر والمسارات الخلفية (يُرجع لها فقط لفهم عقود الواجهة). |
