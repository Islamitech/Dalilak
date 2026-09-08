import { useState, useEffect } from 'react';
import {
  Business,
  Representative,
  PayoutRequest,
  InterestedLead,
  PaymentGatewayConfig,
  User,
} from '../types';
import { DEFAULT_PAYMENT_CONFIG } from '../data/mockData';
import {
  safeParseJson,
  safeGetLocalStorageItem,
  safeSetLocalStorageItem,
  safeSetSessionItem,
  getSafeUserForStorage,
} from '../utils/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  getCachedBusinesses,
  fetchBusinessesFromDb,
  hydrateBusinessesPhotosInBackground,
  syncDeltaBusinessesFromDb,
  getDeletedBusinesses,
  fetchRepsFromDb,
  getDeletedRepresentatives,
  fetchPayoutRequestsFromDb,
  fetchLeadsFromDb,
  fetchPaymentConfigFromDb,
} from '../services/db';

interface UseAppDataSyncProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  userRef: React.MutableRefObject<User | null>;
  addNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export function useAppDataSync({
  user,
  setUser,
  userRef,
  addNotification,
}: UseAppDataSyncProps) {
  const [showSyncBadge, setShowSyncBadge] = useState<boolean>(false);

  const [businesses, setBusinesses] = useState<Business[]>(() =>
    getCachedBusinesses().filter(
      (b) =>
        b &&
        b.packageId !== 'pkg_interested_lead' &&
        (b as any).verificationStatus !== 'lead' &&
        !b.id.startsWith('lead_')
    )
  );

  const [representatives, setRepresentatives] = useState<Representative[]>(() => {
    const raw = safeParseJson<Representative[]>(safeGetLocalStorageItem('dalelak_cached_reps'), []) || [];
    const softDel = getDeletedRepresentatives();
    const softDelIds = new Set(softDel.map((r) => (r.id || '').toLowerCase()));
    const softDelEmails = new Set(softDel.map((r) => (r.email || '').toLowerCase()).filter(Boolean));
    const blacklist = new Set(
      (safeParseJson<string[]>(safeGetLocalStorageItem('dalelak_deleted_rep_ids'), []) || []).map((x) =>
        String(x).toLowerCase()
      )
    );
    return raw.filter((r) => {
      if (r.isDeleted) return false;
      const idLower = (r.id || '').toLowerCase();
      const emailLower = (r.email || '').toLowerCase();
      if (idLower && (softDelIds.has(idLower) || blacklist.has(idLower))) return false;
      if (emailLower && (softDelEmails.has(emailLower) || blacklist.has(emailLower))) return false;
      return true;
    });
  });

  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>(() =>
    safeParseJson<PayoutRequest[]>(safeGetLocalStorageItem('dalelak_cached_payouts'), [])
  );

  const [deletedBusinesses, setDeletedBusinesses] = useState<Business[]>(() => getDeletedBusinesses());
  const [deletedRepresentatives, setDeletedRepresentatives] = useState<Representative[]>(() =>
    getDeletedRepresentatives()
  );

  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig>(() => {
    const parsed = safeParseJson<any>(safeGetLocalStorageItem('dalelak_payment_config'), null);
    if (parsed) {
      return { ...DEFAULT_PAYMENT_CONFIG, ...parsed, instaPayHandle: parsed.instaPayHandle || '@daz31181' };
    }
    return DEFAULT_PAYMENT_CONFIG;
  });

  const [leads, setLeads] = useState<InterestedLead[]>(() =>
    safeParseJson<InterestedLead[]>(safeGetLocalStorageItem('dalelak_cached_leads'), [])
  );

  const [isLoadingData, setIsLoadingData] = useState<boolean>(() => {
    const cached = getCachedBusinesses();
    const isAppInitialized = Boolean(safeGetLocalStorageItem('dalelak_app_initialized'));
    // If cached businesses exist or app was initialized before, render instantly in 0ms without skeleton flicker!
    return cached.length === 0 && !isAppInitialized;
  });

  const [hasInitialCloudSynced, setHasInitialCloudSynced] = useState<boolean>(() => getCachedBusinesses().length > 0);

  // Fetch initial data with fast independent parallel fetches
  useEffect(() => {
    // 1. Fetch businesses immediately
    fetchBusinessesFromDb()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const cleanBiz = data.filter(
            (b) =>
              b &&
              b.packageId !== 'pkg_interested_lead' &&
              (b as any).verificationStatus !== 'lead' &&
              !b.id.startsWith('lead_')
          );
          setBusinesses(cleanBiz);

          // 📸 Non-blocking background photo hydration
          hydrateBusinessesPhotosInBackground(cleanBiz, (hydratedList) => {
            setBusinesses(hydratedList);
          });
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
          if (userRef.current) {
            const currentLoggedInId = userRef.current.id;
            const freshUserRep = dbRepsData.find(
              (r) =>
                r.id === currentLoggedInId ||
                (userRef.current?.email && r.email.toLowerCase() === userRef.current.email.toLowerCase())
            );
            if (freshUserRep && userRef.current && userRef.current.id === currentLoggedInId) {
              // 🔐 BUG-01 FIX: تحقق من تغيير البيانات فعلاً قبل setUser
              // كان Race Condition بين الـ initial fetch والـ realtime sync يُسبب re-renders متكررة
              const prevRepDataStr = JSON.stringify(userRef.current.repData);
              const newRepDataStr = JSON.stringify(freshUserRep);
              if (prevRepDataStr !== newRepDataStr) {
                const updatedUser = { ...userRef.current, repData: freshUserRep };
                userRef.current = updatedUser;
                setUser(updatedUser);
                safeSetSessionItem('dalelak_active_user', JSON.stringify(getSafeUserForStorage(updatedUser)));
              }
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
  }, [user?.id, user?.role, setUser, userRef]);

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
        syncDeltaBusinessesFromDb()
          .then((res) => {
            if (res.updated) {
              setBusinesses(res.businesses);
              setShowSyncBadge(true);
              setTimeout(() => setShowSyncBadge(false), 3200);
            }
          })
          .catch(() => {});

        fetchRepsFromDb()
          .then((freshReps) => {
            if (Array.isArray(freshReps) && freshReps.length > 0) {
              setRepresentatives(freshReps);
              if (userRef.current) {
                const currentLoggedInId = userRef.current.id;
                const myFreshRep = freshReps.find(
                  (r) =>
                    r.id === currentLoggedInId ||
                    (userRef.current?.email && r.email.toLowerCase() === userRef.current.email.toLowerCase())
                );
                if (myFreshRep && userRef.current && userRef.current.id === currentLoggedInId) {
                  // 🔐 BUG-01 FIX (second location): نفس الحماية في الـ realtime sync
                  const prevStr = JSON.stringify(userRef.current.repData);
                  const newStr = JSON.stringify(myFreshRep);
                  if (prevStr !== newStr) {
                    const updatedUser = { ...userRef.current, repData: myFreshRep };
                    userRef.current = updatedUser;
                    setUser(updatedUser);
                    safeSetSessionItem('dalelak_active_user', JSON.stringify(getSafeUserForStorage(updatedUser)));
                  }
                }
              }
            }
          })
          .catch(() => {});

        const activeUserRole = userRef.current?.role || user?.role || '';
        const isManagerialNow = ['admin', 'supervisor', 'accountant'].includes(activeUserRole);
        const currentTargetRepId = isManagerialNow ? undefined : (userRef.current?.id || user?.id);
        fetchPayoutRequestsFromDb(currentTargetRepId)
          .then((freshPayouts) => {
            if (Array.isArray(freshPayouts)) setPayoutRequests(freshPayouts);
          })
          .catch(() => {});

        // Always fetch the complete leads dataset from DB; UI scopes by repId cleanly for reps, while admins see all
        fetchLeadsFromDb()
          .then((freshLeads) => {
            if (Array.isArray(freshLeads)) setLeads(freshLeads);
          })
          .catch(() => {});
      } catch (err) {
        // silent
      }
    };

    // 1. Instant Cross-Tab Sync Listener
    if (syncChannel) {
      syncChannel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_DATA' || event.data?.type === 'REP_UPDATED') {
          refreshLiveData(true);
        } else if (event.data?.type === 'NEW_REP_REGISTERED') {
          refreshLiveData(true);
          const currentRole = userRef.current?.role || user?.role;
          if (currentRole === 'admin' || currentRole === 'supervisor') {
            const repName = event.data.name || 'مندوب جديد';
            const repGov = event.data.governorate ? ` (${event.data.governorate})` : '';
            addNotification(
              `🔔 طلب تسجيل جديد: قام المندوب "${repName}"${repGov} بتقديم طلب حساب جديد بانتظار مراجعتك وتفعيله.`,
              'info'
            );
          }
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
          .on('postgres_changes', { event: '*', schema: 'public', table: 'representatives' }, (payload: any) => {
            refreshLiveData(true);
            if (payload?.eventType === 'INSERT' && payload.new) {
              const repStatus = payload.new.status || 'suspended';
              const repName = payload.new.name || 'مندوب جديد';
              const repGov = payload.new.governorate ? ` (${payload.new.governorate})` : '';
              if (repStatus === 'suspended') {
                const currentRole = userRef.current?.role || user?.role;
                if (currentRole === 'admin' || currentRole === 'supervisor') {
                  addNotification(
                    `🔔 طلب تسجيل جديد: قام المندوب "${repName}"${repGov} بتسجيل حساب جديد بانتظار التفعيل.`,
                    'info'
                  );
                }
              }
            }
          })
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
      if (realtimeChannel) {
        try {
          supabase.removeChannel(realtimeChannel);
        } catch {
          if (typeof realtimeChannel.unsubscribe === 'function') {
            realtimeChannel.unsubscribe();
          }
        }
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [user?.id, user?.email, user?.role, addNotification, setUser, userRef]);

  return {
    businesses,
    setBusinesses,
    representatives,
    setRepresentatives,
    payoutRequests,
    setPayoutRequests,
    leads,
    setLeads,
    deletedBusinesses,
    setDeletedBusinesses,
    deletedRepresentatives,
    setDeletedRepresentatives,
    paymentConfig,
    setPaymentConfig,
    isLoadingData,
    hasInitialCloudSynced,
    showSyncBadge,
    setShowSyncBadge,
  };
}
