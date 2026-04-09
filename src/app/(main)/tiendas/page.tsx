import { dbGetTiendas } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Store, Package, ChevronRight } from 'lucide-react';

export default async function TiendasPage() {
  const user = await getSession();
  if (!user || user.rol !== 'SUPERADMIN') {
    redirect('/');
  }

  const tiendas = await dbGetTiendas();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-prp/20 border border-prp/30 flex items-center justify-center">
          <Store size={16} className="text-vlt" />
        </div>
        <div>
          <h1 className="text-lg font-black text-zinc-100">Tiendas</h1>
          <p className="text-xs text-zinc-500">{tiendas.length} tiendas registradas</p>
        </div>
      </div>

      {tiendas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
          <Package size={48} className="mb-4 opacity-30" />
          <p className="text-sm font-medium">No hay tiendas registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tiendas.map(t => (
            <Link
              key={t.id}
              href={`/tienda/${t.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 p-4 transition-all"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg"
                style={{ backgroundColor: t.color, boxShadow: `0 4px 14px ${t.color}55` }}
              >
                <Package size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-100 truncate">{t.nombre}</p>
                {t.nit && <p className="text-xs text-zinc-500">NIT: {t.nit}</p>}
              </div>
              <div className="flex items-center gap-2">
                {t.modoInventario === 'OFFLINE'
                  ? <Badge variant="danger">Cerrada</Badge>
                  : <Badge variant="success">Activa</Badge>}
                <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
