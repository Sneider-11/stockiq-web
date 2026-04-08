import { notFound } from 'next/navigation';
import Link from 'next/link';
import { dbGetTiendas, dbGetRegistros, dbGetCatalogo, dbGetSobrantes } from '@/lib/db';
import { formatCOP } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft, Package, TrendingDown, TrendingUp,
  CheckCircle2, FileBarChart, Upload, List,
  AlertTriangle, ScanLine,
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

  const faltantes     = registros.filter(r => r.clasificacion === 'FALTANTE');
  const sobrReg       = registros.filter(r => r.clasificacion === 'SOBRANTE');
  const sinDif        = registros.filter(r => r.clasificacion === 'SIN_DIF');
  const ceros         = registros.filter(r => r.clasificacion === 'CERO');
  const valorFaltante = faltantes.reduce((a, r) => a + Math.abs(r.cantidad - r.stockSistema) * r.costoUnitario, 0);
  const valorSobrante = sobrReg.reduce((a, r)   => a + Math.abs(r.cantidad - r.stockSistema) * r.costoUnitario, 0);

  const barColor = progreso >= 80 ? '#10B981' : progreso >= 40 ? '#F59E0B' : '#EF4444';

  const quickLinks = [
    { href: `/tienda/${id}/resultados`, label: 'Resultados',     icon: <FileBarChart size={18} />, desc: 'Comparativa sistema vs contado' },
    { href: `/tienda/${id}/registros`,  label: 'Registros',      icon: <List size={18} />,         desc: `${registros.length} artículos escaneados` },
    { href: `/tienda/${id}/importar`,   label: 'Importar Excel', icon: <Upload size={18} />,       desc: `Catálogo TNS · ${total} artículos` },
    { href: `/tienda/${id}/sobrantes`,  label: 'Sobrantes',      icon: <AlertTriangle size={18} />, desc: `${sobrantes.length} sin stock` },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
            style={{ backgroundColor: tienda.color, boxShadow: `0 4px 14px ${tienda.color}55` }}
          >
            <Package size={18} />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-100 tracking-tight">{tienda.nombre}</h1>
            {tienda.nit && <p className="text-xs text-zinc-500">NIT: {tienda.nit}</p>}
          </div>
        </div>
        <div className="ml-auto">
          {tienda.modoInventario === 'OFFLINE'
            ? <Badge variant="danger">Inventario cerrado</Badge>
            : <Badge variant="success">Activo</Badge>}
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800/60 p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ScanLine size={16} className="text-zinc-500" />
            <span className="text-sm font-semibold text-zinc-300">Progreso de conteo</span>
          </div>
          <span className="text-2xl font-black text-zinc-100">{progreso}%</span>
        </div>
        <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(progreso, 100)}%`, backgroundColor: barColor }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-600">
          <span>{registros.length} artículos escaneados</span>
          <span>{total} en catálogo</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Sin diferencia', value: sinDif.length,    icon: <CheckCircle2 size={16} />, color: 'text-vlt',          bg: 'bg-purple-950/30 border-purple-900/40' },
          { label: 'Faltantes',      value: faltantes.length, icon: <TrendingDown  size={16} />, color: 'text-red-400',       bg: 'bg-red-950/30 border-red-900/40', sub: formatCOP(valorFaltante) },
          { label: 'Sobrantes',      value: sobrReg.length,   icon: <TrendingUp    size={16} />, color: 'text-emerald-400',   bg: 'bg-emerald-950/30 border-emerald-900/40', sub: formatCOP(valorSobrante) },
          { label: 'Ceros',          value: ceros.length,     icon: <AlertTriangle size={16} />, color: 'text-amber-400',     bg: 'bg-amber-950/30 border-amber-900/40' },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl border p-4 ${s.bg}`}>
            <div className={`${s.color} mb-2`}>{s.icon}</div>
            <p className="text-2xl font-black text-zinc-100">{s.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            {s.sub && <p className={`text-[10px] ${s.color} mt-0.5 font-medium`}>{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Quick links */}
      <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Acciones</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {quickLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center gap-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900 p-4 transition-all"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: tienda.color + '33', border: `1px solid ${tienda.color}55` }}
            >
              <span style={{ color: tienda.color }}>{link.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-100 group-hover:text-white">{link.label}</p>
              <p className="text-xs text-zinc-500 truncate">{link.desc}</p>
            </div>
            <ArrowLeft size={16} className="text-zinc-600 group-hover:text-zinc-400 rotate-180 transition-all" />
          </Link>
        ))}
      </div>

      {/* Recent scans */}
      {registros.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Últimos escaneos</h2>
            <Link href={`/tienda/${id}/registros`} className="text-xs text-vlt hover:text-prp transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-2">
            {registros.slice(0, 8).map(r => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-zinc-900/40 border border-zinc-800/40 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 font-medium truncate">{r.descripcion}</p>
                  <p className="text-[11px] text-zinc-600">{r.itemId} · {r.ubicacion} · {r.usuarioNombre}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-100">{r.cantidad}</p>
                    <p className="text-[10px] text-zinc-600">contado</p>
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
