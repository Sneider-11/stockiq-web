'use client';

import { useState } from 'react';
import {
  Users, Plus, Pencil, Trash2, X, Save, Loader2,
  Shield, Store, ToggleLeft, ToggleRight, AlertCircle,
  ChevronDown, UserCheck, UserX, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import type { Usuario, Tienda, SessionUser, Rol, GrupoComercial } from '@/types';

interface Props {
  initialUsuarios: Usuario[];
  tiendas:         Tienda[];
  grupos:          GrupoComercial[];
  sessionUser:     SessionUser;
}

type StoreRole = 'ADMIN' | 'CONTADOR';

interface FormState {
  id?:           string;
  nombre:        string;
  cedula:        string;
  rol:           Rol;
  tiendas:       string[];
  tiendasRoles:  Record<string, StoreRole>;
  grupos:        string[];
  activo:        boolean;
  creadoPor?:    string;
}

const EMPTY: FormState = {
  nombre: '', cedula: '', rol: 'CONTADOR',
  tiendas: [], tiendasRoles: {}, grupos: [], activo: true,
};

const ROL_COLORS: Record<Rol, string> = {
  SUPERADMIN: 'purple',
  ADMIN:      'info',
  CONTADOR:   'warning',
};
const ROL_LABEL: Record<Rol, string> = {
  SUPERADMIN: 'SuperAdmin',
  ADMIN:      'Admin',
  CONTADOR:   'Contador',
};

export default function EquipoClient({ initialUsuarios, tiendas, grupos, sessionUser }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState<FormState>(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error,    setError]    = useState('');
  const [search,   setSearch]   = useState('');

  const isSuperAdmin = sessionUser.rol === 'SUPERADMIN';

  const filtered = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.cedula.includes(search),
  );

  // ── Modal helpers ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY);
    setError('');
    setModal(true);
  };

  const openEdit = (u: Usuario) => {
    setForm({
      id:           u.id,
      nombre:       u.nombre,
      cedula:       u.cedula,
      rol:          u.rol,
      tiendas:      u.tiendas,
      tiendasRoles: (u.tiendasRoles ?? {}) as Record<string, StoreRole>,
      grupos:       u.grupos ?? [],
      activo:       u.activo ?? true,
      creadoPor:    u.creadoPor,
    });
    setError('');
    setModal(true);
  };

  const closeModal = () => { setModal(false); setForm(EMPTY); setError(''); };

  // ── Tiendas toggles ──────────────────────────────────────────────────────────
  const toggleTienda = (tid: string) => {
    setForm(prev => {
      const has = prev.tiendas.includes(tid);
      const tiendas = has ? prev.tiendas.filter(x => x !== tid) : [...prev.tiendas, tid];
      const tiendasRoles = { ...prev.tiendasRoles };
      if (has) delete tiendasRoles[tid];
      else if (prev.rol !== 'SUPERADMIN') tiendasRoles[tid] = 'CONTADOR';
      return { ...prev, tiendas, tiendasRoles };
    });
  };

  const setTiendaRol = (tid: string, rol: StoreRole) => {
    setForm(prev => ({ ...prev, tiendasRoles: { ...prev.tiendasRoles, [tid]: rol } }));
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.nombre.trim() || !form.cedula.trim()) {
      setError('Nombre y cédula son requeridos.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url    = form.id ? `/api/usuarios/${form.id}` : '/api/usuarios';
      const method = form.id ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar.');

      if (form.id) {
        setUsuarios(prev => prev.map(u =>
          u.id === form.id
            ? { ...u, nombre: form.nombre.toUpperCase(), cedula: form.cedula, rol: form.rol,
                tiendas: form.tiendas, tiendasRoles: form.tiendasRoles,
                grupos: form.grupos, activo: form.activo }
            : u,
        ));
      } else {
        const nuevoUsuario: Usuario = {
          id:           data.id,
          nombre:       form.nombre.toUpperCase(),
          cedula:       form.cedula,
          rol:          form.rol,
          tiendas:      form.tiendas,
          tiendasRoles: form.tiendasRoles,
          grupos:       form.grupos,
          activo:       form.activo,
          creadoPor:    sessionUser.id,
        };
        setUsuarios(prev => [...prev, nuevoUsuario]);
      }
      closeModal();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado.');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle activo ────────────────────────────────────────────────────────────
  const handleToggleActive = async (u: Usuario) => {
    if (!isSuperAdmin) return;
    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...u, activo: !u.activo }),
    });
    if (res.ok) {
      setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, activo: !u.activo } : x));
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (u: Usuario) => {
    if (!isSuperAdmin || u.id === sessionUser.id) return;
    if (!confirm(`¿Eliminar a ${u.nombre}? Esta acción no se puede deshacer.`)) return;
    setDeleting(u.id);
    const res = await fetch(`/api/usuarios/${u.id}`, { method: 'DELETE' });
    if (res.ok) {
      setUsuarios(prev => prev.filter(x => x.id !== u.id));
    }
    setDeleting(null);
  };

  return (
    <div className="max-w-5xl mx-auto page-enter">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-prp/20 border border-prp/30 flex items-center justify-center">
            <Users size={16} className="text-vlt" />
          </div>
          <div>
            <h1 className="text-lg font-black text-zinc-100">Equipo</h1>
            <p className="text-xs text-zinc-500">{usuarios.length} usuarios registrados</p>
          </div>
        </div>
        {isSuperAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-prp to-ind text-white text-sm font-semibold shadow-lg shadow-prp/20 hover:shadow-prp/40 hover:brightness-110 active:scale-[0.97] transition-all"
          >
            <Plus size={16} />
            Nuevo usuario
          </button>
        )}
      </div>

      {/* ── Search ── */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Buscar por nombre o cédula..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all"
        />
      </div>

      {/* ── Users list ── */}
      <div className="space-y-3">
        {filtered.map((u, idx) => (
          <div
            key={u.id}
            className={cn(
              'rounded-2xl border bg-zinc-900/60 p-4 transition-all duration-200 anim-fade-up',
              u.activo !== false
                ? 'border-zinc-800/70 hover:border-zinc-700'
                : 'border-zinc-800/40 opacity-60',
            )}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <div className="flex items-center gap-4 flex-wrap">
              {/* Avatar */}
              <div className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-base shrink-0',
                u.activo !== false
                  ? 'bg-gradient-to-br from-prp to-ind shadow-md shadow-prp/25'
                  : 'bg-zinc-700',
              )}>
                {u.nombre.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-zinc-100">{u.nombre}</p>
                  <Badge variant={ROL_COLORS[u.rol] as 'purple' | 'info' | 'warning'}>
                    {ROL_LABEL[u.rol]}
                  </Badge>
                  {u.activo === false && <Badge variant="danger">Inactivo</Badge>}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">CC {u.cedula}</p>
                {/* Grupos */}
                {(u.grupos ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(u.grupos ?? []).map(gid => {
                      const g = grupos.find(x => x.id === gid);
                      if (!g) return null;
                      return (
                        <span
                          key={gid}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-white border border-transparent"
                          style={{ backgroundColor: `${g.color}33`, borderColor: `${g.color}55` }}
                        >
                          <Building2 size={9} style={{ color: g.color }} />
                          <span style={{ color: g.color }}>{g.nombre}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
                {u.tiendas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {u.tiendas.map(tid => {
                      const tienda = tiendas.find(t => t.id === tid);
                      const storeRol = (u.tiendasRoles as Record<string, string>)?.[tid];
                      return (
                        <span
                          key={tid}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700/60"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: tienda?.color ?? '#52525B' }}
                          />
                          {tienda?.nombre.replace('Tienda ', '').replace('Inventario ', '') ?? tid}
                          {storeRol && <span className="text-zinc-500">· {storeRol}</span>}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions */}
              {isSuperAdmin && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(u)}
                    title={u.activo !== false ? 'Desactivar' : 'Activar'}
                    className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                  >
                    {u.activo !== false
                      ? <UserCheck size={16} className="text-emerald-500" />
                      : <UserX size={16} className="text-zinc-500" />}
                  </button>
                  <button
                    onClick={() => openEdit(u)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-vlt hover:bg-prp/10 transition-all"
                  >
                    <Pencil size={15} />
                  </button>
                  {u.id !== sessionUser.id && (
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={deleting === u.id}
                      className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-all disabled:opacity-50"
                    >
                      {deleting === u.id
                        ? <Loader2 size={15} className="animate-spin" />
                        : <Trash2 size={15} />}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
            <Users size={40} className="mb-3 opacity-30" />
            <p className="text-sm">No se encontraron usuarios</p>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          MODAL
      ════════════════════════════════════════ */}
      {modal && (
        <Modal onClose={closeModal}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl modal-card">

            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 bg-zinc-900/95 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-prp/20 flex items-center justify-center">
                  <Shield size={15} className="text-vlt" />
                </div>
                <h2 className="text-base font-black text-zinc-100">
                  {form.id ? 'Editar usuario' : 'Nuevo usuario'}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: JUAN PÉREZ"
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all"
                />
              </div>

              {/* Cédula */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                  Cédula
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.cedula}
                  onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))}
                  placeholder="Número de cédula"
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all"
                />
              </div>

              {/* Rol global */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                  Rol global
                </label>
                <div className="relative">
                  <select
                    value={form.rol}
                    onChange={e => setForm(f => ({
                      ...f,
                      rol: e.target.value as Rol,
                      tiendasRoles: {},
                    }))}
                    className="w-full appearance-none bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all"
                  >
                    <option value="SUPERADMIN">SuperAdmin — acceso total</option>
                    <option value="ADMIN">Admin — gestión de tiendas</option>
                    <option value="CONTADOR">Contador — solo escaneo</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  {form.rol === 'SUPERADMIN' && 'Acceso completo a todas las tiendas y configuración.'}
                  {form.rol === 'ADMIN' && 'Puede escanear, ver resultados y gestionar contadores.'}
                  {form.rol === 'CONTADOR' && 'Solo puede escanear artículos en las tiendas asignadas.'}
                </p>
              </div>

              {/* Grupos asignados */}
              {grupos.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                    <Building2 size={12} />
                    Grupos comerciales
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {grupos.map(g => {
                      const sel = form.grupos.includes(g.id);
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setForm(prev => ({
                            ...prev,
                            grupos: sel
                              ? prev.grupos.filter(x => x !== g.id)
                              : [...prev.grupos, g.id],
                          }))}
                          className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border',
                            sel
                              ? 'text-white border-transparent scale-105'
                              : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:text-zinc-100 hover:bg-zinc-700/60',
                          )}
                          style={sel ? { backgroundColor: g.color, boxShadow: `0 2px 10px ${g.color}50` } : undefined}
                        >
                          <Building2 size={11} />
                          {g.nombre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tiendas asignadas */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                  <Store size={12} />
                  Tiendas asignadas
                </label>
                <div className="space-y-2">
                  {tiendas.map(t => {
                    const assigned = form.tiendas.includes(t.id);
                    const storeRol = form.tiendasRoles[t.id] ?? 'CONTADOR';
                    const isSuperRol = form.rol === 'SUPERADMIN';

                    return (
                      <div
                        key={t.id}
                        className={cn(
                          'rounded-xl border p-3 transition-all duration-150',
                          assigned
                            ? 'border-zinc-700/80 bg-zinc-800/40'
                            : 'border-zinc-800/40 bg-zinc-800/20',
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => !isSuperRol && toggleTienda(t.id)}
                            className={cn(
                              'flex items-center gap-2.5 flex-1 text-left',
                              isSuperRol && 'cursor-default',
                            )}
                          >
                            {/* Checkbox */}
                            <div
                              className={cn(
                                'w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0',
                                isSuperRol
                                  ? 'bg-prp/30 border-prp/50'
                                  : assigned
                                    ? 'border-transparent'
                                    : 'border-zinc-600 bg-transparent',
                              )}
                              style={assigned && !isSuperRol ? { backgroundColor: t.color } : undefined}
                            >
                              {(assigned || isSuperRol) && (
                                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                  <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            {/* Tienda dot + name */}
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                            <span className={cn('text-sm font-medium', assigned || isSuperRol ? 'text-zinc-100' : 'text-zinc-500')}>
                              {t.nombre}
                            </span>
                          </button>

                          {/* Rol de tienda — solo si no es SUPERADMIN y está asignada */}
                          {assigned && !isSuperRol && (
                            <div className="relative shrink-0">
                              <select
                                value={storeRol}
                                onChange={e => setTiendaRol(t.id, e.target.value as StoreRole)}
                                className="appearance-none text-xs bg-zinc-700/60 border border-zinc-600/60 rounded-lg px-3 py-1.5 pr-7 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-prp/50 transition-all"
                              >
                                <option value="ADMIN">Admin</option>
                                <option value="CONTADOR">Contador</option>
                              </select>
                              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                            </div>
                          )}

                          {isSuperRol && (
                            <span className="text-[11px] text-zinc-500 shrink-0">Global</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Estado activo */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">
                  Estado
                </label>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
                  className="flex items-center gap-3 w-full rounded-xl border border-zinc-700/60 bg-zinc-800/40 px-4 py-3 hover:bg-zinc-800/60 transition-all"
                >
                  {form.activo
                    ? <ToggleRight size={22} className="text-emerald-400 shrink-0" />
                    : <ToggleLeft  size={22} className="text-zinc-600 shrink-0" />}
                  <span className={cn('text-sm font-semibold', form.activo ? 'text-emerald-400' : 'text-zinc-500')}>
                    {form.activo ? 'Usuario activo' : 'Usuario inactivo'}
                  </span>
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/60 rounded-xl px-4 py-3">
                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800/60 bg-zinc-900/95 backdrop-blur">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-prp to-ind text-white text-sm font-semibold shadow-lg shadow-prp/20 hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
