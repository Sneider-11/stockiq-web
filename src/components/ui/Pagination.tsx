'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page:      number;
  pageSize:  number;
  total:     number;
  basePath:  string; // e.g. "/tienda/abc/registros"
}

export default function Pagination({ page, pageSize, total, basePath }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between mt-5 pt-4 border-t border-zinc-800/60">
      <p className="text-xs text-zinc-500">
        {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={`${basePath}?page=${page - 1}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-600 transition-all"
          >
            <ChevronLeft size={13} />Anterior
          </Link>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/40 border border-zinc-800/40 text-xs font-semibold text-zinc-600 cursor-not-allowed">
            <ChevronLeft size={13} />Anterior
          </span>
        )}

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            // Show pages around current: first, last, current ±1, ellipsis
            const p = totalPages <= 7
              ? i + 1
              : i === 0 ? 1
              : i === 6 ? totalPages
              : page <= 3 ? i + 1
              : page >= totalPages - 2 ? totalPages - 5 + i
              : page - 2 + i;

            const isEllipsis = totalPages > 7 && (
              (i === 1 && p !== 2) || (i === 5 && p !== totalPages - 1)
            );

            if (isEllipsis) {
              return (
                <span key={i} className="px-1.5 text-xs text-zinc-600">…</span>
              );
            }

            return (
              <Link
                key={i}
                href={`${basePath}?page=${p}`}
                className={
                  p === page
                    ? 'w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black bg-violet-600 text-white'
                    : 'w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors'
                }
              >
                {p}
              </Link>
            );
          })}
        </div>

        {page < totalPages ? (
          <Link
            href={`${basePath}?page=${page + 1}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-600 transition-all"
          >
            Siguiente<ChevronRight size={13} />
          </Link>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/40 border border-zinc-800/40 text-xs font-semibold text-zinc-600 cursor-not-allowed">
            Siguiente<ChevronRight size={13} />
          </span>
        )}
      </div>
    </div>
  );
}
