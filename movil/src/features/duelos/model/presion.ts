/**
 * What a duel round says while it is being played.
 *
 * The round worked in silence: five questions, then a score. A learner
 * discovered at the end that they had been racing somebody, which is
 * the one moment the race cannot change how they play.
 *
 * The server now sends the rival's mark when the rival went first, so
 * the round can say what is at stake while there is still time to act
 * on it. These functions decide the words. Pure, so what a learner
 * reads under pressure can be tested without a phone.
 */

/** What the rival scored, as the server sends it. */
export interface MarcaDelRival {
  readonly aciertos: number;
  readonly segundos: number;
  readonly deCuantas: number;
}

/** The exam's own pace, which is what «fast» has to mean. */
export const SEGUNDOS_DEL_EXAMEN = 64;

/**
 * The line above the question.
 *
 * Names the rival, because «tu rival» is nobody. A learner plays
 * harder against Camilo than against an abstraction.
 */
export function lineaDeMarca(
  marca: MarcaDelRival | null,
  contra: string,
): string {
  /* Whoever opens first has nobody to beat yet, and must not be shown
     a zero: «Camilo: 0 de 5» reads as the rival having failed. */
  if (!marca) return `${contra} todavía no ha jugado. Pone usted la marca.`;

  const minutos = Math.floor(marca.segundos / 60);
  const resto = marca.segundos % 60;
  const tiempo = minutos > 0 ? `${minutos}:${String(resto).padStart(2, '0')}` : `${resto}s`;

  return `${contra} hizo ${marca.aciertos} de ${marca.deCuantas} en ${tiempo}.`;
}

/**
 * What this player has to do, said as an instruction.
 *
 * Separate from the mark because they answer different questions: one
 * is what happened, the other is what to do about it. A single
 * sentence carrying both gets read as neither.
 */
export function loQueHaceFalta(marca: MarcaDelRival | null): string | null {
  if (!marca) return null;

  /* A perfect round leaves no room on score, and saying «acierte 6 de
     5» would be an instruction nobody can follow. Time is the
     tie-break, so the honest version is that the round has to be
     perfect AND faster. */
  if (marca.aciertos >= marca.deCuantas) {
    return `Para ganarle tiene que acertar las ${marca.deCuantas} y en menos de ${marca.segundos}s.`;
  }

  const necesita = marca.aciertos + 1;
  return `Con ${necesita} aciertos le gana. Con ${marca.aciertos}, gana quien haya sido más rápido.`;
}

/**
 * How the elapsed time should look right now.
 *
 * Three states and not a countdown. A duel has no time limit — a
 * learner who runs out mid-question would lose to a clock rather than
 * to a rival, and the asynchronous duel exists so nobody is punished
 * for being interrupted. What the clock does instead is show the pace
 * against the exam's own 64 seconds a question.
 */
export type EstadoDelReloj = 'comodo' | 'justo' | 'lento';

export function estadoDelReloj(params: {
  readonly segundos: number;
  readonly respondidas: number;
  readonly deCuantas: number;
}): EstadoDelReloj {
  /* Before the first answer there is no pace to judge. Calling a round
     slow at second one is noise that teaches a learner to ignore the
     clock. */
  if (params.respondidas === 0) return 'comodo';

  const porPregunta = params.segundos / params.respondidas;

  if (porPregunta <= SEGUNDOS_DEL_EXAMEN * 0.75) return 'comodo';
  if (porPregunta <= SEGUNDOS_DEL_EXAMEN) return 'justo';
  return 'lento';
}

/** The clock, as mm:ss. */
export function reloj(segundos: number): string {
  const seguro = Math.max(0, Math.floor(segundos));
  const m = Math.floor(seguro / 60);
  const s = seguro % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Whether this player is currently ahead of the mark.
 *
 * Only once they have answered as many as the rival did: before that,
 * «va ganando» after one correct answer out of five is a claim that
 * will be withdrawn, and a round that keeps changing its mind about
 * who is winning is a round nobody believes.
 */
export function vaGanando(params: {
  readonly aciertos: number;
  readonly respondidas: number;
  readonly marca: MarcaDelRival | null;
}): boolean | null {
  if (!params.marca) return null;
  if (params.respondidas < params.marca.deCuantas) return null;

  return params.aciertos > params.marca.aciertos;
}
