'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Building2, Store, Users, Plus, Minus,
  Loader2, ChevronRight, CheckCircle2, Boxes,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { GrupoComercial, Tienda, Usuario } from '@/types';

interface Props {
  grupo:    GrupoComercial;
  tiendas:  Tienda[];        // todas las tiendas del sistema
  usuarios: Usuario[];       // todos los usuarios
}

export default function GrupoDetailClient({ grupo, tiendas: allTiendas, usuarios: allUsuarios }: Props) {
  const [tiendas, setTiendas]   = useState<Tienda[]>(allTiendas);
  const [toggling, setToggling] = useState<string | null>(null);

  const tiendasDelGrupo = tiendas.filter(t => t.grupoId === grupo.id);
  const tiendasLibres   = tiendas.filter(t => !t.grupoId);
  const usuariosDelGrupo = allUsuarios.filter(u => u.grupos.includes(grupo.id));

  const handleToggleTienda = async (tiendaId: string, accion: 'asignar' | 'quitar') => {
    setToggling(tiendaId);
    const res = await fetch(`/api/grupos/${grupo.id}/tiendas`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tiendaId, accion }),
    });
    if (res.ok) {
      setTiendas(prev => prev.map(t =>
        t.id === tiendaId
          ? { ...t, grupoId: accion === 'asignar' ? grupo.id : undefined }
          : t,
      ));
    }
    setToggling(null);
  };

  return (
    <div className="max-w-5xl mx-auto page-enter">
      {/* ── Back + Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/grupos"
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 hover:bg-zinc-800 transition-all hover:scale-105"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg"
            style={{ backgroundColor: grupo.color, boxShadow: `0 4px 14px ${grupo.color}55` }}
          >
            <Building2 size={18} />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-100 tracking-tight">{grupo.nombre}</h1>
            {grupo.descripcion && (
              <p className="text-xs text-zinc-500 mt-0.5">{grupo.descripcion}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats rápidos ── */}
      <div className="grid grid-cols-2 gap-3 mb-7">
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 flex items-center gap-3 anim-fade-up" style={{ animationDelay: '40ms' }}>
          <div className="w-9 h-9 rounded-xl bg-sky-950/60 border border-sky-900/50 flex items-center justify-center shrink-0">
            <Store size={16} className="text-sky-400" />
          </div>
          <div>
            <p className="text-xl font-black text-zinc-100">{tiendasDelGrupo.length}</p>
            <p className="text-xs text-zinc-500">Tiendas asignadas</p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 p-4 flex items-center gap-3 anim-fade-up" style={{ animationDelay: '80ms' }}>
          <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-900/50 flex items-center justify-center shrink-0">
            <Users size={16} className="text-vlt" />
          </div>
          <div>
            <p className="text-xl font-black text-zinc-100">{usuariosDelGrupo.length}</p>
            <p className="text-xs text-zinc-500">Usuarios asignados</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Columna izquierda: Tiendas del grupo ── */}
        <div className="anim-slide-right" style={{ animationDelay: '100ms' }}>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Store size={13} />
            Tiendas en este grupo
          </h2>

          {tiendasDelGrupo.length === 0 ? (
            <div className="rounded-xl border border-zinc-800/40 bg-zinc-900/30 p-6 text-center">
              <Store size={28} className="mx-auto mb-2 text-zinc-700" />
              <p className="text-xs text-zinc-600">Sin tiendas asignadas</p>
              <p className="text-[11px] text-zinc-700 mt-0.5">Añade tiendas desde el panel de abajo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tiendasDelGrupo.map(t => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/60 px-4 py-3 group hover:border-zinc-700 transition-all"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: t.color, boxShadow: `0 2px 8px ${t.color}44` }}
                  >
                    <Boxes size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-100 truncate">{t.nombre}</p>
                    {t.nit && <p className="text-[11px] text-zinc-500">NIT: {t.nit}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.modoInventario === 'OFFLINE'
                      ? <Badge variant="danger">Cerrada</Badge>
                      : <Badge variant="success">Activa</Badge>}
                    <button
                      onClick={() => handleToggleTienda(t.id, 'quitar')}
                      disabled={toggling === t.id}
                      title="Quitar del grupo"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 btn-press"
                    >
                      {toggling === t.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Minus size={13} />}
                    </button>
                    <Link
                      href={`/tienda/${t.id}`}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                    >
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tiendas disponibles para añadir */}
          {tiendasLibres.length > 0 && (
            <div className="mt-4">
              <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                Tiendas sin grupo — disponibles
              </h3>
              <div className="space-y-1.5">
                {tiendasLibres.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800/40 bg-zinc-900/30 px-3 py-2.5 hover:border-zinc-700/60 transition-all"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <p className="text-sm text-zinc-400 flex-1 truncate">{t.nombre}</p>
                    <button
                      onClick={() => handleToggleTienda(t.id, 'asignar')}
                      disabled={toggling === t.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700/60 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all disabled:opacity-50 shrink-0"
                    >
                      {toggling === t.id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Plus size={12} />}
                      Añadir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Columna derecha: Usuarios del grupo ── */}
        <div className="anim-slide-left" style={{ animationDelay: '140ms' }}>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Users size={13} />
            Usuarios en este grupo
          </h2>

          {usuariosDelGrupo.length === 0 ? (
            <div className="rounded-xl border border-zinc-800/40 bg-zinc-900/30 p-6 text-center">
              <Users size={28} className="mx-auto mb-2 text-zinc-700" />
              <p className="text-xs text-zinc-600">Sin usuarios asignados</p>
              <p className="text-[11px] text-zinc-700 mt-0.5">Asigna usuarios desde el módulo Equipo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {usuariosDelGrupo.map((u, idx) => {
                const tiendasEnGrupo = tiendasDelGrupo
                  .filter(t => u.tiendas.includes(t.id));
                return (
                  <div
                    key={u.id}
                    className="rounded-xl border border-zinc-800/60 bg-zinc-900/60 px-4 py-3 anim-fade-up"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-prp to-ind flex items-center justify-center text-white font-black text-sm shrink-0">
                        {u.nombre.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-100 truncate">{u.nombre}</p>
                        <p className="text-[11px] text-zinc-500">CC {u.cedula}</p>
                      </div>
                      <Badge variant={u.rol === 'SUPERADMIN' ? 'purple' : u.rol === 'ADMIN' ? 'info' : 'warning'}>
                        {u.rol}
                      </Badge>
                    </div>
                    {tiendasEnGrupo.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 pl-11">
                        {tiendasEnGrupo.map(t => (
                          <span
                            key={t.id}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                          >
                            <CheckCircle2 size={9} className="text-emerald-500" />
                            {t.nombre.replace('Tienda ', '').replace('Inventario ', '')}
                            {u.tiendasRoles[t.id] && (
                              <span className="text-zinc-600">· {u.tiendasRoles[t.id]}</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-[11px] text-zinc-600 mt-3">
            Para asignar o quitar usuarios de este grupo, ve al módulo{' '}
            <Link href="/equipo" className="text-vlt hover:text-prp transition-colors">Equipo</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
