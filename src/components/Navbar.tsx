import React, { useState, useEffect, useRef } from 'react';
import { User, SystemNotification } from '../types';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { NotificationCenter } from './NotificationCenter';
import {
  LogIn,
  LogOut,
  Info,
  FileText,
  ShieldCheck,
  Sparkles,
  Globe,
  Home,
  Map,
  PlusCircle,
  UserCheck,
  Shield,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  currentRoleTitle?: string;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenProfile?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  isAdmin?: boolean;
  systemNotifications: SystemNotification[];
  onMarkAllNotificationsAsRead: () => void;
  onMarkNotificationAsRead: (id: string) => void;
  onClearNotifications: () => void;
  onNavigateTab?: (tab: string, entityId?: string, entityType?: string) => void;
  onOpenAbout?: () => void;
  onOpenTerms?: () => void;
  onOpenPermissions?: () => void;
  onOpenPackages?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentRoleTitle,
  onOpenLogin,
  onLogout,
  onOpenProfile,
  activeTab = 'home',
  setActiveTab,
  isAdmin = false,
  systemNotifications,
  onMarkAllNotificationsAsRead,
  onMarkNotificationAsRead,
  onClearNotifications,
  onNavigateTab,
  onOpenAbout,
  onOpenTerms,
  onOpenPermissions,
  onOpenPackages,
}) => {
  const [isServicesMenuOpen, setIsServicesMenuOpen] = useState(false);
  const servicesMenuRef = useRef<HTMLDivElement>(null);

  // Close services dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (servicesMenuRef.current && !servicesMenuRef.current.contains(e.target as Node)) {
        setIsServicesMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const desktopTabs = [
    { id: 'home', label: 'الرئيسية', icon: Home, title: 'عرض الأنشطة المسجلة والبحث الميداني' },
    { id: 'map', label: 'الخريطة', icon: Map, title: 'استكشاف الأنشطة على الخريطة التفاعلية' },
    { id: 'add', label: 'تسجيل جديد', icon: PlusCircle, isPrimary: true, title: 'إضافة نشاط تجاري جديد وتوثيقه' },
    { id: 'invoices', label: 'المراجعات', icon: UserCheck, title: 'كشف الحساب والمراجعات المالية والتحصيلات' },
    {
      id: isAdmin ? 'admin' : 'profile',
      label: isAdmin ? 'لوحة الإدارة' : 'ملفي الشخصي',
      icon: isAdmin ? Shield : ShieldCheck,
      title: isAdmin ? 'لوحة تحكم إدارة النظام' : 'الملف الشخصي وحساب العمولات',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[var(--nav-bg)] backdrop-blur-md border-b border-[var(--border-color)] text-[var(--text-primary)] shadow-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Right side (RTL start): Official Brand Logo with dedicated breathing room */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab ? setActiveTab('home') : window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center focus:outline-none transition-transform hover:scale-[1.02] active:scale-95 text-right cursor-pointer"
            title="دليلك - المنظومة الشاملة لإدارة وتوثيق الأنشطة الميدانية"
          >
            <Logo size="md" showSubtitle={false} className="shrink-0" />
          </button>
        </div>

        {/* Informational Links for GUEST users (when not logged in) */}
        {!user && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => window.open('https://www.dalilaak.com/', '_blank')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-teal-700 dark:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-teal-500" />
              <span>دليل الأنشطة 🌐</span>
            </button>
            {onOpenPackages && (
              <button
                type="button"
                onClick={onOpenPackages}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>باقات دليلك 💎</span>
              </button>
            )}
            {onOpenAbout && (
              <button
                type="button"
                onClick={onOpenAbout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>من نحن</span>
              </button>
            )}
            {onOpenTerms && (
              <button
                type="button"
                onClick={onOpenTerms}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>شروط الاستخدام</span>
              </button>
            )}
          </div>
        )}

        {/* Center: Desktop Page Navigation Tabs (Always prominent for Computers & Tablets >= md) */}
        {user && setActiveTab && (
          <nav
            role="navigation"
            aria-label="التنقل الرئيسي للكمبيوتر"
            className="hidden md:flex items-center gap-1 sm:gap-1.5 bg-[var(--bg-secondary)]/80 backdrop-blur-md p-1 rounded-2xl border border-[var(--border-color)] shadow-xs shrink-0 mx-2"
          >
            {desktopTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              if (tab.isPrimary) {
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      if (activeTab === 'add') {
                        window.dispatchEvent(new CustomEvent('dalelak_submit_business_form'));
                      } else {
                        setActiveTab(tab.id);
                      }
                    }}
                    title={tab.title}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all duration-300 shadow-sm cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 ring-2 ring-amber-500/40 scale-102'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-105 active:scale-95'
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2.5]" />
                    <span>{tab.label}</span>
                  </button>
                );
              }

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.title}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black border border-amber-500/30 shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-all duration-200 ${isActive ? 'stroke-[2.5] text-amber-500 scale-105' : 'stroke-[1.8]'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Left side controls: Services Dropdown + Notification Center + Theme Toggle + User Badge / Login */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Services & Quick Links Dropdown for Authenticated Users */}
          {user && (
            <div className="relative" ref={servicesMenuRef}>
              <button
                type="button"
                onClick={() => setIsServicesMenuOpen(!isServicesMenuOpen)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isServicesMenuOpen
                    ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] border border-transparent'
                }`}
                title="الخدمات والروابط السريعة"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden xl:inline">الخدمات</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isServicesMenuOpen ? 'rotate-180 text-amber-500' : ''}`} />
              </button>

              {isServicesMenuOpen && (
                <div className="absolute left-0 mt-2 w-52 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl p-1.5 z-50 flex flex-col gap-1 backdrop-blur-md">
                  {user?.role !== 'rep' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsServicesMenuOpen(false);
                        const repCode = user?.repData?.referralCode || (user?.role === 'rep' ? `DALIL-${user.id.replace(/\D/g, '')}` : '');
                        const url = new URL('https://www.dalilaak.com/');
                        if (repCode) url.searchParams.set('ref', repCode);
                        window.open(url.toString(), '_blank');
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 transition-colors text-right cursor-pointer"
                    >
                      <Globe className="w-4 h-4 shrink-0 text-teal-500" />
                      <span>دليل الأنشطة العام 🌐</span>
                    </button>
                  )}

                  {user?.role !== 'rep' && onOpenPackages && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsServicesMenuOpen(false);
                        onOpenPackages();
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors text-right cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>باقات دليلك 💎</span>
                    </button>
                  )}

                  {user?.role !== 'rep' && onOpenPermissions && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsServicesMenuOpen(false);
                        onOpenPermissions();
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-500/10 transition-colors text-right cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>دليل الصلاحيات</span>
                    </button>
                  )}

                  <div className="h-px bg-[var(--border-color)] my-0.5" />

                  {onOpenAbout && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsServicesMenuOpen(false);
                        onOpenAbout();
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors text-right cursor-pointer"
                    >
                      <Info className="w-4 h-4 shrink-0" />
                      <span>من نحن</span>
                    </button>
                  )}

                  {onOpenTerms && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsServicesMenuOpen(false);
                        onOpenTerms();
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors text-right cursor-pointer"
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>شروط الاستخدام</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notification Center Bell Icon & Dropdown */}
          <NotificationCenter
            user={user}
            notifications={systemNotifications}
            onMarkAllAsRead={onMarkAllNotificationsAsRead}
            onMarkAsRead={onMarkNotificationAsRead}
            onClearAll={onClearNotifications}
            onNavigateTab={onNavigateTab}
          />

          {/* Theme Toggle Button (Light/Dark Switcher) */}
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={onOpenProfile}
                title="الملف الشخصي وتعديل الصورة"
                className="flex items-center gap-1 sm:gap-2 bg-[var(--bg-card)] hover:bg-amber-500/10 border border-[var(--border-color)] hover:border-amber-500/40 rounded-full py-1 px-1.5 sm:px-3 shadow-xs transition-all duration-300 cursor-pointer group shrink-0"
              >
                {(() => {
                  let rawAvatar = user.repData?.avatar || user.avatar;
                  if (typeof rawAvatar === 'string' && rawAvatar.trim().startsWith('{')) {
                    try {
                      const parsed = JSON.parse(rawAvatar.trim());
                      if (parsed && typeof parsed.avatar === 'string') {
                        rawAvatar = parsed.avatar;
                      }
                    } catch {}
                  }
                  const hasValidAvatar =
                    rawAvatar &&
                    typeof rawAvatar === 'string' &&
                    rawAvatar.trim().length > 5 &&
                    (rawAvatar.startsWith('http://') || rawAvatar.startsWith('https://') || rawAvatar.startsWith('data:') || rawAvatar.startsWith('blob:') || rawAvatar.startsWith('/'));

                  return (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-amber-400/60 shrink-0 flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xs shadow-xs">
                      {hasValidAvatar ? (
                        <img
                          src={rawAvatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{user.name ? user.name.trim().charAt(0) : 'م'}</span>
                      )}
                    </div>
                  );
                })()}
                <div className="text-right flex flex-col">
                  <p className="text-[11px] sm:text-xs font-black text-[var(--text-primary)] group-hover:text-amber-500 transition-colors truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[150px] leading-tight">
                    {user.name}
                  </p>
                  <span className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 font-extrabold leading-none mt-0.5 max-w-[160px] truncate" title={currentRoleTitle || user.repData?.roleTitle || user.roleTitle}>
                    {currentRoleTitle || user.repData?.roleTitle || user.roleTitle || (
                      user.role === 'admin'
                        ? 'مدير النظام 🛡️'
                        : user.role === 'supervisor'
                        ? 'مشرف الإدارة ⚡'
                        : user.role === 'accountant'
                        ? 'محاسب ومحصل 💳'
                        : 'مندوب ميداني 💼'
                    )}
                  </span>
                </div>
              </button>

              <button
                onClick={onLogout}
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
                className="p-1.5 sm:p-2 rounded-full text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-[11px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span>تسجيل الدخول</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
