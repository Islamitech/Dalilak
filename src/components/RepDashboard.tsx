import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Business, Representative, PayoutRequest, PayoutMethod } from '../types';
import { 
  calculateRepSettlement,
  PAYOUT_METHOD_LABELS
} from '../utils/commission';
import { getRepReferralSummary, getRepReferralCode, INVITATION_GIFT_BONUS } from '../utils/referral';
import { UserAvatar } from './UserAvatar';
import { RequestPayoutModal } from './RequestPayoutModal';
import { compressImageFile } from '../utils/imageCompressor';
import { 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  Lightbulb, 
  Users, 
  Share2, 
  Copy, 
  Check, 
  Lock, 
  Sparkles,
  Send,
  CreditCard,
  History,
  ArrowDownLeft,
  Calendar,
  Camera,
  Trash2,
  Loader2,
  FileCheck
} from 'lucide-react';

interface RepDashboardProps {
  rep: Representative;
  businesses: Business[];
  allReps?: Representative[];
  payoutRequests?: PayoutRequest[];
  onAddNewClick: () => void;
  onShowInvoice?: (biz: Business) => void;
  onRequestPayout?: (payout: PayoutRequest) => void;
}

export const RepDashboard: React.FC<RepDashboardProps> = ({
  rep,
  businesses,
  allReps = [],
  payoutRequests = [],
  onAddNewClick,
  onRequestPayout,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showRemitInfoModal, setShowRemitInfoModal] = useState(false);

  // Remittance Submission States
  const [remitMethod, setRemitMethod] = useState<PayoutMethod>('instapay');
  const [remitAccountDetails, setRemitAccountDetails] = useState('');
  const [remitTransactionRef, setRemitTransactionRef] = useState('');
  const [remitReceiptPhoto, setRemitReceiptPhoto] = useState('');
  const [isCompressingReceipt, setIsCompressingReceipt] = useState(false);
  const [isSubmittingRemit, setIsSubmittingRemit] = useState(false);
  const [remitSuccess, setRemitSuccess] = useState(false);

  const myBusinesses = businesses.filter((b) => b.repId === rep.id || b.repName === rep.name);
  const totalCollected = myBusinesses.reduce((acc, b) => acc + (b.amountPaid || 0), 0);

  const repRate = rep.commissionRate || 42.86;

  // Referral Network & Missions calculation
  const referralSummary = getRepReferralSummary(rep, allReps, businesses);
  const referralCode = getRepReferralCode(rep);

  // Financial Settlement
  const settlement = calculateRepSettlement(
    rep.id,
    myBusinesses,
    repRate,
    payoutRequests,
    referralSummary.totalNetEarnings
  );

  const availableBalance = settlement.withdrawableBalance;

  const myPayouts = payoutRequests.filter((p) => p.repId === rep.id);
  const pendingRemittance = payoutRequests.find(
    (p) => p.repId === rep.id && p.type === 'remittance' && p.status === 'pending'
  );

  const targetProgress = Math.min(100, Math.round((myBusinesses.length / rep.targetMonth) * 100));

  const isMission1Complete = myBusinesses.length >= 10;
  const isMission2Complete = referralSummary.isUnlocked;

  useEffect(() => {
    if (!showRemitInfoModal) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showRemitInfoModal]);

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
      alert('يرجى رفع صورة إيصال / لقطة شاشة التحويل للتأكيد');
      return;
    }
    if (!onRequestPayout) return;

    try {
      setIsSubmittingRemit(true);
      const newRemittance: PayoutRequest = {
        id: `remit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        repId: rep.id,
        repName: rep.name,
        repPhone: rep.phone,
        amount: settlement.debtToPlatformAmount,
        method: remitMethod,
        accountDetails: remitAccountDetails || (remitMethod === 'instapay' ? '@daz31181' : '01143888355'),
        status: 'pending',
        requestDate: new Date().toISOString(),
        receiptPhoto: remitReceiptPhoto,
        transactionRef: remitTransactionRef || undefined,
        type: 'remittance',
      };

      await onRequestPayout(newRemittance);
      setRemitSuccess(true);
      setTimeout(() => {
        setRemitSuccess(false);
        setShowRemitInfoModal(false);
        setRemitReceiptPhoto('');
        setRemitTransactionRef('');
        setRemitAccountDetails('');
      }, 2500);
    } catch (err) {
      console.error('Failed to submit remittance:', err);
    } finally {
      setIsSubmittingRemit(false);
    }
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const inviteMessage = encodeURIComponent(
    `انضم الآن لفريق عمل منظومة دليلك لتوثيق الأنشطة التجارية في مصر وسجل حسابك باستخدام كود الدعوة المعتمد: ${referralCode}\nرابط المنصة: https://www.dalilaak.com/`
  );
  const whatsappInviteUrl = `https://wa.me/?text=${inviteMessage}`;

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20">

      {/* Executive Rep Dashboard Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/80 to-slate-900 border border-amber-500/40 p-4 sm:p-5 rounded-3xl shadow-xl space-y-3.5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <UserAvatar avatar={rep.avatar} name={rep.name} role={rep.role} avatarStatus={rep.avatarStatus} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">مرحباً، {rep.name} 👋</h2>
                <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  مندوب {rep.governorate}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                المنصة الميدانية لتوثيق الأنشطة وإصدار الفواتير وتحصيل العمولات فورياً
              </p>
            </div>
          </div>

          <button
            onClick={onAddNewClick}
            className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-5 h-5 stroke-[2.5]" />
            <span>تسجيل نشاط جديد ➕</span>
          </button>
        </div>

        {/* Integrated Subtle Field Work Target Badge */}
        {/* Integrated Subtle Field Work Target Badge */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 px-3.5 flex items-center gap-2 text-xs">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-amber-300 font-bold">
            توصية الميدان: استهداف 25 زيارة يومياً يحقق أعلى تدفق تسجيلات وعمولات مستمرة.
          </span>
        </div>
      </div>

      {/* ========================================================
          SINGLE MASTER WALLET & MILESTONE BOX (مربع الرصيد المالي والأهداف الموحد)
          ======================================================== */}
      <div className={`border-2 rounded-3xl p-4 sm:p-5 shadow-xl transition-all duration-300 space-y-4 ${
        settlement.isDebtToPlatform
          ? 'bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-950/20 border-amber-500/50'
          : settlement.withdrawableBalance > 0
          ? 'bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-950/20 border-emerald-500/50'
          : 'bg-[var(--bg-card)] border-[var(--border-color)]'
      }`}>
        {/* Header of the Single Box */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-color)]/60 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base ${
              settlement.isDebtToPlatform
                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                : settlement.withdrawableBalance > 0
                ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                : 'bg-[var(--input-bg)] text-[var(--text-muted)]'
            }`}>
              {settlement.isDebtToPlatform ? '⚠️' : settlement.withdrawableBalance > 0 ? '💵' : '⚖️'}
            </div>
            <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
              <span>رصيد الحساب والعمولات</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                settlement.isDebtToPlatform
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30'
                  : settlement.withdrawableBalance > 0
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                  : 'text-[var(--text-muted)] bg-[var(--input-bg)] border-[var(--border-color)]'
              }`}>
                {settlement.isDebtToPlatform ? 'مستحق للمنصة' : settlement.withdrawableBalance > 0 ? 'أرباح متاحة للسحب' : 'مصفى'}
              </span>
            </h3>
          </div>

          {/* Action Button */}
          {settlement.isDebtToPlatform ? (
            pendingRemittance ? (
              <button
                onClick={() => setShowRemitInfoModal(true)}
                className="w-full sm:w-auto bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-black text-xs px-4 py-2.5 rounded-xl border border-amber-500/40 shadow flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95 shrink-0"
              >
                <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>طلب السداد قيد المراجعة ⏳</span>
              </button>
            ) : (
              <button
                onClick={() => setShowRemitInfoModal(true)}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95 shrink-0"
              >
                <span>سداد مستحقات المنصة 📤</span>
              </button>
            )
          ) : (
            <button
              onClick={() => setShowPayoutModal(true)}
              disabled={settlement.withdrawableBalance <= 0}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95 shrink-0"
            >
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
              <span>طلب سحب الرصيد</span>
            </button>
          )}
        </div>

        {/* Master Prominent Amount & Metric Pills */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-0.5">
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className={`text-3xl sm:text-4xl font-black tracking-tight ${
              settlement.isDebtToPlatform
                ? 'text-amber-600 dark:text-amber-400'
                : settlement.withdrawableBalance > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-[var(--text-primary)]'
            }`}>
              {settlement.isDebtToPlatform
                ? `-${Math.abs(settlement.debtToPlatformAmount).toLocaleString()}`
                : `+${Math.abs(settlement.withdrawableBalance).toLocaleString()}`}
            </span>
            <span className="text-xs font-sans font-extrabold text-[var(--text-muted)]">ج.م</span>
          </div>

          {/* Clean Metric Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="bg-[var(--input-bg)] border border-[var(--border-color)] px-2.5 py-1 rounded-xl text-[var(--text-secondary)]">
              💵 كاش بيدك: <strong className="text-amber-600 dark:text-amber-400 font-mono">{settlement.totalCashInHand} ج</strong>
            </span>
            <span className="bg-[var(--input-bg)] border border-[var(--border-color)] px-2.5 py-1 rounded-xl text-[var(--text-secondary)]">
              💎 عمولتك: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{settlement.totalEarnedCommission} ج</strong>
            </span>
          </div>
        </div>

        {/* Integrated Target Milestones: Weekly Target & Referral Unlock */}
        <div className="pt-3 border-t border-[var(--border-color)]/60 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Weekly Target: 10 businesses */}
            <div className={`p-3 rounded-2xl border transition-all ${
              isMission1Complete
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-[var(--input-bg)]/80 border-[var(--border-color)]'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
                  {isMission1Complete ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 text-[10px] flex items-center justify-center font-black">🎯</span>
                  )}
                  <span>الهدف الأسبوعي (تسجيل 10 أنشطة)</span>
                </span>
                <span className={`font-mono font-black ${isMission1Complete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
                  {Math.min(10, myBusinesses.length)} / 10
                </span>
              </div>
              <div className="w-full bg-[var(--bg-card)] h-2 rounded-full overflow-hidden border border-[var(--border-color)]/40">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (myBusinesses.length / 10) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-bold mt-1">
                {isMission1Complete
                  ? 'تم تفعيل الحساب الميداني المستقل بنجاح ✅'
                  : `متبقي ${Math.max(0, 10 - myBusinesses.length)} أنشطة لتأكيد الحساب الميداني المستقل`}
              </p>
            </div>

            {/* 2. Referral Unlock Target: 25 businesses */}
            <div className={`p-3 rounded-2xl border transition-all ${
              referralSummary.isUnlocked
                ? 'bg-blue-500/10 border-blue-500/30'
                : 'bg-[var(--input-bg)]/80 border-[var(--border-color)]'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="flex items-center gap-1.5 text-[var(--text-primary)]">
                  {referralSummary.isUnlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-600 text-[10px] flex items-center justify-center font-black">🚀</span>
                  )}
                  <span>هدف فتح كود الإحالة (25 نشاط)</span>
                </span>
                <span className={`font-mono font-black ${referralSummary.isUnlocked ? 'text-blue-600 dark:text-blue-400' : 'text-blue-600'}`}>
                  {referralSummary.isUnlocked ? 'مفعل ✨' : `${Math.min(25, myBusinesses.length)} / 25`}
                </span>
              </div>
              <div className="w-full bg-[var(--bg-card)] h-2 rounded-full overflow-hidden border border-[var(--border-color)]/40">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (myBusinesses.length / 25) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-bold mt-1">
                {referralSummary.isUnlocked
                  ? 'تم فتح كود الدعوة وبناء فريق المبيعات بنجاح 🚀'
                  : `متبقي ${Math.max(0, 25 - myBusinesses.length)} نشاط لفتح كود الدعوة والعمولات الإضافية`}
              </p>
            </div>
          </div>

          {/* Motivational Promo Card for New Reps without referral code */}
          {!referralSummary.isUnlocked && (
            <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-xs shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-lg">
                🎁
              </div>
              <div className="min-w-0 flex-1 text-[11px] text-[var(--text-secondary)] font-bold leading-relaxed">
                <strong className="text-amber-600 dark:text-amber-400 block text-xs">مكافآت برنامج الإحالة الميداني:</strong>
                سارع بتسجيل أنشطتك التجارية الأولى لتفعيل كود الإحالة الخاص بك تلقائياً ودعوة أصدقائك المناديب للحصول على مكافآت وعمولات إضافية مستمرة!
              </div>
            </div>
          )}
        </div>

        {/* Subtle Pending Verification Commission note if any */}
        {settlement.pendingVerificationCommission > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200 p-2.5 px-3.5 rounded-2xl text-xs font-bold flex flex-wrap items-center justify-between gap-2">
            <span>
              ⏳ عمولات منتظرة: <strong className="font-mono text-blue-600 dark:text-blue-300">{settlement.pendingVerificationCommission} ج.م</strong> على ({settlement.pendingVerificationCount} نشاط قيد التوثيق أو الدفع لاحقاً).
            </span>
            <span className="text-[10px] bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-bold">
              تتاح فور اعتماد التوثيق
            </span>
          </div>
        )}
      </div>

      {/* Referral System Box (ONLY SHOWN IF UNLOCKED) */}
      {referralSummary.isUnlocked && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-md transition-colors duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-[var(--text-primary)]">
                  برنامج الإحالة وبناء فريق المبيعات
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] font-medium">
                  دعوة المناديب والحصول على مكافآت وعمولات إضافية (3% - 7%)
                </p>
              </div>
            </div>

            <span className="text-[11px] font-black px-3 py-1 rounded-full badge-success">
              ✨ كود الإحالة مفعل ومفتوح
            </span>
          </div>

          {/* Referral Active Box */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">كود الدعوة والإحالة الخاص بك:</span>
                <span className="text-lg font-mono font-black text-[var(--text-primary)] tracking-wider">
                  {referralCode}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="flex-1 sm:flex-none bg-[var(--input-bg)] hover:bg-amber-500/20 text-[var(--text-primary)] border border-[var(--border-color)] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{copiedCode ? 'تم النسخ' : 'نسخ الكود'}</span>
                </button>

                <a
                  href={whatsappInviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-sm cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>مشاركة عبر واتساب</span>
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

          {/* DETAILED INVITED REPRESENTATIVES LIST */}
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
                {referralSummary.invitedRepsDetails.map(({ rep: invRep, bizCount, totalRevenue: _totalRevenue, currentRate, commissionEarned, isMission1Complete, remainingForMission1 }) => {
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
      )}

      {/* Payout Request Modal */}
      {onRequestPayout && (
        <RequestPayoutModal
          rep={rep}
          availableBalance={availableBalance}
          isOpen={showPayoutModal}
          onClose={() => setShowPayoutModal(false)}
          onSubmitPayout={onRequestPayout}
        />
      )}

      {/* MODAL: Platform Remittance Details Modal rendered via portal */}
      {showRemitInfoModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
            <div className="bg-[var(--bg-card)] border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-xs text-[var(--text-primary)] shadow-2xl relative animate-fade-in my-auto max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <h4 className="font-black text-base text-[var(--text-primary)]">إشعار وتوريد سداد حساب المنصة</h4>
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
                      <span className="text-[var(--text-muted)] font-bold">المبلغ المسدد قيد المراجعة:</span>
                      <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                        {pendingRemittance.amount.toLocaleString()} ج.م
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
                      <span className="text-[var(--text-muted)] font-bold">وسيلة التحويل المستخدمة:</span>
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
                        <span className="text-[var(--text-muted)] font-bold">رقم العملية / الحوالة:</span>
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
                            loading="lazy"
                            decoding="async"
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
                  <h4 className="font-black text-base text-emerald-600 dark:text-emerald-400">تم إرسال إشعار وإيصال السداد بنجاح!</h4>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                    سيقوم مسؤولو الإدارة والمالية بمراجعة صورة الإيصال وتأكيد المعاملة وتصفية ذمتك المالية فوراً.
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
                      يرجى تحويل المبلغ عبر الحسابات المعتمدة أدناه ثم رفع لقطة شاشة أو صورة الإيصال لإرسالها للإدارة للتدقيق والاعتماد.
                    </p>
                  </div>

                  {/* Accounts to Transfer to */}
                  <div className="space-y-2">
                    <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-purple-500/30 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block font-bold">معرف إنستاباي المعتمد (InstaPay):</span>
                        <span className="text-purple-600 dark:text-purple-300 font-mono font-black text-sm dir-ltr text-right inline-block">@daz31181</span>
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
                        <span className="text-[10px] text-[var(--text-muted)] block font-bold">محفظة فودافون كاش الرسمية:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm dir-ltr text-right inline-block">01143888355</span>
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
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">وسيلة التحويل المستخدمة:</label>
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
                      <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">رقم العملية / الحوالة (اختياري):</label>
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
                            loading="lazy"
                            decoding="async"
                            className="w-16 h-16 object-cover rounded-xl border border-slate-700 bg-slate-900"
                          />
                          <div>
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>تم إرفاق صورة الإيصال</span>
                            </span>
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">جاهز للإرسال والمراجعة</p>
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
                            <span className="text-xs text-amber-500 font-bold">جارٍ معالجة وضغط الصورة...</span>
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
    </div>
  );
};
