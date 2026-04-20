'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart2, Calendar, User, TrendingDown, TrendingUp,
  AlertTriangle, ChevronRight, Trash2, RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface Snap {
  id:             string;
  nivelRiesgo:    'BAJO' | 'MEDIO' | 'ALTO';
  cerradoEn:      string;
  cerradoPor?:    string | null;
  progreso:       number;
  faltantes:      number;
  sobrantesReg:   number;
  ceros:          number;
  valorFaltante:  number;
  valorSobrante:  number;
}

interface Props {
  snapshots: Snap[];
  tiendaId:  string;
  canEdit:   boolean;
}

function NivelBadge({ nivel }: { nivel: 'BAJO' | 'MEDIO' | 'ALTO' }) {
  if (nivel === 'BAJO')  return <Badge variant="success">↑ Bajo</Badge>;
  if (nivel === 'MEDIO') return <Badge variant="warning">~ Medio</Badge>;
  return <Badge variant="danger">! Alto</Badge>;
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatCOP(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

export default function HistorialClient({ snapshots: initial, tiendaId, canEdit }: Props) {
  const router  = useRouter();
  const [snaps, setSnaps]           = useState(initial);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function deleteOne(snapId: string) {
    setDeleting(snapId);
    setError(null);
    try {
      const res = await fetch(`/api/tienda/${tiendaId}/historial/${snapId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Error');
      setSnaps(prev => prev.filter(s => s.id !== snapId));
      setConfirmDel(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setDeleting(null);
    }
  }

  async function deleteAll() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tienda/${tiendaId}/historial`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Error');
      setSnaps([]);
      setConfirmAll(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Barra de acciones */}
      {canEdit && snaps.length > 0 && (
        <div className="flex justify-end mb-4">
          {confirmAll ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">¿Eliminar todo el historial?</span>
              <button
                onClick={() => setConfirmAll(false)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg border border-zinc-700/60 text-zinc-400 text-xs font-semibold hover:bg-zinc-800/40 disabled:opacity-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={deleteAll}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-red-950/50 border border-red-800/50 text-red-300 text-xs font-bold hover:bg-red-900/40 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {loading ? <RotateCcw size={11} className="animate-spin" /> : <Trash2 size={11} />}
                Sí, eliminar todo
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmAll(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-900/50 bg-red-950/20 text-red-500 hover:text-red-300 hover:bg-red-950/40 text-xs font-semibold transition-all"
            >
              <Trash2 size={11} />
              Eliminar todo el historial
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      {/* Empty state */}
      {snaps.length === 0 && (
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/60 p-12 text-center anim-fade-up">
          <p className="text-zinc-300 font-semibold text-lg mb-2">Sin auditorías registradas</p>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Cada vez que cierres un inventario, se guardará automáticamente un snapshot completo aquí.
          </p>
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {snaps.map((snap, i) => (
          <div key={snap.id} className="relative group">
            <Link
              href={`/tienda/${tiendaId}/historial/${snap.id}`}
              className="flex flex-col gap-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 anim-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {/* Fila superior */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-violet-950/60 border border-violet-800/40 flex items-center justify-center shrink-0">
                    <BarChart2 size={16} className="text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-zinc-100">Auditoría #{snaps.length - i}</span>
                      <NivelBadge nivel={snap.nivelRiesgo} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                        <Calendar size={10} />
                        {formatFecha(snap.cerradoEn)}
                      </span>
                      {snap.cerradoPor && (
                        <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                          <User size={10} />
                          {snap.cerradoPor}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-zinc-800/60">
                <div className="text-center">
                  <p className="text-base font-black text-zinc-100">{snap.progreso}%</p>
                  <p className="text-[10px] text-zinc-500">Progreso</p>
                </div>
                <div className="text-center">
                  <p className="text-base font-black text-red-400">{snap.faltantes}</p>
                  <p className="text-[10px] text-zinc-500 flex items-center justify-center gap-0.5">
                    <TrendingDown size={9} />Faltantes
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-base font-black text-emerald-400">{snap.sobrantesReg}</p>
                  <p className="text-[10px] text-zinc-500 flex items-center justify-center gap-0.5">
                    <TrendingUp size={9} />Sobrantes
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-base font-black text-amber-400">{snap.ceros}</p>
                  <p className="text-[10px] text-zinc-500 flex items-center justify-center gap-0.5">
                    <AlertTriangle size={9} />Ceros
                  </p>
                </div>
              </div>

              {/* Impacto económico */}
              {(snap.valorFaltante > 0 || snap.valorSobrante > 0) && (
                <div className="flex items-center gap-4 pt-2 border-t border-zinc-800/60 text-xs flex-wrap">
                  {snap.valorFaltante > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <TrendingDown size={11} />
                      Faltante: {formatCOP(snap.valorFaltante)}
                    </span>
                  )}
                  {snap.valorSobrante > 0 && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <TrendingUp size={11} />
                      Sobrante: {formatCOP(snap.valorSobrante)}
                    </span>
                  )}
                </div>
              )}
            </Link>

            {/* Botón eliminar individual */}
            {canEdit && (
              <div className="absolute top-3 right-10">
                {confirmDel === snap.id ? (
                  <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 shadow-lg">
                    <span className="text-[10px] text-zinc-400">¿Eliminar?</span>
                    <button
                      onClick={() => setConfirmDel(null)}
                      className="text-zinc-500 hover:text-zinc-300 text-[10px] font-semibold transition-colors"
                    >No</button>
                    <button
                      onClick={() => deleteOne(snap.id)}
                      disabled={deleting === snap.id}
                      className="text-red-400 hover:text-red-300 text-[10px] font-bold transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {deleting === snap.id ? <RotateCcw size={9} className="animate-spin" /> : null}
                      Sí
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={e => { e.preventDefault(); setConfirmDel(snap.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-all"
                    title="Eliminar esta auditoría"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
