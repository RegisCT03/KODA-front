'use client';

/**
 * DifficultyBadge.tsx
 * Badge de dificultad con colores semánticos para AWOS.
 *
 * Colores por nivel:
 *  - EASY   → lima    (#00ff00)
 *  - MEDIUM → amarillo (#ffff00)
 *  - HARD   → magenta (#ff00ff)
 *
 * Componente puramente presentacional, sin estado interno.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

interface DifficultyBadgeProps {
  /** Nivel de dificultad a mostrar */
  difficulty: DifficultyLevel;
}

// ─── Mapa de estilos por nivel ────────────────────────────────────────────────

/**
 * Cada nivel tiene un conjunto de colores para texto, borde y fondo.
 * Se usan estilos inline para evitar purgar clases dinámicas en Tailwind.
 */
const DIFFICULTY_STYLES: Record<
  DifficultyLevel,
  { color: string; borderColor: string; backgroundColor: string; label: string }
> = {
  EASY: {
    color:           '#00ff00',
    borderColor:     'rgba(0,255,0,0.3)',
    backgroundColor: 'rgba(0,255,0,0.05)',
    label:           'Fácil',
  },
  MEDIUM: {
    color:           '#ffff00',
    borderColor:     'rgba(255,255,0,0.3)',
    backgroundColor: 'rgba(255,255,0,0.05)',
    label:           'Medio',
  },
  HARD: {
    color:           '#ff00ff',
    borderColor:     'rgba(255,0,255,0.3)',
    backgroundColor: 'rgba(255,0,255,0.05)',
    label:           'Difícil',
  },
};

// ─── Componente principal ─────────────────────────────────────────────────────

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const styles = DIFFICULTY_STYLES[difficulty];

  return (
    <span
      style={{
        color:           styles.color,
        borderColor:     styles.borderColor,
        backgroundColor: styles.backgroundColor,
        borderWidth:     1,
        borderStyle:     'solid',
      }}
      className="inline-block rounded px-2.5 py-0.5 font-mono text-xs font-semibold uppercase tracking-widest"
      // Accesibilidad: indica el nivel de dificultad al lector de pantalla
      aria-label={`Dificultad: ${styles.label}`}
    >
      {styles.label}
    </span>
  );
}
