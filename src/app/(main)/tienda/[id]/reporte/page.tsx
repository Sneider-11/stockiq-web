export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { dbGetTiendas, dbGetRegistros, dbGetCatalogo, dbGetSobrantes } from '@/lib/db';
import { ArrowLeft, FileText } from 'lucide-react';
import ReporteClient from './ReporteClient';

interface Props { params: Promise<{ id: string }> }

export default async function ReportePage({ params }: Props) {
  const { id } = await params;

  const [tiendas, registros, catalogo, sobrantes] = await Promise.all([
    dbGetTiendas(),
    dbGetRegistros(id),
    dbGetCatalogo(id),
    dbGetSobrantes(id),
  ]);

  const tienda = tiendas.find(t => t.id === id);
  if (!tienda) notFound();

  const valorInventario = catalogo.reduce((a, art) => a + art.stock * art.costo, 0);

  return (
    <div className="max-w-4xl mx-auto page-enter">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <Link
          href={`/tienda/${id}`}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 hover:scale-105 transition-all"
          aria-label="Volver a la tienda"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg"
            style={{ backgroundColor: tienda.color, boxShadow: `0 4px 12px ${tienda.color}44` }}
          >
            <FileText size={16} />
          </div>
          <div>
            <h1 className="text-lg font-black text-zinc-100">Reporte de auditoría</h1>
            <p className="text-xs text-zinc-500">{tienda.nombre} · {catalogo.length} artículos · {registros.length} registros</p>
          </div>
        </div>
      </div>

      <ReporteClient
        tiendaNombre={tienda.nombre}
        tiendaColor={tienda.color}
        tiendaNit={tienda.nit}
        registros={registros}
        sobrantes={sobrantes}
        totalCatalogo={catalogo.length}
        valorInventario={valorInventario}
      />
    </div>
  );
}
