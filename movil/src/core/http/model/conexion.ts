/**
 * What to tell a learner when the network is gone.
 *
 * The honest answer depends on whether we have something stored. With
 * a cached dashboard, "sin conexión" is a footnote — the screen still
 * works. With nothing, it is the whole message.
 *
 * Pure so the wording can be tested without a device radio.
 */

export type EstadoConexion = 'con-red' | 'sin-red' | 'desconocido';

export interface Situacion {
  readonly conexion: EstadoConexion;
  /** Whether the screen has data to show, cached or fresh. */
  readonly hayDatos: boolean;
  /** Whether what we have came off the disk rather than the network. */
  readonly esDeCache: boolean;
}

export type Anuncio =
  | { readonly tipo: 'nada' }
  | { readonly tipo: 'aviso'; readonly mensaje: string }
  | { readonly tipo: 'bloqueo'; readonly mensaje: string };

/**
 * Nothing, a footnote, or the whole screen.
 *
 * The rule that matters: never announce an outage over data the
 * learner can already use. A banner that says "sin conexión" above a
 * working dashboard trains people to ignore banners.
 */
export function anunciar(situacion: Situacion): Anuncio {
  if (situacion.conexion === 'con-red') return { tipo: 'nada' };

  /* Unknown is treated as connected. On a cold start the radio has not
     answered yet, and showing an outage for a few hundred milliseconds
     is worse than showing nothing: the learner sees a flash of alarm
     for a network that is fine. */
  if (situacion.conexion === 'desconocido') return { tipo: 'nada' };

  if (situacion.hayDatos) {
    return {
      tipo: 'aviso',
      mensaje: situacion.esDeCache
        ? 'Sin conexión. Esto es lo último que guardamos.'
        : 'Sin conexión. Lo que ves sigue sirviendo.',
    };
  }

  return {
    tipo: 'bloqueo',
    mensaje: 'Sin conexión y sin nada guardado todavía. Conéctate una vez y después funciona sin datos.',
  };
}

/**
 * Whether it is worth even trying a request.
 *
 * A request with no radio fails after a timeout, which on a 200-second
 * route means the learner waits three minutes for a failure we could
 * have named immediately. Only worth skipping when we are certain
 * there is no network — `desconocido` tries, because being wrong here
 * costs one failed request and the alternative costs a working one.
 */
export function valeLaPenaIntentar(conexion: EstadoConexion): boolean {
  return conexion !== 'sin-red';
}
