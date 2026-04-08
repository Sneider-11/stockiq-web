import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { dbGetTiendasConStats } from '@/lib/db';
import { formatCOP } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import {
  TrendingDown, TrendingUp, Package, CheckCircle,
  ChevronRight, AlertCircle, Activity,
} from 'lucide-react';
import type { TiendaStats } from '@/types';

function ProgresoBar({ value, color }: { value: number; color: string }) {
  const barColor =
    value >= 80 ? '#10B981' :
    value >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(value, 100)}%`, backgroundColor: barColor }}
      />
    </div>
  );
}

function TiendaCard({ stats }: { stats: TiendaStats }) {
  const { tienda, progreso, totalRegistros, totalCatalogo,
          valorFaltante, valorSobrante, faltantes, sobrantes } = stats;

  const estadoBadge =
    tienda.modoInventario === 'OFFLINE'
      ? <Badge variant="danger">Cerrado</Badge>
      : <Badge variant="success">Activo</Badge>;

  return (
    <Link
      href={`/tienda/${tienda.id}`}
      className="group block rounded-2xl border border-zinc-800/70 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200 overflow-hidden"
    >
      {/* Color accent top bar */}
      <div className="h-1 w-full" style={{ backgroundColor: tienda.color }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shrink-0"
              style={{ backgroundColor: tienda.color, boxShadow: `0 4px 14px ${tienda.color}55` }}
            >
              <Package size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">
                {tienda.nombre}
              </h3>
              {tienda.nit && (
                <p className="text-xs text-zinc-500">NIT: {tienda.nit}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {estadoBadge}
            <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          </div>
        </div>

        {/* Progreso */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-zinc-500">Progreso de conteo</span>
            <span className="text-xs font-bold text-zinc-200">{progreso}%</span>
          </div>
          <ProgresoBar value={progreso} color={tienda.color} />
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-zinc-600">{totalRegistros} escaneados</span>
            <span className="text-[10px] text-zinc-600">{totalCatalogo} en catálogo</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-zinc-800/40 p-2.5 border border-zinc-800/60">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={12} className="text-red-400" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Faltantes</span>
            </div>
            <p className="text-sm font-bold text-zinc-100">{faltantes}</p>
            <p className="text-[10px] text-red-400 mt-0.5">{formatCOP(valorFaltante)}</p>
          </div>
          <div className="rounded-lg bg-zinc-800/40 p-2.5 border border-zinc-800/60">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={12} className="text-emerald-400" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Sobrantes</span>
            </div>
            <p className="text-sm font-bold text-zinc-100">{sobrantes}</p>
            <p className="text-[10px] text-emerald-400 mt-0.5">{formatCOP(valorSobrante)}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function GlobalSummary({ stats }: { stats: TiendaStats[] }) {
  const totalFaltante = stats.reduce((a, s) => a + s.valorFaltante, 0);
  const totalSobrante = stats.reduce((a, s) => a + s.valorSobrante, 0);
  const totalRegistros = stats.reduce((a, s) => a + s.totalRegistros, 0);
  const totalCatalogo  = stats.reduce((a, s) => a + s.totalCatalogo,  0);
  const promedioProgreso = stats.length
    ? Math.round(stats.reduce((a, s) => a + s.progreso, 0) / stats.length)
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[
        { label: 'Artículos escaneados', value: totalRegistros.toString(), sub: `de ${totalCatalogo} en catálogo`, icon: <Activity size={18} />, color: 'text-vlt' },
        { label: 'Progreso promedio',    value: `${promedioProgreso}%`,   sub: 'todas las tiendas',              icon: <CheckCircle size={18} />, color: 'text-emerald-400' },
        { label: 'Valor en faltantes',   value: formatCOP(totalFaltante), sub: 'acumulado',                      icon: <TrendingDown size={18} />, color: 'text-red-400' },
        { label: 'Valor en sobrantes',   value: formatCOP(totalSobrante), sub: 'acumulado',                      icon: <TrendingUp size={18} />,   color: 'text-emerald-400' },
      ].map((item, i) => (
        <div key={i} className="rounded-2xl bg-zinc-900/60 border border-zinc-800/60 p-4">
          <div className={`${item.color} mb-3`}>{item.icon}</div>
          <p className="text-xl font-black text-zinc-100 tracking-tight">{item.value}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{item.label}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const user  = await getSession();
  const allStats = await dbGetTiendasConStats();

  // Filtrar tiendas según el rol
  const stats = user?.rol === 'SUPERADMIN'
    ? allStats
    : allStats.filter(s => user?.tiendas.includes(s.tienda.id));

  const tiendasCerradas = stats.filter(s => s.tienda.modoInventario === 'OFFLINE').length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
            Bienvenido, {user?.nombre.split(' ')[0]}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Panel de auditoría — {stats.length} tienda{stats.length !== 1 ? 's' : ''} asignada{stats.length !== 1 ? 's' : ''}
          </p>
        </div>
        {tiendasCerradas > 0 && (
          <div className="flex items-center gap-2 bg-amber-950/50 border border-amber-900/60 rounded-xl px-3 py-2">
            <AlertCircle size={14} className="text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">
              {tiendasCerradas} tienda{tiendasCerradas > 1 ? 's' : ''} cerrada{tiendasCerradas > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Global summary */}
      {stats.length > 0 && <GlobalSummary stats={stats} />}

      {/* Tiendas grid */}
      {stats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
          <Package size={48} className="mb-4 opacity-30" />
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
