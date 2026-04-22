'use client';

/**
 * ProtectedRoute.tsx
 * Wrapper que protege páginas que requieren autenticación.
 *
 * Comportamiento:
 *  - Si el usuario está autenticado → renderiza los children normalmente
 *  - Si no está autenticado → redirige a /login
 *  - Mientras verifica → muestra un estado de carga mínimo
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const initAuth = useStore((s) => s.initAuth);

  // Estado local para evitar flash de contenido antes de verificar auth
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Restaurar sesión desde localStorage
    initAuth();
    setChecking(false);
  }, [initAuth]);

  useEffect(() => {
    // Una vez que terminamos de verificar, redirigir si no está autenticado
    if (!checking && !isAuthenticated) {
      router.replace('/login');
    }
  }, [checking, isAuthenticated, router]);

  // Mientras verifica, mostrar pantalla en negro (sin flash de contenido)
  if (checking) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: '#000000' }}
      >
        <span
          className="font-mono text-xs tracking-widest"
          style={{ color: '#222222' }}
        >
          verificando sesión...
        </span>
      </div>
    );
  }

  // Si no está autenticado, no renderizar nada (la redirección ya está en curso)
  if (!isAuthenticated) {
    return null;
  }

  // Autenticado: renderizar el contenido protegido
  return <>{children}</>;
}
