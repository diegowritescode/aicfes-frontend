import { z } from 'zod';
import { area, dificultad } from '@/shared/model/icfes';
import { itemGenerado } from '@/shared/pregunta/api/esquemas';

/**
 * The time trial.
 *
 * `area` is nullable, and that nullability is the feature: a mode with
 * no fixed area aims at whatever this learner is weakest in, which is
 * the point of having a weakness profile at all.
 */

export const modoContrarreloj = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  timeLimitSeconds: z.number(),
  questions: z.number(),
  area: area.nullable(),
  dificultad: dificultad.nullable().optional(),
  /** Where this sits in the ladder, so the interface can show progress. */
  nivel: z.number(),
  /** Stored rather than divided, so a mode cannot drift from its claim. */
  segundosPorPregunta: z.number(),
  enabled: z.boolean(),
});

export const contrarrelojIniciado = z.object({
  sessionId: z.string(),
  timeLimitSeconds: z.number(),
  items: z.array(itemGenerado),
});

export type ModoContrarreloj = z.infer<typeof modoContrarreloj>;
