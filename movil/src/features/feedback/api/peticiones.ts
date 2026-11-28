import { pedir } from '@/core/http/cliente';
import { retroalimentacion } from './esquemas';

export function leerRetroalimentacion(sessionId: string) {
  return pedir({ ruta: `/api/feedback/${sessionId}`, esquema: retroalimentacion.nullable() });
}

/* Generating costs a model request and takes seconds, so it is a
   mutation: an action with a price, not a read to retry freely. */
export function generarRetroalimentacion(sessionId: string) {
  return pedir({
    ruta: '/api/feedback/generate',
    metodo: 'POST',
    cuerpo: { sessionId },
    esquema: retroalimentacion,
  });
}
