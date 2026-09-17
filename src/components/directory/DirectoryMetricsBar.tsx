import React from 'react';
import { Store, ShieldCheck, MapPin, Clock, Building2 } from 'lucide-react';

export interface DirectoryStats {
  totalRegistered: number;
  directoryApproved: number;
  googleMapsVerified: number;
  pendingDirectory: number;
  govs: number;
  fullyPaid: number;
  exempt: number;
  unpaid: number;
  needsFollowup: number;
  trending: number;
  total: number;
}

export interface DirectoryMetricsBarProps {
  stats: DirectoryStats;
  isLoadingData: boolean;
  totalBusinessesCount: number;
  isRep: boolean;
  hasRegisteredBiz: boolean;
}

export const DirectoryMetricsBar: React.FC<DirectoryMetricsBarProps> = ({
  stats,
  isLoadingData,
  totalBusinessesCount,
  isRep,
  hasRegisteredBiz,
}) => {
  if (isRep && !hasRegisteredBiz) {
    return (
      <div className="max-w-md mx-auto w-full">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-black shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)] font-bold">إجمالي المسجل</span>
              <span className="text-xl font-black text-[var(--text-primary)] font-mono">0</span>
            </div>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">
              رصيد البداية — سجّل أول نشاط تجاري في منطقتك لبدء تنشيط الإحصاءات وكسب عمولتك
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid ${isRep ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5 sm:gap-2.5`}>
      {/* 1. إجمالي الأنشطة المعتمدة / المسجلة */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-2xs flex flex-col items-center justify-center text-center transition-all min-w-0">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-500/15 text-slate-600 flex items-center justify-center mb-1 shrink-0">
          <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        {isLoadingData && totalBusinessesCount === 0 ? (
          <div className="w-10 h-5 bg-slate-300 animate-pulse rounded my-0.5" />
        ) : (
          <div className="text-sm sm:text-base font-black text-[var(--text-primary)] font-mono leading-tight">
            {stats.totalRegistered}
          </div>
        )}
        <div className="text-[10px] sm:text-[11px] text-[var(--text-muted)] font-bold truncate max-w-full mt-0.5">
          {isRep ? 'إجمالي المسجل' : 'أنشطة الدليل'}
        </div>
      </div>

      {/* 2. معتمد بالدليل (للمندوب فقط) */}
      {isRep && (
        <div className="bg-[var(--bg-card)] border border-emerald-500/30 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-2xs flex flex-col items-center justify-center text-center transition-all min-w-0 animate-fade-in">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-1 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          {isLoadingData && totalBusinessesCount === 0 ? (
            <div className="w-10 h-5 bg-slate-300 animate-pulse rounded my-0.5" />
          ) : (
            <div className="text-sm sm:text-base font-black text-emerald-600 font-mono leading-tight">
              {stats.directoryApproved}
            </div>
          )}
          <div className="text-[10px] sm:text-[11px] text-emerald-600 font-bold truncate max-w-full mt-0.5">
            معتمد 🟢
          </div>
        </div>
      )}

      {/* 3. قيد مراجعة الدليل (للمندوب فقط) */}
      {isRep && (
        <div className="bg-[var(--bg-card)] border border-amber-500/30 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-2xs flex flex-col items-center justify-center text-center transition-all min-w-0 animate-fade-in">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center mb-1 shrink-0">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          {isLoadingData && totalBusinessesCount === 0 ? (
            <div className="w-10 h-5 bg-slate-300 animate-pulse rounded my-0.5" />
          ) : (
            <div className="text-sm sm:text-base font-black text-amber-600 font-mono leading-tight">
              {stats.pendingDirectory}
            </div>
          )}
          <div className="text-[10px] sm:text-[11px] text-amber-600 font-bold truncate max-w-full mt-0.5">
            قيد المراجعة ⏳
          </div>
        </div>
      )}

      {/* 4. موثق بـ Google Maps (للجميع) */}
      <div className="bg-[var(--bg-card)] border border-blue-500/30 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-2xs flex flex-col items-center justify-center text-center transition-all min-w-0 animate-fade-in">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center mb-1 shrink-0">
          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        {isLoadingData && totalBusinessesCount === 0 ? (
          <div className="w-10 h-5 bg-slate-300 animate-pulse rounded my-0.5" />
        ) : (
          <div className="text-sm sm:text-base font-black text-blue-600 font-mono leading-tight">
            {stats.googleMapsVerified}
          </div>
        )}
        <div className="text-[10px] sm:text-[11px] text-blue-600 font-bold truncate max-w-full mt-0.5">
          موثق Google 🗺️
        </div>
      </div>

      {/* 5. تغطية المحافظات (للزوار فقط) */}
      {!isRep && (
        <div className="bg-[var(--bg-card)] border border-purple-500/30 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-2xs flex flex-col items-center justify-center text-center transition-all min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center mb-1 shrink-0">
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          {isLoadingData && totalBusinessesCount === 0 ? (
            <div className="w-10 h-5 bg-slate-300 animate-pulse rounded my-0.5" />
          ) : (
            <div className="text-sm sm:text-base font-black text-purple-600 font-mono leading-tight">
              {stats.govs} <span className="text-[10px] text-[var(--text-muted)] font-normal">محافظة</span>
            </div>
          )}
          <div className="text-[10px] sm:text-[11px] text-purple-600 font-bold truncate max-w-full mt-0.5">
            المحافظات النشطة
          </div>
        </div>
      )}
    </div>
  );
};
