'use client';

import { useState } from 'react';
import { Trash2, Loader2, CheckCircle, Package } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatCOP } from '@/lib/utils';
import type { SobranteSinStock } from '@/types';

interface Props {
  initialSobrantes: SobranteSinStock[];
  tiendaId: string;
  canManage: boolean; // SUPERADMIN o ADMIN
}

export default function SobrantesClient({ initialSobrantes, tiendaId, canManage }: Props) {
  const [sobrantes, setSobrantes] = useState<SobranteSinStock[]>(initialSobrantes);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState<string | null>(null);

  const handleConfirmar = async (s: SobranteSinStock) => {
    if (!canManage || s.estado === 'CONFIRMADO') return;
    setConfirming(s.id);
    const res = await fetch(`/api/tienda/${tiendaId}/sobrantes/${s.id}`, { method: 'PATCH' });
    if (res.ok) {
      setSobrantes(prev => prev.map(x => x.id === s.id ? { ...x, estado: 'CONFIRMADO' } : x));
    }
    setConfirming(null);
  };

  const handleDelete = async (s: SobranteSinStock) => {
    if (!canManage) return;
    if (!confirm(`¿Eliminar el sobrante "${s.descripcion}"?`)) return;
    setDeleting(s.id);
    const res = await fetch(`/api/tienda/${tiendaId}/sobrantes/${s.id}`, { method: 'DELETE' });
    if (res.ok) setSobrantes(prev => prev.filter(x => x.id !== s.id));
    setDeleting(null);
  };

  const pendientes   = sobrantes.filter(s => s.estado === 'PENDIENTE').length;
  const confirmados  = sobrantes.filter(s => s.estado === 'CONFIRMADO').length;

  return (
    <>
      {/* ── Resumen ── */}
      {sobrantes.length > 0 && (
        <div className="flex gap-3 mb-5">
          <div className="flex items-center gap-2 bg-amber-950/30 border border-amber-900/40 rounded-xl px-4 py-2.5">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs text-amber-400 font-semibold">{pendientes} pendiente{pendientes !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-900/40 rounded-xl px-4 py-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-emerald-400 font-semibold">{confirmados} confirmado{confirmados !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* ── Tabla ── */}
      {sobrantes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
          <Package size={48} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">No hay sobrantes sin stock</p>
        </div>
      ) : (
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
                      <p className="text-[11px] text-zinc-600">{s.codigo} · {s.ubicacion}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-100 font-bold font-mono">{s.cantidad}</td>
                    <td className="px-4 py-3 text-center text-zinc-300 text-xs">{formatCOP(s.precio)}</td>
                    <td className="px-4 py-3 text-center">
                      {s.estado === 'CONFIRMADO'
                        ? <Badge variant="success">Confirmado</Badge>
                        : <Badge variant="warning">Pendiente</Badge>}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden lg:table-cell">{s.usuarioNombre}</td>
                    <td className="px-4 py-3 text-zinc-600 text-xs hidden lg:table-cell">{formatDate(s.registradoEn)}</td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Confirmar — solo si pendiente */}
                          {s.estado === 'PENDIENTE' && (
                            <button
                              onClick={() => handleConfirmar(s)}
                              disabled={confirming === s.id}
                              title="Confirmar sobrante"
                              className="p-1.5 rounded-lg text-zinc-600 hover:text-emerald-400 hover:bg-emerald-950/30 transition-all disabled:opacity-50"
                            >
                              {confirming === s.id
                                ? <Loader2 size={14} className="animate-spin" />
                                : <CheckCircle size={14} />}
                            </button>
                          )}
                          {/* Eliminar */}
                          <button
                            onClick={() => handleDelete(s)}
                            disabled={deleting === s.id}
                            title="Eliminar"
                            className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-950/30 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          >
                            {deleting === s.id
                              ? <Loader2 size={14} className="animate-spin" />
                              : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
