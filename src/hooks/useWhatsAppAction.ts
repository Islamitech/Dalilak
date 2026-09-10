import { useCallback } from 'react';
import { formatWhatsAppPhone, safeWhatsAppEncode } from '../utils/whatsapp/phoneFormatter';
import { triggerHaptic } from '../utils/haptics';
import { useCopyToClipboard } from './useCopyToClipboard';

export interface UseWhatsAppActionOptions {
  enableHaptic?: boolean;
}

export function useWhatsAppAction(options: UseWhatsAppActionOptions = {}) {
  const { enableHaptic = true } = options;
  const { copy: copyToClipboard, copied } = useCopyToClipboard({ enableHaptic });

  const buildUrl = useCallback((phone: string, message?: string): string => {
    const formattedPhone = formatWhatsAppPhone(phone);
    if (!formattedPhone) return '';

    const baseUrl = `https://wa.me/${formattedPhone}`;
    if (!message) return baseUrl;

    return `${baseUrl}?text=${safeWhatsAppEncode(message)}`;
  }, []);

  const send = useCallback(
    (phone: string, message?: string, target: '_blank' | '_self' = '_blank'): boolean => {
      const url = buildUrl(phone, message);
      if (!url) return false;

      if (enableHaptic) {
        triggerHaptic('selection');
      }

      if (target === '_blank') {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }

      return true;
    },
    [buildUrl, enableHaptic]
  );

  const copy = useCallback(
    async (message: string): Promise<boolean> => {
      return copyToClipboard(message);
    },
    [copyToClipboard]
  );

  const isValidPhone = useCallback((phone?: string): boolean => {
    return Boolean(formatWhatsAppPhone(phone));
  }, []);

  return {
    buildUrl,
    send,
    copy,
    copied,
    isValidPhone,
  };
}
