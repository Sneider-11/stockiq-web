import { NextRequest, NextResponse } from 'next/server';
import { dbGetUsuarioByCedula, dbSetPassWeb } from '@/lib/db';
import { verifyPassword, hashPassword, buildSessionCookie } from '@/lib/auth';
import { recordFailedAttempt, clearAttempts, secondsUntilUnlock } from '@/lib/rateLimiter';
import type { SessionUser } from '@/types';

/** Derive a stable key for rate limiting: prefer real IP, fallback to 'unknown'. */
function getClientKey(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  const key = getClientKey(req);

  // ── Pre-check: is this IP already locked out? ────────────────────────────────
  const wait = secondsUntilUnlock(key);
  if (wait > 0) {
    const mins = Math.ceil(wait / 60);
    return NextResponse.json(
      { error: `Demasiados intentos fallidos. Intenta de nuevo en ${mins} minuto${mins !== 1 ? 's' : ''}.` },
      { status: 429 },
    );
  }

  try {
    const { cedula, password } = await req.json() as { cedula?: string; password?: string };

    if (!cedula || !password) {
      return NextResponse.json({ error: 'Cédula y contraseña son requeridas.' }, { status: 400 });
    }

    const usuario = await dbGetUsuarioByCedula(cedula.trim());

    if (!usuario) {
      // Count as failed attempt (prevents user enumeration timing differences)
      recordFailedAttempt(key);
      return NextResponse.json({ error: 'Cédula no encontrada.' }, { status: 401 });
    }

    if (usuario.activo === false) {
      return NextResponse.json({ error: 'Tu cuenta está inactiva. Contacta al administrador.' }, { status: 403 });
    }

    // Usuario sin contraseña web — primera vez, debe crearla
    if (!usuario.passWeb) {
      clearAttempts(key);
      return NextResponse.json(
        { requireSetup: true, userId: usuario.id, nombre: usuario.nombre },
        { status: 200 },
      );
    }

    // Verificar contraseña (soporta bcrypt y SHA-256 legacy)
    const { valid, needsRehash } = await verifyPassword(password, usuario.passWeb);

    if (!valid) {
      const isNowLocked = recordFailedAttempt(key);
      const remaining   = isNowLocked ? 15 : null;
      return NextResponse.json(
        {
          error: isNowLocked
            ? `Contraseña incorrecta. Cuenta bloqueada por ${remaining} minutos por exceso de intentos.`
            : 'Contraseña incorrecta.',
        },
        { status: 401 },
      );
    }

    // Login exitoso — limpiar contador
    clearAttempts(key);

    // Migración automática: si el hash es SHA-256 legacy, actualizarlo a bcrypt
    if (needsRehash) {
      const newHash = await hashPassword(password);
      await dbSetPassWeb(usuario.id, newHash);
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
