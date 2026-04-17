'use client';

import { useState } from 'react';
import { Trash2, Loader2, CheckCircle, Package, Check, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatCOP } from '@/lib/utils';
import type { SobranteSinStock } from '@/types';
import { useToast } from '@/context/ToastContext';

interface Props {
  initialSobrantes: SobranteSinStock[];
  tiendaId: string;
  canManage: boolean; // SUPERADMIN o ADMIN
}

const EMPTY_FORM = { codigo: '', descripcion: '', ubicacion: '', precio: '', cantidad: '1' };

export default function SobrantesClient({ initialSobrantes, tiendaId, canManage }: Props) {
  const toast = useToast();
  const [sobrantes,     setSobrantes]     = useState<SobranteSinStock[]>(initialSobrantes);
  const [confirming,    setConfirming]    = useState<string | null>(null);
  const [deleting,      setDeleting]      = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ── Formulario nuevo sobrante ──
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);

  const handleConfirmar = async (s: SobranteSinStock) => {
    if (!canManage || s.estado === 'CONFIRMADO') return;
    setConfirming(s.id);
    const res = await fetch(`/api/tienda/${tiendaId}/sobrantes/${s.id}`, { method: 'PATCH' });
    if (res.ok) {
      setSobrantes(prev => prev.map(x => x.id === s.id ? { ...x, estado: 'CONFIRMADO' } : x));
      toast.success('Sobrante confirmado.');
    } else {
      toast.error('No se pudo confirmar el sobrante.');
    }
    setConfirming(null);
  };

  const handleDelete = async (s: SobranteSinStock) => {
    if (!canManage) return;
    setDeleting(s.id);
    const res = await fetch(`/api/tienda/${tiendaId}/sobrantes/${s.id}`, { method: 'DELETE' });
    if (res.ok) {
      setSobrantes(prev => prev.filter(x => x.id !== s.id));
      toast.success('Sobrante eliminado.');
    } else {
      toast.error('No se pudo eliminar el sobrante.');
    }
    setDeleting(null);
    setConfirmDelete(null);
  };

  const handleAddSobrante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descripcion.trim()) { toast.error('La descripción es obligatoria.'); return; }
    setSaving(true);
    const res = await fetch(`/api/tienda/${tiendaId}/sobrantes`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        codigo:      form.codigo.trim(),
        descripcion: form.descripcion.trim(),
        ubicacion:   form.ubicacion.trim(),
        precio:      parseFloat(form.precio) || 0,
        cantidad:    parseInt(form.cantidad, 10) || 1,
      }),
    });
    if (res.ok) {
      const nuevo: SobranteSinStock = await res.json();
      setSobrantes(prev => [nuevo, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success('Sobrante agregado.');
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error((err as { error?: string }).error ?? 'No se pudo agregar el sobrante.');
    }
    setSaving(false);
  };

  const pendientes  = sobrantes.filter(s => s.estado === 'PENDIENTE').length;
  const confirmados = sobrantes.filter(s => s.estado === 'CONFIRMADO').length;

  return (
    <>
      {/* ── Header con botón agregar ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-3">
          {sobrantes.length > 0 && (
            <>
              <div className="flex items-center gap-2 bg-amber-950/30 border border-amber-900/40 rounded-xl px-4 py-2.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs text-amber-400 font-semibold">{pendientes} pendiente{pendientes !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-900/40 rounded-xl px-4 py-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-emerald-400 font-semibold">{confirmados} confirmado{confirmados !== 1 ? 's' : ''}</span>
              </div>
            </>
          )}
        </div>

        {canManage && (
          <button
            onClick={() => { setShowForm(v => !v); setForm(EMPTY_FORM); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all hover:scale-105 shadow-lg shadow-violet-900/30"
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Cancelar' : 'Agregar sobrante'}
          </button>
        )}
      </div>

      {/* ── Formulario nuevo sobrante ── */}
      {showForm && (
        <form
          onSubmit={handleAddSobrante}
          className="rounded-2xl bg-zinc-900/80 border border-violet-800/40 p-5 mb-5 anim-fade-up"
        >
          <p className="text-sm font-bold text-zinc-100 mb-4">Nuevo sobrante sin stock</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                Descripción <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Nombre del artículo"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Código</label>
              <input
                type="text"
                value={form.codigo}
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                placeholder="SKU / código de barras"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Ubicación</label>
              <input
                type="text"
                value={form.ubicacion}
                onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))}
                placeholder="Bodega / estante"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.cantidad}
                  onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Precio unitario</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={form.precio}
                  onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !form.descripcion.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              {saving ? 'Guardando…' : 'Guardar sobrante'}
            </button>
          </div>
        </form>
      )}

      {/* ── Tabla ── */}
      {sobrantes.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
          <Package size={48} className="mb-4 opacity-30" />
          <p className="text-sm font-medium mb-2">No hay sobrantes sin stock</p>
          {canManage && (
            <p className="text-xs text-zinc-600">
              Usa el botón <span className="text-violet-400 font-semibold">Agregar sobrante</span> para registrar artículos que aparecen físicamente pero no están en el sistema.
            </p>
          )}
        </div>
      ) : sobrantes.length > 0 ? (
        <div className="rounded-2xl border border-zinc-800/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/80">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Artículo</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Cant.</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Precio</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Auditor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Fecha</th>
                  {canManage && <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {sobrantes.map(s => (
                  <tr key={s.id} className="hover:bg-zinc-900/40 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-zinc-200 font-medium truncate max-w-[200px]">{s.descripcion}</p>
                      <p className="text-[11px] text-zinc-500">{s.codigo}{s.codigo && s.ubicacion ? ' · ' : ''}{s.ubicacion}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-100 font-bold font-mono">{s.cantidad}</td>
                    <td className="px-4 py-3 text-center text-zinc-300 text-xs">{formatCOP(s.precio)}</td>
                    <td className="px-4 py-3 text-center">
                      {s.estado === 'CONFIRMADO'
                        ? <Badge variant="success">Confirmado</Badge>
                        : <Badge variant="warning">Pendiente</Badge>}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden lg:table-cell">{s.usuarioNombre}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden lg:table-cell">{formatDate(s.registradoEn)}</td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {s.estado === 'PENDIENTE' && (
                            <button
                              onClick={() => handleConfirmar(s)}
                              disabled={confirming === s.id}
                              title="Confirmar sobrante"
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-950/30 transition-all disabled:opacity-50"
                            >
                              {confirming === s.id
                                ? <Loader2 size={14} className="animate-spin" />
                                : <CheckCircle size={14} />}
                            </button>
                          )}
                          {confirmDelete === s.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-2 py-1 rounded-lg text-[10px] font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-all"
                              >
                                No
                              </button>
                              <button
                                onClick={() => handleDelete(s)}
                                disabled={deleting === s.id}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-semibold hover:bg-red-500/30 transition-all disabled:opacity-50"
                              >
                                {deleting === s.id
                                  ? <Loader2 size={10} className="animate-spin" />
                                  : <Check size={10} aria-hidden="true" />}
                                Sí
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(s.id)}
                              disabled={deleting === s.id}
                              title="Eliminar sobrante"
                              aria-label={`Eliminar sobrante ${s.descripcion}`}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

    </>
  );
}
