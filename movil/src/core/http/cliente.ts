import { z } from 'zod';
import { entorno } from '@/core/config/entorno';
import { almacenSesion } from '@/core/almacenamiento/sesion';

/**
 * The one place that talks to the server.
 *
 * The web app had 34 exported functions in a 1,233-line module, each
 * repeating the same try/catch, the same token header and the same
 * guesswork about the response shape. This replaces that with one
 * function that takes a schema.
 *
 * Three things it does that the old client did not:
 *
 *  1. **Validates.** Every response is parsed against a Zod schema at
 *     the boundary. The backend evolves, and a field that changed shape
 *     must fail here with a clear message rather than three screens
 *     later as `undefined is not an object`.
 *
 *  2. **Types the failure.** Callers get a discriminated union, not a
 *     thrown value of unknown shape. A session that expired, a quota
 *     that ran out and a network that dropped are different problems
 *     with different responses, and the interface has to tell them
 *     apart.
 *
 *  3. **Times out.** A request with no deadline on a phone with one bar
 *     hangs until the user gives up. Thirty seconds, then a failure the
 *     screen can show.
 */

/** What the API wraps every payload in. */
const sobre = z.object({
  ok: z.boolean().optional(),
  data: z.unknown().optional(),
  items: z.unknown().optional(),
  error: z
    .object({ code: z.string(), message: z.string() })
    .partial()
    .optional(),
});

export type CodigoFallo =
  | 'sin_sesion'
  | 'sin_cuota'
  | 'sin_red'
  | 'tiempo_agotado'
  | 'respuesta_invalida'
  | 'servidor'
  | 'desconocido';

export interface Fallo {
  readonly codigo: CodigoFallo;
  /** Safe to show a learner: no stack traces, no provider errors. */
  readonly mensaje: string;
  /** The API's own code, when it sent one, for branching on specifics. */
  readonly codigoApi?: string;
}

export type Resultado<T> =
  | { readonly ok: true; readonly datos: T }
  | { readonly ok: false; readonly fallo: Fallo };

const MILISEGUNDOS_LIMITE = 30_000;

/** Messages a learner reads. Written for them, not for a log. */
const MENSAJES: Record<CodigoFallo, string> = {
  sin_sesion: 'Su sesión expiró. Vuelva a entrar.',
  sin_cuota: 'Llegó al límite de práctica de hoy. Vuelva mañana para seguir.',
  sin_red: 'Sin conexión. Revise su internet e intente de nuevo.',
  tiempo_agotado: 'El servidor está tardando demasiado. Intente de nuevo.',
  respuesta_invalida: 'Recibimos una respuesta que no entendimos. Intente de nuevo.',
  servidor: 'Algo falló de nuestro lado. Intente en un momento.',
  desconocido: 'Algo salió mal. Intente de nuevo.',
};

function fallo(codigo: CodigoFallo, mensaje?: string, codigoApi?: string): Resultado<never> {
  return { ok: false, fallo: { codigo, mensaje: mensaje ?? MENSAJES[codigo], codigoApi } };
}

function codigoPorEstado(estado: number): CodigoFallo {
  if (estado === 401 || estado === 403) return 'sin_sesion';
  if (estado === 429) return 'sin_cuota';
  if (estado >= 500) return 'servidor';
  return 'desconocido';
}

export interface OpcionesPeticion<T> {
  readonly ruta: string;
  readonly metodo?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  readonly cuerpo?: unknown;
  /** The shape this call promises to return. */
  readonly esquema: z.ZodType<T>;
  /** Public endpoints (sign-in, sign-up) send no token. */
  readonly conSesion?: boolean;
}

export async function pedir<T>({
  ruta,
  metodo = 'GET',
  cuerpo,
  esquema,
  conSesion = true,
}: OpcionesPeticion<T>): Promise<Resultado<T>> {
  const cabeceras: Record<string, string> = { 'Content-Type': 'application/json' };

  if (conSesion) {
    const sesion = await almacenSesion.leer();
    if (sesion?.token) cabeceras.Authorization = `Bearer ${sesion.token}`;
  }

  const abortador = new AbortController();
  const temporizador = setTimeout(() => abortador.abort(), MILISEGUNDOS_LIMITE);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${entorno.apiUrl}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: abortador.signal,
    });
  } catch (error) {
    /* AbortError means our own deadline fired; anything else at this
       point is the network, because the request never reached a
       server that could answer. */
    const agotado = error instanceof Error && error.name === 'AbortError';
    return fallo(agotado ? 'tiempo_agotado' : 'sin_red');
  } finally {
    clearTimeout(temporizador);
  }

  let crudo: unknown;
  try {
    crudo = await respuesta.json();
  } catch {
    /* A non-JSON body on a failing status is a proxy or gateway page,
       which says more about the status than about the body. */
    return respuesta.ok
      ? fallo('respuesta_invalida')
      : fallo(codigoPorEstado(respuesta.status));
  }

  const envoltura = sobre.safeParse(crudo);
  const datosApi = envoltura.success ? envoltura.data : undefined;

  if (!respuesta.ok || datosApi?.ok === false) {
    const codigoApi = datosApi?.error?.code;
    const mensajeApi = datosApi?.error?.message;
    /* The API's own message is written for learners and is more
       specific than ours — "puede pedir hasta 12" beats "llegó al
       límite". Prefer it when there is one. */
    return fallo(codigoPorEstado(respuesta.status), mensajeApi, codigoApi);
  }

  /* Payloads arrive as {data}, as {items}, or bare. Rather than make
     every caller know which, unwrap here and let the schema decide
     whether what came out is right.

     Checking for the key rather than using `??` is deliberate: `data:
     null` is a real answer — "no question for you today" is how the
     error-of-the-day endpoint says there is nothing to show — and `??`
     would swallow that null and hand the whole envelope to a schema
     expecting the payload. */
  const cuerpoCrudo = (crudo ?? {}) as Record<string, unknown>;
  const util =
    'data' in cuerpoCrudo
      ? cuerpoCrudo.data
      : 'items' in cuerpoCrudo
        ? cuerpoCrudo.items
        : crudo;
  const analizado = esquema.safeParse(util);

  if (!analizado.success) {
    if (!entorno.esProduccion) {
      console.warn(`Respuesta inesperada en ${ruta}:`, analizado.error.issues);
    }
    return fallo('respuesta_invalida');
  }

  return { ok: true, datos: analizado.data };
}
