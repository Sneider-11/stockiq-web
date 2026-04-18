import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbLimpiarRegistrosTienda, dbInsertRegistro, dbGetCatalogo, dbGetRegistros } from '@/lib/db';
import type { Clasificacion } from '@/types';

interface Params { params: Promise<{ id: string }> }

function clasificar(stock: number, cantidad: number): Clasificacion {
  if (cantidad === 0)     return 'CERO';
  if (cantidad === stock) return 'SIN_DIF';
  if (cantidad > stock)   return 'SOBRANTE';
  return 'FALTANTE';
}

// POST /api/tienda/[id]/registros — escanear artículo desde web (pistola lectora)
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  const { id } = await params;
  if (session.rol !== 'SUPERADMIN' && !session.tiendas.includes(id)) {
    return NextResponse.json({ error: 'Sin acceso a esta tienda.' }, { status: 403 });
  }

  const body = await req.json() as { itemId: string; cantidad: number; nota?: string };
  const { itemId, cantidad, nota } = body;
  if (!itemId || typeof cantidad !== 'number') {
    return NextResponse.json({ error: 'itemId y cantidad son requeridos.' }, { status: 400 });
  }

  // Buscar artículo en catálogo
  const catalogo = await dbGetCatalogo(id);
  const articulo = catalogo.find(a => a.itemId === itemId);
  if (!articulo) {
    return NextResponse.json({ error: 'Artículo no encontrado en el catálogo.', code: 'NOT_IN_CATALOG' }, { status: 404 });
  }

  // Si ya hay un registro para este itemId en esta tienda, devolverlo para que el cliente decida
  const existentes = await dbGetRegistros(id);
  const yaExiste = existentes.find(r => r.itemId === itemId);

  const registro = await dbInsertRegistro({
    tiendaId:      id,
    itemId:        articulo.itemId,
    descripcion:   articulo.descripcion,
    ubicacion:     articulo.ubicacion,
    stockSistema:  articulo.stock,
    costoUnitario: articulo.costo,
    cantidad,
    nota,
    usuarioNombre: session.nombre,
    clasificacion: clasificar(articulo.stock, cantidad),
  });

  return NextResponse.json({ registro, yaExistia: !!yaExiste });
}

// DELETE /api/tienda/[id]/registros — limpiar TODOS los registros de una tienda
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session || session.rol !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Solo el SUPERADMIN puede limpiar todos los registros.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await dbLimpiarRegistrosTienda(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/tienda/[id]/registros]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
