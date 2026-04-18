'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ScanLine, CheckCircle, AlertTriangle, XCircle,
  TrendingDown, TrendingUp, Minus, Package,
  Keyboard, Zap, RotateCcw,
} from 'lucide-react';
import { cn, formatCOP } from '@/lib/utils';
import type { Articulo, Registro, Clasificacion } from '@/types';

interface Props {
  tiendaId:           string;
  tiendaColor:        string;
  catalogo:           Articulo[];
  registrosIniciales: Registro[];
}

interface ScanResult {
  registro:   Registro;
  yaExistia:  boolean;
  timestamp:  number;
}

const CLF_CONFIG: Record<Clasificacion, { label: string; color: string; icon: React.ReactNode }> = {
  SIN_DIF:  { label: 'Sin diferencia', color: 'text-violet-400',  icon: <Minus       size={13} /> },
  FALTANTE: { label: 'Faltante',       color: 'text-red-400',     icon: <TrendingDown size={13} /> },
  SOBRANTE: { label: 'Sobrante',       color: 'text-emerald-400', icon: <TrendingUp   size={13} /> },
  CERO:     { label: 'Cero',           color: 'text-amber-400',   icon: <XCircle      size={13} /> },
};

function clasificar(stock: number, cantidad: number): Clasificacion {
  if (cantidad === 0)     return 'CERO';
  if (cantidad === stock) return 'SIN_DIF';
  if (cantidad > stock)   return 'SOBRANTE';
  return 'FALTANTE';
}

export default function ScannerClient({ tiendaId, tiendaColor, catalogo, registrosIniciales }: Props) {
  const [barcode,   setBarcode]   = useState('');
  const [cantidad,  setCantidad]  = useState('1');
  const [pending,   setPending]   = useState<Articulo | null>(null);   // artículo encontrado esperando confirmación
  const [notFound,  setNotFound]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [recent,    setRecent]    = useState<ScanResult[]>([]);
  const [flash,     setFlash]     = useState<'ok' | 'err' | null>(null);
  const [registros, setRegistros] = useState<Registro[]>(registrosIniciales);

  const barcodeRef  = useRef<HTMLInputElement>(null);
  const cantidadRef = useRef<HTMLInputElement>(null);

  // Construir mapa de catálogo para lookup O(1)
  const catalogoMap = useRef(new Map(catalogo.map(a => [a.itemId, a])));

  // El input de barcode debe estar siempre enfocado (salvo cuando se confirma cantidad)
  useEffect(() => {
    if (!pending) barcodeRef.current?.focus();
    else cantidadRef.current?.select();
  }, [pending]);

  // Refocus al hacer click en cualquier parte del panel principal
  const refocusScan = useCallback(() => {
    if (!pending) barcodeRef.current?.focus();
  }, [pending]);

  const triggerFlash = (type: 'ok' | 'err') => {
    setFlash(type);
    setTimeout(() => setFlash(null), 600);
  };

  // Cuando el barcode gun presiona Enter (o el usuario pulsa Enter)
  const handleBarcodeSubmit = useCallback(() => {
    const code = barcode.trim();
    if (!code) return;

    const articulo = catalogoMap.current.get(code);
    if (articulo) {
      setPending(articulo);
      setNotFound(false);
      setCantidad('1');
    } else {
      setNotFound(true);
      setPending(null);
      triggerFlash('err');
      setTimeout(() => {
        setBarcode('');
        setNotFound(false);
        barcodeRef.current?.focus();
      }, 1800);
    }
  }, [barcode]);

  const handleBarcodeKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeSubmit();
    } else if (e.key === 'Escape') {
      setBarcode('');
      setPending(null);
      setNotFound(false);
    }
  };

  const handleCantidadKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmarScan();
    } else if (e.key === 'Escape') {
      setPending(null);
      setBarcode('');
      barcodeRef.current?.focus();
    }
  };

  const confirmarScan = useCallback(async () => {
    if (!pending || saving) return;
    const qty = parseInt(cantidad, 10);
    if (isNaN(qty) || qty < 0) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/tienda/${tiendaId}/registros`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ itemId: pending.itemId, cantidad: qty }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al guardar');

      const result: ScanResult = {
        registro:  json.registro as Registro,
        yaExistia: json.yaExistia as boolean,
        timestamp: Date.now(),
      };
      setRecent(prev => [result, ...prev].slice(0, 30));
      setRegistros(prev => [json.registro, ...prev]);
      triggerFlash('ok');
    } catch {
      triggerFlash('err');
    } finally {
      setSaving(false);
      setPending(null);
      setBarcode('');
      barcodeRef.current?.focus();
    }
  }, [pending, saving, cantidad, tiendaId]);

  const cancelarPending = () => {
    setPending(null);
    setBarcode('');
    barcodeRef.current?.focus();
  };

  const total      = catalogo.length;
  const escaneados = registros.length;
  const progreso   = total > 0 ? Math.round((escaneados / total) * 100) : 0;
  const progresoColor = progreso >= 80 ? '#10B981' : progreso >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div className="space-y-4">

      {/* ── Flash overlay ── */}
      {flash && (
        <div className={cn(
          'fixed inset-0 pointer-events-none z-50 transition-opacity duration-300',
          flash === 'ok' ? 'bg-emerald-500/10' : 'bg-red-500/10',
        )} />
      )}

      {/* ── Progreso rápido ── */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wide">Progreso de conteo</span>
          <span className="text-sm font-black" style={{ color: progresoColor }}>{progreso}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progreso}%`, backgroundColor: progresoColor, boxShadow: `0 0 8px ${progresoColor}80` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-zinc-600">
          <span>{escaneados} escaneados</span>
          <span>{Math.max(0, total - escaneados)} pendientes de {total}</span>
        </div>
      </div>

      {/* ── Panel principal de escaneo ── */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className={cn(
          'rounded-2xl border p-6 transition-all duration-200 cursor-text',
          pending
            ? 'border-violet-700/60 bg-violet-950/20'
            : notFound
            ? 'border-red-700/60 bg-red-950/20'
            : flash === 'ok'
            ? 'border-emerald-700/60 bg-emerald-950/20'
            : 'border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/60',
        )}
        onClick={refocusScan}
      >
        {/* Estado: esperando escaneo */}
        {!pending && !notFound && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: tiendaColor + '22', border: `1px solid ${tiendaColor}44` }}
              >
                <ScanLine size={18} style={{ color: tiendaColor }} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-100">Listo para escanear</p>
                <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <Keyboard size={10} />
                  Escanea el código o escríbelo y presiona Enter
                </p>
              </div>
            </div>

            <div className="relative">
              <input
                ref={barcodeRef}
                type="text"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                onKeyDown={handleBarcodeKey}
                placeholder="Código de barras..."
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-prp/40 focus:border-prp/50 font-mono tracking-widest transition-all"
              />
              {barcode && (
                <button
                  onClick={e => { e.stopPropagation(); setBarcode(''); barcodeRef.current?.focus(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                >
                  <XCircle size={15} />
                </button>
              )}
            </div>

            {barcode.trim() && (
              <button
                onClick={e => { e.stopPropagation(); handleBarcodeSubmit(); }}
                className="w-full py-2.5 rounded-xl bg-prp/20 border border-prp/30 text-vlt text-sm font-bold hover:bg-prp/30 transition-all"
              >
                Buscar artículo
              </button>
            )}
          </div>
        )}

        {/* Estado: artículo no encontrado */}
        {notFound && (
          <div className="flex items-center gap-4 py-2">
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/50 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-400">Artículo no encontrado</p>
              <p className="text-xs text-zinc-500 font-mono">Código: <span className="text-zinc-300">{barcode}</span></p>
              <p className="text-[11px] text-zinc-600 mt-0.5">No está en el catálogo de esta tienda</p>
            </div>
          </div>
        )}

        {/* Estado: artículo encontrado → confirmar cantidad */}
        {pending && (
          <div className="space-y-4">
            {/* Info artículo */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center shrink-0">
                <Package size={16} className="text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-100 truncate">{pending.descripcion}</p>
                <p className="text-[11px] text-zinc-500 font-mono">{pending.itemId}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-[10px] text-zinc-500">Ubic: <span className="text-zinc-400">{pending.ubicacion || '—'}</span></span>
                  <span className="text-[10px] text-zinc-500">Sistema: <span className="text-zinc-300 font-bold">{pending.stock}</span></span>
                  <span className="text-[10px] text-zinc-500">Costo: <span className="text-zinc-300">{formatCOP(pending.costo)}</span></span>
                </div>
              </div>
            </div>

            {/* Preview clasificación en tiempo real */}
            {(() => {
              const qty = parseInt(cantidad, 10);
              const clf = isNaN(qty) || qty < 0 ? null : clasificar(pending.stock, qty);
              const cfg = clf ? CLF_CONFIG[clf] : null;
              return cfg ? (
                <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/40 border border-zinc-700/40')}>
                  <span className={cfg.color}>{cfg.icon}</span>
                  <span className={cn('text-xs font-bold', cfg.color)}>{cfg.label}</span>
                  {!isNaN(qty) && qty !== pending.stock && (
                    <span className="text-xs text-zinc-500 ml-auto">
                      Diferencia: <span className={cn('font-bold', qty < pending.stock ? 'text-red-400' : 'text-emerald-400')}>
                        {qty - pending.stock > 0 ? '+' : ''}{qty - pending.stock}
                      </span>
                    </span>
                  )}
                </div>
              ) : null;
            })()}

            {/* Input cantidad */}
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-wide font-semibold mb-1.5">
                Cantidad contada
              </label>
              <input
                ref={cantidadRef}
                type="number"
                min="0"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                onKeyDown={handleCantidadKey}
                className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-lg font-black text-zinc-100 focus:outline-none focus:ring-2 focus:ring-prp/40 focus:border-prp/50 transition-all text-center"
              />
              <p className="text-[10px] text-zinc-600 mt-1 text-center">Presiona Enter para confirmar · Escape para cancelar</p>
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              <button
                onClick={cancelarPending}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700/60 text-zinc-400 text-sm font-semibold hover:bg-zinc-800/40 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarScan}
                disabled={saving}
                className="flex-[2] py-2.5 rounded-xl bg-prp/20 border border-prp/40 text-vlt text-sm font-bold hover:bg-prp/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {saving ? <RotateCcw size={14} className="animate-spin" /> : <Zap size={14} />}
                {saving ? 'Guardando…' : 'Confirmar escaneo'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Escaneos recientes ── */}
      {recent.length > 0 && (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={13} className="text-emerald-400" />
              <span className="text-xs font-bold text-zinc-300">Escaneos de esta sesión</span>
            </div>
            <span className="text-[10px] text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded-full">{recent.length}</span>
          </div>
          <div className="divide-y divide-zinc-800/40 max-h-80 overflow-y-auto">
            {recent.map((r, i) => {
              const cfg = CLF_CONFIG[r.registro.clasificacion];
              return (
                <div
                  key={r.timestamp}
                  className={cn('flex items-center gap-3 px-4 py-3 transition-colors', i === 0 && 'bg-zinc-800/20')}
                >
                  <span className={cn('shrink-0', cfg.color)}>{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{r.registro.descripcion}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{r.registro.itemId}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-xs font-bold', cfg.color)}>{cfg.label}</p>
                    <p className="text-[10px] text-zinc-600">
                      {r.registro.cantidad} <span className="text-zinc-700">/ {r.registro.stockSistema}</span>
                    </p>
                  </div>
                  {r.yaExistia && (
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded shrink-0">
                      dup.
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Hint de uso ── */}
      <div className="rounded-xl border border-zinc-800/40 bg-zinc-900/20 px-4 py-3">
        <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wide mb-2">Instrucciones de uso</p>
        <ul className="space-y-1 text-[11px] text-zinc-500">
          <li>• <span className="text-zinc-400">Pistola lectora:</span> apunta y escanea — el código se captura automáticamente</li>
          <li>• <span className="text-zinc-400">Teclado:</span> escribe el código y presiona <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono text-[10px]">Enter</kbd></li>
          <li>• En el campo de cantidad presiona <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono text-[10px]">Enter</kbd> para confirmar o <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono text-[10px]">Esc</kbd> para cancelar</li>
          <li>• Los registros se guardan en tiempo real y se ven en la app móvil</li>
        </ul>
      </div>
    </div>
  );
}
