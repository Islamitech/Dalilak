import React, { useState, useEffect, useRef } from 'react';
import { User, SystemNotification } from '../types';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  UserCheck,
  Store,
  DollarSign,
  Camera,
  Clock,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';

interface NotificationCenterProps {
  user: User | null;
  notifications: SystemNotification[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onNavigateTab?: (tab: string, entityId?: string, entityType?: string) => void;
}

/**
 * Calculates human readable Arabic relative time
 */
function formatTimeAgo(isoString: string): string {
  if (!isoString) return 'الآن';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  return `منذ ${diffDays} يوم`;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  user,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onClearAll,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking or tapping outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Filter notifications relevant to current user
  const userNotifications = notifications.filter((n) => {
    if (!user) return false;

    // 1. If targeted to a specific user ID, only that exact user sees it (Admin does not receive rep's personal greeting)
    if (n.targetUserId) {
      return n.targetUserId === user.id;
    }

    // 2. Admins see all administrative and platform events
    if (user.role === 'admin') {
      return true;
    }

    // 3. Business notifications are private: only the rep who registered the business (or admin) can see them
    if (n.category === 'business') {
      return false;
    }

    // 4. If targeted to a specific role
    if (n.targetRole && n.targetRole !== 'all') {
      return user.role === n.targetRole;
    }

    // 5. General system announcements
    return n.category === 'system' || n.targetRole === 'all';
  });

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const displayList = userNotifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'account':
        return <UserCheck className="w-4 h-4 text-purple-400" />;
      case 'business':
        return <Store className="w-4 h-4 text-amber-400" />;
      case 'payment':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'avatar':
        return <Camera className="w-4 h-4 text-blue-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* BELL ICON BUTTON */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="relative p-2 sm:p-2.5 rounded-full text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-500/10 transition-all duration-200 cursor-pointer active:scale-90 flex items-center justify-center"
        title="الإشعارات والمستجدات"
        aria-label="سجل الإشعارات"
      >
        <Bell className="w-5 h-5 sm:w-5 sm:h-5 stroke-[2]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-[10px] rounded-full flex items-center justify-center border-2 border-[var(--nav-bg)] shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN MENU PANEL */}
      {isOpen && (
        <>
          {/* Mobile backdrop overlay to close dropdown on tap anywhere outside */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-[9998] sm:hidden animate-fade-in"
          />

          <div
            className="fixed inset-x-2.5 top-16 z-[9999] sm:absolute sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-h-[calc(100dvh-5rem)] sm:max-h-[520px] flex flex-col bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-2xl overflow-hidden text-[var(--text-primary)] animate-fade-in-scale transform origin-top"
            style={{ direction: 'rtl' }}
          >
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-[var(--border-color)] bg-[var(--input-bg)]/50 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-black border border-amber-500/30 shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs sm:text-sm text-[var(--text-primary)] leading-tight">
                    مركز الإشعارات والمستجدات
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold">
                    {user?.role === 'admin' ? 'متابعة تحركات المنظومة' : 'متابعة تحديثات حسابك وأنشطتك'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                    title="تحديد الكل كمقروء"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">مقروء</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs & Quick Actions */}
            <div className="px-3 py-2 bg-[var(--bg-primary)] border-b border-[var(--border-color)] flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-1 bg-[var(--input-bg)] p-0.5 rounded-xl border border-[var(--border-color)]">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg font-extrabold text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                    filter === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  الكل ({userNotifications.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg font-extrabold text-[10px] sm:text-[11px] transition-all cursor-pointer ${
                    filter === 'unread'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  غير المقروء ({unreadCount})
                </button>
              </div>

              {userNotifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-[10px] text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors cursor-pointer px-1.5 py-1 rounded-lg hover:bg-rose-500/10"
                  title="تفريغ سجل الإشعارات"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>مسح الكل</span>
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 max-h-[calc(100dvh-14rem)] sm:max-h-[380px] overflow-y-auto divide-y divide-[var(--border-color)]/60 scrollbar-thin overscroll-contain">
              {displayList.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                    <Bell className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">لا توجد إشعارات حالياً</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {filter === 'unread' ? 'لقد قرأت جميع الإشعارات والمستجدات.' : 'سيتم إضافة الإشعارات والتحركات هنا فور حدوثها.'}
                  </p>
                </div>
              ) : (
                displayList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.read) onMarkAsRead(item.id);
                      if (onNavigateTab && (item.linkTab || item.entityId)) {
                        onNavigateTab(item.linkTab || 'home', item.entityId, item.entityType);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3 sm:p-3.5 transition-colors duration-200 cursor-pointer relative group flex items-start gap-2.5 sm:gap-3 ${
                      !item.read
                        ? 'bg-amber-500/5 hover:bg-amber-500/10 active:bg-amber-500/15'
                        : 'hover:bg-[var(--input-bg)]/60 active:bg-[var(--input-bg)]'
                    }`}
                  >
                    {/* Category Badge Icon */}
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      {getCategoryIcon(item.category)}
                    </div>

                    {/* Body Content */}
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs font-black leading-tight truncate ${
                            !item.read ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <span className="text-[9px] text-[var(--text-muted)] font-mono shrink-0 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimeAgo(item.timestamp)}
                        </span>
                      </div>

                      <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed break-words">
                        {item.message}
                      </p>

                      {item.linkTab && (
                        <div className="pt-1 flex items-center gap-1 text-[10px] text-amber-500 font-extrabold">
                          <span>انتقال للمعاينة</span>
                          <ChevronLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                        </div>
                      )}
                    </div>

                    {/* Unread Indicator Dot */}
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5 shadow-sm" />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-[var(--input-bg)]/40 border-t border-[var(--border-color)] text-center text-[10px] text-[var(--text-muted)] font-bold shrink-0">
              منظومة دليلك — التوثيق والمتابعة الميدانية اللحظية ⚡
            </div>
          </div>
        </>
      )}
    </div>
  );
};
