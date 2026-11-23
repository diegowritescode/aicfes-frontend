import type { Sesion } from '@/core/almacenamiento/sesion';

/**
 * When a session is worth renewing, and when it is beyond saving.
 *
 * Pure on purpose. Deciding this inside the HTTP client would mean it
 * could only be tested by faking a server and a clock; here it is a
 * function with an answer.
 *
 * The access token lasts seven days (JWT_EXPIRES), which is long
 * enough that a learner who opens the app most days should never see a
 * sign-in screen again. What made them see it was that nobody ever
 * asked for a new one.
 */

/** Decoded from the JWT, or null if it is not readable. */
export function vencimientoDelToken(token: string): Date | null {
  /* A JWT is three base64url segments. We read the middle one for its
     `exp`, and read it defensively: a token we cannot parse is not an
     error to report, it is simply a token whose expiry we do not know,
     and the caller treats that as "ask the server". */
  const partes = token.split('.');
  if (partes.length !== 3) return null;

  try {
    const relleno = '='.repeat((4 - (partes[1]!.length % 4)) % 4);
    const normalizado = partes[1]!.replace(/-/g, '+').replace(/_/g, '/') + relleno;
    const carga = JSON.parse(globalThis.atob(normalizado)) as { exp?: unknown };
    if (typeof carga.exp !== 'number' || !Number.isFinite(carga.exp)) return null;
    /* `exp` is in seconds since the epoch; Date wants milliseconds.
       Multiplying is not optional — forgetting it dates every token to
       January 1970 and refreshes on every single request. */
    return new Date(carga.exp * 1000);
  } catch {
    return null;
  }
}

/* Renew a day before expiry rather than at it. A learner who opens the
   app on a plane, or on a bus with one bar, should already be carrying
   a token that works: refreshing at the last minute means the one
   request that matters is the one that fails. */
const MARGEN_MS = 24 * 60 * 60 * 1000;

/** Whether this session should be renewed before its next request. */
export function convieneRenovar(sesion: Sesion, ahora = new Date()): boolean {
  // Nothing to renew with: this is a session stored before refresh
  // tokens existed, or a web session whose token lives in a cookie.
  if (!sesion.refreshToken) return false;

  // A refresh token that has itself expired cannot buy anything.
  if (refreshVencido(sesion, ahora)) return false;

  const vence = vencimientoDelToken(sesion.token);
  /* An unreadable token is renewed rather than trusted. The cost of
     being wrong is one extra request; the cost of the other mistake is
     a learner at a sign-in screen. */
  if (!vence) return true;

  return vence.getTime() - ahora.getTime() < MARGEN_MS;
}

/** Whether the refresh token is past its own expiry. */
export function refreshVencido(sesion: Sesion, ahora = new Date()): boolean {
  if (!sesion.refreshTokenExpiresAt) return false;
  const vence = new Date(sesion.refreshTokenExpiresAt);
  if (Number.isNaN(vence.getTime())) return false;
  return vence.getTime() <= ahora.getTime();
}

/**
 * Whether the session is beyond saving and the learner has to sign in.
 *
 * Distinguished from `convieneRenovar` because the two lead to
 * different screens: one is silent housekeeping, the other is the only
 * case where showing a sign-in form is honest.
 */
export function sesionPerdida(sesion: Sesion, ahora = new Date()): boolean {
  const vence = vencimientoDelToken(sesion.token);
  const accesoVencido = vence !== null && vence.getTime() <= ahora.getTime();
  if (!accesoVencido) return false;
  // The access token is dead; only a usable refresh token can save it.
  return !sesion.refreshToken || refreshVencido(sesion, ahora);
}
