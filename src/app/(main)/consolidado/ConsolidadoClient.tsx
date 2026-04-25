'use client';

import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart3, Download, Filter, TrendingDown, TrendingUp,
  Minus, Calendar, ChevronDown,
  Loader2, FileSpreadsheet, ListFilter, Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { Tienda, Registro } from '@/types';

interface Props {
  tiendas: Tienda[];
  registros: Registro[];
}

const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MESES_FULL  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const COP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fCOP  = (v: number) => COP.format(v);
const fDate = (s: string) => new Date(s).toLocaleString('es-CO', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
const fMes  = (s: string) => MESES_FULL[new Date(s).getMonth()];

function ClsfBadge({ c }: { c: Registro['clasificacion'] }) {
  if (c === 'FALTANTE') return <Badge variant="danger">Faltante</Badge>;
  if (c === 'SOBRANTE') return <Badge variant="success">Sobrante</Badge>;
  if (c === 'SIN_DIF')  return <Badge variant="purple">Sin dif.</Badge>;
  return <Badge variant="warning">Cero</Badge>;
}

interface Section {
  tienda:        Tienda;
  regs:          Registro[];
  faltantes:     number;
  sobrantes:     number;
  sinDif:        number;
  ceros:         number;
  valorFaltante: number;
  valorSobrante: number;
}

function AccordionSection({ section, defaultOpen = false }: { section: Section; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const { tienda: t, regs, faltantes, sobrantes, sinDif, ceros, valorFaltante, valorSobrante } = section;

  return (
    <div className="rounded-2xl border border-zinc-800/70 overflow-hidden hover:border-zinc-700/70 transition-colors duration-200">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 bg-zinc-900/70 hover:bg-zinc-900 transition-colors text-left group"
      >
        {/* Tienda icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform"
          style={{ backgroundColor: t.color, boxShadow: `0 3px 10px ${t.color}40` }}
        >
          <Boxes size={15} />
        </div>

        {/* Name + count */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-bold text-zinc-100">{t.nombre}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">{regs.length} registros</p>
        </div>

        {/* Mini stats pills */}
        <div className="hidden sm:flex items-center gap-2 mr-3">
          {faltantes > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-950/60 border border-red-900/50 text-xs font-bold text-red-400">
              <TrendingDown size={11}/>{faltantes}
            </span>
          )}
          {sobrantes > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/60 border border-emerald-900/50 text-xs font-bold text-emerald-400">
              <TrendingUp size={11}/>{sobrantes}
            </span>
          )}
          {sinDif > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-950/60 border border-purple-900/50 text-xs font-bold text-vlt">
              <Minus size={11}/>{sinDif}
            </span>
          )}
        </div>

        {/* Chevron */}
        <span className={cn('text-zinc-500 transition-transform duration-300', open && 'rotate-180')}>
          <ChevronDown size={16} />
        </span>
      </button>

      {/* Animated content */}
      <div
        className={cn('accordion-content', open && 'open')}
      >
        <div className="accordion-inner border-t border-zinc-800/60">
          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-800/30">
            {[
              { label:'Sin dif.',  val:sinDif,    color:'text-vlt',        sub: null },
              { label:'Faltantes', val:faltantes, color:'text-red-400',     sub: valorFaltante > 0 ? fCOP(valorFaltante) : null },
              { label:'Sobrantes', val:sobrantes, color:'text-emerald-400', sub: valorSobrante > 0 ? fCOP(valorSobrante) : null },
              { label:'Ceros',     val:ceros,     color:'text-amber-400',   sub: null },
            ].map((s, i) => (
              <div key={i} className="bg-zinc-900/90 px-4 py-3">
                <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wide">{s.label}</p>
                {s.sub && <p className={`text-[10px] ${s.color} mt-0.5 font-semibold`}>{s.sub}</p>}
              </div>
            ))}
          </div>

          {/* Records table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/80">
                  {['Artículo','Sist.','Contado','Dif.','Estado','Auditor','Fecha'].map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        'px-4 py-2.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide',
                        i === 0 ? 'text-left' : 'text-center',
                        i === 1 && 'hidden md:table-cell',
                        i >= 5 && 'hidden lg:table-cell text-left',
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {regs.map((r, ri) => {
                  const dif = r.cantidad - r.stockSistema;
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-zinc-900/50 transition-colors"
                      style={{ animationDelay: `${ri * 15}ms` }}
                    >
                      <td className="px-4 py-2.5">
                        <p className="text-zinc-200 font-medium truncate max-w-[180px] text-xs">{r.descripcion}</p>
                        <p className="text-[10px] text-zinc-500">{r.itemId}</p>
                      </td>
                      <td className="px-4 py-2.5 text-center text-zinc-500 font-mono text-xs hidden md:table-cell">{r.stockSistema}</td>
                      <td className="px-4 py-2.5 text-center text-zinc-100 font-black font-mono text-xs">{r.cantidad}</td>
                      <td className="px-4 py-2.5 text-center font-mono font-black text-xs">
                        {dif === 0
                          ? <span className="text-zinc-600">—</span>
                          : dif > 0
                            ? <span className="text-emerald-400">+{dif}</span>
                            : <span className="text-red-400">{dif}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-center"><ClsfBadge c={r.clasificacion} /></td>
                      <td className="px-4 py-2.5 text-zinc-500 text-xs hidden lg:table-cell">{r.usuarioNombre}</td>
                      <td className="px-4 py-2.5 text-zinc-500 text-xs hidden lg:table-cell whitespace-nowrap">{fDate(r.escaneadoEn)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConsolidadoClient({ tiendas, registros }: Props) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  const [year,         setYear]         = useState(currentYear);
  const [months,       setMonths]       = useState<number[]>([]);
  const [tiendaFilter, setTiendaFilter] = useState<string[]>([]);
  const [downloading,  setDownloading]  = useState(false);
  const [showFilters,  setShowFilters]  = useState(true);

  // ── Filtrado ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return registros.filter(r => {
      const d = new Date(r.escaneadoEn);
      if (d.getFullYear() !== year) return false;
      if (months.length > 0 && !months.includes(d.getMonth() + 1)) return false;
      if (tiendaFilter.length > 0 && !tiendaFilter.includes(r.tiendaId)) return false;
      return true;
    });
  }, [registros, year, months, tiendaFilter]);

  // ── Secciones por tienda ─────────────────────────────────────────────────────
  const sections = useMemo<Section[]>(() => {
    return tiendas
      .map(tienda => {
        const regs = filtered.filter(r => r.tiendaId === tienda.id);

        // Deduplicar por itemId para los conteos (filtered ya viene desc por escaneado_en)
        const latestByItem = new Map<string, Registro>();
        for (const r of regs) {
          if (!latestByItem.has(r.itemId)) latestByItem.set(r.itemId, r);
        }
        const latestRegs = [...latestByItem.values()];

        const faltRegs  = latestRegs.filter(r => r.clasificacion === 'FALTANTE');
        const sobrRegs  = latestRegs.filter(r => r.clasificacion === 'SOBRANTE');
        return {
          tienda,
          regs,
          faltantes:     faltRegs.length,
          sobrantes:     sobrRegs.length,
          sinDif:        latestRegs.filter(r => r.clasificacion === 'SIN_DIF').length,
          ceros:         latestRegs.filter(r => r.clasificacion === 'CERO').length,
          valorFaltante: faltRegs.reduce((a, r) => a + Math.abs(r.cantidad - r.stockSistema) * r.costoUnitario, 0),
          valorSobrante: sobrRegs.reduce((a, r) => a + Math.abs(r.cantidad - r.stockSistema) * r.costoUnitario, 0),
        };
      })
      .filter(s => s.regs.length > 0);
  }, [tiendas, filtered]);

  // ── Totales ──────────────────────────────────────────────────────────────────
  const totals = useMemo(() => ({
    registros:    filtered.length,
    faltantes:    sections.reduce((a, s) => a + s.faltantes, 0),
    sobrantes:    sections.reduce((a, s) => a + s.sobrantes, 0),
    sinDif:       sections.reduce((a, s) => a + s.sinDif, 0),
    ceros:        sections.reduce((a, s) => a + s.ceros, 0),
    valorFaltante: sections.reduce((a, s) => a + s.valorFaltante, 0),
    valorSobrante: sections.reduce((a, s) => a + s.valorSobrante, 0),
  }), [filtered, sections]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const toggleMonth  = (m: number) =>
    setMonths(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);

  const toggleTienda = (id: string) =>
    setTiendaFilter(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const filterLabel = useMemo(() => {
    const mPart = months.length > 0
      ? months.sort((a,b) => a-b).map(m => MESES_FULL[m-1]).join(', ')
      : 'Todo el año';
    const tPart = tiendaFilter.length > 0
      ? tiendas.filter(t => tiendaFilter.includes(t.id)).map(t => t.nombre).join(', ')
      : 'Todas las tiendas';
    return `${mPart} ${year} · ${tPart}`;
  }, [months, year, tiendaFilter, tiendas]);

  // ── Descarga ─────────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (filtered.length === 0 || downloading) return;
    setDownloading(true);
    await new Promise(r => setTimeout(r, 50)); // allow state update to render

    try {
      const wb = XLSX.utils.book_new();

      // Hoja resumen
      const resumen = sections.map(s => ({
        'Tienda':         s.tienda.nombre,
        'Total registros': s.regs.length,
        'Sin diferencia': s.sinDif,
        'Faltantes':      s.faltantes,
        'Sobrantes':      s.sobrantes,
        'Ceros':          s.ceros,
        'Valor faltante': s.valorFaltante,
        'Valor sobrante': s.valorSobrante,
        'Período':        filterLabel,
      }));
      const wsRes = XLSX.utils.json_to_sheet(resumen);
      wsRes['!cols'] = [{ wch:22 },{ wch:16 },{ wch:16 },{ wch:12 },{ wch:12 },{ wch:8 },{ wch:18 },{ wch:18 },{ wch:40 }];
      XLSX.utils.book_append_sheet(wb, wsRes, 'Resumen');

      // Hoja por tienda
      for (const s of sections) {
        const data = s.regs.map(r => ({
          'Item ID':          r.itemId,
          'Descripción':      r.descripcion,
          'Ubicación':        r.ubicacion,
          'Stock Sistema':    r.stockSistema,
          'Cantidad Contada': r.cantidad,
          'Diferencia':       r.cantidad - r.stockSistema,
          'Clasificación':    r.clasificacion,
          'Costo Unitario':   r.costoUnitario,
          'Valor Diferencia': Math.abs(r.cantidad - r.stockSistema) * r.costoUnitario,
          'Auditor':          r.usuarioNombre,
          'Mes':              fMes(r.escaneadoEn),
          'Fecha y Hora':     fDate(r.escaneadoEn),
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = [
          {wch:16},{wch:38},{wch:16},{wch:14},{wch:16},
          {wch:12},{wch:14},{wch:15},{wch:16},{wch:22},{wch:12},{wch:20},
        ];
        XLSX.utils.book_append_sheet(wb, ws, s.tienda.nombre.substring(0, 31));
      }

      const mStr = months.length > 0
        ? months.sort((a,b)=>a-b).map(m => MESES_CORTO[m-1]).join('-') + `_${year}`
        : `año_${year}`;
      XLSX.writeFile(wb, `consolidado_${mStr}.xlsx`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto page-enter">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-prp/30 to-ind/30 border border-prp/30 flex items-center justify-center">
            <BarChart3 size={18} className="text-vlt" />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-100 tracking-tight">Consolidado de Inventarios</h1>
            <p className="text-xs text-zinc-500 mt-0.5 max-w-xs truncate">{filterLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all',
              showFilters
                ? 'bg-prp/15 border-prp/40 text-vlt'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-100',
            )}
          >
            <ListFilter size={15} />
            Filtros
          </button>
          <button
            onClick={handleDownload}
            disabled={filtered.length === 0 || downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-prp to-ind text-white text-sm font-semibold shadow-lg shadow-prp/20 hover:shadow-prp/40 hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {downloading
              ? <Loader2 size={15} className="animate-spin" />
              : <Download size={15} />}
            Descargar Excel
          </button>
        </div>
      </div>

      {/* ── Panel filtros (colapsable) ── */}
      <div className={cn('accordion-content mb-5', showFilters && 'open')}>
        <div className="accordion-inner">
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Filter size={13} className="text-zinc-500" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Filtros</span>
            </div>

            {/* Año */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs text-zinc-500 w-14 shrink-0 font-semibold">Año</span>
              <div className="flex gap-2">
                {years.map(y => (
                  <button
                    key={y}
                    onClick={() => setYear(y)}
                    className={cn(
                      'px-4 py-1.5 rounded-xl text-sm font-bold transition-all',
                      year === y
                        ? 'bg-prp text-white shadow-md shadow-prp/40'
                        : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60',
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Meses */}
            <div className="flex items-start gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 w-14 shrink-0 mt-1">
                <Calendar size={12} className="text-zinc-500" />
                <span className="text-xs text-zinc-500 font-semibold">Mes</span>
              </div>
              <div className="flex gap-1.5 flex-wrap flex-1">
                {MESES_CORTO.map((mes, i) => {
                  const m   = i + 1;
                  const sel = months.includes(m);
                  return (
                    <button
                      key={m}
                      onClick={() => toggleMonth(m)}
                      className={cn(
                        'min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150',
                        sel
                          ? 'bg-prp text-white shadow-md shadow-prp/40 scale-105'
                          : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60',
                      )}
                    >
                      {mes}
                    </button>
                  );
                })}
                {months.length > 0 && (
                  <button
                    onClick={() => setMonths([])}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 transition-all"
                  >
                    Limpiar ×
                  </button>
                )}
              </div>
            </div>

            {/* Tiendas */}
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs text-zinc-500 w-14 shrink-0 font-semibold">Tienda</span>
              <div className="flex gap-2 flex-wrap flex-1">
                {tiendas.map(t => {
                  const sel = tiendaFilter.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTienda(t.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150',
                        sel
                          ? 'text-white scale-105'
                          : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60',
                      )}
                      style={sel
                        ? { backgroundColor: t.color, boxShadow: `0 3px 10px ${t.color}50` }
                        : undefined}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: sel ? '#fff8' : t.color }}
                      />
                      {t.nombre.replace('Tienda ','').replace('Inventario ','')}
                    </button>
                  );
                })}
                {tiendaFilter.length > 0 && (
                  <button
                    onClick={() => setTiendaFilter([])}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 transition-all"
                  >
                    Todas ×
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats globales ── */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {[
            { label:'Total',       value:totals.registros.toString(),  color:'text-zinc-100',    bg:'bg-zinc-900/60 border-zinc-800/60' },
            { label:'Sin dif.',    value:totals.sinDif.toString(),     color:'text-vlt',         bg:'bg-purple-950/30 border-purple-900/40' },
            { label:'Faltantes',   value:totals.faltantes.toString(),  color:'text-red-400',     bg:'bg-red-950/30 border-red-900/40' },
            { label:'Sobrantes',   value:totals.sobrantes.toString(),  color:'text-emerald-400', bg:'bg-emerald-950/30 border-emerald-900/40' },
            { label:'Ceros',       value:totals.ceros.toString(),      color:'text-amber-400',   bg:'bg-amber-950/30 border-amber-900/40' },
            { label:'Valor falt.', value:fCOP(totals.valorFaltante),  color:'text-red-400',     bg:'bg-red-950/20 border-red-900/30',   wide:true },
            { label:'Valor sobr.', value:fCOP(totals.valorSobrante),  color:'text-emerald-400', bg:'bg-emerald-950/20 border-emerald-900/30', wide:true },
          ].map((s, i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl border p-3 anim-fade-up',
                s.bg,
                (s as { wide?: boolean }).wide && 'col-span-2 sm:col-span-2 lg:col-span-1',
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <p className={`text-base font-black ${s.color} truncate`}>{s.value}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Secciones por tienda ── */}
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-zinc-600 anim-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <FileSpreadsheet size={28} className="opacity-40" />
          </div>
          <p className="text-sm font-semibold">Sin registros para este período</p>
          <p className="text-xs mt-1 text-zinc-500">Ajusta los filtros o sincroniza datos desde la app móvil.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((s, i) => (
            <div key={s.tienda.id} className="anim-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <AccordionSection section={s} defaultOpen={sections.length === 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
