export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { dbGetTiendas, dbGetAuditoriaSnapshots } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ArrowLeft, History, ChevronRight, Home, Boxes } from 'lucide-react';
import HistorialClient from './HistorialClient';

interface Props { params: Promise<{ id: string }> }

export default async function HistorialPage({ params }: Props) {
  const { id } = await params;
  const [tiendas, snapshots, session] = await Promise.all([
    dbGetTiendas(),
    dbGetAuditoriaSnapshots(id),
    getSession(),
  ]);

  const tienda = tiendas.find(t => t.id === id);
  if (!tienda) notFound();

  const canEdit = !!session && ['SUPERADMIN', 'ADMIN'].includes(session.rol) &&
    (session.rol === 'SUPERADMIN' || session.tiendas.includes(id));

  return (
    <div className="max-w-4xl mx-auto page-enter">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] text-zinc-600 mb-4" aria-label="Breadcrumb">
        <Link href="/" className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
          <Home size={11} />
          Inicio
        </Link>
        <ChevronRight size={10} />
        <Link href={`/tienda/${id}`} className="hover:text-zinc-400 transition-colors truncate max-w-[120px]">
          {tienda.nombre}
        </Link>
        <ChevronRight size={10} />
        <span className="text-zinc-400 font-medium">Historial</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link
          href={`/tienda/${id}`}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 hover:bg-zinc-800 transition-all hover:scale-105"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
            style={{ backgroundColor: tienda.color, boxShadow: `0 4px 14px ${tienda.color}55` }}
          >
            <History size={18} />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-100 tracking-tight">Historial de auditorías</h1>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
              <Boxes size={11} />
              {tienda.nombre}
            </p>
          </div>
        </div>
        <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
          {snapshots.length} {snapshots.length === 1 ? 'auditoría' : 'auditorías'}
        </span>
      </div>

      <HistorialClient snapshots={snapshots} tiendaId={id} canEdit={canEdit} />
    </div>
  );
}
