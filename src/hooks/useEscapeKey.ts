import { useEffect } from 'react';

/**
 * Calls `handler` when the Escape key is pressed.
 * Set `enabled` to false to disable (e.g. when the panel is closed).
 */
export function useEscapeKey(handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handler();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handler, enabled]);
}
