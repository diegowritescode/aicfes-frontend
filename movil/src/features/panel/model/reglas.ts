import type { Mision, Panel } from '../api/esquemas';
import type { Area } from '@/shared/model/icfes';

/**
 * What the dashboard says, as functions over data.
 *
 * The rule that matters most here is the one the web version got
 * wrong: an area nobody has practised is not an area going badly.
 * Both rendered as 0% with an empty bar, which is why a learner who
 * failed one English question could not tell it had been recorded.
 */

export interface FilaArea {
  readonly area: Area;
  /** False when nothing has been answered: unmeasured, not weak. */
  readonly medida: boolean;
  readonly porcentaje: number;
  readonly aciertos: number;
  readonly preguntas: number;
}

export function filasDeArea(panel: Panel): FilaArea[] {
  return [...panel.areaProgress]
    .map((a) => ({
      area: a.area,
      medida: a.questions > 0,
      porcentaje: Math.round(a.accuracy),
      aciertos: Math.round((a.accuracy / 100) * a.questions),
      preguntas: a.questions,
    }))
    .sort((a, b) => {
      /* Measured areas first. The section promises "lo más flojo
         primero", and the unmeasured ones were filling the top of it
         — telling learners to study what they had never tried. */
      if (a.medida !== b.medida) return a.medida ? -1 : 1;
      return a.porcentaje - b.porcentaje;
    });
}

/** How far through the current level, as a fraction. */
export function avanceDeNivel(panel: Panel): number {
  const meta = panel.level.nextLevelXp;
  if (meta <= 0) return 0;
  return Math.min(1, Math.max(0, panel.level.currentXp / meta));
}

/** Missions still worth doing, the closest to done first. */
export function misionesPendientes(panel: Panel): Mision[] {
  return panel.missions.items
    .filter((m) => m.status !== 'completed' && m.progress < m.target)
    .sort((a, b) => b.progress / b.target - a.progress / a.target);
}

/**
 * Whether to show the streak at all.
 *
 * A streak of zero is not an achievement to display; showing "0 días"
 * to someone who has never studied is a reproach, not encouragement.
 */
export function muestraRacha(panel: Panel): boolean {
  return panel.streak.currentDays > 0;
}
