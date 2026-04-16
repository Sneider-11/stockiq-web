export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { dbGetTiendas, dbGetRegistros } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ArrowLeft, Package, ChevronRight, Home } from 'lucide-react';
import RegistrosClient from './RegistrosClient';

interface Props { params: Promise<{ id: string }> }

export default async function RegistrosPage({ params }: Props) {
  const { id } = await params;
  const [user, tiendas, registros] = await Promise.all([
    getSession(),
    dbGetTiendas(),
    dbGetRegistros(id),
  ]);

  const tienda = tiendas.find(t => t.id === id);
  if (!tienda) notFound();

  const canDelete = user?.rol === 'SUPERADMIN' || user?.rol === 'ADMIN';
  const canClear  = user?.rol === 'SUPERADMIN';

  return (
    <div className="max-w-6xl mx-auto page-enter">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px] text-zinc-600 mb-4" aria-label="Breadcrumb">
        <Link href="/" className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
          <Home size={11} />
          Inicio
        </Link>
        <ChevronRight size={10} />
        <Link href={`/tienda/${id}`} className="hover:text-zinc-400 transition-colors truncate max-w-[120px]">{tienda.nombre}</Link>
        <ChevronRight size={10} />
        <span className="text-zinc-400 font-medium">Registros</span>
      </nav>

      <div className="flex items-center gap-3 mb-6">
        <Link href={`/tienda/${id}`} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 hover:scale-105 transition-all" aria-label="Volver a la tienda">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg"
            style={{ backgroundColor: tienda.color, boxShadow: `0 4px 12px ${tienda.color}44` }}
          >
            <Package size={16} />
          </div>
          <div>
            <h1 className="text-lg font-black text-zinc-100">Registros</h1>
            <p className="text-xs text-zinc-500">{tienda.nombre} · {registros.length} artículos escaneados</p>
          </div>
        </div>
      </div>

      <RegistrosClient
        initialRegistros={registros}
        tiendaId={id}
        canDelete={canDelete}
        canClear={canClear}
      />
    </div>
  );
}
