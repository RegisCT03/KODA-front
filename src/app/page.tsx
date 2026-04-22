/**
 * page.tsx — Landing Page de KODA
 *
 * Server Component puro (sin 'use client').
 * Toda la interactividad y animaciones están en Client Components:
 *   - GalacticBackground → fondo con estrellas, nebulosas y partículas
 *   - HeroAnimations     → wrappers framer-motion para entrada escalonada
 *   - HeroCta / FinalCta → botones CTA
 *   - FeatureCards       → grid con animaciones de entrada
 *   - LanguageTicker     → cinta de lenguajes
 *
 * Estructura:
 *   1. Hero     — 100vh, fondo galáctico, título glitch, preview de código
 *   2. Ticker   — cinta de lenguajes
 *   3. Stats    — 3 métricas con animación al entrar en viewport
 *   4. Features — 3 cards "¿Por qué KODA?"
 *   5. CTA Final
 */

import { HeroCta, FinalCta }       from '@/components/landing/LandingCtas';
import { FeatureCards }             from '@/components/landing/FeatureCards';
import { LanguageTicker }           from '@/components/landing/LanguageTicker';
import { GalacticBackground }       from '@/components/landing/GalacticBackground';
import {
  AnimBadge,
  AnimTitle,
  AnimSubtitle,
  AnimDescription,
  AnimCta,
  AnimCodePreview,
  AnimStat,
  AnimCtaSection,
  AnimSectionTitle,
} from '@/components/landing/HeroAnimations';

// ═══════════════════════════════════════════════════════════════════════════════
// SECCIÓN 1 — HERO
// ═══════════════════════════════════════════════════════════════════════════════

function HeroSection() {
  return (
    <section
      className="scanline-container relative flex min-h-screen flex-col items-center justify-center px-6 pt-14"
      style={{
        backgroundColor: '#000000',
        backgroundImage: 'radial-gradient(circle, #1a1a1a 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    >
      {/* ── Fondo galáctico: estrellas, nebulosas, partículas ── */}
      <GalacticBackground />

      {/* ── Contenido centrado ── */}
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8 text-center">

        {/* Badge "Open Beta" — entra primero */}
        <AnimBadge>
          <span
            className="inline-block rounded border px-3 py-1 font-mono text-xs tracking-widest"
            style={{
              borderColor: 'rgba(0,255,255,0.4)',
              color: '#00ffff',
              backgroundColor: 'rgba(0,255,255,0.04)',
            }}
          >
            v1.0 — Open Beta
          </span>
        </AnimBadge>

        {/* Título KODA con glitch multicolor — entra con scale */}
        {/*
         * 4 capas de glitch superpuestas:
         *   cian → magenta → lima → amarillo
         * Cada capa usa keyframe y delay distintos.
         */}
        <AnimTitle>
          <div className="relative select-none">
            {/* Texto base */}
            <h1
              className="font-jetbrains font-bold leading-none tracking-tighter text-white"
              style={{
                fontSize: 'clamp(5rem, 15vw, 12rem)',
                textShadow:
                  '0 0 30px rgba(0,255,255,0.3), 0 0 60px rgba(0,255,255,0.1), 0 0 90px rgba(0,255,255,0.05)',
              }}
            >
              KODA
            </h1>
            {/* Capa glitch cian */}
            <span className="glitch-layer-cyan font-jetbrains font-bold leading-none tracking-tighter"
              style={{ fontSize: 'clamp(5rem, 15vw, 12rem)' }} aria-hidden="true">KODA</span>
            {/* Capa glitch magenta */}
            <span className="glitch-layer-magenta font-jetbrains font-bold leading-none tracking-tighter"
              style={{ fontSize: 'clamp(5rem, 15vw, 12rem)' }} aria-hidden="true">KODA</span>
            {/* Capa glitch lima */}
            <span className="glitch-layer-lime font-jetbrains font-bold leading-none tracking-tighter"
              style={{ fontSize: 'clamp(5rem, 15vw, 12rem)' }} aria-hidden="true">KODA</span>
            {/* Capa glitch amarillo */}
            <span className="glitch-layer-yellow font-jetbrains font-bold leading-none tracking-tighter"
              style={{ fontSize: 'clamp(5rem, 15vw, 12rem)' }} aria-hidden="true">KODA</span>
          </div>
        </AnimTitle>

        {/* Subtítulo */}
        <AnimSubtitle>
          <p
            className="font-mono"
            style={{ fontSize: '1.1rem', color: '#444444', letterSpacing: '0.15em' }}
          >
            Escribe código más rápido. Conviértete en mejor desarrollador.
          </p>
        </AnimSubtitle>

        {/* Descripción */}
        <AnimDescription>
          <div className="flex flex-col gap-1 font-mono" style={{ fontSize: '0.9rem', color: '#333333' }}>
            <span>Practica con snippets reales de Python, TypeScript, JavaScript y más.</span>
            <span>Mide tu WPM, precisión e identifica tus teclas más débiles.</span>
          </div>
        </AnimDescription>

        {/* CTA principal */}
        <AnimCta>
          <HeroCta />
        </AnimCta>

        {/* Preview de código — entra desde la izquierda */}
        <AnimCodePreview>
          <div
            className="hidden w-full max-w-2xl rounded-lg border p-5 text-left md:block"
            style={{ backgroundColor: '#0a0a0a', borderColor: 'rgba(0,255,255,0.15)' }}
            aria-label="Vista previa de snippet de código Python"
            role="img"
          >
            {/* Barra de título del editor mock */}
            <div className="mb-4 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#febc2e' }} />
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#28c840' }} />
              <span className="ml-3 font-mono text-xs" style={{ color: '#333333' }}>snippet.py</span>
            </div>

            {/* Código Python con syntax highlight manual */}
            <pre className="font-mono text-sm leading-7" aria-hidden="true">
              <code>
                <span style={{ color: '#333333' }}># función de saludo personalizado</span>{'\n'}
                <span style={{ color: '#ffff00' }}>def </span>
                <span style={{ color: '#00ffff' }}>saludar_usuario</span>
                <span style={{ color: '#666666' }}>(</span>
                <span style={{ color: '#888888' }}>nombre</span>
                <span style={{ color: '#666666' }}>: </span>
                <span style={{ color: '#ffff00' }}>str</span>
                <span style={{ color: '#666666' }}>) -{'>'} </span>
                <span style={{ color: '#ffff00' }}>str</span>
                <span style={{ color: '#666666' }}>:</span>{'\n'}
                <span style={{ color: '#666666' }}>{'    '}mensaje = </span>
                <span style={{ color: '#00ff00' }}>"Hola, "</span>
                <span style={{ color: '#666666' }}> + nombre + </span>
                <span style={{ color: '#00ff00' }}>"! Bienvenido a KODA."</span>{'\n'}
                <span style={{ color: '#666666' }}>{'    '}</span>
                <span style={{ color: '#ffff00' }}>return </span>
                <span style={{ color: '#666666' }}>mensaje</span>{'\n\n'}
                <span style={{ color: '#666666' }}>resultado = </span>
                <span style={{ color: '#00ffff' }}>saludar_usuario</span>
                <span style={{ color: '#666666' }}>(</span>
                <span style={{ color: '#00ff00' }}>"desarrollador"</span>
                <span style={{ color: '#666666' }}>)</span>
                <span
                  className="animate-blink ml-0.5 inline-block h-[1.1em] w-[0.55em] align-middle"
                  style={{ backgroundColor: '#00ffff' }}
                  aria-hidden="true"
                />
              </code>
            </pre>
          </div>
        </AnimCodePreview>
      </div>

      {/* Gradiente de fade hacia la siguiente sección */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
        style={{ background: 'linear-gradient(to bottom, transparent, #000000)' }}
      />
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECCIÓN 2 — STATS ROW
// ═══════════════════════════════════════════════════════════════════════════════

function StatsRow() {
  const stats = [
    { value: '1.247', label: 'Sesiones',  delay: 0.0 },
    { value: '68',    label: 'PPM Prom.', delay: 0.15 },
    { value: '4',     label: 'Lenguajes', delay: 0.3  },
  ] as const;

  return (
    <section
      className="border-y px-6 py-12"
      style={{ backgroundColor: '#080808', borderColor: '#111111' }}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-center">
        {stats.map((stat, index) => (
          <div key={stat.label} className="flex flex-1 items-center">
            {/* Separador vertical */}
            {index > 0 && (
              <div className="mr-6 h-10 w-px flex-shrink-0" style={{ backgroundColor: '#1a1a1a' }} />
            )}

            {/* Stat con animación al entrar en viewport */}
            <AnimStat delay={stat.delay}>
              <div className="flex flex-1 flex-col items-center gap-1">
                <span className="font-mono text-3xl font-bold" style={{ color: '#00ffff' }}>
                  {stat.value}
                </span>
                <span className="font-mono text-xs uppercase tracking-widest" style={{ color: '#333333' }}>
                  {stat.label}
                </span>
              </div>
            </AnimStat>
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECCIÓN 3 — FEATURES
// ═══════════════════════════════════════════════════════════════════════════════

function FeaturesSection() {
  return (
    <section className="px-6 py-24" style={{ backgroundColor: '#000000' }}>
      <div className="mx-auto max-w-5xl">

        {/* Título con línea decorativa galáctica */}
        <div className="mb-14">
          <AnimSectionTitle>
            <p className="font-mono uppercase tracking-widest" style={{ fontSize: '0.75rem', color: '#888888' }}>
              ¿Por qué KODA?
            </p>
          </AnimSectionTitle>
        </div>

        {/* Grid de feature cards */}
        <FeatureCards />
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECCIÓN 4 — CTA FINAL
// ═══════════════════════════════════════════════════════════════════════════════

function FinalCtaSection() {
  return (
    <section
      className="relative overflow-hidden px-6 py-32 text-center"
      style={{ backgroundColor: '#000000' }}
    >
      {/* Nebulosa de fondo para el CTA */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,255,255,0.04) 0%, transparent 70%)',
        }}
      />

      <AnimCtaSection>
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-8">

          {/* Línea decorativa superior */}
          <div
            style={{
              height: 1,
              width: 120,
              background: 'linear-gradient(to right, transparent, rgba(0,255,255,0.4), transparent)',
            }}
          />

          {/* Texto principal */}
          <h2
            className="font-jetbrains font-bold leading-tight"
            style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', color: '#ffffff' }}
          >
            ¿Listo para mejorar tu velocidad de tipeo?
          </h2>

          {/* Botón CTA con glow pulsante */}
          <div className="cta-glow rounded-lg p-1">
            <FinalCta />
          </div>

          {/* Texto de apoyo */}
          <p className="font-mono text-xs tracking-widest" style={{ color: '#333333' }}>
            Gratis para siempre. Sin tarjeta de crédito.
          </p>

          {/* Línea decorativa inferior */}
          <div
            style={{
              height: 1,
              width: 80,
              background: 'linear-gradient(to right, transparent, rgba(0,255,255,0.2), transparent)',
            }}
          />
        </div>
      </AnimCtaSection>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default function HomePage() {
  return (
    <main>
      {/* Hero con fondo galáctico y animaciones de entrada */}
      <HeroSection />

      {/* Cinta de lenguajes */}
      <LanguageTicker />

      {/* Stats con animación al entrar en viewport */}
      <StatsRow />

      {/* Features con animación escalonada */}
      <FeaturesSection />

      {/* CTA final con glow pulsante */}
      <FinalCtaSection />
    </main>
  );
}
