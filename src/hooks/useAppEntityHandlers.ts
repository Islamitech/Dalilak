import { useCallback } from 'react';
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
import { isRepAccountDeleted } from '../utils/accountStatus';
import { isSuperAdmin } from '../utils/permissions';
import {
  safeSetLocalStorageItem,
  safeSetSessionItem,
  safeRemoveLocalStorageItem,
  getSafeUserForStorage,
  getSafeRepsForStorage,
} from '../utils/storage';
import {
  saveBusinessToDb,
  updateBusinessInDb,
  deleteBusinessFromDb,
  softDeleteBusinessInDb,
  restoreBusinessInDb,
  hardDeleteBusinessFromDb,
  saveRepToDb,
  softDeleteRepInDb,
  restoreRepInDb,
  hardDeleteRepFromDb,
  createPayoutRequestInDb,
  updatePayoutRequestInDb,
  deletePayoutRequestFromDb,
  saveLeadToDb,
  updateLeadInDb,
  deleteLeadFromDb,
  savePaymentConfigToDb,
} from '../services/db';
import { sanitizePlaceNameAndAddress } from '../utils/googlePlaceExtractor';
import { findDuplicatePhoneEntity } from '../utils/phoneValidator';
import { findClosestCategory, BUSINESS_CATEGORIES } from '../data/mockData';

interface UseAppEntityHandlersProps {
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
  setPaymentConfig,
  editingBusiness,
  setEditingBusiness,
  selectedInvoiceBiz,
  setSelectedInvoiceBiz,
  selectedPayBiz,
  setSelectedPayBiz,
  setConvertingLead,
  setSystemNotifications,
  setActiveTab,
  addNotification,
  addSystemNotification,
  handleLogout,
}: UseAppEntityHandlersProps) {
  // Handlers synced with Supabase Database & Real-Time Lifecycle
  const handleAddBusiness = useCallback(async (newBiz: Business) => {
    // 🛡️ CRITICAL SECURITY GATE: Strictly reject submissions from deleted/blacklisted representatives
    const targetRepId = newBiz.repId || currentRep.id || user?.id;
    const targetRepName = newBiz.repName || currentRep.name || user?.name;
    const isTargetDeleted =
      isRepAccountDeleted(user) ||
      isRepAccountDeleted(currentRep) ||
      isRepAccountDeleted({ id: targetRepId, name: targetRepName });

    if (isTargetDeleted) {
      addNotification('⛔ تم رفض تسجيل النشاط: هذا الحساب تم حذفه أو تعطيله من قِبل إدارة المنظومة.', 'error');
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
      addNotification(`⛔ تعذر حفظ النشاط: رقم الهاتف (${dupPhone.phone}) مسجل بالفعل مع ${entityTypeStr}: "${dupPhone.name}". لا يمكن تكرار تسجيل نفس رقم الهاتف.`, 'error');
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

    addNotification(`🎉 تم تسجيل النشاط التجاري "${normalizedBiz.nameAr}" بنجاح وهو متاح الآن في قائمتك والدليل!`, 'success');

    // 1. Broadcast notification for Admin
    addSystemNotification({
      title: 'تسجيل نشاط تجاري جديد 🏪',
      message: `قام المندوب "${normalizedBiz.repName || user?.name || 'ميداني'}" بتسجيل نشاط جديد "${normalizedBiz.nameAr}" في (${normalizedBiz.governorate} - ${normalizedBiz.city}).`,
      type: 'info',
      category: 'business',
      targetRole: 'admin',
      linkTab: 'admin',
    });

    // 2. Personal confirmation notification for registering representative
    if (normalizedBiz.repId || user?.id) {
      addSystemNotification({
        title: `🎉 تم تسجيل نشاطك: ${normalizedBiz.nameAr}`,
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
        verified: 'مقبول وموثق ✅',
        rejected: 'مرفوض ✕',
        in_progress: 'قيد المراجعة ⏳',
      };
      const newStatus = statusMap[normalizedBiz.verificationStatus] || normalizedBiz.verificationStatus;
      addNotification(`🔔 تم تحديث حالة نشاط "${normalizedBiz.nameAr}" إلى: ${newStatus}`, 'info');

      addSystemNotification({
        title: 'تحديث توثيق النشاط 🗺️',
        message: `تم تحديث حالة التوثيق لنشاط "${normalizedBiz.nameAr}" إلى (${newStatus}).`,
        type: normalizedBiz.verificationStatus === 'verified' ? 'success' : 'info',
        category: 'business',
        targetRole: 'admin',
        targetUserId: normalizedBiz.repId || user?.id,
        linkTab: 'home',
      });
    } else {
      addNotification(`💾 تم حفظ تعديلات نشاط "${normalizedBiz.nameAr}" بنجاح!`, 'success');
    }

    // 2. Automated Payment lifecycle interaction & Commission Unlock notification for Rep
    if (prevBiz && (prevBiz.amountPaid !== normalizedBiz.amountPaid || prevBiz.paymentStatus !== normalizedBiz.paymentStatus)) {
      const addedAmt = (normalizedBiz.amountPaid || 0) - (prevBiz.amountPaid || 0);
      if (addedAmt > 0) {
        addNotification(`💰 تم تحصيل وتأكيد سداد مبلغ ${addedAmt} ج.م لنشاط "${normalizedBiz.nameAr}" بنجاح! (${normalizedBiz.paymentStatus === 'fully_paid' ? 'مسدد بالكامل ✅' : 'مسدد جزئياً ⏳'})`, 'success');
      }

      addSystemNotification({
        title: 'تحديث تحصيل سداد 💳',
        message: `تم تحديث مدفوعات نشاط "${normalizedBiz.nameAr}" (المبلغ المدفوع: ${normalizedBiz.amountPaid} ج.م - الحالة: ${normalizedBiz.paymentStatus === 'fully_paid' ? 'مدفوع بالكامل ✅' : 'مدفوع جزئياً ⏳'}).`,
        type: 'success',
        category: 'payment',
        targetRole: 'admin',
        linkTab: 'invoices',
      });

      // If payment was added, notify the rep that commission is unlocked and available
      if ((normalizedBiz.amountPaid || 0) > (prevBiz.amountPaid || 0) && normalizedBiz.repId) {
        addSystemNotification({
          title: '💰 تم سداد الفاتورة - عمولتك متاحة للسحب!',
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

    // Confirmation is now handled by ConfirmDialog at the UI layer — proceed directly
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

    // 4. Soft Delete (الأثر على السيرفر): preserves data for Super Admin review
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
    addNotification(`🗑️ تم حذف نشاط "${biz?.nameAr || 'المحدد'}" بنجاح.`, 'warning');
  }, [businesses, setBusinesses, editingBusiness, setEditingBusiness, selectedInvoiceBiz, setSelectedInvoiceBiz, selectedPayBiz, setSelectedPayBiz, setSystemNotifications, user, setDeletedBusinesses, addNotification]);

  const handleRestoreBusiness = useCallback(async (biz: Business) => {
    const restored = await restoreBusinessInDb(biz);
    setDeletedBusinesses((prev) => prev.filter((b) => b.id !== biz.id));
    setBusinesses((prev) => [restored, ...prev.filter((b) => b.id !== biz.id)]);
    addNotification(`🟢 تم استرجاع نشاط "${biz.nameAr}" وإعادته نشطاً للمنظومة بنجاح!`, 'success');
  }, [setDeletedBusinesses, setBusinesses, addNotification]);

  const handleHardDeleteBusiness = useCallback(async (id: string) => {
    const biz = deletedBusinesses.find((b) => b.id === id) || businesses.find((b) => b.id === id);
    await hardDeleteBusinessFromDb(id);
    setDeletedBusinesses((prev) => prev.filter((b) => b.id !== id));
    setBusinesses((prev) => prev.filter((b) => b.id !== id));
    addNotification(`🗑️ تم الحذف النهائي البات لنشاط "${biz?.nameAr || 'المحدد'}" من قاعدة البيانات والسيرفر.`, 'warning');
  }, [deletedBusinesses, businesses, setDeletedBusinesses, setBusinesses, addNotification]);

  const handleCreatePayoutRequest = useCallback(async (payout: PayoutRequest) => {
    setPayoutRequests((prev) => [payout, ...prev]);
    await createPayoutRequestInDb(payout);

    const isRemit = payout.type === 'remittance';

    addNotification(
      isRemit
        ? `💳 تم إرسال إشعار وإيصال سداد توريد المنصة بقيمة ${payout.amount} ج.م للإدارة بنجاح!`
        : `💵 تم إرسال طلب سحب العمولة بقيمة ${payout.amount} ج.م للإدارة بنجاح!`,
      'success'
    );

    // 1. Notification for Admin
    addSystemNotification({
      title: isRemit ? '📥 إشعار سداد وتوريد جديد للمنصة' : '🔔 طلب سحب عمولة جديد',
      message: isRemit
        ? `المندوب "${payout.repName}" أرسل إشعار تحويل وتوريد للمنصة بمبلغ ${payout.amount} ج.م عبر (${payout.method}) مرفقاً صورة الإيصال للمراجعة.`
        : `المندوب "${payout.repName}" يطلب سحب عمولة بقيمة ${payout.amount} ج.م عبر (${payout.method})، الحساب: ${payout.accountDetails}.`,
      type: 'info',
      category: 'payout',
      targetRole: 'admin',
      linkTab: 'admin',
    });

    // 2. Notification for Representative
    addSystemNotification({
      title: isRemit ? '⏳ إشعار السداد قيد المراجعة والتدقيق' : '⏳ طلب سحب العمولة قيد المراجعة',
      message: isRemit
        ? `تم استلام إيصال سدادك بمبلغ ${payout.amount} ج.م وجاري مراجعته وتدقيقه من قبل الإدارة لتصفية حسابك.`
        : `تم استلام طلب سحب أرباحك بمبلغ ${payout.amount} ج.م وجاري مراجعته والتحويل من الإدارة.`,
      type: 'info',
      category: 'payout',
      targetUserId: payout.repId,
      linkTab: 'home',
    });
  }, [setPayoutRequests, addNotification, addSystemNotification]);

  const handleUpdatePayoutRequest = useCallback(async (payout: PayoutRequest) => {
    setPayoutRequests((prev) => prev.map((p) => (p.id === payout.id ? payout : p)));
    await updatePayoutRequestInDb(payout);

    const isRemit = payout.type === 'remittance';

    if (payout.status === 'approved') {
      addNotification(
        isRemit
          ? `✅ تم اعتماد وتأكيد استلام سداد المندوب "${payout.repName}" بمبلغ ${payout.amount} ج.م!`
          : `✅ تم تأكيد وصرف الحوالة للمندوب "${payout.repName}" بمبلغ ${payout.amount} ج.م!`,
        'success'
      );
      addSystemNotification({
        title: isRemit ? '🎉 تم اعتماد وتأكيد سدادك بنجاح!' : '🎉 تم تحويل وصرف العمولة بنجاح!',
        message: isRemit
          ? `تمت مراجعة إيصالك واعتماد سداد مبلغ ${payout.amount} ج.م وتصفية ذمتك المالية لدى المنصة بنجاح.`
          : `تم تحويل مبلغ ${payout.amount} ج.م بنجاح إلى حسابك (${payout.accountDetails})${payout.transactionRef ? ` - رقم العملية: ${payout.transactionRef}` : ''}.`,
        type: 'success',
        category: 'payout',
        targetUserId: payout.repId,
        linkTab: 'home',
      });
    } else if (payout.status === 'rejected') {
      addNotification(
        isRemit
          ? `❌ تم رفض إشعار سداد المندوب "${payout.repName}".`
          : `❌ تم رفض طلب سحب المندوب "${payout.repName}".`,
        'warning'
      );
      addSystemNotification({
        title: isRemit ? '⚠️ تنبيه: تم رفض إشعار السداد' : '⚠️ تنبيه: تم رفض طلب سحب العمولة',
        message: isRemit
          ? `تم رفض إشعار سداد المبلغ (${payout.amount} ج.م) بسبب: ${payout.adminNotes || 'يرجى التأكد من وضوح الإيصال وصحة بيانات التحويل'}.`
          : `تم رفض طلب سحب المبلغ (${payout.amount} ج.م) بسبب: ${payout.adminNotes || 'يرجى مراجعة الإدارة'}، وقد عاد المبلغ تلقائياً لرصيدك المتاح للسحب.`,
        type: 'error',
        category: 'payout',
        targetUserId: payout.repId,
        linkTab: 'home',
      });
    }
  }, [setPayoutRequests, addNotification, addSystemNotification]);

  const handleDeletePayoutRequest = useCallback(async (id: string) => {
    await deletePayoutRequestFromDb(id);
    setPayoutRequests((prev) => prev.filter((p) => p.id !== id));
    addNotification('🗑️ تم حذف المعاملة المالية نهائياً من قاعدة البيانات والسيرفر.', 'warning');
  }, [setPayoutRequests, addNotification]);

  // CRM Leads
  const handleCreateLead = useCallback(async (newLead: InterestedLead) => {
    // 🛡️ CRITICAL DUPLICATE PHONE GATE
    const dupPhone = findDuplicatePhoneEntity(newLead.phone, { businesses, leads, excludeId: newLead.id });
    if (dupPhone) {
      const entityTypeStr = dupPhone.type === 'business' ? 'نشاط تجاري مسجل مسبقاً' : 'عميل مهتم / مراجعة مسجلة';
      addNotification(`⛔ تعذر حفظ العميل: رقم الهاتف (${dupPhone.phone}) مسجل بالفعل مع ${entityTypeStr}: "${dupPhone.name}". لا يمكن تكرار تسجيل نفس رقم الهاتف.`, 'error');
      return;
    }

    setLeads((prev) => {
      const updated = [newLead, ...prev.filter((l) => l.id !== newLead.id)];
      try {
        safeSetLocalStorageItem('dalelak_cached_leads', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    await saveLeadToDb(newLead);

    try {
      const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (syncChannel) {
        syncChannel.postMessage({ type: 'SYNC_DATA', leadId: newLead.id });
        syncChannel.close();
      }
    } catch {}

    addNotification(`✨ تم حفظ بيانات العميل المهتم "${newLead.clientName}" بنجاح!`, 'success');
  }, [setLeads, businesses, leads, addNotification]);

  const handleUpdateLead = useCallback(async (updatedLead: InterestedLead) => {
    setLeads((prev) => {
      const updated = prev.map((l) => (l.id === updatedLead.id ? updatedLead : l));
      try {
        safeSetLocalStorageItem('dalelak_cached_leads', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    await updateLeadInDb(updatedLead);

    try {
      const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (syncChannel) {
        syncChannel.postMessage({ type: 'SYNC_DATA', leadId: updatedLead.id });
        syncChannel.close();
      }
    } catch {}

    addNotification(`تم تحديث بيانات ومتابعة العميل "${updatedLead.clientName}".`, 'info');
  }, [setLeads, addNotification]);

  const handleDeleteLead = useCallback(async (leadId: string) => {
    setLeads((prev) => {
      const updated = prev.filter((l) => l.id !== leadId);
      try {
        safeSetLocalStorageItem('dalelak_cached_leads', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    await deleteLeadFromDb(leadId);

    try {
      const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (syncChannel) {
        syncChannel.postMessage({ type: 'SYNC_DATA', deletedLeadId: leadId });
        syncChannel.close();
      }
    } catch {}

    addNotification('تم حذف العميل من سجل المتابعات.', 'info');
  }, [setLeads, addNotification]);

  const handleConvertToBusiness = useCallback((lead: InterestedLead) => {
    setConvertingLead(lead);
    setActiveTab('add');
    const displayLeadName = (lead.businessName && lead.businessName !== 'عميل مهتم' && lead.businessName !== 'عملاء مهتمون')
      ? lead.businessName
      : (lead.clientName && lead.clientName !== 'عميل مهتم' && lead.clientName !== 'عملاء مهتمون')
      ? lead.clientName
      : 'المنشأة';
    addNotification(`جاري تحويل بيانات "${displayLeadName}" إلى نموذج تسجيل نشاط جديد...`, 'info');
  }, [setConvertingLead, setActiveTab, addNotification]);

  const handleDirectConvertLeadToBusiness = useCallback(async (lead: InterestedLead) => {
    const rawBizName = (lead.businessName && lead.businessName !== 'عميل مهتم' && lead.businessName !== 'عملاء مهتمون')
      ? lead.businessName.trim()
      : '';
    const rawClientName = (lead.clientName && lead.clientName !== 'عميل مهتم' && lead.clientName !== 'عملاء مهتمون')
      ? lead.clientName.trim()
      : '';

    // Self-healing for place name and attached address (Update 38)
    const { cleanName: sanitizedBizName, extraAddress: extractedAddress } = sanitizePlaceNameAndAddress(rawBizName || rawClientName);
    const finalNameAr = sanitizedBizName || 'منشأة معتمدة جديدة';

    // Format dignified contact person: "مسؤول [اسم المنشأة]" if clientName is generic, empty, or duplicate of business name
    const finalOwner = (rawClientName && rawClientName !== rawBizName && rawClientName !== finalNameAr)
      ? rawClientName
      : (finalNameAr ? `مسؤول ${finalNameAr}` : 'صاحب المنشأة');

    const finalStreet = lead.street?.trim() || extractedAddress || 'الموقع الجغرافي المسجل على الخريطة';

    const rawCat = lead.businessCategory?.trim();
    const finalCategory = (rawCat && rawCat !== 'عميل مهتم' && rawCat !== 'عملاء مهتمون')
      ? rawCat
      : 'نشاط تجاري / خدمي آخر';

    const timestamp = Date.now();
    const isTrending = Boolean(lead.isTrending || lead.interestLevel === 'trending_free');

    const newBiz: Business = {
      id: `biz_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
      convertedFromLeadId: lead.id,
      nameAr: finalNameAr,
      category: finalCategory,
      governorate: lead.governorate || 'القاهرة',
      city: lead.city?.trim() || 'المركز الرئيسي',
      street: finalStreet,
      phone: lead.phone || '',
      secondaryPhone: lead.secondaryPhone?.trim() || undefined,
      workingHours: 'يومياً: 10:00 ص - 10:00 م',
      description: lead.notes?.trim() || (isTrending ? `منشأة ${finalNameAr} التجارية الرائجة بالمنطقة - قيد المراجعة والاعتماد بالدليل العام.` : `نشاط ${finalNameAr} قيد المراجعة والاعتماد في ${lead.governorate}.`),
      lat: lead.lat || 30.0444,
      lng: lead.lng || 31.2357,
      ownerName: finalOwner,
      ownerPhone: lead.phone || '',
      photos: [],
      videos: [],
      repId: lead.repId || currentRep.id || user?.id || 'rep_1',
      repName: lead.repName || currentRep.name || user?.name || 'مندوب معتمد',
      packageId: isTrending ? 'free_trending' : 'pkg_standard',
      packageName: isTrending ? 'إدراج شرفي للأماكن الرائجة (مجاناً)' : 'إدراج توثيق جديد',
      packagePrice: isTrending ? 0 : 250,
      amountPaid: 0,
      paymentStatus: 'unpaid',
      isFeeExempt: isTrending,
      feeExemptionReason: isTrending
        ? 'مكان رائج بالمنطقة معفى من الرسوم (إدراج شرفي قيد الاعتماد)'
        : undefined,
      verificationStatus: 'pending',
      publishedStatus: 'draft',
      isAlreadyOnGoogle: isTrending,
      registrationType: isTrending ? 'already_on_google' : 'interested_lead',
      googleMapsUrl: lead.locationUrl || (lead.lat && lead.lng ? `https://www.google.com/maps?q=${lead.lat},${lead.lng}` : undefined),
      googleSyncStatus: lead.locationUrl ? 'synced' : 'not_synced',
      googleSyncDate: lead.locationUrl ? new Date().toISOString().split('T')[0] : undefined,
      invoiceNumber: `INV-DIR-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      createdDate: new Date().toISOString(),
      notes: lead.notes || undefined,
    };

    await handleAddBusiness(newBiz);

    const updatedLead: InterestedLead = {
      ...lead,
      status: 'converted',
      businessCategory: finalCategory,
      businessName: finalNameAr,
    };
    await handleUpdateLead(updatedLead);

    addNotification(`تم تحويل "${finalNameAr}" بنجاح إلى طلب تسجيل نشاط جديد وهو الآن قيد المراجعة والاعتماد.`, 'success');

    addSystemNotification({
      title: 'طلب اعتماد نشاط جديد',
      message: `تم تحويل "${finalNameAr}" من المراجعات إلى طلب تسجيل جديد قيد المراجعة والاعتماد.`,
      type: 'info',
      category: 'business',
      targetRole: 'admin',
      entityId: newBiz.id,
      entityType: 'business',
      linkTab: 'home',
    });
  }, [handleAddBusiness, handleUpdateLead, currentRep, user, addNotification, addSystemNotification]);

  // Profile Update Handler
  const handleUpdateUserProfile = useCallback(async (updatedData: Partial<Representative> & { name?: string; email?: string; avatar?: string }) => {
    if (!user) return;

    const repId = user.repData?.id || user.id;
    const existingRep = representatives.find((r) => r.id === repId || r.email.toLowerCase() === user.email.toLowerCase()) || user.repData;

    const isCallerAdmin = user.role === 'admin';

    const freshRep: Representative = {
      id: repId,
      name: updatedData.name || existingRep?.name || user.name,
      email: updatedData.email || existingRep?.email || user.email,
      phone: updatedData.phone || existingRep?.phone || '',
      pendingPhone: updatedData.pendingPhone !== undefined ? updatedData.pendingPhone : existingRep?.pendingPhone,
      phoneStatus: updatedData.phoneStatus !== undefined ? updatedData.phoneStatus : existingRep?.phoneStatus,
      nationalId: updatedData.nationalId !== undefined ? updatedData.nationalId : existingRep?.nationalId,
      activationFacePhoto: updatedData.activationFacePhoto !== undefined ? updatedData.activationFacePhoto : existingRep?.activationFacePhoto,
      nationalIdCardPhoto: updatedData.nationalIdCardPhoto !== undefined ? updatedData.nationalIdCardPhoto : existingRep?.nationalIdCardPhoto,
      nationalIdCardBackPhoto: updatedData.nationalIdCardBackPhoto !== undefined ? updatedData.nationalIdCardBackPhoto : existingRep?.nationalIdCardBackPhoto,
      role: isCallerAdmin && updatedData.role ? updatedData.role : (existingRep?.role || user.role || 'rep'),
      roleTitle: isCallerAdmin && updatedData.roleTitle ? updatedData.roleTitle : (existingRep?.roleTitle || 'مندوب مبيعات معتمد'),
      governorate: updatedData.governorate || existingRep?.governorate || 'القاهرة',
      targetMonth: isCallerAdmin && updatedData.targetMonth !== undefined ? (Number(updatedData.targetMonth) || 25) : (existingRep?.targetMonth || 25),
      avatar: updatedData.avatar !== undefined ? updatedData.avatar : (existingRep?.avatar || user.avatar || ''),
      avatarStatus: 'approved',
      commissionRate: isCallerAdmin && updatedData.commissionRate !== undefined ? (Number(updatedData.commissionRate) || 42.86) : (existingRep?.commissionRate || 42.86),
      status: isCallerAdmin && updatedData.status ? updatedData.status : (existingRep?.status || 'active'),
      // 🔐 BUG-11 FIX: إزالة كلمة المرور الافتراضية Aa123456
      password: updatedData.password || existingRep?.password,
      referralCode: updatedData.referralCode || existingRep?.referralCode,
      referralUnlocked: updatedData.referralUnlocked ?? existingRep?.referralUnlocked ?? false,
      adminBypassReferral: updatedData.adminBypassReferral ?? existingRep?.adminBypassReferral ?? false,
    };

    const updatedUser: User = {
      ...user,
      name: freshRep.name,
      email: freshRep.email,
      role: freshRep.role || user.role,
      avatar: freshRep.avatar,
      repData: freshRep,
    };

    setUser(updatedUser);
    safeSetSessionItem('dalelak_active_user', JSON.stringify(getSafeUserForStorage(updatedUser)));
    safeSetSessionItem('dalelak_session_last_active', String(Date.now()));
    safeRemoveLocalStorageItem('dalelak_logged_user');
    safeRemoveLocalStorageItem('dalelak_user');

    setRepresentatives((prev) => {
      const idx = prev.findIndex((r) => r.id === freshRep.id || r.email.toLowerCase() === freshRep.email.toLowerCase());
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = freshRep;
        return next;
      }
      return [freshRep, ...prev];
    });

    await saveRepToDb(freshRep);
    addNotification('✅ تم تحديث بياناتك وملفاتك الرسمية بنجاح على السحابة!', 'success');
  }, [user, representatives, setUser, setRepresentatives, addNotification]);

  // Representative CRUD
  const handleAddRepresentative = useCallback(async (repData: Partial<Representative>) => {
    const newRep: Representative = {
      id: repData.id || `rep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: repData.name || 'مندوب جديد',
      email: repData.email || '',
      phone: repData.phone || '',
      nationalId: repData.nationalId,
      activationFacePhoto: repData.activationFacePhoto,
      nationalIdCardPhoto: repData.nationalIdCardPhoto,
      nationalIdCardBackPhoto: repData.nationalIdCardBackPhoto,
      pendingPhone: repData.pendingPhone,
      phoneStatus: repData.phoneStatus || 'none',
      role: repData.role || 'rep',
      roleTitle: repData.roleTitle || 'مندوب مبيعات ميداني',
      governorate: repData.governorate || 'القاهرة',
      targetMonth: repData.targetMonth || 25,
      avatar: repData.avatar || '',
      avatarStatus: repData.avatarStatus || 'approved',
      commissionRate: repData.commissionRate || 42.86,
      status: repData.status || 'active',
      password: repData.password || 'Aa123456',
      referralCode: repData.referralCode || `DALIL-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      referredByCode: repData.referredByCode,
      referralUnlocked: repData.referralUnlocked ?? false,
      adminBypassReferral: repData.adminBypassReferral ?? false,
      referralRewardGranted: repData.referralRewardGranted ?? false,
    };

    setRepresentatives((prev) => {
      const filtered = prev.filter((r) => r.id !== newRep.id && r.email.toLowerCase() !== newRep.email.toLowerCase());
      const updated = [newRep, ...filtered];
      try {
        safeSetLocalStorageItem('dalelak_custom_reps', JSON.stringify(getSafeRepsForStorage(updated)));
        safeSetLocalStorageItem('dalelak_cached_reps', JSON.stringify(getSafeRepsForStorage(updated)));
      } catch {}
      return updated;
    });

    await saveRepToDb(newRep);
    if (newRep.status === 'suspended') {
      addNotification(`⏳ تم تسجيل طلب حساب جديد لـ "${newRep.name}" بانتظار موافقة المدير لتفعيله.`, 'info');
      addSystemNotification({
        title: 'حساب جديد معلق بانتظار التفعيل 👤',
        message: `قام المندوب "${newRep.name}" بتسجيل حساب جديد (محافظة ${newRep.governorate})، الحساب معلق بانتظار مراجعته وتفعيله.`,
        type: 'warning',
        category: 'account',
        targetRole: 'admin',
        linkTab: 'admin',
      });
      addSystemNotification({
        title: 'طلب الحساب قيد المراجعة ⏳',
        message: 'تم تسليم بيانات حسابك بنجاح وسنقوم بمراجعة وتفعيل الحساب من إدارة المنظومة قريباً.',
        type: 'info',
        category: 'account',
        targetUserId: newRep.id,
      });
    } else {
      addNotification(`👤 تم إنشاء حساب المندوب الجديد "${newRep.name}" بنجاح!`, 'success');
      addSystemNotification({
        title: 'إضافة حساب جديد 👤',
        message: `تم إنشاء حساب جديد بنجاح لـ "${newRep.name}" بصلاحية (${newRep.roleTitle || 'مندوب'}).`,
        type: 'success',
        category: 'account',
        targetRole: 'admin',
        linkTab: 'admin',
      });
    }
  }, [setRepresentatives, addNotification, addSystemNotification]);

  const handleUpdateRepresentative = useCallback(async (updatedRep: Representative) => {
    const prevRep = representatives.find((r) =>
      r.id === updatedRep.id ||
      (r.email && updatedRep.email && r.email.toLowerCase() === updatedRep.email.toLowerCase()) ||
      (r.phone && updatedRep.phone && r.phone === updatedRep.phone)
    );

    const secureRep: Representative = {
      ...(prevRep || {}),
      ...updatedRep,
      role: updatedRep.role || prevRep?.role || 'rep',
      roleTitle: updatedRep.roleTitle || (
        updatedRep.role === 'supervisor' ? 'مشرف إدارة منطقة ومحافظة' :
        updatedRep.role === 'accountant' ? 'محاسب ومحصل فواتير إلكترونية' :
        updatedRep.role === 'admin' ? 'مدير النظام المعتمد' : 'مندوب مبيعات ميداني'
      ),
      commissionRate: updatedRep.commissionRate !== undefined ? Number(updatedRep.commissionRate) : (prevRep?.commissionRate || 42.86),
      status: updatedRep.status || prevRep?.status || 'active',
      targetMonth: updatedRep.targetMonth !== undefined ? Number(updatedRep.targetMonth) : (prevRep?.targetMonth || 25),
    };

    setRepresentatives((prev) => {
      let matched = false;
      const updated = prev.map((r) => {
        if (
          r.id === secureRep.id ||
          (r.email && secureRep.email && r.email.toLowerCase() === secureRep.email.toLowerCase()) ||
          (r.phone && secureRep.phone && r.phone === secureRep.phone)
        ) {
          matched = true;
          return secureRep;
        }
        return r;
      });
      const finalList = matched ? updated : [secureRep, ...prev];
      try {
        safeSetLocalStorageItem('dalelak_custom_reps', JSON.stringify(finalList));
        safeSetLocalStorageItem('dalelak_cached_reps', JSON.stringify(finalList));
      } catch {}
      return finalList;
    });

    // Always sync user state & localStorage when the logged-in rep's data changes
    if (user && (user.id === secureRep.id || user.repData?.id === secureRep.id || (user.email && secureRep.email && user.email.toLowerCase() === secureRep.email.toLowerCase()))) {
      const updatedUser = { ...user, repData: secureRep, name: secureRep.name, email: secureRep.email, role: secureRep.role || user.role };
      setUser(updatedUser);
      safeSetLocalStorageItem('dalelak_logged_user', JSON.stringify(getSafeUserForStorage(updatedUser)));
      safeSetSessionItem('dalelak_active_user', JSON.stringify(getSafeUserForStorage(updatedUser)));
    }

    if (prevRep && prevRep.status !== secureRep.status) {
      if (secureRep.status === 'active') {
        addNotification(`✅ تم تفعيل حساب "${secureRep.name}" بنجاح ويمكنه الدخول الآن!`, 'success');
        addSystemNotification({
          title: 'تفعيل حساب مندوب 👤',
          message: `تم تفعيل حساب المندوب "${secureRep.name}" وسماح الدخول له بالكامل.`,
          type: 'success',
          category: 'account',
          targetRole: 'admin',
          linkTab: 'admin',
        });
        addSystemNotification({
          title: '🎉 تم تفعيل حسابك بنجاح!',
          message: 'تهانينا! تمت مراجعة وتفعيل حسابك رسمياً من مدير النظام، يمكنك الآن تسجيل وتوثيق المحلات والتحصيل.',
          type: 'success',
          category: 'account',
          targetUserId: secureRep.id,
        });
      } else {
        addNotification(`🔒 تم تعليق حساب "${secureRep.name}" مؤقتاً.`, 'warning');
        addSystemNotification({
          title: 'تعليق حساب مندوب 🔒',
          message: `تم تعليق حساب المندوب "${secureRep.name}" مؤقتاً.`,
          type: 'warning',
          category: 'account',
          targetRole: 'admin',
        });
      }
    } else if (prevRep && prevRep.avatarStatus !== secureRep.avatarStatus && secureRep.avatarStatus !== 'none') {
      if (secureRep.avatarStatus === 'approved') {
        addNotification(`📸 تمت الموافقة على صورة ملف "${secureRep.name}" وتفعيلها في حسابه!`, 'success');
        addSystemNotification({
          title: 'اعتماد صورة المندوب 📸',
          message: `تمت الموافقة على الصورة الشخصية للمندوب "${secureRep.name}".`,
          type: 'success',
          category: 'avatar',
          targetRole: 'admin',
        });
        addSystemNotification({
          title: '📸 تمت الموافقة على صورتك الشخصية!',
          message: 'تم اعتماد وتوثيق صورتك الشخصية رسمياً وتحديث بطاقتك الرقمية التكليفية.',
          type: 'success',
          category: 'avatar',
          targetUserId: secureRep.id,
          linkTab: 'profile',
        });
      } else if (secureRep.avatarStatus === 'rejected') {
        addNotification(`❌ تم رفض صورة ملف "${secureRep.name}" — يجب رفع صورة بديلة.`, 'warning');
        addSystemNotification({
          title: '❌ مرفوض: الصورة الشخصية',
          message: 'تم رفض الصورة الشخصية المرفوعة، يرجى إعادة رفع صورة رسمية واضحة ومطابقة للضوابط.',
          type: 'error',
          category: 'avatar',
          targetUserId: secureRep.id,
          linkTab: 'profile',
        });
      } else {
        addNotification(`⏳ تم إرسال صورة "${secureRep.name}" لمراجعة المدير.`, 'info');
        addSystemNotification({
          title: 'صورة شخصية جديدة للمراجعة 📸',
          message: `قام المندوب "${secureRep.name}" برفع صورة شخصية جديدة للمراجعة والاعتماد.`,
          type: 'info',
          category: 'avatar',
          targetRole: 'admin',
          linkTab: 'admin',
        });
      }
    } else {
      addNotification(`💾 تم حفظ وتحديث صلاحيات وبيانات "${secureRep.name}" بنجاح! ${secureRep.roleTitle ? `(${secureRep.roleTitle})` : ''}`, 'success');
    }

    // 🔐 BUG-07 FIX: إضافة error handling لحفظ بيانات المندوب
    try {
      const saveRes = await saveRepToDb(secureRep);
      if (saveRes && !saveRes.success) {
        console.error('Failed to save rep to DB:', saveRes.error);
        addNotification(`⚠️ تحذير: ${saveRes.error || 'تعذر حفظ البيانات في السحابة'}`, 'warning');
      } else if (saveRes && saveRes.success && saveRes.rep) {
        const freshSaved = saveRes.rep;
        setRepresentatives((prev) => prev.map((r) => r.id === freshSaved.id ? freshSaved : r));
      }
    } catch (saveErr) {
      console.error('Failed to save rep to DB:', saveErr);
      addNotification(`⚠️ تحذير: تم الحفظ محلياً لكن حدث خطأ في رفع البيانات للسحابة. سيتم إعادة المحاولة تلقائياً عند الاتصال.`, 'warning');
    }

    try {
      const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (channel) {
        channel.postMessage({ type: 'REP_UPDATED', repId: updatedRep.id });
        channel.close();
      }
    } catch {}
  }, [representatives, setRepresentatives, user, setUser, addNotification, addSystemNotification]);

  const handleRestoreRepresentative = useCallback(async (rep: Representative) => {
    const restored = await restoreRepInDb(rep);
    const targetEmail = (rep.email || '').toLowerCase().trim();
    const targetPhone = (rep.phone || '').trim();

    setDeletedRepresentatives((prev) =>
      prev.filter(
        (r) =>
          r.id !== rep.id &&
          (!targetEmail || (r.email || '').toLowerCase().trim() !== targetEmail) &&
          (!targetPhone || (r.phone || '').trim() !== targetPhone)
      )
    );
    setRepresentatives((prev) => [
      restored,
      ...prev.filter(
        (r) =>
          r.id !== rep.id &&
          (!targetEmail || (r.email || '').toLowerCase().trim() !== targetEmail) &&
          (!targetPhone || (r.phone || '').trim() !== targetPhone)
      ),
    ]);
    addNotification(`🟢 تم استرجاع حساب "${rep.name}" وتفعيله بنجاح!`, 'success');
  }, [setDeletedRepresentatives, setRepresentatives, addNotification]);

  const handleHardDeleteRepresentative = useCallback(async (id: string) => {
    const rep = deletedRepresentatives.find((r) => r.id === id) || representatives.find((r) => r.id === id);
    const targetEmail = (rep?.email || '').toLowerCase().trim();
    const targetPhone = (rep?.phone || '').trim();

    await hardDeleteRepFromDb(id);

    setDeletedRepresentatives((prev) =>
      prev.filter(
        (r) =>
          r.id !== id &&
          (!targetEmail || (r.email || '').toLowerCase().trim() !== targetEmail) &&
          (!targetPhone || (r.phone || '').trim() !== targetPhone)
      )
    );
    setRepresentatives((prev) =>
      prev.filter(
        (r) =>
          r.id !== id &&
          (!targetEmail || (r.email || '').toLowerCase().trim() !== targetEmail) &&
          (!targetPhone || (r.phone || '').trim() !== targetPhone)
      )
    );
    addNotification(`🗑️ تم الحذف النهائي البات لحساب "${rep?.name || 'المحدد'}" من قاعدة البيانات والسيرفر.`, 'warning');
  }, [deletedRepresentatives, representatives, setDeletedRepresentatives, setRepresentatives, addNotification]);

  const handleDeleteRepresentative = useCallback(async (id: string) => {
    const rep = representatives.find((r) => r.id === id);

    if (isSuperAdmin(rep)) {
      addNotification('⛔ حساب المدير الأعلى للنظام محمي بالكامل ومحصن ضد الحذف!', 'error');
      return;
    }

    // Confirmation is now handled by ConfirmDialog at the UI layer — proceed directly
    const targetEmail = (rep?.email || '').toLowerCase().trim();
    const targetPhone = (rep?.phone || '').trim();

    setRepresentatives((prev) => {
      const updated = prev.filter(
        (r) =>
          r.id !== id &&
          (!targetEmail || (r.email || '').toLowerCase().trim() !== targetEmail) &&
          (!targetPhone || (r.phone || '').trim() !== targetPhone)
      );
      try {
        safeSetLocalStorageItem('dalelak_custom_reps', JSON.stringify(updated));
        safeSetLocalStorageItem('dalelak_cached_reps', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (rep) {
      const deletedBy = user?.name || user?.email || 'مدير النظام';
      const deletedByRole = user?.repData?.roleTitle || user?.roleTitle || user?.role || 'admin';
      await softDeleteRepInDb(rep, deletedBy, deletedByRole);
      setDeletedRepresentatives((prev) => [
        {
          ...rep,
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy,
          deletedByRole,
        },
        ...prev.filter(
          (r) =>
            r.id !== id &&
            (!targetEmail || (r.email || '').toLowerCase().trim() !== targetEmail) &&
            (!targetPhone || (r.phone || '').trim() !== targetPhone)
        ),
      ]);
    } else {
      await hardDeleteRepFromDb(id);
    }

    try {
      const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (channel) {
        channel.postMessage({ type: 'REP_UPDATED', deletedRepId: id });
        channel.close();
      }
    } catch {}

    if (rep) {
      addNotification(`🗑️ تم حذف حساب "${rep.name}" بنجاح.`, 'warning');
      addSystemNotification({
        title: 'حذف حساب 🗑️',
        message: `تم حذف حساب "${rep.name}" (${rep.roleTitle || rep.role}).`,
        type: 'warning',
        category: 'account',
        targetRole: 'admin',
      });
    }
  }, [representatives, setRepresentatives, user, setDeletedRepresentatives, addNotification, addSystemNotification]);

  const handleUpdatePaymentConfig = useCallback(async (newConfig: PaymentGatewayConfig) => {
    setPaymentConfig(newConfig);
    try {
      localStorage.setItem('dalelak_payment_config', JSON.stringify(newConfig));
    } catch {}
    await savePaymentConfigToDb(newConfig);
  }, [setPaymentConfig]);

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
