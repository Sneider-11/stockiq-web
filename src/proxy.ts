import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Nombre de la cookie — debe coincidir con COOKIE_NAME en src/lib/auth.ts
// No importamos auth.ts porque usa next/headers (Node.js), incompatible con Edge Runtime.
const SESSION_COOKIE = 'stockiq_session';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/setup-password', '/api/auth/logout'];

/**
 * Valida la firma HMAC de la cookie usando Web Crypto API.
 * El proxy corre en Edge Runtime — se usa `globalThis.crypto.subtle`
 * (Web Crypto, siempre disponible en Edge, NO Node.js crypto).
 */
async function isValidSession(token: string): Promise<boolean> {
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret) return false;

    const dot = token.lastIndexOf('.');
    if (dot === -1) return false;

    const payload  = token.slice(0, dot);
    const sigB64   = token.slice(dot + 1);

    const keyData = new TextEncoder().encode(secret);
    const key = await globalThis.crypto.subtle.importKey(
      'raw', keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const b64standard = sigB64.replace(/-/g, '+').replace(/_/g, '/');
    const sigBytes    = Uint8Array.from(atob(b64standard), c => c.charCodeAt(0));

    return await globalThis.crypto.subtle.verify(
      'HMAC', key, sigBytes, new TextEncoder().encode(payload),
    );
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  if (!sessionCookie?.value || !(await isValidSession(sessionCookie.value))) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
