'use client';

/**
 * ProtectedRoute.tsx
 * Wrapper que protege páginas que requieren autenticación.
 *
 * Comportamiento:
 *  - Si el usuario está autenticado → renderiza los children normalmente
 *  - Si no está autenticado → muestra pantalla con alien animado y botón de login
 *  - Mientras verifica → pantalla negra sin flash
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Componente de pantalla de acceso denegado con el alien de Lottie
function AccessDeniedScreen() {
  const router = useRouter();

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-8 px-6"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Script de Lottie — se carga una sola vez */}
      <script
        src="https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.10/dist/dotlottie-wc.js"
        type="module"
        async
      />

      {/* Alien animado */}
      {/* @ts-expect-error — dotlottie-wc es un web component externo sin tipos */}
      <dotlottie-wc
        src="https://lottie.host/37bf13b7-c3f2-4aa3-8fa6-0d706cd2a16e/v4egms5io1.lottie"
        style={{ width: '280px', height: '280px' }}
        autoplay
        loop
      />

      {/* Mensaje */}
      <div className="flex flex-col items-center gap-3 text-center">
        <h2
          className="font-mono text-xl font-bold tracking-widest uppercase"
          style={{ color: '#00ffff', textShadow: '0 0 12px rgba(0,255,255,0.4)' }}
        >
          Acceso restringido
        </h2>
        <p className="font-mono text-sm" style={{ color: '#444444' }}>
          Necesitas iniciar sesión para ver el dashboard.
        </p>
        <p className="font-mono text-xs" style={{ color: '#333333' }}>
          El alien también quiere que te registres.
        </p>
      </div>

      {/* Botones */}
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <button
          onClick={() => router.push('/login')}
          className="rounded border px-6 py-2.5 font-mono text-sm font-bold tracking-widest uppercase transition-all duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff]"
          style={{
            borderColor: '#00ffff',
            color: '#00ffff',
            backgroundColor: 'rgba(0,255,255,0.06)',
            boxShadow: '0 0 12px rgba(0,255,255,0.15)',
          }}
        >
          Iniciar sesión →
        </button>
        <button
          onClick={() => router.push('/login')}
          className="font-mono text-xs transition-colors hover:text-[#00ffff] focus-visible:outline-none"
          style={{ color: '#333333' }}
        >
          ¿No tienes cuenta? Regístrate
        </button>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const initAuth = useStore((s) => s.initAuth);

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    initAuth();
    setChecking(false);
  }, [initAuth]);

  // Mientras verifica, pantalla negra sin flash
  if (checking) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: '#000000' }}
      >
        <span className="font-mono text-xs tracking-widest" style={{ color: '#1a1a1a' }}>
          •••
        </span>
      </div>
    );
  }

  // No autenticado → mostrar pantalla con alien
  if (!isAuthenticated) {
    return <AccessDeniedScreen />;
  }

  // Autenticado → renderizar contenido protegido
  return <>{children}</>;
}
