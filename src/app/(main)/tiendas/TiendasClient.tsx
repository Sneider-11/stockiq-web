'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Store, Plus, Pencil, Trash2, X, Save, Loader2,
  ChevronRight, Power, AlertCircle, Package, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import type { Tienda } from '@/types';

const PRESET_COLORS = [
  '#6366F1', '#8B5CF6', '#A855F7', '#EC4899',
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#10B981', '#06B6D4', '#3B82F6', '#14B8A6',
];

interface Props {
  initialTiendas: Tienda[];
  isSuperAdmin: boolean;
}

interface FormState {
  id?:     string;
  nombre:  string;
  nit:     string;
  color:   string;
}

const EMPTY: FormState = { nombre: '', nit: '', color: '#6366F1' };

export default function TiendasClient({ initialTiendas, isSuperAdmin }: Props) {
  const [tiendas,        setTiendas]        = useState<Tienda[]>(initialTiendas);
  const [modal,          setModal]          = useState(false);
  const [form,           setForm]           = useState<FormState>(EMPTY);
  const [saving,         setSaving]         = useState(false);
  const [deleting,       setDeleting]       = useState<string | null>(null);
  const [toggling,       setToggling]       = useState<string | null>(null);
  const [error,          setError]          = useState('');
  const [confirmDelete,  setConfirmDelete]  = useState<string | null>(null);
  const [confirmToggle,  setConfirmToggle]  = useState<string | null>(null);

  const openCreate = () => { setForm(EMPTY); setError(''); setModal(true); };
  const openEdit   = (t: Tienda) => {
    setForm({ id: t.id, nombre: t.nombre, nit: t.nit ?? '', color: t.color });
    setError('');
    setModal(true);
  };
  const closeModal = () => { setModal(false); setForm(EMPTY); setError(''); };

  // ── Guardar ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.nombre.trim()) { setError('El nombre es requerido.'); return; }
    setSaving(true); setError('');
    try {
      const url    = form.id ? `/api/tiendas/${form.id}` : '/api/tiendas';
      const method = form.id ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.nombre, nit: form.nit, color: form.color }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar.');

      if (form.id) {
        setTiendas(prev => prev.map(t =>
          t.id === form.id
            ? { ...t, nombre: form.nombre.toUpperCase(), nit: form.nit || undefined, color: form.color }
            : t,
        ));
      } else {
        const nueva: Tienda = {
          id:             data.id,
          nombre:         form.nombre.toUpperCase(),
          icono:          'storefront',
          color:          form.color,
          nit:            form.nit || undefined,
          modoInventario: 'ONLINE',
        };
        setTiendas(prev => [...prev, nueva]);
      }
      closeModal();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado.');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle modo inventario ────────────────────────────────────────────────────
  const handleToggleModo = async (t: Tienda) => {
    if (!isSuperAdmin) return;
    const nuevoModo = t.modoInventario === 'OFFLINE' ? 'ONLINE' : 'OFFLINE';
    if (nuevoModo === 'OFFLINE') {
      setConfirmToggle(t.id);
      return;
    }
    await doToggle(t, nuevoModo);
  };

  const doToggle = async (t: Tienda, nuevoModo: 'ONLINE' | 'OFFLINE') => {
    setConfirmToggle(null);
    setToggling(t.id);
    const res = await fetch(`/api/tiendas/${t.id}/modo`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modo: nuevoModo }),
    });
    if (res.ok) {
      setTiendas(prev => prev.map(x => x.id === t.id ? { ...x, modoInventario: nuevoModo } : x));
    }
    setToggling(null);
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────────
  const handleDelete = (t: Tienda) => {
    if (!isSuperAdmin) return;
    setConfirmDelete(t.id);
  };

  const doDelete = async (t: Tienda) => {
    setConfirmDelete(null);
    setDeleting(t.id);
    const res = await fetch(`/api/tiendas/${t.id}`, { method: 'DELETE' });
    if (res.ok) setTiendas(prev => prev.filter(x => x.id !== t.id));
    setDeleting(null);
  };

  return (
    <div className="max-w-4xl mx-auto page-enter">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-prp/20 border border-prp/30 flex items-center justify-center">
            <Store size={16} className="text-vlt" />
          </div>
          <div>
            <h1 className="text-lg font-black text-zinc-100">Tiendas</h1>
            <p className="text-xs text-zinc-500">{tiendas.length} tiendas registradas</p>
          </div>
        </div>
        {isSuperAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-prp to-ind text-white text-sm font-semibold shadow-lg shadow-prp/20 hover:shadow-prp/40 hover:brightness-110 active:scale-[0.97] transition-all"
          >
            <Plus size={16} />
            Nueva tienda
          </button>
        )}
      </div>

      {/* ── Lista ── */}
      {tiendas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
          <Package size={48} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">No hay tiendas registradas</p>
          {isSuperAdmin && (
            <button onClick={openCreate} className="text-xs text-vlt hover:text-prp mt-2 transition-colors">
              + Crear primera tienda
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tiendas.map(t => (
            <div
              key={t.id}
              className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all overflow-hidden"
            >
              {/* Accent bar */}
              <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${t.color}, ${t.color}44)` }} />

              <div className="p-4">
                <div className="flex items-center gap-3">
                  {/* Icono */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg"
                    style={{ backgroundColor: t.color, boxShadow: `0 4px 14px ${t.color}55` }}
                  >
                    <Package size={16} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-100 truncate">{t.nombre}</p>
                    {t.nit && <p className="text-xs text-zinc-500">NIT: {t.nit}</p>}
                  </div>

                  {/* Estado + acciones */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {t.modoInventario === 'OFFLINE'
                      ? <Badge variant="danger">Cerrada</Badge>
                      : <Badge variant="success">Activa</Badge>}

                    {isSuperAdmin && (
                      <>
                        {/* Toggle modo */}
                        <button
                          onClick={() => handleToggleModo(t)}
                          disabled={toggling === t.id}
                          aria-label={t.modoInventario === 'OFFLINE' ? 'Abrir inventario' : 'Cerrar inventario'}
                          title={t.modoInventario === 'OFFLINE' ? 'Abrir inventario' : 'Cerrar inventario'}
                          className={cn(
                            'p-1.5 rounded-lg transition-all',
                            t.modoInventario === 'OFFLINE'
                              ? 'text-emerald-500 hover:bg-emerald-950/40'
                              : 'text-zinc-500 hover:text-amber-400 hover:bg-amber-950/30',
                          )}
                        >
                          {toggling === t.id
                            ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                            : <Power size={14} aria-hidden="true" />}
                        </button>
                        {/* Editar */}
                        <button
                          onClick={() => openEdit(t)}
                          aria-label="Editar tienda"
                          title="Editar tienda"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-vlt hover:bg-prp/10 transition-all"
                        >
                          <Pencil size={14} aria-hidden="true" />
                        </button>
                        {/* Eliminar */}
                        <button
                          onClick={() => handleDelete(t)}
                          disabled={deleting === t.id}
                          aria-label="Eliminar tienda"
                          title="Eliminar tienda"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-all disabled:opacity-50"
                        >
                          {deleting === t.id
                            ? <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                            : <Trash2 size={14} aria-hidden="true" />}
                        </button>
                      </>
                    )}

                    {/* Ver tienda */}
                    <Link
                      href={`/tienda/${t.id}`}
                      aria-label={`Ver detalles de ${t.nombre}`}
                      title={`Ver ${t.nombre}`}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                    >
                      <ChevronRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                {/* Inline confirm: cerrar inventario */}
                {confirmToggle === t.id && (
                  <div className="mt-3 flex items-center gap-2 bg-amber-950/40 border border-amber-900/50 rounded-xl px-3 py-2.5 anim-fade-up">
                    <AlertCircle size={13} className="text-amber-400 shrink-0" aria-hidden="true" />
                    <p className="text-xs text-amber-300 flex-1">¿Cerrar inventario? Los auditores no podrán escanear.</p>
                    <button
                      onClick={() => doToggle(t, 'OFFLINE')}
                      aria-label="Confirmar cierre de inventario"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition-all"
                    >
                      <Check size={11} aria-hidden="true" /> Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmToggle(null)}
                      aria-label="Cancelar"
                      className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 transition-all"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </div>
                )}

                {/* Inline confirm: eliminar tienda */}
                {confirmDelete === t.id && (
                  <div className="mt-3 flex items-center gap-2 bg-red-950/40 border border-red-900/50 rounded-xl px-3 py-2.5 anim-fade-up">
                    <AlertCircle size={13} className="text-red-400 shrink-0" aria-hidden="true" />
                    <p className="text-xs text-red-300 flex-1">¿Eliminar tienda y todos sus datos?</p>
                    <button
                      onClick={() => doDelete(t)}
                      aria-label="Confirmar eliminación"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold hover:bg-red-500/30 transition-all"
                    >
                      <Check size={11} aria-hidden="true" /> Eliminar
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      aria-label="Cancelar"
                      className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 transition-all"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════ MODAL ════════════════════════════ */}
      {modal && (
        <Modal onClose={closeModal}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl modal-card">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-prp/20 flex items-center justify-center">
                  <Store size={15} className="text-vlt" />
                </div>
                <h2 className="text-base font-black text-zinc-100">
                  {form.id ? 'Editar tienda' : 'Nueva tienda'}
                </h2>
              </div>
              <button onClick={closeModal} aria-label="Cerrar" className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                  Nombre de la tienda
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre de la tienda o sede"
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all input-field"
                />
              </div>

              {/* NIT */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                  NIT <span className="text-zinc-600 normal-case">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.nit}
                  onChange={e => setForm(f => ({ ...f, nit: e.target.value }))}
                  placeholder="NIT de la empresa"
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all input-field"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">
                  Color identificador
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      aria-label={`Seleccionar color ${c}`}
                      aria-pressed={form.color === c}
                      className={cn(
                        'w-7 h-7 rounded-lg transition-all hover:scale-110',
                        form.color === c && 'ring-2 ring-offset-2 ring-offset-zinc-900 ring-white scale-110',
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  {/* Custom color */}
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color}
                      onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                      title="Color personalizado"
                    />
                  </div>
                </div>
                {/* Preview */}
                <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/40">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: form.color }}
                  >
                    <Package size={14} />
                  </div>
                  <span className="text-sm font-semibold text-zinc-200">
                    {form.nombre.trim().toUpperCase() || 'VISTA PREVIA'}
                  </span>
                </div>
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
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800/60">
              <button onClick={closeModal} className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-prp to-ind text-white text-sm font-semibold shadow-lg shadow-prp/20 hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-50 btn-press"
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
