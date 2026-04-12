export const dynamic = 'force-dynamic';

import { getSession } from '@/lib/auth';
import { dbGetTiendas } from '@/lib/db';
import { User, Shield, Store } from 'lucide-react';
import PerfilClient from './PerfilClient';

export default async function PerfilPage() {
  const [user, tiendas] = await Promise.all([getSession(), dbGetTiendas()]);
  if (!user) return null;

  const initials = user.nombre.split(' ').slice(0, 2).map((w: string) => w[0]).join('');
  const rolLabel: Record<string, string> = {
    SUPERADMIN: 'Super Administrador',
    ADMIN:      'Administrador',
    CONTADOR:   'Contador',
  };

  const tiendasNombres = user.tiendas.length === 0
    ? 'Todas las tiendas'
    : user.tiendas
        .map(id => tiendas.find(t => t.id === id)?.nombre ?? id)
        .join(', ');

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-zinc-100 tracking-tight mb-6">Mi Perfil</h1>

      {/* Avatar + nombre */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-6 mb-4">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-prp to-ind flex items-center justify-center text-white text-xl font-black shadow-lg shadow-prp/30 shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">{user.nombre}</h2>
            <p className="text-sm text-zinc-500">Cédula: {user.cedula}</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 divide-y divide-zinc-800/40">
        <div className="flex items-center gap-4 px-5 py-4">
          <Shield size={16} className="text-zinc-500 shrink-0" />
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Rol</p>
            <p className="text-sm font-semibold text-zinc-100 mt-0.5">{rolLabel[user.rol] ?? user.rol}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 px-5 py-4">
          <User size={16} className="text-zinc-500 shrink-0" />
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Cédula</p>
            <p className="text-sm font-semibold text-zinc-100 mt-0.5">{user.cedula}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 px-5 py-4">
          <Store size={16} className="text-zinc-500 shrink-0" />
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Tiendas asignadas</p>
            <p className="text-sm font-semibold text-zinc-100 mt-0.5">{tiendasNombres}</p>
          </div>
        </div>
      </div>

      {/* Cambiar contraseña */}
      <PerfilClient />
    </div>
  );
}
