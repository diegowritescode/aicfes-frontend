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
 * And the secondary: nothing. Deliberately.
 *
 * The module offers `snooze` here, which would hand out minutes from
 * the shield itself. That is the counted emergency, and it belongs
 * inside the app where it can be counted — a shield button has no
 * memory of how many times it was pressed today.
 */
export const ACCION_SECUNDARIA = 'close' as const;

export const TEXTOS_DEL_ESCUDO = {
  /* Second person, informal, no scolding. A learner who feels judged
     by the shield uninstalls the app rather than answering five
     questions. */
  title: 'Esta app está en pausa',
  subtitle: 'Cinco preguntas y la abres.',
  primaryButtonLabel: 'Resolverlas',
  secondaryButtonLabel: 'Ahora no',
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
