import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbGetTiendas, dbUpsertTienda } from '@/lib/db';
import type { Tienda } from '@/types';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const tiendas = await dbGetTiendas();
  return NextResponse.json(tiendas);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Solo el SUPERADMIN puede crear tiendas.' }, { status: 403 });
  }

  try {
    const body = await req.json() as { nombre?: string; nit?: string; color?: string };
    const { nombre, nit, color } = body;

    if (!nombre?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido.' }, { status: 400 });
    }

    const tienda: Tienda = {
      id:    crypto.randomUUID(),
      nombre: nombre.trim().toUpperCase(),
      icono:  'storefront',
      color:  color ?? '#6366F1',
      nit:    nit?.trim() || undefined,
    };

    await dbUpsertTienda(tienda, 'ONLINE');
    return NextResponse.json({ ok: true, id: tienda.id });
  } catch (err) {
    console.error('[POST /api/tiendas]', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
