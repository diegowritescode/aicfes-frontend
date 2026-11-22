import { z } from 'zod';
import { area } from '@/shared/model/icfes';

/**
 * The dashboard, read from the running server.
 *
 * Dates arrive as "" when the thing never happened — `lastStudyDate`,
 * `lastSessionAt`. That is a value, not an error, and `new Date("")`
 * turns it into an Invalid Date that spreads silently through every
 * calculation downstream. The schema keeps them as strings and
 * `comoFecha` is the only thing allowed to interpret them.
 */

export const racha = z.object({
  currentDays: z.number(),
  longestDays: z.number(),
  nextMilestoneDays: z.number(),
  lastStudyDate: z.string(),
});

export const nivel = z.object({
  level: z.number(),
  totalXp: z.number(),
  currentXp: z.number(),
  nextLevelXp: z.number(),
});

export const mision = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  progress: z.number(),
  target: z.number(),
  xpReward: z.number(),
});

export const progresoArea = z.object({
  area,
  accuracy: z.number(),
  questions: z.number(),
});

export const panel = z.object({
  streak: racha,
  level: nivel,
  timeStudied: z.object({ weekMinutes: z.number(), lastSessionAt: z.string() }),
  missions: z.object({
    total: z.number(),
    completed: z.number(),
    items: z.array(mision),
  }),
  areaProgress: z.array(progresoArea),
  suggestedChallenge: z
    .object({ title: z.string(), description: z.string(), xpReward: z.number() })
    .nullable()
    .optional(),
});

/**
 * One question a day, from what this learner already got wrong.
 *
 * Null when there is no honest question to show — a new learner has no
 * mistakes yet, and a random question labelled "su error de hoy" is a
 * lie they notice immediately.
 */
export const errorDelDia = z
  .object({
    itemId: z.string(),
    area,
    pregunta: z.string(),
    contexto: z.string().nullable().optional(),
    motivo: z.string(),
    resueltoHoy: z.boolean(),
  })
  .nullable();

export type Panel = z.infer<typeof panel>;
export type Mision = z.infer<typeof mision>;
export type ErrorDelDia = z.infer<typeof errorDelDia>;
