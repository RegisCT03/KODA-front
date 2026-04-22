'use client';

/**
 * page.tsx — Dashboard de AWOS
 * Conectado al endpoint GET /progress/summary para datos reales.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Zap, Target, Keyboard, Trophy } from 'lucide-react';

import { DashboardSidebar }      from '@/components/dashboard/DashboardSidebar';
import { WpmChart }              from '@/components/dashboard/WpmChart';
import { SessionsTable }         from '@/components/dashboard/SessionsTable';
import { DifficultKeysHeatmap }  from '@/components/dashboard/DifficultKeysHeatmap';
import { StatsCard }             from '@/components/ui/StatsCard';
import { CyberCard }             from '@/components/ui/CyberCard';
import { ProtectedRoute }        from '@/components/layout/ProtectedRoute';
import { useProgress }           from '@/hooks/useProgress';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data, loading } = useProgress();

  // Definición de las 4 StatsCards con datos reales o skeleton mientras carga
  const stats = [
    {
      icon:  <Zap size={22} />,
      value: loading ? 0 : (data?.bestWpm ?? 0),
      label: 'Mejor PPM',
      type:  'wpm' as const,
      delay: 0.1,
    },
    {
      icon:  <Target size={22} />,
      value: loading ? 0 : (data?.avgWpm7Days ?? 0),
      label: 'PPM Prom. (7d)',
      type:  'wpm' as const,
      delay: 0.2,
    },
    {
      icon:  <Keyboard size={22} />,
      value: loading ? 0 : (data?.totalSessions ?? 0),
      label: 'Sesiones totales',
      type:  'sessions' as const,
      delay: 0.3,
    },
    {
      icon:  <Trophy size={22} />,
      value: loading ? 0 : (data?.completedSessions ?? 0),
      label: 'Completadas',
      type:  'sessions' as const,
      delay: 0.4,
    },
  ];

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen pt-14" style={{ backgroundColor: '#000000' }}>

        <DashboardSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          progressData={data}
        />

        <div className="flex flex-1 flex-col md:ml-[260px]">

          {/* Topbar móvil */}
          <div
            className="flex items-center gap-4 border-b px-6 py-4 md:hidden"
            style={{ borderColor: '#111111', backgroundColor: '#000000' }}
          >
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="text-[#444444] transition-colors hover:text-[#00ffff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff]"
              aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="font-mono text-sm font-bold tracking-widest" style={{ color: '#00ffff' }}>
              Dashboard
            </span>
          </div>

          <main className="flex flex-col gap-8 p-8">

            {/* Título desktop */}
            <div className="hidden flex-col gap-1 md:flex">
              <h1 className="font-mono text-lg font-bold tracking-widest uppercase" style={{ color: '#ffffff' }}>
                Dashboard
              </h1>
              <p className="font-mono text-xs" style={{ color: '#333333' }}>
                Tu progreso de tipeo en tiempo real
              </p>
            </div>

            {/* Fila 1 — Stats Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stats.map((stat) => (
                <motion.div
                  key={stat.label}
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

            {/* Fila 2 — Gráfica WPM */}
            <CyberCard className="p-6">
              <WpmChart history={data?.recentHistory ?? []} loading={loading} />
            </CyberCard>

            {/* Fila 3 — Tabla + Heatmap */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <div className="xl:col-span-3">
                <CyberCard className="p-6">
                  <SessionsTable />
                </CyberCard>
              </div>
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
