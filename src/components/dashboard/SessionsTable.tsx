'use client';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { CyberButton } from '@/components/ui/CyberButton';

export interface SessionsTableProps {
  initialSessions?: any[];
  isLoading?: boolean;
}

export function SessionsTable({ initialSessions = [], isLoading = false }: SessionsTableProps) {
  const sessions = initialSessions;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <p className="font-mono uppercase tracking-widest text-[0.75rem] text-zinc-500">
          Sesiones Recientes
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b border-zinc-900">
              {['Fecha', 'Lenguaje', 'Dificultad', 'WPM', 'Precisión', 'Estado'].map((col) => (
                <th key={col} className="pb-3 pr-4 text-left font-mono uppercase tracking-widest text-[11px] text-zinc-700">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="py-8 text-center text-xs text-zinc-500 font-mono">Sincronizando con la red...</td></tr>
            ) : sessions.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-xs text-zinc-500 font-mono">No se encontraron registros en la base de datos.</td></tr>
            ) : (
              sessions.map((session, i) => (
                <tr key={session.id || i} className="border-b border-zinc-900/50 hover:bg-white/5 transition-colors">
                  <td className="py-3 pr-4 font-mono text-xs text-zinc-500">
                    {new Date(session.createdAt || session.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-zinc-400">
                    {session.snippet?.language?.name || 'Desconocido'}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs" style={{ color: session.snippet?.difficulty === 'HARD' ? '#ff00ff' : '#00ff00' }}>
                    {session.snippet?.difficulty || 'EASY'}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs font-bold text-cyan-400">{session.wpm}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-lime-400">{session.accuracy || session.precision}%</td>
                  <td className="py-3 font-mono text-xs font-semibold text-cyan-400">COMPLETED</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-zinc-700">{sessions.length} resultados encontrados</span>
      </div>
    </div>
  );
}