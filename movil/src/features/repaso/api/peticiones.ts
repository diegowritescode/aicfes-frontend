import { pedir } from '@/core/http/cliente';
import { repaso } from './esquemas';
import type { Area } from '@/shared/model/icfes';

export function leerRepaso(params: { area?: Area } = {}) {
  const cola = params.area ? `?area=${params.area}` : '';
  return pedir({ ruta: `/api/repaso${cola}`, esquema: repaso });
}
