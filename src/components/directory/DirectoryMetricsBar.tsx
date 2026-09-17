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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
      {/* 1. إجمالي الأنشطة المسجلة */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 sm:p-4 rounded-2xl shadow-xs flex items-center gap-2.5">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-500/15 text-slate-600 flex items-center justify-center font-black shrink-0">
          <Store className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10.5px] sm:text-[11px] text-[var(--text-muted)] font-bold truncate">إجمالي المسجل</div>
          {isLoadingData && totalBusinessesCount === 0 ? (
            <div className="w-12 h-6 bg-slate-300 animate-pulse rounded-lg mt-1" />
          ) : (
            <div className="text-base sm:text-lg font-black text-[var(--text-primary)] font-mono">{stats.totalRegistered}</div>
          )}
          {isRep && (
            <span className="text-[9px] text-[var(--text-muted)] font-medium block truncate">
              كافة أنشطتك المسجلة
            </span>
          )}
        </div>
      </div>

      {/* 2. معتمد بالدليل العام */}
      {(!isRep || stats.directoryApproved > 0) && (
        <div className="bg-[var(--bg-card)] border border-emerald-500/30 p-3 sm:p-4 rounded-2xl shadow-xs flex items-center gap-2.5 animate-fade-in">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-black shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] sm:text-[11px] text-emerald-600 font-bold truncate">معتمد 🟢</div>
            {isLoadingData && totalBusinessesCount === 0 ? (
              <div className="w-12 h-6 bg-slate-300 animate-pulse rounded-lg mt-1" />
            ) : (
              <div className="text-base sm:text-lg font-black text-emerald-600 font-mono">{stats.directoryApproved}</div>
            )}
            {isRep && (
              <span className="text-[9px] text-emerald-700 font-medium block truncate">
                أنشطة معتمدة ومطابقة بالدليل
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. موثق بـ Google Maps */}
      {(!isRep || stats.googleMapsVerified > 0) && (
        <div className="bg-[var(--bg-card)] border border-blue-500/30 p-3 sm:p-4 rounded-2xl shadow-xs flex items-center gap-2.5 animate-fade-in">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-black shrink-0">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] sm:text-[11px] text-blue-600 font-bold truncate">موثق بـ Google 🗺️</div>
            {isLoadingData && totalBusinessesCount === 0 ? (
              <div className="w-12 h-6 bg-slate-300 animate-pulse rounded-lg mt-1" />
            ) : (
              <div className="text-base sm:text-lg font-black text-blue-600 font-mono">{stats.googleMapsVerified}</div>
            )}
            {isRep && (
              <span className="text-[9px] text-blue-700 font-medium block truncate">
                أنشطة موثقة رسمياً على الخرائط
              </span>
            )}
          </div>
        </div>
      )}

      {/* 4. قيد مراجعة الدليل */}
      {(!isRep || hasRegisteredBiz) && (
        <div className="bg-[var(--bg-card)] border border-amber-500/30 p-3 sm:p-4 rounded-2xl shadow-xs flex items-center gap-2.5 animate-fade-in">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-black shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] sm:text-[11px] text-amber-600 font-bold truncate">قيد المراجعة ⏳</div>
            {isLoadingData && totalBusinessesCount === 0 ? (
              <div className="w-12 h-6 bg-slate-300 animate-pulse rounded-lg mt-1" />
            ) : (
              <div className="text-base sm:text-lg font-black text-amber-600 font-mono">{stats.pendingDirectory}</div>
            )}
            {isRep && (
              <span className="text-[9px] text-amber-700 font-medium block truncate">
                بانتظار تدقيق الإدارة للبيانات
              </span>
            )}
          </div>
        </div>
      )}

      {/* 5. تغطية المحافظات */}
      {!isRep && (
        <div className="col-span-2 sm:col-span-1 bg-[var(--bg-card)] border border-purple-500/30 p-3 sm:p-4 rounded-2xl shadow-xs flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center font-black shrink-0">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] sm:text-[11px] text-purple-600 font-bold truncate">المحافظات النشطة</div>
            {isLoadingData && totalBusinessesCount === 0 ? (
              <div className="w-12 h-6 bg-slate-300 animate-pulse rounded-lg mt-1" />
            ) : (
              <div className="text-base sm:text-lg font-black text-purple-600 font-mono">
                {stats.govs} <span className="text-[10px] text-[var(--text-muted)] font-normal">محافظة</span>
              </div>
            )}
            <span className="text-[9px] text-purple-700 font-medium block truncate">
              تغطية ميدانية متوسعة
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
