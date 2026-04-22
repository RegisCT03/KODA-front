'use client';

import { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Zap, Target, Gauge, Award, Menu } from 'lucide-react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { StatsCard } from '@/components/ui/StatsCard';
import { WpmChart } from '@/components/dashboard/WpmChart';
import { DifficultKeysHeatmap } from '@/components/dashboard/DifficultKeysHeatmap';
import { SessionsTable } from '@/components/dashboard/SessionsTable';
import { getMySessions } from '@/lib/api';

interface SessionData {
  id?: string;
  wpm: number;
  accuracy?: number;
  precision?: number;
  createdAt?: string;
  date?: string;
  snippet?: {
    difficulty?: string;
    language?: {
      name?: string;
    };
  };
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const response = await getMySessions();
        setSessions(response.data || []);
      } catch (error) {
        console.error("Error cargando el dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const stats = useMemo(() => {
    if (sessions.length === 0) {
      return { tests: 0, avgWpm: 0, topWpm: 0, avgAccuracy: 0 };
    }

    const totalTests = sessions.length;
    const totalWpm = sessions.reduce((acc, s) => acc + (s.wpm || 0), 0);
    const topWpm = Math.max(...sessions.map(s => s.wpm || 0));
    const totalAccuracy = sessions.reduce((acc, s) => acc + (s.accuracy || s.precision || 0), 0);

    return {
      tests: totalTests,
      avgWpm: Math.round(totalWpm / totalTests),
      topWpm: topWpm,
      avgAccuracy: Math.round(totalAccuracy / totalTests),
    };
  }, [sessions]);
  const chartData = useMemo(() => {
    return sessions
      .slice(-10)
      .map((s) => {
        const dateString = s.createdAt || s.date;
        const dateObj = dateString ? new Date(dateString) : new Date();
        
        return {
          date: dateObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
          wpm: s.wpm || 0,
          precision: s.accuracy || s.precision || 0
        };
      });
  }, [sessions]);

  return (
    <div className="flex min-h-screen bg-black text-white font-mono">
      <DashboardSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 p-8 md:pl-[260px]"> {/* Añadimos padding izquierdo para escritorio */}
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex items-center gap-3 border-b border-zinc-900 pb-6">
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="md:hidden text-zinc-400 hover:text-white"
            >
              <Menu size={28} />
            </button>
            <LayoutDashboard className="text-cyan-400" size={28} />
            <div>
              <h1 className="text-2xl font-bold tracking-tighter uppercase">Terminal_Dashboard</h1>
              <p className="text-zinc-500 text-xs">Análisis de rendimiento biométrico y técnico</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ahora pasamos type y value como número */}
            <StatsCard label="Pruebas Realizadas" value={stats.tests} icon={<Zap size={18} />} type="sessions" />
            <StatsCard label="WPM Promedio" value={stats.avgWpm} icon={<Gauge size={18} />} type="wpm" />
            <StatsCard label="Velocidad Máxima" value={stats.topWpm} icon={<Award size={18} />} type="wpm" />
            <StatsCard label="Precisión Media" value={stats.avgAccuracy} icon={<Target size={18} />} type="precision" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <WpmChart data={chartData} />
            </div>
            <div>
              <DifficultKeysHeatmap />
            </div>
          </div>

          <div className="bg-zinc-950/50 border border-zinc-900 p-6 rounded-lg">
            <SessionsTable initialSessions={sessions} isLoading={isLoading} />
          </div>

        </div>
      </main>
    </div>
  );
}