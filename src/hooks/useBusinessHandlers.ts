import { useCallback } from 'react';
import {
  Business,
  Representative,
  InterestedLead,
  User,
  NotificationCategory,
  UserRole,
} from '../types';
import { isRepAccountDeleted } from '../utils/accountStatus';
import {
  safeSetLocalStorageItem,
} from '../utils/storage';
import {
  saveBusinessToDb,
  updateBusinessInDb,
  deleteBusinessFromDb,
  softDeleteBusinessInDb,
  restoreBusinessInDb,
  hardDeleteBusinessFromDb,
} from '../services/db';
import { findDuplicatePhoneEntity } from '../utils/phoneValidator';

export interface UseBusinessHandlersProps {
  user: User | null;
  currentRep: Representative;
  businesses: Business[];
  setBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
  leads: InterestedLead[];
  deletedBusinesses: Business[];
  setDeletedBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
  editingBusiness: Business | null;
  setEditingBusiness: React.Dispatch<React.SetStateAction<Business | null>>;
  selectedInvoiceBiz: Business | null;
  setSelectedInvoiceBiz: React.Dispatch<React.SetStateAction<Business | null>>;
  selectedPayBiz: Business | null;
  setSelectedPayBiz: React.Dispatch<React.SetStateAction<Business | null>>;
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

export function useBusinessHandlers({
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
}: UseBusinessHandlersProps) {
  const handleAddBusiness = useCallback(async (newBiz: Business) => {
    // 🛡️ CRITICAL SECURITY GATE: Strictly reject submissions from deleted/blacklisted representatives
    const targetRepId = newBiz.repId || currentRep.id || user?.id;
    const targetRepName = newBiz.repName || currentRep.name || user?.name;
    const isTargetDeleted =
      isRepAccountDeleted(user) ||
      isRepAccountDeleted(currentRep) ||
      isRepAccountDeleted({ id: targetRepId, name: targetRepName });

    if (isTargetDeleted) {
      addNotification('تم رفض تسجيل النشاط: هذا الحساب تم حذفه أو تعطيله من قِبل إدارة المنظومة.', 'error');
      if (user && isRepAccountDeleted(user)) {
        handleLogout();
      }
      return;
    }

    // 🛡️ CRITICAL DUPLICATE PHONE GATE: Reject registration if phone is already in businesses or active leads
    const dupPhone = findDuplicatePhoneEntity(newBiz.phone, { businesses, leads, excludeId: newBiz.id, excludeLeadId: newBiz.convertedFromLeadId }) ||
                     findDuplicatePhoneEntity(newBiz.ownerPhone, { businesses, leads, excludeId: newBiz.id, excludeLeadId: newBiz.convertedFromLeadId }) ||
                     findDuplicatePhoneEntity(newBiz.secondaryPhone, { businesses, leads, excludeId: newBiz.id, excludeLeadId: newBiz.convertedFromLeadId });
    if (dupPhone) {
      const entityTypeStr = dupPhone.type === 'business' ? 'نشاط تجاري مسجل مسبقاً' : 'عميل مهتم / مراجعة مسجلة';
      addNotification(`تعذر حفظ النشاط: رقم الهاتف (${dupPhone.phone}) مسجل بالفعل مع ${entityTypeStr}: "${dupPhone.name}". لا يمكن تكرار تسجيل نفس رقم الهاتف.`, 'error');
      return;
    }

    // 1. Automatically calculate payment status from amountPaid and packagePrice
    const isExempt = Boolean(newBiz.isFeeExempt || newBiz.packagePrice === 0);
    const autoPaymentStatus = isExempt
      ? 'fully_paid'
      : (newBiz.amountPaid || 0) >= (newBiz.packagePrice || 250)
      ? 'fully_paid'
      : (newBiz.amountPaid || 0) > 0
      ? 'partially_paid'
      : 'unpaid';

    const normalizedBiz: Business = {
      ...newBiz,
      repId: newBiz.repId || currentRep.id || user?.id || 'rep_1',
      repName: newBiz.repName || currentRep.name || user?.name || 'مندوب معتمد',
      paymentStatus: autoPaymentStatus,
    };

    // ⚡ 1. INSTANT OPTIMISTIC STATE & MULTI-TIER CACHE (0ms - Instantly visible at top)
    setBusinesses((prev) => [normalizedBiz, ...prev.filter((b) => b.id !== normalizedBiz.id)]);

    // Also update directory portal cache in localStorage immediately (strictly verified only)
    try {
      const allUpdated = [normalizedBiz, ...businesses.filter((b) => b.id !== normalizedBiz.id)];
      safeSetLocalStorageItem('dalelak_cached_businesses', JSON.stringify(allUpdated));
      const directoryCache = allUpdated.filter((b) => b.verificationStatus === 'verified' && b.publishedStatus !== 'draft' && b.publishedStatus !== 'unlisted');
      safeSetLocalStorageItem('dalelak_directory_cache', JSON.stringify(directoryCache));
    } catch {}

    setActiveTab('home');

    // ⚡ Open the invoice immediately so the representative and client can view and photograph it
    setSelectedInvoiceBiz(normalizedBiz);

    // ⚡ 2. Instant Cross-Tab Broadcast (Real-Time across all windows)
    try {
      const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (syncChannel) {
        syncChannel.postMessage({ type: 'SYNC_DATA', newBusiness: normalizedBiz });
        syncChannel.close();
      }
    } catch {}

    addNotification(`تم تسجيل النشاط التجاري "${normalizedBiz.nameAr}" بنجاح وهو متاح الآن في قائمتك والدليل.`, 'success');

    // Broadcast notification for Admin
    addSystemNotification({
      title: 'تسجيل نشاط تجاري جديد',
      message: `قام المندوب "${normalizedBiz.repName || user?.name || 'ميداني'}" بتسجيل نشاط جديد "${normalizedBiz.nameAr}" في (${normalizedBiz.governorate} - ${normalizedBiz.city}).`,
      type: 'info',
      category: 'business',
      targetRole: 'admin',
      linkTab: 'admin',
    });

    // Personal confirmation notification for registering representative
    if (normalizedBiz.repId || user?.id) {
      addSystemNotification({
        title: `تم تسجيل نشاطك: ${normalizedBiz.nameAr}`,
        message: `تم تسليم وحفظ بيانات النشاط "${normalizedBiz.nameAr}" بنجاح وجاري مراجعته وتوثيقه.`,
        type: 'success',
        category: 'business',
        targetUserId: normalizedBiz.repId || user?.id,
        entityId: normalizedBiz.id,
        entityType: 'business',
        linkTab: 'home',
      });
    }

    // ⚡ 3. ASYNCHRONOUS DATABASE SYNC (Non-blocking background save to Supabase Cloud - Zero Refetch)
    saveBusinessToDb(normalizedBiz).then((res) => {
      if (res && res.cloudSaved) {
        console.log('Business saved to Supabase cloud successfully:', normalizedBiz.id);
      } else {
        console.warn('Business saved locally/offline, awaiting background sync:', res?.error);
      }
    }).catch((err) => {
      console.warn('Background Supabase save notice:', err);
    });
  }, [currentRep, user, businesses, leads, setBusinesses, setActiveTab, setSelectedInvoiceBiz, addNotification, addSystemNotification, handleLogout]);

  const handleUpdateBusiness = useCallback(async (updatedBiz: Business) => {
    const prevBiz = businesses.find((b) => b.id === updatedBiz.id);

    // Automatically recalculate payment status based on amountPaid and packagePrice
    const isExempt = Boolean(updatedBiz.isFeeExempt || updatedBiz.packagePrice === 0);
    const autoPaymentStatus = isExempt
      ? 'fully_paid'
      : (updatedBiz.amountPaid || 0) >= (updatedBiz.packagePrice || 250)
      ? 'fully_paid'
      : (updatedBiz.amountPaid || 0) > 0
      ? 'partially_paid'
      : 'unpaid';

    const normalizedBiz: Business = {
      ...updatedBiz,
      packagePrice: isExempt ? 0 : (updatedBiz.packagePrice ?? 250),
      amountPaid: isExempt ? 0 : (updatedBiz.amountPaid || 0),
      isFeeExempt: isExempt,
      paymentStatus: autoPaymentStatus,
    };

    setBusinesses((prev) => {
      const updated = prev.map((b) => (b.id === normalizedBiz.id ? normalizedBiz : b));
      try {
        safeSetLocalStorageItem('dalelak_cached_businesses', JSON.stringify(updated));
        const directoryCache = updated.filter((b) => b.verificationStatus === 'verified' && b.publishedStatus !== 'draft' && b.publishedStatus !== 'unlisted');
        safeSetLocalStorageItem('dalelak_directory_cache', JSON.stringify(directoryCache));
      } catch {}
      return updated;
    });

    // Keep editingBusiness in sync if modal is currently open
    setEditingBusiness((prev) => (prev && prev.id === normalizedBiz.id ? normalizedBiz : prev));

    // Instant Cross-Tab Broadcast to Directory Portal
    try {
      const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (syncChannel) {
        syncChannel.postMessage({ type: 'SYNC_DATA', newBusiness: normalizedBiz });
        syncChannel.close();
      }
    } catch {}

    await updateBusinessInDb(normalizedBiz.id, normalizedBiz);

    // 1. Verification status change notification
    if (prevBiz && prevBiz.verificationStatus !== normalizedBiz.verificationStatus) {
      const statusMap: Record<string, string> = {
        verified: 'مقبول وموثق',
        rejected: 'مرفوض',
        in_progress: 'قيد المراجعة',
      };
      const newStatus = statusMap[normalizedBiz.verificationStatus] || normalizedBiz.verificationStatus;
      addNotification(`تم تحديث حالة نشاط "${normalizedBiz.nameAr}" إلى: ${newStatus}`, 'info');

      addSystemNotification({
        title: 'تحديث توثيق النشاط',
        message: `تم تحديث حالة التوثيق لنشاط "${normalizedBiz.nameAr}" إلى (${newStatus}).`,
        type: normalizedBiz.verificationStatus === 'verified' ? 'success' : 'info',
        category: 'business',
        targetRole: 'admin',
        targetUserId: normalizedBiz.repId || user?.id,
        linkTab: 'home',
      });
    } else {
      addNotification(`تم حفظ تعديلات نشاط "${normalizedBiz.nameAr}" بنجاح.`, 'success');
    }

    // 2. Automated Payment lifecycle interaction & Commission Unlock notification for Rep
    if (prevBiz && (prevBiz.amountPaid !== normalizedBiz.amountPaid || prevBiz.paymentStatus !== normalizedBiz.paymentStatus)) {
      const addedAmt = (normalizedBiz.amountPaid || 0) - (prevBiz.amountPaid || 0);
      if (addedAmt > 0) {
        addNotification(`تم تحصيل وتأكيد سداد مبلغ ${addedAmt} ج.م لنشاط "${normalizedBiz.nameAr}" بنجاح (${normalizedBiz.paymentStatus === 'fully_paid' ? 'مسدد بالكامل' : 'مسدد جزئياً'}).`, 'success');
      }

      addSystemNotification({
        title: 'تحديث تحصيل سداد',
        message: `تم تحديث مدفوعات نشاط "${normalizedBiz.nameAr}" (المبلغ المدفوع: ${normalizedBiz.amountPaid} ج.م - الحالة: ${normalizedBiz.paymentStatus === 'fully_paid' ? 'مدفوع بالكامل' : 'مدفوع جزئياً'}).`,
        type: 'success',
        category: 'payment',
        targetRole: 'admin',
        linkTab: 'invoices',
      });

      // If payment was added, notify the rep that commission is unlocked and available
      if ((normalizedBiz.amountPaid || 0) > (prevBiz.amountPaid || 0) && normalizedBiz.repId) {
        addSystemNotification({
          title: 'تم سداد الفاتورة - عمولتك متاحة للسحب',
          message: `تم تسجيل سداد مبلغ ${normalizedBiz.amountPaid} ج.م لنشاط "${normalizedBiz.nameAr}"، وأصبحت عمولتك المستحقة متاحة للسحب الفوري في محفظتك.`,
          type: 'success',
          category: 'payment',
          targetUserId: normalizedBiz.repId,
          linkTab: 'profile',
        });
      }
    }
  }, [businesses, setBusinesses, setEditingBusiness, user, addNotification, addSystemNotification]);

  const handleDeleteBusiness = useCallback(async (id: string) => {
    const biz = businesses.find((b) => b.id === id);

    // 1. Immediately remove from businesses state and update cache
    setBusinesses((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      try {
        safeSetLocalStorageItem('dalelak_cached_businesses', JSON.stringify(updated));
        const directoryCache = updated.filter((b) => b.verificationStatus === 'verified' && b.publishedStatus !== 'draft' && b.publishedStatus !== 'unlisted');
        safeSetLocalStorageItem('dalelak_directory_cache', JSON.stringify(directoryCache));
      } catch {}
      return updated;
    });

    // 2. Clean up any open modals or selected references
    if (editingBusiness?.id === id) setEditingBusiness(null);
    if (selectedInvoiceBiz?.id === id) setSelectedInvoiceBiz(null);
    if (selectedPayBiz?.id === id) setSelectedPayBiz(null);

    // 3. Delete associated system notifications
    setSystemNotifications((prev) =>
      prev.filter(
        (n) =>
          !(
            (n.category === 'business' || n.category === 'payment') &&
            ((n.entityId && n.entityId === id) || (biz && n.message && n.message.includes(biz.nameAr)))
          )
      )
    );

    // 4. Soft Delete: preserves data for review
    if (biz) {
      const deletedBy = user?.name || user?.email || 'مدير النظام';
      const deletedByRole = user?.repData?.roleTitle || user?.roleTitle || user?.role || 'admin';
      await softDeleteBusinessInDb(biz, deletedBy, deletedByRole);
      setDeletedBusinesses((prev) => [
        {
          ...biz,
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy,
          deletedByRole,
        },
        ...prev.filter((b) => b.id !== id),
      ]);
    } else {
      await deleteBusinessFromDb(id);
    }

    // 5. Broadcast deletion to other open browser tabs
    try {
      const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (syncChannel) {
        syncChannel.postMessage({ type: 'DELETE_BUSINESS', deletedId: id });
        syncChannel.close();
      }
    } catch {}

    // 6. User Feedback
    addNotification(`تم حذف نشاط "${biz?.nameAr || 'المحدد'}" بنجاح.`, 'warning');
  }, [businesses, setBusinesses, editingBusiness, setEditingBusiness, selectedInvoiceBiz, setSelectedInvoiceBiz, selectedPayBiz, setSelectedPayBiz, setSystemNotifications, user, setDeletedBusinesses, addNotification]);

  const handleRestoreBusiness = useCallback(async (biz: Business) => {
    const restored = await restoreBusinessInDb(biz);
    setDeletedBusinesses((prev) => prev.filter((b) => b.id !== biz.id));
    setBusinesses((prev) => [restored, ...prev.filter((b) => b.id !== biz.id)]);
    addNotification(`تم استرجاع نشاط "${biz.nameAr}" وإعادته نشطاً للمنظومة بنجاح.`, 'success');
  }, [setDeletedBusinesses, setBusinesses, addNotification]);

  const handleHardDeleteBusiness = useCallback(async (id: string) => {
    const biz = deletedBusinesses.find((b) => b.id === id) || businesses.find((b) => b.id === id);
    await hardDeleteBusinessFromDb(id);
    setDeletedBusinesses((prev) => prev.filter((b) => b.id !== id));
    setBusinesses((prev) => prev.filter((b) => b.id !== id));
    addNotification(`تم الحذف النهائي البات لنشاط "${biz?.nameAr || 'المحدد'}" من قاعدة البيانات والسيرفر.`, 'warning');
  }, [deletedBusinesses, businesses, setDeletedBusinesses, setBusinesses, addNotification]);

  return {
    handleAddBusiness,
    handleUpdateBusiness,
    handleDeleteBusiness,
    handleRestoreBusiness,
    handleHardDeleteBusiness,
  };
}
