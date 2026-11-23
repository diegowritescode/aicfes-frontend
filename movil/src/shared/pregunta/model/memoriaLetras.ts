/**
 * Where the answer was shown last time, per question.
 *
 * The shuffle can only guarantee a different letter if it knows the
 * previous one. Kept on the device rather than on the server: it is a
 * display detail, it is worthless to anyone else, and a round trip to
 * fetch it would delay the one screen that must open instantly.
 *
 * In memory, so it resets when the app does. That is the right trade:
 * a learner who closes the app and comes back days later is not
 * remembering a letter either.
 */

const ULTIMA = new Map<string, string>();

/* A cap, because a learner working through a long review would
   otherwise grow this without bound. The oldest entries are the ones
   least likely to be remembered anyway. */
const MAXIMO = 200;

export function letraAnterior(itemId: string): string | null {
  return ULTIMA.get(itemId) ?? null;
}

export function recordarLetra(itemId: string, letra: string): void {
  /* Delete before set so a repeat moves to the end: Map preserves
     insertion order, and that is what makes the eviction below drop
     the least recently seen rather than the first ever stored. */
  ULTIMA.delete(itemId);
  ULTIMA.set(itemId, letra);

  if (ULTIMA.size > MAXIMO) {
    const masViejo = ULTIMA.keys().next().value;
    if (masViejo !== undefined) ULTIMA.delete(masViejo);
  }
}

/** For tests, and for sign-out: one learner's letters are not another's. */
export function olvidarLetras(): void {
  ULTIMA.clear();
}
