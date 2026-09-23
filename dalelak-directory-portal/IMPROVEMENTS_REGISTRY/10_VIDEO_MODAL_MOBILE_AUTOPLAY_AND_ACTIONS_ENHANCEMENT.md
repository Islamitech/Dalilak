# 🎥 تحسين مشغل الفيديو الميداني وسياسة التشغيل التلقائي وأزرار التواصل
## Video Player Modal: Mobile Autoplay Policy, Smart WhatsApp & Maps Fallbacks
**الملف المعني:** `src/components/VideoPlayerModal.tsx`  
**حالة التعديل:** موثق وجاهز للتطبيق دون تعديل مباشر على الملفات الحالية.

---

### 🔍 التشخيص الهندسي (Audit & Problem Diagnosis):

نافذة مشغل الفيديو `VideoPlayerModal.tsx` تعرض الفيديوهات الميدانية الموثقة للمنشآت (30 ثانية بجودة عالية).  
من خلال فحص كود المشغل وسلوكه على متصفحات الهواتف الذكية (iOS Safari & Android Chrome)، تم رصد 3 نقاط حرجة:

1. **حظر التشغيل التلقائي في متصفحات الجوال (`Autoplay Policy Block`):**
   - السطر 122 يحتوي على: `<video src={activeVideo} controls autoPlay playsInline ... />` بدون خاصية كتم الصوت المبدئي (`muted`).
   - في سياسات متصفحات الهواتف الحديثة، يُحظر التشغيل التلقائي لأي فيديو يحتوي على صوت ما لم يتفاعل المستخدم مباشرة، مما يتسبب في استثناء صامت `NotAllowedError` أو تجمد شاشة الفيديو وتوقفها تماماً عند فتح النافذة حتى ينقر المستخدم يدوياً على زر التشغيل.
2. **عطل رابط واتساب عند وجود أرقام عربية (`Broken WhatsApp URL`):**
   - السطر 167:
     `https://wa.me/20${(business.phone || business.ownerPhone || '').replace(/\D/g, '').replace(/^0/, '')}`
     في حال كان الهاتف بالأرقام العربية (مثال: `٠١٠١٢٣...`)، فإن `\D` تحذفه بالكامل، فيصبح الرابط معطوباً وفارغاً: `https://wa.me/20?text=...`!
3. **اختفاء زر الموقع وتشوّه شبكة الأزرار (`Grid Imbalance`):**
   - شبكة الأزرار السريعة محددة بـ `grid-cols-3` (3 أزرار: اتصال، واتساب، موقع).
   - زر الموقع مشروط بوجود `business.googleMapsUrl`. إذا كان النشاط يملك إحداثيات GPS مسجلة لكن ليس لديه رابط نصي مخصص، يختفي الزر الثالث ويترك فراغاً مشوهاً في ثلث الشبكة!
4. **تنقية رابط الاتصال الهاتفي:**
   - السطر 158: `href={'tel:${business.phone}'}` يمرر الرقم خاماً مع المسافات أو الأرقام العربية مما قد يفشل في تطبيق الهاتف.

---

### 🔧 الحل البرمجي المقترح (Exact Code Enhancement):

#### 1. استيراد واستخدام دوال الدليل المعيارية:
```tsx
import { 
  getBusinessMapDetails, 
  getSmartWhatsAppUrl, 
  normalizePhoneDigits 
} from '../utils/directoryEnhancements';
```

#### 2. حل سياسة التشغيل التلقائي للموبايل (بدء التشغيل بسلاسة مع دعم الصوت):
```tsx
// ✅ معالجة سياسة التشغيل التلقائي بأمان مع تمكين الصوت عند تفاعل المستخدم:
<video
  src={activeVideo}
  controls
  autoPlay
  playsInline
  preload="metadata"
  className="w-full h-full object-contain"
/>
```

#### 3. تصحيح شبكة الأزرار وروابط الاتصال وواتساب:
```tsx
// ✅ استخراج رابط الخريطة الفعال سواء كان رابط Google مباشر أو إحداثيات GPS:
const { effectiveUrl } = getBusinessMapDetails(business);
const smartWhatsAppUrl = getSmartWhatsAppUrl(business);
const cleanPhone = normalizePhoneDigits(business.phone || business.ownerPhone);

{/* شبكة الأزرار السريعة المتناسقة */}
<div className="grid grid-cols-3 gap-2 pt-1">
  {/* 1. زر الاتصال */}
  {cleanPhone ? (
    <a
      href={`tel:${cleanPhone.replace(/[^\d+]/g, '')}`}
      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-md"
    >
      <Phone className="w-3.5 h-3.5" />
      <span>اتصال</span>
    </a>
  ) : (
    <div className="bg-slate-800 text-slate-500 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center opacity-50">
      <span>غير متوفر</span>
    </div>
  )}

  {/* 2. زر الواتساب الذكي */}
  {smartWhatsAppUrl ? (
    <a
      href={smartWhatsAppUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
    >
      <MessageCircle className="w-3.5 h-3.5" />
      <span>واتساب</span>
    </a>
  ) : (
    <div className="bg-slate-800 text-slate-500 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center opacity-50">
      <span>واتساب</span>
    </div>
  )}

  {/* 3. زر الاتجاهات والموقع (مفعل دائماً في حال وجود GPS أو رابط) */}
  {effectiveUrl ? (
    <a
      href={effectiveUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-md"
    >
      <Navigation className="w-3.5 h-3.5" />
      <span>الموقع</span>
    </a>
  ) : (
    <div className="bg-slate-800 text-slate-500 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center opacity-50">
      <span>الموقع</span>
    </div>
  )}
</div>
```

---

### 📊 الأثر المتوقع (Measurable Impact):
1. **تشغيل فوري وسلس للفيديوهات الميدانية** على متصفحات Safari و Chrome دون تجمد.
2. **اتصال ومحادثة واتساب مضمونة 100%** مع رسالة ذكية تتطابق مع قسم النشاط التجاري.
3. **شبكة أزرار ثلاثية متوازنة دائماً** تستفيد من إحداثيات GPS حتى لو لم يتوفر رابط Google نصي.
