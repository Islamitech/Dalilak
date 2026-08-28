import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Business, Representative, PaymentGatewayConfig, SystemNotification, NotificationCategory, UserRole, ToastNotification, PayoutRequest, InterestedLead } from './types';
import { INITIAL_BUSINESSES, MOCK_REPRESENTATIVES, DEFAULT_PAYMENT_CONFIG } from './data/mockData';
import { calculateTotalRepCommission, getBusinessPaymentLabel } from './utils/commission';
import { formatActivityDateTime, sortBusinessesNewestFirst } from './utils/dateFormatters';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { InteractiveMap } from './components/InteractiveMap';
import { BusinessForm } from './components/BusinessForm';
import { InvoiceModal } from './components/InvoiceModal';
import { InvoicesLeadsHub } from './components/InvoicesLeadsHub';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminProfileModal } from './components/AdminProfileModal';
import { RepDashboard } from './components/RepDashboard';
import { RepProfile } from './components/RepProfile';
import { LoginModal } from './components/LoginModal';
import { PaymentGatewayModal } from './components/PaymentGatewayModal';
import { BusinessEditModal } from './components/BusinessEditModal';
import { AboutUsModal } from './components/AboutUsModal';
import { TermsModal } from './components/TermsModal';
import { PermissionsModal } from './components/PermissionsModal';
import { PackagesModal } from './components/PackagesModal';
import { Logo } from './components/Logo';
import { canUserEditBusiness, canUserDeleteBusiness, canUserAccessAdminPanel, canUserManagePayouts } from './utils/permissions';
import { MapPin, PlusCircle, FileText, CheckCircle2, Clock, AlertCircle, Phone, Share2, Search, ExternalLink, ShieldCheck, Sparkles, Building2, Database, Eye, X, Info, Heart, Smartphone } from 'lucide-react';
import {
  fetchBusinessesFromDb,
  saveBusinessToDb,
  updateBusinessInDb,
  deleteBusinessFromDb,
  fetchRepsFromDb,
  saveRepToDb,
  deleteRepFromDb,
  updateRepSessionInDb,
  fetchPayoutRequestsFromDb,
  createPayoutRequestInDb,
  updatePayoutRequestInDb,
  fetchLeadsFromDb,
  saveLeadToDb,
  updateLeadInDb,
  deleteLeadFromDb,
  fetchPaymentConfigFromDb,
  savePaymentConfigToDb,
} from './services/db';

// Fixed Session Duration (12 hours maximum lifetime)
const SESSION_MAX_DURATION_MS = 12 * 60 * 60 * 1000;
// Inactivity Idle Duration (60 minutes of inactivity auto-logout)
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;

export default function App() {
  // Application State - Default to null (Guest visitor) or restore valid unexpired user session
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('dalelak_logged_user');
    const sessionExpiresAt = localStorage.getItem('dalelak_session_expires_at');
    const lastInteraction = localStorage.getItem('dalelak_last_interaction');
    const now = Date.now();

    if (savedUser && sessionExpiresAt) {
      const expiresTimestamp = Number(sessionExpiresAt);
      const lastInteractionTimestamp = Number(lastInteraction) || now;

      const isSessionValid = !isNaN(expiresTimestamp) && now < expiresTimestamp;
      const isNotIdle = (now - lastInteractionTimestamp) < INACTIVITY_TIMEOUT_MS;

      if (isSessionValid && isNotIdle) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.id && parsed.name) {
            if (parsed.role === 'admin' && (parsed.email === 'dalilaakeg@gmail.com' || !parsed.email)) {
              parsed.email = 'daz31181@gmail.com';
              if (parsed.repData) parsed.repData.email = 'daz31181@gmail.com';
            }
            return parsed;
          }
        } catch (e) {}
      }
    }

    // Clean expired or idle session from storage
    localStorage.removeItem('dalelak_logged_user');
    localStorage.removeItem('dalelak_session_expires_at');
    localStorage.removeItem('dalelak_last_interaction');
    return null; // Guest visitor by default
  });

  // Sync user state and session timestamps with localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('dalelak_logged_user', JSON.stringify(user));
      if (!localStorage.getItem('dalelak_session_expires_at')) {
        localStorage.setItem('dalelak_session_expires_at', String(Date.now() + SESSION_MAX_DURATION_MS));
      }
      if (!localStorage.getItem('dalelak_last_interaction')) {
        localStorage.setItem('dalelak_last_interaction', String(Date.now()));
      }
    } else {
      localStorage.removeItem('dalelak_logged_user');
      localStorage.removeItem('dalelak_session_expires_at');
      localStorage.removeItem('dalelak_last_interaction');
    }
  }, [user]);

  const [businesses, setBusinesses] = useState<Business[]>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('dalelak_cached_businesses') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return INITIAL_BUSINESSES;
  });

  const [representatives, setRepresentatives] = useState<Representative[]>(() => {
    const map = new Map<string, Representative>();
    MOCK_REPRESENTATIVES.forEach((r) => map.set(r.email.toLowerCase(), r));
    try {
      const cached = JSON.parse(localStorage.getItem('dalelak_custom_reps') || '[]');
      if (Array.isArray(cached)) {
        cached.forEach((r) => map.set(r.email.toLowerCase(), { ...map.get(r.email.toLowerCase()), ...r }));
      }
    } catch {}
    return Array.from(map.values());
  });
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig>(() => {
    const saved = localStorage.getItem('dalelak_payment_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PAYMENT_CONFIG, ...parsed, instaPayHandle: parsed.instaPayHandle || '@daz31181' };
      } catch (e) {}
    }
    return DEFAULT_PAYMENT_CONFIG;
  });

  // Navigation Tabs: 'home' | 'map' | 'add' | 'invoices' | 'admin' | 'profile'
  const [activeTab, setActiveTab] = useState<string>(() => {
    // 1. Check URL query string first (?tab=...)
    const urlParams = new URLSearchParams(window.location.search);
    const urlTab = urlParams.get('tab');
    if (urlTab && ['home', 'map', 'add', 'invoices', 'admin', 'profile'].includes(urlTab)) {
      return urlTab;
    }

    // 2. Check URL hash (#map, #add, #invoices, #admin, #profile)
    const hashTab = window.location.hash.replace('#', '').trim();
    if (hashTab && ['home', 'map', 'add', 'invoices', 'admin', 'profile'].includes(hashTab)) {
      return hashTab;
    }

    // 3. Check localStorage key 'dalelak_active_tab'
    const savedTab = localStorage.getItem('dalelak_active_tab');
    if (savedTab && ['home', 'map', 'add', 'invoices', 'admin', 'profile'].includes(savedTab)) {
      return savedTab;
    }

    // 4. Default fallback check for logged user role
    const savedUserStr = localStorage.getItem('dalelak_logged_user');
    if (savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        if (parsed?.role === 'admin') return 'admin';
      } catch (e) {}
    }

    return 'home';
  });

  // Sync activeTab state with localStorage and browser URL (Query Param & Hash)
  useEffect(() => {
    // Always guarantee body scrolling is freely active on tab/page change
    document.body.style.overflow = '';

    if (activeTab) {
      localStorage.setItem('dalelak_active_tab', activeTab);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      url.hash = activeTab;
      if (activeTab !== 'admin') {
        url.searchParams.delete('subtab');
      }
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeTab]);

  // Modals & Selected items
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [selectedInvoiceBiz, setSelectedInvoiceBiz] = useState<Business | null>(null);
  const [selectedPayBiz, setSelectedPayBiz] = useState<Business | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);
  const [showPackagesModal, setShowPackagesModal] = useState<boolean>(false);
  const [showAdminProfileModal, setShowAdminProfileModal] = useState<boolean>(false);

  // Interested Leads State & Conversion
  const [leads, setLeads] = useState<InterestedLead[]>([]);
  const [convertingLead, setConvertingLead] = useState<InterestedLead | null>(null);

  // Home Feed Search & Filters
  const [homeSearchQuery, setHomeSearchQuery] = useState<string>('');
  const [homeStatusFilter, setHomeStatusFilter] = useState<string>('all');

  // External View State (from QR code scanning)
  const [externalView, setExternalView] = useState<{ type: 'invoice' | 'rep', id: string } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setNotifications((prev) => [...prev, { id, message, type, createdAt: Date.now() }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5500);
  };

  // Persistent System Notifications for Bell Notification Center
  const INITIAL_SYSTEM_NOTIFICATIONS: SystemNotification[] = useMemo(
    () => [
      {
        id: 'sys_init_1',
        title: 'مرحباً بك في منصة دليلك 🚀',
        message: 'تفعيل كامل لمنظومة الإشعارات والمستجدات الميدانية لمتابعة الأنشطة والحسابات والتحصيلات في مصر.',
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        type: 'info',
        category: 'system',
        targetRole: 'all',
        read: false,
      },
      {
        id: 'sys_init_2',
        title: 'حساب جديد معلق بانتظار التفعيل 👤',
        message: 'طلب تسجيل حساب جديد للمندوب (Ahmed Ezalden - محافظة الجيزة)، الحساب معلق بانتظار مراجعته وتفعيله.',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        type: 'warning',
        category: 'account',
        targetRole: 'admin',
        entityId: 'rep_ahmed_ezalden',
        entityType: 'rep',
        read: false,
        linkTab: 'admin',
      },
      {
        id: 'sys_init_3',
        title: 'تأكيد توثيق نشاط تجاري 📌',
        message: 'تم تفعيل التوثيق الميداني والظهور الرسمي لنشاط "مطعم أبو طارق للكشري" على خرائط جوجل بنجاح.',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        type: 'success',
        category: 'business',
        targetRole: 'admin',
        entityId: 'biz_101',
        entityType: 'business',
        read: true,
        linkTab: 'home',
      },
      {
        id: 'sys_init_4',
        title: 'تسجيل تحصيل فاتورة 💳',
        message: 'تم استلام وتوثيق تحصيل سداد بقيمة 1,500 ج.م للباقة VIP (فاتورة رقم INV-2026-001).',
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        type: 'success',
        category: 'payment',
        targetRole: 'admin',
        entityId: 'biz_101',
        entityType: 'invoice',
        read: true,
        linkTab: 'invoices',
      },
    ],
    []
  );

  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem('dalelak_system_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_SYSTEM_NOTIFICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('dalelak_system_notifications', JSON.stringify(systemNotifications));
    } catch (e) {}
  }, [systemNotifications]);

  const addSystemNotification = (item: {
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
  };

  const handleMarkAllNotificationsAsRead = () => {
    setSystemNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setSystemNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleClearNotifications = () => {
    setSystemNotifications([]);
  };

  // Direct navigation handler for Notification preview clicks
  const handleNotificationNavigate = (tab: string, entityId?: string, entityType?: string) => {
    if (tab) setActiveTab(tab);

    if (entityId) {
      if (entityType === 'business' || (!entityType && (tab === 'home' || tab === 'admin'))) {
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
  };

  // Dynamically merge system notifications with all active business and account activities (No duplicates!)
  const allNotifications = useMemo(() => {
    const list: SystemNotification[] = [...systemNotifications];

    // Auto-generate notifications for all businesses in the system (detailed notification for admin)
    businesses.forEach((biz) => {
      const exists = list.some(
        (n) => n.category === 'business' && (n.entityId === biz.id || n.message.includes(biz.nameAr))
      );
      if (!exists) {
        list.push({
          id: `biz_notif_${biz.id}`,
          title: `إضافة نشاط تجاري جديد: ${biz.nameAr} 🏪`,
          message: `قام المندوب "${biz.repName}" بتسجيل نشاط جديد "${biz.nameAr}" في ${biz.governorate} (${biz.city || ''}) — التصنيف: ${biz.category} — الباقة: ${biz.packageName} (${biz.packagePrice} ج.م) — هاتف المالك: ${biz.ownerPhone || 'غير محدد'}.`,
          timestamp: biz.createdDate ? new Date(biz.createdDate).toISOString() : new Date().toISOString(),
          type: 'info',
          category: 'business',
          targetRole: 'admin',
          entityId: biz.id,
          entityType: 'business',
          read: false,
          linkTab: 'admin',
        });
      }
    });

    // Auto-generate notifications for all suspended accounts
    representatives.forEach((rep) => {
      if (rep.status === 'suspended') {
        const existsSuspended = list.some(
          (n) => n.category === 'account' && (n.entityId === rep.id || n.message.includes(rep.name))
        );
        if (!existsSuspended) {
          list.push({
            id: `rep_suspended_notif_${rep.id}`,
            title: `حساب جديد معلق بانتظار التفعيل 👤`,
            message: `طلب تسجيل حساب مندوب جديد "${rep.name}" (${rep.governorate})، الحساب معلق بانتظار مراجعته وتفعيله.`,
            timestamp: new Date().toISOString(),
            type: 'warning',
            category: 'account',
            targetRole: 'admin',
            entityId: rep.id,
            entityType: 'rep',
            read: false,
            linkTab: 'admin',
          });
        }
      }

      if (rep.avatarStatus === 'pending_approval') {
        const existsAvatar = list.some(
          (n) => n.category === 'avatar' && (n.entityId === rep.id || n.message.includes(rep.name))
        );
        if (!existsAvatar) {
          list.push({
            id: `rep_avatar_notif_${rep.id}`,
            title: `صورة شخصية جديدة للمراجعة 📸`,
            message: `قام المندوب "${rep.name}" برفع صورة شخصية جديدة للمراجعة والاعتماد.`,
            timestamp: new Date().toISOString(),
            type: 'info',
            category: 'avatar',
            targetRole: 'admin',
            entityId: rep.id,
            entityType: 'rep',
            read: false,
            linkTab: 'admin',
          });
        }
      }
    });

    // Deduplicate by title & entityId
    const uniqueMap = new Map<string, SystemNotification>();
    list.forEach((n) => {
      const key = `${n.title}_${n.entityId || n.message.substring(0, 20)}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, n);
      }
    });

    // Sort newest first by timestamp
    return Array.from(uniqueMap.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [systemNotifications, businesses, representatives]);

  // Parse URL for deep linking (QR codes)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view');
    const id = urlParams.get('id');

    if (view === 'invoice' && id) {
      setExternalView({ type: 'invoice', id });
    } else if (view === 'rep' && id) {
      setExternalView({ type: 'rep', id });
    }
  }, []);

  // Live Session Expiration & Idle Inactivity Auto-Logout Watcher
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      localStorage.setItem('dalelak_last_interaction', String(Date.now()));
    };

    window.addEventListener('click', updateActivity, { passive: true });
    window.addEventListener('touchstart', updateActivity, { passive: true });
    window.addEventListener('keydown', updateActivity, { passive: true });
    window.addEventListener('scroll', updateActivity, { passive: true });

    // Check expiration every 10 seconds
    const interval = setInterval(() => {
      const now = Date.now();
      const sessionExpiresAt = Number(localStorage.getItem('dalelak_session_expires_at')) || 0;
      const lastInteraction = Number(localStorage.getItem('dalelak_last_interaction')) || now;

      const isExpired = sessionExpiresAt > 0 && now >= sessionExpiresAt;
      const isIdle = (now - lastInteraction) >= INACTIVITY_TIMEOUT_MS;

      if (isExpired || isIdle) {
        handleLogout();
        setShowLoginModal(true);
        addNotification(
          isIdle
            ? '⏳ تم تسجيل الخروج تلقائياً لعدم النشاط لفترة. يرجى تسجيل الدخول مجدداً.'
            : '⏳ انتهت مدة الجلسة المحددة. يرجى تسجيل الدخول مرة أخرى للمتابعة.',
          'warning'
        );
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [user]);

  // Fetch initial data from Supabase Database & Local Backend
  useEffect(() => {
    Promise.all([fetchBusinessesFromDb(), fetchRepsFromDb(), fetchPayoutRequestsFromDb(), fetchLeadsFromDb()])
      .then(([dbBizData, dbRepsData, dbPayouts, dbLeads]) => {
        if (Array.isArray(dbBizData) && dbBizData.length > 0) {
          setBusinesses(dbBizData);
        } else {
          try {
            const cached = JSON.parse(localStorage.getItem('dalelak_cached_businesses') || '[]');
            if (Array.isArray(cached) && cached.length > 0) {
              setBusinesses(cached);
            }
          } catch {}
        }
        if (Array.isArray(dbPayouts)) {
          setPayoutRequests(dbPayouts);
        }
        if (Array.isArray(dbLeads)) {
          setLeads(dbLeads);
        }

        const repMap = new Map<string, Representative>();
        MOCK_REPRESENTATIVES.forEach((r) => repMap.set(r.email.toLowerCase(), r));
        try {
          const cachedCustom = JSON.parse(localStorage.getItem('dalelak_custom_reps') || '[]');
          if (Array.isArray(cachedCustom)) {
            cachedCustom.forEach((r) => repMap.set(r.email.toLowerCase(), { ...repMap.get(r.email.toLowerCase()), ...r }));
          }
        } catch {}
        if (Array.isArray(dbRepsData) && dbRepsData.length > 0) {
          dbRepsData.forEach((r) => repMap.set(r.email.toLowerCase(), { ...repMap.get(r.email.toLowerCase()), ...r }));
        }

        const mergedReps = Array.from(repMap.values());
        setRepresentatives(mergedReps);

        // Instant user state sync if logged-in representative data changed
        if (user) {
          const freshUserRep = mergedReps.find(
            (r) => r.id === user.id || r.email.toLowerCase() === user.email.toLowerCase()
          );
          if (freshUserRep) {
            setUser((prev) => (prev ? { ...prev, repData: freshUserRep } : prev));
            try {
              localStorage.setItem(
                'dalelak_logged_user',
                JSON.stringify({ ...user, repData: freshUserRep })
              );
            } catch {}
          }
        }

        setIsLoadingData(false);
      })
      .catch((err) => {
        console.error('Error fetching initial database data, using defaults:', err);
        try {
          const cached = JSON.parse(localStorage.getItem('dalelak_cached_businesses') || '[]');
          if (Array.isArray(cached) && cached.length > 0) {
            setBusinesses(cached);
          } else {
            setBusinesses(INITIAL_BUSINESSES);
          }
        } catch {
          setBusinesses(INITIAL_BUSINESSES);
        }
        setIsLoadingData(false);
      });

    fetchPaymentConfigFromDb()
      .then((cfg) => {
        if (cfg) setPaymentConfig(cfg);
      })
      .catch((err) => console.log('Payment config load notice:', err));
  }, []);

  // Live Real-Time Poller & Cross-Tab Syncer (Reflects Admin changes instantaneously)
  useEffect(() => {
    const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;

    const refreshLiveData = async () => {
      try {
        const [freshBiz, freshReps, freshPayouts] = await Promise.all([
          fetchBusinessesFromDb(),
          fetchRepsFromDb(),
          fetchPayoutRequestsFromDb(),
        ]);

        if (Array.isArray(freshBiz) && freshBiz.length > 0) {
          setBusinesses((prev) => {
            const prevMap = new Map<string, Business>(prev.map((b) => [b.id, b]));
            const freshMap = new Map<string, Business>();

            freshBiz.forEach((b) => {
              const current = prevMap.get(b.id);
              if (current) {
                const isCurrentPaid = current.paymentStatus === 'fully_paid' || (current.amountPaid || 0) > 0;
                const isFreshPaid = b.paymentStatus === 'fully_paid' || (b.amountPaid || 0) > 0;
                if (isCurrentPaid && !isFreshPaid) {
                  freshMap.set(b.id, {
                    ...b,
                    amountPaid: current.amountPaid,
                    paymentStatus: current.paymentStatus,
                    paymentMethod: current.paymentMethod || b.paymentMethod,
                    cashCollectedByRep: current.cashCollectedByRep ?? b.cashCollectedByRep,
                  });
                  return;
                }
              }
              freshMap.set(b.id, b);
            });

            prev.forEach((b) => {
              if (!freshMap.has(b.id)) freshMap.set(b.id, b);
            });

            const merged = Array.from(freshMap.values());
            try {
              localStorage.setItem('dalelak_cached_businesses', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }

        if (Array.isArray(freshPayouts)) {
          setPayoutRequests(freshPayouts);
        }

        if (Array.isArray(freshReps) && freshReps.length > 0) {
          setRepresentatives((prev) => {
            const map = new Map<string, Representative>();
            prev.forEach((r) => map.set(r.email.toLowerCase(), r));
            freshReps.forEach((r) => map.set(r.email.toLowerCase(), { ...map.get(r.email.toLowerCase()), ...r }));
            return Array.from(map.values());
          });

          // Sync current logged-in user in real time
          if (user) {
            const myFreshRep = freshReps.find(
              (r) => r.id === user.id || r.email.toLowerCase() === user.email.toLowerCase()
            );
            if (myFreshRep) {
              setUser((prev) => (prev ? { ...prev, repData: myFreshRep } : prev));
              try {
                localStorage.setItem(
                  'dalelak_logged_user',
                  JSON.stringify({ ...user, repData: myFreshRep })
                );
              } catch {}
            }
          }
        }
      } catch (err) {
        // silent
      }
    };

    if (syncChannel) {
      syncChannel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_DATA' || event.data?.type === 'REP_UPDATED') {
          refreshLiveData();
        }
      };
    }

    const interval = setInterval(refreshLiveData, 8000);

    return () => {
      clearInterval(interval);
      if (syncChannel) syncChannel.close();
    };
  }, [user?.id, user?.email]);

  // Handlers synced with Supabase Database & Real-Time Lifecycle
  const handleAddBusiness = async (newBiz: Business) => {
    // 1. Automatically calculate payment status from amountPaid and packagePrice
    const autoPaymentStatus = (newBiz.amountPaid || 0) >= (newBiz.packagePrice || 250)
      ? 'fully_paid'
      : (newBiz.amountPaid || 0) > 0
      ? 'partially_paid'
      : 'unpaid';

    const normalizedBiz: Business = {
      ...newBiz,
      repId: newBiz.repId || currentRep.id || user?.id || 'rep_1',
      repName: newBiz.repName || currentRep.name || user?.name || 'مندوب معتمد',
      paymentStatus: autoPaymentStatus,
    };

    setBusinesses((prev) => {
      const map = new Map<string, Business>();
      map.set(normalizedBiz.id, normalizedBiz);
      prev.forEach((b) => {
        if (!map.has(b.id)) map.set(b.id, b);
      });
      const updated = Array.from(map.values());
      try {
        localStorage.setItem('dalelak_cached_businesses', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    await saveBusinessToDb(normalizedBiz);
    addNotification(`🎉 تم تسجيل النشاط التجاري "${normalizedBiz.nameAr}" بنجاح وجاري مراجعته!`, 'success');

    // Broadcast across tabs
    try {
      const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (syncChannel) {
        syncChannel.postMessage({ type: 'SYNC_DATA' });
        syncChannel.close();
      }
    } catch {}
    
    // 1. Broadcast notification for Admin
    addSystemNotification({
      title: 'تسجيل نشاط تجاري جديد 🏪',
      message: `قام المندوب "${normalizedBiz.repName || user?.name || 'ميداني'}" بتسجيل نشاط جديد "${normalizedBiz.nameAr}" في (${normalizedBiz.governorate} - ${normalizedBiz.city}).`,
      type: 'info',
      category: 'business',
      targetRole: 'admin',
      linkTab: 'admin',
    });

    // 2. Personal confirmation notification for registering representative
    if (normalizedBiz.repId || user?.id) {
      addSystemNotification({
        title: `🎉 تم تسجيل نشاطك: ${normalizedBiz.nameAr}`,
        message: `تم تسليم وحفظ بيانات النشاط "${normalizedBiz.nameAr}" بنجاح وجاري مراجعته وتوثيقه.`,
        type: 'success',
        category: 'business',
        targetUserId: normalizedBiz.repId || user?.id,
        entityId: normalizedBiz.id,
        entityType: 'business',
        linkTab: 'home',
      });
    }
  };

  const handleUpdateBusiness = async (updatedBiz: Business) => {
    const prevBiz = businesses.find((b) => b.id === updatedBiz.id);

    // Automatically recalculate payment status based on amountPaid and packagePrice
    const autoPaymentStatus = (updatedBiz.amountPaid || 0) >= (updatedBiz.packagePrice || 250)
      ? 'fully_paid'
      : (updatedBiz.amountPaid || 0) > 0
      ? 'partially_paid'
      : 'unpaid';

    const normalizedBiz: Business = {
      ...updatedBiz,
      paymentStatus: autoPaymentStatus,
    };

    setBusinesses((prev) => {
      const updated = prev.map((b) => (b.id === normalizedBiz.id ? normalizedBiz : b));
      try {
        localStorage.setItem('dalelak_cached_businesses', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    updateBusinessInDb(normalizedBiz.id, normalizedBiz);
    
    // 1. Verification status change notification
    if (prevBiz && prevBiz.verificationStatus !== normalizedBiz.verificationStatus) {
      const statusMap: Record<string, string> = {
        verified: 'مقبول وموثق ✅',
        rejected: 'مرفوض ✕',
        in_progress: 'قيد المراجعة ⏳',
      };
      const newStatus = statusMap[normalizedBiz.verificationStatus] || normalizedBiz.verificationStatus;
      addNotification(`🔔 تم تحديث حالة نشاط "${normalizedBiz.nameAr}" إلى: ${newStatus}`, 'info');

      addSystemNotification({
        title: 'تحديث توثيق النشاط 🗺️',
        message: `تم تحديث حالة التوثيق لنشاط "${normalizedBiz.nameAr}" إلى (${newStatus}).`,
        type: normalizedBiz.verificationStatus === 'verified' ? 'success' : 'info',
        category: 'business',
        targetRole: 'admin',
        targetUserId: normalizedBiz.repId || user?.id,
        linkTab: 'home',
      });
    } else {
      addNotification(`💾 تم حفظ تعديلات نشاط "${normalizedBiz.nameAr}" بنجاح!`, 'success');
    }

    // 2. Automated Payment lifecycle interaction & Commission Unlock notification for Rep
    if (prevBiz && (prevBiz.amountPaid !== normalizedBiz.amountPaid || prevBiz.paymentStatus !== normalizedBiz.paymentStatus)) {
      const addedAmt = (normalizedBiz.amountPaid || 0) - (prevBiz.amountPaid || 0);
      if (addedAmt > 0) {
        addNotification(`💰 تم تحصيل وتأكيد سداد مبلغ ${addedAmt} ج.م لنشاط "${normalizedBiz.nameAr}" بنجاح! (${normalizedBiz.paymentStatus === 'fully_paid' ? 'مسدد بالكامل ✅' : 'مسدد جزئياً ⏳'})`, 'success');
      }

      addSystemNotification({
        title: 'تحديث تحصيل سداد 💳',
        message: `تم تحديث مدفوعات نشاط "${normalizedBiz.nameAr}" (المبلغ المدفوع: ${normalizedBiz.amountPaid} ج.م - الحالة: ${normalizedBiz.paymentStatus === 'fully_paid' ? 'مدفوع بالكامل ✅' : 'مدفوع جزئياً ⏳'}).`,
        type: 'success',
        category: 'payment',
        targetRole: 'admin',
        linkTab: 'invoices',
      });

      // If payment was added, notify the rep that commission is unlocked and available
      if ((normalizedBiz.amountPaid || 0) > (prevBiz.amountPaid || 0) && normalizedBiz.repId) {
        addSystemNotification({
          title: '💰 تم سداد الفاتورة - عمولتك متاحة للسحب!',
          message: `تم تسجيل سداد مبلغ ${normalizedBiz.amountPaid} ج.م لنشاط "${normalizedBiz.nameAr}"، وأصبحت عمولتك المستحقة متاحة للسحب الفوري في محفظتك.`,
          type: 'success',
          category: 'payment',
          targetUserId: normalizedBiz.repId,
          linkTab: 'profile',
        });
      }
    }

    try {
      await fetch(`/api/businesses/${normalizedBiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedBiz),
      });
    } catch (err) {
      console.log('Express backend sync notice:', err);
    }
  };

  // Commission Payout & Remittance Request Handlers
  const handleCreatePayoutRequest = async (payout: PayoutRequest) => {
    setPayoutRequests((prev) => [payout, ...prev]);
    await createPayoutRequestInDb(payout);
    
    const isRemit = payout.type === 'remittance';
    
    addNotification(
      isRemit
        ? `💳 تم إرسال إشعار وإيصال سداد توريد المنصة بقيمة ${payout.amount} ج.م للإدارة بنجاح!`
        : `💵 تم إرسال طلب سحب العمولة بقيمة ${payout.amount} ج.م للإدارة بنجاح!`,
      'success'
    );
    
    // 1. Notification for Admin
    addSystemNotification({
      title: isRemit ? '📥 إشعار سداد وتوريد جديد للمنصة' : '🔔 طلب سحب عمولة جديد',
      message: isRemit
        ? `المندوب "${payout.repName}" أرسل إشعار تحويل وتوريد للمنصة بمبلغ ${payout.amount} ج.م عبر (${payout.method}) مرفقاً صورة الإيصال للمراجعة.`
        : `المندوب "${payout.repName}" يطلب سحب عمولة بقيمة ${payout.amount} ج.م عبر (${payout.method})، الحساب: ${payout.accountDetails}.`,
      type: 'info',
      category: 'payout',
      targetRole: 'admin',
      linkTab: 'admin',
    });

    // 2. Notification for Representative
    addSystemNotification({
      title: isRemit ? '⏳ إشعار السداد قيد المراجعة والتدقيق' : '⏳ طلب سحب العمولة قيد المراجعة',
      message: isRemit
        ? `تم استلام إيصال سدادك بمبلغ ${payout.amount} ج.م وجاري مراجعته وتدقيقه من قبل الإدارة لتصفية حسابك.`
        : `تم استلام طلب سحب أرباحك بمبلغ ${payout.amount} ج.م وجاري مراجعته والتحويل من الإدارة.`,
      type: 'info',
      category: 'payout',
      targetUserId: payout.repId,
      linkTab: 'home',
    });
  };

  const handleUpdatePayoutRequest = async (payout: PayoutRequest) => {
    setPayoutRequests((prev) => prev.map((p) => (p.id === payout.id ? payout : p)));
    await updatePayoutRequestInDb(payout);

    const isRemit = payout.type === 'remittance';

    if (payout.status === 'approved') {
      addNotification(
        isRemit
          ? `✅ تم اعتماد وتأكيد استلام سداد المندوب "${payout.repName}" بمبلغ ${payout.amount} ج.م!`
          : `✅ تم تأكيد وصرف الحوالة للمندوب "${payout.repName}" بمبلغ ${payout.amount} ج.م!`,
        'success'
      );
      addSystemNotification({
        title: isRemit ? '🎉 تم اعتماد وتأكيد سدادك بنجاح!' : '🎉 تم تحويل وصرف العمولة بنجاح!',
        message: isRemit
          ? `تمت مراجعة إيصالك واعتماد سداد مبلغ ${payout.amount} ج.م وتصفية ذمتك المالية لدى المنصة بنجاح.`
          : `تم تحويل مبلغ ${payout.amount} ج.م بنجاح إلى حسابك (${payout.accountDetails})${payout.transactionRef ? ` - رقم العملية: ${payout.transactionRef}` : ''}.`,
        type: 'success',
        category: 'payout',
        targetUserId: payout.repId,
        linkTab: 'home',
      });
    } else if (payout.status === 'rejected') {
      addNotification(
        isRemit
          ? `❌ تم رفض إشعار سداد المندوب "${payout.repName}".`
          : `❌ تم رفض طلب سحب المندوب "${payout.repName}".`,
        'warning'
      );
      addSystemNotification({
        title: isRemit ? '⚠️ تنبيه: تم رفض إشعار السداد' : '⚠️ تنبيه: تم رفض طلب سحب العمولة',
        message: isRemit
          ? `تم رفض إشعار سداد المبلغ (${payout.amount} ج.م) بسبب: ${payout.adminNotes || 'يرجى التأكد من وضوح الإيصال وصحة بيانات التحويل'}.`
          : `تم رفض طلب سحب المبلغ (${payout.amount} ج.م) بسبب: ${payout.adminNotes || 'يرجى مراجعة الإدارة'}، وقد عاد المبلغ تلقائياً لرصيدك المتاح للسحب.`,
        type: 'error',
        category: 'payout',
        targetUserId: payout.repId,
        linkTab: 'home',
      });
    }
  };

  // ---------------------------------------------------------------------------
  // INTERESTED LEADS (CRM) HANDLERS
  // ---------------------------------------------------------------------------
  const handleCreateLead = async (newLead: InterestedLead) => {
    setLeads((prev) => [newLead, ...prev]);
    await saveLeadToDb(newLead);
    addNotification(`✨ تم حفظ بيانات العميل المهتم "${newLead.clientName}" بنجاح!`, 'success');
  };

  const handleUpdateLead = async (updatedLead: InterestedLead) => {
    setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
    await updateLeadInDb(updatedLead);
    addNotification(`تم تحديث بيانات ومتابعة العميل "${updatedLead.clientName}".`, 'info');
  };

  const handleDeleteLead = async (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    await deleteLeadFromDb(leadId);
    addNotification('تم حذف العميل من سجل المتابعات.', 'info');
  };

  const handleConvertToBusiness = (lead: InterestedLead) => {
    setConvertingLead(lead);
    setActiveTab('add');
    addNotification(`جاري تحويل بيانات العميل "${lead.clientName}" إلى نموذج تسجيل نشاط جديد...`, 'info');
  };

  // ---------------------------------------------------------------------------
  // ADMIN & USER PROFILE UPDATE HANDLER
  // ---------------------------------------------------------------------------
  const handleUpdateUserProfile = async (updatedData: Partial<Representative> & { name?: string; email?: string; avatar?: string }) => {
    if (!user) return;

    const newName = updatedData.name || user.name;
    const newEmail = updatedData.email || user.email;
    const newAvatar = updatedData.avatar !== undefined ? updatedData.avatar : user.avatar;

    const updatedUser: User = {
      ...user,
      name: newName,
      email: newEmail,
      avatar: newAvatar,
      repData: user.repData
        ? {
            ...user.repData,
            name: newName,
            email: newEmail,
            phone: updatedData.phone || user.repData.phone,
            avatar: newAvatar,
            avatarStatus: 'approved',
          }
        : undefined,
    };

    setUser(updatedUser);
    localStorage.setItem('dalelak_user', JSON.stringify(updatedUser));
    localStorage.setItem('dalelak_logged_user', JSON.stringify(updatedUser));

    // Update representative records in state and backend
    const repId = user.repData?.id || user.id;
    const existingRep = representatives.find((r) => r.id === repId || r.email.toLowerCase() === user.email.toLowerCase());
    if (existingRep) {
      const freshRep: Representative = {
        ...existingRep,
        name: newName,
        email: newEmail,
        phone: updatedData.phone || existingRep.phone,
        avatar: newAvatar,
        avatarStatus: 'approved',
      };
      setRepresentatives((prev) => prev.map((r) => (r.id === freshRep.id ? freshRep : r)));
      await saveRepToDb(freshRep);
    }

    addNotification('✅ تم تحديث بياناتك وصورة البروفايل بنجاح!', 'success');
  };

  const handleDeleteBusiness = async (id: string) => {
    const biz = businesses.find((b) => b.id === id);

    // 1. Immediately remove from businesses state and update cache
    setBusinesses((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      try {
        localStorage.setItem('dalelak_cached_businesses', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Clean up any open modals or selected references
    if (editingBusiness?.id === id) setEditingBusiness(null);
    if (selectedInvoiceBiz?.id === id) setSelectedInvoiceBiz(null);
    if (selectedPayBiz?.id === id) setSelectedPayBiz(null);

    // 3. Delete associated system notifications
    setSystemNotifications((prev) =>
      prev.filter(
        (n) =>
          n.entityId !== id &&
          (!biz?.nameAr || !n.message.includes(biz.nameAr)) &&
          (!biz?.invoiceNumber || !n.message.includes(biz.invoiceNumber))
      )
    );

    // 4. Delete associated leads
    setLeads((prev) =>
      prev.filter(
        (l) =>
          l.id !== id &&
          (!biz?.phone || l.phone !== biz.phone) &&
          (!biz?.nameAr || l.businessName !== biz.nameAr)
      )
    );

    // 5. Delete from backend database / Supabase / local server
    await deleteBusinessFromDb(id);

    // 6. Broadcast deletion across open tabs
    try {
      const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (syncChannel) {
        syncChannel.postMessage({ type: 'SYNC_DATA', deletedBizId: id });
        syncChannel.close();
      }
    } catch {}

    if (biz) {
      addNotification(`🗑️ تم حذف النشاط "${biz.nameAr}" وكافة سجلاته نهائياً من المنظومة.`, 'warning');
      addSystemNotification({
        title: 'حذف نشاط تجاري 🗑️',
        message: `تم حذف النشاط التجاري "${biz.nameAr}" وكافة بياناته نهائياً من المنظومة وقاعدة البيانات.`,
        type: 'warning',
        category: 'business',
        targetRole: 'admin',
      });
    }
  };

  const handleAddRepresentative = async (repData: Partial<Representative>) => {
    const timestamp = Date.now();
    const newRep: Representative = {
      id: repData.id || `acc_${timestamp}`,
      name: repData.name || 'حساب جديد',
      email: repData.email || 'user@daleelek.eg',
      phone: repData.phone || '01000000000',
      nationalId: repData.nationalId || '',
      activationFacePhoto: repData.activationFacePhoto || '',
      nationalIdCardPhoto: repData.nationalIdCardPhoto || '',
      nationalIdCardBackPhoto: repData.nationalIdCardBackPhoto || '',
      role: repData.role || 'rep',
      roleTitle: repData.roleTitle || 'مندوب مبيعات ميداني',
      governorate: repData.governorate || 'القاهرة',
      targetMonth: repData.targetMonth || 25,
      avatar: repData.avatar || '',
      avatarStatus: repData.avatarStatus || 'none',
      commissionRate: repData.commissionRate || 42.86,
      status: repData.status || 'active',
      password: repData.password || 'Aa123456',
      referralCode: repData.referralCode || `DALIL-${timestamp.toString().slice(-4)}`,
      referredByCode: repData.referredByCode || undefined,
      referralUnlocked: repData.referralUnlocked ?? false,
      adminBypassReferral: repData.adminBypassReferral ?? false,
      referralRewardGranted: repData.referralRewardGranted ?? false,
    };

    setRepresentatives((prev) => {
      const filtered = prev.filter((r) => r.id !== newRep.id && r.email.toLowerCase() !== newRep.email.toLowerCase());
      const updated = [newRep, ...filtered];
      try {
        localStorage.setItem('dalelak_custom_reps', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    await saveRepToDb(newRep);
    if (newRep.status === 'suspended') {
      addNotification(`⏳ تم تسجيل طلب حساب جديد لـ "${newRep.name}" بانتظار موافقة المدير لتفعيله.`, 'info');
      addSystemNotification({
        title: 'حساب جديد معلق بانتظار التفعيل 👤',
        message: `قام المندوب "${newRep.name}" بتسجيل حساب جديد (محافظة ${newRep.governorate})، الحساب معلق بانتظار مراجعته وتفعيله.`,
        type: 'warning',
        category: 'account',
        targetRole: 'admin',
        linkTab: 'admin',
      });
      addSystemNotification({
        title: 'طلب الحساب قيد المراجعة ⏳',
        message: 'تم تسليم بيانات حسابك بنجاح وسنقوم بمراجعة وتفعيل الحساب من إدارة المنظومة قريباً.',
        type: 'info',
        category: 'account',
        targetUserId: newRep.id,
      });
    } else {
      addNotification(`👤 تم إنشاء حساب المندوب الجديد "${newRep.name}" بنجاح!`, 'success');
      addSystemNotification({
        title: 'إضافة حساب جديد 👤',
        message: `تم إنشاء حساب جديد بنجاح لـ "${newRep.name}" بصلاحية (${newRep.roleTitle || 'مندوب'}).`,
        type: 'success',
        category: 'account',
        targetRole: 'admin',
        linkTab: 'admin',
      });
    }
  };

  const handleUpdateRepresentative = async (updatedRep: Representative) => {
    const prevRep = representatives.find((r) => r.id === updatedRep.id);
    setRepresentatives((prev) => {
      const updated = prev.map((r) => (r.id === updatedRep.id ? updatedRep : r));
      try {
        localStorage.setItem('dalelak_custom_reps', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // CRITICAL FIX: Always sync user state & localStorage when the logged-in rep's data changes
    // This ensures referral unlock, name, and avatar updates are reflected immediately in real time
    if (user && (user.id === updatedRep.id || user.repData?.id === updatedRep.id || user.email.toLowerCase() === updatedRep.email.toLowerCase())) {
      const updatedUser = { ...user, repData: updatedRep, name: updatedRep.name, email: updatedRep.email };
      setUser(updatedUser);
      try {
        localStorage.setItem('dalelak_logged_user', JSON.stringify(updatedUser));
      } catch {
        // silent
      }
    }

    if (prevRep && prevRep.status !== updatedRep.status) {
      if (updatedRep.status === 'active') {
        addNotification(`✅ تم تفعيل حساب "${updatedRep.name}" بنجاح ويمكنه الدخول الآن!`, 'success');
        addSystemNotification({
          title: 'تفعيل حساب مندوب 👤',
          message: `تم تفعيل حساب المندوب "${updatedRep.name}" وسماح الدخول له بالكامل.`,
          type: 'success',
          category: 'account',
          targetRole: 'admin',
          linkTab: 'admin',
        });
        addSystemNotification({
          title: '🎉 تم تفعيل حسابك بنجاح!',
          message: 'تهانينا! تمت مراجعة وتفعيل حسابك رسمياً من مدير النظام، يمكنك الآن تسجيل وتوثيق المحلات والتحصيل.',
          type: 'success',
          category: 'account',
          targetUserId: updatedRep.id,
        });
      } else {
        addNotification(`🔒 تم تعليق حساب "${updatedRep.name}" مؤقتاً.`, 'warning');
        addSystemNotification({
          title: 'تعليق حساب مندوب 🔒',
          message: `تم تعليق حساب المندوب "${updatedRep.name}" مؤقتاً.`,
          type: 'warning',
          category: 'account',
          targetRole: 'admin',
        });
      }
    } else if (prevRep && prevRep.avatarStatus !== updatedRep.avatarStatus && updatedRep.avatarStatus !== 'none') {
      if (updatedRep.avatarStatus === 'approved') {
        addNotification(`📸 تمت الموافقة على صورة ملف "${updatedRep.name}" وتفعيلها في حسابه!`, 'success');
        addSystemNotification({
          title: 'اعتماد صورة المندوب 📸',
          message: `تمت الموافقة على الصورة الشخصية للمندوب "${updatedRep.name}".`,
          type: 'success',
          category: 'avatar',
          targetRole: 'admin',
        });
        addSystemNotification({
          title: '📸 تمت الموافقة على صورتك الشخصية!',
          message: 'تم اعتماد وتوثيق صورتك الشخصية رسمياً وتحديث بطاقتك الرقمية التكليفية.',
          type: 'success',
          category: 'avatar',
          targetUserId: updatedRep.id,
          linkTab: 'profile',
        });
      } else if (updatedRep.avatarStatus === 'rejected') {
        addNotification(`❌ تم رفض صورة ملف "${updatedRep.name}" — يجب رفع صورة بديلة.`, 'warning');
        addSystemNotification({
          title: '❌ مرفوض: الصورة الشخصية',
          message: 'تم رفض الصورة الشخصية المرفوعة، يرجى إعادة رفع صورة رسمية واضحة ومطابقة للضوابط.',
          type: 'error',
          category: 'avatar',
          targetUserId: updatedRep.id,
          linkTab: 'profile',
        });
      } else {
        addNotification(`⏳ تم إرسال صورة "${updatedRep.name}" لمراجعة المدير.`, 'info');
        addSystemNotification({
          title: 'صورة شخصية جديدة للمراجعة 📸',
          message: `قام المندوب "${updatedRep.name}" برفع صورة شخصية جديدة للمراجعة والاعتماد.`,
          type: 'info',
          category: 'avatar',
          targetRole: 'admin',
          linkTab: 'admin',
        });
      }
    } else {
      addNotification(`💾 تم حفظ تعديلات حساب "${updatedRep.name}" بنجاح!`, 'success');
    }

    await saveRepToDb(updatedRep);

    try {
      const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (channel) {
        channel.postMessage({ type: 'REP_UPDATED', repId: updatedRep.id });
        channel.close();
      }
    } catch {}
  };

  const handleDeleteRepresentative = async (id: string) => {
    const rep = representatives.find((r) => r.id === id);
    setRepresentatives(representatives.filter((r) => r.id !== id));
    // Delete from Supabase DB via service layer
    await deleteRepFromDb(id);
    if (rep) {
      addNotification(`🗑️ تم حذف حساب المندوب "${rep.name}" نهائياً من النظام.`, 'warning');
      addSystemNotification({
        title: 'حذف حساب مندوب 🗑️',
        message: `تم حذف حساب المندوب "${rep.name}" نهائياً من المنظومة.`,
        type: 'warning',
        category: 'account',
        targetRole: 'admin',
      });
    }
  };

  const handleUpdatePaymentConfig = async (newConfig: PaymentGatewayConfig) => {
    setPaymentConfig(newConfig);
    try {
      localStorage.setItem('dalelak_payment_config', JSON.stringify(newConfig));
    } catch {}
    await savePaymentConfigToDb(newConfig);
  };

  const liveRep = user
    ? representatives.find((r) => r.id === user.id || (user.email && r.email.toLowerCase() === user.email.toLowerCase()) || r.name === user.name)
    : null;

  const currentRep: Representative = {
    id: user?.repData?.id || liveRep?.id || user?.id || 'rep_1',
    name: user?.repData?.name || liveRep?.name || user?.name || 'مندوب معتمد',
    email: user?.repData?.email || liveRep?.email || user?.email || '',
    phone: user?.repData?.phone || liveRep?.phone || user?.phone || '',
    nationalId: user?.repData?.nationalId || liveRep?.nationalId || '',
    role: user?.repData?.role || liveRep?.role || user?.role || 'rep',
    roleTitle: user?.repData?.roleTitle || liveRep?.roleTitle || (user?.role === 'admin' ? 'مدير النظام' : 'مندوب مبيعات ميداني'),
    governorate: user?.repData?.governorate || liveRep?.governorate || 'القاهرة',
    targetMonth: user?.repData?.targetMonth || liveRep?.targetMonth || 25,
    avatar: user?.repData?.avatar || liveRep?.avatar || user?.avatar || '',
    avatarStatus: user?.repData?.avatarStatus || liveRep?.avatarStatus || user?.avatarStatus || 'none',
    commissionRate: user?.repData?.commissionRate || liveRep?.commissionRate || (user?.role === 'admin' ? 0 : 42.86),
    status: user?.repData?.status || liveRep?.status || 'active',
    referralCode: user?.repData?.referralCode || liveRep?.referralCode || undefined,
    referredByCode: user?.repData?.referredByCode || liveRep?.referredByCode || undefined,
    referralUnlocked: user?.repData?.referralUnlocked ?? liveRep?.referralUnlocked ?? true,
    adminBypassReferral: user?.repData?.adminBypassReferral ?? liveRep?.adminBypassReferral ?? true,
  };

  const isRepUser = user?.role === 'rep';

  // Strict Scoping & Newest-First Sorting:
  const scopedBusinesses = useMemo(() => {
    if (!isRepUser) return sortBusinessesNewestFirst(businesses);

    const repId = (currentRep.id || '').toLowerCase().trim();
    const repName = (currentRep.name || '').toLowerCase().trim();
    const userId = (user?.id || '').toLowerCase().trim();
    const userName = (user?.name || '').toLowerCase().trim();

    const filtered = businesses.filter((b) => {
      const bRepId = (b.repId || '').toLowerCase().trim();
      const bRepName = (b.repName || '').toLowerCase().trim();

      const matchId = (repId && bRepId === repId) || (userId && bRepId === userId);
      const matchName = 
        (repName && bRepName === repName) || 
        (userName && bRepName === userName) ||
        (repName && bRepName && (bRepName.includes(repName) || repName.includes(bRepName))) ||
        (userName && bRepName && (bRepName.includes(userName) || userName.includes(bRepName)));

      return matchId || matchName;
    });

    return sortBusinessesNewestFirst(filtered);
  }, [isRepUser, businesses, currentRep.id, currentRep.name, user?.id, user?.name]);

  const filteredHomeBusinesses = useMemo(
    () =>
      sortBusinessesNewestFirst(
        scopedBusinesses.filter((b) => {
          if (
            homeSearchQuery &&
            !b.nameAr.includes(homeSearchQuery) &&
            !b.city.includes(homeSearchQuery) &&
            !b.governorate.includes(homeSearchQuery)
          ) {
            return false;
          }
          if (homeStatusFilter !== 'all' && b.paymentStatus !== homeStatusFilter) {
            return false;
          }
          return true;
        })
      ),
    [scopedBusinesses, homeSearchQuery, homeStatusFilter]
  );

  // Single-Session Active Heartbeat & Cross-Tab Invalidation Listener
  useEffect(() => {
    if (!user || !user.activeSessionId) return;

    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_single_session_channel') : null;

    // Send periodic heartbeat every 20 seconds
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Update local rep active timestamp in state
      setRepresentatives((prev) =>
        prev.map((r) =>
          r.id === user.id || (user.role === 'admin' && r.role === 'admin')
            ? { ...r, activeSessionId: user.activeSessionId, lastActiveTimestamp: now }
            : r
        )
      );

      // Sync active session timestamp in Supabase DB
      updateRepSessionInDb(user.id, user.activeSessionId, now);

      // Notify server to keep session alive
      fetch('/api/auth/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, sessionId: user.activeSessionId }),
      })
        .then((res) => {
          if (res.status === 409) {
            // Session was superseded by a newer login
            handleLogout();
            addNotification('⚠️ تم تسجيل الدخول لهذا الحساب من جهاز آخر، تم إنهاء هذه الجلسة.', 'warning');
          }
        })
        .catch(() => {});
    }, 20000);

    // Cross-tab broadcast listener (Prevent simultaneous tabs on same device)
    if (channel) {
      channel.onmessage = (event) => {
        if (
          event.data?.type === 'LOGIN' &&
          event.data?.userId === user.id &&
          event.data?.sessionId !== user.activeSessionId
        ) {
          handleLogout();
          addNotification('⚠️ تم فتح هذا الحساب في تبويب آخر.', 'warning');
        }
      };
    }

    // Release session lock immediately on page close / unload
    const handleUnload = () => {
      if (user?.id && user.activeSessionId) {
        updateRepSessionInDb(user.id, undefined, undefined);
        try {
          const payload = JSON.stringify({ userId: user.id, sessionId: user.activeSessionId });
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/auth/logout', blob);
        } catch {}
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      if (channel) channel.close();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [user]);

  // Remove current user from local storage & release single-session lock
  const handleLogout = useCallback(() => {
    if (user?.id) {
      // Release DB session lock
      updateRepSessionInDb(user.id, undefined, undefined);

      // Release server session lock
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, sessionId: user.activeSessionId }),
      }).catch(() => {});

      // Clear lock on representatives in local state
      setRepresentatives((prev) =>
        prev.map((r) =>
          r.id === user.id || (user.role === 'admin' && r.role === 'admin')
            ? { ...r, activeSessionId: undefined, lastActiveTimestamp: undefined }
            : r
        )
      );
    }

    setUser(null);
    localStorage.removeItem('dalelak_logged_user');
    localStorage.removeItem('dalelak_session_expires_at');
    localStorage.removeItem('dalelak_active_tab');
    setActiveTab('home');
    const url = new URL(window.location.href);
    url.searchParams.delete('tab');
    window.history.replaceState({}, '', url.toString());
  }, [user]);

  // Handler to reload all data when switching mode or resetting test sandbox
  const handleReloadAllData = async () => {
    setIsLoadingData(true);
    try {
      const [bizData, dbRepsData] = await Promise.all([
        fetchBusinessesFromDb(),
        fetchRepsFromDb(),
      ]);
      setBusinesses(bizData && bizData.length > 0 ? bizData : INITIAL_BUSINESSES);
      setRepresentatives(dbRepsData && dbRepsData.length > 0 ? dbRepsData : MOCK_REPRESENTATIVES);
      addNotification('🔄 تمت مزامنة وتحديث البيانات التجريبية بنجاح!', 'info');
    } catch (e) {
      console.error('Reload data error:', e);
    } finally {
      setIsLoadingData(false);
    }
  };

  // -------------------------------------------------------------
  // EXTERNAL READ-ONLY VIEWS (For QR Codes)
  // -------------------------------------------------------------
  if (externalView?.type === 'invoice') {
    const biz = businesses.find(b => b.id === externalView.id || b.invoiceNumber === externalView.id);
    if (isLoadingData) return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl border-[3px] border-amber-500/20 border-t-amber-500 animate-spin" style={{ animation: 'spinGlow 1s linear infinite' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-amber-500 font-black text-lg">د</span>
          </div>
        </div>
        <p className="text-sm font-bold text-[var(--text-muted)]" style={{ animation: 'breathe 2s ease-in-out infinite' }}>جاري تحميل الفاتورة...</p>
      </div>
    );
    if (!biz) return <div className="min-h-screen flex items-center justify-center font-bold text-rose-500">هذه الفاتورة غير موجودة أو تم حذفها.</div>;

    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <InvoiceModal business={biz} onClose={() => {}} isExternalView={true} />
      </div>
    );
  }

  if (externalView?.type === 'rep') {
    const rep = representatives.find(r => r.id === externalView.id);
    if (isLoadingData) return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl border-[3px] border-amber-500/20 border-t-amber-500" style={{ animation: 'spinGlow 1s linear infinite' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-amber-500 font-black text-lg">د</span>
          </div>
        </div>
        <p className="text-sm font-bold text-[var(--text-muted)]" style={{ animation: 'breathe 2s ease-in-out infinite' }}>جاري تحميل البطاقة...</p>
      </div>
    );
    if (!rep) return <div className="min-h-screen flex items-center justify-center font-bold text-rose-500">هذا المندوب غير مسجل في النظام.</div>;

    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <RepProfile 
          user={null as any} 
          rep={rep} 
          businessesCount={0} 
          totalRevenue={0} 
          totalCommission={0} 
          allReps={representatives}
          allBusinesses={businesses}
          onLogout={() => {}} 
          onUpdateRep={() => {}} 
          isExternalView={true} 
        />
      </div>
    );
  }

  // Strict Unauthenticated Protection: If user is not logged in, render ONLY the Login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col font-['Cairo',sans-serif] transition-colors duration-300">
        <div className="flex-1 flex items-center justify-center p-4">
          <LoginModal
            isInline={true}
            onClose={() => {}}
            onOpenAbout={() => setShowAboutModal(true)}
            onOpenTerms={() => setShowTermsModal(true)}
            onLoginSuccess={(u) => {
              setUser(u);
              const savedTab = localStorage.getItem('dalelak_active_tab');
              if (savedTab && ['home', 'map', 'add', 'invoices', 'admin', 'profile'].includes(savedTab)) {
                setActiveTab(savedTab);
              } else if (u.role === 'admin') {
                setActiveTab('admin');
              } else {
                setActiveTab('home');
              }
            }}
            representatives={representatives}
            onAddRepresentative={handleAddRepresentative}
          />
        </div>

        {/* Informational Modals for Unauthenticated Visitors */}
        {showAboutModal && (
          <AboutUsModal
            onClose={() => setShowAboutModal(false)}
            onOpenTerms={() => {
              setShowAboutModal(false);
              setShowTermsModal(true);
            }}
          />
        )}

        {showTermsModal && (
          <TermsModal
            onClose={() => setShowTermsModal(false)}
            onOpenAbout={() => {
              setShowTermsModal(false);
              setShowAboutModal(true);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-safe bg-[var(--bg-primary)] text-[var(--text-primary)] font-['Cairo'] transition-colors duration-300 selection:bg-amber-500/30`}>
      {/* ===================== PROFESSIONAL TOAST NOTIFICATIONS ===================== */}
      <div
        className="fixed right-0 left-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none px-2.5 sm:px-4"
        style={{ top: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))' }}
        aria-live="polite"
        aria-atomic="false"
      >
        {notifications.map((n: any) => {
          const icons: Record<string, string> = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
          };
          const colors: Record<string, string> = {
            success: 'from-emerald-950/98 to-emerald-900/95 border-emerald-500/60 text-emerald-50',
            error:   'from-rose-950/98 to-rose-900/95 border-rose-500/60 text-rose-50',
            warning: 'from-amber-950/98 to-amber-900/95 border-amber-500/60 text-amber-50',
            info:    'from-slate-900/98 to-slate-800/95 border-slate-500/50 text-slate-100',
          };
          const barColors: Record<string, string> = {
            success: 'bg-emerald-400',
            error:   'bg-rose-400',
            warning: 'bg-amber-400',
            info:    'bg-slate-400',
          };
          const colorClass = colors[n.type] || colors.info;
          const barColor = barColors[n.type] || barColors.info;
          const icon = icons[n.type] || icons.info;
          return (
            <div
              key={n.id}
              className={`pointer-events-auto w-full max-w-[calc(100vw-1.25rem)] sm:max-w-sm relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colorClass} shadow-2xl backdrop-blur-xl toast-slide-down`}
              style={{ direction: 'rtl' }}
            >
              {/* Progress Bar */}
              <div
                className={`absolute top-0 right-0 h-1 ${barColor} rounded-t-2xl`}
                style={{
                  animation: `shrink-width 5.5s linear forwards`,
                  width: '100%',
                }}
              />
              {/* Content */}
              <div className="flex items-start gap-2.5 sm:gap-3 px-3.5 py-3 sm:px-4 sm:py-3.5 pt-3.5 sm:pt-4">
                <span className="text-base sm:text-lg leading-none shrink-0 mt-0.5">{icon}</span>
                <span className="flex-1 text-xs sm:text-[13px] font-bold leading-relaxed">{n.message}</span>
                <button
                  onClick={() => setNotifications((prev: any[]) => prev.filter((x: any) => x.id !== n.id))}
                  className="shrink-0 p-1 text-white/60 hover:text-white transition-colors cursor-pointer mt-0.5 hover:scale-110 active:scale-90"
                  aria-label="إغلاق الإشعار"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {/* =========================================================================== */}
      {/* Top App Bar - Fixed */}
      <Navbar
        user={user}
        onOpenLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        onOpenProfile={() => setShowAdminProfileModal(true)}
        activeTab={activeTab}
        systemNotifications={allNotifications}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onClearNotifications={handleClearNotifications}
        onNavigateTab={handleNotificationNavigate}
        onOpenAbout={() => setShowAboutModal(true)}
        onOpenTerms={() => setShowTermsModal(true)}
        onOpenPermissions={() => setShowPermissionsModal(true)}
        onOpenPackages={() => setShowPackagesModal(true)}
      />

      {/* Main App Container */}
      <main className="flex-1 w-full mx-auto max-w-7xl p-3 sm:p-5">
        {/* TAB 1: HOME FEED */}
        {activeTab === 'home' && (
          <div className="space-y-5 pb-20 tab-content-enter">
            {/* Field Banner (Only for non-rep or general view to avoid duplicate headers) */}
            {user?.role !== 'rep' && (
              <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 p-4 sm:p-5 rounded-3xl shadow-xl flex items-center justify-between">
                <div>
                  <span className="bg-slate-950/20 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    منظومة دليلك الميدانية الشاملة
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black mt-1">المنصة الشاملة لإدارة وتوثيق الأنشطة والخدمات في مصر</h1>
                  <p className="text-xs font-bold text-slate-900/90 mt-1 max-w-lg">
                    تسجيل مباشر لبيانات المحلات، إحداثيات GPS الدقيقة، وإصدار الفواتير الإلكترونية على واتساب صاحب النشاط في جميع محافظات مصر.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('add')}
                  className="hidden sm:flex bg-slate-950 hover:bg-slate-900 text-amber-400 font-extrabold text-xs px-4 py-3 rounded-2xl shadow-lg items-center gap-2 transition-transform active:scale-95 shrink-0 cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5 text-amber-400" />
                  <span>تسجيل نشاط جديد</span>
                </button>
              </div>
            )}

            {/* Quick Rep Workspace summary if Rep logged in */}
            {user?.role === 'rep' && (
              <RepDashboard
                rep={currentRep}
                businesses={businesses}
                allReps={representatives}
                payoutRequests={payoutRequests}
                onAddNewClick={() => setActiveTab('add')}
                onShowInvoice={(b) => setSelectedInvoiceBiz(b)}
                onRequestPayout={handleCreatePayoutRequest}
              />
            )}

            {/* Registered Businesses Feed */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-md transition-colors duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[var(--text-primary)]">
                      {isRepUser
                        ? `الأنشطة المسجلة بواسطتك (${scopedBusinesses.length})`
                        : `الأنشطة المسجلة في مصر (${businesses.length})`}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">تابع حالة الدفع والتفعيل على الخريطة أولاً بأول</p>
                  </div>
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="بحث باسم النشاط أو المدينة..."
                      value={homeSearchQuery}
                      onChange={(e) => setHomeSearchQuery(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl pr-8 pl-3 py-1.5 focus:outline-none focus:border-amber-500 shadow-sm"
                    />
                  </div>

                  <select
                    value={homeStatusFilter}
                    onChange={(e) => setHomeStatusFilter(e.target.value)}
                    className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-500 shrink-0 shadow-sm font-bold"
                  >
                    <option value="all">كل حالات الدفع</option>
                    <option value="fully_paid">مدفوعة بالكامل</option>
                    <option value="partially_paid">مدفوع جزء منها</option>
                    <option value="unpaid">لم يتم الدفع نهائياً</option>
                  </select>
                </div>
              </div>

              {/* Feed Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                {filteredHomeBusinesses.length === 0 && (
                  <div className="col-span-full text-center py-10 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] space-y-2 shadow-sm">
                    <Building2 className="w-10 h-10 text-[var(--text-muted)] mx-auto opacity-50" />
                    <p className="font-extrabold text-sm text-[var(--text-primary)]">لم تقوم بتسجيل أي أنشطة بعد أو لا توجد نتائج للبحث</p>
                    <p className="text-xs text-[var(--text-muted)] font-bold">اضغط على زر "تسجيل نشاط جديد" للبدء في توثيق أنشطتك من الميدان.</p>
                  </div>
                )}

                {filteredHomeBusinesses.map((biz) => {
                  const remaining = Math.max(0, (biz.packagePrice || 0) - (biz.amountPaid || 0));
                  const isCreator =
                    user?.role === 'admin' ||
                    biz.repId === user?.id ||
                    biz.repId === user?.repData?.id ||
                    biz.repName === user?.name;

                  return (
                    <div key={biz.id} className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3 hover:border-amber-500/30 transition-all flex flex-col justify-between shadow-sm">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                              {biz.category}
                            </span>
                            <h4 className="font-extrabold text-base text-[var(--text-primary)] mt-1">{biz.nameAr}</h4>
                            <p className="text-xs text-[var(--text-secondary)] font-bold">
                              {biz.governorate} - {biz.city}
                            </p>
                          </div>

                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 shadow-sm ${
                            biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced'
                              ? remaining > 0
                                ? 'badge-warning'
                                : 'badge-success'
                              : 'badge-warning'
                          }`}>
                            {biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced'
                              ? remaining > 0 ? '✅ موثق (متبقي سداد ⚠️)' : '✅ موثق ومعتمد'
                              : '⏳ جاري المعالجة'}
                          </span>
                        </div>

                        {/* Addition Time & Representative info */}
                        <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)] space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[11px] font-bold">
                              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>وقت الإضافة:</span>
                            </div>
                            <span className="font-extrabold text-[var(--text-primary)] text-[11px] font-sans tracking-tight bg-[var(--bg-surface)] px-2.5 py-0.5 rounded-lg border border-[var(--border-color)]/70">
                              {formatActivityDateTime(biz.createdDate || biz.invoiceDate)}
                            </span>
                          </div>

                          {biz.repName && (
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border-color)]/50 text-[10px] text-[var(--text-muted)]">
                              <span>المندوب المسجل:</span>
                              <span className="font-bold text-[var(--text-secondary)] truncate max-w-[190px]">
                                {biz.repName}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Package & Payment Status */}
                        <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)] space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)] font-bold text-[11px]">الباقة:</span>
                            <span className="text-[11px] font-black text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 truncate max-w-[190px]">
                              {biz.packageName || 'باقة التوثيق الأساسي'} ({biz.packagePrice || 250} ج.م)
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-[var(--border-color)]/50">
                            <span className="text-[var(--text-secondary)] font-bold text-[11px]">حالة السداد:</span>
                            <div>
                              {(() => {
                                const payInfo = getBusinessPaymentLabel(biz);
                                if ((biz.amountPaid || 0) > 0) {
                                  return (
                                    <span className={`font-extrabold ${payInfo.isCash ? 'text-emerald-700 dark:text-emerald-400' : 'text-purple-700 dark:text-purple-400'}`}>
                                      {payInfo.label}
                                      {remaining > 0 && <span className="text-rose-600 dark:text-rose-400 text-[10px] mr-1"> (متبقي {remaining} ج)</span>}
                                    </span>
                                  );
                                }
                                return (
                                  <span className="font-black text-amber-700 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30 text-[10.5px]">
                                    {payInfo.label}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Commission Clarity Row */}
                          <div className="flex items-center justify-between pt-1 border-t border-[var(--border-color)]/50 text-[11px]">
                            <span className="text-[var(--text-muted)] font-bold">موقف العمولة:</span>
                            {(() => {
                              const repRate = biz.repCommissionRate || 42.86;
                              const isLive = biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced';
                              const paid = biz.amountPaid || 0;
                              const earnedComm = Math.round((paid * repRate) / 100);
                              const fullComm = Math.round(((biz.packagePrice || 250) * repRate) / 100);

                              if (isLive && paid > 0) {
                                return (
                                  <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>محققة ومتاحة: {earnedComm} ج.م</span>
                                  </span>
                                );
                              } else if (paid > 0 && !isLive) {
                                return (
                                  <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 text-[10.5px]">
                                    💵 استلمت كاش ({paid} ج) • عمولتك {earnedComm} ج
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 text-[10px]">
                                    ⏳ عمولة منتظرة: {fullComm} ج.م عند التفعيل والسداد
                                  </span>
                                );
                              }
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => setEditingBusiness(biz)}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-4 h-4 stroke-[2.5]" />
                          <span>{isCreator ? 'تفاصيل وتعديل النشاط' : 'عرض التفاصيل (قراءة فقط)'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE MAP OVERVIEW */}
        {activeTab === 'map' && (
          <div className="space-y-4 pb-20 tab-content-enter">
            <InteractiveMap
              mode="view"
              businesses={scopedBusinesses}
              onSelectBusiness={(b) => setSelectedInvoiceBiz(b)}
              onEditBusiness={(b) => setEditingBusiness(b)}
              heightClass="h-[520px]"
            />
          </div>
        )}

        {/* TAB 3: REGISTER NEW BUSINESS FORM */}
        {activeTab === 'add' && (
          <BusinessForm
            onSubmitBusiness={(newBiz) => {
              handleAddBusiness(newBiz);
              if (convertingLead) {
                handleUpdateLead({ ...convertingLead, status: 'converted' });
                setConvertingLead(null);
              }
            }}
            currentRep={currentRep}
            onShowInvoice={(b) => setSelectedInvoiceBiz(b)}
            businesses={businesses}
            onSaveLead={handleCreateLead}
            initialLead={convertingLead}
            onOpenPackages={() => setShowPackagesModal(true)}
          />
        )}

        {/* TAB 4: REVIEWS & INTERESTED LEADS HUB */}
        {activeTab === 'invoices' && (
          <InvoicesLeadsHub
            leads={leads}
            currentUser={user}
            currentRep={currentRep}
            onCreateLead={handleCreateLead}
            onUpdateLead={handleUpdateLead}
            onDeleteLead={handleDeleteLead}
            onConvertToBusiness={handleConvertToBusiness}
          />
        )}

        {/* TAB 5 (ADMIN DASHBOARD / REP PROFILE) */}
        {activeTab === 'admin' && canUserAccessAdminPanel(user) && (
          <AdminDashboard
            currentUser={user}
            businesses={businesses}
            representatives={representatives}
            paymentConfig={paymentConfig}
            payoutRequests={payoutRequests}
            onUpdateBusiness={handleUpdateBusiness}
            onDeleteBusiness={handleDeleteBusiness}
            onAddRepresentative={handleAddRepresentative}
            onUpdateRepresentative={handleUpdateRepresentative}
            onDeleteRepresentative={handleDeleteRepresentative}
            onUpdatePaymentConfig={handleUpdatePaymentConfig}
            onUpdatePayoutRequest={handleUpdatePayoutRequest}
            onShowInvoice={(b) => setSelectedInvoiceBiz(b)}
            onCollectPayment={(b) => setSelectedPayBiz(b)}
          />
        )}

        {(activeTab === 'profile' || (activeTab === 'admin' && !canUserAccessAdminPanel(user))) && (
          user ? (
            <RepProfile
              user={user}
              rep={currentRep}
              businessesCount={scopedBusinesses.length}
              totalRevenue={scopedBusinesses.reduce((acc, b) => acc + b.amountPaid, 0)}
              totalCommission={calculateTotalRepCommission(scopedBusinesses, currentRep.commissionRate)}
              allReps={representatives}
              allBusinesses={businesses}
              payoutRequests={payoutRequests}
              onLogout={() => setUser(null)}
              onUpdateRep={handleUpdateRepresentative}
              onRequestPayout={handleCreatePayoutRequest}
            />
          ) : (
            <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] space-y-4 max-w-md mx-auto shadow-md transition-colors duration-300">
              <ShieldCheck className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="font-black text-lg text-[var(--text-primary)]">تسجيل الدخول للحساب</h3>
              <p className="text-xs text-[var(--text-secondary)] px-6 leading-relaxed font-bold">
                برجاء تسجيل الدخول للوصول إلى لوحة التحكم وملفك الشخصي وتوثيقات الميدان.
              </p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs px-6 py-3 rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                تسجيل الدخول الآن
              </button>
            </div>
          )
        )}

        {/* Global Professional Footer */}
        <footer className="mt-12 pt-8 pb-16 border-t border-[var(--border-color)] text-[var(--text-secondary)] text-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Column 1: Brand & Bio */}
            <div className="space-y-2.5 text-right">
              <Logo size="sm" />
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed font-bold max-w-sm">
                المنصة الرائدة في مصر لرقمنة الأنشطة التجارية والشركات: توثيقات الخرائط، التسويق الرقمي، الحلول التكنولوجية، الحماية القانونية والفكرية، واستشارات تنمية ونمو الأعمال.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-2 text-right">
              <h4 className="font-black text-sm text-[var(--text-primary)]">روابط سريعة</h4>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setShowAboutModal(true)}
                  className="hover:text-amber-500 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Info className="w-3.5 h-3.5 text-amber-500" />
                  <span>من نحن</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="hover:text-amber-500 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>شروط الاستخدام</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPermissionsModal(true)}
                  className="hover:text-amber-500 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>دليل الصلاحيات</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPackagesModal(true)}
                  className="hover:text-amber-500 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>باقات دليلك</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className="hover:text-amber-500 cursor-pointer transition-colors"
                >
                  الرئيسية
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('map')}
                  className="hover:text-amber-500 cursor-pointer transition-colors"
                >
                  الخريطة التفاعلية
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('add')}
                  className="hover:text-amber-500 cursor-pointer transition-colors"
                >
                  تسجيل نشاط
                </button>
              </div>
            </div>

            {/* Column 3: Ecosystem Highlights */}
            <div className="space-y-2 text-right bg-[var(--bg-card)] p-3.5 rounded-2xl border border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <h4 className="font-black text-xs text-[var(--text-primary)]">خدمات المنظومة:</h4>
              </div>
              <ul className="space-y-1 text-[11px] text-[var(--text-secondary)] font-bold">
                <li>• توثيق وتثبيت إحداثيات Google Maps</li>
                <li>• تسويق رقمي وإدارة الهوية التجارية</li>
                <li>• خدمات قانونية وحماية الملكية الفكرية</li>
                <li>• استشارات تنمية ونمو الأعمال والمبيعات</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border-color)]/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
            <p>جميع الحقوق محفوظة © 2026 منصة دليلك لرقمنة وتنمية الأعمال والأنشطة التجارية في مصر</p>
            <div className="flex items-center gap-2 font-bold">
              <span>نتبع معايير الجودة العالمية</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400">نظام محمي ومعتمد</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={canUserAccessAdminPanel(user)}
      />

      {/* MODAL: ABOUT US */}
      {showAboutModal && (
        <AboutUsModal
          onClose={() => setShowAboutModal(false)}
          onOpenTerms={() => {
            setShowAboutModal(false);
            setShowTermsModal(true);
          }}
        />
      )}

      {/* MODAL: TERMS OF SERVICE */}
      {showTermsModal && (
        <TermsModal
          onClose={() => setShowTermsModal(false)}
          onOpenAbout={() => {
            setShowTermsModal(false);
            setShowAboutModal(true);
          }}
        />
      )}

      {/* MODAL: PERMISSIONS & ROLES MATRIX */}
      {showPermissionsModal && (
        <PermissionsModal
          onClose={() => setShowPermissionsModal(false)}
        />
      )}

      {/* MODAL: PACKAGES & OFFERS GUIDE */}
      {showPackagesModal && (
        <PackagesModal
          onClose={() => setShowPackagesModal(false)}
        />
      )}

      {/* MODAL: FULL BUSINESS DATA VIEW & EDITING POP-UP */}
      {editingBusiness && (
        <BusinessEditModal
          business={editingBusiness}
          onClose={() => setEditingBusiness(null)}
          onSave={(updatedBiz) => {
            handleUpdateBusiness(updatedBiz);
            setEditingBusiness(null);
          }}
          userRole={user?.role}
          canEdit={canUserEditBusiness(user, editingBusiness)}
          onShowInvoice={(b) => setSelectedInvoiceBiz(b)}
          onCollectPayment={
            user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'accountant'
              ? (b) => setSelectedPayBiz(b)
              : undefined
          }
          businesses={businesses}
          onDeleteBusiness={
            canUserDeleteBusiness(user, editingBusiness)
              ? handleDeleteBusiness
              : undefined
          }
        />
      )}

      {/* MODAL: INVOICE VIEWER & WHATSAPP DISPATCH */}
      {selectedInvoiceBiz && (
        <InvoiceModal
          business={selectedInvoiceBiz}
          onClose={() => setSelectedInvoiceBiz(null)}
          onUpdateBusiness={handleUpdateBusiness}
          onCollectPayment={
            user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'accountant'
              ? (b) => {
                  setSelectedPayBiz(b);
                }
              : undefined
          }
          userRole={user?.role}
          isAdmin={user?.role === 'admin' || user?.role === 'supervisor'}
        />
      )}

      {/* MODAL: PAYMENT GATEWAY SIMULATION */}
      {selectedPayBiz && (
        <PaymentGatewayModal
          business={selectedPayBiz}
          config={paymentConfig}
          onClose={() => setSelectedPayBiz(null)}
          onPaymentSuccess={(newPaid, method = 'gateway_online') => {
            if (selectedPayBiz) {
              const status = newPaid >= (selectedPayBiz.packagePrice || 250) ? 'fully_paid' : 'partially_paid';
              const updatedBiz: Business = {
                ...selectedPayBiz,
                amountPaid: newPaid,
                paymentStatus: status,
                paymentMethod: method,
                cashCollectedByRep: method === 'cash_by_rep' ? newPaid : 0, // Received directly via platform payment gateway / wallets
              };
              handleUpdateBusiness(updatedBiz);

              // Keep open modals in sync with the payment update
              if (editingBusiness && editingBusiness.id === updatedBiz.id) {
                setEditingBusiness(updatedBiz);
              }
              if (selectedInvoiceBiz && selectedInvoiceBiz.id === updatedBiz.id) {
                setSelectedInvoiceBiz(updatedBiz);
              }
            }
          }}
        />
      )}

      {/* MODAL: LOGIN DIALOG */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onOpenAbout={() => setShowAboutModal(true)}
          onOpenTerms={() => setShowTermsModal(true)}
          onLoginSuccess={(u) => {
            setUser(u);
            const savedTab = localStorage.getItem('dalelak_active_tab');
            if (savedTab && ['home', 'map', 'add', 'invoices', 'admin', 'profile'].includes(savedTab)) {
              setActiveTab(savedTab);
            } else if (u.role === 'admin') {
              setActiveTab('admin');
            } else {
              setActiveTab('home');
            }
          }}
          representatives={representatives}
          onAddRepresentative={handleAddRepresentative}
        />
      )}

      {/* MODAL: ADMIN & USER PROFILE / AVATAR MODAL */}
      {showAdminProfileModal && user && (
        <AdminProfileModal
          user={user}
          onClose={() => setShowAdminProfileModal(false)}
          onUpdateProfile={handleUpdateUserProfile}
        />
      )}
    </div>
  );
}
