import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { OfflineSyncStatus } from '../../services/offlineSync';

interface AppOfflineBannerProps {
  offlineSyncStatus: OfflineSyncStatus;
  onOpenSyncModal: () => void;
}

export const AppOfflineBanner: React.FC<AppOfflineBannerProps> = ({
  offlineSyncStatus,
  onOpenSyncModal,
}) => {
  if (offlineSyncStatus.isOnline && offlineSyncStatus.totalPendingCount === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/90 border border-amber-500/40 rounded-2xl p-3 sm:p-3.5 mb-4 shadow-xl flex items-center justify-between text-right text-xs animate-fade-in">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-inner ${
            offlineSyncStatus.isOnline
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
          }`}
        >
          {offlineSyncStatus.isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        </div>
        <div>
          <div className="font-black text-amber-300 flex items-center gap-2">
            <span>
              {offlineSyncStatus.isOnline
                ? '🟢 متصل بالإنترنت (السيرفر السحابي)'
                : '🔴 وضع العمل بدون إنترنت (Offline-First)'}
            </span>
            {offlineSyncStatus.totalPendingCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                {offlineSyncStatus.totalPendingCount} بانتظار الرفع ⏳
              </span>
            )}
          </div>
          <div className="text-[10.5px] text-slate-300 font-bold mt-0.5">
            {offlineSyncStatus.totalPendingCount > 0
              ? 'بياناتك وصورك محفوظة بأمان على هاتفك (IndexedDB) وسيتم رفعها تلقائياً.'
              : 'التخزين المحلي الآمن نشط - يمكنك متابعة تسجيل الأنشطة حتى في انعدام الشبكة.'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSyncModal}
          className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs py-2 px-3 sm:px-4 rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${offlineSyncStatus.isSyncing ? 'animate-spin' : ''}`} />
          <span>{offlineSyncStatus.isSyncing ? 'جاري الرفع...' : 'إدارة المزامنة ⚡'}</span>
        </button>
      </div>
    </div>
  );
};
