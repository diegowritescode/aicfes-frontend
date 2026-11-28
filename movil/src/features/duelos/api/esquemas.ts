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

/**
 * The two avatar fields, written once.
 *
 * Spread into every schema that carries somebody the app draws. A
 * second copy would drift: one screen would show the picked fox and
 * the next would show initials for the same person, and that reads
 * as two accounts rather than as a bug.
 *
 * Both optional and nullable — optional because a server that
 * predates the columns must still parse, nullable because null is
 * the real value meaning «my initials».
 */
export const camposDeAvatar = {
  avatar: z.string().nullable().optional(),
  avatarColor: z.number().int().nullable().optional(),
} as const;

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
  /* Whether strangers may read this learner's level, streak and
     subjects. Separate from `aliasBuscable`: being findable is not
     the same consent as being measured. Optional, and defaulted to
     the safe answer, so an older server never makes the switch read
     as «on». */
  progresoPublico: z.boolean().optional().default(false),
  /* The figure the learner picked and the colour behind it. Optional
     for the reason every field above is: an app built against a
     server that predates these columns must still parse its own
     profile. `nullable` on top of that, because null is a real value
     here — it means «my initials», not «the server forgot». */
  ...camposDeAvatar,
});

export const resultadoDuelo = z.object({
  aciertos: z.number(),
  segundos: z.number(),
});

export const jugador = z.object({
  id: z.string(),
  alias: z.string().nullable(),
  ...camposDeAvatar,
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
  ...camposDeAvatar,
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

/**
 * What the rival scored, when they played first.
 *
 * Nullable, and whoever opens a duel first gets null. The screen has
 * to render that as «nobody has played yet» — a zero would read as
 * the rival having failed.
 */
export const marcaDelRival = z.object({
  aciertos: z.number(),
  segundos: z.number(),
  deCuantas: z.number(),
});

/**
 * A duel round, which is no longer just its questions.
 *
 * This replaced a bare `z.array(preguntaDeDuelo)`, and that is a
 * breaking change on purpose: the round used to be played in silence,
 * so a learner only discovered at the end that they had been racing
 * somebody. The rival's score was already in the row the server read
 * and was never sent.
 *
 * It does break every installed build — the old schema rejects an
 * object — which is why this needs its APK shipped alongside the
 * backend. Hanging the fields off the array instead was tried and
 * cannot work: `JSON.stringify` drops every non-index property of an
 * array, so the mark would have been silently absent.
 */
export const preguntasDeDuelo = z.object({
  preguntas: z.array(preguntaDeDuelo),
  marcaDelRival: marcaDelRival.nullable(),
  /* Computed on the server so both players are told the same thing by
     the same rule. */
  paraGanar: z.number().nullable(),
  soloPorTiempo: z.boolean(),
});

export type MarcaDelRival = z.infer<typeof marcaDelRival>;
export type RondaDeDuelo = z.infer<typeof preguntasDeDuelo>;

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
  bloqueado: z.object({
    id: z.string(),
    alias: z.string().nullable(),
    ...camposDeAvatar,
  }),
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

/** How this learner stands with the person whose profile is open. */
export const relacion = z.enum([
  'amigos',
  'solicitud-enviada',
  'solicitud-recibida',
  'ninguna',
]);

export type Relacion = z.infer<typeof relacion>;

/** One subject's lifetime accuracy, as shown on somebody's profile. */
export const areaDePerfil = z.object({
  area,
  accuracy: z.number(),
  questions: z.number(),
});

/**
 * The numbers on a profile: level, streak, subjects, achievements.
 *
 * Null when they are not shared, which is not the same as zero. The
 * screen has to say «no comparte su progreso» rather than render a
 * level 0 that would libel the learner.
 */
export const progresoDePerfil = z.object({
  nivel: z.number(),
  xpDelNivel: z.number(),
  xpParaSubir: z.number(),
  racha: z.number(),
  rachaMasLarga: z.number(),
  areas: z.array(areaDePerfil),
  /* Only the earned ones, by title. The locked half of the list is a
     record of what somebody has not managed to do, and that is theirs
     alone to look at. */
  logros: z.array(z.string()),
});

/** Wins and losses between these two. Friends only. */
export const caraACara = z.object({
  jugados: z.number(),
  ganados: z.number(),
  perdidos: z.number(),
  empatados: z.number(),
});

/**
 * Anybody's profile, as this learner is allowed to see it.
 *
 * One schema for friends and strangers alike, because the server
 * decides who sees what and the screen should not have a second
 * opinion. What changes between the two is which fields are null.
 *
 * Replaces nothing: `perfilDeAmigo` stays for the duel-streak card,
 * which is a different question («how are we doing against each
 * other») from the one this answers («who is this person»).
 */
export const perfilPublico = z.object({
  id: z.string(),
  alias: z.string().nullable(),
  descripcion: z.string().nullable(),
  ...camposDeAvatar,
  relacion,
  amigosDesde: z.string().nullable(),
  progreso: progresoDePerfil.nullable(),
  /* Said by the server rather than inferred from `progreso === null`,
     so the screen can tell «they keep this private» apart from «this
     failed to load». */
  progresoOculto: z.boolean(),
  caraACara: caraACara.nullable(),
});

export type PerfilPublico = z.infer<typeof perfilPublico>;
export type ProgresoDePerfil = z.infer<typeof progresoDePerfil>;
export type AreaDePerfil = z.infer<typeof areaDePerfil>;
