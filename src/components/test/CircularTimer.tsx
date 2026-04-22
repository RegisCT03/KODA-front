'use client';

/**
 * CircularTimer.tsx
 * Temporizador circular SVG con animación de arco y cambio de color.
 *
 * Colores según tiempo restante:
 *  > 15s  → cian    (#00ffff)
 *  8-15s  → amarillo (#ffff00)
 *  < 8s   → magenta (#ff00ff) con animación flicker
 *
 * Al llegar a 0: el número central hace una animación de "explosión"
 * (scale 1 → 1.5 → 0) via framer-motion.
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CircularTimerProps {
  /** Tiempo restante en segundos */
  timeLeft: number;
  /** Duración total de la sesión en segundos */
  totalSeconds: number;
  /** Si el timer ha expirado */
  isExpired: boolean;
}

// ─── Constantes del SVG ───────────────────────────────────────────────────────

const SIZE   = 120;   // Tamaño del SVG en px
const STROKE = 4;     // Grosor del anillo
const RADIUS = (SIZE - STROKE * 2) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = SIZE / 2;

// ─── Helper: color según tiempo restante ─────────────────────────────────────

/**
 * Retorna el color del anillo y del número según el tiempo restante.
 */
function getTimerColor(timeLeft: number): string {
  if (timeLeft > 15) return '#00ffff';   // cian — tiempo suficiente
  if (timeLeft > 8)  return '#ffff00';   // amarillo — advertencia
  return '#ff00ff';                       // magenta — urgente
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CircularTimer({
  timeLeft,
  totalSeconds,
  isExpired,
}: CircularTimerProps) {
  // Fracción de tiempo restante (1.0 → 0.0)
  const fraction = totalSeconds > 0 ? timeLeft / totalSeconds : 0;

  // Longitud del arco visible: de circunferencia completa a 0
  const strokeDashoffset = CIRCUMFERENCE * (1 - fraction);

  // Color activo según tiempo restante
  const color = getTimerColor(timeLeft);

  // Formato del tiempo: MM:SS si >= 60s, solo segundos si < 60s
  const displayTime = useMemo(() => {
    if (timeLeft >= 60) {
      const m = Math.floor(timeLeft / 60);
      const s = timeLeft % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return timeLeft.toString();
  }, [timeLeft]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>

      {/* ── SVG del anillo ── */}
      <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
        {/* Pista de fondo (anillo gris oscuro) */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth={STROKE}
        />

        {/* Arco animado que representa el tiempo restante */}
        <motion.circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          // Anima el color y el offset del arco
          animate={{
            stroke: color,
            strokeDashoffset,
            // Flicker en los últimos 8 segundos
            opacity: timeLeft <= 8 && timeLeft > 0 ? [1, 0.4, 1] : 1,
          }}
          transition={{
            strokeDashoffset: { duration: 0.8, ease: 'linear' },
            stroke:           { duration: 0.3 },
            opacity:          { duration: 0.5, repeat: timeLeft <= 8 ? Infinity : 0 },
          }}
        />
      </svg>

      {/* ── Número central ── */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isExpired ? (
            // Animación de "explosión" al llegar a 0
            <motion.span
              key="expired"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="font-mono font-bold"
              style={{ color: '#ff00ff', fontSize: '1.8rem' }}
            >
              0
            </motion.span>
          ) : (
            // Número normal con color dinámico
            <motion.span
              key="timer"
              animate={{ color }}
              transition={{ duration: 0.3 }}
              className="font-mono font-bold"
              style={{ fontSize: '1.8rem' }}
              aria-live="polite"
              aria-label={`${timeLeft} segundos restantes`}
            >
              {displayTime}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
