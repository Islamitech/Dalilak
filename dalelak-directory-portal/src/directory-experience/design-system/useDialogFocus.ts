import { useEffect, useRef } from 'react';

// One shared keyboard/focus contract for nested public-directory overlays.
const stack: symbol[] = [];
export function useDialogFocus(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open || !ref.current) return;
    const node = ref.current;
    const token = Symbol('directory-dialog');
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    stack.push(token);
    document.body.style.overflow = 'hidden';
    const focusables = () => Array.from(node.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')).filter(el => el.getClientRects().length > 0);
    (focusables()[0] || node).focus();
    const handleKey = (event: KeyboardEvent) => {
      if (stack.at(-1) !== token) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const items = focusables();
      const first = items[0]; const last = items.at(-1);
      if (!first) { event.preventDefault(); node.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === node)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !node.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey, true);
    return () => {
      stack.splice(stack.indexOf(token), 1);
      document.removeEventListener('keydown', handleKey, true);
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);
  return ref;
}
