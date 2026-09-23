# Dalilak Directory — البوابة العامة

هذا هو التطبيق العام للجمهور، مخصص لعرض الأنشطة التجارية والبحث عنها في مصر.

## الوصف
- عرض خريطة تفاعلية
- بحث وتصنيف الأنشطة
- صفحات عامة للأنشطة
- دعم SEO و Open Graph
- دعم PWA و offline
- عرض صور وخدمات وبيانات تجارية

## البنية الأساسية
- src/ : واجهة المستخدم للبوابة العامة
- api/ : واجهات دعم للبيانات والـ SEO
- public/ : الصور، الشعار، ملفات PWA، robots، manifest
- index.html : نقطة الدخول

## التشغيل المحلي
متطلبات:
- Node.js
- npm

1. افتح المجلد:
   cd "C:\Users\Ahmed\Desktop\Dalelak_Apps_Export\Dalilak-directory_Production_Clean"

2. تثبيت الحزم:
   npm install

3. تأكد من ملف .env

4. تشغيل التطبيق:
   npm run dev

5. الوصول:
   http://localhost:5173

## متغيرات البيئة
يجب أن يحتوي ملف .env على:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- GOOGLE_PLACES_API_KEY
- VITE_GOOGLE_PLACES_API_KEY

## البناء للإنتاج
npm run build

## ملاحظات
- هذا التطبيق مخصص للعرض العام، وليس للإدارة الداخلية.
- البيانات تأتي من Supabase أو من مصادر خارجية حسب إعداد المشروع.
- النسخة الحالية تم تنظيفها وتركها جاهزة للتشغيل المحلي.

