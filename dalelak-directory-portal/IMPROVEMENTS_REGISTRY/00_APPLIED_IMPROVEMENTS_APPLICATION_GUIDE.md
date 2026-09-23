# 🏛️ دليل تطبيق التحسينات الشاملة على نسخة الإنتاج النظيفة
## Dalilak Directory Portal — Production Clean Application & Integration Guide
**المسار المستهدف:** `c:\Users\Ahmed\Desktop\Dalelak_Apps_Export\Dalilak-directory_Production_Clean`  
**المعيار الهندسي:** بروتوكول الحوكمة الصفرية للأخطاء (**Zero-Defect Standard & Code 0**)

---

### 📋 الفهرس التنفيذي للتحسينات:
1. [التحسين الأول: تثبيت وسلاسة محرك الخريطة وإلغاء قفزات الكاميرا (Map Stability & Bounds Lock)](#1-التحسين-الأول-تثبيت-وسلاسة-محرك-الخريطة-وإلغاء-قفزات-الكاميرا)
2. [التحسين الثاني: إصلاح مطابقة الأحرف العربية وفلترة المناطق (Arabic Regex & Zone Scope)](#2-التحسين-الثاني-إصلاح-مطابقة-الأحرف-العربية-وفلترة-المناطق)
3. [التحسين الثالث: فك تكتل وتطابق الدبابيس مع انحراف جغرافي صفري (Zero Geographic Offset Pin Dispersal)](#3-التحسين-الثالث-فك-تكتل-وتطابق-الدبابيس-مع-انحراف-جغرافي-صفري)
4. [التحسين الرابع: شريط تصنيفات الأنشطة السريعة باللمس (Quick Category Chips Ribbon)](#4-التحسين-الرابع-شريط-تصنيفات-الأنشطة-السريعة-باللمس)
5. [التحسين الخامس: محول طبقات الخريطة وقمر Google Hybrid الصناعي (Tile Layers & Satellite)](#5-التحسين-الخامس-محول-طبقات-الخريطة-وقمر-google-hybrid-الصناعي)
6. [التحسين السادس: درج تفاصيل النشاط المحدد (Selected Business Drawer Enhancements)](#6-التحسين-السادس-درج-تفاصيل-النشاط-المحدد)
7. [التحسين السابع: عداد الأنشطة الحي المتزامن وإعادة الضبط (Live Contextual Counter & Reset)](#7-التحسين-السابع-عداد-الأنشطة-الحي-المتزامن-وإعادة-الضبط)
8. [التحسين الثامن: تعزيز مربع البحث الجغرافي والاختصارات (Search Box Keyboard & Click-Outside UX)](#8-التحسين-الثامن-تعزيز-مربع-البحث-الجغرافي-والاختصارات)

---

### 1. التحسين الأول: تثبيت وسلاسة محرك الخريطة وإلغاء قفزات الكاميرا
**الملف:** `src/components/map/hooks/useMapInstance.ts`

#### 🎯 الهدف الهندسي:
- القضاء التام على ارتداد وقَفَزات الكاميرا العنيفة أثناء السحب أو التكبير.
- منع تدمير وإعادة إنشاء كائن Leaflet عند التبديل بين وضع التمدد أو تغير الأبعاد.
- فرض قفل نطاق حدائق الأهرام جغرافياً لمنع الإبحار العرضي للمحافظات الأخرى.

#### 🔧 التعديل التفصيلي في الكود:
1. **في إعدادات إنشاء الخريطة `L.map`:**
```typescript
// استبدال إعدادات الخريطة بإعدادات السلاسة الطبيعية ومقاومة الارتداد:
const map = window.L.map(containerRef.current, {
  center: [centerToUse.lat, centerToUse.lng],
  zoom: centerToUse.zoom || zoomLevel,
  zoomControl: false,
  attributionControl: false,
  zoomSnap: 0.5,
  zoomDelta: 0.5,
  wheelPxPerZoomLevel: 80,
  zoomAnimation: true,
  fadeAnimation: true,
  markerZoomAnimation: true,
  inertia: true,
  inertiaDeceleration: 3500,
  inertiaMaxSpeed: 1600,
  easeLinearity: 0.25,
  bounceAtZoomLimits: false,
  maxBoundsViscosity: 0.75, // مرونة تدريجية بدلاً من الصدمة العنيفة عند الحدود
});
```

2. **قفل النطاق الجغرافي لحدائق الأهرام:**
```typescript
if (mode === 'view') {
  map.setMaxBounds([
    [29.9300, 31.0600], // الجنوب الغربي
    [30.0050, 31.1400], // الشمال الشرقي
  ]);
  map.options.minZoom = isMobile ? 12.8 : 13.2;
  map.options.maxZoom = 19.5;
}
```

3. **إلغاء قفزات الكاميرا أثناء السحب اليدوي:**
```typescript
// فور بدء السحب اليدوي من المستخدم، نوقف أي تحريك برمجي جاري:
map.on('dragstart', () => {
  try {
    map.stop();
  } catch {}
});
```

---

### 2. التحسين الثاني: إصلاح مطابقة الأحرف العربية وفلترة المناطق
**الملفات المعنية:**
- `src/utils/hadayekZoneHelper.ts`
- `src/components/map/hooks/useMapPinsClustering.ts`

#### 🎯 الهدف الهندسي:
- معالجة فشل التعابير النمطية `\b` القياسية في التعرف على حدود الحروف والكلمات العربية (مثال: "منطقة أ" أو "منطقة ب").
- حل مشكلة تفريغ الخريطة ("The Blank Zone Bug") عند اختيار نشاط في منطقة ثم الانتقال لمنطقة أخرى.

#### 🔧 التعديل التفصيلي:
1. **في `src/utils/hadayekZoneHelper.ts`:**
```typescript
// استبدال \b بفحص المحارف المتوافق عربياً عبر Lookahead و Lookbehind:
const regex = new RegExp(
  `(?<=^|[^ء-يa-zA-Z0-9])(?:منطقة|منطقه)\\s*${escapedLetter}(?=[^ء-يa-zA-Z0-9]|$)`,
  'i'
);
```

2. **في `src/components/map/hooks/useMapPinsClustering.ts`:**
```typescript
// عند تغيير المنطقة المحددة أو قسم النشاط، فحص المنشأة المحددة وإلغاء تحديدها بسلاسة إن لم تعد تطابق:
useEffect(() => {
  if (selectedBiz) {
    const hasCategory = Boolean(mapCategoryFilter && mapCategoryFilter !== 'all');
    const stillMatchesCategory = !hasCategory || matchesCategoryFilter(selectedBiz, mapCategoryFilter);
    const hasZone = Boolean(selectedZone && selectedZone !== 'all');
    const stillMatchesZone = !hasZone || isBusinessInHadayekZone(selectedBiz, selectedZone);

    if (!stillMatchesCategory || !stillMatchesZone) {
      setSelectedBiz(null);
    }
  }
}, [selectedZone, mapCategoryFilter, selectedBiz, setSelectedBiz]);
```

---

### 3. التحسين الثالث: فك تكتل وتطابق الدبابيس مع انحراف جغرافي صفري
**الملفات المعنية:**
- `src/components/map/utils/pinDispersal.ts`
- `src/components/map/badgeMarkers.ts`

#### 🎯 الهدف الهندسي:
- منع ترحيل إحداثيات GPS الحقيقية للمنشآت المتطابقة جغرافياً (التي كانت تزحف بمقدار 240 متراً بعيداً عن موقعها الأصلي).
- الحفاظ على إحداثيات GPS الأصلية بنسبة انحراف 0 متر، وتوزيع الكروت عبر إزاحة بكسل الشاشة `pixelOffset: [dx, dy]` مع خط شعاعي مؤشر (SVG Leader Line).

#### 🔧 التعديل التفصيلي:
1. **في `src/components/map/utils/pinDispersal.ts`:**
```typescript
// الاحتفاظ التام بالإحداثيات الأصلية وتوزيع الإزاحة في فضاء الشاشة فقط:
return {
  business: biz,
  originalCoord: [biz.lat, biz.lng],
  dispersedCoord: [biz.lat, biz.lng], // 0 متر انحراف جغرافي
  isCoincident: true,
  isDispersed: true,
  pixelOffset: [screenDx, screenDy],  // إزاحة الشاشة بالبكسل
};
```

2. **في `src/components/map/badgeMarkers.ts`:**
```typescript
// تعديل نقطة ارتكاز الأيقونة iconAnchor لامتصاص إزاحة البكسل بدقة:
const baseAnchorX = isProminent ? 120 : 80;
const baseAnchorY = isProminent ? 143 : 95;
const effectiveAnchor: [number, number] = [
  baseAnchorX - pixelOffset[0],
  baseAnchorY - pixelOffset[1],
];
```

---

### 4. التحسين الرابع: شريط تصنيفات الأنشطة السريعة باللمس
**الملف:** `src/components/map/MapModernTopBar.tsx`

#### 🎯 الهدف الهندسي:
- تمكين المستخدم على الهواتف والأجهزة المكتبية من فلترة وتصفح الأنشطة الأكثر طلباً (مطاعم، كافيهات، صيدليات، أسواق...) بنقرة واحدة مباشرة من شريط علوي قابل للتمرير الأفقي.

#### 🔧 التعديل التفصيلي:
```tsx
{/* Quick Category Chips Ribbon */}
<div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 touch-pan-x">
  {categories
    .filter((c) => c.id !== 'all')
    .map((cat) => {
      const isSelected = categoryFilter === cat.id;
      return (
        <button
          key={cat.id}
          type="button"
          onClick={() => {
            const nextCat = isSelected ? 'all' : cat.id;
            if (onCategoryChange) onCategoryChange(nextCat);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-xs shrink-0 select-none active:scale-95 ${
            isSelected
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black border border-amber-300 ring-2 ring-amber-400/30'
              : 'bg-white/95 backdrop-blur-md text-slate-700 hover:bg-slate-50 border border-slate-200/90'
          }`}
        >
          <span className="text-sm">{cat.icon}</span>
          <span>{cat.name.split(' ')[0]}</span>
        </button>
      );
    })}
</div>
```

---

### 5. التحسين الخامس: محول طبقات الخريطة وقمر Google Hybrid الصناعي
**الملفات المعنية:**
- `src/components/map/constants/mapConstants.ts`
- `src/components/map/hooks/useMapInstance.ts`
- `src/components/map/MapFloatingControls.tsx`

#### 🎯 الهدف الهندسي:
- تفعيل خيار القمر الصناعي الحقيقي فائق الوضوح مع أسماء الشوارع والمعالم (`Google Hybrid Satellite`).
- تصحيح تموضع القائمة المنبثقة للطبقات لتفتح دائماً باتجاه الداخل (`right-full top-0 mr-2`) دون أن تتجاوز حافة شاشات الجوال.

#### 🔧 التعديل التفصيلي:
1. **في `useMapInstance.ts`:**
```typescript
case 'google-hybrid':
  return {
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    maxZoom: 20,
    maxNativeZoom: 20,
    subdomains: ['0', '1', '2', '3'],
    attribution: 'Imagery © Google',
    ...commonOptions,
  };
```

2. **في `MapFloatingControls.tsx`:**
```tsx
{showLayerMenu && (
  <div
    className="absolute right-full top-0 mr-2 bg-white/98 backdrop-blur-xl border border-slate-200/90 shadow-2xl rounded-2xl p-1.5 flex flex-col gap-1 min-w-[180px] z-[950] font-['Cairo',sans-serif]"
    dir="rtl"
  >
    {/* خيارات: تخطيطية مساحية | شوارع Google | قمر صناعي Satellite */}
  </div>
)}
```

---

### 6. التحسين السادس: درج تفاصيل النشاط المحدد
**الملف:** `src/components/map/MapSelectedBusinessDrawer.tsx`

#### 🎯 الهدف الهندسي:
- تحسين تجربة اختيار النشاط بعرض صورة غلاف ذكية بديلة للفئات في حال عدم توفر صورة.
- إضافة شارة الحرف الرسمي لمنطقة حدائق الأهرام (مثال: `منطقة أ`).
- توفير ميزة نسخ العنوان بنقرة واحدة مع تأكيد تفاعلي "تم النسخ!".
- إضافة زر المشاركة السريعة عبر تطبيقات الهاتف (`Web Share API`).

---

### 7. التحسين السابع: عداد الأنشطة الحي المتزامن وإعادة الضبط
**الملفات المعنية:**
- `src/components/InteractiveMap.tsx`
- `src/components/map/MapModernTopBar.tsx`

#### 🎯 الهدف الهندسي:
- عرض عدد الأنشطة المطابقة الفعلي والمتزامن مع المنطقة المحددة وقسم النشاط بدقة (مثال: `14 نشاط`) مع نقطة نبض خضراء.
- إضافة زر فوري "إعادة ضبط" يظهر عند تفعيل أي فلتر للعودة لكامل الخريطة بنقرة واحدة.

---

### 8. التحسين الثامن: تعزيز مربع البحث الجغرافي والاختصارات
**الملف:** `src/components/map/MapSearchBox.tsx`

#### 🎯 الهدف الهندسي:
- دعم زر `Escape` لإغلاق الاقتراحات وإلغاء التركيز فوراً.
- دعم زر `Enter` لاختيار أول نتيجة مقترحة تلقائياً.
- إغلاق القائمة تلقائياً عند النقر خارج مساحة البحث (`Click-Outside Listener`).
