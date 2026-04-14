export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { dbGetTiendasConStats, dbGetGrupos } from '@/lib/db';
import { formatCOP } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import {
  TrendingDown, TrendingUp, Boxes, CheckCircle,
  ChevronRight, AlertCircle, Activity, BarChart3,
  ScanLine, Hash, Zap, Building2,
} from 'lucide-react';
import type { TiendaStats, GrupoComercial } from '@/types';

function ProgresoBar({ value }: { value: number }) {
  const color =
    value >= 80 ? '#10B981' :
    value >= 40 ? '#F59E0B' : '#EF4444';
  const glowColor =
    value >= 80 ? 'rgba(16,185,129,0.4)' :
    value >= 40 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)';
  return (
    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full progress-bar-animated"
        style={{
          width: `${Math.min(value, 100)}%`,
          backgroundColor: color,
          boxShadow: `0 0 6px ${glowColor}`,
          animationDelay: '200ms',
        }}
      />
    </div>
  );
}

function TiendaCard({ stats, index }: { stats: TiendaStats; index: number }) {
  const { tienda, progreso, totalRegistros, totalCatalogo,
          valorFaltante, valorSobrante, faltantes, sobrantes, sinDiferencia, ceros } = stats;

  const isClosed = tienda.modoInventario === 'OFFLINE';
  const progresoColor =
    progreso >= 80 ? 'text-emerald-400' :
    progreso >= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <Link
      href={`/tienda/${tienda.id}`}
      className="group block rounded-2xl border border-zinc-800/70 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5 anim-fade-up card-hover"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Accent bar */}
      <div
        className="h-0.5 w-full transition-all duration-300 group-hover:h-[2px]"
        style={{ background: `linear-gradient(90deg, ${tienda.color}, ${tienda.color}44)` }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform duration-300"
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
                : <p className="text-[11px] text-zinc-500 mt-0.5">{totalCatalogo} artículos</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            {!isClosed && (
              <span className="live-dot" title="Inventario activo" />
            )}
            {isClosed
              ? <Badge variant="danger">Cerrado</Badge>
              : <Badge variant="success">Activo</Badge>}
            <ChevronRight size={15} className="text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
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
            <span className="text-[10px] text-zinc-500">{totalRegistros} escaneados</span>
            <span className="text-[10px] text-zinc-500">{totalCatalogo} total</span>
          </div>
        </div>

        {/* Stats 2x2 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-zinc-800/40 border border-zinc-800/60 p-2.5 hover:border-red-900/50 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown size={11} className="text-red-400" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Faltantes</span>
            </div>
            <p className="text-sm font-black text-zinc-100">{faltantes}</p>
            <p className="text-[10px] text-red-400 mt-0.5 truncate">{formatCOP(valorFaltante)}</p>
          </div>
          <div className="rounded-lg bg-zinc-800/40 border border-zinc-800/60 p-2.5 hover:border-emerald-900/50 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={11} className="text-emerald-400" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Sobrantes</span>
            </div>
            <p className="text-sm font-black text-zinc-100">{sobrantes}</p>
            <p className="text-[10px] text-emerald-400 mt-0.5 truncate">{formatCOP(valorSobrante)}</p>
          </div>
          <div className="rounded-lg bg-zinc-800/40 border border-zinc-800/60 p-2.5 hover:border-purple-900/50 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle size={11} className="text-vlt" />
              <span className="text-[10px] text-zinc-500 uppercase tracking-wide">Sin dif.</span>
            </div>
            <p className="text-sm font-black text-zinc-100">{sinDiferencia}</p>
          </div>
          <div className="rounded-lg bg-zinc-800/40 border border-zinc-800/60 p-2.5 hover:border-amber-900/50 transition-colors">
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
    {
      label: 'Artículos escaneados',
      node: <AnimatedNumber value={totalRegistros} className="text-xl font-black text-zinc-100 tracking-tight" />,
      sub: `de ${totalCatalogo} en catálogo`,
      icon: <ScanLine size={18} />,
      color: 'text-vlt',
      bg: 'bg-zinc-900/60 border-zinc-800/60 hover:border-vlt/30',
    },
    {
      label: 'Progreso promedio',
      node: <AnimatedNumber value={promedioProgreso} format="percent" className="text-xl font-black text-zinc-100 tracking-tight" />,
      sub: 'todas las tiendas',
      icon: <Activity size={18} />,
      color: 'text-emerald-400',
      bg: 'bg-zinc-900/60 border-zinc-800/60 hover:border-emerald-800/50',
    },
    {
      label: 'Valor en faltantes',
      node: <AnimatedNumber value={totalFaltante} format="cop" className="text-xl font-black text-zinc-100 tracking-tight truncate" />,
      sub: 'acumulado',
      icon: <TrendingDown size={18} />,
      color: 'text-red-400',
      bg: 'bg-red-950/20 border-red-900/30 hover:border-red-800/50',
    },
    {
      label: 'Valor en sobrantes',
      node: <AnimatedNumber value={totalSobrante} format="cop" className="text-xl font-black text-zinc-100 tracking-tight truncate" />,
      sub: 'acumulado',
      icon: <TrendingUp size={18} />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/20 border-emerald-900/30 hover:border-emerald-800/50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {items.map((item, i) => (
        <div
          key={i}
          className={`rounded-2xl border p-4 transition-all duration-200 anim-fade-up ${item.bg}`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className={`${item.color} mb-3`}>{item.icon}</div>
          {item.node}
          <p className="text-xs text-zinc-500 mt-0.5">{item.label}</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ── Sección de un grupo con sus tiendas ──────────────────────────────────────
function GrupoSection({
  grupo, stats, startIndex,
}: {
  grupo: GrupoComercial;
  stats: TiendaStats[];
  startIndex: number;
}) {
  const activas  = stats.filter(s => s.tienda.modoInventario !== 'OFFLINE').length;
  const progreso = stats.length
    ? Math.round(stats.reduce((a, s) => a + s.progreso, 0) / stats.length)
    : 0;

  return (
    <div className="mb-8 anim-fade-up" style={{ animationDelay: `${startIndex * 30}ms` }}>
      {/* Cabecera del grupo */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
          style={{ backgroundColor: grupo.color, boxShadow: `0 2px 8px ${grupo.color}50` }}
        >
          <Building2 size={13} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black text-zinc-200 tracking-tight">{grupo.nombre}</h2>
          {grupo.descripcion && (
            <p className="text-[11px] text-zinc-600 truncate">{grupo.descripcion}</p>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-zinc-500 shrink-0">
          <span>{activas}/{stats.length} activas</span>
          <span
            className={
              progreso >= 80 ? 'text-emerald-400 font-bold' :
              progreso >= 40 ? 'text-amber-400 font-bold' : 'text-red-400 font-bold'
            }
          >
            {progreso}%
          </span>
        </div>
      </div>
      {/* Grid de tiendas del grupo */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <TiendaCard key={s.tienda.id} stats={s} index={startIndex + i} />
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const user = await getSession();
  const [allStats, grupos] = await Promise.all([
    dbGetTiendasConStats(),
    dbGetGrupos(),
  ]);

  // Filtrar las tiendas visibles según el rol
  const stats = user?.rol === 'SUPERADMIN'
    ? allStats
    : allStats.filter(s => user?.tiendas.includes(s.tienda.id));

  const tiendasCerradas = stats.filter(s => s.tienda.modoInventario === 'OFFLINE').length;
  const hora    = new Date().getHours();
  const saludo  = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  // Construir la vista por grupos
  // Para usuarios normales: solo los grupos a los que pertenecen
  const gruposVisibles = user?.rol === 'SUPERADMIN'
    ? grupos
    : grupos.filter(g => user?.grupos.includes(g.id));

  // Tiendas por grupo (solo las visibles para este usuario)
  const tiendaPorGrupo = new Map<string, TiendaStats[]>();
  for (const g of gruposVisibles) {
    tiendaPorGrupo.set(g.id, stats.filter(s => s.tienda.grupoId === g.id));
  }

  // Tiendas sin grupo (solo visibles para SuperAdmin)
  const sinGrupo = user?.rol === 'SUPERADMIN'
    ? stats.filter(s => !s.tienda.grupoId)
    : [];

  // Conteo total de tiendas con grupo para calcular índices de animación
  let animIndex = 0;

  return (
    <div className="max-w-7xl mx-auto page-enter">
      {/* ── Page header ── */}
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
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-prp/15 border border-prp/30 text-vlt text-sm font-semibold hover:bg-prp/25 hover:border-prp/50 transition-all"
            >
              <BarChart3 size={15} />
              Consolidado
            </Link>
          )}
        </div>
      </div>

      {/* ── Global summary ── */}
      {stats.length > 0 && <GlobalSummary stats={stats} />}

      {/* ── Estado vacío ── */}
      {stats.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600 anim-fade-in">
          <Boxes size={48} className="mb-4 opacity-30 float" />
          <p className="text-sm font-medium">No tienes tiendas asignadas</p>
          <p className="text-xs mt-1">Contacta al administrador para que te asigne una tienda.</p>
        </div>
      )}

      {/* ── Grupos con tiendas ── */}
      {gruposVisibles.map(g => {
        const tiendas = tiendaPorGrupo.get(g.id) ?? [];
        if (tiendas.length === 0) return null;
        const idx = animIndex;
        animIndex += tiendas.length;
        return (
          <GrupoSection
            key={g.id}
            grupo={g}
            stats={tiendas}
            startIndex={idx}
          />
        );
      })}

      {/* ── Tiendas sin grupo (solo SuperAdmin) ── */}
      {sinGrupo.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Boxes size={13} />
            Sin grupo asignado
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sinGrupo.map((s, i) => (
              <TiendaCard key={s.tienda.id} stats={s} index={animIndex + i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
