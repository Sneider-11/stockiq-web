'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area,
  ReferenceLine,
} from 'recharts';
import { Filter, TrendingDown, TrendingUp, Activity, BarChart2, PieChart as PieIcon } from 'lucide-react';
import { cn, formatCOP } from '@/lib/utils';
import type { TiendaStats } from '@/types';

export interface HistoryPoint {
  fecha:          string;
  tiendaNombre:   string;
  valorFaltante:  number;
  valorSobrante:  number;
  totalRegistros: number;
  progreso:       number;
}

interface Props {
  stats:   TiendaStats[];
  history: HistoryPoint[];
}

// ─── Risk helper ──────────────────────────────────────────────────────────────
function calcRisk(progreso: number, faltantes: number, total: number) {
  const faltPct = total > 0 ? (faltantes / total) * 100 : 0;
  if (progreso >= 95 && faltPct <= 5)  return 'BAJO'  as const;
  if (progreso >= 80 && faltPct <= 15) return 'MEDIO' as const;
  return 'ALTO' as const;
}

// Efficiency score 0–100: 60% weight on precision, 40% on progress
function calcEfficiency(s: TiendaStats) {
  const precision = s.totalRegistros > 0 ? (s.sinDiferencia / s.totalRegistros) * 100 : 0;
  return Math.round(precision * 0.6 + s.progreso * 0.4);
}

// ─── Chart constants ──────────────────────────────────────────────────────────
const TICK      = { fill: '#71717A', fontSize: 10 };
const TICK_SM   = { fill: '#A1A1AA', fontSize: 11 };
const GRID      = '#27272A';

// Progress bar color
function progressColor(v: number) {
  return v >= 80 ? '#10B981' : v >= 40 ? '#F59E0B' : '#EF4444';
}

// ─── Custom tooltips ──────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BarTooltip({ active, payload, label, mode }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 shadow-2xl shadow-black/70">
      <p className="text-xs font-bold text-zinc-100 mb-2 max-w-[180px] truncate">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs mb-0.5">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.fill }} />
          <span className="text-zinc-400">{p.name}:</span>
          <span className="text-zinc-100 font-semibold">
            {mode === 'valor' ? formatCOP(p.value) : `${p.value} art.`}
          </span>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProgressTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 shadow-2xl shadow-black/70">
      <p className="text-xs font-bold text-zinc-100 mb-2 max-w-[180px] truncate">{label}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">Progreso</span>
          <span className="font-bold" style={{ color: progressColor(d.progreso) }}>{d.progreso}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">Eficiencia</span>
          <span className="font-bold text-violet-400">{d.efficiency}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">Escaneados</span>
          <span className="font-semibold text-zinc-200">{d.totalRegistros}/{d.totalCatalogo}</span>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, fill } = payload[0];
  return (
    <div className="bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 shadow-2xl">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: fill }} />
        <span className="text-xs font-semibold text-zinc-200">{name}:</span>
        <span className="text-xs font-black text-zinc-100">{value} art.</span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 shadow-2xl shadow-black/70">
      <p className="text-xs font-bold text-zinc-200 mb-2">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs mb-0.5">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.stroke }} />
          <span className="text-zinc-400">{p.name}:</span>
          <span className="text-zinc-100 font-semibold">{formatCOP(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Store filter chips ───────────────────────────────────────────────────────
function StoreFilterChips({
  stats,
  selected,
  onToggle,
  onAll,
}: {
  stats: TiendaStats[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onAll: () => void;
}) {
  const allSelected = selected.size === stats.length;
  return (
    <div className="flex items-center gap-2 flex-wrap mb-5">
      <div className="flex items-center gap-1.5 text-zinc-500 shrink-0">
        <Filter size={12} />
        <span className="text-[10px] uppercase tracking-wider font-semibold">Tiendas</span>
      </div>
      <button
        onClick={onAll}
        className={cn(
          'px-3 py-1 rounded-lg text-[11px] font-bold border transition-all',
          allSelected
            ? 'bg-zinc-700 text-zinc-100 border-zinc-600'
            : 'bg-zinc-800/40 text-zinc-500 border-zinc-800/60 hover:text-zinc-300',
        )}
      >
        Todas
      </button>
      {stats.map(s => {
        const active = selected.has(s.tienda.id);
        return (
          <button
            key={s.tienda.id}
            onClick={() => onToggle(s.tienda.id)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all',
              active
                ? 'text-white border-transparent'
                : 'bg-zinc-800/40 text-zinc-500 border-zinc-800/60 hover:text-zinc-300',
            )}
            style={active ? { backgroundColor: s.tienda.color, boxShadow: `0 2px 8px ${s.tienda.color}50` } : undefined}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: active ? 'rgba(255,255,255,0.7)' : s.tienda.color }}
            />
            {s.tienda.nombre.length > 12 ? s.tienda.nombre.slice(0, 12) + '…' : s.tienda.nombre}
          </button>
        );
      })}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center">
          <Icon size={13} className="text-zinc-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-100 leading-tight">{title}</h3>
          <p className="text-[11px] text-zinc-500">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function DashboardCharts({ stats, history }: Props) {
  const [barMode,   setBarMode]   = useState<'valor' | 'cantidad'>('valor');
  const [selected,  setSelected]  = useState<Set<string>>(() => new Set(stats.map(s => s.tienda.id)));

  const toggleStore = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(
      selected.size === stats.length
        ? new Set([stats[0]?.tienda.id].filter(Boolean))
        : new Set(stats.map(s => s.tienda.id)),
    );

  const filtered = useMemo(
    () => stats.filter(s => selected.has(s.tienda.id)),
    [stats, selected],
  );

  // ── Progress chart data ────────────────────────────────────────────────────
  const progressData = useMemo(() =>
    [...filtered]
      .sort((a, b) => b.progreso - a.progreso)
      .slice(0, 10)
      .map(s => ({
        name:           s.tienda.nombre.length > 13 ? s.tienda.nombre.slice(0, 13) + '…' : s.tienda.nombre,
        fullName:       s.tienda.nombre,
        progreso:       s.progreso,
        efficiency:     calcEfficiency(s),
        totalRegistros: s.totalRegistros,
        totalCatalogo:  s.totalCatalogo,
        color:          s.tienda.color,
      })),
  [filtered]);

  // ── Bar chart data ─────────────────────────────────────────────────────────
  const barData = useMemo(() =>
    [...filtered]
      .sort((a, b) => (b.valorFaltante + b.valorSobrante) - (a.valorFaltante + a.valorSobrante))
      .slice(0, 8)
      .map(s => ({
        name:          s.tienda.nombre.length > 15 ? s.tienda.nombre.slice(0, 15) + '…' : s.tienda.nombre,
        valorFaltante: s.valorFaltante,
        valorSobrante: s.valorSobrante,
        faltantes:     s.faltantes,
        sobrantes:     s.sobrantes,
      })),
  [filtered]);

  // ── Donut data ─────────────────────────────────────────────────────────────
  const donutData = useMemo(() => {
    const totF = filtered.reduce((a, s) => a + s.faltantes,     0);
    const totS = filtered.reduce((a, s) => a + s.sobrantes,     0);
    const totD = filtered.reduce((a, s) => a + s.sinDiferencia, 0);
    const totC = filtered.reduce((a, s) => a + s.ceros,         0);
    return [
      { name: 'Sin diferencia', value: totD, color: '#A78BFA' },
      { name: 'Faltantes',      value: totF, color: '#EF4444' },
      { name: 'Sobrantes',      value: totS, color: '#10B981' },
      { name: 'Ceros',          value: totC, color: '#F59E0B' },
    ].filter(d => d.value > 0);
  }, [filtered]);

  // ── Ranking ────────────────────────────────────────────────────────────────
  const ranking = useMemo(() => {
    const order = { ALTO: 0, MEDIO: 1, BAJO: 2 };
    return [...filtered]
      .map(s => ({ ...s, risk: calcRisk(s.progreso, s.faltantes, s.totalCatalogo), efficiency: calcEfficiency(s) }))
      .sort((a, b) => order[a.risk] - order[b.risk] || b.valorFaltante - a.valorFaltante)
      .slice(0, 7);
  }, [filtered]);

  // ── Area chart history ─────────────────────────────────────────────────────
  const areaData = useMemo(() => {
    const map = new Map<string, { faltante: number; sobrante: number }>();
    for (const h of history) {
      const key = new Date(h.fecha).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
      const prev = map.get(key) ?? { faltante: 0, sobrante: 0 };
      map.set(key, { faltante: prev.faltante + h.valorFaltante, sobrante: prev.sobrante + h.valorSobrante });
    }
    return Array.from(map.entries()).map(([fecha, v]) => ({ fecha, ...v }));
  }, [history]);

  const hasProgress = progressData.length > 0;
  const hasBar      = barData.some(d => d.valorFaltante + d.valorSobrante > 0 || d.faltantes + d.sobrantes > 0);
  const hasDonut    = donutData.length > 0;
  const hasHistory  = areaData.length > 1;

  // ── Quick totals bar ───────────────────────────────────────────────────────
  const totalEsc = filtered.reduce((a, s) => a + s.totalRegistros, 0);
  const totalCat = filtered.reduce((a, s) => a + s.totalCatalogo,  0);
  const totalFal = filtered.reduce((a, s) => a + s.valorFaltante,  0);
  const totalSob = filtered.reduce((a, s) => a + s.valorSobrante,  0);
  const avgProg  = filtered.length
    ? Math.round(filtered.reduce((a, s) => a + s.progreso, 0) / filtered.length)
    : 0;

  return (
    <div className="space-y-5 mb-8">

      {/* ── Store filter (only if multiple stores) ──────────────────────── */}
      {stats.length > 1 && (
        <StoreFilterChips
          stats={stats}
          selected={selected}
          onToggle={toggleStore}
          onAll={toggleAll}
        />
      )}

      {/* ── Quick totals strip ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Artículos escaneados', value: `${totalEsc.toLocaleString('es-CO')} / ${totalCat.toLocaleString('es-CO')}`, color: 'text-zinc-100' },
          { label: 'Progreso promedio',    value: `${avgProg}%`,             color: avgProg >= 80 ? 'text-emerald-400' : avgProg >= 40 ? 'text-amber-400' : 'text-red-400' },
          { label: 'Total faltantes',      value: formatCOP(totalFal),      color: totalFal > 0 ? 'text-red-400' : 'text-zinc-400' },
          { label: 'Total sobrantes',      value: formatCOP(totalSob),      color: totalSob > 0 ? 'text-emerald-400' : 'text-zinc-400' },
        ].map((item, i) => (
          <div key={i} className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 px-4 py-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">{item.label}</p>
            <p className={cn('text-sm font-black', item.color)}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* ── Fila 1: Progreso por tienda (full width) ─────────────────────── */}
      {hasProgress && (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 anim-fade-up" style={{ animationDelay: '40ms' }}>
          <SectionHeader
            icon={BarChart2}
            title="Avance de conteo por tienda"
            subtitle={`Top ${progressData.length} tiendas · progreso actual`}
          />
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressData} margin={{ top: 4, right: 8, left: -10, bottom: 40 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ ...TICK, angle: -35, textAnchor: 'end' }}
                  axisLine={false}
                  tickLine={false}
                  height={55}
                />
                <YAxis
                  tick={TICK}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={v => `${v}%`}
                  width={38}
                />
                <ReferenceLine y={80} stroke="#A78BFA" strokeDasharray="4 3" strokeWidth={1.5} label={{ value: 'Meta 80%', fill: '#A78BFA', fontSize: 9, position: 'right' }} />
                <RechartsTip content={<ProgressTooltip />} cursor={{ fill: 'rgba(255,255,255,0.025)' }} />
                <Bar dataKey="progreso" name="Progreso" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {progressData.map((entry, i) => (
                    <Cell key={i} fill={progressColor(entry.progreso)} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-2 justify-end flex-wrap">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500/80" /><span className="text-[10px] text-zinc-500">≥ 80% — óptimo</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-500/80" /><span className="text-[10px] text-zinc-500">40–79% — en curso</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500/80" /><span className="text-[10px] text-zinc-500">{'< 40%'} — atrasado</span></div>
          </div>
        </div>
      )}

      {/* ── Fila 2: Bar diferencias + Donut ─────────────────────────────── */}
      {(hasBar || hasDonut) && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

          {/* Bar chart diferencias */}
          {hasBar && (
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 anim-fade-up" style={{ animationDelay: '80ms' }}>
              <SectionHeader
                icon={TrendingDown}
                title="Diferencias por tienda"
                subtitle={`Faltantes vs sobrantes · top ${barData.length}`}
                action={
                  <div className="flex gap-0.5 bg-zinc-800/60 rounded-lg p-0.5">
                    {(['valor', 'cantidad'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setBarMode(m)}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all',
                          barMode === m ? 'bg-zinc-700 text-zinc-100 shadow' : 'text-zinc-500 hover:text-zinc-300',
                        )}
                      >
                        {m === 'valor' ? '$ Valor' : '# Cant.'}
                      </button>
                    ))}
                  </div>
                }
              />
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={barData}
                    margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                    barCategoryGap="28%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                    <XAxis
                      type="number"
                      tick={TICK}
                      tickFormatter={v =>
                        barMode === 'valor'
                          ? v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`
                          : String(v)
                      }
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis type="category" dataKey="name" tick={TICK_SM} width={110} axisLine={false} tickLine={false} />
                    <RechartsTip content={<BarTooltip mode={barMode} />} cursor={{ fill: 'rgba(255,255,255,0.025)' }} />
                    <Bar
                      dataKey={barMode === 'valor' ? 'valorFaltante' : 'faltantes'}
                      name="Faltantes"
                      fill="#EF4444"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={12}
                    />
                    <Bar
                      dataKey={barMode === 'valor' ? 'valorSobrante' : 'sobrantes'}
                      name="Sobrantes"
                      fill="#10B981"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={12}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-3 justify-end">
                <div className="flex items-center gap-1.5"><div className="w-3 h-2.5 rounded-sm bg-red-500/80" /><span className="text-[10px] text-zinc-500">Faltantes</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-2.5 rounded-sm bg-emerald-500/80" /><span className="text-[10px] text-zinc-500">Sobrantes</span></div>
              </div>
            </div>
          )}

          {/* Donut distribución */}
          {hasDonut && (
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 anim-fade-up" style={{ animationDelay: '120ms' }}>
              <SectionHeader
                icon={PieIcon}
                title="Distribución global"
                subtitle="Estado de artículos escaneados"
              />
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="transparent"
                    >
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4">
                {donutData.map((d, i) => {
                  const total = donutData.reduce((a, x) => a + x.value, 0);
                  const pct   = total > 0 ? Math.round((d.value / total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <div className="min-w-0">
                        <p className="text-[10px] text-zinc-400 truncate">{d.name}</p>
                        <p className="text-[10px] text-zinc-600">{d.value} · {pct}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Fila 3: Ranking + Histórico ──────────────────────────────────── */}
      <div className={cn('grid gap-5', hasHistory ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1')}>

        {/* Risk ranking con eficiencia */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 anim-fade-up" style={{ animationDelay: '160ms' }}>
          <SectionHeader
            icon={Activity}
            title="Ranking de riesgo"
            subtitle="Tiendas ordenadas por exposición al riesgo"
          />
          <div className="space-y-2">
            {ranking.map((s, i) => (
              <div
                key={s.tienda.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors',
                  s.risk === 'ALTO'
                    ? 'bg-red-950/20 border-red-900/30 hover:border-red-800/60'
                    : s.risk === 'MEDIO'
                    ? 'bg-amber-950/15 border-amber-900/25 hover:border-amber-800/50'
                    : 'bg-zinc-800/30 border-zinc-800/50 hover:border-zinc-700',
                )}
              >
                <span className="text-[11px] font-black text-zinc-600 w-4 text-center shrink-0">{i + 1}</span>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.tienda.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{s.tienda.nombre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="h-1 w-16 rounded-full bg-zinc-700/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${s.progreso}%`, backgroundColor: progressColor(s.progreso) }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500">{s.progreso}%</span>
                    <span className="text-[10px] text-zinc-600">·</span>
                    <span className="text-[10px] text-violet-400">ef. {s.efficiency}%</span>
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <span className={cn(
                    'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border',
                    s.risk === 'ALTO'  ? 'bg-red-950/60 text-red-400 border-red-800/50'
                    : s.risk === 'MEDIO' ? 'bg-amber-950/60 text-amber-400 border-amber-800/50'
                    : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50',
                  )}>
                    {s.risk === 'ALTO' ? '⚠ Alto' : s.risk === 'MEDIO' ? '∼ Medio' : '✓ Bajo'}
                  </span>
                  {s.valorFaltante > 0 && (
                    <p className="text-[10px] text-red-400">{formatCOP(s.valorFaltante)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Area chart evolución histórica */}
        {hasHistory && (
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 anim-fade-up" style={{ animationDelay: '200ms' }}>
            <SectionHeader
              icon={TrendingUp}
              title="Evolución histórica"
              subtitle="Valor de diferencias en auditorías cerradas"
            />
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradFaltante" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradSobrante" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10B981" stopOpacity={0.20} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis
                    dataKey="fecha"
                    tick={TICK}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={TICK}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                    tickFormatter={v => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(0)}M` : `$${(v / 1_000).toFixed(0)}K`}
                  />
                  <RechartsTip content={<AreaTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="faltante"
                    name="Faltantes"
                    stroke="#EF4444"
                    strokeWidth={2}
                    fill="url(#gradFaltante)"
                    dot={{ fill: '#EF4444', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, stroke: '#EF4444', strokeWidth: 2, fill: '#0a0a0a' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sobrante"
                    name="Sobrantes"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#gradSobrante)"
                    dot={{ fill: '#10B981', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, stroke: '#10B981', strokeWidth: 2, fill: '#0a0a0a' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-5 mt-2 justify-end">
              <div className="flex items-center gap-2"><div className="w-4 h-[2px] bg-red-500 rounded" /><span className="text-[10px] text-zinc-500">Faltantes</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-[2px] bg-emerald-500 rounded" /><span className="text-[10px] text-zinc-500">Sobrantes</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
