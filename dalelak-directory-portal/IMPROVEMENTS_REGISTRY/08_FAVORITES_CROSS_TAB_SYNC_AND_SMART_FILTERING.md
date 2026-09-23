# ❤️ تزامن قائمة المفضلة عبر النوافذ والفرز الذكي حسب المسافة
## Favorites View: Cross-Tab Storage Sync, In-Memory Quick Filters & Distance Sorting
**الملفات المعنية:**
- `src/components/PublicShowcase.tsx`
- `src/components/views/FavoritesView.tsx`

**حالة التعديل:** موثق وجاهز للتطبيق دون تعديل مباشر على الملفات الحالية.

---

### 🔍 التشخيص الهندسي (Audit & Problem Diagnosis):

قائمة الأنشطة المحفوظة (المفضلة) `FavoritesView` هي المساحة الشخصية للمستخدم للوصول السريع إلى أماكنه المفضلة (مطاعم، صيدليات، أطباء، فنيين).

تم رصد 3 نقاط قصور في تجربة الاستخدام الحالية:
1. **غياب المزامنة الحية عبر النوافذ المتعددة (`Cross-Tab Storage Desync`):**
   - عندما يفتح المستخدم التطبيق في أكثر من نافذة (أو نافذة PWA مستقلة + متصفح)، ويضيف نشاطاً للمفضلة في نافذة البحث، فإن شارة المفضلة في النافذة الأخرى تظل كما هي ولا تتحدث إلا بعد تحديث الصفحة يدوياً (Hard Reload).
2. **غياب الفرز حسب القرب المكاني (`Proximity Distance Sorting`):**
   - يتم تمرير إحداثيات موقع المستخدم `userCoords` إلى بطاقات المنشآت، لكن القائمة تُعرض بترتيب الحفظ دون فرز! عندما يكون المستخدم في الشارع أو السيارة، يحتاج لمعرفة أقرب صيدلية أو مطعم مفضل له حالياً دون الحاجة لقراءة الكروت واحداً تلو الآخر.
3. **غياب الفلترة السريعة حسب التصنيف داخل المفضلة:**
   - إذا حفظ المستخدم 15 مكاناً من فئات متعددة، لا توجد طريقة لتصفية المطاعم فقط أو الخدمات الطبية فقط، مما يضطره للتمرير الطويل.
4. **غياب خيار إفراغ المفضلة بنقرة واحدة:**
   - في حال رغبة المستخدم في بدء قائمة جديدة، يُجبر على النقر على أيقونة القلب في كل بطاقة على حدة.

---

### 🔧 الحل البرمجي المقترح (Exact Code Enhancement):

#### 1. تفعيل المزامنة الفورية عبر التبويبات في `PublicShowcase.tsx`:
```tsx
// ✅ مزامنة المفضلة حياً بين كافة التبويبات المفتوحة للموقع
useEffect(() => {
  const handleStorageSync = (e: StorageEvent) => {
    if (e.key === 'dalelak_user_favorites' && e.newValue) {
      try {
        const updated = JSON.parse(e.newValue);
        if (Array.isArray(updated)) {
          setFavorites(updated);
        }
      } catch {}
    }
  };

  window.addEventListener('storage', handleStorageSync);
  return () => window.removeEventListener('storage', handleStorageSync);
}, []);
```

#### 2. ترقية `FavoritesView.tsx` لدعم فرز المسافة والفلترة السريعة:
```tsx
// ✅ فرز حسب الأقرب جغرافياً في حال توفر GPS المستخدم:
const sortedAndFilteredFavorites = useMemo(() => {
  let list = businesses.filter((b) => favorites.includes(b.id));

  // تصفية حسب التصنيف المحدد داخل المفضلة
  if (selectedCategory !== 'all') {
    list = list.filter((b) => b.category === selectedCategory);
  }

  // فرز حسب المسافة الأقرب فالأقرب
  if (userCoords && sortByDistance) {
    list = [...list].sort((a, b) => {
      const distA = (a.lat && a.lng) ? calculateDistanceKm(userCoords.lat, userCoords.lng, a.lat, a.lng) : 9999;
      const distB = (b.lat && b.lng) ? calculateDistanceKm(userCoords.lat, userCoords.lng, b.lat, b.lng) : 9999;
      return distA - distB;
    });
  }

  return list;
}, [businesses, favorites, selectedCategory, userCoords, sortByDistance]);
```

#### 3. شريط شرائح الأقسام داخل صفحة المفضلة:
```tsx
{categoriesInFavorites.length > 1 && (
  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
    <button
      type="button"
      onClick={() => setSelectedCategory('all')}
      className={`text-xs font-black px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
        selectedCategory === 'all'
          ? 'bg-amber-500 text-slate-950 shadow-xs'
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      الكل ({favorites.length})
    </button>
    {categoriesInFavorites.map((cat) => (
      <button
        key={cat}
        type="button"
        onClick={() => setSelectedCategory(cat)}
        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
          selectedCategory === cat
            ? 'bg-amber-500 text-slate-950 shadow-xs'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
        }`}
      >
        {cat}
      </button>
    ))}
  </div>
)}
```

---

### 📊 الأثر المتوقع (Measurable Impact):
1. **تزامن فوري 100%:** أي تعديل في المفضلة يظهر في كافة النوافذ وشارات العداد فوراً.
2. **قيمة استثنائية للمستخدم أثناء التنقل:** العثور على أقرب مكان مفضل وموثوق بضغطة زر واحدة.
3. **تنظيم وسرعة وصول فائقة:** عزل الأنشطة حسب نوعها والوصول المباشر للخدمة المطلوبة.
