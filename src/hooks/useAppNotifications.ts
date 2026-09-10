import { useState, useEffect, useMemo, useCallback } from 'react';
import { ToastNotification, SystemNotification, NotificationCategory, UserRole, Representative, Business, User } from '../types';
import { isRepAccountDeleted } from '../utils/accountStatus';
import { isReferredByInviter, getRepReferralCode } from '../utils/referral';

interface UseAppNotificationsProps {
  user: User | null;
  representatives: Representative[];
  businesses: Business[];
  setActiveTab: (tab: string) => void;
  setEditingBusiness: (biz: Business | null) => void;
  setSelectedInvoiceBiz: (biz: Business | null) => void;
}

export function useAppNotifications({
  user,
  representatives,
  businesses,
  setActiveTab,
  setEditingBusiness,
  setSelectedInvoiceBiz,
}: UseAppNotificationsProps) {
  // Toast notifications
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setNotifications((prev) => [...prev, { id, message, type, createdAt: Date.now() }].slice(-3));
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  }, []);

  // Persistent System Notifications for Bell Notification Center
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>(() => {
    if (typeof localStorage === 'undefined') return [];
    const saved = localStorage.getItem('dalelak_system_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('dalelak_system_notifications', JSON.stringify(systemNotifications));
    } catch (e) {}
  }, [systemNotifications]);

  const addSystemNotification = useCallback((item: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    category?: NotificationCategory;
    targetRole?: UserRole | 'all';
    targetUserId?: string;
    linkTab?: string;
    entityId?: string;
    entityType?: 'business' | 'rep' | 'invoice';
  }) => {
    const newNotif: SystemNotification = {
      id: `sys_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: item.title,
      message: item.message,
      timestamp: new Date().toISOString(),
      type: item.type || 'info',
      category: item.category || 'system',
      targetRole: item.targetRole || 'all',
      targetUserId: item.targetUserId,
      read: false,
      linkTab: item.linkTab,
      entityId: item.entityId,
      entityType: item.entityType,
    };
    setSystemNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const handleMarkAllNotificationsAsRead = useCallback(() => {
    setSystemNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem('dalelak_system_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const handleMarkNotificationAsRead = useCallback((id: string) => {
    setSystemNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      try {
        localStorage.setItem('dalelak_system_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const handleClearNotifications = useCallback(() => {
    setSystemNotifications([]);
    try {
      localStorage.setItem('dalelak_system_notifications', JSON.stringify([]));
    } catch {}
  }, []);

  const [selectedAdminDossierRep, setSelectedAdminDossierRep] = useState<Representative | null>(null);

  // Direct navigation handler for Notification preview clicks
  const handleNotificationNavigate = useCallback((tab: string, entityId?: string, entityType?: string) => {
    if (tab) setActiveTab(tab);

    if (entityId) {
      if (entityType === 'rep' || (!entityType && tab === 'admin')) {
        const foundRep = representatives.find((r) => r.id === entityId || (r.email && r.email.toLowerCase() === entityId.toLowerCase()));
        if (foundRep) {
          setSelectedAdminDossierRep(foundRep);
          setActiveTab('admin');
        }
      } else if (entityType === 'business' || (!entityType && (tab === 'home' || tab === 'admin'))) {
        const foundBiz = businesses.find((b) => b.id === entityId || b.nameAr.includes(entityId));
        if (foundBiz) {
          setEditingBusiness(foundBiz);
        }
      } else if (entityType === 'invoice' || (!entityType && tab === 'invoices')) {
        const foundBiz = businesses.find(
          (b) => b.id === entityId || b.invoiceNumber === entityId || b.nameAr.includes(entityId)
        );
        if (foundBiz) {
          setSelectedInvoiceBiz(foundBiz);
        }
      }
    }
  }, [setActiveTab, representatives, businesses, setEditingBusiness, setSelectedInvoiceBiz]);

  // 🔔 Cross-device / DB sync for Admin notifications about pending registrations & inviter notifications
  useEffect(() => {
    if (!representatives || representatives.length === 0) return;

    const isAdmin = user?.role === 'admin' || user?.role === 'supervisor';
    const currentUserId = user?.id;

    setSystemNotifications((prev) => {
      let changed = false;
      const updated = [...prev];

      // 1. Sync for Admin: All suspended accounts awaiting activation
      if (isAdmin) {
        const suspendedReps = representatives.filter(
          (r) => r.status === 'suspended' && !isRepAccountDeleted(r)
        );

        suspendedReps.forEach((rep) => {
          const existing = updated.find(
            (n) => (n.entityId === rep.id || n.id === `notif_pending_rep_${rep.id}`) && n.category === 'account'
          );

          if (!existing) {
            updated.unshift({
              id: `notif_pending_rep_${rep.id}`,
              title: 'طلب تسجيل حساب مندوب جديد بحاجة للموافقة 👤',
              message: `قام المندوب "${rep.name}" بتسجيل حساب جديد (${rep.governorate})، الحساب معلق بانتظار فحص وثائق الهوية وتفعيل الصلاحيات.`,
              timestamp: (rep as any).created_at || (rep as any).createdDate || new Date().toISOString(),
              type: 'warning',
              category: 'account',
              targetRole: 'admin',
              linkTab: 'admin',
              entityId: rep.id,
              entityType: 'rep',
              read: false,
            });
            changed = true;
          }
        });

        // If an account has been activated, mark the corresponding approval notification as read
        const activeRepIds = new Set(
          representatives.filter((r) => r.status === 'active').map((r) => r.id)
        );
        updated.forEach((n, idx) => {
          if (
            !n.read &&
            n.entityId &&
            activeRepIds.has(n.entityId) &&
            n.id.startsWith('notif_pending_rep_')
          ) {
            updated[idx] = { ...n, read: true };
            changed = true;
          }
        });
      }

      // 2. Sync for Inviters: When someone registers using their referral code
      if (currentUserId && user?.repData) {
        const currentRep = user.repData;
        const myReferralCode = getRepReferralCode(currentRep);

        const myInvitedReps = representatives.filter(
          (r) => r.id !== currentRep.id && isReferredByInviter(r, currentRep) && !isRepAccountDeleted(r)
        );

        myInvitedReps.forEach((invited) => {
          const existing = updated.find(
            (n) => n.id === `notif_rep_joined_${invited.id}` || (n.entityId === invited.id && n.targetUserId === currentUserId)
          );

          if (!existing) {
            updated.unshift({
              id: `notif_rep_joined_${invited.id}`,
              title: 'عضو جديد انضم إلى فريقك! 🚀',
              message: `انضم المندوب "${invited.name}" (${invited.governorate}) إلى فريقك عبر كود الدعوة (${myReferralCode}). ستكسب عمولات إضافية فور بدئه إنجاز الأنشطة الميدانية!`,
              timestamp: (invited as any).created_at || (invited as any).createdDate || new Date().toISOString(),
              type: 'success',
              category: 'account',
              targetUserId: currentUserId,
              linkTab: 'profile',
              entityId: invited.id,
              entityType: 'rep',
              read: false,
            });
            changed = true;
          }
        });
      }

      return changed ? updated : prev;
    });
  }, [representatives, user?.role, user?.id, user?.repData]);

  // Real System Notifications (Sorted newest first by timestamp)
  const allNotifications = useMemo(() => {
    return [...systemNotifications].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [systemNotifications]);

  return {
    notifications,
    setNotifications,
    addNotification,
    systemNotifications,
    setSystemNotifications,
    addSystemNotification,
    handleMarkAllNotificationsAsRead,
    handleMarkNotificationAsRead,
    handleClearNotifications,
    selectedAdminDossierRep,
    setSelectedAdminDossierRep,
    handleNotificationNavigate,
    allNotifications,
  };
}
