/**
 * Where the answer was shown last time, and for how long running.
 *
 * The shuffle repeats a letter about a quarter of the time with four
 * options, which is what chance does and what keeps it unguessable. A
 * shuffle that never repeats would teach the learner that the
 * previous letter is ruled out — the same free information in
 * reverse.
 *
 * What is worth preventing is a long run. Measured over 2,000
 * shuffles, the same letter came up five times running eight times:
 * correct, and indistinguishable from broken. So the count is kept
 * and only a streak is cut.
 *
 * In memory rather than on the server: this is a display detail,
 * worthless to anyone else, and a round trip would delay the one
 * screen that has to open instantly. It resets with the app, which is
 * the right trade — a learner returning days later is not remembering
 * a letter either.
 */

interface Recuerdo {
  readonly letra: string;
  /** How many times in a row the answer has been on it. */
  readonly seguidas: number;
}

const ULTIMA = new Map<string, Recuerdo>();

/* A cap, because a long review would otherwise grow this without
   bound. The oldest entries are the least likely to be remembered. */
const MAXIMO = 200;

export function letraAnterior(itemId: string): string | null {
  return ULTIMA.get(itemId)?.letra ?? null;
}

export function repeticionesSeguidas(itemId: string): number {
  return ULTIMA.get(itemId)?.seguidas ?? 0;
}

export function recordarLetra(itemId: string, letra: string): void {
  const previo = ULTIMA.get(itemId);
  const seguidas = previo?.letra === letra ? previo.seguidas + 1 : 1;

  /* Delete before set so a repeat moves to the end: Map keeps
     insertion order, and that is what makes the eviction below drop
     the least recently seen rather than the first ever stored. */
  ULTIMA.delete(itemId);
  ULTIMA.set(itemId, { letra, seguidas });

  if (ULTIMA.size > MAXIMO) {
    const masViejo = ULTIMA.keys().next().value;
    if (masViejo !== undefined) ULTIMA.delete(masViejo);
  }
}

/** For tests, and for sign-out: one learner's letters are not another's. */
export function olvidarLetras(): void {
  ULTIMA.clear();
}
