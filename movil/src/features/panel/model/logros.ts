import type { Logro } from '../api/esquemas';

/**
 * How achievements are ordered and read.
 *
 * Pure on purpose: deciding what to show first is a rule, and a rule
 * belongs somewhere it can be tested without rendering a screen.
 */

/** 0 to 1, clamped. The server already caps `progress` at `target`,
    but a client that divides by a zero target would render NaN, and a
    bad row must not break the section. */
export function fraccion(logro: Logro): number {
  if (logro.target <= 0) return logro.achieved ? 1 : 0;
  return Math.min(1, Math.max(0, logro.progress / logro.target));
}

/** Close, but not done: the ones worth another session today. */
export function casiLogrado(logro: Logro): boolean {
  return !logro.achieved && fraccion(logro) >= 0.5;
}

/**
 * Nearly-earned first, then the rest by how close they are, and the
 * earned ones last.
 *
 * Earned achievements go to the bottom rather than disappearing: they
 * are the evidence of progress, which is the point of showing any of
 * this. But they are not what to do next, so they do not lead.
 */
export function ordenar(logros: readonly Logro[]): Logro[] {
  return [...logros].sort((a, b) => {
    if (a.achieved !== b.achieved) return a.achieved ? 1 : -1;
    return fraccion(b) - fraccion(a);
  });
}

/** What the section header says. Counting is the whole summary. */
export function resumen(logros: readonly Logro[]): {
  conseguidos: number;
  total: number;
} {
  return {
    conseguidos: logros.filter((l) => l.achieved).length,
    total: logros.length,
  };
}
