import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from './lib/auth';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/setup-password', '/api/auth/logout'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas y archivos estáticos
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Verificar cookie de sesión
  const session = request.cookies.get(SESSION_COOKIE);
  if (!session?.value) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
