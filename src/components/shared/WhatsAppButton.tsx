import React from 'react';
import { MessageCircle, Check, Copy } from 'lucide-react';
import { Button, ButtonProps } from '../ui/Button';
import { useWhatsAppAction } from '../../hooks/useWhatsAppAction';

export interface WhatsAppButtonProps extends Omit<ButtonProps, 'onClick'> {
  phone: string;
  message?: string;
  label?: string;
  actionType?: 'send' | 'copy';
  target?: '_blank' | '_self';
  onActionComplete?: () => void;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phone,
  message,
  label,
  actionType = 'send',
  target = '_blank',
  onActionComplete,
  variant = 'success',
  size = 'sm',
  className = '',
  ...buttonProps
}) => {
  const { send, copy, copied, isValidPhone } = useWhatsAppAction();
  const valid = isValidPhone(phone);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!valid) return;

    if (actionType === 'send') {
      send(phone, message, target);
      if (onActionComplete) onActionComplete();
    } else {
      const ok = await copy(message || '');
      if (ok && onActionComplete) onActionComplete();
    }
  };

  const defaultLabel = actionType === 'send' 
    ? (label || 'إرسال عبر واتساب') 
    : (copied ? 'تم نسخ الرسالة' : (label || 'نسخ الرسالة'));

  const defaultIcon = actionType === 'send'
    ? <MessageCircle className="w-4 h-4" />
    : (copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />);

  return (
    <Button
      variant={copied ? 'success' : variant}
      size={size}
      icon={defaultIcon}
      disabled={!valid || buttonProps.disabled}
      onClick={handleClick}
      className={`${className}`}
      {...buttonProps}
    >
      {defaultLabel}
    </Button>
  );
};
