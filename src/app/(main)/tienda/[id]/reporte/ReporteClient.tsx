'use client';

import { useState } from 'react';
import {
  FileText, BarChart3, DollarSign, Users,
  TrendingDown, TrendingUp, AlertTriangle, CheckCircle2,
  Shield, Printer, Activity, Target, Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCOP } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { Registro, SobranteSinStock } from '@/types';

// ── Nivel de riesgo (misma lógica que ReporteAuditoriaScreen móvil) ────────────
function calcNivel(pct: number, faltPct: number): 'BAJO' | 'MEDIO' | 'ALTO' {
  if (pct >= 95 && faltPct <= 5) return 'BAJO';
  if (pct >= 80 && faltPct <= 15) return 'MEDIO';
  return 'ALTO';
}

// ── Conclusiones automáticas ──────────────────────────────────────────────────
function buildConclusiones(
  pct: number,
  faltantes: number,
  sobrantes: number,
  ceros: number,
  totalCatalogo: number,
  valorFaltante: number,
  valorSobrante: number,
  sobrastesPendientes: number,
) {
  const faltPct      = totalCatalogo > 0 ? (faltantes / totalCatalogo) * 100 : 0;
  const exactitudPct = totalCatalogo > 0
    ? ((totalCatalogo - faltantes - ceros) / totalCatalogo) * 100
    : 0;
  const balance = valorSobrante - valorFaltante;

  const obs: { nivel: 'CRITICO' | 'ALERTA' | 'OK' | 'INFO'; texto: string }[] = [];

  // Cobertura
  if (pct >= 100) {
    obs.push({ nivel: 'OK', texto: 'Cobertura total del inventario completada al 100%.' });
  } else {
    obs.push({ nivel: 'ALERTA', texto: `Cobertura incompleta: ${Math.round(pct)}% registrado. Faltan artículos por contar.` });
  }

  // Faltantes
  if (faltantes === 0) {
    obs.push({ nivel: 'OK', texto: 'Sin artículos faltantes detectados.' });
  } else if (faltPct > 15) {
    obs.push({ nivel: 'CRITICO', texto: `Alta tasa de faltantes: ${Math.round(faltPct)}% (${faltantes} artículos). Requiere atención inmediata.` });
  } else if (faltPct > 5) {
    obs.push({ nivel: 'ALERTA', texto: `Faltantes moderados: ${Math.round(faltPct)}% (${faltantes} artículos). Se recomienda revisión.` });
  } else {
    obs.push({ nivel: 'INFO', texto: `Faltantes mínimos: ${faltantes} artículos (${Math.round(faltPct)}% del catálogo).` });
  }

  // Impacto económico
  if (valorFaltante > 1_000_000) {
    obs.push({ nivel: 'CRITICO', texto: `Impacto económico crítico en faltantes: ${formatCOP(valorFaltante)}.` });
  } else if (valorFaltante > 200_000) {
    obs.push({ nivel: 'ALERTA', texto: `Impacto económico moderado en faltantes: ${formatCOP(valorFaltante)}.` });
  }

  // Sobrantes sin stock
  if (sobrastesPendientes > 0) {
    obs.push({ nivel: 'ALERTA', texto: `${sobrastesPendientes} sobrantes sin stock pendientes de confirmación.` });
  } else if (sobrantes > 0) {
    obs.push({ nivel: 'INFO', texto: `${sobrantes} sobrantes detectados. Todos confirmados.` });
  }

  // Balance
  if (balance < 0) {
    obs.push({ nivel: 'CRITICO', texto: `Balance negativo: déficit de ${formatCOP(Math.abs(balance))}.` });
  } else if (balance > 0) {
    obs.push({ nivel: 'INFO', texto: `Balance positivo: superávit de ${formatCOP(balance)}.` });
  }

  // Exactitud
  if (exactitudPct < 70) {
    obs.push({ nivel: 'ALERTA', texto: `Exactitud de inventario baja: ${Math.round(exactitudPct)}%. Revisar metodología de conteo.` });
  } else if (exactitudPct >= 90) {
    obs.push({ nivel: 'OK', texto: `Alta exactitud de inventario: ${Math.round(exactitudPct)}%.` });
  }

  return obs;
}

interface AuditorStats {
  nombre:    string;
  escaneos:  number;
  faltantes: number;
  sobrantes: number;
  sinDif:    number;
  ceros:     number;
}

interface Props {
  tiendaNombre:    string;
  tiendaColor:     string;
  registros:       Registro[];
  sobrantes:       SobranteSinStock[];
  totalCatalogo:   number;
  valorInventario: number;
}

type Tab = 'resumen' | 'economico' | 'equipo' | 'conclusiones';

export default function ReporteClient({
  tiendaNombre, tiendaColor, registros, sobrantes, totalCatalogo, valorInventario,
}: Props) {
  const [tab, setTab] = useState<Tab>('resumen');

  // ── Cálculos ─────────────────────────────────────────────────────────────────
  const faltantesArr  = registros.filter(r => r.clasificacion === 'FALTANTE');
  const sobrantesArr  = registros.filter(r => r.clasificacion === 'SOBRANTE');
  const sinDifArr     = registros.filter(r => r.clasificacion === 'SIN_DIF');
  const cerosArr      = registros.filter(r => r.clasificacion === 'CERO');

  const pct      = totalCatalogo > 0 ? (registros.length / totalCatalogo) * 100 : 0;
  const faltPct  = totalCatalogo > 0 ? (faltantesArr.length / totalCatalogo) * 100 : 0;

  const valorFaltante        = faltantesArr.reduce((a, r) => a + Math.abs(r.cantidad - r.stockSistema) * r.costoUnitario, 0);
  const valorSobrante        = sobrantesArr.reduce((a, r) => a + Math.abs(r.cantidad - r.stockSistema) * r.costoUnitario, 0);
  const valorSobrantesStock  = sobrantes.reduce((a, s) => a + s.precio * s.cantidad, 0);
  const balance              = valorSobrante - valorFaltante;
  const sobrastesPendientes  = sobrantes.filter(s => s.estado === 'PENDIENTE').length;

  const nivel        = calcNivel(pct, faltPct);
  const conclusiones = buildConclusiones(
    pct, faltantesArr.length, sobrantesArr.length, cerosArr.length,
    totalCatalogo, valorFaltante, valorSobrante, sobrastesPendientes,
  );

  // ── Auditores ─────────────────────────────────────────────────────────────────
  const auditorMap = new Map<string, AuditorStats>();
  for (const r of registros) {
    const prev = auditorMap.get(r.usuarioNombre) ?? {
      nombre: r.usuarioNombre, escaneos: 0, faltantes: 0, sobrantes: 0, sinDif: 0, ceros: 0,
    };
    auditorMap.set(r.usuarioNombre, {
      ...prev,
      escaneos:  prev.escaneos + 1,
      faltantes: prev.faltantes + (r.clasificacion === 'FALTANTE' ? 1 : 0),
      sobrantes: prev.sobrantes + (r.clasificacion === 'SOBRANTE' ? 1 : 0),
      sinDif:    prev.sinDif    + (r.clasificacion === 'SIN_DIF'  ? 1 : 0),
      ceros:     prev.ceros     + (r.clasificacion === 'CERO'     ? 1 : 0),
    });
  }
  const auditores = Array.from(auditorMap.values()).sort((a, b) => b.escaneos - a.escaneos);

  // ── Top 5 faltantes por valor económico ───────────────────────────────────────
  const top5Faltantes = faltantesArr
    .map(r => ({ ...r, valorImpacto: Math.abs(r.cantidad - r.stockSistema) * r.costoUnitario }))
    .sort((a, b) => b.valorImpacto - a.valorImpacto)
    .slice(0, 5);

  // ── Config visual por nivel ────────────────────────────────────────────────────
  const nivelConfig = {
    BAJO:  { color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-800/50', label: 'Riesgo Bajo',  icon: <CheckCircle2 size={18} /> },
    MEDIO: { color: 'text-amber-400',   bg: 'bg-amber-950/40 border-amber-800/50',     label: 'Riesgo Medio', icon: <AlertTriangle size={18} /> },
    ALTO:  { color: 'text-red-400',     bg: 'bg-red-950/40 border-red-800/50',         label: 'Riesgo Alto',  icon: <Shield size={18} /> },
  } as const;
  const nivelCfg  = nivelConfig[nivel];
  const barColor  = pct >= 80 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444';

  const TABS = [
    { id: 'resumen'      as const, label: 'Resumen',      icon: <BarChart3    size={14} /> },
    { id: 'economico'    as const, label: 'Económico',    icon: <DollarSign   size={14} /> },
    { id: 'equipo'       as const, label: 'Equipo',       icon: <Users        size={14} /> },
    { id: 'conclusiones' as const, label: 'Conclusiones', icon: <FileText     size={14} /> },
  ];

  return (
    <>
      {/* ── Tabs + PDF ── */}
      <div className="flex gap-1 mb-6 bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-1 print:hidden">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold flex-1 justify-center transition-all',
              tab === t.id
                ? 'bg-prp/20 text-vlt border border-prp/30 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
        <button
          onClick={() => window.print()}
          title="Imprimir / Guardar como PDF"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-all shrink-0 border border-zinc-800/60"
        >
          <Printer size={14} />
          <span className="hidden sm:inline text-xs">PDF</span>
        </button>
      </div>

      {/* ══════════════════════════════════════
          TAB: RESUMEN
      ══════════════════════════════════════ */}
      {tab === 'resumen' && (
        <div className="space-y-5">
          {/* Nivel de riesgo + progreso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nivel */}
            <div className={cn('rounded-2xl border p-5 flex items-center gap-4 anim-fade-up', nivelCfg.bg)}>
              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-black/20',
                nivelCfg.color,
              )}>
                {nivelCfg.icon}
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Nivel de riesgo</p>
                <p className={cn('text-2xl font-black', nivelCfg.color)}>{nivelCfg.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {nivel === 'BAJO'  && 'Inventario en buen estado.'}
                  {nivel === 'MEDIO' && 'Requiere revisión en algunas áreas.'}
                  {nivel === 'ALTO'  && 'Requiere acción correctiva inmediata.'}
                </p>
              </div>
            </div>

            {/* Progreso */}
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-5 anim-fade-up" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-zinc-400" />
                  <span className="text-sm font-semibold text-zinc-200">Progreso de conteo</span>
                </div>
                <span className="text-2xl font-black text-zinc-100">{Math.round(pct)}%</span>
              </div>
              <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full progress-bar-animated"
                  style={{
                    width:       `${Math.min(pct, 100)}%`,
                    backgroundColor: barColor,
                    boxShadow:   `0 0 8px ${barColor}80`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{registros.length} escaneados</span>
                <span>{Math.max(0, totalCatalogo - registros.length)} pendientes</span>
              </div>
            </div>
          </div>

          {/* Stats grid 4 cols */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Sin diferencia', value: sinDifArr.length,    color: 'text-purple-400',  bg: 'bg-purple-950/30 border-purple-800/40',  icon: <CheckCircle2  size={15} /> },
              { label: 'Faltantes',      value: faltantesArr.length, color: 'text-red-400',     bg: 'bg-red-950/30 border-red-800/40',         icon: <TrendingDown  size={15} /> },
              { label: 'Sobrantes',      value: sobrantesArr.length, color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-800/40', icon: <TrendingUp    size={15} /> },
              { label: 'Cero',           value: cerosArr.length,     color: 'text-amber-400',   bg: 'bg-amber-950/30 border-amber-800/40',     icon: <AlertTriangle size={15} /> },
            ].map((s, i) => (
              <div
                key={i}
                className={cn('rounded-xl border p-4 anim-fade-up', s.bg)}
                style={{ animationDelay: `${i * 50 + 100}ms` }}
              >
                <div className={cn('mb-2', s.color)}>{s.icon}</div>
                <p className="text-2xl font-black text-zinc-100">{s.value}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{s.label}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  {totalCatalogo > 0 ? `${Math.round((s.value / totalCatalogo) * 100)}% del catálogo` : '—'}
                </p>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/40 p-4 anim-fade-up" style={{ animationDelay: '300ms' }}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold mb-1">Total registros</p>
              <p className="text-2xl font-black text-zinc-100">{registros.length}</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">de {totalCatalogo} en catálogo</p>
            </div>
            <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/40 p-4 anim-fade-up" style={{ animationDelay: '350ms' }}>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold mb-1">Sobrantes sin stock</p>
              <p className="text-2xl font-black text-zinc-100">{sobrantes.length}</p>
              {sobrastesPendientes > 0 && (
                <p className="text-[10px] text-amber-400 mt-0.5">{sobrastesPendientes} pendientes de confirmar</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: ECONÓMICO
      ══════════════════════════════════════ */}
      {tab === 'economico' && (
        <div className="space-y-4">
          {/* Balance hero */}
          <div className={cn(
            'rounded-2xl border p-6 text-center anim-scale-in',
            balance >= 0
              ? 'bg-emerald-950/30 border-emerald-800/40'
              : 'bg-red-950/30 border-red-800/40',
          )}>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-semibold">Balance general</p>
            <p className={cn('text-4xl font-black', balance >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {balance >= 0 ? '+' : ''}{formatCOP(balance)}
            </p>
            <p className="text-xs text-zinc-500 mt-1.5">
              {balance >= 0 ? 'Superávit de inventario' : 'Déficit de inventario'}
            </p>
          </div>

          {/* Breakdown 3 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-red-950/30 border border-red-800/40 p-4 anim-fade-up" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={14} className="text-red-400" />
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">Costo faltantes</span>
              </div>
              <p className="text-xl font-black text-red-400">{formatCOP(valorFaltante)}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{faltantesArr.length} artículos</p>
            </div>
            <div className="rounded-xl bg-emerald-950/30 border border-emerald-800/40 p-4 anim-fade-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-emerald-400" />
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">Costo sobrantes</span>
              </div>
              <p className="text-xl font-black text-emerald-400">{formatCOP(valorSobrante)}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{sobrantesArr.length} artículos</p>
            </div>
            <div className="rounded-xl bg-amber-950/30 border border-amber-800/40 p-4 anim-fade-up" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-amber-400" />
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">Sobrantes sin stock</span>
              </div>
              <p className="text-xl font-black text-amber-400">{formatCOP(valorSobrantesStock)}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{sobrantes.length} artículos</p>
            </div>
          </div>

          {/* Inventario estimado */}
          {valorInventario > 0 && (
            <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/40 p-4 anim-fade-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-zinc-400" />
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">Inventario estimado en sistema</span>
              </div>
              <p className="text-xl font-black text-zinc-100">{formatCOP(valorInventario)}</p>
            </div>
          )}

          {/* Top 5 faltantes por valor */}
          {top5Faltantes.length > 0 && (
            <div>
              <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-3">
                Top {top5Faltantes.length} faltantes por impacto económico
              </h3>
              <div className="rounded-2xl border border-zinc-800/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-900/80 border-b border-zinc-800/60">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Artículo</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Dif.</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Impacto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {top5Faltantes.map((r, i) => (
                      <tr key={r.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="px-4 py-3 text-zinc-600 text-xs font-mono">{i + 1}</td>
                        <td className="px-4 py-3">
                          <p className="text-zinc-200 font-medium truncate max-w-[200px]">{r.descripcion}</p>
                          <p className="text-[11px] text-zinc-500">{r.itemId}</p>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-red-400">
                          {r.cantidad - r.stockSistema}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-red-400">
                          {formatCOP(r.valorImpacto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: EQUIPO
      ══════════════════════════════════════ */}
      {tab === 'equipo' && (
        <div className="space-y-4">
          {auditores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <Users size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No hay escaneos registrados aún</p>
            </div>
          ) : (
            <>
              {/* Encabezado resumen */}
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-zinc-400" />
                <span className="text-sm text-zinc-400">
                  <span className="font-bold text-zinc-200">{auditores.length}</span>{' '}
                  auditor{auditores.length !== 1 ? 'es' : ''} ·{' '}
                  <span className="font-bold text-zinc-200">{registros.length}</span> escaneos totales
                </span>
              </div>

              {/* Cards auditores */}
              <div className="space-y-3">
                {auditores.map((a, i) => {
                  const porcentaje = registros.length > 0
                    ? Math.round((a.escaneos / registros.length) * 100)
                    : 0;
                  return (
                    <div
                      key={a.nombre}
                      className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-4 anim-fade-up"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-prp to-ind flex items-center justify-center text-white font-black text-base shadow-md shadow-prp/25 shrink-0">
                          {a.nombre.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-zinc-100">{a.nombre}</p>
                          <p className="text-xs text-zinc-500">
                            {a.escaneos} escaneo{a.escaneos !== 1 ? 's' : ''} · {porcentaje}% del total
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl font-black text-zinc-100">{a.escaneos}</p>
                          <p className="text-[10px] text-zinc-600">escaneos</p>
                        </div>
                      </div>

                      {/* Clasificaciones breakdown */}
                      <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-zinc-800/40">
                        <div className="text-center">
                          <p className="text-sm font-bold text-purple-400">{a.sinDif}</p>
                          <p className="text-[10px] text-zinc-500">Sin dif.</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-red-400">{a.faltantes}</p>
                          <p className="text-[10px] text-zinc-500">Faltantes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-emerald-400">{a.sobrantes}</p>
                          <p className="text-[10px] text-zinc-500">Sobrantes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-amber-400">{a.ceros}</p>
                          <p className="text-[10px] text-zinc-500">Ceros</p>
                        </div>
                      </div>

                      {/* Progress bar del auditor */}
                      <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-prp to-ind"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: CONCLUSIONES
      ══════════════════════════════════════ */}
      {tab === 'conclusiones' && (
        <div className="space-y-4">
          {/* Observaciones */}
          <div className="space-y-3">
            {conclusiones.map((c, i) => {
              const conf = {
                CRITICO: {
                  color: 'text-red-400',
                  bg:    'bg-red-950/30 border-red-800/40',
                  badge: <Badge variant="danger">Crítico</Badge>,
                },
                ALERTA: {
                  color: 'text-amber-400',
                  bg:    'bg-amber-950/30 border-amber-800/40',
                  badge: <Badge variant="warning">Alerta</Badge>,
                },
                OK: {
                  color: 'text-emerald-400',
                  bg:    'bg-emerald-950/30 border-emerald-800/40',
                  badge: <Badge variant="success">OK</Badge>,
                },
                INFO: {
                  color: 'text-zinc-400',
                  bg:    'bg-zinc-900/40 border-zinc-800/40',
                  badge: <Badge>Info</Badge>,
                },
              }[c.nivel];

              return (
                <div
                  key={i}
                  className={cn('rounded-xl border p-4 flex items-start gap-3 anim-fade-up', conf.bg)}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="shrink-0 mt-0.5">{conf.badge}</div>
                  <p className={cn('text-sm leading-relaxed', conf.color)}>{c.texto}</p>
                </div>
              );
            })}
          </div>

          {/* Recomendaciones */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 anim-fade-up" style={{ animationDelay: '400ms' }}>
            <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-4">
              Recomendaciones
            </h3>
            <ul className="space-y-3">
              {faltantesArr.length > 0 && (
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="text-red-400 shrink-0 mt-0.5 font-bold">→</span>
                  Investigar y justificar los {faltantesArr.length} artículos faltantes detectados.
                </li>
              )}
              {cerosArr.length > 0 && (
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="text-amber-400 shrink-0 mt-0.5 font-bold">→</span>
                  Verificar físicamente los {cerosArr.length} artículos con conteo en cero.
                </li>
              )}
              {sobrastesPendientes > 0 && (
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="text-amber-400 shrink-0 mt-0.5 font-bold">→</span>
                  Confirmar o rechazar los {sobrastesPendientes} sobrantes sin stock pendientes.
                </li>
              )}
              {pct < 100 && (
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="text-zinc-400 shrink-0 mt-0.5 font-bold">→</span>
                  Completar el conteo del {Math.round(100 - pct)}% de artículos aún sin registrar.
                </li>
              )}
              {pct >= 100 && faltantesArr.length === 0 && cerosArr.length === 0 && (
                <li className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="text-emerald-400 shrink-0 mt-0.5 font-bold">✓</span>
                  El inventario se encuentra en excelente estado. Sin recomendaciones adicionales.
                </li>
              )}
            </ul>
          </div>

          {/* Firma */}
          <div className="rounded-xl border border-zinc-800/40 bg-zinc-900/30 px-5 py-4 flex items-center justify-between anim-fade-up" style={{ animationDelay: '500ms' }}>
            <div>
              <p className="text-[10px] text-zinc-600">Reporte generado por</p>
              <p className="text-sm font-bold text-zinc-300">StockIQ — Grupo Orvion Tech · 2026</p>
              <p className="text-xs text-zinc-500 mt-0.5">{tiendaNombre}</p>
            </div>
            <p className="text-xs text-zinc-600">
              {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
