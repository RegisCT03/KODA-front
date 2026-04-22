'use client';

/**
 * page.tsx — Página de autenticación de AWOS
 *
 * Layout: 2 columnas en desktop (decorativa | formulario), 1 columna en móvil.
 *
 * Estructura:
 *  - Columna izquierda: DecorativePanel (marca de agua, terminal mock, badge)
 *  - Columna derecha: tabs Login/Register con animación de transición
 *
 * Los formularios usan React Hook Form + Zod para validación UI.
 * No hay llamadas a API — todo es mock con setTimeout.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DecorativePanel } from '@/components/login/DecorativePanel';
import { LoginForm }       from '@/components/login/LoginForm';
import { RegisterForm }    from '@/components/login/RegisterForm';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ActiveTab = 'login' | 'register';

// ─── Subcomponente: Tabs de navegación ───────────────────────────────────────

interface AuthTabsProps {
  active: ActiveTab;
  onChange: (tab: ActiveTab) => void;
}

/**
 * Tabs "Login" | "Register" con underline animado via framer-motion layoutId.
 * El indicador se desliza suavemente entre tabs al cambiar.
 */
function AuthTabs({ active, onChange }: AuthTabsProps) {
  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'login',    label: 'Ingresar'   },
    { id: 'register', label: 'Registrarse' },
  ];

  return (
    <div className="flex gap-6 border-b" style={{ borderColor: '#1a1a1a' }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={[
            'relative pb-3 font-mono text-sm tracking-wider transition-colors duration-150',
            'focus-visible:outline-none',
            active === tab.id ? 'text-[#00ffff]' : 'text-[#444444] hover:text-[#888888]',
          ].join(' ')}
          aria-selected={active === tab.id}
          role="tab"
        >
          {tab.label}

          {/* Underline animado — se desliza entre tabs con layoutId */}
          {active === tab.id && (
            <motion.span
              layoutId="auth-tab-underline"
              className="absolute bottom-0 left-0 h-px w-full"
              style={{
                backgroundColor: '#00ffff',
                boxShadow: '0 0 6px rgba(0,255,255,0.5)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Subcomponente: Contenedor animado del formulario ────────────────────────

interface AnimatedFormProps {
  activeTab: ActiveTab;
}

/**
 * Envuelve el formulario activo con animación de entrada/salida.
 * Al cambiar de tab:
 *  - Exit: desliza hacia la izquierda (x: -20) + fade out
 *  - Enter: entra desde la derecha (x: +20) + fade in
 */
function AnimatedForm({ activeTab }: AnimatedFormProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        // Entrada desde la derecha
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0  }}
        // Salida hacia la izquierda
        exit={{ opacity: 0, x: -20   }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function LoginPage() {
  // Tab activo: 'login' por defecto
  const [activeTab, setActiveTab] = useState<ActiveTab>('login');

  return (
    /*
     * Layout de 2 columnas:
     *  - lg:grid-cols-2 → 50/50 en desktop
     *  - 1 columna en móvil (columna decorativa oculta)
     */
    <div className="grid min-h-screen lg:grid-cols-2">

      {/* ── Columna izquierda: panel decorativo (oculto en móvil) ── */}
      <DecorativePanel />

      {/* ── Columna derecha: formulario de autenticación ── */}
      <div
        className="flex min-h-screen flex-col items-center justify-center px-6 py-16 sm:px-12"
        style={{
          backgroundColor: '#000000',
          // Glow ambiental muy sutil de fondo
          boxShadow: 'inset 0 0 80px rgba(0,255,255,0.03)',
        }}
      >
        <div className="w-full max-w-sm">

          {/* ── Logo KODA pequeño ── */}
          <div className="mb-10 flex flex-col gap-2">
            <span
              className="font-mono text-lg font-bold tracking-[0.3em]"
              style={{
                color: '#00ffff',
                textShadow: '0 0 10px rgba(0,255,255,0.4)',
              }}
            >
              KODA
            </span>
            <p className="font-mono text-xs" style={{ color: '#333333' }}>
              {activeTab === 'login'
                ? 'Ingresa a tu cuenta para continuar.'
                : 'Crea tu cuenta gratuita.'}
            </p>          </div>

          {/* ── Tabs de navegación ── */}
          <div className="mb-8" role="tablist" aria-label="Modo de autenticación">
            <AuthTabs active={activeTab} onChange={setActiveTab} />
          </div>

          {/* ── Formulario animado ── */}
          {/*
           * AnimatedForm maneja la transición entre Login y Register.
           * Los campos hacen exit hacia la izquierda y enter desde la derecha.
           */}
          <AnimatedForm activeTab={activeTab} />

          {/* ── Enlace alternativo ── */}
          <p
            className="mt-8 text-center font-mono text-xs"
            style={{ color: '#333333' }}
          >
            {activeTab === 'login' ? (
              <>
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-[#00ffff] underline-offset-2 hover:underline focus-visible:outline-none"
                >
                  Regístrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-[#00ffff] underline-offset-2 hover:underline focus-visible:outline-none"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
