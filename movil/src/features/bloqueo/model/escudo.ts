/**
 * What the shield says and does when a blocked app is opened.
 *
 * Separate from the service because every string and every action here
 * is a product decision. The shield is the only screen a learner sees
 * at the exact moment they reached for Instagram, and what it offers
 * at that moment is the whole mechanic.
 */

/** The selection the toll blocks. One, named, so it can be replaced. */
export const SELECCION = 'peaje';

/**
 * What the shield's main button does: open this app.
 *
 * Not `unblock`, which would lift the shield for nothing, and not
 * `close`, which sends them to the home screen having learned
 * nothing. `openApp` is what turns a wall into a toll — the learner
 * lands on the exercises, which is the only version of this that
 * teaches anything.
 *
 * On Android this reaches the app at once; on iOS it arrives through
 * a notification the learner taps, which is why the `shieldOpenApp`
 * feature adds the notifications permission step.
 */
export const ACCION_PRINCIPAL = { type: 'openApp' } as const;

/**
 * The secondary button also opens the app — to a different screen.
 *
 * It used to be `close`, which dismissed the shield and did nothing
 * else. Reported as a real problem: from the shield there appeared
 * to be no way out but the exercises, when in fact the counted
 * emergency was one tap inside the toll. A way out nobody can find
 * is a way out that does not exist.
 *
 * Not `snooze`, which the module also offers and which would hand
 * out minutes from the shield itself. The shield has no memory of
 * how many times it was pressed today, so a snooze button is an
 * unlimited one — and an unlimited way out is the button a
 * procrastinator presses every time, which is the toll not existing.
 *
 * Opening the app keeps the count where the count lives.
 */
export const ACCION_SECUNDARIA = { type: 'openApp' } as const;

export const TEXTOS_DEL_ESCUDO = {
  /* Second person, informal, no scolding. A learner who feels judged
     by the shield uninstalls the app rather than answering five
     questions. */
  title: 'Esta app está en pausa',
  /* No scolding and no cheerleading. A learner who feels judged by
     the shield uninstalls rather than answering five questions, and
     one who feels patronised does the same. */
  subtitle: 'Cinco preguntas y entras.',
  primaryButtonLabel: 'Resolverlas',
  /* Named for what it does now: it opens the choices, rather than
     declining on the learner's behalf. */
  secondaryButtonLabel: 'Ver opciones',
} as const;

/**
 * Seconds of use a cleared block buys.
 *
 * Usage-based, not wall-clock: the budget only runs down while a
 * blocked app is in the foreground. More generous than a timer, and
 * it has to be said that way or a learner who closes Instagram after
 * three minutes and finds twelve left thinks the app is broken.
 */
export function segundosDeDesbloqueo(minutos: number): number {
  /* Floored at 30: the module raises anything lower anyway, and a
     number the native layer silently changes is worse than one that
     was never offered. */
  return Math.max(30, Math.round(minutos * 60));
}

/**
 * Seconds of breathing room granted on arriving at the toll.
 *
 * Reported from a real phone: tapping Resolverlas opened the
 * exercises and a second later the shield was back, unprompted. The
 * blocked app is still in the foreground for a moment while Android
 * switches, and the shield fires again on it.
 *
 * Thirty is the module's floor for a temporary unlock, and it is
 * also about right: long enough for the switch to settle, short
 * enough that nobody reads a question in it and walks away with free
 * access.
 *
 * This is not the reward. Clearing the block grants
 * `MINUTOS_DESBLOQUEO`; this only stops the shield from interrupting
 * the thing it asked for.
 */
export const SEGUNDOS_DE_RESPIRO = 30;
