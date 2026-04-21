'use client';

import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';

interface Props {
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Renders children into document.body via createPortal.
 * Bypasses any CSS stacking context (will-change, transform, filter)
 * so position:fixed always targets the real viewport.
 * Implements focus trap and WCAG-compliant dialog semantics.
 */
export function Modal({ onClose, children }: Props) {
  const [mounted, setMounted] = useState(false);
  const contentRef  = useRef<HTMLDivElement>(null);
  // Stable ref so the effect runs exactly once on mount without depending
  // on onClose identity — prevents re-focus every time parent re-renders
  // (e.g. while typing in a form field updates parent state).
  const onCloseRef  = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus first input/select/textarea — if none, fallback to first button.
    // Intentionally skips buttons as first candidate so the X close button
    // (which is always a button and comes first in the DOM) never steals focus.
    const timer = setTimeout(() => {
      const input = contentRef.current?.querySelector<HTMLElement>(
        'input:not([disabled]):not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea:not([disabled]), select:not([disabled])',
      );
      const fallback = contentRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      (input ?? fallback)?.focus();
    }, 50);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key !== 'Tab' || !contentRef.current) return;

      // Focus trap — keep Tab cycling inside modal
      const focusable = Array.from(
        contentRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 modal-backdrop"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Content — sits above backdrop */}
      <div ref={contentRef} className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>,
    document.body,
  );
}
