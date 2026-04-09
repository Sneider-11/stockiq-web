import { getSession } from '@/lib/auth';
import { dbGetUsuarios, dbGetTiendas } from '@/lib/db';
import { redirect } from 'next/navigation';
import EquipoClient from './EquipoClient';

export default async function EquipoPage() {
  const user = await getSession();
  if (!user || (user.rol !== 'SUPERADMIN' && user.rol !== 'ADMIN')) {
    redirect('/');
  }

  const [usuarios, tiendas] = await Promise.all([
    dbGetUsuarios(),
    dbGetTiendas(),
  ]);

  return (
    <EquipoClient
      initialUsuarios={usuarios}
      tiendas={tiendas}
      sessionUser={user}
    />
  );
}
