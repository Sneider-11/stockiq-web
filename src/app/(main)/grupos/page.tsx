export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { dbGetGrupos, dbGetTiendas } from '@/lib/db';
import GruposClient from './GruposClient';

export default async function GruposPage() {
  const session = await getSession();

  // Solo SuperAdmin accede a esta página
  if (!session || session.rol !== 'SUPERADMIN') notFound();

  const [grupos, tiendas] = await Promise.all([
    dbGetGrupos(),
    dbGetTiendas(),
  ]);

  return <GruposClient initialGrupos={grupos} tiendas={tiendas} />;
}
