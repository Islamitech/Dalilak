export type PaymentStatus = 'fully_paid' | 'partially_paid' | 'unpaid';

export type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'rejected' | 'needs_action';

export interface Business {
  id: string;
  nameAr: string;
  nameEn?: string;
  category: string;
  governorate: string;
  city: string;
  street: string;
  landmark?: string;
  phone: string;
  secondaryPhone?: string;
  workingHours: string;
  description: string;
  lat: number;
  lng: number;
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
  nationalId?: string;
  photos: string[];
  repId: string;
  repName: string;
  packageId: string;
  packageName: string;
  packagePrice: number; // in EGP
  amountPaid: number;   // in EGP
  paymentStatus: PaymentStatus;
  verificationStatus: VerificationStatus;
  googleMapsUrl?: string;
  googlePlaceId?: string;
  googleSyncStatus?: 'synced' | 'in_progress' | 'failed' | 'not_synced';
  googleSyncDate?: string;
  invoiceNumber: string;
  invoiceDate: string;
  notes?: string;
  createdDate: string;
}

export type UserRole = 'admin' | 'rep' | 'supervisor' | 'accountant';

export interface Representative {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId?: string;
  role?: UserRole;
  roleTitle?: string;
  governorate: string;
  targetMonth: number;
  avatar?: string;
  avatarStatus?: 'none' | 'pending_approval' | 'approved' | 'rejected';
  commissionRate: number; // Percentage, e.g., 42.86%
  status?: 'active' | 'suspended';
  password?: string;
  activeSessionId?: string;
  lastActiveTimestamp?: number;
}

export interface PackageOption {
  id: string;
  title: string;
  price: number; // in EGP
  description: string;
  features: string[];
  popular?: boolean;
}

export interface FilterState {
  searchQuery: string;
  governorate: string;
  paymentStatus: string;
  verificationStatus: string;
  repId: string;
  category: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'rep' | 'supervisor' | 'accountant';
  repData?: Representative;
  activeSessionId?: string;
  lastActiveTimestamp?: number;
}

export interface PaymentGatewayConfig {
  vodafoneCashNumber: string;
  vodafoneCashNumber2?: string;
  fawryMerchantCode?: string;
  instaPayHandle?: string;
  cardGatewayActive?: boolean;
}

export type NotificationCategory = 'account' | 'business' | 'payment' | 'avatar' | 'system';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string; // ISO string
  type: 'info' | 'success' | 'warning' | 'error';
  category: NotificationCategory;
  targetRole?: UserRole | 'all';
  targetUserId?: string; // If specified, strictly for this rep/user
  read: boolean;
  linkTab?: string;
  entityId?: string; // Specific ID of the business or rep
  entityType?: 'business' | 'rep' | 'invoice';
}

