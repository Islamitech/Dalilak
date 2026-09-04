import React, { useState, useEffect, useMemo } from 'react';
import { Business, Representative, PaymentGatewayConfig, PayoutRequest, User, InterestedLead } from '../types';
import { sortBusinessesNewestFirst } from '../utils/dateFormatters';
import { matchesBusinessSearch } from '../utils/arabicSearch';
import { triggerHaptic } from '../utils/haptics';

// Custom Hook for all financial and metric calculations
import { useAdminMetrics } from './admin/hooks/useAdminMetrics';

// Tabs
import { AdminOverviewTab } from './admin/tabs/AdminOverviewTab';
import { AdminBusinessesTab } from './admin/tabs/AdminBusinessesTab';
import { AdminRepsTab } from './admin/tabs/AdminRepsTab';
import { AdminGatewaysTab } from './admin/tabs/AdminGatewaysTab';
import { AdminPayoutsTab } from './admin/tabs/AdminPayoutsTab';
import { AdminLeadsTab } from './admin/tabs/AdminLeadsTab';

// Modals
import { AdminPayoutActionModal } from './admin/modals/AdminPayoutActionModal';
import { AdminAccountModal } from './admin/modals/AdminAccountModal';
import { AdminPaymentConfigModal } from './admin/modals/AdminPaymentConfigModal';
import { AdminReceiptModal } from './admin/modals/AdminReceiptModal';
import { AdminAvatarModal } from './admin/modals/AdminAvatarModal';
import { DocViewerModal } from './DocViewerModal';
import { BusinessEditModal } from './BusinessEditModal';
import { GoogleMapsSyncModal } from './GoogleMapsSyncModal';
import { PermissionsModal } from './PermissionsModal';
import { RepAccountDossierModal } from './RepAccountDossierModal';
import { LeadFollowUpModal } from './LeadFollowUpModal';
import { AdminAuditTrashTab } from './admin/tabs/AdminAuditTrashTab';
import { isSuperAdmin } from '../utils/permissions';

import {
  ShieldCheck,
  DollarSign,
  Users,
  CreditCard,
  UserCheck,
  Store,
  ShieldAlert,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser?: User | null;
  businesses: Business[];
  representatives: Representative[];
  paymentConfig: PaymentGatewayConfig;
  payoutRequests?: PayoutRequest[];
  leads?: InterestedLead[];
  deletedBusinesses?: Business[];
  deletedRepresentatives?: Representative[];
  onUpdateBusiness: (biz: Business) => void;
  onDeleteBusiness: (id: string) => void;
  onRestoreBusiness?: (biz: Business) => void;
  onHardDeleteBusiness?: (id: string) => void;
  onAddRepresentative: (rep: Partial<Representative>) => void;
  onUpdateRepresentative?: (rep: Representative) => void;
  onDeleteRepresentative?: (id: string) => void;
  onRestoreRepresentative?: (rep: Representative) => void;
  onHardDeleteRepresentative?: (id: string) => void;
  onUpdatePaymentConfig: (config: PaymentGatewayConfig) => void;
  onUpdatePayoutRequest?: (payout: PayoutRequest) => void;
  onDeletePayoutRequest?: (id: string) => void;
  onShowInvoice: (biz: Business) => void;
  onCollectPayment?: (biz: Business) => void;
  onUpdateLead?: (lead: InterestedLead) => void;
  onDeleteLead?: (leadId: string) => void;
  onConvertToBusiness?: (lead: InterestedLead) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  businesses,
  representatives,
  paymentConfig,
  payoutRequests = [],
  leads = [],
  onUpdateBusiness,
  onDeleteBusiness,
  onAddRepresentative,
  onUpdateRepresentative,
  onDeleteRepresentative,
  onUpdatePaymentConfig,
  onUpdatePayoutRequest,
  onDeletePayoutRequest,
  onRestoreBusiness,
  onHardDeleteBusiness,
  onRestoreRepresentative,
  onHardDeleteRepresentative,
  deletedBusinesses = [],
  deletedRepresentatives = [],
  onShowInvoice,
  onCollectPayment,
  onUpdateLead,
  onDeleteLead,
  onConvertToBusiness,
}) => {
  // Main Tab State (Overview, Businesses, Reps, Gateways, Payouts, Leads, Audit & Trash)
  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'businesses' | 'reps' | 'gateways' | 'payouts' | 'leads' | 'audit_trash'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSubtab = urlParams.get('subtab');
    if (urlSubtab && ['overview', 'businesses', 'reps', 'gateways', 'payouts', 'leads', 'audit_trash'].includes(urlSubtab)) {
      return urlSubtab as any;
    }

    const savedSubtab = localStorage.getItem('dalelak_active_admin_tab');
    if (savedSubtab && ['overview', 'businesses', 'reps', 'gateways', 'payouts', 'leads', 'audit_trash'].includes(savedSubtab)) {
      return savedSubtab as any;
    }

    return 'overview';
  });

  // Calculate all metrics via custom hook
  const metrics = useAdminMetrics({
    currentUser,
    businesses,
    representatives,
    payoutRequests,
    leads,
  });

  // Search & Filter States
  const [bizSearchQuery, setBizSearchQuery] = useState<string>('');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');

  const [accountSearchQuery, setAccountSearchQuery] = useState<string>('');
  const [accountRoleFilter, setAccountRoleFilter] = useState<string>('all');
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>('all');

  const [payoutFilter, setPayoutFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Pagination States
  const [bizPage, setBizPage] = useState<number>(1);
  const [bizPageSize, setBizPageSize] = useState<number>(25);

  const [accountPage, setAccountPage] = useState<number>(1);
  const [accountPageSize, setAccountPageSize] = useState<number>(25);

  // Reset pagination on filter changes
  useEffect(() => {
    setBizPage(1);
  }, [bizSearchQuery, governorateFilter, paymentFilter, verificationFilter, bizPageSize]);

  useEffect(() => {
    setAccountPage(1);
  }, [accountSearchQuery, accountRoleFilter, accountStatusFilter, accountPageSize]);

  // Sync activeAdminTab state with localStorage and browser URL query params
  useEffect(() => {
    if (activeAdminTab) {
      localStorage.setItem('dalelak_active_admin_tab', activeAdminTab);
      const url = new URL(window.location.href);
      if (url.searchParams.get('subtab') !== activeAdminTab) {
        url.searchParams.set('subtab', activeAdminTab);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [activeAdminTab]);

  // Scroll to top when switching admin sub-tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    triggerHaptic();
  }, [activeAdminTab]);

  // Modal States
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [editingBusinessInitialTab, setEditingBusinessInitialTab] = useState<string | undefined>(undefined);
  const [selectedDossierRep, setSelectedDossierRep] = useState<Representative | null>(null);
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [editingAccountRep, setEditingAccountRep] = useState<Representative | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);
  const [previewAvatarRep, setPreviewAvatarRep] = useState<Representative | null>(null);
  const [selectedReceiptPhoto, setSelectedReceiptPhoto] = useState<string | null>(null);
  const [selectedAdminDoc, setSelectedAdminDoc] = useState<{
    type: 'field_letter' | 'digital_badge' | 'rep_contract';
    rep: Representative;
  } | null>(null);
  const [syncModalBiz, setSyncModalBiz] = useState<Business | null>(null);
  const [selectedFollowUpLead, setSelectedFollowUpLead] = useState<InterestedLead | null>(null);
  const [activePayoutModal, setActivePayoutModal] = useState<{
    payout: PayoutRequest;
    action: 'approve' | 'reject';
  } | null>(null);

  // Keep editingBusiness in sync with businesses array updates
  useEffect(() => {
    if (editingBusiness) {
      const refreshed = businesses.find((b) => b.id === editingBusiness.id);
      if (
        refreshed &&
        (refreshed.amountPaid !== editingBusiness.amountPaid ||
          refreshed.paymentStatus !== editingBusiness.paymentStatus ||
          refreshed.verificationStatus !== editingBusiness.verificationStatus)
      ) {
        setEditingBusiness(refreshed);
      }
    }
  }, [businesses]);

  // Filtered Businesses for Businesses Tab
  const filteredBusinesses = useMemo(
    () =>
      sortBusinessesNewestFirst(
        metrics.realBusinesses.filter((b) => {
          if (bizSearchQuery && !matchesBusinessSearch(b, bizSearchQuery)) {
            return false;
          }
          if (governorateFilter !== 'all' && !(b.governorate || '').includes(governorateFilter)) {
            return false;
          }
          if (paymentFilter !== 'all' && b.paymentStatus !== paymentFilter) {
            return false;
          }
          const hasGoogleMap = Boolean(
            b.googleMapsUrl &&
              typeof b.googleMapsUrl === 'string' &&
              b.googleMapsUrl.trim().startsWith('http') &&
              !b.googleMapsUrl.includes('search/?api=1&query=')
          );

          if (verificationFilter === 'not_submitted') {
            const isNotSubmitted = !hasGoogleMap && b.googleSyncStatus !== 'in_progress';
            if (!isNotSubmitted) return false;
          } else if (verificationFilter === 'in_progress') {
            const isInProgress = !hasGoogleMap && b.googleSyncStatus === 'in_progress';
            if (!isInProgress) return false;
          } else if (verificationFilter === 'overdue') {
            return metrics.overdueReviewBusinesses.some((ov) => ov.id === b.id);
          } else if (verificationFilter === 'verified_debt') {
            return metrics.verifiedWithDebtBusinesses.some((vd) => vd.id === b.id);
          } else if (verificationFilter === 'verified') {
            if (!hasGoogleMap) return false;
          } else if (verificationFilter === 'directory_verified') {
            if (b.verificationStatus !== 'verified') return false;
          } else if (verificationFilter === 'rejected') {
            if (b.verificationStatus !== 'rejected') return false;
          } else if (verificationFilter !== 'all') {
            if (b.verificationStatus !== verificationFilter) return false;
          }
          return true;
        })
      ),
    [metrics.realBusinesses, bizSearchQuery, governorateFilter, paymentFilter, verificationFilter, metrics.overdueReviewBusinesses, metrics.verifiedWithDebtBusinesses]
  );

  // Paginated Businesses
  const totalBizPages = Math.max(1, Math.ceil(filteredBusinesses.length / bizPageSize));
  const pagedBusinesses = useMemo(() => {
    const start = (bizPage - 1) * bizPageSize;
    return filteredBusinesses.slice(start, start + bizPageSize);
  }, [filteredBusinesses, bizPage, bizPageSize]);

  // Filtered Accounts for Reps Tab
  const filteredAccounts = useMemo(
    () =>
      metrics.mergedAdminReps.filter((acc) => {
        if (
          accountSearchQuery &&
          !acc.name.includes(accountSearchQuery) &&
          !acc.email.includes(accountSearchQuery) &&
          !acc.phone.includes(accountSearchQuery)
        ) {
          return false;
        }
        if (accountRoleFilter !== 'all') {
          const accRole = acc.role || 'rep';
          if (accRole !== accountRoleFilter) return false;
        }
        if (accountStatusFilter !== 'all') {
          const accStatus = acc.status || 'active';
          if (accStatus !== accountStatusFilter) return false;
        }
        return true;
      }),
    [metrics.mergedAdminReps, accountSearchQuery, accountRoleFilter, accountStatusFilter]
  );

  // Paginated Accounts
  const totalAccountPages = Math.max(1, Math.ceil(filteredAccounts.length / accountPageSize));
  const pagedAccounts = useMemo(() => {
    const start = (accountPage - 1) * accountPageSize;
    return filteredAccounts.slice(start, start + accountPageSize);
  }, [filteredAccounts, accountPage, accountPageSize]);

  const handleOpenAddAccount = () => {
    setEditingAccountRep(null);
    setShowAccountModal(true);
  };

  const handleOpenEditAccount = (rep: Representative) => {
    setEditingAccountRep(rep);
    setShowAccountModal(true);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* ── TOP OPERATIONAL TABS NAVIGATION BAR ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-2 rounded-3xl shadow-xs flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveAdminTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black transition-all shrink-0 cursor-pointer ${
            activeAdminTab === 'overview'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>نظرة عامة وإحصائيات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('businesses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black transition-all shrink-0 cursor-pointer ${
            activeAdminTab === 'businesses'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>إدارة الأنشطة ({metrics.realBusinesses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('reps')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black transition-all shrink-0 cursor-pointer ${
            activeAdminTab === 'reps'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>فريق العمل والمناديب ({metrics.mergedAdminReps.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('gateways')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black transition-all shrink-0 cursor-pointer ${
            activeAdminTab === 'gateways'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>بوابات الدفع</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('payouts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black transition-all shrink-0 cursor-pointer relative ${
            activeAdminTab === 'payouts'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>سحب الأرباح والتوريدات</span>
          {payoutRequests.filter((p) => p.status === 'pending').length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
              {payoutRequests.filter((p) => p.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveAdminTab('leads')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black transition-all shrink-0 cursor-pointer relative ${
            activeAdminTab === 'leads'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>المراجعات والعملاء المهتمين</span>
          {metrics.leadStats.pendingFollowup > 0 && (
            <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {metrics.leadStats.pendingFollowup}
            </span>
          )}
        </button>

        {/* ── SUPER ADMIN EXCLUSIVE TAB BUTTON (مخفي تماماً عن باقي الحسابات) ── */}
        {isSuperAdmin(currentUser) && (
          <button
            type="button"
            onClick={() => setActiveAdminTab('audit_trash')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black transition-all shrink-0 cursor-pointer ${
              activeAdminTab === 'audit_trash'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md'
                : 'text-amber-600 dark:text-amber-400 hover:text-amber-500 hover:bg-[var(--input-bg)] border border-amber-500/30'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>سلة المحذوفات وأثر السيرفر ({deletedBusinesses.length + deletedRepresentatives.length})</span>
          </button>
        )}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeAdminTab === 'overview' && (
        <AdminOverviewTab
          totalRevenue={metrics.totalRevenue}
          collectionRate={metrics.collectionRate}
          totalDebt={metrics.totalDebt}
          totalContractValue={metrics.totalContractValue}
          verifiedCount={metrics.verifiedCount}
          verificationRate={metrics.verificationRate}
          realBusinesses={metrics.realBusinesses}
          businesses={businesses}
          exemptCount={metrics.exemptCount}
          mergedAdminReps={metrics.mergedAdminReps}
          governorateStats={metrics.governorateStats}
          leadStats={metrics.leadStats}
          netPlatformRevenue={metrics.netPlatformRevenue}
          totalCashInRepsHands={metrics.totalCashInRepsHands}
          totalCommissionsRetainedInCash={metrics.totalCommissionsRetainedInCash}
          totalApprovedPayouts={metrics.totalApprovedPayouts}
          totalRemittancesReceived={metrics.totalRemittancesReceived}
          totalEarnedCommissions={metrics.totalEarnedCommissions}
          monthlyFinancialStats={metrics.monthlyFinancialStats}
          notSubmittedCount={metrics.notSubmittedCount}
          overdueReviewCount={metrics.overdueReviewCount}
          verifiedWithDebtCount={metrics.verifiedWithDebtCount}
          verifiedWithDebtTotal={metrics.verifiedWithDebtTotal}
          inProgressCount={metrics.inProgressCount}
          packageStats={metrics.packageStats}
          repPerformanceStats={metrics.repPerformanceStats}
          onNavigateTab={(tab) => setActiveAdminTab(tab)}
          onSetVerificationFilter={(f) => {
            setVerificationFilter(f);
            setActiveAdminTab('businesses');
          }}
          onSelectDossierRep={(rep) => setSelectedDossierRep(rep)}
        />
      )}

      {/* ── TAB 2: BUSINESSES ── */}
      {activeAdminTab === 'businesses' && (
        <AdminBusinessesTab
          businesses={businesses}
          filteredBusinesses={filteredBusinesses}
          pagedBusinesses={pagedBusinesses}
          bizSearchQuery={bizSearchQuery}
          setBizSearchQuery={setBizSearchQuery}
          governorateFilter={governorateFilter}
          setGovernorateFilter={setGovernorateFilter}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
          verificationFilter={verificationFilter}
          setVerificationFilter={setVerificationFilter}
          bizPageSize={bizPageSize}
          setBizPageSize={setBizPageSize}
          bizPage={bizPage}
          setBizPage={setBizPage}
          totalBizPages={totalBizPages}
          inProgressCount={metrics.inProgressCount}
          verifiedCount={metrics.verifiedCount}
          notSubmittedCount={metrics.notSubmittedCount}
          overdueReviewCount={metrics.overdueReviewCount}
          overdueReviewBusinesses={metrics.overdueReviewBusinesses}
          verifiedWithDebtCount={metrics.verifiedWithDebtCount}
          directoryApprovedCount={metrics.directoryApprovedCount}
          onCollectPayment={onCollectPayment}
          onSetSyncModalBiz={setSyncModalBiz}
          onSetEditingBusiness={setEditingBusiness}
          onSetEditingBusinessInitialTab={setEditingBusinessInitialTab}
          onShowInvoice={onShowInvoice}
          onDeleteBusiness={onDeleteBusiness}
        />
      )}

      {/* ── TAB 3: REPS & ACCOUNTS ── */}
      {activeAdminTab === 'reps' && (
        <AdminRepsTab
          currentUser={currentUser}
          businesses={businesses}
          mergedAdminReps={metrics.mergedAdminReps}
          filteredAccounts={filteredAccounts}
          pagedAccounts={pagedAccounts}
          accountSearchQuery={accountSearchQuery}
          setAccountSearchQuery={setAccountSearchQuery}
          accountRoleFilter={accountRoleFilter}
          setAccountRoleFilter={setAccountRoleFilter}
          accountStatusFilter={accountStatusFilter}
          setAccountStatusFilter={setAccountStatusFilter}
          accountPageSize={accountPageSize}
          setAccountPageSize={setAccountPageSize}
          accountPage={accountPage}
          setAccountPage={setAccountPage}
          totalAccountPages={totalAccountPages}
          payoutRequests={payoutRequests}
          onOpenAddAccountModal={handleOpenAddAccount}
          onOpenEditAccountModal={handleOpenEditAccount}
          onUpdateRepresentative={onUpdateRepresentative}
          onShowPermissionsModal={() => setShowPermissionsModal(true)}
        />
      )}

      {/* ── TAB 4: PAYMENT GATEWAYS ── */}
      {activeAdminTab === 'gateways' && (
        <AdminGatewaysTab
          paymentConfig={paymentConfig}
          onOpenPaymentModal={() => setShowPaymentModal(true)}
        />
      )}

      {/* ── TAB 5: PAYOUT REQUESTS ── */}
      {activeAdminTab === 'payouts' && (
        <AdminPayoutsTab
          payoutRequests={payoutRequests}
          representatives={metrics.mergedAdminReps}
          payoutFilter={payoutFilter}
          setPayoutFilter={setPayoutFilter}
          onOpenPayoutActionModal={(payout, action) => setActivePayoutModal({ payout, action })}
          onSelectReceiptPhoto={(photo) => setSelectedReceiptPhoto(photo)}
          onInspectRep={(rep) => setSelectedDossierRep(rep)}
          currentUser={currentUser}
          onDeletePayout={onDeletePayoutRequest}
        />
      )}

      {/* ── TAB 6: CRM LEADS & FIELD REVIEWS ── */}
      {activeAdminTab === 'leads' && (
        <AdminLeadsTab
          leads={leads}
          leadStats={metrics.leadStats}
          currentUser={currentUser}
          onUpdateLead={onUpdateLead}
          onDeleteLead={onDeleteLead}
          onConvertToBusiness={onConvertToBusiness}
          onSelectFollowUpLead={(lead) => setSelectedFollowUpLead(lead)}
        />
      )}

      {/* ── TAB 7: CONFIDENTIAL SUPER ADMIN AUDIT & TRASH (حصري للـ Super Admin) ── */}
      {activeAdminTab === 'audit_trash' && isSuperAdmin(currentUser) && (
        <AdminAuditTrashTab
          deletedBusinesses={deletedBusinesses}
          deletedRepresentatives={deletedRepresentatives}
          allBusinesses={businesses}
          allLeads={leads}
          onRestoreBusiness={onRestoreBusiness || (() => {})}
          onHardDeleteBusiness={onHardDeleteBusiness || (() => {})}
          onRestoreRepresentative={onRestoreRepresentative || (() => {})}
          onHardDeleteRepresentative={onHardDeleteRepresentative || (() => {})}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SHARED MODALS */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* MASTER DOSSIER MODAL: Representative Financial Ledger */}
      {selectedDossierRep && (
        <RepAccountDossierModal
          rep={selectedDossierRep}
          onClose={() => setSelectedDossierRep(null)}
          businesses={businesses}
          allReps={metrics.mergedAdminReps}
          payoutRequests={payoutRequests}
          onUpdateRepresentative={onUpdateRepresentative}
          onEditBusiness={(biz) => {
            setEditingBusiness(biz);
          }}
          onUpdatePayoutRequest={onUpdatePayoutRequest}
          currentUser={currentUser}
        />
      )}

      {/* SHARED MODAL: Business Data View & Editing */}
      <BusinessEditModal
        business={editingBusiness}
        currentUser={currentUser}
        onClose={() => {
          setEditingBusiness(null);
          setEditingBusinessInitialTab(undefined);
        }}
        onSave={(updated) => {
          onUpdateBusiness(updated);
          setEditingBusiness(updated);
        }}
        userRole={currentUser?.role || 'admin'}
        currentRoleTitle={
          currentUser?.repData?.roleTitle ||
          currentUser?.roleTitle ||
          (currentUser?.role === 'admin'
            ? 'مدير النظام'
            : currentUser?.role === 'supervisor'
            ? 'مشرف إدارة'
            : currentUser?.role === 'accountant'
            ? 'محاسب'
            : 'مندوب')
        }
        currentUserName={currentUser?.name || 'مدير النظام'}
        currentUserId={currentUser?.id || 'admin_1'}
        initialTab={editingBusinessInitialTab}
        canEdit={true}
        onShowInvoice={onShowInvoice}
        onCollectPayment={onCollectPayment}
        onDeleteBusiness={onDeleteBusiness}
        businesses={businesses}
      />

      {/* MODAL: USER ACCOUNT CREATION / EDITING POP-UP */}
      <AdminAccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        editingRep={editingAccountRep}
        currentUser={currentUser}
        businesses={businesses}
        onAddRepresentative={onAddRepresentative}
        onUpdateRepresentative={onUpdateRepresentative}
        onDeleteRepresentative={onDeleteRepresentative}
        onOpenDocViewer={(type, rep) => setSelectedAdminDoc({ type, rep })}
        onPreviewAvatar={(rep) => setPreviewAvatarRep(rep)}
      />

      {/* MODAL: PAYMENT GATEWAYS CONFIGURATION */}
      <AdminPaymentConfigModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentConfig={paymentConfig}
        onUpdatePaymentConfig={onUpdatePaymentConfig}
      />

      {/* MODAL: AVATAR / DOCUMENT PREVIEW MODAL */}
      <AdminAvatarModal
        rep={previewAvatarRep}
        onClose={() => setPreviewAvatarRep(null)}
        onUpdateRepresentative={onUpdateRepresentative}
      />

      {/* MODAL: DOCUMENT VIEWER MODAL */}
      {selectedAdminDoc && (
        <DocViewerModal
          docType={selectedAdminDoc.type}
          rep={selectedAdminDoc.rep}
          onClose={() => setSelectedAdminDoc(null)}
        />
      )}

      {/* MODAL: GOOGLE MAPS SYNC MODAL */}
      {syncModalBiz && (
        <GoogleMapsSyncModal
          business={syncModalBiz}
          isOpen={Boolean(syncModalBiz)}
          onClose={() => setSyncModalBiz(null)}
          onUpdateBusiness={(updated) => {
            onUpdateBusiness(updated);
            setSyncModalBiz(updated);
          }}
        />
      )}

      {/* MODAL: PAYOUT APPROVAL OR REJECTION MODAL */}
      <AdminPayoutActionModal
        modalData={activePayoutModal}
        onClose={() => setActivePayoutModal(null)}
        onUpdatePayoutRequest={onUpdatePayoutRequest}
        onSelectReceiptPhoto={(photo) => setSelectedReceiptPhoto(photo)}
      />

      {/* MODAL: FULL RECEIPT PHOTO LIGHTBOX PREVIEW */}
      <AdminReceiptModal
        receiptPhoto={selectedReceiptPhoto}
        onClose={() => setSelectedReceiptPhoto(null)}
      />

      {/* MODAL: PERMISSIONS MATRIX & ROLES GUIDE */}
      {showPermissionsModal && (
        <PermissionsModal onClose={() => setShowPermissionsModal(false)} />
      )}

      {/* MODAL: LEAD FOLLOW-UP & CRM TIMELINE */}
      {selectedFollowUpLead && (
        <LeadFollowUpModal
          lead={selectedFollowUpLead}
          currentUser={currentUser}
          onClose={() => setSelectedFollowUpLead(null)}
          onSaveLead={(updated) => {
            if (onUpdateLead) onUpdateLead(updated);
            setSelectedFollowUpLead(updated);
          }}
          onConvertToBusiness={onConvertToBusiness}
        />
      )}
    </div>
  );
};
