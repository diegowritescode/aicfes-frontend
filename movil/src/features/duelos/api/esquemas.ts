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
  /* Optional for the same reason `esModerador` is: an app built
     against a server that predates the column must still parse its
     own profile rather than failing sign-in over a missing bio. */
  descripcion: z.string().nullable().optional(),
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

/**
 * Somebody found by searching, which is more than `jugador` carries.
 *
 * Its own schema rather than a field added to `jugador`: that one is
 * also the opponent in a duel and the other half of a friendship, and
 * a description has no business travelling to either. Widening it
 * would serve the text in places nobody asked for it.
 *
 * The description is here because it answers the question somebody
 * about to send a request is actually asking — «is this the Sofía I
 * know?». The streak and the win-loss record are not here: those stay
 * behind an accepted friendship.
 */
export const jugadorEncontrado = z.object({
  id: z.string(),
  alias: z.string().nullable(),
  descripcion: z.string().nullable(),
});

export const resultadoBusqueda = z.array(jugadorEncontrado);

export type JugadorEncontrado = z.infer<typeof jugadorEncontrado>;

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

/**
 * Another learner's profile, as a friend sees it.
 *
 * Alias and description only. The server refuses this for anyone who
 * is not an accepted friend, and refuses it identically for an
 * account that does not exist — so a stranger cannot use it to find
 * out who is registered.
 */
export const perfilDeAmigo = z.object({
  id: z.string(),
  alias: z.string().nullable(),
  descripcion: z.string().nullable(),
  /** When the friendship was accepted. */
  amigosDesde: z.string(),
  racha: z.object({
    /** Consecutive weeks with at least one duel between the two. */
    semanas: z.number(),
    /** Finished duels between them, ever. */
    duelos: z.number(),
    /** Whether this week already has one. */
    estaSemanaYa: z.boolean(),
  }),
  ganados: z.number(),
  perdidos: z.number(),
});

export type PerfilDeAmigo = z.infer<typeof perfilDeAmigo>;
