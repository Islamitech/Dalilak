import { useState, useCallback, useRef, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';

export interface UseCopyToClipboardOptions {
  timeout?: number;
  enableHaptic?: boolean;
}

export function useCopyToClipboard(options: UseCopyToClipboardOptions = {}) {
  const { timeout = 2000, enableHaptic = true } = options;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text) return false;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          // Robust fallback for older browsers or insecure contexts
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          textArea.setAttribute('readonly', '');
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);

          if (!successful) {
            throw new Error('document.execCommand copy failed');
          }
        }

        if (enableHaptic) {
          triggerHaptic('success');
        }

        setCopied(true);
        setError(null);

        timerRef.current = setTimeout(() => {
          setCopied(false);
        }, timeout);

        return true;
      } catch (err: any) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setCopied(false);
        return false;
      }
    },
    [timeout, enableHaptic]
  );

  return { copy, copied, error };
}
