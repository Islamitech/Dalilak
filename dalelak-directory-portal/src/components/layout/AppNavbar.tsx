import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Logo } from '../Logo';
import {
  Search,
  Map as MapIcon,
  Heart,
  Store,
  Menu,
  X,
  Compass,
  BadgeDollarSign,
  Info,
  MapPin,
  Check,
} from 'lucide-react';
import { EGYPT_POPULAR_LOCATIONS, EgyptLocationItem } from '../map/constants/mapConstants';

export interface AppNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  favoritesCount?: number;
  activeLocation?: string;
  onLocationChange?: (locationName: string, coords?: { lat: number; lng: number }, gov?: string) => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  currentPath,
  onNavigate,
  favoritesCount = 0,
  activeLocation = 'حدائق الأهرام',
  onLocationChange,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const locationDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside or escape key
  useEffect(() => {
    if (!isLocationMenuOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setIsLocationMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLocationMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLocationMenuOpen]);

  const filteredLocations = useMemo(() => {
    const q = locationSearchQuery.trim().toLowerCase();
    if (!q) return EGYPT_POPULAR_LOCATIONS;
    return EGYPT_POPULAR_LOCATIONS.filter(
      (loc) => loc.name.toLowerCase().includes(q) || loc.gov.toLowerCase().includes(q)
    );
  }, [locationSearchQuery]);

  const handleSelectLocation = (loc: EgyptLocationItem) => {
    setIsLocationMenuOpen(false);
    setLocationSearchQuery('');
    if (onLocationChange) {
      onLocationChange(loc.name, { lat: loc.lat, lng: loc.lng }, loc.gov);
    }
  };

  const cleanRoute = currentPath.toLowerCase().split('?')[0];

  const navLinks = [
    { path: '/', label: 'الخريطة والملاحة', icon: MapIcon },
    { path: '/search', label: 'استكشف الأنشطة', icon: Search },
    { path: '/favorites', label: 'المفضلة', icon: Heart, badge: favoritesCount > 0 ? favoritesCount : undefined },
  ];

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Right (RTL Start): Brand Logo & Location Pill */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => handleLinkClick('/')}
            className="flex items-center gap-2 cursor-pointer focus:outline-none shrink-0"
            aria-label="الصفحة الرئيسية لمنصة دليلك"
          >
            <Logo size="md" showSubtitle={false} />
          </button>

          {/* 📍 Sleek Native Location Badge ("فعال لكن مخفي") */}
          <div className="relative" ref={locationDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLocationMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 text-amber-950 font-black text-xs transition-all cursor-pointer select-none active:scale-95 shadow-2xs"
              title="المنطقة الحالية - اضغط للتغيير"
              aria-label="المنطقة الحالية"
            >
              <span className="text-xs sm:text-sm">📍</span>
              <span className="truncate max-w-[80px] sm:max-w-[130px] font-black">
                {activeLocation || 'حدائق الأهرام'}
              </span>
            </button>

            {/* Floating Location Selection Popover */}
            {isLocationMenuOpen && (
              <div
                className="absolute top-full mt-2 right-0 w-72 sm:w-80 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 z-50 p-2.5 animate-scale-in text-slate-800"
                dir="rtl"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-800">اختر المدينة أو المنطقة</span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                    مصر 🇪🇬
                  </span>
                </div>

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="ابحث عن منطقة أو مدينة..."
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    className="w-full pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-all"
                    autoFocus
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 scrollbar-thin">
                  {filteredLocations.length > 0 ? (
                    filteredLocations.map((loc) => {
                      const isSelected = (activeLocation || 'حدائق الأهرام') === loc.name;
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => handleSelectLocation(loc)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/15 text-amber-900 font-black border border-amber-500/30'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-600' : 'text-slate-400'}`} />
                            <span className="truncate">{loc.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                              {loc.gov}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-400">
                      لم يتم العثور على مناطق مطابقة
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 text-xs font-black text-slate-600">
          {navLinks.map((link) => {
            const isActive =
              link.path === '/'
                ? cleanRoute === '/' || cleanRoute === '/map'
                : cleanRoute === link.path || cleanRoute.startsWith(link.path);
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                type="button"
                onClick={() => handleLinkClick(link.path)}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-800 font-black'
                    : 'hover:bg-slate-100 hover:text-slate-900 text-slate-600'
                }`}
              >
                {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />}
                <span>{link.label}</span>
                {link.badge !== undefined && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Left (RTL End): Business Owner CTA & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Subtle Pricing / Growth link for interested owners */}
          <button
            type="button"
            onClick={() => handleLinkClick('/pricing')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-all cursor-pointer"
          >
            <BadgeDollarSign className="w-4 h-4 text-amber-600" />
            <span>باقات النمو</span>
          </button>

          {/* Primary Business Owner CTA */}
          <button
            type="button"
            onClick={() => handleLinkClick('/for-business')}
            className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs px-3.5 sm:px-4 py-2.5 rounded-xl shadow-xs hover:shadow-sm flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Store className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">هل تملك نشاطاً؟ أضفه مجاناً</span>
            <span className="sm:hidden">أضف نشاطك</span>
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
            aria-label="القائمة الرئيسية"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-fade-in shadow-xl">
          {navLinks.map((link) => {
            const isActive =
              link.path === '/'
                ? cleanRoute === '/' || cleanRoute === '/map'
                : cleanRoute === link.path || cleanRoute.startsWith(link.path);
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                type="button"
                onClick={() => handleLinkClick(link.path)}
                className={`w-full px-4 py-3 rounded-xl flex items-center justify-between text-xs font-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-800'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />}
                  <span>{link.label}</span>
                </div>
                {link.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={() => handleLinkClick('/for-business')}
              className="w-full px-4 py-3 rounded-xl bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                <span>إدراج نشاطك مجاناً</span>
              </div>
              <span className="text-[10px] bg-slate-950 text-white px-2 py-0.5 rounded-md">مجاني</span>
            </button>

            <button
              type="button"
              onClick={() => handleLinkClick('/pricing')}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-800 text-xs font-black flex items-center justify-between transition-all cursor-pointer border border-slate-200"
            >
              <div className="flex items-center gap-2">
                <BadgeDollarSign className="w-4 h-4 text-amber-600" />
                <span>باقات النمو والظهور المميز</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
