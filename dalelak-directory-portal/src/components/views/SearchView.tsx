import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  MapPin,
  ArrowLeft,
  Search,
  LocateFixed,
  X,
  RotateCcw,
  Sparkles,
  Utensils,
  ShoppingBasket,
  Stethoscope,
  Wrench,
  Car,
  Coffee,
  Store,
} from 'lucide-react';
import { Business } from '../../types';
import { SmartSearchBar } from '../search/SmartSearchBar';
import { FilterBar } from '../search/FilterBar';
import { ActiveFilterChips } from '../search/ActiveFilterChips';
import { FilterDrawer } from '../search/FilterDrawer';
import { BusinessCardGrid } from '../cards/BusinessCardGrid';
import { BusinessCard } from '../cards/BusinessCard';
import { CategoryHierarchyFilter } from '../search/CategoryHierarchyFilter';
import { getCategoryGroupById, getCategoryLabel, getSubcategoryById } from '../../data/categoryTaxonomy';
import { getBusinessesInZone } from '../../utils/hadayekZoneHelper';

export interface SearchViewProps {
  filteredBusinesses: Business[];
  allBusinesses: Business[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedGov: string;
  onGovChange: (g: string) => void;
  selectedCity: string;
  onCityChange: (c: string) => void;
  selectedZone: string;
  onZoneChange: (z: string) => void;
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  subcategoryFilter: string;
  onSubcategoryChange: (cat: string) => void;
  sortBy: 'default' | 'nearest' | 'newest' | 'has_video' | 'open_now' | 'alpha';
  onSortChange: (s: any) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  hasRatingOnly: boolean;
  onToggleHasRating: () => void;
  hasVideoOnly: boolean;
  onToggleHasVideo: () => void;
  userCoords: { lat: number; lng: number } | null;
  isLocatingUser: boolean;
  onRequestLocation: () => void;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  onResetAllFilters: () => void;
  hasActiveFilters: boolean;
  onOpenVideoModal?: (biz: Business) => void;
  onNavigate: (path: string) => void;
  onReshuffle?: () => void;
}

// 🏷️ الفئات الست الأساسية المتطابقة تماماً مع النسخة التجريبية وشاشة الموبايل
const DISCOVERY_CATEGORIES: Array<{
  id: string;
  label: string;
  groupId: string;
  subcategoryId?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}> = [
  {
    id: 'food',
    label: 'مطاعم ومأكولات',
    groupId: 'food',
    icon: Utensils,
  },
  {
    id: 'health',
    label: 'صحة ورعاية',
    groupId: 'health',
    icon: Stethoscope,
  },
  {
    id: 'grocery',
    label: 'تسوق وبقالة',
    groupId: 'grocery',
    icon: ShoppingBasket,
  },
  {
    id: 'services',
    label: 'خدمات منزلية',
    groupId: 'crafts',
    icon: Wrench,
  },
  {
    id: 'cafes',
    label: 'كافيهات',
    groupId: 'food',
    subcategoryId: 'cafe',
    icon: Coffee,
  },
  {
    id: 'auto',
    label: 'خدمات سيارات',
    groupId: 'automotive',
    icon: Car,
  },
];

export const SearchView: React.FC<SearchViewProps> = ({
  filteredBusinesses,
  allBusinesses,
  loading,
  searchQuery,
  onSearchChange,
  selectedGov,
  onGovChange,
  selectedCity,
  onCityChange,
  selectedZone,
  onZoneChange,
  categoryFilter,
  onCategoryChange,
  subcategoryFilter,
  onSubcategoryChange,
  sortBy,
  onSortChange,
  openNowOnly,
  onToggleOpenNow,
  hasRatingOnly,
  onToggleHasRating,
  hasVideoOnly,
  onToggleHasVideo,
  userCoords,
  isLocatingUser,
  onRequestLocation,
  onOpenBusiness,
  onToggleFavorite,
  favorites,
  onResetAllFilters,
  hasActiveFilters,
  onOpenVideoModal,
  onNavigate,
  onReshuffle,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showAllManually, setShowAllManually] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('mode=all')) {
      return true;
    }
    return false;
  });

  // تحديد ما إذا كان المستخدم يجري بحثاً أو يطبق فلترة أو طلب عرض كل الأنشطة
  const isFilteringOrSearching = useMemo(() => {
    return Boolean(
      showAllManually ||
      searchQuery.trim() ||
      (categoryFilter && categoryFilter !== 'all') ||
      (subcategoryFilter && subcategoryFilter !== 'all') ||
      (selectedGov && selectedGov !== 'all') ||
      (selectedCity && selectedCity !== 'all') ||
      (selectedZone && selectedZone !== 'all') ||
      openNowOnly ||
      hasRatingOnly ||
      hasVideoOnly ||
      sortBy !== 'default' ||
      hasActiveFilters
    );
  }, [
    showAllManually,
    searchQuery,
    categoryFilter,
    subcategoryFilter,
    selectedGov,
    selectedCity,
    selectedZone,
    openNowOnly,
    hasRatingOnly,
    hasVideoOnly,
    sortBy,
    hasActiveFilters,
  ]);

  // 2. انتقاء أفضل 6 منشآت موثقة ومميزة في الدليل لقسم «وجهتك التالية تبدأ من هنا»
  const featuredBusinesses = useMemo(() => {
    const verified = allBusinesses.filter(
      (b) => b.verificationStatus === 'verified' && !b.isDeleted
    );
    const withMedia = verified.filter(
      (b) => (b.photos && b.photos.length > 0) || b.coverPhoto
    );
    const pool = withMedia.length >= 6 ? withMedia : verified.length >= 6 ? verified : allBusinesses;
    return pool.slice(0, 6);
  }, [allBusinesses]);

  const advancedFiltersCount = [
    selectedGov !== 'all',
    selectedCity !== 'all',
    selectedZone !== 'all',
    hasRatingOnly,
  ].filter(Boolean).length;

  const categoryScopeBusinesses = useMemo(
    () => selectedZone && selectedZone !== 'all' ? getBusinessesInZone(allBusinesses, selectedZone) : allBusinesses,
    [allBusinesses, selectedZone]
  );

  const handleReturnToDiscovery = () => {
    setShowAllManually(false);
    onResetAllFilters();
    try {
      window.history.replaceState(null, '', '/search');
    } catch {}
  };

  const handleLocationSelect = (val: string) => {
    if (val === 'all') {
      onGovChange('all');
      onCityChange('all');
    } else if (val === 'حدائق الأهرام') {
      onGovChange('الجيزة');
      onCityChange('حدائق الأهرام');
    } else if (
      val === 'مدينة 6 أكتوبر' ||
      val === 'مدينة الشيخ زايد' ||
      val === 'الهرم' ||
      val === 'فيصل' ||
      val === 'الدقي' ||
      val === 'المهندسين'
    ) {
      onGovChange('الجيزة');
      onCityChange(val);
    } else {
      onGovChange(val);
      onCityChange('all');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-7 sm:space-y-10 pb-24 bg-[#f8fafc]" dir="rtl">
      {/* ========================================================================= */}
      {/* 🌟 1. قسم الهيرو والبحث والتصنيفات (ثابت ودائم بكامل الهوية البصرية)       */}
      {/* ========================================================================= */}
      <div className="space-y-7 sm:space-y-10">
        {/* قسم Hero الترحيبي مع بطاقة الخريطة البيضاء المذهبة */}
        <section className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* النص الترحيبي العريض */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-black w-max shadow-2xs">
                <Compass className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
                <span>دليلك للأماكن والخدمات</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.25]">
                كل ما تحتاجه،
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600">
                  أقرب مما تتخيّل.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-xl">
                من قهوتك الصباحية إلى خدمة تحتاجها اليوم. اكتشف منطقتك، قارن اختياراتك، ووصل إلى المكان المناسب.
              </p>
            </div>

            {/* بطاقة الخريطة الفاخرة بنمط أبيض مذهب ناصع */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl sm:rounded-3xl bg-white border-2 border-amber-200/90 text-slate-900 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden group min-h-[170px] sm:min-h-[200px]">
                <div className="space-y-2 relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 shadow-2xs">
                    <MapPin className="w-5 h-5 stroke-[2.5]" />
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
                    كل شارع، <span className="text-amber-600">فيه اكتشاف جديد.</span>
                  </h2>

                  <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-xs">
                    استكشف مناطق حدائق الأهرام، واعرف البوابات والخدمات المحيطة.
                  </p>
                </div>

                <div className="pt-3 relative z-10">
                  <button
                    type="button"
                    onClick={() => onNavigate('/map')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95 group/btn"
                  >
                    <span>افتح الخريطة</span>
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover/btn:-translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* شريط البحث الموحد الأبيض بالكامل بنمط نظيف ودقيق */}
          <div className="w-full">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowAllManually(true);
              }}
              className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-2.5 transition-all"
            >
              {/* 1. حقل إدخال اسم النشاط والخدمة */}
              <div className="flex items-center gap-2.5 px-3 py-2 border-b md:border-b-0 md:border-l border-slate-100 flex-1 min-w-0 bg-white">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="مطعم، طبيب، خدمة… ماذا تحتاج؟"
                  className="w-full bg-white outline-none text-sm font-bold text-slate-900 placeholder:text-slate-400"
                />
                <Search className="w-5 h-5 text-amber-600 shrink-0" />
              </div>

              {/* 2. محدد المدينة والمنطقة */}
              <div className="flex items-center gap-2.5 px-3 py-2 border-b md:border-b-0 md:border-l border-slate-100 shrink-0 bg-white">
                <select
                  value={selectedCity !== 'all' ? selectedCity : selectedGov !== 'all' ? selectedGov : 'all'}
                  onChange={(e) => handleLocationSelect(e.target.value)}
                  className="bg-white text-sm font-bold text-slate-800 cursor-pointer min-h-10 py-1 outline-none w-full"
                  style={{ colorScheme: 'light' }}
                >
                  <option value="حدائق الأهرام" className="bg-white text-slate-900 font-bold">حدائق الأهرام (الافتراضي)</option>
                  <option value="all" className="bg-white text-slate-900 font-bold">كل المناطق والمحافظات</option>
                  <option value="الجيزة" className="bg-white text-slate-900 font-bold">محافظة الجيزة (الكل)</option>
                  <option value="مدينة 6 أكتوبر" className="bg-white text-slate-900 font-bold">مدينة 6 أكتوبر</option>
                  <option value="مدينة الشيخ زايد" className="bg-white text-slate-900 font-bold">مدينة الشيخ زايد</option>
                  <option value="الهرم" className="bg-white text-slate-900 font-bold">شارع الهرم</option>
                  <option value="فيصل" className="bg-white text-slate-900 font-bold">شارع فيصل</option>
                  <option value="الدقي" className="bg-white text-slate-900 font-bold">الدقي والمهندسين</option>
                  <option value="القاهرة" className="bg-white text-slate-900 font-bold">محافظة القاهرة</option>
                  <option value="الإسكندرية" className="bg-white text-slate-900 font-bold">محافظة الإسكندرية</option>
                </select>
                <MapPin className="w-5 h-5 text-slate-600 shrink-0" />
              </div>

              {/* 3. زر الموقع الجغرافي (بالقرب مني) */}
              <button
                type="button"
                onClick={onRequestLocation}
                disabled={isLocatingUser}
                className="w-full md:w-auto h-11 px-4 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap active:scale-98 shadow-2xs"
              >
                <LocateFixed
                  className={`w-4 h-4 ${
                    isLocatingUser
                      ? 'animate-spin text-amber-500'
                      : userCoords
                      ? 'text-emerald-600'
                      : 'text-slate-600'
                  }`}
                />
                <span>
                  {isLocatingUser ? 'جارٍ التحديد…' : userCoords ? 'موقعي محدد' : 'بالقرب مني'}
                </span>
              </button>

              {/* 4. زر البحث الذهبي الكامل */}
              <button
                type="submit"
                className="w-full md:w-auto h-11 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98 shrink-0"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>بحث</span>
              </button>
            </form>
          </div>
        </section>

        {/* 🏷️ قسم التصنيفات السريعة («ماذا تبحث عنه اليوم؟») — مع مؤشر الحالة النشطة */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between px-0.5">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                ماذا تبحث عنه اليوم؟
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                خدمات يومك، في مكان واحد
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAllManually(true);
                onCategoryChange('all');
                onSubcategoryChange('all');
              }}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>كل الأنشطة</span>
              <span>←</span>
            </button>
          </div>

          {/* شبكة التصنيفات: 3 أعمدة على الهاتف و6 على الديسكتوب مع إبراز الفئة المحددة */}
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3">
            {DISCOVERY_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = categoryFilter === cat.groupId &&
                (!cat.subcategoryId || subcategoryFilter === cat.subcategoryId);

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      onCategoryChange('all');
                      onSubcategoryChange('all');
                    } else {
                      onCategoryChange(cat.groupId);
                      onSubcategoryChange(cat.subcategoryId || 'all');
                    }
                  }}
                  className={`rounded-2xl py-4 px-2 flex flex-col items-center justify-center gap-2.5 text-center transition-all cursor-pointer active:scale-95 group ${
                    isSelected
                      ? 'bg-amber-50/95 border-2 border-amber-500 text-amber-950 font-black shadow-xs ring-2 ring-amber-400/30'
                      : 'bg-white border border-slate-200 hover:border-amber-400 text-slate-900 shadow-2xs hover:shadow-sm'
                  }`}
                >
                  <Icon
                    className={`w-7 h-7 shrink-0 transition-transform group-hover:scale-110 ${
                      isSelected ? 'text-amber-700' : 'text-[#c59b27]'
                    }`}
                    strokeWidth={isSelected ? 2.2 : 1.8}
                  />
                  <span className={`text-xs sm:text-sm leading-tight ${isSelected ? 'font-black text-amber-950' : 'font-bold text-slate-900'}`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          <CategoryHierarchyFilter
            businesses={categoryScopeBusinesses}
            mainCategoryId={categoryFilter}
            subcategoryId={subcategoryFilter}
            onMainCategoryChange={onCategoryChange}
            onSubcategoryChange={onSubcategoryChange}
          />
        </section>

        {/* ========================================================================= */}
        {/* 🔍 2. قسم المحتوى المتغير: النتائج أو الاختيارات المقترحة                   */}
        {/* ========================================================================= */}
        {isFilteringOrSearching ? (
          <div className="space-y-5 pt-2">
            {/* شريط الفلاتر السريعة والفرز */}
            <FilterBar
              categoryFilter={categoryFilter}
              onCategoryChange={onCategoryChange}
              sortBy={sortBy}
              onSortChange={onSortChange}
              openNowOnly={openNowOnly}
              onToggleOpenNow={onToggleOpenNow}
              hasVideoOnly={hasVideoOnly}
              onToggleHasVideo={onToggleHasVideo}
              onOpenFilterDrawer={() => setDrawerOpen(true)}
              activeFiltersCount={advancedFiltersCount}
              showViewToggle={true}
              onViewChange={(view) => {
                if (view === 'map') onNavigate('/map');
              }}
              onReshuffle={onReshuffle}
            />

            {/* رأس النتائج مع زر العودة الأنيق إلى وضع الاكتشاف */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3.5 rounded-2xl shadow-2xs">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-slate-900">
                  نتائج البحث والأنشطة:
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 font-mono shadow-2xs">
                  {filteredBusinesses.length} نشاطاً
                </span>
                {categoryFilter !== 'all' && (
                  <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {getCategoryLabel(categoryFilter)}
                  </span>
                )}
                {subcategoryFilter !== 'all' && (
                  <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {getCategoryLabel(subcategoryFilter)}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleReturnToDiscovery}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-black text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>العودة إلى صفحة الاكتشاف</span>
              </button>
            </div>

            {/* شرائح الفلاتر النشطة */}
            {hasActiveFilters && (
              <ActiveFilterChips
                categoryFilter={categoryFilter}
                categoryLabel={getCategoryGroupById(categoryFilter)?.label}
                subcategoryFilter={subcategoryFilter}
                subcategoryLabel={getSubcategoryById(subcategoryFilter)?.label}
                onClearCategory={() => {
                  onCategoryChange('all');
                  onSubcategoryChange('all');
                }}
                onClearSubcategory={() => onSubcategoryChange('all')}
                selectedGov={selectedGov}
                onClearGov={() => onGovChange('all')}
                selectedCity={selectedCity}
                onClearCity={() => onCityChange('all')}
                openNowOnly={openNowOnly}
                onClearOpenNow={onToggleOpenNow}
                hasVideoOnly={hasVideoOnly}
                onClearHasVideo={onToggleHasVideo}
                sortBy={sortBy}
                onClearSort={() => onSortChange('default')}
                onResetAll={handleReturnToDiscovery}
                hasActiveFilters={hasActiveFilters}
                hideResetButton={false}
              />
            )}

            {/* شبكة البطاقات الكاملة للنتائج */}
            <BusinessCardGrid
              businesses={filteredBusinesses}
              loading={loading}
              onOpenBusiness={onOpenBusiness}
              onToggleFavorite={onToggleFavorite}
              favorites={favorites}
              userCoords={userCoords}
              onResetFilters={handleReturnToDiscovery}
              onOpenVideoModal={onOpenVideoModal}
            />
          </div>
        ) : (
          <div className="space-y-7 sm:space-y-10">
            {/* ⭐ قسم الأنشطة المميزة والموثقة («وجهتك التالية تبدأ من هنا») */}
            <section className="space-y-3 pt-2">
              <div className="flex items-baseline justify-between px-0.5">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 mb-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>اختيارات من الدليل</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    وجهتك التالية تبدأ من هنا
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    تعرّف على المكان، واحفظ ما يعجبك
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllManually(true)}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>عرض الجميع ({allBusinesses.length})</span>
                  <span>←</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {featuredBusinesses.map((biz) => (
                  <BusinessCard
                    key={biz.id}
                    business={biz}
                    onOpenBusiness={onOpenBusiness}
                    onToggleFavorite={onToggleFavorite}
                    isFavorite={favorites.includes(biz.id)}
                    userCoords={userCoords}
                    onOpenVideoModal={onOpenVideoModal}
                  />
                ))}
              </div>
            </section>

            {/* 💼 بانر أصحاب الأعمال («مكانك موجود. خلّي الناس توصله.») */}
            <section className="bg-white border border-amber-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-5 shadow-2xs">
              <div className="space-y-1 text-center md:text-right">
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-700">
                  <Store className="w-4 h-4" />
                  <span>أصحاب المحلات والأنشطة</span>
                </div>
                <h2 className="text-base sm:text-xl font-black text-slate-900">
                  مكانك موجود. خلّي الناس توصله.
                </h2>
                <p className="text-xs text-slate-600 font-medium max-w-lg">
                  أضف نشاطك وعرّف عملاء منطقتك بخدماتك على مدار الساعة لتصل إلى عملائك المستهدفين.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('/for-business')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 group"
              >
                <span>أضف نشاطك الآن</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </button>
            </section>
          </div>
        )}
      </div>

      {/* نافذة الفلترة الجانبية المتقدمة */}
      <FilterDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        allBusinesses={allBusinesses}
        selectedGov={selectedGov}
        onGovChange={onGovChange}
        selectedCity={selectedCity}
        onCityChange={onCityChange}
        selectedZone={selectedZone}
        onZoneChange={onZoneChange}
        categoryFilter={categoryFilter}
        onCategoryChange={onCategoryChange}
        subcategoryFilter={subcategoryFilter}
        onSubcategoryChange={onSubcategoryChange}
        openNowOnly={openNowOnly}
        onToggleOpenNow={onToggleOpenNow}
        hasRatingOnly={hasRatingOnly}
        onToggleHasRating={onToggleHasRating}
        hasVideoOnly={hasVideoOnly}
        onToggleHasVideo={onToggleHasVideo}
        sortBy={sortBy}
        onSortChange={onSortChange}
        onResetAll={onResetAllFilters}
        resultsCount={filteredBusinesses.length}
      />
    </div>
  );
};
