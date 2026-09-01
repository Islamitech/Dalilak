import { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Business, Representative, PaymentGatewayConfig, SystemNotification, NotificationCategory, UserRole, ToastNotification, PayoutRequest, InterestedLead } from './types';
import { DEFAULT_PAYMENT_CONFIG, EGYPT_GOVERNORATES, CATEGORY_GROUPS } from './data/mockData';
import { calculateTotalRepCommission } from './utils/commission';
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
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { OfflineSyncModal } from './components/OfflineSyncModal';
import { getOfflineSyncStatus, OfflineSyncStatus } from './services/offlineSync';
import { getRepFieldIntroWhatsAppUrl } from './utils/whatsappMessages';
import { Logo } from './components/Logo';
import { canUserEditBusiness, canUserDeleteBusiness, canUserAccessAdminPanel } from './utils/permissions';
import { 
  MapPin, 
  PlusCircle, 
  FileText, 
  Clock, 
  Phone, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Building2, 
  Eye, 
  X, 
  Info, 
  LayoutGrid, 
  List, 
  MessageCircle, 
  Store, 
  Navigation,
  Play,
  Film,
  Video,
  Loader2,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { 
  safeSetLocalStorageItem, 
  safeGetLocalStorageItem, 
  safeRemoveLocalStorageItem, 
  safeSetSessionItem, 
  safeGetSessionItem, 
  safeRemoveSessionItem, 
  getSafeUserForStorage 
} from './utils/storage';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import {
  getCachedBusinesses,
  fetchBusinessesFromDb,
  syncDeltaBusinessesFromDb,
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

// Strict Non-Permanent Session: 30 minutes of idle inactivity auto-logout
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export default function App() {
  // Application State - Strictly non-permanent session (SessionStorage only - wiped when browser/tab closes)
  const [user, setUser] = useState<User | null>(() => {
    // 1. Purge legacy permanent localStorage login keys to guarantee accounts do not stay logged in permanently
    safeRemoveLocalStorageItem('dalelak_logged_user');
    safeRemoveLocalStorageItem('dalelak_session_expires_at');
    safeRemoveLocalStorageItem('dalelak_last_interaction');

    // 2. Read strictly from active tab sessionStorage
    const savedSessionUser = safeGetSessionItem('dalelak_active_user');
    const lastActive = safeGetSessionItem('dalelak_session_last_active');
    const now = Date.now();

    if (savedSessionUser) {
      const lastActiveTimestamp = Number(lastActive) || now;
      const isNotIdle = (now - lastActiveTimestamp) < INACTIVITY_TIMEOUT_MS;

      if (isNotIdle) {
        try {
          const parsed = JSON.parse(savedSessionUser);
          if (parsed && parsed.id && parsed.name) {
            return parsed;
          }
        } catch (e) {}
      }
    }

    // Clean expired or closed session
    safeRemoveSessionItem('dalelak_active_user');
    safeRemoveSessionItem('dalelak_session_last_active');
    return null; // Guest visitor / Login prompt by default
  });

  // Sync user state with sessionStorage (NOT permanent localStorage)
  useEffect(() => {
    if (user) {
      safeSetSessionItem('dalelak_active_user', JSON.stringify(getSafeUserForStorage(user)));
      safeSetSessionItem('dalelak_session_last_active', String(Date.now()));
    } else {
      safeRemoveSessionItem('dalelak_active_user');
      safeRemoveSessionItem('dalelak_session_last_active');
      safeRemoveLocalStorageItem('dalelak_logged_user');
    }
  }, [user]);

  // Keep track of user interactions to maintain active session activity
  useEffect(() => {
    if (!user) return;

    const handleUserActivity = () => {
      safeSetSessionItem('dalelak_session_last_active', String(Date.now()));
    };

    window.addEventListener('mousedown', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });

    return () => {
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
    };
  }, [user]);

  const [showSyncBadge, setShowSyncBadge] = useState<boolean>(false);
  const [showOfflineSyncModal, setShowOfflineSyncModal] = useState<boolean>(false);
  const [offlineSyncStatus, setOfflineSyncStatus] = useState<OfflineSyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingBusinessesCount: 0,
    pendingLeadsCount: 0,
    pendingPayoutsCount: 0,
    totalPendingCount: 0,
    lastSyncTime: null,
  });

  // Reactive IndexedDB Offline Sync Status Listener (Strictly User-Scoped)
  useEffect(() => {
    const updateSyncStatus = async () => {
      try {
        const effectiveUid = user?.id || user?.email || null;
        const status = await getOfflineSyncStatus(effectiveUid);
        setOfflineSyncStatus(status);
      } catch {}
    };

    updateSyncStatus();

    window.addEventListener('dalelak_offline_state_changed', updateSyncStatus);
    window.addEventListener('online', updateSyncStatus);
    window.addEventListener('offline', updateSyncStatus);

    return () => {
      window.removeEventListener('dalelak_offline_state_changed', updateSyncStatus);
      window.removeEventListener('online', updateSyncStatus);
      window.removeEventListener('offline', updateSyncStatus);
    };
  }, [user]);

  const [businesses, setBusinesses] = useState<Business[]>(() => getCachedBusinesses());

  const [representatives, setRepresentatives] = useState<Representative[]>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('dalelak_cached_reps') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return [];
  });
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('dalelak_cached_payouts') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return [];
  });
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

    // 4. Default fallback check for logged user role in active session
    const savedUserStr = safeGetSessionItem('dalelak_active_user');
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

    // Scroll to the very top of the window on tab transition or page reload
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

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
  const [selectedVideoBiz, setSelectedVideoBiz] = useState<Business | null>(null);

  // Interested Leads State & Conversion
  const [leads, setLeads] = useState<InterestedLead[]>(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('dalelak_cached_leads') || '[]');
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {}
    return [];
  });
  const [convertingLead, setConvertingLead] = useState<InterestedLead | null>(null);

  // Home Feed Search & Modern Directory Filters
  const [homeSearchQuery, setHomeSearchQuery] = useState<string>('');
  const [homeGovFilter, setHomeGovFilter] = useState<string>('all');
  const [homeCategoryFilter, setHomeCategoryFilter] = useState<string>('all');
  const [homeVerificationFilter, setHomeVerificationFilter] = useState<'all' | 'verified' | 'in_progress' | 'fully_paid' | 'unpaid'>('all');
  const [homeViewMode, setHomeViewMode] = useState<'grid' | 'list'>(() => (safeGetLocalStorageItem('dalelak_home_view_mode') as 'grid' | 'list') || 'list');

  // External View State (from QR code scanning)
  const [externalView, setExternalView] = useState<{ type: 'invoice' | 'rep', id: string } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(() => {
    const cached = getCachedBusinesses();
    const isAppInitialized = Boolean(safeGetLocalStorageItem('dalelak_app_initialized'));
    // If cached businesses exist or app was initialized before, render instantly in 0ms without skeleton flicker!
    return cached.length === 0 && !isAppInitialized;
  });
  const [hasInitialCloudSynced, setHasInitialCloudSynced] = useState<boolean>(() => getCachedBusinesses().length > 0);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setNotifications((prev) => [...prev, { id, message, type, createdAt: Date.now() }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5500);
  };

  // Persistent System Notifications for Bell Notification Center
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>(() => {
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
    setSystemNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem('dalelak_system_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setSystemNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      try {
        localStorage.setItem('dalelak_system_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearNotifications = () => {
    setSystemNotifications([]);
    try {
      localStorage.setItem('dalelak_system_notifications', JSON.stringify([]));
    } catch {}
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

  // Real System Notifications (Sorted newest first by timestamp)
  const allNotifications = useMemo(() => {
    return [...systemNotifications].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [systemNotifications]);

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

  // Fetch initial data with fast independent parallel fetches
  useEffect(() => {
    // 1. Fetch businesses immediately
    fetchBusinessesFromDb()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBusinesses(data);
        }
        safeSetLocalStorageItem('dalelak_app_initialized', 'true');
        if (user?.id) {
          safeSetLocalStorageItem(`dalelak_user_initialized_${user.id}`, 'true');
        }
        setHasInitialCloudSynced(true);
        setIsLoadingData(false);
      })
      .catch(() => {
        safeSetLocalStorageItem('dalelak_app_initialized', 'true');
        setHasInitialCloudSynced(true);
        setIsLoadingData(false);
      });

    // 2. Fetch representatives in parallel
    fetchRepsFromDb()
      .then((dbRepsData) => {
        if (Array.isArray(dbRepsData)) {
          setRepresentatives(dbRepsData);

          // Instant user state sync if logged-in representative data changed
          if (user) {
            const freshUserRep = dbRepsData.find(
              (r) => r.id === user.id || r.email.toLowerCase() === user.email.toLowerCase()
            );
            if (freshUserRep) {
              const updatedUser = { ...user, repData: freshUserRep };
              setUser(updatedUser);
              safeSetSessionItem(
                'dalelak_active_user',
                JSON.stringify(getSafeUserForStorage(updatedUser))
              );
            }
          }
        }
      })
      .catch(() => {});

    // 3. Fetch payouts & leads in parallel
    const isManagerial = ['admin', 'supervisor', 'accountant'].includes(user?.role || '');
    const targetRepId = isManagerial ? undefined : user?.id;
    fetchPayoutRequestsFromDb(targetRepId)
      .then((dbPayouts) => {
        if (Array.isArray(dbPayouts)) setPayoutRequests(dbPayouts);
      })
      .catch(() => {});

    // Always fetch full leads list; InvoicesLeadsHub handles role scoping cleanly
    fetchLeadsFromDb()
      .then((dbLeads) => {
        if (Array.isArray(dbLeads)) setLeads(dbLeads);
      })
      .catch(() => {});

    fetchPaymentConfigFromDb()
      .then((cfg) => {
        if (cfg) setPaymentConfig(cfg);
      })
      .catch(() => {});
  }, [user?.id, user?.role]);

  // Ultra-Efficient Data-Saver Real-Time Syncer:
  // 1. Supabase WebSockets (Realtime) listens to changes with 0 KB idle overhead
  // 2. Cross-Tab BroadcastChannel for instant local syncing
  // 3. Smart Background Fallback Polling (60s interval, pauses 100% when screen/tab is hidden)
  useEffect(() => {
    const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;

    const refreshLiveData = async (force: boolean = false) => {
      // 🛑 Data-Saver Guard: If phone screen is locked or tab is hidden, consume ZERO data!
      if (!force && typeof document !== 'undefined' && document.hidden) {
        return;
      }

      try {
        syncDeltaBusinessesFromDb().then((res) => {
          if (res.updated && res.count > 0) {
            setBusinesses(res.businesses);
            setShowSyncBadge(true);
            setTimeout(() => setShowSyncBadge(false), 3200);
          }
        }).catch(() => {});

        fetchRepsFromDb().then((freshReps) => {
          if (Array.isArray(freshReps) && freshReps.length > 0) {
            setRepresentatives(freshReps);
            if (user) {
              const myFreshRep = freshReps.find(
                (r) => r.id === user.id || r.email.toLowerCase() === user.email.toLowerCase()
              );
              if (myFreshRep) {
                const updatedUser = { ...user, repData: myFreshRep };
                setUser(updatedUser);
                safeSetSessionItem(
                  'dalelak_active_user',
                  JSON.stringify(getSafeUserForStorage(updatedUser))
                );
              }
            }
          }
        }).catch(() => {});

        const isManagerialNow = ['admin', 'supervisor', 'accountant'].includes(user?.role || '');
        const currentTargetRepId = isManagerialNow ? undefined : user?.id;
        fetchPayoutRequestsFromDb(currentTargetRepId).then((freshPayouts) => {
          if (Array.isArray(freshPayouts)) setPayoutRequests(freshPayouts);
        }).catch(() => {});

        fetchLeadsFromDb(currentTargetRepId).then((freshLeads) => {
          if (Array.isArray(freshLeads)) setLeads(freshLeads);
        }).catch(() => {});
      } catch (err) {
        // silent
      }
    };

    // 1. Instant Cross-Tab Sync Listener
    if (syncChannel) {
      syncChannel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_DATA' || event.data?.type === 'REP_UPDATED') {
          refreshLiveData(true);
        }
      };
    }

    // 2. Supabase Realtime WebSocket Subscription (Zero network polling overhead)
    let realtimeChannel: any = null;
    if (isSupabaseConfigured()) {
      try {
        realtimeChannel = supabase
          .channel('dalelak_realtime_db_changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => refreshLiveData(true))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'representatives' }, () => refreshLiveData(true))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'payout_requests' }, () => refreshLiveData(true))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => refreshLiveData(true))
          .subscribe();
      } catch (err) {
        console.warn('Realtime subscription fallback:', err);
      }
    }

    // 3. Tab Visibility Change Listener: catch up instantly when returning to app
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        refreshLiveData(true);
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // 4. Lightweight Fallback Heartbeat Poll (Runs every 60 seconds only when tab is active)
    const interval = setInterval(() => refreshLiveData(false), 60000);

    return () => {
      clearInterval(interval);
      if (syncChannel) syncChannel.close();
      if (realtimeChannel && typeof realtimeChannel.unsubscribe === 'function') {
        realtimeChannel.unsubscribe();
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [user?.id, user?.email, user?.role]);

  // Handlers synced with Supabase Database & Real-Time Lifecycle
  const handleAddBusiness = async (newBiz: Business) => {
    // 1. Automatically calculate payment status from amountPaid and packagePrice
    const isExempt = Boolean(newBiz.isFeeExempt || newBiz.packagePrice === 0);
    const autoPaymentStatus = isExempt
      ? 'fully_paid'
      : (newBiz.amountPaid || 0) >= (newBiz.packagePrice || 250)
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

    // ⚡ 1. INSTANT OPTIMISTIC STATE & MULTI-TIER CACHE (0ms - Instantly visible at top)
    setBusinesses((prev) => [normalizedBiz, ...prev.filter((b) => b.id !== normalizedBiz.id)]);

    // Also update directory portal cache in localStorage immediately
    try {
      const allUpdated = [normalizedBiz, ...businesses.filter((b) => b.id !== normalizedBiz.id)];
      safeSetLocalStorageItem('dalelak_cached_businesses', JSON.stringify(allUpdated));
      safeSetLocalStorageItem('dalelak_directory_cache', JSON.stringify(allUpdated));
    } catch {}

    // Reset filters to ensure the newly added business is 100% visible immediately
    setHomeSearchQuery('');
    setHomeGovFilter('all');
    setHomeCategoryFilter('all');
    setHomeVerificationFilter('all');
    setActiveTab('home');

    // ⚡ Open the invoice immediately so the representative and client can view and photograph it
    setSelectedInvoiceBiz(normalizedBiz);

    // ⚡ 2. Instant Cross-Tab Broadcast (Real-Time across all windows)
    try {
      const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (syncChannel) {
        syncChannel.postMessage({ type: 'SYNC_DATA', newBusiness: normalizedBiz });
        syncChannel.close();
      }
    } catch {}

    addNotification(`🎉 تم تسجيل النشاط التجاري "${normalizedBiz.nameAr}" بنجاح وهو متاح الآن في قائمتك والدليل!`, 'success');

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

    // ⚡ 3. ASYNCHRONOUS DATABASE SYNC (Non-blocking background save to Supabase Cloud - Zero Refetch)
    saveBusinessToDb(normalizedBiz).catch((err) => {
      console.warn('Background Supabase save notice:', err);
    });
  };

  const handleUpdateBusiness = async (updatedBiz: Business) => {
    const prevBiz = businesses.find((b) => b.id === updatedBiz.id);

    // Automatically recalculate payment status based on amountPaid and packagePrice
    const isExempt = Boolean(updatedBiz.isFeeExempt || updatedBiz.packagePrice === 0);
    const autoPaymentStatus = isExempt
      ? 'fully_paid'
      : (updatedBiz.amountPaid || 0) >= (updatedBiz.packagePrice || 250)
      ? 'fully_paid'
      : (updatedBiz.amountPaid || 0) > 0
      ? 'partially_paid'
      : 'unpaid';

    const normalizedBiz: Business = {
      ...updatedBiz,
      packagePrice: isExempt ? 0 : (updatedBiz.packagePrice ?? 250),
      amountPaid: isExempt ? 0 : (updatedBiz.amountPaid || 0),
      isFeeExempt: isExempt,
      paymentStatus: autoPaymentStatus,
    };

    setBusinesses((prev) => {
      const updated = prev.map((b) => (b.id === normalizedBiz.id ? normalizedBiz : b));
      try {
        safeSetLocalStorageItem('dalelak_cached_businesses', JSON.stringify(updated));
        safeSetLocalStorageItem('dalelak_directory_cache', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Instant Cross-Tab Broadcast to Directory Portal
    try {
      const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (syncChannel) {
        syncChannel.postMessage({ type: 'SYNC_DATA', newBusiness: normalizedBiz });
        syncChannel.close();
      }
    } catch {}

    await updateBusinessInDb(normalizedBiz.id, normalizedBiz);
    
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
    setLeads((prev) => {
      const updated = [newLead, ...prev.filter((l) => l.id !== newLead.id)];
      try {
        safeSetLocalStorageItem('dalelak_cached_leads', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    await saveLeadToDb(newLead);

    try {
      const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (syncChannel) {
        syncChannel.postMessage({ type: 'SYNC_DATA', leadId: newLead.id });
        syncChannel.close();
      }
    } catch {}

    addNotification(`✨ تم حفظ بيانات العميل المهتم "${newLead.clientName}" بنجاح!`, 'success');
  };

  const handleUpdateLead = async (updatedLead: InterestedLead) => {
    setLeads((prev) => {
      const updated = prev.map((l) => (l.id === updatedLead.id ? updatedLead : l));
      try {
        safeSetLocalStorageItem('dalelak_cached_leads', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    await updateLeadInDb(updatedLead);

    try {
      const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (syncChannel) {
        syncChannel.postMessage({ type: 'SYNC_DATA', leadId: updatedLead.id });
        syncChannel.close();
      }
    } catch {}

    addNotification(`تم تحديث بيانات ومتابعة العميل "${updatedLead.clientName}".`, 'info');
  };

  const handleDeleteLead = async (leadId: string) => {
    setLeads((prev) => {
      const updated = prev.filter((l) => l.id !== leadId);
      try {
        safeSetLocalStorageItem('dalelak_cached_leads', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    await deleteLeadFromDb(leadId);

    try {
      const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (syncChannel) {
        syncChannel.postMessage({ type: 'SYNC_DATA', deletedLeadId: leadId });
        syncChannel.close();
      }
    } catch {}

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

    const repId = user.repData?.id || user.id;
    const existingRep = representatives.find((r) => r.id === repId || r.email.toLowerCase() === user.email.toLowerCase()) || user.repData;

    const isCallerAdmin = user.role === 'admin';

    const freshRep: Representative = {
      id: repId,
      name: updatedData.name || existingRep?.name || user.name,
      email: updatedData.email || existingRep?.email || user.email,
      phone: updatedData.phone || existingRep?.phone || '',
      pendingPhone: updatedData.pendingPhone !== undefined ? updatedData.pendingPhone : existingRep?.pendingPhone,
      phoneStatus: updatedData.phoneStatus !== undefined ? updatedData.phoneStatus : existingRep?.phoneStatus,
      nationalId: updatedData.nationalId !== undefined ? updatedData.nationalId : existingRep?.nationalId,
      activationFacePhoto: updatedData.activationFacePhoto !== undefined ? updatedData.activationFacePhoto : existingRep?.activationFacePhoto,
      nationalIdCardPhoto: updatedData.nationalIdCardPhoto !== undefined ? updatedData.nationalIdCardPhoto : existingRep?.nationalIdCardPhoto,
      nationalIdCardBackPhoto: updatedData.nationalIdCardBackPhoto !== undefined ? updatedData.nationalIdCardBackPhoto : existingRep?.nationalIdCardBackPhoto,
      role: isCallerAdmin && updatedData.role ? updatedData.role : (existingRep?.role || user.role || 'rep'),
      roleTitle: isCallerAdmin && updatedData.roleTitle ? updatedData.roleTitle : (existingRep?.roleTitle || 'مندوب مبيعات معتمد'),
      governorate: updatedData.governorate || existingRep?.governorate || 'القاهرة',
      targetMonth: isCallerAdmin && updatedData.targetMonth !== undefined ? (Number(updatedData.targetMonth) || 25) : (existingRep?.targetMonth || 25),
      avatar: updatedData.avatar !== undefined ? updatedData.avatar : (existingRep?.avatar || user.avatar || ''),
      avatarStatus: 'approved',
      commissionRate: isCallerAdmin && updatedData.commissionRate !== undefined ? (Number(updatedData.commissionRate) || 42.86) : (existingRep?.commissionRate || 42.86),
      status: isCallerAdmin && updatedData.status ? updatedData.status : (existingRep?.status || 'active'),
      password: updatedData.password || existingRep?.password || 'Aa123456',
      referralCode: updatedData.referralCode || existingRep?.referralCode,
      referredByCode: updatedData.referredByCode || existingRep?.referredByCode,
      referralUnlocked: updatedData.referralUnlocked ?? existingRep?.referralUnlocked ?? true,
      adminBypassReferral: updatedData.adminBypassReferral ?? existingRep?.adminBypassReferral ?? true,
    };

    const updatedUser: User = {
      ...user,
      name: freshRep.name,
      email: freshRep.email,
      role: freshRep.role || user.role,
      avatar: freshRep.avatar,
      repData: freshRep,
    };

    setUser(updatedUser);
    safeSetSessionItem('dalelak_active_user', JSON.stringify(getSafeUserForStorage(updatedUser)));
    safeSetSessionItem('dalelak_session_last_active', String(Date.now()));
    safeRemoveLocalStorageItem('dalelak_logged_user');
    safeRemoveLocalStorageItem('dalelak_user');

    setRepresentatives((prev) => {
      const idx = prev.findIndex((r) => r.id === freshRep.id || r.email.toLowerCase() === freshRep.email.toLowerCase());
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = freshRep;
        return next;
      }
      return [freshRep, ...prev];
    });

    await saveRepToDb(freshRep);
    addNotification('✅ تم تحديث بياناتك وملفاتك الرسمية بنجاح على السحابة!', 'success');
  };

  const handleDeleteBusiness = async (id: string) => {
    const biz = businesses.find((b) => b.id === id);

    // 1. Immediately remove from businesses state and update cache
    setBusinesses((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      try {
        safeSetLocalStorageItem('dalelak_cached_businesses', JSON.stringify(updated));
        safeSetLocalStorageItem('dalelak_directory_cache', JSON.stringify(updated));
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
          !(
            (n.category === 'business' || n.category === 'payment') &&
            ((n.entityId && n.entityId === id) || (biz && n.message && n.message.includes(biz.nameAr)))
          )
      )
    );

    // 4. Delete from Supabase Database and local server API
    await deleteBusinessFromDb(id);

    // 5. Broadcast deletion to other open browser tabs
    try {
      const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (syncChannel) {
        syncChannel.postMessage({ type: 'DELETE_BUSINESS', deletedId: id });
        syncChannel.close();
      }
    } catch {}

    // 6. User Feedback
    addNotification(`🗑️ تم حذف نشاط "${biz?.nameAr || 'المحدد'}" نهائياً من المنظومة.`, 'warning');
  };

  const handleAddRepresentative = async (repData: Partial<Representative>) => {
    const newRep: Representative = {
      id: repData.id || `rep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: repData.name || 'مندوب جديد',
      email: repData.email || '',
      phone: repData.phone || '',
      nationalId: repData.nationalId,
      activationFacePhoto: repData.activationFacePhoto,
      nationalIdCardPhoto: repData.nationalIdCardPhoto,
      nationalIdCardBackPhoto: repData.nationalIdCardBackPhoto,
      pendingPhone: repData.pendingPhone,
      phoneStatus: repData.phoneStatus || 'none',
      role: repData.role || 'rep',
      roleTitle: repData.roleTitle || 'مندوب مبيعات ميداني',
      governorate: repData.governorate || 'القاهرة',
      targetMonth: repData.targetMonth || 25,
      avatar: repData.avatar || '',
      avatarStatus: repData.avatarStatus || 'approved',
      commissionRate: repData.commissionRate || 42.86,
      status: repData.status || 'active',
      password: repData.password || 'Aa123456',
      referralCode: repData.referralCode || `DALIL-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      referredByCode: repData.referredByCode,
      referralUnlocked: repData.referralUnlocked ?? false,
      adminBypassReferral: repData.adminBypassReferral ?? false,
      referralRewardGranted: repData.referralRewardGranted ?? false,
    };

    setRepresentatives((prev) => {
      const filtered = prev.filter((r) => r.id !== newRep.id && r.email.toLowerCase() !== newRep.email.toLowerCase());
      const updated = [newRep, ...filtered];
      try {
        safeSetLocalStorageItem('dalelak_custom_reps', JSON.stringify(updated));
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

    // Strict Role & Permission Security Guard:
    // Only Admin / Supervisor can change roles, commission rates, or account status.
    const isCallerAdmin = user?.role === 'admin' || user?.role === 'supervisor';
    const secureRep: Representative = {
      ...updatedRep,
      role: isCallerAdmin && updatedRep.role ? updatedRep.role : (prevRep?.role || 'rep'),
      roleTitle: isCallerAdmin && updatedRep.roleTitle ? updatedRep.roleTitle : (prevRep?.roleTitle || 'مندوب مبيعات معتمد'),
      commissionRate: isCallerAdmin && updatedRep.commissionRate !== undefined ? Number(updatedRep.commissionRate) : (prevRep?.commissionRate || 42.86),
      status: isCallerAdmin && updatedRep.status ? updatedRep.status : (prevRep?.status || 'active'),
      targetMonth: isCallerAdmin && updatedRep.targetMonth !== undefined ? Number(updatedRep.targetMonth) : (prevRep?.targetMonth || 25),
    };

    setRepresentatives((prev) => {
      const updated = prev.map((r) => (r.id === secureRep.id ? secureRep : r));
      try {
        safeSetLocalStorageItem('dalelak_custom_reps', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Always sync user state & localStorage when the logged-in rep's data changes
    if (user && (user.id === secureRep.id || user.repData?.id === secureRep.id || user.email.toLowerCase() === secureRep.email.toLowerCase())) {
      const updatedUser = { ...user, repData: secureRep, name: secureRep.name, email: secureRep.email, role: secureRep.role || user.role };
      setUser(updatedUser);
      safeSetLocalStorageItem('dalelak_logged_user', JSON.stringify(getSafeUserForStorage(updatedUser)));
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

    setRepresentatives((prev) => {
      const updated = prev.filter((r) => r.id !== id && (rep?.email ? r.email.toLowerCase() !== rep.email.toLowerCase() : true));
      try {
        safeSetLocalStorageItem('dalelak_custom_reps', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Delete from DB & blacklist
    await deleteRepFromDb(id);

    try {
      const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (channel) {
        channel.postMessage({ type: 'REP_UPDATED', deletedRepId: id });
        channel.close();
      }
    } catch {}

    if (rep) {
      addNotification(`🗑️ تم حذف حساب "${rep.name}" نهائياً من المنظومة.`, 'warning');
      addSystemNotification({
        title: 'حذف حساب 🗑️',
        message: `تم حذف حساب "${rep.name}" (${rep.roleTitle || rep.role}) نهائياً من المنظومة.`,
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

  const homeStats = useMemo(() => {
    const total = scopedBusinesses.length;
    const verified = scopedBusinesses.filter((b) => b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced').length;
    const inProgress = scopedBusinesses.filter((b) => b.verificationStatus !== 'verified' && b.googleSyncStatus !== 'synced').length;
    const govs = new Set(scopedBusinesses.map((b) => b.governorate).filter(Boolean)).size;
    const fullyPaid = scopedBusinesses.filter((b) => b.isFeeExempt || b.paymentStatus === 'fully_paid' || (b.amountPaid || 0) >= (b.packagePrice || 250)).length;
    const exempt = scopedBusinesses.filter((b) => b.isFeeExempt || b.packagePrice === 0).length;
    return { total, verified, inProgress, govs, fullyPaid, exempt };
  }, [scopedBusinesses]);

  const filteredHomeBusinesses = useMemo(() => {
    return sortBusinessesNewestFirst(
      scopedBusinesses.filter((b) => {
        if (homeSearchQuery) {
          const q = homeSearchQuery.trim().toLowerCase();
          const matchName = (b.nameAr || '').toLowerCase().includes(q) || (b.nameEn || '').toLowerCase().includes(q);
          const matchCity = (b.city || '').toLowerCase().includes(q) || (b.governorate || '').toLowerCase().includes(q);
          const matchOwner = (b.ownerName || '').toLowerCase().includes(q) || (b.ownerPhone || '').includes(q);
          const matchRep = (b.repName || '').toLowerCase().includes(q);
          const matchInvoice = (b.invoiceNumber || '').toLowerCase().includes(q);
          if (!matchName && !matchCity && !matchOwner && !matchRep && !matchInvoice) {
            return false;
          }
        }
        if (homeGovFilter !== 'all' && !b.governorate.includes(homeGovFilter)) {
          return false;
        }
        if (homeCategoryFilter !== 'all') {
          const grp = CATEGORY_GROUPS.find((g) => g.group === homeCategoryFilter);
          if (grp) {
            if (!grp.items.includes(b.category) && !b.category.includes(homeCategoryFilter)) {
              return false;
            }
          } else if (!b.category.includes(homeCategoryFilter)) {
            return false;
          }
        }
        if (homeVerificationFilter === 'verified') {
          if (b.verificationStatus !== 'verified' && b.googleSyncStatus !== 'synced') return false;
        } else if (homeVerificationFilter === 'in_progress') {
          if (b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced') return false;
        } else if (homeVerificationFilter === 'fully_paid') {
          if (!b.isFeeExempt && b.paymentStatus !== 'fully_paid' && (b.amountPaid || 0) < (b.packagePrice || 250)) return false;
        } else if (homeVerificationFilter === 'unpaid') {
          if (b.isFeeExempt || b.paymentStatus === 'fully_paid' || (b.amountPaid || 0) > 0) return false;
        }
        return true;
      })
    );
  }, [scopedBusinesses, homeSearchQuery, homeGovFilter, homeCategoryFilter, homeVerificationFilter]);

  // Single-Session Active Heartbeat & Cross-Tab Invalidation Listener
  useEffect(() => {
    if (!user || !user.activeSessionId) return;

    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_single_session_channel') : null;

    // Send periodic heartbeat every 60 seconds (Only when tab is actively visible)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
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
    }, 60000);

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

  // Remove current user from session storage & release single-session lock
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
    safeRemoveSessionItem('dalelak_active_user');
    safeRemoveSessionItem('dalelak_session_last_active');
    safeRemoveLocalStorageItem('dalelak_logged_user');
    safeRemoveLocalStorageItem('dalelak_session_expires_at');
    safeRemoveLocalStorageItem('dalelak_last_interaction');
    safeRemoveLocalStorageItem('dalelak_active_tab');
    setActiveTab('home');
    const url = new URL(window.location.href);
    url.searchParams.delete('tab');
    window.history.replaceState({}, '', url.toString());

    addNotification('🔒 تم تسجيل الخروج بنجاح من الحساب.', 'info');
    window.dispatchEvent(new CustomEvent('dalelak_offline_state_changed'));

    // Refresh full cloud database list on logout so public view shows all businesses immediately
    fetchBusinessesFromDb().then((freshData) => {
      if (Array.isArray(freshData) && freshData.length > 0) {
        setBusinesses(freshData);
      }
    }).catch(() => {});
  }, [user]);

  // Unified Clean Login Handler with Role Specification
  const handleLoginUser = useCallback((u: User) => {
    setUser(u);
    setShowLoginModal(false);
    safeSetSessionItem('dalelak_active_user', JSON.stringify(getSafeUserForStorage(u)));
    safeSetSessionItem('dalelak_session_last_active', String(Date.now()));
    window.dispatchEvent(new CustomEvent('dalelak_offline_state_changed'));

    const roleLabels: Record<string, string> = {
      admin: 'مدير النظام (صلاحيات كاملة) 🛡️',
      supervisor: 'مشرف الإدارة ⚡',
      accountant: 'محاسب ومحصل 💳',
      rep: 'مندوب ميداني معتمد 💼',
    };
    const roleTitle = roleLabels[u.role] || u.role;
    addNotification(`🟢 مرحباً بك يا أستاذ ${u.name} — تم تسجيل الدخول بصلاحية: ${roleTitle}`, 'success');

    const savedTab = localStorage.getItem('dalelak_active_tab');
    if (savedTab && ['home', 'map', 'add', 'invoices', 'admin', 'profile'].includes(savedTab)) {
      setActiveTab(savedTab);
    } else if (u.role === 'admin' || u.role === 'supervisor') {
      setActiveTab('admin');
    } else {
      setActiveTab('home');
    }
  }, []);

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
            onLoginSuccess={handleLoginUser}
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
      {/* ===================== PROFESSIONAL TOAST NOTIFICATIONS & LIVE SYNC BADGE ===================== */}
      <div
        className="fixed right-0 left-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none px-2.5 sm:px-4"
        style={{ top: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))' }}
        aria-live="polite"
        aria-atomic="false"
      >
        {showSyncBadge && (
          <div
            className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 dark:bg-emerald-950/90 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 backdrop-blur-xl text-xs font-black shadow-xl animate-fade-in transition-all"
            style={{ direction: 'rtl' }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>تم تحديث البيانات للتو 🔄</span>
          </div>
        )}
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
        onOpenProfile={() => {
          if (user?.role === 'admin') {
            setShowAdminProfileModal(true);
          } else {
            setActiveTab('profile');
          }
        }}
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
      <main className="flex-1 w-full mx-auto max-w-7xl p-3 sm:p-5 pb-28 sm:pb-12">
        {/* 🛰️ Live Offline & Sync Status Banner */}
        {(!offlineSyncStatus.isOnline || offlineSyncStatus.totalPendingCount > 0) && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/90 border border-amber-500/40 rounded-2xl p-3 sm:p-3.5 mb-4 shadow-xl flex items-center justify-between text-right text-xs animate-fade-in">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-inner ${offlineSyncStatus.isOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'}`}>
                {offlineSyncStatus.isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              </div>
              <div>
                <div className="font-black text-amber-300 flex items-center gap-2">
                  <span>{offlineSyncStatus.isOnline ? '🟢 متصل بالإنترنت (السيرفر السحابي)' : '🔴 وضع العمل بدون إنترنت (Offline-First)'}</span>
                  {offlineSyncStatus.totalPendingCount > 0 && (
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {offlineSyncStatus.totalPendingCount} بانتظار الرفع ⏳
                    </span>
                  )}
                </div>
                <div className="text-[10.5px] text-slate-300 font-bold mt-0.5">
                  {offlineSyncStatus.totalPendingCount > 0
                    ? `بياناتك وصورك محفوظة بأمان على هاتفك (IndexedDB) وسيتم رفعها تلقائياً.`
                    : 'التخزين المحلي الآمن نشط - يمكنك متابعة تسجيل الأنشطة حتى في انعدام الشبكة.'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOfflineSyncModal(true)}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs py-2 px-3 sm:px-4 rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${offlineSyncStatus.isSyncing ? 'animate-spin' : ''}`} />
                <span>{offlineSyncStatus.isSyncing ? 'جاري الرفع...' : 'إدارة المزامنة ⚡'}</span>
              </button>
            </div>
          </div>
        )}
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

            {/* Modern Global Directory Container */}
            <div className="space-y-4">
              
              {/* ── TOP KPI METRICS BAR ────────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 sm:p-4 rounded-2xl shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-black shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-[var(--text-muted)] font-bold truncate">إجمالي الأنشطة</div>
                    {isLoadingData && businesses.length === 0 ? (
                      <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 animate-pulse rounded-lg mt-1" />
                    ) : (
                      <div className="text-base sm:text-lg font-black text-[var(--text-primary)] font-mono">{homeStats.total}</div>
                    )}
                  </div>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 sm:p-4 rounded-2xl shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-black shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-[var(--text-muted)] font-bold truncate">موثقة على Maps</div>
                    {isLoadingData && businesses.length === 0 ? (
                      <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 animate-pulse rounded-lg mt-1" />
                    ) : (
                      <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{homeStats.verified}</div>
                    )}
                  </div>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 sm:p-4 rounded-2xl shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-black shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-[var(--text-muted)] font-bold truncate">قيد التوثيق</div>
                    {isLoadingData && businesses.length === 0 ? (
                      <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 animate-pulse rounded-lg mt-1" />
                    ) : (
                      <div className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 font-mono">{homeStats.inProgress}</div>
                    )}
                  </div>
                </div>

                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 sm:p-4 rounded-2xl shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center font-black shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-[var(--text-muted)] font-bold truncate">المحافظات المغطاة</div>
                    {isLoadingData && businesses.length === 0 ? (
                      <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 animate-pulse rounded-lg mt-1" />
                    ) : (
                      <div className="text-base sm:text-lg font-black text-purple-600 dark:text-purple-400 font-mono">{homeStats.govs}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── UNIFIED DIRECTORY TOOLBAR & FILTERS ────────────────────────── */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-3.5 sm:p-5 space-y-3.5 shadow-sm">
                
                {/* Row 1: Search + Governorate + View Switcher */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-amber-500 absolute right-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="ابحث باسم المحل، المالك، الهاتف، أو المدينة..."
                      value={homeSearchQuery}
                      onChange={(e) => setHomeSearchQuery(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs sm:text-sm rounded-2xl pr-10 pl-8 py-2.5 focus:outline-none focus:border-amber-500 font-bold shadow-inner placeholder:text-[var(--text-muted)]"
                    />
                    {homeSearchQuery && (
                      <button
                        onClick={() => setHomeSearchQuery('')}
                        className="absolute left-3 top-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={homeGovFilter}
                      onChange={(e) => setHomeGovFilter(e.target.value)}
                      className="flex-1 sm:flex-initial bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold rounded-2xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer"
                    >
                      <option value="all">📍 كل المحافظات</option>
                      {EGYPT_GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>
                          {gov}
                        </option>
                      ))}
                    </select>

                    {/* View Switcher: Grid vs List */}
                    <div className="flex items-center bg-[var(--input-bg)] p-1 rounded-2xl border border-[var(--border-color)] shrink-0">
                      <button
                        onClick={() => { setHomeViewMode('grid'); safeSetLocalStorageItem('dalelak_home_view_mode', 'grid'); }}
                        className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                          homeViewMode === 'grid'
                            ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                        title="عرض البطاقات العصرية"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setHomeViewMode('list'); safeSetLocalStorageItem('dalelak_home_view_mode', 'list'); }}
                        className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                          homeViewMode === 'list'
                            ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                        title="عرض القائمة المجدولة"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 2: Status Quick Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
                  {[
                    { key: 'all', label: 'الكل', count: homeStats.total },
                    { key: 'verified', label: '🗺️ موثقة رسمياً', count: homeStats.verified },
                    { key: 'in_progress', label: '⏳ قيد التوثيق', count: homeStats.inProgress },
                    { key: 'fully_paid', label: '💳 مسددة بالكامل', count: homeStats.fullyPaid },
                    { key: 'unpaid', label: '⚠️ بانتظار السداد', count: Math.max(0, homeStats.total - homeStats.fullyPaid) },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setHomeVerificationFilter(tab.key as any)}
                      className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 border ${
                        homeVerificationFilter === tab.key
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs font-black'
                          : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-amber-500/40'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {isLoadingData && businesses.length === 0 ? (
                        <span className="w-3.5 h-3 bg-slate-300 dark:bg-slate-700 animate-pulse rounded-full" />
                      ) : (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                          homeVerificationFilter === tab.key ? 'bg-slate-950 text-amber-400' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Row 3: Category Quick Chips Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold border-t border-[var(--border-color)]/50 pt-2.5">
                  <button
                    onClick={() => setHomeCategoryFilter('all')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      homeCategoryFilter === 'all'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black border border-amber-500/40'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
                    }`}
                  >
                    ⭐ جميع التصنيفات
                  </button>
                  {CATEGORY_GROUPS.map((grp) => (
                    <button
                      key={grp.group}
                      onClick={() => setHomeCategoryFilter(grp.group === homeCategoryFilter ? 'all' : grp.group)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0 ${
                        homeCategoryFilter === grp.group
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black border border-amber-500/40 shadow-2xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
                      }`}
                    >
                      <span>{grp.icon}</span>
                      <span>{grp.group}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── 1. LOADING SKELETON STATE (Shown ONLY on first cold visit with empty cache) ───────────────── */}
              {isLoadingData && businesses.length === 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2.5 py-3.5 px-4 bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm rounded-2xl animate-pulse shadow-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
                    <span>جاري جلب وتحديث الأنشطة التجارية والبيانات من السحابة...</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={`skel-${i}`}
                        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between animate-pulse"
                      >
                        <div className="relative aspect-[16/8.5] bg-slate-200 dark:bg-slate-800" />
                        <div className="p-4 space-y-3">
                          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4" />
                          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
                          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3" />
                          <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" />
                            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-xl w-24" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 2. EMPTY STATE (Only shown when initial cloud check is completed & 0 results) ─────── */}
              {hasInitialCloudSynced && filteredHomeBusinesses.length === 0 && (
                <div className="text-center py-12 px-4 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] space-y-3.5 shadow-sm">
                  <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto text-2xl shadow-inner">
                    🏪
                  </div>
                  {user?.role === 'rep' && scopedBusinesses.length === 0 ? (
                    <>
                      <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)]">
                        لم تقم بتسجيل أي نشاط تجاري حتى الآن
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                        هذه المساحة مخصصة لعرض وإدارة الأنشطة والزيارات الميدانية الخاصة بك. ابدأ الآن بتوثيق أول محل تجاري لتفعيل حسابك وكسب عمولتك فوراً!
                      </p>
                      <button
                        onClick={() => setActiveTab('add')}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 font-extrabold text-xs px-6 py-3 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer mt-1"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>تسجيل أول نشاط تجاري الآن ➕</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)]">
                        لا توجد أنشطة تجارية مطابقة للبحث أو التصفية الحالية
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                        جرب تغيير خيارات التصفية أو البحث، أو اضغط على "تسجيل نشاط جديد" للبدء في توثيق المحلات.
                      </p>
                      <button
                        onClick={() => {
                          setHomeSearchQuery('');
                          setHomeGovFilter('all');
                          setHomeCategoryFilter('all');
                          setHomeVerificationFilter('all');
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-xl border border-amber-500/30 cursor-pointer transition-colors"
                      >
                        إعادة ضبط الفلاتر 🔄
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ── 3. GRID MODE (WORLD-CLASS DIRECTORY CARDS - Instant 0ms Render) ─────────────────── */}
              {(!isLoadingData || businesses.length > 0) && homeViewMode === 'grid' && filteredHomeBusinesses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                  {filteredHomeBusinesses.map((biz) => {
                    const isExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
                    const remaining = isExempt ? 0 : Math.max(0, (biz.packagePrice || 0) - (biz.amountPaid || 0));
                    const isVerified = biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced';
                    const hasPhotos = biz.photos && biz.photos.length > 0;
                    const hasVideos = Boolean(biz.videos && biz.videos.length > 0);
                    const coverPhoto = hasPhotos ? biz.photos[0] : null;

                    return (
                      <div
                        key={biz.id}
                        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-xs hover:shadow-lg hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group"
                      >
                        {/* Visual Header / Cover */}
                        <div className="relative aspect-[16/8.5] bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-slate-900/10 overflow-hidden">
                          {coverPhoto ? (
                            <img
                              src={coverPhoto}
                              alt={biz.nameAr}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-amber-500/60 bg-[var(--bg-surface)]">
                              <Store className="w-8 h-8 opacity-40 group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-bold text-[var(--text-muted)] opacity-70">منظومة دليلك الميدانية</span>
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                          {/* Center Play Button Overlay for Videos */}
                          {hasVideos && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVideoBiz(biz);
                              }}
                              className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-slate-950/75 hover:bg-amber-500 text-amber-400 hover:text-slate-950 flex items-center justify-center backdrop-blur-md border border-amber-500/60 shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 z-10 cursor-pointer group-hover:scale-105"
                              title="تشغيل فيديو النشاط (30 ثانية)"
                            >
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </button>
                          )}

                          {/* Floating Verified & Video Badges */}
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                            <span
                              className={`text-[9.5px] font-black px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm border ${
                                isVerified
                                  ? 'bg-emerald-500/90 text-white border-emerald-400/40'
                                  : 'bg-amber-500/90 text-slate-950 border-amber-400/40'
                              }`}
                            >
                              {isVerified ? '✓ موثق رسمي' : '⏳ قيد التوثيق'}
                            </span>

                            {hasVideos && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVideoBiz(biz);
                                }}
                                className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-black shadow-md hover:scale-105 transition-transform cursor-pointer border border-amber-400/60"
                                title="مشاهدة فيديو النشاط الميداني"
                              >
                                <Play className="w-2.5 h-2.5 fill-slate-950" />
                                <span>فيديو 30ث</span>
                              </button>
                            )}
                          </div>

                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-950/70 text-slate-200 backdrop-blur-md border border-white/10">
                              {biz.invoiceNumber || 'INV'}
                            </span>
                          </div>

                          {/* Bottom info on photo */}
                          <div className="absolute bottom-2 right-2.5 left-2.5 flex items-center justify-between text-white">
                            <span className="text-[10px] font-bold bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/10 truncate max-w-[170px]">
                              {biz.category}
                            </span>
                            {biz.workingHours && (
                              <span className="text-[9px] font-medium opacity-80 truncate max-w-[130px] flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> {biz.workingHours}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Content Body */}
                        <div className="p-3.5 sm:p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div>
                              <h4 className="font-black text-sm sm:text-base text-[var(--text-primary)] group-hover:text-amber-500 transition-colors line-clamp-1">
                                {biz.nameAr}
                              </h4>
                              <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] font-bold mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span className="truncate">{biz.governorate} • {biz.city} {biz.street ? `• ${biz.street}` : ''}</span>
                              </div>
                            </div>

                            {/* Representative & Date Strip */}
                            <div className="flex items-center justify-between text-[10.5px] bg-[var(--input-bg)] px-2.5 py-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] font-bold">
                              <span className="truncate max-w-[140px] text-[var(--text-secondary)]">👤 {biz.repName || 'مندوب ميداني'}</span>
                              <span className="font-mono text-[9.5px] shrink-0">{formatActivityDateTime(biz.createdDate || biz.invoiceDate)}</span>
                            </div>

                            {/* Financial Package & Payment Row */}
                            <div className="flex items-center justify-between text-xs pt-1">
                              <div className="flex items-center gap-1">
                                {isExempt ? (
                                  <span className="text-[11px] font-black text-teal-700 dark:text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                                    🆓 نشاط رائج (مجاني 0 ج)
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                    {biz.packagePrice || 250} ج.م
                                  </span>
                                )}
                              </div>
                              <div>
                                {isExempt ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                                    ✓ إدراج مجاني
                                  </span>
                                ) : remaining === 0 ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    ✓ مسدد بالكامل
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                    متبقي {remaining} ج
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Interactive Actions */}
                          <div className="pt-2 border-t border-[var(--border-color)]/60 space-y-2">
                            {/* Fast Action Buttons Bar */}
                            <div className="grid grid-cols-4 gap-1.5 text-center">
                              {/* Call */}
                              <a
                                href={`tel:${biz.phone || biz.ownerPhone}`}
                                className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-emerald-500/15 text-[var(--text-secondary)] hover:text-emerald-600 flex flex-col items-center justify-center gap-0.5 transition-colors text-[9.5px] font-bold border border-[var(--border-color)]"
                                title="اتصال هاتفي"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                                <span>اتصال</span>
                              </a>

                              {/* WhatsApp */}
                              <a
                                href={getRepFieldIntroWhatsAppUrl(biz, user?.name)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-emerald-500/15 text-[var(--text-secondary)] hover:text-emerald-600 flex flex-col items-center justify-center gap-0.5 transition-colors text-[9.5px] font-bold border border-[var(--border-color)]"
                                title="محادثة واتساب ميدانية"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                                <span>واتساب</span>
                              </a>

                              {/* Google Maps: Active if official live googleMapsUrl is present */}
                              {biz.googleMapsUrl && biz.googleMapsUrl.trim().startsWith('http') ? (
                                <a
                                  href={biz.googleMapsUrl.trim()}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex flex-col items-center justify-center gap-0.5 transition-colors text-[9.5px] font-bold border border-[var(--border-color)]"
                                  title="الموقع موثق رسمياً: فتح على خرائط Google"
                                >
                                  <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>الخريطة</span>
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 flex flex-col items-center justify-center gap-0.5 text-[9.5px] font-bold border border-slate-300 dark:border-slate-700/80 cursor-not-allowed opacity-60"
                                  title="النشاط غير موثق بعد (قيد مراجعة واعتماد خرائط Google)"
                                >
                                  <Navigation className="w-3.5 h-3.5 opacity-40" />
                                  <span>غير مدرج</span>
                                </button>
                              )}

                              {/* Invoice Preview */}
                              <button
                                type="button"
                                onClick={() => setSelectedInvoiceBiz(biz)}
                                className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-purple-500/15 text-[var(--text-secondary)] hover:text-purple-600 flex flex-col items-center justify-center gap-0.5 transition-colors text-[9.5px] font-bold border border-[var(--border-color)] cursor-pointer"
                                title="عرض الفاتورة الإلكترونية"
                              >
                                <FileText className="w-3.5 h-3.5 text-purple-500" />
                                <span>فاتورة</span>
                              </button>
                            </div>

                            {/* Primary Details / Edit Button */}
                            <button
                              onClick={() => setEditingBusiness(biz)}
                              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                            >
                              <Eye className="w-4 h-4 stroke-[2.5]" />
                              <span>تفاصيل وتعديل النشاط</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── LIST / TABLE MODE (HIGH DENSITY PRODUCTIVITY VIEW - Instant 0ms Render) ─────────── */}
              {(!isLoadingData || businesses.length > 0) && homeViewMode === 'list' && filteredHomeBusinesses.length > 0 && (
                <div className="space-y-2.5">
                  {/* MOBILE VIEW (< md): High-Density Fast Action Rows */}
                  <div className="md:hidden space-y-2.5">
                    {filteredHomeBusinesses.map((biz) => {
                      const isExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
                      const remaining = isExempt ? 0 : Math.max(0, (biz.packagePrice || 0) - (biz.amountPaid || 0));
                      const isVerified = biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced';
                      const ownerPhone = biz.ownerPhone || biz.phone || '';

                      return (
                        <div
                          key={`mobile_row_${biz.id}`}
                          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3.5 space-y-2.5 shadow-2xs hover:border-amber-500/40 transition-all text-right"
                        >
                          {/* Row 1: Name, Category, Verification */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5 min-w-0">
                              <h4
                                onClick={() => setEditingBusiness(biz)}
                                className="font-black text-sm text-[var(--text-primary)] hover:text-amber-500 cursor-pointer truncate"
                              >
                                {biz.nameAr}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[10.5px] text-[var(--text-muted)] font-bold">
                                <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/20 truncate max-w-[120px]">
                                  {biz.category}
                                </span>
                                <span>•</span>
                                <span className="truncate">{biz.governorate} - {biz.city}</span>
                              </div>
                            </div>

                            <span
                              className={`text-[9.5px] font-black px-2 py-0.5 rounded-full shrink-0 border ${
                                isVerified
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {isVerified ? '✓ موثق' : '⏳ قيد التوثيق'}
                            </span>
                          </div>

                          {/* Row 2: Financial & Operational Status */}
                          <div className="flex items-center justify-between text-[11px] bg-[var(--input-bg)] px-2.5 py-1.5 rounded-xl border border-[var(--border-color)] font-bold">
                            <div className="flex items-center gap-1">
                              {isExempt ? (
                                <span className="text-teal-600 dark:text-teal-400 font-black">🆓 إدراج مجاني (0 ج)</span>
                              ) : remaining === 0 ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-black">✓ مسدد بالكامل ({biz.packagePrice || 250} ج)</span>
                              ) : (
                                <span className="text-rose-600 dark:text-rose-400 font-black">⚠️ متبقي {remaining} ج من {biz.packagePrice || 250} ج</span>
                              )}
                            </div>
                            <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[130px]">
                              👤 {biz.repName || 'مندوب'}
                            </span>
                          </div>

                          {/* Row 3: Fast Quick Actions (Zero Image Overhead) */}
                          <div className="flex items-center justify-between gap-1.5 pt-0.5">
                            <button
                              onClick={() => setEditingBusiness(biz)}
                              className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-black py-1.5 px-2 rounded-xl shadow-2xs transition-transform active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>التفاصيل</span>
                            </button>

                            <button
                              onClick={() => setSelectedInvoiceBiz(biz)}
                              className="bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] border border-[var(--border-color)] text-[11px] font-bold py-1.5 px-2.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                              title="عرض الفاتورة"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-500" />
                              <span>فاتورة</span>
                            </button>

                            {ownerPhone && (
                              <a
                                href={`https://wa.me/2${ownerPhone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 p-1.5 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                                title="مراسلة واتساب"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {ownerPhone && (
                              <a
                                href={`tel:${ownerPhone}`}
                                className="bg-blue-600/15 hover:bg-blue-600/25 text-blue-600 dark:text-blue-400 border border-blue-500/30 p-1.5 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                                title="اتصال هاتفي"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* DESKTOP VIEW (>= md): High-Speed Data Table */}
                  <div className="hidden md:block bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-[var(--input-bg)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-black text-[11px]">
                          <tr>
                            <th className="py-3.5 px-4">النشاط التجاري</th>
                            <th className="py-3.5 px-3">التصنيف</th>
                            <th className="py-3.5 px-3">الموقع الجغرافي</th>
                            <th className="py-3.5 px-3">حالة التوثيق</th>
                            <th className="py-3.5 px-3">الموقف المالي</th>
                            <th className="py-3.5 px-3">المندوب المسجل</th>
                            <th className="py-3.5 px-4 text-center">الإجراءات السريعة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]/60">
                          {filteredHomeBusinesses.map((biz) => {
                            const isExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
                            const remaining = isExempt ? 0 : Math.max(0, (biz.packagePrice || 0) - (biz.amountPaid || 0));
                            const isVerified = biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced';
                            const ownerPhone = biz.ownerPhone || biz.phone || '';

                            return (
                              <tr key={`desktop_list_${biz.id}`} className="hover:bg-[var(--input-bg)]/50 transition-colors">
                                <td className="py-3.5 px-4">
                                  <div
                                    onClick={() => setEditingBusiness(biz)}
                                    className="font-black text-[var(--text-primary)] hover:text-amber-500 cursor-pointer text-sm"
                                  >
                                    {biz.nameAr}
                                  </div>
                                  <div className="text-[10px] font-mono text-[var(--text-muted)]">{biz.invoiceNumber}</div>
                                </td>
                                <td className="py-3.5 px-3">
                                  <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10.5px] font-bold px-2 py-0.5 rounded-md border border-amber-500/20">
                                    {biz.category}
                                  </span>
                                </td>
                                <td className="py-3.5 px-3 text-[var(--text-secondary)] font-bold">
                                  {biz.governorate} • {biz.city}
                                </td>
                                <td className="py-3.5 px-3">
                                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                                    isVerified ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                  }`}>
                                    {isVerified ? '✓ موثق رسمي' : '⏳ قيد التوثيق'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-3">
                                  {isExempt ? (
                                    <span className="text-[10.5px] font-black px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                                      🆓 إدراج مجاني
                                    </span>
                                  ) : remaining === 0 ? (
                                    <span className="text-[10.5px] font-black px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                      ✓ مسدد ({biz.packagePrice || 250} ج)
                                    </span>
                                  ) : (
                                    <span className="text-[10.5px] font-black px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                      متبقي {remaining} ج
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-3 text-[11px] text-[var(--text-muted)] font-bold">
                                  {biz.repName || '—'}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => setEditingBusiness(biz)}
                                      className="py-1 px-2.5 rounded-xl bg-amber-500 text-slate-950 font-black hover:bg-amber-600 transition-transform active:scale-95 cursor-pointer text-xs flex items-center gap-1 shadow-2xs"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>تفاصيل</span>
                                    </button>
                                    <button
                                      onClick={() => setSelectedInvoiceBiz(biz)}
                                      className="p-1.5 rounded-xl bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-amber-500 border border-[var(--border-color)] transition-colors cursor-pointer"
                                      title="عرض الفاتورة"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                                    </button>
                                    {ownerPhone && (
                                      <a
                                        href={`https://wa.me/2${ownerPhone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
                                        title="مراسلة واتساب"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                    {ownerPhone && (
                                      <a
                                        href={`tel:${ownerPhone}`}
                                        className="p-1.5 rounded-xl bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border border-blue-500/30 transition-colors"
                                        title="اتصال هاتفي"
                                      >
                                        <Phone className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
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
            currentUser={user}
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

                {user?.role !== 'rep' && (
                  <>
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
                  </>
                )}

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
          onLoginSuccess={handleLoginUser}
          representatives={representatives}
          onAddRepresentative={handleAddRepresentative}
        />
      )}

      {/* MODAL: ADMIN & USER PROFILE / AVATAR MODAL (STRICT ADMIN ONLY) */}
      {showAdminProfileModal && user && user.role === 'admin' && (
        <AdminProfileModal
          user={user}
          onClose={() => setShowAdminProfileModal(false)}
          onUpdateProfile={handleUpdateUserProfile}
        />
      )}

      {/* MODAL: SHORT VIDEO PLAYER */}
      {selectedVideoBiz && (
        <VideoPlayerModal
          business={selectedVideoBiz}
          onClose={() => setSelectedVideoBiz(null)}
        />
      )}

      {/* MODAL: OFFLINE SYNC HUB (INDEXEDDB & ZERO DATA LOSS) */}
      <OfflineSyncModal
        isOpen={showOfflineSyncModal}
        currentUser={user}
        onClose={() => setShowOfflineSyncModal(false)}
        onSyncComplete={async () => {
          try {
            const fresh = await fetchBusinessesFromDb();
            if (fresh && fresh.length > 0) {
              setBusinesses(fresh);
            }
          } catch {}
        }}
      />
    </div>
  );
}
