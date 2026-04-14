'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2, Plus, Pencil, Trash2, X, Save, Loader2,
  AlertCircle, ChevronRight, Package, Store,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import type { GrupoComercial, Tienda } from '@/types';

const PRESET_COLORS = [
  '#6366F1', '#8B5CF6', '#A855F7', '#EC4899',
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#10B981', '#06B6D4', '#3B82F6', '#14B8A6',
];

interface FormState {
  id?:         string;
  nombre:      string;
  color:       string;
  descripcion: string;
}

const EMPTY: FormState = { nombre: '', color: '#6366F1', descripcion: '' };

interface Props {
  initialGrupos: GrupoComercial[];
  tiendas:       Tienda[];
}

export default function GruposClient({ initialGrupos, tiendas }: Props) {
  const [grupos,   setGrupos]   = useState<GrupoComercial[]>(initialGrupos);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState<FormState>(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error,    setError]    = useState('');

  const openCreate = () => { setForm(EMPTY); setError(''); setModal(true); };
  const openEdit   = (g: GrupoComercial) => {
    setForm({ id: g.id, nombre: g.nombre, color: g.color, descripcion: g.descripcion ?? '' });
    setError('');
    setModal(true);
  };
  const closeModal = () => { setModal(false); setForm(EMPTY); setError(''); };

  const handleSave = async () => {
    if (!form.nombre.trim()) { setError('El nombre es requerido.'); return; }
    setSaving(true); setError('');
    try {
      const url    = form.id ? `/api/grupos/${form.id}` : '/api/grupos';
      const method = form.id ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.nombre, color: form.color, descripcion: form.descripcion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar.');

      if (form.id) {
        setGrupos(prev => prev.map(g =>
          g.id === form.id
            ? { ...g, nombre: form.nombre.toUpperCase(), color: form.color, descripcion: form.descripcion || undefined }
            : g,
        ));
      } else {
        const nuevo: GrupoComercial = {
          id:          data.id,
          nombre:      form.nombre.toUpperCase(),
          color:       form.color,
          descripcion: form.descripcion || undefined,
          creadoEn:    new Date().toISOString(),
        };
        setGrupos(prev => [...prev, nuevo]);
      }
      closeModal();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (g: GrupoComercial) => {
    const tiendasDelGrupo = tiendas.filter(t => t.grupoId === g.id);
    if (tiendasDelGrupo.length > 0) {
      if (!confirm(`"${g.nombre}" tiene ${tiendasDelGrupo.length} tienda(s) asignada(s). Al eliminar el grupo, esas tiendas quedarán sin grupo. ¿Continuar?`)) return;
    } else {
      if (!confirm(`¿Eliminar el grupo "${g.nombre}"?`)) return;
    }
    setDeleting(g.id);
    const res = await fetch(`/api/grupos/${g.id}`, { method: 'DELETE' });
    if (res.ok) setGrupos(prev => prev.filter(x => x.id !== g.id));
    setDeleting(null);
  };

  return (
    <div className="max-w-4xl mx-auto page-enter">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-prp/20 border border-prp/30 flex items-center justify-center">
            <Building2 size={16} className="text-vlt" />
          </div>
          <div>
            <h1 className="text-lg font-black text-zinc-100">Grupos Comerciales</h1>
            <p className="text-xs text-zinc-500">{grupos.length} grupos registrados</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-prp to-ind text-white text-sm font-semibold shadow-lg shadow-prp/20 hover:shadow-prp/40 hover:brightness-110 active:scale-[0.97] transition-all"
        >
          <Plus size={16} />
          Nuevo grupo
        </button>
      </div>

      {/* ── Lista ── */}
      {grupos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
          <Building2 size={48} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">No hay grupos comerciales</p>
          <button onClick={openCreate} className="text-xs text-vlt hover:text-prp mt-2 transition-colors">
            + Crear primer grupo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {grupos.map((g, i) => {
            const tiendasDelGrupo = tiendas.filter(t => t.grupoId === g.id);
            return (
              <div
                key={g.id}
                className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all overflow-hidden anim-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Accent bar */}
                <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${g.color}, ${g.color}44)` }} />

                <div className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Icono */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg"
                      style={{ backgroundColor: g.color, boxShadow: `0 4px 14px ${g.color}55` }}
                    >
                      <Building2 size={18} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-100">{g.nombre}</p>
                      {g.descripcion && (
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">{g.descripcion}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Store size={11} className="text-zinc-600" />
                        <span className="text-[11px] text-zinc-500">
                          {tiendasDelGrupo.length} tienda{tiendasDelGrupo.length !== 1 ? 's' : ''}
                        </span>
                        {tiendasDelGrupo.slice(0, 4).map(t => (
                          <span
                            key={t.id}
                            className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-zinc-300 bg-zinc-800 border border-zinc-700/60"
                          >
                            {t.nombre.replace('Tienda ', '').replace('Inventario ', '')}
                          </span>
                        ))}
                        {tiendasDelGrupo.length > 4 && (
                          <span className="text-[10px] text-zinc-600">+{tiendasDelGrupo.length - 4} más</span>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(g)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-vlt hover:bg-prp/10 transition-all"
                        title="Editar grupo"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(g)}
                        disabled={deleting === g.id}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-all disabled:opacity-50"
                        title="Eliminar grupo"
                      >
                        {deleting === g.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />}
                      </button>
                      <Link
                        href={`/grupo/${g.id}`}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                        title="Ver grupo"
                      >
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tiendas sin grupo ── */}
      {tiendas.filter(t => !t.grupoId).length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Package size={13} />
            Tiendas sin grupo asignado
          </h2>
          <div className="rounded-xl border border-zinc-800/40 bg-zinc-900/30 p-3 flex flex-wrap gap-2">
            {tiendas.filter(t => !t.grupoId).map(t => (
              <span
                key={t.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-xs text-zinc-400"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                {t.nombre}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-zinc-600 mt-2">
            Estas tiendas solo son visibles para el SuperAdmin. Asígnalas a un grupo desde la página del grupo.
          </p>
        </div>
      )}

      {/* ════════════════════ MODAL ════════════════════ */}
      {modal && (
        <Modal onClose={closeModal}>
          <div className="w-full max-w-md rounded-2xl border border-zinc-700/80 bg-zinc-900 shadow-2xl modal-card">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-prp/20 flex items-center justify-center">
                  <Building2 size={15} className="text-vlt" />
                </div>
                <h2 className="text-base font-black text-zinc-100">
                  {form.id ? 'Editar grupo' : 'Nuevo grupo comercial'}
                </h2>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                  Nombre del grupo
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre del grupo comercial"
                  className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all input-field"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                  Descripción <span className="text-zinc-600 normal-case">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Descripción breve del grupo (opcional)"
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
                      className={cn(
                        'w-7 h-7 rounded-lg transition-all hover:scale-110',
                        form.color === c && 'ring-2 ring-offset-2 ring-offset-zinc-900 ring-white scale-110',
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                    title="Color personalizado"
                  />
                </div>
                {/* Preview */}
                <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/40">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: form.color }}
                  >
                    <Building2 size={14} />
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
