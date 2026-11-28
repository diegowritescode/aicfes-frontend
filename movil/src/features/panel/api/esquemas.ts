import { z } from 'zod';
import { area, letra } from '@/shared/model/icfes';

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
  /* Whether a missed day is being forgiven. Optional because an older
     server does not send it, and a streak without the flag still
     renders — it just says nothing about the forgiveness. */
  perdonUsado: z.boolean().optional(),
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
 * mistakes yet, and a random question labelled "tu error de hoy" is a
 * lie they notice immediately.
 */
export const errorDelDia = z
  .object({
    itemId: z.string(),
    area,
    pregunta: z.string(),
    contexto: z.string().nullable().optional(),
    /* Optional only until the server carrying them is deployed. The
       card renders read-only without them rather than disappearing,
       so an app running against an older backend degrades instead of
       breaking. */
    opciones: z.record(z.string(), z.string()).optional(),
    /* Sent for this card, and deliberately not for a sitting. The
       difference is the contract: this is practice with immediate
       feedback, so the learner answers and finds out at once — the
       same deal as training. A sitting withholds it because the
       payload reaches a device where anything sent can be read.
     *
       Leaving these out is what forced the card to send the learner
       to `/entrenar` instead of letting them answer the question it
       had just shown them. */
    respuesta_correcta: letra.optional(),
    explicaciones: z.record(z.string(), z.string()).nullable().optional(),
    motivo: z.string(),
    resueltoHoy: z.boolean(),
  })
  .nullable();

/**
 * An achievement and how close it is.
 *
 * The server computes progress rather than sending raw counts, because
 * the rule that decides "a day of study" (five minutes AND three
 * questions) lives there and has to stay in one place.
 *
 * `achievedAt` arrives as an empty string when unearned, not as null —
 * the backend builds it with a ternary. Normalised here so a screen
 * never has to know that.
 */
export const logro = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  target: z.number(),
  progress: z.number(),
  achieved: z.boolean(),
  achievedAt: z.string().transform((v) => (v === '' ? null : v)),
});

export type Logro = z.infer<typeof logro>;

export type Panel = z.infer<typeof panel>;
export type Mision = z.infer<typeof mision>;
export type ErrorDelDia = z.infer<typeof errorDelDia>;

/**
 * Where the learner's XP came from, grouped by source.
 *
 * The ledger has recorded a reason for every award since it was built
 * and the app only ever showed a total. A number with no source is a
 * reward; the same number with its source is feedback, and that is the
 * difference between d = −0.36 and d = +0.33 for this age group.
 */
export const filaDesglose = z.object({
  razon: z.string(),
  /** Written for a learner, not a log. The server does the wording. */
  etiqueta: z.string(),
  xp: z.number(),
  veces: z.number(),
});

export const desgloseXp = z.object({
  filas: z.array(filaDesglose),
  /** One sentence, or null when no source dominates. */
  frase: z.string().nullable(),
});

export type FilaDesglose = z.infer<typeof filaDesglose>;
export type DesgloseXp = z.infer<typeof desgloseXp>;
