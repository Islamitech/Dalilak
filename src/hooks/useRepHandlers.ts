import { useCallback } from 'react';
import {
  Representative,
  User,
  NotificationCategory,
  UserRole,
} from '../types';
import { isSuperAdmin } from '../utils/permissions';
import {
  safeSetLocalStorageItem,
  safeSetSessionItem,
  safeRemoveLocalStorageItem,
  getSafeUserForStorage,
  getSafeRepsForStorage,
} from '../utils/storage';
import {
  saveRepToDb,
  softDeleteRepInDb,
  restoreRepInDb,
  hardDeleteRepFromDb,
} from '../services/db';

export interface UseRepHandlersProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  representatives: Representative[];
  setRepresentatives: React.Dispatch<React.SetStateAction<Representative[]>>;
  deletedRepresentatives: Representative[];
  setDeletedRepresentatives: React.Dispatch<React.SetStateAction<Representative[]>>;
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

export function useRepHandlers({
  user,
  setUser,
  representatives,
  setRepresentatives,
  deletedRepresentatives,
  setDeletedRepresentatives,
  addNotification,
  addSystemNotification,
}: UseRepHandlersProps) {
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
    addNotification('تم تحديث بياناتك وملفاتك الرسمية بنجاح على السحابة.', 'success');
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
      addNotification(`تم تسجيل طلب حساب جديد لـ "${newRep.name}" بانتظار موافقة المدير لتفعيله.`, 'info');
      addSystemNotification({
        title: 'حساب جديد معلق بانتظار التفعيل',
        message: `قام المندوب "${newRep.name}" بتسجيل حساب جديد (محافظة ${newRep.governorate})، الحساب معلق بانتظار مراجعته وتفعيله.`,
        type: 'warning',
        category: 'account',
        targetRole: 'admin',
        linkTab: 'admin',
      });
      addSystemNotification({
        title: 'طلب الحساب قيد المراجعة',
        message: 'تم تسليم بيانات حسابك بنجاح وسنقوم بمراجعته وتفعيله قريباً.',
        type: 'info',
        category: 'account',
        targetUserId: newRep.id,
      });
    } else {
      addNotification(`تم إنشاء حساب المندوب الجديد "${newRep.name}" بنجاح.`, 'success');
      addSystemNotification({
        title: 'إضافة حساب جديد',
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
        addNotification(`تم تفعيل حساب "${secureRep.name}" بنجاح ويمكنه الدخول الآن.`, 'success');
        addSystemNotification({
          title: 'تفعيل حساب مندوب',
          message: `تم تفعيل حساب المندوب "${secureRep.name}" وسماح الدخول له بالكامل.`,
          type: 'success',
          category: 'account',
          targetRole: 'admin',
          linkTab: 'admin',
        });
        addSystemNotification({
          title: 'تم تفعيل حسابك بنجاح',
          message: 'تمت مراجعة وتفعيل حسابك رسمياً من مدير النظام، يمكنك الآن تسجيل وتوثيق المحلات والتحصيل.',
          type: 'success',
          category: 'account',
          targetUserId: secureRep.id,
        });
      } else {
        addNotification(`تم تعليق حساب "${secureRep.name}" مؤقتاً.`, 'warning');
        addSystemNotification({
          title: 'تعليق حساب مندوب',
          message: `تم تعليق حساب المندوب "${secureRep.name}" مؤقتاً.`,
          type: 'warning',
          category: 'account',
          targetRole: 'admin',
        });
      }
    } else if (prevRep && prevRep.avatarStatus !== secureRep.avatarStatus && secureRep.avatarStatus !== 'none') {
      if (secureRep.avatarStatus === 'approved') {
        addNotification(`تمت الموافقة على صورة ملف "${secureRep.name}" وتفعيلها في حسابه.`, 'success');
        addSystemNotification({
          title: 'اعتماد صورة المندوب',
          message: `تمت الموافقة على الصورة الشخصية للمندوب "${secureRep.name}".`,
          type: 'success',
          category: 'avatar',
          targetRole: 'admin',
        });
        addSystemNotification({
          title: 'تمت الموافقة على صورتك الشخصية',
          message: 'تم اعتماد وتوثيق صورتك الشخصية رسمياً وتحديث بطاقتك الرقمية التكليفية.',
          type: 'success',
          category: 'avatar',
          targetUserId: secureRep.id,
          linkTab: 'profile',
        });
      } else if (secureRep.avatarStatus === 'rejected') {
        addNotification(`تم رفض صورة ملف "${secureRep.name}" — يجب رفع صورة بديلة.`, 'warning');
        addSystemNotification({
          title: 'مرفوض: الصورة الشخصية',
          message: 'تم رفض الصورة الشخصية المرفوعة، يرجى إعادة رفع صورة رسمية واضحة ومطابقة للضوابط.',
          type: 'error',
          category: 'avatar',
          targetUserId: secureRep.id,
          linkTab: 'profile',
        });
      } else {
        addNotification(`تم إرسال صورة "${secureRep.name}" لمراجعة المدير.`, 'info');
        addSystemNotification({
          title: 'صورة شخصية جديدة للمراجعة',
          message: `قام المندوب "${secureRep.name}" برفع صورة شخصية جديدة للمراجعة والاعتماد.`,
          type: 'info',
          category: 'avatar',
          targetRole: 'admin',
          linkTab: 'admin',
        });
      }
    } else {
      addNotification(`تم حفظ وتحديث صلاحيات وبيانات "${secureRep.name}" بنجاح. ${secureRep.roleTitle ? `(${secureRep.roleTitle})` : ''}`, 'success');
    }

    try {
      const saveRes = await saveRepToDb(secureRep);
      if (saveRes && !saveRes.success) {
        console.error('Failed to save rep to DB:', saveRes.error);
        addNotification(`تحذير: ${saveRes.error || 'تعذر حفظ البيانات في السحابة'}`, 'warning');
      } else if (saveRes && saveRes.success && saveRes.rep) {
        const freshSaved = saveRes.rep;
        setRepresentatives((prev) => prev.map((r) => r.id === freshSaved.id ? freshSaved : r));
      }
    } catch (saveErr) {
      console.error('Failed to save rep to DB:', saveErr);
      addNotification(`تحذير: تم الحفظ محلياً لكن حدث خطأ في رفع البيانات للسحابة. سيتم إعادة المحاولة تلقائياً عند الاتصال.`, 'warning');
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
    addNotification(`تم استرجاع حساب "${rep.name}" وتفعيله بنجاح.`, 'success');
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
    addNotification(`تم الحذف النهائي البات لحساب "${rep?.name || 'المحدد'}" من قاعدة البيانات والسيرفر.`, 'warning');
  }, [deletedRepresentatives, representatives, setDeletedRepresentatives, setRepresentatives, addNotification]);

  const handleDeleteRepresentative = useCallback(async (id: string) => {
    const rep = representatives.find((r) => r.id === id);

    if (isSuperAdmin(rep)) {
      addNotification('حساب المدير الأعلى للنظام محمي بالكامل ومحصن ضد الحذف.', 'error');
      return;
    }

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
      addNotification(`تم حذف حساب "${rep.name}" بنجاح.`, 'warning');
      addSystemNotification({
        title: 'حذف حساب',
        message: `تم حذف حساب "${rep.name}" (${rep.roleTitle || rep.role}).`,
        type: 'warning',
        category: 'account',
        targetRole: 'admin',
      });
    }
  }, [representatives, setRepresentatives, user, setDeletedRepresentatives, addNotification, addSystemNotification]);

  return {
    handleUpdateUserProfile,
    handleAddRepresentative,
    handleUpdateRepresentative,
    handleRestoreRepresentative,
    handleHardDeleteRepresentative,
    handleDeleteRepresentative,
  };
}
