/**
 * How long the client waits, by route.
 *
 * One number cannot serve both kinds of call. Most answer in well under
 * a second, and 30s is already a long time to leave a learner watching
 * a spinner. But generating items invokes a model: the server allows it
 * up to `OPENAI_TIMEOUT_MS` (180s today), so a 30s client deadline
 * guarantees the phone abandons work the server is still doing — and
 * still paying for.
 *
 * It lives in `model/` because it is a pure decision and has to be
 * testable: a file that imports `react-native` cannot be parsed in
 * Node, which is why this does not live in the client itself.
 */

/** What the backend allows the model, from `openai.service.ts`. */
export const LIMITE_DEL_SERVIDOR_MS = 180_000;

export const LIMITE_NORMAL_MS = 30_000;

/* Above the server's own deadline, so the server's timeout is what
   fires — it can say what failed, and the slack absorbs the round trip
   plus its own bookkeeping. A client that gives up first turns a
   legible server error into "sin conexión". */
export const LIMITE_LARGO_MS = 200_000;

/** Routes that wait on a model. Named rather than inferred: a new
    endpoint should be fast by default, and declaring itself slow
    should be a deliberate act. */
export const RUTAS_LENTAS: readonly string[] = [
  '/api/items/generate',
  '/api/items/generate-mixed',
  '/api/feedback/generate',
  /* Tutoring answers with a model too (tutoria.service.ts calls
     OpenaiService). Left out of the first version of this list, which
     meant the tutor kept the 30s deadline and aborted mid-explanation —
     the very failure the list exists to prevent. The prefix covers
     `defensa` and `mensaje`; `abrir` and `resuelto` are cheap, and
     waiting longer on a route that answers fast costs nothing. */
  '/api/tutoria/',
];

export function limiteDe(ruta: string): number {
  return RUTAS_LENTAS.some((lenta) => ruta.startsWith(lenta))
    ? LIMITE_LARGO_MS
    : LIMITE_NORMAL_MS;
}
