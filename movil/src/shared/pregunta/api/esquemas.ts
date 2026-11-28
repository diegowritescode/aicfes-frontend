import { z } from 'zod';
import { area, dificultad, letra } from '@/shared/model/icfes';

/**
 * The shapes the training path sends, read from the running server.
 *
 * Unlike a sitting, a training item **does** carry its answer and its
 * explanations: the point of training is to find out immediately, and
 * the explanation per option is what the tutoring thread opens with
 * at no cost. The two modes have opposite needs, which is why they
 * are separate features rather than one with a flag.
 */

export const itemGenerado = z.object({
  id: z.string(),
  area,
  dificultad,
  /* Optional because the bank serves the same questions without
     them, and nothing reads them: a session can be filled from
     `/api/items/lote-offline` instead of waiting minutes for a
     generation. Required here, the two sources could never mix. */
  plantilla: z.string().optional(),
  contexto: z.string().nullable().default(''),
  pregunta: z.string(),
  opciones: z.record(z.string(), z.string()),
  respuesta_correcta: letra,
  /* The per-option explanations say the same thing in a more useful
     shape, so a question without this is still answerable. */
  justificacion: z.string().optional(),
  tags: z.array(z.string()).optional(),
  /** What kind of mistake each wrong option represents. */
  distractores: z.record(z.string(), z.string()).nullable().optional(),
  /** One explanation per option, written when the item was generated. */
  explicaciones: z.record(z.string(), z.string()).nullable().optional(),
  /** A diagram spec, or null. The client only needs to know it exists. */
  figura: z.unknown().nullable().optional(),
});

export const sesionIniciada = z.object({
  sessionId: z.string(),
  startedAt: z.string(),
});

export const sesionCompletada = z.object({
  sessionId: z.string(),
  xpAwarded: z.number().optional(),
  xpDelta: z.number().optional(),
});

export const respuestasGuardadas = z.object({
  inserted: z.number(),
  xpAdjusted: z.number().optional(),
});

export type ItemGenerado = z.infer<typeof itemGenerado>;
export type SesionIniciada = z.infer<typeof sesionIniciada>;
