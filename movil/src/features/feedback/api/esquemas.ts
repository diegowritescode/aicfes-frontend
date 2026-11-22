import { z } from 'zod';

/**
 * The study plan written after a session.
 *
 * `strengths`, `weaknesses` and `plan` are lists of prose, not scores:
 * a learner who has just finished badly does not need another number,
 * they need to know what to do on Tuesday.
 */

export const retroalimentacion = z.object({
  id: z.string(),
  sessionId: z.string(),
  summary: z.string(),
  strengths: z.array(z.string()).nullable().optional(),
  weaknesses: z.array(z.string()).nullable().optional(),
  plan: z.array(z.string()).nullable().optional(),
  insights: z.unknown().nullable().optional(),
  generatedAt: z.string().nullable().optional(),
});

export type Retroalimentacion = z.infer<typeof retroalimentacion>;
