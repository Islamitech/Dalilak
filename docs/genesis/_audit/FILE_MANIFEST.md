# بيان ملفات المشروع (File Manifest) — الطور Ø

- **جذر المشروع:** `C:\Users\Ahmed\Desktop\New folder\Dalelak`
- **بصمة النسخة (Git Commit):** `ba63594132b130cd7da806484125fc508e0e4aa1`
- **تاريخ المسح:** 2026-09-17
- **حالة المسار:** مستودع مزدوج (Dual Repository: `Islamitech/Dalilak` و `Islamitech/Dalilak-directory`)

---

## 1. إحصاء الملفات حسب الامتداد (File Counts by Extension)

| الامتداد | العدد | الوصف والنطاق |
| :--- | :--- | :--- |
| `.jpg` | 2,101 | أصول الوسائط وصور المنشآت الميدانية (مستبعدة من فحص الأسطر النصية) |
| `.tsx` | 222 | مكونات واجهة المستخدم (React 19 + Tailwind CSS v4) — داخل النطاق |
| `.ts` | 121 | المنطق والخدمات والأنواع والخوادم المستقلة — داخل النطاق |
| `.json` | 55 | تكوينات، حزم، وبيانات احتياطية ومخازن محلية — داخل النطاق |
| `.md` | 45 | وثائق المرجعية وسجلات المراجعة والحوكمة — داخل النطاق |
| `.png` | 21 | صور إثبات وأيقونات التطبيق — داخل النطاق |
| `.sql` | 7 | مخططات وهجرات قاعدة بيانات Supabase — داخل النطاق |
| `.html` | 8 | قوالب العرض والصفحات الأساسية — داخل النطاق |
| `.css` | 2 | الأنماط الرئيسية ورموز التصميم — داخل النطاق |
| `.js` / `.mjs` / `.cjs` | 4 | سكربتات تشغيل وبناء وتكامل — داخل النطاق |
| **إجمالي الملفات داخل النطاق** | **2,611** | (يشمل أصول الوسائط؛ إجمالي ملفات الأكواد المصدرية: **345**) |
| **إجمالي أسطر الشيفرة البرمجية** | **95,796** | سطر برمجي عبر 345 ملف مصدري |

---

## 2. أكبر ملفات الشيفرة المصدرية (Top Largest Source Files)

| المسار النسبي | عدد الأسطر | الحجم (بايت) | عتبة الفحص (>1000 سطر) |
| :--- | :--- | :--- | :--- |
| `src/components/admin/tabs/AdminWhatsAppCampaignTab.tsx` | 2,818 | 161,938 | نعم — ملف فائق الحجم |
| `src/components/admin/tabs/AdminPlacesIngestionTab.tsx` | 1,600 | 82,293 | نعم — ملف فائق الحجم |
| `src/components/BusinessEditModal.tsx` | 1,584 | 81,690 | نعم — ملف فائق الحجم |
| `src/server/whatsapp-gateway.ts` | 1,518 | 68,022 | نعم — ملف فائق الحجم |
| `dalelak-directory-portal/src/components/InteractiveMap.tsx` | 1,069 | 54,360 | نعم — ملف فائق الحجم |
| `src/components/RepresentativePortal.tsx` | 1,014 | 54,540 | نعم — المركز الميداني |
| `src/utils/googleCategoryClassifier.ts` | 992 | 40,459 | تحت العتبة مباشرة |
| `src/components/AdminDashboard.tsx` | 937 | 44,796 | مجمع التبويبات الإدارية |
| `src/components/AdminProfileModal.tsx` | 835 | 47,878 | إدارة الملف الشخصي والحسابات |
| `src/components/PackagesHub.tsx` | 829 | 58,078 | مجمع الباقات والفواتير |
| `src/components/business-edit/EditLocationTab.tsx` | 829 | 49,094 | تبويب ضبط المواقع الجغرافية |
| `dalelak-directory-portal/src/components/PackagesHub.tsx` | 828 | 57,831 | مجمع الباقات في بوابة الدليل |
| `src/services/db/dbMappers.ts` | 815 | 50,868 | طبقة مطابقة وعزل البيانات |
| `src/components/admin/tabs/AdminOverviewTab.tsx` | 794 | 46,163 | تبويب الإحصائيات المركزية |
| `src/components/admin/modals/AdminAccountModal.tsx` | 792 | 47,543 | إدارة وتعديل الحسابات |
| `src/components/BusinessForm.tsx` | 790 | 36,042 | استمارة تسجيل الأنشطة الميدانية |
| `src/services/db/businessDb.ts` | 773 | 35,638 | عمليات قاعدة بيانات الأنشطة |
| `src/components/business-form/InterestedLeadSection.tsx` | 762 | 39,261 | قسم العملاء المحتملين |
| `src/components/GoogleMapsSyncModal.tsx` | 752 | 41,125 | نافذة مزامنة خرائط جوجل |
| `src/services/offlineSync.ts` | 730 | 29,296 | محرك العمل دون اتصال بالإنترنت |

---

## 3. حدود الاستبعاد وقواعد النطاق (Scope Boundaries)
- **المستبعد افتراضياً:**
  - `.git/` (كائنات Git الثنائية).
  - `node_modules/` (الحزم الخارجية).
  - `dist/` و `dist-directory/` (مخرجات البناء الوسيطة).
- **المشمول داخل النطاق:**
  - التطبيق الأساسي (`Dalilak`): كافة ملفات `src/`, `server/`, `api/`, `data/`, ملفات التكوين.
  - بوابة الدليل (`dalelak-directory-portal`): كافة ملفات `src/`, `api/`, ملفات التكوين.
