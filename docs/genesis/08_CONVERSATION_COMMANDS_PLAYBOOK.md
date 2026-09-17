# 08 — دليل أوامر المحادثة والتشغيل (Conversation Commands Playbook)

- **جذر المشروع:** `C:\Users\Ahmed\Desktop\New folder\Dalelak`
- **بصمة النسخة:** `ba63594132b130cd7da806484125fc508e0e4aa1`
- **الحالة:** معتمدة رسمياً (`AP-0001`) | التاريخ: 2026-09-17

---

## 1. أوامر الفحص والتحقق السريع (Verification Commands)

### فحص مطابقة الأنواع البرمجية (TypeScript Check):
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; npx tsc --noEmit
```
*الهدف:* التأكد من خلو المشروع من أي أخطاء برمجية في تعريفات الأنواع.

### بناء الإنتاج للمشروع الأساسي (Vite Build):
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; npm run build
```
*الهدف:* بناء حزم الإنتاج لـ `dist/` والتحقق من سلامة كافة الوحدات البرمجية.

### بناء الإنتاج لبوابة الدليل المستقلة:
```powershell
cd "dalelak-directory-portal"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; npm run build
cd ..
```

---

## 2. أوامر التشغيل المحلي (Local Dev Servers)

### تشغيل خادم التطبيق الأساسي (المنفذ 3001):
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; npm run dev
```

### تشغيل سيرفر الواتساب المستقل (المنفذ 3005):
```powershell
npm run whatsapp
# أو تشغيل الملف المساعد:
.\تشغيل_سيرفر_الواتساب.bat
```

---

## 3. أوامر الرفع المزدوج على GitHub (Dual-Repo Push Protocol)

### رفع بوابة الدليل أولاً:
```powershell
cd "dalelak-directory-portal"
git add .
git commit -m "feat: update public directory"
git push origin main
cd ..
```

### رفع المنظومة الأساسية ثانياً:
```powershell
git add .
git commit -m "feat: update dalilak core platform"
git push origin main
```
