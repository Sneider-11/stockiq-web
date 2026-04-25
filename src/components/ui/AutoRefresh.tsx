'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Monta un intervalo que llama a router.refresh() para que el Server Component
 * padre vuelva a pedir datos frescos de Supabase sin navegar.
 * Sin UI — solo lógica de sincronización en segundo plano.
 */
export function AutoRefresh({ interval = 15_000 }: { interval?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), interval);
    return () => clearInterval(id);
  }, [interval, router]);
  return null;
}
