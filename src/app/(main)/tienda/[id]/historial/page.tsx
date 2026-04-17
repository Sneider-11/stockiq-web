export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { dbGetTiendas, dbGetAuditoriaSnapshots } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft, History, ChevronRight, Home, Boxes,
  TrendingDown, TrendingUp, BarChart2, Calendar,
  User, AlertTriangle,
} from 'lucide-react';

interface Props { params: Promise<{ id: string }> }

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

export default async function HistorialPage({ params }: Props) {
  const { id } = await params;
  const [tiendas, snapshots] = await Promise.all([
    dbGetTiendas(),
    dbGetAuditoriaSnapshots(id),
  ]);

  const tienda = tiendas.find(t => t.id === id);
  if (!tienda) notFound();

  return (
    <div className="max-w-4xl mx-auto page-enter">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] text-zinc-600 mb-4" aria-label="Breadcrumb">
        <Link href="/" className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
          <Home size={11} />
          Inicio
        </Link>
        <ChevronRight size={10} />
        <Link href={`/tienda/${id}`} className="hover:text-zinc-400 transition-colors truncate max-w-[120px]">
          {tienda.nombre}
        </Link>
        <ChevronRight size={10} />
        <span className="text-zinc-400 font-medium">Historial</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link
          href={`/tienda/${id}`}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 hover:bg-zinc-800 transition-all hover:scale-105"
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
          <div>
            <h1 className="text-xl font-black text-zinc-100 tracking-tight">Historial de auditorías</h1>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
              <Boxes size={11} />
              {tienda.nombre}
            </p>
          </div>
        </div>
        <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
          {snapshots.length} {snapshots.length === 1 ? 'auditoría' : 'auditorías'}
        </span>
      </div>

      {/* Empty state */}
      {snapshots.length === 0 && (
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/60 p-12 text-center anim-fade-up">
          <History size={40} className="text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-300 font-semibold text-lg mb-2">Sin auditorías registradas</p>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Cada vez que cierres un inventario, se guardará automáticamente un snapshot completo aquí.
          </p>
        </div>
      )}

      {/* Lista de snapshots */}
      <div className="space-y-3">
        {snapshots.map((snap, i) => (
          <Link
            key={snap.id}
            href={`/tienda/${id}/historial/${snap.id}`}
            className="group flex flex-col gap-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 anim-fade-up"
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
                    <span className="text-sm font-bold text-zinc-100">
                      Auditoría #{snapshots.length - i}
                    </span>
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
        ))}
      </div>
    </div>
  );
}
