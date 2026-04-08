import { notFound } from 'next/navigation';
import Link from 'next/link';
import { dbGetTiendas, dbGetRegistros, dbGetCatalogo } from '@/lib/db';
import { formatCOP } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Package, TrendingDown, TrendingUp, Minus, AlertTriangle } from 'lucide-react';
import type { Registro, Articulo } from '@/types';

interface Props { params: Promise<{ id: string }> }

interface ResultRow {
  itemId:      string;
  descripcion: string;
  ubicacion:   string;
  stockSist:   number;
  contado:     number | null;
  diferencia:  number | null;
  costo:       number;
  valorDif:    number;
  clsf:        Registro['clasificacion'] | 'NO_CONTADO';
}

export default async function ResultadosPage({ params }: Props) {
  const { id } = await params;
  const [tiendas, registros, catalogo] = await Promise.all([
    dbGetTiendas(),
    dbGetRegistros(id),
    dbGetCatalogo(id),
  ]);
  const tienda = tiendas.find(t => t.id === id);
  if (!tienda) notFound();

  const regMap = new Map<string, Registro>(registros.map(r => [r.itemId, r]));

  const rows: ResultRow[] = catalogo.map((a: Articulo) => {
    const reg = regMap.get(a.itemId);
    const contado   = reg ? reg.cantidad : null;
    const diferencia = contado !== null ? contado - a.stock : null;
    const valorDif  = diferencia !== null ? Math.abs(diferencia) * a.costo : 0;
    return {
      itemId:      a.itemId,
      descripcion: a.descripcion,
      ubicacion:   a.ubicacion,
      stockSist:   a.stock,
      contado,
      diferencia,
      costo:       a.costo,
      valorDif,
      clsf:        reg ? reg.clasificacion : 'NO_CONTADO',
    };
  });

  rows.sort((a, b) => {
    const order = { FALTANTE: 0, CERO: 1, SOBRANTE: 2, SIN_DIF: 3, NO_CONTADO: 4 };
    return (order[a.clsf] ?? 5) - (order[b.clsf] ?? 5);
  });

  const totalValorFaltante = rows.filter(r => r.clsf === 'FALTANTE').reduce((a, r) => a + r.valorDif, 0);
  const totalValorSobrante = rows.filter(r => r.clsf === 'SOBRANTE').reduce((a, r) => a + r.valorDif, 0);
  const noContados         = rows.filter(r => r.clsf === 'NO_CONTADO').length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/tienda/${id}`} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: tienda.color }}>
            <Package size={16} />
          </div>
          <div>
            <h1 className="text-lg font-black text-zinc-100">Resultados</h1>
            <p className="text-xs text-zinc-500">{tienda.nombre} · {catalogo.length} artículos</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-red-950/30 border border-red-900/40 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={14} className="text-red-400" />
            <span className="text-xs text-zinc-500">Valor faltante</span>
          </div>
          <p className="text-lg font-black text-red-400">{formatCOP(totalValorFaltante)}</p>
        </div>
        <div className="rounded-xl bg-emerald-950/30 border border-emerald-900/40 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-xs text-zinc-500">Valor sobrante</span>
          </div>
          <p className="text-lg font-black text-emerald-400">{formatCOP(totalValorSobrante)}</p>
        </div>
        <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/40 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-xs text-zinc-500">Sin contar</span>
          </div>
          <p className="text-lg font-black text-amber-400">{noContados}</p>
        </div>
      </div>

      {catalogo.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
          <Package size={48} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">No hay catálogo cargado</p>
          <Link href={`/tienda/${id}/importar`} className="text-xs text-vlt hover:text-prp mt-2 transition-colors">
            Importar catálogo TNS →
          </Link>
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
                {rows.map(r => (
                  <tr key={r.itemId} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-zinc-200 font-medium truncate max-w-[200px]">{r.descripcion}</p>
                      <p className="text-[11px] text-zinc-600">{r.itemId}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden md:table-cell">{r.ubicacion}</td>
                    <td className="px-4 py-3 text-center text-zinc-400 font-mono">{r.stockSist}</td>
                    <td className="px-4 py-3 text-center font-mono">
                      {r.contado !== null
                        ? <span className="text-zinc-100 font-bold">{r.contado}</span>
                        : <span className="text-zinc-700">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold">
                      {r.diferencia === null ? <span className="text-zinc-700">—</span>
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
  );
}
