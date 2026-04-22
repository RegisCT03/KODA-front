'use client';

/**
 * page.tsx — Dashboard de AWOS
 *
 * Layout: Sidebar fijo (260px) + área principal.
 * En móvil: sidebar colapsa con hamburger.
 *
 * Estructura del área principal:
 *  - Fila 1: 4 StatsCards con count-up y animación escalonada
 *  - Fila 2: Gráfica WPM histórico (Recharts)
 *  - Fila 3: Tabla de sesiones (60%) + Heatmap de teclas (40%)
 *
 * Datos 100% mock — sin llamadas a API.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Zap, Target, Keyboard, AlertTriangle } from 'lucide-react';

import { DashboardSidebar }      from '@/components/dashboard/DashboardSidebar';
import { WpmChart }              from '@/components/dashboard/WpmChart';
import { SessionsTable }         from '@/components/dashboard/SessionsTable';
import { DifficultKeysHeatmap }  from '@/components/dashboard/DifficultKeysHeatmap';
import { StatsCard }             from '@/components/ui/StatsCard';
import { CyberCard }             from '@/components/ui/CyberCard';
import { ProtectedRoute }        from '@/components/layout/ProtectedRoute';

// ─── Datos mock de las StatsCards ─────────────────────────────────────────────

/**
 * Definición de las 4 métricas principales del dashboard.
 * Los valores son mock — sin API.
 */
const STATS = [
  {
    icon:  <Zap size={22} />,
    value: 94,
    label: 'Best WPM',
    type:  'wpm' as const,
    delay: 0.1,
  },
  {
    icon:  <Target size={22} />,
    value: 91,
    label: 'Avg Precision',
    type:  'precision' as const,
    delay: 0.2,
  },
  {
    icon:  <Keyboard size={22} />,
    value: 23,
    label: 'Total Sessions',
    type:  'sessions' as const,
    delay: 0.3,
  },
  {
    icon:  <AlertTriangle size={22} />,
    value: 847,
    label: 'Total Errors',
    type:  'errors' as const,
    delay: 0.4,
  },
] as const;

// ─── Página principal ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div
        className="flex min-h-screen pt-14"
        style={{ backgroundColor: '#000000' }}
      >
      {/* ── Sidebar fijo ── */}
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Área principal (desplazada por el sidebar en desktop) ── */}
      <div className="flex flex-1 flex-col md:ml-[260px]">

        {/* ── Topbar móvil con hamburger ── */}
        <div
          className="flex items-center gap-4 border-b px-6 py-4 md:hidden"
          style={{ borderColor: '#111111', backgroundColor: '#000000' }}
        >
          {/* Botón hamburger */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-[#444444] transition-colors hover:text-[#00ffff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff]"
            aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Título de la página en móvil */}
          <span
            className="font-mono text-sm font-bold tracking-widest"
            style={{ color: '#00ffff' }}
          >
            Dashboard
          </span>
        </div>

        {/* ── Contenido principal ── */}
        <main className="flex flex-col gap-8 p-8">

          {/* ── Título de página (desktop) ── */}
          <div className="hidden flex-col gap-1 md:flex">
            <h1
              className="font-mono text-lg font-bold tracking-widest uppercase"
              style={{ color: '#ffffff' }}
            >
              Dashboard
            </h1>
            <p className="font-mono text-xs" style={{ color: '#333333' }}>
              Tu progreso de tipeo en tiempo real
            </p>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              FILA 1 — STATS CARDS (4 en fila)
              Animación de entrada escalonada: delay 0.1s por card.
              ════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                // Animación de entrada escalonada por card
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: stat.delay, ease: 'easeOut' }}
              >
                <StatsCard
                  icon={stat.icon}
                  value={stat.value}
                  label={stat.label}
                  type={stat.type}
                />
              </motion.div>
            ))}
          </div>

          {/* ════════════════════════════════════════════════════════════════
              FILA 2 — GRÁFICA WPM HISTÓRICO
              Fade-in al montar, manejado dentro de WpmChart.
              ════════════════════════════════════════════════════════════════ */}
          <CyberCard className="p-6">
            <WpmChart />
          </CyberCard>

          {/* ════════════════════════════════════════════════════════════════
              FILA 3 — DOS COLUMNAS: Tabla (60%) + Heatmap (40%)
              En móvil: columna única.
              ════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">

            {/* ── Columna A (60%): Tabla de sesiones recientes ── */}
            <div className="xl:col-span-3">
              <CyberCard className="p-6">
                <SessionsTable />
              </CyberCard>
            </div>

            {/* ── Columna B (40%): Heatmap de teclas difíciles ── */}
            <div className="xl:col-span-2">
              <CyberCard className="p-6">
                <DifficultKeysHeatmap />
              </CyberCard>
            </div>
          </div>

        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}
