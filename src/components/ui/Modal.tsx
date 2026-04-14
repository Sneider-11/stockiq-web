'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface Props {
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Renders children into document.body via createPortal.
 * Bypasses any CSS stacking context (will-change, transform, filter)
 * so position:fixed always targets the real viewport.
 */
export function Modal({ onClose, children }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 modal-backdrop">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Content — sits above backdrop */}
      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>,
    document.body,
  );
}
