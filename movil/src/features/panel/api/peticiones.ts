import { pedir } from '@/core/http/cliente';
import { z } from 'zod';
import { desgloseXp, errorDelDia, logro, panel } from './esquemas';

export function leerPanel() {
  return pedir({ ruta: '/api/dashboard', esquema: panel });
}

/* Its own call rather than part of the dashboard: the card is the
   least important thing on the screen, and a failure here must not
   take the whole panel down with it. */
export function leerErrorDelDia() {
  return pedir({ ruta: '/api/error-del-dia', esquema: errorDelDia });
}

/* Also its own call. Achievements are encouragement, not the panel:
   a failure here should cost the section, not the screen. */
export function leerLogros() {
  return pedir({ ruta: '/api/achievements', esquema: z.array(logro) });
}

/* Its own call, like the card and the achievements: the breakdown is
   an explanation of a number the panel already showed, so its failure
   should cost the explanation and not the number. */
export function leerDesgloseXp() {
  return pedir({ ruta: '/api/xp-desglose', esquema: desgloseXp });
}
