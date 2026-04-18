'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, RotateCcw } from 'lucide-react';

interface Props { tiendaId: string; tiendaNombre: string }

export function ReiniciarBtn({ tiendaId, tiendaNombre }: Props) {
  const router = useRouter();
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function confirmar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tienda/${tiendaId}/registros`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Error al reiniciar');
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-900/50 bg-red-950/30 text-red-400 hover:bg-red-950/50 hover:border-red-800/60 hover:text-red-300 text-xs font-semibold transition-all"
        title="Eliminar todos los registros de conteo"
      >
        <Trash2 size={13} />
        Reiniciar inventario
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="modal-card w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/50 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-100">Reiniciar inventario</h2>
                <p className="text-xs text-zinc-400">{tiendaNombre}</p>
              </div>
            </div>

            <p className="text-sm text-zinc-300 mb-2">
              Esto eliminará <span className="font-bold text-red-400">todos los registros, sobrantes y el catálogo de artículos</span> de esta tienda.
            </p>
            <p className="text-xs text-zinc-500 mb-5">
              La tienda quedará completamente vacía, lista para un nuevo cargue de Excel. Esta acción no se puede deshacer.
            </p>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2 mb-4">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setOpen(false); setError(null); }}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700/60 text-zinc-400 text-sm font-semibold hover:bg-zinc-800/40 disabled:opacity-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                disabled={loading}
                className="flex-[2] py-2.5 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-sm font-bold hover:bg-red-900/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading
                  ? <><RotateCcw size={14} className="animate-spin" /> Reiniciando…</>
                  : <><Trash2 size={14} /> Sí, reiniciar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
