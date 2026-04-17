'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
} from 'recharts';
import { cn } from '@/lib/utils';
import { formatCOP } from '@/lib/utils';
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

// ─── Custom tooltips ──────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BarTooltip({ active, payload, label, mode }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 shadow-2xl shadow-black/70">
      <p className="text-xs font-bold text-zinc-100 mb-2">{label}</p>
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
function LineTooltip({ active, payload, label }: any) {
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

// ─── Axis tick styles ─────────────────────────────────────────────────────────
const TICK_STYLE = { fill: '#71717A', fontSize: 10 };
const TICK_STYLE_SM = { fill: '#A1A1AA', fontSize: 11 };
const GRID_STROKE = '#27272A';

// ─── Main component ───────────────────────────────────────────────────────────
export function DashboardCharts({ stats, history }: Props) {
  const [barMode, setBarMode] = useState<'valor' | 'cantidad'>('valor');

  // Bar chart: top 8 tiendas by total diferencia
  const barData = useMemo(() =>
    [...stats]
      .sort((a, b) => (b.valorFaltante + b.valorSobrante) - (a.valorFaltante + a.valorSobrante))
      .slice(0, 8)
      .map(s => ({
        name:          s.tienda.nombre.length > 15 ? s.tienda.nombre.slice(0, 15) + '…' : s.tienda.nombre,
        fullName:      s.tienda.nombre,
        valorFaltante: s.valorFaltante,
        valorSobrante: s.valorSobrante,
        faltantes:     s.faltantes,
        sobrantes:     s.sobrantes,
      })),
  [stats]);

  // Donut: distribución global de artículos escaneados
  const donutData = useMemo(() => {
    const totF = stats.reduce((a, s) => a + s.faltantes,     0);
    const totS = stats.reduce((a, s) => a + s.sobrantes,     0);
    const totD = stats.reduce((a, s) => a + s.sinDiferencia, 0);
    const totC = stats.reduce((a, s) => a + s.ceros,         0);
    return [
      { name: 'Sin diferencia', value: totD, color: '#A78BFA' },
      { name: 'Faltantes',      value: totF, color: '#EF4444' },
      { name: 'Sobrantes',      value: totS, color: '#10B981' },
      { name: 'Ceros',          value: totC, color: '#F59E0B' },
    ].filter(d => d.value > 0);
  }, [stats]);

  // Ranking: ordenado por riesgo, luego por valor faltante
  const ranking = useMemo(() => {
    const order = { ALTO: 0, MEDIO: 1, BAJO: 2 };
    return [...stats]
      .map(s => ({ ...s, risk: calcRisk(s.progreso, s.faltantes, s.totalCatalogo) }))
      .sort((a, b) => order[a.risk] - order[b.risk] || b.valorFaltante - a.valorFaltante)
      .slice(0, 7);
  }, [stats]);

  // Line chart: agrupa historial por fecha
  const lineData = useMemo(() => {
    const map = new Map<string, { faltante: number; sobrante: number }>();
    for (const h of history) {
      const key = new Date(h.fecha).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
      const prev = map.get(key) ?? { faltante: 0, sobrante: 0 };
      map.set(key, { faltante: prev.faltante + h.valorFaltante, sobrante: prev.sobrante + h.valorSobrante });
    }
    return Array.from(map.entries()).map(([fecha, v]) => ({ fecha, ...v }));
  }, [history]);

  const totalEscaneados = stats.reduce((a, s) => a + s.totalRegistros, 0);
  if (totalEscaneados === 0 && lineData.length === 0) return null;

  const hasBar     = barData.some(d => d.valorFaltante + d.valorSobrante > 0 || d.faltantes + d.sobrantes > 0);
  const hasDonut   = donutData.length > 0;
  const hasHistory = lineData.length > 1;

  return (
    <div className="space-y-5 mb-8">

      {/* ── Fila 1: Bar + Donut ─────────────────────────────────────────────── */}
      {(hasBar || hasDonut) && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

          {/* Bar chart */}
          {hasBar && (
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 anim-fade-up" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Comparativa por tienda</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Faltantes vs sobrantes · top {barData.length} tiendas</p>
                </div>
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
              </div>

              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={barData}
                    margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                    barCategoryGap="28%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                    <XAxis
                      type="number"
                      tick={TICK_STYLE}
                      tickFormatter={v =>
                        barMode === 'valor'
                          ? v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`
                          : String(v)
                      }
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={TICK_STYLE_SM}
                      width={118}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTip
                      content={<BarTooltip mode={barMode} />}
                      cursor={{ fill: 'rgba(255,255,255,0.025)' }}
                    />
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
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2.5 rounded-sm bg-red-500/80" />
                  <span className="text-[10px] text-zinc-500">Faltantes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2.5 rounded-sm bg-emerald-500/80" />
                  <span className="text-[10px] text-zinc-500">Sobrantes</span>
                </div>
              </div>
            </div>
          )}

          {/* Donut chart */}
          {hasDonut && (
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 anim-fade-up" style={{ animationDelay: '100ms' }}>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-zinc-100">Distribución global</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Estado de artículos escaneados</p>
              </div>

              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={84}
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

      {/* ── Fila 2: Ranking + Line chart ────────────────────────────────────── */}
      <div className={cn('grid gap-5', hasHistory ? 'grid-cols-1 xl:grid-cols-[1fr_1fr]' : 'grid-cols-1')}>

        {/* Risk ranking */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 anim-fade-up" style={{ animationDelay: '150ms' }}>
          <div className="mb-4">
            <h3 className="text-sm font-bold text-zinc-100">Ranking de riesgo</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">Tiendas ordenadas por nivel de exposición</p>
          </div>
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
                <span className="text-[11px] font-black text-zinc-600 w-4 text-center">{i + 1}</span>
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: s.tienda.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{s.tienda.nombre}</p>
                  <p className="text-[10px] text-zinc-500">{s.progreso}% · {s.faltantes} faltantes · {s.sobrantes} sobrantes</p>
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

        {/* Line chart: evolución histórica */}
        {hasHistory && (
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 anim-fade-up" style={{ animationDelay: '200ms' }}>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-zinc-100">Evolución histórica</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">Valor de diferencias en auditorías cerradas</p>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                  <XAxis
                    dataKey="fecha"
                    tick={TICK_STYLE}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={TICK_STYLE}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                    tickFormatter={v => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(0)}M` : `$${(v / 1_000).toFixed(0)}K`}
                  />
                  <RechartsTip content={<LineTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="faltante"
                    name="Faltantes"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={{ fill: '#EF4444', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, stroke: '#EF4444', strokeWidth: 2, fill: '#030305' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sobrante"
                    name="Sobrantes"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, stroke: '#10B981', strokeWidth: 2, fill: '#030305' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-2 justify-end">
              <div className="flex items-center gap-2">
                <div className="w-4 h-[2px] bg-red-500 rounded" />
                <span className="text-[10px] text-zinc-500">Faltantes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-[2px] bg-emerald-500 rounded" />
                <span className="text-[10px] text-zinc-500">Sobrantes</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
