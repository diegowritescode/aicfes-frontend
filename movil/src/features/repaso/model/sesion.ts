import type { ErrorPendiente } from '../api/esquemas';

/**
 * A review run: one question at a time, like training.
 *
 * The first version listed every mistake as a collapsible card. It was
 * reported as hard to concentrate in — all the questions sat on screen
 * together, a wrong answer left the card open, and closing and
 * reopening let you answer again with the right one already visible.
 *
 * Reviewing means concentrating, which means one question on screen
 * and nothing else.
 */

export interface IntentoDeRepaso {
  readonly itemId: string;
  /** The ORIGINAL letter, not the displayed one: options get shuffled
      on a repeat, and the history has to survive that. */
  readonly elegida: string;
  readonly correcta: boolean;
}

export interface SesionDeRepaso {
  readonly errores: readonly ErrorPendiente[];
  readonly intentos: readonly IntentoDeRepaso[];
  /** How many the learner has moved past — separate from answered,
      because the explanation sits between the two. Conflating them is
      what made the toll jump a question on tap. */
  readonly avanzadas: number;
}

export function errorActual(sesion: SesionDeRepaso): ErrorPendiente | null {
  return sesion.errores[sesion.avanzadas] ?? null;
}

export function terminada(sesion: SesionDeRepaso): boolean {
  return sesion.errores.length > 0 && sesion.avanzadas >= sesion.errores.length;
}

export function resumen(sesion: SesionDeRepaso): {
  corregidas: number;
  total: number;
  respondidas: number;
} {
  return {
    corregidas: sesion.intentos.filter((i) => i.correcta).length,
    total: sesion.errores.length,
    respondidas: sesion.intentos.length,
  };
}

/**
 * What to say at the end.
 *
 * Reports what happened rather than congratulating: a learner who got
 * one of five right is not helped by "¡bien hecho!", and one who got
 * five of five already knows.
 */
export function cierre(sesion: SesionDeRepaso): string {
  const { corregidas, total } = resumen(sesion);
  if (corregidas === total) return 'Las corregiste todas.';
  if (corregidas === 0) return 'Ninguna salió todavía. Vuelven en el próximo repaso.';
  return `Corregiste ${corregidas} de ${total}. Las otras vuelven.`;
}
