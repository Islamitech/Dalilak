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
  packageTitle?: string; // alias for display
  packagePrice: number; // in EGP
  amountPaid: number;   // in EGP
  paymentMethod?: 'cash_by_rep' | 'platform_collected' | 'gateway_online' | 'bank_transfer' | 'other'; // طريقة الاستلام
  cashCollectedByRep?: number; // المبلغ الكاش المستلم في يد المندوب
  paymentStatus: PaymentStatus;
  verificationStatus: VerificationStatus;
  googleMapsUrl?: string;
  googlePlaceId?: string;
  googleSyncStatus?: 'synced' | 'in_progress' | 'failed' | 'not_synced';
  googleSyncDate?: string;
  invoiceNumber: string;
  invoiceDate: string;
  repCommissionRate?: number;
  notes?: string;
  createdDate: string;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  createdAt: number;
}

export type UserRole = 'admin' | 'rep' | 'supervisor' | 'accountant';

export interface Representative {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId?: string;
  activationFacePhoto?: string; // صورة وجه التفعيل والتحقق الإداري (سجلات مدير التطبيق فقط)
  nationalIdCardPhoto?: string; // صورة وجه البطاقة الأمامي (سجلات مدير التطبيق فقط)
  nationalIdCardBackPhoto?: string; // صورة ظهر البطاقة الخلفي (سجلات مدير التطبيق فقط)
  role?: UserRole;
  roleTitle?: string;
  governorate: string;
  targetMonth: number;
  avatar?: string; // صورة الملف الشخصي المعتادة (اختيارية)
  avatarStatus?: 'none' | 'pending_approval' | 'approved' | 'rejected';
  pendingPhone?: string; // رقم الهاتف الجديد المطلوب اعتماده من المسؤول
  phoneStatus?: 'none' | 'pending_approval' | 'approved' | 'rejected'; // حالة اعتماد تعديل رقم الهاتف
  commissionRate: number; // Percentage, e.g., 42.86%
  status?: 'active' | 'suspended';
  password?: string;
  activeSessionId?: string;
  lastActiveTimestamp?: number;
  referralCode?: string; // كود الإحالة الخاص بالمندوب
  referredByCode?: string; // كود المندوب الذي قام بدعوته
  referralUnlocked?: boolean; // هل تم فتح كود الإحالة للمندوب
  adminBypassReferral?: boolean; // تجاوز وتفعيل يدوي من قبل المدير
  referralRewardGranted?: boolean; // هل تم منح هدية الدعوة لمن دعاه
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
  phone?: string;
  role: 'admin' | 'rep' | 'supervisor' | 'accountant';
  avatar?: string;
  avatarStatus?: 'none' | 'pending_approval' | 'approved' | 'rejected';
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

export type NotificationCategory = 'account' | 'business' | 'payment' | 'avatar' | 'system' | 'payout';

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
  entityType?: 'business' | 'rep' | 'invoice' | 'payout';
}

export type PayoutMethod = 'vodafone_cash' | 'instapay' | 'orange_cash' | 'etisalat_cash' | 'we_pay' | 'bank_transfer' | 'cash';
export type PayoutStatus = 'pending' | 'approved' | 'rejected';

export interface PayoutRequest {
  id: string;
  repId: string;
  repName: string;
  repPhone: string;
  amount: number;
  method: PayoutMethod;
  accountDetails: string; // رقم المحفظة أو معرف إنستاباي أو الحساب
  status: PayoutStatus;
  requestDate: string; // ISO String
  processedDate?: string; // ISO String
  adminNotes?: string;
  transactionRef?: string;
  receiptPhoto?: string;
  type?: 'payout' | 'remittance'; // طلب سحب أرباح أو إشعار توريد سداد للمنصة
}

export type LeadInterestLevel = 'high' | 'medium' | 'low' | 'intro_sent' | 'need_visit';
export type LeadStatus = 'pending_followup' | 'contacted' | 'converted' | 'cancelled';

export interface InterestedLead {
  id: string;
  clientName: string;
  businessName?: string;
  businessCategory?: string;
  phone: string;
  secondaryPhone?: string;
  governorate: string;
  city?: string;
  interestLevel: LeadInterestLevel;
  notes?: string;
  followUpDate?: string;
  createdDate: string;
  repId: string;
  repName: string;
  lastContactedDate?: string;
  status: LeadStatus;
}

