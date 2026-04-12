import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { dbGetUsuarioByCedula, dbSetPassWeb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await req.json() as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Contraseña actual y nueva son requeridas.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
    }

    const usuario = await dbGetUsuarioByCedula(session.cedula);
    if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });

    if (!usuario.passWeb) {
      return NextResponse.json({ error: 'Debes configurar tu contraseña desde el primer inicio de sesión.' }, { status: 400 });
    }

    const hashedCurrent = hashPassword(currentPassword);
    if (hashedCurrent !== usuario.passWeb) {
      return NextResponse.json({ error: 'La contraseña actual es incorrecta.' }, { status: 401 });
    }

    await dbSetPassWeb(usuario.id, hashPassword(newPassword));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/auth/change-password]', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
