import { z } from 'zod';
import { area } from '@/shared/model/icfes';

/**
 * Duels, aliases and moderation.
 *
 * Alias search was chosen over invitation codes knowing the cost: any
 * learner can find any other, and the audience is 16-18. So the
 * shapes here carry three fields the rest of the app has no use for —
 * `aliasBuscable`, `tutorAutorizoEn` and `visible` — and the screens
 * read `visible` rather than deciding for themselves what it means to
 * be findable.
 */

export const perfilDeDuelos = z.object({
  alias: z.string().nullable(),
  aliasBuscable: z.boolean(),
  /** When a guardian authorised the account. Null means not given. */
  tutorAutorizoEn: z.string().nullable(),
  /** The server's own answer on whether this account can be found. */
  visible: z.boolean(),
  /* Whether this account moderates. Optional so an app built against
     a server without the role still parses — the field arrived after
     the screens did, and a schema that refuses an older server turns
     a missing feature into a broken sign-in. */
  esModerador: z.boolean().optional(),
});

export const resultadoDuelo = z.object({
  aciertos: z.number(),
  segundos: z.number(),
});

export const jugador = z.object({
  id: z.string(),
  alias: z.string().nullable(),
});

export const duelo = z.object({
  id: z.string(),
  estado: z.enum(['pendiente', 'en_curso', 'terminado', 'cancelado']),
  creadoEn: z.string(),
  expiraEn: z.string(),
  /* The other player, named rather than described by role: a learner
     thinks "my duel with Camilo", not "the duel where I am the
     challenger". */
  contra: jugador.nullable(),
  yoRete: z.boolean(),
  miMarcador: resultadoDuelo.nullable(),
  marcadorDelOtro: resultadoDuelo.nullable(),
  /** Null while unfinished, and null for a tie. */
  gane: z.boolean().nullable(),
});

export const listaDeDuelos = z.array(duelo);

export const resultadoBusqueda = z.array(jugador);

/**
 * A duel's question.
 *
 * No `respuesta_correcta` and no `explicaciones`, because the server
 * does not send them: both players are scored on these, so the duel
 * must not be winnable by reading the response.
 */
export const preguntaDeDuelo = z.object({
  id: z.string(),
  area,
  dificultad: z.string(),
  contexto: z.string().nullable(),
  pregunta: z.string(),
  opciones: z.record(z.string(), z.string()),
  figura: z.unknown().nullable().optional(),
});

export const preguntasDeDuelo = z.array(preguntaDeDuelo);

export const retoCreado = z.object({
  id: z.string(),
  estado: z.string(),
  expiraEn: z.string(),
});

export const entregaHecha = z.object({
  estado: z.string(),
  miMarcador: resultadoDuelo,
  delOtro: resultadoDuelo.optional(),
  esperandoAlOtro: z.boolean().optional(),
  gane: z.boolean().optional(),
  empate: z.boolean().optional(),
});

export const bloqueado = z.object({
  bloqueado: z.object({ id: z.string(), alias: z.string().nullable() }),
  creadoEn: z.string(),
});

export const listaDeBloqueados = z.array(bloqueado);

export const denunciaRecibida = z.object({
  recibida: z.boolean(),
  bloqueado: z.boolean(),
});

export const estadoDeBloqueo = z.object({ bloqueado: z.boolean() });

export const estadoDeAmistad = z.object({
  estado: z.string().optional(),
  quitado: z.boolean().optional(),
});

export type PerfilDeDuelos = z.infer<typeof perfilDeDuelos>;
export type Duelo = z.infer<typeof duelo>;
export type Jugador = z.infer<typeof jugador>;
export type PreguntaDeDuelo = z.infer<typeof preguntaDeDuelo>;
export type ResultadoDuelo = z.infer<typeof resultadoDuelo>;
export type EntregaHecha = z.infer<typeof entregaHecha>;
export type Bloqueado = z.infer<typeof bloqueado>;
export type MotivoDenuncia = 'alias_ofensivo' | 'acoso' | 'suplantacion' | 'otro';

/** A friend, or a request waiting on someone. */
export const amistad = z.object({
  id: z.string(),
  estado: z.enum(['pendiente', 'aceptada', 'rechazada']),
  creadoEn: z.string(),
  yoPedi: z.boolean(),
  amigo: jugador,
});

export const misAmigos = z.object({
  amigos: z.array(amistad),
  /* Split by the server, because they are different things to act
     on: one needs an answer, the other needs patience. */
  porResponder: z.array(amistad),
  enviadas: z.array(amistad),
});

export type Amistad = z.infer<typeof amistad>;
export type MisAmigos = z.infer<typeof misAmigos>;
