import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Business, PackageOption } from '../types';
import {
  EGYPT_CITIES_BY_GOV,
  HADAYEK_ALAHRAM_ZONES,
  CATEGORY_GROUPS,
  PACKAGES,
} from '../data/mockData';
import { useTheme } from '../contexts/ThemeContext';
import { VideoPlayerModal } from './VideoPlayerModal';
import { PackagesModal } from './PackagesModal';
import {
  calculateDistanceKm,
  getBusinessOpenStatus,
  downloadBusinessVCard,
  injectBusinessSchemaLd,
} from '../utils/directoryEnhancements';
import {
  ShowcaseNavbar,
  ShowcaseHeroSearch,
  ShowcaseCardGrid,
  ShowcasePackagesSection,
  ShowcaseConsultationFooter,
  ShowcaseBusinessDetailModal,
  ShowcasePhotoLightbox,
} from './showcase';
import { InteractiveOnboardingExperience } from './onboarding/InteractiveOnboardingExperience';
import { MessageCircle } from 'lucide-react';

export interface PublicShowcaseProps {
  businesses: Business[];
  initialBizId?: string;
  isPreviewMode?: boolean;
  onOpenInternalApp?: () => void;
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
  const { theme, toggleTheme } = useTheme();

  // Interactive Onboarding Experience State («دليلك يبدأ من مكانك»)
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (isPreviewMode || initialBizId) return false;
    try {
      return !localStorage.getItem('dalelak_onboarding_completed');
    } catch {
      return false;
    }
  });

  const handleExploreAround = useCallback((governorate = 'الجيزة', city = 'حدائق الأهرام') => {
    setShowOnboarding(false);
    setGovFilter(governorate);
    setCityFilter(city);
    const elem = document.getElementById('explore');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleSearchSpecific = useCallback(() => {
    setShowOnboarding(false);
    setIsSearchFocused(true);
    setTimeout(() => {
      const searchInput = document.querySelector('input[type="text"][placeholder*="ابحث"]') as HTMLInputElement | null;
      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  }, []);

  const handleAddBusinessFree = useCallback(() => {
    setShowOnboarding(false);
    const elem = document.getElementById('free-listing') || document.getElementById('consultation');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleSkipOnboarding = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [govFilter, setGovFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [hadayekZoneFilter, setHadayekZoneFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeView, setActiveView] = useState<'grid' | 'map'>('grid');

  // User Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dalelak_user_favorites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // Sorting & Real GPS Distance
  const [sortBy, setSortBy] = useState<'default' | 'nearest' | 'newest' | 'has_video' | 'open_now' | 'alpha'>('default');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);

  // Search Autocomplete & Recent History
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dalelak_recent_searches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 5);
      }
    } catch {}
    return [];
  });

  // vCard Download state feedback
  const [vCardDownloadedBizId, setVCardDownloadedBizId] = useState<string | null>(null);

  // Available areas based on chosen Governorate
  const availableCities = useMemo(() => {
    if (govFilter === 'all') {
      return EGYPT_CITIES_BY_GOV['الجيزة'] || [];
    }
    return EGYPT_CITIES_BY_GOV[govFilter] || [];
  }, [govFilter]);

  // Selected Business for Detail Modal
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [selectedVideoBiz, setSelectedVideoBiz] = useState<Business | null>(null);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number | null>(null);
  const [copiedBizId, setCopiedBizId] = useState<string | null>(null);
  const [shareToastText, setShareToastText] = useState<string | null>(null);

  // Photos array of the currently selected business
  const currentPhotos = useMemo(() => {
    return selectedBiz?.photos && selectedBiz.photos.length > 0 ? selectedBiz.photos : [];
  }, [selectedBiz]);

  // Photo slider navigation handlers
  const handlePrevPhoto = useCallback(() => {
    if (currentPhotos.length === 0) return;
    setPreviewPhotoIndex((prev) =>
      prev === null ? 0 : (prev - 1 + currentPhotos.length) % currentPhotos.length
    );
  }, [currentPhotos]);

  const handleNextPhoto = useCallback(() => {
    if (currentPhotos.length === 0) return;
    setPreviewPhotoIndex((prev) =>
      prev === null ? 0 : (prev + 1) % currentPhotos.length
    );
  }, [currentPhotos]);

  // Keyboard navigation for Lightbox (Arrow Keys & Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (previewPhotoIndex === null) return;
      if (e.key === 'Escape') {
        setPreviewPhotoIndex(null);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handlePrevPhoto();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handleNextPhoto();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewPhotoIndex, handlePrevPhoto, handleNextPhoto]);

  // Quick Consultation Form State
  const [formBizName, setFormBizName] = useState<string>('');
  const [formOwnerName, setFormOwnerName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formGov, setFormGov] = useState<string>('الجيزة');
  const [formSelectedPackage, setFormSelectedPackage] = useState<string>(PACKAGES[0].title);
  const [consultSuccess, setConsultSuccess] = useState<boolean>(false);

  // Packages Guide Modal State
  const [showPackagesModal, setShowPackagesModal] = useState<boolean>(false);
  const [modalInitialPackageId, setModalInitialPackageId] = useState<string>('pkg_basic');

  const openPackagesModal = (pkgId: string = 'pkg_basic') => {
    setModalInitialPackageId(pkgId);
    setShowPackagesModal(true);
  };

  // Deep Link Auto-Select Business on load
  useEffect(() => {
    if (!initialBizId || businesses.length === 0) return;

    let raw = initialBizId.trim();
    try {
      raw = decodeURIComponent(raw).trim();
    } catch {}

    const idMatch = raw.match(/(biz_[a-zA-Z0-9_-]+)/i);
    const targetId = idMatch ? idMatch[1].toLowerCase() : raw.toLowerCase();
    const normalizedSlug = raw.replace(/-/g, ' ').trim().toLowerCase();

    const match = businesses.find((b) => {
      if (!b) return false;
      const bId = (b.id || '').toLowerCase();
      // 1. Direct or embedded entity ID match
      if (targetId && (bId === targetId || raw.toLowerCase().includes(bId))) return true;
      if (bId === raw.toLowerCase()) return true;

      // 2. Arabic name match (exact, slug, or normalized)
      const bNameAr = (b.nameAr || '').trim().toLowerCase();
      if (
        bNameAr &&
        (bNameAr === raw.toLowerCase() ||
          bNameAr === normalizedSlug ||
          normalizedSlug.includes(bNameAr) ||
          bNameAr.includes(normalizedSlug))
      ) {
        return true;
      }

      // 3. English name match
      const bNameEn = (b.nameEn || '').trim().toLowerCase();
      if (bNameEn && (bNameEn === raw.toLowerCase() || bNameEn === normalizedSlug)) {
        return true;
      }

      // 4. Custom directory URL manual match
      if (b.customDirectoryUrl) {
        const customLower = b.customDirectoryUrl.trim().toLowerCase();
        if (customLower.includes(raw.toLowerCase()) || raw.toLowerCase().includes(customLower)) {
          return true;
        }
      }

      return false;
    });

    if (match) {
      setSelectedBiz(match);
    }
  }, [initialBizId, businesses]);

  // Dynamic Schema.org LocalBusiness injection for Google SEO (Strictly disabled for rejected)
  useEffect(() => {
    if (selectedBiz && selectedBiz.verificationStatus === 'rejected') {
      injectBusinessSchemaLd(null);
      return;
    }
    injectBusinessSchemaLd(selectedBiz);
  }, [selectedBiz]);

  // On-demand full photo gallery loader for selected business (Skipped for rejected)
  useEffect(() => {
    if (
      !selectedBiz ||
      selectedBiz.verificationStatus === 'rejected' ||
      (selectedBiz.photos && selectedBiz.photos.length > 1)
    )
      return;
    let isCurrent = true;
    const bizId = selectedBiz.id;

    fetch(
      `https://xdqpbajymacpdccorjcj.supabase.co/rest/v1/businesses?id=eq.${encodeURIComponent(
        bizId
      )}&select=id,photos,notes`,
      {
        headers: {
          apikey: 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x',
        },
      }
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        if (isCurrent && Array.isArray(rows) && rows.length > 0 && rows[0].photos) {
          let itemPhotos: string[] = [];
          if (Array.isArray(rows[0].photos)) {
            itemPhotos = rows[0].photos;
          } else if (typeof rows[0].photos === 'string' && rows[0].photos.trim().length > 0) {
            try {
              const p = JSON.parse(rows[0].photos.trim());
              if (Array.isArray(p)) itemPhotos = p;
            } catch {}
          }

          let fetchedCoverPhoto: string | undefined = undefined;
          if (typeof rows[0].notes === 'string' && rows[0].notes.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(rows[0].notes.trim());
              if (parsed?.coverPhoto) fetchedCoverPhoto = parsed.coverPhoto;
            } catch {}
          }

          if (itemPhotos.length > 0) {
            setSelectedBiz((prev) =>
              prev && prev.id === bizId
                ? { ...prev, photos: itemPhotos, coverPhoto: prev.coverPhoto || fetchedCoverPhoto }
                : prev
            );
          }
        }
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [selectedBiz?.id]);

  // Toggle Favorite
  const toggleFavorite = (bizId: string) => {
    setFavorites((prev) => {
      const isAdded = !prev.includes(bizId);
      const next = isAdded ? [...prev, bizId] : prev.filter((id) => id !== bizId);
      try {
        localStorage.setItem('dalelak_user_favorites', JSON.stringify(next));
      } catch {}
      setShareToastText(isAdded ? 'تمت الإضافة إلى محلاتك المفضلة ❤️' : 'تمت الإزالة من المفضلة');
      setTimeout(() => setShareToastText(null), 2500);
      return next;
    });
  };

  // Request GPS User Location for Smart Proximity Sorting
  const handleRequestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setShareToastText('متصفحك لا يدعم خاصية تحديد الموقع الجغرافي');
      setTimeout(() => setShareToastText(null), 3000);
      return;
    }
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortBy('nearest');
        setShareToastText('تم تحديد موقعك بدقة! يتم الآن ترتيب الأنشطة من الأقرب إليك 📍');
        setTimeout(() => setShareToastText(null), 3500);
      },
      () => {
        setIsLocatingUser(false);
        setShareToastText('تعذر تحديد الموقع، يرجى تفعيل إذن الوصول للموقع في المتصفح');
        setTimeout(() => setShareToastText(null), 3500);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Download Business vCard Contact
  const handleDownloadVCard = (biz: Business) => {
    downloadBusinessVCard(biz);
    setVCardDownloadedBizId(biz.id);
    setShareToastText('تم حفظ بيانات المكان في جهات اتصالك 📇');
    setTimeout(() => {
      setVCardDownloadedBizId(null);
      setShareToastText(null);
    }, 3000);
  };

  // Add term to recent searches
  const addRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('dalelak_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Clear recent searches
  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('dalelak_recent_searches');
    } catch {}
  };

  // Open Business and update browser URL without reload
  const handleOpenBusiness = (biz: Business) => {
    setSelectedBiz(biz);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('biz', biz.id);
      window.history.replaceState(null, '', url.toString());
    } catch {}
  };

  // Close Business and restore browser URL
  const handleCloseBusiness = () => {
    setSelectedBiz(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('biz');
      url.searchParams.delete('b');
      url.searchParams.delete('id');
      url.searchParams.delete('preview');
      const cleanPath = url.pathname.startsWith('/biz') ? '/' : url.pathname;
      window.history.replaceState(null, '', cleanPath + (url.search ? url.search : ''));
    } catch {}
  };

  // Share Business Direct Link
  const handleShareBusiness = async (biz: Business, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const rawName = biz.nameAr || biz.nameEn || '';
    const slug = rawName
      .trim()
      .replace(/[«»"'""''\(\)\[\]{}#@!$%^&*+=\\\/|:;<>?,.~`]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const identifier = slug ? `${slug}-${biz.id}` : biz.id;
    let shareUrl = `${window.location.origin}/biz/${encodeURIComponent(identifier)}`;
    if (biz.customDirectoryUrl && biz.customDirectoryUrl.trim()) {
      const custom = biz.customDirectoryUrl.trim();
      if (custom.startsWith('http://') || custom.startsWith('https://')) {
        shareUrl = custom;
      } else if (custom.startsWith('/')) {
        shareUrl = `${window.location.origin}${custom}`;
      } else {
        shareUrl = `${window.location.origin}/biz/${encodeURIComponent(custom)}`;
      }
    }
    const shareTitle = `${biz.nameAr} | منصة دليلك المعتمدة`;

    let descSnippet = '';
    if (biz.description && biz.description.trim()) {
      descSnippet = `\n📝 ${biz.description.trim()}`;
    } else if (biz.phone) {
      descSnippet = `\n📞 تواصل: ${biz.phone}`;
    }

    const specificArea = biz.city?.trim() || biz.governorate?.trim() || 'مصر';
    const shareText = `تفاصيل "${biz.nameAr}" المعتمد في ${specificArea}:${descSnippet}`;

    const copyToClipboardFallback = async () => {
      let copied = false;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
          copied = true;
        }
      } catch {}

      if (!copied) {
        try {
          const textArea = document.createElement('textarea');
          textArea.value = shareUrl;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          copied = document.execCommand('copy');
          document.body.removeChild(textArea);
        } catch {}
      }

      setCopiedBizId(biz.id);
      setShareToastText('تم نسخ رابط المنشأة بنجاح! جاهز للمشاركة 📋');
      if (typeof window !== 'undefined' && window.navigator?.vibrate) {
        try {
          window.navigator.vibrate([15, 30, 15]);
        } catch {}
      }
      setTimeout(() => {
        setCopiedBizId(null);
        setShareToastText(null);
      }, 3500);
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setCopiedBizId(biz.id);
        setTimeout(() => setCopiedBizId(null), 3000);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        await copyToClipboardFallback();
      }
    } else {
      await copyToClipboardFallback();
    }
  };

  // 100% STRICT PUBLIC DIRECTORY FILTER
  const publicBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      if (!b || b.verificationStatus === 'rejected' || b.isDeleted) return false;
      return b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced';
    });
  }, [businesses]);

  // Search Autocomplete Suggestions
  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { businesses: [], categories: [], zones: [] };

    const matchingBusinesses = publicBusinesses
      .filter(
        (b) =>
          (b.nameAr && b.nameAr.toLowerCase().includes(q)) ||
          (b.nameEn && b.nameEn.toLowerCase().includes(q))
      )
      .slice(0, 4);

    const matchingCategories = CATEGORY_GROUPS.filter(
      (grp) =>
        grp.group.toLowerCase().includes(q) ||
        grp.items.some((item) => item.toLowerCase().includes(q))
    ).slice(0, 3);

    const matchingZones = HADAYEK_ALAHRAM_ZONES.filter((z) => z.toLowerCase().includes(q)).slice(0, 3);

    return {
      businesses: matchingBusinesses,
      categories: matchingCategories,
      zones: matchingZones,
    };
  }, [searchQuery, publicBusinesses]);

  // Filtered & Sorted Businesses
  const filteredBusinesses = useMemo(() => {
    const list = publicBusinesses.filter((b) => {
      if (!b) return false;

      // 1. Favorites-only filter
      if (showFavoritesOnly && !favorites.includes(b.id)) {
        return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchName =
          (b.nameAr || '').toLowerCase().includes(q) || (b.nameEn || '').toLowerCase().includes(q);
        const matchCity =
          (b.city || '').toLowerCase().includes(q) || (b.governorate || '').toLowerCase().includes(q);
        const matchCat = (b.category || '').toLowerCase().includes(q);
        if (!matchName && !matchCity && !matchCat) return false;
      }
      if (govFilter !== 'all') {
        const safeGov = (b.governorate || '').toLowerCase().trim();
        const safeTarget = govFilter.toLowerCase().trim();
        if (!safeGov.includes(safeTarget) && !safeTarget.includes(safeGov)) {
          return false;
        }
      }
      if (cityFilter !== 'all') {
        const qCity = cityFilter.toLowerCase().trim();
        const bCity = (b.city || '').toLowerCase().trim();
        const bStreet = (b.street || '').toLowerCase().trim();
        const bLandmark = (b.landmark || '').toLowerCase().trim();
        const bGov = (b.governorate || '').toLowerCase().trim();

        const norm = (str: string) =>
          str
            .replace(/[إأآا]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ى/g, 'ي')
            .replace(/[\u064B-\u065F]/g, '');

        const normQ = norm(qCity);
        const normAddress = norm(`${bCity} ${bStreet} ${bLandmark} ${bGov}`);

        if (
          normQ.includes('حدايق الاهرام') ||
          normQ.includes('حدايق اهرام') ||
          normQ.includes('هضبه الاهرام')
        ) {
          const isHadayek =
            normAddress.includes('حدايق الاهرام') ||
            normAddress.includes('هضبه الاهرام') ||
            normAddress.includes('الاهرام') ||
            normAddress.includes('منطقه ') ||
            norm(bCity).includes('منطقه') ||
            norm(bStreet).includes('حدايق');

          if (!isHadayek) return false;

          if (hadayekZoneFilter !== 'all') {
            const normZone = norm(hadayekZoneFilter);
            const letterMatch = hadayekZoneFilter.match(/منطقة\s+([أ-ي]+)/);
            const letter = letterMatch ? norm(letterMatch[1]) : null;

            if (letter) {
              const isLetterMatch =
                normAddress.includes(`منطقه ${letter}`) ||
                normAddress.includes(`منطقه (${letter})`) ||
                normAddress.includes(`(${letter})`) ||
                normAddress.includes(` ${letter} `) ||
                normAddress.endsWith(` ${letter}`) ||
                norm(bCity).includes(`منطقه ${letter}`) ||
                norm(bStreet).includes(`منطقه ${letter}`);
              if (!isLetterMatch) return false;
            } else {
              const mainZoneKey = normZone.split('(')[0].trim();
              if (!normAddress.includes(mainZoneKey)) return false;
            }
          }
          return true;
        }

        // 1. Direct match with full query or main keyword (before parentheses)
        const mainKeyword = normQ.split('(')[0].trim();
        let isCityMatch =
          normAddress.includes(mainKeyword) ||
          normAddress.includes(normQ) ||
          (bCity && normQ.includes(norm(bCity))) ||
          (bCity && norm(bCity).includes(mainKeyword));

        // 2. Semantic Area Token matching (e.g. "شارع فيصل" -> "فيصل" / "الملك فيصل")
        if (!isCityMatch) {
          // Strip generic prefixes: شارع, مدينه, حي, منطقه, ميدان
          const stripped = mainKeyword
            .replace(/^(?:شارع|مدينه|حي|منطقه|ميدان)\s+/, '')
            .trim();

          // Split compound areas separated by "و" (e.g. "امبابه والوراق", "ميدان الجيزه والجامعه", "الحوامديه والبدرشين")
          const subTokens = stripped.includes(' و ')
            ? stripped.split(' و ').map((t) => t.trim()).filter(Boolean)
            : [stripped];

          for (const token of subTokens) {
            if (token.length >= 3 && normAddress.includes(token)) {
              isCityMatch = true;
              break;
            }
          }

          // Special canonical aliases for key Egyptian thoroughfares:
          // فيصل: matches "فيصل", "الملك فيصل", "شارع فيصل"
          if (!isCityMatch && (mainKeyword.includes('فيصل') || stripped.includes('فيصل'))) {
            if (normAddress.includes('فيصل')) {
              isCityMatch = true;
            }
          }
          // الهرم: matches "الهرم", "شارع الهرم" (excluding Hadayek Al-Ahram)
          if (!isCityMatch && (mainKeyword.includes('الهرم') || stripped.includes('الهرم'))) {
            if (
              normAddress.includes('الهرم') &&
              !normAddress.includes('حدايق الاهرام') &&
              !normAddress.includes('هضبه الاهرام')
            ) {
              isCityMatch = true;
            }
          }
          // 6 أكتوبر / الشيخ زايد
          if (!isCityMatch && (mainKeyword.includes('اكتوبر') || stripped.includes('اكتوبر'))) {
            if (normAddress.includes('اكتوبر')) isCityMatch = true;
          }
          if (!isCityMatch && (mainKeyword.includes('زايد') || stripped.includes('زايد'))) {
            if (normAddress.includes('زايد')) isCityMatch = true;
          }
        }

        if (!isCityMatch) {
          return false;
        }
      }
      if (categoryFilter !== 'all') {
        const grp = CATEGORY_GROUPS.find((g) => g.group === categoryFilter);
        if (grp) {
          if (!grp.items.includes(b.category) && b.category !== categoryFilter) return false;
        } else if (b.category !== categoryFilter) {
          return false;
        }
      }
      return true;
    });

    // 2. Sorting Pipeline
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

    return list;
  }, [
    publicBusinesses,
    showFavoritesOnly,
    favorites,
    searchQuery,
    govFilter,
    cityFilter,
    hadayekZoneFilter,
    categoryFilter,
    sortBy,
    userCoords,
  ]);

  // Dynamic WhatsApp Message generator for Package Orders
  const getPackageWhatsAppUrl = (pkg: PackageOption) => {
    const defaultPhone = '201143888355';
    let text = '';
    if (pkg.price === 0) {
      text = `مرحباً دليلك\nأرغب في طلب إدراج وظهور منشأتنا ومكاننا مجاناً في دليل منصة دليلك بدون أي رسوم (0 ج.م).\nيرجى تزويدي بالخطوات المطلوبة لإرسال بيانات المحل والظهور في الدليل.`;
    } else if (pkg.price === 20000) {
      text = `مرحباً دليلك\nأود الاستفسار والاشتراك في "باقة الانطلاق الكبرى والتأسيس من الصفر (20,000 ج.م)" لمشروعنا ومكاننا (تحت التجهيز والإنشاء).\nأرغب في التكفل الشامل بالهوية والشعار واللافتة والتأسيس الرقمي وفيديو الافتتاح السينمائي وبناء نظام الزبون المنتظم.`;
    } else {
      text = `مرحباً دليلك\nأود الاستفسار والاشتراك في "${pkg.title}" بقيمة (${pkg.price} ج.م) كحملة دعائية لتطوير ومضاعفة مبيعات منشأتنا ومكاننا.`;
    }
    if (referralCode) {
      text += `\n(كود المندوب الإرشادي: ${referralCode})`;
    }
    return `https://wa.me/${defaultPhone}?text=${encodeURIComponent(text)}`;
  };

  // Consultation submit
  const handleConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBizName || !formPhone) return;

    const defaultPhone = '201143888355';
    let text = `السلام عليكم ورحمة الله وبركاته\n`;
    if (formSelectedPackage.includes('مجاني') || formSelectedPackage.includes('0')) {
      text += `طلب إدراج وظهور منشأة تجارية مجاناً في دليل دليلك (0 ج.م بدون أي رسوم):\n`;
    } else if (
      formSelectedPackage.includes('20000') ||
      formSelectedPackage.includes('الإنشاء') ||
      formSelectedPackage.includes('الانطلاق')
    ) {
      text += `طلب حجز باقة الانطلاق الكبرى والتأسيس من الصفر (20,000 ج.م) للمشاريع تحت التجهيز والإنشاء:\n`;
    } else {
      text += `طلب استفسار وحجز حملة دعائية لتطوير منشأة ومكان تجاري:\n`;
    }
    text += `اسم المكان / المنشأة: ${formBizName.trim()}\n`;
    if (formOwnerName) text += `المسؤول: ${formOwnerName.trim()}\n`;
    text += `رقم التواصل: ${formPhone.trim()}\n`;
    text += `المحافظة: ${formGov}\n`;
    text += `نوع الطلب / الحملة: ${formSelectedPackage}\n`;
    if (referralCode) text += `كود الإحالة: ${referralCode}\n`;

    setConsultSuccess(true);
    setTimeout(() => {
      window.open(`https://wa.me/${defaultPhone}?text=${encodeURIComponent(text)}`, '_blank');
    }, 400);
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
      govFilter !== 'all' ||
      cityFilter !== 'all' ||
      hadayekZoneFilter !== 'all' ||
      categoryFilter !== 'all' ||
      showFavoritesOnly ||
      sortBy !== 'default'
  );

  const resetAllFilters = () => {
    setSearchQuery('');
    setGovFilter('all');
    setCityFilter('all');
    setHadayekZoneFilter('all');
    setCategoryFilter('all');
    setShowFavoritesOnly(false);
    setSortBy('default');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans antialiased selection:bg-amber-500 selection:text-slate-950 transition-colors duration-300">
      {/* 0. Interactive Onboarding Experience («دليلك يبدأ من مكانك») */}
      {showOnboarding && (
        <InteractiveOnboardingExperience
          onExploreAround={handleExploreAround}
          onSearchSpecific={handleSearchSpecific}
          onAddBusinessFree={handleAddBusinessFree}
          onSkip={handleSkipOnboarding}
        />
      )}

      {/* 1. Sticky Navbar */}
      <ShowcaseNavbar
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenPackagesModal={openPackagesModal}
        onReopenOnboarding={() => setShowOnboarding(true)}
      />

      {/* 2. Hero & Search Hub */}
      <ShowcaseHeroSearch
        publicBusinesses={publicBusinesses}
        filteredBusinesses={filteredBusinesses}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchFocused={isSearchFocused}
        setIsSearchFocused={setIsSearchFocused}
        recentSearches={recentSearches}
        addRecentSearch={addRecentSearch}
        handleClearRecentSearches={handleClearRecentSearches}
        searchSuggestions={searchSuggestions}
        handleOpenBusiness={handleOpenBusiness}
        govFilter={govFilter}
        setGovFilter={setGovFilter}
        cityFilter={cityFilter}
        setCityFilter={setCityFilter}
        hadayekZoneFilter={hadayekZoneFilter}
        setHadayekZoneFilter={setHadayekZoneFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        availableCities={availableCities}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
        favorites={favorites}
        sortBy={sortBy}
        setSortBy={setSortBy}
        handleRequestLocation={handleRequestLocation}
        userCoords={userCoords}
        isLocatingUser={isLocatingUser}
        hasActiveFilters={hasActiveFilters}
        resetAllFilters={resetAllFilters}
        onOpenPackagesModal={openPackagesModal}
      />

      {/* 3. Directory Showcase Cards & Map */}
      <ShowcaseCardGrid
        filteredBusinesses={filteredBusinesses}
        businesses={businesses}
        activeView={activeView}
        setActiveView={setActiveView}
        loading={loading}
        initialBizId={initialBizId}
        handleOpenBusiness={handleOpenBusiness}
        toggleFavorite={toggleFavorite}
        favorites={favorites}
        userCoords={userCoords}
        handleShareBusiness={handleShareBusiness}
        copiedBizId={copiedBizId}
        setSelectedVideoBiz={setSelectedVideoBiz}
        resetAllFilters={resetAllFilters}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        handleRequestLocation={handleRequestLocation}
      />

      {/* 4. Packages & Campaigns Section */}
      <ShowcasePackagesSection
        onOpenPackagesModal={openPackagesModal}
        getPackageWhatsAppUrl={getPackageWhatsAppUrl}
        onSelectPackageForConsultation={(title) => {
          setFormSelectedPackage(title);
          const formElem = document.getElementById('consultation') || document.getElementById('free-listing');
          if (formElem) {
            formElem.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* 5. Why Dalelak & Consultation Form & Footer */}
      <ShowcaseConsultationFooter
        consultSuccess={consultSuccess}
        handleConsultationSubmit={handleConsultationSubmit}
        formBizName={formBizName}
        setFormBizName={setFormBizName}
        formOwnerName={formOwnerName}
        setFormOwnerName={setFormOwnerName}
        formPhone={formPhone}
        setFormPhone={setFormPhone}
        formGov={formGov}
        setFormGov={setFormGov}
        formSelectedPackage={formSelectedPackage}
        setFormSelectedPackage={setFormSelectedPackage}
        openPackagesModal={openPackagesModal}
      />

      {/* 6. Business Details Modal / Suspension Screen */}
      <ShowcaseBusinessDetailModal
        selectedBiz={selectedBiz}
        onClose={handleCloseBusiness}
        isPreviewMode={isPreviewMode}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        handleShareBusiness={handleShareBusiness}
        copiedBizId={copiedBizId}
        onOpenPhotoPreview={(idx) => setPreviewPhotoIndex(idx)}
        onOpenVideoModal={(biz) => setSelectedVideoBiz(biz)}
        handleDownloadVCard={handleDownloadVCard}
        vCardDownloadedBizId={vCardDownloadedBizId}
      />

      {/* 7. Photo Lightbox */}
      <ShowcasePhotoLightbox
        photos={currentPhotos}
        previewPhotoIndex={previewPhotoIndex}
        setPreviewPhotoIndex={setPreviewPhotoIndex}
        handlePrevPhoto={handlePrevPhoto}
        handleNextPhoto={handleNextPhoto}
      />

      {/* 8. Video Player Modal */}
      {selectedVideoBiz && (
        <VideoPlayerModal
          business={selectedVideoBiz}
          onClose={() => setSelectedVideoBiz(null)}
        />
      )}

      {/* 9. Packages Guide Modal */}
      {showPackagesModal && (
        <PackagesModal
          isOpen={showPackagesModal}
          onClose={() => setShowPackagesModal(false)}
          initialPackageId={modalInitialPackageId}
          onSelectPackage={(title) => {
            setFormSelectedPackage(title);
            const formElem = document.getElementById('consultation') || document.getElementById('free-listing');
            if (formElem) {
              formElem.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />
      )}

      {/* 10. Toast Notifications */}
      {shareToastText && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/95 text-white border border-amber-500/30 backdrop-blur-xl text-xs font-black shadow-2xl toast-slide-down"
          style={{ direction: 'rtl' }}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>{shareToastText}</span>
        </div>
      )}

      {/* 11. Floating WhatsApp Button */}
      <a
        href={`https://wa.me/201143888355?text=${encodeURIComponent(
          `مرحباً، أود الاستفسار عن توثيق مكاني التجاري على خرائط Google` +
            (referralCode ? ` (كود: ${referralCode})` : '')
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-[9998] w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl shadow-emerald-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white/30 animate-pulse-glow"
        title="تواصل معنا على واتساب"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-white/20" />
      </a>
    </div>
  );
};
