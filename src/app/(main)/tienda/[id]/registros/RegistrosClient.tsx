'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { Trash2, Loader2, Search, AlertTriangle, Package, X, Filter, Check, AlertCircle, MessageSquare, Camera, User, Clock } from 'lucide-react';
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
  const toast        = useToast();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [registros,     setRegistros]     = useState<Registro[]>(initialRegistros);
  const [deleting,      setDeleting]      = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [clearing,      setClearing]      = useState(false);
  const [confirmClear,  setConfirmClear]  = useState(false);
  const [detalle,       setDetalle]       = useState<Registro | null>(null);
  const [mounted,       setMounted]       = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Initialize filters from URL params (persisted across reloads/shares)
  const [search,     setSearch]     = useState(() => searchParams.get('q')   ?? '');
  const [filtroClsf, setFiltroClsf] = useState(() => searchParams.get('clf') ?? '');

  // Debounced URL sync — updates URL 400ms after last change
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncUrl = useCallback((q: string, clf: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      q   ? p.set('q',   q)   : p.delete('q');
      clf ? p.set('clf', clf) : p.delete('clf');
      router.replace(`?${p.toString()}`, { scroll: false });
    }, 400);
  }, [router, searchParams]);

  const handleSearch = (v: string) => { setSearch(v);     syncUrl(v, filtroClsf); };
  const handleFiltro = (v: string) => { setFiltroClsf(v); syncUrl(search, v);     };

  const closeConfirmClear = useCallback(() => setConfirmClear(false), []);
  useEscapeKey(closeConfirmClear, confirmClear);

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

  const detallePanel = detalle && mounted ? createPortal(
    <>
      {/* Backdrop — z-index inferior al panel */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.65)' }}
        onClick={() => setDetalle(null)}
      />
      {/* Panel lateral / bottom-sheet — z-index propio */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'none' }}
        className="sm:items-stretch sm:justify-end"
        role="dialog"
        aria-modal="true"
      >
      {/* Panel lateral / bottom-sheet */}
      <div style={{ pointerEvents: 'auto' }} className="w-full sm:w-[400px] sm:h-full bg-zinc-900 border-t sm:border-t-0 sm:border-l border-zinc-700/60 shadow-2xl flex flex-col max-h-[85vh] sm:max-h-full rounded-t-2xl sm:rounded-none">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-800/60 shrink-0">
          <div className="min-w-0 flex-1 pr-3">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">Detalle del registro</p>
            <p className="text-sm font-bold text-zinc-100 leading-snug">{detalle.descripcion}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">{detalle.itemId} · {detalle.ubicacion}</p>
          </div>
          <button onClick={() => setDetalle(null)} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Auditor + fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/40 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <User size={11} className="text-zinc-500" />
                <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold">Auditor</span>
              </div>
              <p className="text-sm font-semibold text-zinc-200">{detalle.usuarioNombre}</p>
            </div>
            <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/40 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock size={11} className="text-zinc-500" />
                <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold">Fecha y hora</span>
              </div>
              <p className="text-xs font-semibold text-zinc-200 leading-snug">
                {new Date(detalle.escaneadoEn).toLocaleString('es-CO', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
              </p>
            </div>
          </div>

          {/* Cantidades */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Sistema',    value: detalle.stockSistema, color: 'text-zinc-300' },
              { label: 'Contado',    value: detalle.cantidad,     color: 'text-zinc-100 font-black' },
              { label: 'Diferencia', value: (detalle.cantidad - detalle.stockSistema > 0 ? '+' : '') + (detalle.cantidad - detalle.stockSistema),
                color: detalle.cantidad === detalle.stockSistema ? 'text-zinc-400' : detalle.cantidad > detalle.stockSistema ? 'text-emerald-400' : 'text-red-400' },
            ].map(q => (
              <div key={q.label} className="rounded-xl bg-zinc-800/50 border border-zinc-700/40 p-3 text-center">
                <p className={`text-xl font-black ${q.color}`}>{q.value}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{q.label}</p>
              </div>
            ))}
          </div>

          {/* Nota */}
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={13} className={detalle.nota ? 'text-amber-400' : 'text-zinc-600'} />
              <span className="text-xs font-semibold text-zinc-400">Comentario del auditor</span>
            </div>
            {detalle.nota
              ? <p className="text-sm text-amber-300/90 italic leading-relaxed">"{detalle.nota}"</p>
              : <p className="text-xs text-zinc-600 italic">Sin comentario en este registro</p>}
          </div>

          {/* Foto */}
          <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera size={13} className={detalle.fotoUri ? 'text-sky-400' : 'text-zinc-600'} />
              <span className="text-xs font-semibold text-zinc-400">Fotografía del conteo</span>
            </div>
            {detalle.fotoUri
              ? <img src={detalle.fotoUri} alt="Foto del conteo" className="w-full rounded-xl object-cover max-h-60 border border-zinc-700/40" />
              : <p className="text-xs text-zinc-600 italic">Sin foto en este registro</p>}
          </div>
        </div>
      </div>
      </div>
    </>,
    document.body,
  ) : null;

  return (
    <>
      {detallePanel}
      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por artículo, código o auditor…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all input-field"
          />
          {search && (
            <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
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
                onClick={() => handleFiltro(opt.value)}
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
                  <tr key={r.id} onClick={() => setDetalle(r)} className="hover:bg-zinc-900/40 transition-colors group cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0">
                          <p className="text-zinc-200 font-medium truncate max-w-[200px]">{r.descripcion}</p>
                          <p className="text-[11px] text-zinc-500">{r.itemId}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {r.nota     && <MessageSquare size={11} className="text-amber-400" />}
                          {r.fotoUri  && <Camera        size={11} className="text-sky-400"   />}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden md:table-cell">{r.ubicacion}</td>
                    <td className="px-4 py-3 text-center text-zinc-300 font-mono">{r.stockSistema}</td>
                    <td className="px-4 py-3 text-center text-zinc-100 font-bold font-mono">{r.cantidad}</td>
                    <td className="px-4 py-3 text-center">{CLSF_BADGE[r.clasificacion]}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden lg:table-cell">{r.usuarioNombre}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden lg:table-cell">{formatDate(r.escaneadoEn)}</td>
                    {canDelete && (
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
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
