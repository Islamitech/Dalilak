import { useState } from 'react';
import { Business, Representative, PayoutRequest, InterestedLead } from '../../../types';

export interface UseSupervisorModalsProps {
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const useSupervisorModals = ({ onShowNotification }: UseSupervisorModalsProps = {}) => {
  const [selectedDrawerBiz, setSelectedDrawerBiz] = useState<Business | null>(null);
  const [selectedDossierRep, setSelectedDossierRep] = useState<Representative | null>(null);
  const [isAddRepOpen, setIsAddRepOpen] = useState(false);
  const [selectedLeadForWhatsApp, setSelectedLeadForWhatsApp] = useState<InterestedLead | null>(null);
  const [payoutActionModalData, setPayoutActionModalData] = useState<{
    payout: PayoutRequest;
    action: 'approve' | 'reject';
  } | null>(null);
  const [selectedReceiptPhoto, setSelectedReceiptPhoto] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'info' | 'warning' = 'info') => {
    if (onShowNotification) {
      onShowNotification(msg, type);
    } else {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return {
    selectedDrawerBiz,
    setSelectedDrawerBiz,
    selectedDossierRep,
    setSelectedDossierRep,
    isAddRepOpen,
    setIsAddRepOpen,
    selectedLeadForWhatsApp,
    setSelectedLeadForWhatsApp,
    payoutActionModalData,
    setPayoutActionModalData,
    selectedReceiptPhoto,
    setSelectedReceiptPhoto,
    toastMessage,
    showToast,
  };
};
