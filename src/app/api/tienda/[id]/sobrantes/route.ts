import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbCreateSobrante } from '@/lib/db';

interface Params { params: Promise<{ id: string }> }

// POST — crear sobrante desde la web
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || !['SUPERADMIN', 'ADMIN'].includes(session.rol)) {
    return NextResponse.json({ error: 'Sin permisos.' }, { status: 403 });
  }

  try {
    const { id: tiendaId } = await params;

    // Multi-tenancy: ADMIN solo puede agregar a sus tiendas asignadas
    if (session.rol !== 'SUPERADMIN' && !session.tiendas.includes(tiendaId)) {
      return NextResponse.json({ error: 'No tienes acceso a esta tienda.' }, { status: 403 });
    }

    const body = await req.json() as {
      codigo?: string;
      descripcion?: string;
      ubicacion?: string;
      precio?: unknown;
      cantidad?: unknown;
    };

    const codigo      = (body.codigo      ?? '').toString().trim();
    const descripcion = (body.descripcion ?? '').toString().trim();
    const ubicacion   = (body.ubicacion   ?? '').toString().trim();
    const precio      = Number(body.precio   ?? 0);
    const cantidad    = Math.max(1, Math.round(Number(body.cantidad ?? 1)));

    if (!descripcion) {
      return NextResponse.json({ error: 'La descripción es obligatoria.' }, { status: 400 });
    }
    if (isNaN(precio) || precio < 0) {
      return NextResponse.json({ error: 'Precio inválido.' }, { status: 400 });
    }

    const sobrante = await dbCreateSobrante({
      tiendaId,
      codigo,
      descripcion,
      ubicacion,
      precio,
      cantidad,
      usuarioNombre: session.nombre,
    });

    return NextResponse.json(sobrante, { status: 201 });
  } catch (err) {
    console.error('[POST /api/tienda/[id]/sobrantes]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
