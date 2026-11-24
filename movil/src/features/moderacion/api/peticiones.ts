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
async function conToken(): Promise<Readonly<Record<string, string>> | null> {
  const token = await almacenModeracion.leer();
  if (!token) return null;
  return { 'x-moderacion-token': token };
}

const SIN_TOKEN = {
  ok: false as const,
  fallo: {
    codigo: 'SIN_TOKEN' as const,
    mensaje: 'No hay token de moderación en este teléfono.',
  },
};

export async function leerPendientes() {
  const cabeceras = await conToken();
  if (!cabeceras) return SIN_TOKEN;
  return pedir({
    ruta: '/api/moderacion/pendientes',
    esquema: pendientesDeModeracion,
    cabecerasExtra: cabeceras,
  });
}

export async function leerCola(limite = 20) {
  const cabeceras = await conToken();
  if (!cabeceras) return SIN_TOKEN;
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
  if (!cabeceras) return SIN_TOKEN;
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
  if (!cabeceras) return SIN_TOKEN;
  return pedir({
    ruta: `/api/moderacion/cuenta/${userId}/retirar-de-busqueda`,
    metodo: 'POST',
    cuerpo: {},
    esquema: retiro,
    cabecerasExtra: cabeceras,
  });
}
