# 02 — CORE FUNCTIONAL INVENTORY (الجرد الوظيفي ومسارات الاستدعاء)

- **الحالة:** مسودة مهيأة للاعتماد
- **التاريخ:** 2026-09-17
- **جذر المشروع:** `c:\Users\Ahmed\Desktop\New folder\Dalelak`
- **بصمة النسخة:** `43b321419dc3056951443ef86faad9b37715f552`
- **نطاق الفحص:** الشيفرة المصدرية (346 ملفًا) ومسارات الخادم والواجهات
- **مستوى التحقق:** V1 (فحص ساكن)

---

## 1. جدول المداخل ومسارات الاستدعاء الفعلي

| معرّف المدخل | نوعه ومساره | الدور/المحفز | الإجراء | سلسلة الاستدعاء الداخلي | CAP المرتبط | حالة الربط | الدليل |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `EP-001` | `POST /api/auth/login` | عام / مستخدم | تسجيل دخول وتوليد رمز جلسة | `server.ts` → `activeSessions.set()` | CAP-01 | قائم ساكنًا | `‹EV-0005; server.ts:165-220; E0›` |
| `EP-002` | `POST /api/auth/logout` | مستخدم مسجل | إبطال رمز الجلسة النشطة | `server.ts` → `activeSessions.delete()` | CAP-01 | قائم ساكنًا | `‹EV-0005; server.ts:205-215; E0›` |
| `EP-003` | `POST /api/auth/heartbeat` | جلسة نشطة | تمديد عمر الجلسة وتجديد الصلاحية | `server.ts` → فحص وتحديث انتهاء الجلسة | CAP-01 | قائم ساكنًا | `‹EV-0005; server.ts:195-204; E0›` |
| `EP-004` | `GET /api/businesses` | عام / إداري | استرجاع قائمة الأنشطة التجارية مع التصفية | `server.ts` → `server_biz_store.json` أو Supabase | CAP-02 / CAP-03 | قائم ساكنًا | `‹EV-0005; server.ts:240-310; E0›` |
| `EP-005` | `POST /api/businesses` | مندوب / إداري | إنشاء نشاط تجاري جديد | `server.ts` → حفظ محلي + مزامنة Supabase | CAP-03 / CAP-04 | قائم ساكنًا | `‹EV-0005; server.ts:320-410; E0›` |
| `EP-006` | `PUT /api/businesses/:id` | إداري / مشرف | تعديل بيانات نشاط قائم وتحديث حالته | `server.ts` → تدقيق الصلاحية وحفظ التعديلات | CAP-03 | قائم ساكنًا | `‹EV-0005; server.ts:420-530; E0›` |
| `EP-007` | `DELETE /api/businesses/:id` | إداري حصري | حذف نشاط أو أرشفته مع توثيق الدور | `server.ts` → التحقق من دور admin والحذف | CAP-03 / CAP-08 | قائم ساكنًا | `‹EV-0005; server.ts:540-590; E0›` |
| `EP-008` | `GET /api/representatives` | إداري / محاسب | جلب قائمة المناديب المعتمدين والموقوفين | `server.ts` → فحص الصلاحية وتطهير PII | CAP-04 / CAP-08 | قائم ساكنًا | `‹EV-0008; server.ts:600-660; E0›` |
| `EP-009` | `POST /api/representatives` | إداري حصري | تسجيل مندوب جديد وتعيين المحافظة | `server.ts` → التحقق وتخزين بيانات المندوب | CAP-04 | قائم ساكنًا | `‹EV-0008; server.ts:670-740; E0›` |
| `EP-010` | `POST /api/payouts` | مندوب | طلب سحب أرباح أو عمولة محصلة | `server.ts` → فحص الرصيد وتسجيل الطلب | CAP-05 | قائم ساكنًا | `‹EV-0017; server.ts:750-830; E0›` |
| `EP-011` | `PUT /api/payouts/:id` | محاسب / إداري | اعتماد صرف أو رفض طلب مستحقات | `server.ts` → تحديث حالة الطلب والتحصيل | CAP-05 | قائم ساكنًا | `‹EV-0017; server.ts:840-910; E0›` |
| `EP-012` | `POST /api/admin/whatsapp/start` | إداري | بدء حملة بث رسائل جماعية للأنشطة | `forwardToStandaloneWhatsApp` → منفذ 3001 | CAP-06 | قائم ساكنًا | `‹EV-0006; server.ts:90-110; E0›` |
| `EP-013` | `POST /api/admin/whatsapp/pause` | إداري | إيقاف مؤقت لحملة البث الجارية | `forwardToStandaloneWhatsApp` → منفذ 3001 | CAP-06 | قائم ساكنًا | `‹EV-0006; server.ts:100-115; E0›` |
| `EP-014` | `POST /api/places/import` | إداري | سحب أنشطة تجارية من Google Places API | `server.ts` → استعلام Google API وتصنيف الفئة | CAP-07 | قائم ساكنًا | `‹EV-0016; server.ts:1100-1250; E0›` |
| `EP-015` | `GET /api/secure/summary` | Vercel Edge | استعلام ملخص مؤمّن للدليل عبر Edge | `api/secure.ts` → Supabase مباشر عبر سيرفرليس | CAP-10 | قائم ساكنًا | `‹EV-0007; api/secure.ts:1-50; E0›` |
| `EP-016` | UI: `PublicBusinessDirectory` | عام (مستخدم) | عرض الدليل والبحث وتصفية المحافظات | `PublicBusinessDirectory.tsx` → `businessDb.ts` | CAP-02 | قائم ساكنًا | `‹EV-0002; src/components/directory/; E0›` |
| `EP-017` | UI: `InteractiveMap` | عام (مستخدم) | استعراض الأنشطة على الخريطة التفاعلية | Leaflet / OpenStreetMap tiles | CAP-02 | قائم ساكنًا | `‹EV-0002; InteractiveMap.tsx:1-1179; E0›` |
| `EP-018` | UI: `AdminWhatsAppCampaignTab`| إداري | لوحة تتبع وإعداد حملات الواتساب والتناوب | `AdminWhatsAppCampaignTab.tsx` | CAP-06 | قائم ساكنًا | `‹EV-0022; AdminWhatsAppCampaignTab.tsx; E0›` |

---

## 2. حدود التحقق والتغطية
- إجمالي المداخل المكتشفة والمفهرسة: 18 مدخلاً رئيساً.
- التغطية: 100% من المسارات والمداخل المكتشفة في `server.ts` و`api/` والواجهات الرئيسية.
- الملاحظة الفنية: جميع المداخل تعمل بمستوى فحص ساكن (V1). لم تُجر اختبارات تحميل شبكية أو إجهاد حية في هذا الطور.
