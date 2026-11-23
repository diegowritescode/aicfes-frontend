/**
 * What a daily reminder says.
 *
 * It talks about the content, not about the streak. That is a
 * deliberate choice against the obvious one: a streak reminder is what
 * Duolingo does and it works for retention, but Deci/Koestner/Ryan
 * measured completion-contingent rewards at d = −0.36 on intrinsic
 * motivation, and worse in adolescents than in university students. A
 * notification that says "no la rompas" makes the goal the number.
 *
 * Informative feedback measured +0.33, so the reminder names what they
 * are about to study and why it was chosen. "Logaritmos, que fallaste
 * tres veces" is a reason to open the app. "Llevas 6 días" is a reason
 * to protect a counter.
 *
 * Pure, because the wording is the feature and should be arguable from
 * a test.
 */

export interface TemaParaHoy {
  readonly tema: string;
  readonly area: string;
  /** Wrong answers on this topic, which is why it was picked. */
  readonly falladas: number;
}

export interface Recordatorio {
  readonly titulo: string;
  readonly cuerpo: string;
}

/** Topic names arrive as slugs from the weakness profile. */
export function legible(tema: string): string {
  return tema.replace(/[-_]/g, ' ').trim();
}

/**
 * The reminder for today.
 *
 * With a weak topic it names it and says why. Without one — a learner
 * with no history — it says what is available rather than inventing a
 * weakness, the same honesty the question-of-the-day card uses when it
 * shows nothing instead of a random question labelled as your mistake.
 */
export function recordatorioDeHoy(
  tema: TemaParaHoy | null,
  preguntasListas = 0,
): Recordatorio {
  if (!tema) {
    return preguntasListas > 0
      ? {
          titulo: 'Cinco preguntas, cinco minutos',
          cuerpo: `Tienes ${preguntasListas} listas, y funcionan sin internet.`,
        }
      : {
          titulo: 'Cinco preguntas, cinco minutos',
          cuerpo: 'Entra un momento y seguimos donde quedaste.',
        };
  }

  const nombre = legible(tema.tema);

  /* The count only appears when it is high enough to be a reason
     rather than a nag. One wrong answer is not a pattern, and saying
     "que fallaste 1 vez" reads like being told off for a single
     mistake. */
  const cuerpo =
    tema.falladas >= 3
      ? `Lo has fallado ${tema.falladas} veces. Hoy lo vemos otra vez.`
      : 'Hoy te toca ese.';

  return { titulo: `Te espera: ${nombre}`, cuerpo };
}

/**
 * Whether a reminder is worth sending at all.
 *
 * Skipped when the learner already studied today. A notification
 * telling someone to do what they have just done is how an app teaches
 * people to ignore its notifications — and the one that matters is the
 * one they then miss.
 */
export function valeLaPenaRecordar(params: {
  estudioHoy: boolean;
  activado: boolean;
}): boolean {
  return params.activado && !params.estudioHoy;
}

/**
 * The hour a reminder fires, clamped to something defensible.
 *
 * A learner can pick any hour; a bug or a bad migration should not
 * produce 3am. Out-of-range values fall back to seven in the evening,
 * which is after school and before the night.
 */
export const HORA_POR_OMISION = 19;

export function horaValida(hora: number): number {
  if (!Number.isInteger(hora) || hora < 6 || hora > 22) return HORA_POR_OMISION;
  return hora;
}

/**
 * The weakest area as a topic for the reminder, from dashboard rows.
 *
 * Here rather than in the hook because it is a pure decision, and in
 * `model/` because `capas.test.ts` forbids one feature importing
 * another: the route reads the dashboard and hands the rows in.
 */
export function temaMasFlojo(
  porArea: ReadonlyArray<{ area: string; accuracy: number; questions: number }>,
): TemaParaHoy | null {
  const peor = [...porArea].sort((a, b) => a.accuracy - b.accuracy)[0];

  /* The same floor the backend uses: below four answers there is no
     pattern, and naming an area anyway sends the learner to practise
     something chosen by noise. */
  if (!peor || peor.questions < 4) return null;

  /* `accuracy` is a percentage, 0 to 100 — verified against
     `dashboard-math.ts:71`, which does `round((correct/total) * 100)`.
     Treating it as a fraction yields a negative count.

     Rounded down: claiming more mistakes than were made is the worse
     error in a message meant to motivate. */
  const fallos = Math.floor((peor.questions * (100 - peor.accuracy)) / 100);
  return { tema: peor.area, area: peor.area, falladas: Math.max(0, fallos) };
}
