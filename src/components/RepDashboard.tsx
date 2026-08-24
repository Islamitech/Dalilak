import React, { useState } from 'react';
import { Business, Representative } from '../types';
import { calculateTotalRepCommission } from '../utils/commission';
import { getRepReferralSummary, getRepReferralCode, INVITATION_GIFT_BONUS } from '../utils/referral';
import { UserAvatar } from './UserAvatar';
import { 
  PlusCircle, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Lightbulb, 
  Users, 
  Share2, 
  Copy, 
  Check, 
  Lock, 
  Sparkles,
  TrendingUp,
  Gift
} from 'lucide-react';

interface RepDashboardProps {
  rep: Representative;
  businesses: Business[];
  allReps?: Representative[];
  onAddNewClick: () => void;
  onShowInvoice?: (biz: Business) => void;
}

export const RepDashboard: React.FC<RepDashboardProps> = ({
  rep,
  businesses,
  allReps = [],
  onAddNewClick,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const myBusinesses = businesses.filter((b) => b.repId === rep.id || b.repName === rep.name);
  const totalCollected = myBusinesses.reduce((acc, b) => acc + (b.amountPaid || 0), 0);

  const repRate = rep.commissionRate || 42.86;
  const totalCommission = calculateTotalRepCommission(myBusinesses, repRate);

  const targetProgress = Math.min(100, Math.round((myBusinesses.length / rep.targetMonth) * 100));

  // Referral Network & Missions calculation
  const referralSummary = getRepReferralSummary(rep, allReps, businesses);
  const referralCode = getRepReferralCode(rep);

  const isMission1Complete = myBusinesses.length >= 10;
  const isMission2Complete = referralSummary.isUnlocked;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const inviteMessage = encodeURIComponent(
    `انضم الآن لفريق عمل منظومة دليلك لتوثيق الأنشطة التجارية في مصر وسجل حسابك باستخدام كود الدعوة المعتمد: ${referralCode}\nرابط المنصة: ${window.location.origin}`
  );
  const whatsappInviteUrl = `https://wa.me/?text=${inviteMessage}`;

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20">

      {/* Field Work Daily Recommendation (Subtle, High-Impact Guidance) */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-xs shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="font-extrabold text-[var(--text-primary)]">
            💡 <span className="text-amber-700 dark:text-amber-300 font-black">توصية العمل الميداني:</span> استهداف زيارة 25 نشاطاً يومياً هو المعدل المثالي للتوسع وتحقيق أعلى دخل شهري.
          </p>
          <p className="text-[11px] text-[var(--text-muted)] font-medium">
            الزيارة الميدانية تعني تقديم الخدمة وشرح مميزات التوثيق لأصحاب المحلات لضمان تدفق مستمر للتسجيلات.
          </p>
        </div>
      </div>

      {/* Rep Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/80 to-slate-900 border border-amber-500/40 p-5 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <UserAvatar avatar={rep.avatar} name={rep.name} role={rep.role} avatarStatus={rep.avatarStatus} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">مرحباً، {rep.name}</h2>
              <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                مندوب {rep.governorate}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">سجل اليوم أنشطة تجارية جديدة وقم بإصدار الفواتير فوراً على الواتساب</p>
          </div>
        </div>

        <button
          onClick={onAddNewClick}
          className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-5 h-5 stroke-[2.5]" />
          <span>تسجيل نشاط جديد في الميدان</span>
        </button>
      </div>

      {/* Target & Commission Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Monthly Target Progress */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-md space-y-2 transition-colors duration-300">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>الهدف الشهري للتسجيل</span>
            <span className="text-amber-500 font-black">{myBusinesses.length} / {rep.targetMonth} نشاط</span>
          </div>

          <div className="w-full bg-[var(--input-bg)] h-2.5 rounded-full overflow-hidden border border-[var(--border-color)]">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${targetProgress}%` }}
            />
          </div>

          <p className="text-[10px] text-[var(--text-muted)] font-bold">متبقي {Math.max(0, rep.targetMonth - myBusinesses.length)} نشاط لتحقيق تارجت الشهر</p>
        </div>

        {/* Total Collected */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-md space-y-1 transition-colors duration-300">
          <span className="text-xs text-[var(--text-muted)] font-bold block">إجمالي تحصيلاتك الميدانية</span>
          <p className="text-xl font-black text-emerald-500">{totalCollected.toLocaleString()} <span className="text-xs text-[var(--text-secondary)]">ج.م</span></p>
          <p className="text-[10px] text-[var(--text-muted)]">مبالغ مستلمة نقداً أو إلكترونياً</p>
        </div>

        {/* Rep Calculated Commission Card */}
        <div className="bg-[var(--bg-card)] border border-amber-500/40 p-4 rounded-3xl shadow-md space-y-1 bg-amber-500/5 transition-colors duration-300">
          <div className="flex items-center justify-between text-xs text-amber-500 font-bold">
            <span>عمولتك المباشرة</span>
            <span className="badge-warning text-[10px] font-black px-2 py-0.5 rounded-full">نسبة {repRate}%</span>
          </div>
          <p className="text-xl font-black text-amber-500">{totalCommission.toLocaleString()} <span className="text-xs text-[var(--text-secondary)]">ج.م</span></p>
          <p className="text-[10px] text-emerald-500 font-bold">مستحقات أرباحك الحالية المعتمدة</p>
        </div>
      </div>

      {/* Inviter Association Banner (If invited by another representative) */}
      {referralSummary.inviterInfo && (
        <div className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/30 rounded-2xl p-3 flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-[var(--text-primary)]">
              أنت مسجل ضمن شبكة دعوة المندوب: <strong className="text-amber-700 dark:text-amber-300">{referralSummary.inviterInfo.rep.name}</strong> (كود: <span className="font-mono font-black">{referralSummary.inviterInfo.code}</span>)
            </span>
          </div>
          <span className="text-[10px] bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md">
            إحالة معتمدة
          </span>
        </div>
      )}

      {/* MILESTONES & REFERRAL SYSTEM CARD */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-md transition-colors duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[var(--text-primary)]">
                مهام التميز وبرنامج الإحالة الميداني
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">
                توسيع شبكة المناديب والحصول على مكافآت وعمولات إضافية (3% - 7%)
              </p>
            </div>
          </div>

          <span className={`text-[11px] font-black px-3 py-1 rounded-full ${
            referralSummary.isUnlocked ? 'badge-success' : 'badge-warning'
          }`}>
            {referralSummary.isUnlocked ? '✨ كود الإحالة مفعل ومفتوح' : '🔒 كود الإحالة قيد الفتح'}
          </span>
        </div>

        {/* Milestone Steps Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Mission 1 */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            isMission1Complete
              ? 'bg-emerald-500/5 border-emerald-500/30'
              : 'bg-[var(--bg-surface)] border-[var(--border-color)]'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
                {isMission1Complete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 text-[10px] flex items-center justify-center font-black">1</span>
                )}
                <span>المهمة الأولى (10 أنشطة مسجلة)</span>
              </span>
              <span className={`font-mono ${isMission1Complete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                {Math.min(10, myBusinesses.length)} / 10
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              تأكيد جدية الحساب وتفعيل مكافأة الدعوة ({INVITATION_GIFT_BONUS} ج.م) للمندوب الذي قام بدعوتك.
            </p>
          </div>

          {/* Mission 2 */}
          <div className={`p-3.5 rounded-2xl border transition-all ${
            isMission2Complete
              ? 'bg-emerald-500/5 border-emerald-500/30'
              : 'bg-[var(--bg-surface)] border-[var(--border-color)]'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
                {isMission2Complete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Lock className="w-4 h-4 text-amber-500" />
                )}
                <span>المهمة الثانية (25 نشاط مسجل)</span>
              </span>
              <span className={`font-mono ${isMission2Complete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                {Math.min(25, myBusinesses.length)} / 25
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              فتح كود الدعوة الخاص بك رسميًا ودعوة مناديب جدد لتلقي عمولة تراكمية تبدأ من 3% وتصل إلى 7%.
            </p>
          </div>
        </div>

        {/* Active Referral Panel (When Unlocked) */}
        {referralSummary.isUnlocked ? (
          <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/5 border border-amber-500/40 p-4 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-extrabold uppercase tracking-wider block">
                  كود الإحالة والدعوة الخاص بك
                </span>
                <span className="font-mono text-2xl font-black text-[var(--text-primary)] tracking-wider">
                  {referralCode}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopyReferral}
                  className="flex-1 sm:flex-none bg-[var(--bg-card)] hover:bg-amber-500/20 text-[var(--text-primary)] font-bold text-xs px-3.5 py-2 rounded-xl border border-[var(--border-color)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="نسخ الكود"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{copiedCode ? 'تم النسخ!' : 'نسخ الكود'}</span>
                </button>

                <a
                  href={whatsappInviteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>دعوة عبر واتساب</span>
                </a>
              </div>
            </div>

            {/* Network Quick Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-500/20 text-center text-xs">
              <div className="bg-[var(--bg-card)]/70 p-2.5 rounded-xl border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] font-bold block">المناديب المنضمين</span>
                <span className="font-black text-sm text-[var(--text-primary)]">{referralSummary.totalInvitedCount} مندوب</span>
              </div>

              <div className="bg-[var(--bg-card)]/70 p-2.5 rounded-xl border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] font-bold block">المناديب المؤهلين (10+)</span>
                <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">{referralSummary.qualifiedRepsCount}</span>
              </div>

              <div className="bg-[var(--bg-card)]/70 p-2.5 rounded-xl border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] font-bold block">أرباح الإحالة المستحقة</span>
                <span className="font-black text-sm text-amber-600 dark:text-amber-400">{referralSummary.totalNetEarnings.toLocaleString()} ج.م</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] text-xs text-[var(--text-secondary)] font-medium flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>متبقي تسجيل <strong>{Math.max(0, 25 - myBusinesses.length)}</strong> نشاط لفتح كود الإحالة وبدء جني عمولات الفريق، أو يمكن اعتماده مباشرة بواسطة إدارة المنظومة.</span>
            </span>
          </div>
        )}

        {/* DETAILED INVITED REPRESENTATIVES LIST & PROGRESS */}
        <div className="pt-2 border-t border-[var(--border-color)] space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-xs text-[var(--text-primary)] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-500" />
              <span>أعضاء شبكة المبيعات المنضمين عبر كودك ({referralSummary.totalInvitedCount})</span>
            </h4>
            <span className="text-[10px] text-[var(--text-muted)] font-bold">
              عمولة مستمرة (3% إلى 7%)
            </span>
          </div>

          {referralSummary.invitedRepsDetails.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {referralSummary.invitedRepsDetails.map(({ rep: invRep, bizCount, totalRevenue, currentRate, commissionEarned, isMission1Complete, remainingForMission1 }) => {
                const isSuspended = invRep.status === 'suspended';

                return (
                  <div
                    key={invRep.id}
                    className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)] space-y-2 hover:border-amber-500/40 transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar avatar={invRep.avatar} name={invRep.name} role={invRep.role} avatarStatus={invRep.avatarStatus} size="sm" />
                        <div>
                          <h5 className="font-bold text-xs text-[var(--text-primary)]">{invRep.name}</h5>
                          <p className="text-[10px] text-[var(--text-muted)]">مندوب {invRep.governorate}</p>
                        </div>
                      </div>

                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        isSuspended ? 'badge-warning' : 'badge-success'
                      }`}>
                        {isSuspended ? '⏳ قيد التفعيل الإداري' : '🟢 نشط ومصرح'}
                      </span>
                    </div>

                    <div className="bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)] grid grid-cols-3 gap-1 text-center text-[10px]">
                      <div>
                        <span className="text-[var(--text-muted)] block">الأنشطة</span>
                        <span className="font-black text-xs text-[var(--text-primary)]">{bizCount}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] block">نسبة العمولة</span>
                        <span className="font-black text-xs text-amber-700 dark:text-amber-300">{currentRate}%</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)] block">أرباحك منه</span>
                        <span className="font-black text-xs text-emerald-600 dark:text-emerald-400">+{commissionEarned} ج.م</span>
                      </div>
                    </div>

                    {/* Mission 1 Progress Badge */}
                    <div className="text-[10px] font-bold flex items-center justify-between pt-1">
                      {isMission1Complete ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>أتم 10 أنشطة (استحقت مكافأة {INVITATION_GIFT_BONUS} ج.م)</span>
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">
                          متبقي <strong className="text-amber-600">{remainingForMission1}</strong> أنشطة لتفعيل مكافأة الدعوة ({INVITATION_GIFT_BONUS} ج.م)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] text-center space-y-1.5 shadow-xs">
              <Users className="w-8 h-8 text-amber-500/50 mx-auto" />
              <p className="text-xs font-bold text-[var(--text-primary)]">لم ينضم أي مندوب عبر كودك حتى الآن</p>
              <p className="text-[11px] text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                شارك كود الدعوة الخاص بك <strong className="text-amber-700 dark:text-amber-300 font-mono">({referralCode})</strong> مع زملائك عند تسجيل حساباتهم، وستظهر بياناتهم ونشاطهم وعمولاتك التراكمية هنا فوراً.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

