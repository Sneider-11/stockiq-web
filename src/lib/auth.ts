import { createHash, createHmac, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import type { SessionUser } from '../types';

const COOKIE_NAME = 'stockiq_session';
const MAX_AGE    = 60 * 60 * 24 * 7; // 7 días

// ─── Clave de firma de sesión ─────────────────────────────────────────────────
// SESSION_SECRET DEBE estar definida en .env.local / variables de Vercel.
// Si no existe, se genera una clave aleatoria por proceso — esto invalida
// todas las sesiones en cada reinicio del servidor. Se emite una advertencia
// clara para que el equipo lo detecte en logs.
const SESSION_SECRET = process.env.SESSION_SECRET ?? (() => {
  const fallback = randomBytes(32).toString('hex');
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '[StockIQ AUTH] ⚠️  SESSION_SECRET no está configurada. ' +
      'Las sesiones se invalidarán en cada deploy. ' +
      'Agrega SESSION_SECRET a las variables de entorno de Vercel.',
    );
  } else {
    console.warn(
      '[StockIQ AUTH] SESSION_SECRET no definida en .env.local — ' +
      'las sesiones se rompen en cada reinicio del servidor dev.',
    );
  }
  return fallback;
})();

// ─── Hash de contraseña ────────────────────────────────────────────────────────
const BCRYPT_ROUNDS = 12;

/** Genera un hash bcrypt para almacenar en BD. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verifica una contraseña contra el hash almacenado.
 * Soporta hashes bcrypt ($2b$) y SHA-256 legacy (hex de 64 chars).
 * Si el hash es legacy y la contraseña es válida, devuelve needsRehash=true
 * para que el caller actualice el hash en BD automáticamente.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<{ valid: boolean; needsRehash: boolean }> {
  // Hash bcrypt — verificación nativa
  if (storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$')) {
    const valid = await bcrypt.compare(password, storedHash);
    return { valid, needsRehash: false };
  }

  // Hash SHA-256 legacy — comparación directa
  const sha256 = createHash('sha256').update(password).digest('hex');
  const valid  = sha256 === storedHash;
  return { valid, needsRehash: valid }; // si es válido, hay que migrar a bcrypt
}

// ─── Serializar / deserializar sesión (firmado con HMAC-SHA256) ───────────────
// Formato: base64url(payload).base64url(hmac-signature)
// El secreto NUNCA viaja en la cookie. Cualquier manipulación o cambio de
// SESSION_SECRET invalida la firma y rechaza la sesión.

function sign(payload: string): string {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
}

function encodeSession(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string): SessionUser | null {
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return null;

    const payload = token.slice(0, dot);
    const sig     = token.slice(dot + 1);

    // Verificación de firma — rechaza cookies manipuladas o con secret distinto
    if (sig !== sign(payload)) return null;

    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as SessionUser;
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
