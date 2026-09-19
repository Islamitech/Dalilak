import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { triggerHaptic } from '../../../../../utils/haptics';
import { getApiAuthHeaders } from '../../../../../utils/storage';
import {
  SlotId,
  WhatsAppSlotStatus,
  WhatsAppSessionStatus,
} from '../types';
import { safeFetchGatewayApi } from '../constants';

interface UseWhatsAppGatewayProps {
  isDesktop: boolean;
  onShowNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const useWhatsAppGateway = ({
  isDesktop,
  onShowNotification,
}: UseWhatsAppGatewayProps) => {
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [gatewayCustomUrl, setGatewayCustomUrl] = useState<string>(() => {
    return localStorage.getItem('dalelak_whatsapp_gateway_url') || '';
  });

  const [sessionStatus, setSessionStatus] = useState<WhatsAppSessionStatus>({
    state: 'disconnected',
    qrCodeUrl: null,
    connectedUser: null,
    lastActive: null,
    activeCampaign: null,
  });

  const [isServerReachable, setIsServerReachable] = useState<boolean | null>(null);
  const [serverNoticeMessage, setServerNoticeMessage] = useState<string | null>(null);

  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingSlot, setConnectingSlot] = useState<SlotId | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectingSlot, setDisconnectingSlot] = useState<SlotId | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Safe Fetch Status from Server
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoadingStatus(true);
      const res = await safeFetchGatewayApi('/api/admin/whatsapp/status', {
        headers: getApiAuthHeaders(),
      });

      if (res.success && res.data?.status) {
        setSessionStatus(res.data.status);
        setIsServerReachable(true);
        setServerNoticeMessage(null);

        // 🛡️ Keep user logged in permanently when campaign is active
        const campaignState = res.data.status.activeCampaign?.status;
        const isCampaignActive =
          campaignState === 'running' || campaignState === 'cooldown' || campaignState === 'paused';

        if (isCampaignActive) {
          localStorage.setItem('dalelak_campaign_active', 'true');
          sessionStorage.setItem('dalelak_campaign_active', 'true');
          const nowStr = String(Date.now());
          localStorage.setItem('dalelak_last_interaction', nowStr);
          sessionStorage.setItem('dalelak_session_last_active', nowStr);
        } else if (
          campaignState === 'completed' ||
          campaignState === 'idle' ||
          campaignState === 'aborted'
        ) {
          localStorage.removeItem('dalelak_campaign_active');
          sessionStorage.removeItem('dalelak_campaign_active');
        }
      } else {
        setIsServerReachable(false);
        if (res.isVercelStatic) {
          setServerNoticeMessage(res.error || null);
        }
      }
    } catch {
      setIsServerReachable(false);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  // Polling loop
  useEffect(() => {
    fetchStatus();

    const intervalMs =
      sessionStatus.activeCampaign?.status === 'running' ||
      sessionStatus.activeCampaign?.status === 'cooldown' ||
      sessionStatus.activeCampaign?.status === 'paused'
        ? 1500
        : sessionStatus.state === 'qr_ready' || sessionStatus.state === 'connecting'
        ? 2500
        : 8000;

    pollTimerRef.current = setInterval(fetchStatus, intervalMs);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [fetchStatus, sessionStatus.state, sessionStatus.activeCampaign?.status]);

  // Save Gateway URL
  const handleSaveGatewayUrl = (url: string) => {
    setGatewayCustomUrl(url);
    localStorage.setItem('dalelak_whatsapp_gateway_url', url.trim());
    fetchStatus();
  };

  // Connect WhatsApp Gateway Slot
  const handleConnect = async (slotId: SlotId = '1') => {
    triggerHaptic();
    setConnectingSlot(slotId);
    setIsConnecting(true);
    try {
      const res = await safeFetchGatewayApi('/api/admin/whatsapp/connect', {
        method: 'POST',
        headers: {
          ...getApiAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slot: slotId }),
      });

      if (res.success && res.data?.status) {
        setSessionStatus(res.data.status);
        setIsServerReachable(true);
        setServerNoticeMessage(null);
        onShowNotification?.(
          `تم تشغيل محرك الهاتف ${slotId === '1' ? 'الأساسي (1)' : 'المساند (2)'}، انتظر ظهور رمز الـ QR أو استعادة الجلسة`,
          'info'
        );
      } else {
        if (res.isVercelStatic) {
          onShowNotification?.(
            isDesktop
              ? 'تنبيه: سيرفر Baileys يتطلب تشغيل السيرفر محلياً على الحاسوب، أو استخدم الوضع المباشر (WhatsApp Web) للإرسال الفوري بدون سيرفر!'
              : 'سيرفر Baileys يتطلب تشغيل بيئة Node.js (أو تفعيل الوضع المباشر للجوال أدناه)',
            'warning'
          );
          setServerNoticeMessage(res.error || null);
        } else {
          onShowNotification?.(res.error || `فشل الاتصال بمحرك الواتساب (${slotId})`, 'error');
        }
      }
    } catch (err: any) {
      onShowNotification?.(err?.message || 'خطأ في الاتصال بالسيرفر', 'error');
    } finally {
      setConnectingSlot(null);
      setIsConnecting(false);
    }
  };

  // Disconnect WhatsApp Gateway Slot
  const executeDisconnect = async (slotId: SlotId = '1') => {
    triggerHaptic();
    setDisconnectingSlot(slotId);
    setIsDisconnecting(true);
    try {
      const res = await safeFetchGatewayApi('/api/admin/whatsapp/disconnect', {
        method: 'POST',
        headers: {
          ...getApiAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slot: slotId }),
      });

      if (res.success) {
        if (res.data?.status) {
          setSessionStatus(res.data.status);
        } else {
          setSessionStatus((prev) => ({
            ...prev,
            state: 'disconnected',
            qrCodeUrl: null,
            connectedUser: null,
          }));
        }
        onShowNotification?.(
          `تم قطع اتصال هاتف ${slotId === '1' ? 'الأساسي (1)' : 'المساند (2)'} بنجاح`,
          'success'
        );
      } else {
        onShowNotification?.(res.error || 'تعذر قطع الاتصال', 'error');
      }
    } catch (err: any) {
      onShowNotification?.(err?.message || 'خطأ في السيرفر', 'error');
    } finally {
      setDisconnectingSlot(null);
      setIsDisconnecting(false);
    }
  };

  const slot1: WhatsAppSlotStatus = useMemo(
    () =>
      sessionStatus.slots?.['1'] || {
        slotId: '1' as SlotId,
        name: 'هاتف الإدارة الأساسي (1)',
        state: sessionStatus.state,
        qrCodeUrl: sessionStatus.qrCodeUrl,
        connectedUser: sessionStatus.connectedUser,
        lastActive: sessionStatus.lastActive,
      },
    [sessionStatus]
  );

  const slot2: WhatsAppSlotStatus = useMemo(
    () =>
      sessionStatus.slots?.['2'] || {
        slotId: '2' as SlotId,
        name: 'هاتف الإدارة المساند (2)',
        state: 'disconnected',
        qrCodeUrl: null,
        connectedUser: null,
        lastActive: null,
      },
    [sessionStatus]
  );

  const isAnyConnected =
    sessionStatus.state === 'connected' ||
    slot1.state === 'connected' ||
    slot2.state === 'connected';

  const isBothConnected = slot1.state === 'connected' && slot2.state === 'connected';

  return {
    showServerSettings,
    setShowServerSettings,
    gatewayCustomUrl,
    setGatewayCustomUrl,
    handleSaveGatewayUrl,
    sessionStatus,
    setSessionStatus,
    isServerReachable,
    serverNoticeMessage,
    isLoadingStatus,
    isConnecting,
    connectingSlot,
    isDisconnecting,
    disconnectingSlot,
    fetchStatus,
    handleConnect,
    executeDisconnect,
    slot1,
    slot2,
    isAnyConnected,
    isBothConnected,
  };
};
