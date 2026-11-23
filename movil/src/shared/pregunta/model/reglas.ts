import type { Area, Dificultad, Letra } from '@/shared/model/icfes';
import type { ItemGenerado } from '../api/esquemas';

/**
 * The rules of a training run.
 *
 * All of this lived inside Test.tsx and Results.tsx, where the only
 * way to check it was to render a screen — so it never was, and the
 * answer-loss bug shipped: Results aborted its save when the start
 * time was missing, and threw away the result of the save it did
 * attempt.
 */

export interface RespuestaDada {
  readonly questionIndex: number;
  readonly itemId?: string;
  readonly area: Area;
  readonly dificultad: Dificultad;
  readonly selectedAnswer: Letra | null;
  readonly isCorrect: boolean;
  readonly tiempoMs?: number;
  readonly answeredAt: string;
}

export function esCorrecta(item: ItemGenerado, elegida: Letra): boolean {
  return item.respuesta_correcta === elegida;
}

/**
 * The explanation for the option they actually picked.
 *
 * Falls back to the general justification, because an item generated
 * before per-option explanations existed has only that — and saying
 * something true about the question beats saying nothing.
 */
export function explicacionDe(item: ItemGenerado, elegida: Letra): string {
  const propia = item.explicaciones?.[elegida];
  if (propia) return propia;
  if (item.justificacion) return item.justificacion;

  /* A bank question may carry neither — nothing requires both. Saying
     which one was right is still true and still useful; an empty box
     is neither. */
  const deLaCorrecta = item.explicaciones?.[item.respuesta_correcta];
  if (deLaCorrecta) return deLaCorrecta;
  return `La correcta es ${item.respuesta_correcta}.`;
}

export interface ResumenExamen {
  readonly total: number;
  readonly correctas: number;
  readonly porcentaje: number;
  readonly porArea: Record<string, { correct: number; total: number }>;
  readonly segundos: number;
}

/**
 * What a finished run adds up to.
 *
 * `inicio` is nullable on purpose. The web version refused to save
 * anything when it could not find a start time, which lost the whole
 * run — the answers were right there, and the only thing missing was
 * a number used for a duration. Falling back to the first answer's
 * timestamp keeps the data and loses only precision.
 */
export function resumirExamen(
  respuestas: readonly RespuestaDada[],
  inicio: Date | null,
  fin: Date = new Date(),
): ResumenExamen {
  const correctas = respuestas.filter((r) => r.isCorrect).length;

  const porArea: Record<string, { correct: number; total: number }> = {};
  for (const r of respuestas) {
    const entrada = porArea[r.area] ?? { correct: 0, total: 0 };
    entrada.total += 1;
    if (r.isCorrect) entrada.correct += 1;
    porArea[r.area] = entrada;
  }

  const primera = respuestas[0]?.answeredAt;
  const desde = inicio ?? (primera ? new Date(primera) : fin);
  const segundos = Math.max(0, Math.round((fin.getTime() - desde.getTime()) / 1000));

  return {
    total: respuestas.length,
    correctas,
    porcentaje: respuestas.length === 0 ? 0 : Math.round((correctas / respuestas.length) * 100),
    porArea,
    segundos,
  };
}

/**
 * Areas worst first, skipping the ones with no data.
 *
 * An area nobody practised is unmeasured, not weak. Sorting it into
 * "what to work on" is how the web dashboard told learners to study
 * subjects they had never tried.
 */
export function areasMasFlojas(
  porArea: Record<string, { correct: number; total: number }>,
): Array<{ area: string; porcentaje: number; correct: number; total: number }> {
  return Object.entries(porArea)
    .filter(([, v]) => v.total > 0)
    .map(([area, v]) => ({
      area,
      correct: v.correct,
      total: v.total,
      porcentaje: Math.round((v.correct / v.total) * 100),
    }))
    .sort((a, b) => a.porcentaje - b.porcentaje);
}

/**
 * Whether the tutoring panel should open.
 *
 * Only on a wrong answer, and only when the item can say something
 * useful about it. Opening a panel whose first message would be empty
 * teaches the learner that the panel is noise.
 */
export function debeAbrirTutoria(item: ItemGenerado, elegida: Letra): boolean {
  if (esCorrecta(item, elegida)) return false;
  return Boolean(item.explicaciones?.[elegida] ?? item.justificacion);
}
