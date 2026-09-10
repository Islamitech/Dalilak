import React from 'react';
import { Copy, Check } from 'lucide-react';
import { Button, ButtonProps } from '../ui/Button';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

export interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
  textToCopy: string;
  label?: string;
  copiedLabel?: string;
  onCopySuccess?: () => void;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  label = 'نسخ',
  copiedLabel = 'تم النسخ',
  onCopySuccess,
  variant = 'secondary',
  size = 'sm',
  className = '',
  ...buttonProps
}) => {
  const { copy, copied } = useCopyToClipboard();

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const ok = await copy(textToCopy);
    if (ok && onCopySuccess) {
      onCopySuccess();
    }
  };

  return (
    <Button
      variant={copied ? 'success' : variant}
      size={size}
      icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
      onClick={handleCopy}
      className={`transition-all duration-200 ${className}`}
      {...buttonProps}
    >
      {copied ? copiedLabel : label}
    </Button>
  );
};
