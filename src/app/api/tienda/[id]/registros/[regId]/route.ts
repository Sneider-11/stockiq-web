import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbDeleteRegistro, dbActualizarRegistro } from '@/lib/db';
import type { Clasificacion } from '@/types';

interface Params { params: Promise<{ id: string; regId: string }> }

function clasificar(stock: number, cantidad: number): Clasificacion {
  if (cantidad === 0)     return 'CERO';
  if (cantidad === stock) return 'SIN_DIF';
  if (cantidad > stock)   return 'SOBRANTE';
  return 'FALTANTE';
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.rol)) {
    return NextResponse.json({ error: 'Sin permisos.' }, { status: 403 });
  }

  try {
    const { id, regId } = await params;
    if (session.rol !== 'SUPERADMIN' && !session.tiendas.includes(id)) {
      return NextResponse.json({ error: 'No tienes acceso a esta tienda.' }, { status: 403 });
    }

    const body = await req.json() as { cantidad: number; nota?: string; stockSistema: number };
    if (typeof body.cantidad !== 'number' || body.cantidad < 0 || !Number.isInteger(body.cantidad)) {
      return NextResponse.json({ error: 'Cantidad inválida.' }, { status: 400 });
    }

    await dbActualizarRegistro(regId, {
      cantidad:      body.cantidad,
      nota:          body.nota ?? '',
      usuarioNombre: session.nombre,
      clasificacion: clasificar(body.stockSistema, body.cantidad),
      escaneadoEn:   new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /api/tienda/[id]/registros/[regId]]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.rol)) {
    return NextResponse.json({ error: 'Sin permisos.' }, { status: 403 });
  }

  try {
    const { id, regId } = await params;

    if (session.rol !== 'SUPERADMIN' && !session.tiendas.includes(id)) {
      return NextResponse.json({ error: 'No tienes acceso a esta tienda.' }, { status: 403 });
    }

    await dbDeleteRegistro(regId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/tienda/[id]/registros/[regId]]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
