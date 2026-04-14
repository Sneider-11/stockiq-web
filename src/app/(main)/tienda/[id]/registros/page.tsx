export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { dbGetTiendas, dbGetRegistros } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ArrowLeft, Package } from 'lucide-react';
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
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/tienda/${id}`} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 hover:scale-105 transition-all">
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
