import { z } from 'zod';

/**
 * The tutoring thread.
 *
 * `esperaDefensa` is the whole protocol in one flag: the learner has
 * to say why they chose what they chose before the tutor answers
 * anything. Writing down "porque multipliqué 4 por 3" is where the
 * mistake becomes visible — to them, and to us, since the text of how
 * someone reasoned wrongly is a far better signal than which letter
 * they pressed.
 */

export const mensajeTutoria = z.object({
  autor: z.enum(['estudiante', 'tutor']),
  contenido: z.string(),
  createdAt: z.string(),
});

export const estadoTutoria = z.object({
  id: z.string(),
  mensajes: z.array(mensajeTutoria),
  turnosUsados: z.number(),
  /** Past this the thread stops being tutoring and becomes chatting. */
  turnosRestantes: z.number(),
  esperaDefensa: z.boolean(),
});

export type EstadoTutoria = z.infer<typeof estadoTutoria>;
export type MensajeTutoria = z.infer<typeof mensajeTutoria>;
