import { useState, useCallback, useRef, useMemo } from 'react';

/**
 * useTypingEngine.ts
 * Motor central de tipeo de AWOS.
 *
 * Encapsula toda la lógica de estado y cálculo de métricas:
 *  - Seguimiento carácter a carácter del snippet
 *  - Detección de errores y teclas difíciles
 *  - Cálculo de WPM, CPM, precisión y progreso
 *  - Soporte para Backspace, Tab y Enter
 *
 * @param snippet  Texto completo del snippet a escribir
 */

// ─── Tipos exportados ─────────────────────────────────────────────────────────

/** Estado de cada carácter del snippet */
export type CharState = 'pending' | 'correct' | 'incorrect';

/** Resultado final de la sesión */
export interface TypingResult {
  wpm:           number;
  cpm:           number;
  precision:     number;
  totalErrors:   number;
  difficultKeys: string[];
  durationMs:    number;
  status:        'COMPLETED' | 'INVALID';
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useTypingEngine(snippet: string) {
  // ── Estado del motor ──────────────────────────────────────────────────────

  /**
   * charStates: array paralelo al snippet que indica el estado de cada carácter.
   * Inicia todo en 'pending'.
   */
  const [charStates, setCharStates] = useState<CharState[]>(
    () => Array(snippet.length).fill('pending'),
  );

  /** Índice del carácter que el usuario debe escribir a continuación */
  const [currentIndex, setCurrentIndex] = useState(0);

  /** Total de caracteres escritos correctamente (no retrocede con Backspace) */
  const [correctChars, setCorrectChars] = useState(0);

  /** Total acumulado de errores (no se reduce con Backspace) */
  const [totalErrors, setTotalErrors] = useState(0);

  /**
   * errorMap: mapa de carácter → cantidad de errores.
   * Usado para calcular las "teclas difíciles" al final de la sesión.
   */
  const errorMapRef = useRef<Record<string, number>>({});

  /** Si la sesión ha comenzado (primera tecla presionada) */
  const [isActive, setIsActive] = useState(false);

  /** Si el snippet fue completado en su totalidad */
  const [isComplete, setIsComplete] = useState(false);

  /** Timestamp del inicio de la sesión (para calcular duración real) */
  const startTimeRef = useRef<number | null>(null);

  // ── Métricas derivadas ────────────────────────────────────────────────────

  /**
   * Calcula WPM en tiempo real.
   * Fórmula estándar: (correctChars / 5) / (elapsedMinutes)
   * Retorna 0 si no hay suficiente tiempo transcurrido.
   *
   * @param elapsedSecs  Segundos transcurridos desde el inicio
   */
  const calcWpm = useCallback(
    (elapsedSecs: number): number => {
      // Evitar división por cero y resultados engañosos en los primeros 3s
      if (elapsedSecs < 3 || correctChars === 0) return 0;
      const minutes = elapsedSecs / 60;
      return Math.round(correctChars / 5 / minutes);
    },
    [correctChars],
  );

  /**
   * Precisión: porcentaje de caracteres correctos sobre el total intentado.
   * Retorna 100 si no se ha escrito nada todavía.
   */
  const precision = useMemo((): number => {
    const total = correctChars + totalErrors;
    if (total === 0) return 100;
    return Math.round((correctChars / total) * 100);
  }, [correctChars, totalErrors]);

  /**
   * Progreso: porcentaje del snippet completado.
   * Basado en currentIndex para reflejar la posición actual.
   */
  const progress = useMemo((): number => {
    if (snippet.length === 0) return 0;
    return Math.round((currentIndex / snippet.length) * 100);
  }, [currentIndex, snippet.length]);

  // ── Acción: handleKeyDown ─────────────────────────────────────────────────

  /**
   * handleKeyDown
   * Procesa cada pulsación de tecla del usuario.
   *
   * Lógica:
   *  1. Si la sesión no ha iniciado → marcar inicio y registrar timestamp
   *  2. Backspace → retroceder un carácter (restaurar a 'pending')
   *  3. Tab → insertar 2 espacios como indentación
   *  4. Enter → avanzar si el carácter esperado es \n
   *  5. Carácter imprimible → comparar con snippet[currentIndex]
   *     - Correcto: marcar 'correct', incrementar correctChars
   *     - Incorrecto: marcar 'incorrect', registrar en errorMap, incrementar totalErrors
   *  6. Si se llega al final del snippet → marcar isComplete
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Ignorar teclas modificadoras solas (Shift, Ctrl, Alt, Meta)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Ignorar si la sesión ya terminó
      if (isComplete) return;

      // ── Inicio de sesión al primer keydown ────────────────────────────────
      if (!isActive) {
        setIsActive(true);
        startTimeRef.current = Date.now();
      }

      const key = e.key;

      // ── Backspace: retroceder un carácter ─────────────────────────────────
      if (key === 'Backspace') {
        e.preventDefault();
        if (currentIndex === 0) return; // Ya estamos al inicio

        const prevIndex = currentIndex - 1;

        // Restaurar el carácter anterior a 'pending'
        setCharStates((prev) => {
          const next = [...prev];
          next[prevIndex] = 'pending';
          return next;
        });

        // Retroceder el índice
        setCurrentIndex(prevIndex);

        // Nota: correctChars y totalErrors NO se modifican con Backspace
        // (es la convención estándar en motores de tipeo)
        return;
      }

      // ── Tab: insertar 2 espacios ──────────────────────────────────────────
      if (key === 'Tab') {
        e.preventDefault();
        // Procesar 2 espacios consecutivos
        processChars('  ');
        return;
      }

      // ── Enter: avanzar si el carácter esperado es \n ──────────────────────
      if (key === 'Enter') {
        e.preventDefault();
        if (currentIndex < snippet.length && snippet[currentIndex] === '\n') {
          processChar('\n');
        }
        return;
      }

      // ── Carácter imprimible (longitud 1) ──────────────────────────────────
      if (key.length === 1) {
        e.preventDefault();
        processChar(key);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isActive, isComplete, currentIndex, snippet],
  );

  // ── Helpers internos ──────────────────────────────────────────────────────

  /**
   * processChar
   * Compara un carácter con el esperado en currentIndex y actualiza el estado.
   * Llama a checkCompletion después de cada avance.
   */
  const processChar = useCallback(
    (char: string) => {
      // No avanzar más allá del último carácter
      if (currentIndex >= snippet.length) return;

      const expected = snippet[currentIndex];
      const isCorrect = char === expected;

      // Actualiza el estado visual del carácter
      setCharStates((prev) => {
        const next = [...prev];
        next[currentIndex] = isCorrect ? 'correct' : 'incorrect';
        return next;
      });

      if (isCorrect) {
        // Carácter correcto: incrementar contador de aciertos
        setCorrectChars((c) => c + 1);
      } else {
        // Carácter incorrecto: registrar en el mapa de errores
        const key = expected === '\n' ? '↵' : expected;
        errorMapRef.current[key] = (errorMapRef.current[key] ?? 0) + 1;
        setTotalErrors((e) => e + 1);
      }

      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      // Verificar si se completó el snippet
      if (nextIndex >= snippet.length) {
        setIsComplete(true);
        setIsActive(false);
      }
    },
    [currentIndex, snippet],
  );

  /**
   * processChars
   * Procesa múltiples caracteres en secuencia (usado para Tab → 2 espacios).
   */
  const processChars = useCallback(
    (chars: string) => {
      for (const char of chars) {
        processChar(char);
      }
    },
    [processChar],
  );

  // ── Acción: reset ─────────────────────────────────────────────────────────

  /**
   * reset
   * Reinicia completamente el motor al estado inicial.
   * Se llama al cambiar de snippet o al presionar "Try Again".
   */
  const reset = useCallback(() => {
    setCharStates(Array(snippet.length).fill('pending'));
    setCurrentIndex(0);
    setCorrectChars(0);
    setTotalErrors(0);
    setIsActive(false);
    setIsComplete(false);
    startTimeRef.current = null;
    errorMapRef.current = {};
  }, [snippet.length]);

  // ── Cálculo del resultado final ───────────────────────────────────────────

  /**
   * buildResult
   * Construye el objeto TypingResult con todas las métricas finales.
   * Se llama cuando el timer expira o el snippet se completa.
   *
   * @param elapsedSecs  Segundos reales transcurridos durante la sesión
   */
  const buildResult = useCallback(
    (elapsedSecs: number): TypingResult => {
      const durationMs = elapsedSecs * 1000;
      const wpm        = calcWpm(elapsedSecs);
      const cpm        = elapsedSecs > 0
        ? Math.round(correctChars / (elapsedSecs / 60))
        : 0;

      // Teclas difíciles: las 3 con más errores, ordenadas de mayor a menor
      const difficultKeys = Object.entries(errorMapRef.current)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([key]) => key);

      // Lista completa de errores con repeticiones para enviar al backend
      // El backend necesita la frecuencia real para calcular teclas difíciles
      const keyErrorsList: string[] = []
      for (const [key, count] of Object.entries(errorMapRef.current)) {
        for (let i = 0; i < count; i++) {
          keyErrorsList.push(key)
        }
      }

      // La sesión es inválida si la precisión cae por debajo del 85%
      const finalPrecision = precision;
      const status: 'COMPLETED' | 'INVALID' =
        finalPrecision >= 85 ? 'COMPLETED' : 'INVALID';

      return {
        wpm,
        cpm,
        precision: finalPrecision,
        totalErrors,
        difficultKeys,
        keyErrorsList,
        durationMs,
        status,
      };
    },
    [calcWpm, correctChars, precision, totalErrors],
  );

  // ── Retorno del hook ──────────────────────────────────────────────────────

  return {
    // Estado del motor
    charStates,
    currentIndex,
    correctChars,
    totalErrors,
    isActive,
    isComplete,

    // Métricas derivadas
    precision,
    progress,
    calcWpm,
    buildResult,

    // Acciones
    handleKeyDown,
    reset,
  };
}
