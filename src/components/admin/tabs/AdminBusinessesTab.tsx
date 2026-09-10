import React, { useState } from 'react';
import { Business, User } from '../../../types';
import { BusinessFollowUpModal } from '../modals/BusinessFollowUpModal';
import { AdminSendPackageModal } from '../modals/AdminSendPackageModal';
import { PackagesModal } from '../../PackagesModal';
import { ConfirmDialog } from '../../ConfirmDialog';
import {
  BusinessesFilterBar,
  BusinessesMobileCard,
  BusinessesDesktopRow,
  BusinessesPagination,
} from '../businesses-tab';

export interface AdminBusinessesTabProps {
  businesses: Business[];
  filteredBusinesses: Business[];
  pagedBusinesses: Business[];
  bizSearchQuery: string;
  setBizSearchQuery: (q: string) => void;
  governorateFilter: string;
  setGovernorateFilter: (g: string) => void;
  paymentFilter: string;
  setPaymentFilter: (p: string) => void;
  verificationFilter: string;
  setVerificationFilter: (v: string) => void;
  bizPageSize: number;
  setBizPageSize: (s: number) => void;
  bizPage: number;
  setBizPage: React.Dispatch<React.SetStateAction<number>>;
  totalBizPages: number;
  inProgressCount: number;
  verifiedCount: number;
  notSubmittedCount: number;
  overdueReviewCount: number;
  overdueReviewBusinesses: Business[];
  overdueFollowUpCount?: number;
  verifiedWithDebtCount: number;
  directoryApprovedCount: number;
  pendingApprovalCount?: number;
  onCollectPayment?: (biz: Business) => void;
  onSetSyncModalBiz: (biz: Business | null) => void;
  onSetEditingBusiness: (biz: Business | null) => void;
  onSetEditingBusinessInitialTab: (tab: string | undefined) => void;
  onUpdateBusiness?: (updated: Business) => void;
  currentUser?: User | null;
  onShowInvoice: (biz: Business) => void;
  onDeleteBusiness: (id: string) => void;
  onResetFilters?: () => void;
}

export const AdminBusinessesTab: React.FC<AdminBusinessesTabProps> = ({
  businesses,
  filteredBusinesses,
  pagedBusinesses,
  bizSearchQuery,
  setBizSearchQuery,
  governorateFilter,
  setGovernorateFilter,
  paymentFilter,
  setPaymentFilter,
  verificationFilter,
  setVerificationFilter,
  bizPageSize,
  setBizPageSize,
  bizPage,
  setBizPage,
  totalBizPages,
  inProgressCount,
  verifiedCount,
  notSubmittedCount,
  overdueReviewCount,
  overdueFollowUpCount,
  verifiedWithDebtCount,
  directoryApprovedCount,
  pendingApprovalCount,
  onCollectPayment,
  onSetSyncModalBiz,
  onSetEditingBusiness,
  onSetEditingBusinessInitialTab,
  onUpdateBusiness,
  currentUser,
  onShowInvoice,
  onDeleteBusiness,
  onResetFilters,
}) => {
  // State for custom delete confirmation dialog
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  // State for fast CRM Follow-up modal
  const [selectedFollowUpBiz, setSelectedFollowUpBiz] = useState<Business | null>(null);
  // State for Send Package proposal modal
  const [selectedPackageBiz, setSelectedPackageBiz] = useState<Business | null>(null);
  // State for Packages Hub modal (reference view)
  const [showPackagesHubModal, setShowPackagesHubModal] = useState<boolean>(false);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm animate-fade-in transition-colors duration-300">
      {/* Filter and Export Bar */}
      <BusinessesFilterBar
        businesses={businesses}
        filteredBusinesses={filteredBusinesses}
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
        setBizPage={setBizPage}
        inProgressCount={inProgressCount}
        verifiedCount={verifiedCount}
        notSubmittedCount={notSubmittedCount}
        overdueReviewCount={overdueReviewCount}
        overdueFollowUpCount={overdueFollowUpCount}
        verifiedWithDebtCount={verifiedWithDebtCount}
        directoryApprovedCount={directoryApprovedCount}
        pendingApprovalCount={pendingApprovalCount}
        onResetFilters={onResetFilters}
        onOpenPackagesHub={() => setShowPackagesHubModal(true)}
      />

      {/* Businesses Data: Mobile Cards (< md) + Desktop Table (>= md) */}
      <div className="space-y-3">
        {pagedBusinesses.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] font-bold bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
            لا توجد منشآت مطابقة للبحث أو التصفية الحالية.
          </div>
        ) : (
          <>
            {/* 1. Mobile Cards View (Hidden on md and larger) */}
            <div className="block md:hidden space-y-3">
              {pagedBusinesses.map((biz) => (
                <BusinessesMobileCard
                  key={biz.id}
                  biz={biz}
                  onCollectPayment={onCollectPayment}
                  onSetSyncModalBiz={onSetSyncModalBiz}
                  onSetEditingBusiness={onSetEditingBusiness}
                  onSetEditingBusinessInitialTab={onSetEditingBusinessInitialTab}
                  onShowInvoice={onShowInvoice}
                  onSelectFollowUpBiz={setSelectedFollowUpBiz}
                  onSendPackageBiz={setSelectedPackageBiz}
                  onConfirmDelete={setConfirmDelete}
                />
              ))}
            </div>

            {/* 2. Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-[var(--border-color)]">
              <table className="w-full text-xs text-right border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-[var(--input-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold text-[11px]">
                    <th className="p-3">الاسم والتصنيف</th>
                    <th className="p-3">المسؤول والموقع</th>
                    <th className="p-3">المندوب وتاريخ التسجيل</th>
                    <th className="p-3">الباقة والموقف المالي</th>
                    <th className="p-3">الاعتماد والتوثيق</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {pagedBusinesses.map((biz) => (
                    <BusinessesDesktopRow
                      key={biz.id}
                      biz={biz}
                      onCollectPayment={onCollectPayment}
                      onSetSyncModalBiz={onSetSyncModalBiz}
                      onSetEditingBusiness={onSetEditingBusiness}
                      onSetEditingBusinessInitialTab={onSetEditingBusinessInitialTab}
                      onShowInvoice={onShowInvoice}
                      onSelectFollowUpBiz={setSelectedFollowUpBiz}
                      onSendPackageBiz={setSelectedPackageBiz}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination Controls */}
      <BusinessesPagination
        bizPage={bizPage}
        setBizPage={setBizPage}
        totalBizPages={totalBizPages}
        bizPageSize={bizPageSize}
        totalFilteredCount={filteredBusinesses.length}
      />

      {/* Fast CRM Follow-up Modal */}
      {selectedFollowUpBiz && (
        <BusinessFollowUpModal
          business={selectedFollowUpBiz}
          currentUser={currentUser || null}
          isOpen={Boolean(selectedFollowUpBiz)}
          onClose={() => setSelectedFollowUpBiz(null)}
          onUpdateBusiness={(updated) => {
            setSelectedFollowUpBiz(updated);
            if (onUpdateBusiness) {
              onUpdateBusiness(updated);
            }
          }}
          onOpenFullEdit={(biz) => {
            setSelectedFollowUpBiz(null);
            onSetEditingBusinessInitialTab('admin_followup');
            onSetEditingBusiness(biz);
          }}
        />
      )}

      {/* Send Package Proposal Modal */}
      {selectedPackageBiz && (
        <AdminSendPackageModal
          isOpen={Boolean(selectedPackageBiz)}
          onClose={() => setSelectedPackageBiz(null)}
          business={selectedPackageBiz}
          currentUser={currentUser || null}
          onUpdateBusiness={(updated) => {
            setSelectedPackageBiz(updated);
            if (onUpdateBusiness) {
              onUpdateBusiness(updated);
            }
          }}
        />
      )}

      {/* Packages Hub Reference Modal */}
      {showPackagesHubModal && (
        <PackagesModal
          onClose={() => setShowPackagesHubModal(false)}
          businesses={businesses}
          onSendPackageBiz={(biz) => {
            setShowPackagesHubModal(false);
            setSelectedPackageBiz(biz);
          }}
        />
      )}

      {/* Custom Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title="تأكيد حذف النشاط"
        message={`هل أنت متأكد من حذف نشاط "${confirmDelete?.name || ''}" من المنظومة؟ سيتم نقله إلى سلة المحذوفات.`}
        confirmLabel="حذف النشاط"
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={() => {
          if (confirmDelete) {
            onDeleteBusiness(confirmDelete.id);
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};
