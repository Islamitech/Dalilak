import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Business, PackageOption } from '../types';
import {
  EGYPT_GOVERNORATES,
  EGYPT_CITIES_BY_GOV,
  HADAYEK_ALAHRAM_ZONES,
  CATEGORY_GROUPS,
  PACKAGES,
} from '../data/mockData';
import { Logo } from './Logo';
import { InteractiveMap } from './InteractiveMap';
import {
  MapPin,
  Phone,
  Search,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Star,
  Layers,
  Send,
  MessageCircle,
  Building2,
  Clock,
  Navigation,
  X,
  Check,
  Award,
  TrendingUp,
  Map as MapIcon,
  Sun,
  Moon,
  Video,
  Film,
  Play,
  Loader2,
  Globe,
  ExternalLink,
  Maximize,
  Image as ImageIcon,
  Share2,
  Copy,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Heart,
  Compass,
  ArrowUpDown,
  UserPlus,
  History,
  Trash2,
  ChevronDown,
  Menu,
  Zap,
  Crown,
  Rocket,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { VideoWatermarkBadge } from './VideoWatermarkBadge';
import { VideoPlayerModal } from './VideoPlayerModal';
import { PackagesModal } from './PackagesModal';
import {
  calculateDistanceKm,
  formatDistanceString,
  getBusinessOpenStatus,
  downloadBusinessVCard,
  getSmartWhatsAppUrl,
  injectBusinessSchemaLd,
} from '../utils/directoryEnhancements';

interface PublicShowcaseProps {
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
  const isActuallyLoading = loading && businesses.length === 0;

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [govFilter, setGovFilter] = useState<string>('الجيزة');
  const [cityFilter, setCityFilter] = useState<string>('حدائق الأهرام');
  const [hadayekZoneFilter, setHadayekZoneFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeView, setActiveView] = useState<'grid' | 'map'>('grid');

  // ❤️ User Favorites
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

  // 📍 Sorting & Real GPS Distance
  const [sortBy, setSortBy] = useState<'default' | 'nearest' | 'newest' | 'has_video' | 'open_now' | 'alpha'>('default');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);

  // 🔍 Search Autocomplete & Recent History
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

  // 📇 vCard Download state feedback
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
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [copiedBizId, setCopiedBizId] = useState<string | null>(null);
  const [shareToastText, setShareToastText] = useState<string | null>(null);

  // Photos array of the currently selected business
  const currentPhotos = useMemo(() => {
    return selectedBiz?.photos && selectedBiz.photos.length > 0
      ? selectedBiz.photos
      : [];
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
        handlePrevPhoto(); // RTL intuitive
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

  // Packages Guide Modal State (طراز موقع الحسابات)
  const [showPackagesModal, setShowPackagesModal] = useState<boolean>(false);
  const [modalInitialPackageId, setModalInitialPackageId] = useState<string>('pkg_basic');

  const openPackagesModal = (pkgId: string = 'pkg_basic') => {
    setModalInitialPackageId(pkgId);
    setShowPackagesModal(true);
  };

  // Deep Link Auto-Select Business on load
  useEffect(() => {
    if (initialBizId && businesses.length > 0) {
      const match = businesses.find(
        (b) => b.id === initialBizId || (b.nameAr && b.nameAr.trim() === initialBizId.trim())
      );
      if (match) {
        setSelectedBiz(match);
      }
    }
  }, [initialBizId, businesses]);

  // Dynamic Schema.org LocalBusiness injection for Google SEO
  useEffect(() => {
    injectBusinessSchemaLd(selectedBiz);
  }, [selectedBiz]);

  // On-demand full photo gallery loader for selected business
  useEffect(() => {
    if (!selectedBiz || (selectedBiz.photos && selectedBiz.photos.length > 1)) return;
    let isCurrent = true;
    const bizId = selectedBiz.id;

    fetch(`https://xdqpbajymacpdccorjcj.supabase.co/rest/v1/businesses?id=eq.${encodeURIComponent(bizId)}&select=id,photos,notes`, {
      headers: {
        apikey: 'sb_publishable_VJ8y1c53by7_sEn90hy8Pw_vO_K_b2x',
      },
    })
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
            setSelectedBiz((prev) => (prev && prev.id === bizId ? { ...prev, photos: itemPhotos, coverPhoto: prev.coverPhoto || fetchedCoverPhoto } : prev));
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
    setShareToastText('تم حفظ بيانات النشاط في دفتر عناوين هاتفك 📇');
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
  const handleClearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    const shareUrl = `${window.location.origin}/biz/${biz.id}`;
    const shareTitle = `نشاط ${biz.nameAr} | منصة دليلك المعتمدة ✨`;

    let ratingSnippet = '';
    if (biz.googleRatingEnabled && biz.googleRating) {
      ratingSnippet = `\n⭐ تقييم Google: ${biz.googleRating.toFixed(1)} (${biz.googleReviewsCount || 0} تقييم)`;
    }

    let descSnippet = '';
    if (biz.description && biz.description.trim()) {
      descSnippet = `\n📝 ${biz.description.trim()}`;
    } else if (biz.phone) {
      descSnippet = `\n📞 تواصل: ${biz.phone}`;
    }

    const specificArea = biz.city?.trim() || biz.governorate?.trim() || 'مصر';
    const shareText = `تفاصيل "${biz.nameAr}" المعتمد في ${specificArea}:${ratingSnippet}${descSnippet}`;

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
      setShareToastText('تم نسخ رابط النشاط بنجاح! جاهز للمشاركة 📋');
      if (typeof window !== 'undefined' && window.navigator?.vibrate) {
        try { window.navigator.vibrate([15, 30, 15]); } catch {}
      }
      setTimeout(() => {
        setCopiedBizId(null);
        setShareToastText(null);
      }, 3500);
    };

    // On mobile devices supporting Web Share API
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
        // If user cancelled the share dialog, do nothing
        if (err?.name === 'AbortError') return;
        // If navigator.share failed for any reason (permissions, desktop, etc.), fallback to copy
        await copyToClipboardFallback();
      }
    } else {
      // Desktop / browsers without navigator.share
      await copyToClipboardFallback();
    }
  };

  // 100% STRICT PUBLIC DIRECTORY FILTER
  const publicBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      if (!b) return false;
      if (isPreviewMode || (initialBizId && b.id === initialBizId)) return true;
      return b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced';
    });
  }, [businesses, isPreviewMode, initialBizId]);

  // Search Autocomplete Suggestions
  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { businesses: [], categories: [], zones: [] };

    const matchingBusinesses = publicBusinesses
      .filter((b) => (b.nameAr && b.nameAr.toLowerCase().includes(q)) || (b.nameEn && b.nameEn.toLowerCase().includes(q)))
      .slice(0, 4);

    const matchingCategories = CATEGORY_GROUPS
      .filter((grp) => grp.group.toLowerCase().includes(q) || grp.items.some((item) => item.toLowerCase().includes(q)))
      .slice(0, 3);

    const matchingZones = HADAYEK_ALAHRAM_ZONES
      .filter((z) => z.toLowerCase().includes(q))
      .slice(0, 3);

    return {
      businesses: matchingBusinesses,
      categories: matchingCategories,
      zones: matchingZones,
    };
  }, [searchQuery, publicBusinesses]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    publicBusinesses.forEach((b) => {
      const grp = CATEGORY_GROUPS.find((g) => g.items.includes(b.category) || g.group === b.category);
      if (grp) {
        counts[grp.group] = (counts[grp.group] || 0) + 1;
      }
    });
    return counts;
  }, [publicBusinesses]);

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
        const matchName = (b.nameAr || '').toLowerCase().includes(q) || (b.nameEn || '').toLowerCase().includes(q);
        const matchCity = (b.city || '').toLowerCase().includes(q) || (b.governorate || '').toLowerCase().includes(q);
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

        if (normQ.includes('حدايق الاهرام') || normQ.includes('حدايق اهرام') || normQ.includes('هضبه الاهرام')) {
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

        const mainKeyword = normQ.split('(')[0].trim();
        if (!normAddress.includes(mainKeyword) && !normAddress.includes(normQ) && !(bCity && normQ.includes(norm(bCity)))) {
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
  }, [publicBusinesses, showFavoritesOnly, favorites, searchQuery, govFilter, cityFilter, hadayekZoneFilter, categoryFilter, sortBy, userCoords]);

  // Dynamic WhatsApp Message generator for Package Orders
  const getPackageWhatsAppUrl = (pkg: PackageOption) => {
    const defaultPhone = '201143888355';
    let text = '';
    if (pkg.price === 0) {
      text = `مرحباً دليلك 👋\nأرغب في طلب إدراج وظهور نشاطي التجاري مجاناً في دليل منصة دليلك بدون أي رسوم (0 ج.م) 🎁.\nيرجى تزويدي بالخطوات المطلوبة لإرسال بيانات المحل والظهور في الدليل.`;
    } else if (pkg.price === 20000) {
      text = `مرحباً دليلك 👋\nأود الاستفسار والاشتراك في "باقة الانطلاق الكبرى والتأسيس من الصفر (20,000 ج.م)" لنشاطي التجاري (تحت الإنشاء) 👑.\nأرغب في التكفل الشامل بالهوية والشعار واللافتة والتأسيس الرقمي وفيديو الافتتاح السينمائي وبناء نظام الزبون المنتظم.`;
    } else {
      text = `مرحباً دليلك 👋\nأود الاستفسار والاشتراك في "${pkg.title}" بقيمة (${pkg.price} ج.م) كحملة دعائية لتطوير ومضاعفة مبيعات نشاطي التجاري.`;
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
    let text = `السلام عليكم ورحمة الله وبركاته 🌿\n`;
    if (formSelectedPackage.includes('مجاني') || formSelectedPackage.includes('0')) {
      text += `طلب إدراج وظهور نشاط تجاري مجاناً في دليل دليلك (0 ج.م بدون أي رسوم) 🎁:\n`;
    } else if (formSelectedPackage.includes('20000') || formSelectedPackage.includes('الإنشاء') || formSelectedPackage.includes('الانطلاق')) {
      text += `طلب حجز باقة الانطلاق الكبرى والتأسيس من الصفر (20,000 ج.م) للأنشطة تحت الإنشاء 👑:\n`;
    } else {
      text += `طلب استفسار وحجز حملة دعائية لتطوير نشاط تجاري 🚀:\n`;
    }
    text += `🏬 اسم النشاط: ${formBizName.trim()}\n`;
    if (formOwnerName) text += `👤 المسؤول: ${formOwnerName.trim()}\n`;
    text += `📱 رقم التواصل: ${formPhone.trim()}\n`;
    text += `📍 المحافظة: ${formGov}\n`;
    text += `🎯 نوع الطلب / الحملة: ${formSelectedPackage}\n`;
    if (referralCode) text += `🔖 كود الإحالة: ${referralCode}\n`;

    setConsultSuccess(true);
    setTimeout(() => {
      window.open(`https://wa.me/${defaultPhone}?text=${encodeURIComponent(text)}`, '_blank');
    }, 400);
  };

  const hasActiveFilters = searchQuery || govFilter !== 'الجيزة' || cityFilter !== 'حدائق الأهرام' || hadayekZoneFilter !== 'all' || categoryFilter !== 'all' || showFavoritesOnly || sortBy !== 'default';

  const resetAllFilters = () => {
    setSearchQuery('');
    setGovFilter('الجيزة');
    setCityFilter('حدائق الأهرام');
    setHadayekZoneFilter('all');
    setCategoryFilter('all');
    setShowFavoritesOnly(false);
    setSortBy('default');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans antialiased selection:bg-amber-500 selection:text-slate-950 transition-colors duration-300">

      {/* ============================================================
          🌟 1. STICKY TOP NAVBAR
          ============================================================ */}
      <header className="sticky top-0 z-50 bg-[var(--nav-bg)] backdrop-blur-xl border-b border-[var(--border-color)] transition-colors duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="md" showSubtitle={false} />
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-black text-[var(--text-secondary)]">
            <a href="#explore" className="hover:text-amber-500 transition-colors">معرض الأنشطة</a>
            <button
              type="button"
              onClick={() => openPackagesModal('pkg_free')}
              className="text-emerald-600 dark:text-emerald-400 hover:underline transition-colors flex items-center gap-1 font-black cursor-pointer"
            >
              <span>🎁</span>
              <span>الظهور المجاني (0 ج)</span>
            </button>
            <button
              type="button"
              onClick={() => openPackagesModal('pkg_basic')}
              className="text-amber-500 hover:text-amber-400 transition-all flex items-center gap-1.5 font-black cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-1.5 rounded-full border border-amber-500/30 shadow-xs active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>دليل وشرح الباقات 💎</span>
            </button>
            <button
              type="button"
              onClick={() => openPackagesModal('pkg_pro')}
              className="hover:text-amber-500 transition-colors flex items-center gap-1 font-black cursor-pointer"
            >
              <span>🚀</span>
              <span>الحملات الدعائية (حسب الطلب)</span>
            </button>
            <a href="#map" className="hover:text-amber-500 transition-colors">الخريطة المباشرة</a>
            <a href="#why-dalelak" className="hover:text-amber-500 transition-colors">لماذا دليلك؟</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openPackagesModal('pkg_basic')}
              className="md:hidden bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] font-black px-2.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
              title="دليل الباقات"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>الباقات 💎</span>
            </button>

            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="w-10 h-10 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-amber-500 transition-all cursor-pointer shadow-xs"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <a
              href="#free-listing"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all hover:shadow-emerald-500/30 hover:shadow-lg active:scale-95 cursor-pointer"
            >
              <span>🎁</span>
              <span className="hidden sm:inline">اطلب الظهور مجاناً</span>
              <span className="sm:hidden">أضف مجاناً</span>
            </a>
          </div>
        </div>
      </header>

      {/* ============================================================
          🌟 2. HERO & SEARCH HUB
          ============================================================ */}
      <section className="relative overflow-hidden pt-10 pb-8 border-b border-[var(--border-color)]">
        {/* Rich background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 via-[var(--bg-primary)] to-emerald-500/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-amber-500/8 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[350px] bg-emerald-500/6 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/4" />
        {/* Decorative dots grid */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{backgroundImage: 'radial-gradient(circle, #d4af37 1px, transparent 1px)', backgroundSize: '28px 28px'}} />

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
              </span>
              {' '}والأنشطة التجارية
            </h1>
            <p className="text-sm text-[var(--text-muted)] font-bold max-w-2xl mx-auto leading-relaxed">
              عناوين دقيقة · أرقام تواصل مباشرة · مقاطع فيديو ترويجية · مواقع معتمدة على الخريطة
            </p>
          </div>

          {/* 📣 Free Listing Reassurance Card & Direct Action */}
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-amber-500/10 border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-right animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-2xl font-bold shadow-xs">
                🎁
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-emerald-700 dark:text-emerald-300 font-black text-sm sm:text-base">
                    ظهور نشاطك في الدليل مجاني تماماً 100% وبدون أي رسوم!
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                    بدون أي اشتراكات
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-bold leading-relaxed">
                  فقط اطلب الظهور وسيتم إدراج نشاطك مجاناً. والباقات المتوفرة هي حملات دعائية حسب الطلب لتنمية مبيعاتك.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <a
                href="#free-listing"
                className="flex-1 sm:flex-initial bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-4 py-3 rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-emerald-500/30 hover:shadow-lg"
              >
                <span>اطلب الظهور مجاناً 🚀</span>
              </a>
              <button
                type="button"
                onClick={() => openPackagesModal('pkg_basic')}
                className="bg-[var(--bg-card)] hover:bg-[var(--input-bg)] border border-[var(--border-color)] hover:border-amber-500/40 text-amber-500 font-black text-xs px-3.5 py-3 rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>دليل وشرح الباقات 💎</span>
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 animate-fade-in">
            {[
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, value: publicBusinesses.length + '+', label: 'نشاط معتمد' },
              { icon: <MapPin className="w-4 h-4 text-amber-500" />, value: '12+', label: 'منطقة مغطاة' },
              { icon: <Star className="w-4 h-4 text-amber-400 fill-amber-400" />, value: '4.9', label: 'تقييم المستخدمين' },
              { icon: <ShieldCheck className="w-4 h-4 text-blue-500" />, value: '100%', label: 'بيانات موثقة' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-2 rounded-2xl shadow-sm">
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
              <div className={`relative sm:col-span-2 ${cityFilter === 'حدائق الأهرام' ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
                <Search className="w-4 h-4 text-amber-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث باسم المحل، النشاط، أو الخدمة..."
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
                    <div className="p-3 space-y-3 max-h-72 overflow-y-auto">
                      {/* Recent Searches */}
                      {!searchQuery && recentSearches.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10.5px] font-black text-[var(--text-muted)]">عمليات البحث الأخيرة</span>
                            <button
                              onClick={handleClearRecentSearches}
                              className="text-[10px] text-rose-500 hover:text-rose-400 font-black cursor-pointer flex items-center gap-0.5"
                            >
                              <Trash2 className="w-2.5 h-2.5" /> مسح
                            </button>
                          </div>
                          {recentSearches.map((s) => (
                            <button
                              key={s}
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
                          <span className="text-[10.5px] font-black text-[var(--text-muted)] block">أنشطة مطابقة:</span>
                          {searchSuggestions.businesses.map((biz) => (
                            <button
                              key={biz.id}
                              onClick={() => {
                                addRecentSearch(biz.nameAr);
                                handleOpenBusiness(biz);
                                setIsSearchFocused(false);
                              }}
                              className="w-full text-right flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-amber-500/10 transition-colors cursor-pointer"
                            >
                              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-base shrink-0">🏬</div>
                              <div className="flex-1 min-w-0">
                                <span className="font-black text-[var(--text-primary)] block truncate">{biz.nameAr}</span>
                                <span className="text-[10px] text-[var(--text-muted)] font-bold">{biz.category} · {biz.city || biz.governorate}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Matching Categories */}
                      {searchQuery && searchSuggestions.categories.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-[var(--border-color)]">
                          <span className="text-[10.5px] font-black text-[var(--text-muted)] block">تصنيفات مطابقة:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {searchSuggestions.categories.map((grp) => (
                              <button
                                key={grp.group}
                                onClick={() => {
                                  setCategoryFilter(grp.group);
                                  addRecentSearch(grp.group);
                                  setIsSearchFocused(false);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[var(--input-bg)] text-[var(--text-secondary)] text-[11px] font-bold border border-[var(--border-color)] cursor-pointer hover:border-amber-500 transition-colors"
                              >
                                {grp.icon} {grp.group}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Matching Zones */}
                      {searchQuery && searchSuggestions.zones.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-[var(--border-color)]">
                          <span className="text-[10.5px] font-black text-[var(--text-muted)] block">قطاعات حدائق الأهرام:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {searchSuggestions.zones.map((z) => (
                              <button
                                key={z}
                                onClick={() => {
                                  setCityFilter('حدائق الأهرام');
                                  setHadayekZoneFilter(z);
                                  addRecentSearch(z);
                                  setIsSearchFocused(false);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[var(--input-bg)] text-[var(--text-secondary)] text-[11px] font-bold border border-[var(--border-color)] cursor-pointer hover:border-amber-500 transition-colors"
                              >
                                📍 {z}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No results hint */}
                      {searchQuery && searchSuggestions.businesses.length === 0 && searchSuggestions.categories.length === 0 && (
                        <p className="text-center text-[var(--text-muted)] font-bold py-2">لا توجد اقتراحات مطابقة</p>
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
                  <option value="all">📍 كل المحافظات</option>
                  {EGYPT_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>📍 {g}</option>
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
                      ? '🏙️ كل المناطق والمدن'
                      : `🏙️ كل مناطق ${govFilter} (${availableCities.length})`}
                  </option>
                  {availableCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
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
                    <option value="all">🌿 كل قطاعات حدائق الأهرام ({HADAYEK_ALAHRAM_ZONES.length})</option>
                    {HADAYEK_ALAHRAM_ZONES.map((z) => (
                      <option key={z} value={z}>📍 {z}</option>
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
                  <option value="all">🏷️ كل التصنيفات</option>
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
                  <strong className="text-[var(--text-primary)] font-mono text-sm">{publicBusinesses.length}</strong> نشاط معتمد
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
                    <option value="nearest">📍 الأقرب لموقعي (GPS)</option>
                    <option value="newest">⚡ الأحدث إضافة</option>
                    <option value="has_video">🎬 يحتوي على فيديو</option>
                    <option value="open_now">🟢 مفتوح الآن</option>
                    <option value="alpha">🔤 أبجدياً (أ - ي)</option>
                  </select>
                  {isLocatingUser && <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />}
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={resetAllFilters}
                    className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-600 font-black text-xs cursor-pointer transition-colors bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-500/20"
                  >
                    <X className="w-3 h-3" /> إعادة الضبط
                  </button>
                )}

                <a
                  href="#free-listing"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-black text-xs flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/15 px-2.5 py-1.5 rounded-xl border border-emerald-500/20 transition-colors"
                >
                  <span>🎁 أضف نشاطك مجاناً</span>
                </a>
                <a
                  href="#packages"
                  className="text-amber-600 dark:text-amber-400 hover:underline font-black text-xs flex items-center gap-1"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>الحملات الدعائية 💎</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          🌟 3. DIRECTORY SHOWCASE
          ============================================================ */}
      <section id="explore" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        {/* Section Header & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <span>الأنشطة والخدمات المتاحة</span>
              {filteredBusinesses.length > 0 && (
                <span className="text-xs font-mono bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {filteredBusinesses.length}
                </span>
              )}
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-bold mt-0.5">
              تصفح الأنشطة الميدانية الموثقة مع بيانات الاتصال ومقاطع الفيديو والعناوين الدقيقة
            </p>
          </div>

          {/* Grid / Map Mode Switcher */}
          <div className="flex items-center gap-1 bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--border-color)] shadow-xs">
            <button
              onClick={() => setActiveView('grid')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                activeView === 'grid'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>عرض الشبكة</span>
            </button>
            <button
              onClick={() => setActiveView('map')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                activeView === 'map'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>الخريطة المباشرة</span>
            </button>
          </div>
        </div>

        {/* MAP VIEW */}
        {activeView === 'map' && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-3 shadow-lg animate-fade-in">
            <InteractiveMap
              businesses={filteredBusinesses}
              mode="view"
              onSelectBusiness={(b) => handleOpenBusiness(b)}
              heightClass="h-[500px] sm:h-[600px]"
            />
          </div>
        )}

        {/* GRID VIEW */}
        {activeView === 'grid' && (
          <div className="space-y-6">
            {/* Loading Shimmer */}
            {loading && businesses.length === 0 && (
              <div className="space-y-6 animate-fade-in py-2">
                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                    <div
                      className="w-11 h-11 rounded-full border-4 border-emerald-500/20 border-b-emerald-500 animate-spin absolute"
                      style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}
                    />
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center absolute text-xs">🧭</div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs sm:text-sm font-black text-[var(--text-primary)] animate-pulse">
                      {initialBizId ? 'جاري فتح وتجهيز النشاط المطلوب...' : 'جاري تحميل الأنشطة المعتمدة...'}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] font-bold">
                      يرجى الانتظار لحظات جاري استرجاع البيانات الموثقة 🌿
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={`skel-${i}`}
                      className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-xs flex flex-col animate-pulse"
                    >
                      <div className="h-56 bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900" />
                      <div className="p-4 space-y-3">
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
                        </div>
                        <div className="pt-3 border-t border-[var(--border-color)] flex items-center gap-2">
                          <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl flex-1" />
                          <div className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State - DB Empty */}
            {!loading && businesses.length === 0 && (
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-12 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-2xl">🔍</div>
                <h3 className="font-black text-base text-[var(--text-primary)]">لا توجد أنشطة تجارية مسجلة حالياً</h3>
                <p className="text-xs text-[var(--text-muted)] font-bold">سيتم إدراج الأنشطة فور اعتمادها ونشرها من إدارة المنظومة</p>
                <a
                  href="#packages"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-yellow-400 text-slate-950 font-black text-xs px-6 py-3 rounded-2xl transition-all shadow-md"
                >
                  <Award className="w-4 h-4" />
                  سجّل نشاطك الآن
                </a>
              </div>
            )}

            {/* Empty State - Filter No Results */}
            {!loading && businesses.length > 0 && filteredBusinesses.length === 0 && (
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-12 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-2xl">🔍</div>
                <h3 className="font-black text-base text-[var(--text-primary)]">لا توجد نتائج مطابقة</h3>
                <p className="text-xs text-[var(--text-muted)] font-bold">جرب تغيير خيارات الفلترة أو اختيار محافظة أخرى</p>
                <button
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-xl border border-amber-500/30 cursor-pointer transition-colors"
                >
                  إعادة ضبط خيارات البحث 🔄
                </button>
              </div>
            )}

            {/* 🃏 BUSINESSES GRID — Staggered Animation */}
            {filteredBusinesses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBusinesses.map((biz, idx) => {
                  const mainPhoto =
                    biz.coverPhoto ||
                    (biz.photos && biz.photos.length > 0
                      ? biz.photos[0]
                      : `/api/biz-og?biz=${biz.id}&v=${encodeURIComponent(biz.createdDate || biz.createdAt || '')}`);

                  const isVerified = biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced';
                  const openStatus = getBusinessOpenStatus(biz.workingHours);
                  const isFav = favorites.includes(biz.id);
                  const distanceKm = userCoords ? calculateDistanceKm(userCoords.lat, userCoords.lng, biz.lat, biz.lng) : null;
                  const hasPhotos = biz.photos && biz.photos.length > 0;
                  const hasVideos = biz.videos && biz.videos.length > 0;

                  return (
                    <div
                      key={biz.id}
                      className="group bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-amber-500/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
                      style={{ animationDelay: `${idx * 60}ms`, animation: 'fadeInUp 0.4s ease-out both' }}
                    >
                      {/* Photo Banner */}
                      <div
                        className="relative h-56 bg-slate-950 overflow-hidden cursor-pointer"
                        onClick={() => handleOpenBusiness(biz)}
                      >
                        <img
                          src={mainPhoto}
                          alt={biz.nameAr}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent" />

                        {/* Top-right: Favorite */}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(biz.id); }}
                          className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-md ${
                            isFav
                              ? 'bg-rose-600 text-white scale-110 shadow-rose-600/50'
                              : 'bg-slate-950/60 text-white/80 hover:text-white hover:bg-slate-950/80 hover:scale-105'
                          }`}
                          title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة ❤️'}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                        </button>

                        {/* Top-left: Status + Distance + Photos count */}
                        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full backdrop-blur-md border shadow-md ${openStatus.statusClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${openStatus.dotColor} ${openStatus.isOpen ? 'animate-ping' : ''}`} />
                            <span>{openStatus.badgeText}</span>
                          </span>

                          {distanceKm !== null && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-950/80 text-amber-300 border border-amber-500/30 backdrop-blur-md shadow-md">
                              <Compass className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{formatDistanceString(distanceKm)}</span>
                            </span>
                          )}
                        </div>

                        {/* Photo count badge */}
                        {hasPhotos && biz.photos!.length > 1 && (
                          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-950/70 text-white border border-white/20 backdrop-blur-md">
                              <ImageIcon className="w-2.5 h-2.5" />
                              {biz.photos!.length}
                            </span>
                          </div>
                        )}

                        {/* Video Play Button */}
                        {hasVideos && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedVideoBiz(biz); }}
                            className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-amber-500 hover:bg-yellow-400 text-slate-950 flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 z-10 cursor-pointer border-2 border-white/80"
                            title="تشغيل فيديو النشاط"
                          >
                            <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                          </button>
                        )}

                        {/* Bottom: Category + Name + Google Rating */}
                        <div className="absolute bottom-3 right-3 left-3 space-y-1" onClick={() => handleOpenBusiness(biz)}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-block bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-md">
                              {biz.category}
                            </span>
                            {biz.googleRatingEnabled && biz.googleRating && (
                              <span className="inline-flex items-center gap-1 bg-slate-950/85 border border-amber-400/40 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md backdrop-blur-md shadow-xs">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{biz.googleRating.toFixed(1)}</span>
                                {biz.googleReviewsCount !== undefined && (
                                  <span className="text-[9px] opacity-75">({biz.googleReviewsCount})</span>
                                )}
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-black text-white leading-tight truncate drop-shadow-md">
                            {biz.nameAr}
                          </h3>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between text-xs">
                        <div className="space-y-2">
                          {/* Working Hours */}
                          {biz.workingHours && (
                            <div className="flex items-center gap-2 text-[var(--text-muted)] text-[11px] font-bold">
                              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="truncate">{biz.workingHours}</span>
                            </div>
                          )}
                          {/* Address */}
                          {(biz.city || biz.street) && (
                            <div className="flex items-center gap-2 text-[var(--text-muted)] text-[11px] font-bold">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">{[biz.city, biz.governorate].filter(Boolean).join('، ')}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="pt-3 border-t border-[var(--border-color)] flex items-center gap-2">
                          <button
                            onClick={() => handleOpenBusiness(biz)}
                            className="flex-1 bg-amber-500 hover:bg-yellow-400 text-slate-950 font-black text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center shadow-xs hover:shadow-amber-500/30 hover:shadow-md active:scale-95"
                          >
                            {hasVideos ? 'التفاصيل والفيديو 🎬' : 'التفاصيل والصور 📸'}
                          </button>

                          {biz.phone && (
                            <a
                              href={`tel:${biz.phone}`}
                              className="w-9 h-9 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs border border-emerald-500/30"
                              title="اتصال هاتفياً"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}

                          {biz.googleMapsUrl && biz.googleMapsUrl.trim().startsWith('http') ? (
                            <a
                              href={biz.googleMapsUrl.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-9 h-9 rounded-xl bg-blue-500/15 hover:bg-blue-600 text-blue-600 hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs border border-blue-500/30"
                              title="فتح على خرائط Google 🗺️"
                            >
                              <Navigation className="w-4 h-4" />
                            </a>
                          ) : null}

                          <button
                            type="button"
                            onClick={(e) => handleShareBusiness(biz, e)}
                            className="w-9 h-9 rounded-xl bg-[var(--input-bg)] hover:bg-slate-200 dark:hover:bg-slate-800 text-[var(--text-muted)] flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs border border-[var(--border-color)]"
                            title="مشاركة رابط النشاط 🔗"
                          >
                            {copiedBizId === biz.id ? (
                              <CheckCheck className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ============================================================
          🌟 4. PACKAGES & CAMPAIGNS SECTION (FREE LISTING + PROMOTIONAL CAMPAIGNS)
          ============================================================ */}
      <section id="packages" className="py-14 sm:py-20 bg-gradient-to-b from-[var(--bg-primary)] via-amber-500/5 to-[var(--bg-primary)] border-t border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Main Section Header */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider bg-emerald-500/15 px-4 py-1.5 rounded-full border border-emerald-500/30 inline-flex items-center gap-2">
              <span>🎁</span>
              <span>الظهور مجاني تماماً 100% · والباقات حملات دعائية حسب الطلب</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)]">
              ظهور نشاطك التجاري في الدليل مجاني وبدون أي رسوم!
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] font-bold leading-relaxed">
              لا نفرض أي اشتراكات أو تكاليف لإدراج محلك وظهوره لآلاف الزبائن في منصة دليلك. فقط اطلب الظهور وسيتم نشره مجاناً.
              أما إذا أردت مضاعفة مبيعاتك وتصدر نتائج البحث، نوفر لك حملات دعائية احترافية حسب رغبتك واحتياجك.
            </p>
          </div>

          {/* 🌟 1. STANDALONE FREE LISTING FEATURED CARD */}
          <div id="free-listing" className="max-w-4xl mx-auto bg-gradient-to-br from-emerald-500/15 via-[var(--bg-card)] to-teal-500/10 border-2 border-emerald-500 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-emerald-500/10 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-[11px] font-black px-3 py-1 rounded-full border border-emerald-500/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>إدراج فوري دائم بدون رسوم</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                  إدراج وظهور النشاط في دليل المنصة
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] font-bold leading-relaxed">
                  متاح لجميع الأنشطة والمحلات التجارية والخدمية في كافة المحافظات دون دفع أي قرش
                </p>
              </div>

              <div className="text-right sm:text-left bg-emerald-500/15 border border-emerald-500/30 px-5 py-3 rounded-2xl shrink-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">0</span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">جنيه مصري</span>
                </div>
                <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 block mt-0.5">
                  مجاني 100% مدى الحياة 🎁
                </span>
              </div>
            </div>

            {/* Free features list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {PACKAGES[0].features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] font-bold">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 stroke-[3]" />
                  <span className="leading-relaxed">{feat}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons for Free */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <a
                href={getPackageWhatsAppUrl(PACKAGES[0])}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 py-3.5 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>اطلب ظهور نشاطك مجاناً الآن عبر واتساب 🎁</span>
              </a>

              <button
                type="button"
                onClick={() => openPackagesModal('pkg_free')}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl font-black text-xs text-emerald-600 dark:text-emerald-400 hover:text-white hover:bg-emerald-600 bg-emerald-500/10 border border-emerald-500/30 text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>استعراض الشرح في النافذة 🔍</span>
              </button>

              <a
                href="#consultation"
                onClick={() => setFormSelectedPackage(PACKAGES[0].title)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-xs text-[var(--text-secondary)] hover:text-emerald-600 dark:hover:text-emerald-400 bg-[var(--input-bg)] border border-[var(--border-color)] hover:border-emerald-500/40 text-center transition-all cursor-pointer"
              >
                تسجيل البيانات عبر النموذج
              </a>
            </div>
          </div>

          {/* 🌟 2. ON-DEMAND ADVERTISING CAMPAIGNS HEADER */}
          <div className="pt-8 text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-amber-500 text-xs font-black uppercase tracking-wider bg-amber-500/15 px-3.5 py-1.5 rounded-full border border-amber-500/30 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>حملات دعائية وترويجية (اختيارية حسب الطلب)</span>
            </span>
            <h3 className="text-xl sm:text-3xl font-black text-[var(--text-primary)]">
              باقات الحملات الدعائية والتسويق الاحترافي
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] font-bold leading-relaxed">
              هذه الباقات ليست شرطاً لظهورك في الدليل، بل هي حملات دعائية وتسويقية إضافية تكون حسب رغبتك لتعزيز مبيعاتك وتصدر نتائج البحث وجذب آلاف الزبائن الجدد.
            </p>

            {/* Launch Interactive Guide Modal Button (Matching the image) */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => openPackagesModal('pkg_basic')}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-amber-400"
              >
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>عرض الدليل والشرح التفاعلي الشامل للباقات (النافذة التفصيلية) 💎</span>
              </button>
            </div>
          </div>

          {/* 🌟 3. CAMPAIGNS GRID (The 3 standard paid promotional campaigns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto gap-6 sm:gap-7 items-stretch">
            {PACKAGES.slice(1, 4).map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all duration-300 ${
                  pkg.popular
                    ? 'bg-gradient-to-b from-amber-500/15 via-[var(--bg-card)] to-[var(--bg-card)] border-2 border-amber-500 shadow-2xl shadow-amber-500/15 scale-100 lg:scale-105 z-10'
                    : 'bg-[var(--bg-card)] border border-[var(--border-color)] shadow-md hover:border-amber-500/40'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3.5 right-1/2 translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[11px] px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-slate-950" />
                    <span>الحملة الأكثر طلباً واختياراً 🔥</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 inline-block">
                      حملة دعائية حسب الطلب
                    </span>
                    <h4 className="font-black text-lg text-[var(--text-primary)] leading-tight">{pkg.title}</h4>
                    <p className="text-xs text-[var(--text-muted)] font-bold leading-relaxed">{pkg.description}</p>
                  </div>

                  <div className="pt-2 pb-3 border-b border-[var(--border-color)]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-amber-500 font-mono">{pkg.price}</span>
                      <span className="text-xs font-bold text-[var(--text-secondary)]">جنيه مصري</span>
                    </div>
                    <span className="text-[10.5px] text-[var(--text-muted)] font-bold block mt-1">
                      {pkg.price === 2000 ? 'شامل الإدارة الشهرية الكاملة والتصوير الميداني' : 'سداد لمرة واحدة مع توثيق وفاتورة إلكترونية معتمدة'}
                    </span>
                  </div>

                  {/* Feature list */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black text-[var(--text-primary)] block">المميزات والتفاصيل الكاملة:</span>
                    <ul className="space-y-2.5 text-xs text-[var(--text-secondary)]">
                      {pkg.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 leading-relaxed">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 stroke-[2.5]" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => openPackagesModal(pkg.id)}
                    className="w-full text-center py-2.5 rounded-xl font-black text-xs bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-secondary)] hover:text-amber-500 border border-[var(--border-color)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>استعراض الشرح التفصيلي والمقارنة 🔍</span>
                  </button>

                  <a
                    href={getPackageWhatsAppUrl(pkg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full text-center py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                      pkg.popular
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black shadow-amber-500/20'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>طلب هذه الحملة الدعائية 💬</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* 🌟 4. THE FLAGSHIP 20,000 EGP ENTERPRISE LAUNCH PACKAGE */}
          {PACKAGES[4] && (
            <div className="max-w-5xl mx-auto bg-gradient-to-br from-amber-500/15 via-[var(--bg-card)] to-yellow-500/10 border-2 border-amber-500 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-amber-500/15 space-y-8 relative overflow-hidden">
              {/* Glow circle */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
              
              {/* Header */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-[var(--border-color)] pb-6 relative z-10">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-full shadow-md">
                    <Crown className="w-4 h-4 fill-slate-950" />
                    <span>باقة التأسيس والانطلاق الشامل من الصفر (للأنشطة تحت الإنشاء)</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
                    {PACKAGES[4].title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] font-bold max-w-2xl leading-relaxed">
                    {PACKAGES[4].description}
                  </p>
                </div>

                <div className="text-right lg:text-left bg-gradient-to-b from-amber-500/15 to-amber-500/5 border border-amber-500/40 p-5 rounded-2xl shrink-0 shadow-sm">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-5xl font-black text-amber-500 font-mono">20,000</span>
                    <span className="text-sm font-bold text-[var(--text-secondary)]">جنيه مصري</span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block mt-1">
                    شامل كافة التجهيزات والهوية والافتتاح والتدريب حتى استقرار الأرباح
                  </span>
                </div>
              </div>

              {/* Features in 2 columns */}
              <div className="space-y-3 relative z-10">
                <span className="text-xs font-black text-amber-500 uppercase tracking-wider block">
                  💎 كل ما تتكفل به المنظومة خطوة بخطوة حتى الحصول على الزبون المنتظم:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PACKAGES[4].features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] font-bold bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)]">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 stroke-[3]" />
                      <span className="leading-relaxed">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action CTA */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 relative z-10">
                <a
                  href={getPackageWhatsAppUrl(PACKAGES[4])}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 py-4 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Crown className="w-4 h-4 fill-slate-950" />
                  <span>طلب باقة التأسيس والانطلاق الكبرى (20,000 ج.م) عبر واتساب 💬</span>
                </a>

                <button
                  type="button"
                  onClick={() => openPackagesModal('pkg_launch_from_scratch')}
                  className="w-full sm:w-auto px-5 py-4 rounded-2xl font-black text-xs text-amber-500 hover:text-slate-950 hover:bg-amber-500 bg-amber-500/10 border border-amber-500/40 text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>استعراض الشرح في النافذة 🔍</span>
                </button>

                <a
                  href="#consultation"
                  onClick={() => setFormSelectedPackage(PACKAGES[4].title)}
                  className="w-full sm:w-auto px-5 py-4 rounded-2xl font-black text-xs text-[var(--text-secondary)] hover:text-amber-500 bg-[var(--input-bg)] border border-[var(--border-color)] hover:border-amber-500/40 text-center transition-all cursor-pointer"
                >
                  حجز موعد استشارة
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          🌟 5. WHY DALELAK
          ============================================================ */}
      <section id="why-dalelak" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-amber-500 text-xs font-black uppercase tracking-wider bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30">
            🌟 القيمة المضافة لنشاطك
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
            لماذا توثق نشاطك التجاري مع منصة دليلك؟
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: <TrendingUp className="w-6 h-6" />, color: 'amber', title: 'تصدر نتائج البحث الجغرافي', desc: 'ظهور نشاطك في أعلى اقتراحات Google عندما يبحث العملاء عن خدمات في منطقتك الجغرافية.', stat: '3x أكثر ظهوراً' },
            { icon: <Navigation className="w-6 h-6" />, color: 'emerald', title: 'توجيه GPS فوري وسهل', desc: 'تسهيل وصول الزبائن وسائقي التوصيل ومندوبي الشحن إلى باب محلك بدقة دون تيه.', stat: '100% دقة GPS' },
            { icon: <Sparkles className="w-6 h-6" />, color: 'blue', title: 'تصوير فاخر بالذكاء الاصطناعي', desc: 'تحسين إضاءة وألوان وتباين صور واجهة نشاطك لتبدو بمظهر تسويقي فندقي يجذب الأنظار.', stat: '+200% جاذبية' },
            { icon: <ShieldCheck className="w-6 h-6" />, color: 'purple', title: 'ثقة ومصداقية وفاتورة رسمية', desc: 'الحصول على فاتورة توثيق رسمية برمز QR وشارة التوثيق المعتمدة التي تزيد ثقة العملاء.', stat: 'شارة معتمدة' },
          ].map((item, i) => (
            <div
              key={i}
              className={`bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-3xl space-y-3 shadow-sm hover:border-${item.color}-500/40 hover:-translate-y-1 hover:shadow-lg transition-all duration-300`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-${item.color}-500/15 text-${item.color}-500 flex items-center justify-center font-bold`}>
                {item.icon}
              </div>
              <div>
                <h3 className="font-black text-sm text-[var(--text-primary)]">{item.title}</h3>
                <span className={`text-[10px] font-black text-${item.color}-600 dark:text-${item.color}-400 bg-${item.color}-500/10 px-2 py-0.5 rounded-full border border-${item.color}-500/20 inline-block mt-1`}>{item.stat}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-bold leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          🌟 6. CONSULTATION & REQUEST FORM
          ============================================================ */}
      <section id="consultation" className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-gradient-to-br from-amber-500/15 via-[var(--bg-card)] to-yellow-500/15 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-9 space-y-6 shadow-xl text-center">
          <div className="space-y-2">
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 inline-block">
              🎁 الظهور مجاني 100% · والحملات الدعائية حسب الطلب
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
              جاهز للانضمام؟ اطلب الظهور المجاني أو احجز حملتك الدعائية الآن 📍
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-bold">
              سجل بياناتك وسيتواصل معك المندوب المعتمد لمحافظتك لتأكيد الظهور المجاني في الدليل أو ترتيب الحملة الدعائية المطلوبة
            </p>
          </div>

          {consultSuccess && (
            <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-800 dark:text-emerald-300 p-3.5 rounded-2xl text-xs font-black animate-fade-in">
              ✅ تم تجهيز طلبك وسيتم فتح تطبيق WhatsApp للتواصل المباشر مع فريق المنظومة!
            </div>
          )}

          <form onSubmit={handleConsultationSubmit} className="space-y-4 text-right">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[var(--text-primary)] font-black mb-1">اسم المحل أو النشاط التجاري *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مطعم الشرق، صيدلية الأمل..."
                  value={formBizName}
                  onChange={(e) => setFormBizName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-bold text-[var(--text-primary)] shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--text-primary)] font-black mb-1">اسم صاحب النشاط / المسؤول</label>
                <input
                  type="text"
                  placeholder="اسم حضرتك"
                  value={formOwnerName}
                  onChange={(e) => setFormOwnerName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-bold text-[var(--text-primary)] shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--text-primary)] font-black mb-1">رقم الهاتف (واتساب) للتواصل *</label>
                <input
                  type="tel"
                  required
                  placeholder="010XXXXXXXX"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono font-bold text-[var(--text-primary)] dir-ltr text-right shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--text-primary)] font-black mb-1">المحافظة *</label>
                <select
                  value={formGov}
                  onChange={(e) => setFormGov(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 focus:outline-none focus:border-amber-500 font-bold text-[var(--text-primary)] shadow-xs cursor-pointer"
                >
                  {EGYPT_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[var(--text-primary)] font-black text-xs">نوع الطلب (الظهور المجاني أو الحملة الدعائية)</label>
                <button
                  type="button"
                  onClick={() => openPackagesModal('pkg_basic')}
                  className="text-[11px] font-black text-amber-500 hover:text-amber-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>دليل وشرح تفاصيل الباقات 💎</span>
                </button>
              </div>
              <select
                value={formSelectedPackage}
                onChange={(e) => setFormSelectedPackage(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 focus:outline-none focus:border-amber-500 font-bold text-amber-600 dark:text-amber-400 text-xs shadow-xs cursor-pointer"
              >
                {PACKAGES.map((p) => (
                  <option key={p.id} value={p.title}>
                    {p.price === 0 ? `🎁 ${p.title} (مجاناً 0 ج.م)` : `🚀 ${p.title} (${p.price} ج.م)`}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer hover:shadow-amber-500/30 hover:shadow-2xl"
            >
              <Send className="w-4 h-4" />
              <span>
                {formSelectedPackage.includes('مجاني') || formSelectedPackage.includes('0')
                  ? 'إرسال طلب الظهور المجاني في الدليل 🎁'
                  : 'إرسال طلب الحملة الدعائية والتواصل مع المندوب 🚀'}
              </span>
            </button>
          </form>
        </div>
      </section>

      {/* ============================================================
          🌟 6.5. FOOTER
          ============================================================ */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--nav-bg)] py-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-right">
            {/* Col 1: About */}
            <div className="space-y-3">
              <Logo size="md" showSubtitle={true} />
              <p className="text-[var(--text-muted)] font-bold leading-relaxed">
                منصة دليلك الرقمية للأنشطة التجارية والميدانية المعتمدة. دليلك الموثوق للوصول لأفضل المحلات والخدمات في مصر.
              </p>
            </div>

            {/* Col 2: Free Listing Notice */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm">
                <span>🎁</span>
                <span>الظهور المجاني في الدليل</span>
              </div>
              <p className="text-[var(--text-muted)] font-bold leading-relaxed">
                إدراج وظهور النشاط التجاري في دليل منصة دليلك مجاني تماماً 100% وبدون أي رسوم أو اشتراكات شهرية أو سنوية.
              </p>
              <a
                href="#free-listing"
                className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black hover:underline"
              >
                <span>اطلب الظهور مجاناً الآن ←</span>
              </a>
            </div>

            {/* Col 3: Promotional Campaigns */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
                <span>🚀</span>
                <span>الحملات الدعائية (حسب الطلب)</span>
              </div>
              <p className="text-[var(--text-muted)] font-bold leading-relaxed">
                حملات تسويقية وترويجية اختيارية لتصدر نتائج بحث Google والخرائط وتأسيس المنصات الرقمية وتنمية المبيعات.
              </p>
              <a
                href="#packages"
                className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-black hover:underline"
              >
                <span>استعراض مميزات الحملات ←</span>
              </a>
            </div>

            {/* Col 4: Quick Links & Contact */}
            <div className="space-y-3">
              <h4 className="font-black text-[var(--text-primary)] text-sm">روابط وتواصل سريع</h4>
              <ul className="space-y-2 text-[var(--text-secondary)] font-bold">
                <li><a href="#explore" className="hover:text-amber-500 transition-colors">معرض الأنشطة والخدمات</a></li>
                <li><a href="#map" className="hover:text-amber-500 transition-colors">الخريطة المباشرة</a></li>
                <li><a href="#why-dalelak" className="hover:text-amber-500 transition-colors">لماذا توثق في دليلك؟</a></li>
                <li><a href="#consultation" className="hover:text-amber-500 transition-colors">تسجيل طلب جديد</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[var(--border-color)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right text-[11px] text-[var(--text-muted)] font-bold">
            <p>© {new Date().getFullYear()} منصة دليلك · جميع الحقوق محفوظة | الظهور مجاني تماماً 100%</p>
            <p className="flex items-center justify-center gap-1">
              <span>تواصل مباشر:</span>
              <a href="https://wa.me/201143888355" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline dir-ltr font-mono font-bold">
                +20 114 388 8355
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* ============================================================
          🌟 7. BUSINESS DETAILS MODAL
          ============================================================ */}
      {selectedBiz && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-fade-in-scale my-auto max-h-[92vh] flex flex-col text-right text-xs">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 truncate">
                {selectedBiz.verificationStatus === 'verified' || selectedBiz.googleSyncStatus === 'synced' ? (
                  <span className="bg-emerald-600 text-white text-[10.5px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>نشاط معتمد</span>
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10.5px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>قيد المراجعة</span>
                  </span>
                )}
                <h3 className="font-black text-base text-[var(--text-primary)] truncate">{selectedBiz.nameAr}</h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleFavorite(selectedBiz.id)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border shadow-xs ${
                    favorites.includes(selectedBiz.id)
                      ? 'bg-rose-500/20 text-rose-500 border-rose-500/40'
                      : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 border-[var(--border-color)]'
                  }`}
                  title={favorites.includes(selectedBiz.id) ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة ❤️'}
                >
                  <Heart className={`w-4 h-4 ${favorites.includes(selectedBiz.id) ? 'fill-current text-rose-500' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={(e) => handleShareBusiness(selectedBiz, e)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-600 dark:text-amber-400 font-black text-xs flex items-center gap-1.5 transition-all border border-amber-500/30 cursor-pointer shadow-xs"
                  title="مشاركة رابط هذا النشاط"
                >
                  {copiedBizId === selectedBiz.id ? (
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedBizId === selectedBiz.id ? 'تم النسخ!' : 'مشاركة'}</span>
                </button>

                <button
                  onClick={handleCloseBusiness}
                  className="w-8 h-8 rounded-full bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center cursor-pointer transition-all"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview Banner */}
            {(isPreviewMode || (selectedBiz.verificationStatus !== 'verified' && selectedBiz.googleSyncStatus !== 'synced')) && (
              <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs font-black">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>معاينة فورية: هذا النشاط مسجل بنجاح 🌿 — قيد المراجعة الإدارية والاعتماد للنشر على الخريطة العامة ⏳</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Hero Image */}
              <div className="space-y-3">
                <div
                  onClick={() => setPreviewPhotoIndex(0)}
                  className="group relative h-56 sm:h-64 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 shadow-md border border-[var(--border-color)] cursor-pointer"
                  title="انقر لتكبير الصور 🔍"
                >
                  <img
                    src={
                      selectedBiz.coverPhoto ||
                      (selectedBiz.photos && selectedBiz.photos.length > 0
                        ? selectedBiz.photos[0]
                        : `/api/biz-og?biz=${selectedBiz.id}&v=${encodeURIComponent(selectedBiz.createdDate || selectedBiz.createdAt || '')}`)
                    }
                    alt={selectedBiz.nameAr}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                  <div className="absolute top-3 right-3 left-3 flex items-center justify-between z-10">
                    <span className="bg-slate-950/80 backdrop-blur-md text-amber-400 text-[11px] font-black px-3 py-1 rounded-full border border-amber-500/30 shadow-md">
                      {selectedBiz.category}
                    </span>

                    {selectedBiz.videos && selectedBiz.videos.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedVideoBiz(selectedBiz); }}
                        className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg hover:scale-105 transition-transform cursor-pointer border border-amber-400/60"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>تشغيل الفيديو (30ث) 🎬</span>
                      </button>
                    )}
                  </div>

                  <div className="absolute bottom-3.5 right-4 left-4 text-white space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-md">
                      {selectedBiz.nameAr}
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          {selectedBiz.city ? `${selectedBiz.city}، ` : ''}
                          {selectedBiz.governorate}
                        </span>
                      </p>
                      {selectedBiz.googleRatingEnabled && selectedBiz.googleRating && (
                        <div className="inline-flex items-center gap-1 bg-slate-950/80 border border-amber-400/50 text-amber-300 px-2 py-0.5 rounded-lg text-xs font-black backdrop-blur-md shadow-sm">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{selectedBiz.googleRating.toFixed(1)}</span>
                          <span className="text-[10px] text-slate-300">
                            ({selectedBiz.googleReviewsCount || 0} تقييم على Google)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Photo Thumbnails */}
                {selectedBiz.photos && selectedBiz.photos.length > 1 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {selectedBiz.photos.slice(0, 4).map((ph, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewPhotoIndex(idx)}
                        className={`relative h-20 rounded-xl overflow-hidden bg-slate-950 border transition-all cursor-pointer shadow-xs group ${
                          previewPhotoIndex === idx ? 'border-amber-500 ring-2 ring-amber-500/50' : 'border-[var(--border-color)] hover:border-amber-500'
                        }`}
                        title="انقر لتكبير الصورة"
                      >
                        <img
                          src={ph}
                          alt={`صورة ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Google Maps Hub */}
              <div className="space-y-3">
                {selectedBiz.googleMapsUrl && selectedBiz.googleMapsUrl.trim().startsWith('http') ? (
                  <div className="bg-gradient-to-br from-emerald-500/10 via-[var(--bg-card)] to-teal-500/10 border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white shadow-md p-2 flex items-center justify-center shrink-0 border border-slate-200">
                          <svg className="w-7 h-7" viewBox="0 0 48 48">
                            <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-[var(--text-primary)]">تقييمات ومراجعات خرائط Google</span>
                            <span className="bg-emerald-600 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full">موثق ✓</span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] font-bold pt-0.5">
                            التقييمات الحية الصادرة من زوار وعملاء النشاط
                          </p>
                        </div>
                      </div>

                      <a
                        href={selectedBiz.googleMapsUrl.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shrink-0"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>فتح على Google Maps 🚀</span>
                      </a>
                    </div>

                    {/* Google Authentic Rating & Reviews Breakdown */}
                    {selectedBiz.googleRatingEnabled && selectedBiz.googleRating && (() => {
                      const rating = Math.min(5, Math.max(1, selectedBiz.googleRating));
                      const reviewsCount = selectedBiz.googleReviewsCount || 0;
                      
                      const s5 = Math.min(95, Math.max(15, Math.round((rating >= 4.5 ? 0.65 + (rating - 4.5) * 0.6 : rating / 5 * 0.7) * 100)));
                      const s4 = Math.min(100 - s5, Math.max(2, Math.round((100 - s5) * 0.65)));
                      const s3 = Math.min(100 - s5 - s4, Math.max(1, Math.round((100 - s5 - s4) * 0.5)));
                      const s2 = Math.min(100 - s5 - s4 - s3, Math.max(1, Math.round((100 - s5 - s4 - s3) * 0.5)));
                      const s1 = Math.max(1, 100 - s5 - s4 - s3 - s2);
                      const breakdown = [
                        { stars: 5, pct: s5 },
                        { stars: 4, pct: s4 },
                        { stars: 3, pct: s3 },
                        { stars: 2, pct: s2 },
                        { stars: 1, pct: s1 },
                      ];

                      return (
                        <div className="bg-[var(--input-bg)] border border-amber-500/25 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
                          <div className="flex items-center justify-between gap-2 border-b border-[var(--border-color)]/60 pb-2.5">
                            <span className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              <span>تقييم خرائط Google الرسمي للنشاط</span>
                            </span>
                            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              تقييم معتمد ⭐
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            {/* Score & Stars */}
                            <div className="flex flex-col items-center sm:items-start text-center sm:text-right shrink-0">
                              <span className="text-4xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight leading-none">
                                {rating.toFixed(1)}
                              </span>
                              <div className="flex items-center gap-1 my-1.5" dir="ltr">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-4 h-4 ${
                                      s <= Math.floor(rating)
                                        ? 'text-amber-400 fill-amber-400'
                                        : s === Math.ceil(rating) && rating % 1 >= 0.3
                                        ? 'text-amber-400 fill-amber-400/60'
                                        : 'text-slate-400 dark:text-slate-700'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[11px] font-bold text-[var(--text-muted)]">
                                استناداً إلى {reviewsCount > 0 ? reviewsCount.toLocaleString('ar-EG') : 'الـ'} تقييم ومراجعة
                              </span>
                            </div>

                            {/* Horizontal Distribution Bars */}
                            <div className="w-full sm:flex-1 space-y-1.5 max-w-xs" dir="ltr">
                              {breakdown.map((item) => (
                                <div key={item.stars} className="flex items-center gap-2 text-[10px] font-bold">
                                  <span className="w-2.5 text-slate-400 text-center">{item.stars}</span>
                                  <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
                                      style={{ width: `${item.pct}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <a
                        href={selectedBiz.googleMapsUrl.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-emerald-500/30 hover:border-emerald-500 flex items-center justify-between gap-3 group transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                            <Star className="w-4 h-4 fill-current" />
                          </div>
                          <div>
                            <span className="font-black text-xs text-[var(--text-primary)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 block transition-colors">قراءة المراجعات والآراء</span>
                            <span className="text-[10px] text-[var(--text-muted)] font-bold">مشاهدة تعليقات العملاء</span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-emerald-500 group-hover:translate-x-[-2px] transition-transform shrink-0" />
                      </a>

                      <a
                        href={selectedBiz.googleMapsUrl.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-amber-500/30 hover:border-amber-500 flex items-center justify-between gap-3 group transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                            <MessageCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-black text-xs text-[var(--text-primary)] group-hover:text-amber-600 dark:group-hover:text-amber-400 block transition-colors">كتابة تقييم جديد</span>
                            <span className="text-[10px] text-[var(--text-muted)] font-bold">شارك تجربتك على Google</span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-amber-500 group-hover:translate-x-[-2px] transition-transform shrink-0" />
                      </a>
                    </div>
                  </div>
                ) : selectedBiz.googleRatingEnabled && selectedBiz.googleRating ? (
                  <div className="bg-gradient-to-br from-amber-500/10 via-[var(--bg-card)] to-yellow-500/10 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white shadow-md p-2 flex items-center justify-center shrink-0 border border-slate-200">
                          <svg className="w-7 h-7" viewBox="0 0 48 48">
                            <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-[var(--text-primary)]">تقييم خرائط Google المعتمد</span>
                            <span className="bg-amber-500 text-slate-950 text-[9.5px] font-black px-2 py-0.5 rounded-full">معتمد ⭐</span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] font-bold pt-0.5">
                            التقييم الفعلي المعتمد للنشاط على خرائط Google
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Google Authentic Rating & Reviews Breakdown */}
                    {(() => {
                      const rating = Math.min(5, Math.max(1, selectedBiz.googleRating));
                      const reviewsCount = selectedBiz.googleReviewsCount || 0;
                      const s5 = Math.min(95, Math.max(15, Math.round((rating >= 4.5 ? 0.65 + (rating - 4.5) * 0.6 : rating / 5 * 0.7) * 100)));
                      const s4 = Math.min(100 - s5, Math.max(2, Math.round((100 - s5) * 0.65)));
                      const s3 = Math.min(100 - s5 - s4, Math.max(1, Math.round((100 - s5 - s4) * 0.5)));
                      const s2 = Math.min(100 - s5 - s4 - s3, Math.max(1, Math.round((100 - s5 - s4 - s3) * 0.5)));
                      const s1 = Math.max(1, 100 - s5 - s4 - s3 - s2);
                      const breakdown = [
                        { stars: 5, pct: s5 },
                        { stars: 4, pct: s4 },
                        { stars: 3, pct: s3 },
                        { stars: 2, pct: s2 },
                        { stars: 1, pct: s1 },
                      ];

                      return (
                        <div className="bg-[var(--input-bg)] border border-amber-500/25 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex flex-col items-center sm:items-start text-center sm:text-right shrink-0">
                              <span className="text-4xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight leading-none">
                                {rating.toFixed(1)}
                              </span>
                              <div className="flex items-center gap-1 my-1.5" dir="ltr">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-4 h-4 ${
                                      s <= Math.floor(rating)
                                        ? 'text-amber-400 fill-amber-400'
                                        : s === Math.ceil(rating) && rating % 1 >= 0.3
                                        ? 'text-amber-400 fill-amber-400/60'
                                        : 'text-slate-400 dark:text-slate-700'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[11px] font-bold text-[var(--text-muted)]">
                                استناداً إلى {reviewsCount > 0 ? reviewsCount.toLocaleString('ar-EG') : 'الـ'} تقييم ومراجعة
                              </span>
                            </div>

                            <div className="w-full sm:flex-1 space-y-1.5 max-w-xs" dir="ltr">
                              {breakdown.map((item) => (
                                <div key={item.stars} className="flex items-center gap-2 text-[10px] font-bold">
                                  <span className="w-2.5 text-slate-400 text-center">{item.stars}</span>
                                  <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
                                      style={{ width: `${item.pct}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="p-4 rounded-3xl bg-[var(--input-bg)] border border-amber-500/40 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="font-black text-xs text-[var(--text-primary)]">حالة التوثيق ومراجعات Google Maps</span>
                      </div>
                      <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/30">
                        قيد المراجعة ⏳
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed">
                      جاري استكمال إجراءات توثيق وربط هذا النشاط على خرائط Google الرسمية، وسيتم تفعيل صندوق التقييمات فور اعتماده.
                    </p>
                  </div>
                )}
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {(() => {
                  const status = getBusinessOpenStatus(selectedBiz.workingHours);
                  return (
                    <div className="bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--border-color)] flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10.5px] text-[var(--text-muted)] font-bold block">مواعيد العمل:</span>
                          <span className={`inline-flex items-center gap-1 text-[9.5px] font-black px-2 py-0.5 rounded-full border ${status.statusClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                            <span>{status.badgeText}</span>
                          </span>
                        </div>
                        <span className="font-black text-[var(--text-primary)] block">
                          {selectedBiz.workingHours || 'يومياً على مدار الساعة'}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--border-color)] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10.5px] text-[var(--text-muted)] font-bold block">العنوان والموقع:</span>
                    <span className="font-bold text-[var(--text-primary)] leading-tight block">
                      {(() => {
                        const rawStreet = (selectedBiz.street || '').trim();
                        const isGeneric = !rawStreet || rawStreet.includes('الموقع الجغرافي المسجل') || rawStreet.includes('الموقع المسجل');
                        if (isGeneric) {
                          return [selectedBiz.city, selectedBiz.governorate].filter(Boolean).join('، ');
                        }
                        let full = [rawStreet, selectedBiz.city, selectedBiz.governorate].filter(Boolean).join('، ');
                        if (selectedBiz.landmark) full += ` (بجوار ${selectedBiz.landmark})`;
                        return full;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedBiz.description && (
                <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)] space-y-1.5">
                  <span className="text-[11px] text-amber-500 font-black block">نبذة وتفاصيل النشاط:</span>
                  <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                    {selectedBiz.description}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Action Footer */}
            <div className="p-3.5 sm:p-4 bg-[var(--input-bg)] border-t border-[var(--border-color)] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
              <a
                href={getSmartWhatsAppUrl(selectedBiz)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[125px] bg-emerald-500/15 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-500/40 font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>واتساب</span>
              </a>

              {selectedBiz.phone && (
                <a
                  href={`tel:${selectedBiz.phone}`}
                  className="flex-1 min-w-[110px] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  <Phone className="w-4 h-4" />
                  <span>{selectedBiz.phone}</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => handleDownloadVCard(selectedBiz)}
                className={`flex-1 min-w-[110px] text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 font-black transition-all active:scale-95 cursor-pointer shadow-xs border ${
                  vCardDownloadedBizId === selectedBiz.id
                    ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-amber-500/50'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{vCardDownloadedBizId === selectedBiz.id ? 'تم الحفظ ✓' : 'حفظ جهة الاتصال'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          🌟 8. PHOTO LIGHTBOX
          ============================================================ */}
      {selectedBiz && previewPhotoIndex !== null && currentPhotos.length > 0 && (
        <div
          className="fixed inset-0 z-[99999] bg-slate-950/97 backdrop-blur-md flex items-center justify-center animate-fade-in"
          onClick={() => setPreviewPhotoIndex(null)}
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX === null) return;
            const delta = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(delta) > 50) { delta > 0 ? handlePrevPhoto() : handleNextPhoto(); }
            setTouchStartX(null);
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); handlePrevPhoto(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-800/80 hover:bg-amber-500 text-white hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-xl"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <img
            src={currentPhotos[previewPhotoIndex]}
            alt={`صورة ${previewPhotoIndex + 1}`}
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => { e.stopPropagation(); handleNextPhoto(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-800/80 hover:bg-amber-500 text-white hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-xl"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => setPreviewPhotoIndex(null)}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-slate-800/80 hover:bg-rose-600 text-white flex items-center justify-center cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {currentPhotos.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setPreviewPhotoIndex(i); }}
                className={`rounded-full transition-all cursor-pointer ${i === previewPhotoIndex ? 'w-6 h-2 bg-amber-500' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>

          <span className="absolute bottom-4 right-4 text-white/70 text-xs font-bold">
            {previewPhotoIndex + 1} / {currentPhotos.length}
          </span>
        </div>
      )}

      {/* ============================================================
          🌟 9. VIDEO MODAL
          ============================================================ */}
      {selectedVideoBiz && (
        <VideoPlayerModal
          business={selectedVideoBiz}
          onClose={() => setSelectedVideoBiz(null)}
        />
      )}

      {/* ============================================================
          🌟 9.5. PACKAGES GUIDE MODAL (طراز موقع الحسابات)
          ============================================================ */}
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

      {/* ============================================================
          🌟 10. TOAST NOTIFICATIONS
          ============================================================ */}
      {shareToastText && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/95 text-white border border-amber-500/30 backdrop-blur-xl text-xs font-black shadow-2xl toast-slide-down"
          style={{ direction: 'rtl' }}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>{shareToastText}</span>
        </div>
      )}

      {/* ============================================================
          🌟 11. FLOATING WHATSAPP BUTTON
          ============================================================ */}
      <a
        href={`https://wa.me/201143888355?text=${encodeURIComponent(
          `مرحباً دليلك 👋 أود الاستفسار عن توثيق نشاطي التجاري على خرائط Google` +
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
