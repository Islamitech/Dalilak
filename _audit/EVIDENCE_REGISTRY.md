# EVIDENCE REGISTRY — سجل أدلة التكوين السيادي

**المشروع:** دليلك (Dalilak)  
**الجذر:** `c:\Users\Ahmed\Desktop\New folder\Dalelak`  
**النسخة:** `43b321419dc3056951443ef86faad9b37715f552`  
**التاريخ:** 2026-09-17  

| المعرّف | المحور | الادعاء | المصدر | الموضع | مستوى الدليل | التحقق |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `EV-0001` | A-01 | اسم المشروع والنسخة والسكربتات | `package.json` | 1-25 | E0 | V1 |
| `EV-0002` | A-01 | وجود بوابة منفصلة للدليل العام | `dalelak-directory-portal/package.json` | 1-20 | E0 | V1 |
| `EV-0003` | A-02 | خريطة حزم المشروع والتبعيات الرئيسية (React 19, Vite 6, Supabase, Baileys, Express) | `package.json` | 14-38 | E0 | V1 |
| `EV-0004` | A-02 | حجم الكود المصدري وتركيز الشيفرة في المكونات الإدارية والسيرفر | إحصاء الملفات | 346 ملف مصدر | E0 | V1 |
| `EV-0005` | A-03 | تعريف خادم Express ومسارات المصادقة والأنشطة والمناديب | `server.ts` | 50-160 | E0 | V1 |
| `EV-0006` | A-03 | توجيه وتفويض مسارات الواتساب إلى خادم منفصل | `server.ts` | 90-120 | E0 | V1 |
| `EV-0007` | A-03 | مسار Vercel Serverless API لتأمين العمليات السحابية | `api/secure.ts` | 1-50 | E0 | V1 |
| `EV-0008` | A-04 | تعريف أدوار المستخدمين (admin, rep, supervisor, accountant) | `src/types.ts` | 50-65 | E0 | V1 |
| `EV-0009` | A-04 | تطهير البيانات الحساسة وصور الهوية الوطنية والإيصالات لمن ليس مسؤولاً | `server.ts` | 239-259 | E0 | V1 |
| `EV-0010` | A-04 | سياسات أمان مستوى الصفوف (RLS) في قاعدة بيانات Supabase | `supabase_rls_security.sql` | 1-80 | E0 | V1 |
| `EV-0011` | A-05 | جداول النظام الأساسية (businesses, representatives, leads, payout_requests, payment_config) | `supabase_schema.sql` | 1-120 | E0 | V1 |
| `EV-0012` | A-05 | ملف تخزين محلي ضخم للأنشطة والنسخ الاحتياطية (6.3 ميجابايت) | `data/server_biz_store.json` | 1-55792 | E0 | V1 |
| `EV-0013` | A-05 | تكرار ملفات تصحيح ومزامنة المخطط (Fixes & Migrations) | ملفات `FIX_*.sql` | الجذر | E0 | V1 |
| `EV-0014` | A-06 | ربط خادم Supabase السحابي عبر مفاتيح البيئة وService Role | `.env.example` | 15-22 | E0 | V1 |
| `EV-0015` | A-06 | دمج محرك واتساب Baileys Web multi-device | `src/server/whatsapp-gateway.ts` | 1-150 | E0 | V1 |
| `EV-0016` | A-06 | دمج Google Places API لجلب بيانات وصور الأنشطة | `src/components/admin/tabs/AdminPlacesIngestionTab.tsx` | 1-100 | E0 | V1 |
| `EV-0017` | A-07 | معالجة طلبات صرف مستحقات المناديب المالية | `server.ts` | 120-145 | E0 | V1 |
| `EV-0018` | A-07 | إدارة حملات الواتساب وتناوب الأرقام لتفادي الحظر (1-5 دقائق) | `updates_registry.md` & Git Commit | b656966 | E0 | V1 |
| `EV-0019` | A-07 | حذف وسجلات الحذف المشروطة بالدور الإداري | `src/types.ts` & `server.ts` | 70-90 | E0 | V1 |
| `EV-0020` | A-08 | إدارة الجلسات في الذاكرة ومعدل تسجيل الدخول | `server.ts` | 170-195 | E0 | V1 |
| `EV-0021` | A-08 | تخزين حالة الربط بجلسات الواتساب في مجلد الاعتمادات | `src/server/whatsapp-gateway.ts` | 80-110 | E0 | V1 |
| `EV-0022` | A-09 | تبويب إدارة حملات الواتساب الضخم (2940 سطراً) | `src/components/admin/tabs/AdminWhatsAppCampaignTab.tsx` | 1-2940 | E0 | V1 |
| `EV-0023` | A-09 | تبويب سحب الأنشطة وتصنيفها التلقائي (1718 سطراً) | `src/components/admin/tabs/AdminPlacesIngestionTab.tsx` | 1-1718 | E0 | V1 |
| `EV-0024` | A-10 | تكرار مكون PackagesHub بين المشروع الرئيسي وبوابة الدليل | `src/` و `dalelak-directory-portal/` | 881 سطراً لكل منهما | E0 | V1 |
| `EV-0025` | A-11 | بناء المشروع وتوجيه Vercel Serverless | `vercel.json` & `package.json` | 1-35 | E0 | V1 |
