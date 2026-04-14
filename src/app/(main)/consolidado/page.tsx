export const dynamic = 'force-dynamic';

import { getSession } from '@/lib/auth';
import { dbGetTiendas, dbGetRegistros } from '@/lib/db';
import { redirect } from 'next/navigation';
import ConsolidadoClient from './ConsolidadoClient';
import type { Tienda, Registro } from '@/types';

export default async function ConsolidadoPage() {
  const user = await getSession();
  if (!user || (user.rol !== 'SUPERADMIN' && user.rol !== 'ADMIN')) {
    redirect('/');
  }

  const [tiendas, registros] = await Promise.all([
    dbGetTiendas(),
    dbGetRegistros(),
  ]);

  // Filtrar tiendas según rol
  const tiendasVisible: Tienda[] = user.rol === 'SUPERADMIN'
    ? tiendas
    : tiendas.filter(t => user.tiendas.includes(t.id));

  const tiendaIds = new Set(tiendasVisible.map(t => t.id));
  const registrosVisible: Registro[] = registros.filter(r => tiendaIds.has(r.tiendaId));

  return (
    <ConsolidadoClient
      tiendas={tiendasVisible}
      registros={registrosVisible}
    />
  );
}
