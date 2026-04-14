import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbUpsertUsuario, dbDeleteUsuario } from '@/lib/db';

interface Params { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.rol !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Sin permisos.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { nombre, cedula, rol, tiendas, tiendasRoles, grupos, activo, creadoPor } = body;

    if (!nombre?.trim() || !cedula?.trim() || !rol) {
      return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 });
    }

    await dbUpsertUsuario({
      id,
      nombre:       nombre.trim().toUpperCase(),
      cedula:       cedula.trim(),
      rol,
      tiendas:      tiendas      ?? [],
      tiendasRoles: tiendasRoles ?? {},
      grupos:       grupos       ?? [],
      activo:       activo ?? true,
      creadoPor,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/usuarios/[id]]', err);
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
    if (id === session.id) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo.' }, { status: 400 });
    }
    await dbDeleteUsuario(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/usuarios/[id]]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
