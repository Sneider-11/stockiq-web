import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbSetModoInventario, dbSaveAuditoriaSnapshot } from '@/lib/db';

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.rol)) {
    return NextResponse.json({ error: 'Sin permisos.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { modo } = await req.json() as { modo?: string };

    if (modo !== 'ONLINE' && modo !== 'OFFLINE') {
      return NextResponse.json({ error: 'Modo inválido.' }, { status: 400 });
    }

    // Al cerrar el inventario, guardar snapshot histórico antes de cambiar el modo
    if (modo === 'OFFLINE') {
      await dbSaveAuditoriaSnapshot(id, session.nombre);
    }

    await dbSetModoInventario(id, modo);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/tiendas/[id]/modo]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
