import { pedir } from '@/core/http/cliente';
import { lote } from './esquemas';

/**
 * Top up the pool of questions on this device.
 *
 * `excluir` is what the phone already holds. Sending it means a
 * refresh downloads only what is missing, which on a line with 8.2 GB
 * a month is the difference between a feature and a cost.
 */
export function pedirLote(params: { total?: number; excluir?: readonly string[] }) {
  const busqueda = new URLSearchParams();
  if (params.total) busqueda.set('total', String(params.total));
  if (params.excluir?.length) busqueda.set('excluir', params.excluir.join(','));

  const cola = busqueda.toString();
  return pedir({
    ruta: `/api/items/lote-offline${cola ? `?${cola}` : ''}`,
    esquema: lote,
  });
}
