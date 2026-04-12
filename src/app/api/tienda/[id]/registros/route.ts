import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbLimpiarRegistrosTienda } from '@/lib/db';

interface Params { params: Promise<{ id: string }> }

// DELETE /api/tienda/[id]/registros — limpiar TODOS los registros de una tienda
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.rol !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Solo el SUPERADMIN puede limpiar todos los registros.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await dbLimpiarRegistrosTienda(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/tienda/[id]/registros]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
