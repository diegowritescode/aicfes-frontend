/**
 * Whether the app was opened by the shield, and not by the learner.
 *
 * The shield's button opens the app and says nothing about why. Without
 * this the learner lands on Inicio — which is what shipped: the block
 * worked, the shield appeared, "Resolverlas" opened AICFES, and then
 * nothing. A toll that drops you at the front door is a toll with no
 * gate.
 *
 * Pure, because the one rule here is a judgement call about time and
 * it should be arguable from a test.
 */

export interface InteraccionDelEscudo {
  readonly button: 'primary' | 'secondary';
  /** Unix milliseconds. */
  readonly timestamp: number;
  /* Which app was shielded. Null when the module could not derive
     one. Kept so the toll can name it — "Abrir la app" over a screen
     that goes to Inicio is a label that lies. */
  readonly target?: string | null;
}

/**
 * How recent a press has to be to count as "this launch".
 *
 * Interactions queue up until something drains them, so a press from
 * yesterday is still in the list the first time the app reads it.
 * Sending a learner to the toll because of a tap they made last night
 * would be the app inventing a block.
 *
 * Two minutes: long enough for a cold start on a slow phone, short
 * enough that it can only mean the press that just happened.
 */
export const SEGUNDOS_DE_GRACIA = 120;

/**
 * The press that opened this launch, if any.
 *
 * Only `primary` — that is "Resolverlas". `secondary` is "Ahora no",
 * which closes the shield and must not open anything; a learner who
 * declined and then found the exercises in front of them would have
 * been ignored.
 */
export function pulsacionQueAbrio(
  interacciones: readonly InteraccionDelEscudo[],
  ahora: number = Date.now(),
): InteraccionDelEscudo | null {
  const limite = ahora - SEGUNDOS_DE_GRACIA * 1000;

  /* The most recent qualifying one. Several can queue if the learner
     tapped twice while the app was starting. */
  return (
    [...interacciones]
      .filter((i) => i.button === 'primary' && i.timestamp >= limite)
      .sort((a, b) => b.timestamp - a.timestamp)[0] ?? null
  );
}

/** Whether this launch should go straight to the toll. */
export function vieneDelEscudo(
  interacciones: readonly InteraccionDelEscudo[],
  ahora: number = Date.now(),
): boolean {
  return pulsacionQueAbrio(interacciones, ahora) !== null;
}
