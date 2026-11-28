/**
 * One player's round of a duel.
 *
 * Separate from the screen and pure because the index bug this
 * prevents has already happened twice in this app. In the toll,
 * `preguntaActual` derived the index from `intentos.length`, so a tap
 * jumped a question. In the review screen, a list reload brought new
 * object identities mid-answer and the options reshuffled *after* the
 * learner had chosen.
 *
 * A duel is worse than either: both players answer the same five
 * questions and are scored against each other, so a skipped question
 * is a lost duel for a reason the learner cannot see.
 *
 * So the questions are frozen when the round starts, the index is its
 * own value, and nothing here reads a live query.
 */

export interface RespuestaDeRonda {
  readonly itemId: string;
  readonly eleccion: string;
}

export interface Ronda {
  /** Frozen at the start. Never re-read from a query. */
  readonly preguntas: readonly { readonly id: string }[];
  /** Advanced explicitly, never derived from how many were answered. */
  readonly indice: number;
  readonly respuestas: readonly RespuestaDeRonda[];
}

/** The question on screen, or null when the round is over. */
export function preguntaActual(ronda: Ronda): { readonly id: string } | null {
  return ronda.preguntas[ronda.indice] ?? null;
}

/** What this player chose for the current question, if anything. */
export function eleccionActual(ronda: Ronda): string | null {
  const actual = preguntaActual(ronda);
  if (!actual) return null;
  return ronda.respuestas.find((r) => r.itemId === actual.id)?.eleccion ?? null;
}

/**
 * Records a choice.
 *
 * Replaces rather than appends, so a learner changing their mind on
 * the question in front of them does not send two answers for it. The
 * server dedupes as well; this keeps the screen honest about what it
 * will send.
 */
export function responder(ronda: Ronda, eleccion: string): Ronda {
  const actual = preguntaActual(ronda);
  if (!actual) return ronda;

  const sinEsta = ronda.respuestas.filter((r) => r.itemId !== actual.id);
  return { ...ronda, respuestas: [...sinEsta, { itemId: actual.id, eleccion }] };
}

/**
 * Moves to the next question.
 *
 * Stops at the end rather than running past it: the round is finished
 * by submitting, and an index beyond the last question would render a
 * blank screen with a live timer.
 */
export function avanzar(ronda: Ronda): Ronda {
  if (ronda.indice >= ronda.preguntas.length) return ronda;
  return { ...ronda, indice: ronda.indice + 1 };
}

export function esUltima(ronda: Ronda): boolean {
  return ronda.indice === ronda.preguntas.length - 1;
}

export function termino(ronda: Ronda): boolean {
  return ronda.indice >= ronda.preguntas.length;
}

/**
 * How many questions still have no answer.
 *
 * Shown before submitting, because a duel is scored on accuracy and
 * leaving one blank is never better than guessing.
 */
export function sinResponder(ronda: Ronda): number {
  const respondidas = new Set(ronda.respuestas.map((r) => r.itemId));
  return ronda.preguntas.filter((p) => !respondidas.has(p.id)).length;
}

/** Progress for the bar, as a fraction. */
export function avance(ronda: Ronda): number {
  if (ronda.preguntas.length === 0) return 0;
  return Math.min(1, ronda.indice / ronda.preguntas.length);
}
