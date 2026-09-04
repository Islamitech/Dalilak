import React from 'react';
import { Users, Copy, Check, Share2, Lock } from 'lucide-react';

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
            {referralSummary.isUnlocked ? '✨ كود الإحالة مفعل' : '🔒 مغلق حتى إتمام 25 نشاطاً'}
          </span>
        </div>

        {referralSummary.isUnlocked ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/5 border border-amber-500/40 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-extrabold block">
                  كود الدعوة المعتمد الخاص بك
                </span>
                <span className="font-mono text-2xl font-black text-[var(--text-primary)] tracking-wider">
                  {referralCode}
                </span>
                <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">
                  يحصل المندوب الجديد على تفعيل الحساب وتتلقى أنت عمولة 3% - 7% على كل تسجيل يتم
                  بواسطته.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
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
              </div>
            </div>

            {/* Referral Stats Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
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
                  المؤهلين (10+ أنشطة)
                </span>
                <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">
                  {referralSummary.qualifiedRepsCount}
                </span>
              </div>

              <div className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] font-bold block">
                  عمولات مستمرة (3%-7%)
                </span>
                <span className="font-black text-lg text-amber-600 dark:text-amber-400">
                  +{referralSummary.totalReferralCommission.toLocaleString()} ج.م
                </span>
              </div>

              <div className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)]">
                <span className="text-[10px] text-[var(--text-muted)] font-bold block">
                  إجمالي أرباح الإحالة
                </span>
                <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">
                  +{referralSummary.totalNetEarnings.toLocaleString()} ج.م
                </span>
              </div>
            </div>

            {/* Invited Reps List */}
            {referralSummary.invitedRepsDetails.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                <h4 className="font-extrabold text-xs text-[var(--text-primary)]">
                  أعضاء الفريق المنضمين عبر كودك:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {referralSummary.invitedRepsDetails.map(
                    ({ rep: invRep, bizCount, currentRate, commissionEarned }: any) => (
                      <div
                        key={invRep.id}
                        className="bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-black text-[var(--text-primary)]">{invRep.name}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            {invRep.governorate} • {bizCount} نشاط مسجل
                          </p>
                        </div>
                        <div className="text-left">
                          <span className="badge-warning text-[9px] font-black px-2 py-0.5 rounded-full inline-block">
                            عمولة {currentRate}%
                          </span>
                          <p className="font-black text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                            +{commissionEarned} ج.م
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>شرط فتح نظام الإحالة وظهور الكود:</span>
              </span>
              <span className="font-black font-mono text-amber-700 dark:text-amber-400">
                {businessesCount} / 25 نشاط ({Math.min(100, Math.round((businessesCount / 25) * 100))}%)
              </span>
            </div>

            <div className="w-full bg-[var(--input-bg)] h-2.5 rounded-full overflow-hidden border border-[var(--border-color)]">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (businessesCount / 25) * 100)}%` }}
              />
            </div>

            <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed">
              وفقاً لنظام العمل المعتمد، لا يمتلك المندوب نظام إحالة ولا يظهر كود الإحالة الخاص به إلا بعد تسجيل <strong className="text-[var(--text-primary)]">25 نشاطاً ميدانياً</strong> معتمداً في رصيده (أنجزت حالياً {businessesCount} نشاط، متبقي لك {Math.max(0, 25 - businessesCount)} نشاط)، أو بتجاوز يدوي وتفعيل مباشر من إدارة المنظومة.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
