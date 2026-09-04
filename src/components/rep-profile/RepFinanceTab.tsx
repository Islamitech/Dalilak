import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Representative, Business, PayoutRequest, PayoutMethod } from '../../types';
import { PAYOUT_METHOD_LABELS, getBusinessPaymentLabel } from '../../utils/commission';
import { compressImageFile } from '../../utils/imageCompressor';
import { safeGetLocalStorageItem, safeSetLocalStorageItem } from '../../utils/storage';
import {
  CreditCard,
  Percent,
  Clock,
  ArrowDownLeft,
  Sparkles,
  Gift,
  Save,
  CheckCircle2,
  History as HistoryIcon,
  Calendar,
  FileText,
  Printer,
  Copy,
  FileCheck,
  Trash2,
  Camera,
  Loader2,
  Send,
} from 'lucide-react';

interface RepFinanceTabProps {
  rep: Representative;
  commissionPercentage: number;
  settlement: any;
  pendingRemittance?: PayoutRequest;
  pendingPayout?: PayoutRequest;
  myPayouts: PayoutRequest[];
  repBusinesses: Business[];
  businessesCount: number;
  referralSummary: any;
  referralCode: string;
  repMonthlyProfits: any[];
  onRequestPayout?: (payout: PayoutRequest) => void;
  onOpenPayoutModal: () => void;
}

export const RepFinanceTab: React.FC<RepFinanceTabProps> = ({
  rep,
  commissionPercentage,
  settlement,
  pendingRemittance: initialPendingRemittance,
  pendingPayout,
  myPayouts: initialMyPayouts,
  repBusinesses,
  businessesCount,
  referralSummary,
  referralCode,
  repMonthlyProfits,
  onRequestPayout,
  onOpenPayoutModal,
}) => {
  const [showBreakdownList, setShowBreakdownList] = useState(false);
  const [showRemitInfoModal, setShowRemitInfoModal] = useState(false);
  const [showAnnualStatementModal, setShowAnnualStatementModal] = useState(false);

  // Local storage payout accounts
  const [payoutVoda, setPayoutVoda] = useState(
    safeGetLocalStorageItem(`dalelak_payout_voda_${rep.id}`) || rep.phone
  );
  const [payoutInsta, setPayoutInsta] = useState(
    safeGetLocalStorageItem(`dalelak_payout_insta_${rep.id}`) || ''
  );
  const [savedPayoutNotice, setSavedPayoutNotice] = useState(false);

  // Remittance form states
  const [remitMethod, setRemitMethod] = useState<PayoutMethod>('instapay');
  const [remitAccountDetails, setRemitAccountDetails] = useState('');
  const [remitTransactionRef, setRemitTransactionRef] = useState('');
  const [remitReceiptPhoto, setRemitReceiptPhoto] = useState('');
  const [isCompressingReceipt, setIsCompressingReceipt] = useState(false);
  const [isSubmittingRemit, setIsSubmittingRemit] = useState(false);
  const [remitSuccess, setRemitSuccess] = useState(false);

  // Internal copy of payouts for instant optimistic updates
  const [myPayouts, setMyPayouts] = useState<PayoutRequest[]>(initialMyPayouts);
  const [pendingRemittance, setPendingRemittance] = useState<PayoutRequest | undefined>(
    initialPendingRemittance
  );

  React.useEffect(() => {
    setMyPayouts(initialMyPayouts);
    setPendingRemittance(initialPendingRemittance);
  }, [initialMyPayouts, initialPendingRemittance]);

  const handleSavePayout = (e: React.FormEvent) => {
    e.preventDefault();
    safeSetLocalStorageItem(`dalelak_payout_voda_${rep.id}`, payoutVoda);
    safeSetLocalStorageItem(`dalelak_payout_insta_${rep.id}`, payoutInsta);
    setSavedPayoutNotice(true);
    setTimeout(() => setSavedPayoutNotice(false), 3000);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingReceipt(true);
      const compressed = await compressImageFile(file, 1200, 1200, 0.8, { applyWatermark: false });
      setRemitReceiptPhoto(compressed);
    } catch (err) {
      console.error('Error compressing receipt photo:', err);
    } finally {
      setIsCompressingReceipt(false);
    }
  };

  const handleSubmitRemittance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remitReceiptPhoto) {
      alert('يرجى إرفاق صورة أو لقطة شاشة لإيصال السداد');
      return;
    }
    setIsSubmittingRemit(true);
    try {
      const newRemittance: PayoutRequest = {
        id: `remit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        repId: rep.id,
        repName: rep.name,
        repPhone: rep.phone,
        type: 'remittance',
        amount: settlement.debtToPlatformAmount,
        method: remitMethod,
        accountDetails: remitAccountDetails || (remitMethod === 'instapay' ? '@daz31181' : '01143888355'),
        transactionRef: remitTransactionRef || undefined,
        receiptPhoto: remitReceiptPhoto,
        status: 'pending',
        requestDate: new Date().toISOString(),
      };

      if (onRequestPayout) {
        onRequestPayout(newRemittance);
      }
      setPendingRemittance(newRemittance);
      setMyPayouts((prev) => [newRemittance, ...prev]);
      setRemitSuccess(true);
      setTimeout(() => {
        setRemitSuccess(false);
        setShowRemitInfoModal(false);
      }, 2500);
    } catch (err) {
      console.error('Failed to submit remittance:', err);
      alert('حدث خطأ أثناء إرسال إيصال السداد، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmittingRemit(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Main Financial Hub Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 shadow-md space-y-4 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            <h3 className="font-black text-sm text-[var(--text-primary)]">
              حساب العمولات والكاش الميداني والذمة المالية
            </h3>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
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
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    : settlement.withdrawableBalance > 0
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
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
                      ? 'text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30'
                      : settlement.withdrawableBalance > 0
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
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
                  onClick={() => setShowRemitInfoModal(true)}
                  className="w-full sm:w-auto bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-black text-xs px-3.5 py-2 rounded-xl border border-amber-500/40 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                >
                  <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>طلب السداد قيد المراجعة ⏳</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowRemitInfoModal(true)}
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                >
                  <span>سداد مستحقات المنصة 📤</span>
                </button>
              )
            ) : pendingPayout ? (
              <button
                type="button"
                onClick={onOpenPayoutModal}
                className="w-full sm:w-auto bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-black text-xs px-3.5 py-2 rounded-xl border border-amber-500/40 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
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
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                      {pendingPayout.amount.toLocaleString()} ج.م
                    </span>
                  </div>
                  <p className="text-[10.5px] text-[var(--text-secondary)] mt-0.5">
                    طريقة التحويل: <strong>{PAYOUT_METHOD_LABELS[pendingPayout.method]}</strong> (
                    {pendingPayout.accountDetails}) • تاريخ الطلب:{' '}
                    {new Date(pendingPayout.requestDate).toLocaleString('ar-EG')}
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
                    ? 'text-amber-600 dark:text-amber-400'
                    : settlement.withdrawableBalance > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
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
                <strong className="text-amber-600 dark:text-amber-400 font-mono">
                  {settlement.totalCashInHand} ج
                </strong>
              </span>
              <span className="bg-[var(--bg-card)] border border-[var(--border-color)] px-2.5 py-1 rounded-xl text-[var(--text-secondary)]">
                💎 عمولتك:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
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
              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
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
            <div className="bg-blue-500/10 border border-blue-500/30 text-blue-900 dark:text-blue-200 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold mt-1">
              <span>
                ⏳ <strong>أنشطة قيد التوثيق أو الدفع لاحقاً:</strong> لديك{' '}
                <strong className="font-mono font-black">
                  {settlement.pendingVerificationCommission} ج.م
                </strong>{' '}
                عمولة متوقعة على <strong>({settlement.pendingVerificationCount}) نشاط</strong>، لا
                تضاف للرصيد المتاح للسحب إلا بعد اكتمال التوثيق وسداد الفاتورة.
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md shrink-0">
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
                <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
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
                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-black block flex items-center gap-1">
                  <span>📈</span> عمولة شبكة الإحالات (3% - 7%):
                </span>
                <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
                  +{referralSummary.totalReferralCommission} ج.م
                </span>
                <span className="text-[9.5px] text-[var(--text-muted)] block">
                  ({referralSummary.totalInvitedCount} مندوب في شبكتك)
                </span>
              </div>

              <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-yellow-500/40 bg-yellow-500/10">
                <span className="text-[10px] text-yellow-800 dark:text-yellow-300 font-black block flex items-center gap-1">
                  <span>🎁</span> مكافآت الإحالة (250 ج/10 أنشطة):
                </span>
                <span className="text-sm font-black font-mono text-yellow-600 dark:text-yellow-400">
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
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <Gift className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    كشف تفصيلي بعمولات ومكافآت الإحالة ({referralSummary.totalNetEarnings} ج.م):
                  </span>
                </div>
                <span className="bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                  كودك: {referralCode}
                </span>
              </div>

              {referralSummary.invitedRepsDetails.length === 0 ? (
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
                              <span className="bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-yellow-500/30 flex items-center gap-0.5">
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
                            <span className="font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                              {currentRate}%
                            </span>
                          </div>

                          <div>
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-sans font-bold">
                              عمولتك المكتسبة منه:
                            </span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400">
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
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-sans font-bold">
                              {paid > 0 ? `عمولتك (${commissionPercentage}%):` : 'عمولة منتظرة:'}
                            </span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400">
                              {paid > 0 ? `${comm} ج.م` : `⏳ ${fullComm} ج.م`}
                            </span>
                          </div>
                          {paid > 0 && (
                            <div>
                              <span className="text-[9px] text-rose-600 dark:text-rose-400 block font-sans font-bold">
                                {isCash ? 'للمنصة (عليك):' : 'للمنصة (مباشر):'}
                              </span>
                              <span className="font-black text-rose-600 dark:text-rose-400">
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

        {/* Payout Wallets Configuration Form */}
        <div className="pt-2 border-t border-[var(--border-color)]">
          <form onSubmit={handleSavePayout} className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-xs text-[var(--text-primary)]">
                وسائل استلام العمولات والأرباح
              </h4>
              {savedPayoutNotice && (
                <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>تم حفظ الوسائل بنجاح!</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">
                  رقم فودافون كاش لتحويل العمولات:
                </label>
                <input
                  type="text"
                  placeholder="01012345678"
                  value={payoutVoda}
                  onChange={(e) => setPayoutVoda(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-500 font-bold rounded-xl p-2.5 font-mono dir-ltr text-right focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">
                  معرف إنستاباي (InstaPay Handle):
                </label>
                <input
                  type="text"
                  placeholder="@username"
                  value={payoutInsta}
                  onChange={(e) => setPayoutInsta(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-purple-500 font-bold rounded-xl p-2.5 font-mono dir-ltr text-right focus:outline-none focus:border-purple-500 shadow-sm"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ وسائل التحويل</span>
              </button>
            </div>
          </form>
        </div>

        {/* 📋 Payout & Remittance Requests History Tracker */}
        <div className="pt-3 border-t border-[var(--border-color)] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-xs text-[var(--text-primary)] flex items-center gap-1.5">
              <HistoryIcon className="w-4 h-4 text-emerald-500" />
              <span>سجل ومتابعة طلبات سحب العمولات والتوريد ({myPayouts.length})</span>
            </h4>
            <span className="text-[10px] text-[var(--text-muted)] font-bold">تحديث فوري ومباشر</span>
          </div>

          {myPayouts.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {myPayouts.map((payout) => {
                const isRemit = payout.type === 'remittance';
                const isPending = payout.status === 'pending';
                const isApproved = payout.status === 'approved';
                const isRejected = payout.status === 'rejected';

                return (
                  <div
                    key={payout.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isPending
                        ? 'bg-amber-500/5 border-amber-500/30'
                        : isApproved
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : 'bg-rose-500/5 border-rose-500/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                            isRemit ? 'bg-blue-500/15 text-blue-600' : 'bg-emerald-500/15 text-emerald-600'
                          }`}
                        >
                          {isRemit ? <CreditCard className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-xs text-[var(--text-primary)]">
                              {isRemit ? 'إشعار توريد سداد للمنصة' : 'طلب سحب عمولة أرباح'}
                            </span>
                            <span className="font-mono font-black text-xs text-[var(--text-primary)]">
                              {payout.amount.toLocaleString()} ج.م
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {PAYOUT_METHOD_LABELS[payout.method]} • {payout.accountDetails} •{' '}
                            {new Date(payout.requestDate).toLocaleString('ar-EG')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <span className="badge-warning text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3 animate-pulse" />
                            <span>قيد المراجعة ⏳</span>
                          </span>
                        )}
                        {isApproved && (
                          <div className="text-left sm:text-right">
                            <span className="badge-success text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isRemit ? 'تم اعتماد السداد ✅' : 'تم الصرف والتحويل ✅'}</span>
                            </span>
                            {payout.transactionRef && (
                              <p className="text-[9px] text-[var(--text-muted)] font-mono mt-0.5">
                                رقم المعاملة: {payout.transactionRef}
                              </p>
                            )}
                          </div>
                        )}
                        {isRejected && (
                          <div className="text-left sm:text-right">
                            <span className="badge-danger text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                              <span>مرفوض ❌</span>
                            </span>
                            {payout.adminNotes && (
                              <p className="text-[9px] text-rose-500 font-bold mt-0.5">
                                السبب: {payout.adminNotes}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-[var(--border-color)] rounded-2xl p-4 text-center text-xs text-[var(--text-muted)] font-bold bg-[var(--input-bg)]/40">
              <p className="text-[var(--text-primary)] font-bold">لا توجد طلبات سحب سابقة مسجلة</p>
            </div>
          )}
        </div>

        {/* ── 📅 MONTHLY PROFITS & EARNINGS BREAKDOWN ── */}
        <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
                سجل الأرباح والدخل الشهري التراكمي ({repMonthlyProfits.length} شهور)
              </h4>
            </div>
            <span className="text-[10.5px] text-[var(--text-muted)] font-bold">
              تحديث فوري لكل فترة
            </span>
          </div>

          {repMonthlyProfits.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {repMonthlyProfits.map((m) => {
                const netRemaining = Math.max(0, m.earnedCommission - m.payoutsReceived);
                return (
                  <div
                    key={m.monthKey}
                    className="bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-amber-500/40 rounded-2xl p-3.5 space-y-2.5 shadow-xs transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                      <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)]">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>{m.monthLabel}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        {m.verifiedBiz} موثق ✅
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)]">
                        <span className="text-[9.5px] text-[var(--text-muted)] font-bold block">
                          مبيعات الشهر
                        </span>
                        <span className="font-black text-xs text-[var(--text-primary)] font-mono">
                          {m.totalSales.toLocaleString()} ج.م
                        </span>
                      </div>

                      <div className="bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)]">
                        <span className="text-[9.5px] text-[var(--text-muted)] font-bold block">
                          العمولة المكتسبة
                        </span>
                        <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                          {m.earnedCommission.toLocaleString()} ج.م
                        </span>
                      </div>

                      <div className="bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)]">
                        <span className="text-[9.5px] text-[var(--text-muted)] font-bold block">
                          المصروف بحوالات
                        </span>
                        <span className="font-black text-xs text-blue-600 dark:text-blue-400 font-mono">
                          {m.payoutsReceived.toLocaleString()} ج.م
                        </span>
                      </div>

                      <div className="bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)]">
                        <span className="text-[9.5px] text-[var(--text-muted)] font-bold block">
                          المتبقي الصافي
                        </span>
                        <span className="font-black text-xs text-amber-600 dark:text-amber-400 font-mono">
                          {netRemaining.toLocaleString()} ج.م
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-xs text-[var(--text-muted)] py-3">
              لا توجد أرباح مسجلة بعد.
            </p>
          )}
        </div>

        {/* ── 🏛️ ANNUAL STATEMENT & FISCAL ARCHIVE ── */}
        <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border-2 border-amber-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-[var(--text-primary)]">
                كشف الحساب والأرشيف المالي السنوي الرسمي
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">
                إصدار كشف حساب سنوي معتمد موثق بختم المنظومة لكافة العمليات والعمولات
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAnnualStatementModal(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95 shrink-0"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة كشف الحساب السنوي</span>
          </button>
        </div>
      </div>

      {/* MODAL: Platform Remittance Details Modal */}
      {showRemitInfoModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4" dir="rtl">
            <div className="bg-[var(--bg-card)] border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-xs text-[var(--text-primary)] shadow-2xl relative animate-fade-in my-auto max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <h4 className="font-black text-base text-[var(--text-primary)]">
                    إشعار وتوريد سداد حساب المنصة
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRemitInfoModal(false)}
                  className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {pendingRemittance ? (
                <div className="space-y-4 py-2">
                  <div className="bg-amber-500/15 border-2 border-amber-500/40 p-4 rounded-2xl text-center space-y-1.5">
                    <div className="w-11 h-11 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h4 className="font-black text-sm text-amber-800 dark:text-amber-300">
                      جاري مراجعة وتأكيد عملية السداد ⏳
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] font-medium">
                      سيتم تصفية وتحديث الحساب فور اعتماد المسؤول
                    </p>
                  </div>

                  {/* Pending Remittance Summary Details */}
                  <div className="bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                      <span className="text-[var(--text-muted)] font-bold">
                        المبلغ المسدد قيد المراجعة:
                      </span>
                      <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                        {pendingRemittance.amount.toLocaleString()} ج.م
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                      <span className="text-[var(--text-muted)] font-bold">
                        وسيلة التحويل المستخدمة:
                      </span>
                      <span className="font-bold text-[var(--text-primary)]">
                        {PAYOUT_METHOD_LABELS[pendingRemittance.method]}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                      <span className="text-[var(--text-muted)] font-bold">تاريخ الإرسال:</span>
                      <span className="font-mono text-[11px] text-[var(--text-muted)]">
                        {new Date(pendingRemittance.requestDate).toLocaleString('ar-EG')}
                      </span>
                    </div>

                    {pendingRemittance.transactionRef && (
                      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                        <span className="text-[var(--text-muted)] font-bold">
                          رقم العملية / الحوالة:
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {pendingRemittance.transactionRef}
                        </span>
                      </div>
                    )}

                    {pendingRemittance.receiptPhoto && (
                      <div className="pt-1">
                        <span className="text-[10px] text-[var(--text-muted)] block font-bold mb-1.5">
                          صورة إيصال السداد المرفقة:
                        </span>
                        <div className="rounded-xl overflow-hidden border border-amber-500/30 bg-slate-950/60 p-2 flex items-center gap-3">
                          <img
                            src={pendingRemittance.receiptPhoto}
                            alt="صورة الإيصال"
                            className="w-14 h-14 object-cover rounded-lg border border-slate-700"
                          />
                          <div>
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>الإيصال مرفق ومحفوظ بالنظام</span>
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                              بانتظار مطابقة الحساب وتأكيد المشرف
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRemitInfoModal(false)}
                    className="w-full bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-bold py-3 rounded-xl border border-[var(--border-color)] cursor-pointer text-xs"
                  >
                    إغلاق النافذة
                  </button>
                </div>
              ) : remitSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-14 h-14 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="font-black text-base text-emerald-600 dark:text-emerald-400">
                    تم إرسال إشعار وإيصال السداد بنجاح!
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                    سيقوم مسؤولو الإدارة والمالية بمراجعة صورة الإيصال وتأكيد المعاملة وتصفية ذمتك
                    المالية فوراً.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRemittance} className="space-y-4">
                  <div className="bg-amber-500/15 border border-amber-500/30 p-3.5 rounded-2xl space-y-1 text-amber-900 dark:text-amber-200 font-medium">
                    <div className="flex items-center justify-between font-black text-xs">
                      <span>المبلغ المستحق لتوريده للمنصة:</span>
                      <span className="text-base font-mono text-amber-600 dark:text-amber-400 font-black">
                        {settlement.debtToPlatformAmount} ج.م
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      يرجى تحويل المبلغ عبر الحسابات المعتمدة أدناه ثم رفع لقطة شاشة أو صورة الإيصال
                      لإرسالها للإدارة للتدقيق والاعتماد.
                    </p>
                  </div>

                  {/* Accounts to Transfer to */}
                  <div className="space-y-2">
                    <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-purple-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block font-bold">
                          معرف إنستاباي المعتمد (InstaPay):
                        </span>
                        <span className="text-purple-600 dark:text-purple-300 font-mono font-black text-sm dir-ltr text-right inline-block">
                          @daz31181
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('@daz31181');
                          alert('تم نسخ معرف إنستاباي: @daz31181');
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>نسخ</span>
                      </button>
                    </div>

                    <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block font-bold">
                          محفظة فودافون كاش الرسمية:
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm dir-ltr text-right inline-block">
                          01143888355
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('01143888355');
                          alert('تم نسخ رقم فودافون كاش: 01143888355');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>نسخ</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Method Used */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                        وسيلة التحويل المستخدمة:
                      </label>
                      <select
                        value={remitMethod}
                        onChange={(e) => setRemitMethod(e.target.value as PayoutMethod)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs font-bold focus:border-amber-500 outline-none"
                      >
                        <option value="instapay">إنستاباي (InstaPay)</option>
                        <option value="vodafone_cash">فودافون كاش</option>
                        <option value="orange_cash">أورنج كاش</option>
                        <option value="etisalat_cash">اتصالات كاش</option>
                        <option value="we_pay">وي باي (WE Pay)</option>
                        <option value="bank_transfer">تحويل بنكي</option>
                        <option value="cash">سداد كاش يدوي</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                        رقم العملية / الحوالة (اختياري):
                      </label>
                      <input
                        type="text"
                        value={remitTransactionRef}
                        onChange={(e) => setRemitTransactionRef(e.target.value)}
                        placeholder="مثال: REF-92841"
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs font-mono focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Receipt Photo Upload Section */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)]">
                      صورة إيصال / لقطة شاشة السداد <span className="text-rose-500">*</span>
                    </label>

                    {remitReceiptPhoto ? (
                      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-slate-950/40 p-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={remitReceiptPhoto}
                            alt="Receipt preview"
                            className="w-16 h-16 object-cover rounded-xl border border-slate-700 bg-slate-900"
                          />
                          <div>
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>تم إرفاق صورة الإيصال</span>
                            </span>
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                              جاهز للإرسال والمراجعة
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setRemitReceiptPhoto('')}
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>حذف</span>
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-amber-500/40 hover:border-amber-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[var(--input-bg)] transition-colors hover:bg-amber-500/5">
                        {isCompressingReceipt ? (
                          <div className="flex flex-col items-center gap-1.5 py-2">
                            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                            <span className="text-xs text-amber-500 font-bold">
                              جارٍ معالجة وضغط الصورة...
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center">
                              <Camera className="w-5 h-5" />
                            </div>
                            <div className="text-center">
                              <span className="text-xs font-bold text-[var(--text-primary)] block">
                                اضغط هنا لرفع صورة الإيصال أو لقطة الشاشة
                              </span>
                              <span className="text-[10px] text-[var(--text-muted)]">
                                يدعم الصور وملفات JPG / PNG
                              </span>
                            </div>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReceiptUpload}
                          disabled={isCompressingReceipt}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
                    <button
                      type="submit"
                      disabled={isSubmittingRemit || isCompressingReceipt || !remitReceiptPhoto}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                    >
                      {isSubmittingRemit ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جارٍ الإرسال...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>إرسال إشعار وإيصال السداد للإدارة 🚀</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowRemitInfoModal(false)}
                      className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-primary)] font-bold py-3 px-4 rounded-xl border border-[var(--border-color)] cursor-pointer text-xs"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* MODAL: Official Annual Statement */}
      {showAnnualStatementModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4" dir="rtl">
            <div className="bg-[var(--bg-card)] border-2 border-amber-500/50 rounded-3xl max-w-2xl w-full p-6 space-y-4 text-xs text-[var(--text-primary)] shadow-2xl relative animate-fade-in my-auto max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <h4 className="font-black text-base text-[var(--text-primary)]">
                    كشف الحساب المالي السنوي المعتمد 2026
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAnnualStatementModal(false)}
                  className="bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)] space-y-3 font-sans">
                <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2 text-xs">
                  <div>
                    <p className="font-black text-sm text-[var(--text-primary)]">{rep.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">كود: REP-2026-{rep.id.replace(/\D/g, '') || '084'}</p>
                  </div>
                  <span className="text-emerald-600 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                    معتمد رسمياً
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">إجمالي المبيعات</span>
                    <span className="font-black font-mono text-sm text-[var(--text-primary)]">
                      {repMonthlyProfits.reduce((s, m) => s + m.totalSales, 0).toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="p-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">إجمالي العمولات</span>
                    <span className="font-black font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      {repMonthlyProfits.reduce((s, m) => s + m.earnedCommission, 0).toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="p-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">الحوالات المصروفة</span>
                    <span className="font-black font-mono text-sm text-blue-600 dark:text-blue-400">
                      {repMonthlyProfits.reduce((s, m) => s + m.payoutsReceived, 0).toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="p-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">أنشطة موثقة</span>
                    <span className="font-black font-mono text-sm text-amber-600 dark:text-amber-400">
                      {repMonthlyProfits.reduce((s, m) => s + m.verifiedBiz, 0)}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg-card)] border-b border-[var(--border-color)] text-[10px] font-bold text-[var(--text-muted)]">
                        <th className="p-2">الشهر والفترة</th>
                        <th className="p-2">المبيعات</th>
                        <th className="p-2">العمولة</th>
                        <th className="p-2">المصروف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {repMonthlyProfits.map((m) => (
                        <tr key={m.monthKey}>
                          <td className="p-2 font-bold">{m.monthLabel}</td>
                          <td className="p-2 font-mono">{m.totalSales.toLocaleString()} ج.م</td>
                          <td className="p-2 font-mono text-emerald-600 font-bold">{m.earnedCommission.toLocaleString()} ج.م</td>
                          <td className="p-2 font-mono text-blue-600">{m.payoutsReceived.toLocaleString()} ج.م</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة المستند الرسمي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAnnualStatementModal(false)}
                  className="bg-[var(--input-bg)] text-[var(--text-primary)] font-bold px-4 py-2 rounded-xl border border-[var(--border-color)] cursor-pointer text-xs"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
