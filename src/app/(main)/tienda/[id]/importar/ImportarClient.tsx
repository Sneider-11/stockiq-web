'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { read, utils } from 'xlsx';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { formatCOP } from '@/lib/utils';
import type { Articulo } from '@/types';

interface Props {
  tiendaId:       string;
  tiendaColor:    string;
  catalogoActual: Articulo[];
}

function sanitize(v: string, max: number) { return v.slice(0, max); }

function parseExcel(arrayBuffer: ArrayBuffer): Articulo[] {
  const workbook  = read(arrayBuffer, { type: 'array', cellText: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('El archivo Excel no contiene hojas de cálculo.');
  const sheet = workbook.Sheets[sheetName];
  const rows     = utils.sheet_to_json(sheet, { header: 1, raw: false }) as unknown[][];
  return rows
    .filter(r => (r as string[])[0] && String((r as string[])[0]).trim())
    .map(row => {
      const r = row as string[];
      return {
        itemId:      sanitize(String(r[0] || '').trim(), 60),
        descripcion: sanitize(String(r[1] || '').trim(), 200),
        ubicacion:   sanitize(String(r[2] || '').trim(), 100),
        stock:       Math.max(0, parseInt(String(r[6] || '0').replace(/[^0-9]/g, ''), 10) || 0),
        costo:       Math.max(0, parseFloat(String(r[7] || '0').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0),
      };
    })
    .filter(r => r.itemId.length > 0);
}

export function ImportarClient({ tiendaId, tiendaColor, catalogoActual }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [preview,  setPreview]  = useState<Articulo[]>([]);
  const [fileName, setFileName] = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file: File) => {
    setError('');
    setPreview([]);
    setFileName(file.name);
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo permitido: 10 MB.');
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseExcel(buffer);
      if (!parsed.length) {
        setError('No se encontraron artículos. Verifica que el archivo sea el correcto.');
        return;
      }
      setPreview(parsed);
    } catch {
      setError('Error al leer el archivo. Asegúrate de que sea un .xlsx válido.');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.xlsx')) processFile(file);
    else setError('Solo se aceptan archivos .xlsx');
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleImportar = () => {
    startTransition(async () => {
      const res = await fetch(`/api/tienda/${tiendaId}/catalogo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articulos: preview }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Error al importar.');
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center mb-4">
          <CheckCircle2 size={28} className="text-emerald-400" />
        </div>
        <h2 className="text-lg font-black text-zinc-100 mb-1">¡Catálogo importado!</h2>
        <p className="text-sm text-zinc-500 mb-6">{preview.length} artículos cargados correctamente.</p>
        <button
          onClick={() => { setSuccess(false); setPreview([]); setFileName(''); }}
          className="text-sm text-vlt hover:text-prp transition-colors"
        >
          Importar otro archivo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Advertencia catálogo existente */}
      {catalogoActual.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-950/40 border border-amber-900/60 rounded-xl p-4">
          <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-300">
            Esta tienda ya tiene <strong>{catalogoActual.length} artículos</strong> en el catálogo.
            Al confirmar, será reemplazado completamente por el nuevo archivo.
          </p>
        </div>
      )}

      {/* Formato info */}
      <div className="flex items-start gap-3 bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: tiendaColor + '33' }}
        >
          <FileSpreadsheet size={16} style={{ color: tiendaColor }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-200 mb-1">Formato esperado del Excel TNS</p>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Sin encabezados · <strong className="text-zinc-400">Col A</strong>: Item ID ·{' '}
            <strong className="text-zinc-400">B</strong>: Descripción ·{' '}
            <strong className="text-zinc-400">C</strong>: Ubicación ·{' '}
            <strong className="text-zinc-400">G</strong>: Stock ·{' '}
            <strong className="text-zinc-400">H</strong>: Costo Unitario
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? 'border-prp/60 bg-prp/5'
            : 'border-zinc-700/60 bg-zinc-900/40 hover:border-zinc-600 hover:bg-zinc-900/60'
        }`}
      >
        <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
          <input type="file" accept=".xlsx" className="hidden" onChange={handleFileInput} />
          {fileName ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center mb-3">
                <FileSpreadsheet size={24} className="text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-emerald-400">{fileName}</p>
              <p className="text-xs text-zinc-500 mt-1">Toca para cambiar el archivo</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center mb-3">
                <Upload size={24} className="text-zinc-400" />
              </div>
              <p className="text-sm font-semibold text-zinc-300">
                {isDragging ? 'Suelta el archivo aquí' : 'Arrastra el Excel aquí'}
              </p>
              <p className="text-xs text-zinc-600 mt-1">o haz clic para seleccionarlo · .xlsx</p>
            </>
          )}
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-950/50 border border-red-900/60 rounded-xl px-4 py-3">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-400 flex-1">{error}</p>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-400">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-zinc-100">
              {preview.length} artículos detectados
            </p>
            <p className="text-xs text-zinc-500">Vista previa: primeras 5 filas</p>
          </div>

          <div className="space-y-2 mb-4">
            {preview.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-zinc-800/40 border border-zinc-800/60 px-4 py-3">
                <div className="px-2 py-1 rounded-lg bg-purple-950/60 border border-purple-900/40">
                  <span className="text-[11px] font-bold text-vlt">{item.itemId}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 font-medium truncate">{item.descripcion}</p>
                  <p className="text-[11px] text-zinc-500">
                    {item.ubicacion} · Stock: {item.stock} · {formatCOP(item.costo)}
                  </p>
                </div>
              </div>
            ))}
            {preview.length > 5 && (
              <p className="text-center text-xs text-zinc-600 py-2">
                ... y {preview.length - 5} artículos más
              </p>
            )}
          </div>

          <button
            onClick={handleImportar}
            disabled={isPending}
            className="w-full h-12 rounded-xl font-bold text-white text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${tiendaColor}, ${tiendaColor}cc)`,
              boxShadow: `0 4px 14px ${tiendaColor}44`,
            }}
          >
            {isPending
              ? <Spinner className="text-white" />
              : <><CheckCircle2 size={18} /> Confirmar {preview.length} artículos</>}
          </button>
        </div>
      )}
    </div>
  );
}
