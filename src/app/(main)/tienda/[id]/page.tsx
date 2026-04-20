export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { dbGetTiendas, dbGetRegistros, dbGetCatalogo, dbGetSobrantes } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { DescargarTiendaBtn } from '@/components/ui/DescargarTiendaBtn';
import { ReiniciarBtn } from '@/components/ui/ReiniciarBtn';
import { CerrarInventarioBtn } from '@/components/ui/CerrarInventarioBtn';
import {
  ArrowLeft, Boxes, TrendingDown, TrendingUp,
  CheckCircle2, BarChart2, Upload, ClipboardList,
  AlertTriangle, ScanLine, Hash, ChevronRight, FileText, Home, History, Scan,
} from 'lucide-react';
import type { Registro } from '@/types';

interface Props { params: Promise<{ id: string }> }

function ClasificacionBadge({ clsf }: { clsf: Registro['clasificacion'] }) {
  const map = {
    SIN_DIF:  <Badge variant="purple">Sin diferencia</Badge>,
    FALTANTE: <Badge variant="danger">Faltante</Badge>,
    SOBRANTE: <Badge variant="success">Sobrante</Badge>,
    CERO:     <Badge variant="warning">Cero</Badge>,
  };
  return map[clsf];
}

export default async function TiendaPage({ params }: Props) {
  const { id } = await params;
  const [tiendas, registros, catalogo, sobrantes] = await Promise.all([
    dbGetTiendas(),
    dbGetRegistros(id),
    dbGetCatalogo(id),
    dbGetSobrantes(id),
  ]);

  const tienda = tiendas.find(t => t.id === id);
  if (!tienda) notFound();

  const total    = catalogo.length;
  const progreso = total > 0 ? Math.round((registros.length / total) * 100) : 0;

  const faltantes      = registros.filter(r => r.clasificacion === 'FALTANTE');
  const sobrReg        = registros.filter(r => r.clasificacion === 'SOBRANTE');
  const sinDif         = registros.filter(r => r.clasificacion === 'SIN_DIF');
  const ceros          = registros.filter(r => r.clasificacion === 'CERO');
  const valorFaltante  = faltantes.reduce((a, r) => a + Math.abs(r.cantidad - r.stockSistema) * r.costoUnitario, 0);
  const valorSobrante  = sobrReg.reduce((a, r)   => a + Math.abs(r.cantidad - r.stockSistema) * r.costoUnitario, 0);

  const barColor =
    progreso >= 80 ? '#10B981' :
    progreso >= 40 ? '#F59E0B' : '#EF4444';
  const barGlow =
    progreso >= 80 ? 'rgba(16,185,129,0.5)' :
    progreso >= 40 ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.5)';

  // ── Quick links con color semántico propio ─────────────────────────────────
  // Cada acción tiene su propio color visible independiente del color de la tienda.
  // Se usa el color de la tienda SÓLO como acento secundario (borde/sombra).
  const quickLinks = [
    {
      href:    `/tienda/${id}/scanner`,
      label:   'Escáner Web',
      icon:    <Scan size={18} />,
      desc:    'Pistola lectora / teclado',
      iconBg:  '#0F766E',          // teal-700
      iconGlow:'rgba(15,118,110,0.35)',
    },
    {
      href:    `/tienda/${id}/resultados`,
      label:   'Resultados',
      icon:    <BarChart2 size={18} />,
      desc:    'Comparativa sistema vs contado',
      iconBg:  '#4F46E5',          // indigo sólido
      iconGlow:'rgba(79,70,229,0.35)',
    },
    {
      href:    `/tienda/${id}/registros`,
      label:   'Registros',
      icon:    <ClipboardList size={18} />,
      desc:    `${registros.length} artículos escaneados`,
      iconBg:  '#0284C7',          // sky-600
      iconGlow:'rgba(2,132,199,0.35)',
    },
    {
      href:    `/tienda/${id}/importar`,
      label:   'Importar Excel',
      icon:    <Upload size={18} />,
      desc:    `Catálogo TNS · ${total} artículos`,
      iconBg:  '#059669',          // emerald-600
      iconGlow:'rgba(5,150,105,0.35)',
    },
    {
      href:    `/tienda/${id}/sobrantes`,
      label:   'Sobrantes',
      icon:    <AlertTriangle size={18} />,
      desc:    `${sobrantes.length} sin stock en sistema`,
      iconBg:  '#D97706',          // amber-600
      iconGlow:'rgba(217,119,6,0.35)',
    },
    {
      href:    `/tienda/${id}/reporte`,
      label:   'Reporte',
      icon:    <FileText size={18} />,
      desc:    'Auditoría · análisis económico · equipo',
      iconBg:  '#7C3AED',          // violet-700 (color StockIQ)
      iconGlow:'rgba(124,58,237,0.35)',
    },
    {
      href:    `/tienda/${id}/historial`,
      label:   'Historial',
      icon:    <History size={18} />,
      desc:    'Auditorías anteriores guardadas',
      iconBg:  '#0E7490',          // cyan-700
      iconGlow:'rgba(14,116,144,0.35)',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto page-enter">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] text-zinc-600 mb-4" aria-label="Breadcrumb">
        <Link href="/" className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
          <Home size={11} />
          Inicio
        </Link>
        <ChevronRight size={10} />
        <span className="text-zinc-400 font-medium truncate max-w-[160px]">{tienda.nombre}</span>
      </nav>

      {/* ── Back + header ── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link
          href="/"
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 hover:bg-zinc-800 transition-all hover:scale-105"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
            style={{ backgroundColor: tienda.color, boxShadow: `0 4px 14px ${tienda.color}55` }}
          >
            <Boxes size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-zinc-100 tracking-tight truncate">{tienda.nombre}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {tienda.nit && (
                <span className="flex items-center gap-1 text-xs text-zinc-400">
                  <Hash size={11} />
                  {tienda.nit}
                </span>
              )}
              {tienda.nit && <span className="text-xs text-zinc-600">·</span>}
              <span className="text-xs text-zinc-400">{total} artículos en catálogo</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {tienda.modoInventario === 'OFFLINE'
            ? <Badge variant="danger">Inventario cerrado</Badge>
            : (
              <div className="flex items-center gap-1.5">
                <span className="live-dot" />
                <Badge variant="success">Activo</Badge>
              </div>
            )}
          <CerrarInventarioBtn tiendaId={id} tiendaNombre={tienda.nombre} modoActual={tienda.modoInventario as 'ONLINE' | 'OFFLINE'} />
          <ReiniciarBtn tiendaId={id} tiendaNombre={tienda.nombre} />
          <DescargarTiendaBtn registros={registros} tiendaNombre={tienda.nombre} />
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/60 p-5 mb-5 anim-fade-up" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ScanLine size={16} className="text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-200">Progreso de conteo</span>
          </div>
          <AnimatedNumber value={progreso} format="percent" className="text-2xl font-black text-zinc-100" />
        </div>
        <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full progress-bar-animated"
            style={{
              width: `${Math.min(progreso, 100)}%`,
              backgroundColor: barColor,
              boxShadow: `0 0 10px ${barGlow}`,
              animationDelay: '300ms',
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{registros.length} artículos escaneados</span>
          <span>{total > 0 ? `${total - registros.length} pendientes` : 'Sin catálogo cargado'}</span>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          {
            label: 'Sin diferencia',
            value: sinDif.length,
            icon: <CheckCircle2 size={16} />,
            color: 'text-purple-400',
            bg: 'bg-purple-950/40 border-purple-800/50 hover:border-purple-700/70',
          },
          {
            label: 'Faltantes',
            value: faltantes.length,
            icon: <TrendingDown size={16} />,
            color: 'text-red-400',
            bg: 'bg-red-950/40 border-red-800/50 hover:border-red-700/70',
            sub: valorFaltante,
            subFormat: 'cop' as const,
          },
          {
            label: 'Sobrantes reg.',
            value: sobrReg.length,
            icon: <TrendingUp size={16} />,
            color: 'text-emerald-400',
            bg: 'bg-emerald-950/40 border-emerald-800/50 hover:border-emerald-700/70',
            sub: valorSobrante,
            subFormat: 'cop' as const,
          },
          {
            label: 'Ceros',
            value: ceros.length,
            icon: <AlertTriangle size={16} />,
            color: 'text-amber-400',
            bg: 'bg-amber-950/40 border-amber-800/50 hover:border-amber-700/70',
          },
          {
            label: 'Sobr. s/stock',
            value: sobrantes.length,
            icon: <TrendingUp size={16} />,
            color: 'text-orange-400',
            bg: 'bg-orange-950/40 border-orange-800/50 hover:border-orange-700/70',
          },
        ].map((s, i) => (
          <div
            key={i}
            className={`rounded-xl border p-4 transition-all duration-200 anim-fade-up ${s.bg}`}
            style={{ animationDelay: `${i * 60 + 100}ms` }}
          >
            <div className={`${s.color} mb-2`}>{s.icon}</div>
            <AnimatedNumber value={s.value} className="text-2xl font-black text-zinc-100 block" />
            <p className="text-xs text-zinc-400 mt-0.5">{s.label}</p>
            {s.sub !== undefined && s.subFormat && (
              <AnimatedNumber
                value={s.sub}
                format={s.subFormat}
                className={`text-[10px] ${s.color} mt-0.5 font-medium block`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Quick links ── */}
      <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">Acciones</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {quickLinks.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center gap-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 anim-slide-right"
            style={{ animationDelay: `${i * 50 + 200}ms` }}
          >
            {/* Ícono con color semántico sólido — siempre visible */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 transition-all group-hover:scale-110 group-hover:brightness-110"
              style={{
                backgroundColor: link.iconBg,
                boxShadow: `0 2px 10px ${link.iconGlow}`,
              }}
            >
              {link.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">{link.label}</p>
              <p className="text-xs text-zinc-400 truncate mt-0.5">{link.desc}</p>
            </div>
            <ChevronRight size={16} className="text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all shrink-0" />
          </Link>
        ))}
      </div>

      {/* ── Últimos escaneos ── */}
      {registros.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Últimos escaneos</h2>
            <Link href={`/tienda/${id}/registros`} className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-2">
            {registros.slice(0, 8).map((r, i) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-xl bg-zinc-900/40 border border-zinc-800/40 px-4 py-3 hover:bg-zinc-900/70 hover:border-zinc-700/60 transition-all duration-200 anim-fade-up"
                style={{ animationDelay: `${i * 40 + 300}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-100 font-medium truncate">{r.descripcion}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{r.itemId} · {r.ubicacion} · {r.usuarioNombre}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-100">{r.cantidad}</p>
                    <p className="text-[10px] text-zinc-500">contado</p>
                  </div>
                  <ClasificacionBadge clsf={r.clasificacion} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
