# 📶 صمود التطبيق في وضع عدم الاتصال وتخزين محرك الخريطة في PWA Service Worker
## Offline PWA Resilience: Leaflet Engine Precache & Offline Network Failover
**الملفات المعنية:**
- `public/sw.js`
- `index.html`
- `src/components/InteractiveMap.tsx`

**حالة التعديل:** موثق وجاهز للتطبيق دون تعديل مباشر على الملفات الحالية.

---

### 🔍 التشخيص الهندسي (Audit & Problem Diagnosis):

تطبيق "دليلك" يدعم تقنية تطبيقات الويب التقدمية (PWA) مع ملف Service Worker (`public/sw.js`) لتمكين الفتح السريع بدون إنترنت.

#### نقطة الخلل المكتشفة:
1. في `index.html` (الأسطر 63-64):
   يتم استدعاء ملفات تشغيل الخريطة من شبكة خارجية:
   `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`
   `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`
2. في `public/sw.js`:
   قائمة الأصول المخزنة مسبقاً (`STATIC_PRECACHE`) تقتصر فقط على:
   `['/offline.html', '/logo.png', '/favicon.svg', '/manifest.json']`
3. النتيجة عند انقطاع الإنترنت أو التصفح في وضع الطيران:
   - عند فتح تطبيق الـ PWA، يفشل تحميل كائن `window.L` من unpkg.
   - يعلق خطاف تهيئة الخريطة `useMapInstance.ts` عند الشرط:
     `if (!window.L) return;`
   - تظل شاشة الخريطة رمادية معلقة دون ظهور واجهة توضح للمستخدم حالة الاتصال أو محاولة إعادة الاتصال التلقائي.

---

### 🔧 الحل البرمجي المقترح (Exact Code Enhancement):

#### 1. تحديث `public/sw.js` لتخزين أصول Leaflet مسبقاً والتخزين المؤقت للخرائط:
```javascript
// ✅ إضافة أصول الخريطة الأساسية إلى التخزين المسبق المضمون:
const CACHE_NAME = 'dalilak-portal-shell-v3';
const OFFLINE_URL = '/offline.html';

const STATIC_PRECACHE = [
  OFFLINE_URL,
  '/logo.png',
  '/favicon.svg',
  '/manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];
```

#### 2. دعم التخزين المؤقت التلقائي لمربعات الخريطة السابقة (Tile Cache):
```javascript
// ✅ تخزين مؤقت لمربعات خريطة OpenStreetMap التي تم تصفحها سابقاً لتعمل بدون إنترنت:
if (url.hostname.includes('tile.openstreetmap') || url.hostname.includes('openstreetmap.fr')) {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open('dalilak-map-tiles-v1').then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        // عند عدم توفر المربع دون اتصال، يتم إرجاع مربع شفاف فارغ بدلاً من إظهار خطأ مكسور
        return new Response('', { status: 200, headers: { 'Content-Type': 'image/png' } });
      });
    })
  );
  return;
}
```

#### 3. إضافة لافتة استشعار حالة الإنترنت التفاعلية (`Online/Offline Banner`):
في `InteractiveMap.tsx`، إظهار شارة ذكية صغيرة تختفي تلقائياً عند عودة الاتصال:
```tsx
// ✅ استشعار فوري لعودة الإنترنت وإعادة تحميل المربعات الناقصة:
const [isOnline, setIsOnline] = React.useState(navigator.onLine);

React.useEffect(() => {
  const handleOnline = () => {
    setIsOnline(true);
    mapInstance.leafletMapRef.current?.invalidateSize();
  };
  const handleOffline = () => setIsOnline(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

{!isOnline && (
  <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[990] bg-slate-900/95 text-amber-300 text-xs font-bold px-4 py-1.5 rounded-full border border-amber-500/40 shadow-xl flex items-center gap-2">
    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
    <span>أنت تتصفح في وضع عدم الاتصال (بيانات محفوظة محلياً)</span>
  </div>
)}
```

---

### 📊 الأثر المتوقع (Measurable Impact):
1. **تشغيل فوري للخريطة دون انتظار شبكة unpkg الخارجية.**
2. **إمكانية استعراض شوارع حدائق الأهرام التي تمت زيارتها مسبقاً حتى في حالة انقطاع شبكة الهاتف.**
3. **تجربة PWA حقيقية ترتقي لمستوى التطبيقات المثبتة الأصلية (Native App-Like Offline Mode).**
