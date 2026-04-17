'use client';

import { useState } from 'react';
import { Trash2, Loader2, Search, AlertTriangle, Package, X, Filter, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { Registro } from '@/types';
import { useToast } from '@/context/ToastContext';

const CLSF_BADGE: Record<Registro['clasificacion'], React.ReactNode> = {
  SIN_DIF:  <Badge variant="purple">Sin dif.</Badge>,
  FALTANTE: <Badge variant="danger">Faltante</Badge>,
  SOBRANTE: <Badge variant="success">Sobrante</Badge>,
  CERO:     <Badge variant="warning">Cero</Badge>,
};

const CLSF_OPTIONS = [
  { value: '',         label: 'Todos' },
  { value: 'FALTANTE', label: 'Faltante' },
  { value: 'SOBRANTE', label: 'Sobrante' },
  { value: 'SIN_DIF',  label: 'Sin dif.' },
  { value: 'CERO',     label: 'Cero' },
];

interface Props {
  initialRegistros: Registro[];
  tiendaId: string;
  canDelete: boolean;
  canClear: boolean;
  total: number; // total en BD (incluye otras páginas)
}

export default function RegistrosClient({ initialRegistros, tiendaId, canDelete, canClear, total }: Props) {
  const toast = useToast();
  const [registros,      setRegistros]      = useState<Registro[]>(initialRegistros);
  const [deleting,       setDeleting]       = useState<string | null>(null);
  const [confirmDelete,  setConfirmDelete]  = useState<string | null>(null);
  const [clearing,       setClearing]       = useState(false);
  const [confirmClear,   setConfirmClear]   = useState(false);
  const [search,         setSearch]         = useState('');
  const [filtroClsf,     setFiltroClsf]     = useState('');

  const filtered = registros.filter(r => {
    const matchSearch =
      r.descripcion.toLowerCase().includes(search.toLowerCase()) ||
      r.itemId.toLowerCase().includes(search.toLowerCase()) ||
      r.usuarioNombre.toLowerCase().includes(search.toLowerCase());
    const matchClsf = !filtroClsf || r.clasificacion === filtroClsf;
    return matchSearch && matchClsf;
  });

  const handleDelete = async (r: Registro) => {
    if (!canDelete) return;
    setDeleting(r.id);
    const res = await fetch(`/api/tienda/${tiendaId}/registros/${r.id}`, { method: 'DELETE' });
    if (res.ok) {
      setRegistros(prev => prev.filter(x => x.id !== r.id));
      toast.success('Registro eliminado.');
    } else {
      toast.error('No se pudo eliminar el registro.');
    }
    setDeleting(null);
    setConfirmDelete(null);
  };

  const handleClearAll = async () => {
    if (!canClear) return;
    setClearing(true);
    const res = await fetch(`/api/tienda/${tiendaId}/registros`, { method: 'DELETE' });
    if (res.ok) {
      setRegistros([]);
      toast.success('Todos los registros eliminados.');
    } else {
      toast.error('No se pudo limpiar los registros.');
    }
    setClearing(false);
    setConfirmClear(false);
  };

  return (
    <>
      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por artículo, código o auditor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all input-field"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtro clasificación */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-zinc-500 shrink-0" />
          <div className="flex gap-1 flex-wrap">
            {CLSF_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFiltroClsf(opt.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  filtroClsf === opt.value
                    ? 'bg-prp/20 text-vlt border border-prp/40'
                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Limpiar todo */}
        {canClear && registros.length > 0 && (
          <button
            onClick={() => setConfirmClear(prev => !prev)}
            disabled={clearing}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shrink-0',
              confirmClear
                ? 'bg-red-950/60 border border-red-800/60 text-red-300'
                : 'bg-red-950/40 border border-red-900/50 text-red-400 hover:bg-red-950/60',
            )}
          >
            {clearing ? <Loader2 size={13} className="animate-spin" /> : <AlertTriangle size={13} />}
            Limpiar todo
          </button>
        )}
      </div>

      {/* ── Confirm limpiar todo ── */}
      {confirmClear && (
        <div className="flex items-center gap-2 mb-4 bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-3 anim-fade-up">
          <AlertCircle size={14} className="text-red-400 shrink-0" aria-hidden="true" />
          <p className="text-xs text-red-300 flex-1">¿Eliminar <strong>todos los {registros.length} registros</strong> de esta tienda? Esta acción no se puede deshacer.</p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setConfirmClear(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleClearAll}
              disabled={clearing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-semibold hover:bg-red-500/30 transition-all disabled:opacity-50"
            >
              {clearing
                ? <Loader2 size={11} className="animate-spin" />
                : <Check size={11} aria-hidden="true" />}
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* ── Contador ── */}
      <p className="text-xs text-zinc-500 mb-3">
        {(search || filtroClsf)
          ? `${filtered.length} de ${registros.length} en esta página (${total} total)`
          : `${registros.length} en esta página · ${total} total`}
      </p>

      {/* ── Tabla ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
          <Package size={40} className="mb-3 opacity-30" />
          <p className="text-sm">{registros.length === 0 ? 'No hay registros aún' : 'Sin resultados para este filtro'}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/80">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Artículo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Ubicación</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Sist.</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Contado</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Auditor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Fecha</th>
                  {canDelete && <th className="px-4 py-3 w-12" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-zinc-900/40 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-zinc-200 font-medium truncate max-w-[200px]">{r.descripcion}</p>
                      <p className="text-[11px] text-zinc-500">{r.itemId}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden md:table-cell">{r.ubicacion}</td>
                    <td className="px-4 py-3 text-center text-zinc-300 font-mono">{r.stockSistema}</td>
                    <td className="px-4 py-3 text-center text-zinc-100 font-bold font-mono">{r.cantidad}</td>
                    <td className="px-4 py-3 text-center">{CLSF_BADGE[r.clasificacion]}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden lg:table-cell">{r.usuarioNombre}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden lg:table-cell">{formatDate(r.escaneadoEn)}</td>
                    {canDelete && (
                      <td className="px-4 py-3">
                        {confirmDelete === r.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-2 py-1 rounded-lg text-[10px] font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-all"
                            >
                              No
                            </button>
                            <button
                              onClick={() => handleDelete(r)}
                              disabled={deleting === r.id}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-semibold hover:bg-red-500/30 transition-all disabled:opacity-50"
                            >
                              {deleting === r.id
                                ? <Loader2 size={10} className="animate-spin" />
                                : <Check size={10} aria-hidden="true" />}
                              Sí
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(r.id)}
                            disabled={deleting === r.id}
                            aria-label={`Eliminar registro de ${r.descripcion}`}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
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
