'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Store, Building2, Power, CheckCircle2,
  CheckCheck, BellOff, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification } from '@/lib/db';

interface Props {
  cedula: string;
}

// Icono según el tipo de notificación
function NotifIcon({ type }: { type: Notification['type'] }) {
  const base = 'w-8 h-8 rounded-xl flex items-center justify-center shrink-0';
  switch (type) {
    case 'store_assigned':
      return <div className={cn(base, 'bg-sky-950/70 border border-sky-900/50')}><Store size={14} className="text-sky-400" /></div>;
    case 'store_removed':
      return <div className={cn(base, 'bg-red-950/70 border border-red-900/50')}><Store size={14} className="text-red-400" /></div>;
    case 'group_assigned':
      return <div className={cn(base, 'bg-purple-950/70 border border-purple-900/50')}><Building2 size={14} className="text-vlt" /></div>;
    case 'inventory_opened':
      return <div className={cn(base, 'bg-emerald-950/70 border border-emerald-900/50')}><Power size={14} className="text-emerald-400" /></div>;
    case 'inventory_closed':
      return <div className={cn(base, 'bg-amber-950/70 border border-amber-900/50')}><Power size={14} className="text-amber-400" /></div>;
    case 'inventory_complete':
      return <div className={cn(base, 'bg-emerald-950/70 border border-emerald-900/50')}><CheckCircle2 size={14} className="text-emerald-400" /></div>;
    default:
      return <div className={cn(base, 'bg-zinc-800 border border-zinc-700')}><Bell size={14} className="text-zinc-400" /></div>;
  }
}

// Tiempo relativo
function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)  return 'ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

// Página de destino según el tipo de notificación
function getHref(notif: Notification): string | null {
  const { type, metadata } = notif;
  if ((type === 'store_assigned' || type === 'inventory_opened' || type === 'inventory_closed' || type === 'inventory_complete') && metadata.tienda_id) {
    return `/tienda/${metadata.tienda_id}`;
  }
  if (type === 'group_assigned' && metadata.grupo_id) {
    return `/grupo/${metadata.grupo_id}`;
  }
  return null;
}

export function NotificationBell({ cedula }: Props) {
  const [open, setOpen]       = useState(false);
  const ref                   = useRef<HTMLDivElement>(null);
  const router                = useRouter();
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications(cedula);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.read) await markRead(notif.id);
    const href = getHref(notif);
    if (href) {
      setOpen(false);
      router.push(href);
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Campana */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all btn-press"
        aria-label="Notificaciones"
      >
        <Bell size={18} className={open ? 'text-zinc-100' : ''} />

        {/* Badge contador */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center leading-none anim-scale-in ring-2 ring-zinc-950">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-black/60 z-50 overflow-hidden anim-scale-in">
          {/* Header del dropdown */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 bg-zinc-800/30">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-vlt" />
              <span className="text-xs font-bold text-zinc-100">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                  {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-vlt transition-colors"
                title="Marcar todas como leídas"
              >
                <CheckCheck size={12} />
                Todo leído
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="animate-spin text-zinc-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-600">
                <BellOff size={24} className="mb-2 opacity-40" />
                <p className="text-xs">Sin notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/40">
                {notifications.map((notif, i) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors anim-fade-up',
                      notif.read
                        ? 'hover:bg-zinc-800/30'
                        : 'bg-prp/5 hover:bg-prp/10',
                    )}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <NotifIcon type={notif.type} />
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-xs leading-tight truncate',
                          notif.read ? 'text-zinc-400 font-medium' : 'text-zinc-100 font-bold',
                        )}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-vlt shrink-0 mt-1" />
                        )}
                      </div>
                      {notif.body && (
                        <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug line-clamp-2">
                          {notif.body}
                        </p>
                      )}
                      <p className="text-[10px] text-zinc-600 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-zinc-800/60 bg-zinc-800/20">
              <p className="text-[10px] text-zinc-600 text-center">
                Mostrando las últimas {notifications.length} notificaciones
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
