import React from 'react';
import { Business, Representative, PayoutRequest } from '../types';
import { calculateRepSettlement } from '../utils/commission';
import { getRepReferralSummary, getRepReferralCode } from '../utils/referral';
import { UserAvatar } from './UserAvatar';
import { PlusCircle } from 'lucide-react';

interface RepDashboardProps {
  rep: Representative;
  businesses: Business[];
  allReps?: Representative[];
  payoutRequests?: PayoutRequest[];
  onAddNewClick: () => void;
  onShowInvoice?: (biz: Business) => void;
  onRequestPayout?: (payout: PayoutRequest) => void;
  onNavigateToProfile?: (tab: 'id_docs' | 'finance' | 'activities' | 'referral') => void;
}

export const RepDashboard: React.FC<RepDashboardProps> = ({
  rep,
  businesses,
  allReps = [],
  payoutRequests = [],
  onAddNewClick,
  onNavigateToProfile,
}) => {
  const myBusinesses = businesses.filter((b) => b.repId === rep.id || b.repName === rep.name);
  const repRate = rep.commissionRate || 42.86;

  // Referral Network calculation
  const referralSummary = getRepReferralSummary(rep, allReps, businesses);
  const referralCode = getRepReferralCode(rep);

  // Financial Settlement calculation
  const settlement = calculateRepSettlement(
    rep.id,
    myBusinesses,
    repRate,
    payoutRequests,
    referralSummary.totalNetEarnings
  );

  return (
    <div className="space-y-4 animate-fade-in max-w-7xl mx-auto pb-6">
      {/* ── HEADER WITH COMPACT SUMMARY WIDGETS ─────────────────────── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-colors duration-300">
        
        {/* Right side (RTL): Rep Profile Card */}
        <div className="flex items-center gap-3.5 shrink-0">
          <UserAvatar
            avatar={rep.avatar}
            name={rep.name}
            role={rep.role}
            avatarStatus={rep.avatarStatus}
            size="lg"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                {rep.name}
              </h2>
              <span className="text-[10px] bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-500/30">
                مندوب {rep.governorate}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              {rep.roleTitle || 'مندوب مبيعات وتوثيق ميداني'}
            </p>
          </div>
        </div>

        {/* Left side (RTL): Simplified Compact Widgets (Balance & Referral) */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-start md:justify-end">
          {/* 1. Compact Balance Chip -> Directly to 'finance' in RepProfile */}
          <button
            type="button"
            onClick={() => onNavigateToProfile?.('finance')}
            className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border transition-all cursor-pointer shadow-xs active:scale-95 ${
              settlement.isDebtToPlatform
                ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/35 hover:border-amber-500/60 text-amber-900 dark:text-amber-200'
                : settlement.withdrawableBalance > 0
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/35 hover:border-emerald-500/60 text-emerald-900 dark:text-emerald-200'
                : 'bg-[var(--input-bg)] hover:bg-[var(--border-color)]/30 border-[var(--border-color)] hover:border-amber-500/40 text-[var(--text-primary)]'
            }`}
            title="اضغط للانتقال المباشر إلى كشف الحساب والعمولات في صفحة ملفي"
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                settlement.isDebtToPlatform
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : settlement.withdrawableBalance > 0
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
              }`}
            >
              {settlement.isDebtToPlatform ? '⚠️' : '💳'}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[var(--text-muted)] font-bold">رصيد الحساب:</span>
                <span
                  className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                    settlement.isDebtToPlatform
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      : settlement.withdrawableBalance > 0
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-500/10 text-[var(--text-muted)]'
                  }`}
                >
                  {settlement.isDebtToPlatform
                    ? 'مستحق للمنصة'
                    : settlement.withdrawableBalance > 0
                    ? 'أرباح متاحة'
                    : 'مصفى'}
                </span>
              </div>
              <div className="font-mono font-black text-sm leading-tight mt-0.5 flex items-baseline gap-1">
                <span
                  className={
                    settlement.isDebtToPlatform
                      ? 'text-amber-600 dark:text-amber-400'
                      : settlement.withdrawableBalance > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-[var(--text-primary)]'
                  }
                >
                  {settlement.isDebtToPlatform
                    ? `-${Math.abs(settlement.debtToPlatformAmount).toLocaleString()}`
                    : `+${Math.abs(settlement.withdrawableBalance).toLocaleString()}`}
                </span>
                <span className="text-[10px] font-sans font-bold text-[var(--text-muted)]">ج.م</span>
                <span className="text-[10px] text-amber-500 group-hover:translate-x-[-2px] transition-transform font-bold mr-1">
                  ←
                </span>
              </div>
            </div>
          </button>

          {/* 2. Compact Referral Chip -> Directly to 'referral' in RepProfile */}
          <button
            type="button"
            onClick={() => onNavigateToProfile?.('referral')}
            className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border transition-all cursor-pointer shadow-xs active:scale-95 ${
              referralSummary.isUnlocked
                ? 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/35 hover:border-purple-500/60 text-purple-900 dark:text-purple-200'
                : 'bg-[var(--input-bg)] hover:bg-[var(--border-color)]/30 border-[var(--border-color)] hover:border-amber-500/40 text-[var(--text-primary)]'
            }`}
            title="اضغط للانتقال المباشر إلى نافذة وبرنامج الإحالة في صفحة ملفي"
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                referralSummary.isUnlocked
                  ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300'
                  : 'bg-slate-500/15 text-slate-500'
              }`}
            >
              {referralSummary.isUnlocked ? '✨' : '🔒'}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[var(--text-muted)] font-bold">برنامج الإحالة:</span>
                <span
                  className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                    referralSummary.isUnlocked
                      ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {referralSummary.isUnlocked ? 'مفعل' : `${myBusinesses.length}/25 نشاط`}
                </span>
              </div>
              <div className="font-mono font-black text-xs leading-tight mt-0.5 text-[var(--text-primary)] flex items-center gap-1">
                <span>
                  {referralSummary.isUnlocked
                    ? referralCode
                    : `متبقي ${Math.max(0, 25 - myBusinesses.length)} نشاط`}
                </span>
                <span className="text-[10px] text-purple-500 group-hover:translate-x-[-2px] transition-transform font-bold mr-1">
                  ←
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 🌟 ONBOARDING DIRECTIVE FOR NEW REPRESENTATIVE (0 REGISTERED BUSINESSES) */}
      {myBusinesses.length === 0 && (
        <div className="bg-gradient-to-br from-amber-500/15 via-[var(--bg-card)] to-yellow-500/10 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg text-right animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xl shrink-0">
                🚀
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)]">
                  مرحباً بك يا {rep.name} في منظومة دليلك!
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-bold">
                  خطوتك الأولى: توثيق أول نشاط تجاري في منطقتك لتفعيل حسابك واستحقاق عمولتك
                </p>
              </div>
            </div>

            <span className="text-xs font-black px-3.5 py-1.5 rounded-full badge-warning shrink-0">
              ⚡ بانتظار أول نشاط
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-[var(--bg-card)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-black text-[var(--text-primary)]">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-mono font-bold">
                  1
                </span>
                <span>الزيارة والاتفاق الميداني</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                توجّه للمحل التجاري في منطقتك واشرح لصاحبه مزايا التوثيق الرقمي وإدراجه في الخرائط والدليل.
              </p>
            </div>

            <div className="bg-[var(--bg-card)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-black text-[var(--text-primary)]">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-mono font-bold">
                  2
                </span>
                <span>تسجيل وتصوير النشاط</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                اضغط على زر التسجيل، التقط صور واجهة المحل، ثبّت موقعه بدقة عبر الـ GPS، واختر الباقة المناسبة.
              </p>
            </div>

            <div className="bg-[var(--bg-card)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-black text-[var(--text-primary)]">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-mono font-bold">
                  3
                </span>
                <span>المراجعة وكسب العمولة</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                يصل النشاط فوراً للإدارة للاعتماد والتوثيق، وفور السداد تنزل عمولتك المعتمدة بحسابك لسحبها.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-amber-800 dark:text-amber-300 font-bold">
              💡 نصيحة للبداية: الأنشطة الرائجة والمحلات الحيوية تضمن لك سرعة الإنجاز وتحقيق أول عمولة اليوم.
            </p>
            <button
              type="button"
              onClick={onAddNewClick}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-xs px-6 py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>ابدأ تسجيل أول نشاط تجاري الآن</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
