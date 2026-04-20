'use client';

import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Minus, Package, Printer, RefreshCw, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { formatCOP } from '@/lib/utils';

export type ClsfType = 'FALTANTE' | 'SOBRANTE' | 'SIN_DIF' | 'CERO' | 'NO_CONTADO';

export interface ResultRow {
  itemId:      string;
  descripcion: string;
  ubicacion:   string;
  stockSist:   number;
  contado:     number | null;
  diferencia:  number | null;
  costo:       number;
  valorDif:    number;
  clsf:        ClsfType;
  registroId?: string;
  nota?:       string;
}

const FILTROS = [
  { value: '',           label: 'Todos' },
  { value: 'FALTANTE',  label: 'Faltante' },
  { value: 'SOBRANTE',  label: 'Sobrante' },
  { value: 'SIN_DIF',   label: 'Sin dif.' },
  { value: 'CERO',      label: 'Cero' },
  { value: 'NO_CONTADO', label: 'Pendiente' },
];

interface Props {
  rows:          ResultRow[];
  tiendaNombre?: string;
  tiendaId?:     string;
  canEdit?:      boolean;
}

function buildPrintHTML(rows: ResultRow[], label: string, tiendaNombre: string | undefined, search: string): string {
  const fecha   = new Date().toLocaleDateString('es-CO', { dateStyle: 'full' });
  const hora    = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const filas   = rows
    .sort((a, b) => a.descripcion.localeCompare(b.descripcion))
    .map((r, i) => {
      const dif = r.diferencia === null ? '—' : r.diferencia > 0 ? `+${r.diferencia}` : String(r.diferencia);
      const bg  = i % 2 === 0 ? '#ffffff' : '#f5f5f5';
      return `
        <tr style="background:${bg};border-bottom:1px solid #ddd">
          <td style="padding:4px 6px;font-weight:500">${r.descripcion}</td>
          <td style="padding:4px 6px;font-family:monospace;color:#555;font-size:9px">${r.itemId}</td>
          <td style="padding:4px 6px;color:#444">${r.ubicacion || '—'}</td>
          <td style="padding:4px 6px;text-align:center">${r.stockSist}</td>
          <td style="padding:4px 6px;text-align:center;font-weight:600">${r.contado ?? '—'}</td>
          <td style="padding:4px 6px;text-align:center;font-weight:700">${dif}</td>
        </tr>`;
    }).join('');

  const searchInfo = search ? ` · búsqueda: "${search}"` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Hoja de Reconteo — ${label}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; padding: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    thead tr { background: #1a1a1a; color: #fff; }
    th { padding: 5px 6px; font-weight: 600; text-align: left; }
    th:nth-child(4), th:nth-child(5), th:nth-child(6) { text-align: center; }
    @media print {
      body { padding: 0; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  <div style="border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:flex-end">
    <div>
      <div style="font-size:15px;font-weight:bold">HOJA DE RECONTEO — ${label.toUpperCase()}</div>
      ${tiendaNombre ? `<div style="font-size:11px;color:#444;margin-top:2px">${tiendaNombre}</div>` : ''}
      <div style="font-size:10px;color:#666;margin-top:2px">${rows.length} artículo${rows.length !== 1 ? 's' : ''}${searchInfo}</div>
    </div>
    <div style="text-align:right;font-size:10px;color:#666">
      <div>StockIQ · Grupo Orvion Tech</div>
      <div>${fecha}</div>
      <div>${hora}</div>
    </div>
  </div>

  ${rows.length === 0
    ? '<p style="text-align:center;color:#888;padding:20px">Sin artículos para imprimir con el filtro actual.</p>'
    : `<table>
      <thead>
        <tr>
          <th style="width:35%">NOMBRE / DESCRIPCIÓN</th>
          <th style="width:15%">ID / CÓDIGO</th>
          <th style="width:15%">UBICACIÓN</th>
          <th style="width:11%;text-align:center">CANTIDAD</th>
          <th style="width:11%;text-align:center">CONTEO</th>
          <th style="width:13%;text-align:center">DIFERENCIA</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>`
  }

  <div style="border-top:1px solid #ccc;margin-top:14px;padding-top:5px;display:flex;justify-content:space-between;color:#999;font-size:9px">
    <span>StockIQ — Grupo Orvion Tech</span>
    <span>Impreso el ${new Date().toLocaleString('es-CO')}</span>
  </div>
</body>
</html>`;
}

export default function ResultadosClient({ rows, tiendaNombre, tiendaId, canEdit }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [search,     setSearch]     = useState(() => searchParams.get('q')   ?? '');
  const [filtro,     setFiltro]     = useState(() => searchParams.get('clf') ?? '');
  const [lastSync,   setLastSync]   = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // ── Estado del modal de edición ──────────────────────────────────────────────
  const [editingRow,   setEditingRow]   = useState<ResultRow | null>(null);
  const [editCantidad, setEditCantidad] = useState('');
  const [editNota,     setEditNota]     = useState('');
  const [saving,       setSaving]       = useState(false);
  const [editError,    setEditError]    = useState('');

  // Bloquear scroll del contenedor principal mientras el modal está abierto
  useLayoutEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    if (editingRow) {
      main.style.overflow = 'hidden';
    } else {
      main.style.overflow = '';
    }
    return () => { main.style.overflow = ''; };
  }, [editingRow]);

  const abrirEdit = useCallback((r: ResultRow) => {
    setEditingRow(r);
    setEditCantidad(r.contado !== null ? String(r.contado) : '');
    setEditNota(r.nota ?? '');
    setEditError('');
  }, []);

  const cerrarEdit = useCallback(() => {
    if (saving) return;
    setEditingRow(null);
    setEditError('');
  }, [saving]);

  const handleGuardar = useCallback(async () => {
    if (!editingRow || !tiendaId) return;
    const cant = parseInt(editCantidad, 10);
    if (isNaN(cant) || cant < 0) { setEditError('Ingresa una cantidad válida (0 o más).'); return; }
    setSaving(true);
    setEditError('');
    try {
      let res: Response;
      if (editingRow.registroId) {
        // Artículo ya escaneado — actualizar
        res = await fetch(`/api/tienda/${tiendaId}/registros/${editingRow.registroId}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ cantidad: cant, nota: editNota.trim(), stockSistema: editingRow.stockSist }),
        });
      } else {
        // Artículo sin conteo — crear nuevo registro
        res = await fetch(`/api/tienda/${tiendaId}/registros`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ itemId: editingRow.itemId, cantidad: cant, nota: editNota.trim() }),
        });
      }
      if (!res.ok) {
        const d = await res.json();
        setEditError(d.error ?? 'Error al guardar.');
        return;
      }
      setEditingRow(null);
      router.refresh();
    } catch {
      setEditError('Error de red. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }, [editingRow, editCantidad, editNota, tiendaId, router]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    router.refresh();
    setLastSync(new Date());
    setTimeout(() => setRefreshing(false), 1000);
  }, [router]);

  // Auto-refresh cada 30 s mientras la página está abierta
  useEffect(() => {
    const id = setInterval(() => { router.refresh(); setLastSync(new Date()); }, 30_000);
    return () => clearInterval(id);
  }, [router]);
  const syncUrl = useCallback((q: string, clf: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      q   ? p.set('q',   q)   : p.delete('q');
      clf ? p.set('clf', clf) : p.delete('clf');
      router.replace(`?${p.toString()}`, { scroll: false });
    }, 400);
  }, [router, searchParams]);

  const handleSearch = (v: string) => { setSearch(v); syncUrl(v, filtro);  };
  const handleFiltro = (v: string) => { setFiltro(v); syncUrl(search, v); };

  const filtered = rows.filter(r => {
    const matchSearch =
      r.descripcion.toLowerCase().includes(search.toLowerCase()) ||
      r.itemId.toLowerCase().includes(search.toLowerCase());
    const matchFiltro = !filtro || r.clsf === filtro;
    return matchSearch && matchFiltro;
  });

  const handlePrint = useCallback(() => {
    const label = FILTROS.find(f => f.value === filtro)?.label ?? 'Todos';
    const html  = buildPrintHTML(filtered, label, tiendaNombre, search);
    const win   = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    // Pequeño delay para asegurar que el HTML cargó antes de imprimir
    setTimeout(() => { win.print(); win.close(); }, 400);
  }, [filtered, filtro, tiendaNombre, search]);

  return (
    <>
      {/* ── Modal de edición ── */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={cerrarEdit} />
          <div className="relative w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6">
            <h2 className="text-base font-black text-zinc-100 mb-1">Editar conteo</h2>
            <p className="text-xs text-zinc-500 mb-5 truncate">{editingRow.descripcion}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Cantidad contada <span className="text-zinc-600">(Sistema: {editingRow.stockSist})</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={editCantidad}
                  onChange={e => { setEditCantidad(e.target.value); setEditError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleGuardar()}
                  ref={el => { if (el) el.focus({ preventScroll: true }); }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Nota (opcional)</label>
                <textarea
                  rows={2}
                  value={editNota}
                  onChange={e => setEditNota(e.target.value)}
                  placeholder="Observación sobre esta diferencia…"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all resize-none"
                />
              </div>
            </div>

            {editError && (
              <p className="mt-3 text-xs text-red-400 font-semibold">{editError}</p>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={cerrarEdit}
                disabled={saving}
                className="flex-1 h-10 rounded-xl border border-zinc-700 text-zinc-400 text-sm font-semibold hover:text-zinc-200 hover:border-zinc-600 transition-all disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={saving}
                className="flex-1 h-10 rounded-xl bg-prp/20 border border-prp/40 text-vlt text-sm font-bold hover:bg-prp/30 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving ? <RefreshCw size={13} className="animate-spin" /> : null}
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por artículo o código…"
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
        <div className="flex gap-1 flex-wrap">
          {FILTROS.map(f => (
            <button
              key={f.value}
              onClick={() => handleFiltro(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                filtro === f.value
                  ? 'bg-prp/20 text-vlt border border-prp/40'
                  : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500">
          {filtered.length} de {rows.length} artículos
          {(search || filtro) && ' (filtrado)'}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600 hidden sm:block">
            {lastSync.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Actualizar resultados desde la nube"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 text-xs font-semibold transition-all disabled:opacity-40"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 text-xs font-semibold transition-all"
            title="Imprimir listado actual para reconteo"
          >
            <Printer size={13} />
            Imprimir reconteo
          </button>
        </div>
      </div>

      {/* ── Tabla ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
          <Package size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Sin resultados para este filtro</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/80">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Artículo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Ubic.</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Sist.</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Contado</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Dif.</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Costo</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Estado</th>
                  {canEdit && <th className="px-2 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {filtered.map(r => (
                  <tr key={r.itemId} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-zinc-200 font-medium truncate max-w-[200px]">{r.descripcion}</p>
                      <p className="text-[11px] text-zinc-500">{r.itemId}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">{r.ubicacion}</td>
                    <td className="px-4 py-3 text-center text-zinc-400 font-mono">{r.stockSist}</td>
                    <td className="px-4 py-3 text-center font-mono">
                      {r.contado !== null
                        ? <span className="text-zinc-100 font-bold">{r.contado}</span>
                        : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold">
                      {r.diferencia === null ? <span className="text-zinc-600">—</span>
                        : r.diferencia > 0 ? <span className="text-emerald-400">+{r.diferencia}</span>
                        : r.diferencia < 0 ? <span className="text-red-400">{r.diferencia}</span>
                        : <span className="text-zinc-500 flex justify-center"><Minus size={14} /></span>}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-500 text-xs hidden lg:table-cell">{formatCOP(r.costo)}</td>
                    <td className="px-4 py-3 text-center">
                      {r.clsf === 'FALTANTE'   && <Badge variant="danger">Faltante</Badge>}
                      {r.clsf === 'SOBRANTE'   && <Badge variant="success">Sobrante</Badge>}
                      {r.clsf === 'SIN_DIF'    && <Badge variant="purple">Sin dif.</Badge>}
                      {r.clsf === 'CERO'       && <Badge variant="warning">Cero</Badge>}
                      {r.clsf === 'NO_CONTADO' && <Badge>Pendiente</Badge>}
                    </td>
                    {canEdit && (
                      <td className="px-2 py-3 text-center">
                        <button
                          onClick={() => abrirEdit(r)}
                          title={r.registroId ? 'Editar conteo' : 'Ingresar conteo'}
                          className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                        >
                          <Pencil size={13} />
                        </button>
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
