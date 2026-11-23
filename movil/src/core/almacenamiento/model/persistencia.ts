/**
 * What is worth keeping on the device, and what must never be.
 *
 * Offline stopped being a nice-to-have for two independent reasons.
 * A prepaid line in Colombia carries about 8.2 GB a month, and an app
 * that shows nothing without a connection is an app that gets
 * uninstalled. And the study toll cannot work any other way: Apple's
 * shield extension runs in a sandbox with no network, so its questions
 * have to be on the phone already.
 *
 * Pure on purpose. Deciding what to persist inside the cache plumbing
 * would mean it could only be tested by faking a store; here it is a
 * predicate with an answer.
 */

/** A query key as react-query hands it over. */
export type Clave = readonly unknown[];

/* Keys whose data is safe to keep on disk and useful when offline.
   Named rather than inferred: a query added later should not become
   persistent by accident, and the reason to persist is always specific. */
const PERSISTIBLES: readonly string[] = [
  /* The dashboard is the first screen. Showing last night's XP beats
     showing a spinner that will never resolve. */
  'panel',
  /* Achievements and the question of the day move slowly, and both
     degrade honestly: a stale achievement is still true. */
  'logros',
  'error-del-dia',
  /* The offline question pool. This is the one the toll depends on. */
  'lote-offline',
];

/* Keys that must never touch disk, even though they would be
   convenient there. Listed explicitly so the reason survives. */
const PROHIBIDAS: readonly string[] = [
  /* The session holds a token. It lives in expo-secure-store, which the
     operating system encrypts; the react-query cache is plain JSON in
     AsyncStorage and readable by anything with filesystem access on a
     rooted device. */
  'sesion',
  /* An in-progress sitting is authoritative on the server, including
     its clock. A persisted copy would let a learner resume a sitting
     whose time ran out, or answer from a stale question list. */
  'simulacro',
  /* A tutoring thread is a conversation. Resuming a stale one would
     have the tutor reply to something the learner no longer said. */
  'tutoria',
];

export function debePersistir(clave: Clave): boolean {
  const raiz = clave[0];
  if (typeof raiz !== 'string') return false;
  if (PROHIBIDAS.includes(raiz)) return false;
  return PERSISTIBLES.includes(raiz);
}

/**
 * How long a cached answer is still worth showing, by kind.
 *
 * Separate from `staleTime`, which decides when to refetch. This
 * decides when a stored answer stops being worth showing at all — the
 * point past which a stale dashboard is misinformation rather than
 * yesterday's news.
 */
const MAXIMA_EDAD_MS: Record<string, number> = {
  panel: 7 * 24 * 60 * 60 * 1000,
  logros: 7 * 24 * 60 * 60 * 1000,
  /* A day, because the name is a promise: "tu pregunta de hoy" must
     not be last Tuesday's. */
  'error-del-dia': 24 * 60 * 60 * 1000,
  /* Questions do not go off. A pool downloaded a month ago is as good
     as one downloaded today, and on a prepaid line re-downloading it
     is the expensive mistake. */
  'lote-offline': 90 * 24 * 60 * 60 * 1000,
};

const MAXIMA_EDAD_POR_OMISION_MS = 24 * 60 * 60 * 1000;

export function edadMaximaDe(clave: Clave): number {
  const raiz = typeof clave[0] === 'string' ? clave[0] : '';
  return MAXIMA_EDAD_MS[raiz] ?? MAXIMA_EDAD_POR_OMISION_MS;
}

export function estaVencido(
  clave: Clave,
  guardadoEn: number,
  ahora = Date.now(),
): boolean {
  return ahora - guardadoEn > edadMaximaDe(clave);
}
