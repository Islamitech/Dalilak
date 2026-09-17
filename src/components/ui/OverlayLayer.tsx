import React, { createContext, useContext, useId, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface OverlayEntry {
  id: string;
  parentId: string | null;
  element: HTMLDivElement;
  minimum: number;
  onEscape: () => void;
}

const ParentOverlay = createContext<string | null>(null);
const entries = new Map<string, OverlayEntry>();
let ordered: OverlayEntry[] = [];
let bodyOverflow = '';

// Ancestors precede descendants even when React mounts child effects first.
function arrangeLayers() {
  const visited = new Set<string>();
  ordered = [];
  const visit = (entry: OverlayEntry) => {
    if (visited.has(entry.id)) return;
    visited.add(entry.id);
    const parent = entry.parentId ? entries.get(entry.parentId) : undefined;
    if (parent) visit(parent);
    ordered.push(entry);
  };
  entries.forEach(visit);
  let layer = 10000;
  ordered.forEach(entry => {
    layer = Math.max(layer + 10, entry.minimum);
    entry.element.style.zIndex = String(layer);
  });
}

function handleKeyDown(event: KeyboardEvent) {
  const top = ordered.at(-1);
  if (!top) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopImmediatePropagation();
    top.onEscape();
    return;
  }
  if (event.key !== 'Tab') return;
  const targets = Array.from(top.element.querySelectorAll<HTMLElement>(
    'button, a[href], input, select, textarea, [tabindex], [contenteditable="true"]'
  )).filter(node => node.tabIndex >= 0 && !node.matches(':disabled') && !node.closest('[inert]')
    && node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden');
  const first = targets[0];
  const last = targets.at(-1);
  const active = document.activeElement;
  if (!first) {
    event.preventDefault();
    top.element.focus();
  } else if (event.shiftKey && (active === first || active === top.element || !top.element.contains(active))) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && (active === last || active === top.element || !top.element.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}

function handleFocus(event: FocusEvent) {
  const top = ordered.at(-1);
  if (top && !top.element.contains(event.target as Node)) top.element.focus({ preventScroll: true });
}

export interface OverlayLayerProps extends React.HTMLAttributes<HTMLDivElement> {
  onEscape?: () => void;
}

/** Body portal + ordered layers shared by drawers, dialogs and lightboxes. */
export const OverlayLayer = React.forwardRef<HTMLDivElement, OverlayLayerProps>(({
  children, onEscape, onClick, ...props
}, forwardedRef) => {
  const id = useId();
  const parentId = useContext(ParentOverlay);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    if (document.activeElement instanceof HTMLElement && !element.contains(document.activeElement)) {
      openerRef.current = document.activeElement;
    }
    const previousFocus = openerRef.current;
    if (!entries.size) {
      bodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown, true);
      document.addEventListener('focusin', handleFocus);
    }
    const minimum = Number(getComputedStyle(element).zIndex) || 0;
    if (!element.hasAttribute('aria-label') && !element.hasAttribute('aria-labelledby')) {
      const heading = element.querySelector<HTMLElement>('h1, h2, h3, h4');
      if (heading) {
        if (!heading.id) heading.id = `${id}-title`;
        element.setAttribute('aria-labelledby', heading.id);
      }
    }
    entries.set(id, { id, parentId, element, minimum, onEscape: () => escapeRef.current?.() });
    arrangeLayers();
    if (ordered.at(-1)?.id === id) element.focus({ preventScroll: true });
    return () => {
      const wasTop = ordered.at(-1)?.id === id;
      entries.delete(id);
      arrangeLayers();
      if (!entries.size) {
        document.body.style.overflow = bodyOverflow;
        document.removeEventListener('keydown', handleKeyDown, true);
        document.removeEventListener('focusin', handleFocus);
      }
      if (wasTop) queueMicrotask(() => {
        // StrictMode replays setup/cleanup without actually closing the dialog.
        if (entries.has(id)) return;
        const top = ordered.at(-1);
        const target = previousFocus?.isConnected && (!top || top.element.contains(previousFocus))
          ? previousFocus : top?.element;
        target?.focus({ preventScroll: true });
      });
    };
  }, [id, parentId]);

  return createPortal(
    <ParentOverlay.Provider value={id}>
      <div role="dialog" aria-modal="true" tabIndex={-1} {...props}
        data-overlay-layer={id}
        ref={element => {
          elementRef.current = element;
          if (typeof forwardedRef === 'function') forwardedRef(element);
          else if (forwardedRef) forwardedRef.current = element;
        }}
        onClick={event => { event.stopPropagation(); onClick?.(event); }}>
        {children}
      </div>
    </ParentOverlay.Provider>, document.body
  );
});
OverlayLayer.displayName = 'OverlayLayer';
