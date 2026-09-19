import { useState, useEffect } from 'react';
import { Business } from '../../../../../types';
import { getApiAuthHeaders } from '../../../../../utils/storage';
import { triggerHaptic } from '../../../../../utils/haptics';
import {
  WhatsAppSessionStatus,
  DispatchMode,
  PacingPreset,
} from '../types';
import { safeFetchGatewayApi } from '../constants';

interface UseCampaignSenderProps {
  sessionStatus: WhatsAppSessionStatus;
  fetchStatus: () => Promise<void>;
  targetBusinesses: Business[];
  validPhoneCount: number;
  selectedTemplate: string;
  customText: string;
  isLikelyStaticHosting: boolean;
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const useCampaignSender = ({
  sessionStatus,
  fetchStatus,
  targetBusinesses,
  validPhoneCount,
  selectedTemplate,
  customText,
  isLikelyStaticHosting,
  onShowNotification,
}: UseCampaignSenderProps) => {
  const [dispatchMode, setDispatchMode] = useState<DispatchMode>(() => {
    const saved = localStorage.getItem('dalelak_whatsapp_dispatch_mode');
    if (saved === 'server_gateway' || saved === 'mobile_direct') return saved as DispatchMode;
    return isLikelyStaticHosting ? 'mobile_direct' : 'server_gateway';
  });

  const handleModeChange = (mode: DispatchMode) => {
    setDispatchMode(mode);
    localStorage.setItem('dalelak_whatsapp_dispatch_mode', mode);
  };

  // Throttling & Pacing state
  const [pacingPreset, setPacingPreset] = useState<PacingPreset>('balanced');
  const [minDelaySeconds, setMinDelaySeconds] = useState<number>(10);
  const [maxDelaySeconds, setMaxDelaySeconds] = useState<number>(20);
  const [rotationBatchSize, setRotationBatchSize] = useState<number>(15);
  const [enableRotation, setEnableRotation] = useState<boolean>(true);

  // 🌿 Organic Stealth Random Mode
  const [enableStealthRandomMode, setEnableStealthRandomMode] = useState<boolean>(true);
  const [stealthMinMinutes, setStealthMinMinutes] = useState<number>(1);
  const [stealthMaxMinutes, setStealthMaxMinutes] = useState<number>(5);
  const [isSkippingDelay, setIsSkippingDelay] = useState<boolean>(false);

  const [isStartingCampaign, setIsStartingCampaign] = useState(false);
  const [isAbortingCampaign, setIsAbortingCampaign] = useState(false);
  const [isResumingCampaign, setIsResumingCampaign] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showExportContactsModal, setShowExportContactsModal] = useState(false);
  const [hasCopiedCommand, setHasCopiedCommand] = useState(false);
  const [skipRecentlyContacted, setSkipRecentlyContacted] = useState(true);

  const [confirmDialogConfig, setConfirmDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  } | null>(null);

  // Apply Pacing Preset
  const handleSelectPreset = (preset: PacingPreset) => {
    setPacingPreset(preset);
    if (preset === 'balanced') {
      setMinDelaySeconds(10);
      setMaxDelaySeconds(20);
    } else if (preset === 'ultra_safe') {
      setMinDelaySeconds(15);
      setMaxDelaySeconds(30);
    } else if (preset === 'fast') {
      setMinDelaySeconds(6);
      setMaxDelaySeconds(12);
    }
  };

  // 🛡️ Screen WakeLock & Session Keep-Alive Loop for active campaigns
  useEffect(() => {
    let wakeLockSentinel: any = null;
    let keepAliveTimer: any = null;

    const requestWakeLock = async () => {
      try {
        if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && (navigator as any).wakeLock) {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        }
      } catch {}
    };

    const isRunning =
      sessionStatus.activeCampaign?.status === 'running' ||
      sessionStatus.activeCampaign?.status === 'cooldown' ||
      sessionStatus.activeCampaign?.status === 'paused';

    if (isRunning) {
      requestWakeLock();
      localStorage.setItem('dalelak_campaign_active', 'true');
      sessionStorage.setItem('dalelak_campaign_active', 'true');

      keepAliveTimer = setInterval(() => {
        const nowStr = String(Date.now());
        localStorage.setItem('dalelak_last_interaction', nowStr);
        sessionStorage.setItem('dalelak_session_last_active', nowStr);
      }, 15000);
    }

    return () => {
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [sessionStatus.activeCampaign?.status]);

  // Launch Server Gateway Campaign
  const handleLaunchCampaign = async () => {
    const isAnyConnected =
      sessionStatus.state === 'connected' ||
      sessionStatus.slots?.['1']?.state === 'connected' ||
      sessionStatus.slots?.['2']?.state === 'connected';

    if (!isAnyConnected) {
      onShowNotification?.(
        'محرك الواتساب غير متصل. يرجى مسح رمز الـ QR لأحد الهاتفين على الأقل وتأكيد الاتصال.',
        'warning'
      );
      return;
    }
    if (targetBusinesses.length === 0) {
      onShowNotification?.('لا توجد أي منشآت مستهدفة تطابق الفلاتر المحددة.', 'warning');
      return;
    }
    if (validPhoneCount === 0) {
      onShowNotification?.(
        'لا توجد أرقام هواتف صالحة بين المنشآت المحددة (جميعها أرقام وهمية).',
        'error'
      );
      return;
    }

    triggerHaptic();
    setIsStartingCampaign(true);
    setShowConfirmModal(false);

    try {
      const res = await safeFetchGatewayApi('/api/admin/whatsapp/broadcast', {
        method: 'POST',
        headers: {
          ...getApiAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateType: selectedTemplate,
          customText: customText || undefined,
          targetBusinessIds: targetBusinesses.map((b) => b.id),
          targetBusinesses: targetBusinesses.map((b) => ({
            id: b.id,
            name: b.name,
            nameAr: b.nameAr,
            phone: b.phone,
            ownerPhone: b.ownerPhone,
            ownerName: b.ownerName,
            governorate: b.governorate,
            city: b.city,
            category: b.category,
            packageId: b.packageId,
            verificationStatus: b.verificationStatus,
            invoiceNumber: (b as any).invoiceNumber,
            isFeeExempt: (b as any).isFeeExempt,
            isAlreadyOnGoogle: (b as any).isAlreadyOnGoogle,
            registrationType: (b as any).registrationType,
            photos: b.photos,
            coverPhoto: (b as any).coverPhoto,
            logo: (b as any).logo,
          })),
          skipRecentlyContacted,
          minDelaySeconds,
          maxDelaySeconds,
          rotationBatchSize,
          enableRotation,
          enableStealthRandomMode,
          stealthMinMinutes,
          stealthMaxMinutes,
          stealthInitialBurstPerSlot: 0,
        }),
      });

      if (res.success) {
        localStorage.setItem('dalelak_campaign_active', 'true');
        sessionStorage.setItem('dalelak_campaign_active', 'true');
        const nowStr = String(Date.now());
        localStorage.setItem('dalelak_last_interaction', nowStr);
        sessionStorage.setItem('dalelak_session_last_active', nowStr);
        onShowNotification?.(res.data?.message || 'تم إطلاق حملة المراسلة بنجاح في الخلفية!', 'success');
        fetchStatus();
      } else {
        onShowNotification?.(res.error || 'تعذر إطلاق الحملة', 'error');
      }
    } catch (err: any) {
      onShowNotification?.(err?.message || 'خطأ أثناء بدء الحملة', 'error');
    } finally {
      setIsStartingCampaign(false);
    }
  };

  // Skip Delay
  const handleSkipDelay = async () => {
    triggerHaptic();
    setIsSkippingDelay(true);
    try {
      const res = await safeFetchGatewayApi('/api/admin/whatsapp/broadcast-skip-delay', {
        method: 'POST',
        headers: {
          ...getApiAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      if (res.success) {
        onShowNotification?.(res.data?.message || 'تم تخطي فترة الانتظار بنجاح! سيتم إرسال الرسالة فوراً ⚡', 'success');
        fetchStatus();
      } else {
        onShowNotification?.(res.error || 'تعذر تخطي فترة الانتظار', 'error');
      }
    } catch (err: any) {
      onShowNotification?.(err?.message || 'خطأ أثناء طلب تخطي فترة الانتظار', 'error');
    } finally {
      setIsSkippingDelay(false);
    }
  };

  // Emergency Abort Broadcast
  const executeAbortCampaign = async () => {
    triggerHaptic();
    setIsAbortingCampaign(true);
    try {
      const res = await safeFetchGatewayApi('/api/admin/whatsapp/broadcast-abort', {
        method: 'POST',
        headers: {
          ...getApiAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      if (res.success) {
        onShowNotification?.(res.data?.message || 'تم تفعيل زر الطوارئ وإيقاف الحملة بنجاح', 'info');
        fetchStatus();
      } else {
        onShowNotification?.(res.error || 'فشل إيقاف الحملة', 'error');
      }
    } catch (err: any) {
      onShowNotification?.(err?.message || 'خطأ في إيقاف الحملة', 'error');
    } finally {
      setIsAbortingCampaign(false);
    }
  };

  const handleAbortCampaign = () => {
    setConfirmDialogConfig({
      isOpen: true,
      title: 'إيقاف طارئ للحملة',
      message:
        'تحذير طارئ: هل تريد إيقاف حملة الواتساب فوراً وتجميد طابور الإرسال؟ لن يتم إرسال أي رسائل إضافية.',
      confirmLabel: 'إيقاف الحملة فوراً',
      variant: 'danger',
      onConfirm: () => executeAbortCampaign(),
    });
  };

  // Resume Paused Campaign
  const handleResumeCampaign = async () => {
    triggerHaptic();
    setIsResumingCampaign(true);
    try {
      const res = await safeFetchGatewayApi('/api/admin/whatsapp/broadcast-resume', {
        method: 'POST',
        headers: {
          ...getApiAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      if (res.success) {
        onShowNotification?.(res.data?.message || 'تم استئناف الحملة بنجاح ⏯️', 'success');
        fetchStatus();
      } else {
        onShowNotification?.(res.error || 'فشل استئناف الحملة', 'error');
      }
    } catch (err: any) {
      onShowNotification?.(err?.message || 'خطأ في استئناف الحملة', 'error');
    } finally {
      setIsResumingCampaign(false);
    }
  };

  return {
    dispatchMode,
    handleModeChange,
    pacingPreset,
    handleSelectPreset,
    minDelaySeconds,
    setMinDelaySeconds,
    maxDelaySeconds,
    setMaxDelaySeconds,
    rotationBatchSize,
    setRotationBatchSize,
    enableRotation,
    setEnableRotation,
    enableStealthRandomMode,
    setEnableStealthRandomMode,
    stealthMinMinutes,
    setStealthMinMinutes,
    stealthMaxMinutes,
    setStealthMaxMinutes,
    isSkippingDelay,
    skipRecentlyContacted,
    setSkipRecentlyContacted,
    isStartingCampaign,
    isAbortingCampaign,
    isResumingCampaign,
    showConfirmModal,
    setShowConfirmModal,
    showExportContactsModal,
    setShowExportContactsModal,
    hasCopiedCommand,
    setHasCopiedCommand,
    confirmDialogConfig,
    setConfirmDialogConfig,
    handleLaunchCampaign,
    handleSkipDelay,
    handleAbortCampaign,
    handleResumeCampaign,
  };
};
