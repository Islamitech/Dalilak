import { User, UserRole, Business } from '../types';

export interface RolePermissions {
  role: UserRole;
  title: string;
  badgeColor: string;
  description: string;
  canManageAllBusinesses: boolean;
  canManageRegionalBusinesses: boolean;
  canAddBusiness: boolean;
  canEditAnyBusiness: boolean;
  canEditOwnBusiness: boolean;
  canDeleteBusiness: boolean;
  canSyncGoogleMaps: boolean;
  canManageAccounts: boolean;
  canDeleteAccounts: boolean;
  canChangeUserRoles: boolean;
  canManagePaymentGateways: boolean;
  canApprovePayouts: boolean;
  canRequestPayout: boolean;
  canCollectDebt: boolean;
  canAccessAdminPanel: boolean;
  canAccessAllLeads: boolean;
  canAccessOwnLeads: boolean;
}

export const ROLE_DEFINITIONS: Record<UserRole, RolePermissions> = {
  admin: {
    role: 'admin',
    title: 'مدير النظام (صلاحيات كاملة)',
    badgeColor: 'from-amber-500 to-yellow-500 text-slate-950',
    description: 'التحكم الإداري والسيادي الشامل بالمنظومة، الحسابات، بوابات الدفع، الأنشطة، التحصيلات، المزامنة، وصرف العمولات.',
    canManageAllBusinesses: true,
    canManageRegionalBusinesses: true,
    canAddBusiness: true,
    canEditAnyBusiness: true,
    canEditOwnBusiness: true,
    canDeleteBusiness: true,
    canSyncGoogleMaps: true,
    canManageAccounts: true,
    canDeleteAccounts: true,
    canChangeUserRoles: true,
    canManagePaymentGateways: true,
    canApprovePayouts: true,
    canRequestPayout: true,
    canCollectDebt: true,
    canAccessAdminPanel: true,
    canAccessAllLeads: true,
    canAccessOwnLeads: true,
  },
  supervisor: {
    role: 'supervisor',
    title: 'مشرف الإدارة (صلاحيات إدارية كاملة ما عدا حذف الحسابات)',
    badgeColor: 'from-purple-600 to-indigo-600 text-white',
    description: 'إشراف وتحكم شامل بكافة الأنشطة، الإحصائيات، الحسابات، التوثيق، والمزامنة مع الحساب الرسمي. القيد الوحيد: لا يمكنه حذف الحسابات.',
    canManageAllBusinesses: true,
    canManageRegionalBusinesses: true,
    canAddBusiness: true,
    canEditAnyBusiness: true,
    canEditOwnBusiness: true,
    canDeleteBusiness: true,
    canSyncGoogleMaps: true,
    canManageAccounts: true,
    canDeleteAccounts: false, // القيد الوحيد لمشرف الإدارة
    canChangeUserRoles: true,
    canManagePaymentGateways: true,
    canApprovePayouts: true,
    canRequestPayout: true,
    canCollectDebt: true,
    canAccessAdminPanel: true,
    canAccessAllLeads: true,
    canAccessOwnLeads: true,
  },
  accountant: {
    role: 'accountant',
    title: 'محاسب ومحصل (لوحة الإدارة والإحصائيات والحسابات بالكامل + تسجيل أنشطة)',
    badgeColor: 'from-emerald-600 to-teal-600 text-white',
    description: 'الوصول للوحة الإدارة والإحصائيات، إدارة كافة الحسابات والأنشطة، تسجيل أنشطة جديدة، تحصيل الفواتير، وصرف العمولات.',
    canManageAllBusinesses: true,
    canManageRegionalBusinesses: true,
    canAddBusiness: true,
    canEditAnyBusiness: true,
    canEditOwnBusiness: true,
    canDeleteBusiness: false,
    canSyncGoogleMaps: true,
    canManageAccounts: true,
    canDeleteAccounts: false,
    canChangeUserRoles: false,
    canManagePaymentGateways: true,
    canApprovePayouts: true,
    canRequestPayout: true,
    canCollectDebt: true,
    canAccessAdminPanel: true,
    canAccessAllLeads: true,
    canAccessOwnLeads: true,
  },
  rep: {
    role: 'rep',
    title: 'مندوب معتمد (تسجيل ميداني ومبيعات)',
    badgeColor: 'from-blue-600 to-indigo-600 text-white',
    description: 'تسجيل الأنشطة التجارية الجديدة، تسجيل العملاء المهتمين ومتابعتهم، متابعة الأرباح والعمولات وسحبها.',
    canManageAllBusinesses: false,
    canManageRegionalBusinesses: false,
    canAddBusiness: true,
    canEditAnyBusiness: false,
    canEditOwnBusiness: true,
    canDeleteBusiness: false,
    canSyncGoogleMaps: false,
    canManageAccounts: false,
    canDeleteAccounts: false,
    canChangeUserRoles: false,
    canManagePaymentGateways: false,
    canApprovePayouts: false,
    canRequestPayout: true,
    canCollectDebt: false, // المندوب لا يملك صلاحية تحصيل الديون المؤجلة - فقط الإدارة والمحاسب
    canAccessAdminPanel: false,
    canAccessAllLeads: false,
    canAccessOwnLeads: true,
  },
};

/**
 * Checks if a user has permission to edit a specific business
 */
export function canUserEditBusiness(user: User | null | undefined, business: Business): boolean {
  if (!user || !business) return false;
  if (user.role === 'admin' || user.role === 'supervisor' || user.role === 'accountant') return true;

  // Representative can only edit their own registered businesses matching their verified ID
  if (
    business.repId &&
    (business.repId === user.id || business.repId === user.repData?.id)
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if a user has permission to delete a specific business:
 * 1. Admin and Supervisor can delete any business.
 * 2. Representative / User can delete their OWN registered business ONLY IF it has NOT been verified or synced on Google Maps yet.
 */
export function canUserDeleteBusiness(user: User | null | undefined, business: Business): boolean {
  if (!user || !business) return false;

  // 1. Admin and Supervisor have unrestricted deletion privileges
  if (user.role === 'admin' || user.role === 'supervisor') return true;

  // 2. Representative or Creator can delete their OWN business if not verified or synced yet (strictly by ID)
  const isOwnBusiness = Boolean(
    business.repId && (
      business.repId === user.id ||
      business.repId === user.repData?.id ||
      (user.email && business.repId.toLowerCase() === user.email.toLowerCase()) ||
      (user.repData?.phone && business.repId === user.repData.phone)
    )
  );

  if (isOwnBusiness) {
    const isAlreadyVerifiedOrSynced =
      business.verificationStatus === 'verified' ||
      business.googleSyncStatus === 'synced';
    return !isAlreadyVerifiedOrSynced;
  }

  return false;
}

/**
 * Checks if a user has permission to delete accounts/reps
 */
export function canUserDeleteAccount(user: User | null | undefined): boolean {
  if (!user) return false;
  // Only Admin can delete accounts (حذف الحسابات حصري لمدير النظام)
  return user.role === 'admin';
}

/**
 * Checks if a user has permission to access the management / admin panel
 */
export function canUserAccessAdminPanel(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'supervisor' || user.role === 'accountant';
}

/**
 * Checks if a user can approve or reject commission payout requests
 */
export function canUserManagePayouts(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'supervisor' || user.role === 'accountant';
}

/**
 * Checks if a user has permission to add or modify fee-exempt popular area activities
 * (إضافة أو تعديل الأنشطة الرائجة بالمنطقة المعفاة من الرسوم)
 */
export function canUserManageFeeExemption(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'supervisor' || user.role === 'accountant';
}

/**
 * 👑 SUPER ADMIN SUPREME IDENTITY
 * الحساب السيادي السري الأعلى لإدارة المنظومة وقاعدة البيانات بالكامل
 */
export const SUPER_ADMIN_EMAIL = 'ahmedhufne@gmail.com';
export const SUPER_ADMIN_PHONE = '01143888355';

/**
 * Checks whether a given user / rep is the designated Super Admin
 */
export function isSuperAdmin(user?: { email?: string; phone?: string; id?: string; repData?: any } | null): boolean {
  if (!user) return false;
  const email = (user.email || user.repData?.email || '').toLowerCase().trim();
  const phone = (user.phone || user.repData?.phone || '').trim();
  return email === SUPER_ADMIN_EMAIL.toLowerCase() || phone === SUPER_ADMIN_PHONE;
}

/**
 * Only Super Admin can perform Permanent Hard Deletes from server/database
 */
export function canUserHardDelete(user?: User | null | undefined): boolean {
  return isSuperAdmin(user);
}

/**
 * Only Super Admin can delete / purge payout requests and remittances
 */
export function canUserDeletePayout(user?: User | null | undefined): boolean {
  return isSuperAdmin(user);
}

/**
 * Only Super Admin can view the confidential Trash Bin & server audit archive
 */
export function canUserAccessTrash(user?: User | null | undefined): boolean {
  return isSuperAdmin(user);
}

/**
 * Allows Super Admin and Managers (Admin/Supervisor) to change roles of users, as defined in ROLE_DEFINITIONS
 */
export function canUserChangeRoles(user?: User | null | undefined): boolean {
  if (!user) return false;
  return isSuperAdmin(user) || user.role === 'admin' || user.role === 'supervisor';
}

/**
 * Protects Super Admin account from being modified, suspended, or deleted by any other admin
 */
export function canModifyAccount(
  actor?: User | null | undefined,
  target?: { email?: string; phone?: string; id?: string } | null | undefined
): boolean {
  if (!target) return true;
  // If target is Super Admin, only Super Admin himself can edit
  if (isSuperAdmin(target)) {
    return isSuperAdmin(actor);
  }
  return true;
}

