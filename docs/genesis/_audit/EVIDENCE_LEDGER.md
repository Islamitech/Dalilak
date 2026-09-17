# سجل الأدلة السيادية (Evidence Ledger) — الطور 1

- **جذر المشروع:** `C:\Users\Ahmed\Desktop\New folder\Dalelak`
- **بصمة النسخة:** `ba63594132b130cd7da806484125fc508e0e4aa1`
- **التاريخ:** 2026-09-17

---

## جدول الأدلة الموثقة (A-01 إلى A-12)

| معرّف الدليل | المحور | الادعاء الموثق | المصدر والموضع | E | V | النسخة والتاريخ | الحدود والاستخدام |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `EV-0001` | A-01 | التطبيق هو منصة لإدارة العمليات الميدانية وتوثيق الأنشطة التجارية | `package.json:1-10`؛ `index.html:1-20` | E0 | V1 | `ba63594` 2026-09-17 | اسم الحزمة dalelak v1.0.0 والعنوان الرسمي |
| `EV-0002` | A-01 | وجود بوابة مستقلة للجمهور للبحث والخرائط التفاعلية | `dalelak-directory-portal/package.json`؛ `AGENTS.md:15-35` | E0 | V1 | `ba63594` 2026-09-17 | مستودع مستقل وواجهة منفصلة للزوار |
| `EV-0003` | A-02 | استخدام React 19 مع Vite و Tailwind CSS v4 | `package.json:19-48` | E0 | V2 | `ba63594` 2026-09-17 | بناء الإنتاج مجاز في 10.75s |
| `EV-0004` | A-02 | شاشة المندوب مصممة بنهج Dashboard أحادي بسيط وبطاقات إحصائية تفاعلية | `src/components/RepresentativePortal.tsx:1-200` | E0 | V2 | `ba63594` 2026-09-17 | تدفق المندوب: بطاقات إحصائية متفرعة + أزرار سريعة |
| `EV-0005` | A-03 | المداخل الرئيسية: واجهات ويب، خادم Express محلي، وخادم Baileys مستقل | `src/App.tsx`؛ `server.ts`؛ `src/server/whatsapp-server.ts` | E0 | V1 | `ba63594` 2026-09-17 | 6 شاشات رئيسية + خادمان للمنفذين 3001 و 3005 |
| `EV-0006` | A-04 | تعريف 6 أدوار وصلاحيات هرمية في مصفوفة الصلاحيات المركزية | `src/utils/permissions.ts:27-120` | E0 | V1 | `ba63594` 2026-09-17 | أدوار: admin, supervisor, rep, accountant, data_entry, visitor |
| `EV-0007` | A-04 | التحقق من هوية المشرف الأعلى يستند لمطابقة المعرف والبريد الرسمي | `src/utils/permissions.ts:230-245` | E0 | V1 | `ba63594` 2026-09-17 | فحص `isSuperAdmin` عبر `admin_1` و `admin@dalilak.com` |
| `EV-0008` | A-05 | قاعدة بيانات Supabase المشتركة تضم جداول المناديب والأنشطة والعمولات والمتابعات | `src/services/db/`؛ `FIX_SUPABASE_SOURCE_OF_TRUTH.sql` | E0 | V2 | `ba63594` 2026-09-17 | تم التحقق الحي من اتصال Supabase بكود HTTP 200 |
| `EV-0009` | A-05 | عمود gender مفعل ومفهرس رسمياً في جدول representatives في Supabase | `verify_gender.mjs`؛ استجابة خادم Supabase | E0 | V3 | `ba63594` 2026-09-17 | تحقق حي عبر REST API مع خدمة Supabase |
| `EV-0010` | A-06 | التكامل الخارجي مع Google Maps / Places API لاستخراج الأنشطة والصور الخمسة | `src/components/admin/tabs/AdminPlacesIngestionTab.tsx` | E0 | V1 | `ba63594` 2026-09-17 | مفتاح `GOOGLE_PLACES_API_KEY` مدعوم في `.env` |
| `EV-0011` | A-06 | محرك واتساب مستقل مبني على مكتبة Baileys يدعم الرموز الثنائية QR والتدوير | `src/server/whatsapp-gateway.ts:1-300` | E0 | V1 | `ba63594` 2026-09-17 | يدعم منفذي اتصال وتبديل تلقائي بين خطين |
| `EV-0012` | A-07 | العمليات المالية الحرجة تشمل حساب العمولات، طلبات الصرف، وإثبات توريد النقدية | `src/utils/commission.ts`؛ `src/components/admin/tabs/AdminPayoutsTab.tsx` | E0 | V1 | `ba63594` 2026-09-17 | تدفق مالي مؤمن مع تأكيد ConfirmDialog |
| `EV-0013` | A-07 | الحذف المؤقت (Soft Delete) مع سلة محذوفات وإمكانية الاسترجاع أو الإتلاف النهائي | `src/components/admin/tabs/AdminAuditTrashTab.tsx` | E0 | V1 | `ba63594` 2026-09-17 | محمي بنافذة تأكيد مخصصة ومنع مسح غير مقصود |
| `EV-0014` | A-08 | نظام تخزين محلي مزدوج يدمج LocalStorage مع المزامنة السحابية غير المتزامنة | `src/services/offlineSync.ts`؛ `src/utils/storage.ts` | E0 | V1 | `ba63594` 2026-09-17 | طابور مزامنة وحفظ محلي للعمل دون اتصال |
| `EV-0015` | A-09 | تصدير جهات الاتصال بصيغة VCF 3.0 المتوافقة مع Google Contacts | `src/components/admin/tabs/ExportContactsModal.tsx` | E0 | V1 | `ba63594` 2026-09-17 | تصدير دفعي للأرقام المسجلة |
| `EV-0016` | A-09 | توليد بطاقات المعاينة الاجتماعية الديناميكية OpenGraph للأنشطة | `dalelak-directory-portal/api/share.ts` | E0 | V1 | `ba63594` 2026-09-17 | قراءة بطاقة النشاط وتوليد وسوم الميتا للواتساب |
| `EV-0017` | A-10 | وجود ملفات كود عملاقة تفوق 1500 سطر تحتاج إعادة هيكلة وفصل اهتمامات | `FILE_MANIFEST.md`؛ إحصاء الأسطر | E0 | V1 | `ba63594` 2026-09-17 | ملفات الواتساب والتعديل ومزامنة الأماكن |
| `EV-0018` | A-11 | بناء تطبيق الإنتاج مؤتمت عبر Vite وخوادم Vercel Serverless | `vercel.json`؛ `package.json` | E0 | V2 | `ba63594` 2026-09-17 | البناء ناجح محلياً ومرفوع على مستودعين بـ GitHub |
| `EV-0019` | A-12 | قيود التصميم تلزم دعم RTL وخط Cairo والتغذية الراجعة الفورية بدون تنبيهات المتصفح | `src/components/RepresentativePortal.tsx`؛ `ConfirmDialog.tsx` | E0 | V2 | `ba63594` 2026-09-17 | خلو المشروع تماماً من `alert()` و `confirm()` |
