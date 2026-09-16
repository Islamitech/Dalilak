import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Business } from '../types';
import {
  calculateDistanceKm,
  getBusinessOpenStatus,
  injectBusinessSchemaLd,
  shuffleBusinessesWithSeed,
} from '../utils/directoryEnhancements';
import { getDirectoryPath } from '../utils/directoryUrl';
import { matchesCategoryFilter } from '../utils/categoryMatcher';
import { matchesBusinessSearch, normalizeArabicText } from '../utils/arabicSearch';
import { AppNavbar } from './layout/AppNavbar';
import { AppFooter } from './layout/AppFooter';
import { MobileBottomNav } from './layout/MobileBottomNav';
import { HomeView } from './views/HomeView';
import { MessageCircle } from 'lucide-react';

// Code-splitting via React.lazy to reduce initial JS payload for mobile Lighthouse performance
const SearchView = React.lazy(() => import('./views/SearchView').then(m => ({ default: m.SearchView })));
const MapView = React.lazy(() => import('./views/MapView').then(m => ({ default: m.MapView })));
const FavoritesView = React.lazy(() => import('./views/FavoritesView').then(m => ({ default: m.FavoritesView })));
const ForBusinessView = React.lazy(() => import('./views/ForBusinessView').then(m => ({ default: m.ForBusinessView })));
const BusinessPricingView = React.lazy(() => import('./views/BusinessPricingView').then(m => ({ default: m.BusinessPricingView })));
const AboutView = React.lazy(() => import('./views/AboutView').then(m => ({ default: m.AboutView })));
const ActivityDetailModal = React.lazy(() => import('./activity/ActivityDetailModal').then(m => ({ default: m.ActivityDetailModal })));
const VideoPlayerModal = React.lazy(() => import('./VideoPlayerModal').then(m => ({ default: m.VideoPlayerModal })));

export interface PublicShowcaseProps {
  businesses: Business[];
  initialBizId?: string;
  isPreviewMode?: boolean;
  referralCode?: string;
  loading?: boolean;
}

export const PublicShowcase: React.FC<PublicShowcaseProps> = ({
  businesses,
  initialBizId,
  isPreviewMode = false,
  referralCode,
  loading = false,
}) => {
  // 1. Client-Side Router State
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    const path = window.location.pathname;
    if (path.startsWith('/biz/') || initialBizId) return '/search';
    return path || '/';
  });

  // Navigate handler that updates browser history and route state
  const handleNavigate = useCallback((newPath: string) => {
    try {
      if (window.location.pathname !== newPath) {
        window.history.pushState(null, '', newPath);
      }
    } catch {}

    // Parse category query if present in newPath (e.g. /search?cat=مطاعم)
    if (newPath.includes('?')) {
      const url = new URL(newPath, window.location.origin);
      const catParam = url.searchParams.get('cat');
      if (catParam) {
        setCategoryFilter(decodeURIComponent(catParam));
      }
      setCurrentPath(url.pathname);
    } else {
      setCurrentPath(newPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Listen to browser Back/Forward (popstate)
  useEffect(() => {
    const onPopState = () => {
      const p = window.location.pathname;
      if (p.startsWith('/biz/')) {
        setCurrentPath('/search');
      } else {
        setCurrentPath(p || '/');
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // 2. Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [govFilter, setGovFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [hadayekZoneFilter, setHadayekZoneFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [openNowOnly, setOpenNowOnly] = useState<boolean>(false);
  const [hasRatingOnly, setHasRatingOnly] = useState<boolean>(false);
  const [hasVideoOnly, setHasVideoOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'default' | 'nearest' | 'newest' | 'has_video' | 'open_now' | 'alpha'>('default');
  // 🔀 Dynamic session seed generated fresh on every page load/reload
  const [shuffleSeed, setShuffleSeed] = useState<number>(() => Math.floor(Math.random() * 1000000) + 1);

  // 3. User Geolocation Coordinates
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c));
    }, 3500);
  };

  const handleReshuffle = useCallback(() => {
    setShuffleSeed(Date.now() ^ Math.floor(Math.random() * 1000000));
    showToast('تمت إعادة خلط وترتيب الأنشطة عشوائياً 🔀');
  }, []);

  // Request GPS User Location for Proximity Sorting
  const handleRequestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showToast('المتصفح لا يدعم تحديد الموقع الجغرافي');
      return;
    }
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortBy('nearest');
        showToast('تم تحديد موقعك بدقة! يتم الآن ترتيب الأنشطة من الأقرب إليك 📍');
      },
      () => {
        setIsLocatingUser(false);
        showToast('تعذر تحديد الموقع، يرجى تفعيل إذن الوصول للموقع في المتصفح');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 4. Favorites Management
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dalelak_user_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (bizId: string) => {
    setFavorites((prev) => {
      const isAdded = !prev.includes(bizId);
      const next = isAdded ? [...prev, bizId] : prev.filter((id) => id !== bizId);
      try {
        localStorage.setItem('dalelak_user_favorites', JSON.stringify(next));
      } catch {}
      showToast(isAdded ? 'تمت الإضافة إلى محلاتك المفضلة ❤️' : 'تمت الإزالة من المفضلة');
      return next;
    });
  };

  // 5. Selected Business (Modal details)
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [selectedVideoBiz, setSelectedVideoBiz] = useState<Business | null>(null);
  const isDirectLinkOpenRef = React.useRef<boolean>(Boolean(initialBizId));

  const handleOpenBusiness = (biz: Business) => {
    setSelectedBiz(biz);
    // 🛡️ Normal browsing clicks preserve the user's active filter and do NOT hijack it
    isDirectLinkOpenRef.current = false;
    try {
      const cleanPath = getDirectoryPath(biz);
      window.history.replaceState(null, '', cleanPath);
    } catch {}
  };

  const handleCloseBusiness = () => {
    // 💡 Only retain category context if the visitor came directly via an external shared link,
    // so they discover related businesses in that category after viewing the shared card.
    // For normal directory browsing or after filter reset, keep the user's filter untouched.
    if (isDirectLinkOpenRef.current && selectedBiz?.category) {
      setCategoryFilter(selectedBiz.category);
    }
    isDirectLinkOpenRef.current = false;
    setSelectedBiz(null);
    setCurrentPath('/search');
    try {
      window.history.replaceState(null, '', '/search');
    } catch {}
  };

  // Deep Link Auto-Select Business on load & lock category context
  useEffect(() => {
    if (!initialBizId || businesses.length === 0) return;
    let raw = initialBizId.trim();
    try {
      raw = decodeURIComponent(raw).trim();
    } catch {}

    const idMatch = raw.match(/(biz_[a-zA-Z0-9_-]+)/i);
    const targetId = idMatch ? idMatch[1].toLowerCase() : raw.toLowerCase();

    const match = businesses.find((b) => {
      if (!b) return false;
      const bId = (b.id || '').toLowerCase();
      if (targetId && (bId === targetId || raw.toLowerCase().includes(bId))) return true;
      if (bId === raw.toLowerCase()) return true;
      if (b.customDirectoryUrl && b.customDirectoryUrl.trim().toLowerCase() === raw.toLowerCase()) return true;
      const bNameAr = (b.nameAr || '').trim().toLowerCase();
      if (bNameAr && (bNameAr === raw.toLowerCase() || raw.toLowerCase().includes(bNameAr))) return true;
      return false;
    });

    if (match) {
      setSelectedBiz(match);
      if (match.category) {
        setCategoryFilter(match.category);
      }
      setCurrentPath('/search');
    }
  }, [initialBizId, businesses]);

  // Dynamic Schema.org LocalBusiness SEO injection
  useEffect(() => {
    if (selectedBiz && selectedBiz.verificationStatus !== 'rejected') {
      injectBusinessSchemaLd(selectedBiz);
    } else {
      injectBusinessSchemaLd(null);
    }
  }, [selectedBiz]);

  // Reset all filters handler
  const resetAllFilters = () => {
    isDirectLinkOpenRef.current = false;
    setSearchQuery('');
    setGovFilter('all');
    setCityFilter('all');
    setHadayekZoneFilter('all');
    setCategoryFilter('all');
    setOpenNowOnly(false);
    setHasRatingOnly(false);
    setHasVideoOnly(false);
    setSortBy('default');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    govFilter !== 'all' ||
    cityFilter !== 'all' ||
    hadayekZoneFilter !== 'all' ||
    categoryFilter !== 'all' ||
    openNowOnly ||
    hasRatingOnly ||
    hasVideoOnly ||
    sortBy !== 'default';

  // 6. STRICT PUBLIC BUSINESSES PIPELINE
  const publicBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      if (!b || b.verificationStatus === 'rejected' || b.isDeleted) return false;
      return b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced';
    });
  }, [businesses]);

  // Filtered & Sorted Businesses
  const filteredBusinesses = useMemo(() => {
    const list = publicBusinesses.filter((b) => {
      if (!b) return false;

      // 1. Text Search across name, category, city, landmark, etc.
      if (searchQuery.trim()) {
        if (!matchesBusinessSearch(b, searchQuery)) {
          return false;
        }
      }

      // 2. Category Filter (Enhanced with Canonical Aliases, Root Synonyms, and Groups)
      if (categoryFilter !== 'all') {
        if (!matchesCategoryFilter(b, categoryFilter)) {
          return false;
        }
      }

      // 3. Governorate Filter
      if (govFilter !== 'all') {
        const safeGov = (b.governorate || '').toLowerCase().trim();
        const safeTarget = govFilter.toLowerCase().trim();
        if (!safeGov.includes(safeTarget) && !safeTarget.includes(safeGov)) {
          return false;
        }
      }

      // 4. City & Area Filter
      if (cityFilter !== 'all') {
        const normCity = normalizeArabicText(cityFilter);
        const normBizAddress = normalizeArabicText(
          `${b.city || ''} ${b.street || ''} ${b.landmark || ''} ${b.governorate || ''}`
        );

        if (normCity.includes('حدايق الاهرام') || normCity.includes('هضبه الاهرام')) {
          const isHadayek =
            normBizAddress.includes('حدايق الاهرام') ||
            normBizAddress.includes('هضبه الاهرام') ||
            normBizAddress.includes('الاهرام') ||
            normBizAddress.includes('منطقه ');
          if (!isHadayek) return false;

          if (hadayekZoneFilter !== 'all') {
            const letterMatch = hadayekZoneFilter.match(/منطقة\s+([أ-ي]+)/);
            const letter = letterMatch ? normalizeArabicText(letterMatch[1]) : null;
            if (letter && !normBizAddress.includes(`منطقه ${letter}`)) {
              return false;
            }
          }
          return true;
        }

        const mainKeyword = normCity.split('(')[0].trim();
        if (!normBizAddress.includes(mainKeyword) && !(b.city && normCity.includes(normalizeArabicText(b.city)))) {
          return false;
        }
      }

      // 5. Open Now Filter
      if (openNowOnly) {
        const status = getBusinessOpenStatus(b.workingHours);
        if (!status.isOpen) return false;
      }

      // 6. Has Rating Filter
      if (hasRatingOnly) {
        if (!b.googleRatingEnabled || !b.googleRating || b.googleRating <= 0) return false;
      }

      // 7. Has Video Filter
      if (hasVideoOnly) {
        if (!b.videos || b.videos.length === 0) return false;
      }

      return true;
    });

    // Sorting Pipeline
    if (sortBy === 'nearest' && userCoords) {
      return [...list].sort((a, b) => {
        const distA = calculateDistanceKm(userCoords.lat, userCoords.lng, a.lat, a.lng);
        const distB = calculateDistanceKm(userCoords.lat, userCoords.lng, b.lat, b.lng);
        return distA - distB;
      });
    } else if (sortBy === 'newest') {
      return [...list].sort(
        (a, b) => new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()
      );
    } else if (sortBy === 'has_video') {
      return [...list].sort((a, b) => (b.videos?.length || 0) - (a.videos?.length || 0));
    } else if (sortBy === 'open_now') {
      return [...list].sort((a, b) => {
        const aOpen = getBusinessOpenStatus(a.workingHours).isOpen ? 1 : 0;
        const bOpen = getBusinessOpenStatus(b.workingHours).isOpen ? 1 : 0;
        return bOpen - aOpen;
      });
    } else if (sortBy === 'alpha') {
      return [...list].sort((a, b) => (a.nameAr || '').localeCompare(b.nameAr || '', 'ar'));
    }

    // Default Sorting ('default'):
    // 1. If user has NOT applied any filter: Unbiased, dynamic per-load random shuffle (breaks static patterns)
    const hasUserFilters =
      searchQuery.trim() !== '' ||
      govFilter !== 'all' ||
      cityFilter !== 'all' ||
      hadayekZoneFilter !== 'all' ||
      categoryFilter !== 'all' ||
      openNowOnly ||
      hasRatingOnly ||
      hasVideoOnly;

    if (!hasUserFilters) {
      return shuffleBusinessesWithSeed(list, shuffleSeed);
    }

    // 2. If user HAS applied a filter or search: Show most relevant and complete entries first
    return [...list].sort((a, b) => {
      const aFeatured = a.isFeatured || a.partnerStatus === 'certified' ? 1 : 0;
      const bFeatured = b.isFeatured || b.partnerStatus === 'certified' ? 1 : 0;
      if (bFeatured !== aFeatured) return bFeatured - aFeatured;

      const aHasPhoto = (a.photos?.length || 0) > 0 || !!a.coverPhoto ? 1 : 0;
      const bHasPhoto = (b.photos?.length || 0) > 0 || !!b.coverPhoto ? 1 : 0;
      if (bHasPhoto !== aHasPhoto) return bHasPhoto - aHasPhoto;

      const timeA = new Date(a.createdDate || 0).getTime();
      const timeB = new Date(b.createdDate || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;

      return (a.id || '').localeCompare(b.id || '');
    });
  }, [
    publicBusinesses,
    searchQuery,
    govFilter,
    cityFilter,
    hadayekZoneFilter,
    categoryFilter,
    openNowOnly,
    hasRatingOnly,
    hasVideoOnly,
    sortBy,
    userCoords,
    shuffleSeed,
  ]);

  // Route Dispatcher View
  const renderActiveView = () => {
    const cleanRoute = currentPath.toLowerCase().split('?')[0];

    switch (cleanRoute) {
      case '/':
        return (
          <HomeView
            businesses={publicBusinesses}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedGov={govFilter}
            onGovChange={setGovFilter}
            selectedCity={cityFilter}
            onCityChange={setCityFilter}
            userCoords={userCoords}
            isLocatingUser={isLocatingUser}
            onRequestLocation={handleRequestLocation}
            onOpenBusiness={handleOpenBusiness}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            onNavigate={handleNavigate}
            onOpenVideoModal={(b) => setSelectedVideoBiz(b)}
            shuffleSeed={shuffleSeed}
          />
        );

      case '/search':
        return (
          <SearchView
            filteredBusinesses={filteredBusinesses}
            allBusinesses={publicBusinesses}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedGov={govFilter}
            onGovChange={setGovFilter}
            selectedCity={cityFilter}
            onCityChange={setCityFilter}
            selectedZone={hadayekZoneFilter}
            onZoneChange={setHadayekZoneFilter}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            openNowOnly={openNowOnly}
            onToggleOpenNow={() => setOpenNowOnly(!openNowOnly)}
            hasRatingOnly={hasRatingOnly}
            onToggleHasRating={() => setHasRatingOnly(!hasRatingOnly)}
            hasVideoOnly={hasVideoOnly}
            onToggleHasVideo={() => setHasVideoOnly(!hasVideoOnly)}
            userCoords={userCoords}
            isLocatingUser={isLocatingUser}
            onRequestLocation={handleRequestLocation}
            onOpenBusiness={handleOpenBusiness}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            onResetAllFilters={resetAllFilters}
            hasActiveFilters={hasActiveFilters}
            onOpenVideoModal={(b) => setSelectedVideoBiz(b)}
            onNavigate={handleNavigate}
            onReshuffle={handleReshuffle}
          />
        );

      case '/map':
        return (
          <MapView
            businesses={publicBusinesses}
            filteredBusinesses={filteredBusinesses}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            openNowOnly={openNowOnly}
            onToggleOpenNow={() => setOpenNowOnly(!openNowOnly)}
            onOpenBusiness={handleOpenBusiness}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            userCoords={userCoords}
            onNavigate={handleNavigate}
          />
        );

      case '/favorites':
        return (
          <FavoritesView
            businesses={publicBusinesses}
            favorites={favorites}
            onOpenBusiness={handleOpenBusiness}
            onToggleFavorite={toggleFavorite}
            userCoords={userCoords}
            onNavigate={handleNavigate}
            onOpenVideoModal={(b) => setSelectedVideoBiz(b)}
          />
        );

      case '/for-business':
      case '/add-business':
        return <ForBusinessView onNavigate={handleNavigate} />;

      case '/pricing':
      case '/business-pricing':
        return (
          <BusinessPricingView
            businesses={publicBusinesses}
            onNavigate={handleNavigate}
          />
        );

      case '/about':
        return <AboutView onNavigate={handleNavigate} />;

      default:
        // Default to search view if unknown route or activity deep link
        return (
          <SearchView
            filteredBusinesses={filteredBusinesses}
            allBusinesses={publicBusinesses}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedGov={govFilter}
            onGovChange={setGovFilter}
            selectedCity={cityFilter}
            onCityChange={setCityFilter}
            selectedZone={hadayekZoneFilter}
            onZoneChange={setHadayekZoneFilter}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            openNowOnly={openNowOnly}
            onToggleOpenNow={() => setOpenNowOnly(!openNowOnly)}
            hasRatingOnly={hasRatingOnly}
            onToggleHasRating={() => setHasRatingOnly(!hasRatingOnly)}
            hasVideoOnly={hasVideoOnly}
            onToggleHasVideo={() => setHasVideoOnly(!hasVideoOnly)}
            userCoords={userCoords}
            isLocatingUser={isLocatingUser}
            onRequestLocation={handleRequestLocation}
            onOpenBusiness={handleOpenBusiness}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            onResetAllFilters={resetAllFilters}
            hasActiveFilters={hasActiveFilters}
            onOpenVideoModal={(b) => setSelectedVideoBiz(b)}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] font-['Cairo',sans-serif]" style={{ direction: 'rtl' }}>
      {/* 1. Unified App Header */}
      <AppNavbar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        favoritesCount={favorites.length}
      />

      {/* 2. Main Dispatched View */}
      <main className="flex-1 pb-16 md:pb-0">
        <React.Suspense fallback={
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 p-8">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
            <span className="text-xs font-bold text-slate-400">جاري التحميل...</span>
          </div>
        }>
          {renderActiveView()}
        </React.Suspense>
      </main>

      {/* 3. Unified Institutional Footer */}
      <AppFooter onNavigate={handleNavigate} />

      {/* 4. Activity Details Modal */}
      {selectedBiz && (
        <React.Suspense fallback={null}>
          <ActivityDetailModal
            business={selectedBiz}
            onClose={handleCloseBusiness}
            isFavorite={favorites.includes(selectedBiz.id)}
            onToggleFavorite={toggleFavorite}
            onOpenVideoModal={(b) => setSelectedVideoBiz(b)}
            allBusinesses={publicBusinesses}
            onSelectBusiness={(b) => setSelectedBiz(b)}
            onNavigateToBusinessClaim={(b) => {
              handleCloseBusiness();
              handleNavigate('/for-business');
            }}
          />
        </React.Suspense>
      )}

      {/* 5. Video Player Modal */}
      {selectedVideoBiz && (
        <React.Suspense fallback={null}>
          <VideoPlayerModal
            business={selectedVideoBiz}
            onClose={() => setSelectedVideoBiz(null)}
          />
        </React.Suspense>
      )}

      {/* 6. Subtle Floating WhatsApp Action */}
      <a
        href={`https://wa.me/201143888355?text=${encodeURIComponent(
          'مرحباً دليلك، أود الاستفسار عن خدمة في الدليل' + (referralCode ? ` (كود: ${referralCode})` : '')
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 md:bottom-6 left-6 z-30 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
        title="تواصل معنا عبر واتساب"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
      </a>

      {/* 7. Subtle Toast Notification */}
      {/* 8. Mobile PWA Sticky Bottom Navigation */}
      <MobileBottomNav
        currentPath={currentPath}
        onNavigate={handleNavigate}
        favoritesCount={favorites.length}
      />

      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-black shadow-2xl border border-amber-500/30 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
