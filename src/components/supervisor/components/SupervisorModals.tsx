import React from 'react';
import {
  Business,
  Representative,
  User,
  PayoutRequest,
  InterestedLead,
} from '../../../types';
import { BusinessDetailsDrawer } from '../../BusinessDetailsDrawer';
import { RepAccountDossierModal } from '../../RepAccountDossierModal';
import { AdminAccountModal } from '../../admin/modals/AdminAccountModal';
import { AdminPayoutActionModal } from '../../admin/modals/AdminPayoutActionModal';
import { AdminReceiptModal } from '../../admin/modals/AdminReceiptModal';
import { LeadWhatsAppModal } from '../../leads/LeadWhatsAppModal';
import { useSupervisorModals } from '../hooks/useSupervisorModals';

export interface SupervisorModalsProps {
  modals: ReturnType<typeof useSupervisorModals>;
  currentUser: User;
  businesses: Business[];
  representatives: Representative[];
  payoutRequests: PayoutRequest[];
  selectedGov: string;
  onShowInvoice: (biz: Business) => void;
  onCollectPayment?: (biz: Business) => void;
  onEditBusiness?: (biz: Business) => void;
  onUpdateBusiness: (biz: Business) => void;
  onDeleteBusiness?: (id: string) => void;
  onAddRepresentative: (rep: Partial<Representative>) => void;
  onUpdateRepresentative?: (rep: Representative) => void;
  onUpdatePayoutRequest?: (payout: PayoutRequest) => void;
  onUpdateLead?: (lead: InterestedLead) => void;
}

export const SupervisorModals: React.FC<SupervisorModalsProps> = ({
  modals,
  currentUser,
  businesses,
  representatives,
  payoutRequests,
  selectedGov,
  onShowInvoice,
  onCollectPayment,
  onEditBusiness,
  onUpdateBusiness,
  onDeleteBusiness,
  onAddRepresentative,
  onUpdateRepresentative,
  onUpdatePayoutRequest,
  onUpdateLead,
}) => {
  const {
    selectedDrawerBiz,
    setSelectedDrawerBiz,
    selectedDossierRep,
    setSelectedDossierRep,
    isAddRepOpen,
    setIsAddRepOpen,
    payoutActionModalData,
    setPayoutActionModalData,
    selectedReceiptPhoto,
    setSelectedReceiptPhoto,
    selectedLeadForWhatsApp,
    setSelectedLeadForWhatsApp,
    showToast,
  } = modals;

  return (
    <>
      <BusinessDetailsDrawer
        business={selectedDrawerBiz}
        isOpen={Boolean(selectedDrawerBiz)}
        onClose={() => setSelectedDrawerBiz(null)}
        onShowInvoice={onShowInvoice}
        onCollectPayment={onCollectPayment}
        onEditBusiness={onEditBusiness}
        onUpdateBusiness={onUpdateBusiness}
        onDeleteBusiness={onDeleteBusiness}
        currentUser={currentUser}
      />

      <RepAccountDossierModal
        rep={selectedDossierRep}
        onClose={() => setSelectedDossierRep(null)}
        businesses={businesses}
        allReps={representatives}
        payoutRequests={payoutRequests}
        onUpdateRepresentative={onUpdateRepresentative}
        onEditBusiness={onEditBusiness}
        onUpdatePayoutRequest={onUpdatePayoutRequest}
        currentUser={currentUser}
      />

      <AdminAccountModal
        isOpen={isAddRepOpen}
        onClose={() => setIsAddRepOpen(false)}
        editingRep={null}
        currentUser={currentUser}
        businesses={businesses}
        onAddRepresentative={(rep) => {
          onAddRepresentative({ ...rep, governorate: selectedGov });
          setIsAddRepOpen(false);
          showToast(`تمت إضافة المندوب في محافظة ${selectedGov} بنجاح!`, 'success');
        }}
        onOpenDocViewer={() => {}}
        onPreviewAvatar={() => {}}
      />

      <AdminPayoutActionModal
        modalData={payoutActionModalData}
        onClose={() => setPayoutActionModalData(null)}
        onUpdatePayoutRequest={(payout) => {
          if (onUpdatePayoutRequest) {
            onUpdatePayoutRequest(payout);
            showToast('تم تحديث حالة طلب السحب بنجاح!', 'success');
          }
        }}
        onSelectReceiptPhoto={(photo) => setSelectedReceiptPhoto(photo)}
      />

      <AdminReceiptModal
        receiptPhoto={selectedReceiptPhoto}
        onClose={() => setSelectedReceiptPhoto(null)}
      />

      {selectedLeadForWhatsApp && (
        <LeadWhatsAppModal
          lead={selectedLeadForWhatsApp}
          onClose={() => setSelectedLeadForWhatsApp(null)}
          onUpdateLead={onUpdateLead}
        />
      )}
    </>
  );
};
