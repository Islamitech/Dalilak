import React, { useState } from 'react';
import { Business, PayoutRequest } from '../../types';
import { PAYOUT_METHOD_LABELS, getBusinessPaymentLabel } from '../../utils/commission';
import { formatStandardDateTime } from '../../utils/dateFormatters';
import { CreditCard, Percent, Clock, ArrowDownLeft, Sparkles, Gift } from 'lucide-react';

export interface RepFinanceSummaryCardsProps {
  repBusinesses: Business[];
  businessesCount: number;
  commissionPercentage: number;
  settlement: any;
  pendingRemittance?: PayoutRequest;
  pendingPayout?: PayoutRequest;
  referralSummary: any;
  referralCode: string;
  onRequestPayout?: (payout: PayoutRequest) => void;
  onOpenPayoutModal: () => void;
  onOpenRemitInfoModal: () => void;
}

export const RepFinanceSummaryCards: React.FC<RepFinanceSummaryCardsProps> = ({
  repBusinesses,
  businessesCount,
  commissionPercentage,
  settlement,
  pendingRemittance,
  pendingPayout,
  referralSummary,
  referralCode,
  onRequestPayout,
  onOpenPayoutModal,
  onOpenRemitInfoModal,
}) => {
  const [showBreakdownList, setShowBreakdownList] = useState(false);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-500" />
          <h3 className="font-black text-sm text-[var(--text-primary)]">
            حساب العمولات والكاش الميداني والذمة المالية
          </h3>
        </div>
        <span className="text-xs text-emerald-600 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
          <Percent className="w-3 h-3 text-emerald-500" />
          <span>عمولتك المعتمدة {commissionPercentage}%</span>
        </span>
      </div>

      {/* SINGLE MASTER WALLET BOX */}
      <div
        className={`border-2 rounded-3xl p-5 space-y-3.5 shadow-sm transition-all ${
          settlement.isDebtToPlatform
            ? 'bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-950/20 border-amber-500/50'
            : settlement.withdrawableBalance > 0
            ? 'bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-950/20 border-emerald-500/50'
            : 'bg-[var(--input-bg)] border-[var(--border-color)]'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-color)]/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                settlement.isDebtToPlatform
                  ? 'bg-amber-500/20 text-amber-600'
                  : settlement.withdrawableBalance > 0
                  ? 'bg-emerald-500/20 text-emerald-600'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
              }`}
            >
              {settlement.isDebtToPlatform ? '⚠️' : settlement.withdrawableBalance > 0 ? '💵' : '⚖️'}
            </div>
            <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)] flex items-center gap-1.5">
              <span>رصيد الحساب</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                  settlement.isDebtToPlatform
                    ? 'text-amber-600 bg-amber-500/15 border-amber-500/30'
                    : settlement.withdrawableBalance > 0
                    ? 'text-emerald-600 bg-emerald-500/15 border-emerald-500/30'
                    : 'text-[var(--text-muted)] bg-[var(--input-bg)] border-[var(--border-color)]'
                }`}
              >
                {settlement.isDebtToPlatform
                  ? 'مستحق للمنصة'
                  : settlement.withdrawableBalance > 0
                  ? 'أرباح متاحة'
                  : 'مصفى'}
              </span>
            </h4>
          </div>

          {settlement.isDebtToPlatform ? (
            pendingRemittance ? (
              <button
                type="button"
                onClick={onOpenRemitInfoModal}
                className="w-full sm:w-auto bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 font-black text-xs px-3.5 py-2 rounded-xl border border-amber-500/40 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
              >
                <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>طلب السداد قيد المراجعة ⏳</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenRemitInfoModal}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
              >
                <span>سداد مستحقات المنصة 📤</span>
              </button>
            )
          ) : pendingPayout ? (
            <button
              type="button"
              onClick={onOpenPayoutModal}
              className="w-full sm:w-auto bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 font-black text-xs px-3.5 py-2 rounded-xl border border-amber-500/40 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>طلب السحب قيد المراجعة ({pendingPayout.amount.toLocaleString()} ج.م) ⏳</span>
            </button>
          ) : onRequestPayout ? (
            <button
              type="button"
              onClick={onOpenPayoutModal}
              disabled={settlement.withdrawableBalance <= 0}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
              <span>طلب سحب الرصيد</span>
            </button>
          ) : null}
        </div>

        {/* Pending Payout / Remittance Live Banner */}
        {pendingPayout && (
          <div className="bg-amber-500/15 border border-amber-500/35 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs animate-fade-in">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 animate-pulse text-amber-500 shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-[var(--text-primary)]">
                    لديك طلب سحب عمولة مقدم قيد المراجعة:
                  </span>
                  <span className="font-mono font-black text-amber-600">
                    {pendingPayout.amount.toLocaleString()} ج.م
                  </span>
                </div>
                <p className="text-[10.5px] text-[var(--text-secondary)] mt-0.5">
                  طريقة التحويل: <strong>{PAYOUT_METHOD_LABELS[pendingPayout.method]}</strong> (
                  {pendingPayout.accountDetails}) • تاريخ الطلب:{' '}
                  <span className="font-mono dir-ltr">
                    {formatStandardDateTime(pendingPayout.requestDate)}
                  </span>
                </p>
              </div>
            </div>
            <span className="badge-warning text-[10px] font-black px-2.5 py-1 rounded-full shrink-0">
              قيد المراجعة ⏳
            </span>
          </div>
        )}

        {/* Master Prominent Display */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-0.5">
          <div className="flex items-baseline gap-1.5 font-mono">
            <span
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                settlement.isDebtToPlatform
                  ? 'text-amber-600'
                  : settlement.withdrawableBalance > 0
                  ? 'text-emerald-600'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {settlement.isDebtToPlatform
                ? `-${settlement.debtToPlatformAmount.toLocaleString()}`
                : `+${settlement.withdrawableBalance.toLocaleString()}`}
            </span>
            <span className="text-xs font-sans font-extrabold text-[var(--text-muted)]">ج.م</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="bg-[var(--bg-card)] border border-[var(--border-color)] px-2.5 py-1 rounded-xl text-[var(--text-secondary)]">
              💵 كاش بيدك:{' '}
              <strong className="text-amber-600 font-mono">
                {settlement.totalCashInHand} ج
              </strong>
            </span>
            <span className="bg-[var(--bg-card)] border border-[var(--border-color)] px-2.5 py-1 rounded-xl text-[var(--text-secondary)]">
              💎 عمولتك:{' '}
              <strong className="text-emerald-600 font-mono">
                {settlement.totalEarnedCommission} ج
              </strong>
            </span>
            <span className="bg-[var(--bg-card)] border border-[var(--border-color)] px-2.5 py-1 rounded-xl text-[var(--text-secondary)]">
              أنشطة:{' '}
              <strong className="text-[var(--text-primary)]">
                {repBusinesses.length || businessesCount}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Financial Settlement Explanatory Note & Pending Verification Callout */}
      <div className="bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--border-color)] text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-[var(--text-primary)] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>توضيح الموقف المالي الشفاف:</span>
          </span>
          <button
            type="button"
            onClick={() => setShowBreakdownList(!showBreakdownList)}
            className="text-[11px] font-bold text-amber-600 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>
              {showBreakdownList ? 'إخفاء كشف الأنشطة ▲' : 'عرض كشف حساب الأنشطة والتحصيلات ▼'}
            </span>
          </button>
        </div>

        {settlement.isDebtToPlatform ? (
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            قمت باستلام كاش نقدي من العملاء بقيمة <strong>{settlement.totalCashInHand} ج.م</strong>
            ، تم احتساب عمولتك منها (<strong>{settlement.repShareFromCash} ج.م</strong>) واستلمتها
            بيدك فورياً، ويتبقى في ذمتك توريد{' '}
            <strong>{settlement.debtToPlatformAmount} ج.م</strong> لحساب المنصة (فودافون كاش أو
            إنستاباي) لتصفية الحساب.
          </p>
        ) : (
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            إجمالي عمولاتك المكتسبة من الأنشطة المسددة والإحالات{' '}
            <strong>{settlement.totalEarnedCommission} ج.م</strong>. رصيدك المتاح للسحب والتحويل
            لحسابك هو <strong>{settlement.withdrawableBalance} ج.م</strong>.
          </p>
        )}

        {/* Pending Verification Callout */}
        {settlement.pendingVerificationCommission > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/30 text-blue-900 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold mt-1">
            <span>
              ⏳ <strong>أنشطة قيد التوثيق أو الدفع لاحقاً:</strong> لديك{' '}
              <strong className="font-mono font-black">
                {settlement.pendingVerificationCommission} ج.م
              </strong>{' '}
              عمولة متوقعة على <strong>({settlement.pendingVerificationCount}) نشاط</strong>، لا
              تضاف للرصيد المتاح للسحب إلا بعد اكتمال التوثيق وسداد الفاتورة.
            </span>
            <span className="text-[10px] bg-blue-500/20 text-blue-700 px-2 py-0.5 rounded-md shrink-0">
              معلقة لحين الاعتماد والسداد
            </span>
          </div>
        )}
      </div>

      {/* Detailed Collapsible Business & Referral Breakdown */}
      {showBreakdownList && (
        <div className="border border-[var(--border-color)] rounded-2xl p-3.5 bg-[var(--input-bg)]/80 space-y-4 animate-fade-in text-xs shadow-inner">
          {/* 1. TOP SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)]">
              <span className="text-[10px] text-[var(--text-muted)] font-bold block flex items-center gap-1">
                <span>🏢</span> عمولات الأنشطة المباشرة ({commissionPercentage}%):
              </span>
              <span className="text-sm font-black font-mono text-emerald-600">
                +
                {Math.round(
                  repBusinesses.reduce(
                    (s, b) => s + ((b.amountPaid || 0) * commissionPercentage) / 100,
                    0
                  )
                )}{' '}
                ج.م
              </span>
              <span className="text-[9.5px] text-[var(--text-muted)] block">
                ({repBusinesses.length} نشاط مسجل)
              </span>
            </div>

            <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <span className="text-[10px] text-amber-800 font-black block flex items-center gap-1">
                <span>📈</span> عمولة شبكة الإحالات (3% - 7%):
              </span>
              <span className="text-sm font-black font-mono text-amber-600">
                +{referralSummary.totalReferralCommission} ج.م
              </span>
              <span className="text-[9.5px] text-[var(--text-muted)] block">
                ({referralSummary.totalInvitedCount} مندوب في شبكتك)
              </span>
            </div>

            <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-yellow-500/40 bg-yellow-500/10">
              <span className="text-[10px] text-yellow-800 font-black block flex items-center gap-1">
                <span>🎁</span> مكافآت الإحالة (250 ج/10 أنشطة):
              </span>
              <span className="text-sm font-black font-mono text-yellow-600">
                +{referralSummary.totalGiftsEarned} ج.م
              </span>
              <span className="text-[9.5px] text-[var(--text-muted)] block">
                ({referralSummary.qualifiedRepsCount} مندوب مؤهل للمكافأة)
              </span>
            </div>
          </div>

          {/* 2. REFERRAL COMMISSIONS & BONUSES BREAKDOWN SECTION */}
          <div className="bg-gradient-to-r from-amber-500/10 via-[var(--bg-card)] to-yellow-500/10 border border-amber-500/30 rounded-2xl p-3 space-y-2.5">
            <div className="flex items-center justify-between font-black text-xs text-[var(--text-primary)] border-b border-amber-500/20 pb-2">
              <div className="flex items-center gap-1.5 text-amber-800">
                <Gift className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  كشف تفصيلي بعمولات ومكافآت الإحالة ({referralSummary.totalNetEarnings} ج.م):
                </span>
              </div>
              {referralSummary.isUnlocked ? (
                <span className="bg-amber-500/20 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                  كودك: {referralCode}
                </span>
              ) : (
                <span className="bg-slate-500/20 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  🔒 مغلق (يتطلب 25 نشاطاً)
                </span>
              )}
            </div>

            {!referralSummary.isUnlocked ? (
              <div className="text-center py-2.5 px-3 bg-[var(--bg-card)] rounded-xl border border-dashed border-[var(--border-color)]">
                <p className="text-[11px] text-[var(--text-muted)] font-bold">
                  نظام كود الإحالة مغلق للمندوب حتى تسجيل <strong>25 نشاطاً ميدانياً</strong> معتمداً
                  (أنجزت حالياً {businessesCount} من 25 نشاطاً). عند استيفاء الشرط سيظهر كودك المعتمد
                  وتُفعل كافة عمولات ومكافآت الفريق.
                </p>
              </div>
            ) : referralSummary.invitedRepsDetails.length === 0 ? (
              <div className="text-center py-2 px-3 bg-[var(--bg-card)] rounded-xl border border-dashed border-[var(--border-color)]">
                <p className="text-[11px] text-[var(--text-muted)] font-bold">
                  لم تقم بدعوة مناديب بعد. شارك كود الإحالة الخاص بك (
                  <strong className="font-mono text-amber-500">{referralCode}</strong>) واكسب{' '}
                  <strong>250 ج.م مكافأة هدية</strong> فور إكمال المندوب 10 أنشطة +{' '}
                  <strong>عمولة مستمرة تصل إلى 7%</strong> من كافة مبيعاته للأبد!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {referralSummary.invitedRepsDetails.map(
                  ({
                    rep: invRep,
                    bizCount,
                    totalRevenue,
                    currentRate,
                    commissionEarned,
                    isMission1Complete,
                    remainingForMission1,
                  }: any) => (
                    <div
                      key={invRep.id}
                      className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-[var(--text-primary)]">
                            {invRep.name}
                          </span>
                          <span className="text-[9.5px] text-[var(--text-muted)] font-mono">
                            ({invRep.phone})
                          </span>
                          {isMission1Complete ? (
                            <span className="bg-yellow-500/20 text-yellow-800 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-yellow-500/30 flex items-center gap-0.5">
                              <span>🎁</span> مكافأة +250 ج.م معتمدة
                            </span>
                          ) : (
                            <span className="bg-slate-500/10 text-[var(--text-muted)] text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                              ⏳ متبقي {remainingForMission1} أنشطة للمكافأة
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block font-bold">
                          سجل {bizCount} نشاط • إجمالي تحصيله: {totalRevenue.toLocaleString()} ج.م
                        </span>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
                        <div>
                          <span className="text-[9px] text-[var(--text-muted)] block font-sans font-bold">
                            نسبة عمولتك:
                          </span>
                          <span className="font-black text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md">
                            {currentRate}%
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] text-emerald-600 block font-sans font-bold">
                            عمولتك المكتسبة منه:
                          </span>
                          <span className="font-black text-emerald-600">
                            +{commissionEarned} ج.م
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* 3. DIRECT FIELD BUSINESSES BREAKDOWN SECTION */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-black text-xs text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
              <span>كشف تفصيلي بالأنشطة المحصلة والمنتظرة ({repBusinesses.length}):</span>
              <span className="text-[10px] text-[var(--text-muted)] font-bold">
                نسبة عمولة الأنشطة المباشرة: {commissionPercentage}%
              </span>
            </div>

            {repBusinesses.length === 0 ? (
              <p className="text-[11px] text-[var(--text-muted)] text-center py-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                لا توجد أنشطة تجارية مسجلة حتى الآن.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {repBusinesses.map((biz) => {
                  const isCash =
                    biz.cashCollectedByRep !== undefined
                      ? (biz.cashCollectedByRep || 0) > 0
                      : biz.paymentMethod !== 'gateway_online' && (biz.amountPaid || 0) > 0;
                  const paid = biz.amountPaid || 0;
                  const isLive =
                    biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced';
                  const comm = Math.round((paid * commissionPercentage) / 100);
                  const platShare = paid - comm;
                  const fullComm = Math.round(
                    ((biz.packagePrice || 250) * commissionPercentage) / 100
                  );

                  return (
                    <div
                      key={biz.id}
                      className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[var(--text-primary)] block">
                            {biz.nameAr}
                          </span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                              isLive ? 'badge-success' : 'badge-warning'
                            }`}
                          >
                            {isLive ? '✅ موثق' : '⏳ قيد المراجعة'}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block font-bold">
                          باقة {biz.packageName} ({biz.packagePrice} ج.م) •{' '}
                          {getBusinessPaymentLabel(biz).shortLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
                        <div>
                          <span className="text-[9px] text-[var(--text-muted)] block font-sans">
                            المحصل:
                          </span>
                          <span className="font-black text-[var(--text-primary)]">{paid} ج.م</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-emerald-600 block font-sans font-bold">
                            {paid > 0 ? `عمولتك (${commissionPercentage}%):` : 'عمولة منتظرة:'}
                          </span>
                          <span className="font-black text-emerald-600">
                            {paid > 0 ? `${comm} ج.م` : `⏳ ${fullComm} ج.م`}
                          </span>
                        </div>
                        {paid > 0 && (
                          <div>
                            <span className="text-[9px] text-rose-600 block font-sans font-bold">
                              {isCash ? 'للمنصة (عليك):' : 'للمنصة (مباشر):'}
                            </span>
                            <span className="font-black text-rose-600">
                              {platShare} ج.م
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
