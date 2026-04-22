'use client';

/**
 * Navbar.tsx
 * Barra de navegación fija superior para AWOS.
 *
 * Características:
 *  - Glassmorphism oscuro: fondo rgba(0,0,0,0.8) + backdrop-blur
 *  - Borde inferior cian muy sutil
 *  - Logo "KODA" en fuente mono con glow cian
 *  - Links "Test" y "Dashboard" con indicador underline animado (layoutId)
 *  - Estado sin usuario: botón "Login" (CyberButton ghost)
 *  - Estado con usuario: avatar con iniciales + nombre + botón "Logout"
 *  - Responsive: hamburger en móvil con menú desplegable animado
 *
 * Conectado al store de Zustand para leer el usuario real y ejecutar logout.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { CyberButton } from '@/components/ui/CyberButton';
import { useStore } from '@/lib/store';

// ─── Links de navegación ──────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Práctica',   href: '/test'      },
  { label: 'Dashboard',  href: '/dashboard' },
] as const;

// ─── Subcomponente: Logo ──────────────────────────────────────────────────────

function NavLogo() {
  return (
    <Link
      href="/"
      className="font-mono text-xl font-bold tracking-[0.2em] text-[#00ffff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff]"
      style={{ textShadow: '0 0 10px rgba(0,255,255,0.5)' }}
      aria-label="KODA — Ir al inicio"
    >
      KODA
    </Link>
  );
}

// ─── Subcomponente: NavLink con underline animado ─────────────────────────────

interface NavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

function NavLink({ href, label, isActive, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        'relative pb-1 font-mono text-sm tracking-wider transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff]',
        isActive ? 'text-[#00ffff]' : 'text-[#444444] hover:text-[#00ffff]',
      ].join(' ')}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}

      {/* Indicador underline animado — solo visible en el link activo */}
      {isActive && (
        <motion.span
          layoutId="underline"
          className="absolute bottom-0 left-0 h-px w-full bg-[#00ffff]"
          style={{ boxShadow: '0 0 6px rgba(0,255,255,0.6)' }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );
}

// ─── Subcomponente: Avatar de usuario ─────────────────────────────────────────

interface UserAvatarProps {
  name: string;
}

function UserAvatar({ name }: UserAvatarProps) {
  // Toma las dos primeras letras del nombre como iniciales
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#00ffff] font-mono text-xs font-bold text-[#00ffff]"
      style={{ backgroundColor: 'rgba(0,255,255,0.08)' }}
    >
      {initials}
    </span>
  );
}

// ─── Subcomponente: Sección de usuario (autenticado) ─────────────────────────

interface UserSectionProps {
  name: string;
  onLogout: () => void;
}

function UserSection({ name, onLogout }: UserSectionProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Nombre del usuario desde el store */}
      <span className="hidden font-mono text-sm text-[#888888] sm:block">
        {name}
      </span>

      {/* Botón de logout */}
      <CyberButton variant="ghost" size="sm" onClick={onLogout}>
        Cerrar sesión
      </CyberButton>
    </div>
  );
}

// ─── Subcomponente: Menú móvil desplegable ────────────────────────────────────

interface MobileMenuProps {
  isOpen: boolean;
  pathname: string;
  isLoggedIn: boolean;
  name?: string;
  onClose: () => void;
  onLogout: () => void;
  onLogin: () => void;
}

function MobileMenu({
  isOpen,
  pathname,
  isLoggedIn,
  name,
  onClose,
  onLogout,
  onLogin,
}: MobileMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="mobile-menu"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          style={{
            backgroundColor: 'rgba(0,0,0,0.95)',
            borderBottom: '1px solid rgba(0,255,255,0.1)',
          }}
          className="absolute left-0 top-full w-full px-6 py-4 md:hidden"
        >
          {/* Links de navegación en columna */}
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                isActive={pathname === link.href}
                onClick={onClose}
              />
            ))}
          </nav>

          {/* Separador */}
          <div
            className="my-4 h-px"
            style={{ backgroundColor: 'rgba(0,255,255,0.08)' }}
          />

          {/* Sección de autenticación en móvil */}
          {isLoggedIn && name ? (
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-[#888888]">{name}</span>
              <CyberButton variant="ghost" size="sm" onClick={onLogout}>
                Cerrar sesión
              </CyberButton>
            </div>
          ) : (
            <CyberButton variant="ghost" size="sm" onClick={onLogin}>
              Ingresar
            </CyberButton>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Leemos el estado de autenticación y las acciones del store de Zustand
  const user = useStore((s) => s.user);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const initAuth = useStore((s) => s.initAuth);
  const logout = useStore((s) => s.logout);

  // Restaurar sesión desde localStorage al montar el componente
  // Solo corre en el cliente, nunca en SSR — evita hydration mismatch
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  function handleLogin() {
    setMobileOpen(false);
    router.push('/login');
  }

  function handleLogout() {
    // Llama al logout del store que limpia localStorage y el estado
    logout();
    setMobileOpen(false);
    router.push('/login');
  }

  return (
    <header
      style={{
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,255,255,0.1)',
      }}
      className="fixed left-0 right-0 top-0 z-50"
    >
      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-6">

        {/* ── Logo ── */}
        <NavLogo />

        {/* ── Links de navegación (desktop) ── */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Navegación principal">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              isActive={pathname === link.href}
            />
          ))}
        </nav>

        {/* ── Sección derecha: auth (desktop) ── */}
        <div className="hidden items-center md:flex">
          {isAuthenticated && user ? (
            // Usuario autenticado: avatar con nombre real + logout
            <UserSection
              name={user.name}
              onLogout={handleLogout}
            />
          ) : (
            // Usuario anónimo: botón login
            <CyberButton variant="ghost" size="sm" onClick={handleLogin}>
              Ingresar
            </CyberButton>
          )}
        </div>

        {/* ── Botón hamburger (móvil) ── */}
        <button
          className="flex items-center justify-center text-[#444444] transition-colors hover:text-[#00ffff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff] md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── Menú desplegable móvil ── */}
      <MobileMenu
        isOpen={mobileOpen}
        pathname={pathname}
        isLoggedIn={isAuthenticated}
        name={user?.name}
        onClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
        onLogin={handleLogin}
      />
    </header>
  );
}
