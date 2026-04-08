import { createHash } from 'crypto';
import { cookies } from 'next/headers';
import type { SessionUser } from '../types';

const COOKIE_NAME = 'stockiq_session';
const MAX_AGE    = 60 * 60 * 24 * 7; // 7 días

// ─── Hash de contraseña ────────────────────────────────────────────────────────
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// ─── Serializar / deserializar sesión ─────────────────────────────────────────
// Serialización simple: base64(JSON) — suficiente para una herramienta interna.
// En producción se recomienda JWT firmado o cifrado.
function encodeSession(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user)).toString('base64');
}

function decodeSession(token: string): SessionUser | null {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString('utf-8')) as SessionUser;
  } catch {
    return null;
  }
}

// ─── Leer sesión actual (Server Component / Route Handler) ────────────────────
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}

// ─── Crear cookie de sesión (Route Handler) ───────────────────────────────────
export function buildSessionCookie(user: SessionUser): {
  name: string; value: string; options: Record<string, unknown>
} {
  return {
    name: COOKIE_NAME,
    value: encodeSession(user),
    options: {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge:   MAX_AGE,
      path:     '/',
    },
  };
}

// ─── Nombre de la cookie para el middleware ───────────────────────────────────
export const SESSION_COOKIE = COOKIE_NAME;
