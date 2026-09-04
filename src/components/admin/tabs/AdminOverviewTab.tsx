import React from 'react';
import { Business, Representative } from '../../../types';
import { UserAvatar } from '../../UserAvatar';
import {
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Users,
  UserCheck,
  ClipboardList,
  Clock,
  Phone,
  Sparkles,
  Calculator,
  Calendar,
  Crown,
  AlertTriangle,
  Compass,
  PieChart,
  MapPin,
  Award,
  ArrowLeft,
  Eye,
  FileText,
} from 'lucide-react';

interface AdminOverviewTabProps {
  totalRevenue: number;
  collectionRate: string;
  totalDebt: number;
  totalContractValue: number;
  verifiedCount: number;
  verificationRate: string;
  realBusinesses: Business[];
  businesses: Business[];
  exemptCount: number;
  mergedAdminReps: Representative[];
  governorateStats: Array<{ name: string; count: number; revenue: number; verified: number; exempt: number }>;
  leadStats: {
    total: number;
    pendingFollowup: number;
    contacted: number;
    converted: number;
    highInterest: number;
    conversionRate: number;
  };
  netPlatformRevenue: number;
  totalCashInRepsHands: number;
  totalCommissionsRetainedInCash: number;
  totalApprovedPayouts: number;
  totalEarnedCommissions: number;
  monthlyFinancialStats: Array<{
    monthKey: string;
    monthLabel: string;
    grossRevenue: number;
    repCommissions: number;
    netPlatform: number;
    verifiedCount: number;
    totalBizCount: number;
    disbursedPayouts: number;
    topRepName: string;
    topRepEarnings: number;
    avgRepIncome: number;
  }>;
  notSubmittedCount: number;
  overdueReviewCount: number;
  verifiedWithDebtCount: number;
  verifiedWithDebtTotal: number;
  inProgressCount: number;
  packageStats: Array<{
    title: string;
    count: number;
    revenue: number;
    percentage: string;
  }>;
  repPerformanceStats: Array<{
    rep: Representative;
    totalBiz: number;
    verifiedBiz: number;
    collectedRevenue: number;
    target: number;
    achievement: number;
    isOnline: boolean;
    lastActiveText: string;
    cashInHand: number;
    earnedCommission: number;
    debtToPlatform: number;
    withdrawableBalance: number;
    isDebt: boolean;
    invitedCount: number;
  }>;
  onNavigateTab: (tab: 'overview' | 'businesses' | 'reps' | 'gateways' | 'payouts' | 'leads') => void;
  onSetVerificationFilter: (filter: string) => void;
  onSelectDossierRep: (rep: Representative) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  totalRevenue,
  collectionRate,
  totalDebt,
  totalContractValue,
  verifiedCount,
  verificationRate,
  realBusinesses,
  businesses,
  exemptCount,
  mergedAdminReps,
  governorateStats,
  leadStats,
  netPlatformRevenue,
  totalCashInRepsHands,
  totalCommissionsRetainedInCash,
  totalApprovedPayouts,
  totalEarnedCommissions,
  monthlyFinancialStats,
  notSubmittedCount,
  overdueReviewCount,
  verifiedWithDebtCount,
  verifiedWithDebtTotal,
  inProgressCount,
  packageStats,
  repPerformanceStats,
  onNavigateTab,
  onSetVerificationFilter,
  onSelectDossierRep,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Revenue & Collection Rate */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span>إجمالي التحصيل المالي</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {totalRevenue.toLocaleString()} <span className="text-xs text-[var(--text-secondary)]">ج.م</span>
          </p>
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
            <span>نسبة التحصيل:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-sans">{collectionRate}%</span>
          </div>
        </div>

        {/* 2. Outstanding Debt */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span>المستحقات المعلقة (المتبقي)</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-500">
            {totalDebt.toLocaleString()} <span className="text-xs text-[var(--text-secondary)]">ج.م</span>
          </p>
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
            <span>إجمالي قيمة العقود:</span>
            <span className="font-bold font-sans">{totalContractValue.toLocaleString()} ج.م</span>
          </div>
        </div>

        {/* 3. Verified Businesses KPI */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span>مؤشر التوثيق المعتمد</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {verifiedCount} <span className="text-xs text-[var(--text-secondary)]">نشاط ({verificationRate}%)</span>
          </p>
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
            <span>إجمالي الأنشطة:</span>
            <span className="font-bold font-sans">
              {realBusinesses.length} نشاط {exemptCount > 0 && <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">({exemptCount} رائج معفى)</span>}
            </span>
          </div>
        </div>

        {/* 4. Active Representatives & Team */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
            <span>فريق العمل والمناديب</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
            {mergedAdminReps.length} <span className="text-xs text-[var(--text-secondary)]">عضو</span>
          </p>
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
            <span>المحافظات المغطاة:</span>
            <span className="font-bold font-sans text-amber-600 dark:text-amber-400">{governorateStats.length} محافظة</span>
          </div>
        </div>
      </div>

      {/* 🌟 5. Field Leads & Reviews Performance Hub */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-[var(--bg-card)] to-teal-500/10 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
                <span>مؤشرات العملاء المحتملين والمراجعات الميدانية (CRM Leads)</span>
                <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                  {leadStats.total} عميل مهتم
                </span>
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-bold">
                متابعة زيارات المناديب الميدانية للأنشطة غير المشتركة بعد وتحويلها إلى اشتراكات رسمية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('leads')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>إدارة ومتابعة المراجعات</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-2xl space-y-1">
            <div className="text-[11px] font-bold text-[var(--text-muted)] flex items-center justify-between">
              <span>إجمالي الزيارات المسجلة</span>
              <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-lg sm:text-xl font-black text-[var(--text-primary)] font-mono">
              {leadStats.total}
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-2xl space-y-1">
            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
              <span>بانتظار المتابعة</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {leadStats.pendingFollowup}
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-2xl space-y-1">
            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
              <span>تم التواصل معهم</span>
              <Phone className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {leadStats.contacted}
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3 rounded-2xl space-y-1">
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>تحولوا لمشتركين فعليين</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1.5">
              <span>{leadStats.converted}</span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-md">
                ({leadStats.conversionRate}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 🏛️ MASTER FINANCIAL ACCOUNTING & REVENUE BREAKDOWN ── */}
      <div className="bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-surface)] to-[var(--bg-card)] border-2 border-amber-500/30 rounded-3xl p-5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[var(--text-primary)]">
                النمط الحسابي الشامل للمنظومة والتحصيل المالي والعمولات
              </h3>
              <p className="text-[10.5px] text-[var(--text-muted)] font-medium">
                توزيع الإيرادات المحصلة، عمولات فريق المناديب، وصافي أرباح المنظومة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              صافي المنصة: {netPlatformRevenue.toLocaleString()} ج.م
            </span>
          </div>
        </div>

        {/* 6 Key Accounting Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center text-xs">
          <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block">إجمالي المحصل الشامل</span>
            <span className="font-black text-base text-emerald-600 dark:text-emerald-400 font-mono block">
              {totalRevenue.toLocaleString()} <span className="text-[10px]">ج</span>
            </span>
            <span className="text-[9px] text-[var(--text-muted)]">كافة باقات المنظومة</span>
          </div>

          <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block">كاش محصل بيد المناديب</span>
            <span className="font-black text-base text-blue-600 dark:text-blue-400 font-mono block">
              {totalCashInRepsHands.toLocaleString()} <span className="text-[10px]">ج</span>
            </span>
            <span className="text-[9px] text-[var(--text-muted)]">مقبوضات نقدية ميدانية</span>
          </div>

          <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30 space-y-1">
            <span className="text-[10px] text-amber-800 dark:text-amber-300 font-black block">💵 عمولات استلمت نقداً</span>
            <span className="font-black text-base text-amber-600 dark:text-amber-400 font-mono block">
              {totalCommissionsRetainedInCash.toLocaleString()} <span className="text-[10px]">ج</span>
            </span>
            <span className="text-[9px] text-amber-700/80 dark:text-amber-300/80 font-bold">استقطعها المندوب من الكاش</span>
          </div>

          <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block">عمولات تم صرفها بحوالة</span>
            <span className="font-black text-base text-emerald-600 dark:text-emerald-400 font-mono block">
              {totalApprovedPayouts.toLocaleString()} <span className="text-[10px]">ج</span>
            </span>
            <span className="text-[9px] text-[var(--text-muted)]">إلكتروني / إنستاباي / فودافون</span>
          </div>

          <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block">إجمالي عمولات المناديب</span>
            <span className="font-black text-base text-indigo-600 dark:text-indigo-400 font-mono block">
              {totalEarnedCommissions.toLocaleString()} <span className="text-[10px]">ج</span>
            </span>
            <span className="text-[9px] text-[var(--text-muted)]">كافة الاستحقاقات الشاملة</span>
          </div>

          <div className="bg-teal-500/10 p-3 rounded-2xl border border-teal-500/30 space-y-1">
            <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold block">صافي أرباح المنظومة</span>
            <span className="font-black text-base text-teal-600 dark:text-teal-400 font-mono block">
              {netPlatformRevenue.toLocaleString()} <span className="text-[10px]">ج</span>
            </span>
            <span className="text-[9px] text-teal-600/80 dark:text-teal-300/80 font-bold">بعد استقطاع كافة العمولات</span>
          </div>
        </div>
      </div>

      {/* ── 📅 MONTHLY INCOME & REVENUE BREAKDOWN ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-black text-sm text-[var(--text-primary)]">
                سجل الإيرادات والدخل الشهري لفريق المناديب والمنظومة
              </h3>
              <p className="text-[10.5px] text-[var(--text-muted)]">
                تحليل الأداء المالي، متوسط دخل المندوب، وأرباح المنظومة عبر الشهور
              </p>
            </div>
          </div>
          <span className="text-xs text-[var(--text-muted)] font-bold">
            السنة المالية الحالية
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
          <table className="w-full text-xs text-right border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[var(--input-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold">
                <th className="p-3">الشهر / الفترة</th>
                <th className="p-3 text-center">الأنشطة الموثقة</th>
                <th className="p-3 text-center">إجمالي التحصيل</th>
                <th className="p-3 text-center">عمولات المناديب</th>
                <th className="p-3 text-center">متوسط دخل المندوب</th>
                <th className="p-3 text-center">صافي المنصة</th>
                <th className="p-3 text-center">المصروف فعلياً</th>
                <th className="p-3 text-center">نجم الشهر 🌟</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {monthlyFinancialStats.map((m) => (
                <tr key={m.monthKey} className="hover:bg-amber-500/5 transition-colors">
                  <td className="p-3 font-bold text-[var(--text-primary)]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>{m.monthLabel}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center font-mono font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{m.verifiedCount}</span>
                    <span className="text-[10px] text-[var(--text-muted)]"> / {m.totalBizCount}</span>
                  </td>
                  <td className="p-3 text-center font-mono font-black text-[var(--text-primary)]">
                    {m.grossRevenue.toLocaleString()} ج.م
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                    {m.repCommissions.toLocaleString()} ج.م
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                    {m.avgRepIncome.toLocaleString()} ج.م
                  </td>
                  <td className="p-3 text-center font-mono font-black text-teal-600 dark:text-teal-400">
                    {m.netPlatform.toLocaleString()} ج.م
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {m.disbursedPayouts.toLocaleString()} ج.م
                  </td>
                  <td className="p-3 text-center">
                    {m.topRepEarnings > 0 ? (
                      <div className="inline-flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30 text-[10.5px]">
                        <Crown className="w-3 h-3 text-amber-500" />
                        <span className="font-bold text-amber-800 dark:text-amber-300">{m.topRepName}</span>
                        <span className="font-mono font-bold text-amber-600">({m.topRepEarnings} ج)</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[var(--text-muted)]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SMART OPERATIONAL NOTICES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Notice 1: Unsubmitted Activities */}
        {notSubmittedCount > 0 ? (
          <div className="alert-card-danger p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="alert-icon-box w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="alert-title font-black text-sm">
                  يوجد ({notSubmittedCount}) أنشطة مسجلة لم تُرفع لخرائط جوجل بعد
                </p>
                <p className="alert-desc text-[11px] font-bold mt-0.5">
                  تتطلب توليد بيانات ورفعها للتوثيق الميداني.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onNavigateTab('businesses');
                onSetVerificationFilter('not_submitted');
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] px-3 py-1.5 rounded-xl shrink-0 cursor-pointer shadow-xs transition-transform active:scale-95"
            >
              عرض وفحص
            </button>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="font-bold">كافة الأنشطة المسجلة تم رفعها للتوثيق ولا توجد أنشطة متأخرة.</span>
          </div>
        )}

        {/* Notice 2: Overdue Google Review Notice (> 48h) */}
        {overdueReviewCount > 0 ? (
          <div className="alert-card-warning p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="alert-icon-box w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="alert-title font-black text-sm">
                  تنبيه مراجعة: ({overdueReviewCount}) أنشطة تجاوزت مدة مراجعة جوجل المتوقعة
                </p>
                <p className="alert-desc text-[11px] font-bold mt-0.5">
                  أُرسلت للتوثيق منذ أكثر من 48 ساعة دون اعتماد؛ يُنصح بمراجعتها وتدقيق الـ Place ID.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onNavigateTab('businesses');
                onSetVerificationFilter('overdue');
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-xl shrink-0 cursor-pointer shadow-xs transition-transform active:scale-95"
            >
              متابعة التوثيق
            </button>
          </div>
        ) : (
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-[var(--text-secondary)]">
            <Clock className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="font-bold">مراجعات جوجل تسير ضمن النطاق الزمني الطبيعي.</span>
          </div>
        )}

        {/* Notice 3: Verified Businesses with Remaining Unpaid Debt */}
        {verifiedWithDebtCount > 0 && (
          <div className="md:col-span-2 alert-card-warning border-2 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="alert-icon-box w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="alert-title font-black text-sm">
                  تنبيه مالي مهم: ({verifiedWithDebtCount}) أنشطة موثقة على الخريطة ولها متبقي سداد!
                </p>
                <p className="alert-desc text-[11px] font-bold mt-0.5">
                  تم وضع ونشر خرائط Google لهذه الأنشطة بنجاح، وما زال عليها مبالغ معلقة بإجمالي <strong className="font-mono font-black">{verifiedWithDebtTotal.toLocaleString()} ج.م</strong> بانتظار استكمال التحصيل.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onNavigateTab('businesses');
                onSetVerificationFilter('verified_debt');
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] px-3.5 py-1.5 rounded-xl shrink-0 cursor-pointer shadow-xs transition-transform active:scale-95 flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>عرض الأنشطة الموثقة ذات المتبقي</span>
            </button>
          </div>
        )}
      </div>

      {/* Detailed Statistics Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Verification Pipeline Status Breakdown */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 sm:p-5 rounded-3xl space-y-4 shadow-xs">
          <h3 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-2.5">
            <Compass className="w-4 h-4 text-amber-500" />
            <span>مراحل خط التوثيق الميداني</span>
          </h3>

          <div className="space-y-3 text-xs">
            {/* Verified */}
            <div className="space-y-1">
              <div className="flex justify-between font-extrabold">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>موثقة ومبثوثة رسمياً</span>
                </span>
                <span className="font-mono font-black">{verifiedCount} نشاط ({verificationRate}%)</span>
              </div>
              <div className="w-full bg-[var(--input-bg)] h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${verificationRate}%` }} />
              </div>
            </div>

            {/* In Progress */}
            <div className="space-y-1">
              <div className="flex justify-between font-extrabold">
                <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>أُرسلت وقيد مراجعة جوجل</span>
                </span>
                <span className="font-mono font-black">{inProgressCount} نشاط</span>
              </div>
              <div className="w-full bg-[var(--input-bg)] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: businesses.length > 0 ? `${(inProgressCount / businesses.length) * 100}%` : '0%' }}
                />
              </div>
            </div>

            {/* Not Submitted */}
            <div className="space-y-1">
              <div className="flex justify-between font-extrabold">
                <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>لم تُرفع للتوثيق بعد</span>
                </span>
                <span className="font-mono font-black">{notSubmittedCount} نشاط</span>
              </div>
              <div className="w-full bg-[var(--input-bg)] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all"
                  style={{ width: businesses.length > 0 ? `${(notSubmittedCount / businesses.length) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Package Distribution & Revenue Share */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 sm:p-5 rounded-3xl space-y-4 shadow-xs">
          <h3 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-2.5">
            <PieChart className="w-4 h-4 text-amber-500" />
            <span>تحليل باقات الاشتراكات</span>
          </h3>

          <div className="space-y-3 text-xs">
            {packageStats.map((pkg) => (
              <div key={pkg.title} className="space-y-1">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-[var(--text-primary)]">{pkg.title}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{pkg.count} نشاط</span>
                    <span className="text-[var(--text-muted)]">({pkg.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-[var(--input-bg)] h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${pkg.percentage}%` }} />
                </div>
                <div className="text-[10px] text-[var(--text-muted)] text-left font-mono">
                  إجمالي الإيراد: {pkg.revenue.toLocaleString()} ج.م
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Geographical Distribution */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 sm:p-5 rounded-3xl space-y-4 shadow-xs">
          <h3 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border-color)] pb-2.5">
            <MapPin className="w-4 h-4 text-amber-500" />
            <span>التوزيع الجغرافي للأنشطة</span>
          </h3>

          <div className="space-y-2.5 text-xs max-h-60 overflow-y-auto pr-1">
            {governorateStats.map((gov) => {
              const pct = businesses.length > 0 ? ((gov.count / businesses.length) * 100).toFixed(0) : 0;
              return (
                <div key={gov.name} className="space-y-1 bg-[var(--bg-surface)] p-2 rounded-xl border border-[var(--border-color)]">
                  <div className="flex justify-between font-bold">
                    <span className="text-[var(--text-primary)]">{gov.name}</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400">{gov.count} نشاط ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[var(--input-bg)] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                    <span>الموثق: {gov.verified}</span>
                    <span>التحصيل: {gov.revenue.toLocaleString()} ج.م</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Performance & Comprehensive Account Ledger Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>إحصائيات وحركات وحسابات فريق العمل الميداني الشاملة</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              متابعة دقيقة وفورية لحركات الكاش المحصل، العمولات المستحقة، عهدة التوريد، وشبكة الإحالة لكل حساب
            </p>
          </div>

          <span className="text-xs text-amber-600 dark:text-amber-400 font-black bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30">
            إجمالي الأعضاء: {repPerformanceStats.length}
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
          <table className="w-full text-xs text-right border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-[var(--input-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold text-[11px]">
                <th className="p-3">اسم العضو / المندوب</th>
                <th className="p-3">المحافظة والصلاحية</th>
                <th className="p-3 text-center">الأنشطة المسجلة</th>
                <th className="p-3 text-center">إجمالي التحصيل</th>
                <th className="p-3 text-center">كاش باليد</th>
                <th className="p-3 text-center">العمولات المستحقة</th>
                <th className="p-3 text-center">الموقف المالي / العهدة</th>
                <th className="p-3 text-center">شبكة الإحالة</th>
                <th className="p-3 text-center">الحالة والتواجد</th>
                <th className="p-3 text-center">كشف الحساب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {repPerformanceStats.map(({ rep, totalBiz, verifiedBiz, collectedRevenue, cashInHand, earnedCommission, debtToPlatform, withdrawableBalance, isDebt, invitedCount, isOnline, lastActiveText }) => (
                <tr
                  key={rep.id}
                  className="hover:bg-amber-500/5 transition-colors cursor-pointer"
                  onClick={() => onSelectDossierRep(rep)}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar avatar={rep.avatar} name={rep.name} role={rep.role} size="sm" />
                      <div>
                        <p className="font-black text-[var(--text-primary)] hover:text-amber-500 transition-colors">{rep.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">{rep.phone}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-3">
                    <p className="font-bold text-[var(--text-primary)]">{rep.governorate}</p>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">{rep.roleTitle || (rep.role === 'admin' ? 'مدير' : rep.role === 'supervisor' ? 'مشرف' : 'مندوب')}</span>
                  </td>

                  <td className="p-3 text-center font-mono">
                    <span className="font-black text-sm text-[var(--text-primary)]">{totalBiz}</span>
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">{verifiedBiz} موثق</p>
                  </td>

                  <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {collectedRevenue.toLocaleString()} ج
                  </td>

                  <td className="p-3 text-center font-mono font-black text-blue-600 dark:text-blue-400">
                    {cashInHand > 0 ? `${cashInHand.toLocaleString()} ج` : '0 ج'}
                  </td>

                  <td className="p-3 text-center font-mono font-black text-amber-600 dark:text-amber-400">
                    {earnedCommission > 0 ? `${earnedCommission.toLocaleString()} ج` : '0 ج'}
                  </td>

                  <td className="p-3 text-center">
                    {isDebt ? (
                      <span className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-xs inline-block whitespace-nowrap">
                        ⚠️ عهدة: {debtToPlatform.toLocaleString()} ج
                      </span>
                    ) : withdrawableBalance > 0 ? (
                      <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-xs inline-block whitespace-nowrap">
                        🟢 متاح: {withdrawableBalance.toLocaleString()} ج
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--input-bg)] px-2 py-0.5 rounded-lg">
                        مصفى (0 ج)
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    {invitedCount > 0 ? (
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[10px] px-2 py-0.5 rounded-md border border-emerald-500/30">
                        👥 دعا {invitedCount}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--text-muted)]">—</span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    {isOnline ? (
                      <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-1 rounded-full shadow-xs inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{lastActiveText}</span>
                      </span>
                    ) : (
                      <span className="bg-[var(--input-bg)] text-[var(--text-muted)] border border-[var(--border-color)] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 opacity-60" />
                        <span>{lastActiveText}</span>
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onSelectDossierRep(rep)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1 mx-auto cursor-pointer"
                      title="فتح كشف الحساب والأنشطة والذمة المالية للمندوب"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>الملف</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
