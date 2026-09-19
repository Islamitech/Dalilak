import React, { useState } from 'react';
import { Business } from '../../types';
import { SmartSearchBar } from '../search/SmartSearchBar';
import { BusinessCard } from '../cards/BusinessCard';
import { shuffleBusinessesWithSeed } from '../../utils/directoryEnhancements';
import {
  HadayekAtlasNavigator,
  ProximityRadarDrawer,
  HadayekLifelineBar,
  HadayekGatesModal,
} from '../atlas';
import { HadayekZone, HADAYEK_ZONES } from '../../data/hadayekAtlasData';
import {
  Sparkles,
  Compass,
  ArrowLeft,
  Store,
  MapPin,
  Star,
  Search,
  Navigation,
  ExternalLink,
  ShieldCheck,
  Building2,
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
  shuffleSeed?: number;
  initialAtlasTarget?: {
    zone: HadayekZone;
    buildingNumber: string;
    coords: { lat: number; lng: number };
  } | null;
  onSelectAtlasTarget?: (target: {
    zone: HadayekZone;
    buildingNumber: string;
    coords: { lat: number; lng: number };
  }) => void;
}

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
  shuffleSeed = 1,
  initialAtlasTarget = null,
  onSelectAtlasTarget,
}) => {
  // 1. View Mode: 'atlas' (Default & Focus) or 'search' (Traditional keyword search)
  const [heroMode, setHeroMode] = useState<'atlas' | 'search'>('atlas');

  // 2. Atlas State: Target Building / Zone
  const [localAtlasTarget, setLocalAtlasTarget] = useState<{
    zone: HadayekZone;
    buildingNumber: string;
    coords: { lat: number; lng: number };
  } | null>(() => {
    if (initialAtlasTarget) return initialAtlasTarget;
    // Default initial target: Zone L (heart of Hadayek)
    const defaultZone = HADAYEK_ZONES.find((z) => z.letterAr === 'ل') || HADAYEK_ZONES[0];
    return {
      zone: defaultZone,
      buildingNumber: '',
      coords: { lat: defaultZone.centerLat, lng: defaultZone.centerLng },
    };
  });

  const activeTarget = localAtlasTarget;

  // 3. Gates Guide Modal State
  const [isGatesModalOpen, setIsGatesModalOpen] = useState<boolean>(false);

  // Curated Featured businesses (verified, shuffled dynamically on each page load)
  const featuredBusinesses = React.useMemo(() => {
    const verified = businesses.filter((b) => b.verificationStatus === 'verified');
    const withMedia = verified.filter((b) => (b.photos && b.photos.length > 0) || b.coverPhoto);
    const candidates = withMedia.length >= 6 ? withMedia : verified;
    const shuffled = shuffleBusinessesWithSeed(candidates, shuffleSeed);
    return shuffled.slice(0, 6);
  }, [businesses, shuffleSeed]);

  const handleTargetSelection = (target: {
    zone: HadayekZone;
    buildingNumber: string;
    coords: { lat: number; lng: number };
  }) => {
    setLocalAtlasTarget(target);
    if (onSelectAtlasTarget) {
      onSelectAtlasTarget(target);
    }
  };

  const handleLifelineCategorySelect = (categoryQuery: string) => {
    onNavigate(`/search?cat=${encodeURIComponent(categoryQuery)}`);
  };

  return (
    <div className="space-y-10 sm:space-y-14 pb-16" dir="rtl">
      {/* 1. Hadayek Atlas Sovereign Hero Section */}
      <section className="relative pt-6 pb-8 sm:pt-10 sm:pb-12 overflow-hidden border-b border-[var(--border-color)] bg-gradient-to-b from-amber-500/10 via-slate-50/50 dark:via-slate-900/40 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {/* Hero Heading & Value Proposition */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-black shadow-xs">
              <Compass className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>أطلس حدائق الأهرام التفاعلي الذكي</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
              دليلك الذكي لكل عمارة ونشاط وخدمة في حدائق الأهرام
            </h1>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-2xl mx-auto">
              حدد أي رقم عمارة من منطقة (أ) إلى (ن) واعرف أقرب بوابة والأنشطة المحيطة والاتجاهات المباشرة فوراً.
            </p>

            {/* Mode Switcher Pills: Atlas vs Traditional Search */}
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setHeroMode('atlas')}
                className={`text-xs font-black px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  heroMode === 'atlas'
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>أطلس العمارات والملاحة</span>
              </button>

              <button
                type="button"
                onClick={() => setHeroMode('search')}
                className={`text-xs font-black px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  heroMode === 'search'
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>البحث المباشر (اسم / نشاط)</span>
              </button>
            </div>
          </div>

          {/* Hero Primary Tool */}
          <div className="max-w-4xl mx-auto">
            {heroMode === 'atlas' ? (
              <HadayekAtlasNavigator
                onSelectTarget={handleTargetSelection}
                onOpenGatesGuide={() => setIsGatesModalOpen(true)}
              />
            ) : (
              <div className="bg-[var(--bg-card)]/90 backdrop-blur-xl border border-[var(--border-color)] rounded-3xl p-4 sm:p-6 shadow-xl">
                <SmartSearchBar
                  businesses={businesses}
                  searchQuery={searchQuery}
                  onSearchChange={onSearchChange}
                  selectedGov={selectedGov}
                  onGovChange={onGovChange}
                  selectedCity={selectedCity}
                  onCityChange={onCityChange}
                  userCoords={userCoords}
                  isLocatingUser={isLocatingUser}
                  onRequestLocation={onRequestLocation}
                  onSearchSubmit={() => onNavigate('/search')}
                />
              </div>
            )}
          </div>

          {/* Hadayek Daily & Emergency Lifelines Bar */}
          <div className="max-w-4xl mx-auto">
            <HadayekLifelineBar
              onSelectCategory={handleLifelineCategorySelect}
              onOpenGatesGuide={() => setIsGatesModalOpen(true)}
            />
          </div>

          {/* Proximity Radar Drawer: Automatically shown when target is chosen */}
          {activeTarget && (
            <div className="max-w-4xl mx-auto space-y-3">
              <ProximityRadarDrawer
                target={activeTarget}
                businesses={businesses}
                onOpenBusiness={onOpenBusiness}
              />

              {/* Action: Open on Full Interactive Map */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const zoneParam = encodeURIComponent(activeTarget.zone.letterAr);
                    const bldgParam = encodeURIComponent(activeTarget.buildingNumber || '');
                    onNavigate(`/map?zone=${zoneParam}&bldg=${bldgParam}`);
                  }}
                  className="bg-slate-950 hover:bg-slate-800 text-white dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 font-black text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Navigation className="w-4 h-4" />
                  <span>
                    فتح {activeTarget.buildingNumber ? `عمارة ${activeTarget.buildingNumber} ` : ''}({activeTarget.zone.nameAr}) على الخريطة التفاعلية الكاملة الآن
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. Featured Verified Businesses Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)]">
                أنشطة مميزة وموثقة بالحدائق
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              أماكن تم التحقق من بياناتها ومواقعها بواسطة فريق دليلك الميداني
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/search')}
            className="text-xs font-black text-amber-700 dark:text-amber-400 hover:text-amber-800 flex items-center gap-1.5 transition-colors cursor-pointer group"
          >
            <span>عرض كل الأنشطة ({businesses.length})</span>
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading && featuredBusinesses.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between animate-pulse"
              >
                <div className="aspect-[4/3] w-full bg-slate-800/60" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-800/60 rounded w-3/4" />
                  <div className="h-3 bg-slate-800/40 rounded w-1/2" />
                  <div className="h-8 bg-slate-800/60 rounded w-full mt-4" />
                </div>
              </div>
            ))
          ) : featuredBusinesses.length === 0 ? (
            <div className="col-span-full py-12 text-center text-[var(--text-secondary)]">
              <Store className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="font-bold text-sm">لم يتم العثور على أنشطة مطابقة حالياً.</p>
            </div>
          ) : (
            featuredBusinesses.map((biz) => (
              <BusinessCard
                key={biz.id}
                business={biz}
                onOpenBusiness={onOpenBusiness}
                onToggleFavorite={onToggleFavorite}
                isFavorite={favorites.includes(biz.id)}
                userCoords={userCoords}
                onOpenVideoModal={onOpenVideoModal}
              />
            ))
          )}
        </div>
      </section>

      {/* 3. Live Map Quick Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="space-y-2 text-center md:text-right max-w-xl">
            <span className="text-amber-200 text-xs font-black bg-white/15 px-3 py-1 rounded-full inline-block">
              خريطة حدائق الأهرام المباشرة
            </span>
            <h3 className="text-xl sm:text-2xl font-black">
              استكشف حدائق الأهرام بالخريطة التفاعلية الحية
            </h3>
            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium">
              تجوّل بين المناطق، حدد البوابات، وشاهد أماكن الصيدليات والسوبرماركت والخدمات بنقرة زر واحدة.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/map')}
            className="bg-white text-slate-950 hover:bg-amber-100 font-black text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
          >
            <Compass className="w-4 h-4 text-amber-700" />
            <span>افتح ماب حدائق الأهرام</span>
          </button>
        </div>
      </section>

      {/* 4. Business Owner Free Registration Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2 text-center md:text-right max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مجاناً 100% لأصحاب الأنشطة والخدمات</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
              هل تدير محلاً أو عيادة أو نشاطاً في حدائق الأهرام؟ سجله الآن
            </h3>
            <p className="text-xs text-[var(--text-secondary)] font-medium">
              أضف نشاطك ووصل لآلاف السكان والعملاء يومياً عبر تطبيق وخريطة دليلك. توثيق سريع وفوري مجاناً.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/for-business')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-xs"
          >
            <Store className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>إضافة نشاط مجاناً (0 ج)</span>
          </button>
        </div>
      </section>

      {/* 5. Hadayek Gates Modal */}
      <HadayekGatesModal
        isOpen={isGatesModalOpen}
        onClose={() => setIsGatesModalOpen(false)}
        onSelectZone={(zoneLetter) => {
          const zone = HADAYEK_ZONES.find((z) => z.letterAr === zoneLetter);
          if (zone) {
            handleTargetSelection({
              zone,
              buildingNumber: '',
              coords: { lat: zone.centerLat, lng: zone.centerLng },
            });
          }
        }}
      />
    </div>
  );
};
