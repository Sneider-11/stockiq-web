export const dynamic = 'force-dynamic';

import { getSession } from '@/lib/auth';
import { dbGetTiendas, dbGetGrupos } from '@/lib/db';
import { User, Shield, Building2, Store, Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import PerfilClient from './PerfilClient';

export default async function PerfilPage() {
  const [user, tiendas, grupos] = await Promise.all([
    getSession(),
    dbGetTiendas(),
    dbGetGrupos(),
  ]);
  if (!user) return null;

  const initials = user.nombre.split(' ').slice(0, 2).map((w: string) => w[0]).join('');

  const rolLabel: Record<string, string> = {
    SUPERADMIN: 'Super Administrador',
    ADMIN:      'Administrador',
    CONTADOR:   'Contador',
  };

  const rolVariant: Record<string, 'purple' | 'info' | 'warning'> = {
    SUPERADMIN: 'purple',
    ADMIN:      'info',
    CONTADOR:   'warning',
  };

  // Grupos visibles para este usuario
  const gruposAsignados = user.rol === 'SUPERADMIN'
    ? grupos
    : grupos.filter(g => user.grupos.includes(g.id));

  // Tiendas por grupo (solo las que el usuario tiene acceso)
  const tiendaPorGrupo = gruposAsignados.map(g => ({
    grupo: g,
    tiendas: tiendas.filter(t =>
      t.grupoId === g.id &&
      (user.rol === 'SUPERADMIN' || user.tiendas.includes(t.id)),
    ),
  }));

  // Tiendas sin grupo asignadas al usuario
  const tiendasSinGrupo = user.rol === 'SUPERADMIN'
    ? tiendas.filter(t => !t.grupoId)
    : tiendas.filter(t => !t.grupoId && user.tiendas.includes(t.id));

  return (
    <div className="max-w-2xl mx-auto page-enter">
      <h1 className="text-2xl font-black text-zinc-100 tracking-tight mb-6">Mi Perfil</h1>

      {/* ── Avatar + nombre ── */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-6 mb-4 anim-fade-up relative overflow-hidden scan-sweep" style={{ animationDelay: '40ms' }}>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-prp to-ind flex items-center justify-center text-white text-xl font-black shadow-lg shadow-prp/30 shrink-0 float">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-zinc-100 truncate">{user.nombre}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">CC {user.cedula}</p>
            <div className="mt-2">
              <Badge variant={rolVariant[user.rol] ?? 'default'}>
                {rolLabel[user.rol] ?? user.rol}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── Datos de la cuenta ── */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 overflow-hidden mb-4 anim-fade-up" style={{ animationDelay: '80ms' }}>
        {/* Header de sección */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800/50 bg-zinc-800/20">
          <User size={13} className="text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Información de cuenta</span>
        </div>

        <div className="divide-y divide-zinc-800/40">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/60 flex items-center justify-center shrink-0">
              <Shield size={14} className="text-vlt" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Rol global</p>
              <p className="text-sm font-semibold text-zinc-100 mt-0.5">{rolLabel[user.rol] ?? user.rol}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/60 flex items-center justify-center shrink-0">
              <User size={14} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Cédula</p>
              <p className="text-sm font-semibold text-zinc-100 mt-0.5">{user.cedula}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Grupos y tiendas asignadas ── */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 overflow-hidden mb-4 anim-fade-up" style={{ animationDelay: '120ms' }}>
        {/* Header de sección */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800/50 bg-zinc-800/20">
          <Building2 size={13} className="text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Grupos comerciales asignados</span>
        </div>

        {user.rol === 'SUPERADMIN' ? (
          /* SuperAdmin: acceso total */
          <div className="px-5 py-5">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-prp/10 border border-prp/25">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-prp to-ind flex items-center justify-center shrink-0">
                <Star size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-100">Acceso total al sistema</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {grupos.length} grupo{grupos.length !== 1 ? 's' : ''} · {tiendas.length} tienda{tiendas.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        ) : tiendaPorGrupo.length === 0 && tiendasSinGrupo.length === 0 ? (
          /* Sin asignaciones */
          <div className="px-5 py-8 text-center">
            <Building2 size={28} className="mx-auto mb-2 text-zinc-700" />
            <p className="text-sm text-zinc-600">Sin grupos asignados</p>
            <p className="text-xs text-zinc-700 mt-0.5">Contacta al administrador para que te asigne un grupo.</p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {/* Grupos con tiendas */}
            {tiendaPorGrupo.map(({ grupo, tiendas: tds }, i) => (
              <div key={grupo.id} className="anim-fade-up" style={{ animationDelay: `${140 + i * 50}ms` }}>
                {/* Encabezado del grupo */}
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: grupo.color, boxShadow: `0 2px 6px ${grupo.color}55` }}
                  >
                    <Building2 size={11} />
                  </div>
                  <span className="text-xs font-bold text-zinc-200 tracking-wide">{grupo.nombre}</span>
                  {grupo.descripcion && (
                    <span className="text-[10px] text-zinc-600 truncate">{grupo.descripcion}</span>
                  )}
                  <span className="ml-auto text-[10px] text-zinc-600 shrink-0">
                    {tds.length} tienda{tds.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Lista de tiendas */}
                {tds.length === 0 ? (
                  <p className="text-[11px] text-zinc-600 pl-8">Sin tiendas asignadas en este grupo</p>
                ) : (
                  <div className="space-y-1.5 pl-8">
                    {tds.map(t => (
                      <div
                        key={t.id}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 bg-zinc-800/40 border border-zinc-700/40"
                      >
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: t.color }}
                        >
                          <Store size={10} />
                        </div>
                        <span className="text-xs font-medium text-zinc-200 flex-1 truncate">{t.nombre}</span>
                        {t.modoInventario === 'OFFLINE'
                          ? <Badge variant="danger">Cerrada</Badge>
                          : <Badge variant="success">Activa</Badge>}
                        {user.tiendasRoles[t.id] && (
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wide shrink-0">
                            {user.tiendasRoles[t.id]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Tiendas sin grupo */}
            {tiendasSinGrupo.length > 0 && (
              <div className="anim-fade-up" style={{ animationDelay: `${140 + tiendaPorGrupo.length * 50}ms` }}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-6 h-6 rounded-md bg-zinc-700 flex items-center justify-center shrink-0">
                    <Store size={11} className="text-zinc-400" />
                  </div>
                  <span className="text-xs font-bold text-zinc-400 tracking-wide">Sin grupo asignado</span>
                  <span className="ml-auto text-[10px] text-zinc-600 shrink-0">
                    {tiendasSinGrupo.length} tienda{tiendasSinGrupo.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-1.5 pl-8">
                  {tiendasSinGrupo.map(t => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 bg-zinc-800/40 border border-zinc-700/40"
                    >
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: t.color }}
                      >
                        <Store size={10} />
                      </div>
                      <span className="text-xs font-medium text-zinc-200 flex-1 truncate">{t.nombre}</span>
                      {t.modoInventario === 'OFFLINE'
                        ? <Badge variant="danger">Cerrada</Badge>
                        : <Badge variant="success">Activa</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Cambiar contraseña ── */}
      <PerfilClient />
    </div>
  );
}
