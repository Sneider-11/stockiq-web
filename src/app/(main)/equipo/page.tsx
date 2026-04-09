import { dbGetUsuarios } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Users, Shield } from 'lucide-react';
import type { Usuario } from '@/types';

const ROL_BADGE: Record<Usuario['rol'], React.ReactNode> = {
  SUPERADMIN: <Badge variant="purple">SuperAdmin</Badge>,
  ADMIN:      <Badge variant="info">Admin</Badge>,
  CONTADOR:   <Badge variant="warning">Contador</Badge>,
};

export default async function EquipoPage() {
  const user = await getSession();
  if (!user || (user.rol !== 'SUPERADMIN' && user.rol !== 'ADMIN')) {
    redirect('/');
  }

  const usuarios = await dbGetUsuarios();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-prp/20 border border-prp/30 flex items-center justify-center">
          <Users size={16} className="text-vlt" />
        </div>
        <div>
          <h1 className="text-lg font-black text-zinc-100">Equipo</h1>
          <p className="text-xs text-zinc-500">{usuarios.length} usuarios registrados</p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/60 bg-zinc-900/80">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Cédula</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Rol</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Tiendas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {usuarios.map(u => (
                <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-prp/40 to-ind/40 flex items-center justify-center text-xs font-black text-zinc-200 shrink-0">
                        {u.nombre.charAt(0)}
                      </div>
                      <span className="text-zinc-100 font-medium">{u.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">{u.cedula}</td>
                  <td className="px-4 py-3 text-center">{ROL_BADGE[u.rol]}</td>
                  <td className="px-4 py-3 text-center">
                    {u.activo !== false
                      ? <Badge variant="success">Activo</Badge>
                      : <Badge variant="danger">Inactivo</Badge>}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs hidden lg:table-cell">
                    {u.tiendas.length > 0 ? u.tiendas.join(', ') : <span className="text-zinc-700">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
