import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbConfirmarSobrante, dbDeleteSobrante } from '@/lib/db';

interface Params { params: Promise<{ id: string; sobId: string }> }

// PATCH — confirmar sobrante
export async function PATCH(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.rol)) {
    return NextResponse.json({ error: 'Sin permisos.' }, { status: 403 });
  }

  try {
    const { sobId } = await params;
    await dbConfirmarSobrante(sobId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/tienda/[id]/sobrantes/[sobId]]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}

// DELETE — eliminar sobrante
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.rol)) {
    return NextResponse.json({ error: 'Sin permisos.' }, { status: 403 });
  }

  try {
    const { sobId } = await params;
    await dbDeleteSobrante(sobId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/tienda/[id]/sobrantes/[sobId]]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
