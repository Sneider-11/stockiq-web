'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/lib/db';

export function useNotifications(cedula: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Carga inicial
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data: Notification[] = await res.json();
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Supabase Realtime — escucha INSERT en la tabla notifications filtrado por cedula
  useEffect(() => {
    if (!cedula) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channel = (supabase as any)
      .channel(`notifications:${cedula}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${cedula}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const r = payload.new;
          const newNotif: Notification = {
            id:        r.id,
            userId:    r.user_id,
            type:      r.type,
            title:     r.title,
            body:      r.body ?? null,
            metadata:  r.metadata ?? {},
            read:      r.read,
            createdAt: r.created_at,
          };
          setNotifications(prev => [newNotif, ...prev]);
        },
      )
      .subscribe();

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).removeChannel(channel);
    };
  }, [cedula]);

  // Marcar una notificación como leída (optimista)
  const markRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n),
    );
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
  }, []);

  // Marcar todas como leídas (optimista)
  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await fetch('/api/notifications', { method: 'PATCH' });
  }, []);

  return { notifications, unreadCount, loading, markRead, markAllRead };
}
