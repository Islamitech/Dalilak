import React from 'react';
import { User, SystemNotification } from '../types';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { NotificationCenter } from './NotificationCenter';
import { LogIn, LogOut, Info, FileText, ShieldCheck, Sparkles, Globe } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  currentRoleTitle?: string;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenProfile?: () => void;
  activeTab?: string;
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
  return (
    <header className="sticky top-0 z-40 bg-[var(--nav-bg)] backdrop-blur-md border-b border-[var(--border-color)] text-[var(--text-primary)] shadow-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: Brand Logo & Links */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Logo size="md" />

          {/* Quick Informational Links — hidden until lg to prevent crowding on tablets (768-1024px) */}
          <div className="hidden lg:flex items-center gap-1 text-xs font-bold">
            {user?.role !== 'rep' && (
              <button
                type="button"
                onClick={() => {
                  const repCode = user?.repData?.referralCode || (user?.role === 'rep' ? `DALIL-${user.id.replace(/\D/g, '')}` : '');
                  const url = new URL('https://www.dalilaak.com/');
                  if (repCode) url.searchParams.set('ref', repCode);
                  window.open(url.toString(), '_blank');
                }}
                title="فتح رابط دليل الأنشطة العام للعملاء"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-teal-700 dark:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-teal-500" />
                <span>دليل الأنشطة العام 🌐</span>
              </button>
            )}

            {user?.role !== 'rep' && onOpenPackages && (
              <button
                type="button"
                onClick={onOpenPackages}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>باقات دليلك 💎</span>
              </button>
            )}

            {onOpenAbout && (
              <button
                type="button"
                onClick={onOpenAbout}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>من نحن</span>
              </button>
            )}

            {onOpenTerms && (
              <button
                type="button"
                onClick={onOpenTerms}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>شروط الاستخدام</span>
              </button>
            )}

            {user?.role !== 'rep' && onOpenPermissions && (
              <button
                type="button"
                onClick={onOpenPermissions}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>دليل الصلاحيات</span>
              </button>
            )}
          </div>
        </div>

        {/* Right side controls: Notification Center + Theme Toggle + User Badge / Login */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
