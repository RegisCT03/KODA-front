'use client';

/**
 * SessionsTable.tsx
 * Tabla de sesiones recientes con filtros mock y paginación mock.
 *
 * Características:
 *  - Cabecera: Date | Language | Difficulty | WPM | Precision | Status
 *  - Hover en fila: fondo rgba(255,255,255,0.02)
 *  - Status COMPLETED: cian | INVALID: magenta
 *  - Filtros de lenguaje/dificultad/estado (solo UI, no filtran datos)
 *  - Paginación mock: "1-8 of 23 sessions"
 *  - Animación staggered en las filas (0.05s por fila)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { RECENT_SESSIONS } from '@/lib/dashboard-mock';
import type { SessionRow } from '@/lib/dashboard-mock';
import { CyberButton } from '@/components/ui/CyberButton';

// ─── Subcomponente: filtros ───────────────────────────────────────────────────

/**
 * FilterBar
 * Fila de selects con estética cyberpunk.
 * Solo UI — no filtra los datos en esta versión mock.
 */
function FilterBar() {
  // Estado local de los filtros (solo visual, no afecta los datos)
  const [lang,   setLang]   = useState('all');
  const [diff,   setDiff]   = useState('all');
  const [status, setStatus] = useState('all');

  // Estilo compartido para todos los selects
  const selectStyle: React.CSSProperties = {
    backgroundColor: '#000000',
    border: '1px solid #222222',
    color: '#888888',
    fontFamily: 'monospace',
    fontSize: '12px',
    borderRadius: 4,
    padding: '4px 8px',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Filtro de lenguaje */}
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        style={selectStyle}
        aria-label="Filtrar por lenguaje"
      >
        <option value="all">Todos los lenguajes</option>
        <option value="python">Python</option>
        <option value="typescript">TypeScript</option>
        <option value="javascript">JavaScript</option>
        <option value="go">Go</option>
        <option value="rust">Rust</option>
      </select>

      {/* Filtro de dificultad */}
      <select
        value={diff}
        onChange={(e) => setDiff(e.target.value)}
        style={selectStyle}
        aria-label="Filtrar por dificultad"
      >
        <option value="all">Todas las dificultades</option>
        <option value="easy">Fácil</option>
        <option value="medium">Medio</option>
        <option value="hard">Difícil</option>
      </select>

      {/* Filtro de estado */}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        style={selectStyle}
        aria-label="Filtrar por estado"
      >
        <option value="all">Todos los estados</option>
        <option value="completed">Completada</option>
        <option value="invalid">Inválida</option>
      </select>

      {/* Botón Reset — solo visual */}
      <CyberButton
        variant="ghost"
        size="sm"
        onClick={() => { setLang('all'); setDiff('all'); setStatus('all'); }}
        aria-label="Resetear filtros"
      >
        <RotateCcw size={12} />
        Resetear
      </CyberButton>
    </div>
  );
}

// ─── Subcomponente: fila de la tabla ─────────────────────────────────────────

interface TableRowProps {
  session: SessionRow;
  index:   number;
}

/**
 * Fila individual de la tabla con animación de entrada staggered.
 * Hover: fondo rgba(255,255,255,0.02).
 */
function TableRow({ session, index }: TableRowProps) {
  // Formatea la fecha ISO a "MMM DD" (ej: "Jan 15")
  const formattedDate = new Date(session.date).toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
  });

  // Color del badge de dificultad
  const diffColor: Record<string, string> = {
    EASY:   '#00ff00',
    MEDIUM: '#ffff00',
    HARD:   '#ff00ff',
  };

  return (
    <motion.tr
      // Animación de entrada staggered: cada fila entra con 0.05s de delay
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="group border-b transition-colors duration-100"
      style={{ borderColor: '#0d0d0d' }}
      // Hover: fondo muy sutil
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'rgba(255,255,255,0.02)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
      }}
    >
      {/* Fecha */}
      <td className="py-3 pr-4 font-mono text-xs" style={{ color: '#555555' }}>
        {formattedDate}
      </td>

      {/* Lenguaje */}
      <td className="py-3 pr-4 font-mono text-xs" style={{ color: '#888888' }}>
        {session.language}
      </td>

      {/* Dificultad con color semántico */}
      <td className="py-3 pr-4 font-mono text-xs" style={{ color: diffColor[session.difficulty] }}>
        {session.difficulty}
      </td>

      {/* WPM en cian */}
      <td className="py-3 pr-4 font-mono text-xs font-bold" style={{ color: '#00ffff' }}>
        {session.wpm}
      </td>

      {/* Precisión en lima */}
      <td className="py-3 pr-4 font-mono text-xs" style={{ color: '#00ff00' }}>
        {session.precision}%
      </td>

      {/* Status: COMPLETED=cian | INVALID=magenta */}
      <td className="py-3 font-mono text-xs font-semibold">
        <span
          style={{
            color: session.status === 'COMPLETED' ? '#00ffff' : '#ff00ff',
          }}
        >
          {session.status}
        </span>
      </td>
    </motion.tr>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function SessionsTable() {
  return (
    <div className="flex flex-col gap-4">

      {/* ── Título + filtros ── */}
      <div className="flex flex-col gap-3">
        <p className="font-mono uppercase tracking-widest" style={{ fontSize: '0.75rem', color: '#888888' }}>
          Sesiones recientes
        </p>
        <FilterBar />
      </div>

      {/* ── Tabla ── */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          {/* Cabecera */}
          <thead>
            <tr className="border-b" style={{ borderColor: '#111111' }}>
              {['Fecha', 'Lenguaje', 'Dificultad', 'PPM', 'Precisión', 'Estado'].map((col) => (
                <th
                  key={col}
                  className="pb-3 pr-4 text-left font-mono uppercase tracking-widest"
                  style={{ fontSize: '11px', color: '#333333' }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* Filas con animación staggered */}
          <tbody>
            {RECENT_SESSIONS.map((session, i) => (
              <TableRow key={session.id} session={session} index={i} />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Paginación mock ── */}
      <div className="flex items-center justify-between">
        {/* Contador de resultados */}
        <span className="font-mono text-xs" style={{ color: '#333333' }}>
          1–8 de 23 sesiones
        </span>

        {/* Botones prev/next (deshabilitados en mock) */}
        <div className="flex items-center gap-2">
          <button
            disabled
            className="flex h-7 w-7 items-center justify-center rounded border font-mono text-xs opacity-30"
            style={{ borderColor: '#222222', color: '#444444' }}
            aria-label="Página anterior"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="font-mono text-xs" style={{ color: '#444444' }}>
            1
          </span>
          <button
            disabled
            className="flex h-7 w-7 items-center justify-center rounded border font-mono text-xs opacity-30"
            style={{ borderColor: '#222222', color: '#444444' }}
            aria-label="Página siguiente"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
