'use client';

import { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Zap, Target, Gauge, Award, Menu } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { StatsCard } from '@/components/ui/StatsCard';
import { WpmChart } from '@/components/dashboard/WpmChart';
import { DifficultKeysHeatmap } from '@/components/dashboard/DifficultKeysHeatmap';
import { SessionsTable } from '@/components/dashboard/SessionsTable';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { getMySessions } from '@/lib/api';
import { useProgress } from '@/hooks/useProgress';

interface SessionData {
  id?: string;
  wpm: number;
  accuracy?: number;
  precision?: number;
  createdAt?: string;
  date?: string;
  snippet?: {
    difficulty?: string;
    language?: { name?: string };
  };
}

function DashboardContent() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: progressData } = useProgress();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const response = await getMySessions();
        setSessions(response.data || []);
      } catch (error) {
        console.error('Error cargando el dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const stats = useMemo(() => {
    if (sessions.length === 0) return { tests: 0, avgWpm: 0, topWpm: 0, avgAccuracy: 0 };
    const totalTests    = sessions.length;
    const totalWpm      = sessions.reduce((acc, s) => acc + (s.wpm || 0), 0);
    const topWpm        = Math.max(...sessions.map(s => s.wpm || 0));
    const totalAccuracy = sessions.reduce((acc, s) => acc + (s.accuracy || s.precision || 0), 0);
    return {
      tests:       totalTests,
      avgWpm:      Math.round(totalWpm / totalTests),
      topWpm,
      avgAccuracy: Math.round(totalAccuracy / totalTests),
    };
  }, [sessions]);

  const chartData = useMemo(() => sessions.slice(-10).map((s) => {
    const dateObj = new Date(s.createdAt || s.date || Date.now());
    return {
      date:      dateObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
      wpm:       s.wpm || 0,
      precision: s.accuracy || s.precision || 0,
    };
  }), [sessions]);

  // Teclas difíciles desde el endpoint de progreso
  const difficultKeys: string[] = progressData
    ? (progressData as any).difficultKeys ?? []
    : [];

  return (
    // pt-14 para compensar la navbar fija de 56px (h-14)
    <div className="flex min-h-screen bg-black pt-14 text-white font-mono">
      <DashboardSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} progressData={progressData} />

      <main className="flex-1 p-8 md:pl-[260px]">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Encabezado */}
          <div className="flex items-center gap-3 border-b border-zinc-900 pb-6">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-zinc-400 hover:text-white"
            >
              <Menu size={28} />
            </button>
            <LayoutDashboard className="text-cyan-400" size={28} />
            <div>
              <h1 className="text-2xl font-bold tracking-tighter uppercase">Panel de control</h1>
              <p className="text-zinc-500 text-xs">Análisis de rendimiento y progreso</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Pruebas realizadas" value={stats.tests}       icon={<Zap size={18} />}    type="sessions"  />
            <StatsCard label="PPM promedio"        value={stats.avgWpm}     icon={<Gauge size={18} />}  type="wpm"       />
            <StatsCard label="Velocidad máxima"    value={stats.topWpm}     icon={<Award size={18} />}  type="wpm"       />
            <StatsCard label="Precisión media"     value={stats.avgAccuracy} icon={<Target size={18} />} type="precision" />
          </div>

          {/* Gráfica + Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <WpmChart data={chartData} />
            </div>
            <div>
              <DifficultKeysHeatmap difficultKeys={difficultKeys} />
            </div>
          </div>

          {/* Tabla de sesiones */}
          <div className="bg-zinc-950/50 border border-zinc-900 p-6 rounded-lg">
            <SessionsTable initialSessions={sessions} isLoading={isLoading} />
          </div>

        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}