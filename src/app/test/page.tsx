'use client';

/**
 * page.tsx — Página de test de tipeo de AWOS
 *
 * Motor de escritura completo con:
 *  - Zona A: Header de configuración (lenguaje + dificultad)
 *  - Zona B: Temporizador circular + área de código
 *  - Zona C: Métricas en vivo (WPM, precisión, errores, progreso)
 *  - Modal de resultados al finalizar
 *
 * Toda la lógica de tipeo está encapsulada en useTypingEngine.
 * El countdown está en useCountdown.
 * Las métricas se actualizan cada 500ms con useInterval.
 *
 * No hay llamadas a API — todo es local.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { RefreshCw, Zap, Target, AlertTriangle, TrendingUp } from 'lucide-react';

import { useTypingEngine }  from '@/hooks/useTypingEngine';
import { useCountdown }     from '@/hooks/useCountdown';
import { useInterval }      from '@/hooks/useInterval';

import { LanguageSelector, DEFAULT_LANGUAGES } from '@/components/ui/LanguageSelector';
import { DifficultyBadge }  from '@/components/ui/DifficultyBadge';
import { CyberButton }      from '@/components/ui/CyberButton';
import { CircularTimer }    from '@/components/test/CircularTimer';
import { CodeArea }         from '@/components/test/CodeArea';
import { ResultModal }      from '@/components/test/ResultModal';

import { getRandomSnippet } from '@/lib/test-snippets';
import type { LanguageSlug, Difficulty } from '@/lib/mock-data';
import type { TypingResult } from '@/hooks/useTypingEngine';

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Duración de la sesión en segundos */
const SESSION_SECONDS = 30;

/** Ciclo de dificultades al hacer click en el badge */
const DIFFICULTY_CYCLE: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

/** Mapa de dificultad (store) → nivel del badge (UI) — ya son iguales en v2 */
const DIFFICULTY_MAP: Record<Difficulty, 'EASY' | 'MEDIUM' | 'HARD'> = {
  EASY:   'EASY',
  MEDIUM: 'MEDIUM',
  HARD:   'HARD',
};

// ─── Subcomponente: métricas en vivo ─────────────────────────────────────────

interface LiveMetric {
  icon:  React.ReactNode;
  value: string;
  label: string;
  color: string;
}

interface LiveMetricsProps {
  metrics: LiveMetric[];
}

/**
 * Fila de 4 métricas en vivo debajo del área de código.
 * Diseño minimalista: icono + valor grande + label.
 */
function LiveMetrics({ metrics }: LiveMetricsProps) {
  return (
    <div className="grid w-full max-w-[860px] grid-cols-2 gap-3 md:grid-cols-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="flex flex-col items-center gap-1 rounded border p-4"
          style={{
            backgroundColor: '#050505',
            borderColor: 'rgba(255,255,255,0.04)',
          }}
        >
          {/* Icono */}
          <span style={{ color: m.color }} aria-hidden="true">
            {m.icon}
          </span>
          {/* Valor */}
          <span
            className="font-mono text-2xl font-bold leading-none"
            style={{ color: m.color }}
            aria-live="polite"
          >
            {m.value}
          </span>
          {/* Label */}
          <span
            className="font-mono text-xs uppercase tracking-widest"
            style={{ color: '#333333' }}
          >
            {m.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function TestPage() {

  // ── Estado de configuración ───────────────────────────────────────────────

  /** Lenguaje activo seleccionado por el usuario */
  const [activeLanguage, setActiveLanguage] = useState<LanguageSlug>('python');

  /** Dificultad activa (cicla al hacer click) */
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>('EASY');

  /** Snippet actual cargado en el área de código */
  const [currentSnippet, setCurrentSnippet] = useState(() =>
    getRandomSnippet('python'),
  );

  // ── Motor de tipeo ────────────────────────────────────────────────────────

  const engine = useTypingEngine(currentSnippet.code);

  // ── Countdown ─────────────────────────────────────────────────────────────

  const { timeLeft, isExpired, reset: resetCountdown } = useCountdown(
    SESSION_SECONDS,
    engine.isActive,
  );

  // ── Estado del modal de resultados ────────────────────────────────────────

  const [showModal,    setShowModal]    = useState(false);
  const [finalResult,  setFinalResult]  = useState<TypingResult | null>(null);

  // ── Métricas en vivo (actualizadas cada 500ms) ────────────────────────────

  /**
   * elapsedSecs: segundos transcurridos desde el inicio de la sesión.
   * Se calcula como SESSION_SECONDS - timeLeft para no depender de un ref extra.
   */
  const elapsedSecs = SESSION_SECONDS - timeLeft;

  /** WPM calculado en vivo — se actualiza en el intervalo */
  const [liveWpm, setLiveWpm] = useState(0);

  // Actualiza el WPM cada 500ms para no saturar el render
  useInterval(
    useCallback(() => {
      setLiveWpm(engine.calcWpm(elapsedSecs));
    }, [engine, elapsedSecs]),
    engine.isActive ? 500 : null,
  );

  // ── Fin de sesión: timer expirado o snippet completado ────────────────────

  /**
   * Ref para evitar que el efecto de fin de sesión se dispare dos veces.
   * (isExpired y isComplete pueden cambiar en el mismo render)
   */
  const sessionEndedRef = useRef(false);

  useEffect(() => {
    // Solo procesar una vez por sesión
    if (sessionEndedRef.current) return;
    if (!isExpired && !engine.isComplete) return;

    sessionEndedRef.current = true;

    // Construir el resultado final con los segundos reales transcurridos
    const result = engine.buildResult(Math.max(elapsedSecs, 1));
    setFinalResult(result);
    setShowModal(true);
  }, [isExpired, engine.isComplete, engine, elapsedSecs]);

  // ── Acciones ──────────────────────────────────────────────────────────────

  /**
   * handleLanguageChange
   * Cambia el lenguaje activo y carga un nuevo snippet aleatorio.
   */
  const handleLanguageChange = useCallback((lang: LanguageSlug) => {
    setActiveLanguage(lang);
    const snippet = getRandomSnippet(lang);
    setCurrentSnippet(snippet);
    engine.reset();
    resetCountdown();
    sessionEndedRef.current = false;
    setLiveWpm(0);
  }, [engine, resetCountdown]);

  /**
   * handleDifficultyClick
   * Cicla entre EASY → MEDIUM → HARD → EASY al hacer click.
   */
  const handleDifficultyClick = useCallback(() => {
    setActiveDifficulty((prev) => {
      const idx = DIFFICULTY_CYCLE.indexOf(prev);
      return DIFFICULTY_CYCLE[(idx + 1) % DIFFICULTY_CYCLE.length];
    });
  }, []);

  /**
   * handleNewSnippet
   * Carga un snippet aleatorio diferente al actual para el lenguaje activo.
   */
  const handleNewSnippet = useCallback(() => {
    const snippet = getRandomSnippet(activeLanguage, currentSnippet.id);
    setCurrentSnippet(snippet);
    engine.reset();
    resetCountdown();
    sessionEndedRef.current = false;
    setLiveWpm(0);
  }, [activeLanguage, currentSnippet.id, engine, resetCountdown]);

  /**
   * handleRetry
   * Reinicia la sesión con el mismo snippet.
   */
  const handleRetry = useCallback(() => {
    engine.reset();
    resetCountdown();
    sessionEndedRef.current = false;
    setShowModal(false);
    setFinalResult(null);
    setLiveWpm(0);
  }, [engine, resetCountdown]);

  // ── Datos de métricas en vivo ─────────────────────────────────────────────

  /**
   * Formatea el WPM para mostrar "--" si no hay suficiente tiempo.
   */
  const wpmDisplay = elapsedSecs < 3 || !engine.isActive ? '--' : liveWpm.toString();

  /**
   * Formatea la precisión para mostrar "--" si no se ha escrito nada.
   */
  const precisionDisplay =
    engine.correctChars + engine.totalErrors === 0
      ? '--'
      : `${engine.precision}%`;

  const liveMetrics: LiveMetric[] = [
    {
      icon:  <Zap size={18} />,
      value: wpmDisplay,
      label: 'WPM',
      color: '#00ffff',
    },
    {
      icon:  <Target size={18} />,
      value: precisionDisplay,
      label: 'Precisión',
      color: '#00ff00',
    },
    {
      icon:  <AlertTriangle size={18} />,
      value: engine.totalErrors.toString(),
      label: 'Errores',
      color: '#ff00ff',
    },
    {
      icon:  <TrendingUp size={18} />,
      value: `${engine.progress}%`,
      label: 'Progreso',
      color: '#ffff00',
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex min-h-screen flex-col pt-14"
      style={{ backgroundColor: '#000000' }}
    >

      {/* ════════════════════════════════════════════════════════════════════
          ZONA A — HEADER DE CONFIGURACIÓN
          ════════════════════════════════════════════════════════════════════ */}
      <header
        className="sticky top-14 z-30 px-6 py-4"
        style={{
          backgroundColor: 'rgba(0,0,0,0.9)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="mx-auto flex max-w-[860px] items-center justify-between gap-4">

      {/* ── Logo KODA pequeño — link a la landing */}
          <Link
            href="/"
            className="font-mono text-sm font-bold tracking-[0.2em] text-[#00ffff] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff]"
            style={{ textShadow: '0 0 8px rgba(0,255,255,0.4)' }}
          >
            KODA
          </Link>

          {/* Selector de lenguaje — centrado */}
          <div className="flex-1 flex justify-center">
            <LanguageSelector
              languages={DEFAULT_LANGUAGES}
              selected={activeLanguage}
              onSelect={handleLanguageChange}
            />
          </div>

          {/* Badge de dificultad clickeable — cicla entre niveles */}
          <button
            onClick={handleDifficultyClick}
            aria-label={`Dificultad actual: ${activeDifficulty}. Click para cambiar`}
            className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffff] rounded"
          >
            <DifficultyBadge difficulty={DIFFICULTY_MAP[activeDifficulty]} />
          </button>
        </div>

        {/* Separador horizontal */}
        <div
          className="mx-auto mt-4 max-w-[860px] h-px"
          style={{ backgroundColor: '#111111' }}
        />
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          ZONA B — ÁREA DE TIPEO
          ════════════════════════════════════════════════════════════════════ */}
      <main className="flex flex-1 flex-col items-center gap-6 px-6 py-8">

        {/* ── Temporizador circular ── */}
        <CircularTimer
          timeLeft={timeLeft}
          totalSeconds={SESSION_SECONDS}
          isExpired={isExpired}
        />

        {/* ── Info del snippet (lenguaje + dificultad + botón nuevo) ── */}
        <div className="flex w-full max-w-[860px] items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Badge del lenguaje activo */}
            <span
              className="rounded border px-2 py-0.5 font-mono text-xs"
              style={{
                borderColor: 'rgba(0,255,255,0.2)',
                color: '#00ffff',
                backgroundColor: 'rgba(0,255,255,0.04)',
              }}
            >
              {activeLanguage}
            </span>

            {/* Badge de dificultad */}
            <DifficultyBadge difficulty={DIFFICULTY_MAP[activeDifficulty]} />

            {/* Descripción del snippet — usa el primer tag como etiqueta */}
            <span className="hidden font-mono text-xs sm:block" style={{ color: '#333333' }}>
              {currentSnippet.tags[0] ?? currentSnippet.language.name}
            </span>
          </div>

          {/* Botón "Nuevo snippet" */}
          <CyberButton
            variant="ghost"
            size="sm"
            onClick={handleNewSnippet}
            aria-label="Cargar nuevo snippet"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Nuevo</span>
          </CyberButton>
        </div>

        {/* ── Área de código principal ── */}
        <CodeArea
          snippet={currentSnippet.code}
          charStates={engine.charStates}
          currentIndex={engine.currentIndex}
          isActive={engine.isActive}
          isComplete={engine.isComplete}
          onKeyDown={engine.handleKeyDown}
        />

        {/* ════════════════════════════════════════════════════════════════
            ZONA C — MÉTRICAS EN VIVO
            ════════════════════════════════════════════════════════════════ */}
        <LiveMetrics metrics={liveMetrics} />

      </main>

      {/* ── Modal de resultados ── */}
      <ResultModal
        isOpen={showModal}
        result={finalResult}
        onRetry={handleRetry}
      />
    </div>
  );
}
