# 08 — IMPLEMENTATION BATCHES (دفعات التنفيذ وخطط التحقق)

- **المشروع:** دليلك (Dalilak)
- **الجذر:** `c:\Users\Ahmed\Desktop\New folder\Dalelak`
- **التاريخ:** 2026-09-17 14:27:00+03:00
- **حالة الدفعات:** تم إنجاز UXB-01 و UXB-02 بنجاح 100%

---

## مصفوفة الدفعات التنفيذية

| الدفعة (UXB) | التحسينات المشمولة (UXCH) | النطاق والملفات المستهدفة | التبعيات | إقرار الاعتماد (UXAP) | الحالة | وسيلة التحقق | خطة التراجع (Rollback) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`UXB-01`** | `UXCH-01`, `UXCH-02`, `UXCH-03`, `UXCH-04`, `UXCH-06` | `src/components/BottomNav.tsx`, `src/components/home/HomeFeedView.tsx`, `src/index.css` | لا توجد تبعيات خارجية | `UXAP-0001`, `UXAP-0002` | منجز ومحقق 100% | اختبارات Vitest + فحص البناء `tsc --noEmit` + مطابقة معايير UXAC | استعادة النسخة السابقة عبر Git |
| **`UXB-02`** | `UXCH-05`, `UXCH-07` | `src/components/design-system/Button.tsx`, `src/components/business-drawer/DrawerAdminTab.tsx`, `src/components/directory/DirectoryFilterBar.tsx` | لا توجد تبعيات خارجية | أمر سيادي مباشر (UXAP-0003) | منجز ومحقق 100% | اختبارات Vitest (60/60) + فحص `tsc --noEmit` | استعادة النسخة السابقة عبر Git |

