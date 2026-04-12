import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbDeleteRegistro } from '@/lib/db';

interface Params { params: Promise<{ id: string; regId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.rol)) {
    return NextResponse.json({ error: 'Sin permisos.' }, { status: 403 });
  }

  try {
    const { regId } = await params;
    await dbDeleteRegistro(regId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/tienda/[id]/registros/[regId]]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
