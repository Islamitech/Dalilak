# قواعد المستودعات والتطبيقات (Dual Repository Guide)

تحتوي بيئة العمل على تطبيقين ومستودعين مستقلين على GitHub:

---

## 1. التطبيق الأساسي: Dalilak (منظومة دليلك الميدانية والإدارية)
- **المستودع على GitHub:** https://github.com/Islamitech/Dalilak
- **المسار المحلي:** C:\Users\Ahmed\Desktop\New folder\Dalelak
- **الريموت (Remote):** git@github.com:Islamitech/Dalilak.git
- **طبيعة التطبيق:**
  - منظومة العمل الميداني وإدارة المناديب وتوثيق الأنشطة.
  - استمارات تسجيل الأنشطة، الفواتير، حساب العمولات، إدارة المستخدمين، ولوحة تحكم العمليات (AdminDashboard).
- **أمر الرفع:**
  ```bash
  # من جذر المشروع:
  git push origin main
  ```

---

## 2. بوابة الدليل المستقلة: Dalilak-directory (بوابة الجمهور والبحث)
- **المستودع على GitHub:** https://github.com/Islamitech/Dalilak-directory
- **المسار المحلي:** C:\Users\Ahmed\Desktop\New folder\Dalelak\dalelak-directory-portal
- **الريموت (Remote):** git@github.com:Islamitech/Dalilak-directory.git
- **طبيعة التطبيق:**
  - البوابة العامة المخصصة للزوار والجمهور لتصفح الأنشطة التجارية والبحث السريع والخرائط التفاعلية.
  - مستقلة ومحسنة خصيصاً للأداء العالي (CDN، وتجزئة البيانات).
- **أمر الرفع:**
  ```bash
  # من داخل مجلد dalelak-directory-portal:
  cd "dalelak-directory-portal"
  git push origin main
  ```

---

## بروتوكول الرفع على GitHub (Push Protocol)
1. عند طلب المستخدم «رفع» أو «رفع على GitHub»، يتم دائماً التمييز الدقيق بين التطبيقين:
   - إذا كان التعديل يخص التطبيق الأساسي، يتم الرفع على مستودع Islamitech/Dalilak.
   - إذا كان التعديل يخص بوابة الدليل المستقلة، يتم الرفع على مستودع Islamitech/Dalilak-directory.
   - إذا شمل التعديل مزامنة بين الاثنين، يتم توضيح التغييرات والرفع على المستودعين على حدة.
