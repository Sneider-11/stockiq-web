export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { dbGetTiendas, dbGetRegistros, dbGetCatalogo } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { formatCOP } from '@/lib/utils';
import { ArrowLeft, Package, TrendingDown, TrendingUp, AlertTriangle, ChevronRight, Home } from 'lucide-react';
import type { Registro, Articulo } from '@/types';
import ResultadosClient, { type ResultRow, type ClsfType } from './ResultadosClient';

interface Props { params: Promise<{ id: string }> }

export default async function ResultadosPage({ params }: Props) {
  const { id } = await params;
  const [tiendas, registros, catalogo, session] = await Promise.all([
    dbGetTiendas(),
    dbGetRegistros(id),
    dbGetCatalogo(id),
    getSession(),
  ]);
  const tienda = tiendas.find(t => t.id === id);
  if (!tienda) notFound();

  const canEdit = !!session && ['SUPERADMIN', 'ADMIN'].includes(session.rol) &&
    (session.rol === 'SUPERADMIN' || session.tiendas.includes(id));

  // registros viene ordenado desc por escaneado_en — tomamos el primero por itemId (el más reciente)
  const regMap = new Map<string, Registro>();
  for (const r of registros) {
    if (!regMap.has(r.itemId)) regMap.set(r.itemId, r);
  }

  const rows: ResultRow[] = catalogo.map((a: Articulo) => {
    const reg        = regMap.get(a.itemId);
    const contado    = reg ? reg.cantidad : null;
    const diferencia = contado !== null ? contado - a.stock : null;
    const valorDif   = diferencia !== null ? Math.abs(diferencia) * a.costo : 0;
    const clsf: ClsfType = reg ? (reg.clasificacion as ClsfType) : 'NO_CONTADO';
    return { itemId: a.itemId, descripcion: a.descripcion, ubicacion: a.ubicacion,
             stockSist: a.stock, contado, diferencia, costo: a.costo, valorDif, clsf,
             registroId: reg?.id, nota: reg?.nota };
  });

  rows.sort((a, b) => {
    const order: Record<ClsfType, number> = { FALTANTE: 0, CERO: 1, SOBRANTE: 2, SIN_DIF: 3, NO_CONTADO: 4 };
    return (order[a.clsf] ?? 5) - (order[b.clsf] ?? 5);
  });

  const totalValorFaltante = rows.filter(r => r.clsf === 'FALTANTE').reduce((a, r) => a + r.valorDif, 0);
  const totalValorSobrante = rows.filter(r => r.clsf === 'SOBRANTE').reduce((a, r) => a + r.valorDif, 0);
  const noContados         = rows.filter(r => r.clsf === 'NO_CONTADO').length;

  return (
    <div className="max-w-7xl mx-auto page-enter">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] text-zinc-600 mb-4" aria-label="Breadcrumb">
        <Link href="/" className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
          <Home size={11} />
          Inicio
        </Link>
        <ChevronRight size={10} />
        <Link href={`/tienda/${id}`} className="hover:text-zinc-400 transition-colors truncate max-w-[120px]">{tienda.nombre}</Link>
        <ChevronRight size={10} />
        <span className="text-zinc-400 font-medium">Resultados</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <Link href={`/tienda/${id}`} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 hover:scale-105 transition-all" aria-label="Volver a la tienda">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg"
            style={{ backgroundColor: tienda.color, boxShadow: `0 4px 12px ${tienda.color}44` }}
          >
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
            Importar catálogo →
          </Link>
        </div>
      ) : (
        <ResultadosClient rows={rows} tiendaNombre={tienda.nombre} tiendaId={id} canEdit={canEdit} />
      )}
    </div>
  );
}
