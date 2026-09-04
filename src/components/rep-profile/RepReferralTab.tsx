import React from 'react';
import { Users, Copy, Check, Share2, Lock, Unlock, UserCheck, ShieldCheck } from 'lucide-react';

interface RepReferralTabProps {
  referralSummary: any;
  referralCode: string;
  businessesCount: number;
  whatsappInviteUrl: string;
  handleCopyReferral: () => void;
  copiedCode: boolean;
}

export const RepReferralTab: React.FC<RepReferralTabProps> = ({
  referralSummary,
  referralCode,
  businessesCount,
  whatsappInviteUrl,
  handleCopyReferral,
  copiedCode,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 space-y-4 shadow-md transition-colors duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[var(--text-primary)]">
                برنامج الإحالة الميداني وبناء الفريق (3% - 7%)
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">
                ادعُ مناديب جدد لمنظومة دليلك وتلقَّ هدية الدعوة وعمولات إضافية مستمرة
              </p>
            </div>
          </div>

          <span
            className={`text-[11px] font-black px-3 py-1 rounded-full ${
              referralSummary.isUnlocked ? 'badge-success' : 'badge-warning'
            }`}
          >
            {referralSummary.isUnlocked ? '✨ كود الإحالة مفعل' : '🔒 قيد استكمال مهام الـ 25 نشاطاً'}
          </span>
        </div>

        {/* 1. Inviter Badge (if this rep was invited by someone) */}
        {referralSummary.inviterInfo && (
          <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-2xl space-y-2.5 text-xs animate-fade-in">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold block">
                    انضممت للمنظومة بدعوة من:
                  </span>
                  <span className="font-black text-[var(--text-primary)]">
                    {referralSummary.inviterInfo.rep?.name || 'مندوب معتمد'}
                  </span>
                </div>
              </div>
              <span className="font-mono font-bold bg-[var(--bg-card)] px-2.5 py-1 rounded-lg border border-purple-500/30 text-purple-700 dark:text-purple-300">
                كود: {referralSummary.inviterInfo.code}
              </span>
            </div>

            {/* Mission: 10 Google-verified activities progress for inviter gift */}
            <div className="pt-2 border-t border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
              <span className="text-[var(--text-secondary)] font-medium">
                🎯 <strong className="text-[var(--text-primary)]">مهمة هدية الداعي (250 ج.م):</strong> عند توثيقك لـ 10 أنشطة على خرائط Google يتلقى داعيك مكافأة قدرها 250 ج.م مباشرة!
              </span>
              <span className={`font-black px-2.5 py-1 rounded-lg shrink-0 ${
                referralSummary.inviterInfo.isInviterGiftUnlocked
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
              }`}>
                {referralSummary.inviterInfo.isInviterGiftUnlocked
                  ? '🎁 تم صرف الـ 250 ج لداعيك بنجاح ✓'
                  : `⏳ أنجزت ${referralSummary.inviterInfo.myVerifiedCountForInviter || 0}/10 نشاط موثق بجوجل`}
              </span>
            </div>
          </div>
        )}

        {/* 2. Official Referral Code & Share Card (Masked when locked) */}
        <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/5 border border-amber-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-extrabold block">
                كود الدعوة المعتمد الخاص بك
              </span>
              {referralSummary.isUnlocked ? (
                <span className="text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  مفعل للصرف والمشاركة
                </span>
              ) : (
                <span className="text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  مقفل (مطلوب 25 نشاطاً مسجلاً)
                </span>
              )}
            </div>
            {referralSummary.isUnlocked ? (
              <span className="font-mono text-2xl font-black text-[var(--text-primary)] tracking-wider">
                {referralCode}
              </span>
            ) : (
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-mono font-black text-lg tracking-wider py-1">
                <Lock className="w-5 h-5 text-amber-500" />
                <span>محجوب ومقفل (متبقي {Math.max(0, 25 - businessesCount)} نشاط للفتح)</span>
              </div>
            )}
            <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">
              {referralSummary.isUnlocked
                ? 'شارك كودك مع مناديب جدد. يتلقى المنضم تفعيل الحساب وتتلقى أنت 250 ج عند توثيق أول 10 أنشطة له بالإضافة لعمولة 3% - 7% مستمرة.'
                : `كود الإحالة محجوب ومقفل بالكامل. يظهر الكود وتتاح المشاركة وبناء الفريق تلقائياً فور إتمام تسجيل 25 نشاطاً معتمداً في الميدان (أنجزت ${businessesCount} من 25 نشاطاً).`}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {referralSummary.isUnlocked ? (
              <>
                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="flex-1 sm:flex-none bg-[var(--bg-card)] hover:bg-amber-500/20 text-[var(--text-primary)] font-bold text-xs px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-amber-500" />
                  )}
                  <span>{copiedCode ? 'تم النسخ' : 'نسخ الكود'}</span>
                </button>

                <a
                  href={whatsappInviteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>دعوة عبر واتساب</span>
                </a>
              </>
            ) : (
              <div
                className="flex-1 sm:flex-none bg-slate-800/80 text-slate-400 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700/60 flex items-center justify-center gap-2"
                title={`أنجزت ${businessesCount} من 25 نشاطاً. سيتفعل الكود تلقائياً فور بلوغ 25 نشاطاً.`}
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>المشاركة مقفلة حتى 25 نشاطاً</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Milestone Notification if locked */}
        {!referralSummary.isUnlocked && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>مهمة فتح كود الإحالة وبناء الفريق:</span>
              </span>
              <span className="font-black font-mono text-amber-700 dark:text-amber-400">
                {businessesCount} / 25 نشاط ({Math.min(100, Math.round((businessesCount / 25) * 100))}%)
              </span>
            </div>

            <div className="w-full bg-[var(--input-bg)] h-2 rounded-full overflow-hidden border border-[var(--border-color)]">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (businessesCount / 25) * 100)}%` }}
              />
            </div>

            <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed">
              وفقاً للائحة دليلك المعتمدة، يجب على المندوب تسجيل <strong className="text-[var(--text-primary)]">25 نشاطاً ميدانياً</strong> لإظهار كود الإحالة وفتح إمكانية بناء فريق العمل وصرف المكافآت (أنجزت حالياً {businessesCount} نشاط، متبقي {Math.max(0, 25 - businessesCount)} نشاط)، أو بتجاوز وتفعيل مباشر من إدارة المنظومة.
            </p>
          </div>
        )}

        {/* 4. Referral Stats Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center text-xs">
          <div className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)]">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block">
              المناديب المنضمين
            </span>
            <span className="font-black text-lg text-[var(--text-primary)]">
              {referralSummary.totalInvitedCount}
            </span>
          </div>

          <div className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)]">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block">
              المؤهلين (10+ موثقة بجوجل)
            </span>
            <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">
              {referralSummary.qualifiedRepsCount}
            </span>
          </div>

          <div className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)]">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block">
              هدايا الدعوة (+250 ج)
            </span>
            <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">
              +{referralSummary.totalGiftsEarned.toLocaleString()} ج.م
            </span>
          </div>

          <div className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)]">
            <span className="text-[10px] text-[var(--text-muted)] font-bold block">
              عمولات الأنشطة (3%-7%)
            </span>
            <span className="font-black text-lg text-amber-600 dark:text-amber-400">
              +{referralSummary.totalReferralCommission.toLocaleString()} ج.م
            </span>
          </div>

          <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/30 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-black block">
              إجمالي أرباح الإحالة
            </span>
            <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">
              +{referralSummary.totalNetEarnings.toLocaleString()} ج.م
            </span>
          </div>
        </div>

        {/* 5. Invited Reps List (Always visible so inviter sees everyone who joined) */}
        <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-500" />
              <span>أعضاء الفريق المنضمين عبر كودك ({referralSummary.invitedRepsDetails.length}):</span>
            </h4>
            {referralSummary.invitedRepsDetails.length > 0 && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {referralSummary.invitedRepsDetails.length} منضم نشط
              </span>
            )}
          </div>

          {referralSummary.invitedRepsDetails.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {referralSummary.invitedRepsDetails.map(
                ({ rep: invRep, bizCount, verifiedBizCount, currentRate, commissionEarned, isMission1Complete, remainingForMission1 }: any) => (
                  <div
                    key={invRep.id}
                    className="bg-[var(--bg-surface)] p-3.5 rounded-2xl border border-[var(--border-color)] flex flex-col justify-between gap-2.5 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-black text-sm text-[var(--text-primary)]">{invRep.name}</p>
                          {invRep.status === 'suspended' ? (
                            <span className="text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-bold">
                              ⏳ قيد المراجعة
                            </span>
                          ) : (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-md font-bold">
                              🟢 مفعل
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-medium">
                          {invRep.governorate} • {bizCount} نشاط مسجل • <strong className="text-blue-600 dark:text-blue-400 font-bold">{verifiedBizCount || 0}/10 موثق على Google</strong>
                        </p>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="badge-warning text-[9px] font-black px-2 py-0.5 rounded-full inline-block">
                          عمولة {currentRate}%
                        </span>
                        <p className="font-black text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                          +{commissionEarned} ج.م
                        </p>
                      </div>
                    </div>

                    {/* 🎁 250 EGP Google-Verification Gift Milestone Badge */}
                    <div className="pt-2 border-t border-[var(--border-color)]">
                      {isMission1Complete ? (
                        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1.5 rounded-xl flex items-center justify-between text-[10px] font-black">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>مهمة التوثيق (10/10) مكتملة بنجاح</span>
                          </span>
                          <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[9px]">
                            🎁 تم صرف مكافأة +250 ج لك
                          </span>
                        </div>
                      ) : (
                        <div className="bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 px-2.5 py-1.5 rounded-xl flex items-center justify-between text-[10px] font-bold">
                          <span className="flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                            <span>متبقي {remainingForMission1} أنشطة موثقة بـ Google</span>
                          </span>
                          <span className="text-[9px] font-black text-amber-700 dark:text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
                            لهدية الـ 250 ج
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="p-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] text-center text-xs text-[var(--text-muted)]">
              لم ينضم أي مندوب عبر كودك حتى الآن. شارك كودك عبر الواتساب لتوسيع فريقك وتحقيق أرباح مستمرة.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
