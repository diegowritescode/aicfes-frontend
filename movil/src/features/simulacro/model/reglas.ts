import type { Area } from '@/shared/model/icfes';
import type { PreguntaSimulacro, ResultadosSimulacro } from '../api/esquemas';

/**
 * The rules of a sitting, as functions over data.
 *
 * None of this renders anything, which is the point: deciding what the
 * map shows, how long is left and which areas to study first are
 * decisions with right and wrong answers, and they can be checked
 * without mounting a screen. In the web app the same logic lived
 * inside components, where the only way to test it was to render one.
 */

export interface PuntoMapa {
  readonly orden: number;
  readonly area: Area;
  readonly respondida: boolean;
  readonly marcada: boolean;
}

/**
 * The question map.
 *
 * Answered and flagged are independent: "I put C but I am not sure" is
 * what the real exam's scratch sheet is mostly used for, and a map
 * that treated them as one state could not show it.
 */
export function mapaDe(preguntas: readonly PreguntaSimulacro[]): PuntoMapa[] {
  return preguntas.map((p) => ({
    orden: p.orden,
    area: p.area,
    respondida: p.respuesta !== null,
    marcada: p.marcada,
  }));
}

export interface AvanceSimulacro {
  readonly respondidas: number;
  readonly marcadas: number;
  readonly total: number;
  readonly sinResponder: number;
}

export function avanceDe(puntos: readonly PuntoMapa[]): AvanceSimulacro {
  const respondidas = puntos.filter((p) => p.respondida).length;
  return {
    respondidas,
    marcadas: puntos.filter((p) => p.marcada).length,
    total: puntos.length,
    sinResponder: puntos.length - respondidas,
  };
}

/**
 * The next question worth going to when the learner reaches the end.
 *
 * Flagged first, then merely unanswered. Someone who flagged a
 * question meant to come back to it; someone who skipped one may have
 * skipped it on purpose. Returns null when there is nothing left,
 * which is what lets the screen offer to hand the sitting in.
 */
export function siguientePendiente(
  puntos: readonly PuntoMapa[],
  desde: number,
): number | null {
  const candidatos = [
    ...puntos.filter((p) => p.marcada && !p.respondida),
    ...puntos.filter((p) => p.marcada && p.respondida),
    ...puntos.filter((p) => !p.marcada && !p.respondida),
  ];
  if (candidatos.length === 0) return null;

  /* Wrap around from where they are, so "next" means next rather than
     "back to the top" when they are working through the end. */
  const adelante = candidatos.find((p) => p.orden > desde);
  return (adelante ?? candidatos[0])?.orden ?? null;
}

/** mm:ss, for a clock the learner reads under pressure. */
export function comoReloj(segundos: number): string {
  const seguro = Math.max(0, Math.floor(segundos));
  const minutos = Math.floor(seguro / 60);
  const resto = seguro % 60;
  return `${minutos}:${String(resto).padStart(2, '0')}`;
}

/** Under five minutes, which is when the clock should start shouting. */
export function vaApurado(segundos: number): boolean {
  return segundos <= 300;
}

/**
 * Areas worst first, which is the study plan.
 *
 * An area with no questions is not a weak area, it is an unmeasured
 * one, and sorting it to the top of "what to work on" is how the web
 * dashboard told learners to study things they had never tried.
 */
export function areasPorPrioridad(
  resultados: ResultadosSimulacro,
): ResultadosSimulacro['areas'] {
  return [...resultados.areas].sort((a, b) => {
    const medidaA = a.total > 0;
    const medidaB = b.total > 0;
    if (medidaA !== medidaB) return medidaA ? -1 : 1;
    return a.porcentaje - b.porcentaje;
  });
}

/**
 * Whether a sitting of this size can be drawn from the bank.
 *
 * Offering one that cannot is worse than not offering it: the learner
 * picks a length, waits, and gets a refusal explaining that an area
 * ran out. When the bank's capacity is unknown, offer everything —
 * a failed capacity read should not empty the screen.
 */
export function alcanzaElBanco(preguntas: number, maximo: number | null): boolean {
  return maximo === null || preguntas <= maximo;
}
