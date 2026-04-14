export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { dbGetGrupos, dbGetTiendas, dbGetUsuarios } from '@/lib/db';
import GrupoDetailClient from './GrupoDetailClient';

interface Props { params: Promise<{ id: string }> }

export default async function GrupoDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session || session.rol !== 'SUPERADMIN') notFound();

  const { id } = await params;
  const [grupos, tiendas, usuarios] = await Promise.all([
    dbGetGrupos(),
    dbGetTiendas(),
    dbGetUsuarios(),
  ]);

  const grupo = grupos.find(g => g.id === id);
  if (!grupo) notFound();

  return (
    <GrupoDetailClient
      grupo={grupo}
      tiendas={tiendas}
      usuarios={usuarios}
    />
  );
}
