import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbGetGrupos, dbCreateGrupo } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const grupos = await dbGetGrupos();
  return NextResponse.json(grupos);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Solo el SUPERADMIN puede crear grupos comerciales.' }, { status: 403 });
  }

  try {
    const body = await req.json() as { nombre?: string; color?: string; descripcion?: string };
    const { nombre, color, descripcion } = body;

    if (!nombre?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido.' }, { status: 400 });
    }

    const { id } = await dbCreateGrupo({
      nombre:      nombre.trim().toUpperCase(),
      color:       color ?? '#6366F1',
      descripcion: descripcion?.trim() || undefined,
    });

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error('[POST /api/grupos]', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
