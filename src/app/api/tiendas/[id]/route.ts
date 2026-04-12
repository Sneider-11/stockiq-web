import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbUpsertTienda, dbDeleteTienda, dbGetTiendas } from '@/lib/db';

interface Params { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.rol !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Sin permisos.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json() as { nombre?: string; nit?: string; color?: string };
    const { nombre, nit, color } = body;

    if (!nombre?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido.' }, { status: 400 });
    }

    // Obtener tienda actual para conservar modoInventario e icono
    const tiendas = await dbGetTiendas();
    const actual = tiendas.find(t => t.id === id);
    if (!actual) return NextResponse.json({ error: 'Tienda no encontrada.' }, { status: 404 });

    await dbUpsertTienda({
      ...actual,
      nombre: nombre.trim().toUpperCase(),
      nit:    nit?.trim() || undefined,
      color:  color ?? actual.color,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/tiendas/[id]]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.rol !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Sin permisos.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await dbDeleteTienda(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/tiendas/[id]]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
