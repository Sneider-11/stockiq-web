import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbAsignarTiendaAGrupo } from '@/lib/db';

interface Params { params: Promise<{ id: string }> }

// PATCH /api/grupos/[id]/tiendas
// body: { tiendaId: string, accion: 'asignar' | 'quitar' }
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.rol !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Solo el SUPERADMIN puede mover tiendas.' }, { status: 403 });
  }

  try {
    const { id: grupoId } = await params;
    const body = await req.json() as { tiendaId?: string; accion?: 'asignar' | 'quitar' };

    if (!body.tiendaId) {
      return NextResponse.json({ error: 'tiendaId es requerido.' }, { status: 400 });
    }

    const nuevoGrupoId = body.accion === 'quitar' ? null : grupoId;
    await dbAsignarTiendaAGrupo(body.tiendaId, nuevoGrupoId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/grupos/[id]/tiendas]', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
