'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Minus, Package, Printer } from 'lucide-react';
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
}

const FILTROS = [
  { value: '',           label: 'Todos' },
  { value: 'FALTANTE',  label: 'Faltante' },
  { value: 'SOBRANTE',  label: 'Sobrante' },
  { value: 'SIN_DIF',   label: 'Sin dif.' },
  { value: 'CERO',      label: 'Cero' },
  { value: 'NO_CONTADO', label: 'Pendiente' },
];

interface Props { rows: ResultRow[]; tiendaNombre?: string }

export default function ResultadosClient({ rows, tiendaNombre }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(() => searchParams.get('q')   ?? '');
  const [filtro, setFiltro] = useState(() => searchParams.get('clf') ?? '');

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

  const handleSearch = (v: string) => { setSearch(v); syncUrl(v, filtro);  };
  const handleFiltro = (v: string) => { setFiltro(v); syncUrl(search, v); };

  const filtered = rows.filter(r => {
    const matchSearch =
      r.descripcion.toLowerCase().includes(search.toLowerCase()) ||
      r.itemId.toLowerCase().includes(search.toLowerCase());
    const matchFiltro = !filtro || r.clsf === filtro;
    return matchSearch && matchFiltro;
  });

  const faltantesImpresion = rows
    .filter(r => r.clsf === 'FALTANTE' || r.clsf === 'CERO')
    .sort((a, b) => b.valorDif - a.valorDif);

  const sobrantesImpresion = rows
    .filter(r => r.clsf === 'SOBRANTE')
    .sort((a, b) => b.valorDif - a.valorDif);

  const totalFaltante = faltantesImpresion.reduce((s, r) => s + r.valorDif, 0);
  const totalSobrante = sobrantesImpresion.reduce((s, r) => s + r.valorDif, 0);

  return (
    <>
      {/* ── Vista de impresión ── */}
      <div className="hidden print:block text-black text-[11px]" style={{ fontFamily: 'Arial, sans-serif' }}>

        {/* Encabezado */}
        <div style={{ borderBottom: '2px solid black', paddingBottom: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '0.5px' }}>HOJA DE RECONTEO</div>
              {tiendaNombre && <div style={{ fontSize: '12px', color: '#444', marginTop: '2px' }}>{tiendaNombre}</div>}
            </div>
            <div style={{ textAlign: 'right', fontSize: '10px', color: '#666' }}>
              <div>StockIQ · Grupo Orvion Tech</div>
              <div>{new Date().toLocaleDateString('es-CO', { dateStyle: 'full' })}</div>
              <div>{new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        </div>

        {/* Tabla reutilizable */}
        {([
          {
            titulo: `FALTANTES Y CEROS`,
            subtitulo: `${faltantesImpresion.length} artículos`,
            total: totalFaltante,
            totalLabel: 'TOTAL FALTANTE',
            rows: faltantesImpresion,
            difFn: (r: ResultRow) => r.diferencia !== null ? String(r.diferencia) : '—',
          },
          {
            titulo: `SOBRANTES`,
            subtitulo: `${sobrantesImpresion.length} artículos`,
            total: totalSobrante,
            totalLabel: 'TOTAL SOBRANTE',
            rows: sobrantesImpresion,
            difFn: (r: ResultRow) => r.diferencia !== null ? `+${r.diferencia}` : '—',
          },
        ] as const).filter(s => s.rows.length > 0).map(seccion => (
          <section key={seccion.titulo} style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
            {/* Título de sección */}
            <div style={{
              background: '#1a1a1a', color: 'white', padding: '4px 8px',
              fontWeight: 'bold', fontSize: '11px', letterSpacing: '0.8px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>{seccion.titulo} — {seccion.subtitulo}</span>
              <span style={{ fontSize: '10px', fontWeight: 'normal' }}>
                {seccion.totalLabel}: {formatCOP(seccion.total)}
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ background: '#f0f0f0', borderBottom: '1px solid #aaa' }}>
                  <th style={{ textAlign: 'left',   padding: '4px 6px', fontWeight: '600', width: '32%' }}>NOMBRE / DESCRIPCIÓN</th>
                  <th style={{ textAlign: 'left',   padding: '4px 6px', fontWeight: '600', width: '14%' }}>ID / CÓDIGO</th>
                  <th style={{ textAlign: 'left',   padding: '4px 6px', fontWeight: '600', width: '14%' }}>UBICACIÓN</th>
                  <th style={{ textAlign: 'center', padding: '4px 6px', fontWeight: '600', width: '10%' }}>CANTIDAD</th>
                  <th style={{ textAlign: 'center', padding: '4px 6px', fontWeight: '600', width: '10%' }}>CONTEO</th>
                  <th style={{ textAlign: 'center', padding: '4px 6px', fontWeight: '600', width: '10%' }}>DIF.</th>
                  <th style={{ textAlign: 'right',  padding: '4px 6px', fontWeight: '600', width: '10%' }}>VALOR</th>
                </tr>
              </thead>
              <tbody>
                {seccion.rows.map((r, i) => (
                  <tr key={r.itemId} style={{
                    background: i % 2 === 0 ? '#fff' : '#f8f8f8',
                    borderBottom: '1px solid #e0e0e0',
                  }}>
                    <td style={{ padding: '3px 6px', fontWeight: '500' }}>{r.descripcion}</td>
                    <td style={{ padding: '3px 6px', fontFamily: 'monospace', color: '#555', fontSize: '9px' }}>{r.itemId}</td>
                    <td style={{ padding: '3px 6px', color: '#444' }}>{r.ubicacion || '—'}</td>
                    <td style={{ padding: '3px 6px', textAlign: 'center' }}>{r.stockSist}</td>
                    <td style={{ padding: '3px 6px', textAlign: 'center', fontWeight: '600' }}>{r.contado ?? '—'}</td>
                    <td style={{ padding: '3px 6px', textAlign: 'center', fontWeight: '700' }}>{seccion.difFn(r)}</td>
                    <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: '600' }}>{formatCOP(r.valorDif)}</td>
                  </tr>
                ))}
                <tr style={{ background: '#e8e8e8', borderTop: '2px solid #333', fontWeight: 'bold' }}>
                  <td colSpan={6} style={{ padding: '4px 6px', textAlign: 'right' }}>{seccion.totalLabel}:</td>
                  <td style={{ padding: '4px 6px', textAlign: 'right' }}>{formatCOP(seccion.total)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        ))}

        {/* Pie de página */}
        <div style={{ borderTop: '1px solid #ccc', paddingTop: '6px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '9px' }}>
          <span>StockIQ — Grupo Orvion Tech · stockiq-web.vercel.app</span>
          <span>Impreso el {new Date().toLocaleString('es-CO')}</span>
        </div>
      </div>

      {/* ── Filtros (pantalla) ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 print:hidden">
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
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 text-xs font-semibold transition-all"
          title="Imprimir faltantes y sobrantes para reconteo"
        >
          <Printer size={13} />
          Imprimir reconteo
        </button>
      </div>

      {/* ── Tabla ── */}
      <div className="print:hidden">
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
