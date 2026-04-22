'use client';

/**
 * CodeArea.tsx
 * Área de tipeo principal de AWOS.
 *
 * Renderiza el snippet carácter a carácter con 4 estados visuales:
 *  - pending   : #2a2a2a (casi invisible, aún no escrito)
 *  - correct   : #00ffff (cian, correcto)
 *  - incorrect : #ff00ff (magenta, error) con fondo sutil
 *  - cursor    : fondo #00ffff, texto #000000, blink 1s
 *
 * Un input invisible captura todas las teclas.
 * Al clickear el área, el input recibe el foco.
 *
 * Respeta la indentación real del snippet con white-space: pre.
 * Muestra numeración de líneas a la izquierda.
 */

import { useRef, useCallback, useEffect } from 'react';
import type { CharState } from '@/hooks/useTypingEngine';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CodeAreaProps {
  /** Texto completo del snippet */
  snippet:      string;
  /** Estado visual de cada carácter */
  charStates:   CharState[];
  /** Índice del carácter actual (posición del cursor) */
  currentIndex: number;
  /** Si el área está activa (sesión en curso) */
  isActive:     boolean;
  /** Si la sesión terminó */
  isComplete:   boolean;
  /** Handler de teclas del motor de tipeo */
  onKeyDown:    (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

// ─── Colores por estado ───────────────────────────────────────────────────────

/**
 * Mapa de color de texto por estado del carácter.
 */
const CHAR_COLOR: Record<CharState, string> = {
  pending:   '#2a2a2a',
  correct:   '#00ffff',
  incorrect: '#ff00ff',
};

// ─── Subcomponente: un carácter individual ────────────────────────────────────

interface CharProps {
  char:      string;
  state:     CharState;
  isCursor:  boolean;
}

/**
 * Renderiza un carácter individual con su estado visual.
 * Los espacios se muestran como bloques visuales para mayor claridad.
 * El cursor tiene fondo cian y animación blink.
 */
function Char({ char, state, isCursor }: CharProps) {
  // Carácter a mostrar: los espacios se reemplazan por un bloque visual
  // solo cuando son incorrectos (para que el error sea visible)
  const display = char === ' ' && state === 'incorrect' ? '·' : char;

  if (isCursor) {
    // ── Cursor actual: fondo cian, texto negro, blink ──────────────────────
    return (
      <span
        className="animate-blink"
        style={{
          backgroundColor: '#00ffff',
          color: '#000000',
          borderRadius: 2,
          // Los saltos de línea en el cursor se muestran como bloque
          display: char === '\n' ? 'inline-block' : 'inline',
          minWidth: char === '\n' ? '0.5em' : undefined,
        }}
        aria-hidden="true"
      >
        {char === '\n' ? ' ' : display}
      </span>
    );
  }

  if (char === '\n') {
    // ── Salto de línea: no renderizar carácter visible ─────────────────────
    return (
      <span
        style={{ color: state === 'incorrect' ? '#ff00ff' : 'transparent' }}
        aria-hidden="true"
      >
        {'\n'}
      </span>
    );
  }

  return (
    <span
      style={{
        color: CHAR_COLOR[state],
        // Fondo sutil para errores
        backgroundColor: state === 'incorrect' ? 'rgba(255,0,255,0.1)' : undefined,
        // Glow muy sutil en errores para llamar la atención
        textShadow: state === 'incorrect' ? '0 0 4px rgba(255,0,255,0.4)' : undefined,
        borderRadius: state === 'incorrect' ? 2 : undefined,
      }}
      aria-hidden="true"
    >
      {display}
    </span>
  );
}

// ─── Subcomponente: numeración de líneas ──────────────────────────────────────

interface LineNumbersProps {
  lineCount: number;
}

/**
 * Columna de números de línea a la izquierda del código.
 * Números en #1a1a1a (apenas visibles), separados por un borde sutil.
 */
function LineNumbers({ lineCount }: LineNumbersProps) {
  return (
    <div
      className="select-none pr-4 text-right font-mono text-sm leading-7"
      style={{
        color: '#1a1a1a',
        borderRight: '1px solid #111111',
        minWidth: '2.5rem',
      }}
      aria-hidden="true"
    >
      {Array.from({ length: lineCount }, (_, i) => (
        <div key={i + 1}>{i + 1}</div>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CodeArea({
  snippet,
  charStates,
  currentIndex,
  isActive,
  isComplete,
  onKeyDown,
}: CodeAreaProps) {
  // Ref al input invisible que captura las teclas
  const inputRef = useRef<HTMLInputElement>(null);

  // Número de líneas del snippet (para la numeración)
  const lineCount = snippet.split('\n').length;

  // ── Auto-foco al montar el componente ─────────────────────────────────────
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Re-foco al cambiar de snippet ─────────────────────────────────────────
  useEffect(() => {
    if (!isComplete) {
      inputRef.current?.focus();
    }
  }, [snippet, isComplete]);

  // ── Click en el área → foco al input ──────────────────────────────────────
  const handleAreaClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // ── Estilo del borde según estado ─────────────────────────────────────────
  const borderStyle = isActive
    ? {
        borderColor: 'rgba(0,255,255,0.25)',
        boxShadow: '0 0 30px rgba(0,255,255,0.05)',
      }
    : {
        borderColor: 'rgba(0,255,255,0.08)',
        boxShadow: 'none',
      };

  return (
    <div
      className="relative w-full max-w-[860px] cursor-text rounded-lg border p-8 transition-all duration-300"
      style={{
        backgroundColor: '#050505',
        ...borderStyle,
      }}
      onClick={handleAreaClick}
      // Accesibilidad: indica que es un área de escritura interactiva
      role="textbox"
      aria-label="Área de tipeo — haz clic para comenzar"
      aria-multiline="true"
    >
      {/* ── Input invisible que captura las teclas ── */}
      {/*
       * Este input nunca es visible pero siempre tiene el foco.
       * caretColor: transparent oculta el cursor nativo del browser.
       * readOnly=false permite capturar keydown pero no mostramos su valor.
       */}
      <input
        ref={inputRef}
        onKeyDown={onKeyDown}
        className="absolute opacity-0"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          caretColor: 'transparent',
        }}
        aria-hidden="true"
        tabIndex={0}
        readOnly
        // Evitar que el browser sugiera autocompletado
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* ── Contenido del editor ── */}
      <div className="flex gap-4">
        {/* Numeración de líneas */}
        <LineNumbers lineCount={lineCount} />

        {/* Código con caracteres individuales */}
        <pre
          className="flex-1 font-mono text-sm leading-7 overflow-x-auto"
          style={{ whiteSpace: 'pre' }}
        >
          {snippet.split('').map((char, index) => (
            <Char
              key={index}
              char={char}
              state={charStates[index] ?? 'pending'}
              isCursor={index === currentIndex && !isComplete}
            />
          ))}

          {/* Cursor al final si se completó el snippet */}
          {isComplete && (
            <span
              style={{ color: '#00ff00' }}
              className="font-mono text-xs ml-1"
            >
              ✓
            </span>
          )}
        </pre>
      </div>

      {/* ── Hint de inicio (solo antes de comenzar) ── */}
      {!isActive && !isComplete && currentIndex === 0 && (
        <div
          className="pointer-events-none absolute inset-0 flex items-end justify-end p-4"
          aria-hidden="true"
        >
          <span
            className="font-mono text-xs tracking-widest"
            style={{ color: '#1a1a1a' }}
          >
            Empieza a escribir para comenzar
          </span>
        </div>
      )}
    </div>
  );
}
