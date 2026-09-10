import { useCallback } from 'react';
import {
  PayoutRequest,
  PaymentGatewayConfig,
  NotificationCategory,
  UserRole,
} from '../types';
import {
  createPayoutRequestInDb,
  updatePayoutRequestInDb,
  deletePayoutRequestFromDb,
  savePaymentConfigToDb,
} from '../services/db';

export interface UsePaymentHandlersProps {
  payoutRequests: PayoutRequest[];
  setPayoutRequests: React.Dispatch<React.SetStateAction<PayoutRequest[]>>;
  setPaymentConfig: React.Dispatch<React.SetStateAction<PaymentGatewayConfig>>;
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

export function usePaymentHandlers({
  payoutRequests,
  setPayoutRequests,
  setPaymentConfig,
  addNotification,
  addSystemNotification,
}: UsePaymentHandlersProps) {
  const handleCreatePayoutRequest = useCallback(async (payout: PayoutRequest) => {
    setPayoutRequests((prev) => [payout, ...prev]);
    await createPayoutRequestInDb(payout);

    const isRemit = payout.type === 'remittance';

    addNotification(
      isRemit
        ? `تم إرسال إشعار وإيصال سداد توريد المنصة بقيمة ${payout.amount} ج.م للإدارة بنجاح.`
        : `تم إرسال طلب سحب العمولة بقيمة ${payout.amount} ج.م للإدارة بنجاح.`,
      'success'
    );

    // 1. Notification for Admin
    addSystemNotification({
      title: isRemit ? 'إشعار سداد وتوريد جديد للمنصة' : 'طلب سحب عمولة جديد',
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
      title: isRemit ? 'إشعار السداد قيد المراجعة والتدقيق' : 'طلب سحب العمولة قيد المراجعة',
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
          ? `تم اعتماد وتأكيد استلام سداد المندوب "${payout.repName}" بمبلغ ${payout.amount} ج.م.`
          : `تم تأكيد وصرف الحوالة للمندوب "${payout.repName}" بمبلغ ${payout.amount} ج.م.`,
        'success'
      );

      addSystemNotification({
        title: isRemit ? 'تم اعتماد إيصال السداد والتوريد' : 'تم اعتماد وصرف الحوالة بنجاح',
        message: isRemit
          ? `تمت مراجعة واعتماد إيصال سدادك بمبلغ ${payout.amount} ج.م وتصفية رصيدك لدى الإدارة.`
          : `تم تحويل وصرف مبلغ ${payout.amount} ج.م إلى حسابك المسجل (${payout.method}). تفقد حسابك الآن.`,
        type: 'success',
        category: 'payout',
        targetUserId: payout.repId,
        linkTab: 'profile',
      });
    } else if (payout.status === 'rejected') {
      addNotification(
        isRemit
          ? `تم رفض إشعار سداد المندوب "${payout.repName}".`
          : `تم رفض طلب سحب المندوب "${payout.repName}".`,
        'warning'
      );

      addSystemNotification({
        title: isRemit ? 'رفض إشعار سداد التوريد' : 'تعذر تنفيذ طلب السحب',
        message: `تم رفض العملية من قِبل الإدارة. السبب: ${payout.adminNotes || 'بيانات أو صورة الإيصال غير مطابقة'}.`,
        type: 'error',
        category: 'payout',
        targetUserId: payout.repId,
        linkTab: 'profile',
      });
    }
  }, [setPayoutRequests, addNotification, addSystemNotification]);

  const handleDeletePayoutRequest = useCallback(async (id: string) => {
    setPayoutRequests((prev) => prev.filter((p) => p.id !== id));
    await deletePayoutRequestFromDb(id);
    addNotification('تم حذف الطلب من السجل.', 'info');
  }, [setPayoutRequests, addNotification]);

  const handleUpdatePaymentConfig = useCallback(async (newConfig: PaymentGatewayConfig) => {
    setPaymentConfig(newConfig);
    try {
      localStorage.setItem('dalelak_payment_config', JSON.stringify(newConfig));
    } catch {}
    await savePaymentConfigToDb(newConfig);
  }, [setPaymentConfig]);

  return {
    handleCreatePayoutRequest,
    handleUpdatePayoutRequest,
    handleDeletePayoutRequest,
    handleUpdatePaymentConfig,
  };
}
