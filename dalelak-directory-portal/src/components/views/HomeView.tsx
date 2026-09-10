import React from 'react';
import { Business } from '../../types';
import { SmartSearchBar } from '../search/SmartSearchBar';
import { BusinessCard } from '../cards/BusinessCard';
import {
  Sparkles,
  UtensilsCrossed,
  ShieldCheck,
  Wrench,
  Scissors,
  ShoppingBag,
  GraduationCap,
  Shirt,
  Compass,
  ArrowLeft,
  Store,
  MapPin,
  Star,
} from 'lucide-react';

export interface HomeViewProps {
  businesses: Business[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedGov: string;
  onGovChange: (g: string) => void;
  selectedCity: string;
  onCityChange: (c: string) => void;
  userCoords: { lat: number; lng: number } | null;
  isLocatingUser: boolean;
  onRequestLocation: () => void;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  onNavigate: (path: string) => void;
  onOpenVideoModal?: (biz: Business) => void;
}

const POPULAR_CATEGORIES = [
  { id: 'مطاعم ومأكولات', label: 'مطاعم وكافيهات', icon: UtensilsCrossed, color: 'text-amber-600 bg-amber-500/10 hover:bg-amber-500/20' },
  { id: 'طبي وصيدلي', label: 'عيادات وصيدليات', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20' },
  { id: 'سيارات وصيانة', label: 'سيارات وصيانة', icon: Wrench, color: 'text-blue-600 bg-blue-500/10 hover:bg-blue-500/20' },
  { id: 'تجميل وعناية', label: 'تجميل ولياقة', icon: Scissors, color: 'text-rose-600 bg-rose-500/10 hover:bg-rose-500/20' },
  { id: 'ملابس وأزياء', label: 'ملابس وأزياء', icon: Shirt, color: 'text-purple-600 bg-purple-500/10 hover:bg-purple-500/20' },
  { id: 'خدمات منزلية', label: 'حرف وصيانة', icon: ShoppingBag, color: 'text-teal-600 bg-teal-500/10 hover:bg-teal-500/20' },
  { id: 'تعليم وتدريب', label: 'تعليم وحضانات', icon: GraduationCap, color: 'text-indigo-600 bg-indigo-500/10 hover:bg-indigo-500/20' },
];

export const HomeView: React.FC<HomeViewProps> = ({
  businesses,
  loading,
  searchQuery,
  onSearchChange,
  selectedGov,
  onGovChange,
  selectedCity,
  onCityChange,
  userCoords,
  isLocatingUser,
  onRequestLocation,
  onOpenBusiness,
  onToggleFavorite,
  favorites,
  onNavigate,
  onOpenVideoModal,
}) => {
  // Curated Featured businesses (verified with photo and ratings)
  const featuredBusinesses = React.useMemo(() => {
    return businesses
      .filter((b) => b.verificationStatus === 'verified' && (b.photos?.length || b.coverPhoto))
      .slice(0, 6);
  }, [businesses]);

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Concise Search-First Hero */}
      <section className="relative pt-8 pb-10 sm:pt-12 sm:pb-14 overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-amber-500/5 via-[var(--bg-primary)] to-[var(--bg-primary)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-800 text-xs font-black px-3.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>الدليل الميداني المعتمد في مصر • {businesses.length}+ مكان موثق</span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] leading-tight tracking-tight">
              ابحث عن أي نشاط أو خدمة، وتواصل في ثوانٍ
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] font-medium max-w-xl mx-auto leading-relaxed">
              عناوين دقيقة • أرقام تواصل مباشرة • مواقع معتمدة على خرائط Google
            </p>
          </div>

          {/* Smart Search Bar */}
          <div className="pt-2">
            <SmartSearchBar
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              selectedGov={selectedGov}
              onGovChange={onGovChange}
              selectedCity={selectedCity}
              onCityChange={onCityChange}
              userCoords={userCoords}
              isLocatingUser={isLocatingUser}
              onRequestLocation={onRequestLocation}
              businesses={businesses}
              onSelectBusiness={onOpenBusiness}
              onSearchSubmit={() => onNavigate('/search')}
            />
          </div>

          {/* Quick Categories Bar */}
          <div className="pt-3">
            <span className="text-[11px] font-bold text-slate-400 block mb-2">أو تصفح حسب الفئة السريعة:</span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {POPULAR_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      onNavigate(`/search?cat=${encodeURIComponent(cat.id)}`);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border border-transparent hover:border-slate-300 ${cat.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured / Curated Verified Places */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              <span>أماكن موثقة وموصى بها</span>
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              أنشطة معتمدة ميدانياً ومكتملة البيانات والتواصل المباشر
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/search')}
            className="text-xs font-black text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
          >
            <span>عرض كل الأنشطة</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* 3. Live Map Quick Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="space-y-2 text-center md:text-right max-w-xl">
            <span className="text-amber-300 text-xs font-black bg-white/10 px-3 py-1 rounded-full inline-block">
              الخريطة الحية والملاحة
            </span>
            <h3 className="text-xl sm:text-2xl font-black">
              استكشف الأماكن جغرافياً على خريطة تفاعلية كاملة
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              شاهد المحلات والخدمات حولك بدقة، مع إمكانية تحريك الخريطة والبحث التلقائي في أي منطقة أو شارع.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/map')}
            className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Compass className="w-4 h-4" />
            <span>فتح الخريطة التفاعلية</span>
          </button>
        </div>
      </section>

      {/* 4. Subtle Business Owner CTA (Restrained & Separate) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div className="space-y-1">
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
              أصحاب الأعمال والأنشطة
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              هل تملك محلاً أو نشاطاً تجارياً؟ أضفه في دليل دليلك مجاناً
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              إدراج وظهور كامل بدون أي اشتراكات أو رسوم شهرية إذا كان لديك موقع موثق على Google Maps.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/for-business')}
            className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Store className="w-4 h-4 text-amber-400" />
            <span>ابدأ تسجيل نشاطك (0 ج)</span>
          </button>
        </div>
      </section>
    </div>
  );
};
