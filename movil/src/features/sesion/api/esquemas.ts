import { z } from 'zod';

/**
 * The shapes the auth endpoints promise.
 *
 * Checked against the running server rather than guessed: the payload
 * is {userId, email, token, tokenType, expiresIn, timezone}. Notably
 * it carries no display name, so anything that wants to greet the
 * learner has to read it elsewhere — writing `nombre` in here because
 * it seemed likely would have shipped a field that is always
 * undefined.
 *
 * Unknown keys are allowed through by Zod's default, so a field added
 * server-side never breaks a client that does not use it yet.
 */

export const respuestaAuth = z.object({
  userId: z.string().min(1),
  email: z.string(),
  token: z.string().min(1),
  tokenType: z.string().optional(),
  /* A duration string like "7d", not a number of seconds — checked
     against the running server. Writing `z.number()` here because the
     name reads like one is exactly the mistake this schema caught:
     without the check it would have surfaced as a session that never
     refreshes, on a phone, weeks later. */
  expiresIn: z.string().optional(),
  timezone: z.string().optional(),
});

export type RespuestaAuth = z.infer<typeof respuestaAuth>;
