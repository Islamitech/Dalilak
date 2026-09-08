import { useState, useEffect } from 'react';
import { User, Business, InterestedLead } from '../types';
import { getOfflineSyncStatus, OfflineSyncStatus, syncAllPendingOfflineData } from '../services/offlineSync';
import { fetchLeadsFromDb, fetchBusinessesFromDb } from '../services/db';

interface UseOfflineSyncStatusProps {
  user: User | null;
  setLeads: React.Dispatch<React.SetStateAction<InterestedLead[]>>;
  setBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
}

export function useOfflineSyncStatus({
  user,
  setLeads,
  setBusinesses,
}: UseOfflineSyncStatusProps) {
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

  // Reactive IndexedDB Offline Sync Status Listener (Strictly User-Scoped, initialized after user exists)
  useEffect(() => {
    let autoSyncTimer: any = null;

    const updateSyncStatus = async () => {
      try {
        const effectiveUid = user?.id || user?.email || null;
        const status = await getOfflineSyncStatus(effectiveUid);
        setOfflineSyncStatus(status);

        // 🚀 Auto-sync in background if online and pending items exist
        if (status.isOnline && status.totalPendingCount > 0 && !status.isSyncing) {
          clearTimeout(autoSyncTimer);
          autoSyncTimer = setTimeout(async () => {
            try {
              const res = await syncAllPendingOfflineData(effectiveUid);
              if (res.syncedCount > 0) {
                const freshLeads = await fetchLeadsFromDb();
                if (freshLeads && freshLeads.length > 0) setLeads(freshLeads);
                const freshBiz = await fetchBusinessesFromDb();
                if (freshBiz && freshBiz.length > 0) setBusinesses(freshBiz);
              }
            } catch {}
          }, 1200);
        }
      } catch {}
    };

    updateSyncStatus();

    if (typeof window !== 'undefined') {
      window.addEventListener('dalelak_offline_state_changed', updateSyncStatus);
      window.addEventListener('online', updateSyncStatus);
      window.addEventListener('offline', updateSyncStatus);
    }

    return () => {
      clearTimeout(autoSyncTimer);
      if (typeof window !== 'undefined') {
        window.removeEventListener('dalelak_offline_state_changed', updateSyncStatus);
        window.removeEventListener('online', updateSyncStatus);
        window.removeEventListener('offline', updateSyncStatus);
      }
    };
  }, [user, setLeads, setBusinesses]);

  return {
    offlineSyncStatus,
    setOfflineSyncStatus,
    showOfflineSyncModal,
    setShowOfflineSyncModal,
  };
}
