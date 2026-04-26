export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { dbGetTiendas, dbGetCatalogo, dbGetRegistros } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ArrowLeft, ScanLine } from 'lucide-react';
import ScannerClient from './ScannerClient';

interface Props { params: Promise<{ id: string }> }

export default async function ScannerPage({ params }: Props) {
  const { id } = await params;
  const [tiendas, catalogo, registros, session] = await Promise.all([
    dbGetTiendas(),
    dbGetCatalogo(id),
    dbGetRegistros(id),
    getSession(),
  ]);

  const tienda = tiendas.find(t => t.id === id);
  if (!tienda) notFound();

  return (
    <div className="max-w-3xl mx-auto page-enter">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/tienda/${id}`}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: tienda.color, boxShadow: `0 4px 12px ${tienda.color}44` }}
          >
            <ScanLine size={16} />
          </div>
          <div>
            <h1 className="text-lg font-black text-zinc-100">Escáner web</h1>
            <p className="text-xs text-zinc-500">
              {tienda.nombre} · {catalogo.length} artículos · {registros.length} escaneados
            </p>
          </div>
        </div>
      </div>

      <ScannerClient
        tiendaId={id}
        tiendaColor={tienda.color}
        catalogo={catalogo}
        registrosIniciales={registros}
        currentUserNombre={session?.nombre ?? null}
      />
    </div>
  );
}
