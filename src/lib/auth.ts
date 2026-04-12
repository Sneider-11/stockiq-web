import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import type { SessionUser } from '../types';

const COOKIE_NAME = 'stockiq_session';
const MAX_AGE    = 60 * 60 * 24; // 1 día

// ─── Nonce de proceso ─────────────────────────────────────────────────────────
// Cambia cada vez que el servidor arranca (a menos que SESSION_SECRET esté definida).
// Esto invalida todas las cookies existentes al reiniciar el servidor.
const SERVER_NONCE = process.env.SESSION_SECRET ?? randomBytes(16).toString('hex');

// ─── Hash de contraseña ────────────────────────────────────────────────────────
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// ─── Serializar / deserializar sesión ─────────────────────────────────────────
function encodeSession(user: SessionUser): string {
  return Buffer.from(JSON.stringify({ ...user, _n: SERVER_NONCE })).toString('base64');
}

function decodeSession(token: string): SessionUser | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8')) as SessionUser & { _n?: string };
    // Si el nonce no coincide, la sesión es de otro arranque del servidor → inválida
    if (decoded._n !== SERVER_NONCE) return null;
    const { _n, ...user } = decoded;
    return user as SessionUser;
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
