'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Unlock, CheckCircle2, History, RotateCcw, AlertTriangle } from 'lucide-react';

interface Props { tiendaId: string; tiendaNombre: string; modoActual: 'ONLINE' | 'OFFLINE' }

export function CerrarInventarioBtn({ tiendaId, tiendaNombre, modoActual }: Props) {
  const router = useRouter();
  const [open,    setOpen]    = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const isClosed = modoActual === 'OFFLINE';

  async function confirmar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tiendas/${tiendaId}/modo`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ modo: isClosed ? 'ONLINE' : 'OFFLINE' }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? 'Error al cambiar el modo');
      }
      if (!isClosed) {
        setSuccess(true);
      } else {
        setOpen(false);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  function cerrarModal() {
    setOpen(false);
    setSuccess(false);
    setError(null);
    if (success) router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          isClosed
            ? 'flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-800/50 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/50 hover:border-emerald-700/60 hover:text-emerald-300 text-xs font-semibold transition-all'
            : 'flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-800/50 bg-amber-950/30 text-amber-400 hover:bg-amber-950/50 hover:border-amber-700/60 hover:text-amber-300 text-xs font-semibold transition-all'
        }
        title={isClosed ? 'Reabrir inventario para conteo' : 'Cerrar y guardar inventario en historial'}
      >
        {isClosed ? <Unlock size={13} /> : <Lock size={13} />}
        {isClosed ? 'Abrir inventario' : 'Cerrar inventario'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="modal-card w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl">

            {/* ── Vista de éxito (cierre) ── */}
            {success ? (
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={28} className="text-emerald-400" />
                </div>
                <h2 className="text-base font-black text-zinc-100 mb-2">¡Inventario cerrado!</h2>
                <p className="text-sm text-zinc-400 mb-1">
                  El inventario de <span className="font-semibold text-zinc-200">{tiendaNombre}</span> fue guardado con éxito.
                </p>
                <p className="text-xs text-zinc-500 mb-5">
                  Un snapshot completo quedó registrado en el Historial de Auditorías. Los datos ya se reflejan en Estadísticas.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={cerrarModal}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-700/60 text-zinc-400 text-sm font-semibold hover:bg-zinc-800/40 transition-all"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => { cerrarModal(); router.push(`/tienda/${tiendaId}/historial`); }}
                    className="flex-[2] py-2.5 rounded-xl bg-violet-950/50 border border-violet-800/50 text-violet-300 text-sm font-bold hover:bg-violet-900/40 transition-all flex items-center justify-center gap-2"
                  >
                    <History size={14} />
                    Ver historial
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isClosed ? 'bg-emerald-950/60 border border-emerald-800/50' : 'bg-amber-950/60 border border-amber-800/50'}`}>
                    {isClosed
                      ? <Unlock size={18} className="text-emerald-400" />
                      : <AlertTriangle size={18} className="text-amber-400" />}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-zinc-100">
                      {isClosed ? 'Reabrir inventario' : 'Cerrar inventario'}
                    </h2>
                    <p className="text-xs text-zinc-400">{tiendaNombre}</p>
                  </div>
                </div>

                {isClosed ? (
                  <p className="text-sm text-zinc-300 mb-5">
                    El inventario volverá a estar <span className="font-bold text-emerald-400">ACTIVO</span>. Los contadores podrán continuar escaneando artículos.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-zinc-300 mb-2">
                      Se guardará un <span className="font-bold text-amber-400">snapshot completo</span> en el historial de auditorías y el inventario quedará en modo <span className="font-bold text-red-400">CERRADO</span>.
                    </p>
                    <p className="text-xs text-zinc-500 mb-5">
                      Podrás reabrir el inventario en cualquier momento. El historial es permanente.
                    </p>
                  </>
                )}

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
                    className={`flex-[2] py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2 ${
                      isClosed
                        ? 'bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/40'
                        : 'bg-amber-950/50 border border-amber-800/50 text-amber-300 hover:bg-amber-900/40'
                    }`}
                  >
                    {loading
                      ? <><RotateCcw size={14} className="animate-spin" /> Procesando…</>
                      : isClosed
                        ? <><Unlock size={14} /> Sí, reabrir</>
                        : <><Lock size={14} /> Sí, cerrar inventario</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
