import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbUpdateGrupo, dbDeleteGrupo } from '@/lib/db';

interface Params { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.rol !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Solo el SUPERADMIN puede editar grupos.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json() as { nombre?: string; color?: string; descripcion?: string };

    if (!body.nombre?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido.' }, { status: 400 });
    }

    await dbUpdateGrupo(id, {
      nombre:      body.nombre.trim().toUpperCase(),
      color:       body.color,
      descripcion: body.descripcion?.trim() || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/grupos/[id]]', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.rol !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Solo el SUPERADMIN puede eliminar grupos.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await dbDeleteGrupo(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/grupos/[id]]', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
