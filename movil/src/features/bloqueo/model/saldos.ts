/**
 * Earned time, one balance per blocked app.
 *
 * The toll used `temporaryUnlock` with no target, which is a single
 * budget for the whole block. Three failures came out of that in one
 * session of real use, and they are all the same sentence in the
 * module's documentation: "A new call replaces any active unlock;
 * `blockSelection` cancels it."
 *
 * So: eight minutes left on Instagram, answer five questions for
 * Facebook, and the eight are gone — replaced, not added. And
 * ticking another app in the picker calls `blockSelection`, which
 * cancels whatever was earned, silently.
 *
 * Targeted grants behave the way a learner expects instead: "a
 * second targeted grant on the same target replaces the first" — the
 * same target, not every one. Each app keeps its own.
 *
 * One round of questions still unlocks everything, which is the
 * decision this does not change. It just hands each app its own
 * fifteen minutes rather than one shared pot that the next round
 * wipes.
 */

export interface AppConSaldo {
  /** Opaque handle from `getTokens` or a shield interaction. */
  readonly handle: string;
  readonly segundos: number;
}

/**
 * Apps worth granting to.
 *
 * Only applications. A category handle covers apps we cannot
 * enumerate, so granting against it would hand out time we cannot
 * account for — and the module refuses a category grant outright
 * while an allowlist is active.
 */
export function objetivosParaDesbloquear(
  tokens: ReadonlyArray<{ handle: string; type: string }>,
): readonly string[] {
  return tokens.filter((t) => t.type === 'application').map((t) => t.handle);
}

/**
 * What the home screen says about time left.
 *
 * Several balances cannot be one number, and rounding them into one
 * would be the lie that started this: the screen said 15 while
 * Instagram had 0.
 */
export function resumenDeSaldos(saldos: readonly AppConSaldo[]): {
  readonly conTiempo: number;
  readonly minutosMaximos: number;
} {
  const vivos = saldos.filter((s) => s.segundos > 0);
  return {
    conTiempo: vivos.length,
    /* The largest, not the total. Adding them implies they can be
       spent together, and they cannot — each only runs down inside
       its own app. */
    minutosMaximos: vivos.reduce(
      (mayor, s) => Math.max(mayor, Math.ceil(s.segundos / 60)),
      0,
    ),
  };
}

/** What to show, in the learner's words. */
export function textoDeSaldos(saldos: readonly AppConSaldo[]): string | null {
  const { conTiempo, minutosMaximos } = resumenDeSaldos(saldos);
  if (conTiempo === 0) return null;

  if (conTiempo === 1) {
    return `Te ${minutosMaximos === 1 ? 'queda' : 'quedan'} ${minutosMaximos} ${
      minutosMaximos === 1 ? 'minuto' : 'minutos'
    }`;
  }

  /* Named as "hasta", because the apps do not share the number —
     each has its own, and this is the biggest. */
  return `Tienes tiempo en ${conTiempo} apps, hasta ${minutosMaximos} min en una`;
}
