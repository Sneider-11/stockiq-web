'use client';

import { useState } from 'react';
import { Search, X, Minus, Package } from 'lucide-react';
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

interface Props { rows: ResultRow[] }

export default function ResultadosClient({ rows }: Props) {
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState('');

  const filtered = rows.filter(r => {
    const matchSearch =
      r.descripcion.toLowerCase().includes(search.toLowerCase()) ||
      r.itemId.toLowerCase().includes(search.toLowerCase());
    const matchFiltro = !filtro || r.clsf === filtro;
    return matchSearch && matchFiltro;
  });

  return (
    <>
      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por artículo o código…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/50 focus:border-prp/50 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTROS.map(f => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
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

      <p className="text-xs text-zinc-500 mb-3">
        {filtered.length} de {rows.length} artículos
        {(search || filtro) && ' (filtrado)'}
      </p>

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
    </>
  );
}
