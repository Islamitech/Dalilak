import React, { useState } from 'react';
import { Business } from '../../types';
import {
  EGYPT_GOVERNORATES,
  HADAYEK_ALAHRAM_ZONES,
  CATEGORY_GROUPS,
} from '../../data/mockData';
import {
  Search,
  Sparkles,
  MapPin,
  Building2,
  Trash2,
  History,
  Heart,
  Loader2,
  X,
  Compass,
  Clock,
  SlidersHorizontal,
  UtensilsCrossed,
  ShieldCheck,
  Wrench,
  Scissors,
  GraduationCap,
  ShoppingBag,
  Layers,
  Map as MapIcon,
} from 'lucide-react';

export interface ShowcaseHeroSearchProps {
  publicBusinesses: Business[];
  filteredBusinesses: Business[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (f: boolean) => void;
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  handleClearRecentSearches: () => void;
  searchSuggestions: {
    businesses: Business[];
    categories: Array<{ group: string; icon?: string; items: string[] }>;
    zones: string[];
  };
  handleOpenBusiness: (biz: Business) => void;
  govFilter: string;
  setGovFilter: (g: string) => void;
  cityFilter: string;
  setCityFilter: (c: string) => void;
  hadayekZoneFilter: string;
  setHadayekZoneFilter: (z: string) => void;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  availableCities: string[];
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (val: boolean) => void;
  favorites: string[];
  sortBy: 'default' | 'nearest' | 'newest' | 'has_video' | 'open_now' | 'alpha';
  setSortBy: (sort: 'default' | 'nearest' | 'newest' | 'has_video' | 'open_now' | 'alpha') => void;
  handleRequestLocation: () => void;
  userCoords: { lat: number; lng: number } | null;
  isLocatingUser: boolean;
  hasActiveFilters: boolean;
  resetAllFilters: () => void;
  onOpenPackagesModal: (pkgId?: string) => void;
  activeView?: 'grid' | 'map';
  setActiveView?: (view: 'grid' | 'map') => void;
}

const POPULAR_CATEGORIES = [
  { label: 'الكل', value: 'all', icon: Sparkles },
  { label: 'مطاعم ومأكولات', value: 'مطاعم ومأكولات', icon: UtensilsCrossed },
  { label: 'طبي وصيدلي', value: 'طبي وصيدلي', icon: ShieldCheck },
  { label: 'سيارات وصيانة', value: 'سيارات وصيانة', icon: Wrench },
  { label: 'تجميل وعناية', value: 'تجميل وعناية', icon: Scissors },
  { label: 'خدمات منزلية', value: 'خدمات منزلية', icon: ShoppingBag },
  { label: 'تعليم وتدريب', value: 'تعليم وتدريب', icon: GraduationCap },
];

export const ShowcaseHeroSearch: React.FC<ShowcaseHeroSearchProps> = ({
  publicBusinesses,
  filteredBusinesses,
  searchQuery,
  setSearchQuery,
  isSearchFocused,
  setIsSearchFocused,
  recentSearches,
  addRecentSearch,
  handleClearRecentSearches,
  searchSuggestions,
  handleOpenBusiness,
  govFilter,
  setGovFilter,
  cityFilter,
  setCityFilter,
  hadayekZoneFilter,
  setHadayekZoneFilter,
  categoryFilter,
  setCategoryFilter,
  availableCities,
  showFavoritesOnly,
  setShowFavoritesOnly,
  favorites,
  sortBy,
  setSortBy,
  handleRequestLocation,
  userCoords,
  isLocatingUser,
  hasActiveFilters,
  resetAllFilters,
  onOpenPackagesModal,
  activeView = 'grid',
  setActiveView,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const activeFiltersCount = [
    govFilter !== 'all',
    cityFilter !== 'all',
    hadayekZoneFilter !== 'all',
    categoryFilter !== 'all',
    sortBy !== 'default',
    showFavoritesOnly,
  ].filter(Boolean).length;
  return (
    <section className="relative overflow-hidden pt-5 pb-5 sm:pt-7 sm:pb-6 border-b border-[var(--border-color)]">
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-[var(--bg-primary)] to-[var(--bg-primary)] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-64 bg-amber-500/8 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-0 left-1/4 w-96 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Compact Hero Header (2 tight lines) */}
        <div className="text-center space-y-1.5 max-w-2xl mx-auto animate-fade-in-up">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-[11px] font-black px-3 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>الدليل الميداني المعتمد في مصر • {publicBusinesses.length}+ مكان موثق</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--text-primary)] leading-tight tracking-tight">
            ابحث عن أي نشاط، وتواصل في ثوانٍ
          </h1>
          <p className="text-xs text-[var(--text-muted)] font-medium">
            عناوين دقيقة • أرقام تواصل مباشرة • مواقع معتمدة على الخريطة
          </p>
        </div>

        {/* 🔍 Seeker-First Smart Search Bar */}
        <div className="max-w-4xl mx-auto bg-[var(--bg-card)] border-2 border-amber-500/30 rounded-2xl p-2 sm:p-2.5 shadow-xl shadow-amber-500/5 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-amber-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="ماذا تبحث عنه؟ (مطعم، طبيب، صيدلية، محل، خدمة...)"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    addRecentSearch(searchQuery.trim());
                    setIsSearchFocused(false);
                  }
                }}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl pr-9 pl-3 py-2.5 text-xs sm:text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />

              {/* Autocomplete Dropdown */}
              {isSearchFocused && (
                <div className="absolute top-full right-0 left-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 overflow-hidden text-xs animate-fade-in-up">
                  <div className="p-3 space-y-3 max-h-72 overflow-y-auto text-right">
                    {/* Recent Searches */}
                    {!searchQuery && recentSearches.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10.5px] font-black text-[var(--text-muted)]">
                            عمليات البحث الأخيرة
                          </span>
                          <button
                            type="button"
                            onClick={handleClearRecentSearches}
                            className="text-[10px] text-rose-500 hover:text-rose-400 font-black cursor-pointer flex items-center gap-0.5"
                          >
                            <Trash2 className="w-2.5 h-2.5" /> مسح
                          </button>
                        </div>
                        {recentSearches.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setSearchQuery(s);
                              setIsSearchFocused(false);
                            }}
                            className="w-full text-right flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[var(--input-bg)] text-[var(--text-secondary)] font-bold transition-colors cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Matching Businesses */}
                    {searchQuery && searchSuggestions.businesses.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10.5px] font-black text-[var(--text-muted)] block">
                          أنشطة مطابقة:
                        </span>
                        {searchSuggestions.businesses.map((biz) => (
                          <button
                            key={biz.id}
                            type="button"
                            onClick={() => {
                              addRecentSearch(biz.nameAr);
                              handleOpenBusiness(biz);
                              setIsSearchFocused(false);
                            }}
                            className="w-full text-right flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-amber-500/10 transition-colors cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-base shrink-0">
                              <Building2 className="w-4 h-4 text-amber-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-black text-[var(--text-primary)] block truncate">
                                {biz.nameAr}
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)] font-bold">
                                {biz.category} · {biz.city || biz.governorate}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Matching Categories */}
                    {searchQuery && searchSuggestions.categories.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-[var(--border-color)]">
                        <span className="text-[10.5px] font-black text-[var(--text-muted)] block">
                          تصنيفات مطابقة:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {searchSuggestions.categories.map((grp) => (
                            <button
                              key={grp.group}
                              type="button"
                              onClick={() => {
                                setCategoryFilter(grp.group);
                                addRecentSearch(grp.group);
                                setIsSearchFocused(false);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[var(--input-bg)] text-[var(--text-secondary)] text-[11px] font-bold border border-[var(--border-color)] cursor-pointer hover:border-amber-500 transition-colors"
                            >
                              {grp.group}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Zones */}
                    {searchQuery && searchSuggestions.zones.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-[var(--border-color)]">
                        <span className="text-[10.5px] font-black text-[var(--text-muted)] block">
                          المناطق والأحياء المطابقة:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {searchSuggestions.zones.map((z) => (
                            <button
                              key={z}
                              type="button"
                              onClick={() => {
                                setCityFilter('حدائق الأهرام');
                                setHadayekZoneFilter(z);
                                addRecentSearch(z);
                                setIsSearchFocused(false);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[var(--input-bg)] text-[var(--text-secondary)] text-[11px] font-bold border border-[var(--border-color)] cursor-pointer hover:border-amber-500 transition-colors"
                            >
                              {z}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No results hint */}
                    {searchQuery &&
                      searchSuggestions.businesses.length === 0 &&
                      searchSuggestions.categories.length === 0 && (
                        <p className="text-center text-[var(--text-muted)] font-bold py-2">
                          لا توجد اقتراحات مطابقة
                        </p>
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Area / Governorate Selector */}
            <div className="sm:w-44 shrink-0">
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-amber-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={govFilter}
                  onChange={(e) => {
                    setGovFilter(e.target.value);
                    setCityFilter('all');
                    setHadayekZoneFilter('all');
                  }}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl pr-8 pl-3 py-2.5 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500 cursor-pointer transition-colors truncate"
                  title="تحديد المحافظة أو المنطقة"
                >
                  <option value="all">كل المحافظات</option>
                  {EGYPT_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* GPS Nearby Quick Button */}
            <button
              type="button"
              onClick={() => {
                if (sortBy === 'nearest') {
                  setSortBy('default');
                } else if (userCoords) {
                  setSortBy('nearest');
                } else {
                  handleRequestLocation();
                }
              }}
              disabled={isLocatingUser}
              className={`px-3 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                sortBy === 'nearest'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
              title="البحث عن الأماكن الأقرب لموقعي الفعلي"
            >
              {isLocatingUser ? (
                <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              ) : (
                <Compass className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">قريب مني</span>
            </button>

            {/* Advanced Filters Button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                showAdvancedFilters || activeFiltersCount > 0
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
              title="فتح خيارات الفلاتر المتقدمة"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">كل الفلاتر</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-slate-950 text-amber-400 text-[10px] flex items-center justify-center font-mono">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* ⚙️ Collapsible Advanced Filters Drawer */}
          {showAdvancedFilters && (
            <div className="mt-2.5 pt-2.5 border-t border-[var(--border-color)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs animate-fade-in">
              {/* City / District Filter */}
              <div>
                <label className="block text-[10.5px] font-black text-[var(--text-muted)] mb-1">المنطقة / المدينة:</label>
                <select
                  value={cityFilter}
                  onChange={(e) => {
                    setCityFilter(e.target.value);
                    setHadayekZoneFilter('all');
                  }}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-2.5 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">
                    {govFilter === 'all' ? 'كل المدن والمناطق' : `كل مناطق ${govFilter} (${availableCities.length})`}
                  </option>
                  {availableCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hadayek Zone Filter (if applicable) */}
              {cityFilter === 'حدائق الأهرام' && (
                <div>
                  <label className="block text-[10.5px] font-black text-amber-600 dark:text-amber-400 mb-1">قطاع حدائق الأهرام:</label>
                  <select
                    value={hadayekZoneFilter}
                    onChange={(e) => setHadayekZoneFilter(e.target.value)}
                    className="w-full bg-amber-500/10 border-2 border-amber-500/40 rounded-xl px-2.5 py-2 text-xs font-black text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="all">كل القطاعات ({HADAYEK_ALAHRAM_ZONES.length})</option>
                    {HADAYEK_ALAHRAM_ZONES.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Full Category Group Filter */}
              <div>
                <label className="block text-[10.5px] font-black text-[var(--text-muted)] mb-1">التصنيف الكامل:</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-2.5 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">كل التصنيفات</option>
                  {CATEGORY_GROUPS.map((grp) => (
                    <option key={grp.group} value={grp.group}>
                      {grp.icon} {grp.group}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-[10.5px] font-black text-[var(--text-muted)] mb-1">ترتيب النتائج حسب:</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    if (val === 'nearest' && !userCoords) {
                      handleRequestLocation();
                    } else {
                      setSortBy(val);
                    }
                  }}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-2.5 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="default">الترتيب الافتراضي</option>
                  <option value="nearest">الأقرب لموقعي (GPS)</option>
                  <option value="newest">الأحدث إضافة</option>
                  <option value="has_video">يحتوي على فيديو</option>
                  <option value="open_now">مفتوح الآن</option>
                  <option value="alpha">أبجدياً (أ - ي)</option>
                </select>
              </div>

              {/* Filter Actions */}
              <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-600 font-black text-xs cursor-pointer bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20"
                  >
                    <X className="w-3 h-3" /> مسح كل الفلاتر
                  </button>
                ) : (
                  <span className="text-[11px] text-[var(--text-muted)] font-bold">كل الفلاتر تعمل بالتوافق المباشر</span>
                )}

                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(false)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-1 rounded-lg cursor-pointer transition-colors"
                >
                  تطبيق الفلاتر
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 🏷️ Quick Category Chips (Most In-Demand) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-4xl mx-auto scrollbar-none text-xs font-black select-none">
          {POPULAR_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected =
              (cat.value === 'all' && (!categoryFilter || categoryFilter === 'all')) ||
              categoryFilter === cat.value ||
              (cat.value === 'طبي وصيدلي' && (categoryFilter?.includes('طبي') || categoryFilter?.includes('صيدل')));

            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  setCategoryFilter(cat.value);
                }}
                className={`px-3.5 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 text-xs font-black ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)] border border-[var(--border-color)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* 📊 Seeker Results Summary & Fast Status Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 max-w-4xl mx-auto pt-1 text-xs">
          {/* Results Counter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] font-bold">
              عرض <strong className="text-amber-500 font-mono text-sm">{filteredBusinesses.length}</strong> من{' '}
              <strong className="text-[var(--text-primary)] font-mono text-sm">{publicBusinesses.length}</strong> مكان
            </span>

            {/* Quick Favorites Pill */}
            <button
              type="button"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                showFavoritesOnly
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-rose-500 border border-[var(--border-color)]'
              }`}
              title="عرض المحلات المفضلة فقط"
            >
              <Heart className={`w-3 h-3 ${showFavoritesOnly ? 'fill-current' : 'text-rose-500'}`} />
              <span>المفضلة</span>
              {favorites.length > 0 && (
                <span className="bg-rose-500/20 text-rose-400 text-[10px] px-1 rounded-full font-mono">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Quick Open Now Pill */}
            <button
              type="button"
              onClick={() => {
                setSortBy(sortBy === 'open_now' ? 'default' : 'open_now');
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                sortBy === 'open_now'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-emerald-500 border border-[var(--border-color)]'
              }`}
              title="عرض الأماكن المفتوحة حالياً فقط"
            >
              <Clock className="w-3 h-3 text-emerald-500" />
              <span>مفتوح الآن</span>
            </button>
          </div>

          {/* View Switcher Toggle & Reset Filter */}
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-600 font-black text-xs cursor-pointer bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 transition-colors"
              >
                <X className="w-3 h-3" /> إعادة الضبط
              </button>
            )}

            {setActiveView && (
              <div className="flex items-center bg-[var(--bg-card)] p-0.5 rounded-xl border border-[var(--border-color)] shadow-xs">
                <button
                  type="button"
                  onClick={() => setActiveView('grid')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                    activeView === 'grid'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  title="عرض الشبكة"
                >
                  <Layers className="w-3 h-3" />
                  <span>بطاقات</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('map')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                    activeView === 'map'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  title="عرض الخريطة التفاعلية"
                >
                  <MapIcon className="w-3 h-3" />
                  <span>خريطة</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
