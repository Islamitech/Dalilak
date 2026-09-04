import React, { useState } from 'react';
import { Representative, User, Business, PayoutRequest } from '../types';
import { calculateRepSettlement } from '../utils/commission';
import { getRepReferralSummary, getRepReferralCode } from '../utils/referral';
import { generateQrDataUrl } from '../utils/qrGenerator';
import { DocViewerModal, DocType } from './DocViewerModal';
import { UserAvatar } from './UserAvatar';
import { Logo } from './Logo';
import { RequestPayoutModal } from './RequestPayoutModal';
import { RepActivitiesTab } from './rep-profile/RepActivitiesTab';
import { RepIdCardTab } from './rep-profile/RepIdCardTab';
import { RepFinanceTab } from './rep-profile/RepFinanceTab';
import { RepReferralTab } from './rep-profile/RepReferralTab';
import { RepEditProfileModal } from './rep-profile/RepEditProfileModal';
import {
  ShieldCheck,
  MapPin,
  FileText,
  CreditCard,
  CheckCircle2,
  LogOut,
  Edit3,
  Percent,
  Copy,
  Check,
  Users,
  Gift,
  IdCard,
  Phone,
  X,
} from 'lucide-react';

interface RepProfileProps {
  user: User;
  rep: Representative;
  businessesCount: number;
  totalRevenue: number;
  totalCommission: number;
  allReps?: Representative[];
  allBusinesses?: Business[];
  payoutRequests?: PayoutRequest[];
  initialTab?: 'id_docs' | 'finance' | 'activities' | 'referral';
  onLogout: () => void;
  onUpdateRep: (updatedRep: Representative) => void;
  onRequestPayout?: (payout: PayoutRequest) => void;
  isExternalView?: boolean;
}

export const RepProfile: React.FC<RepProfileProps> = ({
  user,
  rep,
  businessesCount,
  totalRevenue: _totalRevenue,
  totalCommission: _totalCommission,
  allReps = [],
  allBusinesses = [],
  payoutRequests = [],
  initialTab,
  onLogout,
  onUpdateRep,
  onRequestPayout,
  isExternalView = false,
}) => {
  // Navigation Tabs for Profile
  const [activeTab, setActiveTab] = useState<'id_docs' | 'finance' | 'activities' | 'referral'>(initialTab || 'activities');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedDocType, setSelectedDocType] = useState<DocType | null>(null);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const commissionPercentage = rep.commissionRate || 42.86;
  const referralSummary = getRepReferralSummary(rep, allReps, allBusinesses);
  const referralCode = getRepReferralCode(rep);

  const repBusinesses = (allBusinesses && allBusinesses.length > 0)
    ? allBusinesses.filter((b) => b.repId === rep.id || (rep.name && b.repName === rep.name))
    : [];

  const settlement = calculateRepSettlement(
    rep.id,
    repBusinesses,
    commissionPercentage,
    payoutRequests || [],
    referralSummary.totalNetEarnings
  );

  const pendingRemittance = payoutRequests?.find(
    (p) => p.repId === rep.id && p.type === 'remittance' && p.status === 'pending'
  );
  const pendingPayout = payoutRequests?.find(
    (p) => p.repId === rep.id && p.type !== 'remittance' && p.status === 'pending'
  );
  const myPayouts = (payoutRequests || []).filter((p) => p.repId === rep.id);

  const repMonthlyProfits = React.useMemo(() => {
    const map = new Map<string, {
      monthKey: string;
      monthLabel: string;
      totalSales: number;
      earnedCommission: number;
      payoutsReceived: number;
      verifiedBiz: number;
    }>();

    repBusinesses.forEach((b) => {
      const d = b.createdDate ? new Date(b.createdDate) : new Date();
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });

      if (!map.has(monthKey)) {
        map.set(monthKey, {
          monthKey,
          monthLabel,
          totalSales: 0,
          earnedCommission: 0,
          payoutsReceived: 0,
          verifiedBiz: 0,
        });
      }
      const m = map.get(monthKey)!;
      m.totalSales += b.packagePrice || 250;
      if (b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced') {
        m.verifiedBiz += 1;
      }
      const paid = b.amountPaid || 0;
      const comm = Math.round((paid * commissionPercentage) / 100);
      m.earnedCommission += comm;
    });

    (myPayouts || []).forEach((p) => {
      if (p.status === 'approved' && p.type !== 'remittance') {
        const d = p.requestDate ? new Date(p.requestDate) : new Date();
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (map.has(monthKey)) {
          map.get(monthKey)!.payoutsReceived += p.amount;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [repBusinesses, myPayouts, commissionPercentage]);

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const platformDomain = typeof window !== 'undefined' && window.location.origin.includes('localhost') ? window.location.origin : 'https://www.dalilaak.com';
  const inviteMessage = encodeURIComponent(
    `فرصة عمل استثنائية! انضم الآن إلى فريق مناديب منصة دليلك وحقق دخلاً ممتازاً مع تدريب كامل وعمولات فورية تصل إلى 42.8% على كل توثيق تجاري. سجل باستخدام كود الدعوة المعتمد الخاص بي: ${referralCode} عبر الرابط: ${platformDomain}/?ref=${referralCode}`
  );
  const whatsappInviteUrl = `https://wa.me/?text=${inviteMessage}`;

  const repCode = `REP-2026-${rep.id.replace(/\D/g, '') || '084'}`;
  const qrUrl = `${platformDomain}/?view=rep&id=${rep.id}`;
  const qrImageUrl = generateQrDataUrl(qrUrl, 250);

    if (isExternalView) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-amber-950/70 to-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-6 text-white transform hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-4">
            <div className="flex items-center gap-2">
              <Logo size="sm" variant="icon" />
              <h3 className="font-black text-sm text-white">بطاقة التكليف الميداني الرقمية</h3>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30 shadow-sm flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>معتمد رسمياً</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-950/80 p-5 rounded-2xl border border-amber-500/30 shadow-inner">
            <img src={qrImageUrl} alt="QR Code" className="w-28 h-28 rounded-2xl border border-amber-500/50 bg-white p-2 shrink-0 shadow-lg" />
            <div className="space-y-1.5 text-center sm:text-right w-full">
              <p className="font-black text-amber-300 text-xl">{rep.name}</p>
              <p className="text-slate-300 font-bold text-sm">{rep.roleTitle || 'مندوب مبيعات وتوثيق ميداني'}</p>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-400 text-xs mt-1">
                <MapPin className="w-4 h-4" />
                <span>نطاق العمل: {rep.governorate}</span>
              </div>
              <p className="text-xs text-emerald-400 font-black dir-ltr sm:text-right pt-2 border-t border-slate-800 mt-2">ID: {repCode}</p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-200 text-center font-bold leading-relaxed shadow-sm">
            يسمح لحامل هذه البطاقة الرسمية بتمثيل منصة دليلك في المعاينات الميدانية وتوثيق الأنشطة وإصدار الفواتير المعتمدة.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-24 tab-content-enter">
      {/* Success Notification Banner */}
      {updateSuccess && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>تم استيفاء الشروط والضوابط وتحديث بيانات المندوب بنجاح في المنظومة الرسمية!</span>
          </div>
          <button onClick={() => setUpdateSuccess(false)} className="cursor-pointer">✕</button>
        </div>
      )}

      {/* 🌟 1. EXECUTIVE PROFILE HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/80 to-slate-900 border border-amber-500/40 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
          <div className="relative group shrink-0">
            <UserAvatar
              avatar={rep.avatar}
              name={rep.name}
              role={rep.role}
              avatarStatus={rep.avatarStatus}
              size="lg"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 z-10" title="نشط ومصرح" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-xl font-black text-white truncate">{rep.name}</h2>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>مندوب معتمد 2026</span>
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 font-medium">
              {rep.roleTitle || 'مندوب مبيعات وتوثيق ميداني'} • نطاق محافظة {rep.governorate}
            </p>

            {/* Meta tags as clean responsive pills */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-mono text-amber-300 font-bold mt-2">
              <span className="bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-white/10">
                كود: {repCode}
              </span>
              <span className="bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-lg border border-amber-500/40 font-sans text-[10px] sm:text-[11px] font-bold flex items-center gap-1 shadow-xs">
                <Percent className="w-3 h-3 text-amber-400" />
                <span>نسبة العمولة: {commissionPercentage}%</span>
              </span>
              <span className="bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-white/10">
                الرقم القومي: {rep.nationalId || '—'}
              </span>
              <span className="bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-white/10 flex items-center gap-1">
                هاتف: <span dir="ltr">{rep.phone}</span>
              </span>
              {rep.phoneStatus === 'pending_approval' && rep.pendingPhone && (
                <span className="bg-amber-500/25 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/40 font-sans text-[10px] font-bold">
                  ⏳ قيد تعديل إلى (<span dir="ltr">{rep.pendingPhone}</span>)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-white/10 sm:border-t-0 shrink-0">
          <button
            onClick={() => {
              setShowEditModal(true);
            }}
            className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2 sm:py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-4 h-4 stroke-[2.5]" />
            <span>تعديل البيانات</span>
          </button>

          <button
            onClick={onLogout}
            className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-600 dark:text-rose-300 font-bold text-xs px-3.5 py-2 sm:py-2.5 rounded-xl border border-rose-500/30 flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* 🧭 2. SUB-NAVIGATION TABS BAR (Mobile-optimized) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-1 rounded-2xl flex items-center gap-1 shadow-sm text-xs font-bold overflow-x-auto scrollbar-none snap-x">
        <button
          type="button"
          onClick={() => setActiveTab('activities')}
          className={`flex-1 min-w-[110px] sm:min-w-[130px] py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap snap-start ${
            activeTab === 'activities'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>الأنشطة المسجلة ({repBusinesses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('finance')}
          className={`flex-1 min-w-[110px] sm:min-w-[130px] py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap snap-start ${
            activeTab === 'finance'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>كشف الحساب والعمولات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('referral')}
          className={`flex-1 min-w-[110px] sm:min-w-[130px] py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap snap-start ${
            activeTab === 'referral'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
          }`}
        >
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>برنامج الإحالة ({referralSummary.totalInvitedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('id_docs')}
          className={`flex-1 min-w-[110px] sm:min-w-[130px] py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap snap-start ${
            activeTab === 'id_docs'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
          }`}
        >
          <IdCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>بطاقة التكليف والوثائق</span>
        </button>
      </div>

      {/* 📋 TAB: REGISTERED FIELD ACTIVITIES */}
      {activeTab === 'activities' && (
        <RepActivitiesTab
          repBusinesses={repBusinesses}
          commissionPercentage={commissionPercentage}
        />
      )}

      {/* 🪪 TAB: DIGITAL FIELD ID CARD & OFFICIAL DOCUMENTS */}
      {activeTab === 'id_docs' && (
        <RepIdCardTab
          rep={rep}
          qrImageUrl={qrImageUrl}
          repCode={repCode}
          commissionPercentage={commissionPercentage}
          onSelectDocType={setSelectedDocType}
        />
      )}

      {/* 💳 TAB: FINANCIAL HUB, CASH COLLECTION & WALLETS */}
      {activeTab === 'finance' && (
        <RepFinanceTab
          rep={rep}
          commissionPercentage={commissionPercentage}
          settlement={settlement}
          pendingRemittance={pendingRemittance}
          pendingPayout={pendingPayout}
          myPayouts={myPayouts}
          repBusinesses={repBusinesses}
          businessesCount={businessesCount}
          referralSummary={referralSummary}
          referralCode={referralCode}
          repMonthlyProfits={repMonthlyProfits}
          onRequestPayout={onRequestPayout}
          onOpenPayoutModal={() => setShowPayoutModal(true)}
        />
      )}

      {/* 👥 TAB: TEAM REFERRAL NETWORK & MISSIONS */}
      {activeTab === 'referral' && (
        <RepReferralTab
          referralSummary={referralSummary}
          referralCode={referralCode}
          businessesCount={businessesCount}
          whatsappInviteUrl={whatsappInviteUrl}
          handleCopyReferral={handleCopyReferral}
          copiedCode={copiedCode}
        />
      )}

      {/* ✏️ MODAL: EDIT REP PROFILE */}
      <RepEditProfileModal
        rep={rep}
        user={user}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdateRep={onUpdateRep}
        onSuccess={() => {
          setUpdateSuccess(true);
          setTimeout(() => setUpdateSuccess(false), 3000);
        }}
      />

      {/* MODAL: DOCUMENT VIEWER MODAL */}
      <DocViewerModal
        docType={selectedDocType}
        rep={rep}
        onClose={() => setSelectedDocType(null)}
      />

      {/* MODAL: REQUEST PAYOUT MODAL */}
      {onRequestPayout && (
        <RequestPayoutModal
          rep={rep}
          availableBalance={settlement.withdrawableBalance}
          isOpen={showPayoutModal}
          onClose={() => setShowPayoutModal(false)}
          onSubmitPayout={onRequestPayout}
        />
      )}
    </div>
  );
};
