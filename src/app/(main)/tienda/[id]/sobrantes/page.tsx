import { notFound } from 'next/navigation';
import Link from 'next/link';
import { dbGetTiendas, dbGetSobrantes } from '@/lib/db';
import { formatDate, formatCOP } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Package } from 'lucide-react';

interface Props { params: Promise<{ id: string }> }

export default async function SobrantesPage({ params }: Props) {
  const { id } = await params;
  const [tiendas, sobrantes] = await Promise.all([
    dbGetTiendas(),
    dbGetSobrantes(id),
  ]);
  const tienda = tiendas.find(t => t.id === id);
  if (!tienda) notFound();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/tienda/${id}`} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: tienda.color }}>
            <Package size={16} />
          </div>
          <div>
            <h1 className="text-lg font-black text-zinc-100">Sobrantes sin stock</h1>
            <p className="text-xs text-zinc-500">{tienda.nombre} · {sobrantes.length} registros</p>
          </div>
        </div>
      </div>

      {sobrantes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
          <Package size={48} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">No hay sobrantes sin stock</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-zinc-900/80">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Artículo</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Cant.</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Precio</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Auditor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {sobrantes.map(s => (
                  <tr key={s.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-zinc-200 font-medium truncate max-w-[200px]">{s.descripcion}</p>
                      <p className="text-[11px] text-zinc-600">{s.codigo} · {s.ubicacion}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-100 font-bold font-mono">{s.cantidad}</td>
                    <td className="px-4 py-3 text-center text-zinc-300 text-xs">{formatCOP(s.precio)}</td>
                    <td className="px-4 py-3 text-center">
                      {s.estado === 'CONFIRMADO'
                        ? <Badge variant="success">Confirmado</Badge>
                        : <Badge variant="warning">Pendiente</Badge>}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden lg:table-cell">{s.usuarioNombre}</td>
                    <td className="px-4 py-3 text-zinc-600 text-xs hidden lg:table-cell">{formatDate(s.registradoEn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
