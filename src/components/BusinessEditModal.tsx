import React from 'react';
import { BusinessDetailsDrawer } from './BusinessDetailsDrawer';
import { Business, User } from '../types';

export interface BusinessEditModalProps {
  business: Business | null;
  onClose: () => void;
  onSave?: (updatedBiz: Business) => void;
  userRole?: string;
  currentRoleTitle?: string;
  currentUser?: User | null;
  currentUserName?: string;
  currentUserId?: string;
  initialTab?: string;
  canEdit?: boolean;
  onShowInvoice?: (business: Business, additionalInvoiceId?: string) => void;
  onCollectPayment?: (business: Business) => void;
  onDeleteBusiness?: (id: string) => void;
  businesses?: Business[];
}

export const BusinessEditModal: React.FC<BusinessEditModalProps> = ({
  business,
  onClose,
  onSave,
  currentUser,
  userRole,
  currentUserName,
  currentUserId,
  onShowInvoice,
  onCollectPayment,
  onDeleteBusiness,
}) => {
  if (!business) return null;

  const resolvedUser: User = currentUser || {
    id: currentUserId || 'user',
    name: currentUserName || 'المستخدم',
    role: (userRole as any) || 'admin',
    email: '',
  };

  return (
    <BusinessDetailsDrawer
      business={business}
      isOpen={Boolean(business)}
      onClose={onClose}
      onShowInvoice={onShowInvoice}
      onCollectPayment={onCollectPayment}
      onUpdateBusiness={onSave}
      onDeleteBusiness={onDeleteBusiness}
      currentUser={resolvedUser}
    />
  );
};
