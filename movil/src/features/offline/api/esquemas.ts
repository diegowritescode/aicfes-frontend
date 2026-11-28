import { z } from 'zod';
import { area, dificultad, letra } from '@/shared/model/icfes';

/**
 * A question kept on the device.
 *
 * Deliberately not `itemGenerado`: that schema requires `plantilla`,
 * `justificacion` and `tags`, which the pool does not send. Reusing it
 * would mean either loosening a schema that is right for training, or
 * padding the pool with fields nothing reads — and the pool's size is
 * the point, because it is downloaded on a prepaid line.
 */
export const preguntaDelLote = z.object({
  id: z.string(),
  area,
  dificultad,
  contexto: z.string().nullable(),
  pregunta: z.string(),
  opciones: z.record(z.string(), z.string()),
  /* The pool carries the answer, unlike a sitting. The toll marks the
     attempt with no network, so the device has to know. */
  respuesta_correcta: letra,
  explicaciones: z.record(z.string(), z.string()).nullable(),
  figura: z.unknown().nullable(),
});

export const lote = z.array(preguntaDelLote);

export type PreguntaDelLote = z.infer<typeof preguntaDelLote>;
