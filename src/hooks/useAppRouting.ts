import { useState, useEffect } from 'react';
import { safeGetSessionItem, safeParseJson, safeSetLocalStorageItem, safeGetLocalStorageItem } from '../utils/storage';

export type AppTab = 'home' | 'map' | 'add' | 'invoices' | 'admin' | 'profile';
export type ProfileSubTab = 'id_docs' | 'finance' | 'activities' | 'referral';
export interface ExternalView {
  type: 'invoice' | 'rep';
  id: string;
}

export function useAppRouting() {
  const [profileInitialTab, setProfileInitialTab] = useState<ProfileSubTab>('activities');

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === 'undefined') return 'home';

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
      const parsed = safeParseJson<any>(savedUserStr, null);
      if (parsed?.role === 'admin') return 'admin';
    }

    return 'home';
  });

  const handleNavigateToProfile = (subTab: ProfileSubTab = 'activities') => {
    setProfileInitialTab(subTab);
    setActiveTab('profile');
  };

  // Sync activeTab state with localStorage and browser URL (Query Param & Hash)
  useEffect(() => {
    if (typeof window === 'undefined') return;

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

  // External View State (from QR code scanning)
  const [externalView, setExternalView] = useState<ExternalView | null>(null);

  const [pendingReferralCode, setPendingReferralCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRef = urlParams.get('ref') || urlParams.get('referral') || urlParams.get('inviter') || '';
      if (urlRef) {
        safeSetLocalStorageItem('dalelak_pending_referral', urlRef.trim().toUpperCase());
        return urlRef.trim().toUpperCase();
      }
      return safeGetLocalStorageItem('dalelak_pending_referral') || '';
    }
    return '';
  });

  // Parse URL for deep linking (QR codes and referral codes)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view');
    const id = urlParams.get('id');
    const refCode = urlParams.get('ref') || urlParams.get('referral') || urlParams.get('inviter');

    if (refCode) {
      const cleanRef = refCode.trim().toUpperCase();
      safeSetLocalStorageItem('dalelak_pending_referral', cleanRef);
      setPendingReferralCode(cleanRef);
    }

    if (view === 'invoice' && id) {
      setExternalView({ type: 'invoice', id });
    } else if (view === 'rep' && id) {
      setExternalView({ type: 'rep', id });
    }
  }, []);

  return {
    activeTab,
    setActiveTab,
    profileInitialTab,
    setProfileInitialTab,
    handleNavigateToProfile,
    externalView,
    setExternalView,
    pendingReferralCode,
    setPendingReferralCode,
  };
}
