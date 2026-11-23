import type { Letra } from '@/shared/model/icfes';
import type { PreguntaDelLote } from '../api/esquemas';

/**
 * What the learner has to do before the distracting app opens again.
 *
 * The product's whole premise: the social app stays available, but now
 * it costs something, and what it costs is exactly the thing they
 * needed to do. It is the one mechanic with evidence behind it —
 * self-regulation was what predicted adolescents staying in the one
 * study with real usage logs, where a chatbot predicted nothing.
 *
 * Pure, because every rule here is a product decision that should be
 * arguable from a test rather than from a screenshot.
 */

/**
 * Minutes of access a cleared block buys.
 *
 * **Minutes of use, not of clock.** Verified in the native module's
 * own source (`expo-screen-time@0.3.0`,
 * `src/ExpoScreenTimeModule.ts:111`): "The budget is usage-based, not
 * wall-clock: it is only spent while a blocked app is actually in the
 * foreground — it pauses when the user leaves and resumes when they
 * come back."
 *
 * That is more generous than a timer and has to be said that way, or
 * a learner who closes Instagram after three minutes and comes back to
 * find twelve left will think the app is broken.
 */
export const MINUTOS_DESBLOQUEO = 15;

export interface IntentoDelPeaje {
  readonly itemId: string;
  readonly elegida: Letra;
  readonly correcta: boolean;
  readonly tiempoMs: number;
}

export interface EstadoDelPeaje {
  readonly preguntas: readonly PreguntaDelLote[];
  readonly intentos: readonly IntentoDelPeaje[];
}

export function esCorrecta(pregunta: PreguntaDelLote, elegida: Letra): boolean {
  return pregunta.respuesta_correcta === elegida;
}

/** The question being asked right now, or null when the block is done. */
export function preguntaActual(estado: EstadoDelPeaje): PreguntaDelLote | null {
  return estado.preguntas[estado.intentos.length] ?? null;
}

export function vanRespondidas(estado: EstadoDelPeaje): number {
  return estado.intentos.length;
}

/**
 * Whether the block is cleared.
 *
 * Answering is enough: getting them right is not required.
 *
 * That is the central decision of this feature and it goes against the
 * instinct to demand correctness. Three reasons. A learner locked out
 * for being wrong is punished for the exact thing the product exists
 * to fix, and will uninstall rather than study. A wrong answer is the
 * most valuable datum the system has — it feeds the weakness profile,
 * so a block that rejects it collects less of what it needs. And a
 * toll that can be failed is a toll someone will game by guessing
 * until it passes, which teaches guessing.
 *
 * The explanation shown after each answer is where the learning
 * happens, and that is informative feedback — the one thing with a
 * measured positive effect (d = +0.33), as opposed to rewards for
 * completing, which measure negative in adolescents.
 */
export function estaPagado(estado: EstadoDelPeaje): boolean {
  return estado.preguntas.length > 0 && estado.intentos.length >= estado.preguntas.length;
}

/**
 * When access would expire if the learner used it continuously.
 *
 * An upper bound, not a deadline: the real budget only runs down while
 * the blocked app is in the foreground, and the native layer is what
 * meters it. This exists for the screen to show something honest
 * before the native layer is wired up, and should be replaced by
 * `getRemainingUnlockSeconds()` once it is.
 */
export function venceEn(pagadoEn: Date, minutos = MINUTOS_DESBLOQUEO): Date {
  return new Date(pagadoEn.getTime() + minutos * 60_000);
}

export function sigueDesbloqueado(vence: Date, ahora = new Date()): boolean {
  return vence.getTime() > ahora.getTime();
}

export function minutosRestantes(vence: Date, ahora = new Date()): number {
  const ms = vence.getTime() - ahora.getTime();
  return ms <= 0 ? 0 : Math.ceil(ms / 60_000);
}

/** What to tell the learner about how the block went. */
export function resumen(estado: EstadoDelPeaje): {
  respondidas: number;
  acertadas: number;
  total: number;
} {
  return {
    respondidas: estado.intentos.length,
    acertadas: estado.intentos.filter((i) => i.correcta).length,
    total: estado.preguntas.length,
  };
}

/**
 * Whether a block can even be offered.
 *
 * With no questions on the device the toll must not block anything: a
 * barrier the learner cannot pass is not self-regulation, it is a
 * broken app holding their phone hostage.
 */
export function puedeEmpezar(preguntas: readonly PreguntaDelLote[]): boolean {
  return preguntas.length > 0;
}
