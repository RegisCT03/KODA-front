'use client';

/**
 * ResultModal.tsx
 * Modal de resultados al finalizar una sesión de tipeo.
 *
 * Muestra:
 *  - WPM final en enorme (#ffff00)
 *  - Row de stats: Precisión | CPM | Errores | Tiempo
 *  - Barra de rating de 1-5 nodos según WPM
 *  - Badge "Session Invalid" si precisión < 85%
 *  - Chips de teclas difíciles en magenta
 *  - Botones: "Try Again" | "View Dashboard"
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { CyberButton } from '@/components/ui/CyberButton';
import { CyberCard }   from '@/components/ui/CyberCard';
import type { TypingResult } from '@/hooks/useTypingEngine';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ResultModalProps {
  /** Si el modal está visible */
  isOpen:    boolean;
  /** Resultado de la sesión */
  result:    TypingResult | null;
  /** Callback al presionar "Try Again" */
  onRetry:   () => void;
}

// ─── Subcomponente: barra de rating ──────────────────────────────────────────

interface RatingBarProps {
  wpm: number;
}

/**
 * Barra de 5 nodos cian que indica el nivel de WPM.
 * < 40: 1 | 40-60: 2 | 60-80: 3 | 80-100: 4 | > 100: 5
 */
function RatingBar({ wpm }: RatingBarProps) {
  // Calcula cuántos nodos iluminar según el WPM
  const activeNodes =
    wpm > 100 ? 5 :
    wpm > 80  ? 4 :
    wpm > 60  ? 3 :
    wpm > 40  ? 2 : 1;

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs" style={{ color: '#444444' }}>
        Rating
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <motion.div
            key={i}
            className="h-2 w-6 rounded-full"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{
              opacity: 1,
              scaleX: 1,
              backgroundColor: i < activeNodes ? '#00ffff' : '#1a1a1a',
            }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Subcomponente: stat individual del modal ─────────────────────────────────

interface ModalStatProps {
  label: string;
  value: string;
  color?: string;
}

function ModalStat({ label, value, color = '#888888' }: ModalStatProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-xl font-bold" style={{ color }}>
        {value}
      </span>
      <span className="font-mono text-xs uppercase tracking-widest" style={{ color: '#333333' }}>
        {label}
      </span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ResultModal({ isOpen, result, onRetry }: ResultModalProps) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {isOpen && result && (
        <>
          {/* ── Overlay con blur ── */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex items-center justify-center p-4"
            style={{
              backgroundColor: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(4px)',
            }}
            // Click en el overlay no cierra el modal (el usuario debe elegir)
            aria-modal="true"
            role="dialog"
            aria-label="Resultados de la sesión"
          >
            {/* ── Modal CyberCard ── */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{ opacity: 0, scale: 0.92, y: 20    }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-[480px]"
            >
              <CyberCard className="flex flex-col gap-6 p-8">

                {/* ── Título ── */}
                <h2
                  className="font-mono text-lg font-bold tracking-widest uppercase"
                  style={{ color: '#00ffff' }}
                >
                  Session Complete
                </h2>

                {/* ── WPM enorme ── */}
                <div className="flex flex-col items-center gap-1">
                  <motion.span
                    className="font-mono font-bold leading-none"
                    style={{ fontSize: '5rem', color: '#ffff00' }}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1,   opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  >
                    {result.wpm}
                  </motion.span>
                  <span
                    className="font-mono text-xs uppercase tracking-widest"
                    style={{ color: '#444444' }}
                  >
                    Words per minute
                  </span>
                </div>

                {/* ── Barra de rating ── */}
                <RatingBar wpm={result.wpm} />

                {/* ── Badge "Session Invalid" si precisión < 85% ── */}
                {result.status === 'INVALID' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded border px-3 py-2 font-mono text-xs"
                    style={{
                      borderColor: 'rgba(255,0,64,0.4)',
                      backgroundColor: 'rgba(255,0,64,0.08)',
                      color: '#ff0040',
                    }}
                    role="alert"
                  >
                    ⚠ Session Invalid — precision below 85%
                  </motion.div>
                )}

                {/* ── Row de stats ── */}
                <div
                  className="grid grid-cols-4 gap-2 rounded border p-4"
                  style={{ borderColor: '#111111', backgroundColor: '#050505' }}
                >
                  <ModalStat
                    label="Precisión"
                    value={`${result.precision}%`}
                    color={result.precision >= 85 ? '#00ff00' : '#ff0040'}
                  />
                  <ModalStat
                    label="CPM"
                    value={result.cpm.toString()}
                    color="#00ffff"
                  />
                  <ModalStat
                    label="Errores"
                    value={result.totalErrors.toString()}
                    color={result.totalErrors === 0 ? '#00ff00' : '#ff00ff'}
                  />
                  <ModalStat
                    label="Tiempo"
                    value={`${Math.round(result.durationMs / 1000)}s`}
                    color="#ffff00"
                  />
                </div>

                {/* ── Teclas difíciles ── */}
                {result.difficultKeys.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span
                      className="font-mono text-xs uppercase tracking-widest"
                      style={{ color: '#333333' }}
                    >
                      Teclas difíciles
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {result.difficultKeys.map((key) => (
                        <span
                          key={key}
                          className="rounded border px-2 py-0.5 font-mono text-xs"
                          style={{
                            borderColor: 'rgba(255,0,255,0.3)',
                            backgroundColor: 'rgba(255,0,255,0.08)',
                            color: '#ff00ff',
                          }}
                        >
                          {key}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Botones de acción ── */}
                <div className="flex gap-3">
                  {/* "Try Again" — reinicia la sesión */}
                  <CyberButton
                    variant="ghost"
                    size="md"
                    onClick={onRetry}
                    className="flex-1"
                  >
                    Try Again
                  </CyberButton>

                  {/* "View Dashboard" — navega al dashboard */}
                  <CyberButton
                    variant="primary"
                    size="md"
                    onClick={() => router.push('/dashboard')}
                    className="flex-1"
                  >
                    View Dashboard
                  </CyberButton>
                </div>

              </CyberCard>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
