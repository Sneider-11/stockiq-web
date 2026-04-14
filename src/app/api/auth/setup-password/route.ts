import { NextRequest, NextResponse } from 'next/server';
import { dbGetUsuarioByCedula, dbSetPassWeb } from '@/lib/db';
import { hashPassword, buildSessionCookie } from '@/lib/auth';
import type { SessionUser } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { userId, cedula, newPassword } = await req.json() as {
      userId?: string; cedula?: string; newPassword?: string;
    };

    if (!userId || !cedula || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Datos inválidos. La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 },
      );
    }

    const usuario = await dbGetUsuarioByCedula(cedula.trim());
    if (!usuario || usuario.id !== userId) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 401 });
    }

    // Solo permitir si aún no tiene contraseña web
    if (usuario.passWeb) {
      return NextResponse.json(
        { error: 'Este usuario ya tiene contraseña web.' },
        { status: 409 },
      );
    }

    await dbSetPassWeb(userId, hashPassword(newPassword));

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
    console.error('[auth/setup-password]', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
