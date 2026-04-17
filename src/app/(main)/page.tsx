export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { dbGetTiendasConStats, dbGetGrupos, dbGetDashboardHistory } from '@/lib/db';
import { formatCOP } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import {
  TrendingDown, TrendingUp, Boxes, CheckCircle,
  ChevronRight, AlertCircle, BarChart3,
  Hash, Zap, Building2, ShieldAlert,
  Target, ClipboardCheck,
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

// ── Nivel de riesgo (misma lógica que app móvil y ReporteClient) ──────────────
function nivelRiesgo(progreso: number, faltantes: number, totalCatalogo: number) {
  const faltPct = totalCatalogo > 0 ? (faltantes / totalCatalogo) * 100 : 0;
  if (progreso >= 95 && faltPct <= 5) return 'BAJO' as const;
  if (progreso >= 80 && faltPct <= 15) return 'MEDIO' as const;
  return 'ALTO' as const;
}

function TiendaCard({ stats, index }: { stats: TiendaStats; index: number }) {
  const { tienda, progreso, totalRegistros, totalCatalogo,
          valorFaltante, valorSobrante, faltantes, sobrantes, sinDiferencia, ceros } = stats;

  const isClosed = tienda.modoInventario === 'OFFLINE';
  const progresoColor =
    progreso >= 80 ? 'text-emerald-400' :
    progreso >= 40 ? 'text-amber-400' : 'text-red-400';

  // Solo mostrar nivel si hay datos
  const nivel = totalRegistros > 0 ? nivelRiesgo(progreso, faltantes, totalCatalogo) : null;
  const nivelBadge = nivel === 'BAJO'
    ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">↑ Bajo</span>
    : nivel === 'MEDIO'
    ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/50">~ Medio</span>
    : nivel === 'ALTO'
    ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-950/60 text-red-400 border border-red-800/50">! Alto</span>
    : null;

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
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {tienda.nit
                  ? <p className="text-[11px] text-zinc-500 flex items-center gap-1"><Hash size={10}/>{tienda.nit}</p>
                  : <p className="text-[11px] text-zinc-500">{totalCatalogo} artículos</p>}
                {nivelBadge}
              </div>
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

// ── KPIs inteligentes ─────────────────────────────────────────────────────────
function DashboardKPIs({ stats }: { stats: TiendaStats[] }) {
  const totalRegistros = stats.reduce((a, s) => a + s.totalRegistros, 0);
  const totalSinDif    = stats.reduce((a, s) => a + s.sinDiferencia,  0);
  const totalFaltante  = stats.reduce((a, s) => a + s.valorFaltante,  0);
  const totalSobrante  = stats.reduce((a, s) => a + s.valorSobrante,  0);
  const diferenciaNeta = totalSobrante - totalFaltante;

  const precision    = totalRegistros > 0 ? Math.round((totalSinDif / totalRegistros) * 100) : 0;
  const cumplimiento = stats.length > 0
    ? Math.round(stats.filter(s => s.progreso >= 80).length / stats.length * 100)
    : 0;
  const tiendasOk    = stats.filter(s => s.progreso >= 80).length;

  // Colores dinámicos
  const precColor  = precision    >= 80 ? 'text-emerald-400' : precision    >= 50 ? 'text-amber-400' : 'text-red-400';
  const cumplColor = cumplimiento >= 70 ? 'text-emerald-400' : cumplimiento >= 40 ? 'text-amber-400' : 'text-red-400';
  const netaColor  = diferenciaNeta >= 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

      {/* KPI 1 — Precisión de inventario */}
      <div
        className="rounded-2xl border border-zinc-800/70 bg-zinc-900/50 p-5 relative overflow-hidden hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-200 anim-fade-up"
        style={{ animationDelay: '0ms' }}
      >
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-600 to-transparent" />
        <div className="flex items-start justify-between mb-4">
          <div className="w-9 h-9 rounded-xl bg-violet-950/60 border border-violet-900/40 flex items-center justify-center">
            <Target size={16} className="text-vlt" />
          </div>
          <span className={`text-[10px] font-bold ${precColor}`}>
            {precision >= 80 ? '↑ Óptimo' : precision >= 50 ? '∼ Moderado' : '↓ Bajo'}
          </span>
        </div>
        <AnimatedNumber value={precision} format="percent" className={`text-2xl font-black tracking-tight ${precColor}`} />
        <p className="text-xs font-semibold text-zinc-300 mt-1.5">Precisión de inventario</p>
        <p className="text-[10px] text-zinc-600 mt-0.5">artículos sin diferencia vs. escaneados</p>
      </div>

      {/* KPI 2 — Diferencia neta */}
      <div
        className={`rounded-2xl border bg-zinc-900/50 p-5 relative overflow-hidden hover:bg-zinc-900/80 transition-all duration-200 anim-fade-up ${
          diferenciaNeta >= 0 ? 'border-emerald-900/40 hover:border-emerald-800/60' : 'border-red-900/40 hover:border-red-800/60'
        }`}
        style={{ animationDelay: '60ms' }}
      >
        <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${
          diferenciaNeta >= 0 ? 'from-emerald-600' : 'from-red-600'
        } to-transparent`} />
        <div className="flex items-start justify-between mb-4">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
            diferenciaNeta >= 0
              ? 'bg-emerald-950/60 border-emerald-900/40'
              : 'bg-red-950/60 border-red-900/40'
          }`}>
            {diferenciaNeta >= 0
              ? <TrendingUp size={16} className="text-emerald-400" />
              : <TrendingDown size={16} className="text-red-400" />}
          </div>
          <span className={`text-[10px] font-bold ${netaColor}`}>
            {diferenciaNeta >= 0 ? 'Balance +' : 'Balance −'}
          </span>
        </div>
        <div className={`text-2xl font-black tracking-tight ${netaColor}`}>
          <span className="text-xl">{diferenciaNeta >= 0 ? '+' : '−'}</span>
          <AnimatedNumber value={Math.abs(diferenciaNeta)} format="cop" className="" />
        </div>
        <p className="text-xs font-semibold text-zinc-300 mt-1.5">Diferencia neta</p>
        <p className="text-[10px] text-zinc-600 mt-0.5">
          {diferenciaNeta >= 0 ? 'Sobrantes superan faltantes' : 'Faltantes superan sobrantes'}
        </p>
      </div>

      {/* KPI 3 — Índice de cumplimiento */}
      <div
        className="rounded-2xl border border-zinc-800/70 bg-zinc-900/50 p-5 relative overflow-hidden hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-200 anim-fade-up"
        style={{ animationDelay: '120ms' }}
      >
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-sky-600 to-transparent" />
        <div className="flex items-start justify-between mb-4">
          <div className="w-9 h-9 rounded-xl bg-sky-950/60 border border-sky-900/40 flex items-center justify-center">
            <ClipboardCheck size={16} className="text-sky-400" />
          </div>
          <span className={`text-[10px] font-bold ${cumplColor}`}>
            {tiendasOk}/{stats.length} tiendas
          </span>
        </div>
        <AnimatedNumber value={cumplimiento} format="percent" className={`text-2xl font-black tracking-tight ${cumplColor}`} />
        <p className="text-xs font-semibold text-zinc-300 mt-1.5">Índice de cumplimiento</p>
        <p className="text-[10px] text-zinc-600 mt-0.5">tiendas con progreso ≥ 80%</p>
      </div>

      {/* KPI 4 — Exposición al riesgo */}
      <div
        className={`rounded-2xl border bg-zinc-900/50 p-5 relative overflow-hidden hover:bg-zinc-900/80 transition-all duration-200 anim-fade-up ${
          totalFaltante > 0 ? 'border-red-900/40 hover:border-red-800/60' : 'border-zinc-800/70 hover:border-zinc-700'
        }`}
        style={{ animationDelay: '180ms' }}
      >
        <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${
          totalFaltante > 0 ? 'from-red-600' : 'from-zinc-600'
        } to-transparent`} />
        <div className="flex items-start justify-between mb-4">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
            totalFaltante > 0 ? 'bg-red-950/60 border-red-900/40' : 'bg-zinc-800/60 border-zinc-700/40'
          }`}>
            <ShieldAlert size={16} className={totalFaltante > 0 ? 'text-red-400' : 'text-zinc-500'} />
          </div>
          <span className={`text-[10px] font-bold ${totalFaltante > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {totalFaltante === 0 ? '✓ Sin riesgo' : '⚠ Revisar'}
          </span>
        </div>
        <AnimatedNumber
          value={totalFaltante}
          format="cop"
          className={`text-2xl font-black tracking-tight ${totalFaltante > 0 ? 'text-red-400' : 'text-zinc-400'}`}
        />
        <p className="text-xs font-semibold text-zinc-300 mt-1.5">Exposición al riesgo</p>
        <p className="text-[10px] text-zinc-600 mt-0.5">valor acumulado en faltantes</p>
      </div>

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
  const [allStats, grupos, history] = await Promise.all([
    dbGetTiendasConStats(),
    dbGetGrupos(),
    dbGetDashboardHistory(),
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

      {/* ── KPIs inteligentes ── */}
      {stats.length > 0 && <DashboardKPIs stats={stats} />}

      {/* ── Gráficas ── */}
      {stats.length > 0 && <DashboardCharts stats={stats} history={history} />}

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
