import React from 'react';
import { Business } from '../../types';
import {
  EGYPT_GOVERNORATES,
  HADAYEK_ALAHRAM_ZONES,
  CATEGORY_GROUPS,
} from '../../data/mockData';
import {
  Search,
  Sparkles,
  Gift,
  CheckCircle2,
  MapPin,
  Star,
  ShieldCheck,
  Building2,
  Trash2,
  History,
  Heart,
  ArrowUpDown,
  Loader2,
  X,
  Award,
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
}

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
}) => {
  return (
    <section className="relative overflow-hidden pt-10 pb-8 border-b border-[var(--border-color)]">
      {/* Rich background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 via-[var(--bg-primary)] to-emerald-500/5 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-amber-500/8 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[350px] bg-emerald-500/6 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/4" />
      {/* Decorative dots grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #d4af37 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] font-black px-4 py-1.5 rounded-full animate-fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          <span>دليل الأنشطة التجارية الميدانية المعتمدة</span>
        </div>

        {/* Main Headline */}
        <div className="space-y-3 max-w-3xl mx-auto animate-fade-in-up">
          <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-primary)] leading-tight tracking-tight">
            اكتشف{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-600 to-yellow-400">
              أفضل المحلات
            </span>{' '}
            والأنشطة التجارية
          </h1>
          <p className="text-sm text-[var(--text-muted)] font-bold max-w-2xl mx-auto leading-relaxed">
            عناوين دقيقة · أرقام تواصل مباشرة · مقاطع فيديو ترويجية · مواقع معتمدة على الخريطة
          </p>
        </div>

        {/* Free Listing Reassurance Card */}
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-amber-500/10 border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-right animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
              <Gift className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-emerald-700 dark:text-emerald-300 font-black text-sm sm:text-base">
                  ظهور منشأتكم في الدليل مجاني تماماً 100% وبدون أي رسوم!
                </span>
                <span className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                  بدون أي اشتراكات
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-bold leading-relaxed">
                فقط اطلب الظهور وسيتم إدراج منشأتكم مجاناً. والباقات المتوفرة هي حملات دعائية حسب الطلب لتنمية مبيعاتكم.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <a
              href="#free-listing"
              className="flex-1 sm:flex-initial bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-4 py-3 rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-emerald-500/30 hover:shadow-lg"
            >
              <span>اطلب الظهور مجاناً</span>
            </a>
            <button
              type="button"
              onClick={() => onOpenPackagesModal('pkg_basic')}
              className="bg-[var(--bg-card)] hover:bg-[var(--input-bg)] border border-[var(--border-color)] hover:border-amber-500/40 text-amber-500 font-black text-xs px-3.5 py-3 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>دليل الباقات المعتمدة</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 animate-fade-in">
          {[
            {
              icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
              value: publicBusinesses.length + '+',
              label: 'مكان معتمد',
            },
            { icon: <MapPin className="w-4 h-4 text-amber-500" />, value: '12+', label: 'منطقة مغطاة' },
            { icon: <Star className="w-4 h-4 text-amber-400 fill-amber-400" />, value: '4.9', label: 'تقييم المستخدمين' },
            { icon: <ShieldCheck className="w-4 h-4 text-blue-500" />, value: '100%', label: 'بيانات موثقة' },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-2 rounded-2xl shadow-sm"
            >
              {stat.icon}
              <span className="font-mono font-black text-sm text-[var(--text-primary)]">{stat.value}</span>
              <span className="text-xs text-[var(--text-muted)] font-bold">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* 🔍 SMART SEARCH & FILTER BAR */}
        <div className="max-w-6xl mx-auto bg-[var(--bg-card)] border-2 border-amber-500/25 rounded-3xl p-3 sm:p-4 shadow-2xl shadow-amber-500/5 backdrop-blur-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 sm:gap-3">
            {/* Search Input */}
            <div
              className={`relative sm:col-span-2 ${
                cityFilter === 'حدائق الأهرام' ? 'lg:col-span-3' : 'lg:col-span-4'
              }`}
            >
              <Search className="w-4 h-4 text-amber-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث باسم المحل، المنشأة، أو الخدمة..."
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
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl pr-9 pl-3 py-3 text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />

              {/* Autocomplete Dropdown */}
              {isSearchFocused && (
                <div className="absolute top-full right-0 left-0 mt-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 overflow-hidden text-xs animate-fade-in-up">
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

            {/* Governorate selector */}
            <div className={`${cityFilter === 'حدائق الأهرام' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              <select
                value={govFilter}
                onChange={(e) => {
                  setGovFilter(e.target.value);
                  setCityFilter('all');
                  setHadayekZoneFilter('all');
                }}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl px-3 py-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
              >
                <option value="all">كل المحافظات</option>
                {EGYPT_GOVERNORATES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Area / District / City Selector */}
            <div className={`${cityFilter === 'حدائق الأهرام' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              <select
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setHadayekZoneFilter('all');
                }}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl px-3 py-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
              >
                <option value="all">
                  {govFilter === 'all'
                    ? 'كل المناطق والمدن'
                    : `كل مناطق ${govFilter} (${availableCities.length})`}
                </option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Hadayek Sub-Zone Selector */}
            {cityFilter === 'حدائق الأهرام' && (
              <div className="lg:col-span-3 animate-fade-in">
                <select
                  value={hadayekZoneFilter}
                  onChange={(e) => setHadayekZoneFilter(e.target.value)}
                  className="w-full bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl px-3 py-3 text-xs font-black text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer shadow-xs"
                >
                  <option value="all">كل قطاعات حدائق الأهرام ({HADAYEK_ALAHRAM_ZONES.length})</option>
                  {HADAYEK_ALAHRAM_ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category dropdown */}
            <div className="lg:col-span-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl px-3 py-3 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
              >
                <option value="all">كل التصنيفات</option>
                {CATEGORY_GROUPS.map((grp) => (
                  <option key={grp.group} value={grp.group}>
                    {grp.icon} {grp.group}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Stats & Sorting Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-[var(--border-color)] text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11.5px] text-[var(--text-muted)] font-bold">
                عرض <strong className="text-amber-500 font-mono text-sm">{filteredBusinesses.length}</strong> من إجمالي{' '}
                <strong className="text-[var(--text-primary)] font-mono text-sm">{publicBusinesses.length}</strong> مكان معتمد
              </span>

              {/* Favorites Toggle */}
              <button
                type="button"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                  showFavoritesOnly
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-rose-500 border border-[var(--border-color)]'
                }`}
                title="عرض المحلات المفضلة فقط"
              >
                <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-current' : 'text-rose-500'}`} />
                <span>المفضلة</span>
                {favorites.length > 0 && (
                  <span className="bg-rose-500/20 text-rose-300 text-[10px] px-1.5 rounded-full font-mono">
                    {favorites.length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-2.5 py-1.5 text-xs shadow-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
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
                  className="bg-transparent text-[var(--text-primary)] font-black text-xs focus:outline-none cursor-pointer"
                >
                  <option value="default">الترتيب الافتراضي</option>
                  <option value="nearest">الأقرب لموقعي (GPS)</option>
                  <option value="newest">الأحدث إضافة</option>
                  <option value="has_video">يحتوي على فيديو</option>
                  <option value="open_now">مفتوح الآن</option>
                  <option value="alpha">أبجدياً (أ - ي)</option>
                </select>
                {isLocatingUser && <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-600 font-black text-xs cursor-pointer transition-colors bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-500/20"
                >
                  <X className="w-3 h-3" /> إعادة الضبط
                </button>
              )}

              <a
                href="#free-listing"
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-black text-xs flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/15 px-2.5 py-1.5 rounded-xl border border-emerald-500/20 transition-colors"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>أضف مكانك مجاناً</span>
              </a>
              <a
                href="#packages"
                className="text-amber-600 dark:text-amber-400 hover:underline font-black text-xs flex items-center gap-1"
              >
                <Award className="w-3.5 h-3.5" />
                <span>الحملات الدعائية</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
