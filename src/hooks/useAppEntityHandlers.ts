import {
  Business,
  Representative,
  PayoutRequest,
  InterestedLead,
  PaymentGatewayConfig,
  User,
  NotificationCategory,
  UserRole,
} from '../types';
import { useBusinessHandlers } from './useBusinessHandlers';
import { useLeadHandlers } from './useLeadHandlers';
import { usePaymentHandlers } from './usePaymentHandlers';
import { useRepHandlers } from './useRepHandlers';

export interface UseAppEntityHandlersProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  currentRep: Representative;
  businesses: Business[];
  setBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
  representatives: Representative[];
  setRepresentatives: React.Dispatch<React.SetStateAction<Representative[]>>;
  payoutRequests: PayoutRequest[];
  setPayoutRequests: React.Dispatch<React.SetStateAction<PayoutRequest[]>>;
  leads: InterestedLead[];
  setLeads: React.Dispatch<React.SetStateAction<InterestedLead[]>>;
  deletedBusinesses: Business[];
  setDeletedBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
  deletedRepresentatives: Representative[];
  setDeletedRepresentatives: React.Dispatch<React.SetStateAction<Representative[]>>;
  paymentConfig: PaymentGatewayConfig;
  setPaymentConfig: React.Dispatch<React.SetStateAction<PaymentGatewayConfig>>;
  editingBusiness: Business | null;
  setEditingBusiness: React.Dispatch<React.SetStateAction<Business | null>>;
  selectedInvoiceBiz: Business | null;
  setSelectedInvoiceBiz: React.Dispatch<React.SetStateAction<Business | null>>;
  selectedPayBiz: Business | null;
  setSelectedPayBiz: React.Dispatch<React.SetStateAction<Business | null>>;
  convertingLead: InterestedLead | null;
  setConvertingLead: React.Dispatch<React.SetStateAction<InterestedLead | null>>;
  setSystemNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  setActiveTab: (tab: string) => void;
  addNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  addSystemNotification: (item: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    category?: NotificationCategory;
    targetRole?: UserRole | 'all';
    targetUserId?: string;
    linkTab?: string;
    entityId?: string;
    entityType?: 'business' | 'rep' | 'invoice';
  }) => void;
  handleLogout: () => void;
}

export function useAppEntityHandlers({
  user,
  setUser,
  currentRep,
  businesses,
  setBusinesses,
  representatives,
  setRepresentatives,
  payoutRequests,
  setPayoutRequests,
  leads,
  setLeads,
  deletedBusinesses,
  setDeletedBusinesses,
  deletedRepresentatives,
  setDeletedRepresentatives,
  paymentConfig,
  setPaymentConfig,
  editingBusiness,
  setEditingBusiness,
  selectedInvoiceBiz,
  setSelectedInvoiceBiz,
  selectedPayBiz,
  setSelectedPayBiz,
  convertingLead,
  setConvertingLead,
  setSystemNotifications,
  setActiveTab,
  addNotification,
  addSystemNotification,
  handleLogout,
}: UseAppEntityHandlersProps) {
  // 1. Business domain handlers
  const {
    handleAddBusiness,
    handleUpdateBusiness,
    handleDeleteBusiness,
    handleRestoreBusiness,
    handleHardDeleteBusiness,
  } = useBusinessHandlers({
    user,
    currentRep,
    businesses,
    setBusinesses,
    leads,
    deletedBusinesses,
    setDeletedBusinesses,
    editingBusiness,
    setEditingBusiness,
    selectedInvoiceBiz,
    setSelectedInvoiceBiz,
    selectedPayBiz,
    setSelectedPayBiz,
    setSystemNotifications,
    setActiveTab,
    addNotification,
    addSystemNotification,
    handleLogout,
  });

  // 2. Lead domain handlers
  const {
    handleCreateLead,
    handleUpdateLead,
    handleDeleteLead,
    handleConvertToBusiness,
    handleDirectConvertLeadToBusiness,
  } = useLeadHandlers({
    user,
    currentRep,
    leads,
    setLeads,
    setConvertingLead,
    setActiveTab,
    handleAddBusiness,
    addNotification,
    addSystemNotification,
  });

  // 3. Payout & Payment config handlers
  const {
    handleCreatePayoutRequest,
    handleUpdatePayoutRequest,
    handleDeletePayoutRequest,
    handleUpdatePaymentConfig,
  } = usePaymentHandlers({
    payoutRequests,
    setPayoutRequests,
    setPaymentConfig,
    addNotification,
    addSystemNotification,
  });

  // 4. Representative & Profile handlers
  const {
    handleUpdateUserProfile,
    handleAddRepresentative,
    handleUpdateRepresentative,
    handleRestoreRepresentative,
    handleHardDeleteRepresentative,
    handleDeleteRepresentative,
  } = useRepHandlers({
    user,
    setUser,
    representatives,
    setRepresentatives,
    deletedRepresentatives,
    setDeletedRepresentatives,
    addNotification,
    addSystemNotification,
  });

  return {
    handleAddBusiness,
    handleUpdateBusiness,
    handleDeleteBusiness,
    handleRestoreBusiness,
    handleHardDeleteBusiness,
    handleCreatePayoutRequest,
    handleUpdatePayoutRequest,
    handleDeletePayoutRequest,
    handleCreateLead,
    handleUpdateLead,
    handleDeleteLead,
    handleConvertToBusiness,
    handleDirectConvertLeadToBusiness,
    handleUpdateUserProfile,
    handleAddRepresentative,
    handleUpdateRepresentative,
    handleRestoreRepresentative,
    handleHardDeleteRepresentative,
    handleDeleteRepresentative,
    handleUpdatePaymentConfig,
  };
}

export * from './useBusinessHandlers';
export * from './useLeadHandlers';
export * from './usePaymentHandlers';
export * from './useRepHandlers';
