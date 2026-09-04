import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Representative, Business } from '../types';
import {
  safeSetLocalStorageItem,
  safeGetLocalStorageItem,
  safeRemoveLocalStorageItem,
  safeSetSessionItem,
  safeGetSessionItem,
  safeRemoveSessionItem,
  getSafeUserForStorage,
} from '../utils/storage';
import { updateRepSessionInDb, fetchBusinessesFromDb } from '../services/db';
import { isRepAccountDeleted } from '../utils/accountStatus';

const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

interface UseAuthSessionOptions {
  onNotify: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onLogoutCleanup: () => void;
  setRepresentatives: React.Dispatch<React.SetStateAction<Representative[]>>;
  setActiveTab: (tab: string) => void;
  setBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
}

export function useAuthSession({
  onNotify,
  onLogoutCleanup,
  setRepresentatives,
  setActiveTab,
  setBusinesses,
}: UseAuthSessionOptions) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUserStr = safeGetLocalStorageItem('dalelak_logged_user') || safeGetSessionItem('dalelak_active_user');
    const lastActiveStr = safeGetLocalStorageItem('dalelak_last_interaction') || safeGetSessionItem('dalelak_session_last_active');
    const now = Date.now();

    if (savedUserStr) {
      const lastActiveTimestamp = Number(lastActiveStr) || now;
      const isNotIdle = (now - lastActiveTimestamp) < INACTIVITY_TIMEOUT_MS;

      if (isNotIdle) {
        try {
          const parsed = JSON.parse(savedUserStr);
          if (parsed && parsed.id && parsed.name) {
            // 🛡️ Security Check: Never restore a deleted/suspended/blacklisted account!
            if (isRepAccountDeleted(parsed)) {
              safeRemoveLocalStorageItem('dalelak_logged_user');
              safeRemoveLocalStorageItem('dalelak_last_interaction');
              safeRemoveSessionItem('dalelak_active_user');
              safeRemoveSessionItem('dalelak_session_last_active');
              return null;
            }
            safeSetLocalStorageItem('dalelak_last_interaction', String(now));
            safeSetSessionItem('dalelak_session_last_active', String(now));
            return parsed;
          }
        } catch (e) {}
      }
    }

    safeRemoveLocalStorageItem('dalelak_logged_user');
    safeRemoveLocalStorageItem('dalelak_last_interaction');
    safeRemoveSessionItem('dalelak_active_user');
    safeRemoveSessionItem('dalelak_session_last_active');
    return null;
  });

  const userRef = useRef<User | null>(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Sync user state with storage
  useEffect(() => {
    if (user) {
      const safeUserStr = JSON.stringify(getSafeUserForStorage(user));
      safeSetLocalStorageItem('dalelak_logged_user', safeUserStr);
      safeSetSessionItem('dalelak_active_user', safeUserStr);
      safeSetLocalStorageItem('dalelak_last_interaction', String(Date.now()));
      safeSetSessionItem('dalelak_session_last_active', String(Date.now()));
    } else {
      safeRemoveLocalStorageItem('dalelak_logged_user');
      safeRemoveLocalStorageItem('dalelak_last_interaction');
      safeRemoveSessionItem('dalelak_active_user');
      safeRemoveSessionItem('dalelak_session_last_active');
    }
  }, [user]);

  // Activity listeners
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

  // Logout handler
  const handleLogout = useCallback(() => {
    userRef.current = null;

    if (user?.id) {
      updateRepSessionInDb(user.id, undefined, undefined);

      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, sessionId: user.activeSessionId }),
      }).catch(() => {});

      setRepresentatives((prev) =>
        prev.map((r) =>
          r.id === user.id || (user.role === 'admin' && r.role === 'admin')
            ? { ...r, activeSessionId: undefined, lastActiveTimestamp: undefined }
            : r
        )
      );
    }

    onLogoutCleanup();

    setUser(null);
    setActiveTab('home');

    safeRemoveSessionItem('dalelak_active_user');
    safeRemoveSessionItem('dalelak_session_last_active');
    safeRemoveSessionItem('dalelak_auth_token');
    safeRemoveLocalStorageItem('dalelak_auth_token');
    safeRemoveLocalStorageItem('dalelak_logged_user');
    safeRemoveLocalStorageItem('dalelak_session_expires_at');
    safeRemoveLocalStorageItem('dalelak_last_interaction');
    safeRemoveLocalStorageItem('dalelak_active_tab');

    const url = new URL(window.location.href);
    url.searchParams.delete('tab');
    url.searchParams.delete('view');
    url.searchParams.delete('id');
    window.history.replaceState({}, '', url.toString());

    onNotify('🔒 تم تسجيل الخروج بنجاح من الحساب.', 'info');
    window.dispatchEvent(new CustomEvent('dalelak_offline_state_changed'));

    fetchBusinessesFromDb()
      .then((freshData) => {
        if (Array.isArray(freshData) && freshData.length > 0) {
          setBusinesses(freshData);
        }
      })
      .catch(() => {});
  }, [user, onLogoutCleanup, onNotify, setRepresentatives, setActiveTab, setBusinesses]);

  // Inactivity auto-logout watcher (20 mins)
  useEffect(() => {
    if (!user) return;

    const checkAndHandleInactivity = () => {
      if (!userRef.current) return false;
      const now = Date.now();
      const lastInteraction =
        Number(safeGetLocalStorageItem('dalelak_last_interaction') || safeGetSessionItem('dalelak_session_last_active')) || now;

      if (now - lastInteraction >= INACTIVITY_TIMEOUT_MS) {
        handleLogout();
        onNotify('⏳ تم تسجيل الخروج تلقائياً لعدم التفاعل مع الحساب لمدة 20 دقيقة. يرجى تسجيل الدخول مجدداً.', 'warning');
        return true;
      }
      return false;
    };

    const updateActivity = () => {
      if (!userRef.current) return;
      const isExpired = checkAndHandleInactivity();
      if (!isExpired) {
        const now = Date.now();
        safeSetLocalStorageItem('dalelak_last_interaction', String(now));
        safeSetSessionItem('dalelak_session_last_active', String(now));
      }
    };

    window.addEventListener('click', updateActivity, { passive: true });
    window.addEventListener('touchstart', updateActivity, { passive: true });
    window.addEventListener('keydown', updateActivity, { passive: true });
    window.addEventListener('scroll', updateActivity, { passive: true });
    window.addEventListener('mousemove', updateActivity, { passive: true });

    const interval = setInterval(() => {
      checkAndHandleInactivity();
    }, 10000);

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        checkAndHandleInactivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('mousemove', updateActivity);
    };
  }, [user, handleLogout, onNotify]);

  // Single-Session Active Heartbeat & Cross-Tab Invalidation Listener
  useEffect(() => {
    if (!user || !user.activeSessionId) return;

    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_single_session_channel') : null;

    const initialNow = Date.now();
    updateRepSessionInDb(user.id, user.activeSessionId, initialNow);

    const interval = setInterval(() => {
      // 🛡️ Security Check: Automatically terminate session if account was deleted
      if (userRef.current && isRepAccountDeleted(userRef.current)) {
        handleLogout();
        onNotify('⛔ تم إنهاء الجلسة وإغلاق الحساب لأنه تم حذفه من قِبل إدارة المنظومة.', 'error');
        return;
      }

      const now = Date.now();

      setRepresentatives((prev) =>
        prev.map((r) =>
          r.id === user.id || (user.role === 'admin' && r.role === 'admin')
            ? { ...r, activeSessionId: user.activeSessionId, lastActiveTimestamp: now }
            : r
        )
      );

      updateRepSessionInDb(user.id, user.activeSessionId, now);

      fetch('/api/auth/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, sessionId: user.activeSessionId }),
      })
        .then((res) => {
          if (res.status === 409) {
            handleLogout();
            onNotify('⚠️ تم تسجيل الدخول لهذا الحساب من جهاز آخر، تم إنهاء هذه الجلسة.', 'warning');
          } else if (res.status === 403) {
            handleLogout();
            onNotify('⛔ تم إنهاء الجلسة وإغلاق الحساب لعدم وجود صلاحية نشطة.', 'error');
          }
        })
        .catch(() => {});
    }, 15000);

    if (channel) {
      channel.onmessage = (event) => {
        if (
          event.data?.type === 'ACCOUNT_TERMINATED' &&
          (event.data?.userId === user.id || (event.data?.email && user.email && event.data.email.toLowerCase() === user.email.toLowerCase()))
        ) {
          handleLogout();
          onNotify('⛔ تم إنهاء الجلسة وإغلاق الحساب لأنه تم حذفه من قِبل إدارة المنظومة.', 'error');
          return;
        }

        if (
          event.data?.type === 'LOGIN' &&
          event.data?.userId === user.id &&
          event.data?.sessionId !== user.activeSessionId
        ) {
          handleLogout();
          onNotify('⚠️ تم فتح هذا الحساب في تبويب آخر.', 'warning');
        }
      };
    }

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
  }, [user, handleLogout, onNotify, setRepresentatives]);

  // Login handler
  const handleLoginUser = useCallback((u: User) => {
    setUser(u);
    safeSetSessionItem('dalelak_active_user', JSON.stringify(getSafeUserForStorage(u)));
    safeSetSessionItem('dalelak_session_last_active', String(Date.now()));
    window.dispatchEvent(new CustomEvent('dalelak_offline_state_changed'));

    const roleLabels: Record<string, string> = {
      admin: 'مدير النظام (صلاحيات كاملة) 🛡️',
      supervisor: 'مشرف الإدارة ⚡',
      accountant: 'محاسب ومحصل 💳',
      rep: 'مندوب ميداني معتمد 💼',
    };
    const roleTitle = u.repData?.roleTitle || u.roleTitle || roleLabels[u.role] || u.role;
    onNotify(`🟢 مرحباً بك يا أستاذ ${u.name} — تم تسجيل الدخول بصلاحية: ${roleTitle}`, 'success');

    const savedTab = localStorage.getItem('dalelak_active_tab');
    if (savedTab && ['home', 'map', 'add', 'invoices', 'admin', 'profile'].includes(savedTab)) {
      setActiveTab(savedTab);
    } else if (u.role === 'admin' || u.role === 'supervisor') {
      setActiveTab('admin');
    } else {
      setActiveTab('home');
    }
  }, [onNotify, setActiveTab]);

  return {
    user,
    setUser,
    userRef,
    handleLoginUser,
    handleLogout,
  };
}
