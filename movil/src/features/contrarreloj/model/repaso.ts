import type { ItemGenerado } from '@/shared/pregunta/api/esquemas';
import type { RespuestaDada } from '@/shared/pregunta/model/reglas';

/**
 * What a finished run actually says.
 *
 * The end screen showed «3 de 5 correctas» and a sentence. Everything
 * else was already in memory and was dropped when the screen
 * unmounted: which questions went wrong, what topic each one was,
 * how long each took, and the explanation written when the item was
 * generated.
 *
 * That omission costs twice. A learner finishes a round knowing a
 * number and not one of the questions — the moment they are most
 * willing to read why they were wrong is the moment the app says
 * nothing. And a round started from the weekly plan looks identical
 * to any other, so the plan's whole promise («esto es lo tuyo») is
 * invisible even when the filter worked. Reported from a phone:
 * «son prácticamente lo mismo, no vi diferencias».
 *
 * Pure, so the grouping and the pace rules can be tested without a
 * render environment, which this project does not have.
 */

export interface PreguntaDelRepaso {
  readonly item: ItemGenerado;
  readonly elegida: string | null;
  readonly correcta: string;
  readonly acerto: boolean;
  readonly segundos: number | null;
  /** The topic, as the item carries it. Null when untagged. */
  readonly tema: string | null;
}

export interface RepasoDeRonda {
  readonly total: number;
  readonly correctas: number;
  /** Seconds per question across the run, or null when untimed. */
  readonly segundosMediana: number | null;
  /** Wrong ones first: they are why this screen exists. */
  readonly falladas: readonly PreguntaDelRepaso[];
  readonly acertadas: readonly PreguntaDelRepaso[];
  /**
   * The topic this round was about, when one dominates.
   *
   * Null when the questions are spread across topics, which is what
   * a general round looks like. This is what lets the screen say «esto
   * era proporcionalidad» after a plan action, and say nothing after
   * a normal run rather than inventing a theme.
   */
  readonly temaDominante: string | null;
}

/** A topic has to cover this much of the round to be called its subject. */
const PROPORCION_DOMINANTE = 0.6;

/** The real exam's pace: 254 questions in 270 minutes. */
export const SEGUNDOS_DEL_EXAMEN = 64;

/**
 * The first tag, which is the item's main topic.
 *
 * Generators list several and the first is the one they classified
 * by; the rest are detail. Taking all of them would make every round
 * look mixed.
 */
function temaDe(item: ItemGenerado): string | null {
  const tags = item.tags;
  if (!Array.isArray(tags) || tags.length === 0) return null;
  const primero = tags[0];
  return typeof primero === 'string' && primero.trim() ? primero : null;
}

/** The middle value, which one slow question cannot drag. */
function mediana(valores: readonly number[]): number | null {
  if (valores.length === 0) return null;

  const ordenados = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(ordenados.length / 2);

  if (ordenados.length % 2 === 1) return ordenados[medio]!;
  return Math.round((ordenados[medio - 1]! + ordenados[medio]!) / 2);
}

/**
 * Pairs each answer back with the question it answered.
 *
 * Unanswered questions are left out rather than counted as wrong.
 * When the clock runs out mid-round the learner did not fail those,
 * they never saw them, and a review listing them as mistakes would
 * be telling them something untrue about themselves.
 */
export function repasoDeRonda(
  items: readonly ItemGenerado[],
  respuestas: readonly RespuestaDada[],
): RepasoDeRonda {
  const porIndice = new Map(respuestas.map((r) => [r.questionIndex, r]));

  const preguntas: PreguntaDelRepaso[] = [];

  items.forEach((item, indice) => {
    const respuesta = porIndice.get(indice);
    if (!respuesta) return;

    preguntas.push({
      item,
      elegida: respuesta.selectedAnswer ?? null,
      correcta: item.respuesta_correcta,
      acerto: respuesta.isCorrect,
      segundos:
        typeof respuesta.tiempoMs === 'number'
          ? Math.round(respuesta.tiempoMs / 1000)
          : null,
      tema: temaDe(item),
    });
  });

  const temas = preguntas.map((p) => p.tema).filter((t): t is string => t !== null);
  const conteo = new Map<string, number>();
  for (const tema of temas) conteo.set(tema, (conteo.get(tema) ?? 0) + 1);

  const mayor = [...conteo].sort((a, b) => b[1] - a[1])[0];

  return {
    total: preguntas.length,
    correctas: preguntas.filter((p) => p.acerto).length,
    segundosMediana: mediana(
      preguntas.map((p) => p.segundos).filter((s): s is number => s !== null),
    ),
    falladas: preguntas.filter((p) => !p.acerto),
    acertadas: preguntas.filter((p) => p.acerto),
    /* Measured against the answered questions, not the served ones:
       a round cut short by the clock is still about whatever its
       first three questions were about. */
    temaDominante:
      mayor && preguntas.length > 0 && mayor[1] / preguntas.length >= PROPORCION_DOMINANTE
        ? mayor[0]
        : null,
  };
}

/** The topic as a learner reads it: «leyes de newton», not «leyes_de_newton». */
export function temaLegible(tema: string): string {
  return tema.replace(/[-_]/g, ' ');
}
