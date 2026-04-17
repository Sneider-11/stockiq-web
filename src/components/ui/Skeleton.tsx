/** Atomic shimmer block — base de todos los skeletons de la app */
export function Sk({ className }: { className?: string }) {
  return <div className={`shimmer rounded-xl ${className ?? ''}`} />;
}

/** Skeleton de cabecera de página (breadcrumb + título + ícono) */
export function SkHeader() {
  return (
    <div className="flex items-center gap-3 mb-6">
      <Sk className="w-9 h-9 rounded-xl shrink-0" />
      <div className="space-y-2">
        <Sk className="h-5 w-40" />
        <Sk className="h-3 w-28" />
      </div>
    </div>
  );
}

/** Skeleton de breadcrumb */
export function SkBreadcrumb() {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Sk className="h-3 w-12" />
      <Sk className="h-3 w-2 rounded-sm" />
      <Sk className="h-3 w-20" />
      <Sk className="h-3 w-2 rounded-sm" />
      <Sk className="h-3 w-16" />
    </div>
  );
}

/** Skeleton de fila de tabla */
export function SkTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-zinc-800/40">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Sk className={`h-4 ${i === 0 ? 'w-40' : i === cols - 1 ? 'w-16' : 'w-20'}`} />
        </td>
      ))}
    </tr>
  );
}

/** Skeleton de tabla completa */
export function SkTable({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-zinc-800/60 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800/60 bg-zinc-900/80">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Sk className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Skeleton de tarjeta de tienda/grupo */
export function SkCard() {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
      <Sk className="h-0.5 w-full rounded-none" />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Sk className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Sk className="h-4 w-32" />
            <Sk className="h-3 w-20" />
          </div>
          <Sk className="h-5 w-14 rounded-full" />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Sk className="h-3 w-24" />
            <Sk className="h-3 w-8" />
          </div>
          <Sk className="h-1.5 w-full rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-zinc-800/30 p-2.5 space-y-1.5">
              <Sk className="h-3 w-16" />
              <Sk className="h-5 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
