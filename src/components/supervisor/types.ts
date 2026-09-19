import {
  Business,
  Representative,
  User,
  PayoutRequest,
  InterestedLead,
  PaymentGatewayConfig,
} from '../../types';

export type SupervisorSubView = 'hub' | 'reps' | 'target' | 'businesses' | 'finance' | 'map' | 'leads';

export interface SupervisorDashboardProps {
  currentUser: User;
  businesses: Business[];
  representatives: Representative[];
  paymentConfig?: PaymentGatewayConfig;
  payoutRequests?: PayoutRequest[];
  leads?: InterestedLead[];
  onAddNewClick: () => void;
  onShowInvoice: (biz: Business) => void;
  onCollectPayment?: (biz: Business) => void;
  onEditBusiness?: (biz: Business) => void;
  onUpdateBusiness: (biz: Business) => void;
  onDeleteBusiness?: (id: string) => void;
  onAddRepresentative: (rep: Partial<Representative>) => void;
  onUpdateRepresentative?: (rep: Representative) => void;
  onDeleteRepresentative?: (id: string) => void;
  onUpdatePayoutRequest?: (payout: PayoutRequest) => void;
  onCreateLead?: (lead: InterestedLead) => void;
  onUpdateLead?: (lead: InterestedLead) => void;
  onDeleteLead?: (id: string) => void;
  onConvertToBusiness?: (lead: InterestedLead) => void;
  onDirectConvertLead?: (lead: InterestedLead) => void;
  onSwitchToAdvancedAdmin?: () => void;
  onLogout: () => void;
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export interface SupervisorMetrics {
  totalBusinesses: number;
  verifiedBusinesses: number;
  pendingBusinesses: number;
  unpaidBusinesses: number;
  totalReps: number;
  activeReps: number;
  effectiveGovTarget: number;
  targetPercent: number;
  totalCashInRepsHands: number;
  totalDebtToPlatform: number;
  pendingPayoutsCount: number;
  pendingPayoutsAmount: number;
}
