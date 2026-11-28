import { z } from 'zod';
import { area, letra } from '@/shared/model/icfes';

/**
 * A mistake still outstanding.
 *
 * Carries the right answer and the explanations, like training does
 * and unlike a graded sitting: the whole point of reviewing is to find
 * out why, immediately.
 */
export const errorPendiente = z.object({
  itemId: z.string(),
  area,
  pregunta: z.string(),
  contexto: z.string().nullable(),
  opciones: z.record(z.string(), z.string()),
  respuesta_correcta: letra,
  explicaciones: z.record(z.string(), z.string()).nullable(),
  falladaEn: z.string(),
  /** How many times it was missed, which is why it is near the top. */
  veces: z.number(),
});

export const resumenRepaso = z.object({
  pendientes: z.number(),
  corregidos: z.number(),
  porArea: z.array(z.object({ area, pendientes: z.number() })),
});

export const repaso = z.object({
  pendientes: z.array(errorPendiente),
  resumen: resumenRepaso,
});

export type ErrorPendiente = z.infer<typeof errorPendiente>;
export type Repaso = z.infer<typeof repaso>;
