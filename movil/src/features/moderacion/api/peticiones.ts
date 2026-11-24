import { pedir } from '@/core/http/cliente';
import { almacenModeracion } from '@/core/almacenamiento/moderacion';
import {
  colaDeModeracion,
  pendientesDeModeracion,
  resolucion,
  retiro,
} from './esquemas';

/**
 * The moderation queue.
 *
 * Authenticated with the server-side secret, not the learner's session
 * (ADR 33). Every call reads the token from the device's keystore
 * rather than taking it as an argument, so no screen or hook ends up
 * holding it in memory or in a query key.
 */
/**
 * The moderation header, when there is one.
 *
 * Returns `{}` rather than null when no token is stored: the session
 * alone is enough for whoever holds the role (ADR 34), and refusing
 * to send the request would lock out the very path the role exists
 * to provide. The server decides; this only adds the header when it
 * has one to add.
 */
async function conToken(): Promise<Readonly<Record<string, string>>> {
  const token = await almacenModeracion.leer();
  return token ? { 'x-moderacion-token': token } : {};
}

export async function leerPendientes() {
  const cabeceras = await conToken();
  return pedir({
    ruta: '/api/moderacion/pendientes',
    esquema: pendientesDeModeracion,
    cabecerasExtra: cabeceras,
  });
}

export async function leerCola(limite = 20) {
  const cabeceras = await conToken();
  return pedir({
    ruta: `/api/moderacion/cola?limite=${limite}`,
    esquema: colaDeModeracion,
    cabecerasExtra: cabeceras,
  });
}

export async function resolverDenuncia(params: {
  id: string;
  estado: 'revisada' | 'descartada';
}) {
  const cabeceras = await conToken();
  return pedir({
    ruta: `/api/moderacion/denuncia/${params.id}/resolver`,
    metodo: 'POST',
    cuerpo: { estado: params.estado },
    esquema: resolucion,
    cabecerasExtra: cabeceras,
  });
}

export async function retirarDeBusqueda(userId: string) {
  const cabeceras = await conToken();
  return pedir({
    ruta: `/api/moderacion/cuenta/${userId}/retirar-de-busqueda`,
    metodo: 'POST',
    cuerpo: {},
    esquema: retiro,
    cabecerasExtra: cabeceras,
  });
}
