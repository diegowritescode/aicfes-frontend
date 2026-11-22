import { pedir } from '@/core/http/cliente';
import { estadoTutoria } from './esquemas';

/**
 * Opening costs nothing: the server answers from the explanation the
 * item already carries, written when it was generated. Only a
 * follow-up message reaches a model, which is what keeps the feature
 * affordable at the scale of a whole cohort.
 */

export function abrirTutoria(itemId: string, opcionElegida: string) {
  return pedir({
    ruta: `/api/tutoria/${itemId}/abrir`,
    metodo: 'POST',
    cuerpo: { opcionElegida },
    esquema: estadoTutoria,
  });
}

export function enviarDefensa(itemId: string, defensa: string) {
  return pedir({
    ruta: `/api/tutoria/${itemId}/defensa`,
    metodo: 'POST',
    cuerpo: { defensa },
    esquema: estadoTutoria,
  });
}

export function enviarMensaje(itemId: string, mensaje: string) {
  return pedir({
    ruta: `/api/tutoria/${itemId}/mensaje`,
    metodo: 'POST',
    cuerpo: { mensaje },
    esquema: estadoTutoria,
  });
}

export function marcarResuelta(itemId: string) {
  return pedir({
    ruta: `/api/tutoria/${itemId}/resuelto`,
    metodo: 'POST',
    cuerpo: {},
    esquema: estadoTutoria.partial(),
  });
}
