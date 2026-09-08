import React from 'react';
import { RepReferralSummary } from '../../utils/referral';
import {
  Users,
  Unlock,
  Lock,
} from 'lucide-react';

export interface DossierReferralsTabProps {
  referralSummary: RepReferralSummary;
  onToggleReferralUnlock?: () => void;
  canManageReferral: boolean;
}

export const DossierReferralsTab: React.FC<DossierReferralsTabProps> = ({
  referralSummary,
  onToggleReferralUnlock,
  canManageReferral,
}) => {
  return (
    <div className="space-y-4">
      {/* Referral Overview Card */}
      <div className="bg-[var(--input-bg)] p-4 sm:p-5 rounded-3xl border border-[var(--border-color)] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <div>
            <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <span>كود الإحالة وشبكة المناديب المسجلين عن طريقه</span>
            </h4>
            <p className="text-[11px] text-[var(--text-muted)] font-bold mt-0.5">
              عمولات إضافية تتراوح بين 3% و 7% من إيرادات المناديب المدعوين + 250 ج عند تحقيق كل مندوب 10 أنشطة
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[var(--bg-card)] px-3 py-1.5 rounded-xl border border-amber-500/40 text-xs font-mono font-black text-amber-600 dark:text-amber-400">
              كود: {referralSummary.referralCode}
            </div>

            {canManageReferral && onToggleReferralUnlock && (
              <button
                type="button"
                onClick={onToggleReferralUnlock}
                className={`text-xs font-black px-3 py-1.5 rounded-xl border flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                  referralSummary.isUnlocked
                    ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                    : 'bg-amber-500 text-slate-950 font-black'
                }`}
              >
                {referralSummary.isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{referralSummary.isUnlocked ? 'مفتوح (اضغط للقفل)' : 'تجاوز وتفعيل الكود'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Referral KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center text-xs">
          <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] space-y-0.5">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block">إجمالي المدعوين</span>
            <span className="font-black text-base text-[var(--text-primary)] font-mono block">
              {referralSummary.totalInvitedCount} <span className="text-[10px]">عضو</span>
            </span>
          </div>

          <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] space-y-0.5">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block">مؤهلون للهدية (10+ موثقة)</span>
            <span className="font-black text-base text-emerald-600 font-mono block">
              {referralSummary.qualifiedRepsCount} <span className="text-[10px]">مؤهل</span>
            </span>
          </div>

          <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] space-y-0.5">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block">هدايا الدعوة (+250 ج)</span>
            <span className="font-black text-base text-emerald-600 font-mono block">
              {referralSummary.totalGiftsEarned.toLocaleString()} <span className="text-[10px]">ج</span>
            </span>
          </div>

          <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] space-y-0.5">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block">عمولات الأنشطة (3%-7%)</span>
            <span className="font-black text-base text-amber-600 font-mono block">
              {referralSummary.totalReferralCommission.toLocaleString()} <span className="text-[10px]">ج</span>
            </span>
          </div>

          <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/30 space-y-0.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-black block">إجمالي أرباح الإحالة</span>
            <span className="font-black text-base text-emerald-600 font-mono block">
              {referralSummary.totalNetEarnings.toLocaleString()} <span className="text-[10px]">ج</span>
            </span>
          </div>
        </div>
      </div>

      {/* Invited Representatives Table */}
      <div className="space-y-2.5">
        <h4 className="font-black text-xs text-[var(--text-primary)]">قائمة المناديب المحالة عن طريقه:</h4>
        {referralSummary.invitedRepsDetails.length === 0 ? (
          <p className="text-center text-xs text-[var(--text-muted)] font-bold py-6 bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)]">
            لم يقم هذا المندوب بدعوة أي مناديب آخرين حتى الآن
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
            <table className="w-full text-xs text-right border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-[var(--input-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold">
                  <th className="p-2.5">المندوب المدعو</th>
                  <th className="p-2.5">المحافظة والهاتف</th>
                  <th className="p-2.5 text-center">الأنشطة الميدانية والتوثيق</th>
                  <th className="p-2.5 text-center">مكافأة الدعوة (250 ج)</th>
                  <th className="p-2.5">إيراد مبيعاته</th>
                  <th className="p-2.5">العمولة المكتسبة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {referralSummary.invitedRepsDetails.map((inv) => (
                  <tr key={inv.rep.id} className="hover:bg-amber-500/5">
                    <td className="p-2.5 font-bold text-[var(--text-primary)]">{inv.rep.name}</td>
                    <td className="p-2.5 text-[11px] text-[var(--text-muted)]">{inv.rep.governorate} • {inv.rep.phone}</td>
                    <td className="p-2.5 font-mono text-center">
                      <span className="font-bold">{inv.bizCount} مسجل</span>{' '}
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">({inv.verifiedBizCount || 0} موثق بجوجل)</span>
                    </td>
                    <td className="p-2.5 text-center">
                      {inv.isMission1Complete ? (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          تم الصرف (+250 ج)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          متبقي {inv.remainingForMission1} موثق
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-emerald-600 font-bold">{inv.totalRevenue.toLocaleString()} ج.م</td>
                    <td className="p-2.5">
                      <span className="text-amber-600 font-bold ml-1">({inv.currentRate}%)</span>
                      <span className="font-black text-emerald-600 font-mono">+{inv.commissionEarned.toLocaleString()} ج</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
