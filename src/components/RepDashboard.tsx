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
import { RepAccountDossierModal } from './RepAccountDossierModal';
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
  History as HistoryIcon,
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
  const [showDossierModal, setShowDossierModal] = useState(false);
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
  const pendingPayout = myPayouts.find((p) => p.type !== 'remittance' && p.status === 'pending');
  const pendingRemittance = myPayouts.find(
    (p) => p.repId === rep.id && p.type === 'remittance' && p.status === 'pending'
  );

  const showFinancialSection =
    settlement.withdrawableBalance > 0 ||
    settlement.isDebtToPlatform ||
    settlement.totalEarnedCommission > 0 ||
    settlement.pendingVerificationCommission > 0 ||
    myPayouts.length > 0;

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
      console.error('Error submitting remittance:', err);
      alert('حدث خطأ أثناء إرسال إشعار السداد، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmittingRemit(false);
    }
  };

  const whatsappInviteUrl = `https://wa.me/?text=${encodeURIComponent(
    `مرحباً، انضم الآن كمنسق ومندوب ميداني معتمد في منصة دليلك عبر كود الدعوة الخاص بي: ${referralCode}\nرابط التسجيل: ${window.location.origin}`
  )}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3.5">
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
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>نسبة العمولة المعتمدة:</span>
              <strong className="text-amber-700 dark:text-amber-300 font-mono text-sm">{repRate}%</strong>
              <span className="text-[10px] text-[var(--text-muted)]">• عمولة لكل نشاط</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowDossierModal(true)}
            className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-300 font-black text-xs px-4 py-3 rounded-2xl border border-amber-500/40 shadow-xs flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer shrink-0"
            title="فتح الملف المحاسبي الشامل، كشف الحسابات النقدية، وقائمة الأنشطة وشبكة الإحالة"
          >
            <FileCheck className="w-4 h-4 text-amber-500" />
            <span>الملف المحاسبي والأنشطة</span>
          </button>

          <button
            onClick={onAddNewClick}
            className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>تسجيل وتوثيق نشاط جديد</span>
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
                <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-mono font-bold">1</span>
                <span>الزيارة والاتفاق الميداني</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                توجّه للمحل التجاري في منطقتك واشرح لصاحبه مزايا التوثيق الرقمي وإدراجه في الخرائط والدليل.
              </p>
            </div>

            <div className="bg-[var(--bg-card)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-black text-[var(--text-primary)]">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-mono font-bold">2</span>
                <span>تسجيل وتصوير النشاط</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                اضغط على زر التسجيل، التقط صور واجهة المحل، ثبّت موقعه بدقة عبر الـ GPS، واختر الباقة المناسبة.
              </p>
            </div>

            <div className="bg-[var(--bg-card)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-black text-[var(--text-primary)]">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-mono font-bold">3</span>
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

      {/* ── SECTION 1: MASTER FINANCIAL & SETTLEMENT ENGINE (SHOWN ONLY WHEN RELEVANT) ── */}
      {showFinancialSection && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-sm transition-colors duration-300">
        {/* Card Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              💳
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
          ) : pendingPayout ? (
            <button
              onClick={() => setShowPayoutModal(true)}
              className="w-full sm:w-auto bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-black text-xs px-4 py-2.5 rounded-xl border border-amber-500/40 shadow flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95 shrink-0"
            >
              <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>طلب السحب قيد المراجعة ({pendingPayout.amount.toLocaleString()} ج.م) ⏳</span>
            </button>
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

        {/* Pending Payout / Remittance Live Banner */}
        {pendingPayout && (
          <div className="bg-amber-500/15 border border-amber-500/35 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/25 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 animate-pulse text-amber-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-[var(--text-primary)]">لديك طلب سحب عمولة مقدم قيد المراجعة والتحويل:</span>
                  <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                    {pendingPayout.amount.toLocaleString()} ج.م
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  وسيلة التحويل: <strong className="text-[var(--text-primary)]">{PAYOUT_METHOD_LABELS[pendingPayout.method]}</strong> (<span className="font-mono">{pendingPayout.accountDetails}</span>) • تاريخ الطلب: {new Date(pendingPayout.requestDate).toLocaleString('ar-EG')}
                </p>
              </div>
            </div>
            <span className="badge-warning text-[10px] font-black px-3 py-1 rounded-full shrink-0">
              قيد المراجعة ⏳
            </span>
          </div>
        )}

        {pendingRemittance && (
          <div className="bg-blue-500/15 border border-blue-500/35 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/25 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 animate-pulse text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-[var(--text-primary)]">إشعار سداد وتوريد مستحقات المنصة قيد المراجعة:</span>
                  <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                    {pendingRemittance.amount.toLocaleString()} ج.م
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  تم إرسال إيصال السداد للإدارة وجاري التدقيق لتصفية حسابك.
                </p>
              </div>
            </div>
            <span className="bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-black px-3 py-1 rounded-full border border-blue-500/30 shrink-0">
              قيد التدقيق ⏳
            </span>
          </div>
        )}

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
      )}

      {/* ── SECTION 2: 📋 PAYOUTS & REMITTANCES HISTORY & TRACKER ────── */}
      {myPayouts.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-sm transition-colors duration-300">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <HistoryIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
                <span>سجل ومتابعة طلبات سحب العمولات والتوريد</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--input-bg)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                  {myPayouts.length} عملية
                </span>
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">
                متابعة حالة طلبات سحب الأرباح والحوالات المنفذة أو المرفوضة
              </p>
            </div>
          </div>
        </div>

        {myPayouts.length > 0 ? (
          <div className="space-y-2.5">
            {myPayouts.map((payout) => {
              const isRemit = payout.type === 'remittance';
              const isPending = payout.status === 'pending';
              const isApproved = payout.status === 'approved';
              const isRejected = payout.status === 'rejected';

              return (
                <div
                  key={payout.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isPending
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : isApproved
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : 'bg-rose-500/5 border-rose-500/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                        isRemit ? 'bg-blue-500/15 text-blue-600' : 'bg-emerald-500/15 text-emerald-600'
                      }`}>
                        {isRemit ? <CreditCard className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-xs text-[var(--text-primary)]">
                            {isRemit ? 'إشعار توريد وسداد مستحقات المنصة' : 'طلب سحب عمولة أرباح'}
                          </span>
                          <span className="font-mono font-black text-xs text-[var(--text-primary)]">
                            {payout.amount.toLocaleString()} ج.م
                          </span>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {PAYOUT_METHOD_LABELS[payout.method]} • {payout.accountDetails} • {new Date(payout.requestDate).toLocaleString('ar-EG')}
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
          <div className="border border-dashed border-[var(--border-color)] rounded-2xl p-5 text-center text-xs text-[var(--text-muted)] font-bold bg-[var(--input-bg)]/40 space-y-1">
            <p className="text-[var(--text-primary)] font-black">لا توجد طلبات سحب سابقة مسجلة</p>
            <p className="text-[11px]">عندما تقوم بسحب أرباحك أو توريد مستحقات المنصة، سيظهر سجل كامل للطلبات وحالتها وملاحظات الإدارة هنا فورياً.</p>
          </div>
        )}
      </div>
      )}

      {/* Referral System Box (Unlocked or Milestone progress, shown once rep has registered activities) */}
      {myBusinesses.length > 0 && (
        referralSummary.isUnlocked ? (
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
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-3 shadow-md transition-colors duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-500/15 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold">
                <Lock className="w-4 h-4" />
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

            <span className="text-[11px] font-black px-3 py-1 rounded-full badge-warning flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>مغلق حتى إتمام 25 نشاطاً</span>
            </span>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--text-primary)]">شرط فتح نظام الإحالة وظهور الكود:</span>
              <span className="font-black font-mono text-amber-700 dark:text-amber-400">
                {myBusinesses.length} / 25 نشاط ({Math.min(100, Math.round((myBusinesses.length / 25) * 100))}%)
              </span>
            </div>

            <div className="w-full bg-[var(--input-bg)] h-2.5 rounded-full overflow-hidden border border-[var(--border-color)]">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (myBusinesses.length / 25) * 100)}%` }}
              />
            </div>

            <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed">
              وفقاً لنظام العمل المعتمد، لا يمتلك المندوب نظام إحالة ولا يظهر كود الإحالة الخاص به إلا بعد تسجيل <strong className="text-[var(--text-primary)]">25 نشاطاً ميدانياً</strong> معتمداً في رصيده. متبقي لك <strong className="text-amber-600 dark:text-amber-400">{Math.max(0, 25 - myBusinesses.length)}</strong> نشاط لفتح النظام وظهور كودك المعتمد تلقائياً.
            </p>
          </div>
        </div>
      )
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
