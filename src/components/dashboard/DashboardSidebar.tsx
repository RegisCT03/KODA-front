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
import type { ProgressSummary } from '@/hooks/useProgress';

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  progressData?: ProgressSummary | null;
}

// ─── Links de navegación ──────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/',          label: 'Inicio',    icon: <Home size={16} />            },
  { href: '/test',      label: 'Práctica',  icon: <Keyboard size={16} />        },
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

export function DashboardSidebar({ isOpen, onClose, progressData }: DashboardSidebarProps) {
  const pathname = usePathname();
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

          {/* ── Perfil del usuario — nombre y email reales, sin avatar ── */}
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

          {/* Stats rápidas con datos reales del endpoint /progress/summary */}
          <div className="flex flex-col gap-4">
            <SidebarStat
              icon={<Keyboard size={14} />}
              value={progressData?.totalSessions ?? '—'}
              label="Sesiones totales"
              color="#ffff00"
            />
            <SidebarStat
              icon={<Trophy size={14} />}
              value={progressData ? `${progressData.bestWpm} PPM` : '— PPM'}
              label="Mejor PPM"
              color="#00ffff"
            />
            <SidebarStat
              icon={<Code2 size={14} />}
              value={progressData?.favoriteLanguage ?? '—'}
              label="Lenguaje favorito"
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
                  style={isActive ? { backgroundColor: 'rgba(0,255,255,0.05)' } : undefined}
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
