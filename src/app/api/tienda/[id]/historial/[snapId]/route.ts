import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbDeleteAuditoriaSnapshot } from '@/lib/db';

interface Params { params: Promise<{ id: string; snapId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.rol)) {
    return NextResponse.json({ error: 'Sin permisos.' }, { status: 403 });
  }

  try {
    const { id, snapId } = await params;
    if (session.rol !== 'SUPERADMIN' && !session.tiendas.includes(id)) {
      return NextResponse.json({ error: 'No tienes acceso a esta tienda.' }, { status: 403 });
    }
    await dbDeleteAuditoriaSnapshot(snapId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/tienda/[id]/historial/[snapId]]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
