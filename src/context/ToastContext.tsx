'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  success: (message: string) => void;
  error:   (message: string) => void;
  warning: (message: string) => void;
  info:    (message: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((message: string, variant: ToastVariant) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { id, message, variant }]); // máx 5 visibles
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const success = useCallback((msg: string) => push(msg, 'success'), [push]);
  const error   = useCallback((msg: string) => push(msg, 'error'),   [push]);
  const warning = useCallback((msg: string) => push(msg, 'warning'), [push]);
  const info    = useCallback((msg: string) => push(msg, 'info'),    [push]);

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}

// ─── UI: contenedor + ítem ────────────────────────────────────────────────────

const STYLES: Record<ToastVariant, { wrap: string; icon: React.ReactNode; text: string }> = {
  success: {
    wrap: 'bg-emerald-950/95 border-emerald-700/70 shadow-emerald-950/40',
    icon: <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />,
    text: 'text-emerald-50',
  },
  error: {
    wrap: 'bg-red-950/95 border-red-700/70 shadow-red-950/40',
    icon: <XCircle size={16} className="text-red-400 shrink-0" />,
    text: 'text-red-50',
  },
  warning: {
    wrap: 'bg-amber-950/95 border-amber-700/70 shadow-amber-950/40',
    icon: <AlertTriangle size={16} className="text-amber-400 shrink-0" />,
    text: 'text-amber-50',
  },
  info: {
    wrap: 'bg-zinc-900/95 border-zinc-700/70 shadow-zinc-950/40',
    icon: <Info size={16} className="text-blue-400 shrink-0" />,
    text: 'text-zinc-100',
  },
};

function SingleToast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const s = STYLES[toast.variant];
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-xl w-80 anim-slide-left ${s.wrap}`}
    >
      {s.icon}
      <p className={`text-sm flex-1 leading-snug ${s.text}`}>{toast.message}</p>
      <button
        onClick={onDismiss}
        aria-label="Cerrar notificación"
        className="text-zinc-500 hover:text-zinc-200 transition-colors mt-0.5 shrink-0"
      >
        <X size={13} />
      </button>
    </div>
  );
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notificaciones"
      className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <SingleToast toast={t} onDismiss={() => onDismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}
