/**
 * What a wrong answer costs, and what reading costs.
 *
 * This exists because the toll was reported as skippable, by the
 * person who built it, on the first day of real use: "puedo
 * simplemente no leer la pregunta, y darle con mi dedo, sin mirar
 * hasta que se quite ese bloqueo, así pierda o gane, no me interesa."
 *
 * He was right, and the reason is in the old rule: clearing the block
 * required *answering* five questions, not getting them right. So the
 * toll charged for tapping, and tapping is what it got. A mechanic
 * gets played the way it is scored.
 *
 * Two changes, and neither of them locks anyone out.
 *
 * **A wrong answer adds a question.** Guessing stops being free: it
 * makes the block longer. Thinking is now the fast way out, which is
 * the only version of this that teaches anything.
 *
 * **The explanation holds the button for a moment, but only after a
 * mistake.** Not the terms-and-conditions countdown, which teaches
 * waiting rather than reading — a correct answer moves on instantly,
 * so the pause is a consequence of being wrong, not a tax on
 * everyone.
 *
 * What is deliberately *not* here: a pass mark. A learner who cannot
 * answer still gets out, just later. Locking someone out for not
 * knowing punishes them for the exact thing the product exists to
 * fix, and ADR 10 is about rewards for completing measuring negative
 * in adolescents; a block that can be failed would be worse.
 */

/** Questions a block asks when every answer is right. */
export const BASE = 5;

/**
 * Extra questions a wrong answer buys.
 *
 * One. Two would make a bad day feel like punishment, and the point
 * is to make guessing expensive, not to make failing painful.
 */
export const RECARGO_POR_FALLO = 1;

/**
 * The most a block can ever ask.
 *
 * Without a ceiling, a learner who knows nothing today answers
 * forever — the barrier they cannot pass that `puedeEmpezar` already
 * refuses to create. Eight is five plus three mistakes, which is a
 * bad run rather than a wall.
 */
export const TECHO = 8;

/** Seconds the explanation holds the button after a wrong answer. */
export const SEGUNDOS_DE_LECTURA = 4;

/**
 * How many questions this block asks, given what has been answered.
 *
 * Recomputed from the attempts rather than stored, so it cannot drift
 * from them — and so a resumed block arrives at the same number it
 * had when the learner left.
 */
export function cuantasPide(fallos: number): number {
  const pedidas = BASE + Math.max(0, fallos) * RECARGO_POR_FALLO;
  return Math.min(TECHO, pedidas);
}

/** Whether the block is cleared. */
export function estaPagado(params: {
  readonly avanzadas: number;
  readonly fallos: number;
  /** Questions actually on the device; a short pool cannot be exceeded. */
  readonly disponibles: number;
}): boolean {
  const pide = Math.min(cuantasPide(params.fallos), params.disponibles);
  return pide > 0 && params.avanzadas >= pide;
}

/**
 * What to tell the learner when a mistake lengthens the block.
 *
 * Said plainly and without scolding. A learner who sees the number
 * grow with no explanation concludes the app is broken or unfair,
 * and either conclusion ends with it uninstalled.
 */
export function avisoDeRecargo(params: {
  readonly fallos: number;
  readonly pedidas: number;
}): string | null {
  if (params.fallos === 0) return null;
  if (params.pedidas >= TECHO) {
    /* At the ceiling the number stops moving, and saying so matters:
       otherwise the next mistake looks like it was ignored. */
    return 'Ya no se alarga más. Termina estas y sales.';
  }
  return 'Esa falló: una pregunta más.';
}

/**
 * Whether the button should wait before letting them move on.
 *
 * Only after a mistake, and only for a few seconds. A correct answer
 * moves on at once — the delay is what a wrong answer costs in
 * attention, not a toll on everyone that teaches people to stare at
 * a timer.
 */
export function esperaAntesDeSeguir(acerto: boolean): number {
  return acerto ? 0 : SEGUNDOS_DE_LECTURA;
}
