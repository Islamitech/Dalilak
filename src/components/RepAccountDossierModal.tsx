import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Representative,
  Business,
  PayoutRequest,
  User,
  UserRole,
} from '../types';
import { calculateRepSettlement } from '../utils/commission';
import { getRepReferralSummary, isReferralSystemUnlocked } from '../utils/referral';
import { AdminReceiptModal } from './admin/modals/AdminReceiptModal';
import {
  DossierHeader,
  DossierActivitiesTab,
  DossierLedgerTab,
  DossierReferralsTab,
  DossierKycTab,
} from './rep-dossier';
import { CheckCircle2 } from 'lucide-react';

export interface RepAccountDossierModalProps {
  rep: Representative | null;
  onClose: () => void;
  businesses: Business[];
  allReps: Representative[];
  payoutRequests?: PayoutRequest[];
  onUpdateRepresentative?: (updatedRep: Representative) => void;
  onEditBusiness?: (biz: Business) => void;
  onUpdatePayoutRequest?: (payout: PayoutRequest) => void;
  currentUser?: User | null;
}

export const RepAccountDossierModal: React.FC<RepAccountDossierModalProps> = ({
  rep,
  onClose,
  businesses,
  allReps,
  payoutRequests = [],
  onUpdateRepresentative,
  onEditBusiness,
  onUpdatePayoutRequest,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'activities' | 'ledger' | 'referrals' | 'kyc'>(
    () => (rep?.status === 'suspended' ? 'kyc' : 'activities')
  );
  const [bizSearch, setBizSearch] = useState('');
  const [bizFilter, setBizFilter] = useState<'all' | 'verified' | 'pending' | 'cash' | 'online' | 'exempt'>('all');
  const [editingCommRate, setEditingCommRate] = useState<number>(rep?.commissionRate || 42.86);
  const [editingRoleTitle, setEditingRoleTitle] = useState<string>(rep?.roleTitle || '');
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedReceiptPhoto, setSelectedReceiptPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (rep) {
      setEditingCommRate(rep.commissionRate || 42.86);
      setEditingRoleTitle(rep.roleTitle || '');
      if (rep.status === 'suspended') {
        setActiveTab('kyc');
      }
    }
  }, [rep]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Extract all businesses registered by this representative
  const repBusinesses = useMemo(() => {
    if (!rep) return [];
    return businesses.filter(
      (b) => b.repId === rep.id || b.repName === rep.name || b.repId === rep.phone
    );
  }, [businesses, rep]);

  const effectiveRate = rep?.commissionRate && rep.commissionRate < 100 ? rep.commissionRate : 42.86;

  // Referral Network Summary
  const referralSummary = useMemo(() => {
    if (!rep) return null;
    return getRepReferralSummary(rep, allReps, businesses);
  }, [rep, allReps, businesses]);

  // Calculate master financial settlement
  const settlement = useMemo(() => {
    if (!rep) return null;
    return calculateRepSettlement(
      rep.id,
      repBusinesses,
      effectiveRate,
      payoutRequests,
      referralSummary?.totalNetEarnings || 0
    );
  }, [rep?.id, repBusinesses, effectiveRate, payoutRequests, referralSummary?.totalNetEarnings]);

  // Payout and Remittance Requests for this rep
  const repPayouts = useMemo(() => {
    if (!rep) return [];
    return payoutRequests.filter(
      (p) => p.repId === rep.id || p.repName === rep.name || p.repPhone === rep.phone
    );
  }, [payoutRequests, rep]);

  // Filtered Businesses list
  const filteredRepBusinesses = useMemo(() => {
    return repBusinesses.filter((biz) => {
      const matchesSearch =
        !bizSearch.trim() ||
        biz.nameAr?.toLowerCase().includes(bizSearch.toLowerCase()) ||
        biz.nameEn?.toLowerCase().includes(bizSearch.toLowerCase()) ||
        biz.city?.toLowerCase().includes(bizSearch.toLowerCase()) ||
        biz.invoiceNumber?.toLowerCase().includes(bizSearch.toLowerCase());

      if (!matchesSearch) return false;

      const isExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
      const isVerified = biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced';
      const isCash = !isExempt && (biz.cashCollectedByRep !== undefined ? (biz.cashCollectedByRep || 0) > 0 : biz.paymentMethod === 'cash_by_rep');

      if (bizFilter === 'verified') return isVerified;
      if (bizFilter === 'pending') return !isVerified;
      if (bizFilter === 'cash') return isCash;
      if (bizFilter === 'online') return !isCash && !isExempt && (biz.amountPaid || 0) > 0;
      if (bizFilter === 'exempt') return isExempt;

      return true;
    });
  }, [repBusinesses, bizSearch, bizFilter]);

  // Statistics
  const totalRevenue = repBusinesses.reduce((sum, b) => (b.isFeeExempt || b.packagePrice === 0 ? sum : sum + (b.amountPaid || 0)), 0);
  const verifiedCount = repBusinesses.filter((b) => b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced').length;
  const exemptCount = repBusinesses.filter((b) => b.isFeeExempt || b.packagePrice === 0).length;
  const pendingReviewCount = repBusinesses.length - verifiedCount;

  if (!rep || !settlement || !referralSummary) return null;

  // RBAC Permission checks [SEC-1]
  const canUpdateRep = Boolean(onUpdateRepresentative);
  const canManageRoles = currentUser ? (currentUser.role === 'admin' || currentUser.role === 'supervisor') : true;

  // Handle Commission Rate Update
  const handleSaveCommissionRate = () => {
    if (!onUpdateRepresentative) return;
    setIsSavingRate(true);
    try {
      onUpdateRepresentative({
        ...rep,
        commissionRate: Number(editingCommRate) || 42.86,
        roleTitle: editingRoleTitle.trim() || undefined,
      });
      showToast('تم حفظ وتحديث نسبة العمولة بنجاح');
    } finally {
      setIsSavingRate(false);
    }
  };

  // Handle Role Change
  const handleChangeRole = (newRole: UserRole) => {
    if (!onUpdateRepresentative) return;
    const newRoleTitle =
      newRole === 'supervisor'
        ? 'مشرف إدارة منطقة ومحافظة'
        : newRole === 'accountant'
        ? 'محاسب ومحصل فواتير إلكترونية'
        : newRole === 'admin'
        ? 'مدير النظام المعتمد'
        : 'مندوب مبيعات ميداني';
    setEditingRoleTitle(newRoleTitle);
    onUpdateRepresentative({
      ...rep,
      role: newRole,
      roleTitle: newRoleTitle,
    });
    showToast(`تم تغيير الرتبة إلى: ${newRole === 'admin' ? 'مدير نظام' : newRole === 'supervisor' ? 'مشرف منطقة' : newRole === 'accountant' ? 'محاسب' : 'مندوب ميداني'}`);
  };

  // Handle Status Toggle (Active/Suspended)
  const handleToggleStatus = () => {
    if (!onUpdateRepresentative) return;
    const newStatus = rep.status === 'suspended' ? 'active' : 'suspended';
    onUpdateRepresentative({
      ...rep,
      status: newStatus,
      avatarStatus: newStatus === 'active' ? 'approved' : rep.avatarStatus,
    });
    showToast(newStatus === 'active' ? 'تم تفعيل الحساب والموافقة عليه' : 'تم تعليق الحساب مؤقتاً');
  };

  // Handle Reject Account
  const handleRejectAccount = () => {
    if (!onUpdateRepresentative) return;
    onUpdateRepresentative({
      ...rep,
      status: 'suspended',
      avatarStatus: 'rejected',
    });
    showToast('تم رفض طلب تسجيل الحساب وإرسال أسباب الرفض عبر البريد الإلكتروني');
  };

  // Handle Referral Unlock Toggle
  const handleToggleReferralUnlock = () => {
    if (!onUpdateRepresentative) return;
    const currentUnlocked = isReferralSystemUnlocked(rep, repBusinesses.length);
    onUpdateRepresentative({
      ...rep,
      adminBypassReferral: !currentUnlocked,
      referralUnlocked: !currentUnlocked,
    });
    showToast(!currentUnlocked ? 'تم فتح وتفعيل كود الإحالة مباشرة' : 'تم قفل كود الإحالة');
  };

  const handleApprovePayout = (payout: PayoutRequest) => {
    if (!onUpdatePayoutRequest) return;
    const updated: PayoutRequest = {
      ...payout,
      status: 'approved',
      processedDate: new Date().toISOString(),
    };
    onUpdatePayoutRequest(updated);
    showToast('تم اعتماد العملية المالية وتحديث الحساب بنجاح');
  };

  const handleRejectPayout = (payout: PayoutRequest) => {
    if (!onUpdatePayoutRequest) return;
    const updated: PayoutRequest = {
      ...payout,
      status: 'rejected',
      processedDate: new Date().toISOString(),
    };
    onUpdatePayoutRequest(updated);
    showToast('تم رفض العملية وتحديث السجل');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-5xl w-full max-h-[96vh] flex flex-col text-xs text-[var(--text-primary)] shadow-2xl overflow-hidden my-auto text-right animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Notification */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-black text-xs px-4 py-2 rounded-2xl shadow-xl border border-emerald-400 flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* ── 1. MODAL HEADER & TABS BAR ─────────────────────────────────────── */}
        <DossierHeader
          rep={rep}
          onClose={onClose}
          repBusinessesCount={repBusinesses.length}
          totalRevenue={totalRevenue}
          verifiedCount={verifiedCount}
          exemptCount={exemptCount}
          settlement={settlement}
          referralSummary={referralSummary}
          effectiveRate={effectiveRate}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onToggleStatus={handleToggleStatus}
          onRejectAccount={handleRejectAccount}
          canUpdateRep={canUpdateRep}
        />

        {/* ── 2. TAB CONTENTS (SCROLLABLE AREA) ───────────────────────────────── */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'activities' && (
            <DossierActivitiesTab
              repBusinesses={repBusinesses}
              filteredRepBusinesses={filteredRepBusinesses}
              bizSearch={bizSearch}
              setBizSearch={setBizSearch}
              bizFilter={bizFilter}
              setBizFilter={setBizFilter}
              verifiedCount={verifiedCount}
              pendingReviewCount={pendingReviewCount}
              exemptCount={exemptCount}
              effectiveRate={effectiveRate}
              onEditBusiness={onEditBusiness}
              onSelectReceiptPhoto={(photo) => setSelectedReceiptPhoto(photo)}
            />
          )}

          {activeTab === 'ledger' && (
            <DossierLedgerTab
              settlement={settlement}
              effectiveRate={effectiveRate}
              repPayouts={repPayouts}
              onApprovePayout={handleApprovePayout}
              onRejectPayout={handleRejectPayout}
            />
          )}

          {activeTab === 'referrals' && (
            <DossierReferralsTab
              referralSummary={referralSummary}
              onToggleReferralUnlock={handleToggleReferralUnlock}
              canManageReferral={canUpdateRep}
            />
          )}

          {activeTab === 'kyc' && (
            <DossierKycTab
              rep={rep}
              allReps={allReps}
              editingCommRate={editingCommRate}
              setEditingCommRate={setEditingCommRate}
              editingRoleTitle={editingRoleTitle}
              setEditingRoleTitle={setEditingRoleTitle}
              isSavingRate={isSavingRate}
              onSaveCommissionRate={handleSaveCommissionRate}
              onChangeRole={handleChangeRole}
              onSelectPhoto={(photo) => setSelectedReceiptPhoto(photo)}
              canManageRoles={canManageRoles}
            />
          )}
        </div>

        {/* ── 3. MODAL FOOTER ─────────────────────────────────────────────────── */}
        <div className="p-3.5 sm:p-4 bg-[var(--input-bg)] border-t border-[var(--border-color)] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-[var(--text-muted)] font-bold">
            معرف الحساب: <span className="font-mono text-[var(--text-primary)]">{rep.id}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--bg-card)] hover:bg-slate-500/10 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-black px-6 py-2 rounded-xl transition-colors cursor-pointer active:scale-95"
          >
            إغلاق الملف
          </button>
        </div>

        {/* ── 4. LIGHTBOX MODAL: Activity Payment Receipt & Photo Preview ────── */}
        <AdminReceiptModal
          receiptPhoto={selectedReceiptPhoto}
          onClose={() => setSelectedReceiptPhoto(null)}
        />
      </div>
    </div>,
    document.body
  );
};
