export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { dbGetTiendas, dbGetAuditoriaSnapshot } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, History, ChevronRight, Home, Boxes, Calendar, User } from 'lucide-react';
import ReporteClient from '../../reporte/ReporteClient';

interface Props { params: Promise<{ id: string; snapId: string }> }

function NivelBadge({ nivel }: { nivel: 'BAJO' | 'MEDIO' | 'ALTO' }) {
  if (nivel === 'BAJO')  return <Badge variant="success">↑ Riesgo Bajo</Badge>;
  if (nivel === 'MEDIO') return <Badge variant="warning">~ Riesgo Medio</Badge>;
  return <Badge variant="danger">! Riesgo Alto</Badge>;
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default async function HistorialSnapPage({ params }: Props) {
  const { id, snapId } = await params;

  const [tiendas, snap] = await Promise.all([
    dbGetTiendas(),
    dbGetAuditoriaSnapshot(snapId),
  ]);

  const tienda = tiendas.find(t => t.id === id);
  if (!tienda || !snap || snap.tiendaId !== id) notFound();

  // El catálogo ya no existe para snaps históricos — usamos el total guardado
  // valorInventario: no disponible en el snapshot, pasamos 0
  return (
    <div className="max-w-4xl mx-auto page-enter">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] text-zinc-600 mb-4 print:hidden flex-wrap" aria-label="Breadcrumb">
        <Link href="/" className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
          <Home size={11} />Inicio
        </Link>
        <ChevronRight size={10} />
        <Link href={`/tienda/${id}`} className="hover:text-zinc-400 transition-colors truncate max-w-[100px]">
          {tienda.nombre}
        </Link>
        <ChevronRight size={10} />
        <Link href={`/tienda/${id}/historial`} className="hover:text-zinc-400 transition-colors">
          Historial
        </Link>
        <ChevronRight size={10} />
        <span className="text-zinc-400 font-medium">Detalle</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4 print:hidden flex-wrap">
        <Link
          href={`/tienda/${id}/historial`}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 hover:scale-105 transition-all"
          aria-label="Volver al historial"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
            style={{ backgroundColor: tienda.color, boxShadow: `0 4px 14px ${tienda.color}55` }}
          >
            <History size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-zinc-100">Auditoría histórica</h1>
              <NivelBadge nivel={snap.nivelRiesgo} />
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                <Boxes size={10} />{tienda.nombre}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                <Calendar size={10} />{formatFecha(snap.cerradoEn)}
              </span>
              {snap.cerradoPor && (
                <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                  <User size={10} />Cerrado por {snap.cerradoPor}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Banner histórico */}
      <div className="rounded-xl bg-violet-950/30 border border-violet-800/40 px-4 py-2.5 mb-5 flex items-center gap-2 text-xs text-violet-300 print:hidden">
        <History size={13} />
        <span>
          Snapshot guardado al cierre del inventario · {snap.totalRegistros} registros ·{' '}
          {snap.totalCatalogo} artículos en catálogo
        </span>
      </div>

      <ReporteClient
        tiendaNombre={tienda.nombre}
        tiendaColor={tienda.color}
        registros={snap.registros}
        sobrantes={snap.sobrantes}
        totalCatalogo={snap.totalCatalogo}
        valorInventario={0}
      />
    </div>
  );
}
