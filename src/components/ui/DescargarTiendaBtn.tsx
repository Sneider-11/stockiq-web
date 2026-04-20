'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, Loader2 } from 'lucide-react';
import type { Registro } from '@/types';

interface Props {
  registros: Registro[];
  tiendaNombre: string;
}

const fDate = (s: string) => new Date(s).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function DescargarTiendaBtn({ registros, tiendaNombre }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    if (registros.length === 0) return;
    setLoading(true);

    try {
      const wb = XLSX.utils.book_new();

      const data = registros.map(r => ({
        'Item ID':          r.itemId,
        'Descripción':      r.descripcion,
        'Ubicación':        r.ubicacion,
        'Stock Sistema':    r.stockSistema,
        'Cantidad Contada': r.cantidad,
        'Diferencia':       r.cantidad - r.stockSistema,
        'Clasificación':    r.clasificacion,
        'Costo Unitario':   r.costoUnitario,
        'Valor Diferencia': Math.abs(r.cantidad - r.stockSistema) * r.costoUnitario,
        'Auditor':          r.usuarioNombre,
        'Fecha':            fDate(r.escaneadoEn),
      }));

      const ws = XLSX.utils.json_to_sheet(data);

      // Ajustar anchos de columna
      ws['!cols'] = [
        { wch: 16 }, { wch: 40 }, { wch: 16 }, { wch: 14 },
        { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 15 },
        { wch: 16 }, { wch: 22 }, { wch: 14 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, tiendaNombre.substring(0, 31));

      const safe = tiendaNombre.replace(/[^a-zA-Z0-9_\-]/g, '_');
      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `reporte_${safe}_${date}.xlsx`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={registros.length === 0 || loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm font-semibold hover:bg-zinc-700 hover:border-zinc-600 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {loading
        ? <Loader2 size={15} className="animate-spin" />
        : <Download size={15} />}
      Descargar reporte
    </button>
  );
}
