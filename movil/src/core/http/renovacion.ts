import { almacenSesion, type Sesion } from '@/core/almacenamiento/sesion';

/**
 * One renewal at a time, shared by everyone waiting for it.
 *
 * A dashboard opens and fires several requests at once. If the access
 * token has expired they all get a 401 together, and each one asking
 * for a new token would spend the refresh token several times — the
 * server rotates it on use, so the first reply invalidates the token
 * the others are still holding. The learner is then signed out by the
 * very mechanism meant to keep them signed in.
 *
 * So the first caller starts the renewal and the rest await the same
 * promise. This is deliberately not a react-query mutation: it has to
 * work from inside the HTTP client, below any component.
 */

/** Set by the session feature at startup, to avoid a circular import:
    the client cannot import the feature that imports the client. */
let pedirRenovacion: ((refreshToken: string) => Promise<Sesion | null>) | null = null;

export function registrarRenovador(
  fn: (refreshToken: string) => Promise<Sesion | null>,
): void {
  pedirRenovacion = fn;
}

let enCurso: Promise<Sesion | null> | null = null;

/**
 * A fresh session, or null if there is no way to get one.
 *
 * Null means the learner really does have to sign in again — there was
 * no refresh token, or the server refused it. The caller shows the
 * sign-in screen only then.
 */
export function renovarSesion(): Promise<Sesion | null> {
  if (enCurso) return enCurso;

  enCurso = (async () => {
    try {
      if (!pedirRenovacion) return null;

      const sesion = await almacenSesion.leer();
      if (!sesion?.refreshToken) return null;

      const nueva = await pedirRenovacion(sesion.refreshToken);
      if (!nueva) {
        /* The refresh token is spent or revoked. Clearing the store is
           part of failing: leaving a dead session behind means every
           later request retries this and fails the same way. */
        await almacenSesion.borrar();
        return null;
      }

      await almacenSesion.guardar(nueva);
      return nueva;
    } catch {
      /* A renewal that throws is a renewal that failed. It must not
         propagate into the request that triggered it, which has its
         own failure to report. */
      return null;
    } finally {
      /* Cleared whatever happened, so a later 401 can try again rather
         than awaiting a promise that already settled. */
      enCurso = null;
    }
  })();

  return enCurso;
}

/** For tests: forget any in-flight renewal. */
export function reiniciarRenovacion(): void {
  enCurso = null;
}
