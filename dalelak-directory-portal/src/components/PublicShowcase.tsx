import React, { useState, useEffect, useMemo } from 'react';
import { Business, PackageOption } from '../types';
import { EGYPT_GOVERNORATES, CATEGORY_GROUPS, PACKAGES } from '../data/mockData';
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
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { VideoWatermarkBadge } from './VideoWatermarkBadge';
import { VideoPlayerModal } from './VideoPlayerModal';

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

  // Search and Filters (Default to 'الجيزة' for targeted launch)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [govFilter, setGovFilter] = useState<string>('الجيزة');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeView, setActiveView] = useState<'grid' | 'map'>('grid');

  // Selected Business for Detail Modal
  const [selectedBiz, setSelectedBiz] = useState<Business | null>(null);
  const [selectedVideoBiz, setSelectedVideoBiz] = useState<Business | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [copiedBizId, setCopiedBizId] = useState<string | null>(null);
  const [shareToastText, setShareToastText] = useState<string | null>(null);

  // Quick Consultation Form State (Default to 'الجيزة')
  const [formBizName, setFormBizName] = useState<string>('');
  const [formOwnerName, setFormOwnerName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formGov, setFormGov] = useState<string>('الجيزة');
  const [formSelectedPackage, setFormSelectedPackage] = useState<string>(PACKAGES[1].title);
  const [consultSuccess, setConsultSuccess] = useState<boolean>(false);

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
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
    } catch {}
  };

  // Share Business Direct Link
  const handleShareBusiness = (biz: Business, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?biz=${biz.id}`;
    const shareTitle = `نشاط ${biz.nameAr} على منصة دليلك المعتمدة 🗺️`;
    const shareText = `شاهد تفاصيل وموقع نشاط "${biz.nameAr}" المعتمد في ${biz.governorate}:`;

    if (navigator.share) {
      navigator
        .share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      try {
        navigator.clipboard.writeText(shareUrl);
        setCopiedBizId(biz.id);
        setShareToastText('تم نسخ رابط النشاط المباشر بنجاح! 📋');
        setTimeout(() => {
          setCopiedBizId(null);
          setShareToastText(null);
        }, 3000);
      } catch {}
    }
  };

  // All registered businesses for the comprehensive public directory
  const publicBusinesses = useMemo(() => {
    return businesses;
  }, [businesses]);

  // Filtered Businesses
  const filteredBusinesses = useMemo(() => {
    return publicBusinesses.filter((b) => {
      if (!b) return false;
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
  }, [publicBusinesses, searchQuery, govFilter, categoryFilter]);

  // Dynamic WhatsApp Message generator for Package Orders
  const getPackageWhatsAppUrl = (pkg: PackageOption) => {
    const defaultPhone = '201143888355';
    let text = `مرحباً دليلك 👋\nأرغب في الاستفسار والاشتراك في "${pkg.title}" بقيمة (${pkg.price} ج.م) لتوثيق وتطوير نشاطي التجاري على خرائط Google.`;
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
    let text = `السلام عليكم ورحمة الله وبركاته 🌿\nأرغب في حجز زيارة ميدانية وتوثيق نشاطي التجاري:\n`;
    text += `🏬 اسم النشاط: ${formBizName.trim()}\n`;
    if (formOwnerName) text += `👤 المسؤول: ${formOwnerName.trim()}\n`;
    text += `📱 رقم التواصل: ${formPhone.trim()}\n`;
    text += `📍 المحافظة: ${formGov}\n`;
    text += `💎 الباقة المفضلة: ${formSelectedPackage}\n`;
    if (referralCode) text += `🔖 كود الإحالة: ${referralCode}\n`;

    setConsultSuccess(true);
    setTimeout(() => {
      window.open(`https://wa.me/${defaultPhone}?text=${encodeURIComponent(text)}`, '_blank');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans antialiased selection:bg-amber-500 selection:text-slate-950 transition-colors duration-300">
      {/* 🌟 1. PUBLIC SHOWCASE TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-[var(--nav-bg)] backdrop-blur-xl border-b border-[var(--border-color)] transition-colors duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div className="hidden sm:block">
              <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10.5px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>دليل الأنشطة والخدمات المعتمدة</span>
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-black text-[var(--text-secondary)]">
            <a href="#explore" className="hover:text-amber-500 transition-colors flex items-center gap-1">
              <span>معرض الأنشطة</span>
            </a>
            <a href="#packages" className="hover:text-amber-500 transition-colors flex items-center gap-1">
              <span>باقات التوثيق</span>
            </a>
            <a href="#map" className="hover:text-amber-500 transition-colors flex items-center gap-1">
              <span>الخريطة المباشرة</span>
            </a>
            <a href="#why-dalelak" className="hover:text-amber-500 transition-colors flex items-center gap-1">
              <span>لماذا دليلك؟</span>
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="w-10 h-10 rounded-2xl bg-[var(--input-bg)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-amber-500 transition-all cursor-pointer shadow-xs"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Direct WhatsApp CTA */}
            <a
              href={`https://wa.me/201143888355?text=${encodeURIComponent(
                `مرحباً دليلك 👋 أود الاستفسار عن توثيق نشاطي التجاري على خرائط Google` +
                  (referralCode ? ` (كود: ${referralCode})` : '')
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white/20" />
              <span className="hidden sm:inline">طلب توثيق فوري</span>
              <span className="sm:hidden">واتساب</span>
            </a>
          </div>
        </div>
      </header>

      {/* 🌟 2. ULTRA-COMPACT SLIM HERO BANNER */}
      <section className="relative overflow-hidden py-3 sm:py-4 border-b border-[var(--border-color)] bg-gradient-to-r from-amber-500/10 via-[var(--bg-primary)] to-amber-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-[var(--text-primary)] flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                <span>دليل المحلات والأنشطة التجارية والخدمات المعتمدة</span>
              </h1>
              <p className="text-[11px] text-[var(--text-muted)] font-bold">
                تصفح المحلات والخدمات المسجلة واكتشف أرقام التواصل ومواقعها المعتمدة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#packages"
              className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-black px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>أصحاب الأنشطة: باقات التوثيق 💎</span>
            </a>
          </div>
        </div>
      </section>

      {/* 🌟 3. SEARCH & DIRECTORY SHOWCASE SECTION */}
      <section id="explore" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <div className="space-y-0.5">
            <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              <span>استعراض الأنشطة والخدمات المتاحة</span>
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] font-bold">
              تصفح الأنشطة المسجلة مع بيانات التواصل والعنوان الدقيق وموقعها المعتمد على الخريطة
            </p>
          </div>

          {/* Grid / Map Toggle */}
          <div className="flex items-center gap-1 bg-[var(--input-bg)] p-1 rounded-xl border border-[var(--border-color)]">
            <button
              onClick={() => setActiveView('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                activeView === 'grid'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>شبكة الأنشطة</span>
            </button>
            <button
              onClick={() => setActiveView('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
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

        {/* Search & Multi-Filters Toolbar */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-3.5 sm:p-5 shadow-md space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
            {/* Search input */}
            <div className="relative">
              <Search className="w-4 h-4 text-amber-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث باسم المحل، النشاط، أو المدينة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl pr-10 pl-3.5 py-2.5 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500 transition-colors shadow-xs"
              />
            </div>

            {/* Sub-grid for Gov and Category: 2 columns on mobile */}
            <div className="grid grid-cols-2 gap-2 md:col-span-2">
              {/* Governorate selector */}
              <div>
                <select
                  value={govFilter}
                  onChange={(e) => setGovFilter(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-2.5 sm:px-3.5 py-2.5 text-[11px] sm:text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500 transition-colors shadow-xs cursor-pointer"
                >
                  <option value="all">📍 المحافظات ({EGYPT_GOVERNORATES.length})</option>
                  {EGYPT_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category selector */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl px-2.5 sm:px-3.5 py-2.5 text-[11px] sm:text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-amber-500 transition-colors shadow-xs cursor-pointer"
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
          </div>

          <div className="flex items-center justify-between text-xs px-1 pt-2 border-t border-[var(--border-color)]">
            {isActuallyLoading ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-500 font-bold animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>جاري جلب وتحديث الأنشطة والدليل الميداني...</span>
              </span>
            ) : (
              <span className="text-[11px] text-[var(--text-muted)] font-bold">
                عرض <strong className="text-amber-500 font-mono">{filteredBusinesses.length}</strong> من إجمالي{' '}
                <strong className="text-[var(--text-primary)] font-mono">{publicBusinesses.length}</strong> نشاط ومحل مسجل
              </span>
            )}
            {!isActuallyLoading && (searchQuery || govFilter !== 'all' || categoryFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setGovFilter('all');
                  setCategoryFilter('all');
                }}
                className="text-rose-500 hover:underline cursor-pointer font-black"
              >
                عرض كافة المحافظات ✕
              </button>
            )}
          </div>
        </div>

        {/* SHOWCASE VIEW 1: INTERACTIVE MAP */}
        {activeView === 'map' && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-3 shadow-lg animate-fade-in">
            <InteractiveMap
              businesses={filteredBusinesses}
              mode="view"
              onSelectBusiness={(b) => handleOpenBusiness(b)}
              heightClass="h-[480px] sm:h-[560px]"
            />
          </div>
        )}

        {/* SHOWCASE VIEW 2: BUSINESSES GRID */}
        {activeView === 'grid' && (
          <div className="space-y-6">
            {/* 1. INTERACTIVE FULL LOADING STATE WITH BLUR & SPINNER */}
            {loading && businesses.length === 0 && (
              <div className="relative rounded-3xl overflow-hidden min-h-[420px] flex flex-col items-center justify-center p-8 sm:p-12 border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-[var(--bg-card)] to-amber-500/5 shadow-xl space-y-6 animate-fade-in">
                {/* Glowing Spinner Centerpiece */}
                <div className="relative flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                  <div className="w-14 h-14 rounded-full border-4 border-emerald-500/20 border-b-emerald-500 animate-spin absolute" style={{ animationDirection: 'reverse', animationDuration: '1.2s' }} />
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center absolute text-amber-500 font-bold text-sm">
                    🗺️
                  </div>
                </div>

                <div className="text-center space-y-2 max-w-md">
                  <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)] animate-pulse">
                    {initialBizId ? 'جاري فتح وتحضير النشاط المطلوب مباشرة...' : 'جاري الاتصال السحابي واستجلاب بيانات الدليل المعتمد...'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-bold leading-relaxed">
                    يتم التحقق من قاعدة البيانات والمزامنة الحية لعرض أحدث الأنشطة والمواقع الموثقة بدقة
                  </p>
                </div>

                {/* Shimmer Preview Bars */}
                <div className="w-full max-w-md space-y-2.5 pt-2">
                  <div className="h-3 bg-amber-500/15 rounded-full w-full animate-pulse" />
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full w-3/4 mx-auto animate-pulse" />
                </div>
              </div>
            )}

            {/* 2. EMPTY STATE (Only when loading has truly finished and DB is empty) */}
            {!loading && businesses.length === 0 && (
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-12 text-center space-y-3 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-xl font-bold">
                  🔍
                </div>
                <h3 className="font-black text-base text-[var(--text-primary)]">
                  لا توجد أنشطة تجارية مسجلة حالياً
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-bold">
                  سيتم إدراج الأنشطة فور اعتمادها ونشرها من إدارة المنظومة
                </p>
              </div>
            )}

            {/* 3. FILTER RESULTS EMPTY (When businesses exist but filters match 0) */}
            {!loading && businesses.length > 0 && filteredBusinesses.length === 0 && (
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-12 text-center space-y-3 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-xl font-bold">
                  🔍
                </div>
                <h3 className="font-black text-base text-[var(--text-primary)]">
                  لا توجد نتائج مطابقة لخيارات البحث
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-bold">
                  جرب تغيير خيارات الفلترة أو اختيار محافظة أخرى
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setGovFilter('all');
                    setCategoryFilter('all');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-xl border border-amber-500/30 cursor-pointer transition-colors"
                >
                  إعادة ضبط خيارات البحث 🔄
                </button>
              </div>
            )}

            {/* 4. BUSINESSES GRID (Rendered when businesses exist) */}
            {filteredBusinesses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredBusinesses.map((biz) => {
                  const mainPhoto =
                    biz.photos && biz.photos.length > 0
                      ? biz.photos[0]
                      : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80';

                  return (
                    <div
                      key={biz.id}
                      className="group bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-amber-500/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* Photo banner with badge */}
                      <div className="relative h-44 bg-slate-950 overflow-hidden">
                        <img
                          src={mainPhoto}
                          alt={biz.nameAr}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                        {/* Center Play Button Overlay for Videos */}
                        {biz.videos && biz.videos.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVideoBiz(biz);
                            }}
                            className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-slate-950/75 hover:bg-amber-500 text-amber-400 hover:text-slate-950 flex items-center justify-center backdrop-blur-md border border-amber-500/60 shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 z-10 cursor-pointer group-hover:scale-105"
                            title="تشغيل فيديو النشاط الموثق (30 ثانية)"
                          >
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </button>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-3 right-3 left-3 flex items-center justify-between z-10">
                          {biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced' ? (
                            <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1 shadow-sm border border-emerald-400/40">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>موثق رسمياً ✅</span>
                            </span>
                          ) : (
                            <span className="bg-slate-950/90 text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1 shadow-sm border border-amber-500/40">
                              <Clock className="w-3 h-3" />
                              <span>قيد المراجعة والاعتماد ⏳</span>
                            </span>
                          )}

                          {biz.videos && biz.videos.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVideoBiz(biz);
                              }}
                              className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md hover:scale-105 transition-transform cursor-pointer border border-amber-400/60"
                              title="مشاهدة فيديو النشاط"
                            >
                              <Play className="w-2.5 h-2.5 fill-slate-950" />
                              <span>فيديو 30ث</span>
                            </button>
                          )}

                          <span className="bg-slate-950/70 text-amber-400 text-[10.5px] font-bold px-2 py-0.5 rounded-lg border border-amber-500/30 backdrop-blur-md">
                            {biz.governorate}
                          </span>
                        </div>

                        {/* Bottom Name inside photo banner */}
                        <div className="absolute bottom-2.5 right-3 left-3">
                          <span className="text-[10.5px] font-bold text-amber-400 block truncate">
                            {biz.category}
                          </span>
                          <h3 className="text-base font-black text-white leading-tight truncate">
                            {biz.nameAr}
                          </h3>
                        </div>
                      </div>

                      {/* Content Card Body */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between text-xs">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-[var(--text-secondary)] font-bold leading-tight">
                            <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">
                              {(() => {
                                const rawStreet = (biz.street || '').trim();
                                const isGenericPlaceholder = !rawStreet || rawStreet.includes('الموقع الجغرافي المسجل') || rawStreet.includes('الموقع المسجل');

                                if (isGenericPlaceholder) {
                                  const parts = [biz.city, biz.governorate].filter(Boolean);
                                  return parts.length > 0 ? parts.join('، ') : biz.governorate;
                                }

                                const parts = [rawStreet, biz.city, biz.governorate].filter(Boolean);
                                let full = parts.join('، ');
                                if (biz.landmark) full += ` (بجوار ${biz.landmark})`;
                                return full;
                              })()}
                            </span>
                          </div>

                          {biz.workingHours && (
                            <div className="flex items-center gap-2 text-[var(--text-muted)] text-[11px] font-bold">
                              <Clock className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                              <span className="truncate">{biz.workingHours}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions Toolbar */}
                        <div className="pt-3 border-t border-[var(--border-color)] flex items-center gap-2">
                          <button
                            onClick={() => handleOpenBusiness(biz)}
                            className="flex-1 bg-[var(--input-bg)] hover:bg-amber-500 hover:text-slate-950 text-[var(--text-primary)] font-black text-xs py-2 rounded-xl border border-[var(--border-color)] transition-all cursor-pointer text-center"
                          >
                            {biz.videos && biz.videos.length > 0 ? 'التفاصيل والفيديو 🎬' : 'التفاصيل والصور 📸'}
                          </button>

                          {/* Quick Share Direct Link */}
                          <button
                            type="button"
                            onClick={(e) => handleShareBusiness(biz, e)}
                            className="w-8 h-8 rounded-xl bg-[var(--input-bg)] hover:bg-amber-500 hover:text-slate-950 text-[var(--text-muted)] hover:text-slate-950 flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs border border-[var(--border-color)]"
                            title="مشاركة رابط النشاط المباشر 🔗"
                          >
                            {copiedBizId === biz.id ? (
                              <CheckCheck className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>

                          {/* Direct Phone / Call */}
                          {biz.phone && (
                            <a
                              href={`tel:${biz.phone}`}
                              className="w-8 h-8 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs"
                              title="اتصال هاتفياً"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          )}

                          {/* Map Navigation: Active whenever verified final Google Maps URL is present */}
                          {biz.googleMapsUrl && biz.googleMapsUrl.trim().startsWith('http') ? (
                            <a
                              href={biz.googleMapsUrl.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs"
                              title="الموقع موثق رسمياً: فتح على خرائط Google 🗺️"
                            >
                              <Navigation className="w-4 h-4" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-300 dark:border-slate-700/80 flex items-center justify-center shrink-0 cursor-not-allowed opacity-60 shadow-none"
                              title="الموقع غير مدرج بعد على خرائط Google (قيد مراجعة وتوثيق الإدارة ⏳)"
                            >
                              <Navigation className="w-4 h-4 opacity-40" />
                            </button>
                          )}
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

      {/* 🌟 4. PROMOTIONAL PACKAGES SECTION */}
      <section id="packages" className="py-12 sm:py-18 bg-gradient-to-b from-[var(--bg-primary)] via-amber-500/5 to-[var(--bg-primary)] border-t border-b border-[var(--border-color)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2.5 max-w-2xl mx-auto">
            <span className="text-amber-500 text-xs font-black uppercase tracking-wider bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30">
              💎 باقات وعروض التوثيق المعتمدة
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)]">
              اختر الباقة المناسبة لتنمية نشاطك التجاري
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] font-bold">
              أسعار رسمية ثابتة وبدون أي رسوم خفية، مع توثيق فوري وزيارات ميدانية معتمدة في كافة المحافظات
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-6 sm:gap-8">
            {PACKAGES.filter((p) => p.price !== 250).map((pkg) => (
              <div
                key={pkg.id}
                className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all duration-300 ${
                  pkg.popular
                    ? 'bg-gradient-to-b from-amber-500/15 via-[var(--bg-card)] to-[var(--bg-card)] border-2 border-amber-500 shadow-2xl shadow-amber-500/10 scale-100 sm:scale-105 z-10'
                    : 'bg-[var(--bg-card)] border border-[var(--border-color)] shadow-md hover:border-amber-500/40'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3.5 right-1/2 translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[11px] px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-slate-950" />
                    <span>العرض الأكثر طلباً واختياراً</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-black text-lg text-[var(--text-primary)]">{pkg.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] font-bold leading-relaxed">{pkg.description}</p>
                  </div>

                  <div className="pt-2 pb-3 border-b border-[var(--border-color)]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-amber-500 font-mono">{pkg.price}</span>
                      <span className="text-xs font-bold text-[var(--text-secondary)]">جنيه مصري</span>
                    </div>
                    <span className="text-[10.5px] text-[var(--text-muted)] font-bold block mt-1">
                      سداد لمرة واحدة مع توثيق دائم وفاتورة إلكترونية معتمدة
                    </span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-[var(--text-secondary)]">
                    {pkg.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 leading-relaxed">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 stroke-[2.5]" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={getPackageWhatsAppUrl(pkg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full text-center py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>طلب الاشتراك في هذه الباقة 💬</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🌟 5. WHY VERIFY WITH DALELAK */}
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
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-3xl space-y-3 shadow-sm hover:border-amber-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-[var(--text-primary)]">تصدر نتائج البحث الجغرافي</h3>
            <p className="text-xs text-[var(--text-muted)] font-bold leading-relaxed">
              ظهور نشاطك في أعلى اقتراحات Google عندما يبحث العملاء عن خدمات أو منتجات في منطقتك الجغرافية.
            </p>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-3xl space-y-3 shadow-sm hover:border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold">
              <Navigation className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-[var(--text-primary)]">توجيه GPS فوري وسهل</h3>
            <p className="text-xs text-[var(--text-muted)] font-bold leading-relaxed">
              تسهيل وصول الزبائن وسائقي التوصيل (Delivery) ومندوبي الشحن إلى باب محلك بدقة دون تيه.
            </p>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-3xl space-y-3 shadow-sm hover:border-blue-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-[var(--text-primary)]">تصوير فاخر بالذكاء الاصطناعي</h3>
            <p className="text-xs text-[var(--text-muted)] font-bold leading-relaxed">
              تحسين إضاءة وألوان وتباين صور واجهة نشاطك لتبدو بمظهر تسويقي فندقي يجذب الأنظار.
            </p>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-3xl space-y-3 shadow-sm hover:border-purple-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-[var(--text-primary)]">ثقة ومصداقية وفاتورة رسمية</h3>
            <p className="text-xs text-[var(--text-muted)] font-bold leading-relaxed">
              الحصول على فاتورة توثيق رسمية برمز QR وشارة التوثيق المعتمدة التي تزيد ثقة العملاء بنشاطك.
            </p>
          </div>
        </div>
      </section>

      {/* 🌟 6. QUICK ORDER / CONSULTATION FORM SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-gradient-to-br from-amber-500/15 via-[var(--bg-card)] to-yellow-500/15 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-9 space-y-6 shadow-xl text-center">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
              جاهز لتوثيق نشاطك التجاري؟ اطلب زيارة مندوبك المعتمد الآن 📍
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-bold">
              سجل بياناتك وسيتواصل معك المندوب المعتمد لمحافظتك لترتيب موعد الزيارة والتصوير الميداني
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
                  placeholder="مثال: مطعم الشرق، صيدلية الأمل، معرض الفخامة..."
                  value={formBizName}
                  onChange={(e) => setFormBizName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 focus:outline-none focus:border-amber-500 font-bold text-[var(--text-primary)] shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--text-primary)] font-black mb-1">اسم صاحب النشاط / المسؤول</label>
                <input
                  type="text"
                  placeholder="اسم حضرتك"
                  value={formOwnerName}
                  onChange={(e) => setFormOwnerName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 focus:outline-none focus:border-amber-500 font-bold text-[var(--text-primary)] shadow-xs"
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
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 focus:outline-none focus:border-amber-500 font-mono font-bold text-[var(--text-primary)] dir-ltr text-right shadow-xs"
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
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[var(--text-primary)] font-black mb-1 text-xs">الباقة التي ترغب بها</label>
              <select
                value={formSelectedPackage}
                onChange={(e) => setFormSelectedPackage(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 focus:outline-none focus:border-amber-500 font-bold text-amber-600 dark:text-amber-400 text-xs shadow-xs cursor-pointer"
              >
                {PACKAGES.filter((p) => p.price !== 250).map((p) => (
                  <option key={p.id} value={p.title}>
                    {p.title} ({p.price} ج.م)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>إرسال الطلب والتواصل مع المندوب الميداني 🚀</span>
            </button>
          </form>
        </div>
      </section>

      {/* 🌟 7. BUSINESS DETAILS MODAL POPUP */}
      {selectedBiz && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-fade-in-scale my-auto max-h-[92vh] flex flex-col text-right text-xs">
            {/* Modal Header Bar */}
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
                    <span>قيد المراجعة والاعتماد</span>
                  </span>
                )}
                <h3 className="font-black text-base text-[var(--text-primary)] truncate">{selectedBiz.nameAr}</h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Share Business Link */}
                <button
                  type="button"
                  onClick={(e) => handleShareBusiness(selectedBiz, e)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-600 dark:text-amber-400 font-black text-xs flex items-center gap-1.5 transition-all border border-amber-500/30 cursor-pointer shadow-xs"
                  title="مشاركة رابط هذا النشاط المباشر"
                >
                  {copiedBizId === selectedBiz.id ? (
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedBizId === selectedBiz.id ? 'تم النسخ!' : 'مشاركة الرابط'}</span>
                </button>

                <button
                  onClick={handleCloseBusiness}
                  className="w-8 h-8 rounded-full bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 flex items-center justify-center font-bold cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Instant Preview / Pending Notice Banner */}
            {(isPreviewMode || (selectedBiz.verificationStatus !== 'verified' && selectedBiz.googleSyncStatus !== 'synced')) && (
              <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center gap-2 text-amber-700 dark:text-amber-300 text-xs font-black">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>معاينة فورية: هذا النشاط مسجل بنجاح 🌿 — قيد المراجعة الإدارية والاعتماد للنشر على الخريطة العامة ⏳</span>
              </div>
            )}

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Top Hero Banner & Media Gallery */}
              <div className="space-y-3">
                {/* Main Featured Photo with overlay */}
                <div className="relative h-56 sm:h-64 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 shadow-md border border-[var(--border-color)]">
                  <img
                    src={
                      selectedBiz.photos && selectedBiz.photos.length > 0
                        ? selectedBiz.photos[0]
                        : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={selectedBiz.nameAr}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                  {/* Badges on Hero Image */}
                  <div className="absolute top-3 right-3 left-3 flex items-center justify-between z-10">
                    <span className="bg-slate-950/80 backdrop-blur-md text-amber-400 text-[11px] font-black px-3 py-1 rounded-full border border-amber-500/30 shadow-md">
                      {selectedBiz.category}
                    </span>

                    {selectedBiz.videos && selectedBiz.videos.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedVideoBiz(selectedBiz)}
                        className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg hover:scale-105 transition-transform cursor-pointer border border-amber-400/60"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>تشغيل الفيديو (30ث) 🎬</span>
                      </button>
                    )}
                  </div>

                  {/* Business Title & Governorate on Image */}
                  <div className="absolute bottom-3.5 right-4 left-4 text-white space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-md">
                      {selectedBiz.nameAr}
                    </h2>
                    <p className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>
                        {selectedBiz.city ? `${selectedBiz.city}، ` : ''}
                        {selectedBiz.governorate}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Additional Thumbnails Grid */}
                {selectedBiz.photos && selectedBiz.photos.length > 1 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                    {selectedBiz.photos.slice(0, 4).map((ph, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewPhotoUrl(ph)}
                        className="relative h-20 rounded-xl overflow-hidden bg-slate-950 border border-[var(--border-color)] hover:border-amber-500 transition-all cursor-pointer shadow-xs group"
                        title="تكبير الصورة"
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

              {/* 🌟 GOOGLE MAPS VERIFICATION & AUTHENTIC REVIEWS HUB */}
              <div className="space-y-3">
                {selectedBiz.googleMapsUrl && selectedBiz.googleMapsUrl.trim().startsWith('http') ? (
                  <div className="bg-gradient-to-br from-emerald-500/10 via-[var(--bg-card)] to-teal-500/10 border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
                    {/* Header with Google Logo & Verified Badge */}
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
                            <span className="font-black text-sm text-[var(--text-primary)]">
                              تقييمات ومراجعات خرائط Google الرسمية
                            </span>
                            <span className="bg-emerald-600 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full">
                              موثق ومعتمد ✓
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] font-bold pt-0.5">
                            التقييمات والمراجعات الحية الصادرة من زوار وعملاء النشاط على خرائط Google
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
                        <span>فتح الموقع على Google Maps 🚀</span>
                      </a>
                    </div>

                    {/* Authentic Google Action Hub */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <a
                        href={selectedBiz.googleMapsUrl.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-emerald-500/30 hover:border-emerald-500 flex items-center justify-between gap-3 group transition-all cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-black">
                            <Star className="w-4 h-4 fill-current" />
                          </div>
                          <div>
                            <span className="font-black text-xs text-[var(--text-primary)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 block transition-colors">
                              قراءة المراجعات والآراء الحية
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] font-bold">
                              مشاهدة تعليقات وصور العملاء على خرائط Google
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-emerald-500 group-hover:translate-x-[-2px] transition-transform shrink-0" />
                      </a>

                      <a
                        href={selectedBiz.googleMapsUrl.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-amber-500/30 hover:border-amber-500 flex items-center justify-between gap-3 group transition-all cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-black">
                            <MessageCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-black text-xs text-[var(--text-primary)] group-hover:text-amber-600 dark:group-hover:text-amber-400 block transition-colors">
                              كتابة تقييم جديد للنشاط
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] font-bold">
                              شارك تجربتك الحقيقية مباشرة على خرائط Google
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-amber-500 group-hover:translate-x-[-2px] transition-transform shrink-0" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-3xl bg-[var(--input-bg)] border border-amber-500/40 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="font-black text-xs text-[var(--text-primary)]">
                          حالة التوثيق ومراجعات Google Maps
                        </span>
                      </div>
                      <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/30">
                        قيد المراجعة والاعتماد ⏳
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed">
                      جاري استكمال إجراءات توثيق وربط هذا النشاط على خرائط Google الرسمية، وسيتم تفعيل صندوق التقييمات وزر التوجيه المباشر فور اعتماده من الإدارة.
                    </p>
                  </div>
                )}
              </div>

              {/* 📋 DETAILED BUSINESS INFO CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Working Hours */}
                <div className="bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--border-color)] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10.5px] text-[var(--text-muted)] font-bold block">مواعيد العمل:</span>
                    <span className="font-black text-[var(--text-primary)]">
                      {selectedBiz.workingHours || 'يومياً على مدار الساعة'}
                    </span>
                  </div>
                </div>

                {/* Location & Address */}
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

              {/* Description / About */}
              {selectedBiz.description && (
                <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)] space-y-1.5">
                  <span className="text-[11px] text-amber-500 font-black block">نبذة وتفاصيل النشاط:</span>
                  <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                    {selectedBiz.description}
                  </p>
                </div>
              )}
            </div>

            {/* 🌟 STREAMLINED ACTION FOOTER */}
            <div className="p-3.5 sm:p-4 bg-[var(--input-bg)] border-t border-[var(--border-color)] flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
              {/* WhatsApp Action */}
              <a
                href={`https://wa.me/20${(selectedBiz.whatsapp || selectedBiz.phone || selectedBiz.ownerPhone || '')
                  .replace(/\D/g, '')
                  .replace(/^0/, '')}?text=${encodeURIComponent(
                  `السلام عليكم 👋 أود الاستفسار عن خدمات ومنتجات نشاط "${selectedBiz.nameAr}" المعروض على منصة دليلك.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[130px] bg-emerald-500/15 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-500/40 font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>مراسلة عبر واتساب</span>
              </a>

              {/* Direct Phone Call */}
              {selectedBiz.phone && (
                <a
                  href={`tel:${selectedBiz.phone}`}
                  className="flex-1 min-w-[120px] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  <Phone className="w-4 h-4" />
                  <span>اتصال هاتفياً</span>
                </a>
              )}

              {/* Google Maps Primary CTA */}
              {selectedBiz.googleMapsUrl && selectedBiz.googleMapsUrl.startsWith('http') && (
                <a
                  href={selectedBiz.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[160px] bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg"
                >
                  <Navigation className="w-4 h-4" />
                  <span>فتح على خرائط Google 🗺️</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🌟 8. CLEAN PUBLIC FOOTER */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-card)] py-8 text-center text-xs text-[var(--text-muted)] space-y-3">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />

          <p className="font-bold">
            جميع الحقوق محفوظة © {new Date().getFullYear()} - منصة "دليلك" لتوثيق الأنشطة والخدمات الميدانية في مصر 🇪🇬
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 font-bold text-[11px]">
            <a href="https://www.dalilaak.com/" className="text-amber-600 dark:text-amber-400 hover:underline">
              https://www.dalilaak.com/
            </a>
            <span>•</span>
            <a href="mailto:info@dalilaak.com" className="text-blue-600 dark:text-blue-400 hover:underline">
              info@dalilaak.com
            </a>
            <span>•</span>
            <a href="#explore" className="hover:text-amber-500 transition-colors">
              معرض الأنشطة
            </a>
            <span>•</span>
            <a href="#packages" className="hover:text-amber-500 transition-colors">
              باقات التوثيق
            </a>
            <span>•</span>
            <a
              href="https://wa.me/201143888355?text=%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D9%85%D9%86%D8%B8%D9%88%D9%85%D8%A9%20%D8%AF%D9%84%D9%8A%D9%84%D9%83"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-500 hover:underline"
            >
              الدعم الفني والواتساب
            </a>
          </div>
        </div>
      </footer>

      {/* 🌟 9. ON-DEMAND SHORT VIDEO PLAYER MODAL */}
      {selectedVideoBiz && (
        <VideoPlayerModal
          business={selectedVideoBiz}
          onClose={() => setSelectedVideoBiz(null)}
        />
      )}

      {/* 🌟 10. PHOTO PREVIEW LIGHTBOX MODAL */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fade-in"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute -top-12 left-0 sm:left-auto sm:-right-2 w-10 h-10 rounded-full bg-slate-800/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-lg z-10"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-black max-h-[82vh] max-w-full flex items-center justify-center">
              <img
                src={previewPhotoUrl}
                alt="معاينة صورة النشاط"
                className="max-h-[80vh] max-w-full w-auto h-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* 🌟 11. FLOATING SHARE TOAST NOTIFICATION */}
      {shareToastText && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999999] pointer-events-auto inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900/95 text-emerald-400 border border-emerald-500/50 backdrop-blur-xl text-xs font-black shadow-2xl animate-fade-in transition-all"
          style={{ direction: 'rtl' }}
        >
          <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{shareToastText}</span>
        </div>
      )}
    </div>
  );
};
