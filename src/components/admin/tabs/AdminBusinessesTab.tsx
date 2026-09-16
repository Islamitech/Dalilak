import React, { useState } from 'react';
import { Business, User } from '../../../types';
import { BusinessFollowUpModal } from '../modals/BusinessFollowUpModal';
import { AdminSendPackageModal } from '../modals/AdminSendPackageModal';
import { PackagesModal } from '../../PackagesModal';
import { ConfirmDialog } from '../../ui';
import {
  BusinessesFilterBar,
  BusinessesMobileCard,
  BusinessesDesktopRow,
  BusinessesPagination,
} from '../businesses-tab';
import { LayoutGrid, List, Map as MapIcon, Globe } from 'lucide-react';
import { UniversalListingCard } from '../../design-system/UniversalListingCard';
import { BusinessDetailsDrawer } from '../../BusinessDetailsDrawer';
import { InteractiveMap } from '../../InteractiveMap';
import { ExportDirectoryLinksModal } from './ExportDirectoryLinksModal';

export interface AdminBusinessesTabProps {
  businesses: Business[];
  filteredBusinesses: Business[];
  pagedBusinesses: Business[];
  bizSearchQuery: string;
  setBizSearchQuery: (q: string) => void;
  governorateFilter: string;
  setGovernorateFilter: (g: string) => void;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  categoryStats: { category: string; count: number }[];
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
  trendingFreeCount?: number;
  collectedInvoicesCount?: number;
  unpaidBusinessesCount?: number;
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
  categoryFilter,
  setCategoryFilter,
  categoryStats,
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
  trendingFreeCount,
  collectedInvoicesCount,
  unpaidBusinessesCount,
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
  const [showExportLinksModal, setShowExportLinksModal] = useState<boolean>(false);
  // View Mode: Table / Cards / Map
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'map'>('table');
  const [selectedDrawerBiz, setSelectedDrawerBiz] = useState<Business | null>(null);

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
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categoryStats={categoryStats}
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
        trendingFreeCount={trendingFreeCount}
        collectedInvoicesCount={collectedInvoicesCount}
        unpaidCount={unpaidBusinessesCount}
        onResetFilters={onResetFilters}
        onOpenPackagesHub={() => setShowPackagesHubModal(true)}
      />

      {/* View Mode Bar */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--text-muted)]">
            عرض النتائج ({filteredBusinesses.length} منشأة):
          </span>
          <button
            type="button"
            onClick={() => setShowExportLinksModal(true)}
            className="py-1 px-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 border border-indigo-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="استخراج روابط الدليل النظيفة (SEO)"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>استخراج روابط الدليل (SEO)</span>
          </button>
        </div>
        <div className="flex items-center bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'table' ? 'bg-[var(--bg-card)] text-amber-500 shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>جدول</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'cards' ? 'bg-[var(--bg-card)] text-amber-500 shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>بطاقات</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'map' ? 'bg-[var(--bg-card)] text-amber-500 shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>الخريطة</span>
          </button>
        </div>
      </div>

      {/* Businesses Data: Map View, Cards View, or Table View */}
      {viewMode === 'map' ? (
        <div className="rounded-2xl overflow-hidden border border-[var(--border-color)]">
          <InteractiveMap
            mode="view"
            businesses={filteredBusinesses}
            onSelectBusiness={(b) => setSelectedDrawerBiz(b)}
            onEditBusiness={(b) => onSetEditingBusiness(b)}
            heightClass="h-[520px]"
          />
        </div>
      ) : viewMode === 'cards' ? (
        filteredBusinesses.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] font-bold bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
            لا توجد منشآت مطابقة للبحث أو التصفية الحالية.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagedBusinesses.map((biz) => (
              <UniversalListingCard
                key={biz.id}
                business={biz}
                variant="grid"
                onClick={(b) => setSelectedDrawerBiz(b)}
                showAdminMetrics={true}
              />
            ))}
          </div>
        )
      ) : (
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
      )}

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

      {/* Sovereign Business Details Drawer */}
      <BusinessDetailsDrawer
        business={selectedDrawerBiz}
        isOpen={Boolean(selectedDrawerBiz)}
        onClose={() => setSelectedDrawerBiz(null)}
        onShowInvoice={onShowInvoice}
        onCollectPayment={onCollectPayment}
        onEditBusiness={onSetEditingBusiness}
        onUpdateBusiness={onUpdateBusiness}
        currentUser={currentUser}
      />

      {/* SEO Links Extractor Modal */}
      <ExportDirectoryLinksModal
        isOpen={showExportLinksModal}
        onClose={() => setShowExportLinksModal(false)}
        allBusinesses={businesses}
        filteredBusinesses={filteredBusinesses}
      />
    </div>
  );
};
