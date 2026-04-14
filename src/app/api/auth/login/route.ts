import { NextRequest, NextResponse } from 'next/server';
import { dbGetUsuarioByCedula } from '@/lib/db';
import { hashPassword, buildSessionCookie } from '@/lib/auth';
import type { SessionUser } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { cedula, password } = await req.json() as { cedula?: string; password?: string };

    if (!cedula || !password) {
      return NextResponse.json({ error: 'Cédula y contraseña son requeridas.' }, { status: 400 });
    }

    const usuario = await dbGetUsuarioByCedula(cedula.trim());

    if (!usuario) {
      return NextResponse.json({ error: 'Cédula no encontrada.' }, { status: 401 });
    }

    if (usuario.activo === false) {
      return NextResponse.json({ error: 'Tu cuenta está inactiva. Contacta al administrador.' }, { status: 403 });
    }

    // Usuario sin contraseña web — primera vez, debe crearla
    if (!usuario.passWeb) {
      return NextResponse.json(
        { requireSetup: true, userId: usuario.id, nombre: usuario.nombre },
        { status: 200 },
      );
    }

    // Verificar contraseña
    const hashed = hashPassword(password);
    if (hashed !== usuario.passWeb) {
      return NextResponse.json({ error: 'Contraseña incorrecta.' }, { status: 401 });
    }

    // Crear sesión
    const sessionUser: SessionUser = {
      id:           usuario.id,
      cedula:       usuario.cedula,
      nombre:       usuario.nombre,
      rol:          usuario.rol,
      tiendas:      usuario.tiendas,
      tiendasRoles: usuario.tiendasRoles,
      grupos:       usuario.grupos ?? [],
    };

    const cookie = buildSessionCookie(sessionUser);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof response.cookies.set>[2]);
    return response;
  } catch (err) {
    console.error('[auth/login]', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
