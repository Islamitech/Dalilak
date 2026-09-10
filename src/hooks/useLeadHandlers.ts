import { useCallback } from 'react';
import {
  Business,
  Representative,
  InterestedLead,
  User,
  NotificationCategory,
  UserRole,
} from '../types';
import {
  safeSetLocalStorageItem,
} from '../utils/storage';
import {
  saveLeadToDb,
  updateLeadInDb,
  deleteLeadFromDb,
} from '../services/db';
import { sanitizePlaceNameAndAddress } from '../utils/googlePlaceExtractor';

export interface UseLeadHandlersProps {
  user: User | null;
  currentRep: Representative;
  leads: InterestedLead[];
  setLeads: React.Dispatch<React.SetStateAction<InterestedLead[]>>;
  setConvertingLead: React.Dispatch<React.SetStateAction<InterestedLead | null>>;
  setActiveTab: (tab: string) => void;
  handleAddBusiness: (newBiz: Business) => Promise<void>;
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
}

export function useLeadHandlers({
  user,
  currentRep,
  leads,
  setLeads,
  setConvertingLead,
  setActiveTab,
  handleAddBusiness,
  addNotification,
  addSystemNotification,
}: UseLeadHandlersProps) {
  const handleCreateLead = useCallback(async (leadData: Omit<InterestedLead, 'id' | 'createdDate'>) => {
    const newLead: InterestedLead = {
      ...leadData,
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdDate: new Date().toISOString(),
      status: leadData.status || 'new',
      repId: leadData.repId || currentRep.id || user?.id || 'rep_1',
      repName: leadData.repName || currentRep.name || user?.name || 'مندوب معتمد',
    };

    setLeads((prev) => {
      const updated = [newLead, ...prev];
      try {
        safeSetLocalStorageItem('dalelak_cached_leads', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    await saveLeadToDb(newLead);

    try {
      const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dalelak_data_sync_channel') : null;
      if (syncChannel) {
        syncChannel.postMessage({ type: 'SYNC_DATA', newLead });
        syncChannel.close();
      }
    } catch {}

    addNotification(`تم تسجيل بيانات العميل "${newLead.clientName}" بنجاح وإضافته لقائمة المتابعات.`, 'success');

    addSystemNotification({
      title: 'عميل جديد قيد المتابعة',
      message: `سجل المندوب "${newLead.repName}" عميلاً محتملاً جديداً "${newLead.clientName}" (${newLead.governorate}).`,
      type: 'info',
      category: 'business',
      targetRole: 'admin',
      linkTab: 'leads',
    });
  }, [currentRep, user, setLeads, addNotification, addSystemNotification]);

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

    // Self-healing for place name and attached address
    const { cleanName: sanitizedBizName, extraAddress: extractedAddress } = sanitizePlaceNameAndAddress(rawBizName || rawClientName);
    const finalNameAr = sanitizedBizName || 'منشأة معتمدة جديدة';

    // Format dignified contact person
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

  return {
    handleCreateLead,
    handleUpdateLead,
    handleDeleteLead,
    handleConvertToBusiness,
    handleDirectConvertLeadToBusiness,
  };
}
