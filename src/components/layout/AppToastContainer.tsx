import React from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { ToastNotification } from '../../types';

interface AppToastContainerProps {
  notifications: ToastNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<ToastNotification[]>>;
  showSyncBadge: boolean;
}

export const AppToastContainer: React.FC<AppToastContainerProps> = ({
  notifications,
  setNotifications,
  showSyncBadge,
}) => {
  return (
    <div
      className="fixed inset-x-0 z-[70] flex flex-col items-center gap-2 pointer-events-none px-2.5 sm:px-4"
      style={{ top: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))' }}
      aria-live="polite"
      aria-atomic="false"
    >
      {showSyncBadge && (
        <div
          className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 backdrop-blur-xl text-xs font-black shadow-xl animate-fade-in transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
          <span>تم تحديث البيانات للتو</span>
        </div>
      )}
      {notifications.map((n) => {
        const icons: Record<string, React.ReactNode> = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          error:   <AlertCircle className="w-4 h-4 text-rose-400" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          info:    <Info className="w-4 h-4 text-sky-400" />,
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
                onClick={() => setNotifications((prev) => prev.filter((x) => x.id !== n.id))}
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
  );
};
