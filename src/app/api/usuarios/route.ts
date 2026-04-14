import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbGetUsuarios, dbUpsertUsuario } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const usuarios = await dbGetUsuarios();
  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Solo el SUPERADMIN puede crear usuarios.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { nombre, cedula, rol, tiendas, tiendasRoles, grupos, activo } = body as {
      nombre?: string; cedula?: string; rol?: string;
      tiendas?: string[]; tiendasRoles?: Record<string, 'ADMIN' | 'CONTADOR'>;
      grupos?: string[]; activo?: boolean;
    };

    if (!nombre?.trim() || !cedula?.trim() || !rol) {
      return NextResponse.json({ error: 'Nombre, cédula y rol son requeridos.' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    await dbUpsertUsuario({
      id,
      nombre:       nombre.trim().toUpperCase(),
      cedula:       cedula.trim(),
      rol:          rol as 'SUPERADMIN' | 'ADMIN' | 'CONTADOR',
      tiendas:      tiendas      ?? [],
      tiendasRoles: tiendasRoles ?? {},
      grupos:       grupos       ?? [],
      activo:       activo ?? true,
      creadoPor:    session.id,
    });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error('[POST /api/usuarios]', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
