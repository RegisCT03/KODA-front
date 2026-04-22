'use client';

/**
 * DashboardSidebar.tsx
 * Sidebar izquierdo fijo del dashboard de AWOS.
 *
 * Contiene:
 *  - Nombre y email del usuario real (desde el store)
 *  - Stats rápidas compactas
 *  - Navegación principal
 *  - Versión en el fondo
 *
 * En móvil: se oculta y se controla con el prop `isOpen`.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Keyboard, LayoutDashboard, Trophy, Code2 } from 'lucide-react';
import { useStore } from '@/lib/store';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DashboardSidebarProps {
  /** Controla visibilidad en móvil */
  isOpen: boolean;
  /** Cierra el sidebar en móvil al navegar */
  onClose: () => void;
}

// ─── Links de navegación ──────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/',          label: 'Home',      icon: <Home size={16} />           },
  { href: '/test',      label: 'Test',      icon: <Keyboard size={16} />       },
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
] as const;

// ─── Subcomponente: stat compacta del sidebar ─────────────────────────────────

interface SidebarStatProps {
  icon:  React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}

function SidebarStat({ icon, value, label, color }: SidebarStatProps) {
  return (
    <div className="flex items-center gap-3">
      <span style={{ color }} aria-hidden="true">{icon}</span>
      <div className="flex flex-col">
        <span className="font-mono text-sm font-bold" style={{ color }}>
          {value}
        </span>
        <span className="font-mono text-xs" style={{ color: '#333333' }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  // Leemos el usuario real desde el store de Zustand
  const user = useStore((s) => s.user);

  return (
    <>
      {/* ── Overlay móvil (click fuera cierra el sidebar) ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={[
          'fixed left-0 top-0 z-40 flex h-full flex-col pt-14',
          'w-[260px]',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
        style={{
          backgroundColor: '#050505',
          borderRight: '1px solid #111111',
        }}
        aria-label="Sidebar de navegación"
      >
        {/* ── Contenido scrollable ── */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">

          {/* ── Perfil del usuario — solo nombre y email, sin avatar ── */}
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-sm font-semibold text-white">
              {user?.name ?? '—'}
            </span>
            <span className="font-mono text-xs" style={{ color: '#444444' }}>
              {user?.email ?? '—'}
            </span>
          </div>

          {/* Separador */}
          <div className="h-px" style={{ backgroundColor: '#111111' }} />

          {/* ── Stats rápidas compactas ── */}
          <div className="flex flex-col gap-4">
            <SidebarStat
              icon={<Keyboard size={14} />}
              value="—"
              label="Total Sessions"
              color="#ffff00"
            />
            <SidebarStat
              icon={<Trophy size={14} />}
              value="— WPM"
              label="Best WPM"
              color="#00ffff"
            />
            <SidebarStat
              icon={<Code2 size={14} />}
              value="—"
              label="Fav Language"
              color="#00ff00"
            />
          </div>

          {/* Separador */}
          <div className="h-px" style={{ backgroundColor: '#111111' }} />

          {/* ── Navegación principal ── */}
          <nav className="flex flex-col gap-1" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={[
                    'flex items-center gap-3 rounded px-3 py-2.5',
                    'font-mono text-sm transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff]',
                    isActive
                      ? 'text-[#00ffff]'
                      : 'text-[#444444] hover:text-[#888888]',
                  ].join(' ')}
                  style={
                    isActive
                      ? { backgroundColor: 'rgba(0,255,255,0.05)' }
                      : undefined
                  }
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span
                    className="absolute left-0 h-6 w-0.5 rounded-r"
                    style={{
                      backgroundColor: isActive ? '#00ffff' : 'transparent',
                      boxShadow: isActive ? '0 0 6px rgba(0,255,255,0.5)' : 'none',
                    }}
                    aria-hidden="true"
                  />
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── Versión en el fondo del sidebar ── */}
        <div className="p-6">
          <span className="font-mono text-xs" style={{ color: '#1a1a1a' }}>
            v1.0.0
          </span>
        </div>
      </aside>
    </>
  );
}


// ─── Tipos ────────────────────────────────────────────────────────────────────

interface DashboardSidebarProps {
  /** Controla visibilidad en móvil */
  isOpen: boolean;
  /** Cierra el sidebar en móvil al navegar */
  onClose: () => void;
}

// ─── Links de navegación ──────────────────────────────────────────────────────

/**
 * Definición de los items del menú lateral.
 * El icono se pasa como componente Lucide ya instanciado.
 */
const NAV_ITEMS = [
  { href: '/',          label: 'Home',      icon: <Home size={16} />           },
  { href: '/test',      label: 'Test',      icon: <Keyboard size={16} />       },
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
] as const;

// ─── Subcomponente: Avatar ────────────────────────────────────────────────────

/**
 * Círculo de 56px con las iniciales del usuario en cian.
 * Borde cian sutil con glow.
 */
function UserAvatar({ username }: { username: string }) {
  const initials = username.slice(0, 2).toUpperCase();
  return (
    <div
      className="flex h-14 w-14 items-center justify-center rounded-full font-mono text-lg font-bold"
      style={{
        border: '1px solid rgba(0,255,255,0.4)',
        backgroundColor: 'rgba(0,255,255,0.06)',
        color: '#00ffff',
        boxShadow: '0 0 12px rgba(0,255,255,0.1)',
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

// ─── Subcomponente: stat compacta del sidebar ─────────────────────────────────

interface SidebarStatProps {
  icon:  React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}

/**
 * Stat compacta: icono + valor + label en una sola línea.
 */
function SidebarStat({ icon, value, label, color }: SidebarStatProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Icono con color semántico */}
      <span style={{ color }} aria-hidden="true">{icon}</span>
      <div className="flex flex-col">
        <span className="font-mono text-sm font-bold" style={{ color }}>
          {value}
        </span>
        <span className="font-mono text-xs" style={{ color: '#333333' }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* ── Overlay móvil (click fuera cierra el sidebar) ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={[
          // Posición fija, altura completa, z-index sobre el contenido
          'fixed left-0 top-0 z-40 flex h-full flex-col pt-14',
          // Ancho fijo en desktop, deslizable en móvil
          'w-[260px]',
          // Transición de deslizamiento en móvil
          'transition-transform duration-300 ease-in-out',
          // En móvil: oculto por defecto, visible cuando isOpen=true
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
        style={{
          backgroundColor: '#050505',
          borderRight: '1px solid #111111',
        }}
        aria-label="Sidebar de navegación"
      >
        {/* ── Contenido scrollable ── */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">

          {/* ── Perfil del usuario ── */}
          <div className="flex flex-col gap-3">
            <UserAvatar username={MOCK_DASHBOARD_USER.username} />
            <div className="flex flex-col gap-0.5">
              {/* Nombre */}
              <span className="font-mono text-sm font-semibold text-white">
                {MOCK_DASHBOARD_USER.username}
              </span>
              {/* Email */}
              <span className="font-mono text-xs" style={{ color: '#444444' }}>
                {MOCK_DASHBOARD_USER.email}
              </span>
            </div>
          </div>

          {/* Separador */}
          <div className="h-px" style={{ backgroundColor: '#111111' }} />

          {/* ── Stats rápidas compactas ── */}
          <div className="flex flex-col gap-4">
            <SidebarStat
              icon={<Keyboard size={14} />}
              value={MOCK_DASHBOARD_USER.totalSessions}
              label="Total Sessions"
              color="#ffff00"
            />
            <SidebarStat
              icon={<Trophy size={14} />}
              value={`${MOCK_DASHBOARD_USER.bestWpm} WPM`}
              label="Best WPM"
              color="#00ffff"
            />
            <SidebarStat
              icon={<Code2 size={14} />}
              value={MOCK_DASHBOARD_USER.favLanguage}
              label="Fav Language"
              color="#00ff00"
            />
          </div>

          {/* Separador */}
          <div className="h-px" style={{ backgroundColor: '#111111' }} />

          {/* ── Navegación principal ── */}
          <nav className="flex flex-col gap-1" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={[
                    'flex items-center gap-3 rounded px-3 py-2.5',
                    'font-mono text-sm transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff]',
                    isActive
                      ? 'text-[#00ffff]'
                      : 'text-[#444444] hover:text-[#888888]',
                  ].join(' ')}
                  style={
                    isActive
                      ? { backgroundColor: 'rgba(0,255,255,0.05)' }
                      : undefined
                  }
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Indicador activo: barra izquierda cian */}
                  <span
                    className="absolute left-0 h-6 w-0.5 rounded-r"
                    style={{
                      backgroundColor: isActive ? '#00ffff' : 'transparent',
                      boxShadow: isActive ? '0 0 6px rgba(0,255,255,0.5)' : 'none',
                    }}
                    aria-hidden="true"
                  />
                  {/* Icono */}
                  <span aria-hidden="true">{item.icon}</span>
                  {/* Label */}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── Versión en el fondo del sidebar ── */}
        <div className="p-6">
          <span className="font-mono text-xs" style={{ color: '#1a1a1a' }}>
            v1.0.0
          </span>
        </div>
      </aside>
    </>
  );
}
