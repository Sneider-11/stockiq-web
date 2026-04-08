import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbUpsertCatalogo } from '@/lib/db';
import type { Articulo } from '@/types';

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  if (user.rol === 'CONTADOR') return NextResponse.json({ error: 'Sin permisos.' }, { status: 403 });

  const { id } = await params;
  const { articulos } = await req.json() as { articulos?: Articulo[] };

  if (!Array.isArray(articulos) || articulos.length === 0) {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
  }

  // Validar y sanitizar
  const sanitized: Articulo[] = articulos.map(a => ({
    itemId:      String(a.itemId      || '').slice(0, 60),
    descripcion: String(a.descripcion || '').slice(0, 200),
    ubicacion:   String(a.ubicacion   || '').slice(0, 100),
    stock:       Math.max(0, Number(a.stock)  || 0),
    costo:       Math.max(0, Number(a.costo)  || 0),
  })).filter(a => a.itemId.length > 0);

  await dbUpsertCatalogo(id, sanitized);
  return NextResponse.json({ ok: true, count: sanitized.length });
}
