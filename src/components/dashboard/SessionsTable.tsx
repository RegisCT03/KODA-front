'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { CyberButton } from '@/components/ui/CyberButton';
import { getMySessions } from '@/lib/api';

function FilterBar() {
  const [lang, setLang] = useState('all');
  const [diff, setDiff] = useState('all');
  const [status, setStatus] = useState('all');

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
      <select value={lang} onChange={(e) => setLang(e.target.value)} style={selectStyle}>
        <option value="all">All Languages</option>
        <option value="python">Python</option>
        <option value="typescript">TypeScript</option>
        <option value="javascript">JavaScript</option>
        <option value="go">Go</option>
        <option value="rust">Rust</option>
      </select>

      <select value={diff} onChange={(e) => setDiff(e.target.value)} style={selectStyle}>
        <option value="all">All Difficulties</option>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
        <option value="all">All Status</option>
        <option value="completed">Completed</option>
        <option value="invalid">Invalid</option>
      </select>

      <CyberButton
        variant="ghost"
        size="sm"
        onClick={() => { setLang('all'); setDiff('all'); setStatus('all'); }}
      >
        <RotateCcw size={12} />
        Reset
      </CyberButton>
    </div>
  );
}

interface TableRowProps {
  session: any;
  index: number;
}

function TableRow({ session, index }: TableRowProps) {
  const dateValue = session.createdAt || session.date || new Date();
  const formattedDate = new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const difficulty = session.snippet?.difficulty || session.difficulty || 'UNKNOWN';
  const language = session.snippet?.language?.name || session.language || 'UNKNOWN';
  const status = session.status || (session.accuracy > 0 ? 'COMPLETED' : 'INVALID');
  const accuracy = session.accuracy || session.precision || 0;

  const diffColor: Record<string, string> = {
    EASY: '#00ff00',
    MEDIUM: '#ffff00',
    HARD: '#ff00ff',
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="group border-b transition-colors duration-100"
      style={{ borderColor: '#0d0d0d' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'rgba(255,255,255,0.02)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
      }}
    >
      <td className="py-3 pr-4 font-mono text-xs" style={{ color: '#555555' }}>
        {formattedDate}
      </td>
      <td className="py-3 pr-4 font-mono text-xs" style={{ color: '#888888' }}>
        {language}
      </td>
      <td className="py-3 pr-4 font-mono text-xs" style={{ color: diffColor[difficulty] || '#888' }}>
        {difficulty}
      </td>
      <td className="py-3 pr-4 font-mono text-xs font-bold" style={{ color: '#00ffff' }}>
        {session.wpm}
      </td>
      <td className="py-3 pr-4 font-mono text-xs" style={{ color: '#00ff00' }}>
        {accuracy}%
      </td>
      <td className="py-3 font-mono text-xs font-semibold">
        <span style={{ color: status === 'COMPLETED' ? '#00ffff' : '#ff00ff' }}>
          {status}
        </span>
      </td>
    </motion.tr>
  );
}

export function SessionsTable() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await getMySessions();
        setSessions(response.data || []);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <p className="font-mono uppercase tracking-widest" style={{ fontSize: '0.75rem', color: '#888888' }}>
          Recent Sessions
        </p>
        <FilterBar />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b" style={{ borderColor: '#111111' }}>
              {['Date', 'Language', 'Difficulty', 'WPM', 'Precision', 'Status'].map((col) => (
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
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center font-mono text-xs text-gray-500">
                  Cargando sesiones...
                </td>
              </tr>
            ) : sessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center font-mono text-xs text-gray-500">
                  Aún no tienes sesiones registradas.
                </td>
              </tr>
            ) : (
              sessions.map((session, i) => (
                <TableRow key={session.id || i} session={session} index={i} />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-xs" style={{ color: '#333333' }}>
          {sessions.length} sessions
        </span>
        <div className="flex items-center gap-2">
          <button disabled className="flex h-7 w-7 items-center justify-center rounded border font-mono text-xs opacity-30" style={{ borderColor: '#222222', color: '#444444' }}>
            <ChevronLeft size={14} />
          </button>
          <span className="font-mono text-xs" style={{ color: '#444444' }}>1</span>
          <button disabled className="flex h-7 w-7 items-center justify-center rounded border font-mono text-xs opacity-30" style={{ borderColor: '#222222', color: '#444444' }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}