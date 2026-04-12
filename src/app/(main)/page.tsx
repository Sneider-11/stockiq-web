export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { dbGetTiendasConStats } from '@/lib/db';
import { formatCOP } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import {
  TrendingDown, TrendingUp, Boxes, CheckCircle,
  ChevronRight, AlertCircle, Activity, BarChart3,
  ScanLine, Hash, Zap,
} from 'lucide-react';
import type { TiendaStats } from '@/types';

function ProgresoBar({ value }: { value: number }) {
  const color =
    value >= 80 ? '#10B981' :
    value >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

function TiendaCard({ stats }: { stats: TiendaStats }) {
  const { tienda, progreso, totalRegistros, totalCatalogo,
          valorFaltante, valorSobrante, faltantes, sobrantes, sinDiferencia, ceros } = stats;

  const isClosed = tienda.modoInventario === 'OFFLINE';
  const progresoColor =
    progreso >= 80 ? 'text-emerald-400' :
    progreso >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <Link
      href={`/tienda/${tienda.id}`}
      className="group block rounded-2xl border border-zinc-800/70 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200 overflow-hidden hover:shadow-lg hover:shadow-black/20"
    >
      {/* Accent bar */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${tienda.color}, ${tienda.color}44)` }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform duration-200"
              style={{ backgroundColor: tienda.color, boxShadow: `0 4px 12px ${tienda.color}44` }}
            >
              <Boxes size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors leading-tight">
                {tienda.nombre}
              </h3>
              {tienda.nit
                ? <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5"><Hash size={10}/>{tienda.nit}</p>
                : <p className="text-[11px] text-zinc-600 mt-0.5">{totalCatalogo} artículos</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isClosed
              ? <Badge variant="danger">Cerrado</Badge>
              : <Badge variant="success">Activo</Badge>}
            <ChevronRight size={15} className="text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Progreso */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-zinc-500">Progreso de conteo</span>
            <span className={`text-sm font-black ${progresoColor}`}>{progreso}%</span>
          </div>
          <ProgresoBar value={progreso} />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-zinc-600">{totalRegistros} escaneados</span>
            <span className="text-[10px] text-zinc-600">{totalCatalogo} total</span>
          </div>
        </div>

        {/* Stats 2x2 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-zinc-800/40 border border-zinc-800/60 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={11} className="text-red-400" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Faltantes</span>
            </div>
            <p className="text-sm font-black text-zinc-100">{faltantes}</p>
            <p className="text-[10px] text-red-400 mt-0.5 truncate">{formatCOP(valorFaltante)}</p>
          </div>
          <div className="rounded-lg bg-zinc-800/40 border border-zinc-800/60 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={11} className="text-emerald-400" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Sobrantes</span>
            </div>
            <p className="text-sm font-black text-zinc-100">{sobrantes}</p>
            <p className="text-[10px] text-emerald-400 mt-0.5 truncate">{formatCOP(valorSobrante)}</p>
          </div>
          <div className="rounded-lg bg-zinc-800/40 border border-zinc-800/60 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle size={11} className="text-vlt" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Sin dif.</span>
            </div>
            <p className="text-sm font-black text-zinc-100">{sinDiferencia}</p>
          </div>
          <div className="rounded-lg bg-zinc-800/40 border border-zinc-800/60 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle size={11} className="text-amber-400" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Ceros</span>
            </div>
            <p className="text-sm font-black text-zinc-100">{ceros}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function GlobalSummary({ stats }: { stats: TiendaStats[] }) {
  const totalFaltante   = stats.reduce((a, s) => a + s.valorFaltante, 0);
  const totalSobrante   = stats.reduce((a, s) => a + s.valorSobrante, 0);
  const totalRegistros  = stats.reduce((a, s) => a + s.totalRegistros, 0);
  const totalCatalogo   = stats.reduce((a, s) => a + s.totalCatalogo,  0);
  const promedioProgreso = stats.length
    ? Math.round(stats.reduce((a, s) => a + s.progreso, 0) / stats.length)
    : 0;

  const items = [
    { label: 'Artículos escaneados', value: totalRegistros.toString(), sub: `de ${totalCatalogo} en catálogo`, icon: <ScanLine size={18} />, color: 'text-vlt' },
    { label: 'Progreso promedio',    value: `${promedioProgreso}%`,   sub: 'todas las tiendas',               icon: <Activity size={18} />, color: 'text-emerald-400' },
    { label: 'Valor en faltantes',   value: formatCOP(totalFaltante), sub: 'acumulado',                       icon: <TrendingDown size={18} />, color: 'text-red-400' },
    { label: 'Valor en sobrantes',   value: formatCOP(totalSobrante), sub: 'acumulado',                       icon: <TrendingUp size={18} />,   color: 'text-emerald-400' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl bg-zinc-900/60 border border-zinc-800/60 p-4 hover:border-zinc-700 transition-colors">
          <div className={`${item.color} mb-3`}>{item.icon}</div>
          <p className="text-xl font-black text-zinc-100 tracking-tight truncate">{item.value}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{item.label}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const user     = await getSession();
  const allStats = await dbGetTiendasConStats();

  const stats = user?.rol === 'SUPERADMIN'
    ? allStats
    : allStats.filter(s => user?.tiendas.includes(s.tienda.id));

  const tiendasCerradas = stats.filter(s => s.tienda.modoInventario === 'OFFLINE').length;
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="max-w-7xl mx-auto page-enter">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-vlt" />
            <span className="text-xs text-zinc-500">{saludo}</span>
          </div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            {user?.nombre.split(' ')[0]}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {stats.length} tienda{stats.length !== 1 ? 's' : ''} asignada{stats.length !== 1 ? 's' : ''} · Panel de auditoría
          </p>
        </div>
        <div className="flex items-center gap-3">
          {tiendasCerradas > 0 && (
            <div className="flex items-center gap-2 bg-amber-950/50 border border-amber-900/60 rounded-xl px-3 py-2">
              <AlertCircle size={13} className="text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">
                {tiendasCerradas} tienda{tiendasCerradas > 1 ? 's' : ''} cerrada{tiendasCerradas > 1 ? 's' : ''}
              </span>
            </div>
          )}
          {(user?.rol === 'SUPERADMIN' || user?.rol === 'ADMIN') && (
            <Link
              href="/consolidado"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-prp/15 border border-prp/30 text-vlt text-sm font-semibold hover:bg-prp/25 transition-all"
            >
              <BarChart3 size={15} />
              Consolidado
            </Link>
          )}
        </div>
      </div>

      {/* Global summary */}
      {stats.length > 0 && <GlobalSummary stats={stats} />}

      {/* Tiendas grid */}
      {stats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
          <Boxes size={48} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">No tienes tiendas asignadas</p>
          <p className="text-xs mt-1">Contacta al administrador para que te asigne una tienda.</p>
        </div>
      ) : (
        <div>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
            Tiendas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {stats.map(s => (
              <TiendaCard key={s.tienda.id} stats={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
