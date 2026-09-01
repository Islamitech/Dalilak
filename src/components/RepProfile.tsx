import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Representative, User, Business, PayoutRequest, PayoutMethod } from '../types';
import { 
  calculateRepSettlement,
  getBusinessPaymentLabel,
  PAYOUT_METHOD_LABELS
} from '../utils/commission';
import { compressImageFile } from '../utils/imageCompressor';
import { getRepReferralSummary, getRepReferralCode } from '../utils/referral';
import { DocViewerModal, DocType } from './DocViewerModal';
import { UserAvatar } from './UserAvatar';
import { Logo } from './Logo';
import { RequestPayoutModal } from './RequestPayoutModal';
import {
  User as UserIcon,
  ShieldCheck,
  MapPin,
  FileText,
  CreditCard,
  Lock,
  Download,
  Printer,
  CheckCircle2,
  KeyRound,
  LogOut,
  Edit3,
  Save,
  AlertCircle,
  Percent,
  Camera,
  Share2,
  Copy,
  Check,
  Sparkles,
  Users,
  Gift,
  ArrowDownLeft,
  IdCard,
  Trash2,
  Loader2,
  FileCheck,
  Send,
  Clock,
  History as HistoryIcon,
  Calendar,
  TrendingUp,
  X
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
  onLogout,
  onUpdateRep,
  onRequestPayout,
  isExternalView = false,
}) => {
  // Navigation Tabs for Profile
  const [activeTab, setActiveTab] = useState<'id_docs' | 'finance' | 'activities' | 'referral'>('activities');
  const [bizSearch, setBizSearch] = useState('');
  const [bizFilter, setBizFilter] = useState<'all' | 'verified' | 'pending' | 'cash' | 'online' | 'exempt'>('all');

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [payoutVoda, setPayoutVoda] = useState(localStorage.getItem(`dalelak_payout_voda_${rep.id}`) || rep.phone);
  const [payoutInsta, setPayoutInsta] = useState(localStorage.getItem(`dalelak_payout_insta_${rep.id}`) || '');
  const [savedPayoutNotice, setSavedPayoutNotice] = useState(false);

  const isAdmin = user.role === 'admin' || user.role === 'supervisor';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState<boolean>(false);
  const [passwordNotice, setPasswordNotice] = useState<boolean>(false);

  // Dynamic Percentage Commission calculation
  const commissionPercentage = rep.commissionRate || 42.86;

  // Referral Network Summary
  const referralSummary = getRepReferralSummary(rep, allReps, allBusinesses);
  const referralCode = getRepReferralCode(rep);

  // Exact businesses for this rep
  const repBusinesses = (allBusinesses && allBusinesses.length > 0)
    ? allBusinesses.filter((b) => b.repId === rep.id || b.repName === rep.name || (rep.phone && b.repId === rep.phone))
    : [];

  // Comprehensive Financial Settlement (Cash Collected vs Commission Earned)
  const settlement = calculateRepSettlement(
    rep.id,
    repBusinesses,
    commissionPercentage,
    payoutRequests,
    referralSummary.totalNetEarnings
  );

  const pendingRemittance = payoutRequests?.find(
    (p) => p.repId === rep.id && p.type === 'remittance' && p.status === 'pending'
  );
  const pendingPayout = payoutRequests?.find(
    (p) => p.repId === rep.id && p.type !== 'remittance' && p.status === 'pending'
  );
  const myPayouts = (payoutRequests || []).filter((p) => p.repId === rep.id);

  const [showAnnualStatementModal, setShowAnnualStatementModal] = useState<boolean>(false);

  // ── MONTHLY PROFITS & EARNINGS TRACKER ──
  const repMonthlyProfits = React.useMemo(() => {
    const map = new Map<string, {
      monthKey: string;
      monthLabel: string;
      totalBiz: number;
      verifiedBiz: number;
      totalSales: number;
      earnedCommission: number;
      payoutsReceived: number;
    }>();

    repBusinesses.forEach((b) => {
      const d = b.createdDate ? new Date(b.createdDate) : new Date();
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });

      if (!map.has(monthKey)) {
        map.set(monthKey, {
          monthKey,
          monthLabel,
          totalBiz: 0,
          verifiedBiz: 0,
          totalSales: 0,
          earnedCommission: 0,
          payoutsReceived: 0,
        });
      }

      const m = map.get(monthKey)!;
      m.totalBiz += 1;
      if (b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced') {
        m.verifiedBiz += 1;
      }
      if (!b.isFeeExempt && (b.packagePrice || 0) > 0) {
        const paid = b.amountPaid || 0;
        const comm = Math.round((paid * commissionPercentage) / 100);
        m.totalSales += paid;
        m.earnedCommission += comm;
      }
    });

    (myPayouts || []).forEach((p) => {
      if (p.status === 'approved' && (!p.type || p.type === 'payout')) {
        const d = p.requestDate ? new Date(p.requestDate) : new Date();
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (map.has(monthKey)) {
          map.get(monthKey)!.payoutsReceived += (Number(p.amount) || 0);
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [repBusinesses, myPayouts, commissionPercentage]);

  // Annual Totals
  const annualTotalSales = repMonthlyProfits.reduce((s, m) => s + m.totalSales, 0);
  const annualTotalEarnedComm = repMonthlyProfits.reduce((s, m) => s + m.earnedCommission, 0);
  const annualTotalDisbursed = repMonthlyProfits.reduce((s, m) => s + m.payoutsReceived, 0);
  const annualVerifiedBizCount = repMonthlyProfits.reduce((s, m) => s + m.verifiedBiz, 0);


  const [showBreakdownList, setShowBreakdownList] = useState(false);
  const [showRemitInfoModal, setShowRemitInfoModal] = useState(false);

  // Remittance Submission States
  const [remitMethod, setRemitMethod] = useState<PayoutMethod>('instapay');
  const [remitAccountDetails, setRemitAccountDetails] = useState('');
  const [remitTransactionRef, setRemitTransactionRef] = useState('');
  const [remitReceiptPhoto, setRemitReceiptPhoto] = useState('');
  const [isCompressingReceipt, setIsCompressingReceipt] = useState(false);
  const [isSubmittingRemit, setIsSubmittingRemit] = useState(false);
  const [remitSuccess, setRemitSuccess] = useState(false);

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

  const platformDomain = typeof window !== 'undefined' && window.location.origin.includes('localhost') ? window.location.origin : 'https://www.dalilaak.com';

  const inviteMessage = encodeURIComponent(
    `انضم الآن لمنظومة دليلك وسجل حسابك الميداني باستخدام كود الدعوة المعتمد: ${referralCode}\nرابط المنصة: https://www.dalilaak.com/`
  );
  const whatsappInviteUrl = `https://wa.me/?text=${inviteMessage}`;
  
  // Document Viewer Modal State
  const [selectedDocType, setSelectedDocType] = useState<DocType | null>(null);

  // Edit Profile Data Modal State
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(rep.name);
  const [editPhone, setEditPhone] = useState<string>(rep.phone);
  const [editEmail, setEditEmail] = useState<string>(rep.email);
  const [editAvatar, setEditAvatar] = useState<string>(rep.avatar || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);

  const repCode = `REP-2026-${rep.id.replace(/\D/g, '') || '084'}`;
  
  // Dynamic QR Code URL for the digital ID card
  const qrUrl = `${platformDomain}/?view=rep&id=${rep.id}`;
  const qrData = encodeURIComponent(qrUrl);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}`;

  // Handle Edit Profile Form Submission with Strict Egyptian Validation Rules
  const handleSaveProfileData = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Only validate name if user is admin editing it
    if (isAdmin) {
      if (!editName || editName.trim().length < 6) {
        setValidationError('يجب إدخال الاسم ثلاثي على الأقل (أكثر من 6 أحرف).');
        return;
      }
    }

    const phoneRegex = /^01[0125]\d{8}$/;
    if (!phoneRegex.test(editPhone)) {
      setValidationError('رقم الهاتف غير صحيح! يجب أن يكون رقم مصري يبدأ بـ 01 ومكون من 11 رقم بالضبط (مثال: 01012345678).');
      return;
    }

    if (!editEmail || !/\S+@\S+\.\S+/.test(editEmail)) {
      setValidationError('يرجى إدخال بريد إلكتروني صالح للدخول (مثال: name@example.com).');
      return;
    }

    // Password verification logic
    let shouldUpdatePassword = false;
    if (showPasswordChange || currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        setValidationError('لتغيير كلمة المرور، يجب إدخال كلمة المرور الحالية أولاً لتأكيد هويتك.');
        return;
      }
      if (rep.password && currentPassword !== rep.password) {
        setValidationError('كلمة المرور الحالية غير صحيحة! يرجى إدخال كلمة المرور الحالية بدقة.');
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        setValidationError('كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف أو أرقام.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setValidationError('كلمة المرور الجديدة غير متطابقة مع خانة التأكيد!');
        return;
      }
      shouldUpdatePassword = true;
    }

    const isNewAvatar = editAvatar !== rep.avatar && editAvatar.length > 0;
    const isNewPhone = editPhone.trim() !== rep.phone;

    let updatedPhone = rep.phone;
    let updatedPendingPhone = rep.pendingPhone;
    let updatedPhoneStatus = rep.phoneStatus || 'none';

    if (isNewPhone) {
      if (isAdmin) {
        // Admin can update phone directly
        updatedPhone = editPhone.trim();
        updatedPendingPhone = undefined;
        updatedPhoneStatus = 'approved';
      } else {
        // Rep update requires admin approval
        updatedPhone = rep.phone;
        updatedPendingPhone = editPhone.trim();
        updatedPhoneStatus = 'pending_approval';
      }
    }

    onUpdateRep({
      ...rep,
      name: isAdmin ? editName.trim() : rep.name,
      phone: updatedPhone,
      pendingPhone: updatedPendingPhone,
      phoneStatus: updatedPhoneStatus,
      email: editEmail.trim(),
      avatar: editAvatar || rep.avatar,
      avatarStatus: isNewAvatar ? 'pending_approval' : rep.avatarStatus || 'none',
      ...(shouldUpdatePassword ? { password: newPassword.trim() } : {}),
    });

    if (shouldUpdatePassword) {
      setPasswordNotice(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
      setTimeout(() => setPasswordNotice(false), 3000);
    }

    setUpdateSuccess(true);
    setTimeout(() => setUpdateSuccess(false), 3000);
    setShowEditModal(false);
  };

  const handleSavePayout = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(`dalelak_payout_voda_${rep.id}`, payoutVoda);
    localStorage.setItem(`dalelak_payout_insta_${rep.id}`, payoutInsta);
    setSavedPayoutNotice(true);
    setTimeout(() => setSavedPayoutNotice(false), 3000);
  };

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
              setEditName(rep.name);
              setEditPhone(rep.phone);
              setEditEmail(rep.email);
              setEditAvatar(rep.avatar || '');
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setShowPasswordChange(false);
              setValidationError(null);
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

      {/* ========================================================
          TAB: 📋 REGISTERED FIELD ACTIVITIES
          ======================================================== */}
      {activeTab === 'activities' && (
        <div className="space-y-4 animate-fade-in">
          {/* Header & KPI Summary */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 shadow-md space-y-3.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <span>سجل الأنشطة والمحلات المسجلة بواسطتك ({repBusinesses.length})</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  متابعة حالة التوثيق على خرائط جوجل وعمولات كل نشاط مسجل
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-xl border border-emerald-500/30">
                  {repBusinesses.filter(b => b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced').length} موثق رسمياً
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <input
                type="text"
                placeholder="بحث في أنشطتك بالاسم أو المدينة أو رقم الفاتورة..."
                value={bizSearch}
                onChange={(e) => setBizSearch(e.target.value)}
                className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
              />

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
                <button
                  type="button"
                  onClick={() => setBizFilter('all')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap ${bizFilter === 'all' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-[var(--input-bg)] text-[var(--text-muted)]'}`}
                >
                  الكل ({repBusinesses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBizFilter('verified')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap ${bizFilter === 'verified' ? 'bg-emerald-600 text-white font-black' : 'bg-[var(--input-bg)] text-[var(--text-muted)]'}`}
                >
                  🟢 موثق
                </button>
                <button
                  type="button"
                  onClick={() => setBizFilter('pending')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap ${bizFilter === 'pending' ? 'bg-amber-600 text-white font-black' : 'bg-[var(--input-bg)] text-[var(--text-muted)]'}`}
                >
                  ⏳ قيد التوثيق
                </button>
                <button
                  type="button"
                  onClick={() => setBizFilter('cash')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap ${bizFilter === 'cash' ? 'bg-blue-600 text-white font-black' : 'bg-[var(--input-bg)] text-[var(--text-muted)]'}`}
                >
                  💵 كاش باليد
                </button>
              </div>
            </div>

            {/* Activities Table */}
            {repBusinesses.length === 0 ? (
              <div className="p-8 text-center bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)] text-[var(--text-muted)] font-bold">
                لم تقم بتسجيل أي أنشطة بعد. اضغط على زر "تسجيل نشاط جديد" للبدء!
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
                <table className="w-full text-xs text-right border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-[var(--input-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold text-[11px]">
                      <th className="p-3">اسم النشاط والتصنيف</th>
                      <th className="p-3">تاريخ الإضافة</th>
                      <th className="p-3">الباقة والمبلغ</th>
                      <th className="p-3">طريقة السداد</th>
                      <th className="p-3">عمولتك المستحقة</th>
                      <th className="p-3">حالة التوثيق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {repBusinesses
                      .filter((biz) => {
                        const matchesSearch = !bizSearch.trim() || biz.nameAr?.toLowerCase().includes(bizSearch.toLowerCase()) || biz.city?.toLowerCase().includes(bizSearch.toLowerCase());
                        if (!matchesSearch) return false;
                        const isExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
                        const isVerified = biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced';
                        const isCash = !isExempt && (biz.cashCollectedByRep !== undefined ? (biz.cashCollectedByRep || 0) > 0 : biz.paymentMethod === 'cash_by_rep');
                        if (bizFilter === 'verified') return isVerified;
                        if (bizFilter === 'pending') return !isVerified;
                        if (bizFilter === 'cash') return isCash;
                        if (bizFilter === 'exempt') return isExempt;
                        return true;
                      })
                      .map((biz) => {
                        const isExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
                        const isVerified = biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced';
                        const isCash = !isExempt && (biz.cashCollectedByRep !== undefined ? (biz.cashCollectedByRep || 0) > 0 : biz.paymentMethod === 'cash_by_rep');
                        const paid = isExempt ? 0 : Number(biz.amountPaid) || 0;
                        const commEarned = isExempt ? 0 : Math.round((paid * commissionPercentage) / 100);

                        return (
                          <tr key={biz.id} className="hover:bg-amber-500/5 transition-colors">
                            <td className="p-3">
                              <p className="font-extrabold text-sm text-[var(--text-primary)]">{biz.nameAr}</p>
                              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">{biz.category} • {biz.city}</p>
                            </td>

                            <td className="p-3 text-[11px] font-mono text-[var(--text-muted)]">
                              {biz.createdDate ? new Date(biz.createdDate).toLocaleDateString('ar-EG') : '—'}
                            </td>

                            <td className="p-3 font-bold">
                              {isExempt ? (
                                <span className="text-teal-600 dark:text-teal-400 font-black">إدراج مجاني (0 ج)</span>
                              ) : (
                                <div>
                                  <span className="text-[var(--text-primary)]">{biz.packagePrice || 250} ج.م</span>
                                  <p className="text-[10px] text-emerald-600 font-black">مسدد: {paid} ج.م</p>
                                </div>
                              )}
                            </td>

                            <td className="p-3">
                              {isExempt ? (
                                <span className="text-[10px] font-bold text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded-md">معفى</span>
                              ) : isCash ? (
                                <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                                  💵 كاش بيدك ({paid} ج)
                                </span>
                              ) : paid > 0 ? (
                                <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/30">
                                  💳 تحويل للمنصة
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md">لم يدفع بعد</span>
                              )}
                            </td>

                            <td className="p-3 font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                              {isExempt ? '0 ج.م' : `${commEarned} ج.م`}
                            </td>

                            <td className="p-3">
                              {isVerified ? (
                                <span className="badge-success text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>موثق رسمياً ✅</span>
                                </span>
                              ) : (
                                <span className="badge-warning text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>قيد التوثيق ⏳</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 1: 🪪 DIGITAL FIELD ID CARD & OFFICIAL DOCUMENTS
          ======================================================== */}
      {activeTab === 'id_docs' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Official Digital Field ID Card */}
            <div className="bg-gradient-to-br from-slate-900 via-amber-950/70 to-slate-900 border border-amber-500/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-3.5 text-white">
              <div className="flex items-center justify-between border-b border-amber-500/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <Logo size="sm" variant="icon" />
                  <h3 className="font-black text-xs sm:text-sm text-white">بطاقة التكليف الميداني الذكية</h3>
                </div>
                <span className="text-[9px] sm:text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  صريحة وموثقة 2026
                </span>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 bg-slate-950/80 p-3 sm:p-4 rounded-2xl border border-amber-500/30 shadow-inner">
                <img src={qrImageUrl} alt="QR Code" className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl border border-amber-500/40 bg-white p-1 shrink-0" />
                <div className="space-y-0.5 sm:space-y-1 text-xs min-w-0 flex-1">
                  <p className="font-black text-amber-300 text-sm sm:text-base truncate">{rep.name}</p>
                  <p className="text-slate-200 font-bold text-[11px] sm:text-xs truncate">{rep.roleTitle || 'مندوب مبيعات وتوثيق ميداني'}</p>
                  <p className="text-slate-400 text-[10px] sm:text-[11px]">نطاق العمل: محافظة {rep.governorate}</p>
                  <p className="text-[11px] sm:text-xs text-emerald-400 font-mono font-black dir-ltr text-right pt-0.5">ID: {repCode}</p>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 sm:p-3 rounded-xl text-[10px] sm:text-[11px] text-amber-200 text-center font-bold leading-relaxed">
                يسمح لحامل هذه البطاقة الرسمية بتمثيل منصة دليلك وتسجيل المحلات وإصدار الفواتير الإلكترونية المعتمدة.
              </div>
            </div>

            {/* 2. Official Field Documents & Verification Letters */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 shadow-md flex flex-col justify-between space-y-3 transition-colors duration-300">
              <div className="border-b border-[var(--border-color)] pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <h3 className="font-black text-sm text-[var(--text-primary)]">التصاريح والمستندات الميدانية</h3>
                </div>
                <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                  جاهزة للطباعة
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Doc 1 */}
                <div className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)] flex items-center justify-between gap-2 hover:border-amber-500/30 transition-all">
                  <div>
                    <span className="font-bold text-[var(--text-primary)] block">خطاب التكليف والتصريح الميداني</span>
                    <span className="text-[10px] text-[var(--text-muted)]">مستند رسمي لإبرازه لأصحاب المحلات والجهات</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDocType('field_letter')}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>معاينة وطباعة</span>
                  </button>
                </div>

                {/* Doc 2 */}
                <div className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)] flex items-center justify-between gap-2 hover:border-amber-500/30 transition-all">
                  <div>
                    <span className="font-bold text-[var(--text-primary)] block">بطاقة الهوية والباركود الرقمي</span>
                    <span className="text-[10px] text-[var(--text-muted)]">كارت رقمي مشفر بكود QR للتحقق السريع</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDocType('digital_badge')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل الكارت</span>
                  </button>
                </div>

                {/* Doc 3 */}
                <div className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)] flex items-center justify-between gap-2 hover:border-amber-500/30 transition-all">
                  <div>
                    <span className="font-bold text-[var(--text-primary)] block">عقد ولائحة العمولات المعتمدة</span>
                    <span className="text-[10px] text-[var(--text-muted)]">لائحة حقوق المندوب والعمولة ({commissionPercentage}%)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDocType('rep_contract')}
                    className="bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-primary)] font-bold text-xs px-3 py-1.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span>مراجعة اللائحة</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: 💳 FINANCIAL HUB, CASH COLLECTION & WALLETS
          ======================================================== */}
      {activeTab === 'finance' && (
        <div className="space-y-4 animate-fade-in">
          {/* Main Financial Hub Card */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 shadow-md space-y-4 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                <h3 className="font-black text-sm text-[var(--text-primary)]">حساب العمولات والكاش الميداني والذمة المالية</h3>
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <Percent className="w-3 h-3 text-emerald-500" />
                <span>عمولتك المعتمدة {commissionPercentage}%</span>
              </span>
            </div>

            {/* SINGLE MASTER WALLET BOX */}
            <div className={`border-2 rounded-3xl p-5 space-y-3.5 shadow-sm transition-all ${
              settlement.isDebtToPlatform
                ? 'bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-950/20 border-amber-500/50'
                : settlement.withdrawableBalance > 0
                ? 'bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-950/20 border-emerald-500/50'
                : 'bg-[var(--input-bg)] border-[var(--border-color)]'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border-color)]/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                    settlement.isDebtToPlatform
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : settlement.withdrawableBalance > 0
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                  }`}>
                    {settlement.isDebtToPlatform ? '⚠️' : settlement.withdrawableBalance > 0 ? '💵' : '⚖️'}
                  </div>
                  <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                    <span>رصيد الحساب</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                      settlement.isDebtToPlatform
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30'
                        : settlement.withdrawableBalance > 0
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                        : 'text-[var(--text-muted)] bg-[var(--input-bg)] border-[var(--border-color)]'
                    }`}>
                      {settlement.isDebtToPlatform ? 'مستحق للمنصة' : settlement.withdrawableBalance > 0 ? 'أرباح متاحة' : 'مصفى'}
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
                    onClick={() => setShowPayoutModal(true)}
                    className="w-full sm:w-auto bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-black text-xs px-3.5 py-2 rounded-xl border border-amber-500/40 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                  >
                    <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>طلب السحب قيد المراجعة ({pendingPayout.amount.toLocaleString()} ج.م) ⏳</span>
                  </button>
                ) : onRequestPayout ? (
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(true)}
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
                        <span className="font-black text-[var(--text-primary)]">لديك طلب سحب عمولة مقدم قيد المراجعة:</span>
                        <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                          {pendingPayout.amount.toLocaleString()} ج.م
                        </span>
                      </div>
                      <p className="text-[10.5px] text-[var(--text-secondary)] mt-0.5">
                        طريقة التحويل: <strong>{PAYOUT_METHOD_LABELS[pendingPayout.method]}</strong> ({pendingPayout.accountDetails}) • تاريخ الطلب: {new Date(pendingPayout.requestDate).toLocaleString('ar-EG')}
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
                  <span className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    settlement.isDebtToPlatform
                      ? 'text-amber-600 dark:text-amber-400'
                      : settlement.withdrawableBalance > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-[var(--text-primary)]'
                  }`}>
                    {settlement.isDebtToPlatform
                      ? `-${settlement.debtToPlatformAmount.toLocaleString()}`
                      : `+${settlement.withdrawableBalance.toLocaleString()}`}
                  </span>
                  <span className="text-xs font-sans font-extrabold text-[var(--text-muted)]">ج.م</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  <span className="bg-[var(--bg-card)] border border-[var(--border-color)] px-2.5 py-1 rounded-xl text-[var(--text-secondary)]">
                    💵 كاش بيدك: <strong className="text-amber-600 dark:text-amber-400 font-mono">{settlement.totalCashInHand} ج</strong>
                  </span>
                  <span className="bg-[var(--bg-card)] border border-[var(--border-color)] px-2.5 py-1 rounded-xl text-[var(--text-secondary)]">
                    💎 عمولتك: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{settlement.totalEarnedCommission} ج</strong>
                  </span>
                  <span className="bg-[var(--bg-card)] border border-[var(--border-color)] px-2.5 py-1 rounded-xl text-[var(--text-secondary)]">
                    أنشطة: <strong className="text-[var(--text-primary)]">{repBusinesses.length || businessesCount}</strong>
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
                  <span>{showBreakdownList ? 'إخفاء كشف الأنشطة ▲' : 'عرض كشف حساب الأنشطة والتحصيلات ▼'}</span>
                </button>
              </div>

              {settlement.isDebtToPlatform ? (
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  قمت باستلام كاش نقدي من العملاء بقيمة <strong>{settlement.totalCashInHand} ج.م</strong>، تم احتساب عمولتك منها (<strong>{settlement.repShareFromCash} ج.م</strong>) واستلمتها بيدك فورياً، ويتبقى في ذمتك توريد <strong>{settlement.debtToPlatformAmount} ج.م</strong> لحساب المنصة (فودافون كاش أو إنستاباي) لتصفية الحساب.
                </p>
              ) : (
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  إجمالي عمولاتك المكتسبة من الأنشطة المسددة والإحالات <strong>{settlement.totalEarnedCommission} ج.م</strong>. رصيدك المتاح للسحب والتحويل لحسابك هو <strong>{settlement.withdrawableBalance} ج.م</strong>.
                </p>
              )}

              {/* Pending Verification Callout */}
              {settlement.pendingVerificationCommission > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 text-blue-900 dark:text-blue-200 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold mt-1">
                  <span>
                    ⏳ <strong>أنشطة قيد التوثيق أو الدفع لاحقاً:</strong> لديك <strong className="font-mono font-black">{settlement.pendingVerificationCommission} ج.م</strong> عمولة متوقعة على <strong>({settlement.pendingVerificationCount}) نشاط</strong>، لا تضاف للرصيد المتاح للسحب إلا بعد اكتمال التوثيق وسداد الفاتورة.
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
                {/* 1. TOP SUMMARY CARDS (Direct Activities vs Referral Commissions vs Referral Bonuses) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--text-muted)] font-bold block flex items-center gap-1">
                      <span>🏢</span> عمولات الأنشطة المباشرة ({commissionPercentage}%):
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                      +{Math.round(repBusinesses.reduce((s, b) => s + ((b.amountPaid || 0) * commissionPercentage) / 100, 0))} ج.م
                    </span>
                    <span className="text-[9.5px] text-[var(--text-muted)] block">({repBusinesses.length} نشاط مسجل)</span>
                  </div>

                  <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5">
                    <span className="text-[10px] text-amber-800 dark:text-amber-300 font-black block flex items-center gap-1">
                      <span>📈</span> عمولة شبكة الإحالات (3% - 7%):
                    </span>
                    <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400">
                      +{referralSummary.totalReferralCommission} ج.م
                    </span>
                    <span className="text-[9.5px] text-[var(--text-muted)] block">({referralSummary.totalInvitedCount} مندوب في شبكتك)</span>
                  </div>

                  <div className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-yellow-500/40 bg-yellow-500/10">
                    <span className="text-[10px] text-yellow-800 dark:text-yellow-300 font-black block flex items-center gap-1">
                      <span>🎁</span> مكافآت الإحالة (250 ج/10 أنشطة):
                    </span>
                    <span className="text-sm font-black font-mono text-yellow-600 dark:text-yellow-400">
                      +{referralSummary.totalGiftsEarned} ج.م
                    </span>
                    <span className="text-[9.5px] text-[var(--text-muted)] block">({referralSummary.qualifiedRepsCount} مندوب مؤهل للمكافأة)</span>
                  </div>
                </div>

                {/* 2. REFERRAL COMMISSIONS & BONUSES BREAKDOWN SECTION */}
                <div className="bg-gradient-to-r from-amber-500/10 via-[var(--bg-card)] to-yellow-500/10 border border-amber-500/30 rounded-2xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between font-black text-xs text-[var(--text-primary)] border-b border-amber-500/20 pb-2">
                    <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                      <Gift className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>كشف تفصيلي بعمولات ومكافآت الإحالة ({referralSummary.totalNetEarnings} ج.م):</span>
                    </div>
                    <span className="bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                      كودك: {referralCode}
                    </span>
                  </div>

                  {referralSummary.invitedRepsDetails.length === 0 ? (
                    <div className="text-center py-2 px-3 bg-[var(--bg-card)] rounded-xl border border-dashed border-[var(--border-color)]">
                      <p className="text-[11px] text-[var(--text-muted)] font-bold">
                        لم تقم بدعوة مناديب بعد. شارك كود الإحالة الخاص بك (<strong className="font-mono text-amber-500">{referralCode}</strong>) واكسب <strong>250 ج.م مكافأة هدية</strong> فور إكمال المندوب 10 أنشطة + <strong>عمولة مستمرة تصل إلى 7%</strong> من كافة مبيعاته للأبد!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {referralSummary.invitedRepsDetails.map(({ rep: invRep, bizCount, totalRevenue, currentRate, commissionEarned, isMission1Complete, remainingForMission1 }) => (
                        <div
                          key={invRep.id}
                          className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-[var(--text-primary)]">{invRep.name}</span>
                              <span className="text-[9.5px] text-[var(--text-muted)] font-mono">({invRep.phone})</span>
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
                              <span className="text-[9px] text-[var(--text-muted)] block font-sans font-bold">نسبة عمولتك:</span>
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
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. DIRECT FIELD BUSINESSES BREAKDOWN SECTION */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-black text-xs text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
                    <span>كشف تفصيلي بالأنشطة المحصلة والمنتظرة ({repBusinesses.length}):</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold">نسبة عمولة الأنشطة المباشرة: {commissionPercentage}%</span>
                  </div>

                  {repBusinesses.length === 0 ? (
                    <p className="text-[11px] text-[var(--text-muted)] text-center py-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                      لا توجد أنشطة تجارية مسجلة حتى الآن.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {repBusinesses.map((biz) => {
                        const isCash = biz.cashCollectedByRep !== undefined
                          ? (biz.cashCollectedByRep || 0) > 0
                          : biz.paymentMethod !== 'gateway_online' && (biz.amountPaid || 0) > 0;
                        const paid = biz.amountPaid || 0;
                        const isLive = biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced';
                        const comm = Math.round((paid * commissionPercentage) / 100);
                        const platShare = paid - comm;
                        const fullComm = Math.round(((biz.packagePrice || 250) * commissionPercentage) / 100);

                        return (
                          <div key={biz.id} className="bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[var(--text-primary)] block">{biz.nameAr}</span>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                  isLive ? 'badge-success' : 'badge-warning'
                                }`}>
                                  {isLive ? '✅ موثق' : '⏳ قيد المراجعة'}
                                </span>
                              </div>
                              <span className="text-[10px] text-[var(--text-muted)] mt-0.5 block font-bold">
                                باقة {biz.packageName} ({biz.packagePrice} ج.م) • {getBusinessPaymentLabel(biz).shortLabel}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
                              <div>
                                <span className="text-[9px] text-[var(--text-muted)] block font-sans">المحصل:</span>
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
                                  <span className="font-black text-rose-600 dark:text-rose-400">{platShare} ج.م</span>
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
                  <h4 className="font-black text-xs text-[var(--text-primary)]">وسائل استلام العمولات والأرباح</h4>
                  {savedPayoutNotice && (
                    <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>تم حفظ الوسائل بنجاح!</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--text-secondary)] font-bold mb-1">رقم فودافون كاش لتحويل العمولات:</label>
                    <input
                      type="text"
                      placeholder="01012345678"
                      value={payoutVoda}
                      onChange={(e) => setPayoutVoda(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-amber-500 font-bold rounded-xl p-2.5 font-mono dir-ltr text-right focus:outline-none focus:border-amber-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] font-bold mb-1">معرف إنستاباي (InstaPay Handle):</label>
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
                <span className="text-[10px] text-[var(--text-muted)] font-bold">
                  تحديث فوري ومباشر
                </span>
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
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                              isRemit ? 'bg-blue-500/15 text-blue-600' : 'bg-emerald-500/15 text-emerald-600'
                            }`}>
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
                            <span className="text-[9.5px] text-[var(--text-muted)] font-bold block">مبيعات الشهر</span>
                            <span className="font-black text-xs text-[var(--text-primary)] font-mono">
                              {m.totalSales.toLocaleString()} ج.م
                            </span>
                          </div>

                          <div className="bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)]">
                            <span className="text-[9.5px] text-[var(--text-muted)] font-bold block">العمولة المكتسبة</span>
                            <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                              {m.earnedCommission.toLocaleString()} ج.م
                            </span>
                          </div>

                          <div className="bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)]">
                            <span className="text-[9.5px] text-[var(--text-muted)] font-bold block">المصروف بحوالات</span>
                            <span className="font-black text-xs text-blue-600 dark:text-blue-400 font-mono">
                              {m.payoutsReceived.toLocaleString()} ج.م
                            </span>
                          </div>

                          <div className="bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)]">
                            <span className="text-[9.5px] text-[var(--text-muted)] font-bold block">المتبقي الصافي</span>
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
        </div>
      )}

      {/* ========================================================
          TAB 3: 👥 TEAM REFERRAL NETWORK & MISSIONS
          ======================================================== */}
      {activeTab === 'referral' && (
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

              <span className={`text-[11px] font-black px-3 py-1 rounded-full ${
                referralSummary.isUnlocked ? 'badge-success' : 'badge-warning'
              }`}>
                {referralSummary.isUnlocked ? '✨ كود الإحالة مفعل' : '🔒 قيد الفتح (المهمة 2)'}
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
                      يحصل المندوب الجديد على تفعيل الحساب وتتلقى أنت عمولة 3% - 7% على كل تسجيل يتم بواسطته.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleCopyReferral}
                      className="flex-1 sm:flex-none bg-[var(--bg-card)] hover:bg-amber-500/20 text-[var(--text-primary)] font-bold text-xs px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-amber-500" />}
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
                    <span className="text-[10px] text-[var(--text-muted)] font-bold block">إجمالي المناديب</span>
                    <span className="font-black text-lg text-[var(--text-primary)]">{referralSummary.totalInvitedCount}</span>
                  </div>

                  <div className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--text-muted)] font-bold block">مكتملي المهمة 1 (10+)</span>
                    <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">{referralSummary.qualifiedRepsCount}</span>
                  </div>

                  <div className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--text-muted)] font-bold block">مكافآت الدعوة</span>
                  <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">{referralSummary.totalReferralCommission.toLocaleString()} ج.م</span>
                  </div>
                </div>

                {/* Invited Reps List */}
                {referralSummary.invitedRepsDetails.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                    <h4 className="font-extrabold text-xs text-[var(--text-primary)]">أعضاء الفريق المنضمين عبر كودك:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {referralSummary.invitedRepsDetails.map(({ rep: invRep, bizCount, currentRate, commissionEarned }) => (
                        <div key={invRep.id} className="bg-[var(--bg-surface)] p-2.5 rounded-xl border border-[var(--border-color)] flex items-center justify-between gap-2">
                          <div>
                            <p className="font-black text-[var(--text-primary)]">{invRep.name}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">{invRep.governorate} • {bizCount} نشاط مسجل</p>
                          </div>
                          <div className="text-left">
                            <span className="badge-warning text-[9px] font-black px-2 py-0.5 rounded-full inline-block">عمولة {currentRate}%</span>
                            <p className="font-black text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">+{commissionEarned} ج.م</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)] text-xs text-[var(--text-secondary)] font-medium flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-500 shrink-0" />
                <p>
                  يفتح كود الإحالة الخاص بك تلقائياً بمجرد إتمام <strong>25 نشاطاً مسجلاً</strong> في الميدان (أنجزت حالياً {businessesCount} نشاط)، أو يمكن لمدير النظام تفعيله وتجاوز المهام مباشرة من لوحة الإدارة.
                </p>
              </div>
            )}
          </div>
        </div>
      )}


      {/* MODAL: Platform Remittance Details Modal */}
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

      {/* MODAL: EDIT REP PROFILE DATA WITH STRICT SECURITY & VALIDATION */}
      {showEditModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <form onSubmit={handleSaveProfileData} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 text-xs my-auto shadow-2xl text-[var(--text-primary)] transition-colors duration-300 max-h-[92vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-[var(--text-primary)]">تعديل بيانات الحساب</h3>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium">البيانات الرسمية مقفلة لحماية وتوثيق هوية المندوب</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowEditModal(false)} className="w-7 h-7 rounded-lg bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer transition-colors">✕</button>
              </div>

              {validationError && (
                <div className="bg-rose-500/15 border border-rose-500/40 text-rose-600 dark:text-rose-300 p-3 rounded-xl flex items-start gap-2 text-xs font-bold shrink-0">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="space-y-3.5 overflow-y-auto pr-1 flex-1">
                {/* Editable Fields (Phone & Email for Rep, Name for Admin) */}
                <div className="space-y-3">
                  {isAdmin ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[var(--text-primary)] font-bold">اسم المندوب كاملاً (ثلاثي) *</label>
                        <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">صلاحية إدارة 👑</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
                      />
                    </div>
                  ) : null}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[var(--text-primary)] font-bold">رقم الهاتف المصرح (11 رقم مصري يبدأ بـ 01) *</label>
                      {!isAdmin && (
                        <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> يتطلب موافقة المسؤول
                        </span>
                      )}
                    </div>
                    <input
                      type="tel"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 font-mono dir-ltr text-right focus:outline-none focus:border-amber-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-primary)] font-bold mb-1">البريد الإلكتروني المعتمد *</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-3 font-mono dir-ltr text-right focus:outline-none focus:border-amber-500 shadow-sm"
                    />
                  </div>
                </div>

                {/* Password Change Toggle Section */}
                <div className="bg-[var(--bg-surface)] p-3 rounded-2xl border border-[var(--border-color)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-xs text-[var(--text-primary)]">تغيير كلمة المرور</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPasswordChange(!showPasswordChange)}
                      className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      {showPasswordChange ? 'إلغاء تغيير الكلمة' : 'تغيير كلمة المرور'}
                    </button>
                  </div>

                  {showPasswordChange ? (
                    <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
                      <div>
                        <label className="block text-[var(--text-primary)] font-bold mb-1">كلمة المرور الحالية *</label>
                        <input
                          type="password"
                          required={showPasswordChange}
                          placeholder="أدخل كلمتك الحالية للتحقق..."
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-[var(--text-primary)] font-bold mb-1">كلمة المرور الجديدة *</label>
                        <input
                          type="password"
                          required={showPasswordChange}
                          placeholder="6 أحرف أو أرقام على الأقل..."
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-[var(--text-primary)] font-bold mb-1">تأكيد كلمة المرور الجديدة *</label>
                        <input
                          type="password"
                          required={showPasswordChange}
                          placeholder="أعد إدخال الكلمة الجديدة..."
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl p-2.5 focus:outline-none focus:border-amber-500 shadow-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-[var(--text-muted)] font-medium">
                      كلمة المرور محمية ومشفرة. لتغييرها اضغط على زر "تغيير كلمة المرور" بالأعلى وأدخل الكلمة الحالية أولاً.
                    </p>
                  )}

                  {passwordNotice && (
                    <p className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> تم تحديث كلمة المرور بنجاح!
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)] shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-[var(--input-bg)] text-[var(--text-secondary)] font-bold px-4 py-2 rounded-xl border border-[var(--border-color)] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black px-5 py-2 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ البيانات والتعديلات</span>
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

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
