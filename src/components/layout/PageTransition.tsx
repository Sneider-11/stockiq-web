'use client';

import { usePathname } from 'next/navigation';

/**
 * Envuelve el contenido de cada página con una clave = pathname.
 * Al cambiar la ruta, React desmonta y remonta el contenido,
 * disparando la animación CSS de entrada en cada navegación.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-transition-root h-full w-full">
      {children}
    </div>
  );
}
