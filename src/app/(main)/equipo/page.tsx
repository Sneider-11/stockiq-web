export const dynamic = 'force-dynamic';

import { getSession } from '@/lib/auth';
import { dbGetUsuarios, dbGetTiendas, dbGetGrupos } from '@/lib/db';
import { redirect } from 'next/navigation';
import EquipoClient from './EquipoClient';

export default async function EquipoPage() {
  const user = await getSession();
  if (!user || (user.rol !== 'SUPERADMIN' && user.rol !== 'ADMIN')) {
    redirect('/');
  }

  const [usuarios, tiendas, grupos] = await Promise.all([
    dbGetUsuarios(),
    dbGetTiendas(),
    dbGetGrupos(),
  ]);

  return (
    <EquipoClient
      initialUsuarios={usuarios}
      tiendas={tiendas}
      grupos={grupos}
      sessionUser={user}
    />
  );
}
