import { pedir } from '@/core/http/cliente';
import { errorDelDia, panel } from './esquemas';

export function leerPanel() {
  return pedir({ ruta: '/api/dashboard', esquema: panel });
}

/* Its own call rather than part of the dashboard: the card is the
   least important thing on the screen, and a failure here must not
   take the whole panel down with it. */
export function leerErrorDelDia() {
  return pedir({ ruta: '/api/error-del-dia', esquema: errorDelDia });
}
