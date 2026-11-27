import { pedir } from '@/core/http/cliente';
import { informeSemanal } from './esquemas';

/**
 * This week's report, which the server writes the first time it is
 * asked for.
 *
 * It answers `null` when there is not enough to write about — fewer
 * than two weak topics — and that is a normal state for a new
 * learner, not a failure. The screen says what is missing instead.
 */
export function leerInformeSemanal() {
  return pedir({
    ruta: '/api/informe-semanal',
    esquema: informeSemanal.nullable(),
  });
}
