import React from 'react';
import {
  Users,
  Building2,
  Target,
  Wallet,
  Plus,
  ChevronLeft,
  Map as MapIcon,
  MessageSquare,
  SlidersHorizontal,
  LogOut,
  Download,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { User } from '../../../types';
import { EGYPT_GOVERNORATES } from '../../../data/mockData';
import { triggerHaptic } from '../../../utils/haptics';
import { SupervisorMetrics, SupervisorSubView } from '../types';

export interface SupervisorHubViewProps {
  currentUser: User;
  selectedGov: string;
  setSelectedGov: (gov: string) => void;
  metrics: SupervisorMetrics;
  scopedLeadsCount: number;
  onSwitchToAdvancedAdmin?: () => void;
  onLogout: () => void;
  onAddNewClick: () => void;
  onNavigate: (view: SupervisorSubView) => void;
  onAddRepClick: () => void;
  onExportData: () => void;
  onFilterPendingBusinesses: () => void;
}

export const SupervisorHubView: React.FC<SupervisorHubViewProps> = ({
  currentUser,
  selectedGov,
  setSelectedGov,
  metrics,
  scopedLeadsCount,
  onSwitchToAdvancedAdmin,
  onLogout,
  onAddNewClick,
  onNavigate,
  onAddRepClick,
  onExportData,
  onFilterPendingBusinesses,
}) => {
  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <header className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Identity & Scoped Governorate */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={
                currentUser.repData?.avatar ||
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80'
              }
              alt={currentUser.name}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-amber-500 shadow-sm"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[var(--bg-card)] flex items-center justify-center text-white text-[8px]">
              🛡️
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-[var(--text-primary)] truncate">
                أهلاً، {currentUser.name.split(' ')[0]} 👋
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[11px] font-black text-amber-700 bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/20">
                مشرف إقليمي
              </span>
              {/* Governorate Selector Dropdown */}
              <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--text-muted)]">
                <span>المحافظة:</span>
                <select
                  value={selectedGov}
                  onChange={(e) => {
                    setSelectedGov(e.target.value);
                    triggerHaptic('selection');
                  }}
                  className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-2 py-0.5 text-[11px] font-black text-[var(--text-primary)] focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {EGYPT_GOVERNORATES.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Utility buttons: Extended Admin toggle & Logout */}
        <div className="flex items-center justify-end gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-[var(--border-color)]">
          {onSwitchToAdvancedAdmin && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                onSwitchToAdvancedAdmin();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[var(--input-bg)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-all border border-[var(--border-color)] cursor-pointer text-xs font-bold shadow-xs active:scale-95"
              title="الانتقال إلى لوحة العمليات الكلاسيكية الموسعة (9 تبويبات)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
              <span>لوحة العمليات الموسعة</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="p-2 sm:p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-colors cursor-pointer"
            title="تسجيل الخروج"
            aria-label="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Urgent Action Ribbon (Conditional) */}
      {(metrics.pendingBusinesses > 0 || metrics.totalCashInRepsHands > 0) && (
        <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border-2 border-amber-500/40 rounded-3xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-[var(--text-primary)]">
                مهام ميدانية عاجلة تستوجب تدقيقك في {selectedGov}
              </h3>
              <div className="flex items-center gap-3 text-[11px] font-bold text-[var(--text-muted)] mt-0.5 flex-wrap">
                {metrics.pendingBusinesses > 0 && (
                  <span className="text-amber-700">
                    ⚡ {metrics.pendingBusinesses} منشأة بانتظار الفحص والاعتماد
                  </span>
                )}
                {metrics.totalCashInRepsHands > 0 && (
                  <span className="text-blue-700">
                    💰 {metrics.totalCashInRepsHands.toLocaleString()} ج.م عهدة كاش بيد المناديب
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {metrics.pendingBusinesses > 0 && (
              <button
                type="button"
                onClick={onFilterPendingBusinesses}
                className="flex-1 sm:flex-none text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer text-center"
              >
                تدقيق الأنشطة
              </button>
            )}
            {metrics.totalCashInRepsHands > 0 && (
              <button
                type="button"
                onClick={() => onNavigate('finance')}
                className="flex-1 sm:flex-none text-xs font-black bg-[var(--input-bg)] border border-blue-500/30 text-blue-700 hover:bg-blue-500/10 px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer text-center"
              >
                كشف العهد
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hero Primary Action: تسجيل نشاط تجاري جديد */}
      <button
        type="button"
        onClick={onAddNewClick}
        className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm sm:text-base py-4 px-6 rounded-3xl shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between border border-amber-400/40 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-950/10 flex items-center justify-center text-slate-950">
            <Plus className="w-6 h-6 stroke-[3]" />
          </div>
          <div className="text-right">
            <span className="block text-sm sm:text-base font-black">
              تسجيل نشاط تجاري جديد بالمحافظة
            </span>
            <span className="block text-[11px] font-bold text-slate-900/80">
              توثيق فوري مباشر وتحديد الإحداثيات والبيانات الميدانية
            </span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-950/10 flex items-center justify-center text-slate-950 group-hover:-translate-x-1 transition-transform">
          <ChevronLeft className="w-5 h-5" />
        </div>
      </button>

      {/* 4 Interactive Stat Cards (Drill-Down) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Box 1: مناديب المحافظة */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            onNavigate('reps');
          }}
          className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border-color)] shadow-xs text-right transition-all hover:border-amber-500/50 hover:shadow-md active:scale-[0.98] cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20 transition-colors">
                <Users className="w-5 h-5 stroke-[2.5]" />
              </span>
              <span className="text-[10px] font-black text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {metrics.activeReps} نشط
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-mono">
                {metrics.totalReps}
              </span>
              <span className="text-xs font-bold text-[var(--text-muted)]">مندوب مسجل</span>
            </div>
          </div>
          <div className="pt-2 mt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-bold">
            <span>إدارة فريق المناديب</span>
            <ChevronLeft className="w-3.5 h-3.5 text-amber-600 group-hover:-translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Box 2: مستهدف المحافظة والإنجاز */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            onNavigate('target');
          }}
          className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border-color)] shadow-xs text-right transition-all hover:border-emerald-500/50 hover:shadow-md active:scale-[0.98] cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20 transition-colors">
                <Target className="w-5 h-5 stroke-[2.5]" />
              </span>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
                {metrics.targetPercent}%
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
                {metrics.totalBusinesses}
              </span>
              <span className="text-xs font-bold text-[var(--text-muted)]">
                / {metrics.effectiveGovTarget} تارجت
              </span>
            </div>
            <div className="w-full bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.targetPercent}%` }}
              />
            </div>
          </div>
          <div className="pt-2 mt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-bold">
            <span>تنافسية وتحليل الإنجاز</span>
            <ChevronLeft className="w-3.5 h-3.5 text-emerald-600 group-hover:-translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Box 3: منشآت المحافظة والتدقيق */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            onNavigate('businesses');
          }}
          className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border-color)] shadow-xs text-right transition-all hover:border-blue-500/50 hover:shadow-md active:scale-[0.98] cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 group-hover:bg-blue-500/20 transition-colors">
                <Building2 className="w-5 h-5 stroke-[2.5]" />
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  metrics.pendingBusinesses > 0
                    ? 'text-amber-700 bg-amber-500/15'
                    : 'text-blue-700 bg-blue-500/10'
                }`}
              >
                {metrics.pendingBusinesses > 0
                  ? `${metrics.pendingBusinesses} للمراجعة`
                  : `${metrics.verifiedBusinesses} معتمد`}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-mono">
                {metrics.totalBusinesses}
              </span>
              <span className="text-xs font-bold text-[var(--text-muted)]">منشأة مسجلة</span>
            </div>
          </div>
          <div className="pt-2 mt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-bold">
            <span>الفحص والاعتماد السريع</span>
            <ChevronLeft className="w-3.5 h-3.5 text-blue-600 group-hover:-translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Box 4: العهد النقدية والتحصيلات */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            onNavigate('finance');
          }}
          className="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--border-color)] shadow-xs text-right transition-all hover:border-purple-500/50 hover:shadow-md active:scale-[0.98] cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 group-hover:bg-purple-500/20 transition-colors">
                <Wallet className="w-5 h-5 stroke-[2.5]" />
              </span>
              <span className="text-[10px] font-black text-purple-700 bg-purple-500/10 px-2 py-0.5 rounded-full">
                {metrics.pendingPayoutsCount > 0
                  ? `${metrics.pendingPayoutsCount} طلب سحب`
                  : 'التوريدات'}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-purple-600 font-mono">
                {metrics.totalCashInRepsHands.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-[var(--text-muted)]">ج.م عهدة</span>
            </div>
          </div>
          <div className="pt-2 mt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-bold">
            <span>كشف التحصيلات والعهد</span>
            <ChevronLeft className="w-3.5 h-3.5 text-purple-600 group-hover:-translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Direct Quick Action Buttons (4 أزرار مباشرة) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-black text-[var(--text-muted)] px-1">
          إجراءات سريعة مباشرة بالمحافظة
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Quick Action 1: إضافة مندوب جديد */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onAddRepClick();
            }}
            className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all active:scale-95 cursor-pointer text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserPlus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-black text-[var(--text-primary)]">
              + إضافة مندوب جديد
            </span>
          </button>

          {/* Quick Action 2: خريطة المحافظة */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onNavigate('map');
            }}
            className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all active:scale-95 cursor-pointer text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapIcon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-black text-[var(--text-primary)]">
              خريطة التغطية
            </span>
          </button>

          {/* Quick Action 3: عملاء CRM */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              onNavigate('leads');
            }}
            className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all active:scale-95 cursor-pointer text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-black text-[var(--text-primary)]">
              فرص وعملاء CRM ({scopedLeadsCount})
            </span>
          </button>

          {/* Quick Action 4: تصدير كشف المحافظة */}
          <button
            type="button"
            onClick={onExportData}
            className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl py-3.5 px-2 flex flex-col items-center gap-1.5 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all active:scale-95 cursor-pointer text-center group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Download className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs font-black text-[var(--text-primary)]">
              تصدير كشف المحافظة
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
