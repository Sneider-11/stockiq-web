export const dynamic = 'force-dynamic';

import { dbGetTiendas } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TiendasClient from './TiendasClient';

export default async function TiendasPage() {
  const user = await getSession();
  if (!user || user.rol !== 'SUPERADMIN') redirect('/');

  const tiendas = await dbGetTiendas();

  return <TiendasClient initialTiendas={tiendas} isSuperAdmin />;
}
